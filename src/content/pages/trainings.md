---
author: Sarthak Makhija
title: Trainings
date: 2023-02-24
description: Trainings I conduct
keywords: ["Workshop", "Training"]
type: page
---

I design and facilitate hands-on, deep-dive trainings focused on mastering software craftsmanship and storage internals.

Interested in running a training for your team? Email [sarthak.makhija@gmail.com](mailto:sarthak.makhija@gmail.com) or reach out on [LinkedIn](https://www.linkedin.com/in/sarthak-makhija/).

<div class="bg-zinc-50/50 border border-zinc-200/60 rounded-3xl p-6 md:p-8 mb-16 shadow-sm hover:shadow-md transition-all">
<div class="flex items-center gap-4 mb-6">
<div class="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 shrink-0">
<!-- Connection nodes representing concurrency/cache -->
<svg class="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="2" y="2" width="8" height="8" rx="1.5" />
<rect x="14" y="2" width="8" height="8" rx="1.5" />
<rect x="2" y="14" width="8" height="8" rx="1.5" />
<rect x="14" y="14" width="8" height="8" rx="1.5" />
<path d="M6 10v4" />
<path d="M18 10v4" />
<path d="M10 6h4" />
<path d="M10 18h4" />
</svg>
</div>
<div>
<a href="https://tech-lessons.in/rust-workshop-2026/" class="group block">
<h2 class="text-2xl md:text-3xl font-sans font-bold text-zinc-900 group-hover:text-blue-700 transition-colors mb-2">Build a concurrent cache in Rust</h2>
</a>
<div class="flex flex-wrap gap-2 text-xs md:text-sm">
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Format: Instructor-led training
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Duration: 2 days
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Availability: On request
</span>
</div>
</div>
</div>

<p class="text-lg text-zinc-700 leading-relaxed mb-8">
Rather than focusing just on syntax, this workshop takes a deep dive into Rust internals by looking at actual source code while building a production-ready system.
</p>

<div class="not-prose">
<div class="mb-6">
<h3 class="font-sans font-bold text-xl text-zinc-900 mb-1">Workshop Curriculum</h3>
<p class="text-sm text-zinc-500">A step-by-step journey from basic memory allocation to highly concurrent sharded caching.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
<!-- Module 1 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Module 1</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Foundations & Type Safety</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Foundations:</strong> In-memory caching and ownership model basic constraints</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Type Safety:</strong> Overcoming primitive obsession with the NewType pattern and trait derivations</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Generics:</strong> Creating generic abstractions with Trait bounds and standard Library Borrow trait</span>
</li>
</ul>
</div>

<!-- Module 2 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Module 2</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Memory & Concurrency</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Mutation vs Aliasing:</strong> Rust borrow checker rules, lifetimes, and interior mutability via RefCell</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Fearless Concurrency:</strong> Implementing thread safety using Mutex, RwLock, and RAII locks</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Reference Counting:</strong> Utilizing Arc for shared ownership across concurrent threads</span>
</li>
</ul>
</div>

<!-- Module 3 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Module 3</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Zero-Copy & Scale</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Zero-Copy:</strong> Advanced memory layouts, custom references, and lifetime anchoring</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Send & Sync:</strong> Understanding compile-time guarantees for concurrent programming</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Scale & Sharding:</strong> Reducing lock contention by designing and implementing cache sharding</span>
</li>
</ul>
</div>

<!-- Module 4 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Module 4</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Real-World Mechanics</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Cache Expiration:</strong> Implementing Time-To-Live (TTL) with lazy cleanups and background cleanups</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Atomic Mechanics:</strong> Cache line optimization, False Sharing mitigation, and MESI protocol</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span><strong>Type-States:</strong> Using type-state API patterns to enforce compile-time safety during shutdown</span>
</li>
</ul>
</div>
</div>

<div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
<h4 class="font-bold text-zinc-900 mb-3 text-base">After this training, you will be able to</h4>
<ul class="space-y-2 text-zinc-700">
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">1.</span>
<span>Apply advanced memory management concepts, lifetimes, and zero-copy references to avoid unnecessary allocations</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">2.</span>
<span>Design and write thread-safe concurrent systems using mutexes, read-write locks, atomics, and sharding</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">3.</span>
<span>Leverage Rust's type system (NewType, Generics, Type-States) to turn run-time errors into compile-time proofs</span>
</li>
</ul>
</div>
</div>
</div>

<div class="bg-zinc-50/50 border border-zinc-200/60 rounded-3xl p-6 md:p-8 mb-16 shadow-sm hover:shadow-md transition-all">
<div class="flex items-center gap-4 mb-6">
<div class="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 shrink-0">
<!-- Database cylinder icon -->
<svg class="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<ellipse cx="12" cy="5" rx="9" ry="3" />
<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
<path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
</svg>
</div>
<div>
<a href="https://github.com/SarthakMakhija/go-lsm" class="group block">
<h2 class="text-2xl md:text-3xl font-sans font-bold text-zinc-900 group-hover:text-blue-700 transition-colors mb-2">Internals of key-value storage engines: LSM-trees and beyond</h2>
</a>
<div class="flex flex-wrap gap-2 text-xs md:text-sm">
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Format: Instructor-led training
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Duration: 2 days
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Availability: On request
</span>
</div>
</div>
</div>

<p class="text-lg text-zinc-700 leading-relaxed mb-8">
Participants build an LSM-based storage engine to understand the core components of a key-value store.
</p>

<div class="not-prose">
<div class="mb-6">
<h3 class="font-sans font-bold text-xl text-zinc-900 mb-1">Day 1: Foundations & Core Structures</h3>
<p class="text-sm text-zinc-500">Building the theoretical ground and starting the engine.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
<!-- Section 1 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 1</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Introduction: Theory</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Overview of a storage engine</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Introduction to block storage devices (HDD)</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>File organization on disk</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Standard IO & Kernel Page Cache</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Storage hierarchy & Block data structure goals</span>
</li>
</ul>
</div>

<!-- Section 2 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 2</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">B+Tree: Theory and Maths</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Binary Search Tree (BST) & Height Calculation</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Can BST be used for disk persistence?</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>B+Tree Architecture & Use-cases</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Disk access patterns: Random vs Sequential</span>
</li>
</ul>
</div>

<!-- Section 3 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow md:col-span-2">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 3</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">LSM Introduction: Hands-on</h4>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Intro to LSM-tree components</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Implementing Memtable + Iterator</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Implementing Write Ahead Log (WAL)</span>
</li>
</ul>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Recovering from WAL</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Understanding WAL implementation patterns</span>
</li>
</ul>
</div>
</div>
</div>

<div class="mb-6">
<h3 class="font-sans font-bold text-xl text-zinc-900 mb-1">Day 2: Advanced Data Structures & Transactions</h3>
<p class="text-sm text-zinc-500">Moving to disk, optimization, and ACID properties.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
<!-- Section 4 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 4</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">SSTables: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Understanding SSTable structure</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Revising Binary Search</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Encoding & Endianness</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Implementing SSTable + Iterator</span>
</li>
</ul>
</div>

<!-- Section 5 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 5</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Bloom Filters: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Naive Bloom Filter implementation</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Theory behind Bloom Filters</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Robust Bloom Filter implementation</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Integrating into SSTable</span>
</li>
</ul>
</div>

<!-- Section 6 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 6</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Transactions (ACID): Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Understanding A.C.I.D properties</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Atomicity & Durability implementation</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Isolation Levels explained</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Serialized Snapshot Isolation (Theory)</span>
</li>
</ul>
</div>

<!-- Section 7 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 7</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Concurrency: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Singular Update Queue</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Implementing Serialized Snapshot Isolation</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Transactions + Iterators</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Introduction to Concurrency</span>
</li>
</ul>
</div>

<!-- Section 8 -->
<div class="rounded-2xl border border-zinc-200/80 p-6 bg-white shadow-xs hover:shadow-sm transition-shadow md:col-span-2">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 8</span>
<h4 class="text-lg font-bold text-zinc-900 mb-3 font-sans">Compaction</h4>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Why do we need compaction?</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Simple-Leveled Compaction (Theory)</span>
</li>
</ul>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Implementing & Integrating Compaction</span>
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-2.5 rounded-full bg-zinc-300 shrink-0"></span>
<span>Concurrency + Compaction Revision</span>
</li>
</ul>
</div>
</div>
</div>

<div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
<h4 class="font-bold text-zinc-900 mb-3 text-base">After this training, you will be able to</h4>
<ul class="space-y-2 text-zinc-700">
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">1.</span>
<span>Understand the fundamentals of storage engines and how data actually moves from memory to disk</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">2.</span>
<span>Understand how LSM-trees achieve write optimization, from memtable flushes to compaction strategies</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">3.</span>
<span>Understand why write-optimized databases make the trade-offs they do, and when those trade-offs are worth it</span>
</li>
</ul>
</div>
</div>
</div>

<div class="bg-zinc-50/50 border border-zinc-200/60 rounded-3xl p-6 md:p-8 mb-16 shadow-sm hover:shadow-md transition-all">
<div class="flex items-center gap-4 mb-6">
<div class="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 shrink-0">
<!-- Gamepad icon -->
<svg class="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<line x1="6" y1="12" x2="10" y2="12" />
<line x1="8" y1="10" x2="8" y2="14" />
<line x1="15" y1="13" x2="15.01" y2="13" />
<line x1="18" y1="11" x2="18.01" y2="11" />
<rect x="2" y="6" width="20" height="12" rx="3" />
</svg>
</div>
<div>
<a href="https://gamifying-refactoring.github.io/" class="group block">
<h2 class="text-2xl md:text-3xl font-sans font-bold text-zinc-900 group-hover:text-blue-700 transition-colors mb-2">Gamifying Refactoring</h2>
</a>
<div class="flex flex-wrap gap-2 text-xs md:text-sm">
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Format: Instructor-led training
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Duration: 5 hours
</span>
<span class="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 font-medium">
Availability: On request
</span>
</div>
</div>
</div>

<p class="text-lg text-zinc-700 leading-relaxed mb-8">
Turn the art of refactoring into a measurable science. This training turns code cleanup into a challenge: can you justify a code smell <em>without</em> using vague terms like "readability" or "maintainability"?
</p>

<div class="not-prose">
<div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-6">
<h4 class="font-bold text-blue-900 mb-2 text-base">The Game Rules</h4>
<ul class="space-y-2 text-zinc-700">
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">1.</span>
<span><strong>Identify</strong> smells using concrete evidence, not gut feelings.</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">2.</span>
<span><strong>Justify</strong> your refactoring without using "ilities" (readability, flexibility).</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">3.</span>
<span><strong>Go Beyond</strong> abstract reasoning to find measurable problems.</span>
</li>
</ul>
<p class="mt-4 text-sm text-blue-800 italic">
"Don't state 'Long method is a smell because it is not readable'. Consider this an opportunity to find reasoning that is measurable."
</p>
</div>

<div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
<h4 class="font-bold text-zinc-900 mb-3 text-base">After this training, you will be able to</h4>
<ul class="space-y-2 text-zinc-700">
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">1.</span>
<span>Recognize code smells with precision, using evidence rather than intuition</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">2.</span>
<span>Justify refactoring decisions without leaning on vague terms like "readability" or "maintainability"</span>
</li>
<li class="flex items-start gap-2 text-sm">
<span class="text-blue-600 font-bold">3.</span>
<span>Make small, safe, incremental changes that improve code without breaking behavior</span>
</li>
</ul>
</div>
</div>
</div>
