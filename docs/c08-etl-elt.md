---
title: 'C08. ETL and ELT'
description: 'Complete English handbook chapter based on the original C08 course.'
sidebar_position: 8
---

# C08. ETL and ELT

<div className="chapter-kicker">Chapter C08 · Complete course</div>

ETL/ELT is where many of the concepts discussed so far come together: **SQL, PL/SQL, transactions, OLTP, OLAP, Data Warehouse and SCD**. For an Oracle Data Developer, it is not enough to know how to write a INSERT or a MERGE; you must be able to design a flow that is **correct, repeatable, auditable, performant, and recoverable after errors**.

---

## 1. What ETL is

**ETL = Extract → Transform → Load**

The classic flow is:

```
SOURCE
   |
   v
EXTRACT
   |
   v
TRANSFORM
   |
   v
LOAD
   |
   v
DATA WAREHOUSE
```

Example:

```
ERP
CRM
Core Banking
   |
   v
Staging / ETL Engine
   |
+ -- • Cleaning
+ -- The validation
+ --
+ - Business rules
+ --
   |
   v
Oracle DWH
```

The data are converted **before** loading into the final structure.

---

## 2. What ELT is

**ELT = Extract → Load → Transform**

Instead of transforming data in a separate ETL engine, we load the data into the database and use Oracle for the transformations.

```
SOURCE
   |
   v
EXTRACT
   |
   v
LOAD
   |
   v
Oracle STAGING
   |
   v
TRANSFORM
   |
   v
DWH
```

It is very common in modern systems and is a natural approach for **Oracle + ODI**.

For example:

```
CSV / ERP / API
       |
       v
STG_TRANSACTION
       |
       v
SQL / MERGE / PL/SQL
       |
       v
DWH_TRANSACTION
```

---

## 3. ETL vs. ELT

* * * * * * *
♪ ♪ ♪ ♪ ♪
Transformation before load Transformation after load
ETL engine makes transformations - DB makes transformations - DB
Useful when the source / destination has limited resources very good for Oracle / DWH
It can move large volumes through the ETL engine and take advantage of SQL set-based
Classic Computer Science / SSIS etc.; very common with ODI

In Oracle DWH, very often you will meet practically:

```
Extract
   ↓
Landing
   ↓
Staging
   ↓
SQL / PL/SQL / ODI transformations
   ↓
Core DWH
```

that is closer to an **ELT** model.

---

## 4. Typical architecture of a DWH pipeline

A healthy flow should not simply be:

```
SOURCE → DWH
```

A healthier architecture is:

```
SOURCE
   ↓
LANDING
   ↓
STAGING
   ↓
CORE DWH
   ↓
DATA MART
   ↓
BI / REPORTING
```

### Landing

Data almost identical to the source.

Purpose:

- preservation of raw data;
- debugging,
- reprocessing;
- audit.

Example:

```
LND_CUSTOMER
LND_ACCOUNT
LND_TRANSACTION
```

---

### Staging

The area where the data is ready for DWH.

```
STG_CUSTOMER
STG_ACCOUNT
STG_TRANSACTION
```

Here we go:

```
conversion
validation
standardization
deduplication
lookups
business rules
```

---

### Core DWH

Historic / integrated model:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_PRODUCT
FACT_TRANSACTION
```

---

### Data mart

Consumer-oriented structures.

Example:

```
SALES_MART
RISK_MART
FINANCE_MART
```

---

## 5. The three fundamental stages

## Extract

The main question:

> What data do I have to extract?

There are three important models.

### Full load

We read everything.

```sql
INSERT INTO stg_customer
SELECT *
FROM src_customer;
```

Simple, but expensive.

If the source has:

```
100 million rows
```

We don't want to transfer them all every day.

---

### Incremental load

We extract only new or changed data.

Example:

```sql
SELECT *
FROM src_customer
WHERE last_update_date > :watermark
```

It introduces one of the most important ETL concepts:

### Watermark / High-water mark

For example:

```
last processing:
2026-09-22 23:00
```

We extract:

```
WHERE update_date > TIMESTAMP '2026-09-22 23:00:00'
```

After success:

```
watermark = 2026-09-23 23: 00
```

---

## 6. Watermark challenges

It seems simple:

```
WHERE update_date
```

but it can cause problems.

Suppose:

```
watermark = 10: 00
```

A row is modified:

```
09: 59: 59
```

but the transaction makes COMMIT to:

```
10: 00: 05
```

The pipeline can miss that row.

This is why enterprise systems often use:

- SCN;
- CDC;
- log-based capture;
- sequence;
- Transaction ID;
- overlap window.

For example:

```
WHERE update_date >= :watermark - INTERVAL '5' MINUTE
```

and the processing must be **idempotent**.

---

## 7. CDC - Change Data Capture

CDC is trying to identify:

```sql
INSERT
UPDATE
DELETE
```

without rescanning the entire table.

Conceptual:

```
SOURCE

ID SALARY
10 ANA 5000

UPDATE
10 ANA 5500
```

CDC produces something like this:

```
ID OPERATION OLD_VALUE NEW_VALUE

10 UPDATE 5000 5500
```

CDC is very important for:

- large volumes;
- ;
- replication;
- systems integration.

---

## 8. Transform

Transformation is usually the most complex part.

Includes:

### Cleaning

```
TRIM (name)
```

### Standardisation

```
UPPER (country_code)
```

### Conversion

```
TO_DATE (date_text, 'YYYY-MM-DD')
```

### Mapping

```
SOURCE DWH

customer_no → customer_id
cust_name → customer_name
birth_dt → birth_date
```

---

## 9. Source-to-Target Mapping

It is one of the fundamental documents of an DWH project.

Example:

♪ Source ♪ Transformation ♪ Target ♪
- - - - - - - - -
* * * * * * * *
* * * *
* * * * * * * *

Example SQL:

```sql
SELECT
c.customer_id,
UPPER (TRIM (c.customer_name)) customer_name,
co.country_key,
c.birth_date
FROM src_customer c
LEFT JOIN dim_country co
ON co.country_code = c.country_code;
```

---

## 10. Data Quality

A good ETL does not assume that the source data is correct.

They need to be checked out.

Examples:

```
customer_id NULL
```

or:

```
% 1
```

or:

```
transaction_date - SYSDATE
```

or:

```
REGEXP_LIKE (phone_number,...)
```

Incorrect data may be sent in:

# Reject table / Quarantine

```
ETL_REJECT
```

Example:

```sql
INSERT etl_reject
(
batch_id,
source_table,
source_key,
error_code,
error_message
)
VALUES
(
batch_id,
'CUSTOMER',
customer_id,
'DQ_001',
'CUSTOMER_NAME IS NULL'
);
```

---

## 11. Do not throw the wrong data

An anti-pattern is:

```sql
DELETE FROM staging
WHERE data_is_bad;
```

Better:

```
STAGING
   |
+ ---- valid ---------
   |
+ ---- invalid -- = REJECT / QUARANTINE
```

That's how we know:

- which row failed;
- why;
- in what batch;
- when;
- From what source.

---

## 12. Load

After the transformation, the target must be loaded.

We've got a couple of models.

## INSERT

```sql
INSERT fact_transaction
SELECT...
FROM stg_transaction;
```

---

## 13. UPDATE

```sql
UPDATE dim_customer d
SET d.customer_name =
(
SELECT s.customer_name
FROM stg_customer
WHERE s.customer_id = d.customer_id
);
```

For large volumes, however, there are better methods.

---

## 14. MERGE is the central operation in ETL Oracle

Very commonly we use:

```sql
MERGE INTO dim_customer
USING stg_customer
ON (d.source_customer_id = s.customer_id)

WHEN THEN
UPDATE SET
d.customer_name = s.customer_name,
d.city = s.city

WHEN NOT MATCHED THEN
INSERT
(
customer_key,
source_customer_id,
customer_name,
city
)
VALUES
(
customer_seq.NEXTVAL,
s.customer_id,
s.customer_name,
s.city
);
```

It shall implement practically:

```
there → UPDATE

not existing → INSERT
```

**UPSERT**.

---

## 15. SQL set-based vs row-byrow

One of the most important ETL Oracle rules:

> He prefers set-based processing.

Bad:

```
FOR r IN
SELECT *
FROM stg_customer
)
LOOP

INSERT dim_customer
VALUES (...);

END LOOP;
```

Better:

```sql
INSERT dim_customer
SELECT...
FROM stg_customer;
```

or:

```sql
MERGE INTO...
```

Oracle can optimize the set-based processing much better.

---

## 16. When using PL/SQL

PL/SQL is useful for orchestration.

For example:

```
PROCEDURE load_customer
IS
BEGIN

load_staging;

validate_data;

load_dimension;

update_batch_control;

EXCEPTION
WHEN THEN

log_error (
SQLCODE,
SQLERRM
);

RAISE;

END;
```

SQL processes the data.

PL/SQL controls:

```
orders
logging
transactions
errors
batch
restart
```

---

## 17. Bulk Processing

If it is necessary to process the procedure, we avoid:

```
row-by-row
```

and we use:

```
BULK COLLECT
FORALL
```

Example:

```sql
SELECT customer_id,
customer_name
BULK COLLECT INTO l_customers
FROM stg_customer;
```

then:

```
FORALL i IN 1.. l_customers.COUNT

INSERT dim_customer
VALUES
(
l_customers (i).customer_id,
l_customers (i).customer_name
);
```

---

## 18.

A ETL pipeline should be treated as a controllable unit.

Example:

```
BATCH_ID = 20260923001
```

All processed data gets this identifier.

```
STG_TRANSACTION

TRANSACTION_ID
AMOUNT
BATCH_ID
LOAD_DATE
```

---

## 19. Control Table

There's usually something like:

```
ETL_BATCH_CONTROL
```

Example:

```
BATCH_ID
PROCESS_NAME
START_TIME
END_TIME
STATUS
ROWS_READ
ROWS_INSERTED
ROWS_UPDATED
ROWS_REJECTED
ERROR_MESSAGE
```

Example:

```
14201
LOAD_TRANSACTION
2: 00 a.m.
2.14 p.m.
SUCCESS
1,000,000
950,000
48,000
2,000
NULL
```

---

## 20. Logging

Not enough:

```
ETL failed
```

We need to know:

```
batch
tap
source
Target
row
error
timestamp
```

For example:

```
ETL_PROCESS_LOG

BATCH_ID
STEP_ID
PROCESS_NAME
START_TIME
END_TIME
STATUS
ROWS_PROCESSED
ERROR_CODE
ERROR_MESSAGE
```

---

## 21. Restartability

A fundamental concept.

Suppose:

```
Step 1 SUCCESS extract
Step 2 Validate SUCCESS
Step 3 DIM_CUSTOMER SUCCESS
Step 4 FACT_TX FAILED
Step 5 Aggregate NOT STARTED
```

We don't want to go through this again.

The pipelineum must know:

```
Step 1 → already done
Step 2 → already done
Step 3 → already done
Step 4 → restart
```

This is **restartability**.

---

## 22. Idempotency

A very important property.

It means:

> If I run the same batch twice, the final result must be the same.

Bad:

```sql
INSERT fact_transaction
SELECT *
FROM stg_transaction;
```

If you run it again:

```
duplicate rows
```

Better:

```sql
MERGE
```

or control after:

```
transaction_id
```

---

## 23. Idempotency vs. Restartability

They're not the same thing.

### Restartability

I can continue a job after error.

### Idempotency

I can reroute without messing up the data.

A pipeline enterprise must ideally offer them both.

---

## 24. Reconciliation

After the load, we have to prove that the data is correct.

The simplest:

```
SOURCE count
=
TARGET count
+
REJECT count
```

Example:

```
SOURCE 1,000,000
TARGET 998,500
REJECT 1,500
--------------------
TOTAL 1,000,000
```

---

## 25. Financial Reconciliation

The number of rows is not enough.

For example:

```sql
SELECT COUNT(*),
SUM(amount)
FROM src_transaction;
```

Compare to:

```sql
SELECT COUNT(*),
SUM(amount)
FROM fact_transaction;
```

The results must be reconciled.

In banking this is critical.

---

## 26. Example banking

Source:

```
CORE_BANKING.TRANSACTION
```

Target:

```
FACT_TRANSACTION
```

Pipeline:

```
CORE BANKING

      ↓

LND_TRANSACTION

      ↓

STG_TRANSACTION

      ↓

Data Quality

      ↓
 +----------+
 |          |
invalid valid
 |          |
 ↓          ↓
FACT ETL_REJECT
TRANSACTION

      ↓

Reconciliation
```

---

## 27. Concrete Example

Staging:

```sql
CREATE stg_transaction
(
transaction_id NUMBER,
account_id NUMBER,
amount_txt VARCHAR2 (50),
transaction_ts TIMESTAMP,
batch_id NUMBER
);
```

Data:

```
101 10 150.25
102 11 ABC
0304.60.90
```

Problem:

```
ABC
```

can't become NUMBER.

In modern Oracle we can detect:

```sql
SELECT *
FROM stg_transaction
WHERE VALIDATE_CONVERSION (
amount_txt NUMBER
) = 0;
```

Result:

```
102 11 ABC
```

This row goes into the object.

---

## 28. Load valid

```sql
INSERT fact_transaction
(
transaction_id,
account_key,
% 1% 2
transaction_ts
)
SELECT
s.transaction_id,
a.account_key,
TO_NUMBER (s.amount_txt),
s.transaction_ts
FROM stg_transaction
JOIN dim_account
ON a.source_account_id = s.account_id
WHERE VALIDATE_CONVERSION (
s.amount_txt AS NUMBER
) = 1;
```

This is a typical example of:

```
look + validation + transformation + load
```

---

## 29.

Very often the source data contains business keys:

```
ACCOUNT_ID = 123456
```

but fact table uses surrogate key:

```
ACCOUNT_KEY = 87423
```

You gotta lookups:

```
JOIN dim_account
ON a.source_account_id =
s.account_id
```

Then we load:

```
FACT_TRANSACTION.ACCOUNT_KEY
```

not the source business key.

---

# What do we do if the lookup doesn't exist?

Example:

```
Transaction.account_id = 999
```

but:

```
DIM_ACCOUNT
```

He doesn't have the 999 account.

We have several possible policies:

```
reject
unknown member
late arriving size
retry
```

A common pattern is:

```
ACCOUNT_KEY = -1
```

where:

```
-1 = UNKNOWN
```

---

## 31. Late-arriving dimensions

Suppose we get:

```
transaction
```

before they arrived:

```
curator
```

The fact exists, but the size still does.

This is one:

# Late-arriving dimension

A solution:

```
surrogate key = -1
```

and then update.

Other solution:

create a placeholder:

```
CUSTOMER_KEY = 87122
SOURCE_ID = 777
STATUS = INCOMPLETE
```

And we fill it out when the real size comes out.

---

## 32. ETL + SCD

The previous SCD module binds directly to ETL.

For SCD Type 2:

```
STAGING CUSTOMER
      ↓
compare current record
      ↓
Changed?
 /       \
NO YES
          |
          ↓
exhale old record
          |
          ↓
insert new version
```

Example:

```
Customer 100

OLD
Bucharest
2025-01-01 → 2026-09-22

NEW
Cluj
2026-09-23 → 9999-12-31
```

ETL- is the one who implements this logic.

---

## 33. Order of loading

Order matters.

For example:

```
DIM_DATE
DIM_CUSTOMER
DIM_ACCOUNT
DIM_PRODUCT
       ↓
FACT_TRANSACTION
```

We don't want to charge the bill before the dimensions, because we need to find the surrogate keys.

It shall introduce:

# Dependency management

```
DIM_CUSTOMER
      ↓
DIM_ACCOUNT
      ↓
FACT_TRANSACTION
```

---

## 34. Schedulating

ETL- is usually executed automatically:

```
01: 00 Customer Extract
01: 10 Account extract
01: 30 Load Dimensions
02: 00 Load Transactions
3: 00 Aggregates
04: 00 Reports ready
```

ODI can orchestrate these dependencies by:

```
Package
Scenario
Load Plan
```

---

## 35. Oracle Data Integrator - ODI

For the roles of Oracle Data Developer it is important to understand the concepts of ODI even if you have not memorized each screen.

Conceptual structure:

```
Datastore
   ↓
Mapping
   ↓
Package
   ↓
Scenario
   ↓
Load Plan
```

### Datastore

Representation of a data object:

```
tables
tabs
view
```

### Mapping

Define:

```
source
joins
filters
transformations
Target
```

### Package

They're orchestrating steps.

### Scenario

Executable version of a mapping / packaging.

### Load Plan

Controls:

```
dependencies
parallelism
restart
error handling
```

---

## 36. Particularity ODI

ODI is best known for its philosophy:

# E-LT

I mean, he's trying to let the database do the processing.

Instead of transferring millions of rows into an intermediate server:

```
Oracle
  ↓
ETL server
  ↓
Oracle
```

we prefer:

```
SOURCE
  ↓
Oracle staging
  ↓
INSERT SELECT
MERGE
Analytic SQL
parallel SQL
  ↓
DWH
```

---

## 37. ETL Performance

In large volumes, in particular:

```
Full scan
Join strategy
indexes
partition pruning
parallelism
redo / undo
Commit strategy
Statistics
```

---

## 38. Index and ETL

The indexes help to lookups:

```
WHERE source_customer_id =:
```

but they slow down:

```sql
INSERT
UPDATE
DELETE
```

Therefore sometimes in a large ETL:

```
Disable / drop indexes
load date
rebuild indexes
```

or carefully design the necessary indexes.

---

## 39. Partitioning

For large fact tables:

```
FACT_TRANSACTION
```

may be partitioned:

```
2026-01
2026-02
2026-03
...
```

Load can only affect:

```
partition 2026-09
```

instead of the whole table.

---

## 40. Parallelism

At very high volumes we can have:

```sql
INSERT / * + APPEND PARALLEL (8) * /
INTO fact_transaction
SELECT / * + PARALLEL (8) * /
...
FROM stg_transaction;
```

But parallelism is not free.

Consume:

```
CPU
I/O
memory
```

and it needs to be controlled.

---

## 41. Direct-path insert

For bulk charges, the following may be used:

```sql
INSERT / * + APPEND * /
INTO fact_transaction
SELECT...
FROM stg_transaction;
```

It can be much faster than the conventional insert in certain scenarios.

---

## 42. Commit Strategy

Anti-pattern:

```
COMMIT;
```

After each row.

Produce:

```
very many commits
poor performance
hard to recover logic
```

We better define transactions by logical units:

```
batch
partition
chunk
business unit
```

---

## 43. Error handling

A pipeline must differentiate two large classes.

## Technical error

Example:

```
tablespace full
network error
ORA-01555
```

As a rule:

```
FAIL BATCH
```

---

## Date error

Example:

```
amount = 'ABC'
Invalid custodian
missing account
```

It could mean:

```
REJECT ROW
CONTINUE BATCH
```

This differentiation is very important.

---

## 44. Do not use WHEN OTHERS THEN NULL

Very dangerous example:

```
EXCEPTION
WHEN THEN
NULL;
```

The pyleelineum may seem:

```
SUCCESS
```

although the data was not uploaded.

More correctly:

```
EXCEPTION
WHEN THEN

log_error (
SQLCODE,
SQLERRM
);

RAISE;

END;
```

Thus the error is:

```
Logged
+
propagated
```

---

## 45. Audit

We need to be able to answer:

> Where did this turn come from?

Ideally we can identify:

```
source_system
source_table
source_id
batch_id
load_timestamp
```

For example:

```
FACT_TRANSACTION

TRANSACTION_KEY
SOURCE_TRANSACTION_ID
SOURCE_SYSTEM
BATCH_ID
INSERT_DATE
```

It is part of **data linage**.

---

## 46. Testing ETL

It shall be tested at least:

```
happy path
null values
duplicates
invalid datatype
missing look
late arriving size
updates
deletes
rerun
restart after failure
large volumes
```

Very important:

```
rerun
```

for checking idempotency.

---

## 47. Example of complete pipelines

```
SOURCE SYSTEM
                        |
                        v
Delta extract
                        |
                        v
LND_CUSTOMER
                        |
                        v
STG_CUSTOMER
                        |
              +---------+---------+
              |                   |
              v                   v
Valid date Invalid date
              |                   |
              v                   v
Detection ETL_REJECT
              |
              v
Business Rules
              |
              v
SCD Comparison
              |
              v
DIM_CUSTOMER
              |
              v
Reconciliation
              |
              v
ETL_BATCH_CONTROL
```

---

## 48. Simplified example of ETL procedure

```sql
CREATE OR REPLACE PROCEDURE load_customer
(
p_batch_id NUMBER
)
IS
BEGIN

    ------------------------------------------------
--1. Reject invalid date
    ------------------------------------------------

INSERT etl_reject
(
batch_id,
source_key,
error_message
)
SELECT
p_batch_id,
customer_id,
'Invalid customer name'
FROM stg_customer
WHERE customer_name IS NULL;

    ------------------------------------------------
-- 2. Load Valid Customers
    ------------------------------------------------

MERGE INTO dim_customer

USING
(
SELECT
customer_id,
UPPER (TRIM (customer_name))
customer_name
FROM stg_customer
WHERE customer_name IS NOT NULL
) s

ON (
d.source_customer_id =
s.customer_id
)

WHEN THEN

UPDATE SET
d.customer_name =
s.customer_name

WHEN NOT MATCHED THEN

INSERT
(
customer_key,
source_customer_id,
customer_name
)

VALUES
(
customer_seq.NEXTVAL,
s.customer_id,
s.customer_name
);

    ------------------------------------------------
-- 3. Finish batch
    ------------------------------------------------

UPDATE etl_batch_control
SET status = 'SUCCESS',
end_time = SYSTIMESTAMP
WHERE batch_id = p_batch_id;

COMMIT;

EXCEPTION

WHEN THEN

ROLLBACK;

UPDATE etl_batch_control
SET status = 'FAILED',
end_time = SYSTIMESTAMP,
error_message = SQLERRM
WHERE batch_id = p_batch_id;

COMMIT;

RAISE;

END;
/
```

It is simplified, but contains many real squares:

```
validation
reject handling
MERGE
batch
logging
transaction
exception handling
RAISE
```

---

## 49. ETL vs Data Pipeline

The term **data pipeline** is more general.

```
ETL
```

A pipeline may contain:

```
ingestione
ETL
machine learning
fillets processing
API
publishing
notifications
```

ETL refers specifically to the movement and transformation of data.

---

## 50. The 10 concepts that you need to know very well

For an Oracle Data Developer, I would first fix the following:

1. **Full vs incremental load vs CDC**
2. **Landing / Staging / DWH**
3. **Source-to-target mapping**
4. **SQL set-based and MERGE**
5. **Data Quality + reject handling**
6. **Batch Control and Audit**
7. **Restartability**
8. **Idempotency**
9. **Reconciliation**
10. **Dependency management and performance**

These concepts appear extremely often together.

---

## Questions and answers

### 1. What is the difference ETL vs ELT?

Short response:

> ETL converts data before charging to target, while ELT first uploads them and transforms to target system. In Oracle DWH and ODI is common model ELT because transformations can directly use the power of Oracle SQL.

---

### 2. Full load vs incremental load?

> Full load processes all data on each run. Incremental load processes only new or modified data, e.g. using a timestamp, sequence, SCN or CDC mechanism.

---

### 3. What is staging?

> An intermediate area in which the extracted data is prepared before loading in DWH. Here we can do validations, cleaning, mapping, deduplication and business rules without directly affecting the final tables.

---

### 4. What is idempotency?

> The ability to rerun the same process without producing duplicates or a different result.

---

### 5. What is restartability?

> The ability of an ETL to continue or resume processing after an error without unnecessarily reprocessing the steps already completed.

---

### 6. How would you implement an UPSERT in Oracle?

> Mainly with MERGE using WHEN MATCHED THEN UPDATE and WHEN NOT MATCHED THEN INSERT.

---

### 7. How do you treat invalid data?

> I prefer to separate business / data-quality errors from technical errors. Invalid data can be sent in a reject / quarantine table with batch ID, source key and reason for error, so that the rest of the batch can continue if the project rule allows.

---

### 8. How do you check that ETL- loaded correctly?

> By reconciliation: Counts, amounts, key controls, duplicates, nullls and business rules between source and target, taking into account also the rejected rows.

---

## Questions and answers

You have:

```
20 million transactions / day
```

of core banking.

It must be loaded into Oracle DWH.

A good answer would be:

```
1. identify the incremental method / CDC;

2. Loading delta in landing / staging;

3. attributes batch_id;

4. validate the data;

5. Separate the rejectures;

6. make lookup to dimensions;

7. use SQL set-based and MERGE where necessary;

8. Charging fact table;

9. use partitioning after the date of the transaction;

10. I record row counts and status;

11. make reconciliation;

12. I update the watermark only after success.
```

The last point is very important:

> **Do not update the watermark before the bat is confirmed as successful.**

Otherwise you can lose data on the next run.

---

## 53. Mental Model to Remember

I recommend you consider any ETL problem as follows:

```
SOURCE
                 |
                 v
EXTRACT
                 |
                 v
LANDING
                 |
                 v
STAGING
                 |
                 v
VALIDATE
              /    \
             /      \
GOOD BAD
           |          |
           v          v
TRANSFORM REJECT
           |
           v
LOOKUPS
           |
           v
DIM / FACT
           |
           v
RECONCILIATION
           |
           v
BATCH SUCCESS
           |
           v
UPDATE WATERMARK
```

If you can fluently explain this diagram and what happens at each level, you already have a very solid basis for **Oracle Data Developer / DWH / ETL** discussions.

## Link to previous modules

The whole curriculum is now starting to tie:

```
SQL
  ↓
set-based / MERGE / analytical SQL transformations

PL/SQL
  ↓
orchestration / logging / error handling

Transactions
  ↓
Commit / rollback / consistency

OLTP
  ↓
Operational sources

OLAP
  ↓
Analytical consumption

Data Warehouse
  ↓
dimensions / facts / marks

SCD
  ↓
size history

ETL / ELT
  ↓
the process that links them all
```

The next natural step in the curriculum is **Oracle Data Integrator (ODI)**, where ETL and ELT concepts become mappings, packages, scenarios, load plans, knowledge modules, scheduling, restartability and monitoring.

---

## Questions and answers

### How would you briefly explain the ETL / ELT to a colleague who knows SQL, but not this area?

ETL / ELT covers extracttransform-load vs extract-load-transform, landing, staging and target layers, source-to-target mappings. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to ETL / ELT?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For ETL / ELT, explicitly follow the extract-transformation-load vs extract-load-transformation, landing, staging and target layers, source-to-target mappings and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, ETL / ELT appears together with logging, auditing, reconciliation and impact analysis.
