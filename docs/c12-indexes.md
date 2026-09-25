---
title: 'C12. Oracle Indexes'
description: 'Complete English handbook chapter based on the original C12 course.'
sidebar_position: 12
---

# C12. Oracle Indexes

<div className="chapter-kicker">Chapter C12 · Complete course</div>

This chapter covers **Oracle indexes** in a concise but practical way for SQL tuning, OLTP, and DWH workloads.

# C12. Oracle Indexes

## 1. What is an index

An **index** is a separate data structure that Oracle can use to locate rows more efficiently.

Without the index, Oracle may be forced to read a large part or even the entire table:

```text
TABLE ACCESS FULL
```

With a suitable index, Oracle can quickly locate the values sought and then access the appropriate rows:

```text
INDEX RANGE SCAN
   ↓
TABLE ACCESS BY INDEX ROWID
```

The fundamental idea:

```text
TABLE
- * * - * *
- * * - * * *
 ├── ...
* * * *

INDEX
value → ROWID → row of the table
```

`ROWID` indicates the physical position of the row.

The index can accelerate:

- `WHERE`
- `JOIN`
- verification of `PRIMARY KEY` / `UNIQUE` constraints
- sometimes `ORDER BY`
- sometimes `GROUP BY`
- certain aggregation and access of DWH

But the index also has costs:

```text
INSERT
UPDATE
DELETE
```

must also update the indexes.

Therefore:

> More indexes do **not** automatically improve performance.

---

## 2. B-tree index

It is Oracle's standard and most commonly used index type.

```sql
CREATE INDEX ix_customers_email
ON customers(email);
```

Conceptual structure:

```text
ROOT
               |
        ----------------
        |              |
BRANCH BRANCH
        |              |
LEAF LEAF
```

The leaves contain approximately:

```text
indexed value + ROWID
```

It's very good for:

```sql
WHERE customer_id = 100
```

or:

```sql
WHERE transaction_date BETWEEN DATE '2026-01-01'
                           AND DATE '2026-01-31'
```

or:

```sql
WHERE amount > 10000
```

B-tree is especially suitable for columns with good selectivity.

Example:

```text
CUSTOMER_ID
1
2
3
4
5
...
10,000,000
```

Search:

```sql
WHERE customer_id = 834729
```

It's very selective.

---

## 3. Unique index

A unique index does not allow two identical entries for the combination of indexed columns.

```sql
CREATE UNIQUE INDEX ux_customers_email
ON customers(email);
```

Important:

`UNIQUE INDEX` and `UNIQUE CONSTRAINT` are not exactly the same thing.

Constraint:

```sql
ALTER TABLE customers
ADD CONSTRAINT uq_customers_email UNIQUE(email);
```

Oracle can create or use a unique index for the implementation of the constraint.

Conceptual:

```text
UNIQUE / PRIMARY KEY
        ↓
logic rule of integrity

INDEX
        ↓
physical access structure
```

A useful distinction is:

> PRIMARY KEY and UNIQUE are logical constraints. The index is a physical structure used for access and sometimes for the implementation of constraints.

---

## 4. Composite index

An index may contain several columns.

```sql
CREATE INDEX ix_orders_customer_date
ON orders(customer_id, order_date);
```

The order of the columns is extremely important.

Index:

```text
(customer_id, order_date)
```

is very suitable for:

```sql
WHERE customer_id = 100
AND order_date >= DATE '2026-01-01'
```

and may also be used for:

```sql
WHERE customer_id = 100
```

But it is generally less suitable for:

```sql
WHERE order_date = DATE '2026-01-01'
```

because the first column of the index is missing.

---

### 4.1. Leading column

The first column is commonly called:

```text
leading column
```

For:

```sql
CREATE INDEX ix_test
ON transactions(account_id, transaction_date);
```

the order is:

```text
account_id
    ↓
transaction_date
```

It's very good for:

```sql
WHERE account_id = 100
```

and:

```sql
WHERE account_id = 100
AND transaction_date >= DATE '2026-01-01'
```

---

## 5. How to choose column order

There is no simplistic rule:

> always put the most selective first column.

The following should be considered:

- the real queries;
- predicates used together;
- equality predicates;
- range conditions,
- sorting;
- selectivity;
- the distribution of data.

Example:

```sql
WHERE source_system = 'CRM'
AND source_customer_id = 918273
```

In an DWH can be very useful:

```sql
CREATE INDEX ix_customer_source
ON dim_customer(source_system, source_customer_id);
```

Especially for ETL lookups.

---

## 6. INDEX RANGE SCAN

Example:

```sql
SELECT *
FROM transactions
WHERE account_id = 100;
```

With:

```sql
CREATE INDEX ix_transactions_account
ON transactions(account_id);
```

Oracle may produce:

```text
SELECT STATEMENT
TABLE ACCESS BY INDEX ROWID TRANSACTIONS
INDEX RANGE SCAN IX_TRANSACTIONS_ACCOUNT
```

Read from the bottom up:

```text
INDEX RANGE SCAN
        ↓
get ROWIDs

TABLE ACCESS BY INDEX ROWID
        ↓
read the rows in the table
```

---

## 7. INDEX UNIQUE SCAN

If Oracle is looking for an exact value in a unique index:

```sql
SELECT *
FROM customers
WHERE customer_id = 100;
```

and:

```text
CUSTOMER_ID = PRIMARY KEY
```

the plan may contain:

```text
INDEX UNIQUE SCAN
```

Conceptual example:

```text
INDEX UNIQUE SCAN PK_CUSTOMERS
        ↓
TABLE ACCESS BY INDEX ROWID CUSTOMERS
```

The Oracle knows that at most one row can correspond to the value.

---

## 8.TABLE ACCESS FULL vs index

One very important thing:

> Full Table Scan is not automatically bad.

Example:

```sql
SELECT *
FROM transactions
WHERE status = 'PROCESSED';
```

If:

```text
95% of the table has status = PROCESSED
```

an index on `status` may not be useful.

Oracle may prefer:

```text
TABLE ACCESS FULL
```

instead of doing:

```text
INDEX
 ↓
million ROWID-uri
 ↓
million access to the table
```

In an DWH this behavior is very common.

---

## 9. Selectivity

Selectivity indicates how restrictive a sermon is.

Example:

```sql
WHERE customer_id = 100
```

out of 10 million customers:

```text
1 / 10,000,000
```

Excellent selectivity.

But:

```sql
WHERE gender = 'M'
```

may return approximately:

```text
50%
```

in the table.

B-tree can be less useful here.

---

## 10. Cardinality

The cardinal in the execution plan is the estimated number of lines.

Example:

```text
E-Rows = 10
```

means:

> The optimizer estimates that the operation will produce about 10 rows.

The estimation of cardinality influences the choice between:

```text
INDEX RANGE SCAN
TABLE ACCESS FULL
NESTED LOOPS
HASH JOIN
```

---

## 11. Bitmap index

Bitmap indexes are very important in DWH.

Example:

```sql
CREATE BITMAP INDEX bix_customer_status
ON dim_customer(status);
```

Very suitable for columns such as:

```text
stasis
gender
segment
country
risk_category
```

where the number of distinct values is relatively small.

Conceptual:

```text
STATUS

ACTIVE
101101001...

INACTIVE
010010110...
```

Oracle can very effectively combine bitmaps:

```sql
WHERE gender = 'F'
AND status = 'ACTIVE'
AND segment = 'PREMIUM'
```

---

## 12. Bitmap index: where is good

In particular:

```text
DWH
BI
reporting
analytics
```

where the data are:

```text
read a lot
Relatively rare change
```

Example:

```text
DIM_CUSTOMER
-----------
gender
segment
stasis
country
risk_category
```

Bitmap indexes can be very effective.

---

## 13. Bitmap index: where NU is good

In OLTP systems with many:

```text
INSERT
UPDATE
DELETE
```

and high competition.

Bitmap indexes can cause locking much wider than B-tree.

Practical rule:

```text
OLTP → predominant B-tree

DWH → B-tree + Bitmap + Partitioning
```

---

## 14. Function-based index

Problem:

```sql
SELECT *
FROM customers
WHERE UPPER(last_name) = 'IONESCU';
```

We have the index:

```sql
CREATE INDEX ix_customer_last_name
ON customers(last_name);
```

This may not be appropriate because the query applies:

```text
UPPER (last_name)
```

We can create:

```sql
CREATE INDEX ix_customer_upper_last_name
ON customers(UPPER(last_name));
```

Now:

```sql
WHERE UPPER(last_name) = 'IONESCU'
```

can use the index.

---

## 15. Important example with TRUNC (data)

Query:

```sql
SELECT *
FROM transactions
WHERE TRUNC(transaction_date) = DATE '2026-09-22';
```

We have the index:

```sql
CREATE INDEX ix_transactions_date
ON transactions(transaction_date);
```

Application of the function:

```text
TRUNC (transaction_date)
```

may prevent the efficient use of the index.

A better option:

```sql
WHERE transaction_date >= DATE '2026-09-22'
AND transaction_date <  DATE '2026-09-23'
```

This shape is more sargable.

---

## 16. Or function-based index

If the application has to use:

```sql
TRUNC(transaction_date)
```

we can create:

```sql
CREATE INDEX ix_transactions_trunc_date
ON transactions(TRUNC(transaction_date));
```

But before creating the index you have to ask:

> Can we rewrite the query?

A new index should not be the first automatic solution for any performance problem.

---

## 17. LIKE and indexes

This query can well use an B-tree index:

```sql
WHERE last_name LIKE 'ION%'
```

because we know the beginning of value.

But:

```sql
WHERE last_name LIKE '%ION%'
```

does not generally allow an effective B-tree range scan.

Conceptual:

```text
LIKE 'ABC%'
     ↑
We know where the index search begins

LIKE '%ABC%'
     ↑
We don't know where it starts.
```

---

## 18. Default Conversion

We assume:

```text
customer_code VARCHAR2 (20)
```

and query:

```sql
WHERE customer_code = 100
```

The Oracle must make an implicit conversion.

This may affect:

- index usage;
- the estimation of cardinality;
- performance;
- fairness.

Right:

```sql
WHERE customer_code = '100'
```

Important principle:

> the type of parameter shall correspond to the type of column.

---

## 19. Descending index

Oracle allows downward indexation:

```sql
CREATE INDEX ix_transactions_date_desc
ON transactions(transaction_date DESC);
```

It can be useful in certain scenarios with:

```sql
ORDER BY transaction_date DESC
```

But Oracle can go through an B-tree and vice versa, so that an `DESC` index should not be created automatically for an `ORDER BY DESC` alone.

---

## 20. Reverse key index

Example:

```sql
CREATE INDEX ix_transactions_id_reverse
ON transactions(transaction_id)
REVERSE;
```

Oracle reverses conceptually bytes of the key.

Main purpose:

> reducing the contention on the right blocks of an index for rising keys.

Example:

```text
100001
100002
100003
100004
```

In a normal index, insertions often end up in the same area.

Reverse key better distribute inserts.

Important disadvantage:

> It's not right for the range scan.

Query:

```sql
WHERE transaction_id BETWEEN 100000 AND 200000
```

does not normally benefit from the orderly ownership of the index.

---

## 21. Index-organized table

In a normal table:

```text
INDEX
↓ ROWID
TABLE
```

In an IOT:

```text
PRIMARY INDEX
        ↓
the row is stored directly in the index structure
```

Example:

```sql
CREATE TABLE account_lookup (
    account_id NUMBER PRIMARY KEY,
    account_code VARCHAR2(30),
    status VARCHAR2(20)
)
ORGANIZATION INDEX;
```

It is particularly useful for tables that are predominantly accessed through primary key.

---

## 22. Partioned indexes

For partitioned tables, indexes may be:

```text
LOCAL
GLOBAL
```

---

## 22.1 Local index

Each partition of the table has the corresponding partition of the index.

Conceptual:

```text
TABLE

P2024 Carol INDEX
P2025 Carol INDEX
P2026 Carol INDEX
```

Very useful in DWH.

Advantages:

- simple administration;
- maintenance partition;
- DWH charges;
- partition pruning,
- Partition exchange.

---

## 22.2 Global index

The index covers several or all partitions of the table.

```text
TABLE
P2024
P2025 → GLOBAL INDEX
P2026
```

May be useful for searches that do not include the partition key.

But maintenance operations on partitions can be more complicated.

---

## 23. Example DWH

We assume:

```text
FACT_TRANSACTIONS

transaction_id
account_id
transaction_date
% 1
channel_id
stasis
```

The table is partitioned after the month:

```sql
PARTITION BY RANGE(transaction_date)
```

Possible design:

```text
transaction_date → partitioning

account_id → B-tree local index

status → possibly bitmap index

channel_id → possible bitmap index
```

But design has to be decided on the basis of real work.

---

## 24. Domain index

An `DOMAIN INDEX` is implemented through a specialized extension.

May occur for technologies such as:

- Oracle Text;
- spatial;
- Special types of data.

Conceptual example:

```sql
CREATE INDEX ix_document_text
ON documents(content)
INDEXTYPE IS CTXSYS.CONTEXT;
```

For the Data Developer technical review, it is generally enough to know what it represents; it is not as important as:

```text
B-tree
composites
Unique
bitmap
function-based
reverse key
Partioned
```

---

## 25. Covering index

Conceptually, an index may contain all the necessary columns of the query.

Example:

```sql
SELECT customer_id, order_date
FROM orders
WHERE customer_id = 100;
```

Index:

```sql
CREATE INDEX ix_orders_customer_date
ON orders(customer_id, order_date);
```

Oracle can sometimes get all the data directly from the index without:

```text
TABLE ACCESS BY INDEX ROWID
```

The plan could only be:

```text
INDEX RANGE SCAN
```

This concept is commonly called:

```text
Covering index
```

Although Oracle does not have an identical `INCLUDE` clause SQL Server for classic B-tree indexes.

---

## 26. Clustering factor

`CLUSTERING_FACTOR` indicates about how well the physical order of the rows in the table corresponds to the index order.

It can be seen in:

```sql
SELECT
    index_name,
    clustering_factor
FROM user_indexes
WHERE table_name = 'TRANSACTIONS';
```

Clustering small factor:

```text
rows with close values are physically close
```

Clustering large factor:

```text
ROWID- are dispersed through many blocks
```

A clustering bad factor can make Oracle prefer:

```text
TABLE ACCESS FULL
```

for bigger crowns.

---

## 27. Statistics

The optimizer decides whether to use an index based on the estimated cost.

He needs statistics like:

```text
num_rows
num_distinct
density
histograms
clustering_factor
num_blocks
```

Collection:

```sql
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => USER,
        tabname => 'TRANSACTIONS'
    );
END;
/
```

A good index with bad statistics can produce a bad plan.

---

## 28. Histograms

We assume:

```text
STATUS

SUCCESS = 98%
FAILED = 1%
PENDING = 1%
```

Simple statistics may not sufficiently reflect uneven distribution.

Histograms help optimizer to distinguish between:

```sql
WHERE status = 'SUCCESS'
```

and:

```sql
WHERE status = 'FAILED'
```

The first one could favor:

```text
FULL SCAN
```

and the second:

```text
INDEX RANGE SCAN
```

---

## 29. Sargability

A sermon is sargable when it allows efficient access through the index.

Good:

```sql
WHERE transaction_date >= DATE '2026-09-01'
AND transaction_date < DATE '2026-10-01'
```

More problematic:

```sql
WHERE TO_CHAR(transaction_date, 'YYYY-MM') = '2026-09'
```

Good:

```sql
WHERE customer_code = '100'
```

Problem:

```sql
WHERE TO_NUMBER(customer_code) = 100
```

Good:

```sql
WHERE last_name LIKE 'ION%'
```

More problematic:

```sql
WHERE last_name LIKE '%ION%'
```

---

## 30. ACCESS vs FILTER predicates

In `DBMS_XPLAN`, Oracle can show:

```text
access (...)
filter (...)
```

`ACCESS`:

> Predicted used to navigate the access structure.

Example:

```text
access (= 100)
```

`FILTER`:

> the condition verified after obtaining the candidate rows.

Example:

```text
Filter ()
```

For tuning, the difference is important.

---

## 31. How to check if the index is used

Example:

```sql
SELECT /*+ GATHER_PLAN_STATISTICS */
       *
FROM transactions
WHERE account_id = 100;
```

Then:

```sql
SELECT *
FROM TABLE(
    DBMS_XPLAN.DISPLAY_CURSOR(
        NULL,
        NULL,
        'ALLSTATS LAST +PREDICATE +ALIAS'
    )
);
```

We can see:

```text
INDEX RANGE SCAN
INDEX UNIQUE SCAN
TABLE ACCESS FULL
TABLE ACCESS BY INDEX ROWID
```

---

## 32. Read the bottom-up plan

Example:

```text
------------------------------------------------------
Did you hear that?
------------------------------------------------------
* * *
TABLE ACCESS BY INDEX ROWID
* 2) INDEX RANGE SCAN
------------------------------------------------------
```

Logical reading:

```text
2. INDEX RANGE SCAN
      ↓
Find ROWID-uri

1. TABLE ACCESS BY INDEX ROWID
      ↓
read the rows

0. SELECT
      ↓
return result
```

It should not simply be read after the number `Id`.

---

## 33. Why Oracle can ignore an index

The most common reasons:

```text
1. The query returns too many lines

2. selectivity is weak

3. Wrong / old statistics

4. column function

5. Default conversion

6. leading collum from the missing index composite

7. Clustering unfavourable factor

8. Full Table Scan is simply cheaper

9. The query uses another better access

10. data distribution is different from optimizer estimation
```

---

## 34. Skip Scan Index

We assume:

```sql
CREATE INDEX ix_employee
ON employees(department_id, employee_id);
```

Query:

```sql
WHERE employee_id = 100
```

Although the first column is missing, Oracle can sometimes use:

```text
INDESKIP SCAN
```

in particular if the first column has few distinct values.

Conceptual:

```text
Department 10 → seeks employee 100
Department 20 → seeks employee 100
Department 30 → seeks employee 100
...
```

It's an interesting optimization, but it doesn't replace the correct design of indexes.

---

## 35. Full Scan Index

It may occur:

```text
INDEFULL SCAN
```

The Oracle reads all the index inputs in order.

It may be useful for example to:

```text
ORDER BY
```

if the index already provides the necessary order.

---

## 36. Fast Full Scan Index

It may occur:

```text
INDEX FAST FULL SCAN
```

The index is read roughly as a compact table.

It doesn't necessarily keep the index order.

It can be chosen when all the data needed for the query exists in the index.

Conceptual:

```text
INDEX FAST FULL SCAN
♪ ♪
FULL TABLE SCAN index
```

---

## 37. Cost of indexes at DML

We assume a table of:

```text
10 indexes
```

For:

```sql
INSERT INTO transactions ...
```

The Oracle must amend:

```text
table
+
index 1
+
index 2
+
...
+
index 10
```

Therefore, in a massive ETL process, too many indexes can significantly reduce load speed.

In certain processes DWH the strategy can be used:

```text
Disable / drop index
        ↓
bulk load
        ↓
rebuild index
```

but only if this is justified operationally.

---

## 38. Real Scenario DWH

We have:

```text
FACT_TRANSACTIONS
500 million rows
```

ETL daily:

```text
5 million new rows
```

Main Query:

```sql
SELECT SUM(amount)
FROM fact_transactions
WHERE transaction_date >= :d1
AND transaction_date < :d2
AND channel_id = :channel;
```

We must not respond automatically:

> I create index on `transaction_date`.

First we look at:

```text
partitioning
channel_id selectivity
returned volumes
bitmap vs B-tree
parallelism
partition pruning
Statistics
execution plan
```

A possible design:

```text
partitioning after transaction_date

bitmap / local index on channel_id

partition pruning on date
```

can be much more effective than a simple global B-tree per date.

---

## 39. Scenario ETL lookup

ETL receives:

```text
source_system
source_customer_id
```

And you have to find the key to the screw:

```text
customer_key
```

Query:

```sql
SELECT customer_key
FROM dim_customer
WHERE source_system = :source_system
AND source_customer_id = :source_customer_id;
```

Very logical index:

```sql
CREATE INDEX ix_dim_customer_source
ON dim_customer(
    source_system,
    source_customer_id
);
```

This is a classic indexation situation for ETL/DWH.

---

## 40. Oracle Exercises 26ai

## Exercise 1

Create:

```sql
CREATE INDEX ix_transactions_account
ON transactions(account_id);
```

Execute:

```sql
SELECT /*+ GATHER_PLAN_STATISTICS */
       *
FROM transactions
WHERE account_id = 100;
```

Analyze:

```sql
SELECT *
FROM TABLE(
    DBMS_XPLAN.DISPLAY_CURSOR(
        NULL,
        NULL,
        'ALLSTATS LAST +PREDICATE'
    )
);
```

Identify:

```text
INDEX RANGE SCAN
TABLE ACCESS BY INDEX ROWID
```

---

## Exercise 2

Compare:

```sql
WHERE transaction_date >= DATE '2026-01-01'
AND transaction_date < DATE '2026-02-01'
```

with:

```sql
WHERE TRUNC(transaction_date, 'MM') = DATE '2026-01-01'
```

See if the plan differs.

---

## Exercise 3

Create:

```sql
CREATE INDEX ix_orders_customer_date
ON orders(customer_id, order_date);
```

Test separately:

```sql
WHERE customer_id = 10
```

```sql
WHERE customer_id = 10
AND order_date >= DATE '2026-01-01'
```

```sql
WHERE order_date >= DATE '2026-01-01'
```

Compare the plans.

---

## Exercise 4

Test:

```sql
WHERE customer_code = '100'
```

and:

```sql
WHERE TO_NUMBER(customer_code) = 100
```

Observe predications and access.

---

## Exercise 5

Create:

```sql
CREATE INDEX ix_customer_upper_name
ON customers(UPPER(last_name));
```

Test:

```sql
WHERE UPPER(last_name) = 'IONESCU'
```

---

## Questions and answers

## 1. What is an index?

Answer:

> An index is a separate table structure that allows Oracle to locate the rows more efficiently. It usually contains the indexed key and ROWID-. It can accelerate SELECT-s, but introduces additional cost to INSERT, UPDATE and DELETE.

---

## 2. What is the most common type of Oracle index?

> B-tree.

It's suitable for lookups and range scans with reasonable selectivity.

---

## 3. Difference between B-tree and bitmap?

> B-tree is generally suitable for OLTP and more selective columns. Bitmap is very effective in DWH for columns with relatively low cardinality and analytical combinations, but is not recommended for OLTP workload with many competing changes.

---

## 4. What is a composite index?

> An index on several columns. The order of columns is important because leading columns influence which queries can use it effectively.

---

## 5. Why does Oracle not use an index?

Good answer:

> Because the optimizer estimates that another method is cheaper. For example, the query can return too many rows, selectivity can be weak, statistics can be incorrect, a function or conversion can affect the prediction, or the full scan can be simply more efficient.

---

## 6. Is Full Table Scan always bad?

> No. In DWH or when the query returns a large proportion of the table, Full Table Scan can can be the most effective choice.

---

## 7. What is a function-based index?

> An index built on the result of an expression, e.g. `UPPER(last_name)` or `TRUNC(transaction_date)`.

---

## 8. What is clustering factor?

> A statistical indicating the relationship between index value order and physical distribution of rows in the table blocks. An unfavourable clustering factor may increase the cost of access through index.

---

## 9. What is reverse key index?

> An B-tree in which the bytes keys are reversed, especially useful for reducing the contention produced by insertions with sequential keys. The main disadvantage is that the range scans are no longer effective.

---

## 10. Local vs Global Partioned Index?

> Local index follows table partitions and is very convenient for maintenance DWH. Global index can cover several partitions and is useful for independent search of partition key, but is more complicated at partition maintenance operations.

---

## 42. Mental pattern for tuning

When you see a slow query, don't start with:

```text
What index should I create?
```

Start with:

```text
1. What's the query trying to do?

2. How many lines does he return?

3. What's the volume of the table?

4. What's his prediction?

5. Are the sermons sargable?

6. Are there any implicit conversions?

7. What indexes are there?

8. What statistics are there?

9. What execution plan do we have?

10. Does E-Rows correspond to A-Rows?

11. Would the index reduce the data enough?

12. Could Full Scan be better?

13. Is it OLTP or DWH?

14. Is there partition pruning?
```

It's after that that you decide:

```text
New index
index change
query rewrite
Statistics
partitioning
or no index
```

---

## 43. What must remain

For a Data Developer Oracle you must remember very well:

```text
B-tree
Unique
Composite
Bitmap
Function-based
Reverse key
Local / Global partitioned indexes
```

and be able to explain:

```text
INDEX UNIQUE SCAN
INDEX RANGE SCAN
INDEFULL SCAN
INDEX FAST FULL SCAN
INDESKIP SCAN

TABLE ACCESS BY INDEX ROWID
TABLE ACCESS FULL
```

But the most important idea is:

> the existence of an index does not mean that Oracle must use it.

Oracle Optimizer compares costs.

Performance depends on:

```text
selectivity
cardinality
Statistics
histograms
Clustering factor
date of distribution
query predicates
sargability
Table size
partitioning
workload OLTP/DWH
```

---

# Summary in a single scheme

```text
INDEXURI ORACLE
                           |
        -----------------------------------------
        |                    |                  |
B-TREE SPECIALE
        |                    |                  |
--cardinality --------
♪ Reduced ♪
Unique Composite DWH FBI Reverse Domain
   |
Lookup / Range
   |
INDEX UNIQUE SCAN
INDEX RANGE SCAN
INDESKIP SCAN
INDEFULL SCAN
INDEX FAST FULL SCAN
   |
ROWID
   |
TABLE ACCESS BY INDEX ROWID

Decision Oracle:
SQL
              ↓
Optimizer
              ↓
selectivity / cardinality
Statistics / histograms
Clustering factor
volumes / predicates
              ↓
       ----------------
       |              |
INDEFULL SCAN
```

## Questions and answers

If you're asked:

**? When do you create an index?

a senior response is:

> I'm not creating an index just because a column appears in an `WHERE`. I'm analyzing the workload, selectivity, cardinality, data distribution, execution of the planet, cost of DML and, in DWH, partitioning. After that I'm checking through execution plan and statistics whether the index effectively reduces I/O and the execution time.

The next logical step after this module is to link **Index + Optimizer + Execution Plans** in one practical example and to follow exactly why the same query can pass from TABLE ACCESS FULL to INDEX RANGE SCAN, including E-Rows, A-Rows, ACCESS, FILTER and cost.

---

## Questions and answers

### How would you briefly explain the Oracle Index to a colleague who knows SQL, but not this area?

The Oracle indexes cover B-tree indexes and unique indexes, composite indexes and leading columns, functional-based indexes. In practice, first, I determine what data enters and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to the Oracle Index?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For the Oracle Indexes, explicitly follow the B-tree indexes and Unique indexes, composite indexes and leading columns, function-based indexes and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the Oracle indexes appear together with logging, auditing, reconciliation and impact analysis.
