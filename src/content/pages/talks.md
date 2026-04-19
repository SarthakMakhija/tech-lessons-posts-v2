---
author: Sarthak Makhija
title: Talks
date: 2026-04-19
description: My conference talks and event workshops
keywords: ["Talks", "Speaking", "Conferences"]
type: page
---

I give talks on storage engines, search systems, and software design, focused on how systems actually work under the hood.

If you are organizing a conference or internal tech talk, feel free to reach out.

## Storage Engines & Databases

### Questioning Database Claims: Design Patterns of Storage Engines

A practical way to evaluate database claims using real storage engine patterns.

- **Where:** GoConIndia 2024
- **Audience:** Backend and systems engineers
- **What this talk covers:**
  - Common claims databases make about durability and read/write optimization
  - How to evaluate those claims critically using real design patterns
  - Core storage engine patterns: WAL, fsync, B+tree, bloom filters, LSM trees, WiscKey

- **Key takeaway:** Every database makes claims. "Durable writes." "Fast reads." "Horizontal scale." But do you know what's actually happening underneath? This talk gives you the vocabulary and the patterns to stop taking those claims on faith, and start evaluating them yourself.

- [Watch the talk](https://www.youtube.com/watch?v=_55OM23zhUo&list=PLbgP71NCXCqG4xkCmsn5wSpW7bhypnqHI&index=11) / [Slides](https://github.com/SarthakMakhija/questioning-database-claims-gocon24)

<div class="flex items-center gap-4 my-12">
  <div class="flex-1 border-t border-zinc-200"></div>
  <span class="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">Workshops</span>
  <div class="flex-1 border-t border-zinc-200"></div>
</div>

### Build a Concurrent Cache in Rust

Learn Rust by building a tiny concurrent cache, treating the Standard Library as a mentor.

- **Where:** Rust India Conference 2026
- **Format:** Hands-on workshop
- **Audience:** Engineers with basic Rust knowledge looking to go deeper into systems programming
- **What this workshop covers:**
  - Memory allocation and ownership in Rust
  - Zero-cost abstractions in practice
  - Concurrent data structures: design and implementation
  - Building a working concurrent cache end to end

- **Key takeaway:** Building a tiny concurrent cache is a journey of countless design choices. But when you treat the Standard Library as a mentor and base those decisions on its idioms, you are adopting the collective engineering wisdom of the Rust community. The next time you are stuck on an architectural problem in Rust, don't just reach for a crate. Look at the source. The blueprints for your solution are likely already sitting in your std library, waiting to be adopted.

- [Workshop materials](https://tech-lessons.in/rust-workshop-2026/)

---

## Interested in a talk or workshop?

Reach out on [LinkedIn](https://www.linkedin.com/in/sarthak-makhija/) or email [sarthak.makhija@gmail.com](mailto:sarthak.makhija@gmail.com).
