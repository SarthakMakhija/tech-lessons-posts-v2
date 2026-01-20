---
author: Sarthak Makhija
title: Workshops
date: 2023-02-24
description: Workshops I conduct
keywords: ["Workshop", "Training"]
type: page
---

I design and facilitate hands-on, deep-dive workshops focused on mastering software craftsmanship and storage internals.

<div class="mb-10">
<a href="https://gamifying-refactoring.github.io/" class="block group">
<h2 class="text-3xl font-sans font-bold mb-3 text-zinc-900 group-hover:text-blue-700 transition-colors">Gamifying Refactoring</h2>
</a>
<p class="text-lg text-zinc-700 leading-relaxed mb-6">
Turn the art of refactoring into a measurable science. This workshop turns code cleanup into a challenge: can you justify a code smell <em>without</em> using vague terms like "readability" or "maintainability"?
</p>
<div class="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
<div class="flex flex-wrap gap-4 mb-3 text-sm">
<span class="px-3 py-0.5 bg-white border border-blue-100 rounded-full text-blue-800 font-medium">
Format: Instructor-led workshop
</span>
<span class="px-3 py-0.5 bg-white border border-blue-100 rounded-full text-blue-800 font-medium">
Availability: On request
</span>
</div>

<h4 class="font-bold text-blue-900 mb-2">The Game Rules</h4>
<ul class="space-y-2 text-zinc-700">
<li class="flex items-start gap-2">
<span class="text-blue-600 font-bold">1.</span>
<span><strong>Identify</strong> smells using concrete evidence, not gut feelings.</span>
</li>
<li class="flex items-start gap-2">
<span class="text-blue-600 font-bold">2.</span>
<span><strong>Justify</strong> your refactoring without using "ilities" (readability, flexibility).</span>
</li>
<li class="flex items-start gap-2">
<span class="text-blue-600 font-bold">3.</span>
<span><strong>Go Beyond</strong> abstract reasoning to find measurable problems.</span>
</li>
</ul>
<p class="mt-4 text-sm text-blue-800 italic">
"Don’t state ‘Long method is a smell because it is not readable’. Consider this an opportunity to find reasoning that is measurable."
</p>
</div>
</div>

<div class="mb-2 mt-12">
<a href="https://github.com/SarthakMakhija/go-lsm" class="block group">
<h2 class="text-3xl font-sans font-bold mb-3 text-zinc-900 group-hover:text-blue-700 transition-colors">Internals of key-value storage engines: LSM-trees and beyond</h2>
</a>
<p class="text-lg text-zinc-700 leading-relaxed mb-6">Participants build an LSM-based storage engine to understand the core components of a key–value store.</p>
<div class="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
<div class="flex flex-wrap gap-4 mb-3 text-sm">
<span class="px-3 py-0.5 bg-white border border-zinc-200 rounded-full text-zinc-700 font-medium">
Format: Instructor-led workshop
</span>
<span class="px-3 py-0.5 bg-white border border-zinc-200 rounded-full text-zinc-700 font-medium">
Availability: On request
</span>
</div>

</div>
</div>

<div class="not-prose mt-12">
<div class="mb-8">
<h3 class="font-sans font-bold text-xl text-zinc-900 mb-2">Day 1: Foundations & Core Structures</h3>
<p class="text-zinc-600">Building the theoretical ground and starting the engine.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

<!-- Section 1 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 1</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">Introduction: Theory</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Overview of a storage engine
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Introduction to block storage devices (HDD)
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
File organization on disk
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Standard IO & Kernel Page Cache
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Storage hierarchy & Block data structure goals
</li>
</ul>
</div>

<!-- Section 2 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 2</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">B+Tree: Theory and Maths</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Binary Search Tree (BST) & Height Calculation
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Can BST be used for disk persistence?
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
B+Tree Architecture & Use-cases
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Disk access patterns: Random vs Sequential
</li>
</ul>
</div>

<!-- Section 3 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow md:col-span-2">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 3</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">LSM Introduction: Hands-on</h4>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Intro to LSM-tree components
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Implementing Memtable + Iterator
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Implementing Write Ahead Log (WAL)
</li>
</ul>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Recovering from WAL
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Understanding WAL implementation patterns
</li>
</ul>
</div>
</div>
</div>

<div class="mb-8">
<h3 class="font-sans font-bold text-xl text-zinc-900 mb-2">Day 2: Advanced Data Structures & Transactions</h3>
<p class="text-zinc-600">Moving to disk, optimization, and ACID properties.</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

<!-- Section 4 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 4</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">SSTables: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Understanding SSTable structure
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Revising Binary Search
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Encoding & Endianness
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Implementing SSTable + Iterator
</li>
</ul>
</div>

<!-- Section 5 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 5</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">Bloom Filters: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Naive Bloom Filter implementation
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Theory behind Bloom Filters
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Robust Bloom Filter implementation
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Integrating into SSTable
</li>
</ul>
</div>

<!-- Section 6 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 6</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">Transactions (ACID): Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Understanding A.C.I.D properties
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Atomicity & Durability implementation
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Isolation Levels explained
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Serialized Snapshot Isolation (Theory)
</li>
</ul>
</div>

<!-- Section 7 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 7</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">Concurrency: Hands-on</h4>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Singular Update Queue
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Implementing Serialized Snapshot Isolation
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Transactions + Iterators
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Introduction to Concurrency
</li>
</ul>
</div>

<!-- Section 8 -->
<div class="rounded-2xl border border-zinc-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow md:col-span-2">
<span class="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Section 8</span>
<h4 class="text-lg font-bold text-zinc-900 mb-4 font-sans">Compaction</h4>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Why do we need compaction?
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Simple-Leveled Compaction (Theory)
</li>
</ul>
<ul class="space-y-3">
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Implementing & Integrating Compaction
</li>
<li class="flex items-start gap-3 text-sm text-zinc-600">
<span class="block w-1.5 h-1.5 mt-1.5 rounded-full bg-zinc-300 shrink-0"></span>
Concurrency + Compaction Revision
</li>
</ul>
</div>
</div>

</div>
</div>
