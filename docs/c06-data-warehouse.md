---
title: 'C06. Data Warehouse'
description: 'Complete English handbook chapter based on the original C06 course.'
sidebar_position: 6
---

# C06. Data Warehouse

<div className="chapter-kicker">Chapter C06 · Complete course</div>

A **Data Warehouse (DWH)** is a database primarily designed for **analysis, reporting, aggregation, and historical data**, rather than day-to-day operational transaction processing.

In a banking system, operational applications process accounts, transactions, customers and payments. The DWH integrates data from multiple systems and supports questions such as:

```
What is the average monthly balance per customer segment?
How has the volume of transactions evolved in the last five years?
What is the profitability by product, branch, and customer?
How many customers have gone from one segment to another?
```

The central idea is:

```
OLTP → Integration / ETL → Data Warehouse → Mart / BI / Analytics
```

---

## 6.1. The Fundamental Characteristics of a Data Warehouse

Bill Inmon's classic definition describes a DWH as:

- **Subject-oriented** — organized around subjects such as Customer, Account, Transaction and Product;
- **Integrated** — data from multiple sources is standardized into a common format and meaning;
- **Time-variant** retains history;
- **Non-volatile** — data is mainly loaded and queried rather than continuously modified as in OLTP systems.

Example:

A CRM system may have:

```
customer_id = 123
country = "RO"
```

and another system may have:

```
client_no = C000123
Romania
```

In DWH they can become:

```
customer_key = 84521
source_customer_id = C000123
country_code = RO
```

The DWH standardizes both the format and the business meaning of data.

---

## 6.2. Typical DWH Architecture

A simplified architecture:

```
                   ┌──────────────┐
♪ Core Banking ♪
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
CRM
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
External Data
                   └──────┬───────┘
                          │
                          ▼
                 ┌─────────────────┐
* STAGING AREA *
                 └────────┬────────┘
                          │
ETL / ELT
                          │
                          ▼
                ┌──────────────────┐
* ENTERPRISE DWH *
                └────────┬─────────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
Finance Risk Sales
Date Mart Date Mart
              │          │          │
              └──────────┼──────────┘
                         ▼
BI / Reporting
```

In practice you will frequently meet the following layers:

```
SOURCE
  ↓
STAGING
  ↓
ODS / INTEGRATION
  ↓
CORE DWH
  ↓
DATA MART
  ↓
REPORTING / BI
```

---

## 6.3. Staging Area

**Staging** is the intermediate area where data is loaded close to the form in which it arrives from source systems.

Example:

```sql
CREATE TABLE stg_customer (
source_customer_id VARCHAR2(50),
first_name VARCHAR2(100),
last_name VARCHAR2(100),
birth_date VARCHAR2(20),
country VARCHAR2(100),
load_date DATE
);
```

Notice that `birth_date` can initially be stored as `VARCHAR2`.

Why?

Because the staging area may need to accept invalid source values before validation:

```
1985-05-20
20 / 05 / 1985
NULL
UNKNOWN
ABC
```

Validation may take place later.

A common pattern is:

```
STG_RAW
   ↓
STG_VALIDATED
   ↓
DWH
```

---

## 6.4. ETL vs ELT

**ETL**:

```
Extract
Transform
Load
```

Data is transformed before loading into the DWH.

**ELT**:

```
Extract
Load
Transform
```

Data is loaded first, and transformation is performed inside the database.

In Oracle, ELT can be very effective because transformations can directly use:

```
SQL
MERGE
parallel execution
partitioning
analytic functions
direct-path insert
```

Example:

```sql
INSERT /*+ APPEND */ INTO fact_transaction
SELECT ...
FROM stg_transaction;
```

Oracle Data Integrator (**ODI**) is largely based on the ELT philosophy.

---

## 6.5. Fact Tables and Dimension Tables

Dimensional modelling is one of the most important DWH ideas.

Typical scheme:

```
DIM_CUSTOMER
                     |
DIM_DATE ---- FACT_TRANSACTION ---- DIM_ACCOUNT
                     |
DIM_PRODUCT
```

### Fact table

Contains business events or measurements.

Example:

```
FACT_TRANSACTION
-------------------------
transaction_key
date_key
customer_key
account_key
product_key
transaction_amount
fee_amount
balance_after
```

It usually contains a very large number of rows:

```
100 million
1 billion
10 billion
```

### Dimension table

Contains descriptive context for facts and measures.

Example:

```
DIM_CUSTOMER
---------------------
customer_key
customer_id
customer_name
country
segment
risk_category
valid_from
valid_to
current_flag
```

---

## 6.6. Grain is one of the most important concepts of DWH

**Grain** defines exactly what one row in a fact table represents.

For example:

```
a row = a bank transaction
```

or:

```
one line = daily balance of an account
```

or:

```
a row = total sales / product / store / day
```

It is critical to establish the grain before designing the fact table.

Problem example:

```
FACT_ACCOUNT
```

What does one row represent?

```
An account?
An account a day?
An account a month?
A transaction?
```

A correct model would say explicitly:

```
FACT_ACCOUNT_DAILY_BALANCE

Grain:
one row per account per day
```

Possible key:

```
account_key + date_key
```

---

## 6.7. Star Schema

The most commonly used dimensional model.

```
DIM_DATE
                        |
                        |
DIM_CUSTOMER --- FACT_TRANSACTION --- DIM_ACCOUNT
                        |
                        |
DIM_PRODUCT
```

Advantages:

```
simple
fast for reporting
easy to understand
joins few
well suited for aggregation
```

Query:

```sql
SELECT
d.year,
c.segment,
SUM(f.transaction_amount) total_amount
FROM fact_transaction f
JOIN dim_date d
ON d.date_key = f.date_key
JOIN dim_customer c
ON c.customer_key = f.customer_key
GROUP BY
d.year,
c.segment;
```

---

## 6.8. Snowflake Schema

In a snowflake scheme, dimensions are normalized.

Example:

```
FACT_TRANSACTION
       |
DIM_CUSTOMER
       |
DIM_CITY
       |
DIM_COUNTRY
```

Star face:

```
FACT_TRANSACTION
       |
DIM_CUSTOMER
       |
country_name
```

A snowflake schema reduces redundancy but increases the number of joins.

For reporting and BI, a **star schema is often preferred**.

---

## 6.9. Surrogate Keys

In DWH, dimensions frequently use artificial keys.

Example:

```
source_customer_id = C12345
```

but in DWH:

```
customer_key = 987654
```

Structure:

```sql
CREATE TABLE dim_customer (
customer_key NUMBER PRIMARY KEY,
source_customer_id VARCHAR2(50),
customer_name VARCHAR2(200),
segment VARCHAR2(50)
);
```

Why not use only the source-system ID?

Because the same entity may have several historical versions.

```
customer_key source_id segment
------------ --------- --------
101 C100 RETAIL
245 C100 PREMIUM
```

This is one of the foundations of **Slowly Changing Dimensions**.

---

## 6.10. Slowly Changing Dimensions › SCD

SCD describes how we manage changes in the attributes of a dimension.

The most important are:

```
SCD
SCD
SCD
SCD Type 3
```

### SCD Type 1

Overwrite.

Next:

```
customer_key = 100
City = Bucharest
```

The client moves:

```
city = Brasov
```

We do:

```sql
UPDATE dim_customer
SET city = 'Brasov'
WHERE customer_key = 100;
```

History is lost.

---

## 6.11. SCD Type 2

One of the most important DWH history-preservation techniques.

We keep the history.

Initial:

```
customer_key customer_id segment valid_from valid_to current
100 C10 RETAIL 2024-01-01 9999-12-31 Y
```

The client becomes PREMIUM:

```
100 C10 RETAIL 2024-01-01 2026-03-14 N
205 C10 PREMIUM 2026-03-15 9999-12-31 Y
```

Now we can answer the question:

```
What segment did the client have at the time of the transaction?
```

The fact table preserves:

```
customer_key = 100
```

or:

```
customer_key = 205
```

depending on which dimension version was valid at the time.

---

## 6.12. Simplified SCD Type 2 Implementation

We identify the changes:

```sql
SELECT s.customer_id,
       s.segment
FROM stg_customer s
JOIN dim_customer d
  ON d.customer_id = s.customer_id
 AND d.current_flag = 'Y'
WHERE NVL(s.segment, '#') <> NVL(d.segment, '#');
```

We're closing the old version:

```sql
UPDATE dim_customer d
SET valid_to     = SYSDATE - INTERVAL '1' SECOND,
    current_flag = 'N'
WHERE d.current_flag = 'Y'
  AND EXISTS (
      SELECT 1
      FROM stg_customer s
      WHERE s.customer_id = d.customer_id
        AND NVL(s.segment, '#') <> NVL(d.segment, '#')
  );
```

We create the new version:

```sql
INSERT INTO dim_customer (
customer_key,
customer_id,
segment,
valid_from,
valid_to,
current_flag
)
SELECT
customer_seq.NEXTVAL,
s.customer_id,
s.segment,
SYSDATE,
DATE '9999-12-31',
'Y'
FROM stg_customer s;
```

In production, the logic must identify only new or changed records.

---

## 6.13. Fact Table for Main Types

There are three very important types.

### Transaction Fact

One row per business event.

```
FACT_TRANSACTION

transaction_id
customer_key
account_key
date_key
amount
```

Grain:

```
one row per banking transaction
```

### Periodic Snapshot

A row for a periodically measured state.

```
FACT_ACCOUNT_DAILY

date_key
account_key
balance
available_balance
```

Grain:

```
one row per account per day
```

### Accumulating Snapshot

Useful for multi-stage processes.

Example:

```
loan application
```

Columns:

```
application_date
approval_date
contract_date
disbursement_date
```

The row is updated as the process progresses.

---

## 6.14. Additives, Semi-Additives and Non-Additive Measures

Very important for reviews.

### Additives

They can be summed across all relevant dimensions.

```
sales_amount
transaction_amount
quantity
```

Example:

```
SUM(transaction_amount)
```

### Semi-additive

They can be aggregated across some dimensions, but not all.

Example:

```
account_balance
```

You can sum the balances between the accounts:

```
total balance all accounts
```

but it doesn't make sense:

```
SUM(balance for the same account each day)
```

Over time we usually use:

```
LAST_VALUE
AVG
MIN
MAX
```

### Non-additive

These measures should not be summed directly.

Examples:

```
percentage
ratio
average
Exchange rates
```

---

## 6.15. Conformed Dimensions

A conformed dimension is shared consistently across multiple fact tables.

Example:

```
DIM_CUSTOMER
```

is used by:

```
FACT_TRANSACTION
FACT_LOAN
FACT_CARD_PAYMENT
FACT_ACCOUNT_BALANCE
```

This allows consistent reporting:

```
segment custodian
country
age group
risk class
```

In all systems.

---

## 6.16. Date Dimension

One of the most common dimensions.

```
DIM_DATE
----------------
date_key
calendar_date
day_number
month_number
month_name
quarter
year
week_number
is_weekend
is_holiday
```

Example:

```
date_key = 20260923
```

Query:

```sql
SELECT
d.year,
d.month_name,
SUM(f.amount)
FROM fact_transaction f
JOIN dim_date d
ON d.date_key = f.date_key
GROUP BY
d.year,
d.month_name;
```

---

## 6.17. Late Arriving Dimensions

Very common problem.

You get a transaction:

```
transaction_id = T100
customer_id = C500
```

but the C500 client still does not exist in DIM_CUSTOMER.

The transaction must not be lost.

One solution is to create a placeholder row:

```
customer_key = 999999
customer_id = C500
customer_name = UNKNOWN
```

When the client's data arrives:

```sql
UPDATE dim_customer
```

or the correct version is created.

---

## 6.18. Unknown / Default Dimension Members

A very used pattern:

```
customer_key = -1
```

with:

```
UNKNOWN CUSTOMER
```

or:

```
-1 UNKNOWN
-2 NOT APPLICABLE
-3 DATA ERROR
```

Thus we do not leave:

```
customer_key = NULL
```

In fact table.

The advantage is that we can look separately at quality issues.

---

## 6.19. Data Quality

In an DWH, data quality is critical.

Examples of problems:

```
NULL where you shouldn't
duplicates
invalid data
invalid numbers
No FK
values outside the domain
Unknown codes
missing mappings
```

Example Oracle 26ai:

```sql
SELECT *
FROM stg_transaction
WHERE VALIDATE_CONVERSION (amount AS NUMBER) returns 0;
```

Older Oracle versions:

```sql
SELECT *
FROM stg_transaction
WHERE NOT REGEXP_LIKE (amount, '^[+-]?[0-9]+([.,][0-9]+)?$');
```

A mature system can have:

```
STG_TRANSACTION
     ↓
VALIDATION
     ↓
VALID_ROWS Carol, FACT_TRANSACTION
     │
¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ → ETL_ERROR.
```

---

## 6.20. Error Table / Reject Table

Example:

```sql
CREATE TABLE etl_error (
error_id NUMBER,
batch_id NUMBER,
source_table VARCHAR2(100),
source_key VARCHAR2(100),
error_code VARCHAR2(50),
error_message VARCHAR2(4000),
error_date TIMESTAMP
);
```

Example of error:

```
batch_id = 501
source_key = TRX90871
error_code = INVALID_AMOUNT
error_message = Cannot convert ABC to NUMBER
```

This model is often preferable to stopping an entire batch because of one invalid row.

---

## 6.21. Batch Processing

ETL processing is often organized in batches.

Example:

```
ETL_BATCH
----------------
batch_id
start_time
end_time
status
rows_read
rows_inserted
rows_updated
rows_rejected
```

Status:

```
RUNNING
SUCCESS
FAILED
PARTIAL
```

Each laden table may have:

```
batch_id
```

for auditability.

---

## 6.22. Full Load vs Incremental Load

### Full Load

Reloads the complete data set.

```sql
TRUNCATE TABLE dim_product;

INSERT INTO dim_product
SELECT ...
FROM source_product;
```

Simple, but potentially very expensive at scale.

### Incremental Load

Loads only new or changed data.

Example:

```
WHERE last_update_date
```

or:

```
CDC
Change Data Capture
```

In a large DWH, incremental load is almost mandatory.

---

## 6.23. High Water Mark

A common pattern for incremental load.

At the last execution:

```text
last_processed_timestamp = 2026-09-22 23:59:59
```

New load:

```sql
SELECT *
FROM source_transaction
WHERE update_timestamp > :last_processed_timestamp;
```

After success:

```
high_water_mark =
MAX (update_timestamp)
```

Important: the high-water mark should be updated **only after the batch completes successfully**.

---

## 6.24. MERGE is very important in Oracle DWH

Example:

```sql
MERGE INTO dim_product d
USING stg_product s
   ON (d.product_id = s.product_id)
WHEN MATCHED THEN
    UPDATE SET
        d.product_name = s.product_name,
        d.category     = s.category
WHEN NOT MATCHED THEN
    INSERT (
        product_key,
        product_id,
        product_name,
        category
    )
    VALUES (
        product_seq.NEXTVAL,
        s.product_id,
        s.product_name,
        s.category
    );
```

This is a classic pattern for:

```
UPSERT
```

I mean:

```sql
UPDATE if any
INSERT if not available
```

---

## 6.25. Partitioning in DWH

Fact tables may contain billions of rows.

That's why partitioning is very important.

Example:

```sql
CREATE TABLE fact_transaction (
transaction_id NUMBER,
transaction_date DATE,
amount NUMBER
)
PARTITION BY RANGE (transaction_date) (
PARTITION p2026_01 VALUES LESS THAN (DATE '2026-02-01'),
PARTITION p2026_02 VALUES LESS THAN (DATE '2026-03-01'),
PARTITION p2026_03 VALUES LESS THAN (DATE '2026-04-01')
);
```

Query:

```sql
SELECT SUM(amount)
FROM fact_transaction
WHERE transaction_date >= DATE '2026-02-01'
  AND transaction_date <  DATE '2026-03-01';
```

Oracle can do:

```
partition pruning
```

and only access:

```
p2026_02
```

instead of the whole table.

---

## 6.26. Index in DWH

Common DWH index types include:

```
B-tree indexes
bitmap indexes
local partitioned indexes
```

Bitmap indexes can be good for low-cardinality columns:

```
gender
status
segment
country
```

Example:

```
CREATE BITMAP INDEX ix_customer_segment
ON dim_customer (segment);
```

But bitmap indexes are not suitable for OLTP systems with many competing updates.

---

## 6.27. Star Transformation

Oracle can optimize Star Querys scheme by:

```
STAR TRANSFORMATION
```

For example:

```sql
SELECT SUM(f.amount)
FROM fact_sales f
JOIN dim_customer c
  ON c.customer_key = f.customer_key
JOIN dim_product p
  ON p.product_key = f.product_key
WHERE c.country = 'RO'
  AND p.category = 'LOAN';
```

Oracle can use the size filters to quickly narrow the fact tables.

---

## 6.28. Materialized Views

For costly aggregates:

```sql
CREATE MATERIALIZED VIEW mv_monthly_sales
BUILD IMMEDIATE
REFRESH FAST
AS
SELECT
date_key,
product_key,
SUM(amount) total_amount
FROM fact_sales
GROUP BY
date_key,
product_key;
```

Instead of always calculating:

```
1 billion transactions
```

reporting may use pre-aggregated data.

---

## 6.29. Multiple Sources and Date Mapping

An important Data Developer responsibility is source-to-target mapping.

Example:

```
SOURCE CRM
client_no

SOURCE BANKING
customer_id

DWH
source_customer_id
```

The mapping document may show:

```
TARGET RULE

customer_id CRM.CLIENT_NO directly
country_code CRM.COUNTRY look up COUNTRY_MAP
age CRM.BIRTH_DATE calculated
segment CUSTOMER.CLASS mapping roule
load_date - SYSDATE
```

This is exactly what in many projects is called:

```
Source-to-Target Mapping
STTM
```

---

## 6.30.

Example:

Sources send:

```
Romania
RO
ROM
642
```

DWH wants:

```
RO
```

We can have:

```
COUNTRY_MAP

source_system
source_value
target_value
```

Example:

```
CRM Romania RO
CORE RO
PAYMENTS 642 RO
```

---

## 6.31. Reconciliation

After ETL we need to check if the data is complete.

Example:

Source:

```sql
SELECT
COUNT(*)
SUM(amount)
FROM source_transaction
WHERE business_date = DATE '2026-09-22';
```

DWH:

```sql
SELECT
COUNT(*)
SUM(amount)
FROM fact_transaction
WHERE business_date = DATE '2026-09-22';
```

Compare:

```
source_count
target_count

source_amount
target_amount
```

This is called:

```
reconciliation
```

It is extremely important in banking.

---

## 6.32. Audit and Linage

We should be able to answer:

```
Where does that value come from?
What batch did he load?
What source did it produce?
What transformation has been applied?
```

Fact table may contain:

```
source_system
source_record_id
batch_id
load_timestamp
```

This information enables:

```
Data Lineage
```

I mean:

```
Report
  ↓
Mart date
  ↓
DWH
  ↓
Transformation
  ↓
Source system
```

---

## 6.33. DWH in banking

A simplified model may have:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_PRODUCT
DIM_BRANCH
DIM_CURRENCY
DIM_DATE

FACT_TRANSACTION
FACT_ACCOUNT_BALANCE
FACT_LOAN
FACT_CARD_TRANSACTION
```

Example:

```
FACT_TRANSACTION
---------------------------
transaction_key
customer_key
account_key
product_key
branch_key
currency_key
date_key

amount_original
amount_local
fee_amount
```

Report:

```sql
SELECT c.segment,
       p.product_name,
       SUM(f.amount_local) AS total_amount_local
FROM fact_transaction f
JOIN dim_customer c
  ON c.customer_key = f.customer_key
JOIN dim_product p
  ON p.product_key = f.product_key
GROUP BY c.segment,
         p.product_name;
```

---

## 6.34. Complete example of ETL flow

We assume:

```
SOURCE_TRANSACTION
```

with:

```
transaction_id
customer_id
amount
transaction_date
```

Flux:

```
SOURCE_TRANSACTION
        ↓
STG_TRANSACTION
        ↓
VALIDATION
        ↓
CUSTOMER LOOKUP
        ↓
DIM_CUSTOMER
        ↓
FACT_TRANSACTION
```

Step 1:

```sql
INSERT INTO stg_transaction
SELECT *
FROM source_transaction
WHERE update_date > :last_successful_load;
```

Step 2: validation.

```sql
SELECT *
FROM stg_transaction
WHERE VALIDATE_CONVERSION (amount AS NUMBER) returns 0;
```

Step 3: customer lookup.

```sql
SELECT s.transaction_id,
       d.customer_key
FROM stg_transaction s
LEFT JOIN dim_customer d
  ON d.customer_id = s.customer_id
 AND d.current_flag = 'Y';
```

Step 4: load the fact table.

```sql
INSERT INTO fact_transaction (
transaction_id,
customer_key,
date_key,
amount
)
SELECT
s.transaction_id,
NVL(d.customer_key, -1),
TO_NUMBER(TO_CHAR(s.transaction_date, 'YYYYMMDD')),
♪ amount ♪
FROM stg_transaction
LEFT JOIN dim_customer
ON d.customer_id = s.customer_id
AND d.current_flag = 'Y';
```

---

## 6.35. Real problems that you need to know how to investigate

As Oracle Data Developer you will often encounter scenarios such as:

```
ETL- lasted 6 hours instead of 40 minutes.

A batch has 1 million missing rows.

The BI report shows other totals than the source system.

There were duplicates in fact table.

An customer_key cannot be found.

ORA-01722 has appeared invalid number.

ORA-02291 foreign key has emerged.

One SCD2 dimension has two current_flag = 'Y'.

Incremental load processed the same data twice.

A ODI job failed at step 17.

A query makes FULL TABLE SCAN on a 2 billion-line fact.
```

A good way of investigating is:

```
1. identify the batch
2. identify source
3. check staging
4. check the number of rows
5. check reject / error tables
6. check for transformations
7. check the lookups
8. I'm checking the target.
9. make reconciliation
10. check the execution plan if the problem is performance
```

---

## Questions and answers

You must be able to answer questions quickly, such as:

**What is the difference between OLTP and DWH?**

OLTP optimizes operational transactions and DWH optimizes analysis and history.

**What is grain?**

The exact level of detail represented by a row of fact tables.

**Fact vs. Dimension?**

Fact = events and measures.

Dimension = descriptive context.

**Star vs Snowflake?**

Star has denormalised dimensions and fewer joins; Snowflake normalises dimensions.

**What is SCD Type 2?**

Method of keeping history by creating a new version of a dimensional row.

**Why do we use surrogate keys?**

For independence from source keys and history support, in particular SCD2.

**What is incremental load?**

Processing only new or modified data.

**What is reconciliation?**

Comparison of source data with the uploaded result for verification of completeness and correctness.

**What is a late-arriving dimension?**

The fact row arrives before the related dimension row exists.

**What is partition pruning?**

The Oracle accesses only the partitions relevant to the query.

---

## 6.37. What you need to master for the role of Oracle Data Developer

For the **Oracle DWH / ETL Data Developer** profile, I would consider it essential to master very well:

```
DWH architecture

Fact / Size

Star Schema

Grain

Surrogate Keys

SCD Type 1

Transaction / Snapshot Facts

ETL / ELT

Staging

Incremental Load

MERGE

Data Quality

Error Handling

Batch Processing

Reconciliation

Source-to-Target Mapping

Partitioning

SQL performance

Execution Plans

Analytic Functions

ODI concepts

Data Lineage

Banking data flows
```

Of these, for review, **Grain + Fact / Dimension + SCD2 + Incremental Load + ETL troubleshooting + Reconciliation + Partitioning** are probably the most important combination.

---

## Questions and answers

**Question:**

> We have 100 million transactions loaded daily in an Oracle DWH.

A good answer would be:

> I start by separating the problem between extraction, transformation and load. I check the volumes from the previous days and the duration of each step ETL. Then I check the execution of the plans of the slow SQL-s, partition pruning, Oracle statistics and possible FULL TABLE SCAN-s unintentionally.
>
> I'm checking whether the incremental load filters the data correctly and whether the indexes and partitions are right. For the fact large tables I'm checking whether we can use partitioning on the data business, direct-path insert, parallel DML or partition exchange.
>
> Finally, I'm checking the reconciliation to make sure that the optimization doesn't change the functional result.

This is exactly the combination commonly sought at a Data Developer:

```
SQL
+
Oracle
+
ETL
+
DWH concepts
+
troubleshooting
+
data quality
+
business understanding
```

---

## Mental scheme to remember

```
DATA WAREHOUSE
                       │
        ┌──────────────┼──────────────┐
        │              │              │
MODEL PERFORMANCE
        │              │              │
Fact / Dim Staging Partitioning
Grain Mapping Index
Star Schema Validation Parallelism
SCD Incremental Implementation Plan
        │              │
♪ Error Handling ♪
; Reconciliation;
= = sync, corrected by elderman = =
        │
        └──────────────┬──────────────┘
                       │
BUSINESS
                       │
Banking / Risk / Finance
```

For our course, the next logical step would be to separately deepen **dimensional modelling: Grain → Facts → Surrogate Keys → SCD Type 2**, then build in Oracle 26ai a small full banking DWH, for example DWH_ACCOUNT, with staging, DIM_CUSTOMER, DIM_ACCOUNT, DIM_DATE and FACT_TRANSACTION.

---

## Questions and answers

### How would you briefly explain Data Warehouse to a colleague who knows SQL, but not this area?

A Data Warehouse covers enterprise analytical architecture, facts, dimensions, grain, surrogate keys, staging, integration, and presentation layers. In practice, I first determine the source data and required business result, then verify the model, ETL logic, reconciliation, execution plan, and impact on the wider flow.

### What are the two most common practical issues related to Data Warehouse?

Two recurring problems are incorrect grain or mapping logic, which produces wrong results, and performance degradation at production scale. I explicitly verify facts, dimensions, grain, surrogate keys, staging, integration, presentation layers, and source-to-target mappings against a trusted control set.

### How do you check that the result is correct and not just fast?

I compare row counts, amounts, and keys with the source or a reference result; I test NULLs, duplicates, boundary conditions, and batch reruns. Only then do I evaluate elapsed time, resource usage, partition pruning, and execution plans.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Data Warehouse appears together with logging, auditing, reconciliation and impact analysis.
