---
title: 'C26. Optimizer Hints'
description: 'Complete English handbook chapter based on the original C26 course.'
sidebar_position: 26
---

# C26. Optimizer Hints

<div className="chapter-kicker">Chapter C26 · Complete course</div>

## 26. optimizer Hints; Oracle SQL

### 1. What are Optimizer Hints

A **hint** is an instruction sent to the Oracle Optimizer by a special comment, suggesting or requiring it to choose a certain execution strategy.

Basic syntax:

```
SELECT /*+ HINT */
       ...
FROM...
WHERE...;
```

Example:

```
SELECT /*+ FULL (e) */
e.employee_id,
e.last_name,
e.salary
FROM employment e
WHERE e.department_id = 50;
```

FULL(e) tells the optimizer to prefer a **full table scan** of table `e`.

Key idea:

> Hints should not be the first method of optimization. Normally, the optimizer should choose a plan based on statistics, costs, cardinalities, and query structure.

A point is particularly useful when:

- The optimizer is misestimating the cardinality;
- statistics do not describe data distribution well;
- there is strong skew;
- you want to temporarily stabilize a plan;
- Alternative execution tests;
- you must control a highly predictable ETL/DWH process.

---

## 2. Correct Syntax

The hint should appear immediately after the word SQL:

```
SELECT /*+ INDEX (e idx_emp_dept) */
*
FROM employment e
WHERE department_id = 50;
```

No:

```
SELECT
/ * + INDEX (e idx_emp_dept) * /
*
FROM employment e;
```

Oracle can ignore hints:

- misspelled;
- contradictory;
- impossible to apply;
- on misguided aliases;
- incompatible with the transformation made by the optimizer.

Very important:

```
FROM employment e
```

means that the hint must use:

```
INDEX (e...)
```

No:

```
INDEX (employees...)
```

---

## 3. Hints for Access Path

They control **as a** table is accessed.

## 3.1 FULL

Force / prefer Full Table Scan.

```
SELECT /*+ FULL (t) */
*
FROM transactions t
WHERE transaction_date = DATE '2026-01-01'
```

According to when:

- a large part of the table must be read;
- the table is small;
- The DWH query reads millions of lines.

---

## 3.2 INDEX

Suggests using an index.

```
SELECT /*+ INDEX (e idx_emp_department) */
*
FROM employment e
WHERE department_id = 50;
```

You can specify the table only:

```
SELECT /*+ INDEX (e) */
*
FROM employment e
WHERE department_id = 50;
```

The optimizer chooses the index.

---

## 3.3 NO_INDEX

It prohibits the use of the specified index.

```
SELECT /*+ NO_INDEX (e idx_emp_department) */
*
FROM employment e
WHERE department_id = 50;
```

Useful for comparison between:

```
INDERANGE SCAN
```

and:

```
TABLE ACCESS FULL
```

---

## 3.4 INDEX_FFS

Request **Index Fast Full Scan**.

```
SELECT /*+ INDEX_FFS (e idx_emp_department) */
department_id
FROM employment e;
```

Conceptual:

```
INDERANGE SCAN
Ordered / selective access

INDEX FAST FULL SCAN
read the index as a compact table
```

It doesn't guarantee the order of the index.

---

## 4. Hints for Join Order

The optimizer must decide:

1. which table first accesses;
2. in what order the tables unite.

For queries with many tables, join order can have a major effect on performance.

---

## 4.1 LEADING

Specifies the starting order of the joins.

```
SELECT /*+ LEADING (c o) */
c.customer_id,
o.order_id
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id;
```

Suggests:

```
CUSTOMERS
   ↓
ORDERS
```

---

## 4.2 ORDERED

Tell Oracle to consider the order of the tables in FROM.

```
SELECT /*+ ORDERED */
*
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id
JOIN order_items sheep
ON oi.order_id = o.order_id;
```

The order becomes approximately:

```
Customers
    ↓
orders
    ↓
order_items
```

In practice, LEADING is usually more flexible.

---

## 5. Hints for Join Method

After choosing order, the optimizer also decides the Join algorithm.

Main algorithms:

```
Nested Loops
Hash Join
Sort Merge Join
```

---

## 6. USE_NL

```
SELECT / * + USE_NL (o)
*
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id
WHERE c.customer_id = 100;
```

Conceptual:

```
CUSTOMERS
   |
For each custodian
   v
ORDERS
```

Very good when:

- the first source produces few rows;
- the internal table has good index;
- Lookups are selective.

Example OLTP:

```
Customer = 1 row
      ↓
Orders via index
```

---

## 7. USE_HASH = Hash Join

```
SELECT /*+ USE_HASH (f d) */
*
FROM fact_sales f
JOIN dim_customer d
ON d.customer_key = f.customer_key;
```

Very common in DWH.

Suitable for:

- large volumes;
- equality joins;
- fact table + size;
- Massive scans.

Conceptual:

```
DIM_CUSTOMER
     ↓
Build Hash Table

FACT_SALES
     ↓
Evidence Hash Table
```

---

## 8. USE_MERGE

Force / prefer Sort Merge Join.

```
SELECT /*+ USE_MERGE (a b) */
*
FROM table_a
JOIN table_b b
ON a.id = b.id;
```

Uncommon than USE_HASH or USE_NL.

It may be useful when:

- the data are already sorted;
- there are range joins;
- hash join is not appropriate.

---

## 9. Hints for Parallel Execution

Very important in DWH and ETL.

## PARALLEL

```
SELECT /*+ PARALLEL (f, 8) */
SUM (amount)
FROM fact_sales f;
```

Suggests Degree of Parallelism:

```
DOP = 8
```

Example ETL:

```
INSERT / * + APPEND PARALLEL (t, 8) * /
INTO fact_sales
SELECT /*+ PARALLEL (s, 8) */
*
FROM staging_sales s;
```

---

## NO_PARALLEL

```
SELECT /*+ NO_PARALLEL (t) */
*
FROM transactions t;
```

Disable parallel execution for that object / query.

---

## 10. APPEND

Very important to DWH.

```
INSERT / * + APPEND * /
INTO fact_sales
SELECT *
FROM staging_sales;
```

Oracle may use:

```
Direct Path Insert
```

for:

```
Conventional Insert
```

Possible advantages:

- high throughput;
- more efficient for bulk load;
- reduces certain operations on the cache buffer.

Highly used with:

```
APPEND
PARALLEL
```

Example:

```
INSERT / * + APPEND PARALLEL (f, 8) * /
INTO fact_sales f
SELECT /*+ PARALLEL (s, 8) */
*
FROM staging_sales s;
```

---

## 11. NOAPPEND

Conventional insert force:

```
INSERT / * + NOAPPEND * /
INTO fact_sales
SELECT *
FROM staging_sales;
```

Useful when direct-path insert is not desired.

---

## 12. Hints for Query Transformation

The optimizer determines access paths and join methods, and it may also transform the query.

---

## 12.1 NO_MERGE

Example:

```
SELECT /*+ NO_MERGE (v) */
*
FROM (
SELECT department_id,
AVG (salary) avg_salary
FROM
GROUP BY department_id
) v
WHERE v.avg_salary;
```

It prevents the optimizer from joining the inline view with the outer query.

---

## 12.2 MERGE

```
SELECT /*+ MERGE (v) */
*
FROM (
SELECT *
FROM
) v
WHERE department_id = 50;
```

Encourage view walking.

---

## 13. MATERIALIZE

Very useful for complex CTE-uri.

```
WITH expensive_data AS (
SELECT /*+ MATERIALIZE */
customer_id,
SUM (amount) total_amount
FROM transactions
GROUP BY customer_id
)
SELECT *
FROM expensive_data
WHERE total_amount;
```

The idea:

```
CTE
 ↓
result materialization
 ↓
reuse
```

It can be useful when CTE- is referred to several times.

Practical Note: It is a commonly used hint in practice, but it must be treated carefully between versions and Oracle implementation.

---

## 14. INLINE

Conceptual opposite for an CTE:

```
WITH x AS (
SELECT /*+ INLINE */
*
FROM
)
SELECT *
FROM x
WHERE department_id = 50;
```

It encourages the optimizer to integrate the expression into the main query.

---

## 15. Subquery hints

## UNNEST

```
SELECT /*+ UNNEST */
*
FROM employment e
WHERE EXISTS (
SELECT 1
FROM departments
WHERE d.department_id = e.department_id
);
```

The optimizer can turn the subquery into a join.

---

## NO_UNNEST

```
SELECT /*+ NO_UNNEST */
*
FROM employment e
WHERE EXISTS (
SELECT 1
FROM departments
WHERE d.department_id = e.department_id
);
```

It prevents this transformation.

---

## 16. PUSH_PRED

Encourages predicate pushdown.

Conceptual example:

```
view
   ↓
filter as early as possible
```

```
SELECT /*+ PUSH_PRED (v) */
*
FROM my_view v
WHERE v.customer_id = 100;
```

The objective is to reduce the amount of data as early as possible.

---

## 17. NO_EXPAND

Oracle can transform:

```
WHERE status = 'NEW'
OR priority = 'HIGH'
```

in several logical branches.

NO_EXPAND can prevent OR Expansion:

```
SELECT /*+ NO_EXPAND */
*
FROM orders
WHERE status = 'NEW'
OR priority = 'HIGH';
```

---

## 18. Hints for cardinality

Sometimes the real problem is not the algorithm chosen, but the wrong estimate.

Example:

The optimizer estimates:

```
E-Rows = 10
```

But the reality is:

```
A-Rows = 500000
```

The chosen plan can get very bad.

---

## CARDINALITY

Example:

```
SELECT /*+ CARDINALITY (e 100000) */
*
FROM employment e;
```

You suggest to the optimizer that the source produces approximately:

```
100000 rows
```

Instead used for:

- Diagnostic;
- work around,
- SQL complex.

It's not an ideal long-term solution.

First check:

```
Statistics
histograms
bind variables
data skew
Dynamic statistics
```

---

## 19. DYNAMIC_SAMPLING

You can ask for additional statistical sampling.

```
SELECT /*+ DYNAMIC_SAMPLING (t 6) */
*
FROM staging_transactions
WHERE status = 'ERROR';
```

Useful especially for:

```
staging tables
Temporal date
tables with poor statistics
volatile data
```

---

## 20. Hints and aliases

One of the most common mistakes:

```
SELECT /*+ INDEX (employees idx_emp_dept) */
*
FROM employment e
WHERE e.department_id = 10;
```

The hint can be ignored because the query uses the alias:

```
e
```

Correct version:

```
SELECT /*+ INDEX (e idx_emp_dept) */
*
FROM employment e
WHERE e.department_id = 10;
```

technical discussion rule:

> If a table has an alias, the hint must refer to the alias.

---

## 21. More Hints Simultaneous

Hints can be combined:

```
SELECT / * +
LEADING (f)
USE_HASH (f)
FULL (f)
PARALLEL (f 8)
* /
d.region,
SUM (f.amount)
FROM dim_customer d
JOIN fact_sales f
ON f.customer_key = d.customer_key
GROUP BY d.region;
```

The suggested strategy is:

```
DIM_CUSTOMER
       ↓
HASH JOIN
       ↓
FACT_SALES
FULL SCAN
PARALLEL 8
```

---

## 22. Example DWH complete

We have:

```
FACT_TRANSACTIONS 500 million rows
DIM_ACCOUNT 2 million rows
```

Query:

```
SELECT a.account_type,
SUM (f.amount)
FROM fact_transactions f
JOIN dim_account
ON a.account_key = f.account_key
WHERE f.transaction_date = DATE '2026-01-01'
GROUP BY a.account_type;
```

The optimizer could choose:

```
Nested Loops
```

that gets very slow.

We're testing:

```
SELECT / * +
LEADING (f)
USE_HASH (f)
FULL (f)
PARALLEL (f 8)
* /
a.account_type,
SUM (f.amount)
FROM fact_transactions f
JOIN dim_account
ON a.account_key = f.account_key
WHERE f.transaction_date = DATE '2026-01-01'
GROUP BY a.account_type;
```

Conceptual plan:

```
SELECT STATEMENT
   |
HASH GROUP BY
   |
HASH JOIN
   |\
* * *
   |
FACT_TRANSACTIONS
TABLE ACCESS FULL
PARALLEL
```

For DWH, this strategy can be much more natural.

---

## 23. Hint is absolute guarantee

An important aspect of the technical discussion:

> Oracle can ignore a hint.

For example:

```
SELECT /*+ INDEX (t idx_xyz) */
...
```

but:

- the index does not exist;
- the index cannot satisfy the operation;
- the alias is wrong;
- the hint is invalid;
- other transformations make the hint inapplicable.

That's why we always check **the real** plan.

---

## 24. How to check if the hint has been used

You don't assume it worked just because the query is running.

Run the query with:

```
SELECT /*+ GATHER_PLAN_STATISTICS */
       ...
FROM...;
```

then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +HINT_REPORT'
)
);
```

Very useful:

```
+ HINT_REPORT
```

You can see if the hint was:

```
Used
Unued
Unsolved
Syntax error
```

---

## 25. GATHER_PLAN_STATISTICS

Very useful for diagnosis:

```
SELECT /*+ GATHER_PLAN_STATISTICS */
*
FROM
WHERE department_id = 50;
```

Then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST'
)
);
```

You can compare:

```
E-Rows
```

with:

```
A-Rows
```

I mean:

```
Estimate
vs
Actual Rows
```

This is one of the most important tuning techniques.

---

## 26. Example of diagnosis

We assume:

```
--------------------------------------------------------------------------------
Did you hear that? Did you hear that?
--------------------------------------------------------------------------------
* * *
1).

3 * INDEX RANGE SCAN * IDX_ORD_CUST
--------------------------------------------------------------------------------
```

The main problem:

```
E-Rows = 10
A-Rows = 500000
```

The optimizer thought Nested Loops was cheap.

A test can be:

```
SELECT / * + USE_HASH (o)
       ...
```

But the right solution can actually be:

```
Statistics
histogram
rewrite predicate
date of distribution
```

Not the hint.

---

## 27. Good hints for testing

Suppose you investigate:

```
SELECT *
FROM transactions
WHERE customer_id = 100;
```

You can compare:

### Optimizer Plan

```
SELECT *
FROM transactions
WHERE customer_id = 100;
```

### Full Scan

```
SELECT /*+ FULL (t) */
*
FROM transactions t
WHERE customer_id = 100;
```

### Index

```
SELECT /*+ INDEX (t idx_transactions_customer) */
*
FROM transactions t
WHERE customer_id = 100;
```

Then compare:

```
Buffers
Reads
Elapsed Time
A-Rows
```

Not just the cost.

---

## 28. Hints versus Statistics

This is a key principle:

If the optimizer constantly makes a bad decision:

```
NU starts with:

USE_HASH
INDEX
FULL
LEADING
```

First you investigate:

```
Statistics
Cardinality
Histograms
Data skew
Bind variables
Predicates
Index
Partition pruning
```

The Hint can hide the problem.

---

## 29. Hints and Bind Variables

Example:

```
SELECT *
FROM transactions
WHERE status =: status;
```

Distribution:

```
COMPLETED = 99%
ERROR = 0.01%
```

For:

```
status = ERROR
```

an index can be ideal.

For:

```
status = COMPLETED
```

Full Scan can be better.

Forcing:

```
* + INDEX (t idx_status) * /
```

can solve one case and ruin the other.

That's why you have to understand:

```
bind peeking
histograms
adaptive cursor sharing
```

before you use permanent hints.

---

## 30. Hints in OLTP versus DWH

## OLTP

Many times:

```
INDEX
USE_NL
```

Example:

```
SELECT / * +
INDEX (an idx_orders_customer)
USE_NL (o)
* /
*
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id
WHERE c.customer_id =: id;
```

Pattern:

```
feel rows
+
index looks
+
nested loops
```

---

## DWH

Common:

```
FULL
USE_HASH
PARALLEL
APPEND
```

Pattern:

```
large scan
+
hash joins
+
parallel execution
+
bulk load
```

Example:

```
INSERT / * +
APPEND
PARALLEL (f 8)
* /
INTO fact_sales f
SELECT / * +
Q0QX (s)
PARALLEL (s 8)
* /
*
FROM staging_sales s;
```

---

## 31. The Most Important Hints To Memorize

for review and practice, they deserve memorized:

| Hint | Purpose |
| --- | --- |
| `FULL` | Suggests a full table scan |
| `INDEX` | Suggests using a specified index |
| `LEADING` | Suggests join order |
| `USE_NL` | Suggests nested loops for specified tables |
| `USE_HASH` | Suggests a hash join for specified tables |
| `USE_MERGE` | Suggests a sort merge join for specified tables |
| `PARALLEL` | Suggests parallel execution |
| `APPEND` | Suggests direct-path insert |
| `NO_MERGE` | Prevents merging an inline view into the outer query |
| `MERGE` | Encourages merging an inline view into the outer query |

## 32. Important diagnostic pattern

For a slow query:

```
Query slow
   ↓
execution plan
   ↓
DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST')
   ↓
E-Rows vs A-Rows
   ↓
Access Path?
Join Order?
Join Method?
   ↓
Statistics?
Histogram?
Indexes?
Bind Variables?
   ↓
Test a hypothesis
   ↓
compare plans
```

No:

```
Query slow
   ↓
add USE_HASH
   ↓
Ready
```

---

## 34. Actual DWH Scenario

You have a trial:

```
STG_TRANSACTION
      ↓
FACT_TRANSACTION
```

Volume:

```
STG_TRANSACTION = 30 million rows
FACT_TRANSACTION = 800 million rows
DIM_ACCOUNT = 3 million rows
```

SQL:

```
INSERT INTO fact_transaction (...)
SELECT...
FROM staging_transaction
JOIN dim_account
ON a.account_no = s.account_no;
```

The Optimizer uses:

```
Nested Loops
```

and the process takes 2 hours.

Test:

```
INSERT / * +
APPEND
PARALLEL (f 8)
* /
INTO fact_transaction f
SELECT / * +
LEADING (s)
Q0QX (s)
Q0QX (s)
PARALLEL (s 8)
* /
       ...
FROM staging_transaction
JOIN dim_account
ON a.account_no = s.account_no;
```

The strategy becomes:

```
DIM_ACCOUNT
      ↓
HASH TABLE
      ↓
STAGING_TRANSACTION
FULL + PARALLEL
      ↓
HASH JOIN
      ↓
DIRECT-PATH INSERT
      ↓
FACT_TRANSACTION
```

This is a very typical pattern for ETL/DWH.

---

## 35. Oracle Exercises 26ai

### Exercise 1 - FULL vs INDEX

On the HR.EMPLOYEES table:

```
SELECT /*+ GATHER_PLAN_STATISTICS FULL (e) */
*
FROM employment e
WHERE department_id = 50;
```

then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +HINT_REPORT'
)
);
```

Repeat with:

```
INDEX (e)
```

and compare the plans.

---

### Exercise 2 - Nested Loops vs Hash Join

Run the same join with:

```
/ * + USE_NL (e) * /
```

and:

```
/ * + USE_HASH (e) * /
```

Compare:

```
Buffers
A-Rows
Starts
Elapsed Time
```

---

### Exercise 3 - Join order

Compare:

```
/ * + LEADING (d) * /
```

with:

```
/ * + LEADING (e d) * /
```

and observe how the plan changes.

---

### Exercise 4

Use the wrong hint on purpose:

```
SELECT /*+ INDEX (x nonexistent_index) */
*
FROM employment e;
```

then:

```
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +HINT_REPORT'
)
```

and observes the reason why the hint has not been applied.

---

## 37. What you need to remember

The mental scheme is:

```
Optimizer
   │
- Access Path
● FULL
► INDEX
   │
"Join Order"
● LEADING
► ORDERED
   │
- "Join Method"
● USE_NL
● USE_HASH
► USE_MERGE
   │
- Transformations
► MERGE
● NO_MERGE
● UNNEST
► MATERIALIZE
   │
- Execution
− PARALLEL
- APPEND
```

And the most important rule is:

```
Hint is primarily a control and diagnostic tool,
not a substitute for understanding the optimizer.
```

For **OLTP**, the optimizer often estimates:

```
high selectivity
→ INDEX
→ NESTED LOOPS
```

For **DWH / ETL**, the optimizer often estimates:

```
large volumes
→ FULL SCAN
→ HASH JOIN
→ PARALLEL
→ APPEND
```

But the final decision must be validated with:

(date: image / svg + xml)

SQL
```
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +HINT_REPORT'
)
```

and especially with the relationship:

```
E-Rows vs A-Rows
```

because, very often, the wrong **plan is just the symptom, and the real cause is a wrong estimate of the** cardinality.

---

## Questions and answers

Question:

> Did you use hints to solve a slow query?

A good answer:

> I would not start by pushing the optimizer. First I would check the real plan with DBMS_XPLAN.DISPLAY_CURSOR and ALLSTATS LAST, in particular the differences between E-Rows and A-Rows. I would check statistics, histograms, selectivity of predicates, indexes and data distribution.
>
> I would use hints like USE_HASH, USE_NL, INDEX, FULL or LEADING to test if an alternative strategy really produces a better plan. If the hint solves the problem, I would then try to understand why the optimizer did not choose that plan on its own.

This is exactly the correct mindset for an Oracle Data Developer.

---

1. What is an optimizer hint?
2. Is Oracle bound to respect a hint?
3. What is the difference between FULL and INDEX?
4. How's USE?
5. When would you prefer USE_HASH?
6. How's LEADING?
7. What is the difference between LEADING and ORDERED?
8. How's APPEND?
9. Why is APPEND useful in DWH?
10. How's PARALLEL?
11. What is NO_MERGE?
12. What does query unnesting mean?
13. How's MATERIALIZE?
14. Why can a hint be ignored?
15. Why are aliases important to hints?
16. How do you check to see if Oracle used the hint?
17. What is + HINT_REPORT?
18. How's GATHER doing?
19. Why should E-Rows be compared to A-Rows?
20. Why shouldn't hints be the first solution for tuning?

---


---

### How would you briefly explain Optimizer Hints to a colleague who knows SQL, but not this area?

Optimizer Hints covers hints influence but do not replace understanding, access-path hints FULL and INDEX, join-order hints Leading and ORDERED. In practice, first determine what data enters and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Optimizer Hints?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Optimizer Hints, I explicitly follow hints influence but do not replace understanding, access-path hints FULL and INDEX, join-order hints LEADING and ORDERED and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Optimizer Hints appears together with logging, auditing, reconciliation and impact analysis.
