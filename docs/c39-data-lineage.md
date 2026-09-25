---
title: 'C39. Data Lineage'
description: 'Complete English handbook chapter based on the original C39 course.'
sidebar_position: 39
---

# C39. Data Lineage

<div className="chapter-kicker">Chapter C39 · Complete course</div>

**Data Linage** describes the data route through a system: **where they come from, what transformations they pass through, where they are stored and who consumes them**.

In a banking environment / DWH, the lineage answers questions such as:

> The value of custodian\ _ exposure from the final report from which source it comes, which tables and transformations has passed and which jobs do it produce?

It is an essential concept for **DWH, ETL/ELT, audit, Data Governance, Data Quality, impact analysis and troubleshooting**.

---

## 1. The Fundamental Idea

A typical flow can look like this:

```
Core Banking
     |
     v
STG_ACCOUNT
     |
     v
ODS_ACCOUNT
     |
     v
DWH_ACCOUNT
     |
+ --
     |
     v
AGG_CUSTOMER_BALANCE
     |
     v
Regulation Report
```

Data Lineage documents this relationship.

For example:

```
CORE.ACCOUNT.CURRENT_BALANCE
        |
        v
STG_ACCOUNT.BALANCE
        |
        v
DWH_ACCOUNT.CURRENT_BALANCE
        |
        v
CUSTOMER_EXPOSURE.TOTAL_BALANCE
        |
        v
REPORT_CREDIT_RISK.EXPOSURE
```

The line can be analyzed at multiple levels.

---

# 2. Types of Data Linage

## 2.1 System-level linage

Show the route between the systems.

```
Core Banking
   ↓
Oracle Staging
   ↓
Oracle DWH
   ↓
Mart date
   ↓
Power BI / Regulatory Reporting
```

It is useful for architecture and integration.

---

## 2.2 Table-level lineage

Show relationships between tables.

```
CBS.ACCOUNT
     ↓
STG_ACCOUNT
     ↓
DWH_ACCOUNT
     ↓
FACT_ACCOUNT_BALANCE
```

For example:

```
STG_TRANSACTION
        ↓
FACT_TRANSACTION
        ↓
AGG_DAILY_TRANSACTION
```

---

## 2.3 Column-level linage

It's much more accurate.

Example:

```
SOURCE_ACCOUNT.BALANCE
          ↓
STG_ACCOUNT.ACCOUNT_BALANCE
          ↓
DWH_ACCOUNT.CURRENT_BALANCE
          ↓
FACT_BALANCE.AMOUNT
```

This is very important for:

- audit;
- financial reporting;
- regular reporting;
- troubleshooting;
- impact analysis.

---

# 3. Transformations are part of the lineage

The chain doesn't just say:

```
A → B
```

but also **as** got B.

Example:

```
INSERT INTO dwh_account (
account_id,
balance_eur
)
SELECT
account_id,
balance / exchange_rate
FROM stg_account;
```

Lineage:

```
STG_ACCOUNT.ACCOUNT_ID
↓ direct mapping
DWH_ACCOUNT.ACCOUNT_ID
```

but:

```
STG_ACCOUNT.BALANCE
        +
STG_ACCOUNT.EXCHANGE_RATE
        ↓
BALANCE / EXCHANGE_RATE
        ↓
DWH_ACCOUNT.BALANCE_EUR
```

Here we have an **derivative assigned**.

---

# 4. Direct vs Derived Linage

## Direct mapping

```
SELECT
customer_id,
customer_name
FROM stg_customer;
```

Lineage:

```
STG_CUSTOMER.CUSTOMER_ID
    ↓
DWH_CUSTOMER.CUSTOMER_ID
```

---

## Derived mapping

```
SELECT
quantity * price AS transaction_value
FROM stg_transaction;
```

Lineage:

```
QUANTITY Carol, Romania
- quantity * price
PRICE Carol, Romania
                       ↓
TRANSACTION_VALUE
```

---

# 5. Linage in an ETL

Let's assume the following ETL:

```
INSERT INTO fact_transaction (
transaction_id,
customer_key,
transaction_date,
amount_eur
)
SELECT
s.transaction_id,
c.customer_key,
s.transaction_date,
samount / fx.rate
FROM stg_transaction
JOIN dim_customer c
ON c.customer_id = s.customer_id
JOIN fx_rate fx
ON fx.currency_code = s.currency_code
AND fx.rate_date = s.transaction_date;
```

The chain for:

```
FACT_TRANSACTION.AMOUNT_EUR
```

is:

```
STG_TRANSACTION.AMOUNT
             +
STG_TRANSACTION.CURRENCY_CODE
             +
FX_RATE.RATE
             |
             v
amount / rates
             |
             v
FACT_TRANSACTION.AMOUNT_EUR
```

At the same time:

```
STG_TRANSACTION.CUSTOMER_ID
↓
DIM_CUSTOMER.CUSTOMER_KEY
        ↓
FACT_TRANSACTION.CUSTOMER_KEY
```

---

# 6. Upstream and Downstream Linage

Two extremely important concepts.

## Upstream

The question is:

> Where does this field come from?

Example:

```
REPORT_TOTAL_BALANCE
        ↑
AGG_CUSTOMER_BALANCE
        ↑
FACT_ACCOUNT_BALANCE
        ↑
DWH_ACCOUNT
        ↑
STG_ACCOUNT
        ↑
CORE_BANKING
```

This is the **analysis upstream**.

---

## Downstream

The question is:

> If I change this field, what systems will be affected?

```
CORE_ACCOUNT.BALANCE
        ↓
STG_ACCOUNT
        ↓
DWH_ACCOUNT
        ↓
FACT_BALANCE
        ↓
CUSTOMER_EXPOSURE
        ↓
RISK_REPORT
```

This is the **downstream analysis**.

It is very important for **Impact Analysis**.

---

# 7. Data Linage and Impact Analysis

We're assuming the businessman asks:

> Change the meaning of column ACCOUNT\ _ STATUS.

We need to find everything that depends on it.

```
STG_ACCOUNT.ACCOUNT_STATUS
        ↓
DWH_ACCOUNT.STATUS
        ↓
DIM_ACCOUNT.STATUS
        ↓
AGG_ACCOUNT_STATUS
        ↓
REPORT_ACTIVE_ACCOUNTS
```

The following should be considered:

- tables;
- Viewes,
- materialized views;
- procedures;
- packageuri,
- ETL-uri;
- ODI mappings;
- reports;
- API-uri.

This is one of the most common real cases of lineage use.

---

# 8. Data Linage and Data Quality

We submit that in a report it appears:

```
Customer Exposition = -500000 EUR
```

Suspicious value.

We go the other way:

```
Risk Report
    ↑
CUSTOMER_EXPOSURE
    ↑
FACT_LOAN
    ↑
STG_LOAN
    ↑
Core Banking
```

We can check at every level:

```
SELECT *
FROM fact_loan
WHERE customer_id = 12345;
```

then:

```
SELECT *
FROM stg_loan
WHERE customer_id = 12345;
```

and finally the source.

The chain speeds up the Troubleshooting enormously.

---

# 9. Data Lineage and Reconciliation

The line is closely linked to **Reconciliation**.

Example:

```
Core Banking
Balance = 1,000,000
        ↓
STG
Balance = 1,000,000
        ↓
DWH
balance = 999000
```

We have a difference.

The chain tells us exactly where to investigate.

```
SOURCE
   ↓
STAGING
   ↓
TRANSFORMATION
   ↓
DWH
```

We can compare every step.

---

# 10. Data Linage and Data Government

In a large organization, the lineage is part of **Data Governance**.

For each item date we can have:

```
Business
Technical
Source System
Source Table
Source Colour
Transformation Rule
Target Table
Target Colour
Owner
Data Steward
Classification
Quality Rules
Consumption
```

Example:

♪ Property ♪
♪ ♪ ♪ ♪ ♪
♪ Business term ♪
# Source # Core Banking #
Source Columm = LOAN.OUTSTANDING\ _ AMOUNT
= = sync, corrected by elderman = =
* Target
* * * * *
♪ Owner ♪ Risk Department ♪
= > Dossier = =

---

# 11. Business Linage vs Technical Linage

## Business Linage

It's business-oriented.

```
Customer Income
    ↓
Credit Risk Score
    ↓
Credit Decision
```

The business is not necessarily interested in all intermediate tables.

---

## Technical Linage

He's focused on developers.

```
CBS_CUSTOMER.MONTHLY_INCOME
        ↓
STG_CUSTOMER.INCOME
        ↓
DWH_CUSTOMER.MONTHLY_INCOME
        ↓
RISK_MODEL.INCOME_FACTOR
```

In practice, both are important.

---

# 12. Linage in a Data Warehouse

A classic model:

```
Source
   ↓
Staging
   ↓
ODS
   ↓
Enterprise DWH
   ↓
Mart date
   ↓
Reporting
```

Bank example:

```
CORE_TRANSACTION
        ↓
STG_TRANSACTION
        ↓
ODS_TRANSACTION
        ↓
FACT_TRANSACTION
        ↓
AGG_DAILY_TRANSACTION
        ↓
AML_REPORT
```

---

# 13. Linage for a Size

Example:

```
CRM.CUSTOMER
     ↓
STG_CUSTOMER
     ↓
DIM_CUSTOMER
```

For:

```
DIM_CUSTOMER.CUSTOMER_SEGMENT
```

linage:

```
CRM.CUSTOMER.INCOME
        +
CRM.CUSTOMER.ASSETS
        ↓
segmentation rule
        ↓
DIM_CUSTOMER.CUSTOMER_SEGMENT
```

---

# 14. Linage and SCD

For SCD Type 2:

```
CRM.CUSTOMER.ADDRESS
        ↓
STG_CUSTOMER.ADDRESS
        ↓
DIM_CUSTOMER.ADDRESS
```

but the transformation involves:

```
old row:
VALID_TO = syndate
IS_CURRENT = 'N'

new row:
VALID_FROM = syndate
VALID_TO = 9999-12-31
IS_CURRENT = 'Y'
```

The line must also document this logic.

---

# 15. Linage and CDC

With Change Data Capture:

```
Source DB
   ↓
CDC
   ↓
STG
   ↓
DWH
```

Example:

```
ACCOUNT UPDATE
      ↓
CDC_EVENT
      ↓
STG_ACCOUNT_DELTA
      ↓
MERGE DWH_ACCOUNT
```

The line may include the CDC mechanism.

---

# 16. Linage in ODI

In Oracle Data Integrator we can have:

```
Source Datastore
      ↓
Mapping
      ↓
Expression
      ↓
Lookup
      ↓
Target Datastore
```

Conceptual example:

```
SRC.TRANSACTION_AMOUNT
          ↓
ODI Mapping
          ↓
AMOUNT / FX_RATE
          ↓
DWH.TRANSACTION_AMOUNT_EUR
```

In a real project, ODI mappings are a very important source of metadata for linage.

---

# 17. Linage using Oracle Metadata

Oracle provides a lot of information about dependencies.

For example:

```
SELECT *
FROM user_dependencies
WHERE referenced_name = 'DWH_ACCOUNT';
```

or:

```
SELECT
name,
type,
referenced_name,
referenced_type
FROM user_dependencies;
```

You can find:

```
PACKAGE
VIEW
PROCEDURE
FUNCTION
TRIGGER
```

that depend on certain objects.

---

# 18. Dependencies between objects

Example:

```
CREATE VIEW v_active_accounts AS
SELECT *
FROM dwh_account
WHERE status = 'ACTIVE';
```

The Oracle retains addiction:

```
V_ACTIVE_ACCOUNTS
        ↓
DWH_ACCOUNT
```

We can see it through:

```
SELECT
name,
referenced_name
FROM user_dependencies
WHERE name = 'V_ACTIVE_ACCOUNTS';
```

---

# 19. Lines manual vs automatic

## Manual

Can be documented in:

- Excel;
- Confluence;
- diagrams;
- Mapping documents.

Example:

```
Source Colour
Target Colour
Transformation Rule
```

Advantage:

```
simple
```

Disadvantage:

```
quickly becomes unupdated
```

---

## Automatic

The tools can analyse:

```
SQL
ETL
Views
Stored Procedures
ODI mappings
BI reports
```

and automatically generate linear graphs.

---

# 20. Metadata-drive Linage

The mature systems use metadata.

Example of table:

```
CREATE TABLE data_lineage (
source_system VARCHAR2 (50),
source_table VARCHAR2 (100),
source_column VARCHAR2 (100),
target_system VARCHAR2 (50),
target_table VARCHAR2 (100),
target_column VARCHAR2 (100),
transformation_rule VARCHAR2 (1000)
);
```

Example:

```
INSERTQ1QX data_lineage
VALUES (
'CORE_BANKING',
'ACCOUNT',
'BALANCE',
'DWH',
'DWH_ACCOUNT',
'CURRENT_BALANCE',
'Direct mapping'
);
```

---

# 21. More realistic example of linear table

```
SOURCE_SYSTEM
SOURCE_SCHEMA
SOURCE_TABLE
SOURCE_COLUMN

ETL_JOB
TRANSFORMATION_RULE

TARGET_SCHEMA
TARGET_TABLE
TARGET_COLUMN
```

Example:

```
CORE
ACCOUNT
BALANCE
        ↓
ODI_LOAD_ACCOUNT
        ↓
ROUND (BALANCE 2)
        ↓
DWH
DWH_ACCOUNT
CURRENT_BALANCE
```

---

# 22. Linage and Audit

In banking, there may be a question:

> How was this number calculated from the report sent to the regulator?

You must be able to rebuild the route:

```
Report
   ↑
Aggregation
   ↑
Fact table
   ↑
DWH
   ↑
ETL
   ↑
Source system
```

Ideal:

```
source date
+
transformation
+
batch
+
timestamp
+
version
```

---

# 23. Data Linage and Batch Processing

The chain can also include the jobs.

```
CORE_BANKING
     ↓
JOB_LOAD_STG
     ↓
STG_TRANSACTION
     ↓
JOB_LOAD_FACT
     ↓
FACT_TRANSACTION
     ↓
JOB_AGG_DAILY
     ↓
AGG_TRANSACTION
```

In this case, sometimes we talk about:

```
Process Linage
```

not just Data Linage.

---

# 24. Example of Troubleshooting

Business says:

> The daily report shows 12,000 transactions, but the core banking has 12,500.

We're starting the lineage:

```
Core Banking
     ↓
STG_TRANSACTION
     ↓
FACT_TRANSACTION
     ↓
AGG_DAILY_TRANSACTION
     ↓
Report
```

We're checking:

```
SELECT COUNT *
FROM stg_transaction
WHERE transaction_date = DATE '2026-09-22';
```

then:

```
SELECT COUNT *
FROM fact_transaction
WHERE transaction_date = DATE '2026-09-22';
```

then:

```
SELECT SUM (transaction_count)
FROM agg_daily_transaction
WHERE transaction_date = DATE '2026-09-22';
```

We can quickly determine where the 500 transactions were lost.

---

# 25. Example of Impact Analysis

We have the column:

```
DWH_CUSTOMER.CUSTOMER_TYPE
```

Business wants to change the codes:

```
P → PERSON
C → COMPANY
```

Linage downstream can be:

```
DWH_CUSTOMER.CUSTOMER_TYPE
          ↓
DIM_CUSTOMER
          ↓
FACT_TRANSACTION
          ↓
CUSTOMER_SEGMENT
          ↓
AML_REPORT
          ↓
RISK_REPORT
```

All of these components should be analysed prior to change.

---

# 26. Data Linage vs. Data Flow

They're close concepts, but not identical.

**Data Flow** describes:

```
how the data circulates
```

**Data Linage** describes:

```
origin + transformations + destinations
```

A flow can say:

```
CRM → DWH → BI
```

The chain says:

```
CRM.CUSTOMER.INCOME
    ↓
STG_CUSTOMER.INCOME
    ↓
DWH_CUSTOMER.MONTHLY_INCOME
    ↓
RISK_SCORE.INCOME_COMPONENT
```

---

# 27. Data Linage vs Data Catalog

Catalogue date:

```
What do we have?
```

Date of Lineage:

```
Where do they come from and where do they end up?
```

Example Catalog date:

```
Tables: DWH_CUSTOMER
Colour: MONTHLY_INCOME
Type: NUMBER
Owner: Customer Domain
```

Lineage:

```
CRM.CUSTOMER.INCOME
       ↓
DWH_CUSTOMER.MONTHLY_INCOME
       ↓
RISK_MODEL.INCOME
```

The two are complementary.

---

# 28. Linage Graph

The line is naturally represented as an **directed graph**.

```
A → B → C → D
```

where:

```
Node = tables / collum / system / report
edge = dependence
```

Example:

```
CUSTOMER
   │
- - - - - DIM_CUSTOMER
   │       │
- CUSTOMER_REPORT
   │
- - - - - - RISK_MODEL
           │
- - - - - - RISK_REPORT
```

That's why many data governance tools display lineages as a graph.

---

# 29. What information should contain a good lineage

Ideal:

```
Source system
Source scheme
Source table
Source Column

Transformation

ETL job
Procedure / package
Execution order

Target system
Target Scheme
Target table
Color Target

Business owner
Technical owner

Data Quality rules

Downstream consumers
```

---

# 30. Full banking example

Suppose we want to calculate:

```
Customer Total Exhibition
```

Sources:

```
LOAN
CREDIT_CARD
OVERDRAFT
```

Lineage:

```
CORE_LOAN.OUTSTANDING
            │
            ├──────────────┐
CORE_CARD.BALANCE
            │              │
¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ SUM ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ → CUSTOMER_EXPOSURE
            │              │
CORE_OVERDRAFT.AMOUNT
                           │
                           ↓
RISK_REPORT
```

SQL:

```
SELECT
customer_id,
SUM (exposition) AS total_exposure
FROM (
SELECT customer_id,
outstanding_amount AS exposure
FROM loan

UNION ALL

SELECT customer_id,
card_balance
FROM credit_card

UNION ALL

SELECT customer_id,
overdraft_amount
FROM overdraft
)
GROUP BY customer_id;
```

His necklace:

```
TOTAL_EXPOSURE
```

includes all three systems / sources.

---

# 31. Real script DWH

You have the pipelineum:

```
CBS
 ↓
STG
 ↓
ODS
 ↓
DWH
 ↓
Mart date
 ↓
Regulation Reporting
```

An auditor asks:

> Where does the value 2.347.812 EUR in the report come from?

You have to be able to explain:

```
REPORT.EXPOSURE
     ↑
RISK_MART.CUSTOMER_EXPOSURE
     ↑
DWH.FACT_LOAN
     ↑
ODS.LOAN
     ↑
STG.LOAN
     ↑
CORE_BANKING.LOAN
```

plus the transformations applied.

This is the classic case of **Data Linage**.

---

# 32. Oracle Exercise 26ai

Consider:

```
CREATE TABLE stg_transaction (
transaction_id NUMBER,
customer_id NUMBER,
amount NUMBER,
currency_code VARCHAR2 (3)
);
```

and:

```
CREATE TABLE fact_transaction (
transaction_id NUMBER,
customer_id NUMBER,
amount_eur NUMBER
);
```

We have:

```
INSERTQ1QX fact_transaction
SELECT
s.transaction_id,
s.customer_id,
s.amount / f.rate
FROM stg_transaction
JOIN fx_rate f
ON f.currency_code = s.currency_code;
```

### Identify the lineage for:

```
FACT_TRANSACTION.TRANSACTION_ID
FACT_TRANSACTION.CUSTOMER_ID
FACT_TRANSACTION.AMOUNT_EUR
```

Result:

```
STG_TRANSACTION.TRANSACTION_ID
        ↓
FACT_TRANSACTION.TRANSACTION_ID
```

```
STG_TRANSACTION.CUSTOMER_ID
        ↓
FACT_TRANSACTION.CUSTOMER_ID
```

and for the amount:

```
STG_TRANSACTION.AMOUNT
            +
FX_RATE.RATE
            ↓
AMOUNT / RATE
            ↓
FACT_TRANSACTION.AMOUNT_EUR
```

---

## Questions and answers

### What is Data Linage?

A good answer:

> Data Linage is the traceability of data from the source to the final consumer, including systems, tables, columns and transformations through which data are passed.

---

### What difference is there between upstream and downstream lineage?

```
Upstream:
Where does the date come from?

Downstream:
Where is the date used?
```

---

### What is Data Linage used for?

Answer:

```
Impact analysis
Troubleshooting
Audit
Date of Government
Data Quality
Regulation reporting
Reconciliation
Change management
```

---

### What difference is there between tablet-level and column-level linage?

Table-level:

```
TABLE_A → TABLE_B
```

Column-level:

```
TABLE_A.COL_X → TABLE_B.COL_Y
```

Colour-level linage is much more accurate.

---

### How can you investigate the lineage in Oracle?

You can use:

```
USER_DEPENDENCIES
ALL_DEPENDENCIES
DBA_DEPENDENCIES
```

and analysis:

```
SQL
Views
Procedure
Packages
ETL jobs
ODI mappings
```

---

### Why is Data Linage important in a bank?

Because we need to be able to prove:

```
origin of the data
Transformations applied
consistency of data
impact of changes
traceability of reports
```

in particular for:

```
risk
finance
AML
Regulation reporting
audit
```

---

## Questions and answers

If you have to compress the whole chapter to a few ideas:

> **Data Linage = Data traceability Source → Transformations → Target → Consumer.**

Main mental scheme:

```
SOURCE
   ↓
STAGING
   ↓
ODS
   ↓
DWH
   ↓
DATA MART
   ↓
REPORT
```

For each step you must be able to answer:

```
Where does it come from?
What transformation does it apply?
Where does it get to?
Who's using it?
```

And the two essential directions are:

```
Upstream linage
Where does the value come from?

Downstream linage
What will be affected if I change it?
```

In practice, **Data Linage + Reconciliation + Data Quality + Impact Analysis** forms a very important group of concepts for an **Oracle DWH / Data Developer**, especially in a banking environment.

---

## Questions and answers

### How would you briefly explain Data Linage to a colleague who knows SQL, but not this area?

Data Lines cover where data came from and how it changed, technical vs business lineage, column-level and tablet-level lineages. In practice, first, I set out what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Data Linage?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Data Linage, I explicitly follow where data came from and how it changed, technical vs business lineage, column-level and table-level linage and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

A report shows a wrong KPI.
