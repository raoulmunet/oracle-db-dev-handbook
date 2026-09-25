---
title: 'C22. Redo and Undo'
description: 'Complete English handbook chapter based on the original C22 course.'
sidebar_position: 22
---

# C22. Redo and Undo

<div className="chapter-kicker">Chapter C22 · Complete course</div>

## 1. The Central Idea

In Oracle, **Redo** and **Undo** solve two different but closely related problems with transactions:

- **UNDO** retains the information necessary to view or restore **the previous** version of the data.
- **REDO** restores the information required to **remake the** changes after a crash or to recover.

The most important mental scheme:

```
UPDATE
                    |
          +---------+---------+
          |                   |
UNDO REDO
          |                   |
the old version of the amendment made
          |                   |
ROLLBACK RECOVERY
Read Consistency Durability
Flashback Crash recovery
```

In short:

> **UNDO = going back.**
> **REDO = redo before.**

---

# 2. Simple Example

We have:

```
CREATE TABLE accounts (
account_id NUMBER PRIMARY KEY,
balance NUMBER
);

INSERT INTO accounts VALUES (1001, 1000);
COMMIT;
```

We execute:

```
UPDATE accounts
SET balance = 800
WHERE account_id = 1001;
```

Conceptually, Oracle must manage:

```
old value:
Balance = 1000

new value:
balance = 800
```

UNDO contains sufficient information to return to:

```
1000
```

REDO contains sufficient information to restore the change:

```
1000 → 800
```

It should not necessarily be considered as two complete copies of the row. Oracle generates change records necessary for internal mechanisms.

---

# 3. What UNDO is

UNDO is the information used to rebuild the **data status.

It is kept in **Undo Tablespace**.

For example:

```
UPDATE accounts
SET balance = 800
WHERE account_id = 1001;
```

The Oracle shall be able to rebuild:

```
Balance = 1000
```

This information gets into the undo blocks.

---

# 4. What UNDO is used for

The most important uses are:

1. ROLLBACK
2. Read Consistence
3. MVCC
4. Flashback Query
5. Transaction recovery

The first three are essential for review.

---

# 5. UNDO and ROLLBACK

Example:

```
UPDATE accounts
SET balance = 800
WHERE account_id = 1001;

ROLLBACK;
```

After ROLLBACK:

```
Balance = 1000
```

Oracle uses UNDO to restore the previous condition.

Conceptual:

```
UPDATE
1000 → 800

UNDO:
800 → 1000
```

---

# 6. UNDO and SAVEPOINT

UNDO also allows partial rollback.

```
UPDATE accounts
SET balance = 900
WHERE account_id = 1001;

SAVEPOINT s1;

UPDATE accounts
SET balance = 800
WHERE account_id = 1001;

ROLLBACK TO s1;
```

The result of the current transaction shall become:

```
balance = 900
```

The first change remains in the transaction.

---

# 7. UNDO and Read Consistence

This is one of the most important Oracle concepts.

Let's assume two sessions.

## Session A

```
SELECT balance
FROM accounts
WHERE account_id = 1001;
```

Result:

```
1000
```

Session B executes:

```
UPDATE accounts
SET balance = 500
WHERE account_id = 1001;
```

but don't make it yet:

```
COMMIT;
```

Session A again runs:

```
SELECT balance
FROM accounts
WHERE account_id = 1001;
```

The Oracle does not show the value not met:

```
500
```

It's the consistent version:

```
1000
```

Oracle can reconstruct this version using **UNDO**.

---

# 8. MVCC = Multi-Version Competition Control

Oracle uses a **MVCC** mechanism.

There may be conceptually several versions of the same row:

```
SCN 100
Balance = 1000

SCN 110
balance = 800

SCN 120
Balance = 600
```

A query started at SCN 105 must see:

```
1000
```

even though in the meantime the row has become:

```
600
```

Oracle uses undo to rebuild the right version.

Hence the principle:

> **Readers don't block writers and writers don't block readers** in the usual Oracle situations.

Writers can, however, block each other if they change the same lines.

---

# 9. UNDO and SCN

SCN = **System Change Number**.

It's a logical number by which Oracle orders changes to the base.

Conceptual:

```
SCN 100
Balance = 1000

SCN 105
query starts

SCN 110
UPDATE balance = 800

SCN 120
COMMIT
```

The query started at:

```
SCN 105
```

He needs to see the image of the base at the time.

UNDO helps the Oracle rebuild that image.

---

# 10. UNDO and Flashback Query

UNDO also allows the interrogation of a previous version.

Example:

```
SELECT *
FROM accounts
AS OF TIMESTAMP SYSTIMESTAMP - INTERVAL '5' MINUTE
```

or using SCN:

```
SELECT *
FROM accounts
AS OF SCN 123456;
```

Oracle tries to rebuild historical data using the information available in undo.

---

# 11. Undo Tablespace

Oracle normally uses a dedicated tablespace.

Example:

```
SELECT tablespace_name
FROM dba_tablespaces
WHERE contents = 'UNDO';
```

For example:

```
UNDOTBS1
```

You can check the parameter:

```
SHOW PARAMETER undo_tablespace;
```

Possible result:

```
undo_tablespace = UNDOTBS1
```

---

# 12. Undo Retention

Oracle is trying to keep undo for a certain period.

Parameter:

```
SHOW PARAMETER undo_retention;
```

For example:

```
UNDO_RETENTION = 900
```

that is approximately:

```
900 seconds = 15 minutes
```

But UNDO\ _ RETENTION should not be interpreted simply as an absolute guarantee in all configurations. Oracle can reuse undo depending on the available space and the configuration of the tablet.

---

# 13. ORA-01555 = Snapshot Too Old

It is the classic error related to undo:

```
ORA-01555: snapshot too old
```

Screenplay:

```
Long query begins
       |
       v
needs old versions of the blocks
       |
       v
other transactions generate much UNDO
       |
       v
the old undulum is reused
       |
       v
The query is trying to rebuild an old version
       |
       v
no longer exists the required undulum
       |
       v
ORA-01555
```

Very common:

```
DWH
long reports
ETL batches
large scans
competing transactions
```

---

# What REDO is

Redo is the information needed to restore **changes made in the** database.

Simplified flow:

```
SQL modification
      |
      v
Redo generated
      |
      v
Redo Log Buffer
      |
      v
LGWR
      |
      v
Online Redo Log
```

Redo is essential for:

```
Durability
Instant Recovery
Media Recovery
Data Guard / reply mechanisms
Archiving
```

---

# 15. Redo Log Buffer

Redo is first generated in memory, in:

```
Redo Log Buffer
```

which is part of:

```
SGA
```

Scheme:

```
SGA

+-----------------------------+
♪ Buffer Cache ♪
♪ Shared Pool ♪
♪ Redo Log Buffer ♪
| ...                         |
+-----------------------------+
```

---

# 16. LGWR

Process:

```
LGWR = Log Writer
```

write the redo from:

```
Redo Log Buffer
```

in:

```
Online Redo Log Files
```

Scheme:

```
Redo Log Buffer
       |
* * *
       v
Online Redo Log
```

---

# 17. Online Redo Logs

Oracle usually has multiple redo log groups.

Conceptual:

```
GROUP 1
redo01.log

GROUP 2
redo02.log

GROUP 3
redo03.log
```

LGWR writes circular:

```
Group 1
   ↓
Group 2
   ↓
Group 3
   ↓
Group 1
...
```

When it goes from group to group, there's a:

```
LOG SWITCH
```

---

# 18. COMMIT and Redo

This is an extremely important concept.

At:

```
COMMIT;
```

Oracle **must not immediately write down all the modified blocks in the** datafiles.

But they have to guarantee that the redo of the transaction has ended up in the redo log.

Conceptual:

```
UPDATE
   |
   v
Database Buffer Cache
dirty block

+
Redo Log Buffer
   |
   v
COMMIT
   |
   v
LGWR
   |
   v
Online Redo Log
```

After the required redo is persistently:

```
COMMIT can be confirmed
```

Effective blocks can then reach datafiles through DBWR.

---

# 19. LGWR vs DBWR

This difference is very important in the technical discussion.

## LGWR

It says:

```
Redo Log Buffer
       ↓
Online Redo Logs
```

## DBWR

It says:

```
Database Buffer Cache
       ↓
Datafiles
```

Therefore:

```
COMMIT
   |
   v
LGWR should persist redo

NU:

COMMIT
   |
   v
DBWR must write all blocks
```

---

# 20. Why is this mechanism effective

We're imagining a transaction that changes 10,000 blocks.

It would be very expensive if COMMIT should wait:

```
write block 1
write block 2
...
write block 10000
```

Instead Oracle can write sequential redo:

```
Redo Buffer
     |
     v
Redo Log
```

I/O sequentially for redo is much more effective.

This is one of the reasons why the redo is fundamental to the Oracle architecture.

---

# 21. What happens to crash

We assume:

```
Transaction T1
COMMIT

Transaction T2
not commited

CRASH
```

Some blocks of T1 may not have reached the datafiles yet.

But the T1 redo exists in redo logs.

On restart, Oracle performs **instant recovery**.

Simplified:

```
REDO:
remake the changes to be applied

UNDO:
cancels unsettled transactions
```

Mental scheme:

```
DATABASE CRASH
                   |
                   v
INSTANCE RECOVERY
                   |
          +--------+--------+
          |                 |
REDO UNDO
          |                 |
          v                 v
remake Rollback Transactions Changes
not required
```

---

# 22. Roll Forward + Roll Back

Recovery is often explained as two conceptual phases.

## Roll Forward

The Oracle applies redo:

```
Redo Logs
    ↓
recharge changes
```

## Roll Back

After that, Oracle eliminates the effects of unsettled transactions using undo.

```
UNDO
  ↓
rollback uncommited transactions
```

Very good technical discussion forms:

> Oracle uses redo for roll forward and undo for the Rollback of transactions that were not commited.

---

# 23. The Complete Relationship between Data Block, Undo and Redo

At:

```
UPDATE accounts
SET balance = 800
WHERE account_id = 1001;
```

happens conceptually:

```
UPDATE

                           |
       +-------------------+--------------------+
       |                                        |
       v                                        v
Data block modification
       |                                        |
       v                                        v
Buffer Cache Undo Block
       |                                        |
       +----------------+-----------------------+
                        |
                        v
REDO
                        |
                        v
Redo Log Buffer
                        |
LGWR
                        |
                        v
Online Redo Logs
```

One important detail:

> **and changes to UNDO generate REDO.**

The reason is that Oracle must also be able to recover the information required for the rollback after a crash.

---

# 24. Does UNDO generated REDO?

Classic technical discussion question.

Answer:

**Yes.**

When Oracle creates or modifies undo blocks, these changes must be protected by redo.

Conceptual:

```
UPDATE table
    |
+ --
    |
+ ---

both can generate REDO
```

Therefore, an DML operation can generate more redo than the apparent size of the data exchanged.

---

# 25. INSERT / UPDATE / DELETE and UNDO

### INSERT

```
INSERT INTO t VALUES (...);
```

Undo shall allow:

```
removal of row
```

Rollback.

---

### DELETE

```
DELETE FROM
WHERE id = 10;
```

Undo must be able to restore the line.

---

### UPDATE

```
UPDATE t
SET salary = 5000
WHERE id = 10;
```

Undo must allow the restoration of the old value.

---

# 26. Complete example with two sessions

## Session 1

```
SELECT balance
FROM accounts
WHERE account_id = 1001;
```

Result:

```
1000
```

Then:

```
UPDATE accounts
SET balance = 500
WHERE account_id = 1001;
```

Don't give COMMIT.

---

## Session 2

```
SELECT balance
FROM accounts
WHERE account_id = 1001;
```

Result:

```
1000
```

No:

```
500
```

because the change in Session 1 is not commited.

Undo helps the Oracle to provide the consistent image.

---

Now in Session 1:

```
COMMIT;
```

Session 2 performs a new instruction:

```
SELECT balance
FROM accounts
WHERE account_id = 1001;
```

and can see:

```
500
```

---

# 27. UNDO does not just mean ROLLBACK

A very common mistake:

> Undo is for rollback.

It's true, but incomplete.

Undo is also essential for:

```
Read Consistence
MVCC
Flashback Query
Transaction Recovery
```

In practice, read consistency is one of the most important uses.

---

# 28. REDO does not mean backup

Other common confusion:

```
Redo's Backup
```

Redo contains change records.

The backups contain copies of the base structure.

The full review can combine:

```
Backup
+
Archived Redo Logs
+
Online Redo Logs
```

---

# 29. ARCHIVELOG

In mode:

```
ARCHIVELOG
```

Oracle keeps old redo logs in the form of:

```
Archived Redo Logs
```

Flux:

```
Online Redo Log
       |
Swing log
       v
ARCH
       |
       v
Archived Redo Log
```

Associated process:

```
ARCn
```

Archived redo is fundamental to recovery and technologies such as standby / Data Guard.

---

# 30. Online Redo vs Archived Redo

= = sync, corrected by elderman = =
♪ ♪ ♪ ♪ ♪
Active use by Oracle and copy of the complete redo log
Written by LGWR Archived by ARCn
Circular reused and stored for recovery
The limited number of groups can accumulate over time

---

# 31. NOLOGGING

For large operations there is the concept:

```
NOLOGGING
```

Typical example:

```
CREATEQ1QX sales_stage
NOLOGGING
AS
SELECT *
FROM sales_source;
```

or certain direct-path operations:

```
INSERT / * + APPEND * / INTO...
```

NOLOGGING may reduce the amount of redo for certain operations.

But:

> **NOLOGGING does not mean "zero redo".**

Metadata, undo and other changes may continue to generate redo.

And it involves compromises on recoverability.

---

# 32. Redo in DWH / ETL

In an DWH you can have:

```
10 million INSERT
5 million UPDATE
Large MERGE
rebuild index
Part maintenance
```

These operations may generate very large volumes of:

```
REDO
UNDO
```

Example:

```
MERGE INTO fact_transactions
USING stg_transactions
ON (f.transaction_id = s.transaction_id)
WHENQ1QX THEN
UPDATE SET f.amount = s.amount
WHEN NOT MATCHED THEN
INSERT (
transaction_id,
% 1
)
VALUES (
s.transaction_id,
♪ amount ♪
);
```

Millions of rows can result:

```
much undo
much redo
I/O
undo pressure
redo log switches
intense archiving
```

---

# 33. Very large transactions

Example:

```
DELETEQ1QX fact_transactions
WHERE transaction_date; DATE '2020-01-01';

COMMIT;
```

If deleted:

```
100 million rows
```

may occur:

```
enormous UNDO
enormous REDO
very long transaction
costly recovery
prolonged housing
```

In DWH, a partition-based strategy is sometimes more effective:

```
ALTERQ1QX fact_transactions
DROP PARTITION p2019;
```

than:

```
DELETEQ1QX fact_transactions
WHERE transaction_date BETWEEN...;
```

---

# 34. Commit too often

Alt anti-pattern ETL:

```
FOR r IN (...) LOOP

INSERT INTO target_table (...);

COMMIT;

END LOOP;
```

Commit to each row may produce:

```
very many log file sync
very many LGWR calls
throughput weak
```

More appropriate is usually set-based processing or in controlled batches.

For example:

```
IF MOD (v_counter, 10000) returns 0 THEN
COMMIT;
END IF;
```

But the size of the batch must be chosen based on:

```
volume
restartability
undo
redo
business consistency
recovery requirements
```

There is no universal rule. I commit to N lines.

---

# 35. Log file sync

When a session runs:

```
COMMIT;
```

can wait for LGWR.

A relevant wait event:

```
log file sync
```

If it is large, possible causes are:

```
commit too often
slow storage for redo
LGWR congestion
workload very intensively
```

Therefore:

```
COMMIT in loop
```

It's an important anti-pattern.

---

# 36. Redo Log Switch Too Frequently

If the redo logs are too small:

```
Group1 → Group2 → Group3 → Group1
```

It can happen very often.

This can produce overhead by:

```
log switches
checkpoints
archiving
```

A large ETL batch can highlight the problem immediately.

---

# 37. Redo and Checkpoint

The checkpoint synchronizes the progress between:

```
Redo
and
Datafiles
```

Relevant process:

```
CKPT
```

and the writing of the blocks is carried out by:

```
DBWR
```

Conceptual:

```
REDO LOG
   |
* *
   v
CONTROL FILE / DATAFILE HEADERS

DBWR
   |
   v
dirty buffers → datafiles
```

---

# 38. Undo and Long Transactions

A very large transaction:

```
BEGIN
million UPDATE-uri
without COMMIT
END
```

may generate:

```
much undo
undo tablespace pressure
very long rollback
more expensive recovery
```

But neither does the solution:

```
COMMIT after each row
```

It's not good.

We need to find the balance.

---

# 39. DWH: Batch control and restartability

Suppose an ETL:

```
STAGING
   ↓
DIM_CUSTOMER
   ↓
FACT_TRANSACTION
```

and we process:

```
10 million rows
```

A good design can process:

```
Batch 1: 100k
Batch 2: 100k
...
```

with a table control:

```
ETL_BATCH

batch_id
stasis
start_time
end_time
rows_processed
```

In the case of a fault:

```
Batch 1 OK
Batch 2 OK
Batch 3 FAILED
```

You can pick it up at Batch 3.

That limits:

```
undo
redo
rollback durability
restart cost
```

but it must be designed so that the process remains correct and idempotent.

---

# 40. As you see Undo in Oracle

With sufficient privileges:

```
SELECT *
FROM v $undostat;
```

It is very useful for the analysis:

```
Uno consumption
Transaction rates
ORA-01555
undo retention
```

Other relevant views:

```
DBA_UNDO_EXTENTS
V$TRANSACTION
V$UNDOSTAT
```

---

# 41. As you see Redo

You can see the redo logs:

```
SELECT
group #,
sequence #,
bytes / 1024 / 1024 AS size_mb,
stasis
FROM v $log;
```

Members of the redo:

```
SELECT
group #,
member
FROM v $logfile;
```

---

# 42. How much redo the session produces

With the right privileges you can investigate the session statistics.

For example, statistics:

```
redo size
```

by views such as:

```
V$SESSTAT
V$STATNAME
```

Conceptual:

```
SELECT sn.name,
ss.value
FROM v $sesstat ss
JOIN v $status
ON sn.statistical # = ss.statistical #
WHERE ss.sid = SYS_CONTEXT ('USERENV', 'SID')
AND sn.name = 'redo size';
```

Run before and after an DML and compare.

---

# 43. Oracle Exercise 26ai - UNDO

Create:

```
CREATE TABLE redo_undo_lab (
NUMBER PRIMARY KEY,
amount NUMBER
);
```

Data:

```
INSERTQ1QX redo_undo_lab
VALUES (1,000);

COMMIT;
```

Execute:

```
UPDATE redo_undo_lab
SET amount = 500
WHERE id = 1;
```

Check:

```
SELECT *
FROM redo_undo_lab;
```

Result at the same session:

```
1 500
```

Execute:

```
ROLLBACK;
```

Then:

```
SELECT *
FROM redo_undo_lab;
```

Result:

```
1 1000
```

UNDO made it possible to return.

---

# 44. Oracle Exercise 26ai - Read Consistency

Use two DataGrip consoles.

### Session A

```
UPDATE redo_undo_lab
SET amount = 500
WHERE id = 1;
```

No comment.

### Session B

```
SELECT *
FROM redo_undo_lab
WHERE id = 1;
```

They should see:

```
1000
```

Now Session A:

```
COMMIT;
```

Session B again runs:

```
SELECT *
FROM redo_undo_lab
WHERE id = 1;
```

and will see:

```
500
```

This is a very good lab for:

```
MVCC
UNDO
read consistency
COMMIT
```

---

# 45. Exercise at SAVEPOINT

```
UPDATE redo_undo_lab
SET amount = 900
WHERE id = 1;

SAVEPOINT step1;

UPDATE redo_undo_lab
SET amount = 700
WHERE id = 1;

SELECT *
FROM redo_undo_lab;
```

Result:

```
700
```

Then:

```
ROLLBACK TO step1;
```

Result:

```
900
```

At the end:

```
ROLLBACK;
```

revert to initial commited value.

---

# 46. Example DWH

You have:

```
STG_TRANSACTION
       ↓
FACT_TRANSACTION
```

and:

```
INSERTQ1QX fact_transaction
SELECT *
FROM stg_transaction;
```

for:

```
20 million rows
```

You have to think about:

```
UNDO generation
REDO generation
redo log size
archive log generation
Commit strategy
restartability
batch size
recovery
```

Not just at the execution plan.

This is an important aspect for a Data Developer Oracle.

---

## Questions and answers

### 1. What is the difference between Redo and Undo?

**UNDO** allows the restoration of previous versions and is used for rollback, read consistency and flashback.

**REDO** allows restoration of changes and is used for durability and recovery.

---

### 2. What is Oracle doing at COMMIT?

The Oracle guarantees that the redo required for the transaction is persistent in the redo log.

You don't have to immediately write all the modified blocks in the datafiles.

---

### 3. Who writes Redo Log Buffer in Redo Logs?

```
LGWR
```

---

### 4. Who writes dirty blocks in datafiles?

```
DBWR
```

---

### 5. Undo is only used for rollback?

No.

It is also used for:

```
Read Consistence
MVCC
Flashback
Transaction Recovery
```

---

### 6. What is ORA-01555?

The query needs an old version of the data, but the required undo is no longer available.

---

### 7. Undo Generates Redo?

Yeah.

The undo blocks changes must also be protected for recovery.

---

### 8. Does Redo contain old or new data?

The question is slightly simplified. Redo contains the change records needed to restore the changes, should not be regarded as a simple complete copy of the new row.

---

### 9. What happens to crash?

Oracle uses redo for roll forward and undo to eliminate the effects of unsettled transactions.

---

### 10. NOLOGGING means zero redo?

No.

Reduce redo for certain operations, but does not remove any redo.

---

# 48. Conceptual Traps

Don't memorize:

```
UNDO = old row
REDO = new row
```

It's too much simplification.

More correctly:

```
UNDO
=
information necessary to restore / rebuild
previous versions

REDO
=
change records required to reproduce changes
```

---

# 49. Link with the other Oracle concepts

Redo / Undo links many chapters:

```
Transactions
     |
+ -- = COMMIT / ROLLBACK
     |
+ --
     |      |
- MVCC
- Read Consistency
- Flashback.
     |
+ --
            |
+ --
+ -- • Online Redo Logs
+ --
+ --} Recovery
```

And architectural:

```
Oracle Instant

SGA
       |                                |
* LGWR / DBWR / CKPT
       |
+ -- Buffer Cache
       |
+ -- Redo Log Buffer
               |
* * *
               v

Database
               |
        +------+------+
        |             |
Datafiles Redo Logs
        |
Undo Tablespace
```

---

# 50. Mental schematics to memorize

for review, remember the chain:

```
UPDATE
   |
+ --
   |
+ --
   |
+ --
             |
             v
Redo Log Buffer
             |
LGWR
             |
             v
Online Redo Log
```

At:

```
ROLLBACK
```

think:

```
UNDO
```

At:

```
COMMIT
```

think:

```
LGWR + REDO
```

At:

```
CRASH
```

think:

```
REDO → roll forward
UNDO → rollback uncommited transactions
```

At:

```
consistent SELECT
```

think:

```
SCN + UNDO + MVCC
```

---

## What must remain

The eight most important ideas are:

1. **Redo and Undo are not perfect opposites; they have different goals.**
2. **UNDO allows rollback and rebuilding old data versions.**
3. **UNDO is fundamental to MVCC and read consistency.**
4. **REDO allows you to restore changes and ensure durability.**
5. **LGWR writes redo; DBWR writes blocks in datafiles.**
6. **COMMIT should persist redo, not all dirty blocks.**
7. **In recovery: REDO makes roll forward, and UNDO removes unsettled transactions.**
8. For an **Oracle Data Developer / ETL / DWH**, both SQL and **redo / undo volume, commutation strategy, restartability and the effect of large** batchs shall be followed.

---

## Questions and answers

### How would you briefly explain Redo / Undo to a colleague who knows SQL, but not this area?

Redo / Undo covers redo as revised-oriented change records, undo as logical before-image information, commit durability and LGWR. In practice, first determine what data enter and what result to achieve, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Redo / Undo?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For Redo / Undo, I explicitly follow redo as revised-oriented change records, undo as logical before-image information, comment durability and LGWR and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Redo / Undo appears together with logging, auditing, reconciliation and impact analysis.
