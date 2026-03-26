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
I write long-form essays on refactoring, storage engines, databases, and engineering trade-offs.

Prior to joining Caizin, I was with [Thoughtworks](https://www.thoughtworks.com/en-in) where I led a team that developed a **strongly consistent, distributed key/value storage engine** in Go.
This system was built with a focus on high availability and strict correctness, featuring:

- **Core Storage & Coordination:** Badger as the underlying local key/value engine, with etcd managing cluster metadata.
- **Distribution & Sharding:** Hash partitioning for data distribution across the cluster, using consistent hashing for the assignment of partitions/shards.
- **Consistency & Consensus:** Raft/Multi-Raft for consensus, paired with two-phase commit ensuring a serial isolation level.
- **Networking:** Persistent TCP connections for efficient, low-latency node-to-node communication.

I also enjoy sharing my knowledge and contributing to the broader engineering community:
- **Authoring:** I contributed to the validation of distributed system patterns in the book [*Patterns of Distributed Systems*](https://learning.oreilly.com/library/view/-/9780138222246/) by Unmesh Joshi. I authored articles on persistent memory for Marcin Moskala.
- **Workshops:** I design and facilitate hands-on, deep-dive [workshops](https://tech-lessons.in/workshops/) focused on mastering software craftsmanship and storage internals.

Additionally, I spend time building educational systems from scratch to demystify how databases and distributed systems work under the hood.

---

### Currently exploring

- Finished building a query engine ([Relop](https://github.com/SarthakMakhija/relop)) in Rust + launched a [7-part series](https://tech-lessons.in/en/blog/inside_a_query_engine_introduction/) on its internals
- Building my programming language Nilo (repository is private currently)
- Writing technical essays on [tech-lessons.in](https://tech-lessons.in/)

---

### Talks

**[Questioning database claims: Design patterns of storage engines](https://github.com/SarthakMakhija/questioning-database-claims-gocon24)**

I gave a talk on "Questioning database claims: Design patterns of storage engines” at GoConIndia24 on 2nd December. [Link to the talk](https://www.youtube.com/watch?v=_55OM23zhUo&list=PLbgP71NCXCqG4xkCmsn5wSpW7bhypnqHI&index=11).

The idea of the talk was to understand various patterns of storage engines (/key-value storage engines) like persistence (WAL, fsync), efficient retrieval (B+tree, bloom filters, data layouts), efficient ingestion (Sequential IO, LSM, Wisckey) and then **explore a variety of database claims** like durability, read optimization, write optimization and pick the right database(s) for our use case.

---

### [Some Projects](/projects)

[Relop](https://github.com/SarthakMakhija/relop) is a minimal, in-memory implementation of relational operators built to explore query processing. It covers the entire pipeline from lexical analysis and parsing to logical planning and execution.

*I have documented the building of Relop in a [7-part series](https://tech-lessons.in/en/blog/inside_a_query_engine_introduction/) that explains its internal architecture.*

*Key Features*
* **SQL Support**: Supports basic selection, filtering (WHERE), ordering, and joins.
* **Educational Focus**: Built with a focus on understanding the internals of a query engine, inspired by Crafting Interpreters and Database Design and Implementation.
* **End-to-End Pipeline**: Implements the query parsing flow including tokenization, AST generation, logical plans, and physical execution via iterators.

🔹 **[Go-LSM](https://github.com/SarthakMakhija/go-lsm)**
LSM-based key-value store in Go for educational purpose, inspired by LSM in a Week. It is a rewrite of the existing workshop code.

*Exploring LSM with go-lsm*
* **Learn LSM from the ground up**: Dive deep into the core concepts of Log-Structured Merge-Trees (LSM) through a practical, well-documented implementation.
* **Benefit from clean code**: Analyze a meticulously crafted codebase that prioritizes simplicity and readability.
* **Gain confidence with robust tests**: Verify the correctness and reliability of the storage engine through comprehensive tests.
* **Experiment and extend**: Customize the code to explore different LSM variations or integrate it into your own projects.

🔹 **[clearcheck](https://github.com/SarthakMakhija/clearcheck)**
Write expressive and elegant assertions with ease!
clearcheck is designed to make assertion statements in Rust as clear and concise as possible.
It allows chaining multiple assertions together for a fluent and intuitive syntax, leading to more self-documenting test cases.

```rust
let pass_phrase = "P@@sw0rd1 zebra alpha";
pass_phrase.should_not_be_empty()
    .should_have_at_least_length(10)
    .should_contain_all_characters(vec!['@', ' '])
    .should_contain_a_digit()
    .should_not_contain_ignoring_case("pass")
    .should_not_contain_ignoring_case("word");
```

---

### Links
- [GitHub](https://github.com/SarthakMakhija/)
- [LinkedIn](https://www.linkedin.com/in/sarthak-makhija/)

---

### Resume

[Download my Resume (PDF)](/resume.pdf)
