---
title: 'C26. Optimizer Hints'
description: 'Complete English handbook chapter based on the original C26 course.'
sidebar_position: 26
---

# C26. Optimizer Hints

<div className="chapter-kicker">Chapter C26 · Complete course</div>

## 26. Optimiser Hints; Oracle SQL

### 1. What are Optimizer Hints

An **hint** is an instruction sent to the Oracle Optimizer by a special comment, suggesting or requiring it to choose a certain execution strategy.

Basic syntax:

```
SELECT / * + HINT * /
       ...
FROM...
WHERE...;
```

Example:

```
SELECT / * + FULL (e) * /
e.employee_id,
e.last_name,
e.salary
FROM employment e
WHERE e.department_id = 50;
```

FULL (e) tells the optimiser to prefer an **Full Table Scan** to the e-table.

Key idea:

> Hints should not be the first method of optimization. Normally, the optimiser should decide on its own based on statistics, costs, cardinalities and structure SQL.

A point is particularly useful when:

- The optimiser is misestimating the cardinality;
- statistics do not describe data distribution well;
- there is strong skew;
- you want to temporarily stabilize a plan;
- Alternative execution tests;
- you must control a highly predictable ETL/DWH process.

---

# 2. Correct Syntax

The hint should appear immediately after the word SQL:

```
SELECT / * + INDEX (e idx_emp_dept) * /
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
- incompatible with the transformation made by the optimiser.

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

# 3. Hints for Access Path

They control **as a** table is accessed.

## 3.1 FULL

Force / prefer Full Table Scan.

```
SELECT / * + FULL (t) * /
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
SELECT / * + INDEX (e idx_emp_department) * /
*
FROM employment e
WHERE department_id = 50;
```

You can specify the table only:

```
SELECT / * + INDEX (e) * /
*
FROM employment e
WHERE department_id = 50;
```

The optimiser chooses the index.

---

## 3.3 NO\ _ INDEX

It prohibits the use of the specified index.

```
SELECT / * + NO_INDEX (e idx_emp_department) * /
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
FULLQ1QX SCAN
```

---

## 3.4 INDEX\ _ FFS

Request **Index Fast Full Scan**.

```
SELECT / * + INDEX_FFS (e idx_emp_department) * /
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

# 4. Hints for Join Order

The optimiser must decide:

1. which table first accesses;
2. in what order the tables unite.

For querys with many tables, this choice can radically change performance.

---

## 4.1 LEADING

Specifies the starting order of the joints.

```
SELECT / * + LEADING (c o) * /
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
SELECT / * + ORDERED * /
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

# 5. Hints for Join Method

After choosing order, the optimiser also decides the Join algorithm.

Main algorithms:

```
Nested Loops
Hash Join
Sort Merge Join
```

---

# 6. USE\ _ NL

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

# 7. USE\ _ HASH = Hash Join

```
SELECT / * + USE_HASH (f d) * /
*
FROM fact_sales f
JOIN dim_customer d
ON d.customer_key = f.customer_key;
```

Very common in DWH.

Suitable for:

- large volumes;
- equity joints;
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

# 8. USE\ _ MERGE

Force / prefer Sort Merge Join.

```
SELECT / * + USE_MERGE (a b) * /
*
FROM table_a
JOIN table_b b
ON a.id = b.id;
```

Uncommon than USE\ _ HASH or USE\ _ NL.

It may be useful when:

- the data are already sorted;
- there are range joins;
- hash join is not appropriate.

---

# 9. Hints for Parallel Execution

Very important in DWH and ETL.

## PARALLEL

```
SELECT / * + PARALLEL (f, 8) * /
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
SELECT / * + PARALLEL (s, 8) * /
*
FROM staging_sales s;
```

---

## NO\ _ PARALLEL

```
SELECT / * + NO_PARALLEL (t) * /
*
FROM transactions t;
```

Disable parallel execution for that object / query.

---

# 10. APPEND

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
SELECT / * + PARALLEL (s, 8) * /
*
FROM staging_sales s;
```

---

# 11. NOAPPEND

Conventional insert force:

```
INSERT / * + NOAPPEND * /
INTO fact_sales
SELECT *
FROM staging_sales;
```

Useful when direct-path insert is not desired.

---

# 12. Hints for Query Transformation

The optimiser does not just decide access and joints. Maybe **also rewrites the logical** query.

---

## 12.1 NO\ _ MERGE

Example:

```
SELECT / * + NO_MERGE (v) * /
*
FROM (
SELECT department_id,
AVG (salary) avg_salary
FROM
GROUPQ1QX department_id
) v
WHERE v.avg_salary;
```

It prevents the optimiser from joining the inline view with the outer query.

---

## 12.2 MERGE

```
SELECT / * + MERGE (v) * /
*
FROM (
SELECT *
FROM
) v
WHERE department_id = 50;
```

Encourage view walking.

---

# 13. MATERIALIZE

Very useful for complex CTE-uri.

```
WITH expensive_data AS (
SELECT / * + MATERIALIZE * /
customer_id,
SUM (amount) total_amount
FROM transactions
GROUPQ1QX customer_id
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

# 14. INLINE

Conceptual opposite for an CTE:

```
WITH x AS (
SELECT / * + INLINE * /
*
FROM
)
SELECT *
FROM x
WHERE department_id = 50;
```

It encourages the optimiser to integrate the expression into the main query.

---

# 15. Subquery hints

## UNNEST

```
SELECT / * + UNNEST * /
*
FROM employment e
WHERE EXISTS (
SELECT 1
FROM departments
WHERE d.department_id = e.department_id
);
```

The optimiser can turn the subquery into a join.

---

## NO\ _ UNNEST

```
SELECT / * + NO_UNNEST * /
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

# 16. PUSH\ _ PRED

Encourages predicated pushing.

Conceptual example:

```
view
   ↓
filter as early as possible
```

```
SELECT / * + PUSH_PRED (v) * /
*
FROM my_view v
WHERE v.customer_id = 100;
```

The objective is to reduce the amount of data as early as possible.

---

# 17. NO\ _ EXPAND

Oracle can transform:

```
WHERE status = 'NEW'
OR priority = 'HIGH'
```

in several logical branches.

NO\ _ EXPAND can prevent OR Expansion:

```
SELECT / * + NO_EXPAND * /
*
FROM orders
WHERE status = 'NEW'
OR priority = 'HIGH';
```

---

# 18. Hints for cardinality

Sometimes the real problem is not the algorithm chosen, but the wrong estimate.

Example:

The optimiser estimates:

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
SELECT / * + CARDINALITY (e 100000) * /
*
FROM employment e;
```

You suggest to the optimiser that the source produces approximately:

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

# 19. DYNAMIC\ _ SAMPLING

You can ask for additional statistical sampling.

```
SELECT / * + DYNAMIC_SAMPLING (t 6) * /
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

# 20. Hints and aliases

One of the most common mistakes:

```
SELECT / * + INDEX (employees idx_emp_dept) * /
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
SELECT / * + INDEX (e idx_emp_dept) * /
*
FROM employment e
WHERE e.department_id = 10;
```

technical discussion rule:

> If a table has an alias, the hint must refer to the alias.

---

# 21. More Hints Simultaneous

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

# 22. Example DWH complete

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

The optimiser could choose:

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
HASHQ1QX BY
   |
HASH JOIN
   |\
* * *
   |
FACT_TRANSACTIONS
FULLQ1QX SCAN
PARALLEL
```

For DWH, this strategy can be much more natural.

---

# 23. Hint is absolute guarantee

An important aspect of the technical discussion:

> Oracle can ignore a hint.

For example:

```
SELECT / * + INDEX (t idx_xyz) * /
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

# 24. How to check if the hint has been used

You don't assume it worked just because the query is running.

Run the query with:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
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

# 25. GATHER\ _ PLAN\ _ STATISTICS

Very useful for diagnosis:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
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

# 26. Example of diagnosis

We assume:

```
--------------------------------------------------------------------------------
Did you hear that? Did you hear that?
--------------------------------------------------------------------------------
* * *
1).
* * * * * * * * * * * * * * * * * *
3 * INDEX RANGE SCAN * IDX_ORD_CUST
--------------------------------------------------------------------------------
```

The main problem:

```
E-Rows = 10
A-Rows = 500000
```

The optimiser thought Nested Loops was cheap.

A test can be:

```
SELECT / * + USE_HASH (o)
       ...
```

But the right solution can actually be:

```
Statistics
histogram
rewrite predicated
date of distribution
```

Not the hint.

---

# 27. Good hints for testing

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
SELECT / * + FULL (t) * /
*
FROM transactions t
WHERE customer_id = 100;
```

### Index

```
SELECT / * + INDEX (t idx_transactions_customer) * /
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

# 28. Hints versus Statistics

This is a key principle:

If the optimiser constantly makes a bad decision:

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

# 29. Hints and Bind Variables

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

# 30. Hints in OLTP versus DWH

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

# 31. The Most Important Hints To Memorize

for review and practice, they deserve memorized:

♪ Hint ♪ Rol ♪
♪ ♪ ♪ ♪ ♪
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =
* * *
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = = @ elder _ man
* * *
* * *
* * *
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
* * *
The MERGE allows / encourages go
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
* * * *
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =

---

# 32. Important diagnostic pattern

For a slow query:

```
Query slow
   ↓
Implementation Plan
   ↓
DBMS_XPLANQ1QX LAST
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
Test point
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

## Questions and answers

Question:

> Did you use hints to solve a slow query?

A good answer:

> I would not start by pushing the optimiser. First I would check the real plan with DBMS\ _ XPLAN.DISPLAY\ _ CURSOR and ALLSTATS LAST, in particular the differences between E-Rows and A-Rows. I would check statistics, histograms, selectivity of predictions, indexes and data distribution.
> 
> I would use hints like USE\ _ HACH, USE\ _ NL, INDEX, FULL or LEADING to test if an alternative strategy really produces a better plan. If the hint solves the problem, I would then try to understand why the optimiser did not choose that plan himself.

This is exactly the correct mindset for an Oracle Data Developer.

---

# 34. Actual DWH Scenario

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
FULLQ1QX PARALLEL
      ↓
HASH JOIN
      ↓
DIRECTQ1QX INSERT
      ↓
FACT_TRANSACTION
```

This is a very typical pattern for ETL/DWH.

---

# 35. Oracle Exercises 26ai

### Exercise 1 - FULL vs INDEX

On the HR.EMPLOYEES table:

```
SELECT / * + GATHER_PLAN_STATISTICS FULL (e) * /
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
SELECT / * + INDEX (x nonexistent_index) * /
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

## Questions and answers

1. What's a hint optimiser?
2. Is Oracle bound to respect a hint?
3. What is the difference between FULL and INDEX?
4. How's USE?
5. When would you prefer USE\ _ HASH?
6. How's LEADING?
7. What is the difference between LEADING and ORDERED?
8. How's APPEND?
9. Why is APPEND useful in DWH?
10. How's PARALLEL?
11. What is NO\ _ MERGE?
12. What does query unnesting mean?
13. How's MATERIALIZE?
14. Why can a hint be ignored?
15. Why are aliases important to hints?
16. How do you check to see if Oracle used the hint?
17. What is + HINT\ _ REPORT?
18. How's GATHER doing?
19. Why should E-Rows be compared to A-Rows?
20. Why shouldn't hints be the first solution for tuning?

---

# 37. What you need to remember

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
not a substitute for understanding the optimiser.
```

For **OLTP**, he frequently thinks:

```
high selectivity
→ INDEX
→ NESTED LOOPS
```

For **DWH / ETL**, he frequently thinks:

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

## 27. Parallel Execution in Oracle

Parallel Execution allows Oracle to divide a large SQL operation into several pieces executed simultaneously by several processes. It is especially useful in **DWH, ETL, reporting, large aggregation, massive scans and maintenance operations**.

The basic idea is:

```
Serial execution
Query
  |
  v
1 process
  |
  v
all data

Parallel execution
Query Coordinator
      |
+ ---- PX Server 1
+ ---- PX Server 2
+ ---- PX Server 3
+ ---- PX Server 4
```

The aim is not necessarily to consume fewer resources, but to complete the operation faster using more resources simultaneously.

---

# 1. Where Parallel Execution is used

The most common cases are:

```
Large SELECT-uri
FULLQ1QX SCAN
JOIN-uri by large volume
GROUP BY / aggregation
ORDER BY
CREATE TABLE AS SELECT
INSERT SELECT
CREATE INDEX
rebuild index
Part maintenance
ETL / DWH operations
```

Typical example:

```
SELECT
customer_id,
SUM (amount)
FROM transactions
GROUP BY customer_id;
```

If TRANSACTIONS has hundreds of millions of rows, Oracle can split the table into simultaneously processed areas.

---

# 2. Query Coordinator and Parallel Execution Servers

A parallel interrogation has a main process called:

```
Query Coordinator
QC
```

It coordinates parallel processes:

```
PX
Parallel Execution Servers
```

Simplified architecture:

```
Client
  |
  v
Query Coordinator
  |
  +----------------------------+
  |             |              |
PX1Q1QX PX3
scan scan scan scan
part 1 part 2 part 3
  |             |              |
  +-------------+--------------+
                |
                v
Query Coordinator
                |
                v
Client
```

The Query Coordinator does not necessarily process all the lines. He coordinates the operations and returns the final result.

---

# 3. Degree of Parallelism › DOP

The number of processes used is called:

```
Degree of Parallelism
DOP
```

Example:

```
SELECT / * + PARALLEL (t, 4) * /
COUNT *
FROM transactions t;
```

Here we ask:

```
DOP = 4
```

Conceptual:

```
TRANSACTIONS

25% → PX1
25% → PX2
25% → PX3
25% → PX4
```

But the actual number of Oracle processes may be higher than the apparent DOP- because certain operations use the **two sets of PX servers**.

For example:

```
PX SEND
PX RECEIVE
HASH JOIN
```

can involve two groups of parallel servers.

---

# 4. Activation of Parallel Execution

It can be requested by hint:

```
SELECT / * + PARALLEL (4) * /
*
FROM sales;
```

or:

```
SELECT / * + PARALLEL (s, 8) * /
*
FROM sales s;
```

The parallelism can also be defined at the object level:

```
ALTER TABLE sales PARALLEL 8;
```

Check:

```
SELECT
table_name,
Of a kind used in the manufacture of goods of Chapter 87
FROM user_tables
WHERE table_name = 'SALES';
```

Return to the show:

```
ALTER TABLE sales NOPARALLEL;
```

In practice, for the SQL application, it is often preferable for the decision of parallelism to be carefully controlled and not simply put PARALLEL 16 everywhere.

---

# 5. PARALLEL Hint

Example:

```
SELECT / * + PARALLEL (s, 4) * /
SUM (amount)
FROM sales s;
```

Or:

```
SELECT / * + PARALLEL (8) * /
*
FROM sales;
```

The opposite is:

```
SELECT / * + NO_PARALLEL * /
*
FROM sales;
```

or for an object:

```
SELECT / * + NO_PARALLEL (s)
*
FROM sales s;
```

---

# 6. Practical Example

We assume:

```
CREATE TABLE dwh_sales AS
SELECT
Level AS sale_id,
MOD (level, 100000) AS customer_id,
MOD (level, 1000) AS product_id,
SYSDATE - MOD (level, 3650) AS sale_date,
MOD (level, 5000) AS amount
FROM dual
CONNECT BY level = 10000000;
```

Serial interrogation:

```
SELECT
customer_id,
SUM (amount)
FROM dwh_sales
GROUP BY customer_id;
```

Parallel version:

```
SELECT / * + PARALLEL (s, 4) * /
customer_id,
SUM (amount)
FROM dwh_sales
GROUP BY customer_id;
```

Oracle can do:

```
PX1 → scan subset
PX2 → scan subset
PX3 → scan subset
PX4 → scan subset

       ↓

local aggregation

       ↓

redistribute by customer_id

       ↓

final aggregation
```

---

# 7. Parallel Full Table Scan

Parallelism is extremely useful for large scans.

Possible plan:

```
SELECT STATEMENT
PX COORDINATOR
PSEND QC
PBLOCK ITERATOR
TABLE ACCESS FULL SALES
```

Very important:

```
PBLOCK ITERATOR
```

shows that the blocks of the table are distributed between PX servers.

Conceptual:

```
Table blocks

1-1000 → PX1
1001-2000 → PX2
2001-3000 → PX3
3001-4000 → PX4
```

---

# 8. PX SEND and PX RECEIVE

In parallel planes, they occur frequently:

```
PX SEND
PX RECEIVE
```

They represent the transfer of data between parallel processes.

Example:

```
PX RECEIVE
PSEND HASH
TABLE ACCESS FULL SALES
```

PX SEND HASH means that Oracle redistributes rows between PX servers using a hash.

For example:

```
HASH (customer_id)
```

may cause:

```
Customer 10 → PX1
Customer 11 → PX3
curator 12 → PX2
Customer 13 → PX1
```

---

# 9. Distribution of data

Parallel Execution depends very much on how Oracle distributes the ranks between the processes.

Important methods:

```
HASH
BROADCAST
RANGE
ROUND-ROBIN
QC
```

One of the most important is:

```
PSEND HASH
```

common in:

```
HASH JOIN
GROUP BY
DISTINCT
```

---

# 10. Parallel Hash Join

For large tables:

```
SELECT / * + PARALLEL (4) * /
*
FROM sales s
JOIN customers c
ON c.customer_id = s.customer_id;
```

Oracle can do:

```
SALES
   |
PSEND HASH
   |
   +---------+
             |
CUSTOMERS
   |         |
PX SEND HASH
   |         |
   +---------+
        |
HASH JOIN
```

The lines with the same key shall be sent to the same PX process.

For example:

```
HASH (customer_id)% 4
```

determine the server that processes the key.

---

# 11. Broadcast

If one of the tables is small, Oracle can avoid redistributing both tables.

Example:

```
FACT_SALES
500 million rows

DIM_COUNTRY
200 rows
```

Oracle can send the entire small table to each PX server:

```
DIM_COUNTRY
     |
PSEND BROADCAST
   / | | \
PX1 PX2 PX3 PX4
```

Every trial takes place locally with its share of the big board.

The plan may contain:

```
PSEND BROADCAST
```

---

# 12. Data Skew

One of the important issues of Parallel Execution is:

```
data skew
```

We assume:

```
country_id
```

has the distribution:

```
RO = 70%
DE = 10%
FR = 10%
IT = 10%
```

If the distribution of the processing is bad:

```
PX1 → 70% data
Q0QX → 10%
Q0QX → 10%
Q0QX → 10%
```

then:

```
PX2 ends
PX3 ends
PX4 ends

PX1 continues for a long time
```

The total time is determined by PX1.

So:

```
Parallelism - automatic scaling perfect
```

Data distribution is critical.

---

# 13. Parallel GROUP BY

Example:

```
SELECT / * + PARALLEL (8) * /
customer_id,
SUM (amount)
FROM sales
GROUP BY customer_id;
```

The Oracle can make two levels of aggregation.

First:

```
PX1:
curator 1 → 100
curator 2 → 200

PX2:
curator 1 → 50
curator 3 → 300
```

Then redistribute after:

```
customer_id
```

and aggregate:

```
curator 1
100 + 50 = 150
```

The plan may contain:

```
HASHQ1QX BY
PSEND HASH
HASHQ1QX BY
```

This model:

```
partial aggregation
→ redistributes
→ final aggregation
```

It's very common.

---

# 14. Parallel DML

The parallelism can also be used for DML.

Example:

```
ALTER SESSION ENABLE PARALLEL DML;
```

then:

```
INSERT / * + APPEND PARALLEL (t, 4) * /
INTO target_table
SELECT / * + PARALLEL (s, 4) * /
*
FROM source_table s;
```

Very used in ETL.

Other example:

```
UPDATE / * + PARALLEL (t, 4) * /
large_table t
SET status = 'ARCHIVED'
WHERE transaction_date; DATE '2020-01-01';
```

Parallel DML should be used with caution because of:

```
locks
UNDO
REDO
competition
resources
```

---

# 15. Direct Path Inser

In DWH is often found the combination:

```
INSERT / * + APPEND PARALLEL (8) * /
INTO fact_sales
SELECT / * + PARALLEL (8) * /
*
FROM staging_sales;
```

APPEND asks:

```
direct-path insert
```

Instead of searching for space among existing blocks, Oracle adds data to new blocks.

Conceptual:

```
Conventional INSERT

there are blocks
↓
search free space
↓
insert

Direct Path INSERT

High Water Mark
       |
       v
-------------------------
date
-------------------------
NEW DATA
NEW DATA
NEW DATA
```

ETL can be much faster.

---

# 16. Parallel CTAS

Very common in DWH:

```
CREATEQ1QX sales_summary
PARALLEL 8
AS
SELECT
customer_id,
SUM (amount) total_amount
FROM sales
GROUP BY customer_id;
```

It's:

```
CTAS
CREATE TABLE AS SELECT
```

and can benefit from parallelism in both reading and writing.

---

# 17. Parallel Index Creation

The creation of a large index can be paralleled:

```
CREATEQ1QX ix_sales_customer
ON sales (customer_id)
PARALLEL 8;
```

After creation, it often returns to:

```
ALTER INDEX ix_sales_customer NOPARALLEL;
```

Otherwise the attribute of parallelism may remain associated with the index.

---

# 18. Parallel Partition Operations

Partitioning and Parallel Execution work very well together.

Example:

```
FACT_SALES

P2023
P2024
P2025
P2026
```

An interrogation:

```
SELECT / * + PARALLEL (4) * /
SUM (amount)
FROM fact_sales
WHERE sale_date = DATE '2026-01-01'
```

may benefit simultaneously from:

```
partition pruning
+
parallel scan
```

For example:

```
Partition pruning:

P2023 X
P2024 X
P2025 X
P2026

P2026:
PX1
PX2
PX3
PX4
```

This is a very strong combination in DWH.

---

# 19. How do you recognize Parallel Execution in DBMS\ _ XPLAN

A parallel plan frequently looks like this:

```
--------------------------------------------------------------------------------
Did you hear that? Did you hear that?
--------------------------------------------------------------------------------
* *
1).
* * * *
3; HASH GROUP BY; Q1; 01; PCWP;
* * *
5-- PX SEND HASH
* HASH GROUP BY * Q1 *, 00 * PCWP *
7 * PX BLOCK ITERATOR * Q1 *, 00 * PCWC *
* * * * * * * * * * * * * * * * * * * * * *
--------------------------------------------------------------------------------
```

Key terms:

```
PX COORDINATOR
PX SEND
PX RECEIVE
PBLOCK ITERATOR
TQ
PQ District
```

---

# 20. What TQ is

TQ means approximately:

```
Table Queue
```

It's the channel through which the PX servers send their ranks.

Example:

```
: TQ10000
```

Conceptual:

```
Manufacturer PX set
      |
      v
TQ10000
      |
      v
Consumer PX set
```

It is essential to read a parallel plan.

---

# 21. P-a-a P, P-a-a S and S-a-p

In column IN-OUT you can see:

```
P-A-P
S-S-E-E-E-E
S-S-P
```

where:

```
P = Parallel
S = Serial
```

Example:

```
P-A-P
```

means:

```
parallel producer
→
parallel consumer
```

For example:

```
PSEND HASH
```

In the end it often appears:

```
S-S-E-E-E-E
```

because PX servers send the result to Query Coordinator.

---

# 22. PCWP and PCWC

Values such as:

```
PCWP
PCWC
```

Conceptual:

```
PCWP
Parallel Combined With Parent

PCWC
Parallel Combined With Child
```

They describe how operations are combined within PX servers.

for review it is enough to admit that they are part of the parallel execution mechanism; usually more important are:

```
PX SEND
PX RECEIVE
PQ District
DOP
```

---

# 23. Reading a parallel plan from the bottom up

Let's take:

```
8 TABLE ACCESS FULL SALES
7 PX BLOCK ITERATOR
6 HASH GROUP BY
5 PX SEND HASH
4 PX RECEIVE
3 HASH GROUP BY
2 PX SEND QC
1 PX COORDINATOR
```

You read it like this:

```
8.
PX servers read SALES

7.
PX BLOCK ITERATOR distributes the blocks

6.
each PX makes local aggregation

5.
rows are redistributed through HASH

4.
second PX set receives data

3.
Final aggregation is made

2.
the result is sent to QC

1.
Query Coordinator returns result
```

This is one of the most important squares.

---

# 24. Why Parallel Execution can be slower

More parallelism does not automatically mean better performance.

Example:

```
serial query:
5 seconds

parallel 2:
3 seconds

parallel 4:
2 seconds

parallel 8:
2 seconds

parallel 32:
6 seconds
```

Why?

Because additional costs occur:

```
PX startup
communication process
redistribution date
CPU content
I/O content
memory consumption
swap context
```

That's why there's a point:

```
more DOP → does not help
```

---

# 25. CPU and I/O

Parallelism only helps if there are resources available.

If a server has:

```
8 CPU Korea
```

and runs simultaneously:

```
10 querys
PARALLEL 16
```

Overweight may occur.

Similarly, if the squeeze can provide:

```
1 GB/s
```

and four PX servers already reach this limit, moving to:

```
DOP 16
```

no longer increase the throughput.

---

# 26. Parallelism in OLTP vs DWH

In OLTP:

```
SELECT custodian
WHERE customer_id =:
```

It returns maybe one line.

Parallelism isn't helping.

Instead:

```
DWH

SELECT
region,
SUM (amount)
FROM fact_sales
GROUP BY region;
```

billions of rows can benefit massively.

Conceptual rule:

```
OLTP
→ in general series

DWH / ETL
→ parallel execution frequently useful
```

---

# 27. When NU you want parallelism

Avoid it for:

```
very small querys
looks on index
Intense OLTP
already CPU-bound systems
many competing sessions
operations that process few rows
```

For example:

```
SELECT / * + PARALLEL (16) * /
*
FROM customers
WHERE customer_id = 123;
```

It's almost certainly a bad idea.

Serial lookup index can last:

```
sub-ms / a few ms
```

and creating the PX infrastructure can cost more than interrogation.

---

# 28. Monitoring Parallel Execution

For SQL executed, you can use:

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

PX statistics are also useful for parallel querys.

For example:

```
SELECT *
FROM v $px_session;
```

or:

```
SELECT *
FROM v $px_process;
```

and:

```
SELECT *
FROM v $px_sesstat;
```

These views require proper privileges.

---

# 29. SQL Monitor

For costly and parallel SQL-uri, SQL Monitor is extremely useful.

You can see things like:

```
DOP
ed time
CPU
I/O
row countries
PX
wait events
skew
```

In particular, you can identify the situation:

```
PX1)
PX2
PX3
PX4
```

indicating possible:

```
data skew
```

---

# 30. Actual DWH Example

You have:

```
STG_TRANSACTION
500 million rows

FACT_TRANSACTION
2 billion rows
```

You want to upload new transactions.

Example:

```
ALTER SESSION ENABLE PARALLEL DML;

INSERT / * + APPEND PARALLEL (f, 8) * /
INTO fact_transaction f
SELECT / * + PARALLEL (s, 8) * /
s.transaction_id,
s.account_id,
s.transaction_date,
♪ amount ♪
FROM staging_transaction
WHERE s.batch_id =: batch_id;
```

Flux:

```
STAGING
   |
parallel full scan
   |
PX1 PX2 PX3 PX4 PX5 PX6 PX7 PX8
   |
Transform
   |
parallel direct-path insert
   |
FACT_TRANSACTION
```

It's a classic pattern of ETL Oracle.

---

# 31. Parallel Execution + Partitioning + ETL

In a well-designed DWH you can combine:

```
partitioning
+
partition pruning
+
parallel execution
+
direct path insert
+
part exchange
```

For example:

```
STAGING
    |
Parallel ETL
    |
TEMP
    |
Partition Exchange
    |
FACT_SALES.P202609
```

This allows you to load very large volumes with little impact on the rest of DWH-.

---

# 32. Common mistake: PARALLEL everywhere

An anti-pattern:

```
SELECT / * + PARALLEL (32) * /
```

automatically put on any SQL.

May cause:

```
CPU saturation
PX server shortage
I/O content
Poor competition
worse overall performance
```

Parallelism is a shared resource.

The right question is not:

> What is the maximum DOP-?

but:

> What is the effective DOP- for the total workshop?

---

# 33. Very important concept: throughput vs latency

Parallel Execution can reduce:

```
latency
```

for one query.

But it can reduce:

```
overall system throughput
```

if so many querys simultaneously use PX servers.

Example:

```
1 query × DOP 32
```

It can be very fast.

But:

```
50 querys × DOP 32
```

I can overload the system.

This is one of the reasons why parallelism needs to be controlled at workload level.

---

# 34. Parallel Execution › mental model

Note this scheme:

```
Query Coordinator
                       |
PX SEND / RECEIVE
                       |
           +-----------+-----------+
           |           |           |
PX1Q1QX PX3
           |           |           |
           +-----------+-----------+
                       |
tables / partitions
```

For joints:

```
TABLE A
   |
PSEND HASH
   |
   +----------------+
                    |
HASH JOIN
                    |
   +----------------+
   |
PSEND HASH
   |
TABLE B
```

---

## Questions and answers

**What is Parallel Execution?**

The Oracle mechanism by which an SQL operation is divided between several PX processes for simultaneous execution.

**What is Query Coordinator?

The process that coordinates parallel execution servers and returns the result to the client.

**What is DOP?

Degree of Parallelism is the level of parallelism used for an operation.

**What does PX SEND HASH mean?**

The rows are redistributed between PX servers using a hash function, usually after the key to a join or GROUP BY.

**What is PX BLOCK ITERATOR?

Mechanism through which the blocks of a table are distributed between the PX processes for parallel scanning.

**Why can parallelism be slower?**

Due to the PX overhead, data redistribution, CPU/I/O contention, communication overhead and data skew.

**Where is Parallel Execution most useful?**

DWH, ETL, large scans, aggregation, massive joints, CTAS, creating indexes and partition operations.

**Is it suitable for OLTP?**

Usually not for short and selective operations; overhead may be greater than the benefit.

---

# 36. What you need to know very well for a Data Developer

For an Oracle Data Developer / DWH role, prioritize the following concepts:

```
Parallel Execution
    |
+ -- Query Coordinator
    |
+ -- PX Servers
    |
+ -- DOP
    |
+ -- PX BLOCK ITERATOR
    |
+ -- PX SEND / RECEIVE
    |      |
-- HASH
-- BROADCAST
    |
+ -- Parallel Hash Join
    |
+ -- Parallel GROUP BY
    |
+ -- Parallel DML
    |
+ -- APPEND / Direct Path
    |
+ -- CTAS
    |
+ -- Partitioning
    |
+ -- Data Skew
    |
+ -- CPU / I/O constraint
    |
+ -- DBMS_XPLAN
```

---

## Summary to be remembered

The mental formula is:

```
Parallel Execution =
division of a large operation
+
more PX servers
+
simultaneous processing
+
redistribution of data when necessary
```

And a classic plan like:

```
PX COORDINATOR
PSEND QC
HASHQ1QX BY
PX RECEIVE
PSEND HASH
HASHQ1QX BY
PBLOCK ITERATOR
TABLEQ1QX FULL
```

read, bottom to top:

```
parallel scan
→ Local aggregation
→ HASH redistribution
→ Final aggregation
→ result to Query Coordinator
```

For DWH, the combination to remember is:

```
Partition Pounding
       +
Parallel Execution
       +
Direct Path
       +
Bulk processing
=
Very performant ETL
```

And the most important rule is:

> **Parallel Execution does not make SQL- more efficient; it allows it to consume more resources simultaneously to finish faster.**

Therefore, before you increase DOP-, you must check **data volume, plane execution, CPU, I/O, data distribution and competition with other** workshops.

---

## Questions and answers

### How would you briefly explain Optimizer Hints to a colleague who knows SQL, but not this area?

Optimizer Hints covers hints influence but do not replace understanding, access-path hints FULL and INDEX, join-order hints Leading and ORDERED. In practice, first determine what data enters and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Optimizer Hints?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Optimizer Hints, I explicitly follow hints influence but do not replace understanding, access-path hints FULL and INDEX, join-order hints LEADING and ORDERED and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Optimizer Hints appears together with logging, auditing, reconciliation and impact analysis.
