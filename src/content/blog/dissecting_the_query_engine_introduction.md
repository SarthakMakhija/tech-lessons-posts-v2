---
author: "Sarthak Makhija"
title: "Dissecting the Query Engine: From Parsing to Execution - Introduction"
pubDate: "2026-02-22"
tags: ["Query", "Parsing", "Rust", "Databases"]
---

What actually happens when you write:

```sql
SELECT name FROM users WHERE age > 25;
```

How does that string transform into rows flowing through relational operators?

This series dissects that journey.

We will follow a query from raw text to tokens, from tokens to syntax trees, from syntax trees to relational operators, and finally to execution. Along the way, we will peel back the abstractions that make databases feel like magic.

To make this exploration concrete, we will use [Relop](https://github.com/SarthakMakhija/relop): a minimal, handwritten relational operator engine in Rust designed for learning and architectural transparency

### What is this series?

This series is not about using a database.

It is about understanding how a database transforms a __declarative language__ into a __procedural execution plan__.

SQL tells the system what to compute.
The query engine decides how to compute it.

Instead of relying on industrial-grade libraries like `sqlparser-rs`, we will build core components by hand. The goal is not SQL completeness, but clarity. By stripping away production-level complexity, we can focus on the essential algorithms and data structures that power real systems like Postgres—without getting lost in tens of thousands of lines of code.

By focusing on a handwritten parser and a simplified execution engine, we can touch on the core algorithms and data structures that drive systems like Postgres, without getting lost in the thousands of lines of code required for production-grade SQL compliance.

### A Brief on Query Processing

Query processing is the multi-stage pipeline that takes a query and produces a result set. It typically follows these steps:

1.  **Lexical Analysis:** Breaking the raw string into tokens (e.g., `SELECT`, `*`, `employees`).
2.  **Syntactic Analysis (Parsing):** Validating the tokens against a grammar and building an Abstract Syntax Tree (AST).
3.  **Semantic Analysis:** Ensuring the query makes sense (do the tables exist? are the column types compatible?).
4.  **Logical Planning:** Transforming the AST into a tree of relational operators (Scale, Filter, Join).
5.  **Optimization:** Reordering operators to make the query run faster (e.g., pushing filters down).
6.  **Physical Planning & Execution:** Turning the logical plan into executable code that iterates over rows.

> This series focuses on the journey from Lexical Analysis to the generation of a Logical Plan and execution of the same. Topics like cost-based optimization and physical plan generation are outside our current scope.

Conceptually, the flow that this series covers looks like this:

```json
SQL String
    ↓
Tokens
    ↓
AST
    ↓
Logical Plan (Relational Algebra Tree)
    ↓
Executable Operators
    ↓
Rows
```

### Typical Challenges in Query Processing

Building a robust query engine involves solving several non-trivial problems:

*   **Ambiguity and Precedence:** Without a formal grammar, a query like `WHERE age > 30 AND city = 'Berlin' OR salary > 5000` is ambiguous. Should the engine evaluate the `AND` first or the `OR`? A handwritten parser forces us to think explicitly about these rules.
*   **Recursive Structures:** Handling joins where a table source could be another joined table, or expressions where an operand could be another expression.
*   **Performance vs Generality:** A parser must be expressive enough to support the language we design, yet simple enough to remain understandable and efficient.
*   **Bridging the Gap:** A syntax tree represents intent. An execution engine produces results. Bridging that gap, turning declarative structure into procedural computation is the core intellectual leap in query processing.

### The Series Roadmap

Here is what is planned for the upcoming essays:

1.  [Lexical Analysis](/en/blog/dissecting_the_query_engine_lexical_analysis): From raw strings to a stream of tokens.
2.  **Thinking in Grammar:** Designing the data structures that hold a query’s intent.
3.  **Handwritten Parser:** Mapping the Grammar to Recursive Descent Code.
4.  **Expressions and Precedence:** Solving the logic puzzle of `AND`, `OR`, and parentheses.
5.  **From Syntax to Plan:** Crossing the bridge into execution.

Let's start with Part 1: [Lexical Analysis](/en/blog/dissecting_the_query_engine_lexical_analysis/).
