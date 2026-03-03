---
author: "Sarthak Makhija"
title: "Inside a Query Engine (Part 6): Query Optimization"
pubDate: "2026-03-08"
weight: 2
tags: ["Query", "Query Optimization", "Logical Plan", "Relational Algebra", "Database Internals", "Rust"]
draft: true
---

In the previous part of this series, we saw how an Abstract Syntax Tree (AST) translates into a [Logical Plan](/en/blog/inside_a_query_engine_logical_plan), a tree of relational transformations. We successfully moved from a linguistic structure to an algebraic one.

But here is the catch: The logical plan is correct, but not necessarily efficient. 

### Why Optimize at the Logical Level?

The way a user writes a SQL query rarely represents the most efficient way to execute it. However, because our plan is now built on Relational Algebra, we have a mathematical foundation that guarantees **logical equivalence**. This equivalence allows for safe rewrites. We can improve performance without changing semantics.

> **Logical optimization is the art of rewriting a correct plan into a cheaper one without changing its meaning.**

### Where Optimization Fits in the Pipeline

With the introduction of the optimizer, our query engine pipeline now looks like this:

```mermaid
graph LR
    SQL --> Lexer --> Parser --> AST --> LogicalPlan --> Optimizer --> OptimizedLogicalPlan --> Executor --> Rows
```

It is important to state clearly: **Relop performs optimization by transforming the logical plan into a more efficient logical plan. There is no separate physical planning layer.** 

### Important Architectural Clarification: Logical Optimization vs Physical Planning

Before diving into specific rules, let's make an important architectural clarification about what our engine does and does not do. 

**Relop performs:**
*   **Logical rewrites** (tree transformations)
*   **Simple join strategy selection** (e.g., using a Hash Join when equijoin conditions are met)

**Relop does NOT perform:**
*   **Cost-based optimization (CBO)**
*   **Statistics-based cardinality estimation**
*   **Separate physical operator tree generation**

This keeps the architecture simple. The optimizer simply rewrites the logical tree according to static heuristics (rule-based optimization).

---

### Section A — Predicate Pushdown

Perhaps the most fundamental heuristic in any query optimizer is **Predicate Pushdown**. The goal is simple: filter rows as early as possible.

#### Predicate Pushdown (Single Table)

Consider a query that filters rows and then projects a column.

**Before Optimization:**
```text
Projection
  └── Filter(age > 30)
        └── Scan(users)
```

**After Optimization:**
```text
Projection
  └── Scan(users, predicate = age > 30)
```

By pushing the `Filter` down into the `Scan` itself, we reduce the number of rows that are yielded to the parent operators. Less data flowing up the tree means less work for everything above the scan.

At first glance, this might seem like a minor change—after all, whether the `Filter` is a separate node or inside the `Scan`, the row still gets removed before reaching operators higher up the tree. However, pushing the predicate tightly into the `Scan` operator provides distinct advantages:

1.  **Iterator Overhead (CPU):** In a Volcano execution model, passing a row from a child node to a parent node incurs function call overhead (the `next()` call). Fusing the filter with the scan prevents the engine from yielding irrelevant rows entirely.
2.  **I/O and Storage Cost:** While Relop currently operates largely in memory, in a traditional database, giving the scan operator knowledge of the filter allows the storage layer to use indexes or skip data blocks entirely (e.g., using Parquet row group statistics). The row doesn't just get filtered; it never gets read from disk.

In short, the cheapest row to process is the one you never materialize.

To support this, the `LogicalPlan::Scan` node had to be updated to accept an optional pushed-down filter:

```rust
#[derive(Debug, PartialEq, Eq)]
pub(crate) enum LogicalPlan {
    /// Plan to scan a table.
    Scan {
        /// The name of the table to scan.
        table_name: String,
        /// The optional alias for the table.
        alias: Option<String>,
        /// The optional pushed-down filter.
        filter: Option<Predicate>, // <-- NEW: pushed-down filter
    },
    // ...
```


#### Implementing the Rule

To perform this transformation, we traverse the `LogicalPlan` bottom-up using an `OptimizerRule`. When the rule encounters a `Filter` wrapping a `Scan`, it merges the predicate directly into the scan node. Here is a simplified look at the implementation for single-table scans:

```rust
pub(crate) struct PredicatePushdownRule;

impl OptimizerRule for PredicatePushdownRule {
    /// Optimizes the provided logical plan by pushing `Filter` nodes as close to the data source (`Scan` nodes) as possible.
    ///
    /// This optimization is performed bottom-up. It traverses to the leaves of the `LogicalPlan` tree first, and then
    /// applies predicate pushdown rules upon returning.
    fn optimize(&self, plan: LogicalPlan) -> LogicalPlan {
        let plan = plan.map_children(|logical_plan| self.optimize(logical_plan));

        match plan {
            // Did we find a Filter?
            LogicalPlan::Filter {
                base_plan,
                predicate,
            } => match *base_plan {
                // Is the Filter wrapping a Scan?
                LogicalPlan::Scan {
                    table_name,
                    alias,
                    filter: existing,
                    schema,
                } => {
                    // Merge predicates using AND if the scan already had one
                    let combined_filter = match existing {
                        Some(existing_filter) => Predicate::And(vec![existing_filter, predicate]),
                        None => predicate,
                    };
                    // Return the new Scan node with the filter explicitly inside it
                    LogicalPlan::Scan {
                        table_name,
                        alias,
                        filter: Some(combined_filter),
                        schema,
                    }
                }
                // (Join logic excluded for simplicity)
                _ => LogicalPlan::Filter {
                    base_plan,
                    predicate,
                },
            },
            _ => plan,
        }
    }
}
```

Notice the call to `plan.map_children(...)` at the very beginning. This guarantees that we descend to the deepest leaves of the query before applying our optimization logic on the way back up. If a query has multiple filters stacked on top of a scan, they will all sequentially be merged down into a single `Predicate::And` compound condition inside the `Scan` node.

#### Predicate Pushdown Across Joins

This concept becomes dramatically more powerful when joins are involved.

**Example Query:**
```sql
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.age > 30 AND o.total > 100;
```

If we naturally translate this to a logical plan, the `WHERE` clause sits at the top:

**Before Optimization:**
```text
Filter (u.age > 30 AND o.total > 100)
  └── Join (u.id = o.user_id)
        ├── Scan(users)
        └── Scan(orders)
```

Here, the join processes *all* users and *all* orders. If we split the `AND` condition, we can push the individual predicates down their respective branches:

**After Optimization:**
```text
Join (u.id = o.user_id)
  ├── Filter(u.age > 30)
  │     └── Scan(users)
  └── Filter(o.total > 100)
        └── Scan(orders)
```

This reduces the join input cardinality tremendously, drastically improving the performance of Nested Loop and Hash Joins by limiting the amount of memory and computation required to match rows.

#### Splitting Conjunctions and Pushing Through Joins

To push down predicates across joins like the example above, the `PredicatePushdownRule` handles a few specific challenges when it encounters a `Filter` wrapping a `Join`:

*   **Splitting by AND:** First, it decomposes compound expressions like `A AND B AND C` into independent predicates (`[A, B, C]`). This is possible because `AND` is conjunctive, allowing each part to be evaluated separately.
*   **Schema Ownership Binding:** It then evaluates which table each individual predicate belongs to by checking the schema (`predicate.belongs_to(&schema)`). 
*   **Targeted Pushdown:** 
    *   Predicates that reference *only* the left side (e.g., `u.age > 30`) are pushed down the left branch.
    *   Predicates that reference *only* the right side (e.g., `o.total > 100`) are pushed down the right branch.
*   **Retaining Unpushable Conditions:** Predicates that reference *both* sides (e.g., `u.id = o.user_id`) cannot be pushed down, as they require data from both tables to be combined first. These "unpushable" predicates are kept as a new `Filter` node directly above the `Join`.

You can view the full implementation of this logic in Relop's [PredicatePushdownRule](https://github.com/SarthakMakhija/relop/blob/main/src/query/optimizer/predicate_pushdown.rs).

---

### Limit Pushdown (Top-K Sort)

Another excellent optimization is **Limit Pushdown**. 

If a query has a `LIMIT` clause, it normally sits at the very top of the execution plan. Because Relop uses a demand-driven (pull-based) Volcano execution model, execution naturally stops early anyway: the `LIMIT` operator simply stops calling `next()` on its child once the limit is reached. 

So why do we need to optimize it? 

The problem arises when there is a **blocking operator** in the pipeline, like a `Sort`. A `Sort` operator must consume *all* rows from its child, buffer them in memory, and sort them completely before it can yield even the very first row. If the query plan is `Limit(10) -> Sort -> Scan`, the engine will fully scan and sort a million rows in memory, just to throw away 999,990 of them!

By pushing the `Limit` operation *down* into the `Sort` operator itself, we fundamentally change how the sort executes.

```rust
/// An optimizer rule that pushes a `Limit` operation down into a `Sort` operation
/// if the `Limit` immediately encloses the `Sort`. This allows the execution engine
/// to perform an efficiently bounded Top-K sort instead of a full sort.
pub(crate) struct LimitPushdownRule;

impl OptimizerRule for LimitPushdownRule {
    fn optimize(&self, plan: LogicalPlan) -> LogicalPlan {
        let plan = plan.map_children(|child| self.optimize(child));

        match plan {
            LogicalPlan::Limit {
                count,
                base_plan: limits_base_plan,
            } => {
                if let LogicalPlan::Sort {
                    base_plan: sort_base,
                    ordering_keys,
                    limit: _,
                } = *limits_base_plan
                {
                    // Merge Limit into Sort
                    LogicalPlan::Sort {
                        base_plan: sort_base,
                        ordering_keys,
                        limit: Some(count),
                    }
                } else {
                    // Not a Sort node, just rebuild the Limit
                    LogicalPlan::Limit {
                        count,
                        base_plan: Box::new(*limits_base_plan),
                    }
                }
            }
            // For all other nodes, return.
            _ => plan,
        }
    }
}
```

Notice how `LogicalPlan::Sort` was also updated to accommodate this optimization, taking an optional `limit`:

```rust
    /// Plan to order the results.
    Sort {
        /// The source plan.
        base_plan: Box<LogicalPlan>,
        /// The ordering keys.
        ordering_keys: Vec<OrderingKey>,
        /// Top-K limit to push down, if any.
        limit: Option<usize>, // <-- NEW: pushed-down limit
    },
```

#### Executing an Optimized Sort (Top-K)

When the `Sort` node receives a pushed-down limit, execution can be dramatically improved. Rather than buffering and sorting *all* rows in memory, we can use a bounded Binary Heap (a Max-Heap for ascending sorts) to keep only the "Top K" rows at any given time.

Here is the relevant execution logic in `OrderingResultSet`:

```rust
/// A `ResultSet` implementation that orders rows based on specified criteria.
///
/// `OrderingResultSet` wraps another `ResultSet`, consumes all its rows, sorts them
/// in memory using the provided `ordering_keys`, and yields them in sorted order.
///
/// # Note
///
/// This implementation performs an **in-memory sort**, meaning it buffers all rows
/// from the inner result set before yielding the first row.
///
/// If `OrderingResultSet` receives a limit, it performs efficiently bounded Top-K sort instead of a full sort.
pub struct OrderingResultSet {
    inner: Box<dyn ResultSet>,
    ordering_keys: Vec<OrderingKey>,
    limit: Option<usize>,
}

impl OrderingResultSet {
    pub fn new(
        inner: Box<dyn ResultSet>,
        ordering_keys: Vec<OrderingKey>,
        limit: Option<usize>,
    ) -> Self {
        Self {
            inner,
            ordering_keys,
            limit,
        }
    }
}

impl ResultSet for OrderingResultSet {
    fn iterator(&self) -> Result<Box<dyn Iterator<Item = RowViewResult> + '_>, ExecutionError> {
        let comparator = RowViewComparator::new(self.schema(), &self.ordering_keys)?;
        let iterator = self.inner.iterator()?;

        if let Some(limit) = self.limit {
            if limit == 0 {
                return Ok(Box::new(std::iter::empty()));
            }

            struct ComparableRowView<'comparator, 'row_view> {
                row: RowView<'row_view>,
                comparator: &'comparator RowViewComparator<'comparator>,
            }

            impl PartialEq for ComparableRowView<'_, '_> {
                fn eq(&self, other: &Self) -> bool {
                    self.comparator.compare(&self.row, &other.row) == std::cmp::Ordering::Equal
                }
            }

            impl Eq for ComparableRowView<'_, '_> {}

            impl PartialOrd for ComparableRowView<'_, '_> {
                fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
                    Some(self.cmp(other))
                }
            }

            impl Ord for ComparableRowView<'_, '_> {
                fn cmp(&self, other: &Self) -> std::cmp::Ordering {
                    self.comparator.compare(&self.row, &other.row)
                }
            }

            let mut max_heap = std::collections::BinaryHeap::with_capacity(limit + 1);
            for result in iterator {
                match result {
                    Ok(row_view) => {
                        max_heap.push(ComparableRowView {
                            row: row_view,
                            comparator: &comparator,
                        });
                        if max_heap.len() > limit {
                            max_heap.pop();
                        }
                    }
                    Err(err) => return Err(err),
                }
            }

            let mut sorted_rows = Vec::with_capacity(max_heap.len());
            while let Some(item) = max_heap.pop() {
                sorted_rows.push(item.row);
            }
            sorted_rows.reverse();

            Ok(Box::new(sorted_rows.into_iter().map(Ok)))
        } else {
            let mut rows: Vec<RowView> = Vec::new();
            for result in iterator {
                match result {
                    Ok(row_view) => rows.push(row_view),
                    Err(err) => return Err(err),
                }
            }

            rows.sort_by(|left, right| comparator.compare(left, right));
            Ok(Box::new(rows.into_iter().map(Ok)))
        }
    }

    fn schema(&self) -> &Schema {
        self.inner.schema()
    }
}
```

By discarding rows that fall outside our Top-K bounds *during* ingestion, `OrderingResultSet` prevents runaway memory consumption and achieves much faster execution.

### Conclusion

Logical optimization transforms our naive algebraic tree into an efficient roadmap for execution. Through simple rule-based transformations like Predicate Pushdown and Limit Pushdown, we ensure that less work is done across the tree, vastly improving performance without complicating the underlying execution model.

We've crossed the bridge from language into the world of relational operators. With an optimized Logical Plan in hand, we have a clear recipe for execution. In the final part of this series, we will look at the [Execution](/en/blog/inside_a_query_engine_execution) of this plan and turn it into a living stream of rows.
