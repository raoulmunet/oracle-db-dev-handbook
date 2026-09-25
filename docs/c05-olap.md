---
title: 'C05. OLAP'
description: 'Complete English handbook chapter based on the original C05 course.'
sidebar_position: 5
---

# C05. OLAP

<div className="chapter-kicker">Chapter C05 · Complete course</div>

OLAP stands for **Online Analytical Processing** and represents the **-oriented mode of work analysis, reporting, aggregation and exploration of large** data volumes.

It is very important for a role of **Data Developer / DWH Developer**, because most queries on a Data Warehouse are of a kind OLAP.

---

## 1. What OLAP is

In an OLAP system we are not interested in first:

- the introduction of an order;
- modification of a customer;
- payment of an invoice;
- updating an individual balance.

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

# 2. OLTP vs OLAP

The difference must be known very well.

Features of OLTP and OLAP
- - - - - - - - -
For operational purposes and analysis
= = sync, corrected by elderman = =
Processed rows, few, many
INSERT/UPDATE
= = sync, corrected by elderman = = @ elder _ man
Current data and historical data
The model is normalized by size.
Many and small transactions are small and large
* * * * *
* * * *
Users and users
Examples of "banking transfer system" are DWH / reporting

Example OLTP:

```
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

```
SELECT
region_id,
SUM (amount)
FROM sales
WHERE sale_date = DATE '2025-01-01'
GROUP BY region_id;
```

This is where millions of rows can be processed.

The plan may contain:

```
TABLEQ1QX FULL
HASHQ1QX BY
```

And this isn't necessarily bad.

---

# 3. Dimensional Model

OLAP is very closely linked to **dimensional modelling**.

Conceptual we have:

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

> **Star Schedule**

---

# 4. Fact Table

The **FACT** table contains measurable events.

Example:

```
FACT_TRANSACTION
--------------------------------
transaction_key
date_key
customer_key
account_key
branch_key
% 1
fee
quantity
```

It usually contains:

- Foreign keys to dimensions;
- numerical measures;
- A lot of lines.

Example:

```
SELECT COUNT *
FROM fact_transaction;
```

can return:

```
850,000,000
```

rows.

---

# 5. Measures

A **measure** is a measurable value.

Examples:

```
% 1
quantity
returns
cost
profit
balance
fee
```

Aggregates usually apply:

```
SUM (amount)
AVG (amount)
MIN (amount)
MAX (amount)
COUNT *
```

Example:

```
SELECT
customer_key,
SUM (amount) total_amount
FROM fact_transaction
GROUP BY customer_key;
```

---

# 6. Sizes

Dimensions give context to measures.

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

```
SELECT
d.year,
d.month,
c. Country,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_date d
ON f.date_key = d.date_key
JOIN dim_customer c
ON f.customer_key = c.customer_key
GROUP BY
d.year,
d.month,
c.country;
```

---

# 7. Grain is one of the most important concepts

**Grain** says:

> What exactly is a round of fact backgammon?

Example:

```
FACT_TRANSACTION
```

He can have grain:

> a row = a bank transaction.

But:

```
FACT_DAILY_ACCOUNT_BALANCE
```

may have:

> a row = balance of an account in a given day.

This should be established **prior to the design of the** table fact.

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

# 8. Star Scheme

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

- easy-to-understand querys;
- simple joints;
- rapid reporting;
- appropriate for BI;
- optimizable efficiently.

---

# 9. Snowflake Schema

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

> Snowflake Scheme

Comparative:

```
STAR
denormalised dimensions

SNOWFLAKE
Normalised dimensions
```

In practice, the star scheme is often preferred for analytics because it simplifies queries.

---

# 10. Aggregation of the basic OLAP operation

OLAP means very much:

```
GROUP BY
```

Example:

```
SELECT
region_id,
SUM (amount)
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

# 11. GROUP BY on multiple levels

```
SELECT
year,
Month,
region,
SUM (amount)
FROM sales
GROUP BY
year,
Month,
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

# 12.ROLLUP

ROLLUP generates hierarchical subtotals.

```
SELECT
year,
Month,
SUM (amount)
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
general total
```

Very common in reporting.

---

# 13. CUBE

CUBE calculates all possible combinations of aggregation.

```
SELECT
region,
product,
SUM (amount)
FROM sales
GROUP BY CUBE (region, product);
```

It can produce:

```
region + product
region
product
general total
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

# 14. ROLLUP vs CUBE

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

# 15. GROUPING SETS

If you don't want all the combinations generated by CUBE, you can control exactly the aggregation.

```
SELECT
region,
product,
SUM (amount)
FROM sales
GROUP BY GROUPING SETS
(
(region, product),
(region),
(production),
(chuckles)
);
```

It is very useful in complex OLAP querys.

---

# 16. Analytical Functions

Analytical functions are fundamental in OLAP.

Example:

```
SUM (amount) OVER (...)
```

The difference from GROUP BY is essential.

GROUP BY:

```
SELECT
customer_id,
SUM (amount)
FROM transactions
GROUP BY customer_id;
```

Reduce the ranks.

Analytical function:

```
SELECT
transaction_id,
customer_id,
% 1% 2
SUM (amount) OVER (
PARTITIONQ1QX customer_id
) customer_total
FROM transactions;
```

keep each transaction.

---

# 17. PARTITION BY

Example:

```
SUM (amount)
OVER (
PARTITIONQ1QX customer_id
)
```

It means conceptually:

```
curator 101
----------------
100
200
300
TOTAL = 600

curator 102
----------------
50
70
TOTAL = 120
```

But each row remains in effect.

---

# 18. Total Running

Very common OLAP example:

```
SELECT
account_id,
transaction_date,
% 1% 2
SUM (amount) OVER (
PARTITIONQ1QX account_id
ORDERQ1QX transaction_date
) running_total
FROM transactions;
```

Result:

```
DATEQ1QX RUNNING_TOTAL
------------------------------------
01Jan 100 100
02-Jan 50 150
03-Jan -20 130
```

---

# 19. ROW\ _ NUMBER

Very often used for:

> the last row per entity.

```
SELECT *
FROM (
SELECT
t. *,
ROW_NUMBER () OVER
PARTITIONQ1QX account_id
ORDER BY transaction_date DESC
) rn
FROM transactions t
)
WHERE rn = 1;
```

Pattern:

```
later row per account
later status per custodian
latest translation per card
```

Highly frequent in interviews.

---

# 20. RANK and DENSE\ _ RANK

Example:

```
SELECT
customer_id,
returns,
RANK () OVER
ORDER BY returns DESC
) rnk
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

# 21. LAG

LAG allows access to the previous row.

Very useful for time comparisons.

```
SELECT
Month,
returns,
LAG (return)
ORDER BY month
) previous_revenue
FROM monthly_sales;
```

Result:

```
MONTHQ1QX PREVIOUS
--------------------------
Jan 1000 NULL
Feb 1200 1000
Mar 1500 1200
```

We can calculate growth:

```
returns -
LAG (return) OVER
```

---

# 22. LEAD

LEAD is accessing the next row.

```
LEAD (amount) OVER (
ORDERQ1QX transaction_date
)
```

Useful for:

- the following transaction;
- the following status;
- the calculation of the ranges;
- detection of changes.

---

# 23. Year-over-Year Analysis

Pattern OLAP very important:

```
YAY = Year over Year
```

Conceptual example:

```
Revenue 2025 = 10M
Revenue 2026 = 12M

Growth = + 20%
```

SQL:

```
SELECT
year,
returns,
LAG (return)
ORDER BY year
) previous_year,
ROUND (
(
returns /
LAG (return) OVER (ORDER BY year)
            - 1
) * 100,
2
) growth_pct
FROM yearly_sales;
```

---

# 24. Moving Average

Other classic OLAP pattern:

```
AVG (amount) OVER (
ORDERQ1QX transaction_date
ROWS BETWEEN 6 PRECEDING
ANDQ1QX ROW
)
```

This produces a:

> average mobile per 7 observations.

Very used in:

- trend analysis;
- risk;
- Forecasting;
- monitoring.

---

# 25. PIVOT

OLAP frequently involves transformation:

```
MONTHQ1QX SALES
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

```
SELECT *
FROM sales
PIVOT (
SUM (amount)
FOR product (
'A' AS A,
'B' AS B
)
);
```

---

# 26. Slice

Classic OLAP term.

We're assuming a cube:

```
TIME
PRODUCT
REGION
```

A **slice** means fixing a size.

For example:

```
YEAR = 2026
```

and we look at:

```
PRODUCT × REGION
```

SQL:

```
WHERE year = 2026
```

---

# 27. Dice

Dice means selecting a multi-dimensional subset.

For example:

```
WHERE year IN (2025, 2026)
AND region IN ('RO', 'DE')
AND product_category = 'Electronics'
```

---

# 28. Drill-down

It means going down to more detail.

```
Year
 ↓
Quarter
 ↓
Month
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

# 29. Rolls-up

Reverse surgery.

```
Day
 ↓
Month
 ↓
Quarter
 ↓
Year
```

I mean, we go from detail to aggregation.

---

# 30. Drill-through

Drill-down:

```
Year → Month → Day
```

Drill-through goes up to detailed operational data.

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
curator
Invoice
% 1
```

---

# 31. OLAP Cube

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

Each cell shall contain a measure:

```
SUM (SALES)
```

Dimension:

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

# 32. OLAP in Modern Oracle

Today OLAP does not necessarily mean a separate physical cube.

Many OLAP systems are implemented directly over:

```
Oracle Database
        ↓
Star Scheme
        ↓
Fact + Dimension
        ↓
SQL analytical queries
        ↓
BI
```

With:

```
GROUP BY
analytic functions
partitioning
parallelism
materialized views
columnar / in-memory techniques
```

---

# 33. Full Table Scan is not bad in OLAP

This is a fundamental difference from OLTP.

Suppose:

```
FACT_TRANSACTION
500 million rows
```

Query:

```
SELECT
SUM (amount)
FROM fact_transaction
WHERE transaction_date
BETWEENQ1QX '2026-01-01'
AND DATE '2026-12-31';
```

If 300 million lines are to be read, an index may be slower than:

```
FULLQ1QX SCAN
```

or:

```
PARTITIONQ1QX SCAN
```

In OLAP:

> scanning a large amount of data can be exactly the right plan.

---

# 34. HASH JOIN

The very important joint for OLAP is:

```
HASH JOIN
```

Example:

```
SELECT
c.segment,
SUM (f.amount)
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
size
   ↓
build hash table

fact
   ↓
scan
   ↓
hash table samples
```

For large volumes it is often more effective than Nested Loops.

---

# 35. Nested Loops vs Hash Join

Simplified:

```
Nested Loops
→ Few rows
→ Lookups
→ OLTP
```

```
Hash Join
→ many lines
→ scans
→ OLAP / DWH
```

It's not an absolute rule, but it's a very good mental model.

---

# 36. Partitioning

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

```
SELECT SUM (amount)
FROM fact_transaction
WHERE transaction_date
BETWEENQ1QX '2026-01-01'
AND DATE '2026-01-31';
```

The Oracle can only access:

```
P202601
```

This phenomenon is called:

> **Partition Pounding**

---

# 37. Why are we partitioning fact tables

For:

- query performance;
- partition pruning,
- lighter loads;
- archiving;
- deletion of old data;
- Parallelism;
- administration.

Large facttables are very commonly partitioned after time.

---

# 38. Bitmap Index

In certain DWH/OLAP workshops we can have columns with small cardinality:

```
gender
stasis
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

Here's one:

```
BITMAP INDEX
```

can be effective.

But bitmap indexes are inappropriate for tables with many competing updates.

Therefore:

```
OLAP / DWH → possibly very useful
OLTP → usually avoided
```

---

# 39. Materialized Views

Suppose the report:

```
SELECT
Month,
region,
SUM (amount)
FROM fact_sales
GROUP BY month, region;
```

read hundreds of millions of rows.

We can create:

```
CREATE MATERIALIZED VIEW mv_monthly_sales
AS
SELECT
Month,
region,
SUM (amount) total_amount
FROM fact_sales
GROUP BY month, region;
```

Now the report can question several thousand lines instead of hundreds of millions.

---

# 40. Query Rewrite

Oracle can sometimes automatically turn an interrogation over the fact table into a query over materialized view.

Conceptual:

```
USER QUERY

FACT_SALES
GROUPQ1QX MONTH
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

# 41. Parallel Execution

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

```
SELECT / * + PARALLEL (f, 4) * /
SUM (amount)
FROM fact_transaction f;
```

But the hint should not be used automatically without understanding the system.

---

# 42. Predicate Pushdown

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

The optimiser is trying to do this automatically.

---

# 43. Cardinal and selectivity

Very important to the optimiser.

Example:

```
gender
M/F
```

He has little cardinality.

```
transaction_id
```

He has a very large cardinality.

Selectivity

```
WHERE transaction_id = 123
```

very selective.

But:

```
WHERE year = 2026
```

may select:

```
30% of the table
```

and then an index may not be advantageous.

---

# 44. Why statistics are critical

The optimiser shall estimate:

```
How many lines pass the filter?
```

For example:

```
WHERE status = 'ACTIVE'
```

If Oracle estimates:

```
100 rows
```

But in reality, I am:

```
200,000,000 rows
```

can choose a completely inappropriate plan.

This is why statistics are very important in DWH.

---

# 45. ETL and OLAP

OLAP data usually come from OLTP systems.

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

# 46. Incremental Lead

We don't want to load the entire DWH- every day.

Example:

```
FACT_TRANSACTION
500M rows
```

Today they appear:

```
2M new transactions
```

We're only charging the 2 million.

Pattern:

```
SOURCE
WHERE last_update
```

This is:

> incremental load.

---

# 47. SCD and OLAP

History of dimensions must be maintained for historical analysis.

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

The historical reports thus reflect the reality of that period.

---

# 48. Full OLAP banking example

We assume:

```
FACT_TRANSACTION

transaction_key
date_key
customer_key
account_key
branch_key
% 1
transaction_type_key
```

Dimension:

```
DIM_DATE
DIM_CUSTOMER
DIM_ACCOUNT
DIM_BRANCH
DIM_TRANSACTION_TYPE
```

Business asks:

> What is the monthly value of transactions for each customer segment?

```
SELECT
d.year,
d.month,
c.segment,
SUM (f.amount) total_amount
FROM fact_transaction f
JOIN dim_date d
ON d.date_key = f.date_key
JOIN dim_customer c
ON c.customer_key = f.customer_key
GROUP BY
d.year,
d.month,
c.segment
ORDER BY
d.year,
d.month,
c.segment;
```

This is a classic OLAP query.

---

# 49. Add comparison to previous month

```
WITH only AS
(
SELECT
d.year,
d.month,
c.segment,
SUM (f.amount) total_amount
FROM fact_transaction f
JOIN dim_date d
ON d.date_key = f.date_key
JOIN dim_customer c
ON c.customer_key = f.customer_key
GROUP BY
d.year,
d.month,
c.segment
)
SELECT
year,
Month,
segment,
total_amount,
LAG (total_amount)
PARTITION BY segment
ORDER BY year, month
) previous_month
FROM monthly;
```

Here we combine:

```
aggregation
+
analytic function
```

An extremely common pattern in analytics.

---

# 50. Patterson OLAP very important: Aggregate → Analyze

Often OLAP interrogation takes two phases.

First:

```
aggregation
```

then:

```
Analytical functions
```

For example:

```
WITHQ1QX AS
(
SELECT
customer_id,
Month,
SUM
FROM sales
GROUP BY
customer_id,
month
)
SELECT
customer_id,
Month,
% 1% 2
LAG (amount) OVER (
PARTITIONQ1QX customer_id
ORDER BY month
) previous_month
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

It's worth retaining very well.

---

# 51. Patterson: Top N per group

Question:

> Top 3 customers per region.

```
WITH returns AS
(
SELECT
region,
customer_id,
SUM (amount) total_amount
FROM sales
GROUP BY
region,
customer_id
),
ranked AS
(
SELECT
Come back. *,
ROW_NUMBER () OVER
PARTITION BY region
ORDER BY total_amount DESC
) rn
FROM returns
)
SELECT *
FROM rank
WHERE rn = 3;
```

Pattern:

```
GROUP BY
    ↓
ROW_NUMBER
    ↓
Top N per group
```

Very common in interviews.

---

# 52. Pattern: Detection of changes

Example:

```
SELECT
customer_id,
status_date,
status,
LAG (status) OVER
PARTITIONQ1QX customer_id
ORDERQ1QX status_date
) previous_status
FROM customer_status;
```

Then:

```
WHERE status = previous_status
```

Conceptually we can detect:

```
ACTIVE → BLOCKED
BLOCKED → ACTIVE
```

---

# 53. Trap: GROUP BY too early

We assume we have:

```
curator
transactions
accounts
```

If we do the wrong game:

```
1 custodian
10 accounts
100 transactions
```

We can artificially multiply the ranks.

Result:

```
SUM (amount)
```

gets it wrong.

OLAP should always be checked:

> What's the grain of every date?

---

# 54. Trap: Join that multiplies invoices

Example:

```
FACT_SALES
1 row

DIM_PROMOTION
3 rows matching accidentally
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

This is one of the most dangerous DWH bugs.

---

# 55. Trap: SUM (DISTINCT amount)

Sometimes someone tries to solve the doubles with:

```
SUM (DISTINCT amount)
```

This NU is usually the solution.

If two valid transactions have:

```
100
100
```

SUM (DISTINCT) returns:

```
100
```

for:

```
200
```

We need to fix the joint or the grain.

---

# 56. Trap: function on filtered column

Example:

```
WHERE TRUNC (transaction_date) =
DATE '2026-09-23'
```

may prevent certain optimization / index access.

Often it is preferable:

```
WHERE transaction_date = DATE '2026-09-23'
AND transaction_date - DATE '2026-09-24'
```

In DWH it is also important for the plucking partition.

---

# 57. OLAP and execution plans

In OLAP you have to get used to seeing:

```
TABLEQ1QX FULL
PARTITION RANGE
HASH JOIN
HASHQ1QX BY
SORTQ1QX BY
WINDOW SORT
PX COORDINATOR
```

For example:

```
SELECT STATEMENT
HASHQ1QX BY
HASH JOIN
TABLE ACCESS FULL DIM_CUSTOMER
PARTITIONQ1QX ITERATOR
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

# 58. What to follow in OLAP plans

You don't just ask:

> Use the index?

But:

```
How many lines are read?
How many lines are left?
Is partition pruning?
What join method is chosen?
Where does the sorting come from?
Is there spill on TEMP?
Are the optimiser's estimates correct?
Is there parallel execution?
```

This is a much better way to analyze a query DWH.

---

## Questions and answers

### What is OLAP?

A good answer:

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

> No. In OLAP workshops, if a large part of the table needs to be processed, Full Table Scan or Partition Scan can be more efficient than access by index.

---

### ROLLUP vs CUBE?

> ROLLUP produces hierarchical aggregation, while CUBE generates aggregation for all specified dimensional combinations.

---

### GROUP BY vs analytical functions?

> GROUP BY reduces the number of rows by aggregation, while analytical functions calculate values over a set of rows keeping individual rows in result.

---

# 60. Mental Model for OLAP

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

# 61. The most important things to remember

If you had to remember only **12 concepts OLAP**, these would be:

1. **OLAP = analysis, aggregation and historical**, not operational transactions.
2. The data are often organized in **fact tables + dimensions**.
3. You must know very well the **Grain** fact table.
4. **Star Schema** is the fundamental dimensional model.
5. GROUP BY is the foundation of aggregation.
6. ROLLUP, CUBE and GROUPING SETS allow for multidimensional aggregation.
7. The analytical functions of ROW\ _ NUMBER, RANK, LAG, LEAD, SUM OVER are essential.
8. The **Aggregate patent → Analyze** occurs very often.
9. For large volumes, **HASH JOIN** is very important.
10. **Full Table Scan is not automatically bad** in an DWH.
11. **Partitioning + partition pruning** are essential for large fact tables.
12. OLAP performance means reducing the processed volume and understanding DBMS\ _ XPLAN, not just putting indexes.

## Link to the following chapters

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
7. Modeling Dimensional
      ↓
8. SCD
      ↓
9. ETL / ELT
      ↓
10. Oracle Performance / Optimisation
```

In chapter **DWH**, the concepts here are made of fact, size, grain, star scheme, incremental load, SCD, partitioning will be linked in a complete architecture of **Source → Staging → ETL → DWH → Data Mart → BI**.

---

## Questions and answers

### How would you briefly explain OLAF to a colleague who knows SQL, but not this area?

OLAF covers analytical works and large scans, aggregation, slicing and dicing, dimensional models and grain. In practice, I first determine what data enters and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to OLAF?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For OLAF, I explicitly follow analytical workloads and large scans, aggregation, slicking and dicing, dimensional models and grain and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, OLAF appears together with logging, auditing, reconciliation and impact analysis.
