---
author: "Sarthak Makhija"
title: "Inside a Transpiler (Part 7): Transpiling at Enterprise Scale"
description: "How a clean transpiler architecture absorbs enterprise reality: 64 KB JVM limits, ghost dependencies, domain preservation, and exclusion governance across 14,000 files."
pubDate: 2026-11-28
weight: 7
tags: ["Compilers", "Transpiler", "Architecture", "Java", "Clean Code"]
draft: false
caption: "Inside a Transpiler (Part 7): Transpiling at Enterprise Scale"
---

When building a transpiler, toy prototypes create an illusion of simplicity. In an academic or demonstration setting, you assume clean input files, formal grammar specifications, intact dependency graphs, and a target language runtime ready to receive your generated code.

When migrating a thirty-year-old enterprise system comprising **more than 14,000 legacy UniBasic files**, production reality shatters every single one of those assumptions.

Before we explore how our architecture solved these challenges, we must first examine the five brutal hurdles we encountered in production.

---

### Part I: The Enterprise Hurdles

Enterprise codebases that have evolved over decades do not look like textbook examples. They carry decades of historical baggage, operating system quirks, and architectural drift.

### Hurdle 1: The Extensionless Filesystem and Unwanted Files

Modern software repositories rely on file extensions to distinguish source code (`.java`, `.ts`) from configuration and documentation. In MultiValue systems like Rocket UniData and UniVerse, **files carry no extensions whatsoever**. 

A file named `PROCESS.PAYMENT` is a critical business program, but so is `PROCESS.ITEM`. Meanwhile, a file named `__NOMAKE__` is an internal build flag, and `DOC` is a folder of release notes.

This created an immediate production barrier:
* Certain files **had to be excluded** from transpilation because they were never meant to be compiled.
* Because files have no extension, non-code files like `__NOMAKE__` could not be filtered out by extension. When fed to the transpiler, the lexer choked on non-UniBasic tokens, aborting the build.
* In parallel, `$INCLUDE` fragments read identically to standalone programs. A fragment is an include fragment only because some other file references it, never from anything knowable in its own syntax.

If the transpiler blindly walked the directory tree, it crashed on build flags or attempted to transpile include fragments as standalone classes.

### Hurdle 2: Ghost Calls and Compilation Errors in Generated Code

In a textbook compilation model, if program `A` calls program `B`, program `B` is guaranteed to exist. In an enterprise system refined over thirty years across dozens of engineering teams, you face a broken dependency graph.

Decades of partial refactorings left behind dangling calls to files that were deleted in 1998, obsolete batch routines, or proprietary third-party libraries:

```basic
SUBROUTINE PROCESS.ORDER(ORDER.ID, STATUS)
    CALL VALIDATE.CUSTOMER(ORDER.ID, CUST.STATUS)
    CALL OBSOLETE.SYNC(ORDER.ID)
    CALL LOG.TRANSACTION(ORDER.ID)
RETURN
```

When scanning the repository, the file `OBSOLETE.SYNC` simply does not exist on disk. 

This created a severe dilemma:
* If the semantic analyzer treated missing call targets as a fatal error, transpilation halted immediately across thousands of programs.
* If the transpiler blindly emitted Java code calling `ObsoleteSync.obsoleteSync(orderId);`, **the generated Java code failed compilation** because `ObsoleteSync` was missing from the classpath.

### Hurdle 3: Cryptic 1980s Naming and Lost Business Context

Operating systems in the 1980s enforced strict 8-character filename limits, and procedural developers wrote in terse uppercase abbreviations. Business-critical subroutines carried names like `ACCT.BAL`, with parameters named `ACT.NO`, `P1`, and `STAT.CD`.

Consider what happens when a transpiler translates these identifiers mechanically:

```java
// Mechanical Translation: Compiles, but unreadable
package com.generated;

public class AcctBal {
    public void acctBal(UnibasicValue actNo, UnibasicValue p1, UnibasicValue statCd) {
        if (actNo.equals(new UnibasicValue("TEST"))) {
            p1.set(new UnibasicValue("OK"));
        }
    }
}
```

This code compiles cleanly, but it fails the human maintainability test:
* Future developers debugging production issues cannot decipher what `actNo`, `p1`, or `statCd` represent.
* Business domain semantics are permanently lost behind procedural abbreviations.
* Calling code across the system remains littered with cryptic parameter orders, inviting subtle production defects.

### Hurdle 4: The 8,000+ Line Monolith Without Labels

In UniBasic, subroutines often contained internal label blocks invoked via `GOSUB LABEL`. In our transpiler architecture, each internal label block naturally lowered into its own Java `private` method:

```basic
SUBROUTINE CALCULATE.TAX(AMOUNT)
    GOSUB APPLY.SURCHARGE
    RETURN

APPLY.SURCHARGE:
    AMOUNT = AMOUNT * 1.05
    RETURN
```

In the generated Java class, `APPLY.SURCHARGE` becomes `private void applySurcharge()`. Because labels become separate private methods, programs with labels naturally broke up into Java methods.

However, across the 14,000 files in the codebase, we encountered **exactly six monolithic routines spanning over 8,000 lines without a single label**. Over decades, developers had continually appended thousands of lines of sequential business logic, calculation algorithms, and deeply nested `IF` conditions without ever introducing a subroutine label.

When lowered into Java, **the entire 8,000+ lines ended up inside a single Java method**. 

This triggered a fatal JVM constraint:
* The Java Virtual Machine Specification mandates that the `code` array of a method in a class file cannot exceed **65,535 bytes** (64 KB).
* Because the 8,000-line routine had no labels to create private methods, its single generated Java method generated over 100 KB of bytecode.
* The Java transpiler halted with the fatal compile error: `Error: Code too large`.

### Hurdle 5: The Flat Monolithic Package and Tangled Module Boundaries

In procedural legacy systems, code organization is largely flat: thousands of subroutines often reside in a single shared directory or directory pool without explicit namespace boundaries.

When migrating to Java, a naive transpiler emits every generated file into a single flat package (`package com.generated;`) inside a single monolithic project. In an enterprise system of more than 14,000 files, this triggers immediate operational gridlock:

* **Incremental compilation collapses:** In a single Gradle module containing 14,000 Java classes, any change to a widely referenced file forces the build tool to re-examine the entire tree. Build times escalate from seconds to minutes, destroying local developer turnaround.
* **Team ownership is impossible:** Modern enterprise organizations partition large codebases across bounded domain teams (such as `billing`, `customer`, `inventory`, and `finance`). A single flat package provides zero isolation or ownership boundaries.
* **Hidden circular couplings:** Without module boundaries enforcing architectural layering, programs freely invoke one another across arbitrary domains. This creates an invisible, tangled web of cross-dependencies that prevents independent testing, continuous deployment, and modular refactoring.

---

### Part II: The Architectural Solutions

When confronting these messy realities, fragile transpilers resort to ad-hoc flags, hacky regex workarounds, or polluting the core parser with special cases.

Our migration proved a very different architectural principle:

> **No architecture can predict thirty years of legacy edge cases upfront. The true strength of a multi-pass transpiler is that each unexpected challenge is resolved by an isolated pass, a targeted rule, or a localized change that has zero impact on the rest of the transpilation.**

Because our pipeline enforced strict stage decoupling, maintained separate Source and Target ASTs, and organized transformations around composable micro-rewriters, we never had to hack our core parser or distort legacy semantics. 

Instead, every enterprise hurdle was absorbed by introducing an isolated pass, a targeted rule, or a localized configuration at the appropriate stage of the pipeline:

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 font-sans">
  <div class="p-5 bg-gradient-to-br from-blue-50/50 via-white to-white border border-blue-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-blue-100/80 border border-blue-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">Stage 1: Source Discovery</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Hurdle 1: Non-Code Files & Exclusion</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">
        <strong>The Shock:</strong> Files have no extensions; non-code files like <code>__NOMAKE__</code> could not be transpiled.<br/>
        <strong>The Solution:</strong> <code class="text-xs bg-blue-50 text-blue-800 px-1 py-0.5 rounded">ExclusionSet</code> glob matching with documented audit reasons.
      </p>
    </div>
  </div>
  <div class="p-5 bg-gradient-to-br from-purple-50/50 via-white to-white border border-purple-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-purple-100/80 border border-purple-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600">Stage 4 & 5: SEMA & Transformer</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Hurdle 2: Ghost Calls in Generated Code</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">
        <strong>The Shock:</strong> Calls to deleted files caused compilation errors in generated Java code.<br/>
        <strong>The Solution:</strong> <code class="text-xs bg-purple-50 text-purple-800 px-1 py-0.5 rounded">MissingProgramCallRewriter</code> lowers dropped calls directly into in-place Java comments.
      </p>
    </div>
  </div>
  <div class="p-5 bg-gradient-to-br from-amber-50/50 via-white to-white border border-amber-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">Stage 5: The Transformer</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Hurdle 3: Cryptic 1980s Naming</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">
        <strong>The Shock:</strong> Archaic 8-character abbreviations (<code>ACCT.BAL</code>, <code>P1</code>) produce unreadable Java.<br/>
        <strong>The Solution:</strong> <code class="text-xs bg-amber-50 text-amber-800 px-1 py-0.5 rounded">DomainRegistry</code> to rename signatures, caller sites, and all body usages.
      </p>
    </div>
  </div>
  <div class="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-white border border-emerald-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Stage 6: Fact Promotion</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Hurdle 4: 8,000+ Lines Without Labels</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">
        <strong>The Shock:</strong> Monolithic routines without labels breach JVM 64 KB method bytecode limits.<br/>
        <strong>The Solution:</strong> <code class="text-xs bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded">LongClassSplitter</code> targets the six outlier routines registered in <code class="text-xs bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded">LongProgramSet</code>, restructuring them into chained private methods with <code class="text-xs bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded">FieldCollector</code>.
      </p>
    </div>
  </div>
  <div class="p-5 bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-200/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 md:col-span-2">
    <div>
      <div class="flex items-center gap-2.5 mb-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
        </div>
        <div>
          <div class="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">Stage 7 & Shell Tooling</div>
          <div class="font-bold text-[15px] text-zinc-900 leading-snug">Hurdle 5: Flat Package & Module Boundaries</div>
        </div>
      </div>
      <p style="margin: 0;" class="text-[13.5px] text-zinc-600 leading-relaxed">
        <strong>The Shock:</strong> Dumping 14,000 files into a flat package inside one monolithic module destroys build times and team boundaries.<br/>
        <strong>The Solution:</strong> The transpiler uses <code class="text-xs bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded">ModuleLayout</code> to emit classes into module paths (<code class="text-xs bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded">&lt;module&gt;/src/main/java/&lt;package&gt;/&lt;file&gt;.java</code>), while the companion <code class="text-xs bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded">shell</code> module provides <code class="text-xs bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded">assemble</code> to create Gradle builds and wire module dependencies.
      </p>
    </div>
  </div>
</div>

---

### Solution 1: Exclusion Governance with `ExclusionSet`

To handle the reality that files had no extensions and non-code files like `__NOMAKE__` could not be transpiled, we introduced policy-driven governance into **Stage 1 (Source Discovery)**.

#### External Exclusion Declarations

Rather than hardcoding file filters in Java, exclusions are defined in `exclusions.json`:

```json
{
  "exclusions": [
    {
      "path": "**/__NOMAKE__",
      "reason": "Internal UniData build marker file that cannot be transpiled"
    },
    {
      "path": "INCLUDE/TEMP.SESSION.INCLUDE",
      "reason": "Orphaned include fragment not referenced by any program"
    },
    {
      "path": "DOCS/**",
      "reason": "Documentation directory"
    }
  ]
}
```

In `ExclusionSet`, each glob pattern compiles into a `PathMatcher`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.catalogue;

public final class ExclusionSet {

    public record Exclusion(String path, String reason) { }
    private record Matcher(PathMatcher pathMatcher, String reason) { }

    private final List<Matcher> matchers;

    public ExclusionSet(List<Exclusion> exclusions) {
        this.matchers = exclusions.stream()
                .map(e -> new Matcher(FileSystems.getDefault().getPathMatcher("glob:" + e.path()), e.reason()))
                .toList();
    }

    public Optional<String> reasonFor(Path relativePath) {
        for (Matcher matcher : matchers) {
            if (matcher.pathMatcher().matches(relativePath)) {
                return Optional.of(matcher.reason());
            }
        }
        return Optional.empty();
    }
}
```

#### How SourceDiscovery Enforces Exclusions Before Tokenization

In `SourceDiscovery`, the exclusion set is consulted directly during the filesystem walk. Unwanted files like `__NOMAKE__` are discarded upfront, before any file content is read or passed to the lexer:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.source.discovery;

import com.unibasictojava.transpiler.catalogue.ExclusionSet;

public final class SourceDiscovery {

    private final ExclusionSet exclusionSet;
    private final Walker walker;

    private Set<Path> walk(Path root) {
        if (!Files.isDirectory(root)) {
            return Set.of();
        }
        Path absoluteRoot = root.toAbsolutePath().normalize();
        try (var paths = this.walker.walk(root)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(path -> !path.getFileName().toString().startsWith(".")) // ignore files like .DS_Store
                    .map(path -> path.toAbsolutePath().normalize())
                    .filter(path -> !this.isExcluded(absoluteRoot.relativize(path))) // exclude before reading
                    .collect(Collectors.toUnmodifiableSet());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private boolean isExcluded(Path relativePath) {
        Optional<String> reason = this.exclusionSet.reasonFor(relativePath);
        reason.ifPresent(text -> System.out.println("WARNING: excluded " + relativePath + ": " + text));
        return reason.isPresent();
    }
}
```

Notice what happens in `walk()`:
1. **Early filtering before I/O:** `!this.isExcluded(...)` runs on the path name itself. Files matching exclusion patterns are never read from disk and never reach the lexer or parser.
2. **Audit traceability:** When `isExcluded()` detects a match, it captures the documented business reason (`WARNING: excluded ...`). This feeds directly into an **Automated Migration Audit Report**, guaranteeing that every excluded file is accounted for with a clear historical rationale rather than dropped silently.

---

### Solution 2: Dropped Call Transformation with `MissingProgramCallRewriter`

To resolve Hurdle 2 (where calls to deleted files caused compilation errors in the generated Java code), we introduced a multi-stage pass connecting **Semantic Analysis (SEMA)**, **The Transformer**, and **The Emitter**.

#### Two Paths for Missing Programs

Because the target file is physically missing from disk, any caller attempting to execute `CALL OBSOLETE.SYNC` in the legacy environment would have failed at runtime. When generating Java code, the transpiler faced two distinct architectural options:

1. **Option 1: Throw an exception in emitted code.** Emit an explicit runtime failure at the call site (for example, `throw new UnibasicProgramNotFoundException("CALL OBSOLETE.SYNC failed: program missing on disk");`).
2. **Option 2: Drop the call with an in-place comment.** Lower the call statement directly into an inline Java comment documenting the omission and its documented business justification.

The UniBasic domain team confirmed that Option 2 was the strategy to choose for their production migration. While dropping calls in-place is silent at runtime, it was an approach verified and approved by the client team, who recognized that these obsolete calls were dead operational remnants whose failure should not halt modernized batch execution.

Personally, I would have preferred Option 1 to fail fast and make missing routines immediately visible. However, an industrial-grade transpiler must balance architectural purism against domain governance, providing the tooling necessary to honor the client team's operational decisions cleanly.

#### Lowering Dropped Calls to In-Place Comments

Our architecture implemented the team's chosen approach cleanly through inter-stage cooperation:

1. **The External Catalog (`MissingProgramSet`):** Known missing files and their business justifications are declared in `missing-programs.json`:
   ```json
   {
     "missingPrograms": [
       {
         "name": "OBSOLETE.SYNC",
         "reason": "Decommissioned synchronization routine; replaced by SYNC.SERVICE.V2"
       }
     ]
   }
   ```

2. **The SEMA Pass (`MissingProgramCallRewriter`):** A pass in `SemanticAnalyser` walks the `source.ast`. When it encounters a `Statement.Call` matching the catalog, it replaces the call with a typed `Statement.DroppedCall`:

   ```java
   // Note: Code trimmed for brevity
   package com.unibasictojava.transpiler.source.sema.call;

   public final class MissingProgramCallRewriter implements RecursiveStatementRewriteVisitor {

       private final MissingProgramSet missingProgramSet;

       public MissingProgramCallRewriter(MissingProgramSet missingProgramSet) {
           this.missingProgramSet = missingProgramSet;
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

3. **Lowering to Java Comments (`DroppedCallTransformer`):** The Transformer lowers `source.ast.Statement.DroppedCall` into a Java `target.ast.Statement.Comment`:

   ```java
   // Note: Code trimmed for brevity
   package com.unibasictojava.transpiler.transformer.call;

   public final class DroppedCallTransformer extends Transformer {

       @Override
       public Statement transform(com.unibasictojava.transpiler.source.ast.Statement statement) {
           Statement.DroppedCall droppedCall = (Statement.DroppedCall) statement;
           return new Statement.Comment(
               "CALL " + droppedCall.programName() + " dropped: " + droppedCall.reason()
           );
       }
   }
   ```

4. **Pure Serialization:** The Emitter outputs the comment directly at the call site:

   ```java
   // Generated Java Output
   public void processOrder(UnibasicValue orderId, UnibasicValue status) {
       validateCustomer.validateCustomer(orderId, custStatus);
       // CALL OBSOLETE.SYNC dropped: Decommissioned synchronization routine; replaced by SYNC.SERVICE.V2
       logTransaction.logTransaction(orderId);
   }
   ```

The generated Java code compiles cleanly without missing symbol errors, dead call locations are documented in place for auditors, and zero hacks leak into the core pipeline.

---

### Solution 3: Restoring Domain Semantics with `DomainRegistry`

To solve Hurdle 3 (cryptic 1980s abbreviations producing unreadable Java), the transpiler accepts an optional `domain-registry.json`:

```json
{
  "basePackage": "com.example.enterprise",
  "files": [
    {
      "fileName": "ACCT.BAL",
      "package": "finance.accounting",
      "module": "billing",
      "className": "AccountBalanceCalculator",
      "methodName": "calculateBalance",
      "parameterMapping": {
        "ACT.NO": "accountNumber",
        "P1": "balanceAmount",
        "STAT.CD": "statusCode"
      }
    }
  ]
}
```

#### Synchronizing Signatures, Usages, and Callers

Applying domain semantics across millions of lines of code requires synchronizing three distinct elements:

##### 1. Class and Method Declarations (`SubroutineTransformer`)

During AST lowering, `SubroutineTransformer` consults `DomainRegistry` via `ResolvedTarget`:

```java
// Note: Code trimmed for brevity
ResolvedTarget resolvedTarget = ResolvedTarget.from(session.currentFileName(), domainRegistry);

return Statement.Class.withoutFields(
    resolvedTarget.packageName(), // com.example.enterprise.finance.accounting
    resolvedTarget.className(),   // AccountBalanceCalculator
    methods                       // public void calculateBalance(...)
);
```

The class is placed in its designated subpackage and mapped to its assigned Gradle module (`billing`).

##### 2. Parameter Definitions and Expression References (`VariableNameTransformerRule`)

Renaming parameters in a method signature is straightforward. The critical challenge is renaming **every single usage of that parameter throughout the method body**, while leaving local variables and standard library calls untouched.

This is executed by `VariableNameTransformerRule`, which implements `RecursiveExpressionVisitor`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.transformer.rules;

public final class VariableNameTransformerRule implements TransformerRule, RecursiveExpressionVisitor {

    private final DomainRegistryStrategy domainRegistryStrategy;
    private final MechanicalCaseStrategy mechanicalCaseStrategy;

    @Override
    public Expression visit(Expression.Identifier expression) {
        String javaName = this.domainRegistryStrategy.resolve(expression.name())
                .orElseGet(() -> this.mechanicalCaseStrategy.resolve(expression.name()));

        return new Expression.Identifier(javaName, expression.type());
    }
}
```

The resolution follows a strict priority:
1. **`DomainRegistryStrategy`:** Checks if the identifier is mapped in `parameterMapping`. If `P1` is registered as `balanceAmount`, every read and write to `P1` becomes `balanceAmount`.
2. **`MechanicalCaseStrategy`:** If unmapped, gracefully converts the identifier to idiomatic camelCase (`TOTAL.COUNT` becomes `totalCount`).
3. **Standard Library Protection:** Standard library functions (like `LEN(STRING)`) are preserved so a parameter named `LEN` mapped to `maximumLength` does not rename the function call `LEN(...)`.

##### 3. Cross-Module Caller Sites (`CallTransformer`)

When another program calls the subroutine (`CALL ACCT.BAL(MY.ACCOUNT, BALANCE, STATUS)`), `CallTransformer` queries `DomainRegistry` using the callee's file name (`ACCT.BAL`). It rewrites the call to instantiate `AccountBalanceCalculator` and invoke `calculateBalance(...)`:

```java
// Generated Clean Domain Java
package com.example.enterprise.finance.accounting;

public class AccountBalanceCalculator {

    public void calculateBalance(
            UnibasicValue accountNumber, 
            UnibasicValue balanceAmount, 
            UnibasicValue statusCode) {

        if (accountNumber.equals(new UnibasicValue("TEST"))) {
            balanceAmount.set(new UnibasicValue("OK"));
        }
    }
}
```

By decoupling identifier translation into a visitor rule backed by a domain registry, the transpiler bridges the gap between historical procedural abbreviations and clean, maintainable object-oriented Java.

---

### Solution 4: Targeted Fact Promotion with `LongClassSplitter`

To solve Hurdle 4 (where monolithic routines without labels breached the JVM 64 KB method limit), we introduced structural AST splitting during **Fact Promotion (Stage 6)**.

Across the entire enterprise migration of more than 14,000 files, we encountered **exactly six files** with this extreme profile: procedural routines spanning over 8,000 lines without a single subroutine label.

When an edge case affects only six files out of 14,000, designing speculative, global AST-slicing heuristics across the whole codebase would be irresponsible. It would risk destabilizing the 13,994 cleanly behaving programs. Instead, our architecture handles this through targeted policy configuration: an external catalog named `LongProgramSet` paired with a specialized Fact Promotion pass named `LongClassSplitter` that executes **only for those six programs**.

#### External Governance with `LongProgramSet`

Rather than guessing how to partition code automatically, the six outlier files and their structural partitions are declared in `long-programs.json`:

```json
{
  "longPrograms": [
    {
      "name": "REPORT.PROCESSOR",
      "topLevelParts": 4,
      "reason": "8,200 line monolithic routine without labels"
    }
  ]
}
```

The configuration is straightforward: `topLevelParts` explicitly defines how many sequential slices to divide the top-level AST statements into (for example, partitioning an 8,200-line routine into four parts of approximately 2,000 lines each).

#### A Selective Pass in Fact Promotion

In our pipeline, `LongClassSplitter` runs during **Fact Promotion (Stage 6)**. 

When `FactPromoter` processes a class, `LongClassSplitter` consults `LongProgramSet`:
* If the program is **not** present in `LongProgramSet`, `LongClassSplitter` returns the class completely untouched. For 13,994 programs, it is an absolute no-op, preserving zero overhead and zero risk of AST mutation.
* Only when a program matches an entry in `LongProgramSet` does `LongClassSplitter` activate to reshape the class.

#### Why This Must Be Solved in the Target AST

In UniBasic, an 8,000-line procedural routine is completely valid. UniBasic runtime engines execute scripts sequentially without any restriction on subroutine size. The 65,535-byte method bytecode ceiling is strictly a **Java domain problem** imposed by the Java Virtual Machine specification (`Code too large`).

Attempting to split monolithic routines in the Source AST (`source.ast`) would be fundamentally wrong: it violates architectural decoupling by leaking target JVM quirks into the source representation.

Because our architecture maintains an explicit **Target AST** (`target.ast`), we solve this problem where it belongs: in the target domain during Fact Promotion (Stage 6), after procedural code has already been lowered into Java classes, methods, and statements.

#### How the Structural Transformation is Achieved

Rather than getting lost in abstract theory, the core technical mechanism is direct: we break the Target AST method statements into N parts (configured by `topLevelParts`), and inject each part with a method call to the next part.

<div class="my-8 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 md:p-6 font-sans shadow-xs">
  <div class="flex items-center gap-3 mb-5">
    <div class="w-9 h-9 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center shrink-0">
      <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
    </div>
    <div>
      <div class="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Stage 6: Fact Promotion Visualized</div>
      <div class="text-[17px] font-bold text-zinc-900 leading-snug">Target AST Statement Slicing & Chained Invocation</div>
    </div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
    <div class="lg:col-span-5 p-4 rounded-xl border border-rose-200 bg-white flex flex-col justify-between shadow-xs">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-600">Target AST: Before</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Fails JVM Limit</span>
        </div>
        <div class="p-3.5 bg-rose-50/60 rounded-lg border border-rose-100 mb-3">
          <div class="font-mono text-xs font-bold text-zinc-800 mb-1">public void reportProcessor(...)</div>
          <div class="text-xs text-zinc-500 mb-2 font-mono">8,200 Top-Level AST Statements</div>
          <div class="w-full bg-rose-200/80 rounded-full h-2 mb-2">
            <div class="bg-rose-500 h-2 rounded-full w-full"></div>
          </div>
          <p style="margin: 0;" class="text-[11.5px] text-rose-800 font-mono">
            Method bytecode: ~92 KB &gt; 64 KB
          </p>
        </div>
      </div>
      <div class="p-2.5 rounded-lg bg-rose-100/70 border border-rose-200/80 flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="text-xs font-medium text-rose-900 font-mono">Compilation Error: Code too large</span>
      </div>
    </div>
    <div class="hidden lg:flex lg:col-span-1 items-center justify-center">
      <div class="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
      </div>
    </div>
    <div class="lg:col-span-6 p-4 rounded-xl border border-emerald-200 bg-white flex flex-col justify-between shadow-xs">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600">Target AST: After (N = 4 Parts)</span>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Passes JVM Limit</span>
        </div>
        <div class="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100 mb-3">
          <div class="text-[10.5px] font-mono font-bold uppercase tracking-wider text-emerald-700 mb-1">FieldCollector Promoted Fields</div>
          <div class="font-mono text-xs text-emerald-950 font-semibold">private UnibasicValue accountTotal, recordCount;</div>
        </div>
        <div class="space-y-2">
          <div class="p-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/60">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-mono font-bold text-zinc-900">reportProcessor(...)</span>
              <span class="text-[10.5px] text-zinc-500 font-mono">AST Statements 1 to 2,050</span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-medium">
              <span>&#8627; Injected Call:</span>
              <code class="bg-emerald-100/70 text-emerald-900 px-1 py-0.2 rounded">this.reportProcessorPart1();</code>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/60">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-mono font-bold text-zinc-900">private reportProcessorPart1()</span>
              <span class="text-[10.5px] text-zinc-500 font-mono">AST Statements 2,051 to 4,100</span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-medium">
              <span>&#8627; Injected Call:</span>
              <code class="bg-emerald-100/70 text-emerald-900 px-1 py-0.2 rounded">this.reportProcessorPart2();</code>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/60">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-mono font-bold text-zinc-900">private reportProcessorPart2()</span>
              <span class="text-[10.5px] text-zinc-500 font-mono">AST Statements 4,101 to 6,150</span>
            </div>
            <div class="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-medium">
              <span>&#8627; Injected Call:</span>
              <code class="bg-emerald-100/70 text-emerald-900 px-1 py-0.2 rounded">this.reportProcessorPart3();</code>
            </div>
          </div>
          <div class="p-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/60">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-mono font-bold text-zinc-900">private reportProcessorPart3()</span>
              <span class="text-[10.5px] text-zinc-500 font-mono">AST Statements 6,151 to 8,200</span>
            </div>
            <div class="text-[11px] font-mono text-zinc-600 flex items-center gap-1.5">
              <span class="text-emerald-600 font-bold">&#10003;</span>
              <span>Final slice executes and returns</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-3 p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-mono">
        <span>Bytecode per method: &lt; 23 KB</span>
        <span class="font-bold text-emerald-700">Cleanly Compiles &#10003;</span>
      </div>
    </div>
  </div>
</div>

Slicing statements by count might sound risky at first glance: what if statement 2,050 falls in the middle of an `IF` condition or a loop body?

Because the transpiler operates on the **Target AST**, the method body is represented as a `List<Statement>`. Slicing the method is as straightforward as partitioning a Java `ArrayList` or `LinkedList` into N sublists. **Each slot in that list represents an entire, self-contained AST statement node** (whether that statement is a simple assignment, a method call, or a composite structure like an entire `IF ... ELSE` block, `FOR` loop, or `WHILE` loop). Because each composite block is an indivisible node in the statement list, an `IF` statement or loop is never cut in half.

`LongClassSplitter` coordinates this transformation in three simple steps:

1. **Partitioning the Statement List:** The visitor divides the `List<Statement>` into N parts based on `topLevelParts`.
2. **Sequential Chaining:** The public entry method retains the first slice and appends an injected call to `this.reportProcessorPart1()`. Each subsequent private part executes its slice and calls the next part in order, with external callers remaining completely unaware that execution is partitioned internally.
3. **Preserving State with `FieldCollector`:** When statements are partitioned across multiple methods, local variables declared in earlier slices would fall out of scope in later slices. Rather than passing dozens of arguments through method signatures, `FieldCollector` inspects the Target AST, identifies variables referenced across multiple parts, and promotes them to private class fields:

```java
// Generated Clean Java
public class ReportProcessor {

    // Variables promoted to class fields by FieldCollector
    private UnibasicValue accountTotal;
    private UnibasicValue recordCount;

    public void reportProcessor(UnibasicValue customerId) {
        this.accountTotal = new UnibasicValue(0);
        this.recordCount = new UnibasicValue(0);
        // Statements 1 to 2,050...
        this.reportProcessorPart1();
    }

    private void reportProcessorPart1() {
        // Statements 2,051 to 4,100 (accesses fields directly)...
        this.accountTotal = this.accountTotal.add(new UnibasicValue(100));
        this.reportProcessorPart2();
    }

    private void reportProcessorPart2() {
        // Statements 4,101 to 6,150...
        this.reportProcessorPart3();
    }

    private void reportProcessorPart3() {
        // Statements 6,151 to 8,200 (concludes execution)...
    }
}
```

State flows effortlessly across the chained parts. The generated bytecode for each individual method drops well below the 64 KB ceiling, and all six massive label-free monoliths compile cleanly into production-ready Java.

---

### Solution 5: Gradle Multi-Module Packaging and Dependency Discovery

To solve Hurdle 5 (where dumping 14,000 files into a flat package inside one monolithic module makes incremental compilation and team ownership impossible), our architecture separates responsibilities cleanly across two distinct projects: the **`transpiler`** and the companion **`shell`**.

#### The Division of Responsibilities: `transpiler` vs. `shell`

In our codebase, the work is divided across decoupled Gradle modules:
* **`transpiler`:** The core engine that processes legacy UniBasic code through the 7-stage transpilation pipeline. It parses, enriches, rewrites, and emits Java source files directly into a Gradle-compatible multi-module folder structure. The transpiler's responsibility strictly ends with emitting source files: it does not generate build scripts or resolve build-level dependency graphs.
* **`shell`:** A companion project (a Gradle module) that provides the user-facing CLI. It provides commands for transpilation, compilation verification, and the automated assembly of multi-module Gradle projects with discovered inter-module dependencies.

#### 1. What the Transpiler Does: Emitting Module Layouts

During **Stage 7 (Emission)**, the transpiler materializes each generated class directly into its designated Gradle module directory rather than dumping all files into a single flat folder:

```
<outputDirectory>/<module>/src/main/java/<package path>/<ClassName>.java
```

The module assignment is declared in `domain-registry.json` alongside the Java package:

```json
{
  "files": [
    {
      "fileName": "ACCT.BAL",
      "package": "finance.accounting",
      "module": "billing",
      "className": "AccountBalanceCalculator",
      "methodName": "calculateBalance"
    }
  ]
}
```

If an entry does not declare an explicit module, `DomainRegistry` assigns it to a default application module (`app`).

The target folder structure is governed by `ModuleLayout`:

```java
// Note: Code trimmed for brevity
package com.unibasictojava.transpiler.target.output;

final class ModuleLayout {

    private static final Path SOURCE_FOLDER = Path.of("src", "main", "java");

    private ModuleLayout() { }

    /** The folder, under outputDirectory, of the files of packageName in moduleName. */
    static Path packageDirectory(Path outputDirectory, String moduleName, String packageName) {
        return outputDirectory
                .resolve(moduleName)
                .resolve(SOURCE_FOLDER)
                .resolve(packageName.replace('.', '/'));
    }
}
```

During emission, the transpiler consults `DomainRegistry` and uses `ModuleLayout` to write each class to disk. For our `ACCT.BAL` subroutine, the rendered Java class is written directly to:

```
output/billing/src/main/java/com/example/enterprise/finance/accounting/AccountBalanceCalculator.java
```

#### 2. What the Shell Does: `transpile`, `compile`, and `assemble`

Having the transpiler emit files into `<module>/src/main/java/<package path>/` creates the physical folder hierarchy, but a working Gradle build requires build descriptors (`settings.gradle` and modular `build.gradle` files) declaring inter-module project dependencies. In a legacy system of 14,000 files, manually maintaining build configurations across dozens of modules is impossible.

The companion **`shell`** module hosts the CLI and provides three primary commands:
* **`transpile`:** Invokes the transpiler pipeline, converting UniBasic sources into Java files placed in their module directory layouts.
* **`compile`:** Runs stubs generation and transpilation, and then compiles the emitted Java classes to bytecode across all modules to verify that all symbols and types resolve cleanly.
* **`assemble`:** Internally invokes `transpile`, and then performs the full assembly into Gradle modules. It analyzes the emitted Java code across modules, identifies dependencies between modules, and generates the Gradle build files (`settings.gradle` and `build.gradle` per module).

#### How the `assemble` Command Works

When `assemble` runs, it executes the multi-module assembly through four coordinated steps:

##### 1. Invoking Transpilation
The command first calls `transpile` internally, which runs the full 7-stage transpiler pipeline and emits all 14,000 files into their respective `<module>/src/main/java/...` folders via `ModuleLayout`.

##### 2. Scanning Usages and Identifying Dependencies
The command inspects the emitted Java classes across all modules to detect cross-class invocations and instantiated dependencies:

```java
public class InvoiceService {
    // Usage detected: InvoiceService depends on AccountBalanceCalculator
    private AccountBalanceCalculator accountBalanceCalculatorInstance;
}
```

By querying `DomainRegistry`, the analyzer resolves the module ownership for both the caller and the callee:
* Caller `InvoiceService` belongs to module `billing`.
* Callee `AccountBalanceCalculator` belongs to module `core`.
* Therefore, the `billing` module requires an explicit project dependency on `:core`.

##### 3. Generating `settings.gradle` and `build.gradle`
With all inter-module dependencies discovered, the command generates the root `settings.gradle` file and individual `build.gradle` files for each module:

```groovy
// settings.gradle
rootProject.name = 'enterprise-modernization'
include 'billing', 'finance', 'customer', 'core', 'app'
```

```groovy
// billing/build.gradle
plugins {
    id 'java-library'
}

dependencies {
    api project(':core')
    api project(':customer')
    implementation project(':transpiler-runtime')
}
```

##### 4. Cycle Detection and Build Enforcement
Gradle strictly prohibits circular project dependencies: if `billing` calls a routine in `finance` while `finance` calls a routine in `billing`, Gradle cannot evaluate or build the project. The dependency analyzer detects cycles upfront and immediately fails the `assemble` command with a diagnostic report detailing the circular loop. Development teams can then extract shared routines or data models into a common module before re-running assembly.

#### The Operational Impact

By uniting the transpiler's module layout emission with the shell's `assemble` command:
* **Drastically reduced build times:** Gradle's build cache and worker parallelization (`gradle build --parallel`) compile independent modules concurrently. An edit in `billing` only recompiles that module rather than the entire 14,000-file codebase, reducing developer turnaround times from minutes to seconds.
* **Autonomous team ownership:** Engineering teams take clear ownership of isolated Gradle subprojects (such as `billing`, `finance`, and `customer`) without conflicting over a single massive flat repository.
* **Enforced architectural boundaries:** Circular couplings are prevented at the build boundary, preserving clean system design across decades of future maintenance.

---

### Summary: Architectural Mastery at Scale

| Enterprise Hurdle | Legacy Real-World Cause | Pipeline Stage | Architectural Solution |
| :--- | :--- | :--- | :--- |
| **Extensionless Filesystems** | Files lack extensions; non-code files like `__NOMAKE__` cannot be transpiled | Stage 1: Source Discovery | `ExclusionSet` glob matching + single-pass `IncludeInliner` |
| **Broken Code Graphs** | Ghost calls to deleted files cause compilation errors in generated Java | Stage 4 & 5: SEMA & Transformer | `MissingProgramCallRewriter` lowering to in-place comments |
| **Cryptic Legacy Naming** | 1980s 8-character uppercase acronyms produce unreadable Java | Stage 5: The Transformer | `DomainRegistry` + recursive `VariableNameTransformerRule` |
| **JVM 64 KB Limit** | Six 8,000+ line routines without labels breach bytecode ceilings | Stage 6: Fact Promotion | `LongProgramSet` + Target AST `LongClassSplitter` + `FieldCollector` |
| **Flat Monolithic Package** | Dumping 14,000 files into one flat package prevents incremental builds and team ownership | Stage 7 & Shell Tooling | `ModuleLayout` packaging + `shell` module with `assemble` |

---

### Series Epilogue

This concludes our seven-part journey into building an industrial-grade transpiler:

1. **[Transpiler Architecture](/en/blog/transpiler_architecture/):** The seven-stage pipeline converting legacy MultiValue UniBasic to idiomatic Java 21.
2. **[Foundations of an Industrial Transpiler](/en/blog/foundations_of_an_industrial_transpiler/):** Engineering discipline, dumb emitters, and decoupled target runtimes.
3. **[The Target Runtime for Transpiled Code](/en/blog/building_the_target_runtime/):** Emulating dynamic string-number duality, pass-by-reference cells, and candidate decoupling.
4. **Multi-Pass AST Rewriting: SEMA and Fact Promotion:** Traversing and reshaping syntax trees across language boundaries.
5. **Handling the Unhandleable: Eliminating GOTOs:** Decompiling unstructured procedural spaghetti jumps into structured loops.
6. **[Observability in Transpilers: Parser Tracing](/en/blog/observability_in_transpilers_parser_tracing/):** Turning parser debugging into a deterministic science with span-based tracing.
7. **[Transpiling at Enterprise Scale](/en/blog/transpiling_at_enterprise_scale/):** Absorbing messy filesystems, ghost dependencies, JVM bytecode limits, and domain preservation across 14,000 files.

Building a transpiler capable of modernizing millions of lines of legacy enterprise software is one of the most demanding challenges in software engineering. When your architecture honors strict stage boundaries, treats syntax trees as immutable records, and isolates language models, **every legacy challenge becomes solvable**.
