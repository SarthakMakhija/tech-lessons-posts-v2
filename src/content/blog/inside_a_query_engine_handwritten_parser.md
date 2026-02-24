---
author: "Sarthak Makhija"
title: "Inside a Query Engine (Part 3): Handwritten Parser"
pubDate: "2026-02-23"
weight: 2
tags: ["Query", "Parser", "Rust", "Recursive Descent"]
---

In the [previous essay](/en/blog/inside_a_query_engine_thinking_in_grammar/), we designed our language using EBNF and defined the structure of our Abstract Syntax Tree (AST). Now, it’s time to breathe life into those rules. In this part, we will build a **Handwritten Recursive Descent Parser** in Rust to transform a stream of tokens into an AST.

The outcome of the parsing phase is the **AST** (Abstract Syntax Tree), a tree representation of the query that the engine can actually work with. Within the parser’s domain, we speak in the vocabulary of language structure: statements, clauses, projections, and table sources.

### The Parser’s Boundary: Syntax vs. Semantics

One of the most important design principles in query engines is knowing what the parser **should not** know.

A parser is a **syntactic** validator, not a **semantic** one. It knows *how* a query should look, but it has no idea if the query is actually executable in the real world. Specifically, a parser does not know:
*   **Catalog Information**: It doesn't know if a table named `employees` actually exists.
*   **Schema Validation**: It doesn't know if a column exists or if you are trying to compare an integer to a string.
*   **Permissions**: It doesn't know if you have the right to access that data.

These checks belong to a later stage called **Semantic Analysis** or **Binding**. Keeping the parser purely syntactic makes it fast, reusable, and easy to test.

### Parser Errors: When Syntax Fails

When a query doesn't follow the grammar, the parser must fail gracefully with a descriptive error. In [Relop](https://github.com/SarthakMakhija/relop), we model these using a robust [ParseError](https://github.com/SarthakMakhija/relop/blob/main/src/query/parser/error.rs) enum:

```rust
#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    /// Encountered an unsupported token when starting a statement (e.g., "UPDATE")
    UnsupportedToken { expected: String, found: String },
    
    /// Encountered a token that doesn't match the expected rule (e.g., "SELECT 1" instead of "SELECT *")
    UnexpectedToken { expected: String, found: String },
    
    /// The input string ended while the parser was still expecting more tokens
    UnexpectedEndOfInput,

    /// Specialized errors for specific literal logic
    LimitOutOfRange(String),
    ZeroLimit,
    
    /// Indicates that no tokens were available to parse.
    NoTokens,
}
```

For example, if a user types `SELECT *`, the parser will produce an `UnexpectedEndOfInput` error because it was expecting `FROM` after the projection, according to the grammar.

### Mapping Grammar to Code

The beauty of a **Recursive Descent Parser** is that it mirrors the grammar almost one-to-one. This one-to-one mapping is the defining characteristic of recursive descent.

Consider our simplified grammar and its translation, [dbe8c3e2a9411d217f4f25da629b0fc5e5e0da4d](https://github.com/SarthakMakhija/relop/commit/dbe8c3e2a9411d217f4f25da629b0fc5e5e0da4d):

```ebnf
select = "SELECT" "*" "FROM" identifier [";"] ;
```

Our implementation uses a `TokenCursor` to navigate the stream of tokens and helper methods like `expect_keyword` and `maybe_semicolon` to handle the logic of building AST:

```rust
impl Parser {
    fn parse_select(&mut self) -> Result<Ast, ParseError> {
        self.expect_keyword("select")?;
        self.expect_star()?;
        self.expect_keyword("from")?;
        let table_name = self.expect_identifier()?;
        self.maybe_semicolon();

        Ok(Ast::Select { table_name })
    }

    fn expect_keyword(&mut self, keyword: &str) -> Result<(), ParseError> {
        match self.cursor.next() {
            Some(token) if token.matches(TokenType::Keyword, keyword) => Ok(()),
            Some(token) => Err(ParseError::UnexpectedToken {
                expected: keyword.to_string(),
                found: token.lexeme().to_string(),
            }),
            None => Err(ParseError::UnexpectedEndOfInput),
        }
    }

    fn expect_star(&mut self) -> Result<(), ParseError> {
        match self.cursor.next() {
            Some(token) if token.is_star() => Ok(()),
            Some(token) => Err(ParseError::UnexpectedToken {
                expected: "*".to_string(),
                found: token.lexeme().to_string(),
            }),
            None => Err(ParseError::UnexpectedEndOfInput),
        }
    }

    fn expect_identifier(&mut self) -> Result<String, ParseError> {
        match self.cursor.next() {
            Some(token) if token.is_identifier() => Ok(token.lexeme().to_string()),
            Some(token) => Err(ParseError::UnexpectedToken {
                expected: "identifier".to_string(),
                found: token.lexeme().to_string(),
            }),
            None => Err(ParseError::UnexpectedEndOfInput),
        }
    }

    fn maybe_semicolon(&mut self) {
        if let Some(token) = self.cursor.peek() {
            if token.is_semicolon() {
                self.cursor.next();
            }
        }
    }
}
```

#### The Engine Under the Hood: The TokenCursor

For the parser to navigate the stream of tokens, it needs an internal "engine." In Relop, this is the `TokenCursor`. It maintains the state of our progress through the token list.

```rust
pub(crate) struct TokenCursor {
    stream: TokenStream,
    index: usize,
}

pub(crate) struct TokenStream {
    tokens: Vec<Token>,
}

pub(crate) struct Token {
    lexeme: String,
    token_type: TokenType,
}
```

The cursor provides two fundamental primitives that drive the entire parsing process:

1.  **Lookahead with `peek()`**: This allows the parser to see the current token without consuming it. This is how we decide which "branch" of the grammar to follow. By looking at the first token, we can distinguish between a `SELECT`, a `SHOW`, or a `DESCRIBE` statement.
2.  **Consumption with `next()`**: Once the parser validates that a token satisfies a rule, it calls `next()` to advance the pointer. This represents "making progress" in the query.

#### Handling Optionality: Maybe vs. Expect

Handwritten parsers excel at handling the nuances of optional grammar. We use two distinct patterns:

*   **The "Expect" Pattern**: Used for required tokens (like `SELECT` or `FROM`). If the token isn't there, the parser stops and returns an error immediately.
*   **The "Maybe" Pattern**: Used for optional components like the semicolon ([`;`]). The parser checks if the token exists; if it does, it consumes it; if not, it simply moves on without complaining.

```rust
fn maybe_semicolon(&mut self) {
    if let Some(token) = self.cursor.peek() {
        if token.is_semicolon() {
            self.cursor.next(); // Consume it if it's there
        }
    }
    // Just return if it's not
}
```

#### Deconstructing `parse_select`

The `parse_select` method is a perfect example of how the parser enforces a strict sequence:

1.  **Keyword Check**: It first ensures the query starts with `SELECT`.
2.  **Projection**: It then calls a specialized `expect_star()` method to find the `*`.
3.  **Source Identification**: It expects the `FROM` keyword, then extracts the table name using `expect_identifier()`.
4.  **Optional Cleanup**: Finally, it calls `maybe_semicolon()` to handle the trailing symbol if present.

By stripping away the "sugar," we create a clean model that focuses entirely on the **intent** of the user.

### The Sentinel: Why EOF Matters

You might have noticed the call to `self.expect_end_of_stream()` in the main `parse` method. This checks for the **EOF (End of Stream)** token.

In query parsing, the EOF token is the "sentinel" that ensures the **entire** input was consumed. Without enforcing EOF, the parser may successfully match only a prefix of the input, silently ignoring trailing tokens. Eg; a query like `SELECT * FROM table garbage_at_the_end` would be considered valid by the parser because it would stop successfully after parsing the table name, leaving the "garbage" unexamined.

The EOF token ensures that we haven't just matched a *prefix* of the user's input, but that the *whole* string satisfies our grammar.

The complete `Parser` is available [here](https://github.com/SarthakMakhija/relop/blob/main/src/query/parser/mod.rs#L18).

### Conclusion

A handwritten parser provides precise control over error handling, structure, and performance. By mapping our EBNF rules to simple, predictable Rust methods, we've transformed the stream of tokens into a structured syntactic model (the AST) that our engine can understand.

In the next part, we'll tackle the most challenging part of parsing: [Expressions and Precedence](/en/blog/inside_a_query_engine_expressions_and_precedence).

### References

- [Crafting Interpreters](https://craftinginterpreters.com/contents.html)
  - Chapters 4,5,6