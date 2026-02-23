---
author: "Sarthak Makhija"
title: "Dissecting the Query Engine: From Parsing to Execution - Handling Expressions and Precedence"
pubDate: "2026-02-26"
tags: ["Query", "Expressions", "Precedence", "Parsing", "AST"]
---

In the previous parts of this series, we built a [Handwritten Parser](/en/blog/dissecting_the_query_engine_handwritten_parser/) capable of understanding basic `SELECT` statements. But real-world queries are rarely that simple. Users want to filter data using complex logic: `WHERE (age > 25 OR salary > 50000) AND status = 'active'`.

Supporting this requires us to tackle the most challenging part of parsing: **Expressions, Precedence, and Parentheses**.

### Why AND and OR are Complicated

At first glance, adding `AND` and `OR` seems like just adding more keywords. However, they introduce the problem of **precedence**. Just like in math, where `2 + 3 * 4` is `14` (not `20`), in SQL, `AND` usually has higher precedence than `OR`.

If we don't encode this precedence into our grammar, the parser won't know whether `A OR B AND C` means `(A OR B) AND C` or `A OR (B AND C)`.

### The Building Blocks: A Simple Starting Point

Before we dive into expressions, let's look at the basic grammar we've established for a query. This is our foundation:

```ebnf
query
    = statement EOF ;

statement
    = show_tables
    | describe_table
    | select;

show_tables
    = "SHOW" "TABLES" [";"] ;

describe_table
    = "DESCRIBE" "TABLE" identifier [";"] ;

select
    = "SELECT" projection "FROM" identifier [where] [";"] ;

projection
    = "*"
    | identifier ("," identifier)*

where
    = "WHERE" clause

clause
    = identifier operator literal

operator
    = "=" | ">" | "<" | ">=" | "<=" | "!="

identifier
    = IDENTIFIER ;

literal
    = LITERAL ;
```

In this version, the `WHERE` clause is extremely limited. It only supports a single comparison (e.g., `id = 1`).
The code for parser corresponding to the above grammar is [here](https://github.com/SarthakMakhija/relop/commit/57c1b6424d8cdc32c61bc7b41d53d1fb8fd272dc).

### Step 1: Adding AND

Let's expand the `WHERE` clause to support multiple conditions joined by `AND`. Surprisingly, the grammar remains relatively simple and linear:

```ebnf
where
    = "WHERE" clause ("AND" clause)*

clause
    = identifier operator literal

operator
    = "=" | ">" | "<" | ">=" | "<=" | "!=" | "LIKE"
```

Here, `WHERE` starts with one `clause`, followed by any number (zero or more) of `"AND" clause` pairs. This works well for a flat list of conditions, but it doesn't allow for grouping or alternative logic.

#### Overview of the code

At this stage, the parser handles `AND` logic using a simple "collect" loop. It first expects a single condition and then iteratively look for more `AND <condition>` pairs.

```rust
fn maybe_where_clause(&mut self) -> Result<Option<WhereClause>, ParseError> {
    let is_where_clause = self.eat_if(|token| token.is_keyword("where"));
    if is_where_clause {
        let conditions = self.expect_conditions()?;
        return if conditions.len() == 1 {
            Ok(Some(WhereClause::Single(
                conditions.into_iter().next().unwrap(),
            )))
        } else {
            Ok(Some(WhereClause::And(conditions)))
        };
    }
    Ok(None)
}

fn expect_conditions(&mut self) -> Result<Vec<Condition>, ParseError> {
    let condition = self.expect_condition()?;
    let mut conditions = Vec::new();
    conditions.push(condition);

    while self.eat_if(|token| token.matches(TokenType::Keyword, "and")) {
        let condition = self.expect_condition()?;
        conditions.push(condition);
    }
    Ok(conditions)
}

fn expect_condition(&mut self) -> Result<Condition, ParseError> {
    let column_name = self.expect_identifier()?;
    let operator = self.expect_operator()?;
    let literal = self.expect_literal()?;

    match operator {
        BinaryOperator::Like => Ok(Condition::like(&column_name, literal)),
        _ => Ok(Condition::comparison(&column_name, operator, literal)),
    }
}
```

In our Rust AST, we might model this using a specialized enum:

```rust
pub(crate) enum WhereClause {
    Single(Condition),
    And(Vec<Condition>),
}

#[derive(Debug, Eq, PartialEq)]
pub(crate) enum Condition {
    Comparison {
        column_name: String,
        operator: BinaryOperator,
        literal: Literal,
    },
    Like {
        column_name: String,
        literal: Literal,
    },
}
```

### Step 2: Introducing OR and Precedence

When we add `OR`, things get interesting. If we were to naively define `WHERE` as:

```ebnf
(* BAD GRAMMAR *)
where = clause (("AND" | "OR") clause)*
```

We've created an **ambiguous** grammar. This grammar doesn't tell the parser which operation to perform first. In a recursive descent parser, we solve this by **tiering** our rules.

#### How to Think About Precedence

The rule is simple: **The rule with lower precedence calls the rule with higher precedence.**

1.  **Expression (OR)**: The entry point for logic. It handles `OR` operations.
2.  **And Expression**: Handles `AND` operations.
3.  **Clause**: The actual comparison (`id = 1`).

Here is the grammar that correctly encodes that `AND > OR`:

```ebnf
where
    = "WHERE" expression ;

(* Encodes precedence (AND > OR) *)
expression
    = or_expression ;

or_expression
    = and_expression ("OR" and_expression)* ;

and_expression
    = clause ("AND" clause)* ;

clause
    = identifier operator literal
```

By structuring it this way, the parser is forced to "group" `AND` operations together before it even considers an `OR`. This naturally produces an AST that respects the correct order of operations.

#### Walkthrough: The Precedence Ladder

How does this grammar handle `name = 'relop' OR language = 'rust' AND type = 'query-parsing'`? Instead of a flat list, let's look at how the recursion "scoops up" tokens based on the precedence rules:

```text
QUERY: name = 'relop' OR language = 'rust' AND type = 'query-parsing'

1. expect_or_expression (ENTRY POINT)
   └── calls expect_and_expression (Left Side)
       └── matches "name = 'relop'" 
       └── does not see "AND", goes up
   
2. expect_or_expression sees the "OR" keyword
   └── calls expect_and_expression (Right Side)
       ├── matches "language = 'rust'"
       ├── sees "AND" keyword (HIGHER PRECEDENCE!)
       └── matches "type = 'query-parsing'"
       └── Result: AND_NODE(lang='rust', type='parsing')

3. expect_or_expression combines them:
   └── FINAL AST: OR_NODE(
                    SINGLE(name='relop'), 
                    AND_NODE(lang='rust', type='parsing')
                  )
```

The hierarchy forces the `AND` to finish its work (grouping the neighbor on the right) before the `OR` even gets a chance to see the tokens. This is how the parser "knows" to bind `AND` more tightly.

### Deriving the Recursive AST

How do we model this hierarchy in our AST? Let's try to derive the structure by thinking through a complex query: `name = 'relop' AND language = 'rust' OR status = 'active'`

#### Step 1: The AND Component
First, we group the high-precedence `AND` conditions. This looks like a single logical unit:

```text
AND (
    name = 'relop',
    language = 'rust'
)
```

#### Step 2: The OR Component
Next, we think about the `OR` operation. It joins our previous `AND` group with another condition:

```text
OR (
    [The AND group from above],
    status = 'active'
)
```

#### Step 3: The Substitution
When we substitute the `AND` group back into the `OR` group, we see the true structure:

```text
OR (
    AND (
        name = 'relop',
        language = 'rust'
    ),
    status = 'active'
)
```

#### The Breakthrough: Why Recursion?

This substitution shows us that an `OR` node must be able to hold an `AND` node. But if we introduce parentheses, like `(A OR B) AND C`, then an `AND` node would need to hold an `OR` node!

This "circular" requirement—where `AND` can contain `OR`, and `OR` can contain `AND`, tells us that we cannot use fixed types like `Vec<Condition>`. Both must instead hold a unified, **Recursive Expression**:

```rust
#[derive(Debug, Eq, PartialEq)]
pub(crate) struct WhereClause(pub(crate) Expression);

pub(crate) enum Expression {
    /// A base comparison (e.g., id = 1)
    Single(Clause),
    /// A group of expressions joined by AND
    And(Vec<Expression>),
    /// A group of expressions joined by OR
    Or(Vec<Expression>),
}
```

This recursive structure is infinitely flexible. An `And` node can now hold a `Single(A)` and an `Or` node, which in turn holds `Single(B)` and `Single(C)`.

### Step 3: Adding Parentheses

Precedence rules provide a "default" behavior, but users need a way to override them. They need parentheses. Let's try to derive how to support `(language = 'rust' OR language = 'go') AND status = 'active'` step-by-step:

#### The Challenge: The Unit Mismatch

Our current `and_expression` expects to join simple **clauses**: `and_expression = clause ("AND" clause)*`

But in `(A OR B) AND C`, the left side of the `AND` is not a clause, it is an entire **expression** nested inside brackets.

#### A Failed Attempt: The Naive Fix

What if we just allowed optional brackets around a clause?

```ebnf
(* WRONG *)
and_expression = (clause | "(" clause ")") ("AND" (clause | "(" clause ")"))*
```
This fails immediately. It only allows us to wrap a *single* comparison (like `(id=1)`). It wouldn't allow `(A OR B)` because an `OR` operation is not a `clause`.

#### The Breakthrough: Defining a "Primary" Unit

We need a unit that can stand on its own as the base of an `AND` operation. This unit must be flexible enough to be "either a simple comparison OR a portal back to the start."

We call this the **Primary Expression**:

1.  **If it's a simple comparison**, match a `clause`.
2.  **If it starts with `(`**, match a full `expression` and then expect a `)`.

This leads us to the final, tiered grammar:

```ebnf
expression
    = or_expression ;

or_expression
    = and_expression ("OR" and_expression)* ;

and_expression
    = primary_expression ("AND" primary_expression)* ;

primary_expression
    = clause
    | "(" expression ")" ;
```

#### The Recursive Magic

Notice the **recursive loop**: `expression` -> `or_expression` -> `and_expression` -> `primary_expression` -> `expression`. 

When the parser is deep inside the precedence ladder and sees a `(`, it uses `primary_expression` to "reset" the logic. It jumps back to the very top, evaluates the grouped expression, and then returns to where it left off.

### From Grammar to Code: The Implementation

In [Relop](https://github.com/SarthakMakhija/relop), the implementation of this recursive logic is surprisingly clean. Here is a deconstructed look at how the parser handles expressions:

```rust
impl Parser {
    fn expect_expression(&mut self) -> Result<Expression, ParseError> {
        self.expect_or_expression()
    }

    fn expect_or_expression(&mut self) -> Result<Expression, ParseError> {
        let expr = self.expect_and_expression()?;
        let mut expressions = vec![expr];

        while self.eat_if(|token| token.is_keyword("or")) {
            expressions.push(self.expect_and_expression()?);
        }

        if expressions.len() > 1 {
            Ok(Expression::or(expressions))
        } else {
            Ok(expressions.into_iter().next().unwrap())
        }
    }

    fn expect_and_expression(&mut self) -> Result<Expression, ParseError> {
        let expr = self.expect_primary_expression()?;
        let mut expressions = vec![expr];

        while self.eat_if(|token| token.is_keyword("and")) {
            expressions.push(self.expect_primary_expression()?);
        }

        if expressions.len() > 1 {
            Ok(Expression::and(expressions))
        } else {
            Ok(expressions.into_iter().next().unwrap())
        }
    }

    fn expect_primary_expression(&mut self) -> Result<Expression, ParseError> {
        if self.eat_if(|token| token.is_left_parentheses()) {
            let expr = self.expect_expression()?; // [!code word:expect_expression()]
            self.expect_right_parentheses()?;
            Ok(Expression::grouped(expr))
        } else {
            Ok(Expression::single(self.expect_clause()?))
        }
    }
}
```

The updated AST for `SELECT` is:

```rust
#[derive(Debug)]
pub(crate) enum Ast {
    /// Represents a `SELECT` statement.
    Select {
        /// The source to select from (table or join).
        source: TableSource,
        /// The projection (columns or all) to select.
        projection: Projection,
        /// The WHERE filter criteria.
        where_clause: Option<WhereClause>,
        /// The ORDER BY clause, defining the columns and directions used to order rows.
        order_by: Option<Vec<OrderingKey>>,
        /// The LIMIT (max records) to return.
        limit: Option<usize>,
    },
}

#[derive(Debug, Eq, PartialEq)]
pub(crate) enum TableSource {
    Table {
        name: String,
        alias: Option<String>,
    },
    ...
}

/// `WhereClause` represents the filtering criteria in a SELECT statement.
#[derive(Debug, Eq, PartialEq)]
pub(crate) struct WhereClause(pub(crate) Expression);

#[derive(Debug, Eq, PartialEq)]
pub(crate) enum Expression {
    Single(Clause),
    And(Vec<Expression>),
    Or(Vec<Expression>),
    Grouped(Box<Expression>),
}
```

### How to Think About This Code

Let's break down the transformation from grammar to code step-by-step:

1.  **Direct Mapping**: Notice how each grammar rule (`expression`, `or_expression`, `and_expression`, `primary_expression`) has a direct 1-to-1 equivalent in Rust functions. 
2.  **The Call Hierarchy**: `expect_or_expression` starts by calling `expect_and_expression`. This is the core of **implicit precedence**. The parser *must* satisfy a potential `AND` branch before it even considers an `OR`.
3.  **The Collection Loop**: Both `AND` and `OR` methods use a `while` loop to collect multiple operands. 
    *   It starts with one expression.
    *   It looks for the operator keyword.
    *   If found, it calls the *next highest tier* rule and adds the result to the list.
4.  **Tree Simplification**: The `if expressions.len() > 1` check is a crucial optimization. If only one operand is found (e.g., `id=1`), we return it directly rather than wrapping it in a redundant `Expression::And`, `Expression::Or` node.
5.  **The Recursive Reset**: The `expect_primary_expression` method contains the "magic." When it sees a `(`, it calls `expect_expression` (the top of the ladder). This recursion allows the entire precedence structure to be re-evaluated inside the parentheses.

### Conclusion

Handling expressions is a rite of passage for every parser developer. By encoding precedence directly into the grammar rules and leveraging recursion, we can transform complex nested strings into a perfectly structured tree.

With expressions handled, our parser is now powerful enough to represent almost any logical query. In the next part, we will move beyond syntax and explore the **Logical Plan**: how the engine transforms this Abstract Syntax Tree into a series of relational operations that can actually be executed.
