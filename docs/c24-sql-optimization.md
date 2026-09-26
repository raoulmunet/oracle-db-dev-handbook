---
title: 'C24. SQL Optimization'
description: 'Complete English handbook chapter based on the original C24 course.'
sidebar_position: 24
---

# C24. SQL Optimization

<div className="chapter-kicker">Chapter C24 · Complete course</div>

Optimization of SQL in Oracle means reducing **the amount of effective work** that the database has to do to execute an SQL: fewer read blocks, fewer unnecessarily processed rows, less CPU, less TEMP, less sorting and less I/O.

The central idea is:

> We do not optimize SQL as it looks like, but after **Execution Plan + actual** execution statistics.

---

## 1. What we want to optimize

For a slow SQL we need to identify where the resources are consumed:

- access to too many lines;
- FULL TABLE SCAN useless;
- inadequate index or missing index;
- inappropriate join;
- Join made too early on big sets;
- misestimates of the optimizer;
- large sorting;
- costly aggregates;
- repeated access to the same table;
- functions applied to indexed columns;
- implicit conversions;
- too many logical reads;
- too much physical I/O;
- Spill in TEMP;
- excessive parsing;
- SQL almost identical generated with different literal values.

---

## 2. First Principle: Measure Before Modify

Don't assume the problem is the index.

A healthy process of tuning is:

```
Slow SQL
   ↓
execution plan
   ↓
A-Rows vs E-Rows
   ↓
Cost of operation
   ↓
Reason
   ↓
SQL / index / statistics change
   ↓
Measurement again
```

In Oracle you can use:

```
SELECT /*+ gather_plan_statistics */
       ...
FROM...
WHERE...;
```

then:

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

This is one of the most useful tools for tuning.

---

## 3. Estimated cost vs real performance

Oracle Optimizer works primarily with **estimates**.

For example:

```
# # # # # # #
|----|--------------------|--------|--------|
3 * TABLE ACCESS FULL *
```

E-Rows = 10

The optimizer estimated that there would be about 10 rows.

A-Rows = 450000

In fact, 450,000 came.

This is a major problem of **cardinality estimate**.

The consequence may be that Oracle chose:

```
NESTED LOOPS
```

although:

```
HASH JOIN
```

it would have been much more effective.

That's why in tuning:

> Large differences between E-Rows and A-Rows are a very important signal.

---

## 4. Selective predictions

One of the most important ideas is **selectivity**.

Suppose:

```
SELECT *
FROM transactions
WHERE transaction_id = 12345;
```

If the transaction_id is unique:

```
1 row out of 100 million
```

The prediction is extremely selective.

An index is probably very useful.

But:

```
SELECT *
FROM transactions
WHERE status = 'ACTIVE';
```

if 90% of the rows are ACTIVE, the index may not help.

Oracle may prefer:

```
TABLE ACCESS FULL
```

Because the query must read most of the table blocks anyway.

---

## 5. Full Table Scan does not automatically mean stupid SQL

A common mistake is:

> I have FULL TABLE SCAN, I have to put the index.

Not necessarily.

For:

```
SELECT SUM (amount)
FROM fact_transactions;
```

on a large table, the Oracle must probably read almost all the rows.

In this case:

```
TABLE ACCESS FULL
```

It could be the right plan.

Same for:

```
SELECT *
FROM customers
WHERE country = 'RO';
```

if 70% of customers are from Romania.

The index becomes especially useful when filtering drastically reduces the number of rows.

---

## 6. Avoid SELECT\ *

For example:

```
SELECT *
FROM transactions
WHERE customer_id =: customer_id;
```

If the application only uses:

```
transaction_id
transaction_date
% 1
```

is better:

```
SELECT transaction_id,
transaction_date,
% 1
FROM transactions
WHERE customer_id =: customer_id;
```

Advantages:

- less data read;
- less data moved through memory;
- less traffic to the application;
- Oracle can sometimes satisfy the query directly from the index.

---

## 7. Do not apply unnecessary functions on indexed columns

Suppose:

```
CREATE INDEX ix_orders_order_date
ON orders (order_date);
```

Query problematic:

```
SELECT *
FROM orders
WHERE TRUNC (order_date) = DATE '2026-09-23';
```

Function:

```
TRUNC (order_date)
```

may prevent the use of the normal index on the order _data.

Better:

```
SELECT *
FROM orders
WHERE order_date = DATE '2026-09-23'
AND order_date; DATE '2026-09-24';
```

This is a very important pattern.

---

## 8. Function - Based Index

If the application has to use:

```
TRUNC (order_date)
```

you can create:

```
CREATE INDEX ix_orders_trunc_date
ON orders (TRUNC (order_date));
```

Then:

```
WHERE TRUNC (order_date) = DATE '2026-09-23'
```

can use the index.

Other example:

```
CREATE INDEX ix_customer_upper_email
ON customers (UPPER (email));
```

for:

```
WHERE UPPER (email) = UPPER (: email);
```

---

## 9. Default Conversions are Dangerous

Suppose:

```
customer_id VARCHAR2 (20)
```

and you write:

```
WHERE customer_id = 12345
```

Oracle can implicitly do something like:

```
TO_NUMBER (customer_id) equals 12345
```

Consequences:

- the index may not be used;
- you can receive ORA-01722;
- performance can drop drastically.

Right:

```
WHERE customer_id = '12345'
```

or:

```
WHERE customer_id =: customer_id
```

when the bind variable has the correct data type.

---

## 10. Avoid functions on columns in JOIN

Problem:

```
SELECT...
FROM customers c
JOIN transactions t
ON TO_CHAR (c.customer_id) = t.customer_id;
```

Better let the columns have compatible types:

```
c.customer_id NUMBER
t.customer_id NUMBER
```

and:

```
ON c.customer_id = t.customer_id
```

Joins can be expensive when they process large volumes of data.

---

## 11. Filter as early as possible

Suppose:

```
Transactions = 500 million rows
Customers = 5 million
```

You just want the transactions from the last day.

Conceptual is more effective to reduce the set:

```
SELECT...
FROM (
SELECT *
FROM transactions
WHERE transaction_date = SYSDATE - 1
) t
JOIN customers c
ON c.customer_id = t.customer_id;
```

The optimizer can perform this transformation through **predicate pushdown**, but the important idea remains:

> the fewer rows the joinks and aggregates, the better.

---

## 12. JOIN just what you need

Query problematic:

```
SELECT t.transaction_id,
t
FROM transactions t
JOIN customers c
ON c.customer_id = t.customer_id;
```

If no columns from the customer table are used and the join does not filter or validate anything required, the join may be unnecessary.

Simple:

```
SELECT transaction_id,
% 1
FROM transactions;
```

In real systems, some queries accumulate unnecessary joins over time.

---

## 13. EXISTS vs IN vs JOIN

For example:

```
SELECT c. *
FROM customers c
WHERE EXISTS (
SELECT 1
FROM transactions t
WHERE t.customer_id = c.customer_id
);
```

It's very appropriate when the question is:

> Is there at least one transaction?

We don't need all the transactions.

Sometimes people write:

```
SELECT DISTINCT c *
FROM customers c
JOIN transactions t
ON t.customer_id = c.customer_id;
```

This query can generate millions of intermediate rows and then do:

```
SORT UNIQUE
```

for DISTINCT.

EXISTS expresses the intention more correctly.

---

## 14. Attention to DISTINCT

DISTINCT is sometimes used as a patch:

```
SELECT DISTINCT...
```

Because a join produces duplicates.

But surgery can involve:

```
SORT UNIQUE
```

or:

```
HASH UNIQUE
```

on millions of rows.

The question must be:

> Why are there duplicates?

Maybe the problem is the join:

```
A
JOIN B
JOIN C
```

where a relationship 1: N multiplies rows.

---

## 15. UNION vs UNION ALL

UNION removes duplicates:

```
SELECT customer_id FROM source_a
UNION
SELECT customer_id FROM source_b;
```

and may require:

```
SORT UNIQUE
```

or hash.

If duplicates are acceptable or impossible:

```
UNION ALL
```

is usually faster:

```
SELECT customer_id FROM source_a
UNION ALL
SELECT customer_id FROM source_b;
```

For ETL/DWH, the difference can become very important.

---

## 16. Avoid unnecessary sorting

For example:

```
SELECT *
FROM (
SELECT *
FROM transactions
ORDER BY transaction_date
);
```

if the outside query doesn't need that order.

Or:

```
INSERT INTO staging_transactions
SELECT *
FROM source_transactions
ORDER BY transaction_date;
```

The order is not physically guaranteed in the table and sorting can be completely unnecessary.

---

## 17. Optimize aggregation

Query:

```
SELECT customer_id,
SUM (amount)
FROM transactions
GROUP BY customer_id;
```

On hundreds of millions of rows it can be expensive.

If the information is constantly accessed, you can consider:

- incremental aggregation;
- summary table,
- Materialized View;
- partitioning;
- query rewrite.

For example:

```
CREATE MATERIALIZED VIEW mv_customer_sales
BUILD IMMEDIATE
REFRESH FAST
AS
SELECT customer_id,
SUM (amount) total_amount,
COUNT (*)
FROM transactions
GROUP BY customer_id;
```

---

## 18. The indexes must be chosen after the workload

Suppose:

```
SELECT *
FROM transactions
WHERE customer_id =: customer_id
AND transaction_date
```

A possible index:

```
CREATE INDEX ix_trans_customer_date
ON transactions (customer_id, transaction_date);
```

It can be much more effective than two separate indexes:

```
(customer_id)
(transaction_date)
```

But the order of the columns matters.

---

## 19. Compound index and order of columns

Index:

```
CREATE INDEX ix_test
ON transactions (customer_id, transaction_date);
```

It's very good for:

```
WHERE customer_id =:
```

or:

```
WHERE customer_id =:
AND transaction_date
```

But less useful for:

```
WHERE transaction_date
```

because the first column of the index is:

```
customer_id
```

This is the concept of **leading in**.

---

## 20. Covering index

Suppose:

```
SELECT transaction_date,
% 1
FROM transactions
WHERE customer_id =: id;
```

An index:

```
CREATE INDEX ix_trans_customer
ON transactions (customer_id);
```

Find the ROWID-uri, but the Oracle must then access the table.

If you have:

```
CREATE INDEX ix_trans_customer_cover
ON transactions (
customer_id,
transaction_date,
% 1
);
```

Oracle can sometimes get all the information directly from the index.

The plan may avoid:

```
TABLE ACCESS BY INDEX ROWID
```

But we don't have to turn every index into a gigantic index: the cost of DML and space is growing.

---

## 21. NESTED LOOPS vs HASH JOIN

Example OLTP:

```
CUSTOMERS filtered → 1 row
Indexed TRANSACTIONS
```

Very good plan:

```
NESTED LOOPS
```

for each client we quickly find the transactions.

But in an DWH:

```
FACT_SALES = 1 billion
DIM_CUSTOMER = 10 million
```

may be more appropriate:

```
HASH JOIN
```

to process large volumes.

Conceptual rule:

```
few rows + good index
        ↓
NESTED LOOPS

large sets
        ↓
HASH JOIN
```

But the final choice must be confirmed by plan and statistics.

---

## 22. Attention to correlated subqueries

Example:

```
SELECT c.customer_id,
(
SELECT SUM (t.amount)
FROM transactions t
WHERE t.customer_id = c.customer_id
) total_amount
FROM customers c;
```

Conceptually, the subquery depends on each client.

An alternative may be:

```
SELECT c.customer_id,
SUM (t.amount)
FROM customers c
LEFT JOIN transactions t
ON t.customer_id = c.customer_id
GROUP BY c.customer_id;
```

But there is no absolute rule that the subquery is slower; Oracle can transform the query.

We need to check out the real plan.

---

## 23. Avoid PL/SQL row-by-row for SQL operations

Problem:

```
FOR r IN
SELECT *
FROM source_transactions
) LOOP

INSERT INTO target_transactions (...)
VALUES (...);

END LOOP;
```

If you can:

```
INSERT INTO target_transactions (...)
SELECT...
FROM source_transactions;
```

It's almost always preferable.

Classic Oracle Principle:

> **Set-based SQL before row-byrow processing.**

Or the familiar expression:

> | Slow-by-slow processing |

---

## 24. MERGE for ETL

Instead of:

```
SELECT if any
UPDATE if any
INSERT if not available
```

you can use:

```
MERGE INTO dwh_customer
USING staging_customer
ON (
d.source_customer_id = s.source_customer_id
)
WHEN MATCHED THEN
UPDATE SET
d.customer_name = s.customer_name
WHEN NOT MATCHED THEN
INSERT (
customer_id,
source_customer_id,
customer_name
)
VALUES (
customer_seq.NEXTVAL,
s.source_customer_id,
s.customer_name
);
```

It's a very important pattern in ETL.

---

## 25. Partition Pounding

Suppose:

```
FACT_TRANSACTIONS
```

is partitioned monthly after:

```
transaction_date
```

Query:

```
SELECT SUM (amount)
FROM fact_transactions
WHERE transaction_date = DATE '2026-09-01'
AND transaction_date; DATE '2026-10-01';
```

Oracle can only read the partition for September.

The plan can show:

```
PARTITION RANGE SINGLE
```

instead of reading the whole table.

This is:

> **Partition Pounding**

Extremely important in DWH.

---

## 26. How can you ruin Partition Pounding

Problem:

```
WHERE TO_CHAR (transaction_date, 'YYYY-MM') = '2026-09'
```

Better:

```
WHERE transaction_date = DATE '2026-09-01'
AND transaction_date; DATE '2026-10-01';
```

The second version is semantically clearer and allows the optimizer to identify the partition more easily.

---

## 27. Statistics are essential

The optimizer needs information about:

```
row number
number of distinct values
distribution of values
nulls
size
```

Collection of statistics:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "'DWH',"
Tabnames = "'FACT_TRANSACTIONS'"
waterfalls = TRUE
);
END;
/
```

If the statistics are old, the optimizer can make completely wrong estimates.

---

## 28. Histograms

Let's assume the column:

```
STATUS
```

has the distribution:

```
ACTIVE 95%
CANCELLED 4%
ERROR 1%
```

Without a histogram, the optimizer may assume a more uniform data distribution.

But:

```
WHERE status = 'ERROR'
```

is very selective.

In such cases, histogram can help optimizer to better estimate cardinality.

---

## 29. Bind Variables

Instead of:

```
SELECT *
FROM custodian
WHERE customer_id = 1001;

SELECT *
FROM custodian
WHERE customer_id = 1002;

SELECT *
FROM custodian
WHERE customer_id = 1003;
```

use:

```
SELECT *
FROM custodian
WHERE customer_id =: customer_id;
```

Benefit:

```
single SQL
       ↓
single reusable cursor
       ↓
less hard parsing
```

In OLTP applications this is very important.

---

## 30. LIKE '%text%'

Query:

```
WHERE customer_name LIKE '%BANK%'
```

an ordinary B-tree index is not very useful, because the beginning of value is not known.

Instead:

```
WHERE customer_name LIKE 'BANK%'
```

can use a much better index.

It can then look up the range:

```
BANK...
```

---

## 31. NOT IN and NULL

Query:

```
SELECT *
FROM customers
WHERE customer_id NOT IN (
SELECT customer_id
FROM blocked_customers
);
```

If the subquery contains an NULL, the result can be surprising.

In many situations it is safer:

```
SELECT *
FROM customers c
WHERE NOT EXISTS (
SELECT 1
FROM blocked_customers b
WHERE b.customer_id = c.customer_id
);
```

This pattern is relevant for both fairness and tuning.

---

## 32. Optimize according to the lines running through the plan

Consider:

```
Table Scan 100,000,000 rows
        ↓
Join 80,000,000
        ↓
Filter 1,000
```

Here the problem is obvious.

The filter that reduces to 1,000 rows is applied too late.

Ideal:

```
Filter 1,000
        ↓
Join 1,000
```

One of the best questions when you read the plan is:

> How many rows enter and leave each operation?

---

## 33. Logical Reads

A query can be slow even if it doesn't read from the disk.

Oracle may have the data in the cache buffer.

However, if it does:

```
10,000,000 Buffer Gets
```

This means the operation processes many blocks.

Therefore:

```
buffer gets
```

are very important in tuning.

An optimised query may, for example, pass from:

```
2.500,000 logical reads
```

at:

```
3,000 logical reads
```

And the difference can be enormous.

---

## 34. TEMP usage

Operations such as:

```
SORT
HASH JOIN
HASH GROUP BY
DISTINCT
ORDER BY
```

They can require a lot of memory.

If the available memory is not sufficient, Oracle can write in:

```
TEMP tablespace
```

That's when much more expensive operations occur.

A SQL statement with:

```
5 million rows → SORT
```

can become very slow.

---

## 35. CTE = WITH

Example:

```
WITH recent_transactions AS (
SELECT *
FROM transactions
WHERE transaction_date = SYSDATE - 30
)
SELECT...
FROM recent_transactions rt
JOIN customers c
ON c.customer_id = rt.customer_id;
```

CTE- can make SQL more legible.

But:

> CTE does not automatically mean materialisation.

The optimizer may:

- CTE- inline;
- materialize the result;
- Turn the query.

The decision is in the plan.

---

## 36. Hints is the last instrument, not the first

Examples:

```
* + INDEX (t ix_transactions_customer) * /
```

```
* + FULL (t) * /
```

```
* + USE_HASH (t c) * /
```

```
* + USE_NL (t) * /
```

Hints are useful for:

- Diagnostic;
- testing;
- well-controlled situations.

But it shouldn't be used immediately.

The correct order is usually:

```
SQL correct
↓
correct statistics
↓
correct indexes
↓
correct cardinality
↓
only then hints if necessary
```

---

## 37. Practical investigation pattern

You SQL statement:

```
SELECT c.customer_name,
SUM (t.amount)
FROM customers c
JOIN transactions t
ON t.customer_id = c.customer_id
WHERE TRUNC (t.transaction_date) = DATE '2026-09-23'
GROUP BY c.customer_name;
```

Run:

```
SELECT /*+ gather_plan_statistics */
c.customer_name,
SUM (t.amount)
FROM customers c
JOIN transactions t
ON t.customer_id = c.customer_id
WHERE TRUNC (t.transaction_date) = DATE '2026-09-23'
GROUP BY c.customer_name;
```

then:

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

Observe:

```
TABLE ACCESS FULL TRANSACTIONS
A-Rows = 250,000,000
```

First suspicion:

```
TRUNC (t.transaction_date)
```

You're rewriting:

```
WHERE t.transaction_date = DATE '2026-09-23'
AND t.transaction_date - DATE '2026-09-24'
```

If there is an index:

```
CREATE INDEX ix_trans_date
ON transactions (transaction_date);
```

or the table is partitioned after date, the plan can become dramatically better.

---

## 38. Example DWH

We have:

```
FACT_TRANSACTION 2 billion
DIM_CUSTOMER 10 million
DIM_ACCOUNT 5 million
```

Query:

```
SELECT c.country,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_key = f.customer_key
WHERE f.transaction_date = DATE '2026-09-01'
GROUP BY c.country;
```

A good DWH plan may involve:

```
PARTITION RANGE
        ↓
TABLE ACCESS FULL FACT partition
        ↓
HASH JOIN
        ↓
HASH GROUP BY
```

It shouldn't scare us:

```
TABLE ACCESS FULL
```

because it can only be about one of the partitions.

Here the real optimization can come from:

```
partition pruning
parallel execution
compression
correct statistics
hash joins
partition-wise joins
materialized views
```

not necessarily from indexes.

---

## 39. OLTP vs DWH

### OLTP

Characteristics:

```
few rows
many queries
very low latency
```

You often prefer:

```
INDEUNIQUE SCAN
INDERANGE SCAN
NESTED LOOPS
bind variables
```

### DWH

Characteristics:

```
very large volumes
scans
aggregation
large joins
```

You often prefer:

```
TABLE ACCESS FULL
partition pruning
HASH JOIN
HASH GROUP BY
parallelism
materialized views
```

The same type of plan is not optimal for both.

---

## 40. Quick checklist of SQL tuning

When you get a slow SQL, check roughly in this order:

1. **Execution Plan**
2. A-Rows vs E-Rows
3. where most of the rows are processed
4. access to tables: FULL SCAN / index
5. predicate
6. implicit conversions
7. column functions
8. Joins
9. order and cardinality of joins
10. statistics
11. indexes
12. partition pruning
13. sorting / DISTINCT
14. TEMP
15. logical read
16. bind variables
17. SQL rewritten
18. measurement again.

---

## 42. Exercise for Oracle 26ai

We assume:

```
CREATE TABLE sql_tuning_test AS
SELECT level id,
MOD (level, 10000) customer_id,
TRUNC (SYSDATE) - MOD (level, 365) transaction_date,
ROUND (DBMS_RANDOM.VALUE (1,10000), 2) amount
FROM dual
CONNECT BY level = 1000000;
```

Create index:

```
CREATE INDEX ix_tuning_customer
ON sql_tuning_test (customer_id);
```

Test:

```
SELECT /*+ gather_plan_statistics */
*
FROM sql_tuning_test
WHERE customer_id = 123;
```

then:

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

Compare with:

```
SELECT /*+ gather_plan_statistics */
*
FROM sql_tuning_test
WHERE MOD (customer_id, 100) returns 23;
```

Notice the difference in access path.

Then test:

```
CREATE INDEX ix_tuning_date
ON sql_tuning_test (transaction_date);
```

and compare:

```
WHERE TRUNC (transaction_date) = TRUNC (SYSDATE)
```

with:

```
WHERE transaction_date = TRUNC (SYSDATE)
AND transaction_date; TRUNC (SYSDATE) + 1;
```

This is a very good exercise to see directly the effects of optimization.

---

## 43. The fundamental idea to remember

In Oracle SQL tuning, the most important questions are:

```
How many rows does Oracle read?
        ↓
How many rows should the optimizer read?
        ↓
How does it get to them?
        ↓
Why did the optimizer choose that plan?
```

The objective is not to:

```
to use index
```

but:

```
to process as little data as possible
with the most effective strategy.
```

And the connection to the previous modules is direct:

```
Statistics
     ↓
Optimizer
     ↓
execution plan
     ↓
Indexes / Partitioning
     ↓
Join Algorithms
     ↓
SQL Tuning
```

Basically, **Optimization SQL is the point where all concepts in modules 10 and 23 meet.**

---

## Questions and answers

### How do you approach a slow Oracle query?

A good answer:

> Start by getting the actual execution plan with DBMS_XPLAN.DISPLAY_CURSOR and ALLSTATS LAST. Compare E-Rows with A-Rows to identify possible problems of cardinality. I then check operations that process the most rows, types of access path and join algorithms. I analyze predicates, statistics, indexes, partition pruning and possible implicit conversions. After each change I compare the actual plan and statistics again.

---

### Is FULL TABLE SCAN bad?

> No. For small tables or when the query has to read much of a table, Full Table Scan can be more effective than access through the index. In an DWH is even very common, especially along with partition pruning and hash joins.

---

### What is the most important information in the plan?

There isn't one, but very important are:

```
A-Rows
E-Rows
Starts
Buffers
A-Time
```

and the relationship between them.

---

### Why can the optimizer choose a bad plan?

Possible reasons:

```
old statistics
misestimates
data skew
missing histograms
bind peeking / bind sensitivity
the correlation of columns
implicit conversions
SQL difficult to estimate
```

---

### How would you briefly explain SQL Optimization to a colleague who knows SQL, but not this area?

SQL optimization covers measure before changing, understand business grain and expected row counts, inspection current execution plans. In practice, first, I determine what data enters and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to SQL Optimization?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For SQL Optimization, I explicitly follow the measure before changing, understand business grain and expected row counts, current inspection execution plans and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, SQL Optimization appears along with logging, auditing, reconciliation and impact analysis.
