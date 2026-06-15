---
theme: default
colorSchema: light
highlighter: shiki
lineNumbers: false
fonts:
  sans: 'Inter'
  mono: 'IBM Plex Mono'
info: |
  ## Rootconf Presentation
  Fast on Paper, Slow in Reality
drawings:
  persist: false
transition: slide-up
title: Fast on Paper, Slow in Reality
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
      document.body.classList.toggle('show-menu')
    }
  })
})
</script>

<!-- Title Slide: Mirrors the Website Sidebar (Deep Navy) -->
<div class="absolute inset-0 bg-[#0f172a] z-[-1]"></div>

<div class="flex flex-col items-start justify-center h-full px-12">
  <h1 class="text-5xl font-extrabold text-white tracking-tight pb-2 whitespace-nowrap" style="background: none; -webkit-text-fill-color: #ffffff;">
    Fast on Paper, Slow in Reality
  </h1>
  <div class="mt-6 flex items-center gap-4">
    <div class="h-[1px] w-12 bg-slate-500"></div>
    <div class="text-xs text-slate-400 font-['IBM_Plex_Mono'] uppercase tracking-[0.2em] font-semibold">
      What We Got Wrong About Performance
    </div>
  </div>
</div>

<div class="abs-br m-6 flex gap-2">
  <a href="https://tech-lessons.in" target="_blank" alt="Blog"
    class="text-xl slidev-icon-btn text-slate-500 !border-none !hover:text-white transition-colors">
    <carbon-logo-github></carbon-logo-github>
  </a>
</div>

---
transition: fade-out
---

# About Me

<div class="grid grid-cols-3 gap-8 mt-8">
  <div class="col-span-1 flex flex-col items-center text-center bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div class="w-24 h-24 rounded-full border-2 border-slate-300 overflow-hidden mb-4">
      <img src="/self.png" class="w-full h-full object-cover" />
    </div>
    <h3 class="text-base font-bold text-slate-800 m-0">Sarthak Makhija</h3>
    <p class="text-[10px] text-slate-400 font-mono mt-1">Principal Architect @ Caizin</p>
    <div class="mt-4 flex flex-col gap-2 text-[9px] font-mono text-left w-full border-t border-slate-200/60 pt-4">
      <div class="flex items-center gap-1.5 text-slate-600">
        <carbon-logo-github class="text-slate-400 text-xs shrink-0"></carbon-logo-github>
        <a href="https://github.com/SarthakMakhija" target="_blank" class="hover:text-slate-900 underline truncate">github.com/SarthakMakhija</a>
      </div>
      <div class="flex items-center gap-1.5 text-slate-600">
        <carbon-logo-linkedin class="text-slate-400 text-xs shrink-0"></carbon-logo-linkedin>
        <a href="https://www.linkedin.com/in/sarthak-makhija/" target="_blank" class="hover:text-slate-900 underline truncate">linkedin.com/in/sarthak-makhija</a>
      </div>
      <div class="flex items-center gap-1.5 text-slate-600">
        <carbon-earth class="text-slate-400 text-xs shrink-0"></carbon-earth>
        <a href="https://tech-lessons.in" target="_blank" class="hover:text-slate-900 underline">tech-lessons.in</a>
      </div>
    </div>
  </div>
  <div class="col-span-2 flex flex-col gap-4">
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
      <carbon-data-base class="text-3xl text-blue-500 mt-1 shrink-0"></carbon-data-base>
      <div>
        <h4 class="font-bold text-slate-800 text-sm m-0">Systems Engineering</h4>
        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed m-0">
          Building storage engines, query processors, distributed databases and transpilers (primarily in Go and Rust). Led the team that built the distributed Key-Value engine discussed in this talk.
        </p>
      </div>
    </div>
    <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
      <carbon-book class="text-3xl text-purple-500 mt-1 shrink-0"></carbon-book>
      <div>
        <h4 class="font-bold text-slate-800 text-sm m-0">Technical Writing</h4>
        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed m-0">
          Validated core patterns for Unmesh Joshi's <i>Patterns of Distributed Systems</i> (O'Reilly). Author of the 7-part <i>Inside a Query Engine</i> deep-dive series.
        </p>
      </div>
    </div>
  </div>
</div>

---
transition: fade-out
---

# What We Built

We built a distributed Key-Value engine from scratch in Go. 

- **Strongly Consistent**: Built on Multi-Raft.
- **Hash Partitioned**: Scalable data distribution.
- **Performant**: Single-digit read and write latency.
- **The Outcome**: ~5.6ms p99 write latency at 10,000 TPS (after optimizations).

<br>
<br>

<v-click>

> *"But it didn't start that fast."*

</v-click>

---

# Why We Built It

<div class="grid grid-cols-2 gap-x-12 gap-y-10 mt-12">

  <div class="flex items-start gap-4">
    <carbon-data-1 class="text-4xl text-blue-500 mt-1 opacity-80"></carbon-data-1>
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Pure Key-Value</h3>
      <p class="!text-slate-500 !text-sm !m-0">No SQL overhead (parsers, ASTs).</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon-flash class="text-4xl text-yellow-500 mt-1 opacity-80"></carbon-flash>
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Write-Optimized</h3>
      <p class="!text-slate-500 !text-sm !m-0">Targeting strict linearizability.</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon-chart-evaluation class="text-4xl text-red-500 mt-1 opacity-80"></carbon-chart-evaluation>
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Existing Tech Shortfalls</h3>
      <p class="!text-slate-500 !text-sm !m-0">JunoDB, TiKV, FoundationDB didn't fit perfectly.</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon-unlocked class="text-4xl text-green-500 mt-1 opacity-80"></carbon-unlocked>
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Vendor Independence</h3>
      <p class="!text-slate-500 !text-sm !m-0">Zero external vendor lock-in.</p>
    </div>
  </div>

</div>

<v-click>
  <div class="mt-14 bg-white p-5 rounded border border-gray-200 shadow-sm flex items-center justify-center gap-4">
    <carbon-idea class="text-2xl text-[#111827]"></carbon-idea>
    <span class="text-slate-700 font-medium text-lg">Solution: Built our own engine in <strong>Go</strong> on top of <strong>BadgerDB</strong>.</span>
  </div>
</v-click>

---

# Architecture Overview

<div class="flex flex-col items-center justify-center w-full mt-0">
  <div class="bg-white p-1.5 rounded border border-gray-200 shadow-sm w-full flex justify-center">
    <img src="/architecture.png" class="object-contain max-h-[290px] w-auto mx-auto" alt="Architecture Diagram" />
  </div>
  <div class="grid grid-cols-3 gap-3 w-full mt-3 text-[9px] text-slate-500">
    <v-click>
      <div class="flex gap-2 bg-slate-50 p-2 rounded border border-slate-200/60 shadow-sm items-start">
        <span class="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 font-bold text-[9px]">1</span>
        <div class="leading-relaxed">
          <span class="font-bold text-slate-800 mr-1.5">Bootstrap Topology</span>
          <span>Coordinator reads YAML and publishes layout to etcd.</span>
        </div>
      </div>
    </v-click>
    <v-click>
      <div class="flex gap-2 bg-slate-50 p-2 rounded border border-slate-200/60 shadow-sm items-start">
        <span class="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-600 font-bold text-[9px]">2</span>
        <div class="leading-relaxed">
          <span class="font-bold text-slate-800 mr-1.5">Publish Leaders</span>
          <span>Storage servers elect leaders and publish partition info in etcd.</span>
        </div>
      </div>
    </v-click>
    <v-click>
      <div class="flex gap-2 bg-slate-50 p-2 rounded border border-slate-200/60 shadow-sm items-start">
        <span class="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[9px]">3</span>
        <div class="leading-relaxed">
          <span class="font-bold text-slate-800 mr-1.5">Partition & Route</span>
          <span>API reads leaders and routes writes over TCP.</span>
        </div>
      </div>
    </v-click>
  </div>
</div>

---

# Key Architectural Features

Building a custom high-performance engine required specific design choices:

<div class="grid grid-cols-2 gap-3 mt-8">

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-layers class="text-lg text-orange-500" />
  <span class="font-medium text-slate-800 text-sm">Batching as a First-Class Citizen</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-network-4 class="text-lg text-blue-500" />
  <span class="font-medium text-slate-800 text-sm">Persistent TCP Connections</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-data-base class="text-lg text-green-500" />
  <span class="font-medium text-slate-800 text-sm">Multi-Raft Storage</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-chart-scatter class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Hash Partitioning</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-function-math class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Consistent Hashing</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-copy-file class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Configurable Replication Factor per partition</span>
</div>
</v-click>

</div>

---

# Our Methodology: Macro to Micro

How do you find performance bottlenecks in distributed systems?

<div class="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-[0.9rem] text-slate-700">
  
  <div class="space-y-5">
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b97a95] text-white text-[10px] font-bold mr-3 mt-0.5">1</span> <div><b>Simulate Load</b>: Run <code>blast</code>.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b97a95] text-white text-[10px] font-bold mr-3 mt-0.5">2</span> <div><b>Collect Profile</b>: Focus on CPU or Memory (one at a time).</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b97a95] text-white text-[10px] font-bold mr-3 mt-0.5">3</span> <div><b>Analyze Profile</b>: <code>pprof</code> + Graphviz + Flamegraphs.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b97a95] text-white text-[10px] font-bold mr-3 mt-0.5">4</span> <div><b>Identify Top N Symbols</b>: Find the most expensive methods.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#b97a95] text-white text-[10px] font-bold mr-3 mt-0.5">5</span> <div><b>Pinpoint Issue</b>: Exact line number(s) within the symbol.</div></div></v-click>
  </div>

  <div class="space-y-5">
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d0c8df] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">6</span> <div><b>Add Microbenchmark</b>: Establish a baseline.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d0c8df] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">7</span> <div><b>Implement Fix</b>: Alternate algorithm.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d0c8df] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">8</span> <div><b>Evaluate</b>: Verify against microbenchmark.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d0c8df] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">9</span> <div><b>Branch &amp; Blast</b>: Test branch isolation under global load.</div></div></v-click>
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d1e5cd] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">10</span> <div><b>Repeat Cycle</b>: Continuous tuning.</div></div></v-click>
  </div>

</div>

---

# Lesson 1: The Waiting List Bottleneck

### Introduction to the Pattern

API and Storage servers communicate via a **message passing paradigm**. To track outgoing requests and process their responses asynchronously, we use the **Request Waiting List** pattern.

<div class="mt-8 flex justify-center">
  <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm w-3/4 flex items-center gap-6">
    <carbon-concept class="text-5xl shrink-0 text-[#b97a95]" />
    <div>
      <h3 class="font-bold text-slate-800 m-0 text-lg">Request Waiting List</h3>
      <p class="text-[0.95rem] text-slate-600 mt-2 m-0 leading-relaxed">
        A mechanism used to track sent requests. The node stores the request state in a list and removes it only when the corresponding response arrives or a timeout occurs.
      </p>
      <div class="mt-4 flex items-center gap-6 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
        <div class="flex items-center gap-2">
          <carbon-logo-github /> Proven in Production: <a href="https://github.com/etcd-io/etcd/blob/main/pkg/wait/wait.go" target="_blank" class="hover:text-[#b97a95] border-b border-dotted border-slate-300 pb-px">etcd (pkg/wait)</a>
        </div>
        <div class="flex items-center gap-2">
          <carbon-link /> Pattern Reference: <a href="https://martinfowler.com/articles/patterns-of-distributed-systems/request-waiting-list.html" target="_blank" class="hover:text-[#b97a95] border-b border-dotted border-slate-300 pb-px">Martin Fowler</a>
        </div>
      </div>
    </div>
  </div>
</div>

---

# Lesson 1: Initial Design

### The Naive Implementation

Initially, the `WaitingList` was designed as a wrapper over Go’s native `map` protected by a `sync.Mutex`.

<div class="grid grid-cols-2 gap-8 mt-6">
  
  <div class="bg-slate-50 p-4 rounded border border-slate-200">
    <h4 class="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><carbon-user-multiple class="text-[#d0c8df]" /> Concurrent Ingestion</h4>
    <p class="text-xs text-slate-600 m-0">Each incoming batch is handled in a separate goroutine. If a batch is partitioned into N sub-batches, the goroutine makes <strong>N entries</strong> in the WaitingList.</p>
  </div>

  <div class="bg-slate-50 p-4 rounded border border-slate-200">
    <h4 class="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><carbon-clean class="text-[#d1e5cd]" /> Background Cleaner</h4>
    <p class="text-xs text-slate-600 m-0">A dedicated cleaner goroutine periodically scans the list to remove timed-out entries and invoke failure callbacks.</p>
  </div>

</div>

<div class="mt-6 p-3 bg-white border border-[#faebb3] rounded flex items-center gap-3 text-sm font-medium text-slate-700">
  <carbon-warning class="text-[#faebb3] text-xl shrink-0" />
  If N batches arrive, N goroutines simultaneously fight for the same lock.
</div>

---

# Lesson 1: The Flaw

### The Global Lock Bottleneck

The `sync.Mutex` proved to be a catastrophic bottleneck under load because too many goroutines were contending for the WaitingList.

<div class="mt-4 grid grid-cols-2 gap-6 items-stretch">
  <!-- Left Side: The Symptoms -->
  <div class="flex flex-col gap-3">
    <div class="bg-white p-4 rounded-xl border border-red-100 flex-grow shadow-sm">
      <h4 class="text-xs font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <carbon-warning class="text-red-500 shrink-0"></carbon-warning>
        Lock Contention & CPU Wastes
      </h4>
      <p class="text-[11px] text-slate-600 leading-relaxed m-0">
        Thousands of parallel client goroutines blocked each other trying to insert or remove their transaction IDs. Flamegraphs revealed massive CPU time wasted on thread parking (<code>runtime.gopark</code>).
      </p>
    </div>
  </div>

  <!-- Right Side: Comparison with etcd -->
  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
    <div>
      <h4 class="text-xs font-black text-slate-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
        <carbon-network-3 class="text-blue-500 shrink-0"></carbon-network-3>
        Why etcd Gets Away With It
      </h4>
      <p class="text-[11px] text-slate-600 leading-relaxed m-0">
        In <b>etcd</b>, updates to the wait list are driven by a single-threaded Raft main loop. Writes and deletes are naturally serialized.
      </p>
    </div>
    <div class="bg-white p-2.5 rounded border border-slate-200 text-[10px] text-slate-500 font-medium leading-relaxed mt-2.5">
      <b>Our Scenario:</b> We placed the wait list in our concurrent API Coordinator. Thousands of multi-core goroutines hammered the global lock in parallel, turning etcd's pattern into a contention nightmare.
    </div>
  </div>
</div>

---

# Lesson 1: The Solution

### Lock Partitioning & `WaitingListGroup`

Because we have fixed kinds of batches, we redesigned it. We created a `WaitingListGroup`, which has a dedicated `WaitingList` for *each kind* of batch.

<div class="grid grid-cols-5 gap-4 mt-2 items-center">
  <div class="col-span-2 bg-white p-3 border border-slate-200 rounded text-center animate-pulse">
    <div class="font-bold text-slate-700 text-xs mb-1.5">WaitingListGroup</div>
    <div class="flex flex-col gap-1.5">
      <div class="bg-slate-50 text-[10px] p-1 rounded border border-slate-200">List (Write)</div>
      <div class="bg-slate-50 text-[10px] p-1 rounded border border-slate-200">List (Read)</div>
      <div class="bg-slate-50 text-[10px] p-1 rounded border border-slate-200">List (Sync)</div>
    </div>
  </div>
  
  <div class="flex justify-center"><carbon-arrow-right class="text-xl text-slate-400" /></div>
  
  <div class="col-span-2 bg-white p-3 border border-slate-200 rounded text-left">
    <div class="text-center">
      <carbon-data-structured class="text-2xl text-[#d1e5cd] mx-auto mb-1" />
      <h3 class="font-bold text-slate-800 text-xs m-0 pb-1 border-b border-slate-100">Powered by <code>xsync</code></h3>
    </div>
    <div class="mt-2 space-y-1.5">
      <div class="flex items-start gap-1.5">
        <carbon-checkmark class="text-emerald-500 mt-0.5 shrink-0 text-xs"></carbon-checkmark>
        <span class="text-[9.5px] text-slate-600 leading-snug">Built each list on top of <b>Cache-Line Hash Tables</b> for highly localized contention.</span>
      </div>
      <div class="flex items-start gap-1.5">
        <carbon-checkmark class="text-emerald-500 mt-0.5 shrink-0 text-xs"></carbon-checkmark>
        <span class="text-[9.5px] text-slate-600 leading-snug">Aligning buckets with CPU cache line sizes (64B) minimizes cache invalidations across cores.</span>
      </div>
    </div>
  </div>
</div>

<a href="https://tech-lessons.in/en/blog/cache_line_hashtable/" target="_blank" class="text-xs text-[#b97a95] underline mt-3 block text-center">Read our deep dive: Cache-Line Hash Table</a>

---

# Lesson 1: The Result

### Massive Performance Gains

By eliminating the global mutex bottleneck, our API servers could instantly process incoming batches without stalling.

<div class="mt-6 flex justify-center gap-8">
  <div class="text-center">
    <div class="text-5xl font-black text-slate-300 line-through">115ms</div>
    <div class="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">Old Read Latency</div>
  </div>
  <div class="flex items-center text-2xl text-[#d1e5cd]"><carbon-arrow-right /></div>
  <div class="text-center">
    <div class="text-6xl font-black text-[#d1e5cd]">< 10ms</div>
    <div class="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">New Read Latency</div>
  </div>
</div>

<div class="mt-4 bg-[#faebb3]/15 border border-[#faebb3] rounded p-2 text-center max-w-2xl mx-auto">
  <p class="text-xs font-bold text-slate-800 m-0 leading-tight">Tested Under Load (50% reads, 50% writes):</p>
  <p class="text-[11px] text-slate-600 mt-0.5 m-0 leading-tight">300 batches per second (10 messages per batch).</p>
</div>

---

# Lesson 2: The 2PC Tax

### The Distributed Coordination Problem

To ensure ACID properties across a partitioned data plane, we implemented a **Two-Phase Commit (2PC)** protocol. But correctness came with a massive performance cost.

<div class="mt-8 grid grid-cols-2 gap-6">
  <div class="bg-white p-4 rounded border border-slate-200 shadow-sm">
    <h3 class="font-bold text-slate-800 text-sm m-0">The Protocol</h3>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      A multi-step dance involving an <b>API Server</b> acting as the orchestrator and a <b>Coordinator Partition</b> (the leader with the smallest ID) managing the state machine.
    </p>
  </div>
  <div class="bg-white p-4 rounded border border-slate-200 shadow-sm">
    <h3 class="font-bold text-slate-800 text-sm m-0">The "Tax"</h3>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      Every distributed transaction required multiple network round-trips (RPCs), constant metadata tracking, and <b>Extended Intent Windows</b> blocking conflicting keys.
    </p>
  </div>
</div>

---

# Lesson 2: The Heavyweight Path

### Anatomy of a Multi-Partition Transaction

A single batch split across partitions (e.g., P1, P5, P9) triggered a complex sequence of operations:

<div class="mt-4 space-y-2 max-w-2xl mx-auto text-left">
  <v-click><div class="flex items-center gap-4 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
    <span class="w-24 shrink-0 font-bold text-[#b97a95]">1. BEGIN</span>
    <span class="text-slate-500">API Server contacts <strong>P1's leader</strong> (Coordinator) to initialize Transaction ID.</span>
  </div></v-click>
  <v-click><div class="flex items-center gap-4 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
    <span class="w-24 shrink-0 font-bold text-[#b97a95]">2. INTENT</span>
    <span class="text-slate-500">API Server sends "Add Intent" to all participating leaders (P1, P5, P9). Leaders detect conflicts and record intents in BadgerDB.</span>
  </div></v-click>
  <v-click><div class="flex items-center gap-4 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
    <span class="w-24 shrink-0 font-bold text-[#b97a95]">3. ASYNC</span>
    <span class="text-slate-500">If all intents succeed, API Server sends "Async Commit" to <strong>P1's leader</strong> (Coordinator). Response is returned to the client.</span>
  </div></v-click>
  <v-click><div class="flex items-center gap-4 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
    <span class="w-24 shrink-0 font-bold text-[#b97a95]">4. COMMIT</span>
    <span class="text-slate-500">Coordinator (P1) asynchronously sends final "Commit" requests to all participating leaders (P1, P5, P9).</span>
  </div></v-click>
</div>

<div class="mt-6 text-center text-[10px] text-slate-400 font-mono uppercase tracking-widest">
  Total IO Roundtrips: 3/4 per batch | WaitingList Load: High
</div>

---

# Lesson 2: The Distributed Dance

<div class="mt-8 flex items-center justify-between px-10">
<div class="flex flex-col items-center">
<div class="w-20 h-20 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center shadow-sm">
<carbon-api class="text-3xl text-blue-500" />
</div>
<span class="mt-3 font-bold text-slate-700 uppercase tracking-widest text-[10px]">API Server</span>
<span class="text-[9px] text-slate-400 uppercase tracking-tighter">(Orchestrator)</span>
</div>
<div class="flex-grow flex flex-col justify-center h-[300px] relative px-4">
<div v-click class="absolute top-[15%] left-0 w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-[#b97a95] relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[#b97a95]"></div>
</div>
<span class="text-[9px] font-bold text-[#b97a95] uppercase bg-white px-1">1. Begin</span>
</div>
<div v-click class="absolute top-[20%] left-0 w-full h-[60%] flex flex-col justify-between border-l-2 border-dashed border-blue-300">
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-300"></div>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-300"></div>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-blue-300"></div>
</div>
</div>
<div class="absolute top-1/2 left-4 -translate-y-1/2">
<span class="text-[9px] font-bold text-blue-500 uppercase bg-white px-1 whitespace-nowrap">2. Add Intent (Parallel)</span>
</div>
</div>
<div v-click class="absolute top-[10%] left-0 w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-green-500 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-green-500"></div>
</div>
<span class="text-[9px] font-bold text-green-600 uppercase bg-white px-1">3. Async Commit</span>
</div>
</div>
<div class="flex flex-col gap-6">
<div class="flex items-center gap-3">
<div class="w-16 h-16 bg-slate-50 border-2 border-[#b97a95] rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-2xl text-slate-500" />
</div>
<div class="flex flex-col">
<span class="font-bold text-slate-700 uppercase tracking-widest text-[10px]">P1</span>
<span class="text-[8px] text-[#b97a95] font-black uppercase">(Coordinator)</span>
</div>
</div>
<div class="flex items-center gap-3">
<div class="w-16 h-16 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm opacity-60">
<carbon-data-base class="text-2xl text-slate-500" />
</div>
<span class="font-bold text-slate-400 uppercase tracking-widest text-[10px]">P5</span>
</div>
<div class="flex items-center gap-3">
<div class="w-16 h-16 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm opacity-60">
<carbon-data-base class="text-2xl text-slate-500" />
</div>
<span class="font-bold text-slate-400 uppercase tracking-widest text-[10px]">P9</span>
</div>
</div>
</div>

---

# Lesson 2: The Realization

### Unnecessary IO Overhead

We realized that for batches targeting only a **single partition** (or single-message batches), the standard 2PC protocol was generating an excessive number of IO round-trips.

<div class="mt-12 flex justify-center gap-12">
  <div class="text-center">
    <div class="text-sm font-bold text-slate-400 uppercase tracking-widest">Case A</div>
    <div class="text-xl font-bold text-slate-600 mt-2">Batch: 1 Message</div>
  </div>
  <div class="flex items-center text-slate-300 text-2xl"><carbon-add /></div>
  <div class="text-center">
    <div class="text-sm font-bold text-slate-400 uppercase tracking-widest">Case B</div>
    <div class="text-xl font-bold text-slate-600 mt-2">All Messages → Partition X</div>
  </div>
</div>

<v-click>
<div class="mt-6 p-2 bg-[#faebb3]/20 border border-[#faebb3] rounded text-center max-w-xl mx-auto">
  <h3 class="text-sm font-bold text-slate-800 m-0">The Waste:</h3>
  <p class="text-xs text-slate-600 mt-1 leading-relaxed">
    Why run a 4-step coordination protocol when there's only one participant? We were paying the 2PC tax for transactions that were logically local.
  </p>
</div>
</v-click>

---

# Lesson 2: The Solution

### Single Partition Fast-Path

We introduced an optimized execution path that collapses the entire 2PC lifecycle into a single atomic request.

<div class="grid grid-cols-2 gap-8 mt-6">
  <div class="relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden opacity-80">
    <div class="absolute top-0 right-0 bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 rounded-bl-lg uppercase tracking-tighter">Distributed 2PC</div>
    <div class="mt-6 space-y-3">
      <div class="flex items-center gap-3">
        <div class="h-2.5 w-10 bg-slate-200 rounded"></div>
        <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Begin</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-2.5 w-20 bg-slate-200 rounded"></div>
        <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intent</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-2.5 w-14 bg-slate-200 rounded"></div>
        <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Async</div>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-2.5 w-24 bg-slate-200 rounded"></div>
        <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Commit</div>
      </div>
    </div>
    <div class="mt-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">3/4 RPC Roundtrips</div>
  </div>

  <div class="relative bg-white p-4 rounded-xl border-2 border-[#d1e5cd] shadow-lg overflow-hidden">
    <div class="absolute top-0 right-0 bg-[#d1e5cd] px-3 py-1 text-[10px] font-bold text-slate-800 rounded-bl-lg uppercase tracking-widest text-shadow-none">Optimized Path</div>
    <div class="mt-12 flex flex-col items-center">
       <div class="h-8 w-full bg-[#d1e5cd] rounded flex items-center justify-center shadow-inner">
          <carbon-flash class="text-sm text-slate-800 mr-2" />
          <span class="text-xs font-black text-slate-800 uppercase tracking-widest">Single Atomic RPC</span>
       </div>
    </div>
    <div class="mt-14 text-center text-sm font-black text-slate-900 uppercase tracking-widest">1 RPC Total</div>
  </div>
</div>

<p class="mt-8 text-xs text-center text-slate-600 italic">
  The target leader handles <b>ID Generation + Intent + Atomic Commit</b> in one internal transition.
</p>

---

# Lesson 2: The Result

### Drastic Resource Efficiency

By bypassing the distributed coordinator for single-partition batches, we unlocked significant performance headroom.

<div class="grid grid-cols-3 gap-6 mt-10">
  <v-click>
  <div class="bg-white p-4 rounded border border-slate-200 text-center">
    <carbon-network-4 class="text-3xl text-[#b97a95] mx-auto mb-3" />
    <h4 class="font-bold text-slate-800 text-sm mb-1">~66% Fewer IO Calls</h4>
    <p class="text-[10px] text-slate-500 leading-tight">Reduced network round-trips from 3/4 down to 1.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-4 rounded border border-slate-200 text-center">
    <carbon-list class="text-3xl text-[#d0c8df] mx-auto mb-3" />
    <h4 class="font-bold text-slate-800 text-sm mb-1">Lighter WaitingList Load</h4>
    <p class="text-[10px] text-slate-500 leading-tight">Fewer async entries to track and clean in the API server.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-4 rounded border border-slate-200 text-center">
    <carbon-flash class="text-3xl text-[#d1e5cd] mx-auto mb-3" />
    <h4 class="font-bold text-slate-800 text-sm mb-1">Reduced CPU Overhead</h4>
    <p class="text-[10px] text-slate-500 leading-tight">Bypassing the coordinator state machine logic saved API Server cycles.</p>
  </div>
  </v-click>
</div>

<div class="mt-10 p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-center gap-3">
  <carbon-idea class="text-xl text-[#faebb3]" />
  <span class="text-xs font-medium text-slate-600 italic text-center">Crucial insight: Why coordinate when there is only one participant?</span>
</div>

---

# Lesson 3: Range Read Amplification

### The Hidden Complexity of Hash Partitioning

While hash partitioning is perfect for point queries, range queries (`[A-Z]`) present a fundamental challenge: **Every partition must be consulted.**

<div class="mt-12 max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex items-center gap-8">
  <carbon-network-4 class="text-6xl text-[#b97a95] shrink-0" />
  <div>
    <h3 class="text-lg font-bold text-slate-800 m-0">The "Scatter" Problem</h3>
    <p class="text-sm text-slate-600 mt-3 leading-relaxed">
      In a hash-partitioned system, keys are distributed <b>nearly uniformly</b>. A lexicographical range scan (e.g., <code>"apple"</code> to <code>"zebra"</code>) cannot be routed to a single node.
    </p>
    <div class="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
      Result: Every Range Query = Total Cluster Scan
    </div>
  </div>
</div>

---

# Lesson 3: The Scatter-Gather Disaster

<div class="mt-8 flex items-center justify-between px-10">
<div class="flex flex-col items-center shrink-0">
<div class="relative w-24 h-24 bg-blue-50 border-2 border-blue-200 rounded-2xl flex flex-col items-center justify-center shadow-sm overflow-hidden">
<div v-click="2" class="absolute bottom-0 left-0 w-full h-[90%] bg-red-400 opacity-20 animate-pulse"></div>
<carbon-api class="text-3xl text-blue-500 z-10" />
<span v-after class="text-[8px] font-black text-red-600 uppercase tracking-tighter mt-1 z-10">OOM RISK</span>
</div>
<span class="mt-3 font-bold text-slate-700 uppercase tracking-widest text-[10px]">API Server</span>
</div>
<div class="flex-grow h-[300px] relative mx-4">
<div v-click="1" class="absolute inset-0 flex flex-col justify-around">
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-red-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-400"></div>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-red-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-400"></div>
</div>
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 border border-red-100 rounded shadow-sm z-10">
<span class="text-[9px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap">1. Parallel Scatter Scan</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-red-300 relative">
<div class="absolute right-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-400"></div>
</div>
</div>
</div>
<div v-click="2" class="absolute inset-0 flex flex-col justify-around">
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-2 bg-red-50 relative rounded-full overflow-hidden border border-red-100">
<div class="absolute left-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-red-400"></div>
<span class="absolute right-2 text-[6px] font-mono text-red-400 uppercase">2. Gather Batch Data</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-2 bg-red-50 relative rounded-full overflow-hidden border border-red-100">
<div class="absolute left-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-red-400"></div>
<span class="absolute right-2 text-[6px] font-mono text-red-400 uppercase">Gather Batch Data</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-2 bg-red-50 relative rounded-full overflow-hidden border border-red-100">
<div class="absolute left-0 top-1/2 -translate-y-1/2 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-red-400"></div>
<span class="absolute right-2 text-[6px] font-mono text-red-400 uppercase">Gather Batch Data</span>
</div>
</div>
</div>
</div>
<div class="flex flex-col justify-around h-[300px] shrink-0">
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span class="font-bold text-slate-400 uppercase tracking-widest text-[9px]">P1</span>
</div>
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span class="font-bold text-slate-400 uppercase tracking-widest text-[9px]">P5</span>
</div>
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span class="font-bold text-slate-400 uppercase tracking-widest text-[9px]">P9</span>
</div>
</div>
</div>
<div v-click="3" class="mt-2 text-center">
<div class="inline-block px-4 py-1 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded text-xs animate-bounce shadow-lg">
OOM Incoming
</div>
</div>

---

# Lesson 3: The Disaster (V1)

### "Collect it all in the API Server"

Our first attempt was a simple scatter-gather that worked in dev but crashed in production.

<div class="grid grid-cols-2 gap-8 mt-8">
  <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <h4 class="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4">The Payload Crisis</h4>
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <carbon-data-base class="text-2xl text-slate-300" />
        <div class="text-xs text-slate-600"><b>0.1M keys * 1KB</b> ≈ 100MB per range request.</div>
      </div>
      <div class="flex items-center gap-3">
        <carbon-flash class="text-2xl text-slate-300" />
        <div class="text-xs text-slate-600"><b>GC Pressure</b>: Constant "Stop-The-World" pauses.</div>
      </div>
    </div>
  </div>

  <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">The Result</h4>
    <p class="text-xs text-slate-600 leading-relaxed italic">
      "One heavy range query was enough to saturate the network and stall every point-query in the cluster."
    </p>
    <div class="mt-6 p-2 bg-red-100 text-red-700 rounded border border-red-200 text-center font-black text-[10px] uppercase tracking-widest animate-pulse">
      API Server: Memory Exhaustion (OOM)
    </div>
  </div>
</div>

---

# Lesson 3: The Solution

### Design: Per-Partition Iterators

We shifted the coordinating responsibility to the **Client SDK**. The API Server became a thin, stateless proxy for chunked per-partition data.

<div class="mt-4 grid grid-cols-2 gap-8">
  <div class="bg-white p-5 rounded-xl border-2 border-[#d1e5cd] shadow-sm">
    <h3 class="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
      <carbon-delivery class="text-[#d1e5cd]" /> API Server (Stateless)
    </h3>
    <p class="text-[11px] text-slate-600 mt-3 leading-relaxed">
      Queries all partitions in parallel but <b>does NOT merge</b>. Returns a map:
      <code class="block bg-slate-50 p-2 mt-2 rounded text-[10px] text-slate-500">
        partition_id → [(key, value), ...]
      </code>
    </p>
  </div>

  <div class="bg-white p-5 rounded-xl border-2 border-[#d0c8df] shadow-sm">
    <h3 class="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
      <carbon-user-identification class="text-[#d0c8df]" /> Client SDK (Coordinator)
    </h3>
    <p class="text-[11px] text-slate-600 mt-3 leading-relaxed">
      Tracks progress <b>per partition</b>. Subsequent requests send the <b>next key per partition</b> back to the API.
      <code class="block bg-slate-50 p-2 mt-2 rounded text-[10px] text-slate-500">
        last_seen_map = { P1: "k9", P5: "z2", ... }
      </code>
    </p>
  </div>
</div>

---

# Lesson 3: Why it Works

### Embracing Statelessness

By moving from a "global iteration" to "per-partition iteration," we solved both the OOM and the consistency bugs.

<div class="mt-8 grid grid-cols-3 gap-4">
  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-flash class="text-3xl text-green-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">No OOM (Memory Safety)</h4>
    <p class="text-[10px] text-slate-500 leading-relaxed">Data is never buffered in aggregate. Chunks pass through instantly.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-delivery class="text-3xl text-blue-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">Stateless API (Scalability)</h4>
    <p class="text-[10px] text-slate-500 leading-relaxed">No cursor state. Any API server can handle subsequent calls.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-checkmark-filled class="text-3xl text-purple-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">No Duplication (Correctness)</h4>
    <p class="text-[10px] text-slate-500 leading-relaxed">Independent partition tracking ensures zero key overlap.</p>
  </div>
  </v-click>
</div>

---

# Lesson 3: The Trade-offs

### Trading IO for Stability

By dividing the range into multiple client-to-API calls, we prioritized system availability and correctness over raw performance.

<div class="mt-4 grid grid-cols-2 gap-8">
  <div class="bg-slate-50 p-4 rounded border border-slate-200">
    <h4 class="font-bold text-slate-700 text-xs mb-3 uppercase tracking-widest">The "IO Tax"</h4>
    <p class="text-[11px] text-slate-600 leading-relaxed">
      A single range query is now <b>divided into N calls</b> from client to API. This significantly increased the total network round-trips and processing overhead per request.
    </p>
  </div>

  <v-click>
  <div class="bg-slate-50 p-4 rounded border border-slate-200">
    <h4 class="font-bold text-slate-700 text-xs mb-3 uppercase tracking-widest">Phantom Reads</h4>
    <p class="text-[11px] text-slate-600 leading-relaxed">
      Since the iteration is non-atomic across calls, any keys inserted <b>during the duration of the range calls</b> (e.g., between A-C) will be returned.
    </p>
  </div>
  </v-click>
</div>

<div class="mt-8 p-3 bg-red-50/30 border border-red-100 rounded text-center">
  <p class="text-[11px] text-slate-500 m-0 italic">"Correctness and availability are non-negotiable. We accepted higher IO to prevent system-wide OOM."</p>
</div>

---

# Lesson 4: Outbound Serialization Bottleneck

### The Inter-Node Communication Layer

While our storage was fast, our **Outbound Connectors** in the API Server became a hidden bottleneck during write-heavy bursts.

<div class="mt-4 max-w-3xl mx-auto">
  <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm text-center">
    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-shadow-none">The Abstraction</h4>
    <p class="text-sm text-slate-600 leading-relaxed mb-6">
      Each <code>OutboundConnector</code> is a dedicated worker responsible for moving data from the API Server to a specific Partition Leader.
    </p>
    <div class="flex justify-center gap-8">
      <div class="flex flex-col items-center">
        <carbon-chip class="text-3xl text-blue-400 mb-2" />
        <span class="text-[10px] text-slate-400 font-mono">Goroutine</span>
      </div>
      <div class="flex flex-col items-center">
        <carbon-layers class="text-3xl text-blue-400 mb-2" />
        <span class="text-[10px] text-slate-400 font-mono">Buffered Channel</span>
      </div>
      <div class="flex flex-col items-center">
        <carbon-network-2 class="text-3xl text-blue-400 mb-2" />
        <span class="text-[10px] text-slate-400 font-mono">TCP Socket</span>
      </div>
    </div>
  </div>
</div>

---

# Lesson 4: The Bottleneck

### The Original Design

<div class="mt-12 flex justify-center">
  <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-xl w-full">
    <h4 class="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-shadow-none">1 Connector : 1 Partition</h4>
    <p class="text-sm text-slate-600 leading-relaxed mb-6">
      Simple, easy to reason about and guarantees strict message ordering.
    </p>
    <ul class="text-sm text-slate-500 space-y-4 list-disc pl-6">
      <li>Single goroutine per partition handling outbound traffic for that partition.</li>
      <li>One persistent TCP connection per partition.</li>
    </ul>
  </div>
</div>

---

# Lesson 4: Visualizing the Connector

<div class="mt-8 flex items-center justify-between px-10">
<div class="flex flex-col items-center shrink-0">
<div style="width: 280px;" class="relative p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl shadow-sm">
<div style="font-size: 8px;" class="absolute -top-3 left-6 px-3 bg-blue-500 text-white font-black uppercase tracking-widest rounded-full">API Server</div>
<div class="flex flex-col gap-4">
<div style="font-size: 9px;" class="font-bold text-blue-800 uppercase tracking-widest mb-1 border-b border-blue-100 pb-1">Outbound Connector</div>
<div v-click class="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
<carbon-process class="text-blue-400 text-lg shrink-0" />
<div class="flex items-center gap-1">
<div class="flex gap-0.5 px-1 py-0.5 bg-slate-100 rounded border border-slate-200">
<div class="w-1 h-3 bg-blue-300 rounded-sm"></div>
<div class="w-1 h-3 bg-blue-300 rounded-sm"></div>
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
</div>
<span style="font-size: 6px;" class="font-mono text-slate-400">chan</span>
</div>
<div class="flex flex-col ml-1">
<span style="font-size: 8px;" class="font-black text-slate-700 uppercase">Worker (P1)</span>
<span style="font-size: 6px;" class="text-slate-400 font-mono italic">go handler(P1)</span>
</div>
</div>
<div v-click class="flex items-center gap-3 p-2 bg-white rounded-xl border border-blue-100 shadow-sm opacity-80">
<carbon-process class="text-blue-400 text-lg shrink-0" />
<div class="flex items-center gap-1">
<div class="flex gap-0.5 px-1 py-0.5 bg-slate-100 rounded border border-slate-200">
<div class="w-1 h-3 bg-blue-300 rounded-sm"></div>
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
</div>
<span style="font-size: 6px;" class="font-mono text-slate-400">chan</span>
</div>
<div class="flex flex-col ml-1">
<span style="font-size: 8px;" class="font-black text-slate-700 uppercase">Worker (P5)</span>
<span style="font-size: 6px;" class="text-slate-400 font-mono italic">go handler(P5)</span>
</div>
</div>
<div v-click class="flex items-center gap-3 p-2 bg-white rounded-xl border border-blue-100 shadow-sm opacity-60">
<carbon-process class="text-blue-400 text-lg shrink-0" />
<div class="flex items-center gap-1">
<div class="flex gap-0.5 px-1 py-0.5 bg-slate-100 rounded border border-slate-200">
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
<div class="w-1 h-3 bg-slate-200 rounded-sm"></div>
</div>
<span style="font-size: 6px;" class="font-mono text-slate-400">chan</span>
</div>
<div class="flex flex-col ml-1">
<span style="font-size: 8px;" class="font-black text-slate-700 uppercase">Worker (P9)</span>
<span style="font-size: 6px;" class="text-slate-400 font-mono italic">go handler(P9)</span>
</div>
</div>
</div>
</div>
</div>
<div style="height: 300px;" class="flex-grow relative mx-4">
<div v-click class="absolute inset-0 flex flex-col justify-around">
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-200 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-blue-300"></div>
<span style="font-size: 6px;" class="absolute top-1 left-1/2 -translate-x-1/2 font-mono text-blue-400 uppercase whitespace-nowrap">Single Persistent TCP</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-200 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-blue-300"></div>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-blue-200 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-blue-300"></div>
</div>
</div>
</div>
</div>
<div style="height: 300px;" class="flex flex-col justify-around shrink-0">
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span style="font-size: 9px;" class="font-bold text-slate-400 uppercase tracking-widest">P1</span>
</div>
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span style="font-size: 9px;" class="font-bold text-slate-400 uppercase tracking-widest">P5</span>
</div>
<div class="flex items-center gap-3">
<div class="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
<carbon-data-base class="text-xl text-slate-500" />
</div>
<span style="font-size: 9px;" class="font-bold text-slate-400 uppercase tracking-widest">P9</span>
</div>
</div>
</div>

---

# Lesson 4: The Bottleneck

### Two Critical Choking Points

<div style="height: 320px;" class="mt-8 grid grid-cols-2 gap-8 items-stretch">
  <div class="bg-red-50/30 p-6 rounded-xl border border-red-100 shadow-sm flex flex-col h-full">
    <h4 style="font-size: 12px; letter-spacing: 0.2em;" class="font-black text-red-500 uppercase mb-4 text-shadow-none">1. Channel Saturation</h4>
    <div class="flex-grow">
      <p class="text-sm text-slate-600 leading-relaxed mb-4">
        A burst of 50k batches filled the <b>buffered channel</b> instantly.
      </p>
      <div class="bg-white p-4 rounded border border-red-100 text-xs text-red-600 italic leading-relaxed">
        "Upstream goroutines blocked on send, causing massive memory spikes."
      </div>
    </div>
  </div>

  <div class="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
    <h4 style="font-size: 12px; letter-spacing: 0.2em;" class="font-black text-slate-500 uppercase mb-4 text-shadow-none">2. The Serialization Tax</h4>
    <div class="flex-grow">
      <p class="text-sm text-slate-600 leading-relaxed mb-4">
        The single worker per partition became a bottleneck due to <b>CPU-bound Protobuf Marshalling</b>.
      </p>
      <div class="bg-white p-4 rounded border border-slate-200 text-xs text-slate-600 italic leading-relaxed">
        "Significant delays occurred before the data could even reach the network."
      </div>
    </div>
  </div>
</div>

---

# Lesson 4: Visualizing the Solution

### Parallelizing the Serialization Tax

We moved to **N Outbound Connectors** per partition to distribute both the CPU and IO load.

<div class="mt-8 flex items-center justify-between px-10">
<div class="flex flex-col items-center shrink-0">
<div style="width: 290px;" class="relative p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl shadow-sm">
<div style="font-size: 8px;" class="absolute -top-3 left-6 px-3 bg-blue-500 text-white font-black uppercase tracking-widest rounded-full">API Server</div>
<div class="flex flex-col gap-4">
<div style="font-size: 9px;" class="font-bold text-blue-800 uppercase tracking-widest mb-1 border-b border-blue-100 pb-1">Outbound Connector (P1)</div>

<div class="flex items-center gap-2 p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
<carbon-layers class="text-blue-500 text-lg shrink-0" />
<div class="flex items-center gap-1">
<div class="flex gap-0.5 px-1 py-0.5 bg-slate-100 rounded border border-slate-200">
<div class="w-1 h-3 bg-blue-300 rounded-sm animate-pulse"></div>
<div class="w-1 h-3 bg-blue-300 rounded-sm animate-pulse"></div>
<div class="w-1 h-3 bg-blue-300 rounded-sm animate-pulse"></div>
</div>
<span style="font-size: 6px;" class="font-mono text-slate-400">chan</span>
</div>
<div class="flex flex-col ml-1">
<span style="font-size: 8px;" class="font-black text-slate-700 uppercase">Shared Channel</span>
<span style="font-size: 6px;" class="text-slate-400 font-mono">Shared by N workers</span>
</div>
</div>

<div v-click class="grid grid-cols-3 gap-1.5 mt-1">
<div class="flex flex-col items-center p-1.5 bg-blue-50/50 rounded-xl border border-blue-100 shadow-xs text-center">
<carbon-process class="text-blue-500 text-base animate-pulse" />
<span style="font-size: 7px;" class="font-bold text-slate-700 mt-1 uppercase leading-none">Worker 1</span>
<span style="font-size: 5px;" class="text-slate-400 font-mono mt-1">go handler</span>
</div>
<div class="flex flex-col items-center p-1.5 bg-blue-50/50 rounded-xl border border-blue-100 shadow-xs text-center">
<carbon-process class="text-blue-500 text-base animate-pulse" />
<span style="font-size: 7px;" class="font-bold text-slate-700 mt-1 uppercase leading-none">Worker 2</span>
<span style="font-size: 5px;" class="text-slate-400 font-mono mt-1">go handler</span>
</div>
<div class="flex flex-col items-center p-1.5 bg-blue-50/50 rounded-xl border border-blue-100 shadow-xs text-center">
<carbon-process class="text-blue-500 text-base animate-pulse" />
<span style="font-size: 7px;" class="font-bold text-slate-700 mt-1 uppercase leading-none">Worker 3</span>
<span style="font-size: 5px;" class="text-slate-400 font-mono mt-1">go handler</span>
</div>
</div>

</div>
</div>
</div>

<div style="height: 300px;" class="flex-grow relative mx-4">
<div v-click class="absolute inset-0 flex flex-col justify-around py-4">
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-emerald-300 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-emerald-400"></div>
<span style="font-size: 6px;" class="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono text-emerald-500 uppercase whitespace-nowrap">TCP Connection 1</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-emerald-300 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-emerald-400"></div>
<span style="font-size: 6px;" class="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono text-emerald-500 uppercase whitespace-nowrap">TCP Connection 2</span>
</div>
</div>
<div class="w-full flex items-center gap-2">
<div class="flex-grow h-0.5 bg-emerald-300 relative">
<div style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 6px;" class="absolute right-0 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-emerald-400"></div>
<span style="font-size: 6px;" class="absolute -top-3.5 left-1/2 -translate-x-1/2 font-mono text-emerald-500 uppercase whitespace-nowrap">TCP Connection 3</span>
</div>
</div>
</div>
</div>

<div style="height: 300px;" class="flex flex-col justify-around shrink-0">
<div class="flex items-center gap-3">
<div class="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex flex-col items-center justify-center shadow-sm">
<carbon-data-base class="text-2xl text-emerald-500 mb-1" />
<span style="font-size: 9px;" class="font-bold text-emerald-700 uppercase tracking-widest leading-none">P1 Leader</span>
</div>
</div>
</div>

</div>

---

# Lesson 4: The Solution

### Parallelizing the Serialization Tax

<div class="mt-4 grid grid-cols-3 gap-4">
  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-split class="text-3xl text-blue-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">Parallel Serialization</h4>
    <p style="font-size: 10px;" class="text-slate-500 leading-relaxed">N Workers share one channel, offloading CPU-heavy Protobuf work to multiple cores.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-connection-receive class="text-3xl text-green-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">Socket Multiplexing</h4>
    <p style="font-size: 10px;" class="text-slate-500 leading-relaxed">Multiple physical TCP connections per partition distribute the socket-write overhead.</p>
  </div>
  </v-click>

  <v-click>
  <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-center flex flex-col items-center h-full">
    <carbon-security class="text-3xl text-purple-500 mb-4" />
    <h4 class="font-bold text-slate-800 text-sm mb-2 leading-tight">Backpressure Resiliency</h4>
    <p style="font-size: 10px;" class="text-slate-500 leading-relaxed">Channel clears N times faster, preventing upstream request blocking.</p>
  </div>
  </v-click>
</div>

<div class="mt-8 flex justify-center">
  <div style="background-color: rgba(209, 229, 205, 0.1); border-color: rgba(209, 229, 205, 0.3);" class="px-6 py-3 rounded-full border text-xs text-slate-600 font-semibold flex items-center gap-2">
    <carbon-checkmark-filled style="color: #d1e5cd;" />
    Tail Latency (p99) dropped by ~15% via parallel serialization
  </div>
</div>

---

# Lesson 4: The Trade-off

### Throughput vs. Sequential Ordering

In a distributed system, every performance win comes with a cost. We made an intentional choice here.

<div class="mt-4 grid grid-cols-2 gap-8">
  <div class="bg-red-50/20 p-6 rounded-xl border border-red-100/50">
    <h4 class="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-4 text-shadow-none">THE RISK: OUT-OF-ORDERING</h4>
    <p class="text-xs text-slate-600 leading-relaxed">
      With multiple parallel workers, a <code>DeleteBatch</code> could technically overtake a <code>PutBatch</code> for the same key.
    </p>
  </div>

  <v-click>
  <div class="bg-slate-50 p-6 rounded-xl border border-slate-200">
    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-shadow-none">The Justification</h4>
    <ul class="text-[11px] text-slate-600 space-y-4">
      <li class="flex items-start gap-3">
        <carbon-checkmark class="text-green-500 mt-1 shrink-0" />
        <div>
          <div class="font-bold text-slate-700 mb-0.5">Client SDK Design</div>
          <div class="text-slate-500 leading-relaxed">The SDK is strictly request-response, naturally serializing writes for the same key.</div>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <carbon-checkmark class="text-green-500 mt-1 shrink-0" />
        <div>
          <div class="font-bold text-slate-700 mb-0.5">Safe Parallelization</div>
          <div class="text-slate-500 leading-relaxed">We removed the serialization bottleneck while maintaining strict ordering for sequential client logic.</div>
        </div>
      </li>
    </ul>
  </div>
  </v-click>
</div>

---

# The Final Benchmarks

### Workload & System Configuration

<div class="mt-2 grid grid-cols-2 gap-3 items-stretch">
  <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <div>
      <div class="flex items-center gap-2 mb-2">
        <carbon-activity class="text-blue-500 text-sm"></carbon-activity>
        <h4 style="font-size: 10px;" class="font-black text-slate-700 uppercase tracking-wider text-shadow-none m-0">Workload Parameters</h4>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <div class="flex flex-col">
          <span style="font-size: 9px;" class="text-slate-400 font-semibold uppercase tracking-wider">Throughput</span>
          <div class="flex items-baseline gap-0.5 mt-0.5">
            <span class="text-base font-extrabold text-slate-800 leading-none">10,000</span>
            <span style="font-size: 8px;" class="font-semibold text-slate-500">tx/s</span>
          </div>
        </div>
        <div class="flex flex-col">
          <span style="font-size: 9px;" class="text-slate-400 font-semibold uppercase tracking-wider">Range Queries</span>
          <div class="flex items-baseline gap-0.5 mt-0.5">
            <span class="text-xs font-extrabold text-slate-700 leading-none">5</span>
            <span style="font-size: 8px;" class="text-slate-500">every 10 min</span>
          </div>
        </div>
      </div>
      <div class="h-px bg-slate-200 my-2"></div>
      <div style="font-size: 10px;" class="space-y-1.5">
        <div class="flex justify-between items-center">
          <span class="text-slate-600 font-medium">Read Workload</span>
          <span class="text-slate-700 font-semibold">50% Reads (Point Get)</span>
        </div>
        <div class="flex justify-between items-start">
          <span class="text-slate-600 font-medium">Write Workload</span>
          <div class="text-right">
            <div class="text-slate-700 font-semibold">50% Writes (Batched)</div>
          </div>
        </div>
      </div>
      <div class="h-px bg-slate-200 my-2"></div>
      <div>
        <div class="flex items-center gap-1.5 mb-1.5">
          <carbon-fork class="text-blue-500 text-xs shrink-0"></carbon-fork>
          <span style="font-size: 8px;" class="font-black text-slate-400 uppercase tracking-widest leading-none">Access Patterns and Routing</span>
        </div>
        <div class="space-y-1.5">
          <div style="font-size: 9px;" class="bg-white px-2 py-1 rounded border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-700">Point Reads (50%)</span>
              <p style="font-size: 8px;" class="text-slate-400 m-0 leading-tight">1 Msg → Single partition lookup</p>
            </div>
            <span style="font-size: 7.5px;" class="bg-emerald-50 text-emerald-600 font-mono font-black px-1.5 py-0.5 rounded uppercase leading-none">1-PC Read</span>
          </div>
          <div style="font-size: 9px;" class="bg-white px-2 py-1 rounded border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span class="font-bold text-slate-700">Batched Writes (50%)</span>
              <p style="font-size: 8px;" class="text-slate-400 m-0 leading-tight">5 Msg / 1KB batch → Hashed keys</p>
            </div>
            <span style="font-size: 7.5px;" class="bg-blue-50 text-blue-600 font-mono font-black px-1.5 py-0.5 rounded uppercase leading-none">Multi-Raft 2-PC</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <div class="bg-blue-50/20 p-2.5 rounded-xl border border-blue-100/50 shadow-sm flex-grow">
      <div class="flex items-center gap-2 mb-1">
        <carbon-settings class="text-blue-500 text-sm"></carbon-settings>
        <h4 style="font-size: 10px;" class="font-black text-blue-700 uppercase tracking-wider text-shadow-none m-0">Topology and Replication</h4>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
          <span style="font-size: 8px;" class="text-slate-400 uppercase tracking-wider font-semibold leading-none">Partitions</span>
          <span class="text-sm font-bold text-slate-700 leading-none mt-1">32</span>
        </div>
        <div class="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
          <span style="font-size: 8px;" class="text-slate-400 uppercase tracking-wider font-semibold leading-none">Replication</span>
          <div class="flex items-baseline gap-0.5 mt-1">
            <span class="text-sm font-bold text-slate-700 leading-none">3x</span>
            <span style="font-size: 7px;" class="text-slate-400 font-normal">Factor</span>
          </div>
        </div>
        <div class="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
          <span style="font-size: 8px;" class="text-slate-400 uppercase tracking-wider font-semibold leading-none">API Layer</span>
          <span class="text-sm font-bold text-blue-600 leading-none mt-1">1 Server</span>
        </div>
        <div class="bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
          <span style="font-size: 8px;" class="text-slate-400 uppercase tracking-wider font-semibold leading-none">Storage Layer</span>
          <span class="text-sm font-bold text-blue-600 leading-none mt-1">5 Servers</span>
        </div>
      </div>
    </div>
    <div class="bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-1 flex-shrink-0">
        <carbon-chip class="text-emerald-400 text-xs"></carbon-chip>
        <h4 style="font-size: 10px;" class="font-black text-slate-200 uppercase tracking-wider text-shadow-none m-0">Machine Specs (Per Node)</h4>
      </div>
      <div style="font-size: 10px;" class="grid grid-cols-2 gap-1.5">
        <div class="bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 flex flex-col">
          <span style="font-size: 7.5px;" class="text-slate-500 uppercase tracking-wider leading-none">CPU Family</span>
          <span style="font-size: 9.5px;" class="font-bold text-slate-200 mt-0.5">E2 (32 vCPUs, x86_64)</span>
        </div>
        <div class="bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 flex flex-col">
          <span style="font-size: 7.5px;" class="text-slate-500 uppercase tracking-wider leading-none">Memory</span>
          <span style="font-size: 9.5px;" class="font-bold text-slate-200 mt-0.5">64 GB RAM</span>
        </div>
        <div class="bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 flex flex-col">
          <span style="font-size: 7.5px;" class="text-slate-500 uppercase tracking-wider leading-none">Storage</span>
          <span style="font-size: 9.5px;" class="font-bold text-slate-200 mt-0.5">100 GB pd-standard</span>
        </div>
        <div class="bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50 flex flex-col">
          <span style="font-size: 7.5px;" class="text-slate-500 uppercase tracking-wider leading-none">Instance Type</span>
          <span style="font-size: 7.5px;" class="font-bold text-emerald-400 mt-0.5 uppercase tracking-wider">Dedicated / Preemptible: No</span>
        </div>
      </div>
    </div>
  </div>
</div>

---

# Key Takeaways

<div class="grid grid-cols-2 gap-6 mt-4">

<div class="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col h-full">
  <div class="flex items-center gap-3 mb-3">
    <carbon-locked class="text-blue-500 text-xl"></carbon-locked>
    <div style="color: #111827; font-size: 11px; font-family: 'IBM Plex Mono', monospace;" class="font-bold tracking-widest uppercase">Global Locks Don't Scale</div>
  </div>
  <div style="font-size: 9px; line-height: 1.4;" class="text-slate-500 mb-4 flex-grow">First, global locks do not scale in highly concurrent, multi-core systems. Moving from a global mutex to partitioned lock groups using <code>xsync</code> and cache-line hash tables allowed us to isolate contention and achieve our 5.6ms p99 write latency.</div>
  <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
    <span style="font-size: 9px;" class="font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded">5.6ms p99 Write</span>
  </div>
</div>

<div class="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col h-full">
  <div class="flex items-center gap-3 mb-3">
    <carbon-flash class="text-yellow-500 text-xl"></carbon-flash>
    <div style="color: #111827; font-size: 11px; font-family: 'IBM Plex Mono', monospace;" class="font-bold tracking-widest uppercase">Avoid Coordination Tax</div>
  </div>
  <div style="font-size: 9px; line-height: 1.4;" class="text-slate-500 mb-4 flex-grow">Second, avoid paying the coordination tax unless it's absolutely necessary. By identifying that single-partition writes don't need multi-phase coordination, we bypassed the 2PC tax entirely, collapsing network round-trips from four down to one.</div>
  <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
    <span style="font-size: 9px;" class="font-bold text-yellow-600 uppercase tracking-tighter bg-yellow-50 px-2 py-0.5 rounded">Bypass 2PC</span>
  </div>
</div>

<div class="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col h-full">
  <div class="flex items-center gap-3 mb-3">
    <carbon-data-base class="text-green-500 text-xl"></carbon-data-base>
    <div style="color: #111827; font-size: 11px; font-family: 'IBM Plex Mono', monospace;" class="font-bold tracking-widest uppercase">Range Queries vs Partitioning</div>
  </div>
  <div style="font-size: 9px; line-height: 1.4;" class="text-slate-500 mb-4 flex-grow">Third, range queries are the enemy of uniform partitioning. We designed defensively: by routing chunked, per-partition iteration to the client SDK, we eliminated memory buffering and ensured zero OOM events in the API layer.</div>
  <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
    <span style="font-size: 9px;" class="font-bold text-green-600 uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded">Zero OOM Events</span>
  </div>
</div>

<div class="bg-white p-5 rounded border border-gray-200 shadow-sm flex flex-col h-full">
  <div class="flex items-center gap-3 mb-3">
    <carbon-network-2 class="text-purple-500 text-xl"></carbon-network-2>
    <div style="color: #111827; font-size: 11px; font-family: 'IBM Plex Mono', monospace;" class="font-bold tracking-widest uppercase">Serialize in Parallel</div>
  </div>
  <div style="font-size: 9px; line-height: 1.4;" class="text-slate-500 mb-4 flex-grow">Finally, serialize in parallel. In high-throughput workloads, CPU-bound tasks like Protobuf marshalling will bottleneck your network sockets. Multiplexing persistent connections and parallelizing serialization dropped our tail latency by 15%.</div>
  <div class="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
    <span style="font-size: 9px;" class="font-bold text-purple-600 uppercase tracking-tighter bg-purple-50 px-2 py-0.5 rounded">~15% p99 Drop</span>
  </div>
</div>

</div>

<!--
Speaker Notes:
- To wrap things up, let's look at the key takeaways.
- First, global locks do not scale in highly concurrent, multi-core systems. Moving from a global mutex to partitioned lock groups using xsync and cache-line hash tables allowed us to isolate contention and achieve our 5.6ms p99 write latency.
- Second, avoid paying the coordination tax unless it's absolutely necessary. By identifying that single-partition writes don't need multi-phase coordination, we bypassed the 2PC tax entirely, collapsing network round-trips from four down to one.
- Third, range queries are the enemy of uniform partitioning. We designed defensively: by routing chunked, per-partition iteration to the client SDK, we eliminated memory buffering and ensured zero OOM events in the API layer.
- Finally, serialize in parallel. In high-throughput workloads, CPU-bound tasks like Protobuf marshalling will bottleneck your network sockets. Multiplexing persistent connections and parallelizing serialization dropped our tail latency by 15%.
-->

---
layout: center
class: text-center
---

<h1 class="mt-20">Thank You!</h1>

<div class="mt-40 border-t border-slate-200 pt-8 flex items-center justify-center gap-12">
  <div class="text-xl italic text-slate-500 font-medium">By Sarthak Makhija</div>
  
  <div class="h-10 w-[1px] bg-slate-200"></div>
  
  <img src="/caizin-logo.png" class="h-12 object-contain" alt="Caizin Logo" />
</div>

<!--
Speaker Notes:
- Ultimately, systems engineering is a study of trade-offs. The architecture we design is never exactly the architecture we run.
- What is fast on paper is almost always slow in reality—until we profile, measure, and adapt to the hardware underneath us.
- Thank you all for your time! I'm Sarthak Makhija, and if you are building similar storage engines or want to discuss performance tuning, I would love to connect. Thank you!
-->



