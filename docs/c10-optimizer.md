---
title: 'C10. Oracle Optimizer'
description: 'Complete English handbook chapter based on the original C10 course.'
sidebar_position: 10
---

# C10. Oracle Optimizer

<div className="chapter-kicker">Chapter C10 · Complete course</div>

For an **Oracle Data Developer / PL/SQL Developer / DWH Developer**, it is not enough to write SQL correctly. You must also understand **how Oracle decides to execute SQL-** and how you check if the decision is good.

The central idea:

> **Oracle Optimizer tries to find the execution plan with the lowest estimated cost, using data statistics and cardinality estimates.**

You do not optimize SQL- by intuition or by the index = fast rule. You optimize from **the real** execution plan.

---

## 1. What is Oracle Optimizer

Oracle receives an SQL instruction:

```
SELECT *
FROM transactions
WHERE account_id = 1001;
```

There are several possible ways to execute it:

```
Variant 1:
TABLEQ1QX FULL

Variant 2:
INDERANGE SCAN
   ↓
TABLE ACCESS BY INDEX ROWID

Variant 3:
other index
```

The optimiser must choose one of the options.

In modern Oracle we are talking mainly about:

**CBO = Cost Based Optimizer**

The optimiser estimates the cost of different plans based on:

- statistics;
- the number of rows;
- the distribution of values;
- the selectivity of predictions;
- indexes;
- partitions;
- intermediate cardinality;
- the type of join;
- cost of I/O;
- CPU;
- Sometimes parallelism.

---

# 2. Parsing → Optimization → Execution

Simplified:

```
SQL
 ↓
Parsing
 ↓
Optimizer
 ↓
Implementation Plan
 ↓
Implementation Engine
 ↓
Rows
```

The optimizer doesn't run all the options to see which one is faster.

He makes **estimates**.

That's why a very important problem in tuning is:

> **Optimizer correctly estimated how many lines will go through each operation?**

---

# 3. Cost of time in seconds

In an execution plan you can see:

```
Cost = 127
```

This NU means:

```
127 ms
127 seconds
127 I/O-uri
```

The cost is a relative value used by the optimiser to compare the plans.

For example:

```
Plan A cost 40
Plan B cost 500
```

The optimiser basically considers plan A cheaper.

But:

> The lower cost plan is not necessarily the plan that acts best in reality.

If statistics or estimates are wrong, the optimiser can choose poorly.

---

# 4. Statistics

The optimiser needs data information.

Examples:

```
row number
number of blocks
number of distinct values
NULL-uri
min / max
distribution of values
index statistics
```

You can collect statistics with:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "'DEV_LAB',"
Tabnames = "'TRANSACTIONS'"
waterfalls = TRUE
);
END;
/
```

waterfalls = The TRUE also collects statistics for associated indexes.

---

# 5. Cardinality

**Cardinality** means the estimated number of rows produced by an operation.

Example:

```
SELECT *
FROM transactions
WHERE status = 'ERROR';
```

If the table has:

```
10,000,000 rows
```

and the optimiser estimates that:

```
10,000 rows
```

have status = 'ERROR', the estimated cardinality is approximately:

```
10,000
```

The plan often appears as:

```
E-Rows
```

I mean:

> Estimate

---

# 6. Selection

Selectivity is the proportion of rows that satisfy the condition.

Example:

```
10,000,000 rows total
1,000 rows returned
```

Selection:

```
1000 / 10,000,000
= 0.0001
= 0.01%
```

It's very selective.

Usually, an index gets more interesting.

---

## Slightly selective example

```
WHERE gender = 'M'
```

If approximately half of the table is M-value:

```
50%
```

The index can be useless.

Oracle may prefer:

```
TABLEQ1QX FULL
```

---

# 7. TABLE ACCESS FULL is not automatically bad

One of the most common mistakes:

> * Full Table Scan = stupid query. *

False.

For:

```
SELECT SUM (amount)
FROM fact_transaction;
```

on an DWH, Oracle must probably read a very large part of the table.

One:

```
TABLEQ1QX FULL
```

it can be the right choice.

Especially for:

- DWH;
- Analytics;
- aggregations;
- reports;
- batch processing;
- parallel query.

---

# 8. When it is an advantageous index

Suppose:

```
CREATEQ1QX ix_trx_account
ON transactions (account_id);
```

Query:

```
SELECT *
FROM transactions
WHERE account_id = 123456;
```

If there are very few transactions for that account, the plan may be:

```
TABLE ACCESS BY INDEX ROWID
INDEX RANGE SCAN IX_TRX_ACCOUNT
```

The flow is:

```
INDERANGE SCAN
      ↓
ROWID
      ↓
TABLE ACCESS BY INDEX ROWID
```

Oracle first search the index, get ROWID, then go to the table.

---

# 9. INDEX UNIQUE SCAN

For a single key:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

If there is:

```
PRIMARY KEY (customer_id)
```

the plan may be:

```
TABLE ACCESS BY INDEX ROWID
INDEX UNIQUE SCAN PK_CUSTOMERS
```

INDEX UNIQUE SCAN means:

> Oracle knows he can find maximum one line.

---

# 10. INDEX RANGE SCAN

Example:

```
SELECT *
FROM transactions
WHERE account_id = 1001;
```

An account can have many transactions.

Possible plan:

```
TABLE ACCESS BY INDEX ROWID
INDEX RANGE SCAN IX_TRX_ACCOUNT
```

Oracle finds an **range of inputs** in the index.

---

# 11. Reading DBMS\ _ XPLAN

For starters, we can use:

```
EXPLAINQ1QX FOR

SELECT *
FROM transactions
WHERE account_id = 1001;
```

then:

```
SELECT *
FROM TABLE (DBMS_XPLAN.DISPLAY);
```

But for real tuning is more useful the plan of the query that actually ran.

---

# 12. DBMS\ _ XPLAN.DISPLAY\ _ CURSOR

You can execute:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM transactions
WHERE account_id = 1001;
```

then:

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

Here is one of the most important comparisons:

```
E-Rows
A-Rows
```

where:

```
E-rows = Estimated Rows
A-Rows = Current Rows
```

---

# 13. E-Rows vs A-Rows

Suppose:

```
E-Rows = 10
A-Rows = 500000
```

We have a huge difference.

The optimiser thought they'd come:

```
10 rows
```

But in reality, they came:

```
500,000
```

This error may cause Oracle to choose:

```
Nested Loops
```

when:

```
Hash Join
```

it would have been more appropriate.

Therefore:

> **One of the most important things in tuning is to look for the first big difference between E-Rows and A-Rows.**

---

# 14. How do you read the plan

We have already discussed the very important rule:

> **the plan is understood from the deepest operations and following the flow of data to the parent operations.**

Example:

```
SELECT STATEMENT
► HASH JOIN
► TABLE ACCESS FULL DIM_ACCOUNT
TABLE ACCESS FULL FACT_TRANSACTION
```

Conceptual:

```
DIM_ACCOUNT
      \
HASH JOIN
      /
FACT_TRANSACTION
```

Oracle produces the children's ranks and transmits them to the job.

It's not enough to simply read the top-down lines.

---

# 15. ACCESS vs FILTER

In Predicate Information you can see:

```
access (...)
```

or:

```
filter (...)
```

The difference is important.

### ACCESS

The preacher is used to find the ranks.

Example:

```
Access (= 1001)
```

with an index:

```
INDERANGE SCAN
```

---

### FILTER

Oracle reads the lines and then eliminates some of them.

Example:

```
Filter ()
```

Conceptual:

```
read 1,000,000
       ↓
filter
       ↓
returns 10,000
```

In tuning it is important to see:

```
Rows read
versus
Rows returned
```

---

# 16. SARGabilty

A prediction is SARGable when Oracle can effectively use an access structure, for example an index.

Good example:

```
WHERE transaction_date = DATE '2026-01-01'
AND transaction_date - DATE '2027-01-01'
```

---

## Common problem

```
WHERE EXTRACT (YEAR FROM transaction_date) = 2026
```

or:

```
WHERE TO_CHAR (transaction_date, 'YYYY') = '2026'
```

The function applied to the column may prevent the effective use of an ordinary index.

Better:

```
WHERE transaction_date = DATE '2026-01-01'
AND transaction_date - DATE '2027-01-01'
```

This rule is also very important for **partition pruning**.

---

# 17. Functions on indexed columns

We have:

```
CREATEQ1QX ix_customer_name
ON custodian (customer_name);
```

Query:

```
WHERE UPPER (customer_name) = 'RAOUL'
```

Normal index on:

```
customer_name
```

it is not necessarily usable efficiently.

You can create a function-based index:

```
CREATEQ1QX ix_customer_upper_name
ON custodian (UPPER (customer_name));
```

Now:

```
WHERE UPPER (customer_name) = 'RAOUL'
```

can benefit from the index.

---

# 18. Join Algoriths

The optimiser must also decide how **executes the** joints.

The three important ones are:

```
Nested Loops
Hash Join
Sort Merge Join
```

---

# 19. Nested Loops

Conceptual:

```
for each row of A
seek the appropriate rows of B
```

Very good when the first set is small and the second has index.

Example:

```
CUSTOMER
1 row
    ↓
look index
    ↓
TRANSACTIONS
```

Plan:

```
NESTED LOOPS
INDEX UNIQUE SCAN PK_CUSTOMER
INDEX RANGE SCAN IX_TRX_CUSTOMER
```

Typical OLTP.

---

# 20. Hash Join

It's very important in DWH.

Example:

```
SELECT...
FROM fact_transaction f
JOIN dim_account
ON a.account_key = f.account_key;
```

We have:

```
FACT_TRANSACTION = 500 million rows
DIM_ACCOUNT = 1 million
```

Oracle can build a hash table from one of the sets and use it for the join.

Plan:

```
HASH JOIN
TABLE ACCESS FULL DIM_ACCOUNT
TABLE ACCESS FULL FACT_TRANSACTION
```

That can be a very good choice.

---

# 21. Sort Merge Join

Conceptual:

```
Sort A
Sort B
   ↓
Go
```

It can occur especially when:

- the data must be sorted anyway;
- the job is not strictly equal;
- The other conditions make it go join competitive.

In many OLTP/DWH workshops you will encounter more often:

```
Nested Loops
Hash Join
```

---

# 22. OLTP vs DWH

The optimiser can produce very different plans for the two types of workload.

### OLTP

Query:

```
SELECT *
FROM account
WHERE account_id =: id;
```

Probably:

```
INDEUNIQUE SCAN
```

or:

```
INDERANGE SCAN
```

and:

```
Nested Loops
```

---

### DWH

Query:

```
SELECT
d.year,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_date d
ON d.date_key = f.date_key
GROUP BY d.year;
```

You can see:

```
TABLEQ1QX FULL
HASH JOIN
HASHQ1QX BY
PARALLEL EXECUTION
```

These are no signs that the query is bad.

---

# 23. Histograms

Suppose we have:

```
STATUS

SUCCESS 99.5%
ERROR 0.5%
```

If the optimiser involves uniform distribution, it may misestimate:

```
WHERE status = 'ERROR'
```

A histogram can help him know that:

```
ERROR is rare
SUCCESS is very common
```

Thus plans for:

```
WHERE status = 'ERROR'
```

and:

```
WHERE status = 'SUCCESS'
```

they can be different.

---

# 24. Bind Variables

Example:

```
SELECT *
FROM transactions
WHERE account_id =: account_id;
```

Bind variables are important for:

- reducing hard parsing;
- re-use of trainees;
- protection against SQL injection in the application code;
- scalability.

But the uneven distribution of data can complicate the choice of plan.

Example:

```
account 1 → 10 transactions
account 2 → 5,000,000 transactions
```

The same SQL may need conceptually very different strategies.

This is where more advanced concepts like:

```
bind peeking
adaptive cursor sharing
```

---

# 25. Clustering Factor

Clustering factor shows about how well the index order correlates with the physical order of the rows in the table.

We're imagining two situations.

### Good

Index:

```
1
2
3
4
5
```

Table:

```
1 2 3 4 5
```

Access to ROWID-uri reaches relatively few blocks.

---

### Weaknesses

Index:

```
1
2
3
4
5
```

but the physical rows are scattered:

```
block 900
block 12
block 700
block 30
block 850
```

Oracle can estimate that the index causes too many I/O-uri and prefers:

```
TABLEQ1QX FULL
```

---

# 26. Composite Index

Index:

```
CREATEQ1QX ix_trx_acc_date
ON transactions (account_id, transaction_date);
```

It's very good for:

```
WHERE account_id =: account
AND transaction_date; date_from
```

The order of the columns is important.

In general:

```
(account_id, transaction_date)
```

is not equivalent in terms of access to:

```
(transaction_date, account_id)
```

You have to design the indexes from the workload, not just the individual columns.

---

# 27. Partition Pounding

Very important in DWH.

We have:

```
CREATEQ1QX fact_transaction
(
transaction_id NUMBER,
transaction_date DATE,
amount NUMBER
)
PARTITION BY RANGE (transaction_date)
(
PARTITION p2025 VALUES LESS THAN (DATE '2026-01-01'),
PARTITION p2026 VALUES LESS THAN (DATE '2027-01-01'),
PARTITION pmax VALUES LESS THAN (MAXVALUE)
);
```

Query:

```
SELECT SUM (amount)
FROM fact_transaction
WHERE transaction_date = DATE '2026-01-01'
AND transaction_date; DATE '2027-01-01';
```

The Oracle can only access:

```
P2026
```

instead of the whole table.

This is:

> **partition pressing**

In an DWH can produce huge differences.

---

# 28. Predicate Pushdown

The idea is to filter out as early as possible.

Instead of:

```
10,000,000 rows
        ↓
JOIN
        ↓
FILTER
        ↓
10,000 rows
```

is preferable when possible:

```
10.000,000
     ↓
FILTER
     ↓
10,000
     ↓
JOIN
```

The optimiser is trying to convert the query to reduce the processed volumes as early as possible.

---

# 29. Query Transformations

The optimiser doesn't necessarily execute the SQL- exactly in the form you wrote it.

It can make transformations like:

```
predicated pushing
view walking
subquery unnesting
Common elimination
OR expansion
star transformation
```

So:

```
SQL text
```

and:

```
execution tree
```

You don't have to have a one-to-one textual correspondence.

---

# 30. materialized View Query Rewrite

In DWH you can have:

```
CREATE MATERIALIZED VIEW mv_monthly_sales
AS
SELECT
account_type,
TRUNC (transaction_date, 'MM') month_id,
SUM (amount) total_amount
FROM fact_transaction
GROUP BY
account_type,
TRUNC (transaction_date, 'MM');
```

A query on the base table may, under certain conditions, be rewritten to use materialized the view.

Conceptual:

```
FACT_TRANSACTION
500,000,000 rows
```

becomes:

```
MV_MONTHLY_SALES
20,000 rows
```

This can be an extraordinary optimization in BI/DWH.

---

# 31. Parallel Execution

For large DWH querys:

```
SELECT / * + PARALLEL (f 4) * /
SUM (amount)
FROM fact_transaction f;
```

The Oracle can divide the work between several processes.

But:

> Parallelism does not automatically mean better performance.

May increase:

- CPU;
- I/O;
- general consumption of resources;
- competition with other querys.

---

# 32. The most important columns in ALLSTATS LAST

A real plan may contain:

```
Starts
E-Rows
A-Rows
A-Time
Buffers
Reads
```

Very important:

### Starts

How many times the operation has been performed.

---

### E-Rows

Estimated Rows.

---

### A-Rows

Actual Rows.

---

### Buffers

How many blocks have been accessed logically.

It is often one of the most useful indicators for tuning.

---

# 33. The Classical Problem Nested Loops

Imagination:

```
NESTED LOOPS
A → 100,000 rows
INDEX LOOKUP B
```

If the look-up in B is on for each row of A:

```
Starts = 100,000
```

you can have an enormous amount of access.

The individual plan seems innocent:

```
INDERANGE SCAN
```

but it's repeated:

```
100,000 times
```

This shows why you don't have to look at a single isolated line.

---

# 34. Example DWH

Query:

```
SELECT
c.segment,
SUM (f.amount)
FROM fact_transaction f
JOIN dim_customer c
ON c.customer_key = f.customer_key
WHERE f.transaction_date = DATE '2026-09-01'
AND f.transaction_date - DATE '2026-10-01'
GROUP BY c.segment;
```

A reasonable plan may be conceptual:

```
HASHQ1QX BY
    ↓
HASH JOIN
    ↓
− TABLE ACCESS FULL DIM_CUSTOMER
    │
− PARTITION RANGE SINGLE
            ↓
TABLE ACCESS FULL FACT_TRANSACTION
```

Why is it good?

```
partition pruning
        +
Full scan only on required partition
        +
hash join
        +
hash aggregation
```

We don't automatically want indexes everywhere.

---

# 35. Example of estimation problem

Plan:

```
Operation E-Rows A-Rows

TABLE ACCESS DIM 10 12
HASH JOIN 100 800,000
TABLE ACCESS FACT 120 900,000
```

First question:

> Where does the first major deviation occur between estimation and reality?

Probably in access to FACT.

This is where we investigate:

```
Statistics?
histogram?
Preached?
correlation between columns?
function?
Data type?
Band Variable?
partition pruning?
```

---

# 36. Extended Statistics

Suppose:

```
COUNTRY
CITY
```

Values are correlated.

For example:

```
COUNTRY = 'RO'
CITY = 'Bucharest'
```

The optimiser may simply assume that the two conditions are independent.

For highly correlated columns **extended statistics** may be useful.

Conceptual example:

```
SELECT DBMS_STATS.CREATE_EXTENDED_STATS (
Ownname = "'DEV_LAB',"
Tabnames = "'CUSTOMER'"
Expansion = * '(COUNTRY, CITY)'
)
FROM dual;
```

---

# 37. Hints

You can see:

```
SELECT / * + INDEX (t ix_trx_account) * /
*
FROM transactions t
WHERE account_id = 1001;
```

or:

```
/ * + USE_HASH (a b) * /
```

or:

```
/ * + LEADING (a b) * /
```

Hints can influence the optimizer.

But the good rule is:

> **Hints are tools, not the first treatment for any slow query.**

Before you check:

```
Statistics
cardinality
predicates
indexes
SQL design
date volumes
partitioning
```

---

# 38. What do you check when an SQL is slow

A good workflow:

```
1. Identifying the real query
        ↓
2. Get real plan execution
        ↓
3. Read the flow of operations
        ↓
4. Compare E-Rows to A-Rows
        ↓
5. Checking Starts
        ↓
6. Checking Buffers
        ↓
7. Identify the operation where the volume explodes
        ↓
8. Checking predicates
        ↓
9. Check access path
        ↓
10. Checking statistics
        ↓
11. I'm checking the joint method
        ↓
12. Checking partition pounding
        ↓
13. Modify SQL/index / schedule only after diagnosis
```

This is a very good pattern and for review.

---

# 39. What to NU do

Avoid naive rules:

```
FULL SCAN = bad
INDEX = good
HASH JOIN = bad
NESTED LOOPS = good
High cost = query slow
hint = solution
more indexes = faster
```

None of them are universally true.

Optimizer tuning is about:

> **volume + selectivity + cardinality + access + joint + real cost of operations.**

---

# 40. Complete example of laboratory Oracle 26ai

We assume:

```
CREATE TABLE opt_test AS
SELECT
LEVEL
MOD (LEVEL, 100,000) customer_id,
MOD (LEVEL, 10) status_id,
DATE '2025-01-01' + MOD (LEVEL, 700) trx_date,
ROUND (DBMS_RANDOM.VALUE (1.10,000), 2) amount
FROM dual
CONNECT BY LEVEL;
```

Collect statistics:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
USER,
'OPT_TEST'
);
END;
/
```

Test:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM opt_test
WHERE customer_id = 47382;
```

then:

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

You'll probably initially see:

```
TABLEQ1QX FULL
```

Create index:

```
CREATEQ1QX ix_opt_customer
ON opt_test (customer_id);
```

Reset SQL-.

Compare:

```
access path
E-Rows
A-Rows
Buffers
```

---

# 41. Exercise 2

Compare:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM opt_test
WHERE customer_id = 123;
```

with:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM opt_test
WHERE status_id = 3;
```

The custodian\ _ id has many distinct values.

The status\ _ id has only:

```
0... 9
```

Question:

> Why could an index be attractive to the custodian\ _ id, but much less attractive to the status\ _ id?

Answer:

**selectivity.

---

# 42. Exercise 3

Create:

```
CREATEQ1QX ix_opt_date
ON opt_test (trx_date);
```

Compare:

```
WHERE TRUNC (trx_date) = DATE '2026-01-10'
```

with:

```
WHERE trx_date = DATE '2026-01-10'
AND trx_date - DATE '2026-01-11'
```

Study:

```
INDERANGE SCAN
TABLEQ1QX FULL
Predicted Information
Buffers
```

---

# 43. Exercise 4 - E-Rows vs A-Rows

Execute:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
*
FROM opt_test
WHERE status_id = 1;
```

See:

```
E-Rows
A-Rows
```

Then experiment with statistics and data distribution.

The goal is not only to achieve a quick plan, but to understand:

> **why the optimizer thought there would be N rows.**

---

# 44. DWH Exercise

On our lab schematics:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_DATE
FACT_TRANSACTION
```

run:

```
SELECT / * + GATHER_PLAN_STATISTICS * /
d.year_num,
a.account_type,
SUM (f.amount) total_amount
FROM fact_transaction f
JOIN dim_account
ON a.account_key = f.account_key
JOIN dim_date d
ON d.date_key = f.date_key
GROUP BY
d.year_num,
a.account_type;
```

Analyze:

```
scans
order of joints
type of joints
E-Rows / A-Rows
Starts
Buffers
GROUP BY
```

Don't start with the question:

> Why doesn't he use the index?

Start from:

> How much information must be processed and what is the cheapest way to process it?

---

## Questions and answers

**What is CBO?
Cost Based Optimizer compares various possible plans using statistics and cost estimates.

**What is cardinal?**
Estimated number of rows produced by an operation.

**What is selectivity?
The proportion of rows that satisfy a prediction.

**TABLE ACCESS FULL is bad?**
No. It can be optimal when a large part of the table is read, especially in DWH.

**INDEX RANGE SCAN vs INDEX UNIQUE SCAN?**
Unique Scan finds maximum one entry for a single key; Range Scan can return several entries.

**Nested Loops vs hash Join?**
Nested Loops is effective for small exterior sets and indexed access; Hash Join is frequently better for large volumes and equal joints.

**What do you first check in a slow query?**
The real plan, the volumes, E-Rows vs A-Rows, Starts, Buffers and preachers.

**What does E-Rows 10 / A-Rows 1.000,000 indicate?**
A major miscarriage of cardinality that can lead the optimiser to an inappropriate plan.

**What is partition pruning?**
Elimination of partitions that cannot contain the required rows.

**Why can Oracle ignore an index?**
Because they estimate that access through the index costs more than scanning the table.

---

## Questions and answers

Interviewer:

> We have a query DWH that has become much slower. How do you investigate it?

A very good answer:

> I'm starting with the actual execution plan, I'm not directly assuming that an index is missing. I'm using DBMS\ _ XPLAN.DISPLAY\ _ CURSOR with execution statistics and comparing E-Rows with A-Rows. I'm looking for the first operation where the estimation differs significantly from reality, I check Starts and Buffers, then the predications, types of join and access path. If the estimates are wrong I check the statistics and data distribution; only then do I decide whether the SQL-, statistics, indexation or physical design need to be modified.

It shows that you think like a developer who makes **diagnostic**, not like someone who mechanically adds indexes.

---

# 47. Mental Pattern to Memorize

You can remember the whole module like this:

```
SQL
                     │
                     ▼
OPTIMIZER
                     │
       ┌─────────────┼─────────────┐
       │             │             │
Statistics Cardinality Selection
       │             │             │
       └─────────────┼─────────────┘
                     ▼
EXECUTION PLAN
                     │
       ┌─────────────┼─────────────┐
       │             │             │
Access Path Join Method Join Order
       │             │             │
       ▼             ▼             ▼
Index Nested Loop Driving
Full Scan hash join table
Partition Merge Join
                     │
                     ▼
REAL EXECUTION
                     │
         ┌───────────┼────────────┐
         ▼           ▼            ▼
E-Rows A-Rows Buffers
                     │
                     ▼
TUNING
```

---

# What should remain after module 10

For **Oracle Data Developer / DWH Developer**, the most important ideas are:

1. **Oracle uses Cost Based Optimizer.**
2. **Optimizer depends on statistics and cardinality estimates.**
3. **The cost is not time in seconds.**
4. **TABLE ACCESS FULL is not automatically bad.**
5. **The index is not automatically good.**
6. **Selectivity strongly influences the choice of access to the path.**
7. **E-Rows vs A-Rows is fundamental for diagnosis.**
8. **Nested Loops is commonly suitable for small volumes / OLTP.**
9. **Hash Join is very important for large volumes / DWH.**
10. **Starts and Buffers can explain why an apparently cheap operation becomes expensive.**
11. **Predicates SARGable and partition pruning are essential.**
12. **A query is optimized by plan and actual volumes, not by type rules.**

The next topic worth studying in depth is **reading DBMS_XPLAN from the bottom up**, using increasingly complex plans: INDEX UNIQUE SCAN → INDEX RANGE SCAN → NESTED LOOPS → HASH JOIN → a DWH plan with PARTITION PRUNING and HASH GROUP BY.

---

## Questions and answers

### How would you briefly explain the Oracle Optimizer to a colleague who knows SQL, but not this area?

Oracle Optimizer covers co-based optimization, statistics, cardinality and selectivity, access steps and join order. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to the Oracle Optimizer?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Oracle Optimizer, explicitly follow the cost-based optimization, statistics, cardinality and selectivity, access paths and join order and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

A DWH interrogation goes from 30 seconds to 20 minutes.
