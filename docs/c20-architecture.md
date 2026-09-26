---
title: 'C20. Oracle Architecture'
description: 'Complete English handbook chapter based on the original C20 course.'
sidebar_position: 20
---

# C20. Oracle Architecture

<div className="chapter-kicker">Chapter C20 · Complete course</div>

Oracle Architecture explains **how the Oracle** database is organized internally, how an SQL application circulates and how memory, processes and physical files work together.

For an **Oracle Data Developer / PL/SQL Developer / DWH Developer**, you don't need to know architecture at DBA level, but you need to understand enough to explain things like:

- what INSTANCE is and what DATABASE is;
- what are SGA and PGA;
- where an SELECT arrives;
- what happens to COMMIT;
- what role have redo, undo and datafiles;
- what are CDB and PDB;
- why the modification is sometimes confirmed before the block is written in the datafiles;
- what the main background processes do.

---

## 20.1 Overview

The Oracle Architecture can be seen as follows:

```
Client Application
       |
       v
Oracle Listener
       |
       v
Server Process
       |
       v
+-------------------------------+
* ORACLE INSTANCE *
|                               |
|   +-----------------------+   |
SGA
|   |                       |   |
| Shared Pool |
| Buffer Cache |
| Redo Log Buffer |
|   +-----------------------+   |
|                               |
| Background Process |
* DBWn LGWR CKPT SMON PMON
+---------------+---------------+
                |
                v
+-------------------------------+
* ORACLE DATABASE *
|                               |
Datafiles
| Control Files |
Online Redo Logs
| Tempfiles |
+-------------------------------+
```

The central concept is:

```
Oracle instance
    +
Oracle Database
```

---

## 20.2 Oracle instance vs. Oracle database

This is one of the most important questions and answers.

## Oracle instance

An **Oracle instance** consists of:

```
Memory
+
Processes
```

More specifically:

```
Instance
− SGA
"Background Processes"
```

The instance exists only while Oracle is running.

At the shutdown:

```
SGA disappears
background processes disappear
```

---

## Oracle Database

Oracle Database represents mainly **persistent** files:

```
Database
¶ ¶ Datafiles ¶
"Control Files"
- Online Redo Log Files
```

The database files remain on disk even when the instance is stopped.

---

## Formula to remember

```
INSTANCE = memory + processes

DATABASE = files on disk
```

or:

```
Oracle Server
=
Oracle instance
    +
Oracle Database
```

---

## 20.3 SGA; System Global Area

The SGA is the main area of shared memory for an Oracle instance.

It is shared by Oracle processes.

Important components:

```
SGA
├── Database Buffer Cache
├── Shared Pool
│   └── Data Dictionary Cache
├── Redo Log Buffer
├── Large Pool
├── Java Pool
└── Streams Pool
```

For the developer, the three most important are:

```
Buffer Cache
Shared Pool
Redo Log Buffer
```

---

## 20.4 Database Buffer Cache

Buffer Cache keeps **copies of Oracle blocks read from** datafiles in memory.

Suppose:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

Oracle is looking for the necessary block first in:

```
Buffer Cache
```

If the block exists:

```
logical read
```

If the block does not exist:

```
physical read
```

and Oracle reads it from:

```
Data sheets → buffer cache
```

Flow:

```
SELECT
   |
   v
Buffer Cache
   |
+ -- block found → use
   |
+ -- absent block
           |
           v
Dataphiles
           |
           v
Buffer Cache
```

---

## 20.5 Logical Read vs Physical Read

These concepts frequently appear in the performance tuning.

## Logical read

The block is accessed from Buffer Cache.

```
memory access
```

It's usually much faster.

---

## Physical read

The block has to be read off the storage.

```
disk / storage → memory
```

It's much more expensive.

That's why Oracle is trying to reuse the cache blocks.

---

## 20.6 Dirty Blocks

When you do:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle doesn't immediately write the modification directly into the datafiles.

The block is modified in Buffer Cache.

It becomes:

```
dirty block
```

I mean:

> the memory version differs from the existing version on the disk.

Later on the DBWn trial writes it in the datafiles.

---

## 20.7 Shared Pool

Shared Pool contains reusable information between SQL executions.

The most important components:

```
Shared Pool
- Library Cache
- Data Dictionary Cache
```

---

## 20.8 Library Cache

Library Cache contains among others:

- SQL parseuit;
- PL/SQL compiled;
- execution plans;
- Cursors.

Example:

```
SELECT *
FROM
WHERE employee_id =: id;
```

The first execution may require:

```
parse
semantic checks
Optimizer
execution plan
```

The following executions may re-use the cursor.

This is the idea behind it:

```
soft parse
```

---

## 20.9 Hard Parse vs Soft Parse

## Hard Parse

The Oracle must do:

```
syntax check
      ↓
semantic check
      ↓
Object privilege check
      ↓
Optimizer
      ↓
execution plan
```

Relatively high cost.

---

## Soft Parse

The plan already exists in Shared Pool.

Oracle can reuse it.

```
SQL
 ↓
there is cursor
 ↓
executes
```

---

## 20.10 Why are bind variables important?

Compare:

```
SELECT *
FROM
WHERE employee_id = 100;
```

and:

```
SELECT *
FROM
WHERE employee_id = 101;
```

Under certain conditions they can generate distinct SQL statements.

Better:

```
SELECT *
FROM
WHERE employee_id =: emp_id;
```

Thus the same cursor can be reused.

Advantages:

```
less hard parses
less CPU
Less pressure on Shared Pool
better scalability
```

---

## 20.11 Date of Dictionary Cache

The Oracle keeps in memory information about the objects of the database.

Examples:

```
tables
Columns
users
opuleges
Constraints
indexes
```

If you run:

```
SELECT salary
FROM employment;
```

The Oracle must know:

```
Is there an employees table?
Is there a salary column?
Do you have SELECT privileges?
```

The information comes from the dictionary date and they're cache-look.

---

## 20.12 Redo Log Buffer

Redo Log Buffer contains information about changes made to the database.

Example:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

The Oracle generates:

```
redo entries
```

describing the modification.

Simplified:

```
UPDATE
   |
--------- Buffer Cache → modified block
   |
```

---

## 20.13 LGWR - Log Writer

Process:

```
LGWR
```

write the content of Redo Log Buffer in:

```
Online Redo Log Files
```

It's critical for transactions.

---

## 20.14 What happens to COMMIT

This is one of the most important Oracle sequences.

You have:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

COMMIT;
```

Simplified:

```
UPDATE
  |
+ → Buffer Cache
  |
+ → Redo Log Buffer
```

At:

```
COMMIT
```

Oracle asks LGWR to write the corresponding redo in the online redo log.

```
Redo Log Buffer
      |
* * *
      v
Online Redo Log
```

Once this writing is confirmed:

```
COMMIT Success
```

---

## 20.15 A very important thing

In COMMIT, Oracle **should not necessarily write the modified block in** datafiles.

The block can stay dirty in Buffer Cache.

I mean:

```
COMMIT
   ↓
redo is safe on the disk

but

The block date may still be in RAM
```

It allows Oracle to make a very quick commit.

---

## 20.16 DBWn = Database Writer

DBWn writes dirty blocks from Buffer Cache in datafiles.

```
Buffer Cache
   |
dirty blocks
   |
(PHP 4 = 4.1.0)
   v
Datafiles
```

Important:

```
LGWR EXCIPIENTS DBWn
```

LGWR writes:

```
redo
```

DBWn writes:

```
date blocks
```

---

## 20.17 Write-Ahead Logging Regulation

Oracle complies with the principle of:

```
redo before data
```

That is, the redo required for recovery must be written before the modified block is written in the datafiles.

It allows recovery after crash.

---

## 20.18 Online Redo Logs

Online Redo Logs contain redo generated by database changes.

Conceptual example:

```
redo01.log
redo02.log
redo03.log
```

Oracle writes circular:

```
redo01
   ↓
redo02
   ↓
redo03
   ↓
redo01
```

This process involves:

```
log switch
```

---

## 20.19 Archived Redo Logs

If the base is running in:

```
ARCHIVELOG
```

online redo logs are archived before being overwritten.

Result:

```
Archived Redo Logs
```

These are important for:

```
backup
recovery
point-in-time recovery
Data Guard
```

---

## 20.20 Datafiles

Datafiles effectively contains database data.

That's where they're stored:

```
tables
indexes
LOBs
undo
etc.
```

But the Oracle logically organizes the storageby:

```
Tablespace
   ↓
Segment
   ↓
Exciting
   ↓
Block
```

and physically:

```
Tablespace
   ↓
Dataphiles
```

---

## 20.21 Tablespace and Datafiles

A tablespace is a logical structure.

A datafile is a physical file.

Example:

```
USERS tablespace
      |
+ - - - - users01.dbf
+ - - - users02.dbf
```

Important:

```
TABLESPACE = logical
DATAFILE = physical
```

---

## 20.22 Control Files

Control Files contains key structural metadata about the database.

Examples:

```
database
DBID
Date of locations
redo log locations
checkpoint information
SCN information
```

Without valid file control, the base cannot be mounted normally.

---

## 20.23 Tempfiles

TEMP tablespace uses:

```
tempfiles
```

for temporary operations.

Examples:

```
large sorts
hash joins
GROUP BY
ORDER BY
temporary intermediate results
```

If the operation does not fit into the memory:

```
PGA
 ↓
TEMP
```

---

## 20.24 PGA

PGA is a private **memory of the** process.

Unlike SGA:

```
SGA → shared
PGA → Private
```

PGA is used for:

```
sort operations
hash joins
session variables
State cursor
PL/SQL execution memory
```

Conceptual:

```
Session 1
   |
Server Process
   |
PGA 1

Session 2
   |
Server Process
   |
PGA 2
```

---

## 20.25 SGA vs PGA

Very important in the technical discussion:

| Property | SGA | PGA |
| --- | --- | --- |
| Scope | Instance-level | Process/session-level |
| Typical contents | Shared Pool, Buffer Cache, Redo Log Buffer | Private process memory, including sort and hash work areas |
| Shared between processes | Yes | No |

Memorize simply:

```
SGA = shared memory for the instance

PGA = process memory
```

---

## 20.26 Server Process

When a client connects to the Oracle, SQL is executed by:

```
server process
```

Simplified flow:

```
SQL Development
      |
      v
Listener
      |
      v
Server Process
      |
→ PGA
      |
→ SGA
      |
+ →
```

---

## 20.27 Listener

Oracle Listener is the process that receives requests for connection.

Usually:

```
TCP port 1521
```

Flow:

```
Client
   |
Host: 1521
   v
Listener
   |
   v
Oracle Service
   |
   v
Database instance
```

The list does not execute SQL.

He facilitates the connection.

---

## 20.28 SID vs Service

Another very important concept.

## SID

Traditionally identify:

```
instance
```

Example:

```
SID = FREE
```

---

## Service

It's the name of the service through which the client accesses the base.

Example in Oracle Free:

```
FREE
FREEPDB1
```

In multitenent architecture, in practice applications are usually connected by:

```
SERVICE_NAME
```

---

## 20.29 Background Processes

Oracle uses multiple background processes.

The most important:

```
DBWn
LGWR
CKPT
SMON
PMON
ARCn
```

---

## 20.30 DBWn; Database Writer

Rol:

```
dirty buffers
     ↓
datafiles
```

Write the modified blocks of Buffer Cache in the datafiles.

---

## 20.31 LGWR

Rol:

```
Redo Log Buffer
      ↓
Online Redo Logs
```

It is fundamental to:

```
COMMIT
durability
instance recovery
```

---

## 20.32 CKPT - Checkpoint Process

The checkpoint synchronizes the status of the base and helps Oracle know how far the recoveryis needed.

CKPT updates information in:

```
control files
Date of headers
```

Conceptual:

```
Checkpoint
   ↓
Oracle knows:
Up to this point the data are synchronized
```

---

## 20.33 SMON; System Monitor

SMON is responsible for, inter alia:

```
instance recovery
internal cleanup
```

If the instance stops unexpectedly:

```
Crash
```

SMON reboot helps to recover the base.

---

## 20.34 PMON - Process Monitor

PMON deals with cleanup after abnormally completed processes / sessions.

Example:

```
Crash client
   ↓
session disappears unexpectedly
   ↓
PMON cleanup
```

It can release:

```
resources
locks
State process
```

---

## 20.35 ARCn

In ARCHIVELOG mode:

```
Online Redo Log
        |
* *
        v
Archived Redo Log
```

---

## 20.36 CDB and PDB

Modern oracle uses multitenant architecture.

The structure is:

```
CDB
− CDB$ROOT
− PDB$SEED
− PDB1
− PDB2
└── ...
```

---

## 20.37 CDB; Container Database

CDB is the general container.

Includes:

```
CDB$ROOT
PDB$SEED
PDBs
```

---

## 20.38 CDB$ROOT

Root container contains information Common to all CDB.

```
CDB$ROOT
```

is not normally the schema where an ordinary application creates its tables.

---

## 20.39 PDB$SEED

It's the template used to create new PDBs.

```
PDB$SEED
```

Conceptual:

```
PDB$SEED
    |
+ → clones
         |
         v
PDB
```

---

## 20.40 PDB = Pluggable Database

PDB is the logical basis used by applications.

Example in Oracle Database Free:

```
FREE
   |
- FREEPDB1
```

You usually work in:

```
FREEPDB1
```

where you can have:

```
HR
OE
DEV_LAB
DWH_ACCOUNT
```

---

## 20.41 Why PDBs exist

They allow for the logical isolation of several bases in the same Oracle infrastructure.

Conceptual:

```
1 Oracle
       |
       v
1 CDB
       |
   +---+---+
   |       |
PDB1 PDB2
```

Advantages:

```
Consolidation
simplified administration
isolation
cloning
portability
```

---

## 20.42 Connecting to a PDB

Example:

```
Host: 192.168.56.10
Port: 1521
Service: FREEPDB1
```

The client gets to:

```
Listener
   ↓
Service FREEPDB1
   ↓
PDB FREEPDB1
```

---

## 20.43 SCN; System Change Number

SCN is a logical number used by Oracle to order changes over time.

Conceptual:

```
SCN 100
SCN 101
SCN 102
SCN 103
```

It is essential for:

```
consistency
recovery
Flashback
Data Guard
Transaction ordering
```

It must not be regarded strictly as a timestamp, but as a logical order of change.

---

## 20.44 Undo

Undo retains the necessary information to reconstruct previous data versions.

Example:

```
UPDATE accounts
SET balance = 900
WHERE account_id = 1;
```

If before:

```
Balance = 1000
```

Oracle retains the information needed to rebuild the old version.

Undo is used for:

```
ROLLBACK
read consistency
reaction recovery
Flashback
```

---

## 20.45 Redo vs Undo

That's a classic question.

## Redo

Describe the changes needed to be able to reapply them.

Used in:

```
recovery
```

---

## Undo

It allows for the reconstruction of the previous state.

Used in:

```
rollback
read consistency
```

Memorize:

```
REDO = redo the change

UNDO = undo the change
```

But this is just conceptual simplification.

---

## 20.46 Read Consistence and Undo

The Oracle implements:

```
multivariance read consistency
```

Example:

Session A:

```
SELECT balance
FROM accounts
WHERE id = 10;
```

At the same time Session B:

```
UPDATE accounts
SET balance = 500
WHERE id = 10;
```

Oracle can rebuild the consistent version required by Session A using undo.

Conceptual:

```
current block
    +
information
    ↓
consistent version
```

This explains why in Oracle in general:

```
Readers don't block writers
Writers don't block readers
```

with the specific shades of Oracle transactions.

---

## 20.47 What happens when you run an SELECT

Let's watch:

```
SELECT salary
FROM
WHERE employee_id =: id;
```

### 1. The customer sends SQL statement

```
SQL Development
   ↓
Oracle server process
```

### 2. Oracle seeks SQL in Shared Pool

```
Library Cache
```

If there is:

```
soft parse
```

If not:

```
hard parse
```

### 3. Optimizer chooses execution plan

For example:

```
INDEUNIQUE SCAN
        ↓
TABLE ACCESS BY INDEX ROWID
```

### 4. Oracle seeks blocks in Buffer Cache

```
Buffer Cache
```

### 5. If the blocks are missing

```
Dataphiles
   ↓
Buffer Cache
```

### 6. Data are returned

```
Database
   ↓
Server Process
   ↓
Client
```

---

## 20.48 What happens when you run an UPDATE

```
UPDATE
SET salary = salary * 1.10
WHERE employee_id = 100;
```

Simplified:

```
1. Parse SQL
       ↓
2. Find blocks
       ↓
3. Read blocks into Buffer Cache
       ↓
4. Created undo
       ↓
5. Modify buffer
       ↓
6. Generate redo
       ↓
7. Dirty block remains in cache
```

At:

```
COMMIT;
```

```
redo
 ↓
LGWR
 ↓
Online Redo Log
 ↓
comment acknowledged
```

Later:

```
dirty block
 ↓
DBWn
 ↓
Date
```

---

## 20.49 Crash before DBWn

Suppose you did:

```
UPDATE...
COMMIT;
```

LGWR wrote the redo.

But DBWn hasn't written the dirty block in the datafiles yet.

Then the server goes down.

On restart:

```
Online Redo Logs
       ↓
instance recovery
       ↓
the change is re-applied
```

That's why the commission remains valid.

---

## 20.50 Crash before COMMIT

If a transaction has not been committed:

```
uncommited translation
```

The Oracle must ensure that it does not remain visible as data valid after recovery.

By combining:

```
redo
undo
SCN
transaction metadata
```

Oracle recovers the base in a consistent state.

---

## 20.51 Checkpoint

The checkpoint reduces the work needed for recovery.

Very simplified:

```
dirty buffers
     ↓
DBWn
     ↓
datafiles

CKPT
     ↓
update checkpoint information
```

The more recent the basis has a checkpoint, the less redo the recoveryhas to process.

---

## 20.52 Logical and physical architecture

A useful perspective:

## Memory architecture

```
SGA
PGA
```

## Process architecture

```
Server Processes
DBWn
LGWR
CKPT
SMON
PMON
ARCn
```

## Storage architecture

```
Datafiles
Control Files
Redo Logs
Tempfiles
```

## Logical storage

```
Tablespaces
Segments
Extins
Blocks
```

## Multitenant architecture

```
CDB
PDB
```

---

## 20.53 How to Link to Execution Plans

When you see:

```
TABLE ACCESS FULL
```

Oracle must access the blocks of the table.

These may be:

```
already in Buffer Cache
```

or:

```
read from datafiles
```

The plan tells **how the** data is accessed, and architecture explains **where the data is actually located at that time**.

---

## 20.54 How to Link to indexes

Example:

```
INDERANGE SCAN
       ↓
TABLE ACCESS BY INDEX ROWID
```

Oracle:

```
index blocks
     ↓
Buffer Cache
     ↓
ROWID
     ↓
table blocks
```

If the blocks are not in the cache:

```
datafiles → Buffer Cache
```

---

## 20.55 How to tie to JOIN algorithms

For example, a Hash Join mainly uses:

```
PGA
```

for the construction of hash table.

If the hash table does not fit:

```
PGA
 ↓
TEMP
```

Appears:

```
Spill to disk
```

and the query can become significantly slower.

---

## 20.56 How to tie to DWH

In an DWH you frequently:

```
Full table scan
hash joins
parallel query
large sorts
large aggregations
```

It is therefore important to:

```
Buffer Cache
PGA
TEMP
I/O
Parallel Execution
```

Example:

```
SELECT customer_id,
SUM (amount)
FROM fact_sales
GROUP BY customer_id;
```

The operation may require:

```
Full Scan
   ↓
Hash Aggregate
   ↓
PGA
   ↓
TEMP if memory fails
```

---

## 20.57 Dedicated Server vs Shared Server

In the common configuration:

```
Dedicated Server
```

Each session usually has a dedicated process server.

```
Session 1 → Server Process 1
Session 2 → Server Process 2
Session 3 → Server Process 3
```

There are also:

```
Shared server Architecture
```

where several sessions can use a server pool processes.

For most developers it is enough to know the conceptual difference.

---

## 20.58 Startup Oracle - conceptual

The starting of the base is conceptually done in three stages:

```
NOMOUNT
  ↓
MOUNT
  ↓
OPEN
```

---

## NOMOUNT

The Oracle starts:

```
Instance
```

I mean:

```
SGA
+
background processes
```

Read the configuration in:

```
SPFILE / PFILE
```

---

## MOUNT

Oracle reads:

```
control files
```

and find out the structure of the base.

---

## OPEN

Oracle opens:

```
datafiles
redo logs
```

and the base becomes accessible to users.

---

## 20.59 Conceptual Shutdown

At the controlled shutdown:

```
completed sessions
     ↓
transactions completed / rolled back
     ↓
dirty blocks written
     ↓
files synchronized
     ↓
instant stops
```

Known types:

```
SHUTDOWN NORMAL
SHUTDOWN TRANSACTIONAL
SHUTDOWN IMMEDIATE
SHUTDOWN ABORT
```

The most common administrative:

```
SHUTDOWN IMMEDIATE;
```

---

## 20.60 View of architecture in Oracle

As a developer you can see certain information from dynamic performance views.

Examples:

```
SELECT *
FROM V$INSTANCE;
```

```
SELECT *
FROM V$database;
```

```
SELECT *
FROM V$sga;
```

```
SELECT *
FROM V$session;
```

```
SELECT *
FROM V$process;
```

```
SELECT *
FROM V$tablespace;
```

```
SELECT *
FROM V$datafile;
```

```
SELECT *
FROM V$log;
```

```
SELECT *
FROM V$logfile;
```

These views may require additional privileges.

---

## 20.61 Example for your laboratory Oracle 26ai

In your conceptual configuration you have something close to:

```
Oracle Linux VM
       |
       v
Oracle Database 26ai Free
       |
+ -- Instance: FREE
       |
+ -- CDB: FREE
              |
+ -- PDB: FREEPDB1
                     |
+ -- HR
+ -- OE
+ -- DEV_LAB
+ -- DWH_ACCOUNT
```

And the connection in DataGrip / SQL Developer is approximately:

```
Host machine
     |
(PHP 4 = 4.1.0)
     v
Oracle Listener
     |
     v
Service FREEPDB1
     |
     v
Oracle instance FREE
     |
     v
PDB FREEPDB1
```

This model is very useful to understand the connection problems of type:

```
ORA-12541
ORA-17002
ORA-03113
```

because you can identify which layer the problem appears in.

---

## 20.62 Real Scenario: COMMIT in an ETL

You have an ETL:

```
INSERT INTO fact_sales
SELECT...
FROM staging_sales;

COMMIT;
```

Conceptual:

```
INSERT
  |
+ → Data blocks changed in Buffer Cache
  |
+ → Undo generated
  |
+ → Redo generated
          |
          v
Redo Log Buffer

COMMIT
  |
  v
LGWR
  |
  v
Online Redo Logs
```

The blocks of FACT_SALES can be written later by:

```
DBWn
```

---

## 20.63 Real scenario: query DWH slow

You have:

```
SELECT region_id,
SUM (amount)
FROM fact_transactions
GROUP BY region_id;
```

Possible flow:

```
Datafiles
   ↓
Buffer Cache
   ↓
Server Process
   ↓
Hash aggregation
   ↓
PGA
```

If PGA is insufficient:

```
PGA
 ↓
TEMP
```

And performance can go down.

Architecture therefore helps to interpret:

```
logical read
Physical reads
TEMP usage
PGA usage
execution plan
```

---

## 20.64 Real Scenario: Too many hard parses

The application generates:

```
SELECT * FROM customers WHERE id = 100;
SELECT * FROM customers WHERE id = 101;
SELECT * FROM customers WHERE id = 102;
```

Instead of:

```
SELECT *
FROM custodian
WHERE id =: id;
```

Pressure may occur on:

```
Shared Pool
Library Cache
CPU
```

Solution:

```
bind variables
```

---

## 20.65 Real Scenario: Large Sort

Query:

```
SELECT *
FROM transactions
ORDER BY transaction_date;
```

For millions of rows:

```
PGA
 ↓
sort
```

If the memory does not reach:

```
TEMP tablespace
```

So, when you see TEMP very big, one of the reasons can be:

```
large sort
hash join
aggregation
```

---

## 20.67 Essential scheme to be memorised

If you want to remember the Oracle architecture in a single mental picture:

```
CLIENT
  |
  v
LISTENER
  |
  v
SERVER PROCESS
  |
  +--------------+
  |              |
  v              v
PGA SGA
             +----------------+
| Shared Pool |
| Buffer Cache |
| Redo Buffer |
             +----------------+
                |        |
DBWn LGWR
                |        |
                v        v
DATAFILES | REDO LOGS
                |
                v
DATABASE
```

And in modern Oracle:

```
INSTANCE
   |
   v
CDB
 |
+ -- CDB$ROOT
+ -- PDB$SEED
+ -- FREEPDB1
       |
+ -- HR
+ -- OE
+ -- DEV_LAB
+ -- DWH_ACCOUNT
```

---

## 20.68 The 10 ideas you need to know for sure

For the **Oracle Data Developer** level, these are the most important:

1. **Instance = SGA + background processes.**
2. **Database = datafiles + control files + redo logs.**
3. **SGA is shared; PGA is private.**
4. **Buffer Cache contains data blocks.**
5. **Shared Pool contains SQL/PLSQL and reusable plans.**
6. **LGWR writes redo; DBWn writes data blocks.**
7. **COMMIT makes the redo persistent; it does not require the changed data blocks to have been written to datafiles.**
8. **Undo is used for rollback and read consistency.**
9. **Modern Oracle uses CDB + PDB.**
10. **A SELECT passes conceptually through Shared Pool → execution plan → Buffer Cache → possibly Datafiles.**

A very useful formula for review is:

```
SQL
 ↓
Parse / Shared Pool
 ↓
Optimizer / Execution Plan
 ↓
Buffer Cache
 ↓
Datafiles if required
```

and for DML:

```
DML
 ↓
Buffer Cache + Undo + Redo
 ↓
COMMIT
 ↓
LGWR → Redo Log

later:

DBWn → Datafiles
```

If you understand these flows and the differences between **an instance and a database, SGA and PGA, redo and undo, and LGWR and DBWn**, you have a solid foundation in Oracle architecture.

---

## Questions and answers

### 1. What is the difference between an Oracle instance and an Oracle database?

Answer:

> An Oracle instance consists of memory, especially the SGA, and background processes. The Oracle database consists of persistent files such as datafiles, control files, and redo log files.

---

### 2. What is the difference between SGA and PGA?

> The SGA is shared memory used by Oracle processes. The PGA is private memory associated with a server process.

---

### 3. What happens at COMMIT?

> Oracle ensures that the redo of the transaction is written by LGWR in online redo logs. It is not necessary that the modified blocks have already been written in the datafiles.

That's a very good technical discussion form.

---

### 4. How is DBWn?

> Write dirty blocks from Database Buffer Cache in the datafiles.

---

### 5. How is LGWR?

> Write redo entries from Redo Log Buffer in online redo log files and is critical for confirming transactions.

---

### 6. What is the difference between redo and undo?

> Redo describes the changes so that they can be reapplied in recovery. Undo allows rebuilding the previous state and is used for rollback and read consistency.

---

### 7. What is Buffer Cache?

> The area in SGA where Oracle keeps copies of data blocks read from datafiles.

---

### 8. What is Shared Pool?

> Zone SGA which keeps reusable structures such as parsed SQL, execution plans and information from the dictionary date.

---

### 9. Hard parse vs soft parse?

> Hard parse supposedly optimize and generate or choose a execution plan; soft parse reuses a cursor already existing in Shared Pool.

---

### 10. What is CDB vs PDB?

> CDB is an Oracle multitenant container and PDB is a logically isolated pluggable base within the CDB-.

---

### 11. What is SCN?

> System Change Number is a logical number used by Oracle to order changes and maintain consistency and recoveryness.

---

### 12. What if the server falls immediately after COMMIT?

> If the redo of the commission has been successfully written in online redo logs, Oracle can recover the change at the restart even if the dirty block had not yet been written in the datafiles.

---

### How would you briefly explain Oracle Architecture to a colleague who knows SQL, but not this area?

Oracle Architecture covers database vs instance, background processes, datafiles, control files and redo logs. In practice, first determine what data enters and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Oracle Architecture?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Oracle Architecture, explicitly follow data versus instance, background processes, datafiles, control files and redo logs and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the Oracle Architecture appears together with logging, auditing, reconciliation and impact analysis.
