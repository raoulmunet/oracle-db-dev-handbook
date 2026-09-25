---
title: 'C11. Execution Plans'
description: 'Complete English handbook chapter based on the original C11 course.'
sidebar_position: 11
---

# C11. Execution Plans

<div className="chapter-kicker">Chapter C11 · Complete course</div>

An **Execution Plan** shows **how Oracle intends to execute an SQL** instruction: in what order does the tables access, what indexes use, how does the joints, where they sort, aggregate or filter, and how expensive the Optimizer estimates they are operations.

For a Data Developer, Execution Plan is one of the most important diagnostic tools for SQL performance.

---

## 11.1. The Fundamental Idea

For SQL-:

```
SELECT e.employee_id,
e.last_name,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id
WHERE e.salary › 10000;
```

Oracle does not simply execute the instruction in the order in which it is written.

The optimiser decides:

- which table is first read;
- if it uses index or FULL TABLE SCAN;
- Join algorithm;
- order of joints;
- when applying filters;
- whether it has to sort;
- if it can turn the query into a more efficient form.

The result is **Execution Planet**.

---

# 11.2. The three things that need to be differentiated

There are three close but different concepts.

### Estimated Implementation Plan

Optimiser's estimated plan.

```
EXPLAINQ1QX FOR
SELECT *
FROM hr employees
WHERE department_id = 50;
```

Then:

```
SELECT *
FROM TABLE (DBMS_XPLAN.DISPLAY);
```

Oracle **does not perform the** query.

He just estimates how they'd execute him.

---

### Actual Execution Plan

The query is executed and we can see real information about the execution.

```
SELECT / * + gather_plan_statistics * /
*
FROM hr employees
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

It's much more important for Troubleshooting.

We can compare:

```
E-Rows
```

with:

```
A-Rows
```

I mean:

- **Estimated Rows**
- **Actual Rows**

---

### The Shared Pool Planet

We can see the plan of the SQL cursor already executed:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
sql_id = = '...',
cursor_child_no =
Format = 'ALLSTATS LAST'
)
);
```

It is very useful in actual production investigations.

---

# 11.3. How to read an Execution Plan

Practical rule:

> **Execution The planet is read mainly from bottom up and from inside out.**

Example:

```
--------------------------------------------------------------------------------
# # # # # #
--------------------------------------------------------------------------------
* *
* * * *
= = sync, corrected by elderman = = @ elder _ man
--------------------------------------------------------------------------------
```

Logical order:

```
2 → INDEX RANGE SCAN
↓
1 → TABLE ACCESS BY INDEX ROWID
↓
0 → SELECT STATEMENT
```

Oracle:

1. search the keys in the index;
2. obtain ROWID;
3. access the rows in the table;
4. Turn back the result.

---

# 11.4. Important columns of DBMS\ _ XPLAN

A plan can look like this:

```
-------------------------------------------------------------------------------------
# # # # # # #
-------------------------------------------------------------------------------------
(0)
* 1 * TABLE ACCESS FULL * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
-------------------------------------------------------------------------------------
```

## Id

Operation ID.

```
Id
0
1
2
...
```

It is also used in the section:

```
Predicted Information
```

---

## Operation

Oracle's operation.

Examples:

```
TABLEQ1QX FULL
INDERANGE SCAN
HASH JOIN
NESTED LOOPS
SORT
HASHQ1QX BY
```

---

## Setup

The subject matter on which the operation is carried out.

Example:

```
EMPLOYEES
EMP_DEPT_IX
ORDERS
CUSTOMERS
```

---

## Rows

Estimated number of rows.

In an estimated plan:

```
Rows
```

represents:

```
E-Rows
```

---

## Bytes

Estimated amount of data processed.

Conceptual:

```
Bytes rec rows × row size
```

---

## Cost

The relatively estimated cost of Optimizer.

Example:

```
Cost = 125
```

Doesn't mean:

```
125 ms
```

and neither:

```
125 seconds
```

It is an internal **unit of comparison between the** plane alternatives.

---

## Time

Expected time.

It must be treated with caution.

It's a cost-based estimate.

---

# 11.5. Main Operations

## TABLEQ1QX FULL

```
TABLE ACCESS FULL
```

The Oracle reads a large part or all of the blocks of the table.

Example:

```
SELECT *
FROM employment;
```

or:

```
SELECT *
FROM
WHERE salary is 1000;
```

if the filter returns many lines.

A Full Table Scan **is not automatically something bad**.

For:

```
1,000,000 rows
```

if the query needs:

```
700,000 rows
```

A Full Table Scan can be much more effective than hundreds of thousands of access through the index.

---

# 11.6. INDEX UNIQUE SCAN

Example:

```
SELECT *
FROM
WHERE employee_id = 100;
```

If:

```
EMPLOYEE_ID
```

is Mayor Key, the plan may contain:

```
INDEX UNIQUE SCAN
```

Followed by:

```
TABLE ACCESS BY INDEX ROWID
```

Conceptual:

```
index
  ↓
ROWID
  ↓
table row
```

It's used when Oracle knows that there can be maximum one result.

---

# 11.7. INDEX RANGE SCAN

Example:

```
SELECT *
FROM
WHERE department_id = 50;
```

or:

```
SELECT *
FROM
WHERE salary BETWEEN 5000 AND 8000;
```

Plan:

```
INDERANGE SCAN
```

Oracle is looking for an area in B-tree.

It can return:

```
1
10
100
10,000
```

Of rows.

---

# 11.8. TABLE ACCESS BY INDEX ROWID

The index shall contain:

```
indexed_column
ROWID
```

But the query may require:

```
SELECT employee_id,
first_name,
last_name,
salary
```

After finding ROWID in the index, Oracle should go to the table.

Plan:

```
TABLE ACCESS BY INDEX ROWID
INDERANGE SCAN
```

---

# 11.9. INDEX FAST FULL SCAN

Conceptual example:

```
SELECT COUNT *
FROM employment;
```

If the index is sufficient for query:

```
INDEX FAST FULL SCAN
```

Oracle treats the index almost like a compact table.

Important:

```
INDEX FAST FULL SCAN
```

is not the same as:

```
INDEFULL SCAN
```

Fast Full Scan:

- can read blocks in parallel;
- does not maintain the index order;
- It looks conceptually like a Full Table Scan on the index.

---

# 11.10. Join Operations

The three important mechanisms are:

```
NESTED LOOPS
HASH JOIN
MERGE JOIN
```

---

## NESTED LOOPS

Conceptual:

```
for each row from A
find matching rows in B
```

Example:

```
NESTED LOOPS
► TABLE ACCESS...
► INDEX RANGE SCAN...
```

It is very good when the first set is small and the second table has a good index.

Example:

```
100 Customers
→ look ORDERS using index
```

---

## HASH JOIN

Very common in DWH.

Example:

```
HASH JOIN
► TABLE ACCESS FULL DIM_CUSTOMER
TABLE ACCESS FULL FACT_SALES
```

Oracle builds a hash structure for one source and seeks matches from the other.

Very suitable for:

```
large dates
+
equity joins
```

Example:

```
SELECT...
FROM fact_sales f
JOIN dim_customer c
ON c.customer_key = f.customer_key;
```

---

## MERGE JOIN

Conceptual:

```
sort A
sort B
go
```

It can be effective when the data are already sorted or the order can be exploited.

Uncommon than:

```
Nested Loops
Hash Join
```

but important to recognize.

---

# 11.11. Join Order

For:

```
SELECT...
FROM orders o
JOIN customers c
ON c.customer_id = o.customer_id
JOIN countries co
ON co.country_id = c.country_id;
```

The optimiser may decide:

```
COUNTRIES
→ CUSTOMERS
→ ORDERS
```

even if SQL- is written:

```
ORDERS
→ CUSTOMERS
→ COUNTRIES
```

The order in FROM does not normally dictate the physical order of execution.

---

# 11.12. SORT

Operations such as:

```
SORTQ1QX BY
SORTQ1QX BY
SORT UNIQUE
```

Example:

```
SELECT *
FROM
ORDER BY salary;
```

It can produce:

```
SORTQ1QX BY
TABLE ACCESS FULL EMPLOYEES
```

Sorting may consume:

```
PGA
```

and if the memory is not sufficient:

```
TEMP tablespace
```

---

# 11.13. HASH GROUP BY

Example:

```
SELECT department_id,
COUNT *
FROM
GROUP BY department_id;
```

Possible plan:

```
HASHQ1QX BY
TABLE ACCESS FULL EMPLOYEES
```

The Oracle builds a hash structure for aggregation.

---

# 11.14. FILTER

Plan:

```
FILTER
```

means that Oracle applies a logical condition.

It can appear for:

```
WHERE
EXISTS
NOT EXISTS
subqueries
```

---

# 11.15. Predicted Information

One of the most important sections of the plan.

Example:

```
Preached Information (identified by operation id):
---------------------------------------------------

2 - access (= 100)
3 - filter ()
```

We need to differentiate:

```
access ()
```

by:

```
filter ()
```

---

## Access Predicted

It is used for **to find** data.

Example:

```
access (= 100)
```

It can allow Oracle to navigate directly into an index.

---

## Predicted Filter

The data are read and then deleted.

```
Filter ()
```

Conceptual:

```
READ
↓
FILTER
```

In general, it is preferable to reduce the number of rows as early as possible.

---

# 11.16. Estimated Rows vs Actual Rows

This is one of the most important tuning techniques.

We execute:

```
SELECT / * + gather_plan_statistics * /
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

We can see:

```
E-Rows
A-Rows
```

Example:

```
E-Rows = 10
A-Rows = 100,000
```

That's an enormous difference.

The optimiser thought:

```
10 rows
```

But the reality is:

```
100,000 rows
```

The result can be a very bad plan.

For example, Oracle can choose:

```
NESTED LOOPS
```

thinking he's processing 10 rows.

But he gets to execute the lookup:

```
100,000
```

times.

---

# 11.17. Cardinal

**Cardinality** is the estimated number of rows produced by an operation.

Example:

```
WHERE status = 'FAILED'
```

The optimiser must estimate:

```
How many lines have FAILED status?
```

If he estimates cardinality wrong, he can make wrong decisions about:

```
index vs full scan
join order
Join method
memory
parallelism
```

Therefore, it is often said:

> Cardinality estimate is at the heart of the Oracle Optimizer.

---

# 11.18. Statistics

The optimiser bases his decisions on statistics.

Examples:

```
NUM_ROWS
BLOCKS
DISTINCT_KEYS
NUM_DISTINCT
density
histograms
```

Collection:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "'DEV_LAB',"
tablets
);
END;
/
```

If statistics are old:

```
current rows = 100M
Statistics = 10M
```

The optimiser can build an inappropriate plan.

---

# 11.19. Histograms

Let's assume the column:

```
STATUS
```

with the distribution:

```
SUCCESS 9,900,000
FAILED 90,000
PENDING 10,000
```

Distribution is not uniform.

Without the histogram, Oracle can estimate roughly:

```
10,000,000 / 3
```

for each value.

But:

```
PENDING
```

has only:

```
10,000
```

rows.

A histogram can help the Optimizer understand distribution.

---

# 11.20.

In the real plans we can see:

```
Starts
```

This column is extremely useful.

Example:

```
NESTED LOOPS
TABLEQ1QX CUSTOMERS
INDEX RANGE SCAN ORDERS_IDX
```

If:

```
Customers A-Rows = 10,000
```

We can see:

```
ORDERS_IDX Starts = 10,000
```

I mean, the index is accessed 10,000 times.

This can explain a slow SQL.

---

# 11.21. Buffers

In real plans:

```
Buffers
```

shows the number of blocks hits in the cache buffer.

Example:

```
Buffers = 5,000,000
```

may be a much more relevant sign than:

```
Cost = 200
```

to investigate the real SQL-.

---

# 11.22. A-Time

It may occur:

```
A-Time
```

That is, actual time accumulated for surgery.

Example:

```
00: 00: 05.23
```

It must be interpreted together with:

```
Starts
A-Rows
Buffers
```

---

# 11.23. Full Example

Query:

```
SELECT / * + gather_plan_statistics * /
c.customer_name,
SUM (f.amount)
FROM fact_sales f
JOIN dim_customer c
ON c.customer_key = f.customer_key
WHERE f.sale_date = DATE '2026-01-01'
GROUP BY c.customer_name;
```

Simplified plan:

```
---------------------------------------------------------------------------------
# # # # # #
---------------------------------------------------------------------------------
* * *
* * * *
= = sync, corrected by elderman = = @ elder _ man
3 * TABLE ACCESS FULL * DIM_CUSTOMER * 10,000 *
* 4 * TABLE ACCESS FULL * FACT_SALES * 500000 * 600000 * 149500 *
---------------------------------------------------------------------------------
```

Read:

```
3 DIM_CUSTOMER
        \
HASH JOIN
        /
4 FACT_SALES
       ↓
HASHQ1QX BY
       ↓
SELECT
```

We see:

```
E-Rows = 500,000
A-Rows = 600,000
```

The estimate is relatively reasonable.

If we had:

```
E-rows = 100
A-Rows = 600,000
```

We would have investigated statistics and selectivity right away.

---

# 11.24. Anti-pattern: function on indexed column

We have the index:

```
CREATEQ1QX idx_orders_date
ON orders (order_date);
```

Query:

```
SELECT *
FROM orders
WHERE TRUNC (order_date) = DATE '2026-09-23';
```

Oracle may not be able to exploit the normal efficient index.

Better:

```
SELECT *
FROM orders
WHERE order_date = DATE '2026-09-23'
AND order_date; DATE '2026-09-24';
```

Now we have a range condition:

```
INDERANGE SCAN
```

Possibly.

---

# 11.25. Default Conversion

Another very important case.

Column:

```
customer_id NUMBER
```

But the query:

```
WHERE customer_id = '12345'
```

Oracle has to make a conversion.

More dangerous situations occur with:

```
VARCHAR2 ↔ NUMBER
DATE ↔ VARCHAR2
TIMESTAMP ↔ VARCHAR2
```

Expressions such as:

```
TO_NUMBER (...)
TO_CHAR (...)
```

which can prevent the efficient use of the index.

---

# 11.26. SELECTIVITY

Selectivity is the proportion of selected rows.

Example:

```
backgammon = 10,000,000 rows
query returns = 100 rows
```

Selection:

```
100 / 10,000,000
= 0.001%
```

Very selective.

An index is often very attractive.

But:

```
query returns 8,000,000 rows
```

the selectivity is:

```
80%
```

A Full Table Scan can be much more effective.

---

# 11.27. Good Plan vs. Bad Plan

There is no rule:

```
index = good
Full scan = bad
```

A good plan is the one that does as little unnecessary work as possible.

Example DWH:

```
SELECT SUM (amount)
FROM fact_transactions
WHERE transaction_date = DATE '2025-01-01'
```

If necessary:

```
400 million out of 500 million rows
```

one:

```
FULLQ1QX SCAN
```

or:

```
PARTITIONQ1QX SCAN
```

It could be the right plan.

---

# 11.28. Partition Pounding

Very important in DWH.

Table:

```
FACT_TRANSACTIONS
```

Partitioned monthly after:

```
TRANSACTION_DATE
```

Query:

```
SELECT SUM (amount)
FROM fact_transactions
WHERE transaction_date = DATE '2026-09-01'
AND transaction_date; DATE '2026-10-01';
```

Oracle can only read the partition:

```
SEP_2026
```

In the plan we can see columns such as:

```
Pstart
Pstop
```

Example:

```
PARTITIONQ1QX SINGLE
```

or:

```
PARTITIONQ1QX ITERATOR
```

This is:

> **partition pressing**

and can reduce the amount of data read enormously.

---

# 11.29. Bloom Filters

In DWH and Parallel Execution workshops we can meet:

```
JOINQ1QX CREATE
JOINQ1QX USE
```

Oracle creates a compact filter based on the values in one table and uses it to quickly remove rows from another source.

Very useful for:

```
large fact table
+
Small size
```

---

# 11.30. Adaptive Plans

In certain situations Oracle can prepare alternatives for execution and adapt some decisions based on the information observed during execution.

In DBMS\ _ XPLAN we can meet information such as:

```
plane adaptive
```

or inactive operations.

The important idea for review:

> Optimiser is not always completely rigid; certain mechanisms allow it to adjust execution based on observed reality.

---

# 11.31. EXPLAIN PLAN vs DISPLAY\ _ CURSOR

For real troubleshooting:

```
EXPLAIN PLAN
```

is useful, but:

```
DBMS_XPLAN.DISPLAY_CURSOR
```

is usually more valuable.

Reason:

EXPLAIN PLAN shows:

```
what Oracle thinks he would do
```

DISPLAY\ _ CURSOR... ALLSTATS LAST may show:

```
what he actually did
```

---

# 11.32. Recommended laboratory command

Run the query:

```
SELECT / * + gather_plan_statistics * /
*
FROM hr employees
WHERE department_id = 50;
```

then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +PREDICATE'
)
);
```

For further study:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST +PREDICATE +ALIAS'
)
);
```

---

# 11.33. Practical method of analysis of a plan

When you get a slow SQL, you don't start with:

> What's the point?

Follow a method.

### 1. Identify large operations

Search:

```
TABLEQ1QX FULL
HASH JOIN
SORT
NESTED LOOPS
```

but don't assume they're wrong.

---

### 2. Follow the tree from the bottom up

Determine:

```
which produces data
↓
who consumes them
↓
what volume is circulating
```

---

### 3. Compare E-Rows and A-Rows

Example:

```
E-Rows 10
A-rows 800,000
```

This is a major red flag.

---

### 4. Look at the Starts

Example:

```
Starts = 500,000
```

for a look-up index can explain the problem.

---

### 5. Look at the Buffers

Look for operations that generate most of the block access.

---

### 6. Check the Predicate Information

Search:

```
access (...)
filter (...)
```

and suspicious expressions:

```
TO_NUMBER (...)
TO_CHAR (...)
TRUNC (...)
NVL (...)
```

---

### 7. Check volumes

Ask:

```
How many lines are in?
How many are out?
Where are they reduced?
```

---

### 8. Check statistics and data distribution

Especially when the cardinality is wrong.

---

### 9. Check if the index really would be useful

Don't automatically try to remove Full Table Scan.

---

### 10. Only then changes SQL- / indexes

---

# 11.34. Classic example of problem Nested Loops

Plan:

```
---------------------------------------------------------
# # # # # #
---------------------------------------------------------
* *
2) TABLE ACCESS FULL CUSTOMERS
3).
---------------------------------------------------------
```

What do we see?

Operation:

```
ORDERS_IDX
```

was executed:

```
100,000 times
```

This can get very expensive.

One:

```
HASH JOIN
```

could be a more suitable alternative for large volumes.

But we're not changing the plan just because Hash Join sounds better.

We analyze:

```
A-Rows
Buffers
time
date of distribution
Statistics
```

---

# 11.35. Example DWH

We have:

```
FACT_TRANSACTION 500M rows
DIM_ACCOUNT 5M rows
DIM_CUSTOMER 2M rows
DIM_DATE 10K rows
```

Query:

```
SELECT c.segment,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_key = f.customer_key
JOIN dim_date d
ON d.date_key = f.date_key
WHERE d.calendar_year = 2026
GROUP BY c.segment;
```

The reasonable plan may include:

```
TABLE ACCESS FULL DIM_DATE
HASH JOIN
PARTITION RANGE ITERATOR FACT_TRANSACTION
HASHQ1QX DIM_CUSTOMER
HASHQ1QX BY
```

It shouldn't scare us:

```
TABLEQ1QX FULL
HASH JOIN
```

In DWH these are very common exactly the right operations.

---

## Questions and answers

### What's an Execution Plan?

It is the representation of the strategy chosen by the Oracle Optimizer for the execution of an SQL: access paths, join order, join methods, sorting, filtering and estimates of cardinality and cost.

---

### How do you read an Execution Plan?

Mainly:

```
bottom to top
and from the inside out
```

watching operations produce data for their parents.

---

### Cost is time?

No.

The cost is an estimated internal value of Optimizer for comparing alternatives.

---

### Full Table Scan is bad?

No.

It can be the most effective strategy when a large proportion of the table needs to be read.

---

### The difference between INDEX UNIQUE SCAN and INDEX RANGE SCAN?

INDEX UNIQUE SCAN:

```
not more than one row
```

usually for equality on a single key.

INDEX RANGE SCAN:

```
zero, one or many rows
```

for non-unique intervals or values.

---

### How do you identify a wrong estimate?

Compare:

```
E-Rows
```

with:

```
A-Rows
```

---

### What can cause the wrong estimates?

Among other things:

```
stale statistics
data skew
missing histograms
correlated columns
complex predicates
function
bind-sensitive date
```

---

### Nested Loops or Hash Join?

In general:

```
Nested Loops
→ small set + efficient index

Hash Join
→ Large sets + equity joins
```

But choice depends on volumes and costs.

---

### What are you after in a slow SQL?

Good technical discussion response:

> I start with the real plan, I check E-Rows versus A-Rows, then Starts, Buffers and Predicate Information. I follow the order of the joints and data volumes, I check the statistics and selectivity of the conditions, and then I decide whether the problem comes from SQL, indexation, statistics, partitioning or estimation of Optimizer.

---

# 11.37. Oracle Exercises 26ai

## Exercise 1 - Full Scan

```
SELECT / * + gather_plan_statistics * /
*
FROM hr employees
WHERE salary is 1000;
```

Analyze:

```
TABLEQ1QX FULL
```

---

## Exercise 2 - Primary Key

```
SELECT / * + gather_plan_statistics * /
*
FROM hr employees
WHERE employee_id = 100;
```

Search:

```
INDEUNIQUE SCAN
```

---

## Exercise 3 - Range Scan

```
SELECT / * + gather_plan_statistics * /
*
FROM hr employees
WHERE department_id = 50;
```

Search:

```
INDERANGE SCAN
```

---

## Exercise 4 - Join

```
SELECT / * + gather_plan_statistics * /
e.employee_id,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id;
```

Identify:

```
Join method
join order
```

---

## Exercise 5 - Estimates

Run:

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

Compare:

```
E-Rows
A-Rows
```

---

# 11.38. Checklist for reading an DBMS\ _ XPLAN

When you see a plan, ask in this order:

```
1. What are the leaf operations?
2. Which table is read first?
3. Index or Full Scan?
4. What access predicates are there?
5. What filter predicates exist?
6. What join method is used?
7. What's the join order?
8. How many E-Rows?
9. How many A-Rows?
10. Are there large differences E-Rows / A-Rows?
11. How many Starts?
12. How many Buffers?
13. Is there a lot of sorting?
14. Are there conversions or functions on the columns?
15. Is there partition pruning?
16. Where does the number of rows explode?
17. Where are the lines coming down?
```

---

# 11.39. What to note

The most important ideas in the module are:

```
Implementation Plan
    │
- access path
Č eská republika rod
Č eská republika rod
ed INDEX RANGE SCAN
    │
¶ ¶ Join method ¶
Č eská republika NESTED LOOPS
Č eská republika HASH JOIN
ed MERGE JOIN
    │
* * * * * *
* * *
Č eská republika A-Rows
    │
- - work performed.
- Starts.
- - "Buffers"
* * * * * * * * * * * * * *
    │
* * * * * * *
* * *
* * * *
    │
- DWH
* * * * * * *
- - Full Scan
"Partition Pounding"
- "Parallel Execution"
- "Bloom Filters"
```

The central rule is:

> **Do not judge an Execution Plan by whether or not it uses an index. Watch how much work Oracle does, how many lines it estimates, how many it actually processes and where the difference between estimation and reality occurs.**

And for practical diagnosis, the combination worth memorizing is:

```
E-Rows vs A-Rows
+
Starts
+
Buffers
+
Predicted Information
```

These four elements explain a large part of the real SQL performance problems.

---

## Questions and answers

### How would you briefly explain Execution Plans to a colleague who knows SQL, but not this area?

Execution Plans covers reading plans from the inside out, operation, object, rows, cost and predicates, E-Rows vs A-Rows and Starts. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Execution Plans?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Execution Plans, I explicitly follow reading plans from the inside out, operation, object, rows, cost and predicates, E-Rows vs A-Rows and Starts and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Execution Plans appears together with logging, auditing, reconciliation and impact analysis.
