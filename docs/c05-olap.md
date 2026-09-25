---
title: 'C05. OLAP'
description: 'Complete English handbook chapter based on the original C05 course.'
sidebar_position: 5
---

# C05. OLAP

<div className="chapter-kicker">Chapter C05 · Complete course</div>

OLAP stands for **Online Analytical Processing** and refers to workloads oriented toward **analysis, reporting, aggregation, and exploration of large data volumes**.

It is especially important for a **Data Developer / DWH Developer**, because many Data Warehouse queries are OLAP-oriented.

---

## 1. What OLAP is

In an OLAP system, the primary focus is not on:

- entering an order;
- modifying a customer record;
- paying an invoice;
- updating an individual account balance.

These are **OLTP** activities.

In OLAP the questions are of the form:

> What were the total sales per region in the last 3 years?

or:

> How did the average monthly balance of corporate clients evolve?

or:

> What is the difference between the volume of transactions in the current month and the same month last year?

So:

```
OLTP
client → operation → individual transaction

OLAP
million transactions
        ↓
aggregation
        ↓
indicators
        ↓
analysis / reporting / BI
```

---

## 2. OLTP vs OLAP

The distinction is fundamental.

Features of OLTP and OLAP
- - - - - - - - -
For operational purposes and analysis
= = sync, corrected by elderman = =
Processed rows, few, many
INSERT/UPDATE
= = sync, corrected by elderman = = @ elder _ man
Current data and historical data
The model is normalized by dimension.
Many and small transactions are small and large
* * * * *
* * * *
Users and users
Examples of "banking transfer system" are DWH / reporting

Example OLTP:

```sql
SELECT *
FROM accounts
WHERE account_id = 12345;
```

Oracle will probably try:

```
INDEUNIQUE SCAN
TABLE ACCESS BY INDEX ROWID
```

Example OLAP:

```sql
SELECT region_id,
       SUM(amount) AS total_amount
FROM sales
WHERE sale_date >= DATE '2025-01-01'
  AND sale_date <  DATE '2025-01-02'
GROUP BY region_id;
```

This is where millions of rows can be processed.

The plan may contain:

```text
TABLE ACCESS FULL
HASH GROUP BY
```

And this isn't necessarily bad.

---

## 3. Dimensional Model

OLAP is very closely linked to **dimensional modelling**.

Conceptually, we have:

```
            DIM_DATE
                |
                |
DIM_CUSTOMER -- FACT_SALES -- DIM_PRODUCT
                |
                |
            DIM_REGION
```

The central table is:

```
FACT_SALES
```

The surrounding tables:

```
DIM_DATE
DIM_CUSTOMER
DIM_PRODUCT
DIM_REGION
```

This is one:

> **Star Schema**

---

## 4. Fact Table

A **fact table** contains measurable business events.

Example:

```text
FACT_TRANSACTION
--------------------------------
transaction_key
date_key
customer_key
account_key
branch_key
amount
fee
quantity
```

It usually contains:

- foreign keys to dimensions;
- numeric measures;
- a large number of rows.

Example:

```sql
SELECT COUNT(*)
FROM fact_transaction;
```

can return:

```
850,000,000
```

rows.

---

## 5. Measures

A **measure** is a measurable value.

Examples:

```text
amount
quantity
revenue
cost
profit
balance
fee
```

Measures are typically aggregated using:

```sql
SUM(amount)
AVG(amount)
MIN (amount)
MAX (amount)
COUNT(*)
```

Example:

```sql
SELECT customer_key,
       SUM(amount) AS total_amount
FROM fact_transaction
GROUP BY customer_key;
```

---

## 6. Sizes

Dimensions provide descriptive context for facts and measures.

For example:

```
DIM_CUSTOMER
-------------
customer_key
customer_id
customer_name
customer_type
segment
country
```

or:

```
DIM_DATE
--------
date_key
full_date
day
month
quarter
year
```

This way we can respond to:

> Total transactions per customer, month and country.

```sql
SELECT d.year,
       d.month,
       c.country,
       SUM(f.amount) AS total_amount
FROM fact_transaction f
JOIN dim_date d
  ON f.date_key = d.date_key
JOIN dim_customer c
  ON f.customer_key = c.customer_key
GROUP BY d.year,
         d.month,
         c.country;
```

---

## 7. Grain is one of the most important concepts

**Grain** says:

> What exactly does one row in the fact table represent?

Example:

```
FACT_TRANSACTION
```

Its grain can be:

> a row = a bank transaction.

But:

```
FACT_DAILY_ACCOUNT_BALANCE
```

may have:

> a row = balance of an account in a given day.

The grain should be established **before designing the fact table**.

For example:

```
FACT_DAILY_BALANCE

date_key
account_key
balance
```

The logical uniqueness could be:

```
date_key + account_key
```

---

## 8. Star Schema

The most common OLAP model is:

```
DIM_DATE
                  |
                  |
DIM_CUSTOMER -- FACT_TRANSACTION -- DIM_ACCOUNT
                  |
                  |
DIM_BRANCH
```

The advantages are:

- easy-to-understand queries;
- simple joins;
- fast reporting;
- appropriate for BI;
- efficient optimization opportunities.

---

## 9. Snowflake Schema

One option is:

```
FACT_SALES
    |
DIM_PRODUCT
    |
DIM_CATEGORY
    |
DIM_DEPARTMENT
```

Dimensions are normalized.

This is called:

> Snowflake Schema

Comparative:

```
STAR
denormalized dimensions

SNOWFLAKE
normalized dimensions
```

In practice, the star schema is often preferred for analytics because it simplifies queries.

---

## 10. Aggregation of the basic OLAP operation

OLAP means very much:

```sql
GROUP BY
```

Example:

```sql
SELECT
region_id,
SUM(amount)
FROM sales
GROUP BY region_id;
```

Result:

```
REGION SUM
------------------
RO 1250000
FR 930000
DE 2100000
```

---

## 11. GROUP BY on multiple levels

```sql
SELECT
year,
month,
region,
SUM(amount)
FROM sales
GROUP BY
year,
month,
region,
```

Conceptual:

```
2026
* * *
● RO
► DE
 │
- February
− RO
- DE
```

---

## 12.ROLLUP

ROLLUP generates hierarchical subtotals.

```sql
SELECT
year,
month,
SUM(amount)
FROM sales
GROUP BY ROLLUP (year, month);
```

The result may be:

```
2025 JAN 100
2025 FEB 150
2025 NULL 250

2026 JAN 200
2026 FEB 300
2026 NULL 500

NULL NULL 750
```

We have:

```
month
 ↓
year
 ↓
grand total
```

Very common in reporting.

---

## 13. CUBE

CUBE calculates all possible combinations of aggregation.

```sql
SELECT
region,
product,
SUM(amount)
FROM sales
GROUP BY CUBE (region, product);
```

It can produce:

```
region + product
region
product
grand total
```

Conceptual:

```
RO + Laptop
RO + Phone

DE + Laptop
DE + Phone

Total RO
Total DE

Total laptop
Total Phone

Grand Total
```

---

## 14. ROLLUP vs CUBE

Important difference:

```
ROLLUP
hierarchical aggregation
```

for example:

```
year → month → day
```

Instead:

```
CUBE
all combinations
```

for example:

```
region
product
region + product
total
```

---

## 15. GROUPING SETS

If you do not want every combination generated by `CUBE`, `GROUPING SETS` lets you specify exactly which aggregations to produce.

```sql
SELECT region,
       product,
       SUM(amount) AS total_amount
FROM sales
GROUP BY GROUPING SETS (
    (region, product),
    (region),
    (product),
    ()
);
```

It is very useful in complex OLAP queries.

---

## 16. Analytical Functions

Analytic functions are fundamental in OLAP.

Example:

```sql
SUM(amount) OVER (...)
```

The difference from GROUP BY is essential.

GROUP BY:

```sql
SELECT
customer_id,
SUM(amount)
FROM transactions
GROUP BY customer_id;
```

`GROUP BY` reduces multiple input rows to one row per group.

Analytic function:

```sql
SELECT transaction_id,
       customer_id,
       amount,
       SUM(amount) OVER (
           PARTITION BY customer_id
       ) AS customer_total
FROM transactions;
```

keeps each individual transaction row.

---

## 17. PARTITION BY

Example:

```sql
SUM(amount) OVER (
    PARTITION BY customer_id
)
```

It means conceptually:

```
customer 101
----------------
100
200
300
TOTAL = 600

customer 102
----------------
50
70
TOTAL = 120
```

Each individual row remains in the result.

---

## 18. Total Running

Very common OLAP example:

```sql
SELECT account_id,
       transaction_date,
       amount,
       SUM(amount) OVER (
           PARTITION BY account_id
           ORDER BY transaction_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM transactions;
```

Result:

```text
DATE        AMOUNT   RUNNING_TOTAL
----------------------------------
01-Jan      100      100
02-Jan       50      150
03-Jan      -20      130
```

---

## 19. ROW_NUMBER

Very often used for:

> the latest row per entity.

```sql
SELECT *
FROM (
    SELECT t.*,
           ROW_NUMBER() OVER (
               PARTITION BY account_id
               ORDER BY transaction_date DESC
           ) AS rn
    FROM transactions t
)
WHERE rn = 1;
```

Pattern:

```
latest row per account
latest status per customer
latest transaction per card
```

This is a very common Data Warehouse pattern.

---

## 20. RANK and DENSE_RANK

Example:

```sql
SELECT customer_id,
       revenue,
       RANK() OVER (
           ORDER BY revenue DESC
       ) AS rnk
FROM customer_revenue;
```

Difference:

```
RANK

100 →
100 →
90 → 3
```

versus:

```
DENSE_RANK

100 →
100 →
90 → 2
```

---

## 21. LAG

LAG allows access to the previous row.

Very useful for time comparisons.

```sql
SELECT month,
       revenue,
       LAG(revenue) OVER (
           ORDER BY month
       ) AS previous_revenue
FROM monthly_sales;
```

Result:

```
MONTH  PREVIOUS
--------------------------
Jan 1000 NULL
Feb 1200 1000
Mar 1500 1200
```

We can calculate growth:

```sql
revenue - LAG(revenue) OVER (ORDER BY month)
```

---

## 22. LEAD

LEAD is accessing the next row.

```
LEAD (amount) OVER (
ORDER  transaction_date
)
```

Useful for:

- the next transaction;
- the next status;
- interval/range calculations;
- detection of changes.

---

## 23. Year-over-Year Analysis

Pattern OLAP very important:

```
YoY = Year over Year
```

Conceptual example:

```
Revenue 2025 = 10M
Revenue 2026 = 12M

Growth = + 20%
```

SQL:

```sql
SELECT year,
       revenue,
       LAG(revenue) OVER (
           ORDER BY year
       ) AS previous_year,
       ROUND(
           (
               revenue /
               NULLIF(LAG(revenue) OVER (ORDER BY year), 0)
               - 1
           ) * 100,
           2
       ) AS growth_pct
FROM yearly_sales;
```

---

## 24. Moving Average

Other classic OLAP pattern:

```sql
AVG(amount) OVER (
    ORDER BY transaction_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
)
```

This produces a:

> moving average over 7 observations.

Very used in:

- trend analysis;
- risk;
- forecasting;
- monitoring.

---

## 25. PIVOT

OLAP frequently involves transformation:

```
MONTH  SALES
JAN A 100
JAN B 200
FEB A 150
FEB B 250
```

in:

```
MONTH A B
JAN 100 200
FEB 150 250
```

Oracle offers:

```sql
SELECT *
FROM sales
PIVOT (
    SUM(amount)
    FOR product IN (
        'A' AS A,
        'B' AS B
    )
);
```

---

## 26. Slice

Classic OLAP term.

We're assuming a cube:

```
TIME
PRODUCT
REGION
```

A **slice** means fixing one dimension to a specific value.

For example:

```
YEAR = 2026
```

and we look at:

```
PRODUCT × REGION
```

SQL:

```sql
WHERE year = 2026
```

---

## 27. Dice

Dice means selecting a multi-dimensional subset.

For example:

```sql
WHERE year IN (2025, 2026)
AND region IN ('RO', 'DE')
AND product_category = 'Electronics'
```

---

## 28. Drill-down

It means going down to more detail.

```
Year
 ↓
Quarter
 ↓
month
 ↓
Day
```

Example:

```
2026
```

becomes:

```
Q1
Q2
Q3
Q4
```

then:

```
January
February
March
```

---

## 29. Rolls-up

This is the reverse of drill-down.

```
Day
 ↓
month
 ↓
Quarter
 ↓
Year
```

We move from detailed data to higher-level aggregation.

---

## 30. Drill-through

Drill-down:

```
Year → month → Day
```

Drill-through navigates from an aggregate to the detailed underlying records.

For example:

```
Revenue România = 5M
```

click:

```
Bucharest = 2M
Cluj = 1M
...
```

then:

```
transaction_id
customer
invoice
% 1
```

---

## 31. OLAP Cube

Conceptually we can have:

```
TIME
               ^
               |
               |
              /|
             / |
            /  |
           +---+
          /   /|
         /   / |
        +---+  |
        |   |  +
        |   | /
        |   |/
        +---+
PRODUCT → REGION
```

Each cell contains a measure such as:

```sql
SUM(SALES)
```

Dimensions:

```
TIME
PRODUCT
REGION
```

Measure:

```
SALES
```

---

## 32. OLAP in Modern Oracle

Today OLAP does not necessarily mean a separate physical cube.

Many OLAP systems are implemented directly over:

```
Oracle Database
        ↓
Star Schema
        ↓
Fact + Dimension
        ↓
SQL analytic queries
        ↓
BI
```

With:

```sql
GROUP BY
analytic functions
partitioning
parallelism
materialized views
columnar / in-memory techniques
```

---

## 33. Full Table Scan is not bad in OLAP

This is a fundamental difference from OLTP.

Suppose:

```
FACT_TRANSACTION
500 million rows
```

Query:

```sql
SELECT SUM(amount)
FROM fact_transaction
WHERE transaction_date >= DATE '2026-01-01'
  AND transaction_date <  DATE '2027-01-01';
```

If 300 million rows must be read, indexed access may be slower than:

```text
TABLE ACCESS FULL
```

or:

```text
PARTITION RANGE SCAN
```

In OLAP:

> scanning a large volume of data can be exactly the right plan.

---

## 34. HASH JOIN

A very important join method for OLAP is:

```
HASH JOIN
```

Example:

```sql
SELECT c.segment,
       SUM(f.amount) AS total_amount
FROM fact_transaction f
JOIN dim_customer c
  ON f.customer_key = c.customer_key
GROUP BY c.segment;
```

If:

```
FACT_TRANSACTION = 500M rows
DIM_CUSTOMER = 2M rows
```

Oracle may use:

```
HASH JOIN
```

Conceptual:

```
dimension
   ↓
build hash table

fact
   ↓
scan
   ↓
probe hash table
```

For large volumes it is often more effective than Nested Loops.

---

## 35. Nested Loops vs Hash Join

Simplified:

```
Nested Loops
→ Few rows
→ Lookups
→ OLTP
```

```
Hash Join
→ many rows
→ scans
→ OLAP / DWH
```

It's not an absolute rule, but it's a very good mental model.

---

## 36. Partitioning

Very important in OLAP.

Example:

```
FACT_TRANSACTION

P202401
P202402
P202403
...
P202612
```

Query:

```sql
SELECT SUM(amount)
FROM fact_transaction
WHERE transaction_date >= DATE '2026-01-01'
  AND transaction_date <  DATE '2026-02-01';
```

Oracle may access only:

```
P202601
```

This phenomenon is called:

> **Partition Pruning**

---

## 37. Why are we partitioning fact tables

For:

- query performance;
- partition pruning;
- easier loading and maintenance;
- archiving;
- deletion of old data;
- parallelism;
- administration.

Large fact tables are commonly partitioned by time.

---

## 38. Bitmap Index

In some DWH/OLAP workloads, columns may have low cardinality:

```
gender
status
customer_type
region
risk_category
```

Example:

```
status:
ACTIVE
INACTIVE
BLOCKED
```

A:

```
BITMAP INDEX
```

can be effective in such scenarios.

But bitmap indexes are inappropriate for tables with many competing updates.

Therefore:

```
OLAP / DWH → possibly very useful
OLTP → usually avoided
```

---

## 39. Materialized Views

Suppose the report:

```sql
SELECT month,
       region,
       SUM(amount) AS total_amount
FROM fact_sales
GROUP BY month,
         region;
```

may read hundreds of millions of rows.

We can create:

```sql
CREATE MATERIALIZED VIEW mv_monthly_sales
AS
SELECT month,
       region,
       SUM(amount) AS total_amount
FROM fact_sales
GROUP BY month,
         region;
```

The report can then query a much smaller pre-aggregated data set.

---

## 40. Query Rewrite

Oracle can sometimes transparently rewrite a query against the fact table to use a compatible materialized view.

Conceptual:

```
USER QUERY

FACT_SALES
GROUP  MONTH
```

Optimizer:

```
There is MV_MONTHLY_SALES
```

and may use:

```
MV_MONTHLY_SALES
```

This mechanism is called:

> Query Rewrite.

---

## 41. Parallel Execution

OLAP processes large volumes of data, so it can benefit from parallelism.

Conceptual:

```
500M rows

Worker 1 → partition 1
Worker 2 → partition 2
Worker 3 → partition 3
Worker 4 → partition 4
```

SQL:

```sql
SELECT /*+ PARALLEL(f, 4) */
       SUM(amount)
FROM fact_transaction f;
```

But the hint should not be used automatically without understanding the system.

---

## 42. Predicate Pushdown

The principle is simple:

> Filter as early as possible.

If we have:

```
500M transactions
```

but the report only wants:

```
Romania
2026
corporate customers
```

It is ideal for filters to quickly reduce the processed volume.

The optimizer often tries to push predicates as close as possible to the data source.

---

## 43. Cardinal and selectivity

These concepts are critical for the optimizer.

Example:

```
gender
M/F
```

This column has low cardinality.

```
transaction_id
```

This column has very high cardinality.

Selectivity

```sql
WHERE transaction_id = 123
```

very selective.

But:

```sql
WHERE year = 2026
```

may select:

```
30% of the table
```

and then an index may not be advantageous.

---

## 44. Why statistics are critical

The optimizer must estimate:

```
How many rows pass the filter?
```

For example:

```sql
WHERE status = 'ACTIVE'
```

If Oracle estimates:

```
100 rows
```

But in reality there are:

```
200,000,000 rows
```

Oracle may choose a completely inappropriate plan.

This is why statistics are very important in DWH.

---

## 45. ETL and OLAP

OLAP data usually originates from OLTP systems.

Typical flow:

```
OLTP
 │
(PHP 4 = 4.1.0)
 ▼
STAGING
 │
Transform
 ▼
DWH
 │
− DIM_CUSTOMER
− DIM_ACCOUNT
− DIM_DATE
 │
- FACT_TRANSACTION
        │
        ▼
OLAP
        │
        ▼
BI
```

---

## 46. Incremental Lead

We do not want to reload the entire DWH every day.

Example:

```
FACT_TRANSACTION
500M rows
```

Today there are:

```
2M new transactions
```

We load only those 2 million new transactions.

Pattern:

```
SOURCE
WHERE last_update
```

This is:

> incremental load.

---

## 47. SCD and OLAP

Dimension history must be preserved when historical analysis requires it.

Example:

Client:

```
2024
Segment = RETAIL

2026
Segment = PREMIUM
```

With **SCD Type 2** we can maintain both states.

```
CUSTOMER_KEY SEGMENT VALID_FROM VALID_TO
------------------------------------------------
101 RETAIL 2024 2025
932 PREMIUM 2026 NULL
```

Historical reports can then reflect the dimension values that were valid during each period.

---

## 48. Full OLAP banking example

We assume:

```text
FACT_TRANSACTION

transaction_key
date_key
customer_key
account_key
branch_key
amount
transaction_type_key
```

Dimensions:

```
DIM_DATE
DIM_CUSTOMER
DIM_ACCOUNT
DIM_BRANCH
DIM_TRANSACTION_TYPE
```

Business asks:

> What is the monthly value of transactions for each customer segment?

```sql
SELECT d.year,
       d.month,
       c.segment,
       SUM(f.amount) AS total_amount
FROM fact_transaction f
JOIN dim_date d
  ON d.date_key = f.date_key
JOIN dim_customer c
  ON c.customer_key = f.customer_key
GROUP BY d.year,
         d.month,
         c.segment
ORDER BY d.year,
         d.month,
         c.segment;
```

This is a classic OLAP query.

---

## 49. Add comparison to previous month

```sql
WITH monthly AS (
    SELECT d.year,
           d.month,
           c.segment,
           SUM(f.amount) AS total_amount
    FROM fact_transaction f
    JOIN dim_date d
      ON d.date_key = f.date_key
    JOIN dim_customer c
      ON c.customer_key = f.customer_key
    GROUP BY d.year,
             d.month,
             c.segment
)
SELECT year,
       month,
       segment,
       total_amount,
       LAG(total_amount) OVER (
           PARTITION BY segment
           ORDER BY year, month
       ) AS previous_month
FROM monthly;
```

Here we combine:

```
aggregation
+
analytic function
```

This is an extremely common analytics pattern.

---

## 50. Pattern OLAP very important: Aggregate → Analyze

OLAP queries often use two phases.

First:

```
aggregation
```

then:

```
analytic functions
```

For example:

```sql
WITH monthly_sales AS (
    SELECT customer_id,
           month,
           SUM(amount) AS amount
    FROM sales
    GROUP BY customer_id,
             month
)
SELECT customer_id,
       month,
       amount,
       LAG(amount) OVER (
           PARTITION BY customer_id
           ORDER BY month
       ) AS previous_month
FROM monthly_sales;
```

Mental model:

```
RAW DATA
   ↓
GROUP BY
   ↓
AGGREGATED DATA
   ↓
ANALYTIC FUNCTIONS
   ↓
REPORT
```

This pattern is worth remembering.

---

## 51. Pattern: Top N per group

Question:

> Top 3 customers per region.

```sql
WITH revenue AS
(
SELECT
region,
customer_id,
SUM(amount) total_amount
FROM sales
GROUP BY
region,
customer_id
),
ranked AS
(
SELECT
r.*,
ROW_NUMBER() OVER
PARTITION BY region
ORDER BY total_amount DESC
) rn
FROM revenue
)
SELECT *
FROM ranked
WHERE rn <= 3;
```

Pattern:

```sql
GROUP BY
    ↓
ROW_NUMBER
    ↓
Top N per group
```

Very common in interviews.

---

## 52. Pattern: Detection of changes

Example:

```sql
SELECT customer_id,
       status_date,
       status,
       LAG(status) OVER (
           PARTITION BY customer_id
           ORDER BY status_date
       ) AS previous_status
FROM customer_status;
```

Then:

```sql
WHERE status <> previous_status
```

Conceptually we can detect:

```
ACTIVE → BLOCKED
BLOCKED → ACTIVE
```

---

## 53. Trap: GROUP BY too early

Assume we have:

```
customer
transactions
accounts
```

If we join at the wrong grain:

```
1 customer
10 accounts
100 transactions
```

We can artificially multiply the ranks.

Result:

```sql
SUM(amount)
```

becomes incorrect.

OLAP should always be checked:

> What is the grain of each data set?

---

## 54. Trap: Join that multiplies invoices

Example:

```
FACT_SALES
1 row

DIM_PROMOTION
3 accidentally matching rows
```

JOIN:

```
1 × 3
```

does that:

```
sales_amount = 100
```

become:

```
300
```

in aggregation.

This is one of the most dangerous DWH bugs because aggregates may still look plausible.

---

## 55. Trap: SUM(DISTINCT amount)

Sometimes someone tries to solve the doubles with:

```sql
SUM(DISTINCT amount)
```

This is usually **not** the correct solution.

If two valid transactions have:

```
100
100
```

SUM(DISTINCT) revenue:

```
100
```

for:

```
200
```

We need to fix the join or the grain.

---

## 56. Trap: function on filtered column

Example:

```sql
WHERE TRUNC (transaction_date) =
DATE '2026-09-23'
```

may prevent efficient use of a normal index and can also interfere with partition pruning.

Often it is preferable:

```sql
WHERE transaction_date >= DATE '2026-09-23'
  AND transaction_date <  DATE '2026-09-24'
```

In DWH workloads, this can also matter for partition pruning.

---

## 57. OLAP and execution plans

In OLAP you have to get used to seeing:

```text
TABLE ACCESS FULL
PARTITION RANGE
HASH JOIN
HASH GROUP BY
SORT GROUP BY
WINDOW SORT
PX COORDINATOR
```

For example:

```text
SELECT STATEMENT
HASH GROUP BY
HASH JOIN
TABLE ACCESS FULL DIM_CUSTOMER
PARTITION RANGE ITERATOR
TABLE ACCESS FULL FACT_TRANSACTION
```

Read from the bottom up:

```
FACT_TRANSACTION
+
DIM_CUSTOMER
      ↓
HASH JOIN
      ↓
GROUP BY
      ↓
result
```

---

## 58. What to follow in OLAP plans

You don't just ask:

> Does it use an index?

But:

```
How many rows are read?
How many rows remain after each operation?
Is partition pruning happening?
What join method is chosen?
Where does the sorting come from?
Is there spill on TEMP?
Are the optimizer's estimates accurate?
Is there parallel execution?
```

This is a much better way to analyze a DWH query.

---

## Questions and answers

### What is OLAP?

A concise answer:

> OLAP is the analytical processing of large data volumes, optimized for complex queries, aggregation, historical analysis and reporting, unlike OLTP, which is optimized for short and competing operational transactions.

---

### What is the difference between OLTP and OLAP?

You can answer:

> OLTP is oriented towards individual operations and frequent changes in data, while OLAP is oriented towards reading and aggregation of large volumes of data, usually historical.

---

### What is the grain of a fact table?

> The Grain defines exactly what is a line of fact tables and must be established before measures and dimensions are defined.

---

### Why are hash joins used in DWH?

> Because they are effective when large volumes of data need to be combined, as opposed to nested loops, which are often more effective for very selective lookups.

---

### Is Full Table Scan bad?

Good answer:

> No. In OLAP workloads, if a large part of the table needs to be processed, Full Table Scan or Partition Scan can be more efficient than access by index.

---

### ROLLUP vs CUBE?

> ROLLUP produces hierarchical aggregation, while CUBE generates aggregation for all specified dimensional combinations.

---

### GROUP BY vs analytic functions?

> GROUP BY reduces the number of rows by aggregation, while analytic functions calculate values over a set of rows keeping individual rows in result.

---

## 60. Mental Model for OLAP

I would remember OLAP as follows:

```
SOURCE SYSTEMS
      ↓
ETL
      ↓
DWH
      ↓
FACT + DIMENSIONS
      ↓
STAR SCHEMA
      ↓
LARGE SCANS
      ↓
HASH JOINS
      ↓
AGGREGATION
      ↓
GROUP BY
ROLLUP
CUBE
      ↓
ANALYTIC FUNCTIONS
ROW_NUMBER
LAG / LEAD
SUM OVER
      ↓
BI / REPORTING
```

---

## 61. The most important things to remember

If you had to remember only **12 OLAP concepts**, these would be:

1. **OLAP = analysis, aggregation, and historical reporting**, not operational transactions.
2. Data is often organized into **fact tables + dimensions**.
3. You must clearly understand the **grain** of each fact table.
4. **Star Schema** is the fundamental dimensional model.
5. GROUP BY is the foundation of aggregation.
6. ROLLUP, CUBE and GROUPING SETS allow for multidimensional aggregation.
7. Analytic functions such as `ROW_NUMBER`, `RANK`, `LAG`, `LEAD`, and `SUM OVER` are essential.
8. The **Aggregate → Analyze** pattern occurs frequently.
9. For large volumes, **HASH JOIN** is very important.
10. **A **Full Table Scan is not automatically bad** in a DWH.
11. **Partitioning + partition pruning** are essential for large fact tables.
12. OLAP performance means reducing the processed volume and understanding `DBMS_XPLAN`, not just putting indexes.

## Links to the following chapters

The logical order is now very good:

```
1. SQL
      ↓
2. PL/SQL
      ↓
3. Transactions
      ↓
4. OLTP
      ↓
5. OLAP
      ↓
6. DWH
      ↓
7. Dimensional Modeling
      ↓
8. SCD
      ↓
9. ETL / ELT
      ↓
10. Oracle Performance / Optimization
```

In chapter **DWH**, the concepts here are made of fact, dimension, grain, star schema, incremental load, SCD, partitioning will be linked in a complete architecture of **Source → Staging → ETL → DWH → Data Mart → BI**.

---

## Questions and answers

### How would you briefly explain OLAP to a colleague who knows SQL but not this area?

OLAP covers analytical workloads, large scans, aggregation, slicing and dicing, dimensional models, and grain. In practice, I first determine the source data and required business result, then validate the aggregation level, joins, execution plan, and impact on the wider reporting flow.

### What are two common practical problems related to OLAP?

Two recurring problems are incorrect grain or join logic, which can produce wrong aggregates, and performance degradation at production volume. I explicitly validate the dimensional model, fact grain, join cardinality, aggregation logic, partition pruning, and execution plan.

### How do you check that the result is correct and not just fast?

I compare row counts, amounts, business totals, and keys with the source or a trusted reference result; I test NULLs, duplicates, boundary conditions, and reruns. Only then do I evaluate elapsed time, resource usage, TEMP usage, and the execution plan.

### What information did you collect before you modified an existing solution?

I collect the functional requirement, grain, schema and keys, expected volume, data distribution, dependencies, execution plans and timings, known errors/logs, partitioning strategy, and acceptance criteria. I also document the rollback or recovery approach.

### Give an example of a DWH or banking flow where this concept changes design.

In a banking flow, OLAP typically appears downstream of ETL and DWH processing, where reporting must remain consistent with source-system totals, audit requirements, reconciliation rules, and historical dimension state.
