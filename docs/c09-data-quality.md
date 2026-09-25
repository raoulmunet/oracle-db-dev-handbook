---
title: 'C09. Data Quality'
description: 'Complete English handbook chapter based on the original C09 course.'
sidebar_position: 9
---

# C09. Data Quality

<div className="chapter-kicker">Chapter C09 · Complete course</div>

## 9. Data Quality › Oracle DB / ETL / DWH

Data Quality means to ensure that the data entering and circulating through the system are correct, complete, consistent, valid and usable**. In a Data Warehouse, data quality is not just a technical problem: an error in a custodian\ _ id, a wrong currency or a duplicate transaction can produce KPI-uri and incorrect business reports.

In a typical stream:

```
SOURCE
   │
   ▼
STAGING
   │
- Profiling
- Validare
- Standardisation
* * *
- Reconciliation
   │
¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶
   │
   ▼
CORE / DWH
   │
   ▼
DATA MART / REPORTING
```

---

# 1. What is the meaning of high quality data

The most important dimensions are:

♪ ♪ ♪
♪ ♪ ♪ ♪ ♪
Is **Complementess** missing mandatory values?
Does **Validity** respect accepted format and domain values?
Does **Accuracy** represent reality?
Is **Consistency** information consistent between systems?
Are there any duplicates?
Are **Integrity** Relations PK/FK correct?
Is **Timeliness** still recent?
Does **Consistency** respect the common standard of representation?
Is **Reconciliation** the number and totals consistent with the source?

Example:

```
customer_id = NULL - is complete
birth_date = 31-02-2020 - is valid
country = ROMANIA / RO / ROU -
the same CNP 3 times - the same uniform
account. customer_id inexistent-
salary = -5000 - "business route"
```

---

# 2. Data Profiling

Before you clean the data, you have to understand what's in it.

Suppose:

```
CREATE TABLE stg_customer (
source_customer_id VARCHAR2 (50),
customer_name VARCHAR2 (200),
email VARCHAR2 (200),
birth_date_txt VARCHAR2 (30),
country_code VARCHAR2 (10)
);
```

First profiling:

```
SELECT
COUNT (*) total_rows,
COUNT (source_customer_id) id_populated
COUNT (DISTINCT source_customer_id) distinct_ids
FROM stg_customer;
```

NULL-uri:

```
SELECT
SUM (CASE WHEN source_customer_id IS NULL THEN 1 ELSE 0 END) null_id,
SUM (CASE WHEN customer_name IS NULL THEN 1 ELSE 0 END) null_name,
SUM (CASE WHEN email IS NULL THEN 1 ELSE 0 END) null_email
FROM stg_customer;
```

Distribution of values:

```
SELECT country_code COUNT (*)
FROM stg_customer
GROUPQ1QX country_code
ORDER BY COUNT (*) DESC;
```

Suspicious lengths:

```
SELECT LENGTH (source_customer_id), COUNT (*)
FROM stg_customer
GROUP BY LENGTH (source_customer_id)
ORDER BY 1;
```

The profiling can immediately reveal:

```
RO
ROMANIA
Romania
en
NULL
R0
```

although the businessman believes that all should be:

```
RO
```

---

# 3. Complaineness

A simple rule:

> Each customer must have source\ _ custodian\ _ id.

```
SELECT *
FROM stg_customer
WHERE source_customer_id IS NULL;
```

Just like our exercise:

> **DQ-002 Find customers without source\ _ custodian\ _ id.**

We can also calculate KPI-:

```
SELECT
COUNT (*) total_rows,
SUM (CASE
WHEN source_customer_id IS NULL THEN 1
ELSE 0
END) invalid_rows,
ROUND (
100 *
SUM (CASE
WHEN source_customer_id IS NOT NULL THEN 1
ELSE 0
END)
/ COUNT (*)
2
) quality_pct
FROM stg_customer;
```

Possible result:

```
TOTAL_ROWSQ1QX QUALITY_PCT
---------- ------------ -----------
100000 250 99.75
```

---

# 4. Validity

A value may exist, but to be invalid.

Example:

```
AGE = -20
COUNTRY_CODE = XYZ
AMOUNT = ABC
DATE = 2026-15-76
```

For numerical values in Modern Oracle:

```
SELECT *
FROM staging_transactions
WHERE validate_conversion (amount_txt AS NUMBER) returns 0;
```

Example:

```
100
250.50
ABC
-30.
12X - invalid
```

VALIDATE\ _ CONVERSION allows verification without generation:

```
ORA-01722: invalid number
```

Example:

```
SELECT amount_txt,
VALIDATE_CONVERSION (amount_txt AS NUMBER)
FROM staging_transactions;
```

Result:

```
100 1
55.75 1
ABC 0
12X 0
```

---

# 5. Safe Conversion

A very important technique in ETL is:

> **validated before convert**

No:

```
SELECT TO_NUMBER (amount_txt)
FROM staging_transactions;
```

if the external data can be dirty.

Safer:

```
SELECT CASE
WHEN VALIDATE_CONVERSION (amount_txt AS NUMBER) = 1
THEN TO_NUMBER (amount_txt)
END amount
FROM staging_transactions;
```

In modern Oracle versions we can also use:

```
TO_NUMBER (
amount_txt
DEFAULT NULL ON CONVERSION ERROR
)
```

Thus:

```
'125.30' - › 125.30
'ABC' - EXCIPIENTS NULL
```

This pattern is very useful in ETL.

---

# 6. Detection of duplicates

One of the most common DQ problems.

```
SELECT source_customer_id,
COUNT (*)
FROM stg_customer
GROUPQ1QX source_customer_id
HAVING COUNT (*)
```

To see the lines:

```
SELECT *
FROM (
SELECT c. *
COUNT (*) OVER (
PARTITIONQ1QX source_customer_id
) cnt
FROM stg_customer c
)
WHERE cnt ^ 1;
```

Or:

```
SELECT *
FROM (
SELECT c. *
ROW_NUMBER () OVER
PARTITIONQ1QX source_customer_id
ORDER BY load_timestamp DESC
) rn
FROM stg_customer c
)
WHERE rn; 1;
```

Here we can decide that:

```
rn = 1 - Kept record
r is 1 - is duplicate
```

This is one of the most important ETL squares.

---

# 7. Data Standardisation

The data may be semantically identical but represented differently.

Example:

```
Romania
ROMANIA
Romania
RO
ROU
```

Simple standardization:

```
UPDATE stg_customer
SET country_code =
CASE UPPER (TRIM (country_code))
WHEN 'ROMANIA' THEN 'RO'
WHEN 'ROU' THEN 'RO'
WHEN 'RO' THEN 'RO'
ELSE UPPER (TRIM (country_code))
END;
```

But in a serious DWH it is better to use a mapping:

```
SOURCE_VALUE STANDARD_VALUE
------------   --------------
ROMANIA RO
Romania RO
ROU RO
RO RO
FRANCE FR
FRA FR
```

Table:

```
CREATE TABLE map_country (
source_value VARCHAR2 (50),
country_code VARCHAR2 (2)
);
```

Transformation:

```
SELECT c. *
m.country_code
FROM stg_customer c
LEFT JOIN map_country
ON UPPER (TRIM (c.country_code))
= UPPER (TRIM (m.source_value));
```

---

# 8. Referential Integrity

Example:

```
CUSTOMER
--------
customer_id

TRANSACTION
-----------
transaction_id
customer_id
```

We can find transactions without a client:

```
SELECT t *
FROM stg_transaction
LEFT JOIN custodian c
ON c.customer_id = t.customer_id
WHERE c.customer_id IS NULL;
```

Or:

```
SELECT *
FROM stg_transaction
WHERE NOT EXISTS (
SELECT 1
FROM custodian c
WHERE c.customer_id = t.customer_id
);
```

In DWH, this test is extremely important before loading invoices into a fact table.

---

# 9. Business Rules

Data Quality does not just mean SQL types and constraints.

We can have rules like:

```
transaction_amount

start_date = end_date

birth_date = SYSDATE

currency_code, EUR, USD, RON

account_status, ACTIVE, CLOSED, BLOCKED
```

Example:

```
SELECT *
FROM stg_account
WHERE balance
AND account_type = 'SAVINGS';
```

If the businessman says:

> savings accounts may not have a negative balance,

This is an DQ roule.

---

# 10. Cross-Colour Rules

Sometimes the columns are individually valid, but the combination is impossible.

Example:

```
status = CLOSED
close_date = NULL
```

Test:

```
SELECT *
FROM account
WHERE status = 'CLOSED'
AND close_date IS NULL;
```

Other example:

```
SELECT *
FROM contract
WHERE valid_to
```

---

# 11. Cross-Table Rules

Example:

```
TRANSACTION.customer_id
```

shall exist in:

```
CUSTOMER.customer_id
```

Test:

```
SELECT t.customer_id
FROM transaction_stage
WHERE NOT EXISTS (
SELECT 1
FROM customer_dim c
WHERE c.source_customer_id = t.customer_id
);
```

This type of verification is permanently found in ETL DWH.

---

# 12. Error / Subject Table

In ETL it is not recommended to simply throw away invalid data.

Better:

```
SOURCE
   |
   v
STAGING
   |
+ -- Valid --
   |
+ -- invalid ----
```

Example:

```
CREATE TABLE etl_error (
error_id NUMBER GENERATED ALWAYS AS IDENTITY,
batch_id NUMBER,
source_table VARCHAR2 (100),
source_key VARCHAR2 (200),
error_code VARCHAR2 (50),
error_message VARCHAR2 (1000),
error_value VARCHAR2 (4000),
created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);
```

Insert:

```
INSERT INTO etl_error (
batch_id,
source_table,
source_key,
error_code,
error_message,
error_value
)
SELECT
batch_id,
'STG_TRANSACTION',
transaction_id,
'DQ_INVALID_AMOUNT',
'Amount cannot be converted to NUMBER',
amount_txt
FROM stg_transaction
WHERE VALIDATE_CONVERSION (amount_txt AS NUMBER) returns 0;
```

---

# 13. Quarantine Patterson

A very useful pattern:

```
RAW
 │
 ▼
STAGING
 │
* * * * * * * * *
 │
¶ ¶ INVALID ¶ ¶ ¶ ¶ ¶ ¶ ¶ ¶ ► QUARANTINE
                        │
                        ▼
investigation
                        │
                        ▼
reply
```

Advantage:

Invalid data does not block the entire batch.

---

# 14. DBMS\ _ ERRLOG

Oracle offers a very useful mechanism for DML error logging.

Suppose:

```
CREATE TABLE target_customer (
customer_id NUMBER PRIMARY KEY,
VARCHAR2 (100) NOT NULL
);
```

We create the error table logging:

```
BEGIN
DBMS_ERRLOG.CREATE_ERROR_LOG (
dml_table_name = = 'TARGET_CUSTOMER'
);
END;
/
```

The Oracle creates:

```
ERR$_TARGET_CUSTOMER
```

Then:

```
INSERTQ1QX target_customer
SELECT...
FROM staging_customer
LOG ERRORS INTO err $_target_customer
REJECT LIMIT UNLIMITED;
```

Advantage:

a single invalid record does not stop the entire:

```
INSERT
MERGE
UPDATE
DELETE
```

---

# 15. Technical errors vs Data Quality errors

The distinction is important.

### Technical error

```
ORA-01653 unable to extend table
ORA-12541 no listener
ORA-03113
```

The problem is infrastructure / DB.

### Data Quality error

```
customer_id NULL
amount = ABC
country_code invalid
duplicates custodian
FK missing
```

The data is the problem.

These two categories must be treated differently.

---

# 16. Hard Reject vs. Soft Warning

Not every problem has to block the record.

Example:

### Hard reject

```
transaction_id = NULL
Invalid amount
Invalid Currency
Non-existing custodian
```

The record can't be loaded.

### Warning

```
phone_number missing
middle_name missing
customer_address incomplete
```

The record may be uploaded, but DQ must be reported.

Therefore, a DQ framework may have:

```
ERROR
WARNING
INFO
```

---

# 17. DQ Rule Table

In mature systems, rules can be metamorized.

```
CREATE TABLE dq_rule (
rule_id NUMBER,
rule_code VARCHAR2 (50),
rule_name VARCHAR2 (200),
severity VARCHAR2 (20),
target_table VARCHAR2 (100),
active_flag CHAR (1)
);
```

Examples:

```
DQ001Q1QX ERROR
DQ002Q1QX WARNING
DQ003Q1QX ERROR
DQ004Q1QX ERROR
DQ005Q1QX ERROR
```

---

# 18. Auditing the execution of DQ

We need to know:

```
What rule
What batch?
when
how many rows
how many errors
```

Example:

```
CREATE TABLE dq_result (
run_id NUMBER,
rule_id NUMBER,
batch_id NUMBER,
checked_rows NUMBER,
failed_rows NUMBER,
run_timestamp TIMESTAMP
);
```

So we can have:

```
Rule Checked Failed
--------------------  -------   ------
Missing custodian ID 100000 23
Invalid country 100000 112
Duplicate custodian 100000 5
Invalid email 100000 341
```

---

# 19. Data Quality Score

We can calculate:

```
DQ Score =
valid records
-------------
total records
× 100
```

For example:

```
99 800 / 100 000 × 100 = 99.8%
```

But in a real system the rules can have different weights:

```
missing customer ID severity 10
invalid country severity 8
missing phone severity 2
```

Thus a simple percentage of valid rows is not always sufficient.

---

# 20. Reconciliation

One of the most important ETL checks.

After loading we check:

```
SOURCE
rows = 1,000,000

STAGING
rows = 1,000,000

VALID
rows = 999,950

REJECT
rows = 50

TARGET
rows = 999,950
```

We must have:

```
SOURCE = VALID + REJECT
```

I mean:

```
1,000,000 = 999,950 + 50
```

But we also need to check the values.

Example:

```
SELECT
COUNT (*) row_count,
SUM (amount) total_amount
FROM source_transaction;
```

compared to:

```
SELECT
COUNT (*) row_count,
SUM (amount) total_amount
FROM fact_transaction;
```

---

# 21. Control Totals

In banking and financial systems it is very important.

We're not just checking:

```
COUNT *
```

but also:

```
SUM (amount)
MIN (data)
MAX (data)
COUNT (DISTINCT account)
```

Example:

```
SELECT
COUNT (*) row_count,
SUM (amount) total_amount,
COUNT (DISTINCT account_id) accounts,
MIN (transaction_date) min_date
MAX (transaction_date) max_date
FROM stg_transaction;
```

---

# 22. Data Quality and SCD

DQ is closely related to SCD.

Example:

```
CUSTOMER_ID = 100
ADDRESS = NULL
```

If we enter blindly the modification into an SCD Type 2, we can create:

```
customer 100
Bucharest
2025-01-01 → 2026-09-20

customer 100
NULL
2026-09-20 → 9999-12-31
```

But maybe NULL came from an interface error.

Therefore:

> **not every difference must be automatically transformed into a SCD change.**

DQ must be executed before the dimensions are updated.

---

# 23. Data Quality and ETL

A mature pipeline can look like this:

```
SOURCE
   │
   ▼
RAW
   │
   ▼
STAGING
   │
- structural validation
¶ ¶ datatype validation
- Business validation
* * * *
- FK validation
- - - - Standardisation
   │
   ▼
DQ RESULT
   │
¶ ¶ ¶ ¶ ¶ ¶
   │
¶ ¶ ¶ ¶ ¶ ¶ ¶
                         │
                         ▼
DWH
                         │
                         ▼
RECONCILIATION
```

---

# 24. Recommended order of checks

In general:

```
1. Structural checks
2. Mandatory fields
3. Datatype validation
4. Validation format
5. Domain validation
6. Business rules
7. Reference integrity
8. Duplicate detection
9. Cross-table validation
10. Reconciliation
```

The reason is simple:

There's no point in testing:

```
% 1
```

before you check if:

```
amount = 'ABC'
```

can be converted to NUMBER.

---

## Questions and answers

A very likely question:

> **What would you do if one invalid record causes an ETL batch containing one million records to fail?**

A good answer:

> I would normally fail the complete batch because of a small number of data-quality errors. I would validate the records in staging, separate valid and invalid records, store rejected records together with the batch ID, business key, error code and error message, load the valid records, and perform reconciliation at the end.

Mental scheme:

```
1,000,000 source rows
          │
          ▼
validation
       /      \
      /        \
3919.90.10
VALID INVALID
   │            │
   ▼            ▼
DWH ERROR
               │
               ▼
FIX
               │
               ▼
REPLAY
```

---

## Questions and answers

### Problem

The source sends:

```
transaction_id amount
1001 125.30
1002 ABC
1003 45.20
```

Code ETL:

```
INSERTQ1QX fact_transaction
SELECT transaction_id,
TO_NUMBER (amount)
FROM staging_transaction;
```

The batcher falls with:

```
ORA-01722
```

### Solution

First we identify:

```
SELECT *
FROM staging_transaction
WHERE VALIDATE_CONVERSION (amount AS NUMBER) returns 0;
```

then we separate:

```
INSERT INTO fact_transaction (
transaction_id,
% 1
)
SELECT
transaction_id,
TO_NUMBER (amount)
FROM staging_transaction
WHERE VALIDATE_CONVERSION (amount AS NUMBER) returns 1;
```

and errors:

```
INSERT INTO etl_error (
source_key,
error_code,
error_value
)
SELECT
transaction_id,
'INVALID_AMOUNT',
% 1
FROM staging_transaction
WHERE VALIDATE_CONVERSION (amount AS NUMBER) returns 0;
```

This is a much more robust approach than letting the entire batch fail.

---

# 27. Data Quality and Performance

For very large volumes, we avoid running the same check ten times.

For example, instead of doing separately:

```
COUNT invalid amount
COUNT missing custodian
COUNT invalid data
COUNT invalid country
```

we can calculate in a single scan:

```
SELECT
COUNT (*) total_rows,

SUM (
CASE
WHEN customer_id IS NULL THEN 1
ELSE 0
END
) missing_customer,

SUM (
CASE
WHEN VALIDATE_CONVERSION (amount_txt AS NUMBER) = 0
THEN 1
ELSE 0
END
) invalid_amount,

SUM (
CASE
WHEN country_code NOT IN ('RO', 'FR', 'DE', 'IT')
THEN 1
ELSE 0
END
) invalid_country

FROM stg_transaction;
```

For hundreds of millions of rows, this is becoming important.

---

# 28. DQ vs Constraints

The Oracle Constraints are the last line of defense:

```
NOT NULL
PRIMARY KEY
UNIQUE
FOREIGN KEY
CHECK
```

Example:

```
ALTER TABLE custodian
ADDQ1QX chk_customer_status
CHECK (IN status ('ACTIVE', 'INACTIVE', 'BLOCKED'));
```

But in ETL we don't have to rely exclusively on constraints.

Why?

Because:

```
1 invalid record
```

can cause it to fail:

```
1,000,000 records
```

Therefore:

```
STAGING DQ
      +
DATABASE CONSTRAINTS
```

is the safer solution.

---

# 29. Data Quality Framework

In a more mature DWH project we can have:

```
DQ_RULE
DQ_RUN
DQ_RESULT
DQ_ERROR
ETL_BATCH
```

Relationship:

```
ETL_BATCH
    │
− DQ_RUN
    │      │
● DQ_RULE
    │      │
► DQ_RESULT
    │
- DQ_ERROR
```

This allows:

```
audit
monitoring
dashboard
trend analysis
reprocessing
```

---

## Questions and answers

You should be able to respond quickly to these:

1. What is Data Quality?
2. What are the main dimensions of DQ?
3. What's the difference between validity and accuracy?
4. How do you detect duplicates?
5. How do you detect invalid numerical values?
6. What is profiling date?
7. What is the date of reconciliation?
8. What's a backgammon?
9. What is Quarantine?
10. Did you stop a batch for one invalid record?
11. What information would you save in an error table?
12. What is DBMS _ ERRLOG?
13. What is the difference between technical error and DQ error?
14. What's a total control?
15. How do you check the referential integrity before loading?
16. What is the relationship between DQ and SCD?
17. How do you treat duplicates?
18. What does standardisation mean?
19. What does hard error vs. warning mean?
20. How do you measure Data Quality?

---

# 31. Oracle Exercises 26ai

For our lab DEV\ _ LAB, I would do the following series:

### DQ-001 = NULL values

Find the nameless customers.

### DQ-002

Find:

```
source_customer_idQ1QX NULL
```

### DQ-003

Use:

```
GROUP BY
HAVING COUNT (*)
```

then also resolve with:

```
ROW_NUMBER ()
```

### DQ-004

Enter:

```
100
250
ABC
15X
```

and detects non-veritable values.

### DQ-005

Check external data stored as text.

### DQ-006

Detect:

```
country_code NOT IN (...)
```

### DQ-007

Detects non-existent FK-s using:

```
NOT EXISTS
```

### DQ-008 - Cross-colluding validation

```
close_date - open_date
```

### DQ-009

Create ETL\ _ ERROR and insert the rejectures.

### DQ-010

Check:

```
SOURCE =
TARGET +
REJECT
```

---

# 32. What to remember for the role of Oracle Data Developer

It is not necessary to memorize dozens of functions. More important is to understand this pattern:

```
DATA QUALITY
                 │
       ┌─────────┼─────────┐
       │         │         │
PROFILEQ1QX RECONCILE
       │         │         │
       ▼         ▼         ▼
understand detect verify
the data errors loading
                 │
          ┌──────┴──────┐
          │             │
VALID INVALID
          │             │
          ▼             ▼
DWH ERROR/QUARANTINE
                         │
                         ▼
FIX
                         │
                         ▼
REPLAY
```

And for review, the very useful formula is:

> **Profile → Validate → Separate → Load → Reconcile → Monitor → Replay**

This is the way of thinking that I would use it in an actual Oracle DWH project.

In the curriculum, the link now becomes very natural:

```
6. Data Warehouse
        ↓
7. SCD
        ↓
8. ETL / ELT
        ↓
9. Data Quality
        ↓
10. Date Mapping
        ↓
11. Performance / SQL tuning
```

And **Data Quality** is basically the layer of protection between external data and DWH: we don't assume that the source is correct; **we demonstrate that the data is good enough to be loaded**.

---

## Questions and answers

### How would you briefly explain Data Quality to a colleague who knows SQL, but not this area?

Data Quality covers completeness, validity, uniqueness, consistency and timeliness, profiling and roule definition, safe conversions with VALIDATE _ CONVERSION. In practice, I first determine what data enter and what result to achieve, then I check implementation, execution plan and effects on flow.

### What are the two most common practical issues related to Data Quality?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Data Quality, I explicitly follow completeness, validity, uniqueness, consistency and timeliness, profiling and rule definition, safe conversions with VALIDATE _ CONVERSION and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

A transaction file shall contain amount = 'ABC', duplicates and non-existent account keys.
