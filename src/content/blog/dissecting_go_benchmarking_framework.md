---
author: "Sarthak Makhija"
title: "Dissecting Go’s Benchmarking Framework"
pubDate: 2026-02-04
tags: ["Go", "Benchmark"]
heroImage: "/dissecting-go-benchmarking-framework.webp"
caption: "Image by Gemini"
---

### Introduction

Benchmarking is a critical aspect of software engineering, especially when performance is a key requirement. Go provides a robust benchmarking framework built directly into its standard library's `testing` package. It helps developers measure the performance of their code, identify bottlenecks, and verify optimizations. However, writing accurate benchmarks requires a good understanding of how the framework works internally and how the Go compiler optimizes code. 

In this post, we’ll dissect the Go benchmarking framework, explore its lifecycle, and understand the building blocks of a micro-benchmarking framework. We will cover:

- A case study of a deceptive benchmark
- Go's benchmark source code and lifecycle
- High-precision timers
- Controlling compiler optimizations (similar to `DoNotOptimize` in C++)
- Building blocks of a benchmarking framework

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
- `MOVD $40, R2`: The compiler has still optimized the addition `20 + 20` into a constant `40` (__constant folding__), but it _cannot_ discard it.
- `MOVD R2, test.sink(SB)`: It moves that value `40` into the memory address of our global `sink` variable.
- `ADD $1, R1, R1`: Increments the loop counter.

The loop now actually does some work: it performs the store to memory in every iteration. While the addition itself was folded (because `add(20, 20)` is constant), the _operation_ of assigning to `sink` is preserved.

> This benchmark ends up measuring the performance of a store instruction, not addition.

> One might argue that the difference in the benchmark results is negligible (__0.2497 ns/op__ vs __0.2444 ns/op__). On a modern CPU like the Apple M4 Max (clocking between 4.0 GHz and 4.5 GHz, one hertz is one CPU cycle), a __single cycle__ takes __approximately 0.25 nanoseconds__. Because these CPUs are superscalar, they can execute (__multiple instructions__) the loop overhead (increment + branch) and the "useful" work (store) __in parallel within the same cycle__. Effectively, both benchmarks measure the minimum latency of the loop structure itself (~1 cycle).

#### Conclusion? Not quite

At this point, we are no longer trying to measure the cost of integer addition. That question was already answered by the compiler: it folded the addition away because the arguments to `add` were constants.

What we are trying to understand now is something more subtle: why do two benchmarks that clearly execute __different instructions__ still report almost the same time per operation?

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

#### What went wrong when trying to write a SIMPLE benchmark?

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

### Who Actually Controls a Go Benchmark?

When we write a benchmark like `BenchmarkAdd`, it is easy to imagine that Go simply runs the function in a tight loop and reports the time. That mental model is convenient and wrong.

In reality, the benchmark function is only one small part of a larger execution process controlled entirely by Go’s benchmarking framework. The key idea to keep in mind is this:

- The benchmark function provides *work*.  
- The framework controls *execution*.

Let’s walk through what actually happens when you run `go test -bench` to see who is really in charge.

#### Discovery: Scanning for Candidates

The `go test -bench` tool begins by scanning compiled packages for functions that follow the convention: `func BenchmarkX(b *testing.B)`. At this stage, the benchmark is just a function pointer, registered and waiting.

#### Context Initialization: More Than a Counter

Before running, the framework creates a pointer to `testing.B`. This object isn't just a simple loop counter; it’s the control center. It holds `b.N` (benchmark iterations), tracks timing, records memory allocations, and stores metadata. Crucially, `b.N` starts undefined, and the framework decides how many times to run the benchmark by [predicting iterations](#6-predicting-iterations).

#### Iteration Selection: The Framework's Choice

The benchmark function does **not** decide how many times to run. The framework repeatedly invokes the function with increasing values of `b.N`: 1, 100, 1000, etc., measuring how long it takes. It adjusts `b.N` dynamically until it finds a "stable window" of statistically significant execution time.

#### The Timing Trap: External Boundaries

The benchmark function runs *inside* the timing boundaries, but it does not *create* them. The framework starts the timer, calls the benchmark function, and stops the timer.
Calls like `b.ResetTimer()` are simply requests to the framework to adjust its internal clock; you are never measuring time yourself.

#### Summary: The Control Boundary

By now, a clear boundary should be visible:

- The **Framework** controls **when**, **how often**, and **how long** code runs.
- The **Compiler and CPU** control **what instructions actually execute**.
- The **Author** (you) controls **which effects are observable**.

Understanding this separation explains why our earlier benchmarks could run perfectly yet measure nothing but loop overhead.

### Go's Execution of Benchmarks

The execution of a benchmark function involves the following concepts:

1. [Discovery](#1-discovery)
2. [Running Root Benchmark](#2-running-root-benchmark)
3. [Running User Benchmark](#3-running-user-benchmark)
4. [Initial Verification: run1](#4-initial-verification-run1)
5. [Benchmark Loop: run](#5-benchmark-loop-run)
6. [Predicting Iterations](#6-predicting-iterations)
7. [Result Collection](#7-result-collection)
8. [High Precision Timing](#8-high-precision-timing)

#### 1. Discovery

The `go test -bench` tool begins by scanning compiled packages for functions that follow the convention: `func BenchmarkX(b *testing.B)`. Below function `RunBenchmarks` is called when `go test -bench` is run.

```go
func RunBenchmarks(
    matchString func(pat, str string) (bool, error), 
    benchmarks []InternalBenchmark,
) {
	runBenchmarks("", matchString, benchmarks)
}

func runBenchmarks(
    importPath string, 
    matchString func(pat, str string) (bool, error), 
    benchmarks []InternalBenchmark,
) bool {
	// If no flag was specified, don't run benchmarks.
	if len(*matchBenchmarks) == 0 {
		return true
	}
	var bs []InternalBenchmark
	for _, Benchmark := range benchmarks {
		if _, matched, _ := bstate.match.fullName(nil, Benchmark.Name); matched { // [!code word:bstate.match.fullName(nil, Benchmark.Name)]
			bs = append(bs, Benchmark) // [!code word:bs = append(bs, Benchmark)]
		}
	}
	main := &B{
		common: common{ ... },
		importPath: importPath,
		benchFunc: func(b *B) {
			for _, Benchmark := range bs {
				b.Run(Benchmark.Name, Benchmark.F) // [!code highlight]
			}
		},
		benchTime: benchTime,
		bstate:    bstate,
	}
	main.runN(1)
	return !main.failed
}
```

The `runBenchmarks` function acts as the entry point for the entire benchmarking suite. It filters the registered benchmarks against the user-provided `-bench` flag (regex), creating a list of matching benchmarks. It then constructs a root `testing.B` object named `main`.

1. **Filtering**: It filters registered benchmarks against the user-provided `-bench` flag.
2. **Main Benchmark**: It constructs a root `testing.B` object named `main`. This is special, it doesn't measure performance itself but effectively serves as the parent container.
3. **Execution**: It kicks off execution by calling `main.runN(1)`. This starts the root benchmark, which in turn invokes specific benchmarks via `b.Run`.

__Note__: The `benchFunc` inside `main` is the closure responsible for iterating over and running all filtered benchmarks. `InternalBenchmark` contains benchmark name and its function.

#### 2. Running Root Benchmark

As mentioned earlier, the execution starts with `main.runN(1)`. This `runN` method is the core engine of the framework, responsible for setting up the environment and executing the benchmark function.

It starts by acquiring a global lock `benchmarkLock`. This ensures that only one benchmark runs at a time, preventing interference from other benchmarks.

```go
func (b *B) runN(n int) {
	benchmarkLock.Lock()
	defer benchmarkLock.Unlock()
	// Try to get a comparable environment for each run
	// by clearing garbage from previous runs.
	runtime.GC()
	b.resetRaces()
	b.N = n
	b.loop.n = 0
	b.loop.i = 0
	b.loop.done = false

	b.parallelism = 1
	b.ResetTimer()
	b.StartTimer()
	b.benchFunc(b)
	b.StopTimer()
	b.previousN = n
	b.previousDuration = b.duration

	if b.loop.n > 0 && !b.loop.done && !b.failed {
		b.Error("benchmark function returned without B.Loop() == false (break or return in loop?)")
	}
}
```

The `runN` method is where the framework actually measures execution time. It is the engine that drives every benchmark run.

Before starting the clock, it prepares the runtime environment to ensure consistent results:
- __`runtime.GC()`__: It forces a full garbage collection. This ensures that memory allocated by previous benchmarks doesn't affect the current one, providing a "clean slate."
- __`b.resetRaces()`__: If you are running with `-race`, this resets the race detector's state, preventing false positives or pollution from prior runs.
- __`b.N`__: The number of iterations the benchmark function should run.
- __`b.previousN` and `b.previousDuration`__: Stores the iteration count and duration of this run, which will be crucial for the *next* step: [Predicting Iterations](#6-predicting-iterations). The framework uses them to calculate the rate of the benchmark and estimate the next `N`.

For the **Root Benchmark** (Main), `n` is always 1. Its `benchFunc` iterates over all the user benchmarks (like `BenchmarkAdd`) and calls `b.Run` on them.

It is important to note that `runN` is not specific to the `main` benchmark. It is the same method that will eventually run your benchmark code, which we will explore next.

#### 3. Running User Benchmark

The `Run` method orchestrates the creation and execution of sub-benchmarks. When `main` iterates over all user benchmarks (e.g., `BenchmarkAdd`), it calls this method.

Key responsibilities:
1.  **Release Lock**: It releases `benchmarkLock` because sub-benchmarks will run as independent entities and may need to acquire it themselves.
2.  **Creation of testing.B**: Creates a new `testing.B` context (`sub`) for the user benchmark.
3.  **Execution**: Calls `sub.run1()` for doing the first iteration and `sub.run()` for doing the rest of the iterations.

```go
func (b *B) Run(name string, f func(b *B)) bool {
	b.hasSub.Store(true)
	benchmarkLock.Unlock()
	defer benchmarkLock.Lock()

	benchName, ok, partial := b.name, true, false
	if b.bstate != nil {
		benchName, ok, partial = b.bstate.match.fullName(&b.common, name)
	}
	if !ok {
		return true
	}
	var pc [maxStackLen]uintptr
	n := runtime.Callers(2, pc[:])
	sub := &B{
		common: common{ ... },
		importPath: b.importPath,
		benchFunc:  f,
		benchTime:  b.benchTime,
		bstate:     b.bstate,
	}

	if sub.run1() { // [!code word:sub.run1()]
		sub.run() // [!code word:sub.run()]
	}
	b.add(sub.result)
	return !sub.failed
}
```

#### 4. Initial Verification: `run1`

Before the framework attempts to run any benchmark millions of times, it runs it exactly once via `run1()`.

It serves two critical purposes:
1.  **Correctness Check**: It ensures the benchmark function doesn't panic or fail immediately.
2.  **Discovery**: It provides the first data point. If `run1` takes 1 second, there is no need to ramp up to `N=1,000,000`. `n=1` is already enough.

It launches a separate goroutine to execute [`runN(1)`](#running-root-benchmark). This isolation allows the framework to handle panics or `FailNow` calls gracefully via the `signal` channel.

```go
func (b *B) run1() bool {
	go func() {
		defer func() {
			b.signal <- true
		}()

		b.runN(1)
	}()
	<-b.signal
	if b.failed {
		fmt.Fprintf(b.w, "%s--- FAIL: %s\n%s", b.chatty.prefix(), b.name, b.output)
		return false
	}
	b.mu.RLock()
	finished := b.finished
	b.mu.RUnlock()
	if b.hasSub.Load() || finished {
		return false
	}
	return true
}
```

#### 5. Benchmark Loop: `run`

After `run1` passes, the framework proceeds to the main execution loop.

1.  **`b.bstate != nil`**: Checks if we are running in the standard mode via `go test -bench`. In this mode, `bstate` holds the benchmark state and configuration. The `processBench` function handles properties like `-cpu` and `-count` loops, ultimately calling `doBench` for each combination.
2.  **`b.launch()`**: Like `run1`, `launch` also runs in a separate goroutine managed by `doBench`.
3.  **`b.loop.n == 0`**: Ensures we haven't already run the loop logic (idempotency check).
4.  **`b.benchTime.n > 0`**: Handles the case where the user specified a fixed iteration count (e.g., `-benchtime=100x`). 
    - If so, it runs exactly that many times.
    - Otherwise, it enters the dynamic ramp-up loop where it uses `predictN` to [predict next iteration](#6-predicting-iterations) count until `b.duration` meets the target bench time (`d`).
5.  **`b.runN(n)`**: Finally, `b.runN(n)` is invoked to execute the benchmark for the calculated number of iterations. Here, `b.N` is set to the calculated iterations, which is used by the user benchmark function.

```go
func (b *B) run() {
	if b.bstate != nil {
		// Running go test --test.bench
		b.bstate.processBench(b) // Must call doBench.
	} else {
		// Running func Benchmark.
		b.doBench()
	}
}

func (b *B) doBench() BenchmarkResult {
	go b.launch()
	<-b.signal
	return b.result
}

func (b *B) launch() {
	defer func() {
		b.signal <- true
	}()
	if b.loop.n == 0 {
		if b.benchTime.n > 0 {
			if b.benchTime.n > 1 {
				b.runN(b.benchTime.n)
			}
		} else {
			d := b.benchTime.d
			for n := int64(1); !b.failed && b.duration < d && n < 1e9; {
				last := n
				// Predict required iterations.
				goalns := d.Nanoseconds()
				prevIters := int64(b.N)
				n = int64(predictN(goalns, prevIters, b.duration.Nanoseconds(), last))
				b.runN(int(n))
			}
		}
	}
	b.result = BenchmarkResult{b.N, b.duration, b.bytes, b.netAllocs, b.netBytes, b.extra}
}
```

#### 6. Predicting Iterations

This function is the heart of the "execution phase." It decides how many times to run the benchmark next.

```go
func predictN(goalns int64, prevIters int64, prevns int64, last int64) int {
	if prevns == 0 {
		// Round up to dodge divide by zero. See https://go.dev/issue/70709.
		prevns = 1
	}

	n := goalns * prevIters / prevns
	n += n / 5
	n = min(n, 100*last)
	n = max(n, last+1)
	n = min(n, 1e9)
	return int(n)
}
```

1.  **Linear Extrapolation**: `n := goalns * prevIters / prevns`. It starts with a simple math. Number of iterations should be equal to `benchmark duration * time per iteration`. If 1 iteration took 1ms, and our goal is 1000ms (`goalns`), we need 1000 iterations.
2.  **The 20% Pad**: `n += n / 5`. Go deliberately overshoots the target by 20%. Why? To avoid "undershooting." If we only run exactly as many as we predicted, and the CPU throttles slightly or we get lucky with cache hits, we might finish *just under* the target time, forcing yet another ramp-up round. Overshooting slightly ensures we cross the finish line in fewer steps.
3.  **Growth Cap**: `n = min(n, 100*last)`. It prevents the iteration count from exploding too fast (e.g., if the previous run was suspiciously fast due to noise/setup).
4.  **Monotonicity**: `n = max(n, last+1)`. We must always run at least one more iteration than before.
5.  **Safety Cap**: `n = min(n, 1e9)`. It caps the max iterations to 1 billion. This avoids potential integer overflows on 32-bit systems (where `int` might be 32-bit) and ensures that we don't accidentally schedule a run that takes days.

This prediction loop continues until `b.Duration >= benchtime`.

#### 7. Result Collection

Once the stable iteration count is found and the benchmark completes, the framework captures the final statistics. The `BenchmarkResult` struct holds the "scorecard" for the run: the total iterations (`N`) and the total elapsed time (`T`) + other fields. These values are later used to compute the `ns/op` metric.

```go
func (b *B) launch() {
	defer func() {
		b.signal <- true
	}()
	if b.loop.n == 0 {
		if b.benchTime.n > 0 {
			if b.benchTime.n > 1 {
				b.runN(b.benchTime.n)
			}
		} else {
			d := b.benchTime.d
			for n := int64(1); !b.failed && b.duration < d && n < 1e9; {
				last := n
				// Predict required iterations.
				goalns := d.Nanoseconds()
				prevIters := int64(b.N)
				n = int64(predictN(goalns, prevIters, b.duration.Nanoseconds(), last))
				b.runN(int(n))
			}
		}
	}
	b.result = BenchmarkResult{b.N, b.duration, b.bytes, b.netAllocs, b.netBytes, b.extra}
}

type BenchmarkResult struct {
	N         int           // The number of iterations.
	T         time.Duration // The total time taken.
                            //...
}
```

#### 8. High Precision Timing

Benchmarking code that runs in nanoseconds requires a clock with nanosecond precision.

*   **Linux/Mac**: Since Go 1.9, `time.Now()` includes a monotonic clock with nanosecond precision (via `runtime.nanotime()` to get that monotonic clock reading with nanosecond precision.). So, calling `time.Now()` is effectively high precision on these platforms.
*   **Windows**: The standard system timer on Windows historically had low resolution (~1-15ms). To guarantee accuracy across all platforms, Go's benchmarking framework explicitly abstracts this, using `QueryPerformanceCounter` (QPC) on Windows to bypass the system clock limitations.

```go
func (b *B) runN(n int) {
	b.StartTimer()
	b.benchFunc(b)
	b.StopTimer()
}

func (b *B) StartTimer() {
	if !b.timerOn {
		b.start = highPrecisionTimeNow()
	}
}

func (b *B) StopTimer() {
	if b.timerOn {
		b.duration += highPrecisionTimeSince(b.start)
	}
}

//go:build !windows
func highPrecisionTimeSince(b highPrecisionTime) time.Duration {
	return time.Since(b.now)
}

//go:build windows
func highPrecisionTimeNow() highPrecisionTime {
	var t highPrecisionTime
	// This should always succeed for Windows XP and above.
	t.now = windows.QueryPerformanceCounter()
	return t
}
```

### Building Blocks of a Benchmarking Framework

By stepping through Go’s benchmarking implementation, a clear pattern emerges. Go’s framework is not a collection of ad-hoc features, it is an explicit encoding of a benchmarking model. At a high level, any serious benchmarking framework needs the following building blocks.

#### 1. Definition

A benchmark begins as a user-defined unit of work. In Go, this is the `BenchmarkX(b *testing.B)` function.  Crucially, this function **does not control execution**, it only defines what work should be performed.

#### 2. Setup and teardown boundaries

A framework must distinguish between:
- work that should be measured
- work that should not

Go does this by placing timing boundaries *outside* the benchmark function and exposing explicit controls (`ResetTimer`, `StopTimer`, `StartTimer`) to the author.

This allows setup and cleanup to exist without contaminating measurements.

#### 3. Iteration discovery (incidental warmup)

Go does not include an explicit warm-up phase.

Instead, it repeatedly executes the benchmark while discovering an appropriate iteration count. During this process, the benchmark naturally benefits from incidental warm-up effects such as cache population, branch predictor training, and CPU frequency stabilization.

These effects are not guaranteed or modeled explicitly, they are a byproduct of repeated execution, not a contract of the framework.

#### 4. Iteration prediction

A benchmark framework must answer a hard question:

> “How much work is enough to measure?”

Go answers this dynamically by:
- observing early runs
- extrapolating iteration counts
- overshooting slightly to avoid undersampling

This avoids both noisy micro-measurements and unnecessarily long runs.

#### 5. High-precision timing

At nanosecond scales, clock choice matters.

Go abstracts platform-specific timing differences behind a consistent high-precision clock, ensuring that measurements are comparable across operating systems.

#### 6. Result aggregation and reporting

Raw measurements are not useful on their own.

The framework is responsible for:
- aggregating results
- normalizing per operation
- presenting consistent metrics

This keeps benchmark code simple and focused.

#### 7. DoNotOptimize

Some benchmarking frameworks, most notably [Google Benchmark](https://github.com/google/benchmark), provide an explicit utility called `DoNotOptimize`. Its purpose is not to disable compiler optimizations globally, but to prevent the compiler from discarding or reordering a specific computation that the benchmark author intends to measure.

In C++, this is typically implemented using an empty inline assembly block with carefully chosen constraints:

Here is a tiny _pseudo_ code snippet to explain how `DoNotOptimize` will be used:

```go
func BenchmarkToSumFirst100(b *testing.B) {
    for i := 0; i < b.N; i++ {
        result := 0
        for count := 1; count <= 100; count++ {
            result += count
        }
        DoNotOptimize(result) // Forces 'result' to be computed
    }
}
```

Note: `DoNotOptimize` is not a real function in Go, it is a placeholder for any observable side effect that the compiler must preserve.

`DoNotOptimize` in C++, this is typically implemented using an empty inline assembly block with carefully chosen constraints:

```cpp
asm volatile(
    ""              // no actual instructions
    :
    : "r"(value)    // value must be computed and placed in a register
    : "memory"      // assume arbitrary memory may be read or written
);
```

At first glance, this code appears to do nothing. The power of this construct lies entirely in how the compiler is forced to reason about it.

The `volatile` qualifier ensures that the assembly block cannot be removed or reordered, even though it emits no instructions. Without `volatile`, the compiler could safely delete the entire block as dead code.

The `"r"(value)` input constraint tells the compiler that the assembly block uses value. This makes the value observable: it must be computed, materialized in a register, and available at this precise point in the program. As a result, the compiler is forced to calculate the value, preventing it from optimizing the code away or moving it outside the loops.

The `"memory"` clobber introduces a _compiler-level memory barrier_. It informs the compiler that the assembly block may read or write arbitrary memory, preventing it from reordering loads and stores across this point. This is not a CPU fence, it does not emit hardware memory-ordering instructions, but it is a strong optimization barrier at compile time.

Together, these constraints create a powerful illusion: the compiler must assume the value matters, must preserve its computation, and must respect ordering, yet the generated machine code remains minimal or even empty. This makes `DoNotOptimize` ideal for benchmarking, it preserves the work without polluting the measurement with extra instructions.

Go deliberately avoids providing such a facility. Without inline assembly or compiler barriers in user code, Go requires observability to be expressed through language semantics, such as global variables or visible side effects, rather than compiler-specific escape hatches. This keeps the benchmarking framework portable and minimal, at the cost of requiring deeper awareness from the benchmark author.

#### 8. Explicit non-goals

Equally important are the things a benchmarking framework does **not** do.

Go’s framework does not:
- prevent compiler optimizations
- understand CPU microarchitecture
- infer programmer intent

Those responsibilities belong to the benchmark author. Understanding these boundaries is what separates a reliable benchmark from a misleading one.

### Summary

Go’s benchmarking framework is often treated as a convenience feature, a tight loop with a timer attached. In reality, it is a carefully designed execution engine that orchestrates controlled performance experiments.

By reading through the internals, we saw that:
- benchmarks can look correct and still measure nothing
- compiler optimizations and CPU behavior matter as much as framework mechanics
- the framework controls *execution*, not *meaning*

Understanding these internals changes how you write and interpret benchmarks.

#### What you can do after understanding the internals

- **Reason about `b.N` instead of fighting it**  
`b.N` is not an input; it is a value discovered by the framework. Expect it to vary, and design benchmarks whose work can be meaningfully amortized over many iterations.

- **Confirm that benchmark code is actually executed**  
Dead-code elimination, constant folding, and instruction-level parallelism can silently erase the work you think you are measuring. If you cannot explain why the compiler must execute your code, the benchmark result is meaningless.

- **Use `DoNotOptimize` (or its Go equivalents) correctly**  
`DoNotOptimize` preserves *observability*, not intent. It prevents the compiler from discarding values, but it does not defeat instruction-level parallelism or isolate CPU costs. In Go, this responsibility is expressed through language-level side effects rather than compiler escape hatches.

- **Diagnose surprising results instead of guessing**  
When a benchmark reports implausible numbers, you can reason about iteration discovery, compiler behavior, and microarchitectural effects instead of relying on trial and error.