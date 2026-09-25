---
title: 'C36. Batch Processing'
description: 'Complete English handbook chapter based on the original C36 course.'
sidebar_position: 36
---

# C36. Batch Processing

<div className="chapter-kicker">Chapter C36 · Complete course</div>

**Batch processing** means the automatic processing of a volume of data, usually in blocks and at predetermined times, without manual intervention for each record.

In an Oracle system, batch processing appears very often in:

- ETL / ELT;
- Data Warehouse,
- reconciliation;
- the calculation of interest / commissions;
- billing;
- daily / monthly closures;
- archiving;
- generating reports;
- processing files received from other systems;
- Massive recalculations;
- CDC incremental charges.

The central idea is:

> **batch = controlled and repeatable execution of a set of operations on a data volume.**

---

## 1. Batch vs. Online Processing

In an OLTP system, transactions are usually small:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 123;
```

A batch can process millions of rows:

```
UPDATE fact_transactions
SET processed_flag = 'Y'
WHERE business_date = DATE '2026-09-22';
```

Main difference:

= = sync, corrected by elderman = =
♪ ♪ ♪ ♪ ♪
♪ Few lines ♪ ♪ Many lines ♪
The rapid response is high throughput
Active user and automatic execution
Small transactions, large / grouped transactions
Small latency; periodic processing;

---

# 2. Typical examples of batch

### Daily Bank Batch

```
01. import transactions
02. data validation
03. calculation of balances
04. reconciliation
05. loading DWH
06. aggregation
07. reports
```

Can run every night:

```
00: 00 Start
00: 05 Extract
00: 30 Validated
1: 00 a.m.
01: 30 Turn
02: 30 Load DWH
3: 00 Aggregate
03: 30 Reports
04: 00 End
```

It is often referred to as **EOD.

---

# 3. Batch window

An important concept is **batch window**.

It's the time when the batch has to end.

Example:

```
Start batch: 00: 00 a.m.
Deadline: 5: 00 a.m.
```

We have:

```
batch window = 5 hours
```

If processing takes six hours, we have an operational problem.

For this reason, the performance of the batches is often measured by:

```
Throughput = rows processed / second
```

not just by the time of a single SQL.

---

# 4. Simple batch architecture

A typical ETL batch may have:

```
SOURCE
   ↓
STAGING
   ↓
VALIDATION
   ↓
TRANSFORMATION
   ↓
DWH
   ↓
AGGREGATION
   ↓
REPORTING
```

Example Oracle:

```
SRC_TRANSACTIONS
        ↓
STG_TRANSACTIONS
        ↓
ETL_TRANSACTION
        ↓
FACT_TRANSACTION
        ↓
AGG_DAILY_TRANSACTION
```

---

# 5. Batch Control Table

A control board is very useful in a real system.

```
CREATE TABLE batch_control (
batch_id NUMBER,
batch_name VARCHAR2 (100),
start_time TIMESTAMP,
end_time TIMESTAMP,
VARCHAR2 status (20),
rows_processed NUMBER,
error_message VARCHAR2 (4000)
);
```

Example:

```
BATCH_ID - BATCH_NAME - STATUS
---------------------------------------
1001, LOAD_CUSTOMERS, SUCCESS
1002, LOAD_ACCOUNTS, SUCCESS
1003; LOAD_TX; FAILED;
```

Typical statuses:

```
NEW
RUNNING
SUCCESS
FAILED
PARTIAL
RETRY
```

---

# 6. Batch ID

Each execution should be identifiable.

Example:

```
SELECT batch_seq.NEXTVAL
INTO v_batch_id
FROM dual;
```

Then each processed row may be associated with:

```
batch_id = 10042
```

This allows:

- audit;
- debugging,
- restart,
- reconciliation;
- identification of data uploaded by a particular job.

---

# 7. Logging

A serious batch has to keep logs.

Example:

```
CREATE TABLE batch_log (
batch_id NUMBER,
log_time TIMESTAMP,
step_name VARCHAR2 (100),
Message VARCHAR2 (4000)
);
```

Simple procedure:

```
CREATE OR REPLACE PROCEDURE log_batch (
p_batch_id NUMBER,
p_step VARCHAR2,
p_message VARCHAR2
)
IS
BEGIN
INSERTQ1QX batch_log
VALUES (
p_batch_id,
SYSTIMESTAMP,
p_step,
p_message
);

COMMIT;
END;
/
```

Example log:

```
10042 START Batch started
10042 EXTRACT 1,250,000 rows extracted
10042 VALIDATE 15 invalid rows
10042 LOAD_FACT 1,249,985 rows loved
10042 END Match completed
```

---

# 8. Error Management

A common mistake is:

```
one wrong row → the entire batch fails
```

In many systems it is better:

```
valid rows
   ↓
TARGET

invalid rows
   ↓
ERROR TABLE
```

For example:

```
INSERT INTO etl_error (
batch_id,
source_id,
error_message
)
VALUES (
v_batch_id,
rec.id,
SQLERRM
);
```

Thus:

```
1,000,000 rows
999,985 OK
15 errors
```

The batch can be considered as:

```
SUCCESS_WITH_ERRORS
```

or:

```
PARTIAL
```

---

# 9. Commit in a batch

One of the most important decisions is the COMMIT strategy.

## Version 1 = single COMMIT

```
INSERT...
UPDATE...
DELETE...

COMMIT;
```

Advantage:

```
atomicity
```

Disadvantage:

```
Very large UNDO
```

If you process 100 million lines, it can get problematic.

---

# 10. Commit in chunks

It can be processed in groups.

Example:

```
10,000 rows
COMMIT

10,000 rows
COMMIT

10,000 rows
COMMIT
```

PL/SQL:

```
IF MOD (v_count, 10000) returns 0 THEN
COMMIT;
END IF;
```

Advantages:

```
Reduced UNDO
shorter locks
easier restart
```

But there's an important problem:

> The bat is no longer atomic.

If the bat falls after:

```
700,000 rows
```

The first 700,000 are already commited.

That's why the bat must be designed for **restartability**.

---

# 11. Restartability

A good batch must be able to be resumed after failure.

Example:

```
Batch processed:
1 → 500000

Failure

Restart:
500001 →...
```

A simple model:

```
WHERE processed_flag = 'N'
```

and after processing:

```
UPDATE staging
SET processed_flag = 'Y'
WHERE...
```

On restart:

```
SELECT *
FROM staging
WHERE processed_flag = 'N';
```

---

# 12. Idempotency

A very important concept in ETL and batchs:

> If I run the bat twice, the result must remain correct.

This behavior is called **idempotency**.

Bad example:

```
INSERTQ1QX fact_sales
SELECT *
FROM staging_sales;
```

If you run twice:

```
duplicate records
```

A safer option:

```
MERGE INTO fact_sales
USING staging_sales
ON (f.transaction_id = s.transaction_id)

WHENQ1QX THEN
UPDATE SET
f.amount = s.amount

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

If you run again, you don't create duplicates.

---

# 13. Set-based processing vs row-byrow

The SQL processing in the set should be preferred in Oracle as far as possible.

### Weak variant

```
FOR rec IN (
SELECT *
FROM staging
)
LOOP

INSERT INTO target
VALUES (...);

END LOOP;
```

This is known informally as:

> **slowbyslow processing**

---

### Favorite version

```
INSERT INTO target
SELECT...
FROM staging;
```

Oracle is very effective for processing into set.

Principle:

> **SQL first, PL/SQL only where needed.

---

# 14. BULK COLLECT

If we still need PL/SQL, we use bulk processing.

```
SELECT customer_id, amount
BULKQ1QX INTO
l_customer_ids,
l_amounts
FROM transactions;
```

Problem:

```
1 million rows
```

can consume too much PGA.

That's why we use LIMIT.

```
FETCH c_transactions
BULK COLLECT INTO l_data
LIMIT 1000;
```

---

# 15. FORALL

For massive DML:

```
FORALL i IN 1.. l_data.COUNT

INSERTQ1QX target_table
VALUES (
l_data (i).id,
l_data (i).amount
);
```

Front of:

```
FOR i IN 1.. l_data.COUNT LOOP

INSERT...

END LOOP;
```

FORALL reduces the number of context switches between:

```
PL/SQL Engine
;
SQL Engine
```

And it can be a lot faster.

---

# 16. SAVE EXCEPTIONS

In batch processing we often want:

```
process what you can
keep errors
```

Example:

```
FORALL i IN 1.. l_data.COUNT
SAVE EXCEPTIONS

INSERTQ1QX target_table
VALUES (
l_data (i).id,
l_data (i).amount
);
```

Errors can be analysed by:

```
SQL
```

---

# 17. Direct Path Inser

For large loads:

```
INSERT / * + APPEND * /
INTO fact_sales
SELECT *
FROM staging_sales;
```

APPEND can directly use the patch insert.

Simplified:

```
normal insert
→ buffer cache
→ Blocks existing

APPEND
→ new blocks
→ direct path
```

It can be very useful in DWH.

---

# 18. Parallel Processing

Big batchs can use Parallel Execution.

Example:

```
INSERT / * + APPEND PARALLEL (8) * /
INTO fact_sales

SELECT / * + PARALLEL (8) * /
*
FROM staging_sales;
```

Conceptual:

```
Coordinator

    ↓

PX1
PX2
PX3
PX4
PX5
PX6
PX7
PX8
```

But PARALLEL (32) does not automatically mean 32 times faster.

The following shall be taken into account:

```
CPU
I/O
TEMP
PGA
competition
Licence / configuration
```

---

# 19. Partitioning and batch processing

Partitioning is very important in DWH.

Example:

```
PARTITION BY RANGE (business_date)
```

The data may be shared:

```
P20260920
P20260921
P20260922
P20260923
```

The daily batch only works with:

```
P20260923
```

Advantage:

```
partition pruning
```

and fast administrative operations.

---

# 20. Partition Exchange

For large loads there is the technique:

```
staging table
      ↓
load
      ↓
validated
      ↓
part exchange
```

Conceptual:

```
ALTERQ1QX fact_sales
EXCHANGE PARTITION p20260923
WITH TABLE stg_sales;
```

Instead of moving millions of rows, Oracle can mainly perform a metadata operation.

Very useful for DWH.

---

# 21. Schedule

Oracle batches can be programmed with:

```
DBMS_SCHEDULER
```

Example:

```
BEGIN

DBMS_SCHEDULER.CREATE_JOB (
job_name = = 'JOB_DAILY_ETL',
job_type = = 'STORED_PROCEDURE',
job_action = = 'RUN_DAILY_ETL',
start_date = = SYSTIMESTAMP,
repeat_interval = = 'FREQ=DAILY;BYHOUR=1',
enabled =
);

END;
/
```

It can run daily at about:

```
1: 00 a.m.
```

---

# 22. Job addiction

A real ETL flux is not:

```
A
B
C
D
```

independently executed.

Common:

```
LOAD_CUSTOMER
      ↓
LOAD_ACCOUNT
      ↓
LOAD_TRANSACTION
      ↓
BUILD_AGGREGATES
```

If:

```
LOAD_ACCOUNT = FAILED
```

then:

```
LOAD_TRANSACTION
```

Maybe they don't have to start.

This orchestration can be done by:

- Oracle Scheduler,
- ODI;
- Control-M;
- Airflow,
- Autosys,
- other enterprise schendulers.

---

# 23. Watermark

In incremental charges, an **watermark** is often maintained.

Example:

```
last_processed_timestamp
```

Table:

```
CREATE TABLE etl_watermark (
process_name VARCHAR2 (100),
last_processed_ts TIMESTAMP
);
```

The batcher reads:

```
SELECT *
FROM source_table
WHERE last_update
: last_processed_timestamp;
```

After success:

```
watermark = MAX (last_update)
```

---

# 24. Complete example of incremental batch

Suppose:

```
SOURCE_TRANSACTION
```

with:

```
transaction_id
account_id
% 1
last_update
```

Last processing:

```
2026-096-22 23: 59: 59
```

We extract:

```
SELECT *
FROM source_transaction
WHERE last_update
TIMESTAMP '2026-09-22 23:59:59';
```

Result:

```
150,000 new / changed rows
```

We put them in:

```
STG_TRANSACTION
```

then:

```
MERGE INTO fact_transaction
USING stg_transaction
ON (f.transaction_id = s.transaction_id)

WHENQ1QX THEN
UPDATE SET
f.amount = s.amount

WHEN NOT MATCHED THEN
INSERT (...)
VALUES (...);
```

After success:

```
watermark = MAX (last_update)
```

---

# 25. High Water Mark and Delayed Data

There's a subtle problem.

We assume:

```
watermark = 10: 00
```

but a transaction created at:

```
9: 58 a.m.
```

reach the source at:

```
10: 05 a.m.
```

If we filter:

```
last_update at 10: 00
```

we can lose the transaction.

A solution is an overlap:

```
WHERE last_update
: watermark - INTERVAL '5' MINUTE
```

And the reenactment is done in the target.

---

# 26. Reconciliation

After a batch of ETL, it should be checked that the data are complete.

Example:

```
SOURCE
1,000,000 rows

TARGET
999,990 rows

ERROR
10 rows
```

Reconciliation:

```
SOURCE = TARGET + ERROR

1,000,000
=
999,990 + 10
```

The amounts may also be checked.

```
SELECT COUNT (*), SUM (amount)
FROM source_transactions;
```

compared to:

```
SELECT COUNT (*), SUM (amount)
FROM fact_transactions;
```

---

# 27. Audit

For each batch it is useful to keep:

```
batch_id
start_time
end_time
source_count
target_count
error_count
stasis
```

Example:

```
BATCH_ID 10542
START 01: 00
END 01: 18
SOURCE_ROWS 2,501.340
TARGET_ROWS 2,501,332
ERROR_ROWS 8
STATUS SUCCESS_WITH_ERRORS
```

---

# 28. Match Fail

We assume the flow:

```
EXTRACT
   ↓
STAGE
   ↓
TRANSFORM
   ↓
LOAD_FACT
   ↓
AGGREGATE
```

and falls to:

```
LOAD_FACT
```

A well-designed batch should not repeat needlessly:

```
EXTRACT
STAGE
TRANSFORM
```

but be able to resume:

```
LOAD_FACT
```

This is an important principle:

> **checkpoint / restart point**

---

# 29. Examples of real problems

### Problem 1 is taking too long

Possible causes:

```
FULL TABLE SCAN Useless
bad doin '
Old statistics
Insufficient TEMP
Insufficient PGA
missing partition pruning
row-by-row processing
commit too often
inappropriate indexes
```

---

### Problem 2

Long batch:

```
ORA-01555
Snapshot too old
```

It can be linked to:

```
Insufficient UNDO
very long query
High competition
```

---

### Problem 3

Operations such as:

```
SORT
HASH JOIN
GROUP BY
DISTINCT
ORDER BY
```

I can get to TEMP.

---

### Problem 4 million committees

Code:

```
FOR rec IN (...) LOOP

INSERT...;

COMMIT;

END LOOP;
```

is usually very weak.

We have:

```
1 row
COMMIT

1 row
COMMIT
```

which produces massive overhead.

---

# 30. Batch processing and CDC

Batch and CDC can be combined.

### Full batch

```
every night:
read the entire table
```

### Incremental batch

```
read only the changes
```

### Near-real-time CDC

```
changes are almost continuously captured
```

Example:

```
OLTP
 ↓
CDC
 ↓
Staging
 ↓
microbatch
 ↓
DWH
```

---

# 31. Micro-batching

Between classic batch and streaming there is **microbatch**.

Example:

```
batch every 5 minutes
```

for:

```
batch at 24 hours
```

Thus:

```
00: 00 batch
00: 05 batch
00: 10 batch
00: 15 batch
```

It's common in modern data architecture.

---

# 32. Bulk vs Batch

The terms are linked, but not identical.

### Bulk processing

means:

```
efficient processing of many rows simultaneously
```

Examples:

```
BULK COLLECT
FORALL
INSERT SELECT
```

### Batch processing

means:

```
full operational process
```

which may include:

```
extract
validated
Transform
load
reconcile
log
```

A batch can use internal bulk processing.

---

# 33. Pattern Recommended for an Oracle Batch

A robust pattern shows this:

```
1. Generate BATCH_ID
        ↓
2. Mark RUNNING
        ↓
3. Determine watermark
        ↓
4. Extract
        ↓
5. Stage
        ↓
6. Validated
        ↓
7. Store invalid records
        ↓
8. Transform
        ↓
9. Load target
        ↓
10. Reconcile
        ↓
11. Update watermark
        ↓
12. Mark SUCCESS
```

In case of error:

```
mark FAILED
log error
preserve checkpoint
allow restart
```

---

# 34. Simplified PL/SQL Example

```
CREATE OR REPLACE PROCEDURE run_daily_batch
IS

v_batch_id NUMBER;

BEGIN

SELECT batch_seq.NEXTVAL
INTO v_batch_id
FROM dual;

INSERT INTO batch_control (
batch_id,
batch_name,
start_time,
stasis
)
VALUES (
v_batch_id,
'DAILY_ETL',
SYSTIMESTAMP,
'RUNNING'
);

COMMIT;

INSERT INTO fact_sales (
sale_id,
customer_id,
% 1
)
SELECT
sale_id,
customer_id,
% 1
FROM staging_sales
WHERE processed_flag = 'N';

UPDATE staging_sales
SET processed_flag = 'Y'
WHERE processed_flag = 'N';

UPDATE batch_control
SET
status = 'SUCCESS',
end_time = SYSTIMESTAMP
WHERE batch_id = v_batch_id;

COMMIT;

EXCEPTION

WHENQ1QX THEN

ROLLBACK;

UPDATE batch_control
SET
status = 'FAILED',
end_time = SYSTIMESTAMP,
error_message = SQLERRM
WHERE batch_id = v_batch_id;

COMMIT;

RAISE;

END;
/
```

In a enterprise system the code would have several mechanisms for restart, logging and consistency.

---

## Questions and answers

### What is batch processing?

Automatic processing of a volume of data in a controlled execution, usually periodically.

---

### What's the difference between batch and OLTP?

OLTP optimizes individual transactions and latency, and the batcher optimizes the processing of a large volume of data and the throughput.

---

### What is batch window?

The time frame during which the batch must be completed.

---

### What is restartability?

The ability of a batch to continue or be resumed after a failure without corrupting the data.

---

### What is idempotency?

The execution of the batch several times must produce the same logical result.

---

### Why don't we do COMMIT after each row?

It produces very high overhead and poor performance.

---

### What are BULK COLLECT and FORALL?

PL/SQL techniques for efficient processing of a large number of rows and reducing the context switches.

---

### Why is MERGE useful in batch processing?

For the implementation of type-loading:

```
insert + update
```

and for idempotent batchs.

---

### What's a watermark?

Point to which the data has already been processed.

Example:

```
last_processed_timestamp
```

---

### How do you optimize an Oracle Bunch?

In general, you analyze:

```
execution plans
Statistics
indexes
partitioning
parallelism
bulk processing
Commit strategy
PGA
TEMP
UNDO
I/O
```

---

## Questions and answers

You get it every day:

```
50 million transactions
```

The batch lasts:

```
7 hours
```

but the window is:

```
4 hours
```

I would consider in this order:

```
1. SQL execution plans
2. Full load vs incremental load
3. partition pruning
4. indexes
5. Statistics
6. row-by-row PL/SQL
7. bulk / set-based processing
8. INSERT / * + APPEND * /
9. parallel execution
10. TEMP / PGA / I/O
11. unnecessary committees
12. unnecessary sorts
13. part exchange loving
```

I wouldn't just start with:

```
PARALLEL (32)
```

Because the problem may be in the design of the process.

---

# 37. What to remember for an Oracle Data Developer role

The most useful mental scheme is:

```
BATCH
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
DATAQ1QX PERFORMANCE
        │           │           │
Staging batch_id set-based
Transform Bulk Collection Status
go logging forall
Target restart partitioning
parallel audit errors
        │           │           │
        └───────────┼───────────┘
                    ↓
RECONCILIATION
```

And the **7 key concepts** to remember are:

1. **Batch Window**
2. **Match ID / Audit**
3. **Restartability**
4. **Idempotency**
5. **Watermark / Creative Processing**
6. **Set-based
7. **Reconciliation**

for reviews with **Oracle Data Developer / DWH / ETL**, the batch\ _ id + watermark + staging + MERGE + error table + restartability + reconciliation is a very important pattern and occurs frequently in banking and enterprise systems.

---

## Questions and answers

### How would you briefly explain the Batch processing to a colleague who knows SQL, but not this area?

The batch processing covers batch vs OLTP and EOD windows, batch control tables, IDs and status, logging, errors and checkpoints. In practice, I first determine what data enters and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to the batch processing?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Bunch processing, I explicitly follow the batch vs OLTP and EOD windows, batch control tables, IDs and status, logging, errors and checkpoints and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

An EOD processes 50 million rows in a four-hour window.
