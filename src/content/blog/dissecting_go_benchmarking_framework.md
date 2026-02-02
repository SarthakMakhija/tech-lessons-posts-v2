---
author: "Sarthak Makhija"
title: "Dissecting Go’s Benchmarking Framework"
pubDate: 2026-02-02
tags: ["Go", "Benchmark"]
heroImage: "/refactoring-in-the-age-of-ai.webp"
caption: "Image by Gemini"
---

### Introduction

Benchmarking is a critical aspect of software engineering, especially when performance is a key requirement. Go provides a robust benchmarking framework built directly into its standard library's `testing` package. It helps developers measure the performance of their code, identify bottlenecks, and verify optimizations. However, writing accurate benchmarks requires a good understanding of how the framework works internally and how the Go compiler optimizes code. 

In this post, we’ll dissect the Go benchmarking framework, explore its lifecycle, and look into common pitfalls. We will cover:

- Basics of writing benchmarks (and how to avoid common mistakes)
- Go's benchmark source code and lifecycle
- High-precision timers
- Controlling compiler optimizations (similar to `DoNotOptimize` in C++)

#### A benchmark that looks correct, but isn’t

Let's look at a simple example that tries to measure the cost of an addition operation involving two integers. We have a simple `add` function and a benchmark function that calls it `b.N` times.

```go
package main

import "testing"

func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		add(20, 20)
	}
}

func add(a, b int) int {
	return a + b
}
```

At first glance, this looks like a perfectly valid benchmark. We iterate `b.N` times and call the function we want to measure. However, if you run this benchmark, you might see a result that is suspiciously fast, perhaps a fraction of a nanosecond per operation.

```text
BenchmarkAdd-14    	1000000000	         0.2444 ns/op
```

If we look at the assembly of the benchmark function, we would see that the `add` function is not called at all.

```bash
go test -gcflags="-S" -run=^$ -bench=^$ . > file.s 2>&1
```

```asm
0x0000 00000 MOVD	ZR, R1      
0x0004 00004 JMP	12          
0x0008 00008 ADD	$1, R1, R1  
0x000c 00012 MOVD	456(R0), R2 
0x0010 00016 CMP	R2, R1 
0x0014 00020 BLT	8      
0x0018 00024 RET	(R30)  
```

Effectively, the loop body becomes empty, and we end up measuring the overhead of the loop structure itself, or worse, the compiler might optimize the loop entirely if it determines it has no observable effect.

The assembly output confirms our suspicion:

- `MOVD ZR, R1`: Initializes the loop counter `i` (in register `R1`) to zero. (`ZR` is zero register).
- `JMP	12`: Jumps to address 12 (0x000c).
- `MOVD 456(R0), R2`: Loads `b.N` into `R2`.
- `CMP R2, R1`: Compares `i` with `b.N`.
- `BLT 8`: If `i < b.N`, it jumps back to instruction 8, which is `ADD $1, R1, R1` (the increment step of the loop).
- `RET`: Returns when done.

Crucially, the body of the loop, the call to `add` or even the addition instructions is entirely absent. We are merely measuring how fast the CPU can increment a counter and compare it to `N`.

> We are no longer benchmarking add, we are just benchmarking the loop structure.

To fix this, we need to ensure the compiler cannot prove that the result is unused. A common technique is to assign the result to a package-level variable (a "sink"). This forces the compiler to perform the calculation because the `sink` variable is accessible outside the function's scope, making the result "observable."

```go
var sink int

func BenchmarkAddFix(b *testing.B) {
	for i := 0; i < b.N; i++ {
		sink = add(20, 20)
	}
}
```

```text
BenchmarkAddFix-14    	1000000000	         0.2497 ns/op
```

```asm
0x0000 00000 MOVD	ZR, R1
0x0004 00004 JMP	24
0x0008 00008 MOVD	$40, R2
0x000c 00012 PCDATA	$0, $-3
0x000c 00012 MOVD	R2, test.sink(SB)
0x0014 00020 PCDATA	$0, $-1
0x0014 00020 ADD	$1, R1, R1
0x0018 00024 MOVD	456(R0), R2
0x001c 00028 CMP	R2, R1
0x0020 00032 BLT	8
0x0024 00036 RET	(R30)
```

Now, the assembly looks different (and correct for what we want):
- `MOVD $40, R2`: The compiler has still optimized the addition `20 + 20` into a constant `40` (constant folding), but it _cannot_ discard it.
- `MOVD R2, test.sink(SB)`: It moves that value `40` into the memory address of our global `sink` variable.
- `ADD $1, R1, R1`: Increments the loop counter.

The loop now actually does work: it performs the store to memory in every iteration. While the addition itself was folded (because `add(20, 20)` is constant), the _operation_ of assigning to `sink` is preserved, which gives us a more realistic benchmark if our goal was to measure memory store throughput or function call overhead (if arguments weren't constants).

> One might argue that the difference in the benchmark results is negligible (__0.2497 ns/op__ vs __0.2444 ns/op__). On a modern CPU like the Apple M4 Max (clocking between 4.0 GHz and 4.5 GHz, one hertz is one CPU cycle), a __single cycle__ takes __approximately 0.25 nanoseconds__. Because these CPUs are superscalar, they can execute (__multiple instructions__) the loop overhead (increment + branch) and the "useful" work (store) __in parallel within the same cycle__. Effectively, both benchmarks measure the minimum latency of the loop structure itself (~1 cycle).

> This benchmark primarily measures a store instruction, not addition.

#### Conclusion? Not quite.

At this point, we are no longer trying to measure the cost of integer addition. That question was already answered by the compiler: it folded the addition away.

What we _are_ trying to understand now is something more subtle: why do two benchmarks that clearly execute __different instructions__ still report almost the same time per operation?

Simply preventing the compiler from deleting our code (using a `sink`) wasn't enough. We walked right into another trap: __Instruction Level Parallelism__. The sink assignment was independent enough that the CPU executed it largely in parallel with the loop bookkeeping(increment + branch). To truly measure an operation's latency, we must prevent this parallelism.

To see a real difference, we need to introduce a __dependency__ that prevents parallel execution of intructions.

```go
var sink int

// Add a loop-carried dependency: each iteration depends on the previous one.
func BenchmarkDependency(b *testing.B) {
	for i := 0; i < b.N; i++ {
		sink += i
	}
}
```

In `BenchmarkDependency`, the operation `sink += i` creates a chain of dependencies:
1.  __Iteration 1__: Read `sink` (0), Add `0`, Store `0`.
2.  __Iteration 2__: *Wait* for Iteration 1 to finish. Read `sink` (0), Add `1`, Store `1`.
3.  __Iteration 3__: *Wait* for Iteration 2 to finish. Read `sink` (1), Add `2`, Store `3`.

Because sink is a global variable, the compiler must assume it can be observed externally, which prevents it from keeping the value purely in registers. This introduces a bottleneck known as __Store-to-Load Forwarding__. The CPU must forward the data from the store buffer of the previous iteration to the load unit of the current iteration. On an M4 chip, this latency is approximately 4-5 clock cycles.

Expected time: `5 cycles * 0.25 ns/cycle ≈ 1.25 ns`.

Actual result:

```text
BenchmarkDependency-14    	937794584	         1.101 ns/op
```

> This benchmark measures a loop-carried dependency and store-to-load latency.

I would like to take a little digression and explain __Store-to-Load Forwarding__.

#### The Physics of a Memory Write

When the assembly says `MOVD R2, sink(SB)`, it does not mean "Write to the RAM stick on the motherboard" immediately. It means: "Commit this value to the coherent memory system."

__The Journey of a Write (Store)__

1.  __CPU Core (Internal Queue - Store Buffer)__: The CPU puts the value (`sink=40`) into a small, super-fast queue inside the core called the __Store Buffer__.
    * __Time taken__: Instant (<1 cycle).
    * __Purpose__: The CPU can keep running without waiting for memory.

2.  __L1 Cache (The "Real" Memory View)__: Eventually (maybe 10-20 cycles later), the Store Buffer drains into the L1 Data Cache. This is the first place where other cores might see the change.

3.  __RAM (Main Memory)__: Much, much later (hundreds of cycles), if the L1 cache gets full, the value is evicted to L2, L3, and finally to RAM.

__Why `BenchmarkDependency` is Slow (The "Forwarding" Penalty)?__

In `BenchmarkDependency` (`sink = sink + i`), we do this in a tight loop:

*   __Iteration 1__: writes `sink`. Value goes into Store Buffer.
*   __Iteration 2__: needs to read `sink`.
    *   It checks the L1 Cache. The value isn't there yet! (It's still in the Store Buffer).
    *   The CPU must perform a trick called __Store-to-Load Forwarding__. It checks inside its own Store Buffer to find the pending write from Iteration 1.

__The Penalty__: Searching and retrieving data from this internal buffer is slower than reading unrelated data. It takes about __4–5 cycles__ on Apple Silicon (M-series).

#### What went wrong?

Across these three benchmarks, nothing changed in Go’s benchmarking framework. What changed was everything _around_ it.

| Benchmark             | What we thought we measured | What we actually measured |
|-----------------------|-----------------------------|---------------------------|
| `BenchmarkAdd`        | Integer addition            | Loop bookkeeping          |
| `BenchmarkAddFix`     | Integer addition            | Store throughput          |
| `BenchmarkDependency` | Integer addition            | Store-to-load latency     |

The framework faithfully executed each benchmark. The compiler and the CPU faithfully optimized the work we gave them.

The problem was not Go’s benchmarking framework, __the problem was our mental model of what a benchmark measures.__

> A benchmark is __NOT__ same as: Run this function `N` times and divide by `N`.

A benchmark is an __experiment__ involving:
- the benchmark runner
- the compiler
- the CPU microarchitecture
- and how we structure _observable effects_

Even before looking at Go’s benchmarking code, an important pattern emerges:

> The __framework__ controls __how often__ code runs, but the __compiler__ and the __CPU__ control __what actually runs__.

To understand what Go’s benchmarking framework does, and just as importantly, what it deliberately does __not__ do, we need to look at how benchmarks are executed internally.

That’s where we go next.
