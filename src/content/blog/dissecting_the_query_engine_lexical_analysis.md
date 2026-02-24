---
author: "Sarthak Makhija"
title: "Dissecting the Query Engine: From Parsing to Execution - Lexical Analysis"
pubDate: "2026-02-23"
weight: 4
tags: ["Query", "Lexer", "Rust", "Databases"]
---

Welcome to the second part of our series on dissecting a query engine. In the [introduction](/en/blog/dissecting_the_query_engine_introduction), we traced the journey of a query from a raw string to an executable pipeline. Today, we focus on the very first stage of that journey: **Lexical Analysis**.

### Introduction

Before we can understand the *meaning* of a query, we must first identify its individual components. This is the job of the **Lexer** (also known as a tokenizer). 

To reason clearly about lexical analysis, we need three foundational terms:

1.  **Lexeme**: A sequence of characters in the source code that matches a pattern for a token. For example, the characters `S`, `E`, `L`, `E`, `C`, `T` form a lexeme.
2.  **Token**: Typically a pair of:
    - A Token Type
    - An optional Attribute Value (the lexeme itself)
    For instance, the lexeme `SELECT` becomes a token of type `Keyword`.
3.  **Lexer**: The component that scans the input character by character and groups them into lexemes to produce a stream of tokens.

<img src = "/dissecting_the_query_engine_lex_tokens.png">

### Grammar and the Lexer

A common mistake when starting out is to jump straight into coding the lexer. However, a lexer cannot exist in a vacuum; it is driven by the **Grammar** of the language.

The grammar defines the **building blocks** of your language. For a simple query like `SELECT * FROM table;`, our EBNF grammar might look like this:

```ebnf
select_statement = "SELECT" projection "FROM" identifier ";" ;
projection       = "*" | identifier ;
identifier       = [a-zA-Z_][a-zA-Z0-9_]* ;
```

This grammar implicitly dictates the tokens our lexer must recognize:
*   **Keywords**: `SELECT`, `FROM`
*   **Symbols**: `*`, `;`
*   **Dynamic Identifiers**: Any string matching the `identifier` pattern.

It is important to emphasize that **having a grammar does not mean the lexer understands it.** The grammar provides the definitions for the lexemes the lexer should care about, but the lexer itself is blind to the rules of sequence or hierarchy. It only knows how to slice a stream of characters into recognizable tokens.

### Lexer Design Patterns

There are several common approaches to implementing a lexer:

1.  **The State Machine**: This approach models the lexer as a finite automaton that changes its internal state based on the characters it reads. Transitions are powerful because they allow the lexer to handle **context**:
    - **String Literals**: Encountering a `"` moves the lexer into a "string" state where whitespace is preserved until the closing `"` is found.
    - **Compound Operators**: Seeing `!` might move it to a "potential inequality" state to check if the *next* character is `=`, helping it distinguish between `!=` and `!`.
    - **Comments**: Seeing `/` could move it to a "comment" state to safely ignore characters until a newline.
2.  **Regular Expression Matching**: Using a series of regular expressions to "chunk" the input. While simpler to write, this can be harder to debug for complex languages.
3.  **Peek and Advance (The Relop Way)**: It is effectively a small, hand-rolled state machine where the lexer looks at the current character (`peek`), decides which token type it *might* be, and then enters a specific loop to `advance` and consume the rest of that lexeme. This balance of simplicity and control is perfect for pedagogical projects.

### The Core Loop of a Lexer

For many handwritten lexers, the fundamental logic involves scanning the input string character by character. The lexer maintains a "position" pointer and moves forward, grouping characters until it finds a boundary (like whitespace or a symbol) that marks the end of a lexeme.

Some lexemes are single characters, like `;` or `*`. Others are **multi-character lexemes**, like `SELECT`, `WHERE`, or a table name like `employee_records`. The lexer needs enough logic to "look ahead" or continue consuming characters as long as they satisfy the pattern for the current token type (e.g., continuing to consume alphanumeric characters as long as it's part of an identifier).

### Code

In the early stages of [Relop](https://github.com/SarthakMakhija/relop), the lexer was kept intentionally simple to establish the pipeline. Let's look at the implementation from commit [8ee528434e](https://github.com/SarthakMakhija/relop/commit/8ee528434e).

```rust
pub(crate) struct Lexer {
    input: Vec<char>,
    position: usize,
    keywords: HashSet<String>,
}

impl Lexer {
    pub(crate) fn new(source: &str) -> Self {
        Self::new_with_keywords(source, &["show", "tables", "describe", "table"])
    }

    pub(crate) fn new_with_keywords(source: &str, keywords: &[&str]) -> Self {
        Self {
            input: source.chars().collect(),
            position: 0,
            keywords: keywords.iter().map(|keyword| keyword.to_string()).collect(),
        }
    }

    pub(crate) fn lex(&mut self) -> Result<TokenStream, LexError> {
        let mut stream = TokenStream::new();
        loop {
            let char = match self.peek() {
                Some(ch) => ch,
                None => break,
            };
            match char {
                ch if ch.is_whitespace() => self.eat(),
                ch if Self::looks_like_an_identifier(ch) => {
                    stream.add(self.identifier_or_keyword());
                }
                ch if ch == ';' => {
                    stream.add(Token::semicolon());
                    self.eat();
                }
                _ => {
                    return Err(LexError::UnexpectedCharacter(char));
                }
            }
        }
        stream.add(Token::end_of_stream());
        Ok(stream)
    }

    fn eat(&mut self) {
        let _ = self.advance();
    }

    fn advance(&mut self) -> Option<char> {
        let char = self.peek();
        if char.is_some() {
            self.position += 1;
        }
        char
    }

    fn peek(&self) -> Option<char> {
        self.input.get(self.position).copied()
    }

    fn identifier_or_keyword(&mut self) -> Token {
        let mut lexeme = String::new();
        loop {
            if let Some(ch) = self.peek() {
                if Self::looks_like_an_identifier(ch) {
                    let _ = self.advance();
                    lexeme.push(ch);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        let is_keyword = self.keywords.contains(&lexeme.to_lowercase());

        if is_keyword {
            Token::new(lexeme, TokenType::Keyword)
        } else {
            Token::new(lexeme, TokenType::Identifier)
        }
    }

    fn looks_like_an_identifier(ch: char) -> bool {
        ch.is_ascii_alphanumeric() || ch == '_'
    }
}
```

This implementation highlights a few fundamental lexing patterns:
*   **State Management**: It tracks the current `position` in a `Vec<char>`.
*   **Peek and Advance**: It uses a "peek" to see the next character without consuming it, allowing the `lex` loop to decide which rule to apply.
*   **Greedy Matching**: The `identifier_or_keyword` method keeps consuming as many "identifier-like" characters as possible before checking if the resulting lexeme is a reserved keyword.

### What a Lexer Does Not Know
 
It is equally important to understand the boundaries of a lexer. A lexer is deliberately unaware of the rules of the language beyond character grouping.

While the grammar told us *what* lexemes to look for, the lexer has no concept of the *structure* defined by that grammar.

*   **Syntax Ignorance**: A lexer will happily produce a token stream for `; SELECT FROM WHERE`. It doesn't know that `FROM` should come after `SELECT`. It only cares that each individual word matches a defined pattern.
*   **No Validation**: It doesn't know if a table exists or if a column name is valid. It converts strings to tokens, not truth.
*   **Semantic blindness**: It cannot catch errors like "comparing a string to an integer."

Think of the lexer as a component that can recognize individual words but doesn't understand the rules of a sentence. It identifies the words; the **Parser** is responsible for making sense of them.

### Conclusion

Lexical analysis is about creating order from a chaotic string of characters. By transforming raw input into a structured stream of tokens, we provide the clean interface required for the next stage of query processing.

In the next part, we will move from words to sentences and talk about [Thinking in Grammar](/en/blog/dissecting_the_query_engine_thinking_in_grammar/) and the design of the Abstract Syntax Tree.
