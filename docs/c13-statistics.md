---
title: 'C13. Statistics'
description: 'Complete English handbook chapter based on the original C13 course.'
sidebar_position: 13
---

# C13. Statistics

<div className="chapter-kicker">Chapter C13 · Complete course</div>

In Oracle, **statistics** are the information used by **Cost-Based Optimizer (CBO)** to estimate how many rows each operation will process and how much each execution option will cost.

The central idea is:

> **Statistics → cardinality / selectivity estimates → cost → execution plan**

If statistics are incorrect or old:

> **bad statistics → bad cardinality estimates → bad execution plan**

That's why Statistics directly links the previous modules:

**Optimizer → Execution Plan → Index → Statistics**

---

## 1. What are the Oracle Statistics

Oracle keeps information about:

- tables;
- columns;
- indexes;
- partitions;
- distribution of values;
- the volume of data.

The optimiser does not execute the query to see how many rows there are. He tries to **estimate this using statistics.

Example:

```
SELECT *
FROM orders
WHERE customer_id = 100;
```

The optimiser must decide:

- how many rows are likely to be found;
- whether the index is worth using;
- if it is cheaper FULL TABLE SCAN;
- What a method of join to use if there are joinings.

---

# 2. Table Statistics

The most important information is:

```
NUM_ROWS
BLOCKS
AVG_ROW_LEN
```

We can see them in:

```
SELECT table_name,
num_rows,
Blocks,
avg_row_len,
last_analyzed
FROM user_tables
WHERE table_name = 'ORDERS';
```

### NUM _ ROWS

The average number of rows in the table at the time of collection of statistics.

### BLOCKS

Number of Oracle blocks occupied by the table.

This is very important for estimating the cost of:

```
TABLEQ1QX FULL
```

### AVG\ _ ROW _ LEN

Average size of a row.

May influence the estimation of the volume of I/O.

---

# 3. Column Statistics

The Oracle shall keep information such as:

```
NUM_DISTINCT
NUM_NULLS
DENSITY
LOW_VALUE
HIGH_VALUE
```

Example:

```
SELECT column_name,
num_distinct,
num_nulls,
densities,
histogram
FROM user_tab_col_statistics
WHERE table_name = 'ORDERS';
```

---

# 4.NUM\ _ DISTINCT

It represents approximately the number of distinct values in the column.

Example:

We have:

```
1,000,000 orders
100,000 Customers
```

Statistics:

```
NUM_ROWS = 1,000,000
NUM_DISTINCT (customer_id) equals 100,000
```

For:

```
WHERE customer_id = 1234
```

The optimiser may approximate:

```
1,000,000 / 100,000 = 10 rows
```

that is approximately:

```
selectivity = 1 / NUM_DISTINCT
```

---

# 5. selectivity

**Selectivity** represents the proportion of rows passing through a filter.

Conceptual:

```
selectivity =
matching rows
    -------------
total rows
```

Example:

```
1,000,000 rows
10 matches rows
```

Selection:

```
10 / 1,000,000
= 0.00001
```

I mean:

```
0.001%
```

A very selective sermon is generally a good candidate for the index.

---

# 6. Cardinality

**Cardinality** is the number of lines the optimiser estimates an operation will produce.

The approximate relationship is:

```
Cardinality =
NUM_ROWS × selectivity
```

Example:

```
NUM_ROWS = 1,000,000

selectivity = 0.001
```

Then:

```
cardinality n.e.1 000
```

In DBMS\ _ PLAN, the estimated cardinality usually appears as:

```
E-Rows
```

And the real number of lines:

```
A-Rows
```

That's why one of the most important comparisons in tuning is:

```
E-Rows vs A-Rows
```

---

# 7. Why E-Rows vs A-Rows is so important

Example:

```
Operation E-Rows A-Rows
------------------------------------------------
TABLE ACCESS 10 500000
```

The optimiser thought they'd come:

```
10 rows
```

But the reality was:

```
500,000 rows
```

This enormous difference can produce an inappropriate plan.

For example, the optimizer can choose:

```
NESTED LOOPS
```

Considering that there will only be a few lines.

In reality, for hundreds of thousands of rows it could have been more appropriate:

```
HASH JOIN
```

This is one of the most important diagnostic squares:

> **Wrong plan? Check cardinality estimates first.**

---

# 8. Statistics for indexes

The indexes have their own statistics.

Example:

```
SELECT index_name,
num_rows,
distinct_keys,
leaf_blocks,
clustering_factor
FROM user_indexes
WHERE table_name = 'ORDERS';
```

Very important are:

```
DISTINCT_KEYS
LEAF_BLOCKS
CLUSTERING_FACTOR
```

---

# 9. DISTINCT\ _ KEYS

It represents the number of distinct values in the index.

For:

```
CREATEQ1QX ix_orders_customer
ON orders (customer_id);
```

we can have:

```
NUM_ROWS = 1,000,000
DISTINCT_KEYS = 100,000
```

The optimiser can estimate that a custodian has on average:

```
1,000,000 / 100,000
= 10 orders
```

---

# 10. CLUSTERING\ _ FACTOR

It is one of the most important and often misunderstood statistics.

CLUSTERING\ _ FACTOR indicates about how well the order of data in the table is related to the index order.

Very good example:

```
TABLE BLOCKS = 10,000
CLUSTERING_FACTOR = 11.000
```

The data are pretty well grouped in the index order.

Poor example:

```
TABLE BLOCKS = 10,000
NUM_ROWS = 1,000,000
CLUSTERING_FACTOR = 950,000
```

Accessing many values through the index can mean a lot of random access to the table blocks.

Optimiser may prefer:

```
TABLEQ1QX FULL
```

even if the index exists.

---

# 11. Histograms

Normal statistics suggest that the values are evenly distributed.

But that's not always true.

Example:

```
STATUS
------------------
ACTIVE 990,000
SUSPENDED 5,000
CLOSED 5,000
```

Total:

```
1,000,000
```

There's only:

```
3 separate values
```

Without further information, the optimiser may involve approximately:

```
1,000,000 / 3
= = sync, corrected by elderman = =
```

But reality is completely different.

---

# 12. Why histograms are useful

For:

```
WHERE status = 'ACTIVE'
```

The reality is:

```
990,000 rows
```

Instead:

```
WHERE status = 'SUSPENDED'
```

The reality is:

```
5,000 rows
```

The optimal plan can be different.

For ACTIVE:

```
TABLEQ1QX FULL
```

It can be better.

For SUSPENDED:

```
INDERANGE SCAN
```

It can be better.

The histogram says to the optimiser:

> the values are not evenly distributed.

---

# 13. How do we see if there is histogram

```
SELECT column_name,
num_distinct,
densities,
histogram,
num_buckets
FROM user_tab_col_statistics
WHERE table_name = 'ORDERS';
```

Examples for HISTOGRAM:

```
NONE
FREQUENCY
TOP-FREQUENCY
HYBRID
```

In practice, it is not necessary to create histogram manually for each column.

Oracle may decide to create histograms for the relevant columns.

---

# 14. DBMS _ STATS

The standard Oracle package for optimiser statistics is:

```
DBMS_STATS
```

Simple example:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
tablets
);
END;
/
```

It collects statistics for the table and, depending on the options, columns / indexes.

---

# 15. GATHER\ _ SCHEMA\ _ STATS

For a scheme:

```
BEGIN
DBMS_STATS.GATHER_SCHEMA_STATS (
Ownname = =
);
END;
/
```

In a real system, however, it is not a good idea to run unnecessarily statistics on millions or billions of rows.

Oracle has mechanisms for automatic and incremental statistics.

---

# 16. METHOD\ _ OPT

A very important parameter is:

```
METHOD_OPT
```

Example:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
Tabnames = "'ORDERS'"
method_opt = = 'FOR ALL COLUMNS SIZE AUTO'
);
END;
/
```

SIZE AUTO allows Oracle to decide where histograms are useful.

It is generally much healthier than:

```
FOR ALL COLUMNS SIZE 254
```

I mean, pushing histograms everywhere.

---

# 17. CASCADE

For index collection and statistics:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
Tabnames = "'ORDERS'"
waterfalls = TRUE
);
END;
/
```

---

# 18. SAMPLE\ _ SIZE

Oracle doesn't have to read every line.

He can use sampling.

In most modern situations it is advisable:

```
estimate_percent = = DBMS_STATS.AUTO_SAMPLE_SIZE
```

Example:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
Tabnames = "'ORDERS'"
estimate_percent = = DBMS_STATS.AUTO_SAMPLE_SIZE,
method_opt = = 'FOR ALL COLUMNS SIZE AUTO',
waterfalls = TRUE
);
END;
/
```

---

# 19. Statistics stale

A typical problem:

Initial:

```
ORDERS = 1,000,000 rows
```

Statistics:

```
NUM_ROWS = 1,000,000
```

After an ETL:

```
+ 20,000,000 rows
```

But the optimiser still sees roughly:

```
1,000,000
```

Plans can become completely inappropriate.

We can check:

```
SELECT table_name,
num_rows,
last_analyzed,
stale_stats
FROM user_tab_statistics
WHERE table_name = 'ORDERS';
```

---

# 20. Statistics and ETL

This is extremely important in an DWH.

We have:

```
FACT_TRANSACTION
```

with:

```
500 million rows
```

Nightly ETL adds:

```
10 million rows
```

After massive loading, the distribution of data may change.

For example:

```
NUM_ROWS
NUM_DISTINCT
histograms
partition statistics
```

they can become obsolete.

This is why the DWH float may include:

```
ETL load
   ↓
date of validation
   ↓
statistics refresh
   ↓
reporting / BI queries
```

---

# 21. Parties statistics

In an DWH it is common to exist:

```
FACT_SALES
```

Partition by date:

```
P_2026_07
P_2026_08
P_2026_09
```

Statistics can exist both:

```
table level
```

and:

```
partition level
```

We can see them, for example, in:

```
SELECT partition_name,
num_rows,
Blocks,
last_analyzed
FROM user_tab_partitions
WHERE table_name = 'FACT_SALES';
```

This is very important because ETL- can only modify the last partition.

---

# 22. Incremental Statistics

In a big DWH you don't necessarily want to rescan:

```
5 billion rows
```

after you've only uploaded the partition of the current day.

The incremental statistics idea is about:

```
Amended partition statistics
        +
Existing statistics for the rest of the partitions
        ↓
global statistics
```

This pattern is very important for large DWH-uri.

---

# 23. Extended Statistics

The optimiser may have problems when two columns are correlated.

Example:

```
COUNTRY
CITY
```

Query:

```
WHERE country = 'RO'
AND city = 'Bucharest'
```

If the optimiser treats the predictions independently it can misestimate selectivity.

Oracle allows **extended statistics** for groups of columns.

Conceptual example:

```
SELECT DBMS_STATS.CREATE_EXTENDED_STATS (
USER,
'CUSTOMER',
'(COUNTRY,CITY)'
)
FROM dual;
```

Then:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
USER,
'CUSTOMER'
);
END;
/
```

These statistics can help optimizer understand the correlation between columns.

---

# 24. Statistics on Expressions

Suppose:

```
WHERE UPPER (last_name) = 'IONESCU'
```

Distribution:

```
last_name
```

it is not necessarily identical to the distribution:

```
UPPER (last_name)
```

Oracle can use extended statistics for relevant expressions.

Conceptual:

```
DBMS_STATS.CREATE_EXTENDED_STATS (
USER,
'CUSTOMER',
'(UPPER(LAST_NAME))'
);
```

---

# 25. Dynamic Statistics

Sometimes the optimiser doesn't have enough statistics.

Can use **dynamic statistics** to do sampling during the hard park.

The point is:

```
insufficient statistics
        ↓
sample
        ↓
estimated improve cardinal
```

But it doesn't have to be seen as a replacement for the right statistics.

In a well-managed system:

```
persistent statistics
```

remain the base.

---

# 26. Statistics of exact data in real time

Very important:

```
NUM_ROWS
```

does not mean:

> The exact number of rows right now.

Statistics shall be an approximate picture obtained at:

```
LAST_ANALYZED
```

If you have:

```
SELECT COUNT *
FROM orders;
```

you can get:

```
1,200,000
```

and:

```
SELECT num_rows
FROM user_tables
WHERE table_name = 'ORDERS';
```

may show:

```
1,150,000
```

It's not necessarily a problem.

The optimiser doesn't need exact values at all times.

He needs estimates good enough to choose the plan.

---

# 27. Statistics and Index Selection

Suppose:

```
CREATEQ1QX ix_orders_status
ON orders (status);
```

Query:

```
SELECT *
FROM orders
WHERE status = 'ACTIVE';
```

If:

```
ACTIVE = 99%
```

The optimiser may decide:

```
TABLEQ1QX FULL
```

even if there is an index.

For:

```
WHERE status = 'SUSPENDED'
```

with:

```
0.5%
```

may decide:

```
INDERANGE SCAN
```

This is a direct consequence of:

```
Statistics
+
selectivity
+
Costing
```

---

# 28. Statistics and Join Order

Suppose:

```
CUSTOMER
JOIN ORDERS
JOIN ORDER_LINES
```

The optimiser must decide:

```
What table reads first?
```

If it estimates:

```
CUSTOMER predicated → 3 rows
```

It can start there.

If it estimates:

```
CUSTOMER predicated → 500,000 rows
```

can choose another order.

The statistics therefore influence:

```
access path
join order
Join method
parallelism
partition pruning
```

---

# 29. Practically complete example

We create:

```
CREATE TABLE stat_test AS
SELECT level AS id,
CASE
WHEN level = 990000 THEN 'ACTIVE'
WHEN level = 995000 THEN 'SUSPENDED'
ELSE 'CLOSED'
END AS status,
MOD (level, 100000) AS customer_id
FROM dual
CONNECT BY level = 1000000;
```

Index:

```
CREATEQ1QX ix_stat_test_status
ON stat_test (status);
```

We collect statistics:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
Tabnames = "'STAT_TEST'"
method_opt = = 'FOR ALL COLUMNS SIZE AUTO',
waterfalls = TRUE
);
END;
/
```

We see statistics:

```
SELECT column_name,
num_distinct,
densities,
histogram,
num_buckets
FROM user_tab_col_statistics
WHERE table_name = 'STAT_TEST';
```

---

# 30. Compare two querys

### Query 1

```
SELECT *
FROM stat_test
WHERE status = 'ACTIVE';
```

### Query 2

```
SELECT *
FROM stat_test
WHERE status = 'SUSPENDED';
```

Use:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM stat_test
WHERE status = 'SUSPENDED';
```

Then:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST'
)
);
```

Watch in particular:

```
E-Rows
A-Rows
Buffers
```

---

# 31. Diagnostic pattern for tuning

When a query is slow, a very good order of analysis is:

```
1. Get current execution plan
       ↓
2. Compare E-Rows vs A-Rows
       ↓
3. Find first major estimate error
       ↓
4. Check statistics
       ↓
5. Check data skew
       ↓
6. Check correlations between columns
       ↓
7. Check histogram / extended statistics
       ↓
8. Only then think about things
```

Do not start directly with:

```
USE_NL
INDEX
FULL
LEADING
```

The Hint can mask the problem instead of solving it.

---

# 32. Real script DWH

We have:

```
FACT_TRANSACTION
2 billion rows
```

Partitioned monthly.

Query BI:

```
SELECT customer_segment,
SUM (amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_key = f.customer_key
WHERE f.transaction_date = DATE '2026-09-01'
AND c.customer_segment = 'PRIVATE_BANKING'
GROUP BY customer_segment;
```

The plan chooses:

```
Nested Loops
```

and it takes 40 minutes.

In DBMS\ _ XPLAN:

```
DIM_CUSTOMER

E-Rows = 100
A-Rows = 850000
```

The main problem is not necessarily the index.

It's:

```
cardinality estimate error
```

The investigation should verify:

```
NUM_ROWS
NUM_DISTINCT
LAST_ANALYZED
histograms
correlations
partition statistics
```

After correct statistics the optimizer can reach:

```
HASH JOIN
+
PARTITION PRUNING
+
FULL/PARTITION SCAN
```

And the query can become much more effective.

---

# 33. Scenario ETL very common

ETL:

```
1. truncate staging
2. load 50M rows
3. Transform
4. Exchange / load fact partition
5. Statistics
6. BI/reporting
```

If step 5 is missing, the reporter can start with the wrong information about the new partition.

For a Data Developer it is important not to treat statistics as an exclusive DBA problem.

They are part of the behavior of the pipeline.

---

# 34. What to NU do

### Do not collect obsessive statistics

Not necessary:

```
every minute
```

or after each INSERT.

---

### Don't create histograms everywhere

Histograms are particularly useful when:

```
date is skewed
```

and the column is relevant for predictions.

---

### Do not assume that index = index usage

The optimiser calculates:

```
cost
```

based on statistics.

---

### Do not use the hints before you understand the wrong estimate

First:

```
E-Rows vs A-Rows
```

---

## Questions and answers

### 1. What are Oracle Statistics?

Information on volume, data distribution, columns and indexes used by CBO to estimate cardinality and costs.

---

### 2. What is cardinality?

Estimated number of rows produced by an operation.

---

### 3. What is selectivity?

The proportion of rows that satisfy a prediction.

---

### 4. What does NUM\ _ DISTINCT mean?

The average number of distinct values of a column.

---

### 5. What is a histogram?

A statistic whereby Oracle can understand that the values of a column are not evenly distributed.

---

### 6. What is clustering factor?

A measure of the correlation between the order of index values and the physical distribution of rows in the table.

---

### 7. Why can Oracle ignore an existing index?

Because, based on the estimated selectivity and cost, a full scan can be cheaper.

---

### 8. What do you check when E-Rows differ enormously from A-Rows?

In particular:

```
stale / missing statistics
histograms
data skew
collum correlations
expressions
partition statistics
```

---

### 9. How is DBMS doing?

Collect and manage statistics used by the optimiser.

---

### 10. Why are statistics important in an DWH?

Because large volumes and ETL-s can quickly change the distribution of data, and wrong cardinalities can cause very expensive joints and access paths.

---

# 36. Oracle Exercises 26ai

For your lab DEV\ _ LAB, I would do the following exercises:

1. Create STAT\ _ TEST with 1 million rows and distribute 99% ACTIVE / 0.5% SUSPENDED / 0.5% CLOSED.
2. Create:

```
CREATEQ1QX ix_stat_test_status
ON stat_test (status);
```

3. Run DBMS\ _ STATS.GATHER\ _ TABLE\ _ STATS.
4. Check:

```
USER_TABLES
USER_TAB_COL_STATISTICS
USER_INDEXES
```

5. Compare the plan for:

```
status = 'ACTIVE'
```

and:

```
status = 'SUSPENDED'
```

6. Use:

```
/ * + GATHER_PLAN_STATISTICS * /
```

and:

```
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST'
)
```

7. Compare:

```
E-Rows
A-Rows
```

8. Add 2 million lines without collecting statistics.
9. Reexecute the query and observe the estimates.
10. Run again:

```
DBMS_STATS.GATHER_TABLE_STATS
```

and compare the plan.

This is a very good lab because it looks directly:

```
DATA
 ↓
STATISTICS
 ↓
CARDINALITY
 ↓
COST
 ↓
EXECUTION PLAN
```

---

# 37. Mental Model to Remember

For Statistics, remember the chain:

```
DATA
                    │
                    ▼
STATISTICS
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
NUM_ROWS NUM_DISTINCT
BLOCKS HISTOGRAMS
AVG_ROW_LEN DENSITY
       │                         │
       └────────────┬────────────┘
                    ▼
SELECTIVITY
                    │
                    ▼
CARDINALITY
E-Rows
                    │
                    ▼
COST
                    │
                    ▼
EXECUTION PLAN
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
INDEX JOIN METHOD JOIN ORDER
                  │
                  ▼
PERFORMANCE
```

And when you diagnose:

```
E-Rows - A-Rows
```

It's usually a good sign.

If you have:

```
E-Rows = 10
A-Rows = 5,000,000
```

That's where we need to investigate.

---

## Questions and answers

If we had to reduce the entire module to seven ideas:

1. **Statistics are the basis of the Cost-Based Optimizer decisions.**
2. **Selectivity says what proportion of the table is filtered.**
3. **Cardinality represents the estimated number of rows.**
4. **NUM\ _ ROWS, NUM\ _ DISTINCT, index histograms and statistics influence estimates.**
5. **Histograms are important for uneven distribution of the skew.**
6. **One of the best tuning techniques is comparing E-Rows to A-Rows.**
7. In an DWH, after large loads, **statistics must remain representative for** data, including partitions.

The most important concept of the module is:

> **Optimizer does not choose a wrong plan out of the blue. Often choose logically based on wrong estimates, and those estimates often come from insufficient, outdated or unable to correctly describe data distribution.**

---

## Questions and answers

### How would you briefly explain Statistics to a colleague who knows SQL, but not this area?

Statistics cover tables, collum and index statistics, NUM _ ROWS, NDV, density and histograms, stale statistics and gathering strategy. In practice, first, I determine what data enter and what result should be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical issues related to Statistics?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Statistics, I explicitly follow tables, collum and index statistics, NUM _ ROWS, NDV, density and histograms, stale statistics and gathering strategy and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Statistics appears together with logging, auditing, reconciliation and impact analysis.
