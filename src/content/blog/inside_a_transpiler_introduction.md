---
author: "Sarthak Makhija"
title: "Inside a Transpiler: Introduction"
description: "Modernizing 14,000+ files of legacy UniBasic to Java, and the roadmap for this series."
pubDate: "2026-11-20"
weight: 2
tags: ["Compilers", "Transpiler", "Java", "UniBasic"]
draft: false
caption: "Inside a Transpiler: Introduction"
---

Enterprise software modernization often hits an unavoidable reality: millions of lines of mission-critical business logic locked inside legacy programming languages. Rewriting such systems by hand is prohibitively expensive, error-prone, and can take years to reach parity.

We recently undertook the challenge of modernizing an enterprise system written in **[UniBasic](https://www.unibasic.com/)**, migrating it entirely to **Java 21**.

### What is UniBasic?

UniBasic is a procedural, dynamically typed programming language used primarily with database systems like Rocket UniData and UniVerse. Designed for data-intensive business applications, it operates under very different principles than modern object-oriented or statically typed languages:

* **Dynamic Typing & String-Number Duality:** Variables have no static type declarations. A variable holding `"42"` can participate in arithmetic, string concatenation, or boolean comparisons without explicit conversion.
* **Dynamic Multi-Value Arrays:** Rather than using formal object structures or relational tables, UniBasic encodes hierarchical records into continuous strings delimited by system marks: Field Marks (`@FM`), Value Marks (`@VM`), and Subvalue Marks (`@SM`), forming a dynamic 3-dimensional data structure.
* **Universal Pass-by-Reference:** Every argument passed to a subroutine (`CALL`) is passed by reference. Callee mutations immediately reflect in the caller's variables.
* **Global Shared State via COMMON:** Subroutines share state across separate files through named or unnamed `COMMON` memory blocks, functioning like shared global heap segments.
* **Unstructured Control Flow:** Execution relies heavily on `GOTO`, `GOSUB`, and labels. Labels can be placed anywhere: even inside the body of an `IF` block or inside a loop. Code can jump directly into a nested conditional branch from elsewhere, bypassing the `IF` condition entirely.

To see these characteristics in action, consider a typical snippet:

```basic
TOTAL = "0"                             ;* (1)
RECORD<1, 2> = "ITEM-42"                ;* (2)
IF RECORD<1, 2> # "" THEN
    CALL PROCESS.ITEM(TOTAL, RECORD)    ;* (3)
    GOSUB PRINT.TOTAL                   ;* (4)
END
STOP

PRINT.TOTAL:                            ;* (5)
    TOTAL = TOTAL + 10                  ;* (6)
    PRINT "TOTAL: " : TOTAL
RETURN
```

1. **Dynamic typing:** Variables require no declaration or type annotations. `TOTAL` starts life as a string `"0"`.
2. **Dynamic multi-value arrays:** `RECORD<1, 2>` accesses field 1, value 2 in a delimited string record.
3. **Universal pass-by-reference:** `CALL` invokes an external subroutine; both `TOTAL` and `RECORD` are passed by reference and can be mutated by the callee.
4. **Shared local state:** `GOSUB` jumps to a local label. It does not create a new stack frame: caller and label share the exact same variable scope.
5. **Labels as jump targets:** `PRINT.TOTAL:` is not a function with its own scope; it is merely an address marker in the program.
6. **String-number coercion:** The string `"0"` is implicitly coerced to a number to perform addition.

### The Mission: Transpiling 14,000+ Files

Our target was not a toy demo. We were tasked with transpiling **more than 14,000 legacy source files** into clean, compilable Java.

Furthermore, we established clear success criteria:

<div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 font-sans">
  <div class="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Criterion 1</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Clean Compilation</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">Emitted Java code must compile cleanly with standard Java compilers (<code>javac</code>) without warnings or suppressed errors.</p>
    </div>
  </div>

  <div class="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Criterion 2</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Behavioral Parity</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">Transpiled code must preserve 100% of runtime semantics, memory mutations, and control flow guarantees of the original UniBasic programs.</p>
    </div>
  </div>

  <div class="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Criterion 3</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Structured Constructs</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">Produces readable Java classes, methods, and loops that developers can inspect, debug, and maintain instead of flattened dispatch loops.</p>
    </div>
  </div>
</div>

To achieve this, we decided to build a dedicated, industrial-grade **source-to-source transpiler** from scratch.

### Reverse-Engineering a Grammar Without a Specification

In textbook compiler engineering, you start with a clean, formal EBNF grammar specification. We had no such luxury.

UniBasic has no formal grammar specification (at least nothing that is publicly available). To build our parsers, we had to reverse-engineer the syntax empirically by mining the client's 14,000-file codebase to study every real-world variation of how statements were written in production.

For example, a construct like `MATREAD` can appear with various combinations of optional clauses (`FROM`, `THEN`, `ELSE`, `LOCKED`, `ON ERROR`). By analyzing every production usage across the codebase, we uncovered how developers actually wrote these constructs over decades, allowing us to build parsers that handled real-world code rather than textbook assumptions. Their codebase itself became our living specification.

<div class="my-8 p-6 bg-gradient-to-br from-purple-50/60 via-white to-white border border-purple-200/80 rounded-2xl font-sans shadow-xs">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-9 h-9 rounded-xl bg-purple-100/80 border border-purple-200/60 flex items-center justify-center shrink-0">
      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"></path></svg>
    </div>
    <div>
      <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600">Commentary</div>
      <div class="text-[18px] font-bold font-sans text-zinc-900 leading-snug">On the Use of AI</div>
    </div>
  </div>

  <p class="text-zinc-700 text-[15px] leading-relaxed mb-4">
    Building a transpiler from scratch without an official grammar is an enormous undertaking. Throughout this project, we leveraged AI (specifically Claude) as an active engineering partner across four key areas:
  </p>

  <div class="space-y-3 my-4">
    <div class="flex items-start gap-2.5">
      <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">1</span>
      <div class="text-[14.5px] text-zinc-700 leading-relaxed"><strong class="text-zinc-900">Identifying Usage Patterns:</strong> Claude helped identify various patterns of usage of complex constructs like <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">MATREAD</code> across the client's 14,000-file codebase.</div>
    </div>
    <div class="flex items-start gap-2.5">
      <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">2</span>
      <div class="text-[14.5px] text-zinc-700 leading-relaxed"><strong class="text-zinc-900">Developing Parsers on Established Foundations:</strong> It helped with the development of parsers after the foundation of the parser was built: a parser class providing methods like <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">expectIdentifier</code>, <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">expectKeyword</code>, and <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">expect*</code> to consume and validate tokens.</div>
    </div>
    <div class="flex items-start gap-2.5">
      <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">3</span>
      <div class="text-[14.5px] text-zinc-700 leading-relaxed"><strong class="text-zinc-900">Debugging Parser Gaps:</strong> It assisted in debugging parser gaps by analyzing failing programs and pinpointing syntax errors, until we built our own <a href="#the-series-roadmap" class="text-purple-700 underline font-medium hover:text-purple-900">Parser Tracing</a>.</div>
    </div>
    <div class="flex items-start gap-2.5">
      <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">4</span>
      <div class="text-[14.5px] text-zinc-700 leading-relaxed"><strong class="text-zinc-900">Explaining Legacy Functionality for Transformers:</strong> It provided explanations of legacy functionality for constructs like <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">OCONV</code>, <code class="font-mono text-xs bg-purple-50 text-purple-900 border border-purple-100 px-1.5 py-0.5 rounded">MATREAD</code>, and dynamic arrays, which helped in building the <strong>transformers</strong> (the layer which converts the Source AST to the Java Target AST).</div>
    </div>
  </div>
</div>

### What is this Series About?

Building a transpiler that converts unstructured, dynamically typed code into structured, statically typed Java forces you to confront some of the most fascinating problems in software engineering.

This series pulls back the curtain on how we designed and built this transpiler. It covers the full lifecycle: from lexing and parsing non-standard grammars, to cross-program semantic analysis, restructuring GOTOs, reconstructing lexical scopes, and establishing strict engineering hygiene at scale.

### The Series Roadmap

Here is what is planned for this series:

1. **Transpiler Architecture:** A high-level tour of the 7-stage compilation pipeline: from discovery and Pratt parsing to cross-program semantic analysis, AST lowering, and pure emission.
2. **[Foundations of an Industrial Transpiler](/en/blog/foundations_of_an_industrial_transpiler/):** The core architectural pillars and engineering discipline that prevent a large-scale compiler from collapsing under real-world complexity.
3. **[Observability in Transpilers: Parser Tracing](/en/blog/observability_in_transpilers_parser_tracing/):** Demystifying parser failures in complex grammars by treating syntax trees like distributed tracing spans.
4. **[The Target Runtime for Transpiled Code](/en/blog/building_the_target_runtime/):** Why generated code requires a dedicated target runtime to emulate legacy dynamic semantics, and how candidate abstractions enable contract-first stub generation.
5. **Semantic Analysis (SEMA):** Traversing and rewriting ASTs across whole-program compilation units using recursive rewriters and symbol registries.
6. **Fact Promotion & Scope Reconstruction:** Reconstructing lexical scopes, variable hoisting, and field promotions from an unscoped legacy language using deferred decision hints.
7. **Handling the Unhandleable: Eliminating GOTOs:** Transforming tangled, arbitrary jump patterns into structured loops, continues, breaks, and state machines across 13 passes.
8. **Transpiling at Enterprise Scale:** Validating 14,000+ programs against strict compilation gates, categorizing gaps, and practical takeaways from real-world migration.

Let's start with Transpiler Architecture.
