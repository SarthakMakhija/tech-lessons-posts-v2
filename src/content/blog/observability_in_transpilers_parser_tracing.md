---
author: "Sarthak Makhija"
title: "Observability in Transpilers: Parser Tracing"
description: "Why compiler stack traces fail you; introducing span-based tracing, sealOnFailure, and diagnostic reporting for deep syntax trees."
pubDate: 2026-11-21
weight: 3
tags: ["Compilers", "Transpiler", "Architecture", "Java", "Clean Code"]
draft: false
caption: "Observability in Transpilers: Parser Tracing"
---

When transpiling over 14,000 legacy files spanning millions of lines of code, parser failures are not edge cases; they are your daily reality.

With legacy proprietary languages like UniBasic, :h[**no formal grammar specification exists**]. There is no official language specification: only vendor manuals, and historical code written across different teams over thirty years. Furthermore, after inlining include files during Source Discovery, individual programs frequently swell beyond 4,000 lines.

When the parser crashes at line 3,240, a standard Java exception stack trace is useless. It tells you the exact token where the cursor gave up, but provides zero insight into which parent parser got lost, which delimiter was swallowed, or how the parser navigated into that broken state.

Stepping through thousands of tokens in an interactive debugger quickly paralyzes engineering velocity. To make progress, we needed complete diagnostic visibility inside the parser.

In this article, we explore how we brought observability into transpiler engineering: treating parser executions as hierarchical spans, sealing in-flight spans on failure, and generating diagnostic reports that pinpoint parser bugs in seconds.

---

### Source Discovery: Inlining Include Files into 4,000-Line Monoliths

In legacy business systems, modularity was achieved through include files (via `INCLUDE` or `$INCLUDE` statements). These include files define global variables, common memory blocks, system constants, and macro-like subroutine fragments.

Because UniBasic lacks a native module system or namespace isolation, a source file cannot be parsed in isolation until all of its include files are resolved. 

In our transpiler architecture, this resolution is performed upfront during the **Source Discovery** phase. Source discovery recursively resolves every include directive and copies the full contents of the referenced include files directly into the program source.

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
Source Discovery: Include File Inlining
</div>
<div class="p-5 sm:p-6 space-y-4">
<div class="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
<div class="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200/80 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono">
<span>PURCHASE.ORDER (Source File)</span>
<span class="rounded bg-zinc-200/70 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">200 lines</span>
</div>
<div class="space-y-1.5 font-mono text-xs sm:text-sm">
<div class="flex items-center justify-between rounded px-3 py-2 bg-sky-50 text-sky-900 border border-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-900/50">
<span class="font-bold">INCLUDE GLOBAL.DEFS</span>
<span class="text-xs text-sky-700 dark:text-sky-300 font-semibold font-sans">expands to 1,800 lines ↓</span>
</div>
<div class="flex items-center justify-between rounded px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/50">
<span class="font-bold">INCLUDE TAX.CALC</span>
<span class="text-xs text-amber-700 dark:text-amber-300 font-semibold font-sans">expands to 1,500 lines ↓</span>
</div>
<div class="rounded px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
TOTAL = PRICE * TAX
</div>
</div>
</div>
<div class="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
<div class="h-px w-12 sm:w-20 bg-zinc-200 dark:bg-zinc-800"></div>
<div class="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300">
<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
<span>Source Discovery (Recursive Inlining)</span>
</div>
<div class="h-px w-12 sm:w-20 bg-zinc-200 dark:bg-zinc-800"></div>
</div>
<div class="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
<div class="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200/80 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 font-mono">
<span>Expanded Compilation Unit (In-Memory Monolith)</span>
<span class="rounded bg-rose-100 px-2 py-0.5 text-rose-800 font-bold dark:bg-rose-950/60 dark:text-rose-300">3,500 - 4,000+ lines</span>
</div>
<div class="space-y-2 font-mono text-xs sm:text-sm">
<div class="rounded px-3 py-2 bg-sky-50 text-sky-900 border border-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-900/50">
<div class="font-bold text-sky-800 dark:text-sky-300">[ GLOBAL.DEFS contents ]</div>
<div class="text-xs text-sky-600 dark:text-sky-400 font-sans mt-0.5">1,800 lines of shared variables, common memory blocks, and constants</div>
</div>
<div class="rounded px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200/70 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-900/50">
<div class="font-bold text-amber-800 dark:text-amber-300">[ TAX.CALC contents ]</div>
<div class="text-xs text-amber-600 dark:text-amber-400 font-sans mt-0.5">1,500 lines of tax calculations and rule tables</div>
</div>
<div class="rounded px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
TOTAL = PRICE * TAX
</div>
</div>
</div>
</div>
</div>

A business program that started as a modest 200-line routine routinely expands into a **3,000 to 4,000+ line monolith** of dense, contiguous code before the parser ever reads its first token.

---

### Why Compiler Stack Traces Fail You

When a recursive descent parser fails 3,200 lines into an inlined file, a standard Java exception stack trace is virtually useless.

The stack trace tells you that `ParseException` was thrown at line 3,240 on token `PRINT`:

```text
com.unibasictojava.transpiler.source.parser.exception.ParseException: 
    Unexpected token 'PRINT' at line 3240
    at StatementParser.parse(StatementParser.java:58)
    at IfParser.parse(IfParser.java:42)
    at ProgramParser.parse(ProgramParser.java:19)
```

The stack trace tells you where the cursor gave up, but it reveals zero information about *why* the parser was in that state, or *which* grammar construct caused the misalignment.

In a recursive descent parser, syntax failures rarely happen at the site of the actual defect. Instead, they occur because an upstream parser somewhere in the recursive call hierarchy either **over-consumed** or **under-consumed** tokens:

* **Over-Consumption:** A parser consumes too many tokens, inadvertently swallowing a delimiter, a keyword, or a trailing token that belonged to an enclosing block.
* **Under-Consumption:** A parser exits too early, leaving trailing tokens unconsumed on the input stream so that the subsequent parser starts at the wrong cursor position.

#### A Concrete Example: The Missing Loop Terminator

Consider this minimal legacy program:

```basic
1  LEASE.COUNT = 0
2  LOOP
3     LEASE.COUNT = LEASE.COUNT + 1
4  END
5  RETURN
```

In UniBasic, loops begin with the `LOOP` keyword and must conclude with `REPEAT`. The `END` keyword is reserved for terminating conditional blocks (`IF`), multi-branch statements (`BEGIN CASE`), or subroutines.

On line 4, the developer mistakenly wrote `END` instead of `REPEAT`.

Here is how our parser processes this program using the architecture introduced in the previous article ([Foundations of an Industrial Transpiler](/en/blog/foundations_of_an_industrial_transpiler/#12-composable-statement-dispatch-parsers--transformers)):

Recall that `StatementParser` dispatches statements modularly via `StatementParserRegistry`:
* It inspects the token type at the cursor and queries the registry.
* If the token matches a registered statement keyword (such as `LOOP`, `FOR`, or `IF`), the registry invokes that specific statement parser.
* If the token is not a registered keyword, `StatementParser` falls back to `AssignmentParser` (`.orElseGet(this::parseAssignment)`), assuming the statement must be a variable assignment.

Now, trace how this dispatch plays out across the five lines:

<div class="not-prose my-6 overflow-hidden rounded-xl border border-zinc-200 bg-white font-mono text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
<div class="overflow-x-auto min-w-full">
<div class="min-w-[560px]">
<div class="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
<div class="col-span-1">Line</div>
<div class="col-span-3">Source Code</div>
<div class="col-span-4">Registry Dispatch</div>
<div class="col-span-4">Parser Action &amp; State</div>
</div>
<div class="divide-y divide-zinc-100 text-zinc-700 dark:divide-zinc-850 dark:text-zinc-300">
<div class="grid grid-cols-12 items-center px-4 py-2.5">
<div class="col-span-1 font-bold text-zinc-400">1</div>
<div class="col-span-3 font-semibold text-zinc-900 dark:text-zinc-100">LEASE.COUNT = 0</div>
<div class="col-span-4 text-zinc-500">Registry miss (Identifier)</div>
<div class="col-span-4"><span class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold">AssignmentParser</span> advances to line 2</div>
</div>
<div class="grid grid-cols-12 items-center px-4 py-2.5 bg-indigo-50/30 dark:bg-indigo-950/20">
<div class="col-span-1 font-bold text-indigo-500">2</div>
<div class="col-span-3 font-semibold text-indigo-900 dark:text-indigo-200">LOOP</div>
<div class="col-span-4 text-indigo-600 dark:text-indigo-400 font-semibold">Registry hit (TokenType.Loop)</div>
<div class="col-span-4"><span class="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold">LoopParser</span> opens compound body</div>
</div>
<div class="grid grid-cols-12 items-center px-4 py-2.5">
<div class="col-span-1 font-bold text-zinc-400">3</div>
<div class="col-span-3 font-semibold text-zinc-900 dark:text-zinc-100">LEASE.COUNT = ...</div>
<div class="col-span-4 text-zinc-500">Registry miss (Identifier)</div>
<div class="col-span-4"><span class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold">AssignmentParser</span> parses inner statement</div>
</div>
<div class="grid grid-cols-12 items-center px-4 py-2.5 bg-amber-50/40 dark:bg-amber-950/20">
<div class="col-span-1 font-bold text-amber-600">4</div>
<div class="col-span-3 font-semibold text-amber-900 dark:text-amber-200">END</div>
<div class="col-span-4 text-amber-700 dark:text-amber-400">Not REPEAT! Fallback kicks in</div>
<div class="col-span-4 flex items-center gap-1.5">
<span class="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold">AssignmentParser</span>
<span>Invoked; awaits '='</span>
</div>
</div>
<div class="grid grid-cols-12 items-center px-4 py-2.5 bg-rose-50/40 dark:bg-rose-950/20">
<div class="col-span-1 font-bold text-rose-600">5</div>
<div class="col-span-3 font-semibold text-rose-900 dark:text-rose-200">RETURN</div>
<div class="col-span-4 text-rose-600 dark:text-rose-400">Encountered RETURN; no '=' found</div>
<div class="col-span-4 flex items-center gap-1.5">
<span class="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800 border border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-700 font-bold">💥 Crash Site</span>
<span>Fails: missing '=' operator</span>
</div>
</div>
</div>
</div>
</div>
</div>

* **The Misdirection at Line 4:** Because `END` does not close a loop (`REPEAT` does), `LoopParser` assumed the loop body was continuing and delegated back to `StatementParser`. Because `END` is a closing terminator rather than a statement-starting keyword, the registry returned empty. `StatementParser` fell back to `AssignmentParser`, treating `END` as the target of an assignment (`END = ...`).
* **The Failure at Line 5:** `AssignmentParser` proceeded, expecting an assignment operator (`=`). Instead, the cursor met `RETURN` on line 5. Because there was no `=` operator, `AssignmentParser` failed and threw a `ParseException` at `RETURN`.

When you run this through a standard compiler without observability, the error output says:

```text
ParseException: Unexpected token 'RETURN' at line 5
```

If an engineer relies on this error message, they look at line 5: `RETURN` is completely valid UniBasic syntax! The stack trace points to line 5, but the real defect was on line 4 (`END` instead of `REPEAT`). 

`LoopParser` never closed: it invoked `AssignmentParser` on line 4, which failed at `RETURN` on line 5 because no assignment operator (`=`) followed.

In a 4,000-line inlined file with deeply nested loops and conditionals, diagnosing this failure mode with step debugging is an exercise in frustration.

---

### How the Idea Originated: From Token Bounds to Observability Spans

To solve this diagnostic blind spot, we began with a simple observation: :h[**every parser execution begins on a specific token and ends on a specific token**].

We needed an abstraction to capture this starting token and ending token for each parser that ran.

However, statements are not flat; they are inherently **hierarchical**. A compound construct like an `IF` statement contains multiple nested statements within its body:

```basic
1  IF P > Q THEN
2      X = 10
3      Y = 20
4  END
```

In this snippet:
* `IfParser` is the parent span, starting at `[line 1, IF]` and concluding at `[line 4, END]`.
* Nested inside `IfParser` are two child parser executions for the statements in its body:
  * `AssignmentParser` for `X = 10` (starting at `[line 2, X]` and concluding at `[line 3, Y]`).
  * `AssignmentParser` for `Y = 20` (starting at `[line 3, Y]` and concluding at `[line 4, END]`).

This parent-child relationship closely mirrors **Observability Tracing** in distributed systems.

In distributed tracing (such as OpenTelemetry), when an end-to-end request traverses multiple microservices, each discrete unit of work is modeled as a **span** with a start time, an end time, and a parent span. The entire tree of spans forms a **trace**.

In a compiler frontend, the execution model is identical:
* The transaction duration is measured not in clock milliseconds, but in **token cursor advancement**.
* An individual statement parser execution is a **Span**: it captures the parser runtime class, its nesting depth, its start token, and its end token.
* The ordered collection of spans across a compilation unit forms a **Trace**.

Here is how that hierarchical relationship looks visually across nested statement parsers:

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white font-mono text-xs sm:text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400 font-sans">
Hierarchical Parser Spans
</div>
<div class="p-5 space-y-1.5 leading-relaxed">
<div class="flex items-center gap-2">
<span class="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/60 dark:text-purple-300">IfParser</span>
<span class="text-zinc-400 dark:text-zinc-500 font-bold">:</span>
<span class="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">[line 1, IF] → [line 4, END]</span>
</div>
<div class="text-zinc-300 dark:text-zinc-700 pl-4 font-bold select-none">│</div>
<div class="flex items-center gap-2 pl-4">
<span class="text-zinc-400 dark:text-zinc-600 font-bold select-none">├──</span>
<span class="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 font-semibold text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/60 dark:text-sky-300">AssignmentParser</span>
<span class="text-zinc-400 dark:text-zinc-500 font-bold">:</span>
<span class="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">[line 2, X] → [line 3, Y]</span>
</div>
<div class="text-zinc-300 dark:text-zinc-700 pl-4 font-bold select-none">│</div>
<div class="flex items-center gap-2 pl-4">
<span class="text-zinc-400 dark:text-zinc-600 font-bold select-none">└──</span>
<span class="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">AssignmentParser</span>
<span class="text-zinc-400 dark:text-zinc-500 font-bold">:</span>
<span class="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">[line 3, Y] → [line 4, END]</span>
</div>
</div>
</div>

---

### The Mechanics: `openSpan`, `closeSpan`, and `sealOnFailure`

The contract for parser tracing is captured by the `ParserTrace` interface:

```java
public interface ParserTrace {
    void openSpan(Class<?> parserClass, Token startToken);
    void closeSpan(Token endToken);
    void sealOnFailure(Token failureToken);
    ParserTraceEntries entries();
}
```

The underlying implementation, `CollectingParserTrace`, maintains an active stack of in-flight spans:

```java
public final class CollectingParserTrace implements ParserTrace {
    private final Deque<ParserSpan> openSpans    = new ArrayDeque<>();
    private final List<ParserTraceEntry> entries = new ArrayList<>();
    private int currentDepth                     = 0;
    private int spanId                           = 0;
    private boolean sealed                       = false;

    @Override
    public void openSpan(Class<?> parserClass, Token startToken) {
        openSpans.push(new ParserSpan(parserClass, startToken, currentDepth, spanId));
        spanId++;
        currentDepth++;
    }

    @Override
    public void closeSpan(Token endToken) {
        currentDepth--;
        ParserSpan span = openSpans.pop();
        span.closeWith(endToken);
        entries.add(new ParserTraceEntry(span));
    }
}
```

The lifecycle of each span operates as follows:

1. **`openSpan`:** When a statement parser begins, `openSpan` pushes a new `ParserSpan` onto the `openSpans` stack and increments `currentDepth`.
2. **`closeSpan`:** When the parser successfully completes, `closeSpan` pops the span from the stack, decrements `currentDepth`, records the cursor's current token as `endToken`, and appends the completed entry to the trace history.

#### The Problem of In-Flight Spans on Failure

What happens when an unexpected token causes a `ParseException` deep inside a nested grammar construct?

In standard Java, an exception immediately unwinds the call stack. If four statement parsers were actively running (`SubroutineParser` → `LoopParser` → `IfParser` → `AssignmentParser`), normal control flow is aborted. None of their `closeSpan` methods ever execute. Without intervention, their diagnostic context would simply vanish into thin air.

To prevent this, `ParserTrace` introduces :h[**`sealOnFailure`**]:

```java
@Override
public void sealOnFailure(Token failureToken) {
    if (sealed) {
        return;
    }
    sealed = true;
    while (!openSpans.isEmpty()) {
        ParserSpan span = openSpans.pop();
        span.closeWith(failureToken); // [!code focus]
        entries.add(new ParserTraceEntry(span)); // [!code focus]
    }
}
```

When a `ParseException` occurs, `sealOnFailure` pops every in-flight span from the active stack, marks each one as closed at the exact token where the cursor failed, and adds them all to the completed trace.

The entire trace is then attached directly to the `ParseException` object, ensuring zero diagnostic information is lost.

---

### The Architectural Beauty of `StatementParserRegistry`

Tracing is a classic **cross-cutting concern**. If individual statement parsers had to manually open and close spans, compiler code would quickly degrade into an unmaintainable tangle of boilerplate:

```java
// ANTIPATTERN: Polluting parsers with cross-cutting tracing concerns
public class IfParser {
    public Statement parse() {
        trace.openSpan(IfParser.class, cursor.peek());
        try {
            // ... parsing logic ...
            trace.closeSpan(cursor.peek());
            return result;
        } catch (ParseException exception) {
            trace.sealOnFailure(cursor.peek());
            throw exception;
        }
    }
}
```

Multiplying this across 60+ statement parsers would pollute grammar rules with repetitive ceremony, invite missed `closeSpan` bugs, and tightly couple every parser class to the tracing subsystem.

Instead, we leveraged the **modular statement registry** introduced in [Pillar 1](/en/blog/foundations_of_an_industrial_transpiler/#12-composable-statement-dispatch-parsers--transformers).

In `StatementParserRegistry`, all statement parsers are registered in a single central map:

```java
public final class StatementParserRegistry {
    private final Map<TokenType, Entry> parsers = new HashMap<>(); // [!code focus]
    private final TokenCursor cursor;
    private final ParserTrace parserTrace;
    
    // ...
}
```

Because `StatementParserRegistry` owns the construction and dispatch of every statement parser, :h[**it wraps each parser transparently with tracing outside the parser classes themselves**]:

```java
parsers.put(TokenType.If,   Entry.of(traced(IfParser.class,   new IfParser(cursor, statementParser)::parse))); // [!code focus]
parsers.put(TokenType.For,  Entry.of(traced(ForParser.class,  new ForParser(cursor, statementParser)::parse))); // [!code focus]
parsers.put(TokenType.Loop, Entry.of(traced(LoopParser.class, new LoopParser(cursor, statementParser)::parse))); // [!code focus]
```

The `traced` helper encapsulates the complete span lifecycle in one central method:

```java
Supplier<Statement> traced(Class<?> parserClass, Supplier<Statement> parser) {
    return () -> this.runWithTrace(parserClass, parser);
}

private Statement runWithTrace(Class<?> parserClass, Supplier<Statement> parser) {
    parserTrace.openSpan(parserClass, cursor.peek().orElseGet(Token::endOfSource)); // [!code focus]
    try {
        Statement result = parser.get();
        parserTrace.closeSpan(cursor.peek().orElseGet(Token::endOfSource)); // [!code focus]
        return result;
    } catch (ParseException exception) {
        parserTrace.sealOnFailure(cursor.peek().orElseGet(Token::endOfSource)); // [!code focus]
        exception.attachTrace(parserTrace);
        throw exception;
    }
}
```

#### Why This Design is a Massive Architectural Win

1. **Zero Tracing Code in Parsers:** Individual statement parsers (`IfParser`, `ForParser`, `LoopParser`) are 100% pure. They take a cursor, execute grammar rules, and return an AST node. They know nothing about `ParserTrace`, `ParserSpan`, or telemetry.
2. **Strictly Additive Extensions:** When adding a new statement parser to the transpiler, the author simply writes the parser class and registers it in `StatementParserRegistry`. Tracing is automatically inherited with zero extra code.
3. **Zero-Allocation Production Mode:** In production, tracing overhead can be eliminated entirely via polymorphism. By substituting `NoOperationParserTrace` (where `openSpan` and `closeSpan` are no-ops), the transpiler executes without allocating span objects or tracking token positions. During development or when the command-line interface runs with `--trace`, `CollectingParserTrace` is plugged in.

---

### Diagnosing Failures: Reading Traces Bottom-Up

When a parse fails, the transpiler command-line interface formats the attached `ParserTrace` into an indented diagnostic report.

Let's return to our earlier example:

```basic
1  LEASE.COUNT = 0
2  LOOP
3     LEASE.COUNT = LEASE.COUNT + 1
4  END
5  RETURN
```

When executed with `--trace`, the CLI outputs the following trace report:

```text
PARSE TRACE  COUNT.LEASES
────────────────────────────────────────────────────────────
AssignmentParser                     LEASE.COUNT → LOOP  (line 1 → 2)
LoopParser                           LOOP →   (line 2 → 5)
  AssignmentParser                     LEASE.COUNT → END  (line 3 → 4)
  AssignmentParser                     END →   (line 4 → 5)
```

Instead of stepping through tokens in a debugger, :h[**an engineer diagnoses the root cause in seconds by reading the trace bottom-up**]:

1. **Look at the bottom-most entry:** The innermost parser executing at the moment of failure was `AssignmentParser`, starting at `END` on line 4 and halting at line 5. 
2. **Ask why it ran:** Why was `AssignmentParser` executing on line 4? Because `StatementParser` fell back to its default assignment rule.
3. **Look at the enclosing parent span:** Directly above it is `LoopParser`, which opened on line 2 (`LOOP`) and stayed active all the way to line 5 (`LOOP → (line 2 → 5)`).
4. **The root cause is immediately obvious:** `LoopParser` opened on line 2 and never found `REPEAT`. It took line 4's `END` as an assignment, and the parse failed on line 5.

By inspecting the starting and concluding tokens of the bottom-most spans, you instantly spot where the parser crossed an unexpected boundary without ever guessing or inspecting stack traces.

---

### Summary

When modernizing thousands of undocumented legacy files, treating the compiler front-end as a black box is a recipe for stalled projects. 

By treating parser executions as observability spans and decoupling tracing into `StatementParserRegistry`, we transformed parser debugging from guesswork into a deterministic science.

In the next installment of this series, we will examine the runtime layer: **[The Target Runtime for Transpiled Code](/en/blog/building_the_target_runtime/)**, exploring how generated code emulates legacy dynamic semantics in Java and how candidate abstractions enable contract-first stub generation.
