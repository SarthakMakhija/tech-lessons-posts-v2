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
    <carbon:logo-github />
  </a>
</div>

---
transition: fade-out
---

# What We Built

We built a distributed Key-Value engine from scratch in Go. 

- **Strongly Consistent**: Built on Multi-Raft.
- **Performant**: Target was single-digit millisecond latency.
- **The Outcome**: 5.6ms p99 write latency (after optimizations).

<br>
<br>

<v-click>

> *"But it didn't start that fast."*

</v-click>

---

# Why We Built It

<div class="grid grid-cols-2 gap-x-12 gap-y-10 mt-12">

  <div class="flex items-start gap-4">
    <carbon:data-1 class="text-4xl text-[#111827] mt-1 opacity-80" />
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Pure Key-Value</h3>
      <p class="!text-slate-500 !text-sm !m-0">No SQL overhead (parsers, ASTs).</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon:flash class="text-4xl text-[#111827] mt-1 opacity-80" />
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Write-Optimized</h3>
      <p class="!text-slate-500 !text-sm !m-0">Targeting strict linearizability.</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon:chart-evaluation class="text-4xl text-[#111827] mt-1 opacity-80" />
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Existing Tech Shortfalls</h3>
      <p class="!text-slate-500 !text-sm !m-0">JunoDB, TiKV, FoundationDB didn't fit perfectly.</p>
    </div>
  </div>

  <div class="flex items-start gap-4">
    <carbon:unlocked class="text-4xl text-[#111827] mt-1 opacity-80" />
    <div>
      <h3 class="!text-xl !font-bold !mb-1 !text-[#111827]">Vendor Independence</h3>
      <p class="!text-slate-500 !text-sm !m-0">Zero external vendor lock-in.</p>
    </div>
  </div>

</div>

<v-click>
  <div class="mt-14 bg-white p-5 rounded border border-gray-200 shadow-sm flex items-center justify-center gap-4">
    <carbon:idea class="text-2xl text-[#111827]" />
    <span class="text-slate-700 font-medium text-lg">Solution: Built our own engine in <strong>Go</strong> on top of <strong>BadgerDB</strong>.</span>
  </div>
</v-click>

---

# Architecture Overview

<div class="flex items-center justify-center w-full mt-4 bg-white p-6 rounded border border-gray-200 shadow-sm">
  <img src="/architecture.png" class="w-full object-contain max-h-[400px]" alt="Architecture Diagram" />
</div>

---

# Key Architectural Features

Building a custom high-performance engine required specific design choices:

<div class="grid grid-cols-2 gap-3 mt-8">

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-layers class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Batching as a First-Class Citizen</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-network-4 class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Persistent TCP Connections</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-edge-node class="text-lg text-slate-600" />
  <span class="font-medium text-slate-800 text-sm">Multiple Outbound Connectors</span>
</div>
</v-click>

<v-click>
<div class="bg-white px-3 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
  <carbon-data-base class="text-lg text-slate-600" />
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
  <span class="font-medium text-slate-800 text-sm">Configurable Replication Factor</span>
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
    <v-click><div class="flex items-start"><span class="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#d0c8df] text-slate-700 text-[10px] font-bold mr-3 mt-0.5">9</span> <div><b>Branch & Blast</b>: Test branch isolation under global load.</div></div></v-click>
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
      <div class="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
        <carbon-logo-github /> Proven in Production: <a href="https://github.com/etcd-io/etcd/blob/main/pkg/wait/wait.go" target="_blank" class="hover:text-[#b97a95] underline decoration-dotted">etcd (pkg/wait)</a>
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

<div class="mt-2 flex flex-col gap-3 max-w-3xl mx-auto">
  <div class="bg-white px-4 py-2 rounded-lg border-l-4 border-[#b97a95] shadow-sm">
    <h3 class="font-bold text-slate-800 m-0 text-sm">Lock Contention</h3>
    <p class="text-xs text-slate-600 mt-0.5 m-0">Thousands of goroutines were constantly blocking each other just to insert or remove their specific batch IDs.</p>
  </div>
  <div class="bg-white px-4 py-2 rounded-lg border-l-4 border-[#d0c8df] shadow-sm">
    <h3 class="font-bold text-slate-800 m-0 text-sm">Context Switching & Sequential Bottleneck</h3>
    <p class="text-xs text-slate-600 mt-0.5 m-0">When goroutines fail to acquire the lock, they park. Flamegraphs revealed excessive <strong>park/unpark calls</strong>, confirming massive CPU cycles wasted on constant thread management.</p>
  </div>
</div>

---

# Lesson 1: The Solution

### Lock Partitioning & `WaitingListGroup`

Because we have fixed kinds of batches, we redesigned it. We created a `WaitingListGroup`, which has a dedicated `WaitingList` for *each kind* of batch.

<div class="grid grid-cols-5 gap-4 mt-8 items-center">
  <div class="col-span-2 bg-white p-4 border border-slate-200 rounded text-center">
    <div class="font-bold text-slate-700 text-sm mb-2">WaitingListGroup</div>
    <div class="flex flex-col gap-2">
      <div class="bg-slate-50 text-xs p-1 rounded border border-slate-200">List (Write)</div>
      <div class="bg-slate-50 text-xs p-1 rounded border border-slate-200">List (Read)</div>
      <div class="bg-slate-50 text-xs p-1 rounded border border-slate-200">List (Sync)</div>
    </div>
  </div>
  
  <div class="flex justify-center"><carbon-arrow-right class="text-2xl text-slate-400" /></div>
  
  <div class="col-span-2 bg-white p-4 border border-slate-200 rounded text-center">
    <carbon-data-structured class="text-3xl text-[#d1e5cd] mx-auto mb-2" />
    <h3 class="font-bold text-slate-800 text-sm m-0">Powered by <code>xsync</code></h3>
    <p class="text-[10px] text-slate-500 mt-2 m-0 leading-tight">We built each list on top of Cache-Line Hash Tables for highly localized contention.</p>
  </div>
</div>

<a href="https://tech-lessons.in/en/blog/cache_line_hashtable/" target="_blank" class="text-xs text-[#b97a95] underline mt-6 block text-center">Read our deep dive: Cache-Line Hash Table</a>

---

# Lesson 1: The Result

### Massive Performance Gains

By eliminating the global mutex bottleneck, our API servers could instantly process incoming batches without stalling.

<div class="mt-6 flex justify-center gap-8">
  <div class="text-center">
    <div class="text-5xl font-black text-slate-300 line-through">115ms</div>
    <div class="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">Old Latency</div>
  </div>
  <div class="flex items-center text-2xl text-[#d1e5cd]"><carbon-arrow-right /></div>
  <div class="text-center">
    <div class="text-6xl font-black text-[#d1e5cd]">< 10ms</div>
    <div class="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">New Latency</div>
  </div>
</div>

<div class="mt-4 bg-[#faebb3]/15 border border-[#faebb3] rounded p-2 text-center max-w-2xl mx-auto">
  <p class="text-xs font-bold text-slate-800 m-0 leading-tight">Tested Under Load:</p>
  <p class="text-[11px] text-slate-600 mt-0.5 m-0 leading-tight">300 batches per second (10 messages per batch).</p>
  <p class="text-[9px] text-[#b97a95] font-bold mt-1.5 m-0 uppercase tracking-widest">TODO: Confirm metrics before presentation</p>
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
  Total IO Roundtrips: 4 per batch | WaitingList Load: High
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
    <div class="mt-8 text-center text-xs font-black text-slate-400 uppercase tracking-widest">4 RPC Roundtrips</div>
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
    <h4 class="font-bold text-slate-800 text-sm mb-1">75% Fewer IO Calls</h4>
    <p class="text-[10px] text-slate-500 leading-tight">Reduced network round-trips from 4 down to 1.</p>
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

# Lesson 3: The Failed Attempt

### Design 1: Global Pagination

To solve the OOM, we tried to implement pagination by having the API Server merge results. The client then identifies the next key from the data to initiate the subsequent request.

<div class="mt-4 grid grid-cols-2 gap-8">
  <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
    <h3 class="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
      <carbon-list class="text-slate-400" /> The Flow
    </h3>
    <ul class="text-[11px] text-slate-600 mt-3 space-y-2">
      <li>API fetches 10 results from <b>all leaders</b>.</li>
      <li>API merges and sorts all results.</li>
      <li>API sends the <b>top 10</b> to the Client SDK.</li>
      <li>Client starts next batch with <b>last seen key</b>.</li>
    </ul>
  </div>

  <v-click>
  <div class="relative bg-red-50/50 p-5 rounded-xl border border-red-200 shadow-sm">
    <div class="absolute top-0 right-0 bg-red-200 px-3 py-1 text-[10px] font-bold text-red-800 rounded-bl-lg uppercase">The Bug</div>
    <h3 class="text-sm font-bold text-red-800 m-0 text-shadow-none">Why Duplication Happens</h3>
    <p class="text-[11px] text-slate-600 mt-3 leading-relaxed">
      A single <b>last_seen_key</b> cannot track <b>N</b> independent cursors. 
      <br><br>
      If the 10th key is <code>"M"</code>, the next request starts at <code>"M"</code>. But Partition B might have already sent <code>"M"</code> in batch 1, causing a duplicate in batch 2.
    </p>
  </div>
  </v-click>
</div>

---

# Lesson 3: The Solution

### Design 2: Per-Partition Iterators

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

# Key Takeaways

<div class="grid grid-cols-2 gap-6 mt-4">

<div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
  <div class="text-[#111827] text-sm font-['IBM_Plex_Mono'] font-semibold mb-3 tracking-widest uppercase">Protocol Fast-Paths</div>
  <div class="text-slate-600">Identify "safe paths" in distributed transactions to bypass the 2PC tax.</div>
</div>

<div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
  <div class="text-[#111827] text-sm font-['IBM_Plex_Mono'] font-semibold mb-3 tracking-widest uppercase">Lock Partitioning</div>
  <div class="text-slate-600">Move from global locks to partitioned lock groups (`xsync`) to isolate contention.</div>
</div>

<div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
  <div class="text-[#111827] text-sm font-['IBM_Plex_Mono'] font-semibold mb-3 tracking-widest uppercase">Defensive Storage</div>
  <div class="text-slate-600">Storage-layer pagination and I/O batching are critical for preventing OOM.</div>
</div>

<div class="bg-white p-6 rounded border border-gray-200 shadow-sm">
  <div class="text-[#111827] text-sm font-['IBM_Plex_Mono'] font-semibold mb-3 tracking-widest uppercase">Scaling Inter-Node IO</div>
  <div class="text-slate-600">Move from single to multiple persistent outbound connectors to increase throughput.</div>
</div>

</div>

---
layout: center
class: text-center
---

# Thank You!

<div class="mt-8 bg-white p-8 rounded border border-gray-200 inline-block shadow-sm">
  <p class="text-slate-500 mb-4 font-['IBM_Plex_Mono'] text-sm tracking-widest uppercase">Read the full deep-dive</p>
  <a href="https://tech-lessons.in" class="text-4xl font-extrabold text-[#111827]">tech-lessons.in</a>
</div>



