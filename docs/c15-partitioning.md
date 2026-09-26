---
title: 'C15. Partitioning'
description: 'Complete English handbook chapter based on the original C15 course.'
sidebar_position: 15
---

# C15. Partitioning

<div className="chapter-kicker">Chapter C15 · Complete course</div>

Partitioning is one of the most important Oracle techniques for **very large tables**, especially in **Data Warehouse**, ETL and systems that preserve years of history.

The basic idea is simple:

> A table remains logically a single table, but its data is physically divided into segments called **partitions**.

For a Data Developer Oracle, the most important concepts are:

**RANGE / INTERVAL → LIST → HASH → composite partitioning → partition pruning → local / global indexes → partition-wise joins → partition maintenance → EXCHANGE PARTITION.**

---

## 15.1 Why do we need partitioning?

Suppose we have:

```
FACT_TRANSACTION
----------------
5 billion transactions
2018 → 2026
```

Most reports ask:

```
WHERE transaction_date >= DATE '2026-09-01'
  AND transaction_date <  DATE '2026-10-01'
```

Without partitioning, Oracle may be forced to examine a very large amount of data.

With monthly partitioning:

```
FACT_TRANSACTION
│
− P2026_07
− P2026_08
− P2026_09
− P2026_10
└── ...
```

Oracle can only read:

```
P2026_09
```

This is **partition pruning**.

---

## 15.2. Partitioned table = one logical table, multiple physical segments

The application continues to execute:

```sql
SELECT *
FROM fact_transaction;
```

Applications do not need to know which partition contains the data.

Oracle automatically decides which partitions need to be accessed.

Conceptual:

```
FACT_TRANSACTION
                        │
       ┌────────────────┼────────────────┐
       │                │                │
P2026_07 P2026_09
       │                │                │
segment segment segment
```

---

## 15.3. RANGE partitioning

It's probably the most important type for DWH.

Use it when data is divided into ordered ranges such as:

- date;
- accounting period;
- number;
- time-based IDs.

Example:

```sql
CREATE TABLE fact_transaction
(
transaction_id NUMBER,
transaction_date DATE,
customer_id NUMBER,
account_id NUMBER,
amount NUMBER(15,2)
)
PARTITION BY RANGE (transaction_date)
(
PARTITION p2026_01 VALUES LESS THAN (DATE '2026-02-01'),
PARTITION p2026_02 VALUES LESS THAN (DATE '2026-03-01'),
PARTITION p2026_03 VALUES LESS THAN (DATE '2026-04-01')
);
```

Important:

```
VALUES THAN
```

defines an exclusive upper **boundary**.

Therefore:

```
P2026_02

= 2026-02-01
contains dates from 2026-02-01 up to, but not including, 2026-03-01.
```

---

## 15.4. Where does a row go?

For:

```sql
INSERT INTO fact_transaction
VALUES (
1001,
DATE '2026-02-15',
10,
20,
1500
);
```

Oracle evaluates:

```
transaction_date = 15-Feb-2026
```

and automatically sends the row to:

```
P2026_02
```

The application does not need to specify the partition.

---

## 15.5. PARTITION MAXVALUE

We can define a catch-all partition:

```
PARTITION p_future VALUES LESS THAN (MAXVALUE)
```

Example:

```
PARTITION BY RANGE (transaction_date)
(
PARTITION p2026_01 VALUES LESS THAN (DATE '2026-02-01'),
PARTITION p2026_02 VALUES LESS THAN (DATE '2026-03-01'),
PARTITION p_future VALUES LESS THAN (MAXVALUE)
);
```

It is useful to avoid error:

```
ORA-14400: inserted partition key does not map to any partition
```

But for large DWH systems, **INTERVAL partitioning** is often a more elegant solution.

---

## 15.6. INTERVAL partitioning

Oracle can automatically create new partitions.

Monthly example:

```sql
CREATE TABLE fact_transaction
(
transaction_id NUMBER,
transaction_date DATE,
customer_id NUMBER,
amount NUMBER
)
PARTITION BY RANGE (transaction_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
(
PARTITION p_initial
VALUES LESS THAN (DATE '2026-01-01')
);
```

If it occurs:

```
transaction_date = DATE '2026-09-15'
```

Oracle can automatically create the required partition.

For a DWH with monthly loads, this is a very important pattern.

---

## 15.7. LIST partitioning

LIST is useful when the key has a relatively small number of discrete values.

For example:

```
COUNTRY_CODE
REGION
SOURCE_SYSTEM
BUSINESS_UNIT
```

Example:

```sql
CREATE TABLE sales
(
sale_id NUMBER,
country_code VARCHAR2 (2),
amount NUMBER
)
PARTITION BY LIST (country_code)
(
PARTITION p_ro VALUES ('RO'),
PARTITION p_fr VALUES ('FR'),
PARTITION p_de VALUES ('DE')
);
```

We can also have:

```
PARTITION p_other VALUES (DEFAULT)
```

---

## 15.8. HASH partitioning

HASH partitioning distributes data approximately evenly between partitions.

```sql
CREATE TABLE customer_transaction
(
transaction_id NUMBER,
customer_id NUMBER,
amount NUMBER
)
PARTITION BY HASH (customer_id)
PARTITIONS 8;
```

Oracle calculates internally something conceptually similar to:

```
hash (customer_id)
```

and chooses one of the 8 partitions.

Main advantage:

```
relatively uniform distribution of data
```

It is useful for:

- very large volumes;
- parallelism;
- reduction of hotspots;
- partition-wise joins.

---

## 15.9. RANGE vs. LIST vs. HASH

| Partitioning method | Best suited for |
| --- | --- |
| RANGE | Values in ordered ranges, such as dates |
| LIST | A defined set of discrete values |
| HASH | Distributing rows across partitions |
| Composite | Combines the advantages of multiple partitioning methods |

For a fact table DWH, very common:

```
RANGE (transaction_date)
```

or:

```
RANGE (transaction_date)
+
HASH (customer_id)
```

---

## 15.10 Composite partitioning

Oracle allows partitions + subpartitions.

Conceptual example:

```
RANGE (transaction_date)
       +
HASH (customer_id)
```

Structure:

```
FACT_TRANSACTION

P2026_08
− SP1
− SP2
− SP3
- SP4

P2026_09
− SP1
− SP2
− SP3
- SP4
```

Example:

```sql
CREATE TABLE fact_transaction
(
transaction_id NUMBER,
transaction_date DATE,
customer_id NUMBER,
amount NUMBER
)
PARTITION BY RANGE (transaction_date)
SUBPARTITION BY HASH (customer_id)
SUBPARTITIONS 4
(
PARTITION p2026_08
VALUES LESS THAN (DATE '2026-09-01'),

PARTITION p2026_09
VALUES LESS THAN (DATE '2026-10-01')
);
```

---

## 15.11 Why compose partitioning?

Imagine:

```
FACT_TRANSACTION = 10 billion rows
```

Monthly partitioning:

```
P2026_09 = 300 million rows
```

Even that partition can be great.

With hash subpartitioning:

```
P2026_09
- - SP1 - 75M
- - SP2 - 75M
- - SP3 - 75M
- - SP4 - 75M
```

This can especially help parallel execution and joins.

---

## 15.12 Partition pruning

This is probably the most important concept of **for reviewing and tuning**.

Query:

```sql
SELECT SUM(amount)
FROM fact_transaction
WHERE transaction_date = DATE '2026-09-01'
AND transaction_date; DATE '2026-10-01';
```

If the table is partitioned monthly after:

```
transaction_date
```

The Oracle can eliminate all other partitions.

Conceptual:

```
P2026_01
P2026_02
...
P2026_08
P2026_09
P2026_10
```

This is:

> **partition pressing**

---

## 15.13 How to Identify Partition Pruning in an Execution Plan

```sql
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY
);
```

You can see:

```
PARTITION SINGLE
TABLE ACCESS FULL FACT_TRANSACTION
```

or:

```
PARTITION ITERATOR
TABLE ACCESS FULL FACT_TRANSACTION
```

The important columns are:

```
Pstart
Pstop
```

Example:

```
* Operation *
|--------------------------|--------|-------|
```

It means Oracle is accessing only one partition.

---

## 15.14 PARTITION RANGE SINGLE

If exactly one partition is required:

```
PARTITION SINGLE
```

Example:

```
WHERE transaction_date >= DATE '2026-09-01'
  AND transaction_date <  DATE '2026-10-01'
```

For monthly partitioning, Oracle can only access:

```
P2026_09
```

---

## 15.15 PARTITION RANGE ITERATOR

If more than one partition needs to be read:

```
WHERE transaction_date = DATE '2026-07-01'
AND transaction_date - DATE '2026-10-01'
```

Oracle can access:

```
JUL
AUG
SEP
```

The plan may contain:

```
PARTITION ITERATOR
```

---

## 15.16 Predicts must allow the pruning

Preferably:

```
WHERE transaction_date >= DATE '2026-09-01'
  AND transaction_date <  DATE '2026-10-01'
```

A common anti-pattern:

```
WHERE TO_CHAR (transaction_date, 'YYYY-MM') = '2026-09'
```

or:

```
WHERE TRUNC (transaction_date) = DATE '2026-09-15'
```

Functions on the partitioning key can make it more difficult to optimize and prevent certain forms of pruning.

The general principle is the same as in indexes:

> Simple predicts and SARGable are preferable.

---

## 15.17 Partitioning does not automatically mean performance

That's a classic technical review question.

A partitioned table does not automatically become faster.

If we execute:

```sql
SELECT SUM(amount)
FROM fact_transaction;
```

And you need to read all the data, Oracle can access all the partitions.

The advantage occurs when the workshop allows:

```
partition pruning
```

or when partitioning helps:

```
maintenance
parallelism
ETL
partition-wise joins
```

---

## 15.18 Partition pruning vs index

There are two different mechanisms.

Partition pruning:

```
remove whole partitions
```

Index:

```
Find the rows inside the remaining data
```

They can work together.

For example:

```
1. Oracle eliminates 119 of 120 partitions
2. in the remaining partition uses an index
```

Conceptual plan:

```
PARTITION SINGLE
INDEX RANGE SCAN IDX_FACT_CUSTOMER
```

---

## 15.19 Local indexes

A local **index** follows the partition structure of the table.

Table:

```
P_JAN
P_FEB
P_MAR
```

Index:

```
IDX_JAN
IDX_FEB
IDX_MAR
```

Creation:

```sql
m=>m_fact_customer
ON fact_transaction (customer_id)
LOCAL;
```

Very important advance:

> Each table partition has its own index partition.

This greatly simplifies ETL operations and maintenance.

---

## 15.20 Global indexes

A global index shall not respect the partition of the table.

Conceptual:

```
TABLE

P_JAN
P_FEB
P_MAR

        ↓

GLOBAL INDEX
------------------
all rows
```

Advantage:

can be very effective for interrogations looking independently of the partitioning key.

Disadvantage:

certain operations on partitions may require maintenance of the global index.

---

## 15.21 Local vs global index

| Aspect | Local index | Global index |
| --- | --- | --- |
| Alignment | Aligned with table partitions | Independent of table partitions |
| Typical use | Common in DWH; supports partition pruning | Useful for access across partitions |
| Maintenance | Simpler to maintain | More complex to maintain |
| ETL | Often useful for partition-based ETL | Sometimes needed for global lookups |

In a large DWH, local **indexes** are very common.

---

## 15.22 Local prefixed vs non-prefixed index

There is a more advanced distinction.

If the table is partitioned after:

```
transaction_date
```

a local index:

```
(transaction_date, customer_id)
```

is the local **prefixed** because the partitioning key is at the beginning.

But:

```
(customer_id)
```

may be a local non-prefixed** index.

Both can be useful, depending on the workload.

---

## 15.23 Partition-wise joins

Partitioning can accelerate joins between two big tables.

For example:

```
FACT_TRANSACTION
PARTITION BY HASH (customer_id)

CUSTOMER_ACTIVITY
PARTITION BY HASH (customer_id)
```

Oracle can do conceptually:

```
FACT P1 JOIN ACTIVITY P1
FACT P2 JOIN ACTIVITY P2
FACT P3 JOIN ACTIVITY P3
FACT P4 JOIN ACTIVITY P4
```

instead of a single giant join.

This is:

> **partition-wise join**

---

## 15.24 Full partition-wise join

When both tables are partitioned compatible with the same key:

```
T1 P1 ↔ T2 P1
T1 P2 ↔ T2 P2
T1 P3 ↔ T2 P3
```

Oracle can process the pairs independently.

It's very suitable for parallel execution.

---

## 15.25 Partial partitional-wise join

If only one of the tables is properly partitioned, Oracle can redistribute data from the other table.

It is less effective than full partition-wise join, but can still be useful.

---

## 15.26 Partition maintenance operations

A major advantage of partitioning is not only the performance of queries, but also administration.

We can:

```
ADD PARTITION
DROP PARTITION
TRUNCATE PARTITION
MOVE PARTITION
SPLIT PARTITION
MERGE PARTITIONS
EXCHANGE PARTITION
```

without manipulating the entire table.

---

## 15.27 DROP PARTITION

We assume that the retention policy is:

```
7 years
```

We can eliminate an old period:

```sql
ALTER fact_transaction
DROP PARTITION p2018_01;
```

Instead of:

```sql
DELETE fact_transaction
WHERE transaction_date
AND transaction_date,
```

For hundreds of millions of rows, the operational difference can be enormous.

---

## 15.28 TRUNCATE PARTITION

We can empty a partition:

```sql
ALTER fact_transaction
TRUNCATE PARTITION p2026_09;
```

Very useful if an ETL batch needs to be redone.

Pattern:

```
wrong load
   ↓
TRUNCATE PARTITION
   ↓
reload
```

---

## 15.29 EXCHANGE PARTITION

This is one of the most important DWH squares.

We have the staging table:

```
STG_FACT_TRANSACTION
```

We're uploading the data there for September.

We validate them:

```
count
sum
duplicates
data quality
reconciliation
```

Then:

```sql
ALTER fact_transaction
EXCHANGE p2026_09
WITH TABLE stg_fact_transaction;
```

Conceptual:

```
STAGING VALIDAT
      │
| | |
      ↓
FACT_TRANSACTION.P2026_09
```

Instead of moving millions of rows one by one, we can change the association of segments.

---

## 15.30 Patterson DWH very important

A very good pipeline is:

```
SOURCE
   ↓
STAGING
   ↓
TRANSFORM
   ↓
VALIDATE
   ↓
RECONCILE
   ↓
EXCHANGE PARTITION
   ↓
FACT TABLE
```

It is extremely useful in DWH-uri with loads:

```
daily
monthly
periodic
```

---

## 15.31 Why is EXCHANGE PARTITION so valuable?

Because it allows:

- contained loading;
- pre-publication testing;
- very small downtime;
- simpler operational rollback;
- quick publication of a large volume.

It's one of the squares that's worth knowing as well as Data Developer.

---

## 15.32 Statistics on partitioned tables

Oracle can keep statistics:

```
GLOBAL
PARTITION
SUBPARTITION
```

You can see:

```sql
SELECT
partition_name,
num_rows,
Blocks
FROM user_tab_partitions
WHERE table_name = 'FACT_TRANSACTION';
```

In DWH, this is important because often:

```
119 partitions = unchanged
1 partition = just loaded
```

We don't necessarily want to recalculate the entire table.

---

## 15.33 Incremental Statistics

For very large partitioned tables, Oracle can use **incremental statistics**.

The idea:

```
New partition statistics
        +
existing statistics
        ↓
global statistics
```

Instead of rescanning all partitions of the table.

This is very useful after:

```
partition load
EXCHANGE PARTITION
```

---

## 15.34 Partitioning + parallel execution

Partitions provide natural work units for parallel execution.

Conceptual example:

```
PX Server 1 → P1
PX Server 2 → P2
PX Server 3 → P3
PX Server 4 → P4
```

This is very important in OLAP and DWH.

But:

> More partitions do not automatically mean more performance.

There must be enough suitable volume and workload.

---

## 15.35 Partitioning in a Star Schema

A very common design:

```
FACT_TRANSACTION
PARTITION BY RANGE (transaction_date)
```

and dimensions:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_PRODUCT
DIM_DATE
```

can be much smaller and does not require mandatory partitioning.

Reason:

It is the face of the tablet that may have:

```
billions of rows
```

and is frequently filtered after the period.

---

## 15.36 Example DWH bank

Suppose:

```
FACT_ACCOUNT_TRANSACTION

transaction_id
transaction_date
account_key
customer_key
transaction_type_key
% 1
currency_key
```

Volume:

```
3 billion transactions
```

Design:

```
PARTITION BY RANGE (transaction_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
```

Local index:

```
account_key
customer_key
transaction_type_key
```

Query:

```sql
SELECT
customer_key,
SUM(amount)
FROM fact_account_transaction
WHERE transaction_date >= DATE '2026-09-01'
  AND transaction_date <  DATE '2026-10-01'
GROUP BY customer_key;
```

Oracle can do:

```
partition pruning
       ↓
September partition
       ↓
parallel full scan
       ↓
hash aggregation
```

This can be a perfectly reasonable plan for DWH.

---

## 15.37 Full table scan is not necessarily bad

If the plan shows:

```
PARTITION SINGLE
TABLE ACCESS FULL FACT_TRANSACTION
```

doesn't automatically mean we have a problem.

If the partition contains:

```
50 million rows
```

and the query needs:

```
30 million
```

A full scan of **to a single** partition can be much more effective than access by index.

You need to read the plan in context:

```
How many partitions?
How many rows?
What selectivity?
What I/O?
```

---

## 15.38 Overpartitioning

We must not create excessively small partitions.

Problem example:

```
5 years
×
365 days
×
24 hours
```

may result in thousands or tens of thousands of unnecessary partitions.

Partitioning must be chosen after:

```
query squares
load frequency
retention
maintenance
volumes
```

Not just by the total volume.

---

## 15.39 Choice of partitioning key

A very important question.

We don't pick the key just because it has many values.

The key must reflect the workload.

For:

```
WHERE transaction_date BETWEEN...
```

is natural:

```
transaction_date
```

If the business operates for accounting periods:

```
accounting_period
```

It can be even more appropriate.

The following should be considered:

```
query predicates
ETL loads
retention policy
purging
joins
parallelism
```

---

## 15.40 Partition pruning static vs dynamic

Simplified, the infant can be determined:

### Static

Oracle knows the partition directly from the prediction.

```
WHERE transaction_date >= DATE '2026-09-01'
  AND transaction_date <  DATE '2026-10-01'
```

### Dynamic

The required partition can be determined during execution, for example in certain joins.

In the execution plan, Pstart / Pstop may also appear in forms such as:

```
KEY
```

instead of fixed numbers.

---

## 15.41 Partitioning and constraints

Partitioning shall not replace:

```
PK
FK
UNIQUE
CHECK
NOT NULL
```

It's a technique of physical data organization.

It must be mentally separated from data integrity.

---

## 15.42 Partitioning vs sharing

They're different concepts.

Partitioning:

```
single Oracle base
one logical table
multiple segments
```

SHARDING:

```
data distributed on multiple bases / nodes
```

Partitioning is primarily an internal mechanism for organising the table.

---

## 15.43 Troubleshooting is not doing pruning

We assume a month's query is slow.

First verification:

```sql
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (NULL, NULL, 'ALLSTATS LAST')
);
```

I'm looking for:

```
Pstart
Pstop
PARTITION RANGE
```

If I see a lot of partitions being accessed, I'll check:

1. the column in WHERE;
2. Key functions applied;
3. default conversions;
4. data types;
5. bind variables;
6. statistics;
7. Partitioning design.

Mental Pattern:

```
Predicted
   ↓
Pruning?
   ↓
Partitions accessed
   ↓
Rows accessed
   ↓
Access path inside partition
```

---

## 15.44 Example of problem with default conversion

Suppose the partition key is:

```
transaction_date DATE
```

and the application sends:

```
WHERE transaction_date = '23-SEP-2026'
```

Oracle can make an implicit conversion dependent on:

```
NLS_DATE_FORMAT
```

Preferably:

```
WHERE transaction_date = DATE '2026-09-23'
```

or bind variable with datatype DATE.

In SQL performance, we avoid default conversions.

---

## 15.45 When NU is worth partitioning?

Not every table has to be partitioned.

For example:

```
DIM_COUNTRY = 250 rows
```

Partitioning would only add complexity.

Partitioning is usually worth it when there are:

- large volumes;
- time retention;
- Loads over periods;
- queries that filter on the partitioning key;
- parallelism needs;
- administration per piece of data.

---

## 15.46 Oracle exercise 26ai

Create:

```sql
CREATE fact_sales_part
(
sale_id NUMBER,
sale_date DATE,
customer_id NUMBER,
amount NUMBER (12.2)
)
PARTITION BY RANGE (sale_date)
(
PARTITION p2026_07 VALUES LESS THAN (DATE '2026-08-01'),
PARTITION p2026_08 VALUES LESS THAN (DATE '2026-09-01'),
PARTITION p2026_09 VALUES LESS THAN (DATE '2026-10-01'),
PARTITION p_future VALUES LESS THAN (MAXVALUE)
);
```

Insert data for:

```
July
August
September
October
```

Then:

```sql
SELECT partition_name, num_rows
FROM user_tab_partitions
WHERE table_name = 'FACT_SALES_PART';
```

According to the statistics collected, they observe the distribution.

---

## 15.47 Exercise

Run:

```sql
SELECT SUM(amount)
FROM fact_sales_part
WHERE sale_date = DATE '2026-09-01'
AND sale_date; DATE '2026-10-01';
```

Then:

```sql
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (NULL, NULL, 'ALLSTATS LAST')
);
```

Search:

```
PARTITION SINGLE
Pstart
Pstop
```

---

## 15.48 Local index exercise

Create:

```sql
m=>m_fact_sales_customer
ON fact_sales_part (customer_id)
LOCAL;
```

Check:

```sql
SELECT
index_name,
partition_name,
status
FROM user_ind_partitions
WHERE index_name = 'IX_FACT_SALES_CUSTOMER';
```

Observe:

> the index has its own partitions.

---

## 15.49 Exercise × EXCHANGE PARTITION

Create a compatible staging table:

```sql
CREATE stg_fact_sales
AS
SELECT *
FROM fact_sales_part
WHERE 1 = 0;
```

Charging data for September.

Then perform conceptually:

```sql
ALTER fact_sales_part
EXCHANGE p2026_09
WITH TABLE stg_fact_sales;
```

Then check:

```sql
SELECT COUNT(*)
FROM fact_sales_part
PARTITION (p2026_09);
```

This is a very good exercise for DWH.

---

## 15.52 Mental model

When you see **Partitioning**, think:

```
PARTITIONING
                      │
        ┌─────────────┼─────────────┐
        │             │             │
Query ETL Maintenance
        │             │             │
        ▼             ▼             ▼
Pruning Exchange Drop / Truncate
        │
        ▼
Pstart / Pstop
        │
        ▼
Access path inside partition
        │
   ┌────┴────┐
   │         │
Full Scan Index
```

And the types:

```
RANGE
  │
− DATE / PERIOD
  │
- INTERVAL

LIST
  │
− REGION / SOURCE

HASH
  │
- even distribution

COMPOSITE
  │
● RANGE + HASH, etc.
```

---

## 15.53 What must remain

If you were to just remember the key to the technical review:

1. **Partitioning = Physical Sharing, one logical table.**
2. For fact tables, the most common is **RANGE/INTERVAL after date**.
3. The main concept of performance is **partition pruning**.
4. Check the plum through DBMS_XPLAN, especially **Pstart / Pstop**.
5. PARTITION RANGE SINGLE means that a single partition is required.
6. A FULL TABLE SCAN on a single large partition can be perfectly correct.
7. **Local indexes** are extremely useful in DWH.
8. **EXCHANGE PARTITION** is one of the most important ETL Oracle squares.
9. Partitioning also helps with **retention, purging, parallelism and maintenance**, not just at SELECT.
10. For very large DWH volumes, the combination:

```
Partitioning
+ local indexes
+ Statistics
+ parallel execution
+ partition-wise joins
```

is one of the basis of the Oracle performance architecture.

---

## Questions and answers

### 1. What is partitioning?

Physical division of a table or index into smaller segments, keeping a single logical object.

---

### 2. What is the main advantage for queries?

**Partition pruning**: Oracle can avoid irrelevant partitions.

---

### 3. What type would you use for a fact backgammon after date?

As a rule:

```
RANGE
```

or:

```
INTERVAL
```

---

### 4. What is partition pruning?

Removal from execution of partitions that cannot contain data relevant to predictions.

---

### 5. How do you check the baby?

In execution plan:

```
PARTITION SINGLE
PARTITION ITERATOR
Pstart
Pstop
```

---

### 6. What is the difference between local and global index?

Local index is partitioned in correspondence with the table; overall index has an independent structure.

---

### 7. Why local indexes are popular in DWH?

Because they allow maintenance and ETL operations on partitions without affecting the remaining index massively.

---

### 8. What is EXCHANGE PARTITION?

An operation whereby a table and a compatible partition change segments, allowing for very rapid publication of a batch.

---

### 9. Partitioning replaces indexes?

No.

The two can work together:

```
partition pruning
+
index access
```

---

### 10. Full scan on a partition is bad?

Not necessarily.

For DWH, one:

```
PARTITION SINGLE
+
TABLE ACCESS FULL
```

This may be the best plan.

---

### 11. What is partition-wise join?

Join executed on appropriate pairs of partitions, reducing the amount of data to be redistributed.

---

### 12. What is a major operational advantage of partitioning?

Old data can be removed by:

```
DROP PARTITION
```

instead of millions of DELETE operations.

---

**Question:**

> You have a fact sheet of 4 billion transactions and the monthly reports are slow.

A good answer would be:

> First, I check whether the table is partitioned by a column corresponding to the access square, for example, transaction_data. Then I check the execution plan and Pstart / Pstop to confirm partition pounding. If the one-month ratio accesses all partitions, I investigate predictions, conversions and functions applied to partition key. After pruning I analyze access to the pathi in the remaining partition, cardinality, statistics, indexes and if a full scan / parallel scan is more appropriate than an index. For ETL I would also analyze local indexes, incremental statistics and possibly partition exchange loading.

This is a very good response for a role of **Oracle Data Developer / DWH**.

---

### How would you briefly explain Partitioning to a colleague who knows SQL, but not this area?

Partitioning covers range, list, hash and composites partitioning, partition key selection, partition pruning. In practice, I first determine what data enters and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Partitioning?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Partitioning, I explicitly follow range, list, hash and composite partitioning, partition key selection, partition pruning and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Partitioning appears together with logging, auditing, reconciliation and impact analysis.
