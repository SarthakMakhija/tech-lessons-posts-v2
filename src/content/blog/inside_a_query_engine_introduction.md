---
author: "Sarthak Makhija"
title: "Inside a Query Engine: Introduction"
pubDate: "2026-02-22"
heroImage: "/dissecting_the_query_engine-title.webp"
caption: "Image by ChatGPT"
tags: ["Query", "Parsing", "Rust", "Databases"]
draft: true
---

What actually happens when you write:

```sql
SELECT name FROM users WHERE age > 25;
```

How does that string transform into rows flowing through relational operators?

This series dissects that journey.

We will follow a query from raw text to tokens, from tokens to syntax trees, from syntax trees to relational operators, and finally to execution. Along the way, we will peel back the abstractions that make databases feel like magic.

To make this exploration concrete, we will use [Relop](https://github.com/SarthakMakhija/relop): a minimal, handwritten relational operator engine in Rust designed for learning and architectural transparency.

> While Relop simulates core database concepts like storage, catalog, and schema, it is strictly an **in-memory engine**. It provides the architectural "scaffolding" of a real database without the overhead of disk I/O, allowing us to focus entirely on the query processing logic.

### What is this series?

This series is not about using a database.

It is about understanding how a database transforms a __declarative language__ into a __procedural execution plan__.

:h[SQL tells the system what to compute. The query engine decides how to compute it.]

Instead of relying on industrial-grade libraries like `sqlparser-rs`, we will build core components by hand. The goal is not SQL completeness, but clarity. By focusing on a handwritten parser and a simplified execution engine, we can touch on the core algorithms and data structures that drive systems like Postgres, without getting lost in the thousands of lines of code required for production-grade SQL compliance.

### A Brief on Query Processing

Query processing is a multi-stage pipeline that transforms a declarative SQL string into a result set. In a full-fledged database system, this pipeline may include optimization and physical planning phases.

In this series and in Relop, we focus on the following structural stages:

1.  **Lexical Analysis:** Breaking the raw string into tokens (e.g., `SELECT`, `WHERE`).
2.  **Syntactic Analysis (Parsing):** Validating tokens against a grammar and building an Abstract Syntax Tree (AST).
3.  **Logical Planning:** Transforming the AST into a tree of relational operators (Scan, Filter, Join).
4.  **Execution (The Volcano Model):** Turning the plan into executable operators that pull rows from storage.

Conceptually, the flow looks like this:

```text
SQL String  ───▶  Tokens  ───▶  AST  ───▶  Logical Plan  ───▶  Executable  ───▶  Rows
 (Text)          (Lexer)      (Parser)     (Relational         Operators      (Result)
                                            Algebra)          (Executor)
```

### Typical Challenges in Query Processing

Building a robust query engine involves solving several non-trivial problems:

*   **Ambiguity and Precedence:** Without a formal grammar, a query like `WHERE age > 30 AND city = 'Berlin' OR salary > 5000` is ambiguous. Should the engine evaluate the `AND` first or the `OR`? A handwritten parser forces us to think explicitly about these rules.
*   **Recursive Structures:** Handling joins where a table source could be another joined table, or expressions where an operand could be another expression.
*   **Performance vs Generality:** A parser must be expressive enough to support the language we design, yet simple enough to remain understandable and efficient.
*   **Bridging the Gap:** A syntax tree represents intent. An execution engine produces results. Bridging that gap, turning declarative structure into procedural computation is the core intellectual leap in query processing.

### The Series Roadmap

Here is what is planned for the upcoming essays:

1.  [Lexical Analysis](/en/blog/inside_a_query_engine_lexical_analysis): From raw strings to a stream of tokens.
2.  [Thinking in Grammar](/en/blog/inside_a_query_engine_thinking_in_grammar): Designing the data structures that hold a query’s intent.
3.  [Handwritten Parser](/en/blog/inside_a_query_engine_handwritten_parser): Mapping the Grammar to Recursive Descent Code.
4.  [Expressions and Precedence](/en/blog/inside_a_query_engine_expressions_and_precedence): Solving the logic puzzle of `AND`, `OR`, and parentheses.
5.  [The Logical Plan](/en/blog/inside_a_query_engine_logical_plan): Converting the AST to a tree of relational operators.
6. [Execution](/en/blog/inside_a_query_engine_execution): Turning the Logical Plan into executable code.

Let's start with Part 1: [Lexical Analysis](/en/blog/inside_a_query_engine_lexical_analysis/).