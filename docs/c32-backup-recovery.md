---
title: 'C32. Backup and Recovery'
description: 'Complete English handbook chapter based on the original C32 course.'
sidebar_position: 32
---

# C32. Backup and Recovery

<div className="chapter-kicker">Chapter C32 · Complete course</div>

Below you have the course for **32. Backup / Recovery is conceptual**, at the level of **Oracle Data Developer / PL/SQL Developer / DWH Developer**, not DBA. The idea is to understand very well the mechanism, terminology and what happens when incidents occur.

# 32. Backup / Recovery

## 1. Why you need to know a Data Developer Backup / Recovery

As a developer you will not necessarily manage the full backup strategy, but you must understand:

- which can be recovered after an error;
- the difference between backups, restores and recovers;
- the role of REDO and of archived redo logs;
- what ARCHIVELOG means;
- what RMAN does;
- what is Point-In-Time Recovery;
- the difference between recovery and Flashback;
- what effect COMMIT, NOLOGGING, DDL operations and ETL batchs have on the possibility of recovery.

Especially in DWH/ETL, where you run big batchs, an incident doesn't always mean we restore base. Sometimes the solution can be:

```
ROLLBACK
Flashback
ETL reprocessing
Restore + recover
Point-In-Time Recovery
```

You need to know which concept applies.

---

# 2. The Three Fundamental Words

You have to differentiate them clearly:

```
BACKUP
RESTORE
RECOVER
```

## Backup

Creating a copy of the data.

Conceptual example:

```
Database
   ↓
RMAN
   ↓
Backup files
```

The Backup may contain, depending on the strategy:

```
datafiles
control tabs
SPFILE
archived redo logs
```

---

## Restore

Putting the backup file back on the disk.

Example:

```
Date of lost characters
      ↓
RESTORE
      ↓
old copy of the date of the date
```

But the base is not necessarily consistent yet.

---

## Recover

Application of the changes made after backup.

Conceptual:

```
Old Backup
   +
Archived Redo Logs
   +
Online Redo Logs
   ↓
RECOVER
   ↓
feeling more recent
```

Formula to be memorized:

```
RESTORE = bring back the file

RECOVER = bring it to its correct state
```

---

# 3. Simple Example

Suppose:

```
00: 00 backup
8: 00 INSERT A
9: 00 UPDATE B
10: 00 DELETE C
11: 00 p.m. Date lost.
```

The Backup contains the situation from:

```
00: 00
```

If you just do:

```
RESTORE
```

You're going back to your 00: 00.

Changes between:

```
00: 00 → 11: 00
```

should be re-applied from REDO.

That's why it's done:

```
RESTORE
+
RECOVER
```

---

# 4. REDO is the basis of the Recovery

The link with the course on **Redo / Undo** is essential.

When you change data:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle produces REDO information.

Conceptual flux:

```
UPDATE
   ↓
Modified Block Date in Buffer Cache
   ↓
Redo Log Buffer
   ↓
LGWR
   ↓
Online Redo Log
```

REDO says conceptually:

> What changes need to be remade to reproduce the change?

This is why REDO is used in recovery.

---

# 5.UNDO vs REDO in recovery

It's a very important difference.

## UNDO

It mainly helps to:

```
ROLLBACK
Read Consistence
Flashback
Transaction Recovery
```

Conceptual:

```
UNDO = how to reverse the change
```

---

## REDO

Helps to:

```
Crash Recovery
Instant Recovery
Media Recovery
Date
```

Conceptual:

```
REDO = how to restore change
```

Very simplified:

```
UNDO → backwards
REDO → forces
```

---

# 6. Why COMMIT- can be safe before the block reaches the datafils

Suppose:

```
UPDATE accounts
SET balance = 900
WHERE account_id = 10;

COMMIT;
```

The Oracle must not immediately write the modified block in the datafils.

Instead, it must ensure that the necessary REDO information is written.

Flux:

```
UPDATE
   ↓
Buffer Cache
   ↓
Redo Log Buffer

COMMIT
   ↓
LGWR
   ↓
Online Redo Log
   ↓
COMMIT confirmed
```

DBWn can write the date the block later.

Therefore Oracle can recover the change after a crash:

```
Datafile still old
+
Redo Log
=
Logically recovered data
```

This is the principle:

> **redo before data**

---

# 7. Online Redo Logs

Oracle has several online redo logs groups.

Conceptual:

```
Redo Log Group 1
      ↓
Redo Log Group 2
      ↓
Redo Log Group 3
      ↓
Redo Log Group 1
```

LGWR writes sequentially.

When a redo log fills:

```
LOG SWITCH
```

and Oracle moves on to the next.

Conceptual example:

```
GROUP 1 → CURRENT

log switch

GROUP 1 → ACTIVE
GROUP 2 → CURRENT
```

---

# 8. ARCHIVELOG mode

This is where the serious recovery begins.

In mode:

```
ARCHIVELOG
```

Oracle keeps copies of redo logs completed.

Conceptual process:

```
Online Redo Log
       ↓
log switch
       ↓
ARCn
       ↓
Archived Redo Log
```

Example:

```
redo_101.arc
redo_102.arc
redo_103.arc
redo_104.arc
```

These files allow the recovery of changes produced after backup.

---

# 9. NOARCHIVELOG vs ARCHIVELOG

## NOARCHIVELOG

Redo logs are reused without the preservation of all previous generations.

Conceptual:

```
Redo 1
Redo 2
Redo 3
   ↓
Redo 1 reused
```

The available review is much more limited.

---

## ARCHIVELOG

The old relay is archived before re-use.

```
Redo Log
   ↓
Archive
   ↓
Redo Log can be reused
```

So you can have:

```
Sunday backup
+
Archive logs Monday
+
Archives logs Tuesday
+
Archive logs Wednesday
=
recover by Wednesday
```

---

# 10. Important types of recovery

For the level of developer you must distinguish at least:

```
Instant Recovery
Crash Recovery
Media Recovery
Point-In-Time Recovery
Flashback
```

---

# 11. Instant / Crash Recovery

Example:

The server suddenly drops:

```
power failure
OS crash
kill -9
VM crash
```

Some modified blocks were still only in:

```
Buffer Cache
```

And they hadn't gotten into the datafiles.

On restart, Oracle uses REDO.

Conceptual:

```
Datafiles
+
Redo Logs
   ↓
SMON / recovery
   ↓
Consistent date
```

You don't necessarily restore anything from the backup.

This is the important difference:

```
Crash, automatic restore
```

---

# 12. Roll Forward + Roll Back

The Oracle Recovery can be conceptually understood in two phases.

## Roll Forward

Oracle reapplies the changes using REDO.

```
Old data
+
Redo
   ↓
newer state
```

---

## Roll Back

Some reapplied transactions in REDO were not committed at the time of the crash.

These should be discarded.

Oracle uses UNDO.

Conceptual:

```
REDO
 ↓
restore changes

UNDO
 ↓
remove unsettled transactions
```

Mental model:

```
RECOVERY

1. REDO → roll forward
2. UNDO → roll back incomplete transactions
```

---

# 13. Media Recovery

Media recovery occurs when you lose or corrupt physical components.

For example:

```
fault disk
Date of deleted files
Date of corrupt characters
Storage faillure
```

Then it may be necessary:

```
RESTORE datafile
+
RECOVER datafile
```

Example:

```
Data backup from 1: 00 a.m.
+
archived redo logs 1: 00 a.m.
+
online redo
=
Data files recovered
```

---

# 14. RMAN

The standard Oracle instrument for backup and recovery is:

```
RMAN
Recovery Manager
```

RMAN understands the internal Oracle structure.

Conceptual may administer:

```
Database backs
Datafile backups
Control file backups
SPFILE backups
Archived redo logs
Restore
Recovery
Validation
Backup retention
```

For developer it is enough to recognize commands such as:

```
BACKUP DATABASE;
```

and conceptual:

```
RESTORE DATABASE;
RECOVER DATABASE;
```

You don't have to manage the RMAN strategy.

---

# 15. Physical Backup vs Logical Backup

They need to be differentiated.

## Physical Backup

Copy the physical structure of the Oracle.

Typical:

```
RMAN
```

The recovered items shall be at the level of:

```
database
Date
tablespace
PDB
```

---

## Logical Backup

Export of objects / date.

Instruments such as:

```
Pump Date
expdp
impdp
```

Example:

```
expdp...
```

conceptual production:

```
tables
indexes
metadata
rows
```

It's not the same with RMAN.

---

# 16. RMAN vs. Data Pump

Very common technical discussion question.

Date Pump
♪ ♪ ♪ ♪ ♪
Physical backing up for logical export
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
Date of entry into force
= = sync, corrected by elderman = =

To be memorized:

```
RMAN
```

---

# 17. Point-In-Time Recovery

Suppose:

```
10: 00 backup
11: 00 OK transactions
12: 00 OK transactions
13: 00 DELETE wrong
2: 00 p.m. Problem discovered
```

You don't necessarily want the 2: 00.

You want:

```
12.59 p.m.
```

Conceptual:

```
RESTORE backup
+
Apply redo
+
STOP at 12: 59
```

This is:

```
Point-In-Time Recovery
PITR
```

I mean:

> I'm rebuilding the base to a certain point in the past.

---

# 18. SCN and Recovery

The Oracle doesn't think about the recoveryjust in hours.

A fundamental concept is:

```
SCN
System Change Number
```

SCN represents the logical order of changes in the database.

Conceptual:

```
SCN 100
SCN 101
SCN 102
SCN 103
```

The review may be conceptually expressed up to:

```
TIME
SCN
LOG SEQUENCE
```

SCN is much more accurate than 13: 00.

---

# 19. Checkpoint and Recovery

The checkpoint reduces the amount of recovery required.

Conceptual flux:

```
dirty blocks
   ↓
DBWn
   ↓
datafiles
```

CKPT updates information such as checkpoint SCN in:

```
control tabs
Date of headers
```

If the base falls:

```
Oracle must not resume REDO at the beginning of time
```

but from the relevant point determined by checkpoints.

The link is:

```
Checkpoint
→ more persistent changes in datafiles
→ less REDO to reapply
→ recovery faster
```

---

# 20. Control File in recovery

The file control contains critical structural information about the database.

Conceptual:

```
database
datafiles
redo log files
checkpoints
SCN information
metadata backup
```

This is why the loss of control of the filet is much more serious than the accidental deletion of an ordinary table.

In practice, there are usually:

```
multiplexed control files
```

for redundancy.

---

# 21. What happens if you accidentally delete data

Example:

```
DELETE FROM fact_sales;
COMMIT;
```

There are more possibilities here.

You don't have to think automatically:

```
RESTORE DATABASE
```

You can have:

```
Flashback
Point-In-Time Recovery
Tablespace PITR
re-import Date Pump
ETL reprocessing
Restore / full recover
```

The choice depends on the incident.

---

# 22. Flashback vs Backup / Recovery

Flashback and recovery are not the same thing.

Flashback uses Oracle mechanisms to quickly see or return to a previous condition.

Simple example:

```
SELECT *
FROM
AS OF TIMESTAMP SYSTIMESTAMP - INTERVAL '10' MINUTE
```

This is:

```
Flashback Query
```

You didn't restore the base from the backup.

---

# 23. Flashback Query

Very useful for the developer.

Example:

```
SELECT *
FROM custodian
ASQ1QX TIMESTAMP
TO_TIMESTAMP (
'2026-09-23 10:00:00',
'YYYY-MM-DD HH24:MI:SS'
);
```

Conceptual:

```
backgammon now
      ↓
UNDO / historical information
      ↓
what it looked like before
```

It can help enormously to investigate an incident.

---

# 24. Recovery after a Wrong DELETE

Suppose:

```
DELETE FROM Customers
WHERE country = 'RO';

COMMIT;
```

You discover the problem five minutes later.

The first instinct shouldn't be:

```
Remore entire data
```

You can investigate:

```
SELECT *
FROM customers
AS OF TIMESTAMP SYSTIMESTAMP - INTERVAL '10' MINUTE
WHERE country = 'RO';
```

If the data is still available via Flashback Query, you can conceptually rebuild the rows.

---

# 25. Flashback depends on UNDO

Flashback Query has an important limitation.

History is not available forever.

It depends on things like:

```
UNDO retention
UNDO space
workload
```

If the old version no longer exists in UNDO, you can receive:

```
ORA-01555
Snapshot too old
```

or simply the necessary history may no longer be available.

Therefore:

```
Flashback
```

---

# 26. Flashback Database

There is also a much stronger mechanism:

```
FLASHBACK DATABASE
```

Conceptual:

```
Database to T2
     ↓
Flashback
     ↓
Database to T1
```

It uses mechanisms different from simple Flashback Query, including Flashback Logs.

For your level it's enough to know the difference:

```
Flashback Query
→ read old versions of data

Flashback Database
→ return base in time
```

---

# 27. Recovery in Oracle Multitenant

In modern Oracle architecture you have:

```
CDB
− CDB$ROOT
− PDB$SEED
- FREEPDB1
```

Backup / recovery can also be given at PDB level.

Conceptual:

```
CDB backup / recovery

or

PDB backup / recovery
```

It is important for the developer not to confuse:

```
database
PDB
scheme
tables
```

For example, in your lab:

```
CDB = FREE
PDB = FREEPDB1
schema = DEV_LAB / HR /...
Objects = tables, procedures, packages...
```

An incident in a table in DEV\ _ LAB does not automatically mean recovery of the entire CDB.

---

# 28. Backup / Recovery in DWH

This is where Data Developer gets very relevant.

Let's assume the batch:

```
STAGING
   ↓
DIM_CUSTOMER
   ↓
FACT_TRANSACTION
   ↓
AGGREGATES
```

There is an error at FACT\ _ TRANSACTION.

You have to ask yourself:

```
Do we have recovery Oracle?
```

Often the answer is no.

You can have:

```
ETL restart
TRUNCATE partition
reload partition
ROLLBACK
reprocessing batch
restoration staging
```

Therefore DWH- should be designed with:

```
restartability
idempotency
batch control
audit columns
error logging
```

---

# 29. Technical Recovery vs Applicational Recovery

It's a very useful distinction.

## Technical Recovery

Oracle repairs infrastructure / datafiles:

```
RMAN
redo
archived logs
restore
recover
```

---

## Applicational Recovery

The application or ETL- repairs the data:

```
rerun batch
reverse transaction
reload partition
re-import source
compensating transaction
```

Example DWH:

```
ETL wrongly loaded FACT_SALES for 2026-09-22
```

It can be simpler:

```
TRUNCATE PARTITION p_20260922;
```

and recharge the data rather than do data recovery.

---

# 30. NOLOGGING is an important trap

Some bulk operations may use:

```
NOLOGGING
```

to reduce REDO.

For example conceptual:

```
CREATEQ1QX fact_sales_new
NOLOGGING
AS
SELECT *
FROM staging_sales;
```

or certain direct-path operations.

Advantage:

```
less REDO
→ better performance
```

But there are implications for reassurance.

If the required information is not in REDO:

```
old backup
+
redo
```

may not be sufficient for the complete reconstruction of the affected blocks.

Therefore:

> NOLOGGING is a performance decision to be considered from the perspective of recovery.

Very relevant in DWH.

---

# 31. Complete Example

We have:

```
00: 00 RMAN backup

8: 00 INSERT 1M rows
09: 00 UPDATE 500K rows
10: 00 COMMIT
11: 00 faulty disk
```

In ARCHIVELOG mode we have:

```
backup 00: 00
+
archives logs
+
online redo
```

Recovery conceptual:

```
1. RESTORE backups

2. RECOVER datafile

3. apply archived redo logs

4. online redo application available

5. The base reaches the most recent recoverable state
```

Scheme:

```
BACKUP
               │
               ▼
Datafils T0
               │
* RESTORE
               ▼
Restored Datafile
               │
+ Archived Redo
+ Online Redo
               ▼
RECOVER
               │
               ▼
Current data
```

---

# 32. The most important scenarios

for review, think of it this way:

Main Concept
♪ ♪ ♪ ♪ ♪
♪ ♪ ♪ ♪
Date of lost = Restore + Recover
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
Table lost
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = = @ elder _ man
Transaction without COMMIT - Rollback via UNDO
= = sync, corrected by elderman = = @ elder _ man
♪ ♪ ♪ ♪ ♪

---

# 33. Very important mental model

You can memorize the whole chapter like this:

```
DATABASE
                       │
           ┌───────────┴────────────┐
           │                        │
BACKUP REDO
           │                        │
Online Redo Logs
           │                        │
* ARCHIVELOG
           │                        │
           ▼                        ▼
RESTORE Carol, Romania
                                      │
                                      ▼
Database Current
```

And for crash recovery:

```
DATAFILES
            +
ONLINE REDO
            +
UNDO
            │
            ▼
INSTANCE RECOVERY

REDO → roll forward
UNDO → rollback undrawn transactions
```

---

## Questions and answers

A good answer to:

**) What is the difference between backup, restoration and recovery?

would be:

> Backup creates a copy of its base or components. Restore means returning backup files to the disk, and recovery means applying REDO information over those files to bring them to the desired state or to the most recent recoverable state.

For:

What is the role of archived redo logs?

> Archived redo logs keep redo logs completed and allow the application of the changes produced after backup, being essential for media recovery and point-intime recovery in a base located in ARCHIVELOG mode.

For:

What is the difference between REDO and UNDO?

> REDO allows restoration of the changes and is fundamental to recovery; UNDO allows cancellation of the changes and provides rollback, read consistency and certain Flashback features.

---

## Questions and answers

1. What is the difference between BACKUP, RESTORE and RECOVER?
2. What is RMAN?
3. What is an archived redo log?
4. What is the difference between ARCHIVELOG and NOARCHIVELOG?
5. Why is REDO necessary for recovery?
6. What role does UNDO play in court recovery?
7. What is crash recovery?
8. What is media recovery?
9. What is Point-In-Time Recovery?
10. What is an SCN?
11. What is the connection between checkpoint and recovery?
12. What's the difference between RMAN and Data Pump?
13. What's the difference between Flashback and backup?
14. What is Flashback Query?
15. What does NOLOGGING have to do with the recovery?
16. What would you do if an ETL accidentally deleted data and gives COMMIT?
17. Should the base be restored if an DWH batch fails?
18. How does ARCHIVELOG influence the possibility of recovery?
19. What happens to an uncleared transaction after a crash?
20. Why can an COMMIT be confirmed before DBWn writes the blocks in the datafils?

---

# 36. Exercises for Oracle 26ai

In your lab FREE / FREEPDB1, you can check several concepts without actually making the disaster recovery.

Check base mode:

```
SELECT log_mode
FROM v $database;
```

See current SCN-:

```
SELECT current_scn
FROM v $database;
```

See redo logs:

```
SELECT
group #,
sequence #,
bytes / 1024 / 1024 AS size_mb,
stasis
FROM v $log
ORDER BY group #;
```

See checkpoint SCN of datafiles:

```
SELECT
# tabs,
checkpoint_change #
FROM v $datafile_header;
```

If you have privileges, check the archived logs:

```
SELECT
sequence #,
first_change #,
next_change #,
archived,
stasis
FROM v $archived_log
ORDER BY sequence # DESC
FETCH FIRST 20 ROWS ONLY;
```

And test Flashback Query on a lab board:

```
SELECT *
FROM dwh_account
AS OF TIMESTAMP SYSTIMESTAMP - INTERVAL '5' MINUTE
```

---

# 37. Final scheme to memorize

```
BACKUP / RECOVERY
                         │
       ┌─────────────────┼───────────────────┐
       │                 │                   │
BACKUPQ1QX RECOVER
       │                 │                   │
RMAN copy of backup
       │                                     │
* * *
       │                                     │
       ▼                                     ▼
Datafiles Archived + Online Redo
                                             │
                                             ▼
Consistent DB
```

and:

```
Crash:
Datafiles + REDO + UNDO
          ↓
Instant Recovery
```

and:

```
Error user:
Flashback / PITR / logical recovery
```

and, very important for DWH:

```
ETL
   │
¶ ¶ rollback ¶
- - Restart batch
* * * * *
- reprocess source
- only if necessary → DB recovery
```

The key idea of the whole chapter is:

> **Backup gives you the starting point, and REDO allows you to advance from that point to the state you want to recover. UNDO eliminates the effects of transactions that should not remain, and Flashback offers in certain situations a much faster way to go back in time than a full restore.**

---

## Questions and answers

### How would you briefly explain Backup / Recovery conceptually to a colleague who knows SQL, but not this area?

Backup / Recovery conceptual covers backup vs restore vs recovery, RMAN concepts, redo and archived redo in media recovery. In practice, first, I determine what data enter and what result to achieve, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Backup / Recovery and conceptual?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Backup / Recovery is conceptual, I explicitly follow back vs restore vs recovery, RMAN concepts, redo and archived redo in media recovery and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Backup / Recovery conceptual appears together with logging, auditing, reconciliation and impact analysis.
