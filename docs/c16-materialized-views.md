---
title: 'C16. Materialized Views'
description: 'Complete English handbook chapter based on the original C16 course.'
sidebar_position: 16
---

# C16. Materialized Views

<div className="chapter-kicker">Chapter C16 · Complete course</div>

## 16. Materialized Views › Oracle Database

Materialized Views are very important in Oracle, especially in **DWH / OLAP**, where we want to avoid permanent recalculation of JOIN, GROUP BY and costly aggregation.

The central idea:

> **VIEW = save the query.**
> **MATERIALIZED VIEW = saves query result.**

In Oracle, materialized Views can be used both explicitly by application and automatically by optimizer through **Query Rewrite**. Oracle 26ai supports refresh modes such as COMPLETE, FAST, FORCE, plus incremental mechanisms based on log and partition tracking.

---

## 1. What is a materialized view?

A normal VIEW:

```
CREATE VIEW v_sales AS
SELECT customer_id,
SUM (amount) total_amount
FROM sales
GROUP BY customer_id;
```

does not contain data.

Each:

```
SELECT *
FROM v_sales;
```

The Oracle is doing the SALES query again.

A materialized view:

```
CREATE MATERIALIZED VIEW mv_sales
AS
SELECT customer_id,
SUM (amount) total_amount
FROM sales
GROUP BY customer_id;
```

physically store the result.

Conceptual:

```
SALES
10,000,000 rows
      │
      ▼
MV_SALES
50,000 rows
```

Thus:

```
SELECT *
FROM mv_sales;
```

can be much faster.

---

## 2. VIEW vs MATERIALIZED VIEW

Features of views and materialized views:

| Feature | View | Materialized view |
| --- | --- | --- |
| Stores the query definition | Yes | Yes |
| Stores query results | No | Yes |
| Uses additional storage for results | No | Yes |
| Reflects base-table changes immediately | Yes | Not necessarily; it depends on refresh |
| Requires refresh | No | Yes |
| Can accelerate joins and aggregations | No, by itself | Yes, when query rewrite or direct use applies |

Essential difference:

```
VIEW
query → base tables → result

MATERIALIZED VIEW
query → already calculated result
```

---

## 3. Example DWH

We assume:

```
FACT_SALES
---------
sale_id
customer_id
product_id
sale_date
quantity
% 1
```

with:

```
500,000,000 rows
```

A report shall execute:

```
SELECT
product_id,
TRUNC (sale_date, 'MM') month
SUM (amount) return
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

Permanent calculation over 500 million rows can be costly.

We can create:

```
CREATE MATERIALIZED VIEW mv_sales_monthly
BUILD IMMEDIATE
REFRESH COMPLETE
ON DEMAND
AS
SELECT
product_id,
TRUNC (sale_date, 'MM') month
SUM (amount) return
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

Now the result of the aggregation is already stored.

---

## 4. Basic Syntax

A more complete example:

```
CREATE MATERIALIZED VIEW mv_sales_monthly
BUILD IMMEDIATE
REFRESH FAST
ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT
product_id,
TRUNC (sale_date, 'MM') month
COUNT(*) AS cnt,
SUM(amount) AS total_amount
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

The most important components are:

```
BUILD
REFRESH
ON COMMIT / ON DEMAND
QUERY REWRITE
```

---

## 5.BUILD IMMEDIATE vs BUILD DEFERRED

## BUILD IMMEDIATE

```
BUILD IMMEDIATE
```

Oracle builds MVul immediately.

```
CREATE MV
   ↓
run query
   ↓
populate MV
```

It's the usual.

---

## BUILD DEFERRED

```
BUILD DEFERRED
```

The MV structure is created, but the data is then populated.

For example:

```
CREATE MATERIALIZED VIEW mv_sales
BUILD DEFERRED
REFRESH COMPLETE
ON DEMAND
AS
SELECT...
```

After that:

```
EXEC DBMS_MVIEW.REFRESH ('MV_SALES', 'C');
```

---

## 6. Main Types of REFRESH

The Oracle primarily supports:

````
COMPLETE
FAST
FORCE
NEVER
``` :chatgpt-content-reference{index="1"}

---

# 7. COMPLETE REFRESH

```sql
REFRESH COMPLETE
````

Oracle rebuilds the MV content in the original query.

Conceptual:

```
delete / rebuild MV
        ↓
complete query
        ↓
populate again
```

Example:

```
EXEC DBMS_MVIEW.REFRESH (
'MV_SALES_MONTHLY',
'C'
);
```

C = Complete.

### Advantage

Simple and safe.

### Disadvantage

For hundreds of millions of rows:

```
very expensive
```

---

## 8. FAST REFRESH

FAST REFRESH updates only changes.

```
REFRESH FAST
```

Example:

```
FACT_SALES

500,000,000 rows
```

In the last 10 minutes:

```
10,000 modified rows
```

COMPLETE:

```
process ~ 500M
```

FAST:

```
process relevant changes
```

In the log-based incremental refresh, Oracle uses **Materialized View Logs** to identify changes.

---

## 9. Materialized View Log

For many types of FAST REFRESH, a log must be created on the source table.

Example:

```
CREATE MATERIALIZED VIEW LOG ON fact_sales
WITH ROWID, SEQUENCE
(product_id, sale_date, amount)
INCLUDING NEW VALUES;
```

Conceptual:

```
FACT_SALES
   │
* INSERT / UPDATE / DELETE
   ▼
MLOG$_FACT_SALES
   │
   ▼
FAST REFRESH
   │
   ▼
MV_SALES_MONTHLY
```

The log retains the information necessary for the incremental refresh.

---

## 10. Why INCLUDING NEW VALUES?

For aggregates, Oracle may need both old and new information.

Example:

```
amount:
100 → 130
```

To update:

```
SUM (amount)
```

The Oracle shall be able to determine the impact of the change.

That's why we meet:

```
INCLUDING NEW VALUES
```

in MV logs for certain materialized views aggregate.

---

## 11. REFRESH FORCE

```
REFRESH FORCE
```

means conceptual:

```
Maybe FAST?
   │
* * * *
   │
* * * *
```

Example:

```
CREATE MATERIALIZED VIEW mv_sales
REFRESH FORCE
ON DEMAND
AS
SELECT...
```

FORCE is also the default behaviour for the type of refresh unless otherwise specified in certain forms of MV creation.

Refresh manual:

```
EXEC DBMS_MVIEW.REFRESH (
'MV_SALES',
'?'
);
```

? represents FORCE in DBMS_MVIEW.REFRESH.

---

## 12. ON DEMAND

Very common in DWH:

```
REFRESH FAST
ON DEMAND
```

The refresh is controlled by the ETL process.

Example:

```
01: 00 LOAD FACT_SALES
01: 45 LOAD completed
01: 50 refresh MV
02: 00 reports available
```

From PL/SQL:

```
BEGIN
DBMS_MVIEW.REFRESH (
list = "'MV_SALES_MONTHLY',"
METHOD = 'F'
);
END;
/
```

---

## 13. ON COMMIT

```
REFRESH FAST
ON COMMIT
```

MV is updated when relevant transactions on source tables make COMMIT.

Example:

```
INSERT INTO sales
VALUES (...);

COMMIT;
```

can trigger the MV refresh.

Advantage:

```
MV almost permanently updated
```

Disadvantage:

```
COMMIT- becomes more expensive
```

In OLTP systems with many transactions, it should be used with care.

---

## 14. ON COMMIT vs ON DEMAND

In general:

```
OLTP
    ↓
ON COMMIT can make sense
for small MV and specific needs

DWH
    ↓
ON DEMAND is much more common
```

In DWH we often want:

```
ETL
 ↓
validation
 ↓
refresh MV
 ↓
reporting
```

---

## 15. Query Rewrite

This is one of the most powerful features.

We create:

```
CREATE MATERIALIZED VIEW mv_sales_monthly
REFRESH FAST
ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT
product_id,
TRUNC (sale_date, 'MM') month
(*) cnt,
SUM (amount) return
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

However, the application executes:

```
SELECT
product_id,
TRUNC (sale_date, 'MM'),
SUM (amount)
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

Observe:

```
SQL NU mentions MV.
```

The optimizer can transform internally:

```
FACT_SALES
```

in:

```
MV_SALES_MONTHLY
```

Oracle describes Query Rewrite exactly as a transparent transformation of the query to use precomposite results from materialized views.

Conceptual:

```
SELECT... FROM FACT_SALES
              │
              ▼
Optimizer
              │
Query Rewrite?
         /         \
DA NU
       ↓             ↓
MV_SALES_MONTHLY FACT_SALES
```

---

## 16. Why is Query Rewrite so important in DWH?

Suppose:

```
FACT_SALES = 1 billion rows

MV_SALES_MONTHLY = 200,000 rows
```

Query:

```
SELECT
product_id,
SUM (amount)
FROM fact_sales
GROUP BY product_id;
```

The optimizer can obtain the result using already aggregated data from MV, if the necessary conditions are met.

Instead of:

```
scan 1,000,000,000 rows
```

can process:

```
~ 200,000 rows
```

---

## 17. How do I check if Query Rewrite has been used?

Use the execution plan:

```
EXPLAIN PLAN FOR

SELECT
product_id,
TRUNC (sale_date, 'MM'),
SUM (amount)
FROM fact_sales
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY
);
```

You can see something in shape:

```
--------------------------------------------------------
Did you hear that?
--------------------------------------------------------
* * *
* * * *
--------------------------------------------------------
```

This shows that Oracle used the materialized view.

---

## 18. Query Rewrite does not mean you have to select MVul

That's a classic technical discussion question.

You don't have to write:

```
SELECT *
FROM mv_sales_monthly;
```

The application may continue to write:

```
SELECT...
FROM fact_sales;
```

The optimizer decides:

```
FACT_SALES query
      ↓
Optimizer
      ↓
MV available?
      ↓
Query Rewrite
      ↓
MV_SALES_MONTHLY
```

---

## 19. Materialized View with JOIN

MVs shall not be merely aggregates.

Example:

```
CREATE MATERIALIZED VIEW mv_sales_detail
BUILD IMMEDIATE
REFRESH COMPLETE
ON DEMAND
AS
SELECT
f.sale_id,
f.sale_date,
c.customer_name,
p.product_name,
f.quantity,
f.amount
FROM fact_sales f
JOIN dim_customer c
ON c.customer_id = f.customer_id
JOIN dim_product
ON p.product_id = f.product_id;
```

We're basically precomputing:

```
FACT
 +
DIMENSIONS
```

This may remove repeated JOIN-uri in reporting.

---

## 20. materialized Aggregate View

Very important in DWH.

Example:

```
CREATE MATERIALIZED VIEW mv_sales_daily
AS
SELECT
sale_date,
product_id,
COUNT (*) number_sales,
SUM (quantity) quantity,
SUM (amount) return
FROM fact_sales
GROUP BY
sale_date,
product_id;
```

These are often the most valuable MVuri for OLAP.

---

## 21. COUNT (\ *) and FAST REFRESH

One important thing about MVuri aggregate is that the definition must comply with certain conditions to allow FAST REFRESH.

For example, you will often see:

```
COUNT (*)
SUM (amount)
```

instead of just:

```
SUM (amount)
```

Example:

```
CREATE MATERIALIZED VIEW mv_sales
REFRESH FAST
AS
SELECT
product_id,
(*) cnt,
SUM (amount) total_amount
FROM sales
GROUP BY product_id;
```

Oracle has precise rules on what aggregates and constructions are compatible with fast refresh; it should not be assumed that any GROUP BY can be incremental refresh-uit.

---

## 22. How do I check that FAST REFRESH is possible?

Very useful in practice:

```
DBMS_MVIEW.EXPLAIN_MVIEW
```

Oracle recommends this procedure to determine the capabilities of an MV, including the possibility of FAST REFRESH.

For example:

```
BEGIN
DBMS_MVIEW.EXPLAIN_MVIEW (
'MV_SALES_MONTHLY'
);
END;
/
```

You can analyze the results from the explained table set up for this purpose.

Conceptual:

```
MV
 ↓
EXPLAIN_MVIEW
 ↓
FAST REFRESH possible?
QUERY REWRITE possible?
PCT possible?
...
```

---

## 23. PCT = Partition Change Tracking

Very important for large DWH-uri.

Suppose:

```
FACT_SALES

partition 2026-06
partition 2026-07
partition 2026-08
partition 2026-09
```

ETL only amends:

```
partition 2026-09
```

Why rebuild MV for all months?

Oracle may use:

```
Partition Change Tracking
```

to identify the partitions affected.

Oracle documents PCT as one of the mechanisms of incremental refresh, along with the log-based refresh and LPCT.

Conceptual:

```
FACT_SALES

Jan ¶ ¶ unchanged ¶
Feb - * unchanged *
...
Aug - unchanged
Sep - change
        │
        ▼
refresh only relevant MV data
```

---

## 24. Why Partitioning + Materialized Views go very well together?

In a big DWH we can have:

```
FACT_TRANSACTIONS
(PHP 4 = 4.1.0)
```

and ETL loads:

```
September 2026
```

If MV is properly designed:

```
Partitioned fact table
        +
Material View
        +
PCT refresh
```

it can allow refresh much more effective than full recalculation.

This is a very important pattern for Data Developer / DWH Developer.

---

## 25. FAST vs PCT

Simplified:

### log-based FAST

```
DML
 ↓
MV LOG
 ↓
modified rows
 ↓
MV
```

### PCT

```
part changed
 ↓
identity affected partition
 ↓
Relevant MV data
```

In practice the choice depends on:

```
Type of loading
partitioning
Data size
DML
MV definition
```

---

## 26. Stale Materialized Views

The materialized View can stay behind the base table.

Example:

```
10: 00 MV refreshed

10: 10 FACT_SALES modified

10: 15 MV not refresh
```

At this point:

```
FACT_SALES = fresh
MV_SALES = stale
```

This is a fundamental difference from an VIEW.

---

## 27. Status check

We can investigate the MVs in the dictionary:

```
SELECT
Owner,
mview_name,
refresh_mode,
refresh_method,
last_refresh_type,
last_refresh_date,
staleness
FROM all_mviews;
```

Or, for your own schema:

```
SELECT *
FROM user_mviews;
```

Important columns to follow:

```
MVIEW_NAME
REFRESH_MODE
REFRESH_METHOD
LAST_REFRESH_DATE
STALENESS
```

---

## 28. Refresh Manual

The most important package:

```
DBMS_MVIEW
```

Fast refresh:

```
BEGIN
DBMS_MVIEW.REFRESH (
'MV_SALES',
'F'
);
END;
/
```

Complete:

```
BEGIN
DBMS_MVIEW.REFRESH (
'MV_SALES',
'C'
);
END;
/
```

Force:

```
BEGIN
DBMS_MVIEW.REFRESH (
'MV_SALES',
'?'
);
END;
/
```

These codes are documented by DBMS_MVIEW.

---

## 29. Refreshing of multiple MVuri

For example:

```
BEGIN
DBMS_MVIEW.REFRESH (
list = "'MV_SALES_DAY,MV_SALES_MONTH,MV_CUSTOMER_SALES',"
METHOD = 'F'
);
END;
/
```

In DWH this can be part of the ETL orchestra.

---

## 30. Refresh Groups

Sometimes several MVuri must represent the same logical state of data.

The Oracle offers **refresh groups**, which allow the coordinated refresh of a set of materialized views so that they correspond to the same consistent point from a trading point of view.

Conceptual example:

```
MV_SALES
MV_CUSTOMERS
MV_PRODUCTS

      ↓

Refresh Group

      ↓

all represent
the same data state
```

---

## 31. The Real Scenario by DWH

You have:

```
STG_TRANSACTION
       ↓
ETL
       ↓
FACT_TRANSACTION
       ↓
Material Views
       ↓
BI / Reporting
```

The night process may be:

```
1. Load staging

2. Data Quality

3. MERGE dimensions

4. Load fact

5. Gas statistics

6. Refresh Materials Views

7. Validated

8. Publish date to BI
```

For example:

```
BEGIN
DBMS_MVIEW.REFRESH (
list = "'MV_TRANSACTION_DAILY',"
METHOD = 'F'
);
END;
/
```

---

## 32. Banking Example

Suppose:

```
FACT_TRANSACTION
----------------
transaction_id
account_id
customer_id
transaction_date
transaction_type
% 1
current
```

700 million transactions.

Dashboard:

```
transactions / day
amount / day
Transactions / type
% 1% 2
```

Instead of permanently calculating over FACT_TRANSACTION:

```
CREATE MATERIALIZED VIEW mv_transaction_daily
REFRESH FAST
ON DEMAND
ENABLE QUERY REWRITE
AS
SELECT
TRUNC (transaction_date) transaction_day
transaction_type,
COUNT (*) transaction_count,
SUM (amount) total_amount
FROM fact_transaction
GROUP BY
TRUNC (transaction_date)
transaction_type;
```

Report:

```
SELECT
TRUNC (transaction_date)
transaction_type,
SUM (amount)
FROM fact_transaction
GROUP BY
TRUNC (transaction_date)
transaction_type;
```

can be rewritten to MV.

---

## 33. Example ETL

At the end of ETL:

```
BEGIN

load_fact_transactions;

DBMS_MVIEW.REFRESH (
'MV_TRANSACTION_DAILY',
'F'
);

END;
/
```

Pattern:

```
source
  ↓
staging
  ↓
Transform
  ↓
fact
  ↓
refresh MV
  ↓
reporting
```

---

## 34. What if FAST REFRESH fails?

If you have:

```
REFRESH FAST
```

and MVul is not fast-refresh, the operation can fail.

If you use:

```
REFRESH FORCE
```

Oracle can try:

```
FAST
 ↓
impossible
 ↓
COMPLETE
```

This is the FORCE advantage.

But in a big DWH you have to be careful:

```
FAST = 30 sec
COMPLETE = 2 hours
```

An unexpected fallback to COMPLETE can strongly affect the batch.

---

## 35. Real production problem

technical discussion:

> The ETL normally lasted 40 minutes, but today it took three hours.

One possibility:

```
materialized View refresh
```

Investigation:

```
SELECT
mview_name,
refresh_method,
last_refresh_type,
last_refresh_date,
staleness
FROM user_mviews;
```

Discovery:

```
LAST_REFRESH_TYPE = COMPLETE
```

although you were expecting:

```
FAST
```

You're investigating:

```
MV log
structural changes
Part operations
MV definition
refresh eligibility
```

and:

```
DBMS_MVIEW.EXPLAIN_MVIEW
```

This is a very good technical discussion scenario.

---

## 36. Costs of a Materialized View

MVs are not free.

You win:

```
SELECT phaser
faster aggregation
faster reporting
```

but you pay by:

```
Storage
refresh cost
MV logs
ETL
administration
potential state date
```

So there's a betrayal-off:

```
query performance
      ↑

maintenance cost
      ↑
```

---

## 37. Materialized View vs Index

It doesn't solve the same problem.

Index:

```
help find lines
```

MV:

```
precalculate results
```

Example:

```
WHERE customer_id = 123
```

→ probably index.

But:

```
GROUP BY product_id
SUM (amount)
JOIN 5 tables
```

→ an MV can be much more effective.

---

## 38. Materialized View vs Partitioning

Partitioning:

```
reduce scanned data
handle large tables
partition pruning
Part maintenance
```

materialized view:

```
precompounds
```

In a performance DWH:

```
Partitioning
     +
Index
     +
Material Views
     +
Query Rewrite
     +
Optimizer Statistics
```

are complementary.

---

## 39. Materialized View vs Result Cache

Conceptual difference:

```
Cache result
    ↓
temporary cache of results

Material View
    ↓
persistent DB object,
manageable and refresh
```

For stable DWH aggregation:

```
Material View
```

is usually the relevant mechanism.

---

## 42. Oracle Exercise 26ai

You can do this exercise directly in DEV_LAB.

### Step 1

```
CREATE TABLE mv_sales_test (
sale_id NUMBER PRIMARY KEY,
product_id NUMBER,
sale_date DATE,
amount NUMBER (12.2)
);
```

---

### Step 2

```
INSERT INTO mv_sales_test
SELECT
LEVEL,
MOD (LEVEL, 100) + 1,
DATE '2026-01-01' + MOD (LEVEL, 200)
ROUND (DBMS_RANDOM.VALUE (10,1000), 2)
FROM dual
CONNECT BY LEVEL

COMMIT;
```

---

### Step 3

```
SELECT
product_id,
TRUNC (sale_date, 'MM') month
(*) cnt,
SUM (amount) return
FROM mv_sales_test
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

---

### Step 4

```
CREATE MATERIALIZED VIEW mv_sales_monthly_test
BUILD IMMEDIATE
REFRESH COMPLETE
ON DEMAND
AS
SELECT
product_id,
TRUNC (sale_date, 'MM') month
(*) cnt,
SUM (amount) return
FROM mv_sales_test
GROUP BY
product_id,
TRUNC (sale_date, 'MM');
```

---

### Step 5

Check:

```
SELECT *
FROM mv_sales_monthly_test
ORDER BY month, product_id;
```

---

### Step 6

Change the table:

```
INSERT INTO mv_sales_test
VALUES (
100001,
10,
DATE '2026-09-23',
500
);

COMMIT;
```

MV is not automatically updated because it is:

```
ON DEMAND
```

---

### Step 7

REFRESH:

```
BEGIN
DBMS_MVIEW.REFRESH (
'MV_SALES_MONTHLY_TEST',
'C'
);
END;
/
```

---

### Step 8

Check the metadata:

```
SELECT
mview_name,
refresh_mode,
refresh_method,
last_refresh_type,
last_refresh_date,
staleness
FROM user_mviews
WHERE mview_name = 'MV_SALES_MONTHLY_TEST';
```

---

## 43. Next exercise: FAST REFRESH

Once the above example works, the following level is:

```
MV LOG
   ↓
FAST REFRESH
   ↓
QUERY REWRITE
   ↓
DBMS_XPLAN
```

This is where it really gets interesting for review of **Oracle Data Developer**.

---

## 44. Mental scheme to remember

```
MATERIALIZED VIEW
                           │
          ┌────────────────┼────────────────┐
          │                │                │
BUILD REFRESH QUERY REWRITE
          │                │                │
IMMEDIATE COMPLETE Optimizer
DEFERRED FAST
FORCE
PCT uses MV
                         │
               ┌─────────┴─────────┐
               │                   │
ON COMMIT ON DEMAND
                                   │
                                   ▼
DBMS_MVIEW
```

And for DWH:

```
SOURCE
   ↓
STAGING
   ↓
ETL / ELT
   ↓
DIM + FACT
   ↓
PARTITIONING
   ↓
MATERIALIZED VIEWS
   ↓
QUERY REWRITE
   ↓
BI / REPORTING
```

## Questions and answers

### 1. What is a materialized view?

> A materialized view is an Oracle database object that physically stores the result of a query. It can be refreshed periodically and is commonly used to precompute expensive joins and aggregations.

---

### 2. The Difference between View and materialized View?

> The View stores the definition of the query, while the materialized View stores the result of the query.

---

### 3. What does COMPLETE REFRESH mean?

> The Oracle recalculates the entire MV content from its query.

---

### 4. What is FAST REFRESH?

> An incremental refresh by which only relevant changes from the last refresh are processed.

---

### 5. What is Materialized View Log?

> An object associated with the source table which keeps information about changes required for certain types of FAST REFRESH.

---

### 6.FAST vs FORCE?

```
FAST
→ must be able to make incremental refresh.

FORCE
→ try FAST;
If a fast refresh is not possible, Oracle performs a complete refresh.
```

---

### 7. ON COMMIT vs ON DEMAND?

```
ON COMMIT
→ refresh after relevant comms.

ON DEMAND
→ explicit refresh / programmed.
```

---

### 8. What is Query Rewrite?

> The Optimizer can turn transparent a query written over the base tables so as to use an equivalent and more efficient materialized view.

---

### 9. How do you check if an MV can do FAST REFRESH?

```
DBMS_MVIEW.EXPLAIN_MVIEW
```

---

### 10. How do you do refresh manually?

```
EXEC DBMS_MVIEW.REFRESH ('MV_NAME', 'F');
```

---

> We have an FACT table of 2 billion rows and reports that aggregate monthly sales. How would you optimize it?

A good answer:

```
1. I'm checking the FACT partitioning
2. check execution plans
3. I create, if the workload justifies it,
a Materialized Aggregate View
4. use FAST/PCT refresh where possible
5. create MV logs if needed
6. ENABLE QUERY REWRITE
7. Synchronizing the ETL refresh
8. check statistics
9. check DBMS_XPLAN for Query Rewrite
```

---

If you only remember **6 things** from this module, these are:

1. **Materialized View = result of the physically stored query.**
2. **COMPLETE = reconstruction; FAST = incremental; FORCE = FAST if possible, otherwise COMPLETE.**
3. **MV Logs are frequently required for FAST refresh based on changes.**
4. **ON COMMIT** updates on commit, and **ON DEMAND** is explicitly controlled and is very common in DWH.
5. **Query Rewrite** allows the optimizer to use a materialized view without requiring the application to reference it explicitly.
6. For large DWHs, the important combination is **Partitioning + FAST/PCT refresh + materialized Views + Query Rewrite**.

The next useful step in the course would be to do **17. Parallel Execution**, because it connects directly to large volumes, DWH, partitioning and the Refresher Materialized Views.

---

### How would you briefly explain materialized views to a colleague who knows SQL, but not this area?

The materialized Views covers precomputer query results, complete vs fast refresh, materialized view logs. In practice, first determine what data enters and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to materialized views?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For materialized views, I explicitly follow precomputer query results, complete vs fast refresh, materialized view logs and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, materialized views occurs along with logging, auditing, reconciliation and impact analysis.
