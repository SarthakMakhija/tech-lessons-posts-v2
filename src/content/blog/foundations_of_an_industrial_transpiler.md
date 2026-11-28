---
author: "Sarthak Makhija"
title: "Inside a Transpiler (Part 2): Foundations of an Industrial Transpiler"
description: "What separates a fragile script from production compiler engineering: two-tier ASTs, dumb emitters, decoupled runtimes, multi-pass micro-rewriters, and strict engineering discipline."
pubDate: 2026-11-24
weight: 2
tags: ["Compilers", "Transpiler", "Architecture", "Java", "Clean Code"]
draft: false
caption: "Inside a Transpiler (Part 2): Foundations of an Industrial Transpiler"
---

In the [introduction to this series](/en/blog/inside_a_transpiler_introduction/) and [Part 1: Transpiler Architecture](/en/blog/transpiler_architecture/), we outlined our mission: building an industrial-grade transpiler to migrate an enterprise codebase of **over 14,000 legacy UniBasic files** to Java 21.

Transpiling legacy code at this scale is not a syntax-mapping exercise; it is an exercise in rigorous compiler engineering. Before diving into the mechanics of parsing, semantic analysis, and control-flow deconstruction, we need to examine the bedrock principles that keep a large compiler maintainable.

---

### The Fragile Prototype Trap

Transpilers are deceptively easy to start.

When you look at simple, linear code, direct one-to-one translation seems completely within reach:

```basic
X = 10
PRINT X
```

It is tempting to think you can simply walk the source syntax and emit matching Java strings on the fly:

```java
var x = 10;
System.out.println(x);
```

This creates an illusion of rapid progress. That illusion collapses the moment you encounter even a minimal real-world program:

```basic
DIM SCORES(3)
TOTAL = 0
SCORES(1) = 10
GOSUB ADD.SCORE
PRINT TOTAL
STOP

ADD.SCORE:
    TOTAL = TOTAL + SCORES(1)
RETURN
```

Suddenly, naive one-to-one string emission completely falls apart:

* **Scope Mismatch:** In UniBasic, `ADD.SCORE` is just an address label sharing the caller's variable scope. In Java, it must become a private method (such as `addScore()` or `labelAddScore()`). Because both the main routine and this method read and mutate `TOTAL`, `TOTAL` cannot be a local variable (`var total = 0;`). It must be promoted to a class-level instance field (`this.total`).
* **Lexical Scope Traps:** If a variable is first assigned inside a loop or conditional block, declaring it with `var` inside that block traps it inside Java's curly braces, making it inaccessible after the block ends.
* **Array Semantics:** UniBasic arrays are 1-indexed, dynamically sized structures, not native 0-indexed Java arrays.

In compiler engineering, :h[**the first 90% of the syntax represents 10% of the complexity**]. Ad-hoc converters that try to emit Java directly from source constructs quickly devolve into an unmaintainable tangle of global flags, ad-hoc string replacements, and brittle edge-case patches.

To survive tens of thousands of legacy files, :h[a transpiler cannot be a syntactic string mapper; it must be built on **strict architectural foundations**].

We organize these foundations into five core architectural pillars:

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 my-8 font-sans">
  <div class="p-6 bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"></circle><circle cx="5" cy="19" r="2"></circle><circle cx="19" cy="19" r="2"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5m0 0l-7 5m7-5l7 5"></path></svg>
        </div>
        <div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600">Pillar 1</div>
          <div class="font-bold text-[17.5px] font-sans text-zinc-900 leading-snug">Two-Tier ASTs &amp; Modular Syntax</div>
        </div>
      </div>
      <div class="text-[15px] font-sans text-zinc-700 leading-relaxed my-3 space-y-2">
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/60 mt-0.5 shrink-0">1.1</span>
          <a href="#11-strict-separation-of-source-and-target-ast" class="hover:text-indigo-900 transition-colors">Strict separation of source &amp; target AST</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/60 mt-0.5 shrink-0">1.2</span>
          <a href="#12-composable-statement-dispatch-parsers--transformers" class="hover:text-indigo-900 transition-colors">Composable statement dispatch</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/60 mt-0.5 shrink-0">1.3</span>
          <a href="#13-modular-expression-parsing-via-pratt-parselets" class="hover:text-indigo-900 transition-colors">Pratt parsing for 10+ precedence levels</a>
        </div>
      </div>
    </div>
    <a href="#pillar-1-two-tier-asts--modular-syntax-analysis" class="inline-flex items-center text-sm font-semibold font-sans text-indigo-700 hover:text-indigo-900 transition-colors mt-3 pt-3 border-t border-indigo-100/60">
      <span>Read Pillar 1</span>
      <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>

  <div class="p-6 bg-gradient-to-br from-purple-50/50 via-white to-white border border-purple-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-purple-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-purple-100/80 border border-purple-200/60 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        </div>
        <div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600">Pillar 2</div>
          <div class="font-bold text-[17.5px] font-sans text-zinc-900 leading-snug">Semantic Analysis via Micro-Rewriters</div>
        </div>
      </div>
      <div class="text-[15px] font-sans text-zinc-700 leading-relaxed my-3 space-y-2">
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">2.1</span>
          <a href="#21-syntax-vs-meaning-never-mix-parsing-with-sema" class="hover:text-purple-900 transition-colors">Syntax vs. meaning isolation</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200/60 mt-0.5 shrink-0">2.2</span>
          <a href="#22-multi-pass-micro-rewriters-over-a-god-visitor" class="hover:text-purple-900 transition-colors">Composable micro-rewriters over immutable ASTs</a>
        </div>
      </div>
    </div>
    <a href="#pillar-2-semantic-analysis-via-micro-rewriters" class="inline-flex items-center text-sm font-semibold font-sans text-purple-700 hover:text-purple-900 transition-colors mt-3 pt-3 border-t border-purple-100/60">
      <span>Read Pillar 2</span>
      <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>

  <div class="p-6 bg-gradient-to-br from-amber-50/50 via-white to-white border border-amber-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
        </div>
        <div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600">Pillar 3</div>
          <div class="font-bold text-[17.5px] font-sans text-zinc-900 leading-snug">Zero-Decision Code Generation</div>
        </div>
      </div>
      <div class="text-[15px] font-sans text-zinc-700 leading-relaxed my-3 space-y-2">
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200/60 mt-0.5 shrink-0">3.1</span>
          <a href="#31-the-smart-emitter-antipattern" class="hover:text-amber-900 transition-colors">The smart emitter antipattern</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200/60 mt-0.5 shrink-0">3.2</span>
          <a href="#32-the-dumb-emitter-pattern--layout-templates" class="hover:text-amber-900 transition-colors">The dumb emitter pattern &amp; layout templates</a>
        </div>
      </div>
    </div>
    <a href="#pillar-3-zero-decision-code-generation" class="inline-flex items-center text-sm font-semibold font-sans text-amber-700 hover:text-amber-900 transition-colors mt-3 pt-3 border-t border-amber-100/60">
      <span>Read Pillar 3</span>
      <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>

  <div class="p-6 bg-gradient-to-br from-sky-50/50 via-white to-white border border-sky-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-sky-300 transition-all duration-300">
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-sky-100/80 border border-sky-200/60 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
        </div>
        <div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-600">Pillar 4</div>
          <div class="font-bold text-[17.5px] font-sans text-zinc-900 leading-snug">Decoupled Runtime &amp; Observability</div>
        </div>
      </div>
      <div class="text-[15px] font-sans text-zinc-700 leading-relaxed my-3 space-y-2">
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200/60 mt-0.5 shrink-0">4.1</span>
          <a href="#41-decoupled-runtime--contract-first-verification" class="hover:text-sky-900 transition-colors">Decoupled runtime &amp; contract verification</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200/60 mt-0.5 shrink-0">4.2</span>
          <a href="#42-parser-tracing-visibility-over-guesswork" class="hover:text-sky-900 transition-colors">Parser tracing: visibility over guesswork</a>
        </div>
      </div>
    </div>
    <a href="#pillar-4-decoupled-runtime--observability" class="inline-flex items-center text-sm font-semibold font-sans text-sky-700 hover:text-sky-900 transition-colors mt-3 pt-3 border-t border-sky-100/60">
      <span>Read Pillar 4</span>
      <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>

  <div class="p-6 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-300 md:col-span-2">
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        </div>
        <div>
          <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Pillar 5</div>
          <div class="font-bold text-[17.5px] font-sans text-zinc-900 leading-snug">Engineering Hygiene as an Architectural Requirement</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 mt-0.5 shrink-0">5.1</span>
          <a href="#51-one-to-one-test-parity--single-assertion-discipline" class="hover:text-emerald-900 transition-colors text-[14.5px] leading-snug">One-to-one test parity &amp; single-assertion discipline</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 mt-0.5 shrink-0">5.2</span>
          <a href="#52-the-zero-abbreviations-rule" class="hover:text-emerald-900 transition-colors text-[14.5px] leading-snug">The zero-abbreviations rule</a>
        </div>
        <div class="flex items-start gap-2.5">
          <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 mt-0.5 shrink-0">5.3</span>
          <a href="#53-deterministic-reproducible-emission" class="hover:text-emerald-900 transition-colors text-[14.5px] leading-snug">Deterministic, reproducible emission</a>
        </div>
      </div>
    </div>
    <a href="#pillar-5-engineering-hygiene-as-an-architectural-requirement" class="inline-flex items-center text-sm font-semibold font-sans text-emerald-700 hover:text-emerald-900 transition-colors mt-3 pt-3 border-t border-emerald-100/60">
      <span>Read Pillar 5</span>
      <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>
</div>

---

### Pillar 1: Two-Tier ASTs & Modular Syntax Analysis

Before transforming legacy code, the transpiler must ingest and model it faithfully in its native structure, completely isolated from target-language concepts. Pillar 1 establishes this foundation through three decoupled layers:

* [**1.1 Strict Separation of Source and Target AST**](#11-strict-separation-of-source-and-target-ast): Maintaining two completely independent, sealed AST hierarchies joined by a dedicated transformer layer.
* [**1.2 Composable Statement Dispatch (Parsers & Transformers)**](#12-composable-statement-dispatch-parsers--transformers): Dispatching compound statements recursively through registry-driven parsers and transformers.
* [**1.3 Modular Expression Parsing via Pratt Parselets**](#13-modular-expression-parsing-via-pratt-parselets): Parsing complex expressions across 10+ precedence levels using modular, extensible parselets.

#### 1.1 Strict Separation of Source and Target AST

A common mistake in transpiler design is attempting to use a single AST: creating a single "hybrid" AST where source language constructs and target language constructs are crammed into the same AST nodes.

In a single hybrid AST, individual nodes are forced to accommodate both worlds. An assignment or statement node must hold UniBasic concepts (such as matrix dimensioning, dynamic multi-value indices, or common block pointers) alongside Java concepts (such as visibility modifiers, static vs. instance designations, and target types). Traversal logic becomes cluttered with defensive checks: is this node still in its source form, or has it already been partially transformed into target Java? Changes to the source grammar inadvertently ripple into target generation, and changes to the target Java output force changes to the source AST.

In our architecture, the boundary between the source language and target language is absolute. We maintain :h[**two completely independent, sealed AST hierarchies**]:

<div class="my-10 max-w-xl space-y-3 font-sans">
  <div class="flex items-center justify-center">
    <div class="px-4 py-1.5 bg-white border border-zinc-200/90 rounded-lg text-xs font-mono font-semibold text-zinc-700 shadow-xs flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-blue-500"></span>
      <span>UniBasic Source Code</span>
    </div>
  </div>
  <div class="flex flex-col items-center">
    <div class="w-0.5 h-5 bg-zinc-300"></div>
    <div class="px-3.5 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-600 shadow-xs flex items-center gap-1.5 -my-1 z-10 font-sans">
      <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      <span>Parser &amp; SEMA</span>
    </div>
    <div class="w-0.5 h-5 bg-indigo-300"></div>
  </div>
  <div class="p-5 bg-white border border-indigo-200/80 rounded-xl shadow-xs relative">
    <div class="flex items-center justify-between mb-2">
      <span class="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">source.ast</span>
      <span class="text-xs text-zinc-500 font-mono uppercase tracking-wider">Source AST</span>
    </div>
    <div class="text-[15px] font-bold font-sans text-zinc-900 mb-1">UniBasic Language Hierarchy</div>
    <div class="text-[14px] font-sans text-zinc-600 leading-relaxed">Models legacy syntax exclusively (<code>Statement.If</code>, <code>Statement.MatRead</code>, <code>Expression.FieldAccess</code>). Contains zero Java references.</div>
  </div>
  <div class="flex flex-col items-center">
    <div class="w-0.5 h-6 bg-indigo-300"></div>
    <div class="px-4 py-1.5 bg-white border border-purple-200 rounded-full text-xs font-semibold text-purple-700 shadow-xs flex items-center gap-1.5 -my-1 z-10 font-sans">
      <svg class="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      <span>Transformer Layer (The Architectural Bridge)</span>
    </div>
    <div class="w-0.5 h-6 bg-emerald-300"></div>
  </div>
  <div class="p-5 bg-white border border-emerald-200/80 rounded-xl shadow-xs relative">
    <div class="flex items-center justify-between mb-2">
      <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">target.ast</span>
      <span class="text-xs text-zinc-500 font-mono uppercase tracking-wider">Target AST</span>
    </div>
    <div class="text-[15px] font-bold font-sans text-zinc-900 mb-1">Java 21 Language Hierarchy</div>
    <div class="text-[14px] font-sans text-zinc-600 leading-relaxed">Pure representation of target Java constructs (<code>Statement.Class</code>, <code>Statement.Method</code>, <code>Statement.LocalDeclaration</code>). Contains zero legacy concepts.</div>
  </div>
  <div class="flex flex-col items-center">
    <div class="w-0.5 h-5 bg-emerald-300"></div>
    <div class="px-3.5 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-600 shadow-xs flex items-center gap-1.5 -my-1 z-10 font-sans">
      <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      <span>Fact Promotion &amp; Pure Emitter</span>
    </div>
    <div class="w-0.5 h-5 bg-zinc-300"></div>
  </div>
  <div class="flex items-center justify-center">
    <div class="px-4 py-1.5 bg-emerald-50 border border-emerald-200/90 rounded-lg text-xs font-mono font-semibold text-emerald-800 shadow-xs flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span>Formatted Java 21 Code</span>
    </div>
  </div>
</div>

* **The Source AST (`source.ast`):** Models the grammar and semantics of the source language exclusively. It contains sealed records like `Statement.If`, `Statement.MatRead`, `Statement.GoSub`, and `Expression.FieldAccess`. It knows nothing about Java, classes, visibility modifiers, or JVM types.
* **The Target AST (`target.ast`):** Models the structure of Java 21. It contains sealed records like `Statement.Class`, `Statement.Method`, `Statement.LocalDeclaration` and `Statement.TryCatch`. It knows nothing about UniBasic syntax or legacy semantics.
* **The Transformer Layer (`com.unibasictojava.transpiler.transformer`):** :h[The layer that acts as the bridge between the two worlds.] A dedicated suite of specialized transformers (`StatementsTransformer`, `ExpressionTransformer`, `CallTransformer`, etc.) translates the analyzed and semantically enriched Source AST into a clean Target AST.

Once a program crosses this bridge, :h[no source AST node ever appears in the pipeline again]. Keeping the two representations strictly decoupled ensures that changes to the UniBasic grammar never ripple into Java code emission, and enhancements to Java output never complicate source parsing.

#### 1.2 Composable Statement Dispatch (Parsers & Transformers)

A common trap in parser development is the monolithic `switch` statement:

```java
// ANTIPATTERN: A giant central dispatcher that grows uncontrollably
public Statement parseStatement() {
    return switch (cursor.peek().type()) {
        case If -> parseIf();
        case For -> parseFor();
        case Loop -> parseLoop();
        case BeginCase -> parseBeginCase();
        // ... 60 more cases in one gigantic class
        default -> parseAssignment();
    };
}
```

Every time a new statement construct is supported, this central class must be modified, creating merge conflicts, breaking existing logic, and forcing monolithic unit tests.

**Composable Statement Parsing: `StatementParser` & `StatementParserRegistry`**

In our architecture, statement parsing is modular and registry-driven:

* **`StatementParser`:** The single-statement entry point. It parses *exactly one statement* and returns, delegating to `StatementParserRegistry` for keyword-led statements or falling back to assignments.
* **`StatementParserRegistry`:** Maps each statement-leading `TokenType` to an isolated statement parser (`IfParser`, `ForParser`, `LoopParser`, `BeginCaseParser`, `MatReadParser`, etc.).

```java
// Simplified for illustration
public class StatementParser {
    private final StatementParserRegistry registry;

    public StatementParser(TokenCursor cursor) {
        this.registry = new StatementParserRegistry(cursor, this);
    }

    public Statement parse() {
        return this.registry.lookup(cursor.peek().type())
            .map(Supplier::get)
            .orElseGet(this::parseAssignment);
    }
}
```

The key to this design is how it handles nested statements. Compound statements like `IF`, `LOOP`, and `FOR` contain statement blocks inside their bodies. Instead of implementing separate parsing loops inside each parser, compound parsers simply accept `StatementParser` in their constructor:

```java
// Inside StatementParserRegistry: registering statement parsers
parsers.put(TokenType.If,   new IfParser(cursor, statementParser)::parse); // [!code focus]
parsers.put(TokenType.Loop, new LoopParser(cursor, statementParser)::parse); // [!code focus]
parsers.put(TokenType.For,  new ForParser(cursor, statementParser)::parse); // [!code focus]
```

When `IfParser` needs to parse statements inside a `THEN` or `ELSE` block, it delegates right back to `statementParser.parse()`.

This creates an apparent chicken-and-egg problem: `StatementParser` needs the registry to dispatch statements, while parsers inside the registry need `StatementParser` to parse nested statements. We resolve this cleanly by passing `StatementParser` (`this`) into the registry's constructor. Because child parsers only invoke `statementParser.parse()` when actively parsing a file (never during construction), `StatementParser` is already fully initialized before any parser executes.

Adding a new language construct to the grammar (such as `MATBUILD`) is :h[strictly additive: implement an isolated parser class and register it in `StatementParserRegistry`].

**The Architectural Mirror: `StatementsTransformer` & `StatementsTransformerRegistry`**

Crucially, this exact composition model is mirrored in the **Transformer Layer**:

* **`StatementsTransformer`:** Dispatches a single UniBasic `Statement` (or a `List<Statement>`) to its dedicated transformer.
* **`StatementsTransformerRegistry`:** Maps each concrete Source AST class (`Statement.If.class`, `Statement.Loop.class`, `Statement.MatRead.class`) to its specialized `Transformer`.

When `IfTransformer` converts an `If` statement from Source AST to Java Target AST, it receives `StatementsTransformer` at construction:

```java
// Inside StatementsTransformerRegistry: mirroring the parser composition
transformers.put(Statement.If.class, new IfTransformer(statementsTransformer, rules)); // [!code focus]
transformers.put(Statement.Loop.class, new LoopTransformer(statementsTransformer)); // [!code focus]
```

When transforming the statements in its `THEN` branch, `IfTransformer` calls back into `statementsTransformer.transformAll(statement.thenStatements())`.

:h[This symmetry between parsing and transformation makes the codebase remarkably intuitive]: whether you are parsing UniBasic syntax into a Source AST or transforming a Source AST into a Target AST, the dispatch and composition model is identical.

#### 1.3 Modular Expression Parsing via Pratt Parselets

While statements follow predictable keyword-led grammar boundaries, expressions are inherently recursive and operator-heavy.

In standard recursive descent, every operator precedence level requires a dedicated grammar method:

```java
parseExpression() -> parseOr() -> parseAnd() -> parseEquality() 
                  -> parseRelational() -> parseConcat() -> parseAdditive() 
                  -> parseMultiplicative() -> parseUnary() -> parsePrimary()
```

With 10+ distinct precedence levels, standard recursive descent collapses under its own weight: each precedence tier demands its own grammar method, and evaluating even a simple integer literal cascades through a deeply chained stack of 10+ method calls. Modifying precedence or introducing new operators forces you to rewire the entire call hierarchy.

**Pratt Parsing: Precedence as a Numeric Floor**

To parse expressions cleanly, our transpiler implements a **Pratt (Top-Down Operator Precedence) Parser**.

In a Pratt parser, precedence is encoded as a number passed through a single recursive loop rather than nested methods:

> **Consume the next operator only if its precedence is higher than the current level.**

The core loop in `ExpressionParser` drives the entire expression grammar:

```java
// Pratt Parsing Core Loop
public Expression parse(Precedence minimumPrecedence) {
    Token token = advance();
    PrefixParselet prefixParselet = parseletRegistry.lookupPrefix(token.type()) // [!code focus]
            .orElseThrow(() -> new UnsupportedPrefixParseletException(token));

    Expression left = prefixParselet.parse(token, this); // [!code focus]
    while (minimumPrecedence.isLessThan(precedenceOfNext())) { // [!code focus]
        Token operator = advance();
        left = parseletRegistry.lookupInfix(operator.type()) // [!code focus]
                .orElseThrow()
                .parse(left, operator, this); // [!code focus]
    }
    return left;
}
```

**Prefix vs. Infix Parselets**

Every token role is encapsulated in a tiny, single-purpose **Parselet**:

* **`PrefixParselet` (At the start of an expression):** Handles constructs that introduce a value without a left-hand operand, such as literals (`42`, `"hello"`) or unary operators (`-X`, `NOT flag`).
* **`InfixParselet` (Between or after sub-expressions):** Handles operators that combine or transform existing sub-expressions, such as binary arithmetic (`+`, `*`), string concatenation (`:`), or comparisons (`=`, `#`, `>`).

Left-associativity falls out naturally: when an infix parselet parses its right-hand side, it passes its own precedence as `minimumPrecedence`. The right-hand side automatically stops before consuming another operator at the same precedence level, correctly nesting `(A + B) + C`.

**Self-Contained Parselets & The `ParseletRegistry`**

By decoupling token dispatch into `ParseletRegistry`, expressions are parsed by focused, reusable parselets rather than monolithic parser methods.

Rather than creating a distinct class for every single operator, a generic parselet like `BinaryOperatorParselet` handles entire groups of binary operations (`+`, `-`, `*`, `/`, `AND`, `OR`) simply parameterized by their `Precedence` level. Specialized parselets are reserved for constructs with unique parsing behavior (such as `LessThanParselet`, `OpenParenthesesParselet`, or `WholeNumberLiteralParselet`).

For example, parsing a whole number literal is as simple as:

```java
// Prefix Parselet: parses a whole number literal token into an AST node
public class WholeNumberLiteralParselet implements PrefixParselet {
    @Override
    public Expression parse(Token token, ExpressionParser expressionParser) {
        return new Expression.IntegerLiteral(Integer.parseInt(token.lexeme())); // [!code focus]
    }
}
```

Meanwhile, standard binary operators are handled by a single reusable `BinaryOperatorParselet`:

```java
// Infix Parselet: reusable parselet for standard binary operators
public class BinaryOperatorParselet implements InfixParselet {
    // ... constructor and precedence getter omitted ...

    @Override
    public Expression parse(Expression left, Token operator, ExpressionParser expressionParser) {
        Expression right = expressionParser.parse(precedence); // [!code focus]
        return new Expression.Binary(left, BinaryOperator.from(operator.type()), right); // [!code focus]
    }
}
```

In `ParseletRegistry`, standard operators are registered simply by pairing their token type with an instance of `BinaryOperatorParselet` configured with the right precedence:

```java
// Reusing BinaryOperatorParselet across operator groups
infixParselets.put(TokenType.Or,    new BinaryOperatorParselet(Precedence.Or));
infixParselets.put(TokenType.And,   new BinaryOperatorParselet(Precedence.And));
infixParselets.put(TokenType.Plus,  new BinaryOperatorParselet(Precedence.Additive));
infixParselets.put(TokenType.Minus, new BinaryOperatorParselet(Precedence.Additive));
infixParselets.put(TokenType.Star,  new BinaryOperatorParselet(Precedence.Multiplicative));
infixParselets.put(TokenType.Slash, new BinaryOperatorParselet(Precedence.Multiplicative));
```

:h[Adding a new operator or literal requires zero changes to the Pratt loop]: simply register it under its token type in `ParseletRegistry`, either by reusing `BinaryOperatorParselet` with its precedence level, or by introducing a specialized parselet for non-standard syntax.

---

### Pillar 2: Semantic Analysis via Micro-Rewriters

Once an AST is parsed syntactically, the compiler must determine what that syntax actually means. Pillar 2 structures semantic analysis into two foundational principles:

* [**2.1 Syntax vs. Meaning (Never Mix Parsing with SEMA)**](#21-syntax-vs-meaning-never-mix-parsing-with-sema): Isolating syntactic validation from semantic meaning so files parse independently in parallel without cross-file locks.
* [**2.2 Multi-Pass Micro-Rewriters (Over a "God Visitor")**](#22-multi-pass-micro-rewriters-over-a-god-visitor): Replacing monolithic visitors with composable, single-purpose micro-rewriters operating over immutable ASTs.

#### 2.1 Syntax vs. Meaning (Never Mix Parsing with SEMA)

A parser's sole responsibility is **syntactic validation**:
> *"Does this sequence of tokens conform to the formal grammar of the language?"*

It should construct an Abstract Syntax Tree that faithfully mirrors the code structure as written, and then stop. :h[Giving that syntax **meaning** is the responsibility of a completely separate stage: **Semantic Analysis (SEMA)**].

A common pitfall in compiler design is attempting to resolve the meaning of constructs during parsing. In a legacy language like UniBasic, trying to mix semantics into parsing creates major roadblocks:

1. **Syntactic Ambiguity Cannot Be Resolved Locally:**
   In UniBasic, reading a dimensioned array and invoking a user-defined function share identical syntax:
   ```basic
   RESULT = VALUE(INDEX)
   ```
   Syntactically, this is simply an identifier followed by parenthesized arguments. If the parser attempts to decide whether this is an array lookup or a function call, it must know whether `VALUE` was declared in a `DIM` statement, included via an external `$INCLUDE` file, or defined as an external function. Because declarations in legacy code can appear anywhere (or inside external files), trying to resolve this during parsing requires premature symbol lookups and fragile backtracking. The parser should simply produce an invocation or subscript syntax node, leaving semantic disambiguation for later.

2. **Shared State Syntactically Mimics Local Variables:**
   UniBasic programs share global memory across processes using `COMMON` blocks (`COMMON /GLOBAL/ TOTAL, COUNTER`). Syntactically, an assignment like `TOTAL = 100` looks completely identical to assigning a local variable. The parser cannot know if `TOTAL` is a local variable or a shared inter-program reference without consulting a shared memory catalog. The parser should simply record `TOTAL` as an identifier, leaving shared memory mapping to SEMA.

3. **Loss of Parallel Parsing Across 14,000 Files:**
   When parsing is strictly syntactic, :h[every source file can be parsed completely in isolation]. You can parse all 14,000 files concurrently in parallel across all CPU cores in seconds, because the parser never needs to read external files, load symbol tables, or resolve cross-program dependencies. If parsing required resolving symbols or included types, you would be forced into a slow, sequential compilation graph where parsing one file blocks on analyzing its dependencies.

By strictly isolating the parser, it produces a clean, purely syntactic `source.ast.UnibasicProgram`. All symbol resolution, type binding, DIM rewriting, common block bindings, and equate substitutions are deferred to **Semantic Analysis (SEMA)**.

#### 2.2 Multi-Pass Micro-Rewriters (Over a "God Visitor")

Once the parser completes syntactic validation, you have a raw, purely syntactic Source AST where expressions are just identifiers, literals, and operators.

This is where **Semantic Analysis (SEMA)** begins.

The purpose of semantic analysis is to inspect, enrich, and disambiguate this AST based on the language's execution model:
* Resolving whether an identifier refers to a local variable, a dimensioned array, or an entry in shared inter-program memory.
* Substituting constants defined across `$INCLUDE` files (`EQUATE`).
* Restructuring legacy jump mechanics (`GOTO`, `RETURN TO`).

**The "God Visitor" Antipattern in SEMA**

Many compilers attempt semantic analysis with a monolithic "God Visitor": a single class with thousands of lines of code that traverses the entire AST, maintaining complex internal stacks to track scopes, labels, common blocks, and types simultaneously.

God Visitors are a testing and maintenance nightmare. A bug fix made to handle dimensioned array indexing inside a loop inadvertently breaks variable scoping or label resolution elsewhere, because all semantic concerns share the same mutable traversal state and visitor methods.

**The Solution: Multi-Pass Micro-Rewriters**

Instead of a monolithic visitor, we structure SEMA as a pipeline of small, composable, single-purpose :h[**Micro-Rewriters**].

Each micro-rewriter implements an AST rewrite visitor that takes a `UnibasicProgram` (Source AST), :h[performs exactly one semantic normalization or enrichment, and produces a new `UnibasicProgram` with rewritten nodes]. The original AST is never mutated.

Here are a few concrete examples:

* **`DimAccessRewriter`:** In UniBasic, dimensioned arrays are declared with `DIM SCORES(10)` and indexed as `SCORES(1)`. Syntactically, `SCORES(1)` looks identical to a function call. `DimAccessRewriter` inspects a `DimRegistry` (built in a preceding collection pass) and rewrites plain identifier reads into explicit `Expression.ArrayGet` nodes, and assignment targets into `Expression.ArraySet` nodes. After this pass, all dimensioned array lookups and writes are explicitly distinguished from normal variables and function calls.
* **`CommonAccessRewriter`:** UniBasic programs share global memory across processes using `COMMON` blocks (`COMMON /GLOBAL/ TOTAL, COUNTER`). Syntactically, `TOTAL = 0` looks like a local variable assignment. `CommonAccessRewriter` matches identifiers against a `CommonRegistry` (also populated by a pre-pass) and rewrites variable reads to `Expression.CommonGet` and variable writes to `Statement.CommonSet`. Downstream stages now explicitly know that this variable access targets shared runtime memory rather than a local stack frame.
* **`MatParameterDimDropRewriter`:** When a subroutine declares an array parameter in its signature (`SUBROUTINE PROCESS(MAT DATA)`), legacy code often defensively repeats `DIM DATA(10)` inside the subroutine body. In Java, re-dimensioning an incoming array would discard the caller's instance. `MatParameterDimDropRewriter` detects this pattern and safely drops the redundant local `DIM` node, ensuring the parameter array reference passed by the caller is preserved.

**Why Micro-Passes Win**

1. **Extreme Testability:** Each micro-rewriter can be tested in isolation with 10-15 lines of unit tests verifying a single transformation rule (e.g., verifying that `DimAccessRewriter` rewrites `SCORES(1)` without needing to configure common blocks or GOTO analyzers).
2. **Composability and Separation of Concerns:** Passes can be reordered, inserted, or modified independently without unintended side effects on unrelated semantic checks.
3. **Immutability and Isolation:** Because rewriters produce fresh AST nodes rather than mutating trees in-place, one pass cannot accidentally corrupt the state of another.

---

### Pillar 3: Zero-Decision Code Generation

The final stage of the transpiler is emitting the Target AST into formatted Java source text.

The cardinal rule of code generation:

> :h[**If the emitter is making decisions, your architecture has failed.**]

The emitter should be a **pure printer**. Its sole responsibility is to walk the Target AST and serialize nodes into formatted text, handling indentation, semicolons, and curly braces. Pillar 3 enforces this separation across two key practices:

* [**3.1 The “Smart Emitter” Antipattern**](#31-the-smart-emitter-antipattern): Why embedding compiler state, type resolution, or scoping decisions in code generators leads to fragile, unmaintainable output.
* [**3.2 The Dumb Emitter Pattern & Layout Templates**](#32-the-dumb-emitter-pattern--layout-templates): Enforcing zero-decision, pure-printing AST walkers that delegate all text formatting to reusable layout templates.

#### 3.1 The "Smart Emitter" Antipattern

In fragile prototypes, the emitter is often the "dumping ground" for unresolved logic. Because earlier stages failed to determine variable scope or decide whether something is a field or a local, the emitter tries to figure it out on the fly:

```java
// ANTIPATTERN: A "smart" emitter trying to resolve semantics during text emission
public void emitAssignment(AssignmentNode node, StringBuilder sb) {
    if (this.isField(node.getName())) {
        sb.append("this.").append(node.getName());
    } else if (!this.isDeclared(node.getName())) {
        sb.append("var ").append(node.getName());
        this.markDeclared(node.getName());
    } else {
        sb.append(node.getName());
    }
    sb.append(" = ").append(emitExpression(node.getValue())).append(";\n");
}
```

Allowing the emitter to make semantic decisions introduces fundamental architectural problems:

1. **Single Responsibility Principle Broken:** An emitter has one job: serialize AST nodes into formatted text. When an emitter also resolves variable scoping, promotes fields, or tracks declarations, it conflates presentation with compiler semantics.
2. **Target AST Changes Ripple into Emitters:** If target AST definitions evolve, smart emitters must be rewritten because their embedded semantic logic is tangled with formatting. A dumb emitter is merely a transparent string printer for its corresponding node.
3. **Scattered Core Business Logic:** Translation rules and language semantics become fragmented across arbitrary printer classes and string concatenations instead of living in dedicated, inspectable AST passes.
4. **Untestable in Isolation:** You cannot unit test code formatting without setting up or mocking the entire compiler state (symbol scopes, declared variable registries, and enclosing blocks).

#### 3.2 The Dumb Emitter Pattern & Layout Templates

In our transpiler, all semantic decisions: scoping, field promotions, parentheses wrapping, type conversions, and import collections, are fully resolved and encoded as explicit AST nodes *before* the emitter runs.

Notice how simple and dumb the corresponding emitters become:

```java
// Base Emitter: Coordinates emission and automatic statement termination
public abstract class Emitter {

    public final Template emit(Statement statement) {
        Template template = this.emitStatement(statement);
        return this.needsStatementTerminator() ? template.addStatementTerminator() : template; // [!code focus]
    }

    protected abstract Template emitStatement(Statement statement);

    protected abstract boolean needsStatementTerminator(); // [!code focus]
}

// AssignmentEmitter: Zero decisions. Delegates layout and declares terminator requirement.
public final class AssignmentEmitter extends Emitter {

    @Override
    protected Template emitStatement(Statement statement) {
        Statement.Assignment assignment = (Statement.Assignment) statement;
        return FixedLayoutTemplate.assignment( // [!code focus]
                expressionEmitter.emit(assignment.target()), // [!code focus]
                expressionEmitter.emit(assignment.value()) // [!code focus]
        ); // [!code focus]
    }

    @Override
    protected boolean needsStatementTerminator() {
        return true; // [!code focus]
    }
}
```

> **Separating Emitters from Layout Templates:**
>
> Emitters do not perform string manipulation or concatenate delimiters directly. Instead, they delegate formatting to **Layout Templates** (such as `FixedLayoutTemplate`). This separation provides three core architectural advantages:
> 
> * **1. Composition of Layouts over String Buffers:** Rather than appending characters to a mutable `StringBuilder`, emitters construct :h[composable] `Template` trees. Layout templates can wrap, nest, or structurally augment other templates (such as wrapping expressions in parentheses via `FixedLayoutTemplate.group(inner)`, negating with `FixedLayoutTemplate.logicalNot(operand)`, or joining argument lists via `CommaSeparatedTemplate`). Furthermore, indentation depth is automatically propagated down the tree on demand (`child.render(depth + 1)`), eliminating manual whitespace accounting.
> * **2. Clean Statement Termination via `needsStatementTerminator`:** In Java, simple statements (`assignment`, `localDeclaration`, `return`, `throw`) require a trailing semicolon, whereas compound statements with braced bodies (`if`, `for`, `while`, `tryCatch`) must never end with a semicolon. If emitters emitted raw strings, every emitter would have to manually append `";"`, or parent emitters would have to defensively inspect, strip, or append semicolons to raw strings. Because emitters return a `Template`, statement termination is a clean decorator (`template.addStatementTerminator()`), automatically applied by the base `Emitter` based on each subclass's `needsStatementTerminator()` contract.
> * **3. Independent Testability:** Layout templates can be unit tested in isolation using dummy text to verify exact punctuation, braces, and line breaks without touching compiler AST nodes. Conversely, emitters can be tested solely for correct AST traversal and child delegation without asserting on brittle whitespace or formatting details.

If a variable needs to be emitted as `this.total = ...`, upstream passes rewrite the assignment target into an `Expression.FieldReference("total")` before it ever reaches the emitter. If it is a new local variable, upstream passes rewrite it into a `Statement.LocalDeclaration`.

:h[The emitter never checks state or makes decisions.] It simply asks child emitters to render the target and value, and wraps them in a layout template.

---

### Pillar 4: Decoupled Runtime & Observability

Transpiling 14,000 files requires uncompromising safety and diagnostic visibility. Pillar 4 establishes runtime reliability and developer ergonomics through two critical mechanisms:

* [**4.1 Decoupled Runtime & Contract-First Verification**](#41-decoupled-runtime--contract-first-verification): Preventing runtime contract drift across Gradle modules using candidate modeling and reflection-based verification.
* [**4.2 Parser Tracing: Visibility Over Guesswork**](#42-parser-tracing-visibility-over-guesswork): Providing instant diagnostic visibility into syntax failures using hierarchical span tracking.

#### 4.1 Decoupled Runtime & Contract-First Verification

:h[A transpiler should not attempt to lower every legacy construct into raw target-language primitives.]

In UniBasic, an assignment like `REC<1, 2> = "ACTIVE"` modifies the second value of the first field in a dynamic multi-value string. If the transpiler attempted to inline the string parsing, delimiter scanning, index bound checks, and character allocations directly into the emitted Java method, the output would be completely unreadable and bloated.

Instead, the transpiler emits calls to a dedicated **Runtime Library** (`com.unibasic.runtime`). The runtime acts as the target language's standard library, providing:
* **`UnibasicValue`:** The universal reference cell supporting string/number duality and pass-by-reference mutation.
* **Dynamic Multi-Value Helpers:** Delimiter extraction and mutation routines (`extractField`, `replaceField`).
* **Session State Management:** Coordinated state handling for inter-program `COMMON` memory blocks.

**Contract Drift: The Distributed Library Danger**

A critical architectural danger when maintaining a separate runtime library is **contract drift**: the transpiler emits calls to a runtime method expecting four arguments, but someone refactors the runtime method to accept five arguments. In an ad-hoc system, this failure is only discovered when compiling the emitted output.

To prevent drift, our build enforces an explicit :h[**Contract-First Verification** mechanism across three dedicated Gradle modules]:

<div class="my-10 max-w-xl space-y-4 font-sans">
  <div class="p-5 bg-white border border-blue-200/80 rounded-xl shadow-xs relative">
    <div class="flex items-center justify-between mb-2">
      <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">:transpiler</span>
      <span class="text-xs text-zinc-500 font-mono uppercase tracking-wider">Module</span>
    </div>
    <div class="text-[15px] font-bold font-sans text-zinc-900 mb-1">Models Runtime Call Candidates</div>
    <div class="text-[14px] font-sans text-zinc-600 leading-relaxed">Represents runtime calls as explicit candidates (e.g., <code>SubstringAccessCandidate</code>) instead of generating method calls that are scattered across transformers.</div>
  </div>
  <div class="flex flex-col items-center">
    <div class="w-0.5 h-6 bg-blue-300"></div>
    <div class="px-3.5 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-600 shadow-xs flex items-center gap-1.5 -my-1 z-10 font-sans">
      <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      <span>inspects candidates via reflection</span>
    </div>
    <div class="w-0.5 h-6 bg-amber-300"></div>
  </div>
  <div class="p-5 bg-white border border-amber-200/80 rounded-xl shadow-xs relative">
    <div class="flex items-center justify-between mb-2">
      <span class="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">:tools</span>
      <span class="text-xs text-zinc-500 font-mono uppercase tracking-wider">Module</span>
    </div>
    <div class="text-[15px] font-bold font-sans text-zinc-900 mb-1">Generates Runtime Method Stubs</div>
    <div class="text-[14px] font-sans text-zinc-600 leading-relaxed">Inspects candidate targets across the compiler and generates formal method descriptor stubs and contracts.</div>
  </div>
  <div class="flex flex-col items-center">
    <div class="w-0.5 h-6 bg-amber-300"></div>
    <div class="px-3.5 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-600 shadow-xs flex items-center gap-1.5 -my-1 z-10 font-sans">
      <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
      <span>verifies signature parity via reflection</span>
    </div>
    <div class="w-0.5 h-6 bg-emerald-300"></div>
  </div>
  <div class="p-5 bg-white border border-emerald-200/80 rounded-xl shadow-xs relative">
    <div class="flex items-center justify-between mb-2">
      <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">:runtime</span>
      <span class="text-xs text-zinc-500 font-mono uppercase tracking-wider">Module</span>
    </div>
    <div class="text-[15px] font-bold font-sans text-zinc-900 mb-1">Handwritten Runtime Library</div>
    <div class="text-[14px] font-sans text-zinc-600 leading-relaxed">Houses <code>UnibasicRuntime</code>. Automatically validates signature parity in <code>RuntimeContractTest</code>, failing the build immediately if any contract drifts.</div>
  </div>
</div>

The transpiler ensures runtime calls are represented as explicit candidates:

```java
// Candidate representing X[start, length] -> UnibasicRuntime.substring(x, start, length)
public record SubstringAccessCandidate(SubstringAccess substringAccess) implements EligibleForRuntimeCall {
    @Override
    public RuntimeTarget runtimeTarget() {
        return new RuntimeTarget(RuntimeClass.UNIBASIC_RUNTIME, "substring", JavaType.UNIBASIC_VALUE); // [!code focus]
    }

    // ... argument extraction and candidate methods omitted ...
}
```

* **`:transpiler` Models Runtime Candidates:** Rather than generating method calls that are scattered across transformers, the transpiler models each runtime operation as a candidate implementing `EligibleForRuntimeCall` (such as `SubstringAccessCandidate`).
* **`:tools` inspects candidates and generates stubs:** A separate Gradle module inspects candidate classes via reflection and generates formal stub descriptors capturing every expected method signature.
* **`:runtime` verifies contracts against the stubs:** Another Gradle module houses the actual handwritten runtime library and validates signature parity via reflection in `RuntimeContractTest`. Any mismatch fails the build immediately.

#### 4.2 Parser Tracing: Visibility Over Guesswork

When transpiling over 14,000 files spanning millions of lines of legacy code, treating the parser as a black box is a recipe for failure. When parsing fails hundreds of lines into a complex legacy program with deeply nested conditional blocks, loops, and labels, a standard Java exception stack trace is practically useless. It tells you the exact token where the cursor gave up, but provides zero context on how the parser navigated into that state or what grammar rule it was attempting to match.

To diagnose parser gaps instantly, the transpiler includes a built-in parser tracing subsystem (`ParserTrace`):

* **What is a Span?** A span records the execution of a statement parser: the parser runtime class (e.g., `IfParser`, `AssignmentParser`), its nesting depth in the grammar hierarchy, the token where parsing began, and the token where it concluded.
* **What is a Trace?** A trace is the ordered, hierarchical timeline of active and completed spans captured across a single source file.
* **Statement-Only Instrumentation:** Tracing instruments statement parsers only (via `openSpan` and `closeSpan` in `StatementParserRegistry`). Expression parsing is intentionally left uninstrumented, preserving Pratt parsing speed without adding allocation overhead across millions of math and identifier tokens.
* **Sealed on Failure:** When a `ParseException` occurs, all currently open spans are sealed (`sealOnFailure`) and attached directly to the exception.

When executed with the `--trace` flag, the transpiler CLI formats this into a visual hierarchical trace report, providing an indented breakdown of the active parse path directly to the point of failure:

```text
  SubroutineParser                     SUBROUTINE → PRINT  (line 1 → 7)
    AssignmentParser                     INVOICE.TOTAL → IF  (line 2 → 3)
    IfParser                             IF → NOCONVERT  (line 3 → 6)
      AssignmentParser                     INVOICE.TOTAL → END  (line 4 → 5)
    AssignmentParser                     NOCONVERT → PRINT  (line 6 → 7)
```

Instead of stepping through thousands of tokens in an interactive debugger, :h[an engineer can diagnose the failure in seconds simply by reading the trace bottom-up].

By inspecting the trace from the bottom up, you immediately identify the innermost statement parser active at the moment of failure. Looking at the starting and concluding tokens consumed by each parser reveals the exact token boundary: you can see precisely how far the cursor advanced, whether a child parser over-consumed a delimiter, or which enclosing construct failed to match its closing boundary.

---

### Pillar 5: Engineering Hygiene as an Architectural Requirement

In standard application development, teams often tolerate small compromises: a few missed edge-case tests, a cryptic variable abbreviation, or non-deterministic hash iteration.

In compiler engineering, :h[**code hygiene is an architectural requirement**]. When your code operates on thousands of abstract syntax trees, ambiguity in naming or testing creates exponential cognitive drag. Pillar 5 enforces this discipline through three strict rules:

* [**5.1 One-to-One Test Parity & Single-Assertion Discipline**](#51-one-to-one-test-parity--single-assertion-discipline): Mirroring every production class with an isolated test class where each test asserts exactly one behavior.
* [**5.2 The Zero-Abbreviations Rule**](#52-the-zero-abbreviations-rule): Eliminating cryptic abbreviations (`ctx`, `buf`, `stmt`) in favor of expressive, searchable names.
* [**5.3 Deterministic, Reproducible Emission**](#53-deterministic-reproducible-emission): Enforcing alphabetical sorting of fields, methods, and imports to guarantee byte-identical code generation.

#### 5.1 One-to-One Test Parity & Single-Assertion Discipline

Every single production class has an exact corresponding test class. Furthermore, each test method asserts **exactly one behavior** and is named as a complete, readable sentence:

```java
@Test
void tokenizesWholeNumberLiteralAsConstantExpression() {
    Token token = lexer.next();
    assertThat(token.type()).isEqualTo(TokenType.WholeNumberLiteral);
}

@Test
void wrapsConditionInTruthyCheckWhenExpressionIsNotBoolean() {
    Statement.If result = rewriter.rewrite(unwrappedIfStatement);
    assertThat(result.condition()).isInstanceOf(Expression.TruthyCheck.class);
}
```

When a test fails, you don't need a debugger to know what broke. The test name is an executable specification.

#### 5.2 The Zero-Abbreviations Rule

You will not find variables named `ctx`, `buf`, `stmt`, `pos`, or `idx` in our codebase. They are always named:
* `cursorContext`
* `tokenBuffer`
* `statement`
* `currentPosition`
* `parameterIndex`

Compilers already possess deep conceptual density (spans, parselets, AST visitors, precedence levels). Using clear, descriptive names eliminates guesswork.

#### 5.3 Deterministic, Reproducible Emission

:h[If you run the transpiler over 14,000 files today, and run it again tomorrow with no source changes, the output must be **byte-identical**.]

If your compiler iterates over standard Java `HashSet`s or `HashMap`s when collecting fields or methods, the emission order will vary between runs. Across a codebase of 14,000 files, non-deterministic order produces millions of lines of phantom differences in version control.

We enforce strict deterministic ordering everywhere:
* **Instance Fields:** Sorted alphabetically across generated classes.
* **Methods and Subroutines:** Private label methods and public methods sorted alphabetically.
* **Imports:** Collected and sorted deterministically.

---

### Summary

Building an industrial-grade transpiler is fundamentally an exercise in drawing clean boundaries across five core architectural pillars:

1. [**Pillar 1: Two-Tier ASTs & Modular Syntax Analysis**](#pillar-1-two-tier-asts--modular-syntax-analysis): Maintain two strictly decoupled AST hierarchies joined by a dedicated transformer layer, paired with recursive statement registries and Pratt parselets for 10+ precedence levels.
2. [**Pillar 2: Semantic Analysis via Micro-Rewriters**](#pillar-2-semantic-analysis-via-micro-rewriters): Never mix parsing with semantic meaning; isolate syntactic validation so files parse in parallel, and resolve language semantics through composable micro-rewriters over immutable trees.
3. [**Pillar 3: Zero-Decision Code Generation**](#pillar-3-zero-decision-code-generation): Enforce pure string printers that delegate formatting to layout templates, keeping emitters dumb and free of compiler state.
4. [**Pillar 4: Decoupled Runtime & Observability**](#pillar-4-decoupled-runtime--observability): Prevent contract drift through reflective verification across Gradle modules, and illuminate parser failures instantly with span-based tracing.
5. [**Pillar 5: Engineering Hygiene as an Architectural Requirement**](#pillar-5-engineering-hygiene-as-an-architectural-requirement): Enforce deterministic output, zero abbreviations, and one-to-one test parity across the entire compiler codebase.

In the next installment of this series, we will examine the runtime layer: [**Inside a Transpiler (Part 3): The Target Runtime for Transpiled Code**](/en/blog/building_the_target_runtime/): why generated code requires a dedicated target runtime to emulate legacy dynamic semantics, and how candidate abstractions enable contract-first stub generation.
