---
author: "Sarthak Makhija"
title: "The Cognitive Tax of AI-Assisted Coding"
description: "Why fast AI code generation can lead to messy designs and exhaustion, and how keeping AI strictly at the periphery of a side project brought back the joy of programming."
pubDate: 2026-05-28
draft: true
tags: ["AI", "Software Craftsmanship", "Rust", "Compilers"]
---

This essay is about a feeling that has been bothering me lately: a growing frustration in my relationship with AI coding assistants. It explores what happened to my code quality, my design, and my satisfaction when I let a machine do the coding. 

To see this clearly, we will look at two compiler-like projects: one where AI was heavily involved in writing the code, and one where the AI was kept strictly at the periphery.

---

### The Genesis: Handcrafting a Transpiler

The story begins with a new project: building a transpiler from **[UniBasic](https://www.unibasic.com/)** to structured, modern **Java**. A transpiler is simply a source-to-source compiler. In this case, it takes the code written in legacy UniBasic and translates it directly into equivalent Java source code. 

Since this was a complex project, I designed and built the core engine entirely by hand, phase by phase:

```
[UniBasic Source] ──> [Lexer] ──> [Parser] ──> [AST] ──> [Transformer] ──> [Emitter] ──> [Java Code]
```

1. **The Lexer:** Tokenizing the legacy UniBasic source files, converting raw characters into a clean stream of syntactical tokens while handling legacy peculiarities.
2. **The Parser:** Implementing a hand-written hybrid parser, combining **recursive descent** for statements and declarations with a **Pratt parser** (operator precedence) to elegantly handle operator precedence and associativity in complex expressions.
3. **The AST (Abstract Syntax Tree):** Designing the strongly-typed in-memory representation of the source code structure, capturing variable declarations, subroutines, loops, and expressions.
4. **The Transformer:** Performing the core translation work, serving two critical purposes:
   * **Vocabulary Mapping:** Translating legacy UniBasic keywords and built-in operations into Java standard library or custom runtime library equivalents.
   * **AST-to-AST Mapping:** Re-architecting code structures. For example, translating the legacy, multi-value string search command `LOCATE` into a structured series of conditional `If/Else` nodes inside the target Java AST.
5. **The Emitter:** Traversing the transformed AST to generate clean, readable, and compilable target Java classes.

Building this foundation by hand was incredibly satisfying. Every part was clean and easy to understand. When the code compiled and generated its first working Java class, I felt in complete control. I understood every line of code and every design choice.

---

### The Slippery Slope: Inviting the AI Assistant

With the solid, handcrafted foundation in place, the core transpiler pipeline was running smoothly. That was when I decided to use AI to gain speed. 

It started well. The AI was fast at generating simple code and repetitive boilerplates. But as the tasks grew harder, our relationship changed.

The real friction began when we decided to introduce **Type Inference**. 

UniBasic has dynamic types, while Java is statically typed. To generate clean Java, the transpiler had to figure out types based on context. This required a type-resolution engine. 

Instead of helping me design a clean engine, the AI suggested massive, complicated changes across the whole project. To fix type bugs, the AI injected type logic everywhere, in the parser, AST nodes, and helper files. Instead of keeping type inference in one clean phase, the AI created a mess. 

To save the project's design, I had to take back control. I ignored the AI's plans, designed the logic myself, and built it using small commits. I kept the type logic in one place (even though there were multiple passes at type-inference). 

But what makes this struggle particularly frustrating is that it didn't happen because I was reckless. In fact, I had done everything I could to avoid this exact kind of friction from the very start.

---

### Attempting to Reduce the Friction: The Illusion of Priming

Before diving headfirst into this collaboration, I didn't just throw code at the AI and hope for the best. I was well aware of the friction that comes with AI-assisted development, and I tried to mitigate it. I set up the environment using what the industry refers to as **[Knowledge Priming](https://martinfowler.com/articles/reduce-friction-ai/knowledge-priming.html)**. 

My preparation was decent:
* **A Solid Foundation:** I had already designed and handcrafted the core transpiler pipeline (lexer, parser, AST, transformer, emitter, we did not have type-inference during the early days). The AI had a concrete, working implementation to read and learn from before it was ever asked to write new features.
* **Pre-defined Project Structure:** The codebase structure was clean, highly modular, and already defined. There was zero ambiguity about where new modules or files should go.
* **Detailed Instructions (`claude.md`):** I wrote a comprehensive guidelines file (`claude.md`) for the AI. It contained explicit rules to govern its output: design naming patterns, strict bans on abbreviations in code, instructions to write clean unit tests with exactly one assertion per test, and architectural constraints.

I had provided the AI with context, guidelines, and a decent foundation to build on. If you are interested in how to systematically reduce friction when working with AI, I highly recommend reading Rahul Garg's guide on **[Reducing Friction with AI](https://martinfowler.com/articles/reduce-friction-ai/)**.

Yet, despite this careful preparation, the collaboration still fractured. 

This realization left me with a humble, somewhat uncomfortable choice. Either:
1. **I did not do well enough:** My instructions, rules, and context priming were still insufficient, and I need to improve how I instruct, guide, and collaborate with AI models.
2. **I did enough, yet the tool failed:** Even with robust knowledge priming and crystal-clear boundaries, the cognitive tax of keeping an AI aligned with a complex, evolving codebase is simply an inherent limitation of current AI-assisted workflows.

Whichever is true, the reality remained the same: the friction persisted, and the mental tax of keeping the AI on the rails became too heavy to ignore.

---

### The Explainer's Tax: Coding in English

As the project grew, I noticed a new problem: **explaining how to build a small piece of functionality to the AI, and doing it multiple times in English, was too draining.** 

For example, legacy UniBasic uses unstructured jumps (`GOSUB` and `GOTO`), while Java relies on structured method calls and loops. To convert these unstructured jumps to structured Java, I designed a clear translation strategy:
* GOSUB always maps to a local private method in Java
* If the extracted label body contains a `GOTO` statement pointing to the same label, it represents a loop, which we transform into a **while loop** inside that local private method.

To implement this, the parser needs to track scopes and transform nodes at the right time. 

The AI could not figure out how to build this transformation. I had to write long explanations in English, describing exactly how the parser should track scopes and rewrite the nodes. 

This is **the Explainer’s Tax**. While the tool might technically save us some physical typing time, it leaves us mentally drained. Worse, the code structure is incredibly fragile: even a slight change in the wording of a prompt can cause the AI to generate a completely different architecture, breaking the consistency of the system.

---

### The Review Paradox: The Death of Passion and Caution

When I asked the AI to resolve a bug, it suggested complicated changes that touched many files. Even if it only changed five files, reviewing the code carefully was exhausting. 

This is **the Review Paradox**: *I could not review the code carefully when I did not write it myself.*


```mermaid
graph TD
    A[AI Proposes 5+ Files] --> B[Massive Synthetic Differences]
    B --> C{The Developer's Choice}
    C -->|Review with Passion & Caution| D[Cognitive Overwhelm & Exhaustion]
    C -->|Numbly Click 'Approve'| E[Loss of Codebase Control & Architectural Heartburn]
```

To be clear, my commits were still small; at no time did I ask the AI to implement a massive chunk that affected a huge number of files. Yet, because I did not write the logic myself, my brain still glazed over the diffs. I could not review the AI's generated code with the same care and caution that I bring to my own. 

Instead of careful auditing, I felt like I was sliding into a mindless loop: *Review plan -> Apply changes -> Run tests -> Feed errors to AI -> Apply fix -> Repeat.* 

Even though I was in control of the design, I lost the satisfaction of coding. Programming felt like a boring administrative job.

> To be fair, the AI helped for sure. It gave me incredible speed. Once the code emission phase was done, the AI was brilliant at analyzing compilation errors in the generated files and tracking down their root causes. But despite that help, there was a constant feeling of void. Normally, when I solve a bug myself, I get a much deeper understanding of the various edge cases I originally missed. The struggle forces me to think about refactoring or redesigning parts of the system. But when the AI solves the bug, I am relegated to a mere reviewer. No matter how passionately I try to review its work, I am gradually moving further away from my own system and my own design.

This frustration reached a peak during a session where we were trying to transpile a new subroutine. The code transpiled successfully, but it pulled in a chain of missing dependencies that weren't included in our parser's file closure. When we compiled the generated Java code, it produced a wall of new compilation errors. 

Rather than helping me surgically expand the scope of unibasic files or resolve the missing dependencies, the AI proposed a staggering solution: **let's revert the changes, delete the newly generated Java class, and accept a known gap in the system, because the previous java compilation error count was "cleaner"!** 

The AI literally asked me: *“The 22 errors we had were cleaner. Want me to revert back to the previous state?”* 

This is the ultimate corporate check-box trap. The tool didn't want to solve the problem; it just wanted to keep the error dashboard looking neat, even if it meant deleting actual progress.

---

### The Superpower of Thinking Small

In another session, the AI’s inability to "think small" wasted time. We were transpiling a legacy source file that contained several `GOSUB` statements. I noticed that the output Java file was completely missing the private methods that should have been generated for these labels. 

The source file looked perfectly ordinary. The AI started debugging, building massive, complex hypotheses, and spinning its wheels. After watching it generate long paragraphs of theory, I interrupted it and asked it to write a unit test for that specific file. The test failed. 

Now we knew there was a parser failure, but the file was huge, around 1,200 lines long. The test failure didn't tell us *which* line or fragment was causing the problem. The AI immediately restarted its winding, high-level analysis, trying to guess what was wrong across those 1,200 lines. 

I had to step in and give another instruction: **trim down the file to small fragments, run the test on each fragment, and pause on the very first failure.** 

We found the bug immediately. A legacy UniBasic `ELSE` block had its body on the exact same line as the `IF` statement. Because we had built our parser without a formal grammar, no formal UniBasic grammar is publicly available, such parsing failures were expected. But finding it required a classic, systematic debugging technique.

This was a major realization: **thinking small is one of the most undervalued attributes in software engineering.** AI tools do not naturally think small. They try to swallow a 1,200-line problem all at once, generating sprawling theories and sweeping guesses. It takes an ordinary human mind to enforce discipline, break the problem into tiny pieces, and isolate the bug.

---

### Rogue Agents and the Deleted Stubs

It felt like I had lost control of my workspace. 

We had created a dedicated folder for the transpiled Java code and several local runtime library stubs. The generated Java code depended on a runtime library to function, and these stubs were a mock implementation of that library so we could compile the transpiled code locally. Since these were work-in-progress stubs, I decided to push them to Git only after fixing all compilation errors. In hindsight, this was my mistake too, I should have committed them, perhaps excluding them from the build, to keep them safe.

While we were analyzing Java compilation errors, the AI agent scanned the workspace and silently deleted the stubs. 

I pointed this out, and the AI scanned the transpiled code to regenerate them. But as we continued fixing errors, the AI scanned the workspace again and deleted the stubs a second time. 

This was the turning point. Realizing that the AI was stuck in a loop and deleting my work was deeply frustrating. We spent 30-odd minutes fixing bugs caused by the tool itself, not by our compiler logic.

---

### The Breaking Point: The Erosion of Understanding

By the time the transpiler generated compilable Java code, I looked at what we had done. On paper, it worked. But in reality, something important was missing. 

I had reached a breaking point due to four realizations:

1. **No Satisfaction:** For me, the joy of programming comes from designing and building things myself. Because the AI generated so much of the code, the final success felt hollow.
2. **Constant Frustration:** Instead of enjoying the creative flow of coding, I spent my time correcting the AI's complex plans and explaining compiler concepts in prose.
3. **Exhausting Reviews:** Reviewing large, generated diffs felt like grading homework. It took all the fun out of the project. Even when we did small commits and I tried to review each one with passion, the AI churned them out too fast. There were simply too many changes in a short-span of time. In that rapid-fire stream, I lost track of what I had actually achieved. My mental map of the system's evolution began to blur, which was mentally exhausting.
4. **Losing System Intimacy:** Because reviewing sprawling code was so exhausting, it was harder to keep that close, line-by-line connection to my own work. The clean mental model of my handcrafted transpiler was cluttered by the complicated type logic generated by the AI.

It felt like I had created a distance between myself and my code, which affected my deep understanding of the system. Worse, I felt like my ability to think deeply was reducing. It might sound like an exaggeration, but I had a distinct feeling that my own cognitive gears were slowing down, as if outsourcing so much of the day-to-day thinking was gradually dulling my engineering instincts.

---

### The Danger of Chasing Pure Speed

This cognitive drag happens because the industry has made speed our only engineering metric. We live in an era of executive hype, where CEOs boast that “65-75% of our code is now written by AI,” promising that teams can deliver features in minutes and finish massive user stories in a single day. 

But when speed is the only goal, we might end up building teams that specialize in nothing but hitting *Enter*. If a company forces a team to build a complex transpiler in just two months, the AI will own the codebase, not the developers. We breed developers who have zero intimate knowledge of the systems they supposedly write. The result is a codebase that might pass CI, but is far too complex, bloated, and unreviewable for any human to safely maintain.

This is the core danger: **AI addiction is actually a decision-making addiction.** 

When we say AI is writing most of our code, what we really mean is that the AI is making most of our decisions. It decides what architectural path to take based purely on what it "feels" is right, bypassing the subtle design tradeoffs that define software craftsmanship. 

For example, consider how we parsed legacy UniBasic target labels:

```
GOSUB L1 *L1 is the label here.

L1: *
  its body
```

If I had let the AI write the logic, it would have injected complex lookaheads directly into the parser. Instead, I decided to handle this in the **lexer**. The lexer identified label tokens early, making the parser's job simple: it just had to look for a `Label` token, capture it, and associate it with its body later. 

That single decision kept the parser simple (we could live with 1-lookahead token). It made me realize that outsourcing the code often means outsourcing the thinking. We risk raising a generation of developers who might never make design choices. They might never wrestle with questions like: *Should a GOSUB label be handled by the lexer or the parser?* or *Does moving it to the lexer simplify my parser?* 

Delegating these decisions to an AI might speed up the typing, but the cost is high: we are outsourcing the actual thinking. 

---

### Finding the Right Boundary

I want to be clear: I am not saying I will banish AI completely. That is not what I want. But creating the right boundary has become essential for my survival (and my Blood Pressure!).

I cannot afford to lose my engineering instincts. I do not want to feel frustrated at the end of the day, having won a hollow victory by asking a machine to write my logic. The distance between myself and my code, and therefore my actual understanding of the systems I build, cannot increase. 

So, how do we draw this boundary? I am still trying to figure it out, but for me, the path forward comes through two steps: establishing a disciplined set of rules for my daily work, and running a clean, handcrafted side-project.

---

### The Rebellion: Reclaiming the Craft with "Slow Code"

Exhausted by this process, I decided to run an experiment. I started a side project (which is currently work in progress) called [**`infer`**](https://github.com/SarthakMakhija/infer), an educational compiler project in Rust, designed to implement constraint-based type inference from scratch for a toy language.

For this project, I made a rule: **no AI in the driver's seat.**

> To be clear, I did not ban AI completely. I still use it to review my code, critique my tests, discuss designs, and generate comments. The AI is a great sounding board. But it does not write the code. The physical act of writing the code remains mine alone.

The difference was immediate. The speed is slow, but the pacing of hand-written Rust is peaceful. In files like [`declaration.rs`](https://github.com/SarthakMakhija/infer/blob/main/src/parser/declaration.rs), parsing a variable declaration is done in a few clean lines:

```rust
pub(crate) fn parse(&mut self) -> Result<Statement, ParseError> {
    self.stream.expect(TokenType::Var)?;
    let name = self.stream.expect_identifier()?;
    let data_type = self.maybe_datatype()?;
    let expression = self.maybe_expression()?;
    self.stream.expect(TokenType::Semicolon)?;

    Ok(Statement::variable_declaration(VariableDeclaration::new(
        name.owned_value(),
        data_type,
        expression,
    )))
}
```

This "Slow Code" experiment made me realize that reclaiming the craft isn't just about the physical act of typing. It is about controlling the design, making the hard decisions, and being in absolute control of the system at every point in time. It means keeping the AI strictly in a supporting role, letting it handle only the truly monotonous, mechanical tasks under my guidance. Every design decision, every method, every compiler error, and every unit test becomes a conscious choice. When the system works, the victory is mine. The pace is slow, but **the satisfaction is huge**, because I am not auditing a machine's messy logic; I am actively crafting a system line by line.

---

### Re-architecting the Partnership: Pragmatic Patterns for AI Collaboration

Drawing a boundary is not about rejecting the tool; it is about establishing a high-leverage, professional relationship with it. Over my personal experiments, I have realized that the "all-or-nothing" approach to AI coding is a trap. 

Instead, I have developed a set of active collaboration patterns. These are not just rules to survive; they are structural patterns to ensure the AI operates where its leverage is highest, while keeping me firmly in control of the architecture:

#### 1. The 15-Minute "Explainer's Tax" Circuit Breaker
* **The Pattern:** I use the AI for rapid exploration, but I know when to pivot.
* **How it works:** If explaining a complex edge-case and auditing its generated multi-file plan takes more than 15 minutes of prompt engineering, I treat that as a signal that the problem is too nuanced for the model. Immediately, I close the chat, open a blank buffer, and code the logic by hand. This circuit breaker keeps me from falling into the exhausting trap of "coding in English" and ensures that I write cleaner, more direct code.

#### 2. Sounding-Board First, Code-Generator Second
* **The Pattern:** I use the AI's massive knowledge base to pressure-test my designs before writing a single line.
* **How it works:** Before asking an AI to write code for a complex subsystem (like type resolution), I use it as a highly experienced architectural consultant. I explain my planned approach, ask it to look for edge cases, challenge my assumptions, and refine the design together. Once the foundation is solid and I understand the boundaries, *then* I can selectively delegate the generation of specific, modular sub-components.

#### 3. Test-Driven Delegation (Monotony, Not Decisions)
* **The Pattern:** I write the tests (the decisions); the AI writes the implementation (the monotony).
* **How it works:** When I delegate repetitive or boilerplate code to the AI (such as generating similar parser modules once the initial set has already established the pattern), I follow a strict sequence:
  1. I handcraft the unit tests first, covering all critical edge cases.
  2. I feed those tests to the AI and ask it to write the implementation that makes them pass.
  3. I ask the AI to critique my tests and suggest missing cases.
  This ensures that I remain the absolute owner of the design specifications, while the AI is relegated to the mechanical task of typing the boilerplate.

#### 4. Maintaining a "Slow Code" Sanctuary
* **The Pattern:** I keep a personal sandbox to preserve my raw engineering instincts.
* **How it works:** I keep an active personal project (like my educational compiler, [infer](https://github.com/SarthakMakhija/infer)) where I write the core logic by hand. I can still use the AI as an active reviewer to critique my Rust code, suggest performance optimizations, or write documentation, but keeping it out of the driver's seat ensures my cognitive gears stay sharp.

---

### Reclaiming the Joy of Software

The joy of programming is found in the friction of the struggle, the elegant solution arrived at after hours of thought, and the physical act of creation. It is found in that exact moment when a compiler error finally vanishes because I understood the system, not because I fed a diff to a stateless agent.

When we outsource our designs, our decisions, and our deep thinking, we delegate the joy of the craft itself. Speed has its place, but it is a hollow victory if we lose our intimacy with the systems we build. For me, pure speed will never be worth the cost of the joy of programming.
