---
author: "Sarthak Makhija"
title: "Learning from the Source: Architectural Idioms in a Concurrent Cache"
description: "Discover how the architectural patterns used in the Rust Standard Library can be adopted in your own projects. Lessons from a concurrent cache workshop at Rust India Conference 2026."
pubDate: 2026-04-20
tags: ["Rust", "Concurrency", "Idioms", "Arc", "RAII"]
---

### Introduction

On April 17th, 2026, I had the pleasure of delivering a workshop at the **Rust India Conference** titled *"Build a concurrent cache in Rust"*. You can find the [workshop content here](https://tech-lessons.in/rust-workshop-2026/) and the [accompanying labs on GitHub](https://github.com/SarthakMakhija/rust-workshop-labs/). We moved through multiple stages of evolution, starting from a simple `HashMap<String, String>` and ending with a sharded, concurrent cache with background expiration and graceful shutdown.

Throughout the workshop, a recurring theme emerged: **Rust is a language of idioms.** The Standard Library isn't just a collection of tools; it's a **mentor** and a blueprint for architectural excellence. When we look at how `Arc`, `RwLock`, or `JoinHandle` are implemented, we aren't just looking at "internal magic", we are looking at patterns that we can adopt in our own application code.

In this article, we'll revisit six architectural idioms from the workshop, mirroring them against the Rust source code to see how "Learning from the Source" can elevate our engineering craftsmanship.

---

### 1. The NewType Pattern: Zero-Cost Identity

The **NewType pattern** is one of Rust’s most simple yet powerful tools. It allows us to wrap an existing type in a new struct, creating a distinct type that is identical in memory to the type it is wrapping but unique to the type-checker.

#### The Source: `std::num::NonZero<T>`
If you look at the standard library, `NonZero<T>` is a brilliant example of a NewType that provides a tangible performance benefit through **Memory Layout Optimization**.

```rust
/// A value that is known not to equal zero.
/// This enables some memory layout optimization.
/// For example, Option<NonZero<u32>> is the same size as u32.
#[repr(transparent)]
#[rustc_nonnull_optimization_guaranteed]
pub struct NonZero<T: ZeroablePrimitive>(T::NonZeroInner);
```

This works because of two critical attributes:
1.  **`#[repr(transparent)]`**: This guarantees that the wrapper has the exact same memory layout and ABI (Application Binary Interface) as the inner type. The **ABI** is the low-level contract defining how data is passed between functions (e.g., which CPU registers are used).
2.  **`#[rustc_nonnull_optimization_guaranteed]`**: Since `0` is an invalid bit pattern for `NonZero<u32>`, the compiler is allowed to use that "niche" to represent `None` in an `Option`. This means an `Option<NonZero<u32>>` takes up zero extra space compared to a raw `u32`.

#### Our Adoption: From Ambiguity to Type-Safety
In our workshop, we started (Stage 1) with a minimal cache that accepted `String` for keys and `String` for values. While functional, `put` API was dangerously generic. Since both inputs were raw strings, the compiler couldn't protect us if we accidentally swapped a key for a value in a method call.

**Stage 1: The Problem (Amorphous Strings)**
```rust
struct Cache {
    entries: HashMap<String, String>,
}

impl Cache {
    fn put(&mut self, key: String, value: String) {
        // ...
    }
}

// Danger zone: The compiler won't stop you from swapping these!
cache.put("2026".to_string(), "rustconf".to_string()); 
```

By Stage 2, we introduced **NewTypes** to create intentional boundaries. We wrapped these strings in `CacheKey` and `CacheValue` structs.

**Stage 2: The Solution (Intentional Types)**
```rust
#[derive(Hash, PartialEq, Eq)]
struct CacheKey(String);

#[derive(Hash, PartialEq, Eq)]
struct CacheValue(String);

struct Cache {
    entries: HashMap<CacheKey, CacheValue>,
}

impl Cache {
    fn put(&mut self, key: CacheKey, value: CacheValue) {
        // ...
    }
}
```

By adopting this idiom, we transformed a subtle logic bug (swapped parameters) into a loud compiler error. Most importantly, this is a **zero-cost abstraction**. Because a NewType is just a wrapper, there is **no additional memory allocation** or runtime overhead. At runtime, a `CacheKey` is identical to the `String` it contains; the "structural" difference exists only in the mind of the compiler.

> **Pro-Tip: When to use `#[repr(transparent)]`?**
> In our workshop, we didn't strictly need it. However, if you look at the standard library, authors often use `#[repr(transparent)]` for NewTypes (like `NonZero`). This explicitly guarantees to the compiler that the wrapper has the exact same memory layout and ABI as the inner type, which is critical for FFI or when using `unsafe` code to cast between types.

---

### 2. Ergonomic APIs: The `From` Trait

A hallmark of a "Library-Grade" API is how it feels to use. While our NewTypes provided safety, they initially introduced a lot of syntactic noise. By Stage 2, our test cases were a bit verbose.

#### The Problem: Syntactic Noise
When we first introduced `CacheKey` and `CacheValue`, every insertion required manual wrapping.

```rust
// Stage 2: Safe, but verbose
cache.put(
    CacheKey(String::from("rustconf")), 
    CacheValue(String::from("2026"))
);
```

We wanted our API to feel "native", we wanted to pass string slices and have them automatically converted into our domain types, `CacheKey` and `CacheValue`.

#### The Source: `impl From<&str> for String`
The Rust standard library solves this exact problem for `String`. You can create a `String` from a `&str` because of this implementation:

```rust
// std::string::String
impl From<&str> for String {
    /// Converts a `&str` into a [`String`].
    ///
    /// The result is allocated on the heap.
    #[inline]
    fn from(s: &str) -> String {
        s.to_owned()
    }
}
```

This is why you can call `"rust".into()` to create a `String`.

#### Our Adoption: The `.into()` Pattern
We adopted this pattern by implementing `From<&str>` for our `CacheKey` and `CacheValue`.

```rust
impl From<&str> for CacheKey {
    fn from(value: &str) -> Self {
        CacheKey(value.to_string())
    }
}

// Resulting API: Clean and native
cache.put("rustconf".into(), "2026".into());
```

By adopting the `From` trait, we didn't just save a few keystrokes; we aligned our library's ergonomics with the standard library, making it intuitive for any Rust developer to use immediately.

### 3. The Borrow Trait & The "Allocation Problem"

As our cache evolved to use generics (Stage 3), we encountered a subtle but significant performance trap. We had a `Cache<K, V>`, but our `get` method was still tied too closely to the concrete type `K`.

#### The Problem: The "Allocation Problem" 
In Stage 3, we implemented `get` like this:

```rust
// Stage 3: Initial Generic get
impl<K, V> Cache<K, V> {
    fn get(&self, key: &K) -> Option<&V> {
        self.entries.get(key)
    }
}
```

If we created a `Cache<String, String>`, the signature became `get(&self, key: &String)`. This was a disaster for ergonomics. If we had a string slice `&str` (a common case), we were forced to allocate a full `String` on the heap just to perform a lookup!

```rust
// This forced the clients of Get to do a heap allocation for String,
// even though that allocation was immediately thrown away after 
// the reference was used.
cache.get(&String::from("rustconf")); 
```

#### The Source: `HashMap::get<Q>` and `?Sized`
The Rust Standard Library has a beautiful solution for this. If you look at `HashMap::get`, it isn't tied to `&K`; it’s generic over a query type `Q`.

```rust
// std::collections::HashMap
pub fn get<Q: ?Sized>(&self, k: &Q) -> Option<&V>
where
    K: Borrow<Q>,
    Q: Hash + Eq,
{
    self.base.get(k)
}
```

Two things make this work:

1.  **`Borrow<Q>`:** This trait allows the compiler to treat a `String` (the `K`) as if it were a `str` (the `Q`) for the purpose of hashing and comparison.
2.  **`?Sized`:** This is where things get interesting. In Rust, you cannot create a `str` on the stack; it only exists behind a reference, like `&str` or `Box<str>`. However, `Q` in the signature above refers to the **underlying type**, not the reference.

> **The "Hidden" Bound**:
> By default, every generic parameter in Rust has an implicit `Sized` bound. A function like `fn func<T>(arg: &T) {}` is actually interpreted by the compiler as `fn func<T: Sized>(arg: &T) {}`.
> 
> When you call `cache.get("hello")`, you are passing a `&str`. This means `&Q` is `&str`, and therefore **`Q` is `str`**. Since `str` is a Dynamically Sized Type (DST) and does not have a known size at compile time, it fails the default `Sized` check. The `?Sized` bound "unlocks" this, telling the compiler: "It's okay if we don't know the size of `Q` at compile time, because we are only using it behind a reference (`&Q`)."

### Aside: Understanding the String Trio
To fully appreciate `Borrow<Q>`, it helps to revisit the three faces of strings in Rust:

*   **`String`**: An owned, mutable, heap-allocated buffer. 
*   **`&str`**: An immutable reference to UTF-8 text owned by someone else. Internally, it is a "fat pointer" containing both a memory address and a length.
*   **`str`**: The underlying sequence of UTF-8 bytes. Since its length is dynamic and unknown at compile time, it almost always appears in the form of `&str`.

#### Our Adoption: `get_improved`
We adopted this pattern to eliminate the "Allocation Problem" in our cache.

```rust
// Our adoption: No-allocation lookups
fn get_improved<Q>(&self, key: &Q) -> Option<&V>
where
    K: Borrow<Q>,
    Q: Hash + Eq + ?Sized,
{
    self.entries.get(key)
}
```

By transitioning to `get_improved`, we allowed our users to query the cache using `&str` directly. No heap allocations, no temporary strings, just pure, idiomatic performance.

---

### 4. RAII & Custom Guards: Guaranteed Safety

**RAII (Resource Acquisition Is Initialization)** is perhaps the most fundamental pattern in Rust’s safety model. Despite the cryptic name, the core idea is powerful: we bind the lifecycle of a critical resource, such as a file handle, a heap allocation, or a mutual exclusion lock, to the lifetime of a Rust object.

In an RAII world, you don't manually call `unlock()` or `close()`. Instead:
1.  **Acquisition**: The resource is acquired when the object is initialized.
2.  **Release**: The resource is automatically released when the object is "dropped" (goes out of scope).

This provides a hard guarantee: the resource will be cleaned up regardless of how a function exits, whether it's a normal return, an early `?` error, or even a panic.

#### The Source: `RwLockReadGuard`
The standard library’s `RwLock` doesn't return a boolean or a raw pointer when you lock it. It returns a **Guard** object that embodies this RAII principle.

```rust
// Simplified representation of the std::sync::RwLockReadGuard struct
pub struct RwLockReadGuard<'a, T: ?Sized + 'a> {
    data: NonNull<T>,
    inner_lock: &'a sys::RwLock,
}

impl<T: ?Sized> Drop for RwLockReadGuard<'_, T> {
    fn drop(&mut self) {
        // SAFETY: the conditions of `RwLockReadGuard::new` were satisfied when created.
        unsafe {
            self.inner_lock.read_unlock();
        }
    }
}
```

#### Reaching Data via `Deref`
The standard library makes the guard convenient by implementing the `Deref` trait. This allows the guard to behave like a reference to the data it protects, all while the lock remains held in the background.

```rust
impl<T: ?Sized> Deref for RwLockReadGuard<'_, T> {
    type Target = T;

    fn deref(&self) -> &T {
        unsafe { self.data.as_ref() }
    }
}
```

---

#### Our Adoption: Interior Mutability and the Guard
In our workshop, we applied these patterns to our `Cache`. By wrapping our `HashMap` in an `RwLock`, we enabled **Interior Mutability**, allowing us to safely transition from a shared reference (`&self`) to mutable access at runtime.

```rust
struct Cache<K, V>
where
    K: Hash + Eq,
{
    // 💡 Interior Mutability: Turning a Shared Reference (&)
    //   into a Mutable Reference (&mut) safely at runtime.
    entries: RwLock<HashMap<K, V>>,
}

impl<K, V> Cache<K, V>
where
    K: Hash + Eq,
{
    fn get<Q>(&self, key: &Q) -> Option<V>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        // 🚀 The RAII Guard: Locking is automatic, unlocking is also automatic.
        let _guard: RwLockReadGuard<HashMap<K, V>> = self.entries.read().unwrap();
        
        // ... search logic ...
        None
    }
}
```

#### The Lifetime Contract: Guarding the Guard
Notice the lifetime `'a` in the standard library's `RwLockReadGuard<'a, T>`. This is a critical contract: **The Guard cannot outlive the lock it is protecting.**

Because the guard holds a reference to the `inner_lock`, the Rust compiler ensures that the guard is dropped *before* the lock can be destroyed. If this weren't the case, the guard would end up pointing to a garbage memory location, a classic memory safety violation.

This contract is exactly what makes returning data from our cache so challenging.

#### Our Adoption: The Custom `Ref` Guard
In our workshop, we wanted to return a reference to a value stored in the `HashMap` without cloning it. However, if we tried to implement `get` the "obvious" way, we would run directly into the compiler's safety checks.

**The Failed Attempt: Returning a Reference**
```rust
impl<K, V> Cache<K, V> {
    fn get(&self, key: &K) -> Option<&V> {
        let guard = self.entries.read().unwrap();
        guard.get(key) // ❌ COMPILER ERROR: returns a reference 
                       // that outlives the local guard, because the guard is dropped at the end 
                       // of the method!
    }
}
```

The problem is clear: the `RwLockReadGuard` is a local variable. It is dropped at the end of the `get` function, releasing the lock. If we return a reference to data *inside* the map, that reference becomes dangling the moment the lock is released.

We adopted the RAII guard pattern by building our own **`Ref`** struct,a composite guard that bundles the lock and the data together.

```rust
struct Cache<K, V>
where
    K: Hash + Eq,
{
    entries: RwLock<HashMap<K, V>>,
}

impl<K, V> Cache<K, V>
where
    K: Hash + Eq,
{
    // 🚀 The Goal: Return a reference to the data without cloning.
    fn get<Q>(&self, key: &Q) -> Option<Ref<'_, K, V>>
    where
        K: Borrow<Q>,
        Q: Hash + Eq + ?Sized,
    {
        // 1. Acquire the read lock
        let guard = self.entries.read().unwrap();
        
        // 2. Get the reference from the map and convert to a raw pointer
        // (Simplified for illustration)
        let value = guard.get(key)? as *const V;
        
        // 3. Return the Ref struct which "anchors" the guard
        Some(Ref::new(guard, value))
    }
}
```

#### The `Ref` Architecture: An Anchor for Data
The `Ref` struct acts as a permanent anchor. By storing the `RwLockReadGuard` inside `Ref`, we ensure the lock remains held as long as the `Ref` exists.

```rust
struct Ref<'a, K, V>
where
    K: Hash + Eq,
{
    // 💡 The Anchor: This keeps the lock alive as long as 'Ref' exists.
    guard: RwLockReadGuard<'a, HashMap<K, V>>,
    // 💡 The Target: A raw pointer into the data owned by the guard.
    value: *const V,
}

impl<'a, K, V> Ref<'a, K, V>
where
    K: Hash + Eq,
{
    fn new(guard: RwLockReadGuard<'a, HashMap<K, V>>, value: *const V) -> Ref<'a, K, V> {
        Self { guard, value }
    }
}
```

To make our custom struct behave like the underlying data, we implement `Deref`.

```rust
impl<'a, K, V> Deref for Ref<'a, K, V>
where
    K: Hash + Eq,
{
    type Target = V;

    fn deref(&self) -> &Self::Target {
        // SAFETY: We manually uphold the invariant that the guard (and thus the lock)
        // is alive for at least as long as this Ref.
        unsafe { &*self.value }
    }
}
```

### The Hierarchy of Lifetimes
By mirroring the Standard Library’s architecture, we created a robust hierarchy of safety:
1.  **The `Ref` cannot outlive the `guard`** (it contains it).
2.  **The `guard` cannot outlive the `lock`** (it borrows it).
3.  **The `Deref` provides safe access** to the data (`&T`) only while the `Ref` is alive.

We moved from a "Use-After-Free" risk to a compiler-guaranteed zero-copy API.

---

### 5. Managing State with `take`: The `std::mem::replace` Idiom

As our cache reached its final form, we added a background cleaner thread responsible for periodically sweeping through the shards and removing expired entries. To manage its lifecycle, we updated our `Cache` struct:

```rust
pub struct Cache<K, V> {
    inner: Arc<CacheInner<K, V>>, // 💡 Note: We'll cover this in Section 6
    cleaner: Option<JoinHandle<()>>,
}
```

This introduced a new challenge: **Graceful Shutdown.** We needed to call `.join()` on the cleaner thread, which takes ownership of its handle (`fn join(self)`).

#### The Problem: Ownership vs. State Consistency
In our workshop, the `shutdown` method takes ownership of the cache (`mut self`). Because we own the struct, we *could* technically move the handle out using simple pattern matching:

```rust
pub fn shutdown(mut self) {
    self.inner.mark_shutting_down();

    // This works because we own 'self'
    if let Some(handle) = self.cleaner {
        handle.join().unwrap();
    }
}
```

While this works for an owned `self`, it doesn't explicitly clear the state within the `Option`. More importantly, if we were in a situation where we only had a **mutable reference** (`&mut self`), the compiler would prevent this move entirely to ensure that the struct field is never left uninitialized.

#### The Source: `Option::take` & `std::mem::replace`
The Standard Library provides `Option::take` as the idiomatic way to handle this. It ensures that the state of your struct remains consistent by explicitly transitioning the field from `Some` to `None` while giving you ownership of the inner value.

```rust
// std::option::Option
pub fn take(&mut self) -> Option<T> {
    // The Magic: Swaps the current value with None and returns the old value
    std::mem::replace(self, None)
}
```

#### Our Adoption: Explicit State Transition
We used `take()` in our `shutdown` method to ensure that as we joined the thread, we were also explicitly clearing the handle from our cache. This pattern guarantees that our cache's state is always consistent, once the handle is taken, it is gone.

```rust
pub fn shutdown(mut self) {
    self.inner.mark_shutting_down();

    // The Idiomatic Way: "Take" the handle, transitioning it to None
    if let Some(handle) = self.cleaner.take() {
        handle.join().unwrap();
    }
}
```

---

### 6. The Handle-Body Pattern: The Architectural Finale

The most sophisticated pattern we used is the **Handle-Body Pattern**. This is the climax of our cache’s architecture: the decoupling of the **Data's lifecycle** from the **Handle's lifecycle**.

#### The Source: `Arc` and `ArcInner`
The standard library’s `Arc` (Atomic Reference Counted) is the ultimate expression of this idiom. Every Rust developer knows that an `Arc` is a "cheap clone", but *why* is it cheap?

To make a clone cheap, we cannot clone the underlying data `T`. Instead, we must store a pointer to the data. If we were building our own `Arc` for the first time, our initial intuition might lead us to a structure like this:

```rust
struct Arc<T> {
   ptr: NonNull<T>,
   strong: atomic::AtomicUsize,
   weak: atomic::AtomicUsize,
}
```

**The "Ah-ha" Moment: The Counter Problem**
If we used the structure above, each `Arc` clone would have its *own* copies of the `strong` and `weak` counters. When you passed a clone to another thread, that thread would increment its local counter, while the original thread remained unaware. The counters wouldn't be shared, defeating the entire purpose of reference counting.

To solve this, we must separate the **Handle** (what we pass around) from the **Body** (what stays in one place).

```rust
pub struct Arc<T: ?Sized> {
    ptr: NonNull<ArcInner<T>>,
}

struct ArcInner<T: ?Sized> {
    strong: AtomicUsize,
    weak: AtomicUsize,
    data: T,
}
```

Now, every `Arc` handle points to the same `ArcInner` body. When we clone the handle, we are merely incrementing a shared counter in the body.

Here is how the standard library implements `clone` (simplified):

```rust
impl<T: ?Sized> Clone for Arc<T> {
    fn clone(&self) -> Arc<T> {
        let old_size = self.inner().strong.fetch_add(1, Relaxed);

        if old_size > MAX_REFCOUNT {
            abort();
        }

        unsafe { Self::from_inner(self.ptr) }
    }
}
```

#### Our Adoption: `Cache` vs `CacheInner`
In our workshop, we applied this "Handle-Body" separation to solve a critical ownership problem: **Master vs Client semantics.**

Our `Cache` (the Handle) owns the lifecycle of the background cleaner thread, while the `CacheInner` (the Body) owns the actual sharded data.

```rust
pub struct Cache<K, V> {
    inner: Arc<CacheInner<K, V>>,
    // 💡 The Handle owns the Handle!
    cleaner: Option<JoinHandle<()>>,
}

struct CacheInner<K, V> {
    shards: Vec<Shard<K, V>>,
    shutting_down: AtomicBool,
}
```

Why did we do this? We had two primary drivers for this architecture:
1.  **The Thread Lifecycle**: We needed a place to store the `JoinHandle` for the background cleaner thread. By putting it in the `Cache` handle (the master), we ensured that the thread's lifecycle was tied to the handle's lifecycle.
2.  **Restricted Authority**: We wanted to ensure that the `shutdown` capability was available only on the main `Cache` handle, not on every cloned handle being used by various threads. Clones of the `Cache` are "clients" that share the sharded data (`CacheInner`), but only the master handle has the authority (and the `JoinHandle`) to perform a graceful shutdown.

By mirroring the `Arc/ArcInner` architecture, we built a system that is easy to share across threads but has a single, unambiguous source of truth for lifecycle management.

---

### Conclusion

Building a tiny concurrent cache is a journey of countless design choices. But when you treat the **Standard Library as a mentor** and base those decisions on its idioms, you are adopting the collective engineering wisdom of the Rust community. 

The next time you’re stuck on an architectural problem in Rust, don't just reach for a crate. **Look at the source.** The blueprints for your solution are likely already sitting in your `std` library, waiting to be adopted.
