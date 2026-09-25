---
title: 'C21. Memory Architecture'
description: 'Complete English handbook chapter based on the original C21 course.'
sidebar_position: 21
---

# C21. Memory Architecture

<div className="chapter-kicker">Chapter C21 · Complete course</div>

The Oracle Memory Architecture explains the **where data are temporarily stored, the SQL code, the execution plans and the** session information while the database is running. For a Data Developer no DBA level is required very deeply, but it is important to understand **SGA, PGA, buffer cache, shared pool, sort / hash memory and their effect on SQL/ETL** performance.

---

## 1. The Overview

The Oracle memory is divided conceptually into two main areas:

```
Oracle Instant
│
● SGA * System Global Area
Tel: + 32- (0) 2 548 00
¶ Shared Pool ¶
* Library Cache *
* Data Dictionary Cache *
Redo Log Buffer
* Large Pool *
- Java Pool
- other components
│
¶ ¶ PGA * * * * * *
¶ ¶ Sort Area
* * * * *
- Session / Process memory
- Cursor runtime state
```

The fundamental difference is:

> **SGA is shared between the processes / sessions of the Oracle court. PGA belongs to an Oracle process and is not shared in the same way.**

---

# 2. SGA - System Global Area

SGA is the main memory of the Oracle court.

It shall be allocated when the court starts:

```
STARTUP
   ↓
Oracle Instant
   ↓
SGA + background processes
```

Several sessions use the same SGA.

Example:

```
Session A
Session B - → SGA
Session C
```

SGA contains mainly data that need to be accessed quickly and shared.

---

# 3. Database Buffer Cache

Database Buffer Cache is one of the most important components.

Here Oracle keeps **copies of data blocks read from** datafiles.

Simplified flow:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

Oracle seeks the necessary blocks:

```
SQL
 ↓
Buffer Cache
 ↓
Block found?
¶ ¶ DA → logical read ¶
- NU
      ↓
Dataphiles
      ↓
physical read
      ↓
Buffer Cache
```

So Oracle tries to avoid repeated access to the disk.

---

## Logical Read vs Physical Read

### Logical read

The block is already in the cache buffer.

```
SGA → Buffer Cache → block
```

It's much faster.

### Physical read

The block has to be read off the storage.

```
Datafile → Buffer Cache → SQL
```

It's generally more expensive.

Therefore, in the performance analysis, indicators such as:

```
buffer gets
Physical reads
```

are important.

---

# 4. How the Oracle modifies the data in Buffer Cache

Suppose:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle doesn't change the date immediately.

The block is:

```
Dataphiles
↓ read
Buffer Cache
↓ UPDATE
Dirty Buffer
```

A **dirty buffer** is a modified block in memory that has not yet been written on the disk.

Subsequently:

```
DBWR
Database Write
```

Write the block in the datafils.

---

# 5. Shared Pool

Shared Pool contains reusable information between sessions.

Two important components:

```
Shared Pool
│
- Library Cache
│
- Data Dictionary Cache
```

---

# 6. Library Cache

Library Cache keeps:

- SQL parsed;
- PL/SQL compiled;
- execution plans;
- Information cursor;
- The metadata required for execution.

Example:

```
SELECT *
FROM
WHERE employee_id =: id;
```

The first execution may involve:

```
Parse SQL
   ↓
Semantic check
   ↓
Optimizer
   ↓
Implementation Plan
   ↓
Library Cache
```

At the next execution Oracle can reuse the plan.

This is the principle:

```
Hard Parse
vs
Soft Parse
```

---

# 7. Hard Parse

A **hard parse** requires more work:

```
SQL
 ↓
syntax check
 ↓
semantic check
 ↓
object / privilege validation
 ↓
Optimizer
 ↓
execution plan
```

It's relatively expensive.

---

# 8. Soft Parse

If Oracle already finds SQL-ul and plan in Library Cache:

```
SQL
 ↓
Library Cache
 ↓
existing cursor / plan
```

processing is much lower.

Therefore, Oracle applications frequently use **but vary**.

Good example:

```
SELECT *
FROM orders
WHERE customer_id =: customer_id;
```

for:

```
SELECT *
FROM orders
WHERE customer_id = 100;
```

then:

```
SELECT *
FROM orders
WHERE customer_id = 101;
```

then:

```
SELECT *
FROM orders
WHERE customer_id = 102;
```

The Bind variables increase the chance that Oracle can reuse the cursor.

---

# 9. Data Dictionary Cache

Oracle must frequently know:

- is there a table?
- What columns does he have?
- What datatypes?
- Who's the owner?
- what privileges does the user have?;
- What indexes are there?

This information comes from Data Dictionary.

Part of it is cache-look in:

```
Date Dictionary Cache
```

Conceptual example:

```
SELECT *
FROM HR.EMPLOYEES;
```

The Oracle must verify:

```
Does HR.EMPLOYEES exist?
 ↓
What columns does he have?
 ↓
Does the user have SELECT?
```

---

# 10. Redo Log Buffer

Redo Log Buffer contains information about changes made in the database.

Example:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle generates redo:

```
UPDATE
 ↓
Redo information
 ↓
Redo Log Buffer
 ↓
LGWR
 ↓
Online Redo Logs
```

The responsible process is:

```
LGWR
Log Writer
```

Redo is essential to recovery.

---

# 11. What happens at COMMIT

For:

```
COMMIT;
```

Oracle doesn't have to immediately write all the modified blocks of Buffer Cache into the datafiles.

Instead, it must ensure the persistence of the relevant redo.

Simplified:

```
COMMIT
  ↓
LGWR
  ↓
Redo Log Buffer
  ↓
Online Redo Log
  ↓
COMMIT confirmed
```

This is an extremely important difference:

> COMMIT does not mean that DBWR wrote all the blocks in datafiles.

The persistence of the transaction is guaranteed by the redo mechanism.

---

# 12. PGA

PGA is the private memory associated with an Oracle process.

Contains information necessary for the execution of SQL-.

Examples:

```
PGA
│
¶ ¶ Sort Area
* * * * * *
- Runtime cursor information
- process / session memory
```

PGA is very important for:

- ORDER BY;
- GROUP BY;
- HASH JOIN;
- creating indexes;
- analytical operations;
- certain ETL operations.

---

# 13. Sort Area

Consider:

```
SELECT *
FROM transactions
ORDER BY transaction_date;
```

Oracle has to sort the data.

If the data can fit into PGA:

```
rows
 ↓
PGA
 ↓
apron
 ↓
Result
```

the operation is effective.

If it doesn't fit:

```
Insufficient PGA
      ↓
temporal tablespace
      ↓
sort disk
```

performance decreases.

---

# 14. Hash Area

A Hash Join uses PGA.

Example:

```
SELECT *
FROM sales s
JOIN customers c
ON c.customer_id = s.customer_id;
```

A plan could contain:

```
HASH JOIN
− CUSTOMERS
- SALES
```

Oracle can build a hash table in PGA:

```
CUSTOMERS
     ↓
Hash Table
PGA
     ↓
SALES samples
```

If the structure does not fit into PGA, Oracle can use TEMP.

---

# 15. PGA and Temporal Tablespace

This relationship is very important.

Ideal:

```
Sort / Hash
     ↓
PGA
```

If the memory does not reach:

```
Sort / Hash
     ↓
PGA
     ↓
TEMP tablespace
```

In execution plan you can meet operations such as:

```
SORTQ1QX BY

HASH JOIN

WINDOW SORT
```

which can consume a lot of PGA/TEMP.

---

# 16. SGA vs PGA

An important summary for review:

* * * * * * *
♪ ♪ ♪ ♪ ♪
♪ ♪ Private of the process ♪
= = sync, corrected by elderman = =
# Buffer Cache # Sort Area #
♪ Shared Pool ♪ Hash Area ♪
= = sync, corrected by elderman = = @ elder _ man
♪ Cache global ♪ Working memory ♪

Mnemonic:

```
SGA = shared
PGA = Private
```

It's not a perfectly technical definition, but it's very useful conceptually.

---

# 17. Automatic Memory Management

Oracle can automatically manage memory.

There are several levels / configurations.

Parameters you can meet:

```
MEMORY_TARGET
MEMORY_MAX_TARGET
```

or:

```
SGA_TARGET
SGA_MAX_SIZE
PGA_AGGREGATE_TARGET
```

Conceptual:

```
Total Memory
│
− SGA
│
- PGA
```

Oracle can adjust the dimensions of components according to workload.

---

# 18. PGA\ _ AGGREGATE\ _ TARGET

Example:

```
SHOW PARAMETER pga_aggregate_target;
```

PGA\ _ AGGREGATE\ _ TARGET is a target for the aggregated PGA memory of the court.

Doesn't mean:

```
Each session receives 2 GB
```

but approximately:

```
Total PGA consumed by court proceedings
```

is managed around that target.

---

# 19. SGA\ _ TARGET

Example:

```
SHOW PARAMETER sga_target;
```

SGA may contain dynamic:

```
SGA_TARGET
│
¶ ¶ Buffer Cache ¶
¶ ¶ Shared Pool ¶
¶ Large Pool ¶
- Other components
```

Oracle can redistribute memory between some of these components.

---

# 20. Large Pool

Large Pool is used for certain large operations that is not ideal to consume Shared Pool.

Can be used for:

- RMAN;
- Parallel execution;
- shared server;
- certain internal Oracle operations.

Conceptual:

```
Large Pool
   ↓
large memory allocations
```

---

# 21. Java Pool

If Oracle executes Java in the database, there are:

```
Java Pool
```

For most Development Data is not a critical area.

---

# 22. Fixed SGA

There's another small area called:

```
Fixed SGA
```

containing internal information of the court, such as control structures and references to other areas of SGA.

It is usually particularly relevant at DBA/internals level.

---

# 23. Relationship between memory and execution plan

Suppose:

```
SELECT customer_id,
SUM (amount)
FROM sales
GROUPQ1QX customer_id
ORDER BY SUM (amount) DESC;
```

The execution plan may include:

```
SORTQ1QX BY
  |
HASHQ1QX BY
  |
TABLE ACCESS FULL SALES
```

From a memory point of view:

```
TABLE ACCESS
     ↓
Buffer Cache
     ↓
HASHQ1QX BY
     ↓
PGA
     ↓
SORT
     ↓
PGA / TEMP
```

Therefore, an execution plan must also be viewed in the light of memory.

---

# 24. Example DWH

Consider:

```
SELECT
c.region,
SUM (f.amount)
FROM fact_sales f
JOIN dim_customer c
ON c.customer_key = f.customer_key
GROUP BY c.region;
```

Possibly:

```
HASHQ1QX BY
    |
HASH JOIN
  /      \
DIM FACT
```

The memory is used as follows:

```
DIM_CUSTOMER
     ↓
Buffer Cache
     ↓
Hash table
     ↓
PGA
     ↓
FACT_SALES samples
```

If FACT contains hundreds of millions of rows, PGA and TEMP become very important.

---

# 25. Example ETL

An ETL could execute:

```
INSERTQ1QX fact_sales
SELECT...
FROM staging_sales
JOIN dim_customer c
ON...
JOIN dim_product
ON...;
```

They can occur:

```
HASH JOIN
HASH JOIN
SORT
GROUP BY
```

All of this can consume significantly:

```
PGA
```

and if PGA is not sufficient:

```
TEMP
```

That's why a ETL job can be slow even if SQL- seems logical.

---

# 26. Memory Workshop

Oracle often calls the memory used for operations such as apron / hash:

```
working
```

An operation may be:

```
OPTIMAL
ONE-PASS
MULTI-PASS
```

### Optimal

It's all in the memory.

```
PGA only
```

### Onepass

Oracle has to write a part in TEMP.

### Multi-pass

Oracle makes several passes between memory and disk.

It can be very slow.

---

# 27. Why does it matter for performance

A slow SQL can be caused by:

```
Stupid SQL
 ↓
Bad plan
 ↓
too many blocks
 ↓
Big Buffer Gets
```

but also by:

```
Hash / Very Large Sort
 ↓
Insufficient PGA
 ↓
TEMP spell
 ↓
I/O disk
```

So the tuning isn't just indexes.

---

# 28. Useful Querys

Depending on privileges, DBA can analyze memory through views such as:

```
SELECT *
FROM v $sga;
```

or:

```
SELECT *
FROM v $safinfo;
```

For PGA:

```
SELECT *
FROM v $pgastat;
```

For workshop:

```
SELECT *
FROM v $sql_workarea;
```

and:

```
SELECT *
FROM v $sql_workarea_active;
```

For cache buffer:

```
SELECT *
FROM v $buffer_pool_statistics;
```

These views usually require additional privileges.

---

# 29. Example of diagnosis

Suppose a query:

```
SELECT *
FROM huge_table
ORDER BY transaction_date;
```

It runs very slowly.

Execution plan:

```
SORTQ1QX BY
  |
TABLE ACCESS FULL HUGE_TABLE
```

Possible cause:

```
10 million rows
      ↓
SORT
      ↓
PGA
      ↓
does not fit
      ↓
TEMP
```

Here an index may or may not be the solution. It has to be checked:

```
plan
cardinality
PGA
TEMP usage
I/O
```

---

# 30. Memory Architecture + Transactions

Typical transaction:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

COMMIT;
```

involve:

```
Block
 ↓
Database Buffer Cache
 ↓
modified → dirty buffer

Redo
 ↓
Redo Log Buffer
 ↓
LGWR
 ↓
Redo Log
```

and later:

```
DBWR
 ↓
Dataphiles
```

This is one of the most important mental images in Oracle.

---

# 31. Memory Architecture + Parse

For:

```
SELECT *
FROM customers
WHERE customer_id =: id;
```

We have approximately:

```
SQL
 ↓
Shared Pool
 ↓
Library Cache
 ↓
Is there a cursor?
 │
● DA → soft parse
 │
► NU
      ↓
hard parse
      ↓
Optimizer
      ↓
execution plan
```

---

# 32. Memory Architecture + SELECT

For a simple SELECT:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

you can view:

```
SQL
 ↓
Shared Pool
 ↓
Implementation Plan
 ↓
Buffer Cache
 ↓
Data found?
 │
► DA
 │
● NU → Datafile
```

---

# 33. Memory Architecture + DML

For:

```
UPDATE custodian
SET status = 'ACTIVE'
WHERE customer_id = 10;
```

the image is:

```
SQL
 ↓
Shared Pool
 ↓
Implementation Plan
 ↓
Buffer Cache
 ↓
Dirty Block

and in parallel

Redo information
 ↓
Redo Log Buffer
```

---

# 34. Full Image

A very useful mental model is:

```
ORACLE INSTANCE
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
SGA PGA
        │                                     │
 ┌──────┼───────────┐                ┌────────┼────────┐
 │      │           │                │        │        │
Buffer Shared Redo Sort Hash Runtime
Cache Pool Buffer Area Area Memory
 │       │           │
♪ Library ♪
♪ Cache ♪
 │       │           │
Disk SQL Plans LGWR
 │                   │
DBWR Redo Log
 │
Datafiles
```

If you understand this diagram, you have the right basis for the Oracle Memory Architecture.

---

# 35. What a Data Developer needs to know

For an Oracle Data Developer / DWH Developer role, I would consider it mandatory to explain:

1. difference SGA vs PGA;
2. what Database Buffer Cache does;
3. logical read vs physical read;
4. what Shared Pool is;
5. Library Cache,
6. hard parse vs soft parse;
7. why we use the bind variables;
8. Redo Log Buffer,
9. COMMIT → LGWR relationship;
10. dirty buffers and DBWR;
11. PGA for SORT, HASH JOIN, GROUP BY;
12. PGA → TEMP relationship;
13. why a query DWH can consume a lot of memory;
14. What Optimal / One-pass / Multi-pass is.

---

## Questions and answers

**What difference exists between SGA and PGA?**

SGA is the shared memory of the Oracle court, while PGA is mainly the private memory of the Oracle trials and is also used for operations such as apron and hash.

---

**Where are the cache-here are the blocks read from datafiles?**

In:

```
Database Buffer Cache
```

of SGA.

---

**Where to store execution plans?**

In:

```
Library Cache
```

of Shared Pool.

---

**What is hard parse?

The Oracle shall analyse the SQL- and generate or select a plan execution involving parsing, checking and optimizer.

---

**Why are you important?**

Among other things, they allow re-use of trainees and reduce the number of hard parses.

---

**Where does a Hash Join run?**

Working structures are mainly in PGA; if memory is insufficient, Oracle can use TEMP.

---

**What is LGWR doing?**

Write the redo information from Redo Log Buffer in online redo logs.

---

**What is DBWR doing?**

Write dirty buffers from Database Buffer Cache to datafiles.

---

**At COMMIT Oracle immediately writes the blocks in datafiles?**

Not necessarily. The main mechanism for confirming the sustainability of the transaction involves writing redo required through LGWR.

---

# 37. Exercises for Oracle 26ai

### Exercise 1 - Memory parameters

```
SHOW PARAMETER memory;

SHOW PARAMETER sga;

SHOW PARAMETER pga;
```

Identify:

```
MEMORY_TARGET
SGA_TARGET
PGA_AGGREGATE_TARGET
```

---

### Exercise 2 = SGA information

With appropriate privileges:

```
SELECT *
FROM v $safinfo;
```

Identify:

```
Buffer Cache
Shared Pool
Redo Buffers
```

---

### Exercise 3 - PGA

```
SELECT
value
FROM v $pgastat;
```

Follow metrics related to:

```
PGA
workareas
cache hit percenage
```

---

### The 4th exercise generates an apron

```
SELECT *
FROM transactions
ORDER BY transaction_date,
amount;
```

Analyze the plan's execution and look for:

```
SORTQ1QX BY
```

---

### Exercise 5 is generating a Hash Join

```
SELECT c.customer_id,
SUM (t.amount)
FROM customers c
JOIN transactions t
ON t.customer_id = c.customer_id
GROUP BY c.customer_id;
```

Analyze:

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

and seek:

```
HASH JOIN
HASHQ1QX BY
```

---

# 38. Real Scenario DWH

You have an ETL:

```
STG_TRANSACTION
       +
DIM_CUSTOMER
       +
DIM_ACCOUNT
       ↓
FACT_TRANSACTION
```

SQL- executes:

```
2 HASH JOIN
1 GROUP BY
1 SORT
```

You notice the job takes 40 minutes.

The investigation should include:

```
Implementation Plan
      ↓
Cardinality
      ↓
Buffer Gets
      ↓
PGA usage
      ↓
TEMP usage
```

If you notice:

```
Hash Join
   ↓
multi-pass
   ↓
Very large TEMP
```

The problem can be linked not only to SQL/indexes, but also to the size of the workshop and PGA.

---

# 39. Link to previous modules

Memory Architecture links almost all concepts studied so far:

```
SQL
 ↓
Optimizer
 ↓
Implementation Plan
 ↓
Indexes / Join Algorithms
 ↓
Memory
 ↓
I/O
 ↓
Performance
```

For example:

```
Nested Loops
```

can benefit greatly from Buffer Cache.

Whereas:

```
Hash Join
```

depends heavily on PGA.

And again:

```
ORDER BY
GROUP BY
Analytics
```

may consume:

```
PGA + TEMP
```

---

# 40. Summary to be memorized

for review, remember the image:

```
SGA = shared memory

SGA:
Buffer Cache
Shared Pool
Library Cache
Dictionary Cache
Redo Log Buffer

PGA = private working memory

PGA:
Sort
Hash
SQL runtime

SELECT:
Shared Pool
        ↓
Buffer Cache
        ↓
Datafiles if the block is not in cache

DML:
Buffer Cache → dirty blocks
Redo Log Buffer → LGWR → Redo Logs
DBWR → Datafiles

Large SORT / HASH:
PGA
     ↓
if it doesn't fit
     ↓
TEMP
```

**technical discussion phrase worth remembering:**

> Oracle uses SGA for shared court memory, especially block caching, SQL and redo and PGA as a memory work for processes and operations such as apron and hash. SQL performance depends not only on the execution plan and indexes, but also on how effective Oracle can perform memory operations before being forced to do I/O or use TEMP.

---

## Questions and answers

### How would you briefly explain Memory Architecture to a colleague who knows SQL, but not this area?

Memory Architecture covers SGA and PGA, buffer cache and shared pool, library cache and parsing. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Memory Architecture?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Memory Architecture, explicitly follow SGA and PGA, buffer cache and shared pool, library cache and parsing and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Memory Architecture appears along with logging, auditing, reconciliation and impact analysis.
