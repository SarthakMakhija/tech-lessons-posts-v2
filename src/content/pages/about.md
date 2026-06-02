---
author: Sarthak Makhija
title: About Me
date: 2023-02-24
description:
keywords: ["about-me", "contact"]
type: page
---

<style>
 .social{
    display: inline-block;
    text-align: left;
    width: 100%;
    color: #a6a6a6;
    font-size: .9em;
}
</style>

<div class="self-container">
    <p><img class="self-image" alt="Sarthak Makhija" src="/self.png"></p>
</div>

Hi, I'm Sarthak Makhija, Principal Architect at [Caizin](https://caizin.com/).

I build storage engines, search systems, query engines, and distributed databases. My interests lie in database internals, search infrastructure, query processing, and distributed state management, primarily using Go and Rust.

Beyond building software, I document low-level implementation details on my [blog](https://tech-lessons.in/), validate core patterns for industry literature like Unmesh Joshi's [*Patterns of Distributed Systems*](https://learning.oreilly.com/library/view/-/9780138222246/) and run hands-on systems [trainings](https://tech-lessons.in/trainings/).

### Core Systems & Architecture

**Principal Architect** | Caizin *(2024 - Present)*:
Architecting and building a production-grade transpiler designed to automatically migrate legacy UniBasic codebases into concurrent, highly optimized Java ecosystems. The implementation covers the entire compiler pipeline: custom lexical analysis, parsing, semantic analysis, AST transformation, and code generation.

**Lead Consultant** | Thoughtworks *(2016 - 2024)*:
Led the engineering team that built a distributed, strongly consistent Key/Value database from scratch in Go. Designed to guarantee strict correctness and serializable isolation across failure domains, the system sustained **10,000 transactions per second across 32 partitions** with a replication factor of 3.

- **Storage & Coordination:** Badger engine instances for local storage; etcd for cluster metadata management.
- **Sharding & Topology:** Hash partitioning via consistent hashing, backed by multi-AZ replication to survive zone-level outages.
- **Consensus & State:** Multi-Raft consensus paired with a two-phase commit (2PC) engine.
- **Networking:** Custom, persistent TCP connections for low-latency node-to-node RPCs.

---

### Production Systems

**Modifying Distributed Search Internals**
Built a petabyte-scale search engine experiment by modifying Quickwit's core architecture. To bypass traditional library limits, we overhauled the engine's internal delete mechanics to implement a custom tombstone store and engineered a specialized multi-valued update engine on top of Tantivy.

**Query Engine Processing Layers**
I authored the 7-part technical series *"Inside a Query Engine"* on this [blog](https://tech-lessons.in/en/blog/inside_a_query_engine_introduction/), breaking down physical execution and logical optimization mechanics. This deep-dive series currently **ranks #1 globally on Google Search** for query engine internals.

---

---

### Open-Source Projects

🔹 **[infer](https://github.com/SarthakMakhija/infer) (WIP)**
A type-inference compiler implementing Constraint-Based Hindley-Milner type system mechanics for a [custom programming language](https://github.com/SarthakMakhija/infer/tree/main/examples).

🔹 **[Relop](https://github.com/SarthakMakhija/relop)**
A minimal, in-memory relational query engine written in Rust. It handles everything from tokenization and custom AST parsing to rule-based logical plan optimizations and iterator-driven execution.

🔹 **[Go-LSM](https://github.com/SarthakMakhija/go-lsm)**
An educational log-structured merge-tree (LSM) key-value store in Go. Serves as a clean reference codebase for my storage internals workshops, demonstrating WAL boundaries, memtable flushes, and SSTable compaction.

🔹 **[clearcheck](https://github.com/SarthakMakhija/clearcheck)**
A fluent, expressive assertion library for Rust that allows chaining multiple test assertions together for highly self-documenting test cases.

---

### Links
- [GitHub](https://github.com/SarthakMakhija/)
- [LinkedIn](https://www.linkedin.com/in/sarthak-makhija/)
- [Download my Resume](/resume.pdf)
