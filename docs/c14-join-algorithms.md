---
title: 'C14. Join Algorithms'
description: 'Complete English handbook chapter based on the original C14 course.'
sidebar_position: 14
---

# C14. Join Algorithms

<div className="chapter-kicker">Chapter C14 · Complete course</div>

In Oracle, a **JOIN** logically describes how two or more data sets should be combined. A **join algorithm** describes how Oracle physically performs that operation.

For a Data Developer / DWH Developer, the most important are:

1. **Nested Loops Join**
2. **Hash Join**
3. **Sort Merge Join**

You also need to understand **join order**, indexed access, estimated cardinality, and how these operations appear in `DBMS_XPLAN`.

---

## 14.1. JOIN logic vs. join algorithm

SQL-:

```sql
SELECT e.employee_id,
e.last_name,
d.department_name
FROM employees e
JOIN departments d
ON d.department_id = e.department_id;
```

Just say:

> Combine employees with departments by `department_id`.

The SQL does not tell Oracle **how** to perform the join.

The optimizer can choose, for example:

```
NESTED LOOPS
```

or:

```
HASH JOIN
```

or:

```sql
MERGE JOIN
```

The decision belongs to the **Cost Based Optimizer (CBO)**.

---

## 14.2. What Oracle analyzes before choosing the algorithm

The Oracle shall take account in particular of:

- the estimated number of rows;
- the selectivity of the conditions;
- the existence of indexes;
- the distribution of data;
- statistics;
- histograms;
- available memory;
- Table size;
- the join condition;
- the order of the tables;
- the estimated cost of each variant.

Therefore:

```sql
SELECT...
FROM A
JOIN B ON...
```

does not automatically mean that Oracle processes A first.

The optimizer can reverse order.

---

## 14.3. Nested Loops Join

Conceptual:

```
for each row of A
seek the appropriate rows of B
```

Pseudo-code:

```
FOR each row of A
LOOP
looking for matching rows in B
END LOOP
```

It is conceptually similar to:

```
FOR a IN (SELECT * FROM A)
LOOP
SELECT...
FROM B
WHERE B.id = a.id;
END LOOP;
```

Oracle's actual implementation is much more efficient than this pseudo-code.

---

## Example

We assume:

```
CUSTOMERS
---------
1,000,000 rows

ORDERS
------
50,000,000 rows
```

But the query is only looking for one customer:

```sql
SELECT o. *
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id
WHERE c.customer_id = 100;
```

If there is:

```sql
CREATE INDEX idx_orders_customer
ON orders (customer_id);
```

Oracle can do:

```
CUSTOMERS
   ↓
1 customer
   ↓
index lookup in ORDERS
```

Conceptual plan:

```
NESTED LOOPS
INDEX UNIQUE SCAN customers_pk
TABLE ACCESS BY INDEX ROWID orders
INDEX RANGE SCAN idx_orders_customer
```

---

## 14.4. Outer table and inner table

At Nested Loops we have two important roles.

**Outer table**

It's the source from which Oracle first reads the lines.

**Inner table**

It is the row source Oracle probes for matches for each row in the Outer Table.

Conceptual:

```
Outer table
     |
♪ ♪ ♪
     v
inner-table lookup

♪ ♪ ♪
     v
inner-table lookup

♪ ♪ ♪
     v
inner-table lookup
```

That is why it is very important that the outer table produces relatively few lines.

---

## 14.5. When Nested Loops is very effective

Ideal scenario:

```
Outer small dataset
+
Inner big table
+
Good index on JOIN column
```

Example:

```sql
SELECT *
FROM customers c
JOIN transactions t
ON t.customer_id = c.customer_id
WHERE c.customer_id = 12345;
```

If:

```
CUSTOMERS → 1 row
TRANSACTIONS → millions of rows
```

and:

```
TRANSACTIONS (customer_id)
```

is indexed, Nested Loops is very effective.

---

## 14.6. The classic Nested Loops problem

If the outer table produces:

```
1,000,000 rows
```

and for each Oracle you must look up in Table B:

```
1,000,000 index lookups
```

The operation can become very expensive.

For example:

```
1,000,000 outer rows
×
look index
```

may be slower than the sequential reading of the two tables.

In that case Oracle may prefer:

```
HASH JOIN
```

---

## 14.7. Hash Join

Hash Join is the extremely important algorithm for:

```
DWH
ETL
OLAP
large data sets
```

The principle is completely different from Nested Loops.

Oracle doesn't do:

```
row → look up
row → look up
row → look up
```

Instead it builds a hash structure in memory.

---

## 14.8. The two phases of a Hash Join

Hash Join has conceptual:

```
BUILD
PROBE
```

Suppose:

```
DIM_CUSTOMER
1,000,000 rows

FACT_SALES
500,000,000 rows
```

JOIN:

```sql
SELECT...
FROM fact_sales f
JOIN dim_customer c
ON c.customer_key = f.customer_key;
```

Oracle can do:

### BUILD

Build a hash table from the smaller input:

```
DIM_CUSTOMER
      |
      v
HASH TABLE
```

Conceptual:

```
hash (customer_key)
```

Simplified example:

```
hash (101) → Bucket 7
hash (102) → bucket 3
hash (103) → Bucket 9
```

### PROBE

Then read:

```
FACT_SALES
```

and for each row calculate:

```
hash (customer_key)
```

and probes the corresponding bucket.

---

## 14.9. Conceptual scheme

```
DIM_CUSTOMER
1M rows
      |
* * *
      v
+---------------+
* HASH TABLE *
+---------------+
        ^
        |
* * *
        |
FACT_SALES
500M rows
```

This is very effective for large volumes.

---

## 14.10. Ideal condition for Hash Join

Hash Join is especially suitable for:

```
A.cholumn = B.cholumm
```

i.e. **equi-join**.

Example:

```sql
SELECT *
FROM sales s
JOIN customers c
ON s.customer_id = c.customer_id;
```

Oracle may use:

```
HASH JOIN
```

---

## 14.11. Why Hash Join is common in DWH

In DWH we often have:

```
FACT_SALES 500M
DIM_CUSTOMER 5M
DIM_PRODUCT 500K
DIM_DATE 20K
```

Query:

```sql
SELECT
d.year,
p.category,
SUM(f.amount)
FROM fact_sales f
JOIN dim_date d
ON d.date_key = f.date_key
JOIN dim_product
ON p.product_key = f.product_key
GROUP BY
d.year,
p.category;
```

Oracle may use:

```
HASH JOIN
HASH JOIN
TABLE ACCESS FULL
TABLE ACCESS FULL
TABLE ACCESS FULL
```

This is not necessarily a problem.

In DWH:

> FULL TABLE SCAN + HASH JOIN can be exactly the plan you want.

---

## 14.12. Hash Join and Memory

The hash tablet is built in memory available for SQL operation.

If sufficient memory:

```
HASH JOIN in memory
```

It's very fast.

If the structure does not fit enough into the memory, Oracle can use TEMP space.

Conceptual:

```
Insufficient RAM
       ↓
partitioning
       ↓
TEMP tablespace
       ↓
Additional I/O
```

Performance can decrease significantly.

---

## 14.13. Sort Merge Join

The third important algorithm is:

```sql
MERGE JOIN
```

Principle:

1. sort the two sources by the Join Key;
2. simultaneously goes through the sorted results.

Example:

```
A sorted by customer_id

1
2
4
7
9

B sorted by customer_id

1
2
2
4
6
9
```

Oracle can walk them efficiently.

---

## 14.14. Conceptual

```
TABLE A
   |
SORT
   |
   +------------+
                |
                v
MERGE JOIN
                ^
                |
   +------------+
   |
SORT
   |
TABLE B
```

In execution plan you can see operations such as:

```sql
MERGE JOIN
SORT JOIN
TABLE ACCESS FULL
SORT JOIN
TABLE ACCESS FULL
```

---

## 14.15. When can be useful Sort Merge Join

It is useful in certain situations, in particular:

- already sorted sets;
- sorting is necessary anyway;
- certain non-equi joins;
- Oracle estimates that sort + goes costs less than alternatives.

Non-equi example:

```sql
SELECT *
FROM transactions t
JOIN exchange_rates
ON t.transaction_date BETWEEN r.start_date
AND r.end_date;
```

Hash Join is mainly oriented towards equality:

```
A.x = B.x
```

Sort Merge can also be useful for interval conditions.

---

## 14.16. Nested Loops vs Hash Join

The most important comparison to be memorized:

Features of Nested Loops
- - - - - - - - -
* Small / selective / small *
The Index is very important; it is often not necessary.
* * *
DWH is sometimes very common
Typical condition
Memory may require a lot of memory

Simplified rule:

```
few rows
      ↓
NESTED LOOPS

many lines
      ↓
HASH JOIN
```

But it's not an absolute rule.

---

## 14.17. Sort Merge vs Hash Join

For two large tables and:

```
A.id = B.id
```

Oracle frequently prefers:

```
HASH JOIN
```

for:

```sql
MERGE JOIN
```

because Hash Join does not require complete sorting of both sets.

But if the data is already in the right order or the condition of the joint favors the mercury, the optimizer can choose Sort Merge.

---

## 14.18. Example OLTP

Query:

```sql
SELECT
o.order_id,
o.order_date
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id
WHERE c.customer_id =: customer_id;
```

We assume:

```
CUSTOMERS = 2M
ORDERS = 100M
```

But the filter produces:

```
CUSTOMERS → 1 row
```

and we have:

```sql
CREATE INDEX idx_orders_customer
ON orders (customer_id);
```

Plan likely:

```
NESTED LOOPS
TABLE ACCESS BY INDEX ROWID CUSTOMERS
INDEX UNIQUE SCAN CUSTOMERS_PK

TABLE ACCESS BY INDEX ROWID ORDERS
INDEX RANGE SCAN IDX_ORDERS_CUSTOMER
```

Here Nested Loops is very logical.

---

## 14.19. Example DWH

We assume:

```
FACT_TRANSACTION
500,000,000 rows

DIM_ACCOUNT
2,000,000 rows
```

Query:

```sql
SELECT
a.account_type,
SUM(f.amount)
FROM fact_transaction f
JOIN dim_account
ON a.account_key = f.account_key
GROUP BY
a.account_type;
```

Possible plan:

```
HASH BY
HASH JOIN
TABLE ACCESS FULL DIM_ACCOUNT
TABLE ACCESS FULL FACT_TRANSACTION
```

For an DWH this plan can be perfectly reasonable.

---

## 14.20. JOIN order

The JOIN algorithm and the JOIN- order are two different things.

Query:

```sql
SELECT *
FROM A
JOIN B ON...
JOIN C ON...
JOIN D ON...;
```

The optimizer may decide:

```
B JOIN D
     ↓
JOIN A Result
     ↓
JOIN C result
```

So SQL- doesn't necessarily determine physical order.

---

## 14.21. Why JOIN order is so important

We assume:

```
A = 100M rows
B = 50M rows
C = 1K rows
```

and a filter on C produces:

```
10 rows
```

If Oracle starts logically with C:

```
C
1000 → 10
```

and then join with the other tables, can very early reduce the volume of data.

Important concept:

> In general, we want selective operations to reduce volume as early as possible.

---

## 14.22. Cardinality is critical

The optimizer must estimate:

```
How many rows does each operation produce?
```

Example:

```
estimated rows = 10
current rows = 2,000,000
```

On the basis of the 10-line estimate, Oracle may choose:

```
NESTED LOOPS
```

But in reality 2 million lines can do:

```
HASH JOIN
```

much more efficient.

This is why incorrect statistics can lead to the wrong choice of algorithm.

---

## 14.23. Link with Statistics

We assume:

```
WHERE status = 'ERROR'
```

The optimizer estimates:

```
100 rows
```

But the reality is:

```
5,000,000 rows
```

He can choose:

```
NESTED LOOPS
```

for:

```
HASH JOIN
```

One of the first things we check when we see an apparently inappropriate join is:

```
E-Rows vs A-Rows
```

---

## 14.24. As we see the algorithm in DBMS_XPLAN

Example:

```sql
SELECT / * + gather_plan_statistics * /
*
FROM employees e
JOIN departments d
ON d.department_id = e.department_id;
```

Then:

```sql
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST'
)
);
```

Possible plan:

```
--------------------------------------------------------------------------------
Did you hear that? Did you hear that?
--------------------------------------------------------------------------------
* *
* 1) * 1) HASH JOIN * 107)
2) TABLE ACCESS FULL
3 * TABLE ACCESS FULL * EMPLOYEES
--------------------------------------------------------------------------------
```

Here the algorithm is obvious:

```
HASH JOIN
```

---

## 14.25. How to read it from the bottom up

According to the rule discussed at Execution Plans, we read the data access operations before the parent operation.

Plan:

```
* * * *
* * *
* TABLE ACCESS FULL EMPLOYEES
```

Conceptual:

```
DEPARTMENTS
     \
HASH JOIN
     /
EMPLOYEES
```

Oracle reads the two sources and executes the Join hash.

---

## 14.26. Nested Loops in DBMS_XPLAN

Example:

```
--------------------------------------------------------------------------------
Did you hear that?
--------------------------------------------------------------------------------
* * *
1).
* TABLE ACCESS BY INDEX ROWID
* 3) * 3) INDEX UNIQUE SCAN *
* * *
* 5) * 5) INDEX RANGE SCAN *
--------------------------------------------------------------------------------
```

Interpretation:

```
CUSTOMERS_PK
     ↓
CUSTOMERS
     ↓
NESTED LOOPS
     ↓
IDX_ORDERS_CUSTOMER
     ↓
ORDERS
```

For each customer found:

```
customer_id
   ↓
IDX_ORDERS_CUSTOMER
   ↓
ORDERS
```

---

## 14.27. Why the index is so important at Nested Loops

Suppose:

```
100 outer rows
```

With index:

```
100 × index look up
```

It can be very cheap.

No index:

```
100 × FULL TABLE SCAN
```

It could get very expensive.

Conceptual:

```
Nested Loops
      +
inefficient inner access
=
potential performance problem
```

So we don't just have to look at:

```
NESTED LOOPS
```

But also **, which is under the inner side of**.

---

## 14.28. Cartesian Join

A very important case:

```sql
MERGE CARTESIAN
```

or conceptual:

```
CARTESIAN PRODUCT
```

Example of mistake:

```sql
SELECT *
FROM customers c,
orders o,
```

Missing condition:

```
c.customer_id = o.customer_id
```

If:

```
Customers = 1,000
orders = 1,000,000
```

the result may become:

```
1000 × 1,000,000
=
1,000,000,000 rows
```

An unexpected Cartesian Join in execution plan must be investigated immediately.

---

## 14.29. But Cartesian Join is not always an error

The optimizer may intentionally use a Cartesian Join between very small sets.

Example:

```
A → 1 row
B → 2 rows
```

Result:

```
2 rows
```

Then he can do the join with another board.

So:

```sql
MERGE CARTESIAN
```

does not automatically mean the wrong SQL.

We need to check the cardinality.

---

## 14.30. Semi Join

For queries such as:

```sql
SELECT *
FROM customers c
WHERE EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

Oracle may use:

```
HASH SEMI
```

or:

```
NESTED SEMI
```

The point is:

> We don't need all the matching rows; we're only interested in whether there's at least one.

---

## 14.31. Anti Join

For:

```sql
SELECT *
FROM customers c
WHERE NOT EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

Oracle may use:

```
HASH ANTI
```

or:

```
NESTED ANTI
```

Conceptual:

> Find customers for whom there are no matching rows in ORDERS.

Very common in ETL.

For example:

```sql
SELECT. *
FROM staging_customer
WHERE NOT EXISTS (
SELECT 1
FROM dim_customer d
WHERE d.source_customer_id =
s.source_customer_id
);
```

can identify new rows for size table.

---

## 14.32. Outer Join and algorithm

SQL:

```sql
SELECT *
FROM customers c
LEFT JOIN orders
ON o.customer_id = c.customer_id;
```

may produce plans such as:

```
HASH OUTER
```

or:

```
NESTED OUTER
```

So:

```
LEFT JOIN
```

is semantic SQL.

Whereas:

```
HASH OUTER
```

describe physical implementation.

---

## 14.33. Join Algorithm and indexes

A common mistake is the idea:

> If there is an index, Oracle must use it.

No.

We assume:

```
FACT_SALES = 500M rows
DIM_PRODUCT = 100K rows
```

The query needs:

```
300M rows
```

A repeated look-up index hundreds of millions of times can be much more expensive than:

```
TABLE ACCESS FULL
+
HASH JOIN
```

Oracle can completely ignore the legitimate index.

---

## 14.34. Comparative example

We assume:

```
ORDERS = 100M rows
CUSTOMERS = 10M rows
```

### Query A

```
WHERE customer_id = 100
```

the result:

```
1 customer
20 orders
```

Probably:

```
NESTED LOOPS
```

### Query B

```
WHERE customer_country = 'RO'
```

the result:

```
2M Customers
20M orders
```

Probably:

```
HASH JOIN
```

Same JOIN.

We're aligning differently.

Reason:

```
cardinality
```

---

## 14.35. Adaptive Plans

Oracle may also have adaptive mechanisms whereby the plan may contain alternatives or adapt certain operations to information obtained during execution.

That is why it is important to consider not only:

```sql
EXPLAIN PLAN
```

but also the actual execution:

```
DBMS_XPLAN.DISPLAY_CURSOR
```

with:

```
ALLSTATS LAST
```

---

## 14.36. Hints for Join Algorithms

For study and diagnosis we can influence the optimizer.

Nested Loops:

```sql
SELECT / * + USE_NL (o)
       ...
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id;
```

Hash Join:

```sql
SELECT / * + USE_HASH (o)
       ...
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id;
```

Join's going:

```sql
SELECT / * + USE_MERGE (o)
       ...
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id;
```

But the important rule is:

> Hint is useful for testing and diagnosis, it must not be the first solution to a performance problem.

The **must first be checked as to why the optimizer chose the** plan.

---

## 14.37. LEADING point

We can influence and join the order.

Example:

```sql
SELECT / * + LEADING (c o) * /
       ...
FROM customers c
JOIN orders o
ON o.customer_id = c.customer_id;
```

Conceptual:

```
C
↓
O
```

It can be combined with:

```sql
SELECT / * + LEADING (c o)
USE_NL (o) * /
       ...
```

But again, these are primarily useful tools for experiment and diagnosis.

---

## 14.38. Real Troubleshooting Scenario

We have:

```
DIM_CUSTOMER 2M
FACT_TX 500M
```

The query takes 40 minutes.

Plan:

```
NESTED LOOPS
```

with:

```
E-Rows = 100
A-Rows = 8,000,000
```

The optimizer believed that the outer dataset would contain:

```
100 rows
```

but in reality it produces:

```
8 million
```

He chose this:

```
NESTED LOOPS
```

which causes millions of lookups.

The correct investigation shall not begin with:

```
USE_HASH
```

but with the question:

> Why did the Oracle estimate 100 rows instead of 8 million?

We're checking:

```
Statistics
histograms
predicates
data skew
functions on columns
bind variables
correlated predicates
```

After the estimate has been corrected, the optimizer can choose naturally:

```
HASH JOIN
```

---

## 14.39. JOIN Algorithm decision tree

for review you can remember the model:

```
JOIN
                  |
        +---------+---------+
        |                   |
few rows many rows
        |                   |
Good index? Equi-join?
        |                   |
DA DA
        |                   |
NESTED LOOPS HASH JOIN
                            |
other
                            |
MERGE JOIN
```

It is intentionally simplified, but very useful as a mental model.

---

## 14.40. What do we check when an JOIN is slow

The practical diagnostic order shall be:

```
1. Implementation Plan
       ↓
2. Join Algorithm
       ↓
3. Join Order
       ↓
4. E-Rows vs A-Rows
       ↓
5. Access path
       ↓
6. Index
       ↓
7. Statistics
       ↓
8. Predicates
       ↓
9. Memory / TEMP
```

This order is much more useful than the simplistic idea:

```
slow query → add index
```

---

## 14.41. Oracle Exercises 26ai

Assuming your lab schematics, you can compare algorithms.

### Exercise 1)

```sql
SELECT / * + gather_plan_statistics * /
e.employee_id,
e.last_name,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id;
```

Then:

```sql
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
NULL,
NULL,
'ALLSTATS LAST'
)
);
```

Identify:

```
common algorithm
E-Rows
A-Rows
access methods
```

### Exercise 2 is pushing Nested Loops

```sql
SELECT / * + gather_plan_statistics
USE_NL (d) *
e.employee_id,
e.last_name,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id;
```

### Exercise 3 is pushing Hash Join

```sql
SELECT / * + gather_plan_statistics
USE_HASH (d) *
e.employee_id,
e.last_name,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id;
```

### Exercise 4) Merge Join

```sql
SELECT / * + gather_plan_statistics
USE_MERGE (d) *
e.employee_id,
e.last_name,
d.department_name
FROM hr.employment e
JOIN hr departments d
ON d.department_id = e.department_id;
```

Compare the plans.

---

## 14.42. Very useful exercise for DWH

With laboratory tables of a type:

```
DWH_ACCOUNT
TRANSACTIONS
```

run:

```sql
SELECT / * + gather_plan_statistics * /
a.account_type,
COUNT(*) transaction_count,
SUM(t.amount) total_amount
FROM dwh_account
JOIN transactions t
ON t.account_id = a.account_id
GROUP BY a.account_type;
```

Analyze:

```
TABLE ACCESS
JOIN algorithm
A-Rows
E-Rows
Buffers
```

Then compare:

```
USE_NL (t)
```

with:

```
USE_HASH (t)
```

Not to decide that one is always better, but to understand the cost of the two strategies.

---

## Questions and answers

**What main Join algorithms uses Oracle?**

Answer:

> The main are Nested Loops, Hash Join and Sort Merge Join. Nested Loops is especially suitable when the outer dataset is small and there is an efficient path access to inner table. Hash Join is very effective for large sets and equi-joins, being very common in DWH. Sort Merge Join sorts the two sets and then combines them and can be useful including for certain non-equi joins.

---

**When is Nested Loops Performance?**

> When the first set produces relatively few rows and matches rows from the second set can be found efficiently, usually by index.

---

**When would you prefer Hash Join?**

> For large volumes, especially equi-joins between large tables, when a significant proportion of the data needs to be processed. It is very common in DWH and ETL.

---

**Is FULL TABLE SCAN + HASH JOIN a bad plan?**

> No. In DWH there can be the exact optimal plan, especially when a lot of the tables need to be read. Repeated use of a million-row index can be much more expensive.

---

**What can make Oracle choose the wrong Nested Loops instead of Hash Join?**

> Often a misestimate of cardinality. If the optimizer estimates several dozen rows but in reality there are millions, it can consider Nested Loops cheap. That's why I'm checking E-Rows versus A-Rows, then statistics, predicates and data distribution.

---

**What is built side in a Hash Join?**

> Oracle builds a hash structure from one of the sources, usually the one estimated to be more suitable for the build, then reads the other source and tests the hash tablet for the matching rows.

---

## 14.44. The three squares to memorize

### Pattern 1

```
1 customer
        ↓
NESTED LOOPS
        ↓
INDEX RANGE SCAN orders
```

Think:

> few rows + index.

### Pattern 2

```
DIM
 ↓
FULL SCAN
      \
HASH JOIN
      /
FULL SCAN
 ↑
FACT
```

Think:

> large volumes + equi-join.

### Pattern 3 = sorted / non-equi

```
SORT
  \
MERGE JOIN
  /
SORT
```

Think:

> Sort + go.

---

## 14.45. Summary for Data Developer

The most important things to remember are:

```
NESTED LOOPS
= few outer rows
+ efficient access to inner table
+ common OLTP

HASH JOIN
= large volumes
+ equi-join
+ Full scan may be normal
+ very common in DWH / ETL

MERGE JOIN
= sorting of the two streams
+ going sequentially
+ may be useful for certain non-equi joins
```

But the most important idea is this:

> **Oracle does not choose the JOIN algorithm based on the size of the tables themselves, but on the expected cardinalities of flows that actually reach JOIN and the estimated cost of accessing the paths.**

That's why when you investigate a slow JOIN, the triad you need to check is:

```
Join Algorithm
      +
Join Order
      +
E-Rows vs A-Rows
```

These three elements explain much of the performance problems of the Oracle Joins.

---

## Questions and answers

### How would you briefly explain Join Algorithms to a colleague who knows SQL, but not this area?

Join Algorithms covers Nested Loops for small / selective outer sets, Hash Join for large equijoins, Sort Merge Join and ordered / range scenarios. In practice, first determine what data enter and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Join Algorithms?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Join Algorithms, I explicitly follow Nested Loops for small / selective outer sets, Hash Join for large equijoins, Sort Merge Join and ordered / range scenarios and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Join Algorithms appears along with logging, auditing, reconciliation and impact analysis.
