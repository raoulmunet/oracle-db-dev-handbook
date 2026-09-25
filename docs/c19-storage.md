---
title: 'C19. Oracle Storage'
description: 'Complete English handbook chapter based on the original C19 course.'
sidebar_position: 19
---

# C19. Oracle Storage

<div className="chapter-kicker">Chapter C19 · Complete course</div>

## 19.1. What does "storage" mean in Oracle

Oracle Storage describes **as how the** data is physically organized and stored to an Oracle base.

As a developer, you don't necessarily need to manage the records or database files, but you need to understand the route:

```
Database
   ↓
Tablespace
   ↓
Dataphiles
   ↓
Segment
   ↓
Exciting
   ↓
Block Oracle
   ↓
Rows
```

This is one of the most important mental schematics of the module.

However, it should be noted that the above scheme combines two perspectives:

```
PHYSICAL LOGICAL

Tablespace - - - - - - - - - - - - - - - - - - - - - - - Datafile
    │
    ↓
Segment
    ↓
Exciting
    ↓
Block Oracle
    ↓
Row
```

---

# 19.2. Logical Storage vs Physical Storage

The Oracle deliberately separates:

### Logical structure

```
Tablespace
Segment
Exciting
Block
```

### Physical structure

```
Dataphiles
Control files
Redo log files
```

In this way we are particularly interested in the relationship:

```
Tablespace
     ↓
Datafils (s)
```

A tablespace is a logical **construction.

A datafile is a **physical** file.

---

# 19.3. Tablespace

An **tablespace** is a logical container for the objects of the database.

For example:

```
USERS
DATA
INDEXES
UNDO
TEMP
```

A tablespace may have one or more datafiles.

Conceptual example:

```
TABLESPACE DWH_DATA

        │
- dwh_data01.dbf
- dwh_data02.dbf
- dwh_data03.dbf
```

However, the tables are not stored directly in a datafile from the perspective of the developer.

They have an **segment**, and the segment uses space from the tablespace.

---

# 19.4. Datafils

The datafile is the physical file in which Oracle actually stores the blocks of the database.

Conceptual example:

```
/ u01 / oradata / FREE/users01.dbf
```

A tablespace may contain:

```
TABLESPACE DATA

Date 01 dbf
date 02.dbf
Date 03 dbf
```

The Oracle manages within them the blocks and the extras.

---

# 19.5. Segment

An **segment** represents the space allocated to an object.

The most important types are:

```
TABLE segment
INDEX segment
LOB segment
UNDO segment
TEMP segment
```

For example:

```
CREATE TABLE sales (
sale_id NUMBER,
sale_date DATE,
amount NUMBER
);
```

Oracle creates conceptually:

```
SALES
   ↓
TABLE SEGMENT
   ↓
EXTENTS
   ↓
BLOCKS
```

An index:

```
CREATEQ1QX ix_sales_date
ON sales (sale_date);
```

has its own segment:

```
IX_SALES_DATE
       ↓
INDEX SEGMENT
       ↓
EXTENTS
       ↓
BLOCKS
```

So the table and index are different objects, and they occupy separate space.

---

# 19.6. Table Segment

The difference is important:

```
TABLE
```

is the logical object of SQL.

```
TABLE SEGMENT
```

is the storage structure used to preserve the data of that object.

Similar:

```
INDEX
   ↓
INDEX SEGMENT
```

---

# 19.7. Exciting

A segment doesn't get blocks one by one.

Oracle allocates groups of blocks called **extins**.

The structure is:

```
SEGMENT
   │
- EXTENT 1
► ►
► ►
¶ Block
   │
- EXTENT 2
► ►
► ►
¶ Block
   │
− EXTENT 3
```

As the table increases:

```
full segment
    ↓
Oracle allocates a new ecstasy
    ↓
Table may continue to increase
```

---

# 19.8. Oracle Block

**Oracle Database Block** is the fundamental unit of logical I/O for the base Oracle.

Typical example:

```
8 KB
```

But size can vary.

A block contains several rows:

```
Block Oracle

+----------------------------------+
♪ Block leader ♪
+----------------------------------+
# Row directory #
+----------------------------------+
♪ Row A ♪
♪ Row B ♪
♪ Row C ♪
♪ Row D ♪
|                                  |
Free space
+----------------------------------+
```

Conceptual:

> Oracle mainly reads blocks, not a single row isolated from the disk.

This explains a lot of performance tuning concepts.

---

# 19.9. Why do blocks matter for SQL

We assume:

```
SELECT *
FROM sales;
```

The Oracle may execute:

```
TABLEQ1QX FULL
```

and will read the blocks of the segment.

If there is an index:

```
SELECT *
FROM sales
WHERE sale_id = 100;
```

the route may become:

```
INDEX
   ↓
ROWID
   ↓
TABLE BLOCK
   ↓
ROW
```

Exactly why in execution plan we often see:

```
TABLE ACCESS BY INDEX ROWID
INDEUNIQUE SCAN
```

This explains the mechanism already discussed at **Index** and **Execution Plans**.

---

# 19.10. ROWID and the Oracle storageul

ROWID indicates the physical position of a row.

Conceptual contains information about:

```
date object
tabs
block
row
```

You can see:

```
SELECT rowid,
employee_id,
last_name
FROM
FETCH FIRST 10 ROWS ONLY;
```

Example:

```
ROWID EMPLOYEE_ID
------------------  -----------
AAAR3SAAAAAAAVXAAA 100
AAAR3saAAAAAAVXAAB 101
```

Mental model:

```
INDEX KEY
   ↓
ROWID
   ↓
Block Oracle
   ↓
Row
```

---

# 19.11. The Complete Relationship of Tablespace → Row

Important scheme:

```
DATABASE
   │
   ↓
TABLESPACE
   │
   ↓
DATAFILE
   │
   ↓
SEGMENT
   │
   ↓
EXTENT
   │
   ↓
BLOCK
   │
   ↓
ROW
```

But more conceptually correct:

```
TABLESPACE
                   │
           ┌───────┴───────┐
           │               │
DATAFILE DATAFILE
                          

TABLE
  ↓
SEGMENT
  ↓
EXTENTS
  ↓
BLOCKS
  ↓
ROWS
```

The segment receives space from the tablespace, and those blocks are physically in the datafiles.

---

# 19.12. How a Table Grows

We assume:

```
INSERT INTO sales...
```

repeated a million times.

Conceptual:

```
Is there a block has free space?
       │
- YES → insert row
       │
- NO
            ↓
another block
            ↓
Excited?
            │
− NO
            │
- YES
                 ↓
allocate ecstasy
```

Oracle manages mostly these operations automatically.

---

# 19.13. High Water Mark; HWM

A very important concept for FULL TABLE SCAN is **High Water Mark**.

HWM marks about the limit to which the segment was used.

Conceptual:

```
Block 1
Block 2
Block 3
Block 4
Block 5
Block 6
Block 7
Block 8
-- HWM
Block 9
Block 10
```

A full scan reads the blocks to HWM.

---

# 19.14. DELETE and High Water Mark

We assume a very large table:

```
10 million rows
```

We do:

```
DELETE FROM big_table;
COMMIT;
```

The data is logically gone.

But usually HWM is not automatically reduced just because the rows have been deleted.

Conceptual:

```
DELETE

XXXXXXXXXXXXXXX
XXXXXXXXXXXXXXX
XXXXXXXXXXXXXXX
-- HWM

after DELETE

...............
...............
...............
-- HWM
```

The space in the blocks may become reusable, but the segment may remain large.

---

# 19.15. DELETE vs TRUNCATE from storage perspective

Now there's a big difference.

### DELETE

```
DELETE FROM staging_table;
```

Remove the rows, but the segment structure remains.

### TRUNCATE

```
TRUNCATE TABLE staging_table;
```

is much closer to an operation on the segment.

It can generally release / reinitialize the space more efficiently and reset HWM.

Therefore, for the ETL traineeship:

```
TRUNCATE
LOAD
TRUNCATE
LOAD
```

It's a very common pattern.

---

# 19.16. Free space in block

A block doesn't have to be 100% full permanently.

The Oracle shall be able to manage:

```
INSERT
UPDATE
row growth
```

Conceptual:

```
+--------------------------+
♪ ♪ ♪ ♪ ♪
♪ ♪ ♪ ♪ ♪
♪ ♪ ♪ ♪ ♪
|                          |
* FREE SPACE *
+--------------------------+
```

Free space management is usually automatic.

---

# 19.17. ASSM

In the bases of the modern Oracle is common:

**Automatic Sequence Space Management

Oracle automatically manages what blocks they have:

```
a lot of space
low space
almost no vacancy
```

Thus, sessions can effectively find the right blocks for INSERT.

As Data Developer, it is enough to understand conceptually:

> The Oracle maintains the metadata that allows it to find the blocks with available space.

---

# 19.18. PCTFREE - conceptual

PCTFREE reserves part of the block for future growth of rows.

For example:

```
CREATE TABLE custodian (
customer_id NUMBER,
VARCHAR2 (200)
)
PCTFREE 10;
```

Conceptual:

```
Block Oracle

90% usable for initial insertions
10% reserved for updates
```

It is particularly relevant if the rows grow through UPDATE.

---

# 19.19. Row Migration

We assume that a row is initially small:

```
ID = 10
DESCRIPTION = 'ABC'
```

Subsequently:

```
UPDATE
SET description = very large text
WHERE id = 10;
```

If the line is no longer in the original block, Oracle can move the line.

This is called conceptual:

**row migration**.

```
Block A
  ↓
pointer
  ↓
Block B → Row
```

Possible consequence:

```
multiple block access
→ more I/O
→ lower performance
```

---

# 19.20. Row Chaining

**Row changing** appears when the line is so big that it doesn't fit into a single block.

```
ROW
 │
- - Block A
- - Block B
- - Block C
```

Simplified difference:

```
ROW MIGRATION
The row falls into a block,
But he had to be moved.

ROW CHAINING
The row does not fit into a single block.
```

---

# 19.21. The index has its own storage

An B-tree index is also stored in Oracle blocks.

Conceptual:

```
ROOT
                │
        ┌───────┴───────┐
BRANCH BRANCH
        │                │
LEAF BLOCK LEAF BLOCK
```

Leaf blocks contain approximately:

```
index key
+
ROWID
```

Therefore:

```
SELECT *
FROM custodian
WHERE customer_id = 100;
```

can do:

```
INDEX BLOCKS
     ↓
ROWID
     ↓
TABLE BLOCK
```

---

# 19.22. Full Scan Table and Storage

For:

```
SELECT SUM (amount)
FROM sales;
```

The Oracle may consider it effective:

```
TABLEQ1QX FULL
```

Instead of chasing millions of ROWID-uri through the index.

Conceptual:

```
Block 1
Block 2
Block 3
Block 4
Block 5
```

This is one of the reasons why:

> Full Table Scan is not automatically bad.

Especially in DWH, it can be exactly the right access.

---

# 19.23. Storage and Buffer Cache

Data is not permanently read directly from the disk.

Simplified flow:

```
Dataphiles
   ↓
Oracle Database Block
   ↓
Buffer Cache
   ↓
SQL execution
```

If the block already exists in the cache:

```
logical read
```

If it is to be brought from storage:

```
physical read
```

This explains why the metrics:

```
Buffers
Reads
I/O
```

are important in the SQL analysis.

---

# 19.24. Logical I/O vs Physical I/O

### Logical I/O

Oracle is accessing a block in the cache buffer.

### Physical I/O

Oracle needs to read the storage block.

Conceptual:

```
SQL
 ↓
Buffer Cache
 ↓
Block found?
 │
¶ ¶ YES → logical read ¶
 │
- NO
      ↓
disk / storage
      ↓
physical read
      ↓
cache buffer
```

In tuning, reducing the number of blocks accessed can be very important.

---

# 19.25. TEMP Tablespace

Not all SQL operations can be performed exclusively in memory.

Examples:

```
SORT
HASH JOIN
GROUP BY
DISTINCT
analytic functions
```

If the available memory in PGA is not sufficient, Oracle can use TEMP.

Conceptual:

```
SQL
 ↓
PGA
 ↓
Enough memory?
 │
- YES → memory
 │
- NO
      ↓
TEMP
```

This operation is often called conceptual **spill to disk**.

---

# 19.26. PGA and TEMP

Example DWH:

```
SELECT customer_id,
SUM (amount)
FROM fact_sales
GROUP BY customer_id;
```

If FACT\ _ SALES has hundreds of millions of rows:

```
HASH / SORT
    ↓
PGA
    ↓
Insufferable memory
    ↓
TEMP
```

That's why a query can become much slower when it passes from:

```
memory
```

at:

```
TEMP I/O
```

---

# 19.27. UNDO Tablespace

UNDO shall keep information necessary for:

```
rollback
read consistency
MVCC
flashback faces
```

Example:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

The Oracle must be able to reconstruct the previous version of the data.

Conceptual:

```
DATA BLOCK
current version

UNDO
previous version
```

This mechanism is fundamental to the competition of Oracle discussed in module **Transactions**.

---

# 19.28. REDO is not UNDO

The difference is essential:

```
UNDO
How do we get back to the old version?

REDO
How do we restore the changes if the base needs to be recovered?
```

Simplified:

```
UPDATE

¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶
     │
change data block
     │
¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶
```

---

# 19.29. Redo Log Files

Redo is written in redo log files.

Conceptual:

```
Transaction
    ↓
Redo information
    ↓
Redo Log Buffer
    ↓
LGWR
    ↓
Online Redo Log Files
```

These files are essential to the recovery.

As a developer, you must in particular understand that:

> large volumes of DML generate redo and may be of significant cost.

---

# 19.30. Storage and COMMIT

COMMIT does not mean simply:

> The Oracle writes all the modified blocks immediately in the datafiles.

The main mechanism is:

```
COMMIT
 ↓
relevant persistent redo
 ↓
Transaction commited
```

Modified blocks of buffer cache can later reach the datafiles through DBWR.

This difference is very important.

---

# 19.31. DBWR and LGWR

Two conceptually important Oracle processes:

### LGWR

Write redo:

```
Redo Log Buffer
      ↓
LGWR
      ↓
Redo Log Files
```

### DBWR = Database Write

Write the modified blocks:

```
Buffer Cache
    ↓
DBWR
    ↓
Datafiles
```

At COMMIT, the persistence of the redo is essential.

---

# 19.32. Storage and Partitioning

A partitioned table has several storage segments.

Example:

```
CREATE TABLE fact_sales (
sale_date DATE,
amount NUMBER
)
PARTITION BY RANGE (sale_date)
(
PARTITION p2025 VALUES LESS THAN (DATE '2026-01-01'),
PARTITION p2026 VALUES LESS THAN (DATE '2027-01-01')
);
```

Conceptual:

```
FACT_SALES

● P2025 → segment
 │             ↓
(PHP 4 = 4.1.0)
 │             ↓
♪ Blocks ♪
 │
● P2026 → segment
               ↓
extins
               ↓
Blocks
```

This explains why a partition can be:

```
moved
truncated
dropped
exchanged
```

almost independent of the others.

---

# 19.33. Partition pruning from the storage perspective

Query:

```
SELECT SUM (amount)
FROM fact_sales
WHERE sale_date = DATE '2026-09-01'
AND sale_date; DATE '2026-10-01';
```

No pruning:

```
P2024
P2025
P2026
P2027
   ↓
many blocks
```

With pruning:

```
P2026
  ↓
less blocks
```

The principle is very important:

> Many Oracle tuning techniques essentially aim to reduce the number of blocks to be processed.

---

# 19.34. Storage and Direct Path Insert

In ETL/DWH we can meet:

```
INSERT / * + APPEND * /
INTO fact_sales
SELECT...
FROM staging_sales;
```

Conceptual, direct-path insert can write data in new blocks over the currently used area of the segment, instead of traditionally searching for space in existing blocks.

It is optimized for:

```
bulk load
ETL
DWH
```

not for every small INSERT OLTP.

---

# 19.35. Storage OLTP vs DWH

Features of OLTP and DWH
- - - - - - - - -
Many small DML operations - bulk load + large scans -
Access is limited by many lines
= = sync, corrected by elderman = = @ elder _ man
Full scan often unwanted; frequently normal;
♪ Partitioning sometimes very important ♪
The TEMP can be very large
♪ Parallelism is limited ♪
* * * * * *

---

# 19.36. Example DWH complete

We have:

```
FACT_TRANSACTIONS
2 billion rows
```

Partitioned monthly:

```
P202601
P202602
...
P202612
```

Query:

```
SELECT customer_id,
SUM (amount)
FROM fact_transactions
WHERE transaction_date = DATE '2026-09-01'
AND transaction_date - DATE '2026-10-01'
GROUP BY customer_id;
```

Conceptual flux:

```
SQL
 ↓
Optimizer
 ↓
partition pruning
 ↓
P202609 segment
 ↓
extins
 ↓
Blocks
 ↓
Buffer Cache / direct reads
 ↓
HASHQ1QX BY
 ↓
PGA
 ↓
TEMP if necessary
 ↓
Result
```

This example links:

```
Storage
Partitioning
Optimizer
Implementation Plan
PGA
TEMP
I/O
DWH
```

---

# 19.37. As you see tablespaces

```
SELECT tablespace_name,
status,
contents
FROM user_tablespaces;
```

Depending on privileges, an DBA can see more information in:

```
DBA_TABLESPACES
DBA_DATA_FILES
DBA_TEMP_FILES
```

---

# 19.38. As you see the segment of an object

With sufficient privileges:

```
SELECT segment_name,
segment_type,
tablespace_name,
bytes / 1024 / 1024 AS mb
FROM user_segments
ORDER BY bytes DESC;
```

Very useful for the developer:

```
SEGMENT_NAMEQ1QX MB
------------------  -------------  ----
FACT_SALES TABLE 5200
IX_SALES_DATE INDEX 850
CUSTOMERS TABLE 120
```

---

# 19.39. Extins

You can investigate:

```
SELECT segment_name,
extent_id,
bytes / 1024 / 1024 AS mb
FROM user_extents
WHERE segment_name = 'FACT_SALES'
ORDER BY extent_id;
```

Conceptually you will see:

```
FACT_SALES
   ↓
ecstasy 0
(PHP 4 = 4.1.0)
ecstasy 2
ecstasy 3
...
```

---

# 19.40. Size of a segment

For example:

```
SELECT segment_name,
segment_type,
ROUND (bytes / 1024 / 10242) AS mb
FROM user_segments
WHERE segment_name = 'EMPLOYEES';
```

Important:

> the number of rows and the size of the segment are not the same.

You may have few lines, but a large segment if previously there were many data.

---

# 19.41. Storage and COUNT (\ *)

Suppose:

```
SELECT COUNT *
FROM fact_sales;
```

If the table needs to be scanned:

```
segment
 ↓
extins
 ↓
Blocks
 ↓
scan
```

The cost is much closer to:

```
How many blocks do we need to read?
```

than by the simple idea:

```
How many lines does the table have?
```

This is an extremely useful mental rule.

---

# 19.42. Storage and Clustering Factor

Clustering The factor of an index reflects roughly how well the index order corresponds to the physical order of rows in table blocks.

Good example:

```
INDEX

1 → Block 10
2 → Block 10
3 → Block 10
4 → Block 11
5 → Block 11
```

Poor example:

```
1 → Block 10
2 → Block 500
3 → Block 12
4 → Block 800
5 → Block 23
```

In the second case, the range scan index can cause many access blocks.

This directly links:

```
Storage
+
ROWID
+
index
+
Optimizer
```

---

# 19.43. The conceptual fragmentation

The term "fragmentation" is sometimes used too generically.

A segment may have:

```
empty blocks
partially occupied blocks
space available under HWM
free space in tablespace
```

This does not automatically mean that a reorganisation operation must be performed.

Practical rule:

> Do not reorganize segments just because they seem fragmented; there must be a real issue of storage or performance.

---

# 19.44. SHRINK / MOVE

Operations such as:

```
ALTER TABLE...
SHRINK SPACE;
```

or

```
ALTER TABLE...
MOVE;
```

I can reorganize the storageof a table.

As a developer, the important thing is to know **why there is**, not to run it automatically.

Can be used in situations of:

```
segment reorganisation
Reportaim space
HWM reduction
```

but have implications for:

```
locking
indexes
availability
redo
```

and have to be planned.

---

# 19.45. Bigfile vs Smallfile Tablespaces

Conceptual exists:

```
SMALLFILE TABLESPACE
```

and

```
BIGFILE TABLESPACE
```

### Smallfile

Maybe he has more datafiles.

### Bigfile

It's designed around a very large datafile.

For Data Developer, the difference is mainly administrative; the SQL logic of the application remains the same.

---

# 19.46. Permanent vs Temporary vs Undo

The three important categories:

```
PERMANENT TABLESPACE
→ tables
→ indexes
→ LOBs

TEMPORARY TABLESPACE
→ sorts
→ hashes
→ temporary operations

UNDO TABLESPACE
→ undo records
→ read consistency
→ rollback
```

Simple scheme:

```
DATABASE STORAGE
                │
     ┌──────────┼──────────┐
     │          │          │
Permanent TEMP UNDO
     │          │          │
tablets sort / hash rollback
indexes MVCC
LOBs
```

---

# 19.47. What a Data Developer needs to know and what more to do with DBA

### Data Developer must understand well

```
block
segment
ecstasy
tablespace
ROWID
HWM
Full scan
indexes and table blocks
TEMP/PGA
UNDO/REDO conceptual
partition storage
I/O
```

### More DBA area

```
disk groups
ASM administration
multiplexing control files
redo log sizing
Date of management
Storage hardware
backup storage
I/O subsystem configuration
```

However, it is useful to know what it represents.

---

# 19.48. ASM; very conceptual

In enterprise systems, Oracle can use:

**ASM

Conceptual:

```
Oracle Database
      ↓
ASM
      ↓
Disk Groups
      ↓
Physical Storage
```

ASM manages the Forklift for Oracle and can distribute data over several devices.

For the role of Data Developer:

> you need to know what ASM is, but its administration is mainly related to DBA.

---

# 19.49. A Complete Mental Model

For a query:

```
SELECT *
FROM custodian
WHERE customer_id = 100;
```

think:

```
SQL
 ↓
Optimizer
 ↓
Index
 ↓
Index Blocks
 ↓
ROWID
 ↓
Block Tables
 ↓
Buffer Cache
 ↓
Row
```

For DWH:

```
SELECT SUM (amount)
FROM fact_sales
WHERE sale_date BETWEEN...
```

think:

```
SQL
 ↓
Partition pruning
 ↓
Segment relevance
 ↓
Extins
 ↓
Blocks
 ↓
Full / parallel scan
 ↓
Buffer / PGA
 ↓
TEMP if required
 ↓
Aggregation
```

These two flows explain much of the difference between **OLTP** and **DWH**.

---

# 19.50. Common conceptual mistakes

### 1. "The Table is the Data."

False.

```
Tables
 ↓
Segment
 ↓
Tablespace
 ↓
Dataphiles
```

---

### 2. The Oracle reads directly the row on the disk.

Too simplified.

In reality:

```
block
 ↓
cache buffer
 ↓
row
```

---

### 3. "DELETE" completely releases the squeeze.

Not necessarily.

DELETE eliminates logical rows, but the segment and HWM may remain.

---

### 4. "Full Table Scan" means stupid query.

False.

In DWH is often the right choice.

---

### 5. The Index does not occupy much storage.

He can handle a lot, especially on big facts.

---

### 6. * COMMIT writes all table blocks on the disk.

This is not the fundamental condition for COMMIT.

Persistence redo is the key.

---

## Questions and answers

### Question 1

**What is the difference between tablespace and datafils?**

Answer:

> The tablet is a logical storage structure, and the datafileul is the physical file in which the blocks associated with the tablet are stored.

---

### Question 2

**What is the relationship between segment, ecstasy and block?**

```
Segment
  ↓
Extins
  ↓
Blocks
```

A segment receives space in the form of ecstasy, and each ecstasy contains Oracle blocks.

---

### Question 3

**What is the smallest logical storage unit Oracle?**

In this hierarchy:

> Oracle Database Block.

---

### Question 4

**What is ROWID?

> Identifier allowing Oracle to physically locate a row, including the block in which it is located.

---

### Question 5

**What is High Water Mark?

> The limit to which a segment has used blocks and which is relevant, inter alia, for full table scans.

---

### Question 6

**Why DELETE and TRUNCATE behave differently from the storage perspective?**

DELETE removes the rows, while TRUNCATE operates more directly on the segment and can reset / remove the allocated space more efficiently.

---

### Question 7

**What is row migration?

> Moving a row into another block because following an update no longer fits into the original block.

---

### Question 8

**What is the difference between TEMP and UNDO?**

```
TEMP → work for apron / hash, etc.
UNDO → previous versions for rollback and read consistency.
```

---

### Question 9

**What is the difference between logical read and physical read?

```
logical read
→ access to the block through the cache buffer

physical read
→ The block must be brought from storage
```

---

### Question 10

**What happens to COMMIT?**

A good technical discussion response:

> The Oracle must ensure the persistence of the redo information required for the transaction. The modified data blocks must not necessarily all be written in the datafiles at that exact time.

---

# 19.52. Oracle Exercise 26ai

In your DEV\ _ LAB scheme, it creates:

```
CREATE TABLE storage_test (
NUMBER,
description VARCHAR2 (1000)
);
```

Enter data:

```
INSERTQ1QX storage_test
SELECT level,
RPAD ('X', 500, 'X')
FROM dual
CONNECT BY level = 10000;

COMMIT;
```

Check the segment:

```
SELECT segment_name,
segment_type,
bytes / 1024 / 1024 AS mb
FROM user_segments
WHERE segment_name = 'STORAGE_TEST';
```

See ROWID:

```
SELECT rowid,
d
FROM storage_test
FETCH FIRST 20 ROWS ONLY;
```

Delete:

```
DELETE FROM storage_test;

COMMIT;
```

Check the segment size again.

Then:

```
TRUNCATE TABLE storage_test;
```

and investigate again.

The purpose of the exercise is to observe the difference between:

```
number of rows
```

and:

```
segment storage
```

---

# 19.53. Real script DWH

You have:

```
FACT_TRANSACTION
3 TB
```

Partitioned monthly.

A month's report takes 40 minutes.

The investigation shall combine:

```
1. partition pruning?
2. How many partitions are accessed?
3. How many blocks are read?
4. Is Full Table Scan reasonable?
5. Is there parallel execution?
6. HASH JOIN / GROUP BY use PGA?
7. Is there spill in TEMP?
8. Are the statistics correct?
```

Notice something important:

The problem can no longer be seen as:

```
The SQL- is slow
```

but as:

```
SQL
 ↓
Optimizer
 ↓
Access Path
 ↓
Segments / Parties
 ↓
Blocks
 ↓
Memory
 ↓
I/O
 ↓
TEMP
```

This is the correct model for Troubleshooting Oracle at Data Developer level.

---

# 19.54. Link to previous modules

Oracle Storage is the place where many concepts studied separately unite:

```
Index
   ↓
index blocks + ROWID

Execution Plans
   ↓
How many blocks and how do I access them?

Statistics
   ↓
How much does the optimiser estimate to read?

Join Algorithms
   ↓
PGA / TEMP / block access

Partitioning
   ↓
separate segments + pruning

Material Views
   ↓
Additional segments for pre-composite results

Transactions
   ↓
UNDO + REDO

ETL
   ↓
bulk load + APPEND + partition operations

DWH
   ↓
large volumes + full scans + parallel I/O
```

---

# 19.55. The Most Important Mental Rule

When you analyze the performance of an SQL, think about it:

```
How many BLOCURI must process Oracle
and
Does CUM get to them?
```

Rather than just think about:

```
How many lines does the query return?
```

A query can return:

```
1 row
```

but to read:

```
10 million blocks
```

to find her.

---

# 19.56. What should remain

for review and for the activity of **Oracle Data Developer / DWH Developer**, you must be able to reproduce from memory:

```
DATABASE
   ↓
TABLESPACE
   ↓
SEGMENT
   ↓
EXTENT
   ↓
BLOCK
   ↓
ROW
```

and know that physically:

```
TABLESPACE
   ↓
DATAFILE (S)
```

Then understand relationships:

```
Index → ROWID → Table Block

Full Scan → Many Table Blocks

DELETE EXCIPIENTS TRUNCATE

HWM → relevant for Full Scan

PGA insufficient → TEMP

UNDO → rollback / read consistency

REDO → recovery

COMMIT → redo should be done persistently

Partition → segment separately

Performance → to a large extent block access + memory + I/O
```

### Very short formula for memory

```
Logical storage:
TABLESPACE
→ SEGMENT
→ EXTENT
→ BLOCK
→ ROW

Physical storage:
TABLESPACE
→ DATAFILE

Query execution:
SQL
→ access path
→ blocks
→ memory / I/O
→ Result
```

This is the conceptual level of **Oracle Storage** that I would consider mandatory before moving to the deeper Oracle architecture: **SGA/PGA, Buffer Cache, Redo Log Buffer, background processes, checkpoints and internal I/O**.

---

## Questions and answers

### How would you briefly explain Oracle Storage to a colleague who knows SQL, but not this area?

Oracle Storage is a conceptual level that covers data blocks, extins and segments, tablespaces and datafiles, logical vs physical storage. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Oracle Storage at conceptual level?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For the Oracle Storage is conceptual, I explicitly follow data blocks, extins and segments, tablespaces and datafiles, logical vs physical storage and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the Oracle Storage is developed together with logging, auditing, reconciliation and impact analysis.
