---
title: 'C37. Reconciliation'
description: 'Complete English handbook chapter based on the original C37 course.'
sidebar_position: 37
---

# C37. Reconciliation

<div className="chapter-kicker">Chapter C37 · Complete course</div>

## 1. What Reconciliation is

**Reconciliation** means systematic verification that the data transferred or processed between two systems are complete, correct and consistent**.

In a typical DWH flux:

```
Source System
     ↓
Staging
     ↓
Transformation / ETL
     ↓
Data Warehouse
     ↓
Data Mart / Reporting
```

reconciliation answers questions such as:

- Have all the records arrived yet?
- S-have lost ranks?
- Have there been any duplicates?
- Are the financial values the same?
- Did the ETL transformations produce the expected result?
- Does the data in DWH correspond to the source system?

The fundamental idea is:

```
SOURCE - TARGET
```

but not necessarily:

```
SOURCE = TARGET
```

because the target may contain transformations, aggregates, foreign exchange conversions, filtering or business rules.

---

# 2. Why reconciliation is important

In a banking DWH, for example, the fact that ETL- has ended with SUCCESS status does not automatically mean that the data are correct.

You can have:

```
ETL status: SUCCESS

Source rows: 1,000,000
Target rows: 998,743
```

The job ran without technical error, but **1.257 records are missing**.

Reconciliation detects such problems.

It is particularly important for:

- financial transactions;
- accounts;
- payments;
- invoices;
- curator swings,
- regular reporting;
- the date of the migration;
- batch processing;
- ETL / ELT;
- integration of several systems.

---

# 3. Main Types of Reconciliation

We can look at reconciliation on multiple levels.

## 3.1 Row Count Reconciliation

The simplest verification:

```
SELECT COUNT *
FROM source_transactions;

SELECT COUNT *
FROM dwh_transactions;
```

Example:

```
SOURCE = 1,000,000
TARGET = 1,000,000
```

Sounds right.

But the same value of COUNT (\ *) **does not guarantee that the same data are**.

You can have:

```
100 missing rows
100 duplicate rows
```

And the final county remains identical.

That's why the row count is just the first level of control.

---

# 4. Control totals

A much stronger mechanism is the use of **control totals**.

Example:

```
SELECT
COUNT (*) AS row_count,
SUM (amount) AS total_amount
FROM source_transactions;
```

and:

```
SELECT
COUNT (*) AS row_count,
SUM (amount) AS total_amount
FROM dwh_transactions;
```

Result:

```
SOURCE
rows = 1,000,000
amount = 854,234,987.12

TARGET
rows = 1,000,000
amount = 854,234,987.12
```

This control is much more relevant.

---

# 5. Multiple Control totals

In practice it is good to use more control values.

Example:

```
SELECT
COUNT (*) AS row_count,
SUM (amount) AS sum_amount,
MIN (transaction_date) AS min_date
MAX (transaction_date) AS max_date
COUNT (DISTINCT customer_id) AS customer_count
FROM transactions;
```

We can compare:

```
row count
sum amount
min data
max data
number of customers
```

This set forms a simple **reconciliation signature**.

---

# 6. Reconciliation on Business Key

One of the most important checks is the comparison of keys.

Example:

```
SELECT transaction_id
FROM source_transactions

MINUS

SELECT transaction_id
FROM dwh_transactions;
```

The result contains transactions present in source but absent in target.

Reverse:

```
SELECT transaction_id
FROM dwh_transactions

MINUS

SELECT transaction_id
FROM source_transactions;
```

These are existing records in target but not in source.

---

# 7. FULL OUTER JOIN for reconciliation

A very useful approach:

```
SELECT
s.transaction_id AS source_id,
t.transaction_id AS target_id,
s.amount AS source_amount,
t.amount AS target_amount
FROM source_transactions
FULL OUTER JOIN dwh_transactions t
ON t.transaction_id = s.transaction_id
WHERE
s.transaction_id IS NULL
OR t.transaction_id IS NULL
OR s.amount n.e.c.;
```

This query can identify:

```
missing in source
missing in target
different amount
```

---

# 8. Reconciliation on Columns

Sometimes the row exists in both systems, but the values differ.

Example:

```
SOURCE

transaction_id = 10045
amount = 1500
Currency = EUR
status = COMPLETED
```

Target:

```
transaction_id = 10045
amount = 150
Currency = EUR
status = COMPLETED
```

The problem is a mismatch on the amount.

Query:

```
SELECT
s.transaction_id,
s.amount source_amount,
t.amount target_amount
FROM source_transactions
JOIN dwh_transactions
ON t.transaction_id = s.transaction_id
WHERE NVL (s.amount, -1)
```

---

# 9. Attention to NULL

This query may be wrong:

```
WHERE s.whole
```

If:

```
source_amount = NULL
target_amount = 100
```

the expression:

```
NULL
```

is not TRUE.

The result is UNKNOWN.

That's why we need to treat NULL explicitly.

For example:

```
WHERE
♪ ♪ ♪ ♪ ♪ ♪
OR (s.amount IS NULL AND t.amount IS NOT NULL)
OR (s.amount IS NOT NULL AND t.amount IS NULL)
```

or simplified, if the field allows:

```
WHERE NVL (s.amount, -9999999)
NVL (t.amount, -999999999);
```

---

# 10. Reconciliation by Groups

In DWH aggregate reconciliation is very useful.

Example:

```
SELECT
business_date,
Currency,
COUNT (*)
SUM (amount) AS total_amount
FROM source_transactions
GROUP BY
business_date,
Currency,
```

Result:

```
DATE CUR ROWS AMOUNT
-------------------------------------
22-SEP EUR 120000 45M
22-SEP RON 310000 178M
22-SEP USD 35000 12M
```

We're comparing it to the target.

So we can quickly identify the area where the problem exists.

---

# 11. Granularity of reconciliation

A very important principle:

> You start with aggregated reconciliation and you go progressively towards the level of detail.

For example:

```
Level 1
TOTAL BANK

↓ mismatch

Level 2
BY COUNTRY

↓ mission in Romania

Level 3
BY BRANCH

↓ mismatch in Branch 007

Level 4
BY ACCOUNT

↓ mismatch account 45823

Level 5
BY TRANSACTION
```

This approach greatly reduces the time of troubleshooting.

---

# 12. Reconciliation in an ETL

A mature ETL flow can look like this:

```
SOURCE
   ↓
Extract
   ↓
STAGING
   ↓
Reconciliation # 1
   ↓
Transform
   ↓
CORE DWH
   ↓
Reconciliation # 2
   ↓
Mart date
   ↓
Reconciliation # 3
```

Therefore reconciliation is not done only at the end of the flow.

---

# 13. Source → Staging reconciliation

We're checking if the extraction was complete.

Example:

```
SOURCE.Transactions

1,500,000 rows
```

Staging:

```
STG_transactions

1,499,998 rows
```

We have:

```
difference = 2
```

We can identify the records:

```
SELECT transaction_id
FROM source_transactions

MINUS

SELECT transaction_id
FROM stg_transactions;
```

---

# 14. Staging → DWH reconciliation

Here the situation is more complicated because the data can be transformed.

Example:

Source:

```
customer_code
first_name
last_name
country
```

Target:

```
customer_sk
customer_name
country_id
```

We can't compare the tables directly anymore.

We need to use **business rules**.

For example:

```
SELECT
s.customer_code,
s.first_name - ' ' - last_name AS source_name
d.customer_name
FROM stg_customer
JOIN dim_customer d
ON d.customer_code = s.customer_code
WHERE
S.first_name - ' ' - last_name
The following shall be added to the list:
```

---

# 15. Reconciliation in SCD Type 2

For SCD2 reconciliation becomes more interesting.

Example:

```
CUSTOMER_ID
NAME
ADDRESS
VALID_FROM
VALID_TO
CURRENT_FLAG
```

Rules to be validated:

One power line:

```
SELECT customer_id
FROM dim_customer
WHERE current_flag = 'Y'
GROUPQ1QX customer_id
HAVING COUNT (*)
```

There shall be no overlapping time intervals.

Problem example:

```
customer 100

01-Jan → 30-Jun
15-Jun → 31-Dec
```

Periods overlap.

---

# 16. Financial Reconciliation

In banking or accounting systems, the most important controls are on financial values.

Example:

```
SELECT
account_id,
SUM (flow) total_debit,
SUM (credit) total_credit
FROM transactions
GROUP BY account_id;
```

We can have a control rule:

```
Opening balance
+ credits
- debits
=
Closing balance
```

I mean:

```
closing_balance =
opening_balance
+ credits
- debits
```

This kind of reconciliation is extremely important in banking.

---

# 17. Debit / Credit reconciliation

Example:

```
SELECT
SUM (debit_amount)
SUM (credit_amount)
FROM journal_entries;
```

In certain accounting systems:

```
SUM (DEBIT) = SUM (CREDIT)
```

If we have:

```
Debit = 125,000,000
Credit = 124,999,750
```

the difference:

```
250
```

indicates a problem that needs to be investigated.

---

# 18. Reconciliation for batchs

In a batch system it is very useful to keep statistics for each run.

Example table:

```
CREATE TABLE etl_batch_control (
batch_id NUMBER,
process_name VARCHAR2 (100),
source_count NUMBER,
target_count NUMBER,
rejected_count NUMBER,
source_amount NUMBER,
target_amount NUMBER,
VARCHAR2 status (30),
start_time TIMESTAMP,
end_time TIMESTAMP
);
```

Example:

```
BATCH 4501

source_count = 1,000,000
target_count = 999,950
rejected_count = 50

source_amount = 125,000,000
target_amount = 125,000,000
```

We see:

```
1,000,000
=
999,950
+
50 rejected
```

So the flow can be right.

---

# 19. Reconciliation Formula

A common rule is:

```
SOURCE
=
TARGET
+
REJECTED
+
FILTERED
```

Example:

```
Source rows 1,000,000
Target rows 995,000
Rejected 2,000
Filtered 3,000
--------------------------
Total 1,000,000
```

This is a very important rule in ETL.

---

# 20. Reject reconciliation

If certain data are rejected because of Data Quality, they must be accounted for.

Example:

```
SELECT COUNT *
FROM etl_reject;

SELECT reason_code,
COUNT *
FROM etl_reject
GROUP BY reason_code;
```

Result:

```
INVALID_DATE 125
INVALID_ACCOUNT 20
INVALID_AMOUNT 5
```

Total:

```
150 rejected rows
```

---

# 21. Duplicate Reconciliation

A very important control:

```
SELECT transaction_id,
COUNT *
FROM dwh_transactions
GROUPQ1QX transaction_id
HAVING COUNT (*)
```

If the query returns lines, we have business key duplicates.

---

# 22. Hash-based reconciliation

For large volumes we can calculate a hash of values.

Conceptual:

```
STANDARD_HASH (
customer_id
transaction_date
% 1
Currency,
'SHA256'
)
```

Example:

```
SELECT
transaction_id,
STANDARD_HASH (
transaction_id
% 1% 1% 1% 2% 1% 2% 2% 2% 2% 1% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 2% 3
Currency,
'SHA256'
) row_hash
FROM transactions;
```

We're comparing the hashish between source and target.

Advantage:

```
100 columns
```

can be represented by a single hash.

But the hashish must be carefully built, especially for:

```
NULL
data
numbers
Decimal separator
spaces
charter encoding
```

---

# 23. Example of normalization before hash

Safer:

```
STANDARD_HASH (
NVL (TO_CHAR (transaction_id), '<NULL>')
* '|' *
(TO_CHAR (amount, 'FM9999999990D00'), '<NULL>')
* '|' *
),
'SHA256'
)
```

This is how we avoid ambiguities.

---

# 24. Reconciliation table

In large projects there is often a dedicated table.

For example:

```
ETL_RECONCILIATION
```

with:

```
batch_id
process_name
business_date
source_name
target_name
source_count
target_count
difference_count
source_amount
target_amount
difference_amount
stasis
created_at
```

Example:

```
batch_id 4501
LOAD_PAYMENTS process
source_count 2,500,000
target_count 2,500,000
difference 0
source_amount 75,450,000
target_amount 75,450,000
OK status
```

---

# 25. Example of automatic calculation

```
INSERT INTO etl_reconciliation (
batch_id,
process_name,
source_count,
target_count,
difference_count,
stasis
)
SELECT
batch_id,
'LOAD_TRANSACTIONS',
♪ ♪
I can't.
♪ ♪ ♪ ♪
CASE
WHEN s.cnt = t.cnt
THEN 'OK'
ELSE 'ERROR'
END
FROM
(SELECT COUNT (*) cnt
FROM stg_transactions
WHERE batch_id =: batch_id) s,
(SELECT COUNT (*) cnt
FROM dwh_transactions
WHERE batch_id =: batch_id) t;
```

---

# 26. tolerance

Sometimes values don't have to be absolutely identical.

For example because of:

```
current conversion
rounding
floating-point calculations
```

We can accept:

```
difference is 0.01
```

Example:

```
CASE
WHEN ABS (source_amount - target_amount)
THEN 'OK'
ELSE 'ERROR'
END
```

This is called **reconciliation tolerance**.

---

# 27. Absolute vs Percenage tolerance

We can have:

### Absolutes tolerance

```
difference = 1 EUR
```

or:

### Percent tolerance

```
difference = 0.01%
```

Example:

```
ABS (source_total - target_total)
/
NULLIF (source_total, 0)
* 0.0001 *
```

---

# 28. Reconciliation status

A mature system can have:

```
OK
WARNING
ERROR
NOT_EXECUTED
```

Example:

```
difference = 0
→ OK

difference
→ WARNING

difference
→ ERROR
```

---

# 29. Reconciliation and ETL orchestration

An orchestration flow can look like this:

```
Extract
   ↓
Load Staging
   ↓
Reconciliation
   ↓
OK?
 ┌───────┴───────┐
YES NO
 ↓               ↓
Transform Stop Batch
 ↓               ↓
Load DWH Alert
```

Thus reconciliation can become an **quality gate**.

---

# 30. Reconciliation in ODI

In Oracle Data Integrator, these controls can be implemented by:

- mappings;
- procedus;
- ODI variables;
- the packages,
- scripted;
- Control tables;
- exception handling.

For example:

```
Step 1
LOAD_STAGING

Step 2
CHECK_SOURCE_COUNT

Step 3
CHECK_TARGET_COUNT

Step 4
COMPARE

Step 5

difference = 0
→ Continuous

difference! = 0
→ error / alert
```

---

# 31. Real Example DWH

We assume the flow:

```
CORE BANKING
      ↓
STG_TRANSACTION
      ↓
FACT_TRANSACTION
```

For date:

```
22-SEP-2026
```

Source:

```
rows = 5,000,000
amount = 1,250,000,000
```

Staging:

```
rows = 5,000,000
amount = 1,250,000,000
```

Fact:

```
rows = 4,999,950
amount = 1,249,950,000
```

Reject table:

```
rows = 50
amount = 50,000
```

Control:

```
source_count
=
fact_count + reject_count
```

I mean:

```
5,000,000
=
4,999,950 + 50
```

and:

```
1,250,000,000
=
1,249,950,000 + 50,000
```

Reconciliation:

```
OK
```

---

# 32. Reconciliation by Size

We can also check on:

```
country
Branch
current
product
channel
business_date
source_system
```

Example:

```
SELECT
source_system,
Currency,
(*) cnt,
SUM (amount) total_amount
FROM fact_transaction
WHERE business_date = DATE '2026-09-22'
GROUP BY
source_system,
Currency,
```

It's much more useful than a simple global total.

---

# 33. The problem of the aggregation that is compensated

We assume:

```
Transaction A

source = 100
Target = 150

Transaction B

source = 200
Target = 150
```

Total source:

```
300
```

Total target:

```
300
```

Reconciliation on SUM says:

```
OK
```

but the data is wrong.

That's why we have to combine:

```
row count
total control
business key comparison
Comparison columen
```

---

# 34. Multi-level Reconciliation

A robust strategy:

```
Level 1
Row count

Level 2
SUM / MIN / MAX

Level 3
Grouped totals

Level 4
Business key comparison

Level 5
Colour-level comparison
```

It is not effective to start directly with:

```
500 million rows × 100 columns
```

---

# 35. Reconciliation vs. Data Quality

The two concepts are close, but different.

### Data Quality

Question:

> Is the data valid?

Examples:

```
% 1
current exists
customer_id exists
data is valid
```

### Reconciliation

Question:

> Are there any consistent systems data left?

Example:

```
Total source = Target + Rejected
```

---

# 36. Reconciliation vs CDC

CDC says:

> What data have changed?

Reconciliation says:

> Were all the changes processed correctly?

Example:

```
CDC detected:

10,000 inserts
2,000 updates
500 deletes
```

After ETL we can validate:

```
10,000 inserts processed
2,000 updates processed
500 deletes processed
```

---

# 37. Reconciliation vs Audit

The audit shall respond more to:

```
Who?
What?
When?
```

Reconciliation responds to:

```
The dates match?
```

The two shall be completed.

---

# 38. Pattern recommended for ETL

A very good pattern is:

```
ETL_BATCH
    |
+ -- SOURCE_COUNT
    |
+ -- TARGET_COUNT
    |
+ -- REJECT_COUNT
    |
+ -- SOURCE_AMOUNT
    |
+ -- TARGET_AMOUNT
    |
+ -- DIFFERENCE
    |
+ -- STATUS
```

and rule:

```
SOURCE
=
TARGET
+
REJECT
+
FILTERED
```

---

# 39. Anti-patents

### 1. Only COUNT (\ *)

```
source count = target count
```

does not guarantee fairness.

### 2. Reconciliation only at the end

Better:

```
source → staging
staging → core
core → mart
```

### 3. Ignoring Rejects

There must be:

```
source
=
Target
+
reject
```

### 4. Comparison of values without NULL handling

```
a
```

does not detect all NULL cases.

### 5. Overaggregated Total Control

A global total can hide errors that make up for themselves.

---

# 40. Practical strategy of troubleshooting

If reconciliation fails:

```
STEP 1
Compare row count
```

then:

```
STEP 2
Compare grouped totals
```

for example:

```
business_date
current
source_system
```

then:

```
STEP 3
Find missing keys
```

with:

```
MINUS
```

or:

```
FULLQ1QX JOIN
```

then:

```
STEP 4
Compare Column Values
```

and finally:

```
STEP 5
Check rejected / filtered rows
```

---

# 41. Complete Example

Source:

```
STG_PAYMENT
```

Target:

```
FACT_PAYMENT
```

First:

```
SELECT COUNT (*), SUM (amount)
FROM stg_payment
WHERE batch_id = 100;
```

Target:

```
SELECT COUNT (*), SUM (amount)
FROM fact_payment
WHERE batch_id = 100;
```

If there is a difference:

```
SELECT payment_id
FROM stg_payment
WHERE batch_id = 100

MINUS

SELECT payment_id
FROM fact_payment
WHERE batch_id = 100;
```

Then we investigate the values:

```
SELECT
s.payment_id,
s.amount source_amount,
f.amount target_amount
FROM stg_payment
JOIN fact_payment f
ON f.payment_id = s.payment_id
WHERE NVL (s.amount, -1)
The following definitions apply:
```

This is a very typical ETL debuting flow.

---

## Questions and answers

### 1. What is reconciliation?

Verification that the data transferred or processed between the systems are complete and consistent.

---

### 2. Is it enough to compare COUNT (\ *)?

No.

Checks such as:

```
COUNT
SUM
MIN / MAX
business keys
Comparison columen
hash
```

---

### 3. How do you find the missing rows?

For example:

```
SELECT id
FROM

MINUS

SELECT id
FROM target;
```

or:

```
FULLQ1QX JOIN
```

---

### 4. How do you treat reject records?

A common rule:

```
SOURCE
=
TARGET
+
REJECTED
+
FILTERED
```

---

### 5. How do you reconcile for large volumes?

I'll start with:

```
Counts
aggregates
grouped control totals
```

and only if there are differences descend to business key level or row hash.

---

### 6. What is reconciliation tolerance?

An accepted difference between source and target, for example for rounding.

```
ABS (source - target)
```

---

### 7. How do you reconcile for an SCD2?

Check including:

```
single record current
Validity periods
no overlaps
expected history
```

---

## Questions and answers

**Question:**

You have a batch that charges 100 million transactions in an DWH. How do you validate that loading is correct?

A good answer:

> I'd initially avoid the row-by-row comparison because it's expensive. I'd start with control totals: row count, SUM (amount), MIN/MAX dates and possibly the number of distinct business keys. I'd do these checks on the business data, source system or maturity. If there is a difference, I lower the granularity until I identify the problem area, then I use business key comparison, MINUS or FULL OUTER JOIN to identify exactly the missing or different rows. I would also include rejected / filtered records in the reconciliation formula.

---

# 44. Oracle Exercise 26ai

We assume:

```
CREATE TABLE src_transaction (
transaction_id NUMBER,
account_id NUMBER,
amount NUMBER,
current VARCHAR2 (3)
);
```

and:

```
CREATE TABLE dwh_transaction (
transaction_id NUMBER,
account_id NUMBER,
amount NUMBER,
current VARCHAR2 (3)
);
```

Enter:

```
INSERT INTO src_transaction VALUES (1,100, 100, 'EUR');
INSERT INTO src_transaction VALUES (2.100, 200, 'EUR');
INSERT INTO src_transaction VALUES (3,200, 500, 'RON');

INSERT INTO dwh_transaction VALUES (1,100, 100, 'EUR');
INSERT INTO dwh_transaction VALUES (2.100, 250, 'EUR');

COMMIT;
```

Now check:

```
SELECT COUNT (*), SUM (amount)
FROM src_transaction;
```

and:

```
SELECT COUNT (*), SUM (amount)
FROM dwh_transaction;
```

Then:

```
SELECT transaction_id
FROM src_transaction

MINUS

SELECT transaction_id
FROM dwh_transaction;
```

It will appear:

```
3
```

Then:

```
SELECT
s.transaction_id,
s.amount source_amount,
d.amount target_amount
FROM src_transaction
JOIN dwh_transaction d
ON d.transaction_id = s.transaction_id
WHERE s.whole
```

The transaction will appear:

```
2
```

with:

```
SOURCE = 200
TARGET = 250
```

---

# 45. What you need to remember for a role of Data Developer

for review, the most important ideas are:

```
Reconciliation
        │
- "Row countries"
        │
- Control totals
► SUM
► MIN/MAX
ed DISTINCT COUNT
        │
- Business key comparison
        │
− MINUS / FULL OUTER JOIN
        │
- Colour comparison
        │
- * * * *
        │
- Reject reconciliation
        │
- - Tolerance
        │
- Batch control tables
```

The central rule for ETL is:

```
SOURCE
=
SUCCESSFULLY LOADED
+
REJECTED
+
INTENTIONALLY FILTERED
```

And for large volumes, the practical strategy is:

```
TOTAL
   ↓
GROUPED TOTAL
   ↓
BUSINESS KEY
   ↓
ROW
   ↓
COLUMN
```

This is one of the most useful approaches for real **troubleshooting in an DWH Oracle**, because it allows fast localization of the difference without starting directly with costly row-by-row comparisons.

---

## Questions and answers

### How would you briefly explain Reconciliation to a colleague who knows SQL, but not this area?

Reconciliation covers the province source and target agreement, record accounts, sums and control totals, key-set comparison with MINUS. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Reconciliation?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Reconciliation, I explicitly follow the province source and target agreement, record counts, sums and control totals, key-set comparison with MINUS and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

The source has one.
