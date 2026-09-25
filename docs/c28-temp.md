---
title: 'C28. TEMP and Expensive Operations'
description: 'Complete English handbook chapter based on the original C28 course.'
sidebar_position: 28
---

# C28. TEMP and Expensive Operations

<div className="chapter-kicker">Chapter C28 · Complete course</div>

In Oracle, many SQL operations need work memory for sorting, aggregation, hash joins or analytical functions. Normally, Oracle tries to perform these operations in **PGA**. If available memory is not sufficient, some of the data is written in **TEMP tablespace**.

The basic mental model is:

```
SQL
 ↓
working operation
SORT / HASH JOIN / GROUP BY / WINDOW SORT
 ↓
PGA enough?
¶ ¶ DA → execution in memory → fast
¶ ¶ NU → spell in TEMP → I/O on disk → slower
```

For a Data Developer / DWH Developer, the key idea is:

> TEMP is not the problem itself. TEMP becomes an important symptom when an operation processes much more data than it can effectively maintain in PGA.

---

## 1. What TEMP is

Oracle uses a **temporal tablespace** for temporary operations that cannot be fully executed in memory.

Typical examples:

```
ORDER BY
GROUP BY
DISTINCT
HASH JOIN
SORTQ1QX JOIN
analytic / window functions
CREATE INDEX
some parallel operations execution
```

TEMP contains transitional data. It must not be confused with:

```
UNDO → read consistency / roll back
REDO → recovery
TEMP → temporary space for workshops
```

---

# 2. PGA versus TEMP

Operations such as SORT or HASH JOIN receive a memory area called ****, located in PGA.

Simplified:

```
Session
  |
+ -- PGA
       |
+ -- Sort Area
+ -- Hash Area
+ -- Bitmap Area
+ -- Window processing
```

Oracle tries:

```
PGA
 ↓
complete operation in memory
```

If the data exceeds the assigned memory:

```
PGA
 ↓
TEMP
 ↓
additional reading / writing
```

This phenomenon is commonly called:

**spill to TEMP**.

---

# 3. The Three Ways of Execution of a Workshop

Very important concept for review.

Oracle can perform an operation in three ways.

### OPTIMAL

The whole operation fits into PGA.

```
PGA
♪ All the data ♪
```

No need for TEMP.

It's the most effective option.

---

### ONE-PASS

The data does not fully fit into PGA.

Oracle writes part in TEMP and about an additional pass through the data is required.

```
PGA
 ↓
TEMP
 ↓
PGA
```

Performance is dropping.

---

### MULTI-PASS

The work is far too small for the processed volume.

Oracle must write and recite data from TEMP several times.

```
PGA
 ↓
TEMP
 ↓
PGA
 ↓
TEMP
 ↓
PGA
```

This can become very expensive.

Mental rule:

```
OPTIMAL
  ↓
ONE-PASS
  ↓
MULTI-PASS

performance
   ↓
```

---

# 4. Operations that frequently use TEMP

## 4.1 ORDER BY

Example:

```
SELECT *
FROM fact_transaction
ORDER BY transaction_date;
```

For a few thousand rows it can be trivial.

For hundreds of millions:

```
TABLEQ1QX FULL
        ↓
SORTQ1QX BY
        ↓
Possible TEMP
```

In execution the plan may appear:

```
SORTQ1QX BY
```

---

# 5. GROUP BY

Example DWH:

```
SELECT account_id,
SUM (amount)
FROM fact_transaction
GROUP BY account_id;
```

Oracle may use:

```
HASHQ1QX BY
```

or sometimes:

```
SORTQ1QX BY
```

For large volumes:

```
FACT_TRANSACTION
500 million rows
       ↓
HASHQ1QX BY
       ↓
Insufficient PGA
       ↓
TEMP
```

In an DWH this can be perfectly normal.

The problem is whether we're processing hundreds of millions of rows unnecessarily.

---

# 6. DISTINCT

Example:

```
SELECTQ1QX customer_id
FROM fact_transaction;
```

Oracle must eliminate duplicates.

May use:

```
HASH UNIQUE
```

or

```
SORT UNIQUE
```

Conceptual example:

```
500 million rows
       ↓
HASH UNIQUE
       ↓
5 million separate values
```

Work can get really big.

Therefore:

```
DISTINCT
```

Must not be used automatically to repair duplicated results from the wrong joint.

Anti-pattern:

```
SELECT DISTINCT...
FROM fact_transaction f
JOIN dim_customer c
ON...
JOIN...
```

If DISTINCT is necessary only because the joint multiplies the lines, the joint needs to be repaired.

---

# 7. HASH JOIN and TEMP

In DWH, HASH JOIN is extremely important.

Example:

```
SELECT c.customer_type,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_id = f.customer_id
GROUP BY c.customer_type;
```

Oracle can do:

```
DIM_CUSTOMER
      ↓
BUILDQ1QX TABLE
      ↓
FACT_TRANSACTION
      ↓
PROBEQ1QX TABLE
```

If hash the tablet fits in PGA:

```
HASH JOIN → memory
```

If not:

```
HASH JOIN
   ↓
part hash data
   ↓
TEMP
```

This is a classic case of **hash joint spill**.

---

# 8. Analytical Functions

Analytical functions are very common in DWH.

Example:

```
SELECT account_id,
transaction_date,
% 1% 2
ROW_NUMBER () OVER
PARTITIONQ1QX account_id
ORDER BY transaction_date DESC
) AS rn
FROM fact_transaction;
```

Oracle should frequently sort data to:

```
PARTITION BY
ORDER BY
```

In the plan you can see:

```
WINDOW SORT
```

or similar operations.

Conceptual:

```
FACT_TRANSACTION
      ↓
WINDOW SORT
      ↓
ROW_NUMBER ()
```

For millions of rows:

```
WINDOW SORT
      ↓
PGA
      ↓
TEMP if PGA does not reach
```

---

# 9. Classic Example DWH

We have:

```
FACT_TRANSACTION
500,000,000 rows
```

Query:

```
SELECT customer_id,
SUM (amount)
FROM fact_transaction
GROUP BY customer_id;
```

Possible plan:

```
SELECT STATEMENT
    |
HASHQ1QX BY
    |
TABLE ACCESS FULL FACT_TRANSACTION
```

Flux:

```
500M rows
   ↓
Full Table Scan
   ↓
Hash Group By
   ↓
PGA
   ↓
TEMP
   ↓
5M aggregated rows
```

This doesn't automatically mean that the query is bad.

The right question is:

> Did the entire table have to be processed?

For example:

```
SELECT customer_id,
SUM (amount)
FROM fact_transaction
WHERE transaction_date = DATE '2026-09-01'
GROUP BY customer_id;
```

If the table is partitioned on the date:

```
500M rows
↓ partition pruning
20M rows
    ↓
HASHQ1QX BY
```

You have greatly reduced the workload and the need for TEMP.

---

# 10. TEMP is often effect, not cause

One of the most important ideas of this module.

See:

```
TEMP = 80 GB
```

Wrong reaction:

> We need to increase the TEMP.

That may be necessary, but first we need to find the motive.

Possible causes:

```
cardinality too high
        ↓
wrong join
        ↓
missing partition pruning
        ↓
GROUP BY Useless
        ↓
Useless DISTINCT
        ↓
enormous sorting
        ↓
Insufficient PGA
        ↓
excessive parallelism
```

So:

```
Large TEMP
   ↓
What operator consumes it?
   ↓
Why are they processing so many lines?
```

---

# 11. As you see TEMP in the execution plan

For real diagnosis:

```
SELECT / * + gather_plan_statistics * /
customer_id,
SUM (amount)
FROM fact_transaction
GROUP BY customer_id;
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

On a real plane you can see columns like:

```
A-Rows
Buffers
OMem
1Mem
Used-Mem
Used-Tmp
```

A conceptual example:

```
--------------------------------------------------------------------------------
* * * * *
--------------------------------------------------------------------------------
1).
2) TABLE ACCESS FULL
--------------------------------------------------------------------------------
```

Interesting element:

```
Used-Tmp = 4G
```

means that the operator needed TEMP.

---

# 12. Read the bottom-up plan

According to the rule we used in the plans-execution modules:

```
Id 2 TABLE ACCESS FULL
       ↓
200M rows

Id 1 HASH GROUP BY
       ↓
1M rows
       ↓
4GB TEMP
```

Interpretation:

> Oracle read about 200 million lines and then aggregated them through HASH GROUP BY. The work did not fully fit into PGA and the operator used TEMP.

This is much more useful than:

> The query uses TEMP.

---

# 13. V$SQL\ _ WORKING

The Oracle provides information about the workshop.

For example:

```
SELECT sql_id,
operation_type,
policy,
estimated_optimal_size,
estimated_onepass_size,
last_memory_used,
last_execution,
last_tempseg_size
FROM v $sql_workarea
WHERE sql_id = '&sql_id';
```

You can see operations like:

```
HASH-JOIN
GROUP-BY
SORT
WINDOW
```

and if the last execution was:

```
OPTIMAL
ONE PASS
MULTI-PASS
```

Conceptual:

```
LAST_EXECUTION
--------------
OPTIMAL
ONE PASS
MULTI-PASS
```

MULTI-PASS is usually an important signal to investigate.

---

# 14. V$SQL\ _ WORKING\ _ ACTIVE

For ongoing operations:

```
SELECT side,
sql_id,
operation_type,
actual_mem_used,
max_mem_used,
tempseg_size,
number_passes
FROM v $sql_workarea_active;
```

You can see:

```
current memory
TEMP used
number of passes
```

It is especially useful for long DWH querys.

---

# 15. Who consumes TEMP

One of the useful views is:

```
SELECT *
FROM v $tempseg_usage;
```

More practical example:

```
SELECT s.sid,
♪ serial ♪
susername,
u.sql_id,
u.segtype,
u.blocks
FROM v $tempseg_usage
JOIN v $session
ON s.saddr = u.session_addr;
```

You can identify:

```
SID
SQL_ID
SEGTYPE
BLOCKS
```

i.e. what session and what SQL consumes TEMP.

---

# 16. What can occur in SEGTYPE

Depending on the operation, you can meet types associated with:

```
SORT
HASH
DATA
INDEX
LOB_DATA
```

For tuning we are particularly interested in cases where a large SQL generates intense sorting / hashing.

---

# 17. PGA\ _ AGGREGATE\ _ TARGET

Oracle manages PGA memory according to parameters such as:

```
SHOW PARAMETER pga;
```

You can meet:

```
pga_aggregate_target
pga_aggregate_limit
```

PGA\ _ AGGREGATE\ _ TARGET is a target for total PGA memory.

Very important:

> It's not the memory given to a single SQL.

Oracle must share PGA between sessions and operations.

Example:

```
Total available PGA
        |
+ -- session 1 HASH JOIN
+ -- session 2 SORT
+ -- session 3 GROUP BY
+ -- session 4 analytical query
        ...
```

---

# 18. Competition changes the situation

A query can run well alone:

```
Query A
PGA sufficient
→ OPTIMAL
```

But when 20 querys run simultaneously:

```
Q1
Q2
Q3
...
Q20
 ↓
PGA pressure
 ↓
lower workareas
 ↓
TEMP
```

That's why a job can be fast at night and slow during the day.

---

# 19. Parallel Execution can amplify TEMP

In the previous module we discussed Parallel Execution.

Example:

```
SELECT / * + parallel (f 8) * /
customer_id,
SUM (amount)
FROM fact_transaction f
GROUP BY customer_id;
```

You have more PX servers:

```
PX1
PX2
PX3
PX4
PX5
PX6
PX7
PX8
```

Each one can have their own workshop.

The result may be:

```
Large DOP
   ↓
more workareas
   ↓
higher PGA consumption
   ↓
TEMP higher
```

So:

```
PARALLEL for free
```

More parallelism can reduce elapsed time, but it can increase:

```
CPU
PGA
TEMP
I/O
```

---

# 20. Expensive SQL Operations

In a query, frequent expensive operations are:

Operation; Main Resource;
♪ ♪ ♪ ♪ ♪
* Full Table Scan mare * I/O *
The large SORT, PGA / TEMP
* * *
HASH GROUP BY
* WINDOW SORT * PGA / TEMP
The large DISTINCT, PGA / TEMP
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =

The real cost must be looked at multidimensional:

```
CPU
I/O
memory
TEMP
ed time
rows processed
```

---

# 21. Cartesian joint generator massive by TEMP

An extreme example:

```
SELECT *
FROM fact_transaction f
dim_customer c;
```

If we have:

```
FACT_TRANSACTION = 100M
DIM_CUSTOMER = 1M
```

theoretically:

```
100M × 1M
```

combinations.

Even a more subtle wrong joint can produce:

```
10M
 ↓
200M
 ↓
3 billion intermediate rows
 ↓
GROUP BY
 ↓
Huge TEMP
```

Sometimes the problem is not GROUP BY.

The real problem is the operator below.

---

# 22. E-Rows versus A-Rows

Very important to TEMP.

Estimated plan:

```
E-Rows = 100,000
```

Real:

```
A-Rows = 50,000,000
```

The optimiser expected a workout for ~ 100k rows.

It's actually getting 50M.

Possible consequence:

```
cardinality misestimate
        ↓
memory / bad work
        ↓
hash / large apron
        ↓
TEMP
```

Therefore TEMP may be directly related to:

```
Statistics
Histograms
Bind Variables
Join cardinality
```

---

# 23. Complete diagnostic example

We have query:

```
SELECT c.region,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_id = f.customer_id
WHERE f.transaction_date = DATE '2026-01-01'
GROUP BY c.region;
```

It's slow.

### Step 1

```
SELECT / * + gather_plan_statistics * /
c.region,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_id = f.customer_id
WHERE f.transaction_date = DATE '2026-01-01'
GROUP BY c.region;
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

---

### Step 2

Suppose:

```
TABLE ACCESS FULL FACT_TRANSACTION
A-rows = 400M
        ↓
HASH JOIN
A-rows = 400M
TEMP = 20G
        ↓
HASHQ1QX BY
A-Rows = 10
TEMP = 12G
```

---

### Step 3

You don't start with:

> Do we size TEMP?

But:

```
Why are we reading 400M rows?
```

Check:

```
partition pruning?
Preached?
date type?
Statistics?
Join cardinality?
```

---

### Step 4 Discover Problem

The table is partitioned:

```
PARTITION BY RANGE (transaction_date)
```

But the real query was:

```
WHERE TO_CHAR (transaction_date, 'YYYY') = '2026'
```

This can prevent desired optimization.

Better version:

```
WHERE transaction_date = DATE '2026-01-01'
AND transaction_date - DATE '2027-01-01'
```

Now:

```
partition pruning
       ↓
80M rows
       ↓
HASH JOIN
       ↓
GROUP BY
       ↓
TEMP much reduced
```

That's the right tuning.

---

# 24. Do not just optimize TEMP

Anti-pattern:

```
Slow SQL
 ↓
TEMP high
 ↓
increase TEMP
```

Correct approach:

```
Slow SQL
 ↓
execution plan
 ↓
Which operator consumes TEMP?
 ↓
How many rows does he get?
 ↓
why does he get so much?
 ↓
Can we reduce the data earlier?
```

---

# 25. Very Important Pattern: Reduce Rows as early as possible

In DWH:

```
1 billion rows
     ↓
filter
     ↓
50 million
     ↓
Join
     ↓
10 million
     ↓
group
```

is preferable to:

```
1 billion
     ↓
Join
     ↓
800 million
     ↓
group
     ↓
filter
```

The optimiser tries to make predicated pushdown and transformations, but the structure of the query, statistics and expressions can influence the result.

Rule:

> The sooner you reduce the cardinality, the less CPU, I/O, PGA and TEMP.

---

# 26. OLTP versus DWH

## OLTP

In OLTP we prefer:

```
few rows
look index
Nested Loops
Small PGA
Minimum TEMP
```

Example:

```
SELECT *
FROM transactions
WHERE transaction_id =: id;
```

---

## DWH

In DWH it is normal to have:

```
Full Scan
Hash Join
Hash Group By
Parallel Execution
TEMP
```

Example:

```
SELECT region,
product_category,
SUM (amount)
FROM fact_sales
GROUP BY region,
product_category;
```

TEMP is not an automatic problem here.

The question is:

> Is TEMP reasonable for the volume and objective of the query?

---

# 27. When large TEMP can be normal

Example:

```
Fact table = 4 TB
Monthly reporting query
GROUP BY on 2 billion rows
```

A temporary consumption of tens or hundreds of GB may be legitimate.

Instead:

```
query that has to return 10 rows
TEMP = 200 GB
```

He's very suspicious.

---

# 28. Frequent anti-patents

### 1. DISTINCT placed automatically

```
SELECT DISTINCT...
```

to hide duplicates.

---

### 2. Useless ORDER BY

```
INSERTQ1QX target_table
SELECT...
FROM source_table
ORDER BY col;
```

If order has no meaning for the final operation, sorting may be unnecessary.

---

### 3. Analytical functions on enormous set

```
ROW_NUMBER () OVER
PARTITION BY...
ORDER BY...
)
```

applied before filters.

---

### 4. Join that multiplies rows

```
10M
 ↓
400M
 ↓
GROUP BY
```

---

### 5. Missing partition pruning

```
1B rows scan
```

for:

```
20M rows partition scan
```

---

### 6. DOP too large

```
parallel 32
```

No real reason.

It can lead to:

```
PGA pressure
TEMP pressure
I/O pressure
```

---

# 29. Practical exercise Oracle 26ai

In DEV\ _ LAB, you can create a simple test.

```
CREATE TABLE temp_test AS
SELECT level AS id,
MOD (level, 100000) AS customer_id,
MOD (level, 1000) AS account_id,
ROUND (DBMS_RANDOM.VALUE (1.10000), 2) AS amount
FROM dual
CONNECT BY level = 1000000;
```

We collect statistics:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
USER,
'TEMP_TEST'
);
END;
/
```

---

## Test 1

```
SELECT / * + gather_plan_statistics * /
*
FROM temp_test
ORDER BY amount;
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

Search:

```
SORTQ1QX BY
```

and memory columns / TEMP available in output.

---

## Test 2

```
SELECT / * + gather_plan_statistics * /
customer_id,
SUM (amount)
FROM temp_test
GROUP BY customer_id;
```

Search:

```
HASHQ1QX BY
```

or

```
SORTQ1QX BY
```

---

## Test 3

```
SELECT / * + gather_plan_statistics * /
d,
customer_id,
% 1% 2
ROW_NUMBER () OVER
PARTITIONQ1QX customer_id
ORDER BY amount DESC
) rn
FROM temp_test;
```

Search:

```
WINDOW SORT
```

---

# 30. What to follow in the laboratory

Compare:

```
Operation
A-Rows
Buffers
Used-Mem
Used-Tmp
```

and try to answer:

```
Which operator processes most of the rows?

Where does the cardinality drop?

Which operator has the big workshop?

Is there spill in TEMP?
```

---

# 31. Real script DWH

Job ETL nocturnal:

```
STAGING_TRANSACTION
      ↓
JOIN DIM_ACCOUNT
      ↓
JOIN DIM_CUSTOMER
      ↓
Analytic ROW_NUMBER
      ↓
GROUP BY
      ↓
FACT_DAILY_BALANCE
```

Durum job:

```
15 minutes
```

And now:

```
90 minutes
```

TEMP reaches:

```
180 GB
```

Investigation:

```
SQL Monitor / DBMS_XPLAN
      ↓
WINDOW SORT = 140 GB TEMP
      ↓
A-rows = 800M
```

It is noted that before ROW\ _ NUMBER () a filter on the batch is missing.

The query processes:

```
all history
```

for:

```
current batch
```

After filtration:

```
800M rows
 ↓
15M rows
```

Result:

```
TEMP: 180 GB → 8 GB
runtime: 90 min → 12 min
```

The idea is very important:

> We have not optimized TEMP. We have reduced the data set that requires TEMP.

---

## Questions and answers

### 1. Why is Oracle using TEMP?

For temporary operations such as sorting, hash joins, aggregation and analytical functions when PGA is not sufficient.

---

### 2. What is the difference between PGA and TEMP?

PGA is a private memory of the process / session for workshops. TEMP is disk space used when data cannot be fully processed in the available memory.

---

### 3. What does spill to TEMP mean?

An operation such as apron or hash joint exceeds the memory available in PGA and writes some of the data in temporal tablespace.

---

### 4. What is optimal, one-pass and multi-pass?

```
OPTIMAL → operation in memory
ONE-PASS → use of TEMP
MULTI-PASS → data must be written / read from TEMP in several passes
```

---

### 5. Does large TEMP automatically mean stupid SQL?

No. For large DWH workshops, TEMP can be normal. The operator, cardinality and volume of processing must be analysed.

---

### 6. What operations frequently consume TEMP?

```
SORT
HASH JOIN
HASHQ1QX BY
SORTQ1QX BY
DISTINCT
WINDOW SORT
CREATE INDEX
Parallel Query
```

---

### 7. How do you investigate an SQL that consumes much TEMP?

A good technical discussion response:

> I start with the real plan using DBMS\ _ XPLAN.DISPLAY\ _ CURSOR or SQL Monitor. I identify the operator that consumes TEMP and I check A-Rows, cardinality, buffers and memory usage. Then I investigate why the operator processes so many lines: join cardinality, filters, partition pruning, statistics, data skew or parallelism. I do not treat the enlargement of TEMP as the first solution.

---

# 33. Mental Model to Memorize

Remember the chain:

```
SQL
 ↓
rows
 ↓
SORT / HASH / GROUP / WINDOW
 ↓
working
 ↓
PGA
 ↓
Can it fit?
* * * *
- NO
      ↓
TEMP
      ↓
ONE-PASS / MULTI-PASS
      ↓
Physical I/O
      ↓
Slower execution
```

But for tuning more important is:

```
Large TEMP
   ↓
Which operator?
   ↓
How many A-Rows?
   ↓
Why so many?
   ↓
filter / joint / statistics
partition pruning
parallelism
query design
```

---

# 34. Link with previous modules

This module directly links several concepts:

```
Statistics
    ↓
Cardinality
    ↓
Optimizer
    ↓
Implementation Plan
    ↓
Join Algorithm
    ↓
PGA
    ↓
TEMP
```

and:

```
Partitioning
     ↓
Partition Pounding
     ↓
less rows
     ↓
less hash / sort
     ↓
less PGA
     ↓
less TEMP
```

plus the previous module:

```
Parallel Execution
       ↓
multiple processes
       ↓
more workareas
       ↓
PGA / TEMP / I/O increased
```

---

## What must remain

For **level Oracle Data Developer / DWH Developer**, the most important ideas are:

1. **SORT, HASH JOIN, GROUP BY, DISTINCT and WINDOW SORT use workareas in PGA.**
2. If memory fails, Oracle makes **spill in TEMP**.
3. Work can run OPTIMAL, ONE-PASS or MULTI-PASS.
4. Large TEMP is often the effect of a large **cardinality, not the cause of the problem.
5. In particular, **A-Rows + operator + memory / TEMP usage** should be followed.
6. Do you not start the TEMP-enhancing tuning; do you start with **why do I process so much data?**
7. In DWH, **Full Scan + Hash Join + Hash Group By + TEMP** can be perfectly normal.
8. **Partition pruning, early applied filters and correct** joints can dramatically reduce TEMP.
9. Parallel Execution can accelerate the query, but it can significantly increase the consumption of **PGA and TEMP**.
10. The key diagnostic patent is:

```
Expensive operator
      ↓
A-Rows
      ↓
PGA / TEMP
      ↓
Why is the cardinality so great?
      ↓
optimize the cause
```

This is one of the subjects that ties very well **Execution Plans + PGA + Hash Join + Parallel Execution + SQL Tuning**, exactly the kind of explanation that often appears in an Oracle / DWH technical discussion.

---

## Questions and answers

### How would you briefly explain TEMP and costly operations to a colleague who knows SQL, but not this area?

Temp and costly operations cover sorts, hash joins and workareas, PGA vs TEMP spill, ORDER BY, GROUP BY, DISTINCT and analytical windows. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to TEMP and costly operations?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Temp and costly operations, explicitly follow sorts, hash joins and workplaces, PGA vs TEMP spill, ORDER BY, GROUP BY, DISINCT and analytical windows and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, TEMP and costly operations occur along with logging, auditing, reconciliation and impact analysis.
