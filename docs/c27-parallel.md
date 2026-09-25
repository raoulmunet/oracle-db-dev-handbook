---
title: 'C27. Parallel Execution'
description: 'Complete English handbook chapter based on the original C27 course.'
sidebar_position: 27
---

# C27. Parallel Execution

<div className="chapter-kicker">Chapter C27 · Complete course</div>

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

maybe return one line.

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

### How would you briefly explain Parallel Execution to a colleague who knows SQL, but not this area?

Parallel Execution covers query coordinator and PX servers, degree of parallelism (PDO), PX SEND / RECEIVE and redistribution. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Parallel Execution?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For Parallel Execution, I explicitly follow query coordinator and PX servers, degree of parallelism (PDO), PX SEND / RECEIVE and redistribution and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Parallel Execution appears together with logging, auditing, reconciliation and impact analysis.
