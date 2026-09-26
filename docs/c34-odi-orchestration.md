---
title: 'C34. ODI and ETL Orchestration'
description: 'Complete English handbook chapter based on the original C34 course.'
sidebar_position: 34
---

# C34. ODI and ETL Orchestration

<div className="chapter-kicker">Chapter C34 · Complete course</div>

Oracle Data Integrator (ODI) is a tool of **integration and orchestration of** data, commonly used in Oracle DWH projects. For a Data Developer, it is not only important to know where to press in ODI, but to understand **squares, processes dependencies, restartability, auditing and treating** errors.

The conceptual flow worth remembering is:

```
Source Systems
     │
     ▼
Datastores
     │
     ▼
Mappings
     │
     ▼
Packages
     │
     ▼
Screenplay
     │
     ▼
Load Plans
     │
     ▼
DWH / Date Marks
```

---

## 1. What ODI is

**Oracle Data Integrator** is the Oracle platform for data integration.

Can be used for:

- ETL / ELT;
- batch charges;
- integration of several sources;
- Data Warehouse,
- data migration;
- system synchronisation;
- CDC - Change Data Capture
- orchestrating the jobs;
- Automation of DWH processes.

ODI is best known for addressing **ELT**:

```
Extract
   ↓
Load
   ↓
Transform to database
```

Instead of performing all the transformations in a separate ETL server, ODI is trying to use the power of the database.

For example:

```
INSERT INTO dwh.fact_transactions
SELECT
       ...
FROM staging.transactions t
JOIN dwh.dim_account
ON...
```

SQL is executed directly by the Oracle.

---

## 2. Architecture ODI

The important components are:

```
ODI Representative
     │
¶ Topology ¶
     │
- - - - Modeling
     │
- Projects
     │
- Load Plans
     │
     ▼
ODI Agent
     │
     ▼
Oracle / SQL Server / Files / APIS / etc.
```

ODI does not necessarily move data through its own engine.

In many cases it generates and coordinates the SQL executed in source and target systems.

---

## 3. Reposition

ODI keeps the configuration and metadata in repostors.

There are two important concepts:

```
Master Representative
Work Representation
```

## Master Representative

Contains global information:

- topology;
- technology;
- the server date;
- physical schemas;
- security;
- ODI agents.

## Work Representation

Contains development and execution objects:

- mappings;
- the packages,
- procedus;
- variables,
- scripted;
- Models;
- load crying.

Conceptual:

```
Master Representative
       │
- Infrastructure

Work Representation
       │
- development ETL
```

---

## 4. Topology

Topology describes the infrastructure with which ODI works.

Here are defined:

- Technologies;
- Data Servers;
- Physical Schemas,
- Logical Schemas,
- Content;
- Agents.

Example:

```
Technology
Oracle

Server Date
DWH_ORACLE

Physical Schema
DWHPRD.DWH

Logical Schema
DWH_TARGET
```

---

## 5. Physical Schema vs Logical Schema

This difference is very important.

## Physical Schema

Describe the real database.

Example:

```
Server:
dwh-prod.company.local

Database:
DWHPRD

Scheme:
DWH
```

## Logical Schema

It's a logical alias used in mappings.

Example:

```
DWH_TARGET
```

Mapping must not know whether it is running in DEV, TEST or PROD.

He uses:

```
DWH_TARGET
```

and ODI decides where the scheme is physically based according to **Context**.

---

## 6. Contexts

The context allows separation of environments.

For example:

```
DEV
TEST
PROD
```

Mapping uses:

```
DWH_TARGET
```

But topology can define:

```
DEV
DWH_TARGET → DEVDB.DWH

TEST
DWH_TARGET → TESTDB.DWH

PROD
DWH_TARGET → PRODDB.DWH
```

The same ODI code can be executed in all environments without modification of the mapping.

This is a very important concept for deployment.

---

## 7. Model and Datastore

A **Model** describes a data source or target.

An **Datastore** is usually a data object such as:

```
TABLE
VIEW
FILE
```

Example:

```
Model: CRM_SOURCE

Datastore:
CUSTOMERS
ACCOUNTS
TRANSACTIONS
```

A datastore contains metadata such as:

```
Columns
primary keys
foreign keys
date
Constraints
```

---

## 8. Mapping

Mapping is one of the main ODI objects.

Define:

```
source → transformation → target
```

Example:

```
SRC_CUSTOMER
      │
      ▼
Filter
      │
      ▼
Lookup DIM_COUNTRY
      │
      ▼
Expression
      │
      ▼
DIM_CUSTOMER
```

SQL simplified equivalent:

```
INSERT INTO dim_customer
(
customer_id,
customer_name,
country_id
)
SELECT
s.customer_id,
UPPER (s.customer_name),
c.country_id
FROM stg_customer
LEFT JOIN dim_country c
ON c.country_code = s.country_code
WHERE s.active_flag = 'Y';
```

Mapping says **what transformation must be done**.

Knowledge Modules say to a large extent **how** will be executed.

---

## 9. Knowledge Modules - KM

Knowledge Modules are one of the particularities of ODI.

They implement technical integration patterns.

The most important categories are:

```
LKM
IKM
CKM
RKM
JKM
```

---

## 9.1 LKM * Loading Knowledge Module

**LKM = Loading Knowledge Module**

Manages the transfer of data between source and staging / target.

For example:

```
SQL Server
   ↓
Oracle staging
```

LKM can generate:

```
extract
time tables
database links
bulk loading
```

---

## 10. IKM = Integration Knowledge Module

**IKM = Integration Knowledge Module**

He's responsible for integrating data into the target.

Examples:

```
INSERT
INSERT + UPDATE
MERGE
incremental update
```

Conceptual:

```
MERGE INTO dim_customer
USING stg_customer
ON (d.customer_id = s.customer_id)

WHEN OTHERS THEN
UPDATE SET
d.customer_name = s.customer_name

WHEN NOT MATCHED THEN
INSERT (
customer_id,
customer_name
)
VALUES (
s.customer_id,
s.customer_name
);
```

IKM defines the technical pattern by which the mapping is materialized.

---

## 11. CKM = Check Knowledge Module

**CKM = Check Knowledge Module**

It is used to check data quality and constraints.

For example:

```
NULL in mandatory column
FK invalid
duplicate
value outside the domain
```

Invalid data may be sent to an error zone.

Conceptual:

```
SOURCE
  │
- - - Valid → TARGET
  │
¶ ¶ invalid → ERROR TABLE
```

---

## 12. RKM = Reverse Knowledge Module

**RKM = Reverse Knowledge Module**

Import database metadata to ODI.

For example, if we have:

```
CUSTOMERS
ACCOUNTS
TRANSACTIONS
```

RKM can recover:

```
tables
Columns
date
PK
FK
Constraints
```

The process is called **reverse engineering**.

---

## 13. JKM * Journalizing Knowledge Module

**JKM = Journalizing Knowledge Module**

It is associated with:

```
CDC
Change Data Capture
```

Instead of loading the entire table:

```
10 million rows
```

We can only process the changes:

```
12,000 INSERT
4,000 UPDATE
300 DELETE
```

It's very useful in incremental charges.

---

## 14. Package

A **Package** orchestrates several ODI steps.

For example:

```
Refresh Batch ID
      ↓
Load Customer
      ↓
Load Account
      ↓
Load Transaction
      ↓
Update Batch Status
```

A package may contain:

- mappings;
- procedus;
- variables,
- ODI tools;
- evaluations;
- Branches.

You can think of a Package as a little workflow.

---

## 15. Scenario

A **Scenario** is the executable version of an ODI object.

For example, we have:

```
Package:
PKG_LOAD_CUSTOMER
```

From it we generate:

```
Scenario:
SCN_LOAD_CUSTOMER
Version:
001
```

Important:

```
Package = design

Scenario = executable version
```

In Production, usually **is performed the** script, not the development object.

---

## 16. Load Plan

The Load Plan is the upper level of orchestration.

Can control:

```
dependencies
orders
parallelism
restart
exception handling
conditional execution
```

Example:

```
LOAD_DWH
│
− SERIAL
│
► LOAD_DIMENSIONS
│
● LOAD_DATE
│
● LOAD_CUSTOMER
│
► LOAD_ACCOUNT
│
- PARALLEL
    │
− LOAD_FACT_TRANSACTIONS
− LOAD_FACT_PAYMENTS
- LOAD_FACT_BALANCES
```

---

## 17. Package vs. Scenario vs. Load Plan

It is one of the most common ODI questions.

| ODI object | Purpose |
| --- | --- |
| Package | Development workflow that coordinates steps |
| Scenario | Generated, executable version of an ODI object |
| Load Plan | Orchestrates execution of scenarios and other steps |

Flow:

```
Mapping
   ↓
Package
   ↓
Scenario
   ↓
Load Plan
```

But a Load Plan can execute several scripts directly.

---

## 18. Variables

ODI Variables allows for process parametrization.

Example:

```
V_BATCH_ID
V_PROCESS_DATE
V_LAST_LOAD_DATE
V_ROWS_LOADED
```

For example:

```
V_PROCESS_DATE = 2026-09-23
```

Can be used in a query:

```
SELECT *
FROM transactions
WHERE transaction_date = '#V_PROCESS_DATE';
```

or conceptually by parametric / binds, depending on the implementation.

---

## 19. Incremental Lead

One of the most important ETL implementation.

We don't want:

```
TRUNCATE
+
reload 500 million rows
```

Every night.

We can save:

```
LAST_SUCCESSFUL_LOAD
```

and load:

```
SELECT *
FROM source_transactions
WHERE update_timestamp
```

Flow:

```
get last successful timestamp
           ↓
extract changed rows
           ↓
load staging
           ↓
Transform
           ↓
commit target
           ↓
update control table
```

---

## 20. Control Table

A very good pattern is the use of a control table.

For example:

```
CREATE TABLE etl_batch_control
(
batch_id NUMBER,
process_name VARCHAR2 (100),
start_time TIMESTAMP,
end_time TIMESTAMP,
VARCHAR2 status (20),
rows_read NUMBER,
rows_inserted NUMBER,
rows_updated NUMBER,
rows_rejected NUMBER,
error_message VARCHAR2 (4000)
);
```

Example:

```
BATCH_ID | STATUS
--------   ------------------  ---------
10021 DIM_CUSTOMER SUCCESS
10022 DIM_ACCOUNT SUCCESS
10023 FACT_TRANSACTION RUNNING
```

This helps enormously to:

```
audit
monitoring
debugging
restart
reconciliation
```

---

## 21. Restartability

A serious ETL must be able to resume after an error.

Example:

```
DIM_CUSTOMER SUCCESS
DIM_ACCOUNT SUCCESS
FACT_TRANSACTION FAILED
FACT_BALANCE NOT_STARTED
```

We don't want to take it all back.

```
DIM_CUSTOMER
DIM_ACCOUNT
```

The Load Planul can continue from:

```
FACT_TRANSACTION
```

This concept is called:

**restoration**.

---

## 22. Idempotency

Another very important concept.

A ETL process is **ideal** if you can execute it again without producing incorrect data.

Wrong example:

```
INSERT INTO fact_sales
SELECT *
FROM stg_sales;
```

If you run it twice:

```
duplicate facts
```

It could be safer:

```
MERGE INTO fact_sales
USING stg_sales
ON (
f.source_system = s.source_system
AND f.transaction_id = s.transaction_id
)
...
```

or:

```
DELETE batch
INSERT batch
```

according to architecture.

---

## 23. Error handling

An ETL process should differentiate:

```
technical errors
business / data errors
```

## Technical error

Examples:

```
Connection failed
tablespace full
Date of age or age
ORA-01555
```

As a rule:

```
FAIL JOB
```

## Date error

Examples:

```
invalid country code
missing custodian
invalid amount
transaction duplicates
```

Sometimes the job can go on, and the rows are sent to:

```
ETL_ERROR
REJECT_TABLE
QUARANTINE
```

---

## 24. Pattern of Error Table

For example:

```
CREATE TABLE etl_error
(
batch_id NUMBER,
process_name VARCHAR2 (100),
source_key VARCHAR2 (100),
error_code VARCHAR2 (50),
error_message VARCHAR2 (4000),
error_timestamp TIMESTAMP
);
```

Example:

```
10023
FACT_TRANSACTION
TXN_874633
INVALID_ACCOUNT
Account does not exist in DIM_ACCOUNT
```

---

## 25. Dependency Management

In DWH, order matters.

For example:

```
DIM_CUSTOMER
      │
      ▼
DIM_ACCOUNT
      │
      ▼
FACT_TRANSACTION
```

We can't load:

```
FACT_TRANSACTION
```

before there are surrogate keys for:

```
Customer
Account
```

The Load Plan can implement these dependencies.

---

## 26. Parallelism

Some processes are independent.

Example:

```
► DIM_CUSTOMER
START Carol, DIM_PRODUCT
► DIM_BRANCH
```

They can run in parallel.

After their completion:

```
FACT_SALES
```

It can start.

Scheme:

```
DIM_CUSTOMER -
DIM_PRODUCT ► ► FACT_SALES ►
DIM_BRANCH -
```

Parallelism can reduce the batch window.

But it must be controlled because too much parallelism can produce:

```
CPU content
I/O content
TEMP pressure
locks
```

---

## 27. Full example of bank DWH

Let's assume the sources:

```
CORE_BANKING
CRM
CARD_SYSTEM
```

DWH:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_CARD
FACT_TRANSACTION
FACT_DAILY_BALANCE
```

The orchestration could be:

```
START_BATCH

     ↓

LOAD_REFERENCE_DATA

     ↓

LOAD_STAGING
− STG_CUSTOMER
− STG_ACCOUNT
− STG_CARD
- STG_TRANSACTION

     ↓

LOAD_DIMENSIONS
− DIM_CUSTOMER
− DIM_ACCOUNT
- DIM_CARD

     ↓

LOAD_FACTS
− FACT_TRANSACTION
- FACT_DAILY_BALANCE

     ↓

DATA_QUALITY

     ↓

RECONCILIATION

     ↓

END_BATCH
```

---

## 28. Source-to-target mapping

ODI frequently implements type specifications:

| Source | Transformation | Target |
- - - - - - - - -
* * * *

Conceptual:

```
SELECT
c.client_id,
UPPER (TRIM (c.name)),
dc.country_key,
c.update_ts
FROM crm_customer c
LEFT JOIN dim_country dc
ON dc.country_code = c.country;
```

---

## 29. ODI and SCD Type 2

A very common case.

Initial:

```
CUSTOMER_SK = 101
CUSTOMER_ID = C001
CITY = Bucharest
VALID_FROM = 2025-01-01
VALID_TO = 9999-12-31
CURRENT = Y
```

The client is moving to Brașov.

We must have:

```
101 C001 Bucharest 2025-01-01 2026-009-22 N
205 C001 Brasov 2026-09-23 9999-12-31 Y
```

ODI can implement this pattern with mappings + IKM or logic PL/SQL.

---

## 30. ODI and SQL/PLSQL

A good ODI Developer Data must know very well SQL.

ODI generates SQL, but you need to be able to analyze:

```
JOINS
MERGE
INSERT SELECT
UPDATE
CTAS
time tables
indexes
execution plans
partition pruning
parallel execution
Statistics
```

ODI may also call:

```
BEGIN
pkg_etl.load_customer (: batch_id);
END;
/
```

So PL/SQL remains very important.

---

## 31. Agent ODI

ODI Agent runs scripts and load crying.

Conceptual:

```
Scheduler
    ↓
ODI Agent
    ↓
Scenario
    ↓
Generated SQL
    ↓
Database
```

The agent may be:

```
Agent Standalone
JEE Agent
```

according to architecture.

---

## 32. Schedulating

DWH is often programmed.

Example:

```
01: 00 LOAD_STAGING
01: 30 LOAD_DIMENSIONS
02: 00 LOAD_FACTS
3: 30 RECONCILIATION
04: 00 REPORTING_READY
```

Scheming can be done through ODI or through an external orchestrator.

The important thing is to understand relationships:

```
time dependence
date of dependence
job dependence
```

---

## 33. Reconciliation

An DWH does not just have to end the SUCCESS status.

We need to check that the data makes sense.

For example:

```
SOURCE
10,000 transactions

TARGET
9,998 transactions

REJECTED
2 transactions
```

Then:

```
10,000 = 9,998 + 2
```

Other checks:

```
SELECT COUNT(*)
FROM source_transactions;

SELECT COUNT(*)
FROM fact_transactions
WHERE batch_id =: batch_id;
```

or:

```
SELECT SUM (amount)
FROM source_transactions;
```

compared to:

```
SELECT SUM (amount)
FROM fact_transactions
WHERE batch_id =: batch_id;
```

---

## 34. Logging and monitoring

A good pipeline must allow quick answer to questions:

```
Did the job start?
When?
How long did it take?
How many rows did the process read?
How many rows did it insert?
How many rows did it reject?
Where did it fail?
Can it resume?
```

Useful metrics:

```
start_time
end_time
duration
rows_read
rows_inserted
rows_updated
rows_rejected
status
error_code
```

---

## 35. Example of robust orchestration

A design much closer to production is:

```
START_BATCH
    │
    ▼
GET_BATCH_ID
    │
    ▼
GET_WATERMARK
    │
    ▼
LOAD_STAGING
    │
    ▼
VALIDATE_DATA
    │
* * * * * *
    │
    ▼
LOAD_DIMENSIONS
    │
    ▼
LOAD_FACTS
    │
    ▼
RECONCILIATION
    │
* * * * * * *
    │
    ▼
UPDATE_WATERMARK
    │
    ▼
SUCCESS_BATCH
```

Very important:

```
UPDATE_WATERMARK
```

It must only be done after the batch has finished correctly.

Otherwise we can lose data on the next incremental charge.

---

## 36. Wrong pattern vs correct pattern

### Wrong

```
extract
↓
last_load_timestamp update
↓
load target
```

If the load target fails, the watermark is already moved forward.

On the next run you can skip the dates.

### Right.

```
extract
↓
load
↓
validated
↓
Commit
↓
reconcile
↓
update watermark
```

---

## 37. Example of watermark control

Table:

```
CREATE TABLE etl_watermark
(
process_name VARCHAR2 (100) PRIMARY KEY,
last_success_ts TIMESTAMP
);
```

Read:

```
SELECT last_success_ts
FROM etl_watermark
WHERE process_name = 'TRANSACTION_LOAD';
```

Extract:

```
SELECT *
FROM source_transaction
WHERE update_ts
AND update_ts
```

After success:

```
UPDATE etl_watermark
SET last_success_ts =: current_batch_ts
WHERE process_name = 'TRANSACTION_LOAD';
```

This is an extremely important pattern in ETL.

---

## 38. Boundary Timestamp

A safer option is to set at the beginning of the batch:

```
previous_watermark
current_watermark
```

Example:

```
previous = 2026-009-22 01: 00
current = 2026-09-23 01: 00
```

Query:

```
WHERE update_ts
AND update_ts; current_watermark
```

So the batch has a deterministic window.

---

## 39. A mature DWH pipeline

A serious DWH pipeline usually has the following properties:

```
parametrized
restartable
idempotent
auditable
reconcile
recoverable
Monitorable
```

These words are also very good for review.

---

## 40. ODI should not be seen in isolation

One of the most important ideas for a Data Developer is:

> ODI is the mechanism of implementation and orchestration. ETL architecture is the real problem.

You have to be able to design the process even if the tool is:

```
ODI
SSIS
Computer science
ADF
Airflow
Databricks
```

For example, concepts:

```
watermark
batch control
restartability
dependencies
idempotency
audit
reconciliation
error handling
```

remain the same.

---

## 43. Oracle Exercise 26ai

You can simulate orchestration without ODI.

Create:

```
CREATE TABLE etl_control
(
batch_id NUMBER,
process_name VARCHAR2 (50),
VARCHAR2 status (20),
start_time TIMESTAMP,
end_time TIMESTAMP,
rows_loaded NUMBER,
error_message VARCHAR2 (4000)
);
```

Then it creates three procedures:

```
LOAD_DIM_CUSTOMER
LOAD_DIM_ACCOUNT
LOAD_FACT_TRANSACTION
```

and an orchestrator procedure:

```
CREATE OR REPLACE PROCEDURE run_dwh_batch
AS
BEGIN

load_dim_customer;

load_dim_account;

load_fact_transaction;

EXCEPTION
WHEN OTHERS THEN
-- log error
RAISE;
END;
/
```

The next step is to add:

```
batch_id
logging
status
restartability
watermark
reconciliation
```

The exact same concepts will then exist in a Lost Plan ODI.

---

## 44. What Must Stay

for review and practice, I would first retain the following mental map:

```
ODI
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
Topology Development Implementation
        │            │            │
Datastore
        │            ↓            │
| Mapping |
        │            ↓            │
Package
        │            ↓            │
* * * * * * * * * * * * * * *
                     │
                     ▼
Load Plan
                     │
                     ▼
DWH
```

And the relationship:

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

But for an **Senior Data Developer**, the most important part is actually this:

```
Source-all-target mapping
        +
Incremental loading
        +
Watermark
        +
Dependencies
        +
Error handling
        +
Restartability
        +
Idempotency
        +
Audit
        +
Reconciliation
=
Production-grade ETL
```

ODI is the tool that implements and orchestrates these concepts. for review of Data Developer, I would place more emphasis on this logic than on memorizing the menus in ODI.

---

## Questions and answers

### 1. What is ODI?

Oracle platform data integration and orchestration, strongly oriented to architecture ELT and the use of the database's database for transformations.

### 2. What is the difference between Mapping and Package?

Mapping describes data transformation, and the Packager orchestrates several steps.

### 3. What is Scenario?

The executable and versed version of an ODI object.

### 4. What is the Load Plan?

Orchestra for several scripts, with support for addictions, parallelism, restart and error handling.

### 5. Physical Schema vs Logical Schema?

A Physical Schema represents the real schema; a Logical Schema is the alias used by mappings and is mapped through a Context to the physical environment.

### 6. What is Context?

Allows the same mapping to be used in DEV, TEST and PROD.

### 7. What is IKM?

Knowledge Module which controls how data is integrated into the target.

### 8. LKM?

Controls the loading mechanism between source and staging / target.

### 9. CKM?

Controls data quality checks and constraints.

### 10. How do you implement incremental loading?

Usually with watermark / last success load, CDC or comparison of keys and timetables.

### 11. How do you make an ETL restartable?

Persisting the state of the batch and separating the steps so that the processes already completed do not need to be resumed.

### 12. What does idempotent mean?

The same batch can be rerouted without creating duplicate or inconsistent data.

---

**Question:**

> A Load Plan ODI charges 500 million transactions. The process fails after 3 hours at 90%. What are you doing?

A good answer:

```
First I identify the exact step that failed and the technical cause.

I wouldn't automatically resume the entire batch.

I'd check if each stage is restartable and idempotent.

The Load Planul must allow the resumption of the failed step.

The data already loaded must either be able to stay,
be removed / reprocessed at the base.

I'd check and control the backgammon, the watermark and reconciliation,
to make sure they weren't advanced before full success.
```

It's much better than:

> I'm restarting the job.

---

### How would you briefly explain ODI / ETL orchestration to a colleague who knows SQL, but not this area?

ODI / ETL orchestration covers ODI repositions, topology, contexts and agents, models, datastores and mappings, Knowledge Modules: RKM, LKM, IKM, CKM, JKM. In practice, first determine what data enter and what result to achieve, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to ODI / ETL orchestration?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For ODI / ETL orchestration, explicitly follow ODI repostors, topology, contexts and agents, models, datastores and mappings, Knowledge Modules: RKM, LKM, IKM, CKM, JKM and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

A load plan has parallel steps, but FACT _TRANSACTION starts before DIM _CUSTOMER.
