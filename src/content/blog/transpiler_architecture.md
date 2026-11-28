---
author: "Sarthak Makhija"
title: "Inside a Transpiler (Part 1): Transpiler Architecture"
description: "A tour of the 7-stage compilation pipeline that converts 14,000+ files of legacy UniBasic into structured, compilable Java 21."
pubDate: 2026-11-23
weight: 1
tags: ["Compilers", "Transpiler", "Architecture", "Java", "Clean Code"]
draft: false
caption: "Inside a Transpiler (Part 1): Transpiler Architecture"
---

In the [introduction to this series](/en/blog/inside_a_transpiler_introduction/), we introduced our modernization challenge: migrating an enterprise mission-critical codebase spanning **more than 14,000 legacy UniBasic programs** to **Java 21**.

When developers first approach legacy modernization, it is tempting to view a transpiler as an elaborate text-substitution engine. You might imagine reading a line of source code, matching keywords with regex or basic string patterns, and writing out equivalent Java syntax:

```basic
PRINT "CUSTOMER NAME: " : NAME
```
translates easily enough to:
```java
System.out.println("CUSTOMER NAME: " + name);
```

In an industrial codebase, this illusion vanishes within the first five minutes. 

UniBasic programs do not look like clean, linear scripts. They are procedural programs filled with universal pass-by-reference subroutine calls, untyped variables that fluidly coerce between numbers and strings, dynamic 3-dimensional delimited arrays (`@FM`, `@VM`, `@SM`), global shared memory segments (`COMMON` blocks), and arbitrary jumps (`GOTO`, `GOSUB`, `ON GOTO`). 

Trying to convert these constructs directly from source text to Java strings in a single leap leads to unmaintainable complexity. The moment you encounter an unstructured jump into the middle of a loop, or a variable mutated inside an external subroutine that must become a class-level instance field in Java, a naive script completely breaks down.

To reliably migrate thousands of legacy files, :h[**a production-grade transpiler must be architected as a staged pipeline of isolated transformations**]. Each stage has a strict, well-defined contract, operates on explicit data structures, and advances the code one step closer from legacy semantics toward clean, idiomatic Java.

---

### The 7-Stage Transpilation Pipeline

Our transpiler processes legacy source code through a sequential **7-stage pipeline**. Each stage accepts an immutable artifact from the preceding stage, enforces a set of transformations or semantic enrichments, and produces a well-typed output for the next stage.

<div class="my-8 overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-2 shadow-sm">
  <img src="/transpiler_pipeline.svg" alt="The 7-Stage Transpiler Architecture Pipeline" class="w-full h-auto block select-none" />
</div>

By breaking down the transpilation process into these explicit stages, each component remains small, testable, and insulated from the complexities of other phases.

Let us examine the very first stage in detail: **Source Discovery**.

---

### Stage 1: Source Discovery

Before the transpiler can parse a single token, it has to answer a basic question: **which files should actually be transpiled?**

In languages like C, the file system makes this obvious: `.c` files are programs to compile, and `.h` files are headers to include. UniBasic has no file extensions. When you look at a directory of UniBasic files, you cannot tell by name which file is a full program that should become a Java class, and which is simply an include file meant to be copied into other programs. If you blindly tried to transpile every file in the folder, half of them would fail because they are not programs, but partial fragments.

Source Discovery solves this by handling three tasks:

1. **Identifying Transpileable Sources (`TranspileableSources`):** Inspecting files to separate full programs from pure include files.
2. **Inlining Includes:** Recursively copying all include files into the program before parsing.
3. **Tracking Missing Includes:** Recording any missing dependencies to produce a clean diagnostic report instead of crashing.

---

#### 1. Identifying Transpileable Sources

A file on disk in a UniBasic repository typically falls into one of three categories:
* **A Subroutine:** A callable compilation unit beginning with a `SUBROUTINE` declaration. These must transpile into independent Java classes.
* **A Flat Executable Program:** A standalone routine that contains business logic and execution commands (`PRINT`, `CALL`, `STOP`) without an explicit subroutine header. These execute as main programs and must also transpile into runnable Java classes.
* **A Pure Include Fragment:** A file containing shared `COMMON` memory blocks, record field offsets, or macro-like statements intended strictly for textual inclusion into other routines.

```basic
* Example A: A Subroutine (Transpileable)
SUBROUTINE PROCESS.ORDER(ORDER.ID, STATUS)
    ...
RETURN

* Example B: A Flat Program (Transpileable)
PRINT "STARTING BATCH RUN"
CALL PROCESS.ORDER("ORD-101", STATUS)
STOP

* Example C: An Include Fragment (Not Transpileable)
COMMON /ORDERS/ ORDER.CACHE(100), CACHE.COUNT
EQUATE MAX.ORDERS TO 100
```

If the transpiler attempted to compile every file on disk, attempting to transpile Example C on its own would generate an invalid, broken Java class: it has no execution entry point and declares unanchored shared variables. 

Source Discovery inspects the codebase to categorize every file, filtering out pure include fragments and returning a strongly typed collection: `TranspileableSources`.

```java
// Note: Code trimmed for brevity
public final class TranspileableSources {

    public record SourceFile(Path path, String content) { }

    private final List<SourceFile> sourceFiles;
    // Methods trimmed for brevity
}
```

Each transpileable program is encapsulated as a `SourceFile` holding its path and source text. Only these verified compilation units advance to subsequent pipeline stages.

---

#### 2. Inlining Includes

Once transpileable files are identified, the discovery layer must assemble their true source text.

UniBasic relies heavily on textual inclusion using `$INCLUDE` or `INCLUDE` statements:

```basic
PROGRAM UPDATE.CUSTOMER
    $INCLUDE COMMON.BLOCKS
    $INCLUDE CUSTOMER.RECORD.LAYOUT
    $INCLUDE IO.ROUTINES

    CUSTOMER.RECORD<1> = "ACME CORP"
    CALL WRITE.CUSTOMER(CUSTOMER.RECORD)
STOP
```

Because UniBasic lacks a native module system or namespace encapsulation, a program cannot be parsed in isolation until its include files are resolved. Source discovery recursively traverses the include hierarchy:

* **Arbitrary Nesting:** Resolving includes within includes to arbitrary depths across configured search paths.
* **Duplicate Inclusion Guards:** Tracking visited include paths to prevent infinite recursion and redundant inlining.
* **Monolithic Expansion:** Inlining shared memory blocks and data structures frequently expands a modest 150-line program into a **4,000+ line inlined monolith**.

Crucially, inlining text presents a diagnostic challenge: when a 150-line program expands into a **4,000+ line inlined monolith**, debugging a syntax failure at line 3,240 becomes nearly impossible with standard tools. A raw exception tells you the token that failed, but provides zero context on which parent statement got lost, what branch was taken, or which include file introduced the broken syntax.

Rather than complicating the discovery layer with fragile line-mapping tables, we solve this diagnostic challenge downstream using **Parser Tracing** (explored in depth in [Part 7: Observability in Transpilers: Parser Tracing](/en/blog/observability_in_transpilers_parser_tracing/)). By treating parser rules as hierarchical spans, the parser records its exact execution trace, turning a 4,000-line monolith mystery into an actionable diagnostic tree that pinpoints the exact failing rule and context in seconds.

---

#### 3. Tracking Missing Includes and Diagnostic Reporting

In a massive enterprise repository modified by hundreds of developers over decades, the discovery layer will inevitably encounter missing files. An include directive might reference a deprecated include file, an abandoned path, or a file that existed on a developer machine twenty years ago.

A naive pipeline aborts on the first missing file. Across 14,000 files, aborting on individual failures creates an agonizing cycle of fix-and-rerun.

Source Discovery isolates missing includes gracefully:
1. It records the missing file reference and the including file's origin.
2. It logs all search directories that were checked.
3. It marks the dependent program as unresolvable, isolates it, and continues scanning the remaining thousands of programs.

At the conclusion of the discovery run, the transpiler generates a comprehensive diagnostic summary detailing every unresolved include across the entire system.

---

#### The Contract of Source Discovery

The Source Discovery phase establishes the input contract for the rest of the transpiler front-end:

* **Input:** File system repository paths, include directory search paths, and discovery configuration.
* **Output:** A strongly typed `TranspileableSources` collection. Each transpileable source contains a fully inlined character buffer ready for the lexer, alongside an accumulated registry of missing include diagnostics.

Once Source Discovery completes, the transpiler never performs another disk lookup or file read. The entire pipeline operates in memory on these self-contained units.

With the complete source text assembled and verified, execution transitions to the second stage: the **Lexer**.


---

### Stage 2: Lexer

Once Source Discovery produces inlined source text, the next phase begins: transforming raw character sequences into a typed, structured **Token Stream**.

The Lexer has a clean, one-way contract: it takes raw source text as input and produces a `TokenStream`. 

---

#### 1. Decoupling the Parser from the Lexer

Typically, parsers pull tokens on demand from the lexer (`lexer.nextToken()`), tightly coupling the two. In our architecture, :h[**the parser has zero knowledge of the lexer**].

The Lexer runs **eagerly**: it tokenizes the entire source file upfront into a `TokenStream`. The parser never interacts with character streams, character offsets, or lexer internals. The `TokenStream` acts as an in-memory repository of all tokens:

```java
// Note: Code trimmed for brevity
public final class TokenStream {
    private final List<Token> tokens;

    public Optional<Token> tokenAt(int index) {
        if (index < 0 || index >= tokens.size()) {
            return Optional.empty();
        }
        return Optional.of(tokens.get(index));
    }

    public TokenCursor cursor() {
        return new TokenCursor(this);
    }
}
```

The parser receives the `TokenCursor`:

```java
// Note: Code trimmed for brevity
public class TokenCursor {
    private final TokenStream tokenStream;
    private int currentIndex;

    public Optional<Token> peek() {
        return this.tokenStream.tokenAt(currentIndex);
    }

    public Optional<Token> next() {
        Optional<Token> token = this.peek();
        token.ifPresent(t -> currentIndex++);
        return token;
    }
}
```

Because token generation is eager and self-contained, parsing becomes a purely syntactic task operating on a clean, indexable sequence of tokens.

---

#### 2. The Three Types of Lexemes

A lexeme is simply the raw substring of characters extracted from the source code. A token is the combination of that lexeme, its token type (`TokenType`), and its line number.

The UniBasic lexer scans characters into three distinct lexeme shapes:

The UniBasic lexer handles three types of lexemes:

1. **Single-character lexemes:** Characters that stand entirely on their own, like `(`, `)`, `,`, or `@`. The lexer emits the token immediately without needing to inspect what comes next.
2. **Dual-character lexemes:** Two-character operators like `+=`, `:=`, `<>`, or `<=`. Here, the lexer peeks at the next character to tell whether it is looking at a standalone operator (`+`) or a compound one (`+=`).
3. **Multi-character lexemes:** Tokens that span multiple characters:
   * **Identifiers:** Variable names like `RECORD.NAME` or `FMT$15`, which in UniBasic can contain dots, underscores, and dollar signs.
   * **Keywords:** Statements like `SUBROUTINE`, `PRINT`, or `STOP`.
   * **Literals:** Numbers like `42` or `3.14`, and strings wrapped in single quotes (`'hello'`), double quotes (`"hello"`), or UniBasic's backslashes (`\hello\`).

---

#### 3. Core Design: PeekableCharacters and LastEmission

Writing a lexer by manually managing string index variables (`source.charAt(currentIndex + 1)`) quickly leads to fragile code riddled with index-out-of-bounds checks. Our Lexer delegates character navigation to a specialized helper: `PeekableCharacters`.

`PeekableCharacters` encapsulates all index arithmetic, boundary validations, and lookaheads. The Lexer itself never touches raw character offsets:

```java
// Note: Code trimmed for brevity
final class PeekableCharacters {
    private final String source;
    private int currentIndex;

    char current() { return source.charAt(currentIndex); }

    void advance() { currentIndex++; }
    
    boolean isExhausted() { return currentIndex >= source.length(); }

    boolean currentMatches(char expected) {
        return !isExhausted() && current() == expected;
    }

    String substring(int start) {
        return source.substring(start, currentIndex);
    }
}
```

Because character navigation is abstracted, the core scanning loop in `Lexer` reads like a structured decision table:

```java
// Note: Code trimmed for brevity
public TokenStream lex() {
    TokenStream stream = new TokenStream();
    while (!characters.isExhausted()) {
        switch (characters.current()) {
            case '(' -> {
                this.emit(stream, Token.of(TokenType.OpenParentheses, line.number()));
                advance();
            }
            case '+' -> this.emit(stream, simpleOrEqualsCompoundToken(TokenType.Plus, TokenType.PlusEquals));
            case ' ', '\t', '\n' -> advance();
            default -> {
                if (LexemeType.isIdentifierStart(characters.current()))
                    this.identifierOrKeywordToken(stream);
                // Other token rules trimmed for brevity
            }
        }
    }
    stream.add(Token.of(TokenType.EndOfSource, line.number()));
    return stream;
}
```

**Contextual Disambiguation via LastEmission**

Some characters in UniBasic cannot be interpreted by inspecting the next character alone. For example, does a minus sign `-` mean binary subtraction (`PRICE - DISCOUNT`) or a negative numeric literal (`-10`)? Does an asterisk `*` mean multiplication or a comment?

To resolve these cases without backtracking, the lexer tracks state through `LastEmission`. By recording the previously emitted token and whether it started the line, the lexer knows whether `-` follows an operator (making it a negative number) or follows an operand (making it binary subtraction).

---

#### 4. Walking Through a Unit Test

To see the lexer in action, consider a unit test that verifies tokenizing an identifier containing a dot:

```java
// Note: Code trimmed for brevity
@Test
void tokenizesIdentifierToken() {
    TokenStream stream = new Lexer("RET.VAL").lex();
    Token token = stream.tokenAt(0).orElseThrow();

    assertEquals(TokenType.Identifier, token.type());
    assertEquals("RET.VAL", token.lexeme());
    assertEquals(1, token.lineNumber());
}
```

When this test executes:
1. `characters.current()` reads the initial character `'R'`.
2. `LexemeType.isIdentifierStart('R')` evaluates to `true`.
3. The lexer bookmarks the starting index and advances across `'E'`, `'T'`, the dot `'.' `, `'V'`, `'A'`, and `'L'`.
4. It extracts the complete substring `"RET.VAL"`.
5. It checks whether `"RET.VAL"` is a reserved keyword in `Keywords`. Because it is not, it emits a `Token` of type `TokenType.Identifier` with the lexeme `"RET.VAL"` at line `1`.
6. With the source text fully consumed, the lexer emits a final terminal `TokenType.EndOfSource` token into the stream.

---

#### The Contract of the Lexer

The Lexer establishes the boundary between raw characters and grammatical tokens:

* **Input:** Raw source text from a `SourceFile`.
* **Output:** A `TokenStream` containing ordered `Token` instances, terminated with `EndOfSource`.

With the token stream generated, execution proceeds to the third stage: **Parsers**.


---

### Stage 3: Parsers

With a tokenized stream ready, execution advances to the third stage: **Parsers**.

The parser's responsibility is to convert a linear sequence of tokens into a hierarchical, strongly typed **Source Abstract Syntax Tree (Source AST)**. It validates the syntactic structure of the language, ensures statements and expressions obey grammar rules, and produces an AST that faithfully reflects the legacy code as written.

---

#### 1. Parser Organization and the Base Parser

Rather than writing a monolithic parser class spanning tens of thousands of lines, the parser is organized into small, decoupled subparsers. Every statement form (such as `IF`, `LOOP`, `CALL`, or `SLEEP`) lives in its own dedicated parser class.

All parsers inherit from a common base class: `Parser`. The base `Parser` holds the shared `TokenCursor` and provides a suite of `expect*` validation methods:

```java
// Note: Code trimmed for brevity
public abstract class Parser {
    private final TokenCursor cursor;

    protected Parser(TokenCursor cursor) {
        this.cursor = cursor;
    }

    protected Token expect(TokenType expectedType) {
        Token token = cursor.next().orElseGet(Token::endOfSource);
        if (!token.isOfType(expectedType)) {
            throw new UnexpectedTokenException(expectedType, token);
        }
        return token;
    }

    protected Token expectIdentifier() {
        return this.expect(TokenType.Identifier);
    }

    protected Token expectKeyword(String lexeme) {
        return this.expect(TokenType.Keyword, lexeme);
    }

    protected Token expectOneOf(TokenType first, TokenType second) {
        // Validates and consumes if the token matches either type
    }
}
```

These `expect*` methods enforce language grammar rules deterministically. When an expected delimiter or keyword is missing, the parser throws an immediate, structured syntax exception rather than continuing forward in an invalid state.

---

#### 2. LL(1) and Recursive Descent

Our statement parsing architecture is built on two foundational parsing techniques: **LL(1)** parsing and **Recursive Descent**.

**What is LL(1)?**

The name LL(1) breaks down into three core properties:
* **First L (Left-to-right):** The parser reads the token stream sequentially from beginning to end.
* **Second L (Leftmost derivation):** The parser constructs the syntax tree from the top down, expanding the leftmost grammar rule first.
* **(1) One Token Lookahead:** By default, the parser inspects the current token (`cursor.peek()`) to decide which statement parser or grammar branch to enter.

> **Why Not LL(k)?**
> When parsing statements, a single token lookahead is not always enough:
> * **Keywords Used as Variable Names:** UniBasic allows keywords to be assigned as variables (such as `NULL = ''` or `LOCK<1> = 0`). The parser cannot decide based on the leading keyword alone; it must check whether an assignment operator follows.
> * **Dynamic Array Assignments:** In a statement like `CUSTOMER.REC<1, 2, 3> = "ACTIVE"`, the parser must scan past the indices to find the assignment operator (`=`) to know this is an assignment statement. Because an array can have any number of dimensions, the assignment operator might be three, six, or ten tokens ahead.
> 
> In traditional parser design, needing multiple tokens of lookahead pushes you toward an LL(k) parser. But what should `k` be? In UniBasic, we cannot determine a fixed `k` upfront because the required lookahead varies from statement to statement.
> 
> In streaming parsers, arbitrary lookahead requires managing complex sliding-window buffers. But our architecture has an advantage: **the lexer is eager**.
> 
> Because the lexer has already tokenized the entire source file into an in-memory `TokenStream`, lookahead does not require special buffers. We keep our parsers **LL(1)**: they operate on a single token by default, and whenever an ambiguous construct appears, the parser simply peeks ahead directly into the stream through `TokenCursor.peekAhead(offset)`.

**What is Recursive Descent?**

Recursive descent is a top-down parsing technique where each grammar rule is implemented as a method or class. When grammar rules nest inside other grammar rules, parsers call each other recursively down the syntax tree.

For example, an `IF` statement contains conditional branches, each of which contains a block of statements. The `IfParser` parses the `IF` condition, then recursively invokes the general statement parser to parse each statement inside the `THEN` and `ELSE` blocks. Once the inner statements are parsed, control returns back to the `IfParser` to consume the closing `END`.

---

#### 3. Pratt Parsing for Expressions

While statements cleanly follow LL(1) recursive descent, mathematical and logical expressions do not. UniBasic expressions feature over ten levels of operator precedence, prefix operators (such as unary minus `-` or `NOT`), infix operators (such as `+`, `*`, and string concatenation `:`), and comparisons (such as `<>`, `>=`, and `#`).

Trying to parse complex expressions using traditional recursive descent grammar rules requires creating a distinct method for every single precedence level (`parseAddition()`, `parseMultiplication()`, `parseComparison()`, `parsePrimary()`). This approach leads to deep call stacks, grammar explosion, and rigid code.

To solve this, we use **Pratt Parsing** (Top-Down Operator Precedence parsing). Instead of nesting grammar rules across dozens of methods, Pratt parsing associates tokens with small, dedicated objects called **parselets**.

> Our expression parser design is directly inspired by Bob Nystrom's classic article, [Pratt Parsers: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/), which adapted Vaughan Pratt's 1973 top-down operator precedence algorithm into an elegant, object-oriented parselet architecture.

**What is a Parselet?**

A parselet is a micro-parser: an isolated object responsible for parsing an expression snippet associated with a specific token type. Instead of hardcoding every operator rule into a giant parser class, the expression parser acts as a flat dispatch engine that delegates work to these small, pluggable parselets.

In Pratt parsing, parselets are categorized into two kinds based on their **syntactic position** in the token stream, rather than their mathematical operator type:

* **Prefix Parselet:** Handles any token that appears in *prefix position*, meaning it can legally open an expression. "Prefix" refers strictly to position, not operator arity. A prefix parselet is registered for:
  * Numeric and string literals (`42`, `"HELLO"`).
  * Variable identifiers (`TOTAL`, `RECORD.NAME`).
  * Unary operators (`-COUNT`, `NOT(DONE)`).
  * Grouping parentheses (`(` at the beginning of `(A + B)`).
* **Infix Parselet:** Handles any token that appears in *infix position*, meaning it sits between a completed left-hand expression and an upcoming right-hand expression. An infix parselet is registered for:
  * Binary arithmetic operators (`+`, `-`, `*`, `/`).
  * Comparisons (`=`, `#`, `<`, `>`, `<=`, `>=`).
  * String concatenation (`:` in `FIRST.NAME : " " : LAST.NAME`).
  * Function calls (`(` immediately following a function name, as in `CALCULATE(X)`).
  * Dynamic array field lookups (`<` in `RECORD<1, 2>`).

**The Dual Role of Tokens**

Because prefix and infix describe position rather than token identity, the exact same token can be registered as both a prefix parselet and an infix parselet without ambiguity:

* **The minus sign `-`:** In prefix position (`-10`), the parser invokes `UnaryParselet` to create a unary negation expression. In infix position (`A - B`), the parser invokes `BinaryOperatorParselet` to create a binary subtraction expression.
* **The open parenthesis `(`:** In prefix position (`(A + B)`), the parser invokes `GroupParselet` to evaluate a parenthesized sub-expression. In infix position (`SHOW(A, B)`), the parser invokes `OpenParenthesesParselet` to parse a function call.

The parser never needs to guess or backtrack. If it is starting an expression, it looks up the token in the prefix registry; if it already has a parsed expression on the left, it looks up the next token in the infix registry.

**The Parselet Contracts**

The core of Pratt parsing lies in its simplicity. The two parselet interfaces define clear, minimal contracts:

```java
// Note: Code trimmed for brevity
public interface PrefixParselet {
    Expression parse(Token token, ExpressionParser expressionParser);
}
```

```java
// Note: Code trimmed for brevity
public interface InfixParselet {
    Expression parse(Expression left, Token operator, ExpressionParser expressionParser);
    Precedence precedence();
}
```

Every `InfixParselet` defines a `precedence()` value. This represents its **binding power**: how tightly the operator pulls surrounding expressions toward itself. For example, multiplication (`Multiplicative`, level 6) binds more tightly than addition (`Additive`, level 5).

**Implementing an Infix Operator: BinaryOperatorParselet**

Standard binary operators (such as `+`, `-`, `*`, and `/`) share a single reusable implementation:

```java
// Note: Code trimmed for brevity
public class BinaryOperatorParselet implements InfixParselet {
    private final Precedence precedence;

    public BinaryOperatorParselet(Precedence precedence) {
        this.precedence = precedence;
    }

    @Override
    public Expression parse(Expression left, Token operator, ExpressionParser expressionParser) {
        Expression right = expressionParser.parse(precedence);
        return new Expression.Binary(left, BinaryOperator.from(operator.type()), right);
    }

    @Override
    public Precedence precedence() {
        return precedence;
    }
}
```

Notice the call to `expressionParser.parse(precedence)`. The parselet invokes the parser recursively for the right-hand operand, passing **its own precedence** as the minimum precedence threshold. This single parameter naturally enforces left-associativity: the right-hand sub-expression only absorbs operators that bind strictly tighter than the current operator.

**The Pratt Engine Loop**

The entire expression parsing logic is driven by a single, compact loop inside `ExpressionParser`:

```java
// Note: Code trimmed for brevity
public Expression parse(Precedence minimumPrecedence) {
    Token token = advance();
    PrefixParselet prefixParselet = parseletRegistry.lookupPrefix(token.type())
            .orElseThrow(() -> new UnsupportedPrefixParseletException(token));

    Expression left = prefixParselet.parse(token, this);

    while (minimumPrecedence.isLessThan(precedenceOfNext())) {
        Token operator = advance();
        left = parseletRegistry.lookupInfix(operator.type())
                .orElseThrow()
                .parse(left, operator, this);
    }
    return left;
}
```

The algorithm operates in three straightforward steps:
1. **Consume the prefix token:** The parser consumes the first token and executes its `PrefixParselet` to produce the initial `left` expression (for example, a literal number or variable).
2. **Inspect the next operator's precedence:** The loop checks whether the next token has an infix parselet whose precedence strictly exceeds `minimumPrecedence`.
3. **Absorb and wrap:** If the next operator binds tighter, the parser consumes the operator token and calls its `InfixParselet`. That parselet consumes the right-hand side, wraps `left` and `right` into a new composite expression (such as a `Binary` node), and returns it as the new `left`.

The loop repeats until the next token's precedence is lower than or equal to `minimumPrecedence`, or until an expression delimiter is reached.

**Tracing Pratt Parsing: How `1 + 2 * 3` is Evaluated**

To see how operator precedence and recursive execution resolve automatically, consider tracing the parsing of `1 + 2 * 3`:

<img src="/pratt_parsing_trace.svg" alt="Recursive Pratt Parsing Trace for 1 + 2 * 3" class="w-full my-6 rounded-lg border border-zinc-200" />

The diagram reveals how binding power naturally drives the recursive call stack:

1. **Call 1 (`minimumPrecedence = 0`):** Consumes `1`. It peeks `+` (precedence 5). Because 5 > 0, it enters the loop, consumes `+`, and invokes `BinaryOperatorParselet(+)`, which recursively calls `parse(5)`.
2. **Call 2 (`minimumPrecedence = 5`):** Consumes `2`. It peeks `*` (precedence 6). Because 6 > 5, multiplication binds tighter than addition. It enters the loop, consumes `*`, and invokes `BinaryOperatorParselet(*)`, which recursively calls `parse(6)`.
3. **Call 3 (`minimumPrecedence = 6`):** Consumes `3`. It peeks `EndOfSource` (precedence 0). Because 0 > 6 is false, the loop immediately terminates and returns `Literal(3)`.

As the call stack unwinds, Call 2 constructs `Binary(2 * 3)` and returns it to Call 1, which constructs `Binary(1 + (2 * 3))`. If the expression had been `1 + 2 + 3`, Call 2 seeing the second `+` (precedence 5) would evaluate 5 > 5 (false), immediately returning `Literal(2)` so Call 1 can construct `(1 + 2)` first, preserving left-associativity.

---

#### 4. Statement Dispatch, StatementParser, and the Parser Registry

While expression parsing relies on Pratt parsing, statement parsing is coordinated by a central dispatcher: `StatementParser`.

Each call to `StatementParser.parse()` parses exactly one statement and returns. The dispatcher does not maintain loop counters or state machines; instead, it determines the statement kind through a clean three-step evaluation:

```java
// Note: Code trimmed for brevity
public class StatementParser extends Parser {
    private final StatementParserRegistry           registry;
    private final LabelDefinition                   labelDefinition;
    private final KeywordStatement                  keywordStatement;
    private final AssignmentOrFunctionCallStatement assignmentOrFunctionCallStatement;

    public StatementParser(TokenCursor cursor, ParserTrace parserTrace) {
        super(cursor);
        this.registry                          = new StatementParserRegistry(cursor, this, parserTrace);
        this.labelDefinition                   = new LabelDefinition(cursor);
        this.keywordStatement                  = new KeywordStatement();
        this.assignmentOrFunctionCallStatement = new AssignmentOrFunctionCallStatement(cursor);
    }

    public Statement parse() {
        if (this.labelDefinition.isAtLabel()) {
            return this.labelDefinition.parser().get();
        }
        if (this.keywordStatement.isAtKeywordStatement()) {
            return this.keywordStatement.parser().get();
        }
        return this.assignmentOrFunctionCallStatement.parser().get();
    }

    private final class KeywordStatement {
        private boolean isAtKeywordStatement() {
            if (this.isKeywordAssignedTo()) {
                return false;
            }
            return registry.lookup(peek().type()).isPresent();
        }

        private Supplier<Statement> parser() {
            return registry.lookup(peek().type()).orElseThrow();
        }

        private boolean isKeywordAssignedTo() {
            Token next = peekAhead(1);
            return VariableNameCandidates.contains(peek().type())
                    && (next.isAssignment() || next.isCompoundAssignment() || next.isOfType(TokenType.LessThan));
        }
    }
}
```

The dispatch logic proceeds in order of syntactic precedence:
1. **Label Definitions:** Checks if the line begins with a numeric label (`300 *`) or a named label (`PROCESS.ROW:`).
2. **Keyword Statements:** Delegates to `KeywordStatement`, which consults `registry.lookup(peek().type())`. Notice the lookahead check `isKeywordAssignedTo()`: if a registered keyword is actually being assigned to (such as `NULL = ''` or `LOCK<1> = 0`), it skips keyword statement dispatch so it can be handled as a variable assignment.
3. **Assignments and Function Calls:** Any statement without a leading statement keyword falls through to either a variable assignment (`TOTAL = 100`) or a function call (`SHOW.REPORT(ID)`).

**The Role of StatementParserRegistry**

When `StatementParser` identifies a keyword statement, it delegates construction to `StatementParserRegistry`. The registry maps token types to suppliers that build individual statement parsers:

```java
// Note: Code trimmed for brevity
final class StatementParserRegistry {
    private final Map<TokenType, Supplier<Statement>> parsers = new HashMap<>();

    StatementParserRegistry(TokenCursor cursor, StatementParser statementParser) {
        // Simple statement parsers only need the cursor
        parsers.put(TokenType.Sleep,  new SleepParser(cursor)::parse);

        // Compound statement parsers receive statementParser to parse nested blocks
        parsers.put(TokenType.For,    new ForParser(cursor, statementParser)::parse);
    }

    public Optional<Supplier<Statement>> lookup(TokenType tokenType) {
        return Optional.ofNullable(parsers.get(tokenType));
    }
}
```

This code snippet is simplified for clarity. In the production transpiler, `StatementParserRegistry` also serves as the single integration point for parser observability. Instead of registering bare suppliers, every parser is wrapped in a tracing decorator (`traced(IfParser.class, ...)`). This decorator automatically opens and closes hierarchical spans on a shared `ParserTrace`, recording exact token positions upon entry and exit. When a syntax failure occurs thousands of lines deep, this tracing layer produces an actionable diagnostic tree showing every enclosing parser that was active at the time of failure. We explore this span-based diagnostic system in depth in [Part 7: Observability in Transpilers: Parser Tracing](/en/blog/observability_in_transpilers_parser_tracing/).

**Simple Parsers versus Compound Parsers**

Notice the architectural distinction between simple parsers and compound parsers in the registry:

1. **Simple Parsers:** A leaf statement like `SleepParser` only needs the `TokenCursor` to parse its arguments:

```java
// Note: Code trimmed for brevity
public class SleepParser extends Parser {
    private final ExpressionParser expressionParser;

    public SleepParser(TokenCursor cursor) {
        super(cursor);
        this.expressionParser = new ExpressionParser(cursor);
    }

    public Statement.Sleep parse() {
        Token sleepToken = this.expect(TokenType.Sleep);
        if (this.isDurationAbsent(sleepToken)) {
            return new Statement.Sleep(new Expression.IntegerLiteral(1));
        }
        return new Statement.Sleep(this.expressionParser.parse());
    }
}
```

2. **Compound Parsers:** Statements that contain bodies (such as `ForParser`, `IfParser`, and `LoopParser`) receive `StatementParser` in their constructor:

```java
// Note: Code trimmed for brevity
public class ForParser extends Parser {
    private final StatementParser statementParser;

    public ForParser(TokenCursor cursor, StatementParser statementParser) {
        super(cursor);
        this.statementParser = statementParser;
    }

    public Statement.For parse() {
        // Header parsing logic (variable, range, step) removed for brevity
        List<Statement> body = this.parseBody();
        this.expect(TokenType.Next);
        return new Statement.For(..., body);
    }

    private List<Statement> parseBody() {
        List<Statement> body = new ArrayList<>();
        while (!this.matches(TokenType.Next)) {
            body.add(this.statementParser.parse());
            this.consumeIf(token -> token.isOfType(TokenType.Semicolon));
        }
        return body;
    }
}
```

Notice `parseBody()` in `ForParser`: it repeatedly calls `this.statementParser.parse()` until it hits the terminating `NEXT` keyword. If a statement inside the loop is an `IF` condition, an assignment, or another nested `FOR` loop, `statementParser` resolves and parses it without `ForParser` needing to know anything about other language statements.

This mutual recursion between `StatementParser` and compound statement parsers cleanly handles arbitrary nesting depths without complex state machines.

---

#### The Contract of Parsers

The Parser stage establishes the bridge from linear tokens to structured syntax:

* **Input:** A `TokenCursor` positioned at the beginning of the `TokenStream`.
* **Output:** A strongly typed, purely syntactic `Source AST` (`UnibasicProgram`), completely decoupled from any target-language concepts.

With the Source AST constructed, execution moves to the fourth stage: **Semantic Analysis (SEMA)**.


---

### Stage 4: Semantic Analysis (SEMA)

The parser's responsibility is purely syntactic: it builds an Abstract Syntax Tree that faithfully reflects the legacy code as written. But raw syntax alone is insufficient for translation. UniBasic code contains decades of historical idioms and legacy quirks:
* **Calls to Missing Programs:** Subroutines were retired years ago. In UniBasic, calling an absent subroutine only fails at runtime if execution reaches that specific branch. In Java, however, referencing a non-existent class causes a compile-time failure that blocks the entire generated application from building.
* **Inline Conditional Expressions:** Assignments whose values are IF expressions (`BNK = IF c THEN a ELSE b`) have no direct assignment equivalent in Java.
* **Redundant Array Declarations:** Shared include files often define `DIM` statements to size arrays. When such an include is inlined into a subroutine that already receives that array as a `MAT` parameter from its caller, retaining the `DIM` would cause Java to emit a fresh array allocation (`array = new UnibasicValue[n]`), silently overwriting and destroying the caller's data.
* **Global Shared Memory (`COMMON`):** Static global variables must be routed through session runtime calls.
* **Arity Mismatches:** Subroutines called with varying argument counts across thousands of legacy call sites must be reconciled.

Giving that syntax **meaning, normalization, and semantic enrichment** is the responsibility of SEMA. 

Crucially, **SEMA remains 100% within the Source AST world**. It accepts a `UnibasicProgram` (Source AST) and returns an enriched `UnibasicProgram` (Source AST). It does not know or care about Java, target ASTs, or code generation.

---

#### 1. The SEMA Pipeline Orchestration

Rather than attempting to perform semantic analysis in a single monolithic pass, SEMA is structured as a pipeline of independent, single-purpose **micro-rewriters**. 

In our transpiler, `SemanticAnalyser` orchestrates **fourteen top-level passes** in a strict sequential chain. Some of these stages are themselves composite sub-pipelines: for example, `GotoAnalyser` alone executes fourteen dedicated micro-passes in sequence to untangle unstructured legacy jumps:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.sema;

import java.util.List;

public final class SemanticAnalyser {

    public SemanticAnalysisResult analyse(List<UnibasicProgram> allPrograms) {
        // Step 1: Drop calls to missing legacy programs
        List<UnibasicProgram> programs = allPrograms.stream()
                .map(this::dropCallsToMissingPrograms)
                .toList();

        // Step 2: Sequential pipeline of micro-rewriters
        List<UnibasicProgram> rewritten = programs.stream()
                .map(this::insertInputTrapChecks)
                .map(this::rewriteIfExpressionsAsStatements)
                .map(this::rewriteDimAndCommonAccesses)
                // Additional passes: GOTO restructuring, COMMON block access, unused parameter detection
                .toList();

        // Step 3: Type inference, cross-program propagation, and stamping
        return new SemanticAnalysisResult(this.stampTypes(rewritten));
    }

    private UnibasicProgram dropCallsToMissingPrograms(UnibasicProgram program) {
        return new MissingProgramCallRewriter(missingProgramSet).visit(program);
    }
}
```

Instead of describing all fourteen passes in detail, consider a few representative examples that illustrate the variety of legacy problems SEMA resolves:

* **`MissingProgramCallRewriter`:** Replaces calls to retired legacy subroutines with safe placeholder statements, preventing unresolved symbol errors during Java builds.
* **`IfExpressionToStatementRewriter`:** Rewrites assignments containing inline IF expressions (`X = IF cond THEN a ELSE b`) into standard IF statements (`IF cond THEN X = a ELSE X = b`), simplifying subsequent control-flow analysis.
* **`CommonAccessRewriter`:** Identifies references to UniBasic `COMMON` blocks (global memory shared across independent programs) and rewrites them into structured session runtime accessors (`UnibasicSessionRuntime.get` and `set`).
* **`GotoAnalyser`:** A composite sub-pipeline of fourteen micro-passes dedicated solely to restructuring unstructured jumps: converting retries into clean loops, lifting nested jump labels, and synthesizing state machines for jump cycles.
* **`TypeStampingRewriter`:** Propagates inferred variable types across program boundaries until reaching a fixpoint, stamping concrete types onto AST identifiers so downstream stages can emit strongly-typed Java declarations.

Notice the design of this pipeline: each pass takes an immutable `UnibasicProgram` and returns a new `UnibasicProgram`. The output of one rewriter becomes the input to the next.

---

#### 2. Core Architectural Design Patterns in SEMA

Building a semantic analysis pipeline across millions of lines of code requires strict architectural discipline. SEMA relies on five foundational design patterns:

**1. Immutable AST**

AST nodes (`UnibasicProgram`, `Statement`, `Expression`) are modeled as immutable Java records and sealed hierarchies. A SEMA pass never mutates an AST node in place.

The root of every parsed program file is represented by `UnibasicProgram`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.ast;

import java.util.List;

public record UnibasicProgram(
        String name,
        List<Statement> statements,
        boolean hasSubroutines
) {
    public static UnibasicProgram copyFrom(UnibasicProgram original, List<Statement> statements) {
        return new UnibasicProgram(original.name(), statements, original.hasSubroutines());
    }
}
```

Statements are structured as a sealed interface where each syntactic variant is an immutable record that implements double-dispatch visitor methods:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.ast;

import java.util.List;

public sealed interface Statement
        permits Statement.If,
                Statement.Assignment,
                Statement.Call,
                Statement.For,
                Statement.DroppedCall /* and 60+ other concrete forms */ {

    Statement accept(StatementRewriteVisitor visitor);
    void accept(StatementVisitor visitor);

    record Assignment(Expression target, Expression value) implements Statement {
        @Override
        public Statement accept(StatementRewriteVisitor visitor) {
            return visitor.visit(this);
        }
        @Override
        public void accept(StatementVisitor visitor) {
            visitor.visit(this);
        }
    }

    record If(
            Expression condition,
            List<Statement> thenBody,
            List<Statement> elseBody,
            boolean chainedElseIf
    ) implements Statement {
        @Override
        public Statement accept(StatementRewriteVisitor visitor) {
            return visitor.visit(this);
        }
        @Override
        public void accept(StatementVisitor visitor) {
            visitor.visit(this);
        }
    }
}
```

Because AST nodes are immutable, a SEMA pass never modifies an AST node in place. When a pass performs a transformation, it returns a new node instance representing the modified construct, while `UnibasicProgram.copyFrom(original, newStatements)` produces a new root container for the resulting program.

This functional, immutable approach eliminates hidden side effects, guarantees thread safety across passes, and ensures zero state corruption bugs. Even with dozens of sequential passes creating new tree instances, the pipeline remains fast: in production, :h[**our transpiler processes over 14,000 UniBasic programs and completes the entire end-to-end pipeline in just 75 to 80 seconds to emit all Java files, with zero risk of cross-pass state corruption**].

**2. The External Visitor Pattern: How Visit and Accept Work Together**

In object-oriented design, language tools often fall into the trap of turning AST nodes into heavy objects by attaching validation logic, type checks, and transformation helpers directly onto node classes. This violates the Single Responsibility Principle and binds the syntax data structure tightly to specific analysis operations.

In our architecture, AST nodes remain pure, sealed data carriers. All transformation and analysis algorithms live strictly external in dedicated visitor classes:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.ast;

public interface StatementRewriteVisitor {

    // Default identity pass-through implementations
    default Statement visit(Statement.Assignment statement) { return statement; }
    default Statement visit(Statement.Call statement) { return statement; }
    default Statement visit(Statement.If statement) { return statement; }
    default Statement visit(Statement.For statement) { return statement; }
    // Default implementations for remaining statements trimmed for brevity
}
```

For read-only inspection (such as gathering subroutine dependencies or scanning for undeclared variables), the architecture provides a companion `StatementVisitor` interface where each visit method returns `void`.

When the transpiler traverses statements, each element is held as an abstract `Statement` reference. Because Java resolves method overloads at compile time rather than at runtime, writing `visitor.visit(statement)` directly will not compile: Java cannot know which specific overloaded method to invoke without a tedious sixty-branch `instanceof` ladder.

To avoid this, `accept` and `visit` collaborate through a clean two-step handshake:

1. **The caller asks the node to introduce itself:** The traversal calls `statement.accept(visitor)`. Java polymorphically dispatches this call to the concrete record instance (for example, `Statement.Call`).
2. **The node introduces itself back to the visitor:** Inside `Statement.Call`, the node calls `visitor.visit(this)`:
   ```java
   @Override
   public Statement accept(StatementRewriteVisitor visitor) {
       // Inside this class, 'this' is definitely a Statement.Call
       return visitor.visit(this);
   }
   ```
   Because `this` is statically typed as `Statement.Call`, Java resolves the call directly to the overloaded `visit(Statement.Call)` method on the visitor at compile time.
3. **The visitor returns the transformed or original statement:** If the visitor overrides `visit(Statement.Call)`, its custom transformation executes and returns the new statement. If not, the default identity method in `StatementRewriteVisitor` simply passes the statement through (`return statement;`).

This collaboration delivers three key architectural advantages:

* **Zero Type Cascades:** Neither the SEMA passes nor the AST nodes ever write `instanceof` checks or manual downcasts.
* **Declarative Rewriter Passes:** A pass only overrides the specific statement kinds it alters. All other statement types fall through to the default identity method automatically.
* **Pure AST Records:** AST records contain no transpiler business logic. They simply store syntax data and introduce themselves to visitors.

**3. Eliminating Traversal Duplication and Revealing Pass Intent via RecursiveStatementRewriteVisitor**

UniBasic contains over thirty statement types, many of which contain nested statement blocks (such as `IF` branches, `FOR` loops, `WHILE`/`UNTIL` loops, and `BEGIN CASE` clauses).

If every SEMA rewriter had to manually traverse these nested blocks, the architecture would suffer from two severe problems:

1. **Massive Boilerplate Duplication:** Every single rewriter would repeat dozens of lines of identical tree-walking recursion to unpack compound statements, map their inner bodies, and reconstruct new nodes.
2. **Obscured Pass Intent:** Without a shared recursive visitor, you would have to read through every single `visit` method in a class just to figure out what the pass actually does. When ninety percent of the methods in a file are mechanical block-walking boilerplate, the actual transformation is buried like a needle in a haystack.

To solve both problems, the base interface `RecursiveStatementRewriteVisitor` provides default recursive traversal logic for every compound statement:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.ast;

import java.util.List;

public interface RecursiveStatementRewriteVisitor extends StatementRewriteVisitor {

    default List<Statement> rewriteBody(List<Statement> body) {
        return body.stream().map(statementInBody -> statementInBody.accept(this)).toList();
    }

    @Override
    default Statement visit(Statement.If statement) {
        return new Statement.If(
                statement.condition(),
                rewriteBody(statement.thenBody()),
                rewriteBody(statement.elseBody()),
                statement.chainedElseIf()
        );
    }

    @Override
    default Statement visit(Statement.For statement) {
        return new Statement.For(
                statement.name(),
                statement.variable(),
                statement.from(),
                statement.to(),
                statement.step(),
                statement.until(),
                statement.whileCondition(),
                rewriteBody(statement.body())
        );
    }

    // Default implementations for other compound statements trimmed for brevity
}
```

By inheriting from `RecursiveStatementRewriteVisitor`, the architectural purpose of each SEMA pass becomes immediately apparent at a glance:

* **Intent-Revealing Code:** A rewriter class overrides only the specific node types it transforms. If an engineer opens `MissingProgramCallRewriter` and sees only `visit(Statement.Call)`, the purpose of the entire pass is understood in two seconds. There is no cognitive noise from irrelevant block traversal code.
* **Guaranteed Deep Traversal:** Nested statements inside `IF` branches or `FOR` loops are automatically visited without the author having to remember to recurse manually.

**4. Micro-Rewriters: One Job per Pass**

Each rewriter has a single, well-defined responsibility:
* `MissingProgramCallRewriter`: drops calls to retired legacy subroutines.
* `IfExpressionToStatementRewriter`: rewrites IF expressions in assignments to standard IF statements.
* `MatParameterDimDropRewriter`: removes redundant array allocations for parameters.
* `TypeStampingRewriter`: annotates identifiers with inferred type metadata.

This strict separation ensures each pass is simple, isolated, and easy to verify through targeted unit tests.

**5. Strict Pass Isolation: Zero Inter-Pass Coupling**

SEMA passes **never** invoke one another. Pass A never imports, calls, or depends on Pass B. While the passes are executed in a specific order by `SemanticAnalyser`, each pass operates as an isolated pure function: `UnibasicProgram -> UnibasicProgram`. This decoupling allows individual passes to be debugged, tested, reordered, or extended without fear of hidden side effects.

---

#### 3. Deep Dive into a SEMA Pass: MissingProgramCallRewriter

To see these design patterns working in unison, consider `MissingProgramCallRewriter`.

In a legacy codebase with decades of history, programs frequently call subroutines that no longer exist: they were deprecated, replaced by newer variants, or deleted years ago. In UniBasic, calling an absent subroutine only triggers a runtime failure if execution happens to hit that exact statement. But in Java, emitting a call to a non-existent class causes a compile-time failure that blocks the entire generated application from building.

`MissingProgramCallRewriter` intercepts calls to missing programs and transforms them into non-executable placeholder statements that retain the original subroutine name and the reason it was dropped:

```java
// Note: Code trimmed for brevity
public final class MissingProgramCallRewriter implements RecursiveStatementRewriteVisitor {

    private final MissingProgramSet missingProgramSet;

    public MissingProgramCallRewriter(MissingProgramSet missingProgramSet) {
        this.missingProgramSet = missingProgramSet;
    }

    public UnibasicProgram visit(UnibasicProgram program) {
        return UnibasicProgram.copyFrom(program, this.rewriteBody(program.statements()));
    }

    @Override
    public Statement visit(Statement.Call statement) {
        return this.missingProgramSet
                .reasonFor(statement.programName())
                .<Statement>map(reason -> new Statement.DroppedCall(statement.programName(), reason))
                .orElse(statement);
    }
}
```

Notice how clean and compact this implementation is:
1. **Zero Traversal Boilerplate:** The rewriter implements `RecursiveStatementRewriteVisitor` and overrides **only** `visit(Statement.Call statement)`. Whether a `CALL` statement appears at the top level, nested inside an `IF` block, or inside a loop, the base visitor reaches it automatically.
2. **Targeted Transformation:** If `missingProgramSet` does not contain the target program name, `orElse(statement)` returns the statement unchanged. The rewriter only intervenes when a subroutine is confirmed missing.
3. **Pure AST Transformation:** If the program is missing, it returns a new `Statement.DroppedCall` record containing the program name and reason. Later, the emitter can turn this into an informative Java comment rather than failing code generation.

---

#### The Contract of SEMA

The Semantic Analysis stage transforms raw syntactic trees into semantically validated, enriched representations:

* **Input:** A syntactically valid `UnibasicProgram` straight from the parser.
* **Output:** A semantically normalized and type-stamped `UnibasicProgram`.

`UnibasicProgram` is the **final Source AST**. It represents the culmination of all lexical analysis, syntactic parsing, and semantic enrichment on the legacy code. Once SEMA completes, this source tree is complete and sealed: no further source-level passes ever modify it. It stands as the canonical, authoritative representation of the legacy program, ready to be translated across the language divide in **Stage 5: The Transformer**.

---

### Stage 5: The Transformer

The transition from Semantic Analysis to Transformation represents the central architectural milestone of the transpiler pipeline: **crossing the language divide**.

Up to this point, Stages 1 through 4 operated **100% within the Source AST world**. The lexer, parsers, and SEMA rewriters worked exclusively on UniBasic syntax and legacy constructs. Downstream, Stages 6 (Fact Promotion) and 7 (Emitter) will operate **100% within the Target AST world**, focusing entirely on Java class structures, variable scopes, and code generation.

The **Transformer** is the sole architectural bridge connecting these two domains. Its responsibility is **AST Lowering**: translating semantically validated, type-stamped `UnibasicProgram` Source ASTs into pure, idiomatic `JavaProgram` Target ASTs.

---

#### Why We Need Transformation: Bridging the Semantic Gap

When transpiling between closely aligned languages (such as Java to Kotlin or C to C++), many constructs share similar execution models: classes map to classes, methods map to methods, and conditional branches map directly.

Migrating from a legacy procedural language like UniBasic to modern Java is fundamentally different. UniBasic statements are deeply intertwined with its database engine, and many of its core operations have **no equivalent language constructs in Java whatsoever**:

* **`MATREAD`:** In UniBasic, `MATREAD` is a first-class language statement that reads an entire record from a database file and automatically populates a dimensioned array. Java has no language keyword for reading database records into arrays.
* **`SLEEP`:** Pausing execution is a built-in statement in UniBasic (`SLEEP 5`), whereas Java has no `sleep` statement; pausing execution requires calling an operating system or runtime API.
* **`LOCATE`:** Searches dynamic delimited arrays and tracks the insertion index if a match is not found. Java has no built-in language construct for multi-value array searching.
* **`OCONV` and `ICONV`:** Built-in operators for date, time, and currency masking that must become method calls on formatting runtime libraries.

Because these legacy constructs have no counterparts in Java syntax, the transpiler cannot simply transcribe keywords or copy syntax trees. It must **lower** these high-level legacy operations into Target AST structures that Java actually understands: class definitions, instance method calls, runtime utility invocations, and try-catch blocks. Transformation is the engine that bridges this semantic gap.

---

#### 1. Why Separate Source and Target ASTs?

A common temptation in transpiler development is to construct a single "hybrid" AST: an object model where source language constructs and target language constructs share the same node classes.

In a hybrid AST, individual nodes are forced to accommodate both worlds simultaneously. A single statement node must represent legacy concepts (such as dynamic array delimiters, shared memory blocks, or matrix dimensioning) alongside Java concepts (such as visibility modifiers, static designations, and JVM type bounds). Every traversal pass becomes cluttered with defensive checks: *has this node already been partially lowered to Java, or is it still in its legacy form?* Worse, any change to the legacy grammar inadvertently ripples into code generation, and improvements to generated Java force modifications to source AST nodes.

In our architecture, the boundary between the source language and the target language is absolute:

* **Source AST (`source.ast`):** Models legacy UniBasic grammar and semantics exclusively (`Statement.If`, `Statement.MatRead`, `Statement.GoSub`, `Expression.FieldAccess`). It contains zero references to Java, classes, visibility modifiers, or JVM types.
* **Target AST (`target.ast`):** Models the syntax and structure of modern Java 21 (`Statement.Class`, `Statement.Method`, `Statement.LocalDeclaration`, `Statement.TryCatch`). It contains zero knowledge of UniBasic keywords or runtime quirks.
* **Transformer Layer (`transformer`):** The dedicated translation bridge. Specialized transformers take analyzed Source AST nodes as input and emit clean Target AST nodes as output.

This strict separation delivers three foundational advantages:

1. **Independent Evolution:** The Source AST faithfully models legacy syntax without compromise, while the Target AST models clean, idiomatic Java without legacy artifacts.
2. **A Dumb, Pure Emitter:** Because the Target AST already represents pure Java, the code generator (emitter) has zero business logic or legacy knowledge. It is a straightforward string serializer that prints formatting, braces, and semicolons.
3. **Isolated Testability:** Every transformer can be verified in isolation with unit tests asserting that a specific Source AST node translates into the expected Target AST representation.

---

#### 2. The Target AST: Modeling Java 21 Directly

The root of the Target AST is `JavaProgram`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.ast;

public record JavaProgram(String unibasicProgramName, Statement.Class classStatement) {

    public String packageName() {
        return classStatement.packageName();
    }

    public String javaFileName() {
        return classStatement.className() + ".java";
    }
}
```

Every statement in the generated Java class is modeled through the sealed `Statement` hierarchy in `target.ast`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.ast;

import java.util.List;

public sealed interface Statement
        permits Statement.Class,
                Statement.Method,
                Statement.LocalDeclaration,
                Statement.Assignment,
                Statement.Call,
                Statement.If,
                Statement.Loop,
                Statement.For,
                Statement.TryCatch,
                Statement.Return,
                Statement.Comment /* and other Java constructs */ {

    sealed interface Call extends Statement permits Call.Runtime, Call.Instance, Call.Private {
        record Runtime(Expression.RuntimeCall runtimeCall) implements Call {}
        record Instance(Expression.InstanceCall instanceCall) implements Call {}
        record Private(String methodName) implements Call {}
    }

    record Return() implements Statement {
        public static final Return INSTANCE = new Return();
    }

    record If(
            Expression condition,
            List<Statement> thenBody,
            List<Statement> elseBody,
            boolean chainedElseIf
    ) implements Statement {}
}
```

Notice how every record in this hierarchy represents a construct native to the Java programming language. UniBasic constructs like `COMMON`, `EQUATE`, `MATREAD`, and `GOSUB` have completely vanished.

---

#### 3. Inside a Transformer: Lowering UniBasic to Java

Just as `StatementParser` dispatches raw tokens to individual statement parsers in Stage 3, `StatementsTransformer` dispatches Source AST statements to dedicated statement transformers via a registry:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.transformer;

public final class StatementsTransformer {

    private final StatementsTransformerRegistry registry;

    public com.unibasictojava.transpiler.target.ast.Statement transform(
            com.unibasictojava.transpiler.source.ast.Statement statement) {
        return registry
                .lookup(statement.getClass())
                .orElseThrow(() -> new UnsupportedOperationException("No transformer for: " + statement.getClass().getSimpleName()))
                .transform(statement);
    }
}
```

To see AST Lowering in its simplest form, consider `SleepTransformer`.

In UniBasic, pausing program execution is a language keyword:

```basic
SLEEP 5
```

In Java, there is no `sleep` statement or keyword. Pausing execution requires invoking an API method on an operating system runtime utility (`UnibasicOsRuntime.sleep(5)`).

`SleepTransformer` performs this exact translation across the language boundary:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.transformer.misc;

import com.unibasictojava.transpiler.source.ast.Statement.Sleep;
import com.unibasictojava.transpiler.target.ast.Statement;
import com.unibasictojava.transpiler.transformer.Transformer;
import com.unibasictojava.transpiler.transformer.runtime.RuntimeCallCandidates;
import com.unibasictojava.transpiler.transformer.runtime.RuntimeCallFactory;

public final class SleepTransformer extends Transformer {

    private final RuntimeCallFactory runtimeCallFactory;

    public SleepTransformer(List<TransformerRule> rules) {
        super(rules);
        this.runtimeCallFactory = new RuntimeCallFactory(new ExpressionTransformer());
    }

    @Override
    public Statement transform(com.unibasictojava.transpiler.source.ast.Statement statement) {
        Sleep sleepStatement = (Sleep) statement;
        return new Statement.Call.Runtime(
                runtimeCallFactory.resolve(new RuntimeCallCandidates.SleepCandidate(this.applyRules(sleepStatement.duration())))
        );
    }
}
```

Observe what happened during this lowering:
1. **Input:** `com.unibasictojava.transpiler.source.ast.Statement.Sleep` (Source AST).
2. **Translation:** The transformer applies name and expression rules, constructs a runtime call candidate, and wraps it in a Java method invocation.
3. **Output:** `com.unibasictojava.transpiler.target.ast.Statement.Call.Runtime` (Target AST).

When this Target AST node eventually reaches the emitter, the emitter prints:

```java
UnibasicOsRuntime.sleep(5);
```

#### How Candidates Decouple Transformers from the Runtime Library

Notice that `SleepTransformer` does not hardcode class names or method strings like `"UnibasicOsRuntime.sleep"`.

In naive transpiler designs, transformers often embed ad-hoc method strings directly into generated calls. This creates severe technical debt: runtime method names and signatures become scattered across dozens of transformer classes. If the runtime team renames a method or alters a parameter type, the transpiler silently generates broken Java code.

To prevent this coupling, every construct that requires runtime assistance delegates to our **[Target Runtime Library](/en/blog/building_the_target_runtime/)** through a structured two-layer abstraction:

1. **Typed Call Candidates (`RuntimeCallCandidates`):** Every operation requiring runtime support is modeled as an immutable Java record (such as `RuntimeCallCandidates.SleepCandidate(duration)` or `ConvertCandidate(variable, search, replace)`). The transformer simply packages its lowered expressions into this record.
2. **Centralized Resolution (`RuntimeCallFactory`):** The transformer passes the candidate to `runtimeCallFactory.resolve(candidate)`. The factory looks up the candidate in a centralized catalog (`RuntimeCallMappings`), validates argument counts and type bindings, and constructs the strongly-typed `Statement.Call.Runtime` node.

This candidate-driven pattern keeps transformers completely decoupled from runtime implementation details. Furthermore, as discussed in [Building the Target Runtime: Contract-First Development and Automated Stub Generation](/en/blog/building_the_target_runtime/#contract-first-development-and-automated-stub-generation), this centralized registry acts as a single source of truth: our build tools use Java reflection to inspect all `RuntimeCallCandidates` records and automatically generate the Java interface stubs and contracts for the runtime library team, eliminating any possibility of interface drift.

---

#### The Contract of the Transformer

The Transformer marks the definitive boundary between legacy semantics and modern target code:

* **Input:** A semantically validated, type-stamped `UnibasicProgram` (Source AST).
* **Output:** A fully structured, object-oriented `JavaProgram` (Target AST).

Once a program crosses this boundary, :h[**no Source AST node ever appears in the pipeline again**]. The legacy source language has been completely lowered into Java representations. The remaining stages operate exclusively on the Target AST to optimize declarations and emit production-ready source files.

---

### Stage 6: The Fact Promoter

Once Stage 5 finishes lowering UniBasic into Java, the resulting `JavaProgram` is structurally a Target AST, but it is not yet valid, compilable Java.

This brings us to **Stage 6: The Fact Promoter**.

Just as Semantic Analysis (SEMA) resolves legacy semantic quirks within the Source AST, Fact Promotion resolves Java semantic, scoping, and architectural requirements within the Target AST.

---

#### 1. Why We Need Fact Promotion: The Domain Mismatch

Why can't the Transformer directly emit finished Java AST nodes? Why do we need an entire analysis stage after transformation?

The answer lies in the fundamental **domain mismatch** between a legacy procedural language and an object-oriented language like Java.

In UniBasic, programs follow a flat procedural execution model:
* A file's main `SUBROUTINE` declaration acts as the program entry point.
* Internal subroutines are simply labels within the same file, jumped to via `GOSUB LABEL`. These labels share all variables in the file freely.
* Variables have no types or explicit declarations: assigning to a variable simply causes it to spring into existence.

When the Transformer lowers this procedural program into an object-oriented Java structure:
* The program becomes a Java class (`Statement.Class`).
* The top-level `SUBROUTINE` becomes the class's **`public` method** (the entry point).
* Every internal `GOSUB` jump label is transformed into a **`private` method** on that same class.

This structural mapping immediately exposes Java-specific domain constraints that did not exist in the legacy source:

1. **Local Variables vs. Class Fields:** In UniBasic, internal jump labels freely access variables initialized by the main code. In Java, a private method cannot access another method's local stack frame. If a variable is read or written across both the public entry method and a private label method, it cannot remain a method-local variable: it must be **promoted to an instance field** on the class (`FieldCollector` and `FieldReferenceRewriter`).
2. **Variable Declaration Hoisting:** In UniBasic, assigning a variable inside a conditional block makes it available everywhere downstream. But in Java, local variables are lexically scoped to the block `{ ... }` in which they are declared:
   ```basic
   IF STATUS = "ACTIVE" THEN
       BALANCE = 100
   ELSE
       BALANCE = 0
   END
   PRINT BALANCE
   ```
   If a transpiler naively translates the first assignment to `var balance = 100;` inside the `if` block, Java scoping rules cause a build failure:
   ```java
   if (status.equals("ACTIVE")) {
       var balance = 100; // Scoped strictly to this block!
   } else {
       var balance = 0;   // Scoped strictly to this block!
   }
   System.out.println(balance); // Java build error: cannot find symbol 'balance'
   ```
   Because variables declared inside `{ ... }` blocks cease to exist when the block exits, their declarations must be **hoisted** to the enclosing method level before the block so they remain in scope for subsequent statements (`BlockAssignmentHoistRewriter` and `LocalDeclarationRewriter`).
3. **Method Name Conflicts:** When a parameterless UniBasic subroutine has the same name as an internal jump label, both lower to zero-argument methods with identical names (`public void copyUatbs()` and `private void copyUatbs()`). Java rejects this as an illegal duplicate method declaration (`MethodNameClashRewriter`).
4. **JVM Method Bytecode Limits:** The JVM imposes a strict 64 KB bytecode limit per method. A monolithic legacy program spanning thousands of lines easily breaches this limit and must be split across chained private methods (`LongClassSplitter`).

Notice why these issues could never be addressed in SEMA: **SEMA operates in the UniBasic world**, where classes, fields, lexical block scoping, and JVM limits do not exist. Fact Promotion operates **100% within the Target AST world** to reconcile these Java-specific domain constraints.

---

#### 2. Architectural Symmetry: SEMA on the Target AST

Architecturally, `FactPromoter` is designed with the exact same discipline as `SemanticAnalyser`. It runs a sequential pipeline of isolated **micro-rewriters** across the Target AST:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.fact;

public class FactPromoter {

    public JavaProgram collect(JavaProgram program) {
        Statement.Class classStatement = program.classStatement();

        // Sequential pipeline of micro-rewriters across the Target AST
        classStatement = this.methodNameClashRewriter.rewrite(classStatement);
        classStatement = this.blockAssignmentHoistRewriter.rewrite(classStatement);
        classStatement = this.localDeclarationRewriter.rewrite(classStatement);
        // Additional passes: field promotion, method splitting, import hoisting

        return new JavaProgram(program.unibasicProgramName(), classStatement);
    }
}
```

In our transpiler, `FactPromoter` coordinates **fifteen specialized passes** over the Target AST. Rather than detailing every single pass, consider a few representative examples that illustrate how Fact Promotion adapts code to Java's semantic and scoping model:

* **`MethodNameClashRewriter`:** Detects collisions where a parameterless subroutine and an internal jump label share the same name. It renames the private helper to `routine<Name>` and updates internal call sites to prevent duplicate method declaration errors in Java.
* **`BlockAssignmentHoistRewriter`:** Identifies variables assigned inside conditional branches or loop bodies and hoists declaration hints to the enclosing method level, ensuring variables do not fall out of lexical scope downstream.
* **`FieldCollector` and `FieldReferenceRewriter`:** Scans methods across the class to identify variables accessed across both the public entry method and private label methods, promoting them into class-level instance fields (`this.fieldName`).
* **`LongClassSplitter`:** Breaks monolithic methods spanning thousands of lines into chained private methods, keeping every generated method well under the JVM 64 KB bytecode limit.
* **`LocalDeclarationRewriter`:** Finds the first assignment to each remaining method-local variable and transforms it into a `var` declaration (`var balance = 100;`), eliminating manual type bookkeeping during emission.

The design patterns mirror SEMA completely:
* **Pure Immutable Target AST:** AST nodes are immutable records. Rewriters create new nodes rather than mutating existing ones.
* **External Visitor Pattern:** Tree walking is externalized via `fact.StatementRewriteVisitor` and `fact.RecursiveStatementRewriteVisitor`.
* **Micro-Rewriters:** Each pass owns exactly one responsibility: `FieldCollector` only collects shared fields, `MethodNameClashRewriter` only resolves clashing method names, and `LocalDeclarationRewriter` only places `var` declarations on first assignments.

---

#### 3. A Concrete Fact Promotion Pass: MethodNameClashRewriter

To see how Fact Promotion resolves target domain constraints using the Visitor pattern, consider `MethodNameClashRewriter`.

In UniBasic, a subroutine declaration becomes a public method in Java, while internal jump labels become private helper methods. When a subroutine takes zero parameters and contains an internal label with the exact same name as the program, lowering produces a direct method name conflict:

```basic
! Inside program COPY.UATBS (no parameters)
GOSUB COPY.UATBS
...
COPY.UATBS:
  PRINT "PERFORMING COPY"
  RETURN
```

When lowered to Java, the program becomes class `CopyUatbs`. The main routine becomes `public void copyUatbs()`, and the internal label becomes `private void copyUatbs()`:

```java
public class CopyUatbs {
    public void copyUatbs() {
        this.copyUatbs(); // Ambiguous call: which copyUatbs is meant?
    }

    private void copyUatbs() { // Java build error: duplicate method copyUatbs()
        System.out.println("PERFORMING COPY");
    }
}
```

Because both methods share the exact same name and zero arguments, Java rejects this as an illegal duplicate method declaration. Furthermore, calling `this.copyUatbs()` becomes ambiguous and can trigger infinite recursion.

To resolve this conflict, the transpiler must do two things:
1. Rename the private helper method declaration from `copyUatbs` to `routineCopyUatbs`.
2. Locate and rewrite every private call site calling `copyUatbs()` anywhere across the entire class, even if buried inside deeply nested `if` statements, loops, or `try-catch` blocks.

How does Fact Promotion locate and rewrite these call sites without writing hundreds of lines of mechanical tree-walking code?

The answer is that :h[**Fact Promotion rewriters use the exact same External Visitor Pattern as SEMA**].

`MethodNameClashRewriter` delegates this traversal to a dedicated Target AST visitor, `PrivateMethodRenamer`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.fact;

import com.unibasictojava.transpiler.target.ast.Statement;
import com.unibasictojava.transpiler.transformer.JavaNamingConvention;

import java.util.List;
import java.util.Optional;

public class MethodNameClashRewriter {

    public Statement.Class rewrite(Statement.Class classStatement) {
        Optional<Statement.Method> clashingMethod = classStatement.privateMethodNamedLikeThePublicMethod();
        if (clashingMethod.isEmpty()) {
            return classStatement;
        }

        String clashingName = clashingMethod.get().methodName();
        String newName = JavaNamingConvention.prefixedMethodName(clashingName); // such as routineCopyUatbs
        
        PrivateMethodRenamer renamer = new PrivateMethodRenamer(clashingName, newName);
        List<Statement.Method> methods = classStatement.methods().stream()
                .map(renamer::rewrite)
                .toList();

        return classStatement.withMethods(methods);
    }

    /**
     * Target AST visitor that renames private method calls across nested statement trees.
     * Note: This is fact.RecursiveStatementRewriteVisitor operating on the Java Target AST,
     * distinct from source.ast.RecursiveStatementRewriteVisitor used during SEMA.
     */
    static final class PrivateMethodRenamer implements RecursiveStatementRewriteVisitor {

        private final String oldName;
        private final String newName;

        PrivateMethodRenamer(String oldName, String newName) {
            this.oldName = oldName;
            this.newName = newName;
        }

        Statement.Method rewrite(Statement.Method method) {
            boolean isClashing = method.visibility() == Statement.Method.Visibility.PRIVATE 
                    && method.methodName().equals(oldName);
            String name = isClashing ? newName : method.methodName();
            return new Statement.Method(name, method.parameters(), this.rewriteBody(method.body()), method.visibility());
        }

        @Override
        public Statement visit(Statement.Call.Private statement) {
            return statement.methodName().equals(oldName) 
                    ? new Statement.Call.Private(newName) 
                    : statement;
        }
    }
}
```

Notice how `PrivateMethodRenamer` operates as a pure Target AST visitor:

* **Target AST vs. Source AST Visitors:** Note that this is `com.unibasictojava.transpiler.fact.RecursiveStatementRewriteVisitor`, the Java AST counterpart of `source.ast.RecursiveStatementRewriteVisitor`. While the source visitor traverses UniBasic statements (`MATREAD`, `EQUATE`, `GOSUB`), this target visitor traverses Java statements (`Statement.If`, `Statement.Loop`, `Statement.TryCatch`, `Statement.Call.Private`).
* **Zero Traversal Boilerplate:** `PrivateMethodRenamer` does not need to write visitor methods for `Statement.If`, `Statement.Loop`, `Statement.For`, or `Statement.TryCatch`. The base `RecursiveStatementRewriteVisitor` handles recursive traversal through compound statement bodies automatically.
* **Targeted Dispatch:** The visitor overrides only the exact AST node it cares about: `visit(Statement.Call.Private)`. When it encounters a private call targeting `oldName`, it returns a new `Statement.Call.Private(newName)`. All other statement types pass through untouched.
* **Declaration Renaming:** When visiting method declarations, it checks whether the method is `PRIVATE` and matches `oldName`, renaming the declaration to `routineCopyUatbs`. The public `copyUatbs()` method retains its original name and signature, ensuring external callers remain completely unaffected.

This architectural symmetry proves that whether analyzing legacy UniBasic constructs or adapting modern Java constructs, :h[**our transpiler relies on the same decoupled visitor patterns across both source and target domains**].

---

#### The Contract of Fact Promotion

Fact Promotion ensures that lowered Target AST trees adhere strictly to Java's semantic and scoping rules:

* **Input:** A raw `JavaProgram` produced by the Transformer, where variables and methods still reflect procedural UniBasic scoping.
* **Output:** A semantically sound `JavaProgram` with promoted class fields, properly scoped local declarations, resolved method name clashes, and hoisted imports.

Once Fact Promotion finishes, :h[**the Target AST is guaranteed to represent syntactically and semantically valid Java**]. The final stage, the Emitter, does not need to compute scopes, detect fields, or worry about name collisions. Its only job is to print the code.


---

### Stage 7: The Emitter

Once Fact Promotion finishes, the AST has reached its final form. It is a valid, semantically sound `JavaProgram` Target AST. Every variable declaration has been placed, every class field has been promoted, and every method name clash has been resolved.

This brings us to the final stage of the pipeline: **Stage 7: The Emitter**.

The responsibility of the Emitter is straightforward: convert the in-memory Target AST into cleanly formatted Java source files on disk.

---

#### 1. The "Dumb" Serializer: Why Emitters Should Never Be Smart

In naive transpiler architectures, code emission is often treated as an informal exercise in string concatenation. A single monolithic visitor walks the AST, inspects statement kinds, evaluates type information, and appends strings to an ad-hoc `StringBuilder`:

```java
// Note: Code trimmed for brevity
// Antipattern: The "Smart" Emitter
if (node instanceof LegacyCall call) {
    if (call.isFunction()) {
        builder.append("var result = ");
    }
    builder.append("RuntimeHelpers.").append(call.name()).append("(");
    // string concatenation, manual indentation counting, comma tracking...
}
```

This pattern is a notorious trap. Mixing semantic decisions with string formatting creates a fragile codebase where minor indentation tweaks risk breaking language semantics, and testing requires parsing emitted text rather than asserting against structured data.

In our architecture, :h[**the Emitter is intentionally dumb**]:

1. **Zero Legacy Knowledge:** The Emitter has no awareness of UniBasic. It does not know what `MATREAD`, `GOSUB`, or `EQUATE` mean. It only understands Java AST nodes.
2. **Zero Semantic Decisions:** The Emitter performs no type checking, no scope calculations, and no statement restructuring. All semantic problems were already resolved in SEMA (for UniBasic) and Fact Promotion (for Java).
3. **Pure String Printing:** The Emitter's sole responsibility is serialization: walking the Target AST and generating formatted, indented Java code with correct braces and semicolons.

---

#### 2. The Two-Tier Architecture: Emitters and Templates

To keep serialization modular and maintainable, code emission is split into two cleanly separated tiers:

```text
Target AST Node (such as Statement.If)
       │
       ▼
[AST-Aware Emitter] (such as IfEmitter)
       │ builds
       ▼
[Syntax-Aware Template] (such as FixedLayoutTemplate.ifElse)
       │ renders
       ▼
Formatted Java Source Text
```

* **Emitters are AST-Aware:** An `Emitter` understands what a `target.ast` node means. It inspects an AST record, dispatches child nodes to child emitters, and composes high-level syntax templates. However, an emitter never performs direct string formatting.
* **Templates are Syntax-Aware:** A `Template` knows how Java constructs appear on the page. It manages indentation levels, braces, parentheses, commas, and line breaks. A template has zero knowledge of the AST: it only knows how to turn itself into a `String` at a requested indentation depth.

The foundation of the AST-aware tier is the abstract `Emitter` base class:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.emitter;

import com.unibasictojava.transpiler.target.ast.Statement;
import com.unibasictojava.transpiler.target.emitter.template.Template;

public abstract class Emitter {

    public final Template emit(Statement statement) {
        Template template = this.emitStatement(statement);
        return this.needsStatementTerminator() ? template.addStatementTerminator() : template;
    }

    protected abstract Template emitStatement(Statement statement);

    protected abstract boolean needsStatementTerminator();
}
```

Notice the Template Method pattern in `emit()`. In Java, simple statements (such as variable assignments, method calls, and `return` statements) require a trailing semicolon `;`. Compound block statements (such as `if`, `for`, and `while` loops) end with a closing brace `}` and must not have a trailing semicolon.

Rather than scattering semicolon logic across string templates, the base `Emitter` enforces this distinction structurally. Every concrete subclass must implement `needsStatementTerminator()`. If a statement needs termination, the base class automatically wraps the template via `template.addStatementTerminator()`.

**Core Advantages of the Template Architecture**

The combination of the Template Method pattern in `Emitter` and the syntax-aware `Template` hierarchy provides several key architectural advantages:

1. **Enforcing Language Invariants at the Class Level:** Statement termination rules in Java are absolute. By structuring `emit()` as a Template Method, `Emitter` enforces this invariant at the class level. Every subclass is required to answer `needsStatementTerminator()`. A developer adding a new statement emitter cannot accidentally forget semicolons: the base class guarantees consistent application across the entire codebase.
2. **Decoupling AST Semantics from Formatting Rules:** Emitters remain strictly **AST-aware**: they inspect `target.ast` records and assemble syntax components, but contain zero knowledge of character formatting, newlines, or indentation counting. Conversely, templates remain strictly **syntax-aware**: they know how Java keywords, braces, parentheses, and indentation levels look on disk, but have zero knowledge of AST nodes. If formatting rules change (such as altering indentation width or brace placement), only `Template` classes are modified; not a single AST emitter is touched.
3. **Deferred Rendering and Contextual Indentation:** In naive transpilers using `StringBuilder`, indentation is tracked imperatively with mutable counters (`indent++`, `indent--`). A single missed decrement inside a nested conditional branch permanently skews indentation for every statement downstream. With the Template pattern, string generation is **deferred**. Emitters construct an in-memory template tree, and rendering only begins when `template.render(0)` is invoked on the root compilation unit. Each template renders its children contextually by passing `depth + 1`, making it mathematically impossible for nested blocks to corrupt indentation in sibling or enclosing statements.
4. **Isolated Unit Testability:** Emitters and templates can be verified independently. Emitter unit tests assert that given AST nodes produce the correct `Template` structures, while template unit tests verify exact indentation and line layouts without needing to instantiate AST trees.

Just like the Transformer and SEMA, statement emission is coordinated through a dedicated registry:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.emitter;

final class StatementsEmitterRegistry {

    private final Map<Class<?>, Emitter> emitters;

    StatementsEmitterRegistry(StatementsEmitter statementsEmitter) {
        Map<Class<?>, Emitter> map = new HashMap<>();
        map.put(Statement.Return.class,       new ReturnEmitter());
        map.put(Statement.If.class,           new IfEmitter(statementsEmitter));
        map.put(Statement.For.class,          new ForEmitter(statementsEmitter));
        map.put(Statement.Call.Runtime.class, new CallEmitter());
        // Additional registrations: assignments, loops, try-catch, comments, and so on

        this.emitters = Map.copyOf(map);
    }

    Optional<Emitter> lookup(Class<?> statementClass) {
        return Optional.ofNullable(emitters.get(statementClass));
    }
}
```

The top-level `StatementsEmitter` looks up the appropriate `Emitter` for each AST node in the registry and delegates emission. When an emitter encounters nested statement blocks (such as the body of an `if` statement or loop), it calls back into `StatementsEmitter.emitAll(...)`, enabling clean, recursive tree traversal.

---

#### 3. A Concrete Walkthrough: IfEmitter and FixedLayoutTemplate

To see this two-tier separation in practice, consider `IfEmitter`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.emitter.conditional;

public final class IfEmitter extends Emitter {

    @Override
    protected Template emitStatement(Statement statement) {
        Statement.If ifStatement = (Statement.If) statement;
        Template condition       = expressionEmitter.emit(ifStatement.condition());
        List<Template> thenBody  = statementsEmitter.emitAll(ifStatement.thenBody());

        return FixedLayoutTemplate.ifElse(condition, thenBody, this.emitElse(ifStatement));
    }

    @Override
    protected boolean needsStatementTerminator() {
        return false;
    }
}
```

Look at how concise this is:
* `IfEmitter` does not assemble strings or format braces. It extracts the condition expression, transforms it into a template via `ExpressionEmitter`, maps the body statements via `StatementsEmitter`, and passes them to `FixedLayoutTemplate.ifElse(...)`.
* If the statement represents a chained `else if`, it emits the nested `If` directly without enclosing braces, generating idiomatic `else if (...) { ... }` rather than deeply nested `else { if (...) { ... } }` blocks.
* Because an `if` block ends with `}`, `needsStatementTerminator()` returns `false`.

The corresponding `Template` interface defines the single formatting contract:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.emitter.template;

public interface Template {

    String render(int depth);

    default Template addStatementTerminator() {
        return depth -> this.render(depth) + ";";
    }
}
```

When `render(depth)` is called on the root template, it computes the exact indentation (such as four spaces per level) and recursively renders its nested children. Because every template manages its own layout, adding new language features or modifying code formatting never impacts AST lowering or semantic analysis.

---

#### The Contract of the Emitter

The contract of the Emitter concludes the transpilation pipeline:

* **Input:** A fully validated, fact-promoted `JavaProgram` Target AST.
* **Output:** A root `Template` hierarchy representing the complete Java class.

Once the Emitter produces the root template, all AST processing is done. Because templates are hierarchical, all that remains is for a renderer to evaluate the layout and a sink to write the output:

```java
// Note: Code trimmed for brevity
// 1. The Emitter constructs the hierarchical syntax Template from the Target AST
Template template = javaProgramEmitter.emit(javaProgram);

// 2. The Renderer renders the template to text and hands it to a Sink
String sourceText = template.render(0);
sink.sync(new RenderedFile(moduleName, javaProgram.packageName(), javaProgram.javaFileName(), sourceText));
```

A lightweight `Renderer` coordinates this final step with a pluggable `Sink`:
* **`Sink.Disk`:** Writes `.java` source files to disk within standard Gradle multi-module directory structures (`<outputDirectory>/<module>/src/main/java/<package path>/<file>`).
* **`Sink.InMemory`:** Captures rendered files in memory, allowing automated test suites to verify generated Java code across hundreds of programs in milliseconds without disk I/O overhead.

With the completion of Stage 7, :h[**the transformation from legacy MultiValue UniBasic to idiomatic, buildable Java is complete**].

---

### The Complete Pipeline in Action: Tracing an End-to-End Example

Now that we have examined all seven stages individually, let us trace a single statement as it journeys through the entire pipeline:

```basic
SLEEP DURATION + 5
```

Here is what happens at each stage:

| Stage | Operation | Representation / Output |
| :--- | :--- | :--- |
| **Stage 1: Source Discovery** | File intake and preprocessing | Resolves include dependencies and feeds raw UniBasic text into the pipeline. |
| **Stage 2: The Lexer** | Streaming tokenization | Produces token stream: `[KEYWORD_SLEEP, IDENTIFIER("DURATION"), PLUS, NUMBER("5")]`. |
| **Stage 3: The Parser** | Pratt expression parsing | Constructs Source AST node: `source.ast.Statement.Sleep(new Expression.Binary(new Expression.Variable("DURATION"), Operator.PLUS, new Expression.Constant(5)))`. |
| **Stage 4: SEMA** | Semantic analysis and validation | Resolves variable bindings, verifies arity, and validates expression validity. Returns type-stamped Source AST. |
| **Stage 5: The Transformer** | AST Lowering across domains | Lowers `Statement.Sleep` into `Statement.Call.Runtime` using `RuntimeCallCandidates.SleepCandidate`, mapping to `UnibasicRuntime.sleep(...)`. |
| **Stage 6: The Fact Promoter** | Target domain adaptation | Detects whether `duration` is local or shared. If shared with an internal label, promotes it to an instance field; otherwise hoists declaration as `var duration`. |
| **Stage 7: The Emitter** | Text serialization | `CallEmitter` wraps expressions into `FixedLayoutTemplate.runtimeCall`, `Emitter` appends `;`, and `Sink.Disk` writes the formatted line to disk: `UnibasicRuntime.sleep(duration + 5);`. |

---

### Key Architectural Takeaways

Building a production-grade transpiler capable of converting millions of lines of legacy business logic requires disciplined architectural patterns. The key lessons from our implementation include:

1. **Strict Stage Decoupling:** Every stage has a single, non-negotiable contract with defined inputs and outputs. The Lexer does not parse. The Parser does not validate types. The Transformer does not promote class fields. The Emitter does not make semantic decisions.
2. **Immutable ASTs Over In-Place Mutation:** AST nodes are immutable records. Modifications always construct new nodes. This prevents subtle spooky-action-at-a-distance bugs, makes micro-passes trivially testable, and allows safe multi-threaded processing.
3. **Dual-AST Architecture (Source vs. Target):** Never blend legacy language semantics with target language semantics in a single hybrid AST. Keeping `source.ast` and `target.ast` strictly separated isolates language quirks and keeps each AST clean, idiomatic, and strongly typed.
4. **Architectural Symmetry (SEMA vs. Fact Promotion):** Analysis passes on the Source AST (SEMA) address legacy domain quirks. Analysis passes on the Target AST (Fact Promotion) address target domain requirements. Both use identical external visitor patterns and micro-rewriters.
5. **Decoupled Runtime with Candidate Records:** Decouple code transformers from target runtime libraries using typed candidate records (`RuntimeCallCandidates`). Centralizing runtime bindings prevents interface drift and allows automated generation of runtime contracts.
6. **Two-Tier Serialization:** Keep emitters AST-aware and templates syntax-aware. Base classes enforce statement termination at build time, eliminating trailing semicolon errors and string concatenation spaghetti.

---

### What Is Next in the Series?

Now that we have explored the high-level architecture of the transpiler pipeline, the next article examines the engineering discipline required to keep a codebase of this scale maintainable.

Continue reading with [Inside a Transpiler (Part 2): Foundations of an Industrial Transpiler](/en/blog/foundations_of_an_industrial_transpiler/), where we explore the bedrock architectural patterns: two-tier ASTs, dumb emitters, decoupled runtimes, and multi-pass micro-rewriters.
