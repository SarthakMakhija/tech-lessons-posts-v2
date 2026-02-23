---
author: "Sarthak Makhija"
title: "Dissecting the Query Engine: From Parsing to Execution - Introduction"
pubDate: "2026-02-22"
tags: ["Query", "Parsing", "Rust", "Databases"]
---

Welcome to a series dedicated to dissecting the internals of query processing. Over the next few essays, we will follow the journey of a query, from a raw string to an executable pipeline of relational operators. We will use [Relop](https://github.com/SarthakMakhija/relop) as our foundational codebase: a minimal, handwritten relational operator engine in Rust optimized for learning and architectural transparency.

### What is this series?

This series isn't about using a database; it’s about *how* a database transforms a declarative language (SQL-ish) into an executable plan. We will avoid the "magic" of complex, industrial-grade libraries like `sqlparser-rs` and instead look at how to build these components from scratch.

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

### Typical Challenges in Query Processing

Building a robust query engine involves solving several non-trivial problems:

*   **Ambiguity and Precedence:** Without a formal grammar, a query like `WHERE age > 30 AND city = 'Berlin' OR salary > 5000` is ambiguous. Should the engine evaluate the `AND` first or the `OR`? Solving this requires encoding operator precedence (e.g., `AND` binds tighter than `OR`) directly into the recursive rules of our grammar.
*   **Recursive Structures:** Handling joins where a table source could be another joined table, or expressions where an operand could be another expression.
*   **Performance vs Generality:** Designing a parser that is fast enough for high-frequency queries but flexible enough to support complex language features.
*   **Bridging the Gap:** Moving from a "syntactic" world (strings and trees) to a "physical" world (bytes and iterators).

### The Series Roadmap

Here is what is planned for the upcoming essays:

1.  [Lexical Analysis](/en/blog/dissecting_the_query_engine_lexical_analysis): From raw strings to a stream of tokens.
2.  **Thinking in Grammar:** Designing the data structures that hold a query’s intent.
3.  **Handwritten Parser:** Mapping the Grammar to Recursive Descent Code.
4.  **Expressions and Precedence:** Solving the logic puzzle of `AND`, `OR`, and parentheses.
5.  **From Syntax to Plan:** Crossing the bridge into execution.

Let's start with Part 1: The Anatomy of a Lexer.
