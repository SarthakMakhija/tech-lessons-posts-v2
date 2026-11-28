---
author: "Sarthak Makhija"
title: "Inside a Transpiler (Part 3): The Target Runtime for Transpiled Code"
description: "Why transpiled code needs a dedicated target runtime: dynamic types, reference cells, and contract-first stub generation."
pubDate: 2026-11-25
weight: 3
tags: ["Compilers", "Transpiler", "Architecture", "Java", "Runtime"]
draft: false
caption: "Inside a Transpiler (Part 3): The Target Runtime for Transpiled Code"
---

When engineers think about writing a transpiler, they usually picture the front end: lexing source text, building a parser, constructing an Abstract Syntax Tree (AST), and printing equivalent Java statements.

In reality, parsing and AST transformations are only half the battle. 

A transpiler without a runtime library is an engine without a chassis. When migrating code between languages with fundamentally different execution models, you quickly realize that :h[**you cannot translate source syntax directly into bare target-language primitives**].

UniBasic and Java reside on opposite ends of the language spectrum. UniBasic is dynamically typed, features 1-based indexing, executes subroutines via universal pass-by-reference, stores hierarchical data inside dynamic strings separated by ASCII delimiter bytes, and provides hundreds of specialized built-in functions. Java is statically typed, 0-based, passes references by value, and is built on immutable strings and strongly typed object graphs.

To bridge this chasm, the generated Java code relies on a dedicated target runtime library: an execution layer that emulates legacy dynamic semantics, delimiter-aware data structures, and built-in functions in Java.

In this article, we explore why generated code requires a target runtime, how runtime calls are produced across the compilation pipeline, why hardcoding runtime calls in AST transformers is an architectural anti-pattern, and how candidate abstractions enable contract-first development and automated stub generation.

---

### Why the Transpiler Needs a Target Runtime

To understand why a runtime library is indispensable, consider what happens when a simple UniBasic statement is encountered:

```basic
RECORD<1, 2> = "PROCESSED"
```

In UniBasic, `RECORD` is not a class instance or a two-dimensional matrix. It is a flat string whose dimensions are delimited by invisible control characters: Field Marks (`@FM`, ASCII 254), Value Marks (`@VM`, ASCII 253), and Subvalue Marks (`@SM`, ASCII 252). 

The statement above extracts the first field of `RECORD`, finds its second value, replaces that value with the string `"PROCESSED"`, and dynamically expands delimiters if the record did not already contain enough fields.

If the transpiler attempted to emit bare Java code for this single assignment, it would need to generate dozens of lines of delimiter splitting, boundary checks, empty-element padding, and buffer reconstruction across every field access: bloating generated code and potentially destroying JVM optimizations.

Instead, the transpiler lowers that assignment into a single, clean runtime call:

```java
record = UnibasicRuntime.set(record, UnibasicValue.from(1), UnibasicValue.from(2), UnibasicValue.from("PROCESSED"));
```

The runtime library absorbs the semantic complexity, keeping the emitted Java code clean, readable, and idiomatic.

#### Type Binding: Mechanical Anchors Over Speculative Inference

When engineers design a transpiler for a dynamic language, the natural inclination is to pursue static type inference: *can we analyze assignments, deduce that `X` is an integer, and emit native `int x`?*

In UniBasic, speculative type inference quickly breaks down because variables are polymorphic by design:

```basic
RATE = 15          ; * Integer on line 10
RATE = "EXEMPT"    ; * String on line 85
RATE<1, 2> = 450   ; * Delimited dynamic array on line 120
```

If the transpiler speculatively infers `int rate`, line 85 fails to compile. If it infers `String rate`, line 10 loses arithmetic capabilities and line 120 fails. Attempting dataflow analysis to guess types across dynamic assignments produces fragile type graphs and cascading compilation failures.

Instead of speculative guessing, our transpiler adopts a deterministic strategy: **type binding** (implemented during Semantic Analysis by `TypeBindingCollector`). 

The philosophy is straightforward:
* **Speculative inference asks:** *"What value might this variable hold at runtime?"* (Fragile)
* **Mechanical anchoring asks:** *"Did the developer declare an explicit syntactic anchor for this variable?"* (Deterministic)

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
The Two Pillars of Type Binding
</div>
<div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1">Pillar 1</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">The Universal Default (UnibasicValue)</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
Plain assignments (<code class="font-mono text-zinc-800 dark:text-zinc-200">X = 100</code>, <code class="font-mono text-zinc-800 dark:text-zinc-200">TOTAL = "0"</code>) are never recorded in the symbol table. Absence in the table implicitly binds the identifier to <code class="font-mono text-zinc-800 dark:text-zinc-200">UnibasicValue</code>.
</p>
<div class="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-950/80 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
<div><span class="text-zinc-400">Covers:</span> Numbers, Strings, Booleans</div>
<div><span class="text-zinc-400">Handles:</span> File descriptors, Select lists</div>
<div><span class="text-zinc-400">Arrays:</span> Dynamic multi-value strings (<span class="text-sky-600 dark:text-sky-400">@FM</span>, <span class="text-sky-600 dark:text-sky-400">@VM</span>)</div>
</div>
</div>
<div class="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500 font-medium">
Strategy: Zero symbol table overhead
</div>
</div>

<div class="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">Pillar 2</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Syntactic Anchors (Array Types)</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
Non-default types are registered only when explicitly anchored by language syntax. No heuristic guesses: if a keyword anchors an array, SEMA binds it to a Java array type.
</p>
<div class="space-y-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-950/80 p-2.5 rounded border border-indigo-100 dark:border-indigo-900/50">
<div><span class="text-indigo-600 dark:text-indigo-400 font-semibold">DIM A(10)</span> &rarr; UnibasicValue[]</div>
<div><span class="text-indigo-600 dark:text-indigo-400 font-semibold">DIM M(10, 20)</span> &rarr; UnibasicValue[][]</div>
<div><span class="text-indigo-600 dark:text-indigo-400 font-semibold">SUBROUTINE(MAT A)</span> &rarr; UnibasicValue[]</div>
</div>
</div>
<div class="mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-900/50 font-mono text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
Strategy: Deterministic syntax anchors
</div>
</div>
</div>
</div>

Consider how this plays out in subroutine declarations. When the transpiler encounters:

```basic
SUBROUTINE PROCESS.ORDER(MAT INVENTORY, ORDER.ID, STATUS)
```

The transpiler does not inspect subsequent lines to deduce what types are passed. The `MAT` keyword provides an unambiguous structural anchor:
* `INVENTORY` is prefixed with `MAT`, so `TypeBindingCollector` binds it as a dimensioned array (`UnibasicValue[]`).
* `ORDER.ID` and `STATUS` lack anchors, so they remain the default `UnibasicValue`.

The emitted Java method signature is immediately deterministic:

```java
public static void processOrder(UnibasicValue[] inventory, UnibasicValue orderId, UnibasicValue status)
```

The complete matrix of anchors is compact and exhaustive:

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
The Anchor Decision Matrix
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse text-xs">
<thead>
<tr class="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
<th class="py-3 px-4">UniBasic Construct</th>
<th class="py-3 px-4">Syntactic Anchor</th>
<th class="py-3 px-4">Emitted Java Type</th>
<th class="py-3 px-4">Binding Rationale</th>
</tr>
</thead>
<tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
<td class="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">TOTAL = 0</td>
<td class="py-3 px-4 whitespace-nowrap">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">None (Default)</span>
</td>
<td class="py-3 px-4 whitespace-nowrap">
<code class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">UnibasicValue</code>
</td>
<td class="py-3 px-4 text-zinc-600 dark:text-zinc-400">
Dynamic scalar or multi-value record; no symbol table registration required.
</td>
</tr>
<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
<td class="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">DIM ITEMS(50)</td>
<td class="py-3 px-4 whitespace-nowrap">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">DIM (1 bound)</span>
</td>
<td class="py-3 px-4 whitespace-nowrap">
<code class="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">UnibasicValue[]</code>
</td>
<td class="py-3 px-4 text-zinc-600 dark:text-zinc-400">
Fixed-size one-dimensional dimensioned array.
</td>
</tr>
<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
<td class="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">DIM GRID(10, 20)</td>
<td class="py-3 px-4 whitespace-nowrap">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">DIM (2 bounds)</span>
</td>
<td class="py-3 px-4 whitespace-nowrap">
<code class="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">UnibasicValue[][]</code>
</td>
<td class="py-3 px-4 text-zinc-600 dark:text-zinc-400">
Fixed-size two-dimensional dimensioned array.
</td>
</tr>
<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
<td class="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">SUBROUTINE EXEC(MAT A, B)</td>
<td class="py-3 px-4 whitespace-nowrap">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">MAT parameter</span>
</td>
<td class="py-3 px-4 whitespace-nowrap">
<div><code class="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">A: UnibasicValue[]</code></div>
<div class="mt-0.5"><code class="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">B: UnibasicValue</code></div>
</td>
<td class="py-3 px-4 text-zinc-600 dark:text-zinc-400">
<code class="font-mono text-[11px]">MAT</code> explicitly anchors <code class="font-mono text-[11px]">A</code> as an array reference; unadorned parameters default to dynamic value.
</td>
</tr>
<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
<td class="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">MATPARSE ITEMS FROM STR</td>
<td class="py-3 px-4 whitespace-nowrap">
<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">MATPARSE statement</span>
</td>
<td class="py-3 px-4 whitespace-nowrap">
<code class="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">UnibasicValue[]</code>
</td>
<td class="py-3 px-4 text-zinc-600 dark:text-zinc-400">
Matrix parsing statement anchors destination identifier as a dimensioned array.
</td>
</tr>
</tbody>
</table>
</div>
</div>

By trading speculative inference for mechanical anchors, the transpiler guarantees predictable compilation while maintaining complete runtime compatibility with legacy UniBasic semantics.

---

### Three Ways the Transpiler Emits Runtime Calls

Not all runtime invocations serve the same architectural purpose. When compiling UniBasic into Java, the transpiler emits runtime calls through three distinct modalities depending on how the construct is parsed in the AST and executed at runtime:

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
The Three Modalities of Runtime Calls
</div>
<div class="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
<div class="rounded-lg border border-sky-200 bg-sky-50/50 p-4 dark:border-sky-900/60 dark:bg-sky-950/40 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">Modality 1</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Built-in Functions</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
Parsed as <code class="font-mono text-zinc-800 dark:text-zinc-200">Expression.FunctionCall</code>. Mapped via static lookup table to runtime utility methods.
</p>
<div class="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded border border-sky-100 dark:border-sky-900/40 overflow-hidden">
<div><span class="text-zinc-400">Source:</span> DCOUNT(REC, ",")</div>
<div class="text-zinc-400">Target:</div>
<div class="pl-2 leading-snug text-sky-900 dark:text-sky-300">
UnibasicRuntime<br/>
&nbsp;&nbsp;.countDelimitedValues(...)
</div>
</div>
</div>
<div class="mt-3 pt-2 border-t border-sky-200 dark:border-sky-900/50 font-mono text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
Mechanism: RuntimeCallMappings
</div>
</div>

<div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Modality 2</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Value Operations</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
Dynamic operations between values bound to <code class="font-mono text-zinc-800 dark:text-zinc-200">UnibasicValue</code>. Emitted as instance method calls.
</p>
<div class="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/40 overflow-hidden">
<div><span class="text-zinc-400">Source:</span> "100" + 5</div>
<div class="text-zinc-400">Target:</div>
<div class="pl-2 leading-snug text-emerald-900 dark:text-emerald-300">
UnibasicValue.from("100")<br/>
&nbsp;&nbsp;.add(UnibasicValue.from(5))
</div>
</div>
</div>
<div class="mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-900/50 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
Mechanism: UnibasicValueCalls
</div>
</div>

<div class="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">Modality 3</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Language Statements</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
First-class statements for string transformations, data mutations, and file access. Lowered into static runtime calls.
</p>
<div class="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/80 p-2.5 rounded border border-indigo-100 dark:border-indigo-900/40 overflow-hidden">
<div><span class="text-zinc-400">Source:</span> CONVERT "@FM" TO "|" IN REC</div>
<div class="text-zinc-400">Target:</div>
<div class="pl-2 leading-snug text-indigo-900 dark:text-indigo-300">
UnibasicRuntime<br/>
&nbsp;&nbsp;.replaceCharacters(...)
</div>
</div>
</div>
<div class="mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-900/50 font-mono text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
Mechanism: RuntimeCallCandidates
</div>
</div>
</div>
</div>

#### 1. Built-in Functions: `RuntimeCallMappings`

UniBasic programs rely heavily on standard built-in functions such as `DCOUNT`, `FIELD`, `COUNT`, and `SPACE`. In the source AST, the parser represents these directly as `Expression.FunctionCall(name, arguments)`.

Because Java has no native equivalent for behaviors like `DCOUNT` (which counts delimited substrings separated by markers or characters), the transpiler maps each built-in function to a dedicated runtime method using an enum lookup table: `RuntimeCallMappings`:

```java
// Note: Simplified version for illustration
public final class RuntimeCallMappings {

    private static final Map<StandardLibraryFunction, RuntimeTarget> MAPPINGS;

    static {
        Map<StandardLibraryFunction, RuntimeTarget> map = new EnumMap<>(StandardLibraryFunction.class);

        map.put(DCOUNT,  new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "countDelimitedValues", JavaType.UNIBASIC_VALUE));
        map.put(SPACE,   new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "addSpace",             JavaType.UNIBASIC_VALUE));
        map.put(TRIM,    new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "trimAll",              JavaType.UNIBASIC_VALUE));
        map.put(TRIMB,   new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "backwardTrim",         JavaType.UNIBASIC_VALUE));
        map.put(TRIMF,   new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "forwardTrim",          JavaType.UNIBASIC_VALUE));

        MAPPINGS = Collections.unmodifiableMap(map);
    }

    public static RuntimeTarget lookup(StandardLibraryFunction function) {
        return Optional.ofNullable(MAPPINGS.get(function))
                .orElseThrow(() -> new IllegalArgumentException("Unknown UniBasic function: " + function));
    }
}
```

Whenever a developer writes `TOTAL = DCOUNT(RECORD, DELIM)`, the transpiler queries `RuntimeCallMappings.lookup(DCOUNT)` and eventually produces a direct invocation of `UnibasicRuntime.countDelimitedValues(record, delim)`.

#### 2. Operations on `UnibasicValue`: Dynamic Instance Methods

Because every plain identifier in UniBasic is bound to the `UnibasicValue` type, source operators cannot be translated into native Java operators:
* **Java Has No Operator Overloading:** Java does not allow operators like `+`, `-`, or `*` on custom object types. An expression like `val1 + val2` where `val1` and `val2` are of type `UnibasicValue` will not compile in Java.
* **Dynamic Coercion Rules:** In UniBasic, operators carry dynamic coercion semantics. Consider a statement like:

```basic
RESULT = "100" + 5
```

In UniBasic, `+` is strictly arithmetic addition, dynamically coercing the string `"100"` to a number to produce `105`.

Because Java cannot overload operators on classes and has no built-in knowledge of UniBasic dynamic coercions, arithmetic, comparisons, and concatenation are lowered into **instance method calls on `UnibasicValue`**.

Rather than letting transformers instantiate method calls with ad-hoc strings, the transpiler funnels all `UnibasicValue` method construction through `UnibasicValueCalls`:

```java
// Note: Code trimmed for brevity
public final class UnibasicValueCalls {

    public static Expression.InstanceCall add(Expression target, Expression argument) {
        return arithmetic(target, "add", argument);
    }

    public static Expression.InstanceCall subtract(Expression target, Expression argument) {
        return arithmetic(target, "subtract", argument);
    }

    private static Expression.InstanceCall arithmetic(Expression target, String methodName, Expression argument) {
        return Expression.InstanceCall.onObject(target, methodName, List.of(argument), JavaType.UNIBASIC_VALUE);
    }

    // Additional methods (multiply, divide, concat, comparisons, isTruthy) trimmed for brevity
}
```

When lowered, the code emitter renders:

```java
result = UnibasicValue.from("100").add(UnibasicValue.from(5));
```

#### 3. Language Statements: Lowering First-Class Keywords

UniBasic provides first-class language statements for operations that modern languages typically handle through libraries or specialized frameworks:
* **String and Delimiter Transformations:** Statements like `CONVERT "@FM" TO "|" IN CUSTOMER.RECORD` modify dynamic delimiter structures directly.
* **Database and File Operations:** Statements like `OPEN "CUSTOMERS" TO F.CUSTOMERS ELSE ...` manage file tables and conditional handle bindings.
* **Dynamic Array Mutations:** Statements like `INS`, `DEL`, and `LOCATE` perform in-place mutations across multi-value strings.

Java has no language keywords for delimiter conversions or file handle bindings. The parser represents these operations as dedicated statement AST nodes (such as `Statement.Convert` or `Statement.Open`), and their respective transformers lower them into static runtime calls:

```java
// Emitted Java Target for CONVERT:
customerRecord = UnibasicRuntime.replaceCharacters(customerRecord, UnibasicValue.from("@FM"), UnibasicValue.from("|"));

// Emitted Java Target for OPEN:
fCustomers = UnibasicFileRuntime.openFile(UnibasicValue.from("CUSTOMERS"));
```

---

### How Runtime Code is Produced Across the Pipeline

Runtime invocations do not appear out of thin air. They are the final result of a multi-stage compilation pipeline where source text is progressively validated, enriched, and lowered.

Here is how source code moves through the transpiler stages into target runtime calls:

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
The Lowering Pipeline: From Source Code to Runtime Calls
</div>
<div class="p-5 sm:p-6 space-y-4">
<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">Stage 1</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Parser</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
Consumes tokens and emits a pure <strong>Source AST</strong> representing syntax. Contains zero Java knowledge.
</p>
</div>
<div class="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500">
Output: Source AST
</div>
</div>

<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Stage 2</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">SEMA</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
Binds symbols, maps shared <code class="font-mono text-zinc-800 dark:text-zinc-200">COMMON</code> blocks to runtime holders, and stamps types.
</p>
</div>
<div class="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500">
Output: Enriched AST
</div>
</div>

<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Stage 3</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Transformers</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
Lowers source nodes into <strong>Target AST</strong> nodes, synthesizing <code class="font-mono text-zinc-800 dark:text-zinc-200">RuntimeCall</code> expressions where required.
</p>
</div>
<div class="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500">
Output: Target Java AST
</div>
</div>

<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col justify-between">
<div>
<div class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Stage 4</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">Code Emitter</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
Traverses Target AST and prints clean, formatted, executable Java source files to disk.
</p>
</div>
<div class="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-500">
Output: Executable Java
</div>
</div>
</div>
</div>
</div>

#### 1. The Parser: Constructing Pure Source ASTs

The parser consumes tokens and builds a source-level Abstract Syntax Tree. At this stage, the AST contains no knowledge of Java, no knowledge of classes, and no knowledge of runtime methods. 

When the parser encounters a statement like:

```basic
CUSTOMER.NAME = CUSTOMER.REC<1>
```

It emits a pure `Statement.Assignment` holding a `Expression.FieldAccess`:

```java
new Statement.Assignment(
    Identifier.of("CUSTOMER.NAME"),
    new Expression.FieldAccess(
        Identifier.of("CUSTOMER.REC"),
        List.of(new Expression.NumberLiteral("1"))
    )
);
```

#### 2. SEMA (Semantic Analysis): Enriching the Tree

Before lowering to Java, the Source AST passes through Semantic Analysis (SEMA). SEMA performs cross-program validation and decorates the AST with structural facts that the parser could not deduce from syntax alone:

* **Variable Scope and Symbol Resolution:** SEMA determines whether an identifier is a local variable, a subroutine parameter, or a shared memory cell.
* **COMMON Block Resolution:** UniBasic programs share state across subroutines using `COMMON` blocks (for example, `COMMON /SHARED/ BALANCE, STATUS`). Because separate files share this memory without passing arguments, SEMA resolves these declarations and rewrites variable access so subroutines read and write to shared runtime context holders.
* **Reference Cell Inference:** SEMA analyzes subroutine signatures across the whole codebase to determine which arguments are mutated by callees, marking those variables as requiring `Var<T>` reference cell wrappers.

#### 3. Transformers: Lowering into Target AST with Runtime Calls

Once SEMA has enriched the tree, the **Transformers** take over. Transformers are responsible for lowering UniBasic AST nodes into Java Target AST nodes.

Whenever a UniBasic construct lacks a direct equivalent in Java, the transformer produces a `com.unibasictojava.transpiler.target.ast.Expression.RuntimeCall`.

---

### Lowering Statements to the Target AST

Let's look at a concrete transformation. Consider string character conversion via the `CONVERT` statement:

```basic
CONVERT "@FM" TO "|" IN CUSTOMER.RECORD
```

In UniBasic, `CONVERT` replaces characters in a variable in place. The parser produces a source AST node:

```java
// Source AST produced by the parser:
new Statement.Convert(
    new Expression.StringLiteral("@FM"),
    new Expression.StringLiteral("|"),
    Expression.Identifier.of("CUSTOMER.RECORD")
);
```

To translate this construct into Java, the transpiler must **lower** the source statement into a target Java assignment that captures the result of a runtime call. The target Java code we want to emit is:

```java
customerRecord = UnibasicRuntime.replaceCharacters(customerRecord, UnibasicValue.from("@FM"), UnibasicValue.from("|"));
```

> **What does lowering mean?**
> In transpiler engineering, **lowering** refers to the process of translating high-level source language constructs into lower-level, concrete target primitives and conventions. Lowering covers multiple responsibilities:
> * **Mapping Language Statements to Runtime Calls:** Translating high-level statements that have no direct syntactic equivalent in Java (such as `CONVERT`) into target assignments that capture runtime method invocations.
> * **Adopting Target Naming Conventions:** Rewriting source identifiers to follow target language conventions, such as transforming uppercase dot-separated identifiers like `FIRST.NAME` into idiomatic Java camelCase identifiers like `firstName`.
> * **Reconciling Indexing Models:** Bridging semantic differences such as array access. UniBasic array indices start from 1, whereas Java array indices start from 0. During lowering, array access expressions (`ArrayAccess`) must be adjusted so each index expression is reduced by 1.

In the Target AST, this lowered statement is represented as a `Statement.Assignment` wrapping an `Expression.RuntimeCall`:

```java
// Target AST structure representing the lowered statement for Convert:
new Statement.Assignment(
    Expression.Identifier.of("customerRecord"),
    new Expression.RuntimeCall(
        "UnibasicRuntime",
        "replaceCharacters",
        List.of(
            Expression.Identifier.of("customerRecord"),
            new Expression.StringLiteral("@FM").wrapIn(RuntimeClass.UNIBASIC_VALUE),
            new Expression.StringLiteral("|").wrapIn(RuntimeClass.UNIBASIC_VALUE)
        ),
        JavaType.UNIBASIC_VALUE
    )
);
```

While this is the target representation the code emitter needs to generate Java source code, **transformers do not construct this target node by hardcoding class names and method strings directly**.

---

### Why Candidate Abstractions?

Standard built-in functions like `DCOUNT` and `COUNT` map cleanly through `RuntimeCallMappings` because they are simple function-to-function translations.

However, when we build statement and operator transformers like `ConvertTransformer`, we face an architectural fork:

#### Option 1: Hardcoding Runtime Calls Inside Transformers

The most intuitive, naive approach is to have each transformer instantiate `Expression.RuntimeCall` directly with hardcoded strings and class names:

```java
// Option 1: ConvertTransformer directly hardcodes the runtime call
public Statement transform(Statement statement) {
    Convert convertStatement = (Convert) statement;
    
    Expression assignmentTarget = Expression.Identifier.of(convertStatement.variable().name());
    
    // The transformer manually hardcodes the runtime target:
    Expression convertCall = new Expression.RuntimeCall(
        "com.unibasictojava.runtime.UnibasicRuntime",
        "replaceCharacters",
        adapt(convertStatement.variable(), convertStatement.search(), convertStatement.replace()),
        JavaType.UNIBASIC_VALUE
    );

    return new Statement.Assignment(assignmentTarget, convertCall);
}
```

At first glance, this approach seems straightforward. But across an industrial transpiler with over 40 distinct transformers (`ConvertTransformer`, `FieldAccessTransformer`, `InsertTransformer`, `ReadSeqTransformer`, `MatreadTransformer`, and others), this design introduces two crippling architectural flaws:

1. **Knowledge of Runtime Calls is Scattered Across All Transformers:**
   Target class names (`"UnibasicRuntime"`), method names (`"replaceCharacters"`, `"insertIntoDynamicArray"`, `"get"`), argument orderings, and return types become scattered across dozens of transformer files. Because each transformer directly constructs the runtime invocation, any change in how a runtime call is represented, structured, or adapted in the AST ripples across every transformer. A transformer should only be responsible for lowering its specific source node, not for knowing how runtime calls are mechanically assembled.

2. **We Cannot Generate Runtime Stubs:**
   This is the fatal flaw. When runtime calls are embedded as ad-hoc strings inside individual transformer methods, :h[**there is no centralized model or catalog that tooling can inspect**].
   In a large migration project, transpiler engineers and runtime engineers work in parallel. How does the runtime team know what classes, methods, parameter types, and optional overloads they need to implement?
   With hardcoded runtime calls, they cannot know. You cannot write a code generator or reflection tool to scan the codebase and emit `UnibasicRuntime.java` because the requirements are locked away as opaque strings inside AST transformation algorithms.
   The runtime team is blocked, forced to either read through transpiler source code manually or wait for runtime test failures. Contract-first development becomes impossible.

#### Option 2: Centralized Candidates (`EligibleForRuntimeCall`)

To solve both problems, we need a **centralized place** where all runtime expectations are declared and maintained.

We divide runtime calls into two centralized structures:
1. **Built-in Functions:** As seen earlier, UniBasic built-in functions (`DCOUNT`, `COUNT`, `SPACE`) are centralized in `RuntimeCallMappings`.
2. **Statements and Complex Operators:** For language statements and operators (such as string conversions, dynamic array mutations, and field accesses), we introduce candidate records implementing the `EligibleForRuntimeCall` marker interface.

```java
// Note: Code trimmed for brevity
public interface EligibleForRuntimeCall {

    RuntimeTarget runtimeTarget();

    List<Expression> arguments();

    // Default methods for stub generation metadata (such as optionalArgumentCount
    // and canTakeAnyObject) are trimmed for brevity.
}
```

Every language construct requiring a runtime call is modeled as an immutable record in `RuntimeCallCandidates`:

```java
public final class RuntimeCallCandidates {

    public record ConvertCandidate(
            Expression variable,
            Expression search,
            Expression replace
    ) implements EligibleForRuntimeCall {

        @Override
        public RuntimeTarget runtimeTarget() {
            return new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "replaceCharacters", JavaType.UNIBASIC_VALUE);
        }

        @Override
        public List<Expression> arguments() {
            return List.of(variable, search, replace);
        }
    }
}
```

Notice what `ConvertCandidate` achieves:
* It encapsulates the target method signature: `replaceCharacters`, returning `UNIBASIC_VALUE`.
* It isolates the required arguments (`variable`, `search`, `replace`) without stringly typed invocation mechanics.
* It lives in a single, discoverable registry alongside all other candidate records.

#### How `ConvertTransformer` Uses the Candidate

Now, look at how clean `ConvertTransformer` becomes:

```java
public final class ConvertTransformer extends Transformer {

    private final RuntimeCallFactory runtimeCallFactory;

    public ConvertTransformer(List<TransformerRule> rules) {
        super(rules);
        this.runtimeCallFactory = new RuntimeCallFactory(new ExpressionTransformer());
    }

    @Override
    public Statement transform(com.unibasictojava.transpiler.source.ast.Statement statement) {
        Convert convertStatement = (Convert) statement;

        Identifier rewrittenVariable = (Identifier) this.applyRules(convertStatement.variable());
        com.unibasictojava.transpiler.source.ast.Expression rewrittenSearch = this.applyRules(convertStatement.search());
        com.unibasictojava.transpiler.source.ast.Expression rewrittenReplace = this.applyRules(convertStatement.replace());

        Expression assignmentTarget = Expression.Identifier.of(rewrittenVariable.name());
        Expression convertCall = runtimeCallFactory.resolve( // [!code focus]
                new RuntimeCallCandidates.ConvertCandidate(rewrittenVariable, rewrittenSearch, rewrittenReplace) // [!code focus]
        ); // [!code focus]
        return new Statement.Assignment(assignmentTarget, convertCall);
    }
}
```

The transformer contains zero knowledge of target class names or method strings. It simply wraps the source AST node into a `ConvertCandidate` and delegates resolution to `RuntimeCallFactory`.

> **What is `applyRules`?**
> The base `Transformer` class accepts a collection of composable `TransformerRule` instances. When `this.applyRules(expression)` is invoked, the source expression is piped through each rule in sequence:
> * **Identifier Normalization (`VariableNameTransformerRule`):** Converts uppercase, dot-separated UniBasic variable names (such as `CUSTOMER.RECORD`) into idiomatic Java camelCase (`customerRecord`).
> * **Index Adaptation (`ArrayAccessZeroBasedIndicesTransformerRule`):** Translates 1-based UniBasic array indices into 0-based Java array indices.
> * **Convention Parity:** Ensures all variables and expressions conform to target Java conventions before being packaged into candidate records and passed to `RuntimeCallFactory`.

#### The Central Factory: `RuntimeCallFactory`

`RuntimeCallFactory` is the single component in the transpiler that creates Java runtime calls:

```java
public final class RuntimeCallFactory {

    private final ExpressionTransformer transformer;

    public RuntimeCallFactory(ExpressionTransformer transformer) {
        this.transformer = transformer;
    }

    public Expression.RuntimeCall resolve(EligibleForRuntimeCall eligible) {
        RuntimeTarget    target    = eligible.runtimeTarget();
        List<Expression> arguments = new ArrayList<>(eligible.preAdaptedArguments());
        arguments.addAll(adaptArguments(eligible.arguments()));
        return new Expression.RuntimeCall(target.className(), target.methodName(), arguments, target.returnType());
    }

    private List<Expression> adaptArguments(List<com.unibasictojava.transpiler.source.ast.Expression> arguments) {
        return arguments.stream().map(transformer::transform).toList();
    }
}
```

By isolating call construction in `RuntimeCallFactory`:
* Argument transformation is standardized across every transformer.
* Pre-adapted and raw arguments are merged predictably.
* The transformer layer remains 100% decoupled from target runtime mechanics.

---

### Contract-First Development and Automated Stub Generation

Because all runtime calls are now housed in centralized, structured representations (`RuntimeCallCandidates` and `RuntimeCallMappings`), :h[**our transpiler can automatically generate the entire runtime contract**].

<div class="not-prose my-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 font-sans">
<div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-850 dark:bg-zinc-900 dark:text-zinc-400">
Contract-First Stub Generation Workflow
</div>
<div class="p-5 sm:p-6 space-y-4">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<div class="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
<div class="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">Centralized Registry</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Candidates &amp; Mappings</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
<code class="font-mono text-zinc-800 dark:text-zinc-200">RuntimeCallCandidates</code> and <code class="font-mono text-zinc-800 dark:text-zinc-200">RuntimeCallMappings</code> declare every runtime method signature, parameter count, and return type inside the transpiler.
</p>
</div>

<div class="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/40">
<div class="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Code Generator</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">RuntimeStubGenerator</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
Inspects records via Java reflection, extracts parameter overloads, and emits compilable Java stub source files (<code class="font-mono text-zinc-800 dark:text-zinc-200">UnibasicRuntime.java</code>, <code class="font-mono text-zinc-800 dark:text-zinc-200">UnibasicValue.java</code>).
</p>
</div>

<div class="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
<div class="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Parallel Execution</div>
<div class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Zero Drift Parity</div>
<p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
<strong>Transpiler Team:</strong> Builds and tests against stubs on day one.<br/>
<strong>Runtime Team:</strong> Implements production methods against the exact generated interface contract.
</p>
</div>
</div>
</div>
</div>

#### How Automated Stub Generation Works

We built a dedicated code generation tool inside our repository: `RuntimeStubGenerator`.

Instead of maintaining stubs by hand, the generator uses Java reflection to inspect the candidate and mapping definitions:

1. **`RuntimeCandidatesInspector`:** Scans all inner records declared in `RuntimeCallCandidates.class`. Because every record implements `EligibleForRuntimeCall`, the inspector instantiates each candidate with placeholder arguments to read its `runtimeTarget()`, examines argument counts, checks `optionalArgumentCount()`, and detects `canTakeAnyObject()`.
2. **`RuntimeMappingsInspector`:** Iterates through every entry in `RuntimeCallMappings`, extracting method names, parameter arities, and min/max argument ranges.
3. **Descriptor Merging:** Combines the inspected methods, deduplicating identical signatures across candidates and generating overloaded methods for optional parameters.
4. **Code Emission:** Automatically generates complete Java source files for stub classes (`UnibasicRuntime.java`, `UnibasicValue.java`, `UnibasicGetResult.java`, and others):

```java
// Automatically generated stub emitted by RuntimeStubGenerator:
package com.unibasictojava.runtime;

public final class UnibasicRuntime {

    // Generated from ConvertCandidate:
    public static UnibasicValue replaceCharacters(UnibasicValue arg1, UnibasicValue arg2, UnibasicValue arg3) {
        throw new UnsupportedOperationException();
    }

    // Generated from FieldAccessCandidate:
    public static UnibasicValue get(UnibasicValue arg1, UnibasicValue arg2) {
        throw new UnsupportedOperationException();
    }

    public static UnibasicValue get(UnibasicValue arg1, UnibasicValue arg2, UnibasicValue arg3) {
        throw new UnsupportedOperationException();
    }
}
```

#### The Architectural Wins

1. **Zero Developer Blockage:** On day one, the transpiler team ran `./gradlew :tools:generateRuntimeStubs`. The transpiler built and validated generated Java code immediately against these stubs. Simultaneously, the runtime team checked out the generated contracts and wrote implementations against their own test suite.
2. **Zero Interface Drift:** Whenever a transpiler engineer introduced a new language feature requiring a runtime helper, they added a single record to `RuntimeCallCandidates`. Re-running the stub generator instantly updated the runtime interface contract.
3. **Contract-First Rigor:** The interface between the transpiler and the runtime was never a vague document or a set of informal agreements. It was a concrete, typed, and automated code contract enforced by the transpiler itself.

---

### Summary

A transpiler is far more than a syntax printer. When migrating legacy applications into modern languages, the runtime library acts as the foundational execution layer that makes semantic equivalence possible.

By isolating runtime mapping definitions in `RuntimeCallMappings`, wrapping complex statements into `RuntimeCallCandidates`, and funneling call construction through `RuntimeCallFactory`, we achieved:
* **Clean, unpolluted transformers** that focus entirely on AST structure.
* **A unified, decoupled runtime interface** free of hardcoded strings or brittle signatures.
* **Automated stub generation** that enabled parallel, contract-first development across transpiler and runtime teams.

In the next article of this series, we will examine the semantic heart of the transpiler: **[Inside a Transpiler (Part 4): Semantic Analysis (SEMA)](/en/blog/semantic_analysis_sema/)**, exploring how we traverse whole-program compilation units to resolve symbols, promote facts, and handle legacy global memory blocks.
