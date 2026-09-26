---
title: 'C35. Change Data Capture'
description: 'Complete English handbook chapter based on the original C35 course.'
sidebar_position: 35
---

# C35. Change Data Capture

<div className="chapter-kicker">Chapter C35 · Complete course</div>

## 35. CDC = Change Data Capture

**CDC (Change Data Capture)** represents the set of techniques by which we identify and transfer only the changes that occur in a source system INSERT, UPDATE, DELETE, instead of reviewing and reprocessing all data.

It is very important in **ETL/ELT, Data Warehouse, system integration and non-real-time processing**.

The central idea is:

```
SOURCE SYSTEM
     |
* INSERT / UPDATE / DELETE
     v
Change Detection
     |
     v
CDC stream / staging
     |
     v
ETL / ELT
     |
     v
DATA WAREHOUSE
```

---

## 1. Why we need CDC

Suppose we have the scoreboard:

```
CUSTOMERS
```

with:

```
10 million rows
```

and one day it shall only be amended:

```
20,000 rows
```

Without CDC we could do:

```
SELECT *
FROM customers;
```

and compare 10 million rows.

With CDC we process only those:

```
20,000 changes
```

The advantages are important:

```
less I/O
less CPU
ETL faster
lower latency
Reduced traffic between systems
lower load on OLTP
```

---

## 2. Types of amendments sought

CDC aims mainly at:

```
INSERT
UPDATE
DELETE
```

Example.

Initial status:

```
CUSTOMER_ID | STATUS
-----------   -------  ------
101 Ana ACTIVE
102 Mihai ACTIVE
```

Then:

```
UPDATE customers
SET status = 'INACTIVE'
WHERE customer_id = 101;

INSERT INTO Customers
VALUES (103, 'Dan', 'ACTIVE');

DELETE FROM Customers
WHERE customer_id = 102;
```

The conceptual CDC flow could be:

```
U = 101
I-103-Dan-ACTIVE
D, 102, Mihai, ACTIVE
```

where:

```
I = INSERT
U = UPDATE
D = DELETE
```

---

## 3. Full Load vs Incremental Load vs CDC

These concepts need to be differentiated.

### Full Lold

It's loading up.

```
INSERT INTO dwh_customer
SELECT *
FROM src_customer;
```

Useful for:

```
initial load
small volumes
complete rebuild
```

But it gets expensive for big tables.

---

### Incremental Lead

We only select the modified data after a certain moment.

Example:

```
SELECT *
FROM customers
WHERE last_update_date
```

This is a simple form of incremental detection.

---

### CDC

CDC follows the changes explicitly.

Conceptual:

```
INSERT INTO customer (customer_id) VALUES (103)
UPDATE customer SET ... WHERE customer_id = 101
DELETE FROM customer WHERE customer_id = 102
```

CDC may be:

```
batch
microbatch
not-real-time
real-time
```

---

## 4. Main Methods of CDC

There are several strategies.

The most important are:

```
1. Timestamp-based CDC
2. Sequence / ID-based CDC
3. Trigger-based CDC
4. Log-based CDC
5. Snapshot comparison
6. Oracle Flashback-based detection
```

---

## 5. Timestamp-based CDC

It's one of the simplest methods.

The source table shall contain:

```
LAST_UPDATE_DATE
```

For example:

```
CREATE TABLE customers (
customer_id NUMBER PRIMARY KEY,
customer_name VARCHAR2 (100),
VARCHAR2 status (20),
last_update_date TIMESTAMP
);
```

ETL retains the last execution:

```
2026-09-23 01: 00 a.m.
```

On the following execution:

```
SELECT *
FROM customers
WHERE last_update_date; TIMESTAMP '2026-09-23 01:00:00';
```

Flow:

```
ETL T1
   |
save watermark
   |
   v
2026-09-23 01: 00
   |
source changes
   |
   v
ETL T2
   |
WHERE last_update_date
```

This value is commonly called:

```
watermark
high-water mark
checkpoint
```

---

## 6. The problem of timestamps

Variant:

```
WHERE last_update_date
```

It seems simple, but there are risks.

For example:

```
ETL starts at 10: 00
read data by 10: 03
a row is amended at 10: 02
The watermark is set wrong at 10: 03 a.m.
```

Some changes can be missed.

A safer option is:

```
start watermark
       |
----- ETL processing -----
       |
end watermark
```

and:

```
WHERE last_update_date
AND last_update_date
```

Example:

```
SELECT *
FROM customers
WHERE last_update_date
AND last_update_date
```

---

## 7. Sequence-based CDC

Sometimes the source offers a growing ID monotone.

Example:

```
CHANGE_ID
---------
10001
10002
10003
10004
```

ETL retains:

```
last_processed_id = 10002
```

and execute:

```
SELECT *
FROM changes
WHERE change_id;
```

Advantage:

```
simple
fast
determinist
```

But it only works if the identifier respects the order of the changes.

---

## 8. Trigger-based CDC

We can create an audit board.

```
CREATE TABLE customer_changes (
change_id NUMBER GENERATED ALWAYS AS IDENTITY,
customer_id NUMBER,
operation VARCHAR2 (1),
change_date TIMESTAMP
);
```

TRIGGER:

```
CREATE OR REPLACE TRIGGER trg_customer_cdc
AFTER INSERT OR UPDATE OR DELETE
ON customers
FOR EACH ROW
BEGIN

IF INSERTING THEN

INSERT INTO customer_changes (
customer_id,
operation,
change_date
)
VALUES (
:NEW.customer_id,
'I',
SYSTIMESTAMP
);

ELSIF UPDATING THEN

INSERT INTO customer_changes (
customer_id,
operation,
change_date
)
VALUES (
:NEW.customer_id,
'U',
SYSTIMESTAMP
);

ELSIF DELETING THEN

INSERT INTO customer_changes (
customer_id,
operation,
change_date
)
VALUES (
:OLD.customer_id,
'D',
SYSTIMESTAMP
);

END IF;

END;
/
```

Thus:

```
CUSTOMERS
    |
* * *
    v
TRIGGER
    |
    v
CUSTOMER_CHANGES
```

---

## 9. Trigger-based problem CDC

Triggers can affect the OLTP system.

Each:

```
INSERT
UPDATE
DELETE
```

perform additional logic.

Possible problems:

```
overhead
locking
additional redo
complexity
Impact on transactions
```

For this reason, in very large systems it is often preferred:

```
log-based CDC
```

---

## 10. Log-based CDC

This is one of the most important enterprise techniques.

Oracle generates REDO for database changes.

Simplified:

```
Application
     |
     v
Oracle Database
     |
+ -- * Data Blocks
     |
+ --
             |
             v
CDC engine
```

CDC engine reads the changes in redo logs.

Important advance:

```
do not have to constantly question the tables
```

and does not require trigger on each table.

---

## 11. REDO and CDC

Suppose:

```
UPDATE customers
SET status = 'ACTIVE'
WHERE customer_id = 100;
```

Oracle generates redo information.

Conceptual:

```
REDO

transaction X
CUSTOMERS tables
100
UPDATE
STATUS:
INACTIVE - EXCIPIENTS ACTIVE
```

A CDC system can extract this information and produce an event.

```
CUSTOMERS = 100
```

---

## 12. Oracle LogMiner

Oracle provides mechanisms that allow analysis of redo logs.

An important concept is:

```
LogMiner
```

It can interpret the information in the redo.

Conceptual:

```
Online Redo Logs
       +
Archived Redo Logs
       |
       v
LogMiner
       |
       v
SQL_REDO
SQL_UNDO
```

A conceptual example:

```
SELECT
operation,
seg_owner,
table_name,
sql_redo
FROM V$logmnr_contents;
```

The result may contain something like this:

```
OPERATION | SQL_REDO
---------   ----------   -----------------------------
INSERT CUSTOMER insert into...
UPDATE CUSTOMER update...
DELETE CUSTOMER delete...
```

In practice, LogMiner configuration involves privileges and LogMiner session configuration.

---

## 13. Oracle GoldenGate

For CDC enterprise, an important product in the Oracle ecosystem is:

```
Oracle GoldenGate
```

Conceptual architecture:

```
Oracle Source
     |
REDO
     |
     v
GoldenGate extract
     |
     v
Trail Files
     |
     v
GoldenGate Replicate
     |
     v
Target Database / DWH
```

GoldenGate is used for:

```
CDC
replication
migration
high availability scenarios
real-time integration
```

An important advantage is reduced latency.

---

## 14. CDC and ODI

For an Oracle Data Developer, the relationship between CDC and:

```
Oracle
```

ODI uses the concept:

```
Journalizing
```

for identification of changes.

Simplified flow:

```
Source Table
     |
     v
ODI Journalizing
     |
     v
Journal Tables
     |
     v
ODI Mapping
     |
     v
DWH
```

---

## 15. ODI Journalizing

ODI defines two classic concepts:

```
Simple Journalizing
Consistent Set Journalizing
```

### Simple Journalizing

The changes shall be independently monitored for each datastore.

Conceptual:

```
CUSTOMER
   |
   v
J$_CUSTOMER
```

where the J $table contains information about the changes.

---

## 16. Consistent Set Journalizing

It is important when several tables need to be processed in a consistent state.

For example:

```
ORDER_HEADER
ORDER_LINE
```

We don't want to read:

```
ORDER_HEADER = T2 version
ORDER_LINE = T1 version
```

Consistent Set Journalizing tries to provide a consistent logical picture of associated changes.

---

## 17. CDC and Staging

A common DWH architecture is:

```
SOURCE
   |
* * *
   v
STAGING
   |
Transformations
   v
CORE DWH
   |
   v
DATA MART
```

Example:

```
SRC_CUSTOMER
     |
     v
STG_CUSTOMER_DELTA
     |
     v
DWH_DIM_CUSTOMER
```

The staging table may contain:

```
CUSTOMER_ID
NAME
STATUS
CDC_OPERATION
CDC_TIMESTAMP
```

---

## 18. Example of Table CDC staging

```
CREATE TABLE stg_customer_delta (
customer_id NUMBER,
customer_name VARCHAR2 (100),
VARCHAR2 status (20),
cdc_operation CHAR (1),
cdc_timestamp TIMESTAMP
);
```

Example data:

```
101 Ana INACTIVE U
102 Mihai ACTIVE D
103 Dan ACTIVE I
```

---

## 19. Application of changes in DWH

For INSERT and UPDATE we can use:

```
MERGE
```

Example:

```
MERGE INTO dwh_customer
USING (
SELECT *
FROM stg_customer_delta
WHERE cdc_operation IN ('I', 'U')
) s
ON (
d.customer_id = s.customer_id
)

WHEN MATCHED THEN
UPDATE SET
d.customer_name = s.customer_name,
d.status = s.status

WHEN NOT MATCHED THEN
INSERT (
customer_id,
customer_name,
status
)
VALUES (
s.customer_id,
s.customer_name,
sstatus
);
```

---

## 20. Treatment of DELETE

Delegate is one of the most important aspects of CDC.

With the method:

```
WHERE last_update_date
```

We can detect:

```
INSERT
UPDATE
```

but not necessarily:

```
DELETE
```

Because the row no longer exists.

This is why we need mechanisms such as:

```
soft delete
audit tables
trigger
redo / log-based CDC
```

---

## 21. Soft Delete

A common solution is:

```
IS_DELETED
```

for:

```
DELETE FROM Customers
WHERE customer_id = 100;
```

the application makes:

```
UPDATE customers
SET
is_deleted = 'Y',
last_update_date = SYSTIMESTAMP
WHERE customer_id = 100;
```

CDC detects UPDATE-.

In DWH we can apply:

```
active_flag = N
```

---

## 22. Hard Delete in DWH

If the traineeship contains:

```
CDC_OPERATION = 'D'
```

We can do:

```
DELETE FROM dwh_customer
WHERE EXISTS (
SELECT 1
FROM stg_customer_delta
WHERE s.customer_id = d.customer_id
AND s.cdc_operation = 'D'
);
```

But in an DWH, the hard drive is not always wanted.

We often keep track of history.

---

## 23. CDC and SCD

CDC and SCD are different concepts.

CDC replies:

> **What changed in source?**

SCD replies:

> **How do we keep change in DWH size?**

Flow:

```
OLTP
 |
* * *
 v
Change detected
 |
The logical SCD
 v
DIM_CUSTOMER
```

---

## 24.CDC + SCD Type 1

We have:

```
CUSTOMER_ID = 100
CITY = Bucharest
```

CDC detects:

```
CITY:
Bucharest - Cluj
```

SCD

```
UPDATE dim_customer
SET city = 'Cluj'
WHERE customer_id = 100;
```

History is lost.

---

## 25. CDC + SCD Type 2

CDC detects the same change:

```
Bucharest - Cluj
```

In SCD2:

```
SK CUSTOMER_ID CITY FROM TO CURRENT
--   -----------   ---------   --------   ----------  -------
1 100 Bucharest 2025 2026-09-22 N
2 100 Cluj 2026-09-23 9999-12-31 Y
```

CDC says:

```
customer 100 changed
```

and SCD2 decides:

```
close the old version
create new version
```

---

## 26. Watermark Table

In a real ETL, the processed values are kept in a control table.

Example:

```
CREATE TABLE etl_watermark (
process_name VARCHAR2 (100) PRIMARY KEY,
last_processed_ts TIMESTAMP
);
```

Data:

```
PROCESS_NAME LAST_PROCESSED_TS
----------------------   --------------------------
LOAD_CUSTOMER 2026-09-23 01: 00: 00
LOAD_ACCOUNT 2026-09-23 01: 05: 00
```

ETL read:

```
SELECT last_processed_ts
FROM etl_watermark
WHERE process_name = 'LOAD_CUSTOMER';
```

---

## 27. Updating the watermark

After success:

```
UPDATE etl_watermark
SET last_processed_ts =: current_watermark
WHERE process_name = 'LOAD_CUSTOMER';
```

Very important:

```
the NU watermark must be moved if the processing has failed.
```

Otherwise we can lose changes.

---

## 28. Idempotency

A very important property in CDC/ETL is:

```
idempotency
```

That is, if we process the same event twice, the final result remains correct.

Example:

```
event:
CUSTOMER 100 - EXCIPIENTS ACTIVE
```

If the same change arrives twice:

```
UPDATE custodian
SET status = 'ACTIVE'
```

The result is the same.

In practice we can keep:

```
event_id
transaction_id
SCN
sequence_number
```

for deductions.

---

## 29. Exactly-once vs At-least-once

Concepts of:

```
At-sample-once
At-least-once
Exactly.
```

### At-sample-once

The event may be lost, but not duplicated.

### At-least-once

The event is guaranteed to arrive, but it can appear several times.

### Exactly.

Each change produces exactly one final effect.

In practice:

```
ate-last-once + idempotency
```

is very common.

---

## 30. SCN; System Change Number

In Oracle it is very important that the concept:

```
SCN
```

System Change Number.

SCN is the logical order of changes under the Oracle.

Conceptual:

```
SCN 1000
SCN 1001
SCN 1002
SCN 1003
```

A CDC pipeline may store:

```
last_processed_scn
```

and continue from there.

This is safer than using a simple timestamp in many Oracle scenarios.

---

## 31. Commit and CDC

A correct CDC must take into account transactions.

Example:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 2;

COMMIT;
```

These two changes represent:

```
a single transaction
```

CDC should not ideally display the target only the first part.

Conceptual:

```
BEGIN TX
UPDATE account 1
UPDATE account 2
COMMIT
```

only then do the changes become consumable.

---

## 32. Ordering

The order of events matters.

Example:

```
1 UPDATE custodian 100 - EXCIPIENTS SILVER
2 UPDATE custodian 100
```

If the target processes:

```
2
1
```

The final value becomes incorrect.

Therefore, it may be necessary to:

```
SCN
sequence
Transaction order
comment order
```

---

## 33. Evolution Scheme

CDC must also manage structural changes.

For example:

```
ALTER TABLE Customers
ADD customer_segment VARCHAR2 (20);
```

Now the CDC event may contain:

```
customer_segment
```

But the target may not have that column yet.

This phenomenon is called:

```
evolution scheme
```

and shall be coordinated with:

```
deployments
ETL mappings
scheme target
CDC metadata
```

---

## 34. CDC latency

An important KPI is:

```
CDC
```

For example:

```
source commit:
10: 00 a.m.

Target Commit:
10: 00: 04
```

Latency:

```
4 seconds
```

Depending on the architecture we have:

```
batch CDC - = minutes / hours
microbatch - = seconds / minutes
streaming CDC - = seconds or sub-seconds
```

---

## 35. CDC in a bank DWH

A realistic scenario:

```
CORE BANKING
     |
* * *
     v
STAGING
     |
+ -- = ACCOUNT changes
+ -- = CUSTOMER changes
+ -- = TRANSACTION changes
     |
     v
DWH
     |
     v
REPORTING
```

Example:

```
ACCOUNT_ID = 1001

STATUS:
ACTIVE - EXCIPIENTS BLOCKED
```

CDC detects change.

ETL:

```
CDC
 ↓
STG_ACCOUNT
 ↓
validation
 ↓
business transformations
 ↓
SCD
 ↓
DWH_ACCOUNT
```

---

## 36. CDC for fact tables

Suppose:

```
TRANSACTIONS
```

where each transaction is generally a new INSERT.

We can have:

```
TRANSACTION_ID
```

Growing monotone.

Pipeline:

```
SELECT *
FROM transactions
WHERE transaction_id
```

Then:

```
INSERT INTO fact_transaction (...)
SELECT...
FROM staging_transaction;
```

For events tables, CDC can be much simpler than for dimensions.

---

## 37. CDC for Dimensions

For:

```
CUSTOMER
ACCOUNT
PRODUCT
BRANCH
```

Common:

```
INSERT
UPDATE
DELETE
```

So the pipelineum is more complex:

```
CDC
 |
 v
STAGING DELTA
 |
 v
business comparison
 |
+ -- = No relevant change
 |
+ --
 |
+ --
 |
+ --
```

---

## 38. Snappshot comparison

If the source does not provide:

```
timestamp
log
CDC API
sequence
```

We can compare snapshots.

Yesterday:

```
CUSTOMER_SNAPSHOT_T1
```

Today:

```
CUSTOMER_SNAPSHOT_T2
```

Comparison:

```
T1 vs T2
```

We're picking up:

```
New rows
changed rows
deleted rows
```

---

## 39. Detection of INSERT by comparison

```
SELECT n. *
FROM customer_new n
LEFT JOIN customer_old
ON o.customer_id = n.customer_id
WHERE o.customer_id IS NULL;
```

Result:

```
INSERT
```

---

## 40. Detection of DELETE

```
SELECT o. *
FROM customer_old
LEFT JOIN customer_new
ON n.customer_id = o.customer_id
WHERE n.customer_id IS NULL;
```

Result:

```
DELETE
```

---

## 41. Detection of UPDATE

```
SELECT n. *
FROM customer_new n
JOIN customer_old
ON o.customer_id = n.customer_id
WHERE NVL (n.status, '#')
```

For many columns, this gets expensive.

---

## 42. Hash-based comparison

A common optimization is the calculation of a hash.

Conceptual:

```
HASH (
NAME,
CITY,
STATUS,
SEGMENT
)
```

If:

```
old_hash - new_hash
```

then there's a change.

Conceptual example:

```
STANDARD_HASH (
customer_name
city)
status,
'SHA256'
)
```

Attention to:

```
NULL
separators
data types
NLS
normalisation
```

---

## 43. CDC and Data Quality

The fact that the source sent a change doesn't mean it has to be automatically loaded.

Fair flow:

```
CDC
 |
 v
Staging
 |
 v
Data Quality
 |
+ --
 |
+ --
 |
 v
DWH
```

Example:

```
ACCOUNT_ID = NULL
```

may be sent to:

```
ETL_ERROR
```

instead of DWH.

---

## 44. CDC and restartability

A good pipeline must bear:

```
Crash
restart
reply
```

Example:

```
1000 events
```

The process dies after:

```
Event 750
```

At the restart we need to know:

```
last valid checkpoint
```

and continue without:

```
losses
incorrect doubling
```

---

## 45. Recommended Design

A robust simplified design:

```
SOURCE
   |
* * *
   v
RAW_DELTA
   |
VALIDATION
   v
STAGING
   |
Business transformations
   v
DWH
   |
   v
UPDATE CHECKPOINT
```

The order is important:

```
1 detects
2 persists delta
3 validates
4 process
5 Commit
6 update checkpoint
```

No:

```
update checkpoint
      ↓
data process
```

Because an error can cause data loss.

---

## 46. CDC and Performance

In large volumes, the following must be observed:

```
volumes of change
Transaction rates
redo generation
lag
batch size
comment
parallelism
network throughput
indexing target
```

Example:

```
100 million rows table
```

but:

```
500,000 changes / day
```

CDC allows the processing of:

```
500,000
```

for:

```
100 million
```

---

## 47. Indexation of stagnation

For:

```
STG_CUSTOMER_DELTA
```

indexes may be useful on:

```
CUSTOMER_ID
CDC_OPERATION
BATCH_ID
```

but excessive indexing should be avoided.

The trainee gets a lot:

```
INSERT
```

and each index produces extra cost.

---

## 48. Common errors

### 1. Watermark Updated Before Success

Wrong:

```
UPDATE watermark
PROCESS DATA
```

Right:

```
PROCESS DATA
COMMIT
UPDATE watermark
```

---

### 2. DELETE Ignored

Timestamp CDC may not detect relays.

We need a separate strategy.

---

### 3. Comparison of timestamp with SYSDATE

It can create gaping.

We'd better use:

```
previous watermark
current fixed watermark
```

---

### 4. Duplicate Events

The pipelineum must be:

```
idempotent
```

---

### 5. Wrong Order

Two UPDATE-uri can go the other way.

You have to:

```
SCN
```

---

### 6. Non-classification of transactions

Several changes can be part of the same transaction.

---

## 51. The more difficult scenario

**Question:**

> Your ETL reads all the lines where LAST_UPDATE_DATA at_run_data. How do you detect DELETE?

Answer:

> I can not reliably detect hard delete just by checking the current table, because the row no longer exists. I would use software-delete, audit / trigger table, log-based CDC or a comparison snapshot mechanism.

---

## 52. Oracle Scenario

**Question:**

> What would you use in Oracle for almost real-time CDC?

Possible answers:

```
Oracle GoldenGate
redo / log-based capture
LogMiner-based solutions
ODI Journalizing
```

The choice depends on:

```
latency requirements
licensing
volumes
architecture
source / target technologies
```

---

## 53. Oracle Exercise 26ai

You can create:

```
CREATE TABLE cdc_customer (
customer_id NUMBER PRIMARY KEY,
customer_name VARCHAR2 (100),
VARCHAR2 status (20),
last_update_date TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

Insert:

```
INSERT INTO cdc_customer
VALUES (
1,
'Ana',
'ACTIVE',
SYSTIMESTAMP
);

COMMIT;
```

Simulate watermark:

```
VAR last_ts TIMESTAMP;

EXEC: last_ts: = SYSTIMESTAMP;
```

Then amend the data:

```
UPDATE cdc_customer
SET
status = 'INACTIVE',
last_update_date = SYSTIMESTAMP
WHERE customer_id = 1;

INSERT INTO cdc_customer
VALUES (
2,
'Mihai',
'ACTIVE',
SYSTIMESTAMP
);

COMMIT;
```

Simplified CDC:

```
SELECT *
FROM cdc_customer
WHERE last_update_date
```

---

## 54. Exercise closer to a real ETL

Create the table:

```
CREATE TABLE etl_control (
process_name VARCHAR2 (50) PRIMARY KEY,
watermark TIMESTAMP
);
```

Initialize:

```
INSERT INTO etl_control
VALUES (
'CUSTOMER_LOAD',
TIMESTAMP '2000-01-01 00:00:00'
);

COMMIT;
```

Then ETL:

```
SELECT c. *
FROM cdc_customer c
CROSS JOIN etl_control
WHERE e.process_name = 'CUSTOMER_LOAD'
AND c.last_update_date,
```

After successful loading:

```
UPDATE etl_control
SET watermark = SYSTIMESTAMP
WHERE process_name = 'CUSTOMER_LOAD';

COMMIT;
```

In real implementation, the current watermark should be captured before processing, not arbitrarily recalculated after completion.

---

## Questions and answers

### What is CDC?

Answer:

> Change Data Capture is a technique by which we identify and process only changes produced in the source system INSERT, UPDATE and DELETE instead of rereading the entire table.

---

### CDC vs incremental load?

Incremental load is the general concept of processing only new / modified data.

CDC is a specialized mechanism for capturing changes, sometimes directly from transaction logs.

---

### What methods do CDC know?

```
timestamp-based
sequence-based
trigger-based
log-based
snapshot comparison
```

---

### What is the CDC problem based on timestamp?

Maybe:

```
Change rate
have race conditions
had equal timestamps
DELETE rate
have time zone / precision issues
```

---

### Why logbased CDC is preferred in large systems?

Because:

```
the impact on the application is reduced
does not require complete queries
can detect INSERT / UPDATE / DELETE
can keep order of transactions
```

---

### What's a watermark?

This is the position to which ETL successfully processed the data.

It can be:

```
timestamp
sequence
SCN
Event ID
```

---

### What is idempotency?

The ability of the pipeline to reprocess the same event without producing inaccurate duplicate effects.

---

### CDC vs SCD?

Very important:

```
CDC = detects change

SCD = decides how to keep change
in dimension DWH
```

---

**Question:**

> We have a CUSTOMER table with 200 million rows. Every day it changes about 300,000. How would you design loading in DWH?

A good answer:

> I would not make full scan and full reload daily. I would use CDC. If the source provides logbased CDC, it would be preferable for large volume. Alternatively, I would use a timestamp or a SCN as watermark. The changes would be loaded into a staging area, where I would do validations and deductions. Then I would apply SCD logic to the size of DWH. The checkpoint would be updated only after successful processing, so that the process is restartable.

---

The most useful mental scheme is:

```
CDC
                  |
     +------------+-------------+
     |            |             |
timestamp triggers logs
     |            |             |
(PHP 4 = 4.1.0)
     |            |             |
     +------------+-------------+
                  |
                  v
STAGING
                  |
Data Quality
                  |
                  v
ETL / ELT
                  |
           +------+------+
           |             |
SCD FACT
           |             |
           +------+------+
                  |
                  v
DWH
```

And the **7 essential** concepts worth knowing are:

1. **CDC captures INSERT / UPDATE / DELETE**, not just new rows.
2. **Timestamp / Watermark CDC** is simple, but has limitations.
3. **Log-based CDC** is the preferred solution for large volumes and low latency.
4. In Oracle, **REDO, SCN, LogMiner and GoldenGate** are important concepts for CDC.
5. In ODI, the relevant concept is **Journalizing**.
6. **CDC and SCD are different things**: CDC detects change, SCD determines history.
7. A good CDC pipeline must be **restartable, idempotent and do not move the checkpoint before the data are successfully processed**.

For the role of **Oracle Data Developer / ODI / DWH**, the combination I would specifically deepen is:

```
CDC
→ Oracle REDO / SCN
→ ODI Journalizing
→ staging delta
→ MERGE
→ SCD Type 1
→ ETL control tables
→ restartability / idempotency
```

This is exactly where CDC binds to previous modules about **ETL/ELT, SCD, DWH, Redo / Undo and ODI orchestration**.

---

### How would you briefly explain the CDC's Change Data Capture to a colleague who knows SQL, but not this area?

CDC's Change Data Capture covers capturing inserts, updates and deletes, log-based vs trigger / timestamp-based CDC, SCN / watermark concepts. In practice, first, I determine what data enter and what result to achieve, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to CDC's Change Data Capture?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For CDC's Change Data Capture, I explicitly aim at capturing inserts, updates and deletes, log-based vs trigger / timestamp-based CDC, SCN / watermark concepts and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, CDC's Change Data Capture appears along with logging, auditing, reconciliation and impact analysis.
