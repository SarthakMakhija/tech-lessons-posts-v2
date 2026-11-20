---
author: "Sarthak Makhija"
title: "Inside a Transpiler: Introduction"
description: "Part 1 of Inside a Transpiler: Modernizing 14,000+ files of legacy UniBasic to Java, and the roadmap for this series."
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
1. **Clean, Warning-Free Compilation:** The emitted Java code must compile cleanly with standard Java compilers (`javac`) without warnings or suppressed errors.
2. **Behavioral Parity:** The transpiled code must preserve 100% of the runtime semantics, memory mutations, and control flow guarantees of the original UniBasic programs.
3. **Structured Java Constructs:** Instead of flattening control flow into low-level dispatch loops, we aimed for structured Java classes, methods, and loops that developers can inspect, debug, and maintain.

To achieve this, we decided to build a dedicated, industrial-grade **source-to-source transpiler** from scratch.

### Reverse-Engineering a Grammar Without a Specification

In textbook compiler engineering, you start with a clean, formal EBNF grammar specification. We had no such luxury.

UniBasic has no formal grammar specification (at least nothing that is publicly available). To build our parsers, we had to reverse-engineer the syntax empirically by mining the client's 14,000-file codebase to study every real-world variation of how statements were written in production.

For example, a construct like `MATREAD` can appear with various combinations of optional clauses (`FROM`, `THEN`, `ELSE`, `LOCKED`, `ON ERROR`). By analyzing every production usage across the codebase, we uncovered how developers actually wrote these constructs over decades, allowing us to build parsers that handled real-world code rather than textbook assumptions. Their codebase itself became our living specification.

<div class="my-8 p-6 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
  <div class="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Commentary</div>
  <h4 class="text-lg font-bold text-zinc-900 mt-0 mb-3">On the Use of AI</h4>

  <p class="text-zinc-700 text-base leading-relaxed mb-4">
    Building a transpiler from scratch without an official grammar is an enormous undertaking. Throughout this project, we leveraged AI (specifically Claude) as an active engineering partner across four key areas:
  </p>

  <ol class="space-y-3 text-base text-zinc-700 list-decimal list-inside">
    <li><strong class="text-zinc-900">Identifying Usage Patterns:</strong> Claude helped identify various patterns of usage of complex constructs like <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">MATREAD</code> across the client's 14,000-file codebase.</li>
    <li><strong class="text-zinc-900">Developing Parsers on Established Foundations:</strong> It helped with the development of parsers after the foundation of the parser was built: a parser class providing methods like <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">expectIdentifier</code>, <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">expectKeyword</code>, and <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">expect*</code> to consume and validate tokens.</li>
    <li><strong class="text-zinc-900">Debugging Parser Gaps:</strong> It assisted in debugging parser gaps by analyzing failing programs and pinpointing syntax errors, until we built our own <a href="#the-series-roadmap" class="text-zinc-900 underline font-medium hover:text-indigo-600">Parser Tracing</a>.</li>
    <li><strong class="text-zinc-900">Explaining Legacy Functionality for Transformers:</strong> It provided explanations of legacy functionality for constructs like <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">OCONV</code>, <code class="font-mono text-xs bg-zinc-200/60 px-1.5 py-0.5 rounded text-zinc-900">MATREAD</code>, and dynamic arrays, which helped in building the <strong>transformers</strong> (the layer which converts the Source AST to the Java Target AST).</li>
  </ol>
</div>

### What is this Series About?

Building a transpiler that converts unstructured, dynamically typed code into structured, statically typed Java forces you to confront some of the most fascinating problems in software engineering.

This series pulls back the curtain on how we designed and built this transpiler. It covers the full lifecycle: from lexing and parsing non-standard grammars, to cross-program semantic analysis, restructuring GOTOs, reconstructing lexical scopes, and establishing strict engineering hygiene at scale.

### The Series Roadmap

Here is what is planned for this series:

1. **Transpiler Architecture:** A high-level tour of the 7-stage compilation pipeline: from discovery and Pratt parsing to cross-program semantic analysis, AST lowering, and pure emission.
2. **[Foundations of an Industrial Transpiler](/en/blog/foundations_of_an_industrial_transpiler/):** The core architectural pillars and engineering discipline that prevent a large-scale compiler from collapsing under real-world complexity.
3. **Observability in Compilers: Parser Tracing:** Demystifying parser failures in complex grammars by treating syntax trees like distributed tracing spans.
4. **Building the Target Runtime:** Why every transpiler needs a "standard library" to bridge semantic impedance mismatches, and how to verify runtime contracts using automated stub generation.
5. **Semantic Analysis (SEMA):** Traversing and rewriting ASTs across whole-program compilation units using recursive rewriters and symbol registries.
6. **Fact Promotion & Scope Reconstruction:** Reconstructing lexical scopes, variable hoisting, and field promotions from an unscoped legacy language using deferred decision hints.
7. **Handling the Unhandleable: Eliminating GOTOs:** Transforming tangled, arbitrary jump patterns into structured loops, continues, breaks, and state machines across 13 passes.
8. **Transpiling at Enterprise Scale:** Validating 14,000+ programs against strict compilation gates, categorizing gaps, and practical takeaways from real-world migration.

Let's start with Transpiler Architecture.
