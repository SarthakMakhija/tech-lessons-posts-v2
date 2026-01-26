---
author: "Sarthak Makhija"
title: "Bitcask - A Log-Structured Hash Table for Fast Key/Value Data"
pubDate: 2026-01-26
description: "A summary of the Bitcask paper: A Log-Structured Hash Table for Fast Key/Value Data."
tags: ["Bitcask", "Log-Structured Hash Table"]
---

### Paper at a glance

Bitcask is an append-only log of key/value entries with an in-memory hash index (keydir) pointing to the latest value in the file. It is used a key/value storage engine in a distributed database named "Riak".

<figure>
    <img src="/bitcask_summary_paper.png" style="max-width: 60%; height: auto; margin: 0 auto; display: block;" alt="Bitcask Paper Summary"/>
    <figcaption>Image generated using ChatGPT</figcaption>
</figure>

### Core idea

The Riak developers wanted to create a storage engine that could meet several demanding criteria simultaneously:

 1. __Performance__: Low latency for every read or write and high throughput for random write streams.

 2. __Scalability__: The ability to handle datasets significantly larger than __RAM__ without performance degradation, as long as the key index fits in memory.

 3. __Reliability__: "Crash friendliness," ensuring fast recovery and no data loss after a failure.

 4. __Operational Ease__: Simple code structure, easy backup/restore processes, and predictable behavior under heavy load.

### Architecture and Data Model

Bitcask operates as a directory of files where only one process (the "server") has write access at a time.

1. __Active vs. Immutable Files__: At any time, only one file is "active" for writing. When it reaches a size threshold, it is closed, becomes immutable, and a new active file is created.

2. __Append-Only Writes__: Data is always appended (:h[sequential writes]) to the active file, which eliminates the need for disk seeking during writes.

3. __On disk layout__: Each entry in the log has the following structure: `CRC | timestamp | key_size | value_size | key | value`.

4. __The Keydir__: This is an in-memory hash table that maps every key to a fixed-size structure containing the file ID, value size, and its position on disk.

5. __Read Path__: To retrieve a value, the system looks up the key in the keydir and performs a single disk seek to fetch the data from the corresponding file. Since the :h[keydir is in memory], and :h[OS page cache handles most locality] reads are fast.

6. __Write Path__: To write a value, the system appends the key/value to the active file and updates the keydir with the new position. Writes are sequential in nature and hence fast.

### Key Processes

1. __Compaction and Merging__
Because Bitcask is append-only, older versions of keys remain on disk. To reclaim space, a merge process iterates over immutable files and produces new files containing only the latest "live" version of each key. The merge process also updates the keydir.

2. __Hint Files__
During merge, Bitcask creates "hint files" alongside the generated data files. These contain the position and size of values rather than the values themselves.

> Purpose: When a Bitcask is opened, say after a crash, it scans hint files to rebuild the keydir, and because the hint files are smaller than the data files, it can rebuild the keydir much faster than scanning the full data files.

3. __Deletion__
Deletion is handled by writing a special tombstone value to the active file. This tombstone informs the system the key is deleted and is eventually removed during the merge process

### Performance 

Bitcask paper presents the following numbers:

1. In early tests on a laptop with slow disks, throughput of 5000-6000 writes per second was observed. The paper does not mention about the key/value sizes. Let's assume some values for them.

> Consider CRC + timestamp + Key_Size + Value_Size to be 20 bytes (4 bytes + 8 bytes + 4 bytes + 4 bytes), key size as 32 bytes and value size between 512 B – 1 KB. This means we are writing ~1 KB per write. So, 5000 writes per second means we are writing 5 MB per second. Thus the disk throughput should be > 5 MB/s. 

2. Sub-millisecond typical median latency for read operations. 

> Read paths take the following path: keydir (RAM) → (file_id, offset) → a single data read. Because the key lookup is O(1) in memory and each read requires at most one random disk access, read latency does not grow with dataset size in the way it does in tree-based or LSM-based designs, assuming the keydir fits in RAM.

### When Bitcask is a bad idea

1. __High cardinality keys + limited RAM__: Bitcask keeps all keys in memory, so if the number of keys is very large, it will consume a lot of memory.

2. __Range queries are required__: Bitcask does not support range queries.

3. __High write contention__: Workloads requiring high internal write parallelism or write sharding do not benefit from Bitcask’s single active append-only log.

4. __Dataset dominated by scans, not lookups__: Bitcask is optimized for random lookups, not scans.

5. __Keys much larger than values__: Bitcask is optimized for small keys. If keys are much larger than values, it will consume a lot of RAM.

6. __High number of data files + low file descriptor limits__: Bitcask benefits from keeping many immutable data files open for fast reads. On systems with low `ulimit -n`, this becomes an operational bottleneck.

The detailed blog post on this topic can be found [here](/en/blog/bitcask).

### Links

- [Bitcask](https://riak.com/assets/bitcask-intro.pdf)