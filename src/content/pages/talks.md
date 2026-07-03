---
author: Sarthak Makhija
title: Talks
date: 2026-04-19
description: My conference talks and event workshops
keywords: ["Talks", "Speaking", "Conferences"]
type: page
---

I share my deep dives into systems programming and storage internals through technical talks and hands-on workshops.

### Fast on Paper, Slow in Reality: What We Got Wrong About Performance
*Real-world performance lessons and design trade-offs from building a distributed key-value engine from scratch in Go.*

<div class="talk-meta">
  <span class="meta-item location">Rootconf 2026</span>
  <span class="meta-item audience">Backend & Systems Engineers</span>
</div>

<details>
<summary>Abstract & Key Takeaways</summary>

#### What this talk covers
- Building a strongly consistent, distributed Key-Value engine from scratch in Go on top of BadgerDB and Multi-Raft
- Isolating lock contention: Moving from a global mutex to partitioned lock groups using `xsync` and cache-line hash tables
- Bypassing the two-phase commit (2PC) tax for single-partition writes
- Defensive range queries: Routing chunked, client-driven iteration to eliminate memory buffering and avoid API layer OOMs
- Parallelizing Protobuf serialization and multiplexing persistent connections to drop tail latencies

#### Key takeaway
What is fast on paper is almost always slow in reality, until we profile, measure, and adapt to the hardware underneath. By identifying coordination bottlenecks and CPU-bound serialization limits, we optimized our distributed key-value engine from a sluggish start to a p99 write latency of ~5.6ms at 10 000 TPS.

</details>

<div class="flex gap-4 mt-4 mb-12">
  <a href="/talks/rootconf-2026/" class="text-sm font-bold text-accent-600 hover:underline">View slides →</a>
</div>

### Questioning Database Claims: Design Patterns of Storage Engines
*A practical way to evaluate database claims using real storage engine patterns.*

<div class="talk-meta">
  <span class="meta-item location">GopherConIndia 2024</span>
  <span class="meta-item audience">Backend & Systems Engineers</span>
</div>

<details>
<summary>Abstract & Key Takeaways</summary>

#### What this talk covers
- Common claims databases make about durability and read/write optimization
- How to evaluate those claims critically using real design patterns
- Core storage engine patterns: **WAL**, **fsync**, **B+tree**, **bloom filters**, **LSM trees**, **WiscKey**

#### Key takeaway
Every database makes claims, *"Durable writes"*, *"Fast reads"*, *"Horizontal scale"*. But do you know what's actually happening underneath? This talk gives you the vocabulary and the patterns to stop taking those claims on faith and start evaluating them yourself.

</details>

<div class="flex gap-4 mt-4 mb-12">
  <a href="https://www.youtube.com/watch?v=_55OM23zhUo&list=PLbgP71NCXCqG4xkCmsn5wSpW7bhypnqHI&index=11" class="text-sm font-bold text-accent-600 hover:underline">Watch the talk →</a>
  <a href="https://github.com/SarthakMakhija/questioning-database-claims-gocon24" class="text-sm font-bold text-zinc-500 hover:underline">Slides</a>
</div>

<div class="flex items-center gap-4 my-12">
  <div class="flex-1 border-t border-zinc-200"></div>
  <span class="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">Workshops</span>
  <div class="flex-1 border-t border-zinc-200"></div>
</div>

### Build a Concurrent Cache in Rust
*Learn Rust by building a tiny concurrent cache, treating the Standard Library as a mentor.*

<div class="talk-meta">
  <span class="meta-item location">Rust India Conference 2026</span>
  <span class="meta-item format">Hands-on Workshop</span>
</div>

<details>
<summary>Workshop Curriculum & Outcomes</summary>

**Target Audience:** Engineers with basic Rust knowledge looking to go deeper into systems programming.

#### What this workshop covers:
- Memory allocation and ownership in Rust
- Zero-cost abstractions in practice
- Concurrent data structures: design and implementation
- Building a working concurrent cache end-to-end

#### Key takeaway
Building a tiny concurrent cache is a journey of countless design choices. But when you treat the Standard Library as a mentor and base those decisions on its idioms, you are adopting the collective engineering wisdom of the Rust community.

</details>

<div class="mt-4 mb-12">
  <a href="https://tech-lessons.in/rust-workshop-2026/" class="text-sm font-bold text-accent-600 hover:underline">Workshop materials →</a>
</div>

---

## Interested in a talk or workshop?

Reach out on [LinkedIn](https://www.linkedin.com/in/sarthak-makhija/) or email [sarthak@tech-lessons.in](mailto:sarthak@tech-lessons.in).
