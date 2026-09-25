---
title: 'C01. SQL from Fundamentals to Advanced'
description: 'Complete English handbook chapter based on the original C01 course.'
sidebar_position: 1
---

# C01. SQL from Fundamentals to Advanced

<div className="chapter-kicker">Chapter C01 · Complete course</div>

This chapter provides a compact but comprehensive course on **SQL from fundamentals to advanced**, with a strong Oracle focus and practical relevance for **Data Developer / Oracle / ETL / DWH** work.

# 1. SQL from Fundamentals to Advanced

SQL is the language used to query, transform, and modify data in a relational database. In Oracle, a Data Developer must understand not only the syntax, but also **how Oracle interprets a query** and how that affects performance.

---

## 1.1. Relational model and query structure

A relational database mainly contains:

- tables;
- columns;
- rows;
- primary keys;
- foreign keys;
- constraints;
- indexes;
- views.

Example:


```sql
SELECT employee_id,
       first_name,
       salary
FROM employees
WHERE department_id = 50
ORDER BY salary DESC;
```

Order in which we write:

```sql
SELECT
FROM employees
WHERE
GROUP BY
HAVING
ORDER BY
```

But the approximate logic order of processing is:

```
FROM / JOIN
WHERE
GROUP BY
HAVING
SELECT
DISTINCT
ORDER BY
FETCH
```

This distinction is very important.

For example:


```sql
SELECT salary * 12 AS annual_salary
FROM employees
WHERE annual_salary > 100000;
```

does not work in Oracle because the `annual_salary` alias does not yet exist at the time of evaluation of WHERE.

You have to:


```sql
SELECT salary * 12 AS annual_salary
FROM employees
WHERE salary * 12 > 100000;
```

---

## 1.2. SELECT

Basic form:


```sql
SELECT column1,
column2
FROM table_name;
```

All columns:


```sql
SELECT *
FROM employees;
```

In the real code it is preferable to list the columns:


```sql
SELECT employee_id,
first_name,
last_name,
salary
FROM employees;
```

Advantages:

- clearer code;
- less data transferred;
- more stable if the table structure changes.

---

## 1.3. Expressions and aliases

You can calculate values directly in SQL:


```sql
SELECT employee_id,
salary,
salary * 12 AS annual_salary
FROM employees;
```

Oracle concatenation:


```sql
SELECT first_name || ' ' || last_name AS full_name
FROM employees;
```

Alias:


```sql
SELECT salary * 12 annual_salary
FROM employees;
```

or more explicitly:


```sql
SELECT salary * 12 AS annual_salary
FROM employees;
```

---

## 1.4. NULL

NULL does not mean:

```
0
''
false
```

It means:

> unknown or absent value.

Wrong:


```sql
WHERE commission_pct = NULL
```

Right:


```sql
WHERE commission_pct IS NULL
```

or:


```sql
WHERE commission_pct IS NOT NULL
```

Operations with NULL typically produce NULL:


```sql
salary + NULL
```

→ NULL

---

## 1.5. NVL, COALESCE, and NULLIF

### NVL

Oracle-specific:

```
NVL(commission_pct, 0)
```

Example:

```sql
SELECT salary,
NVL(commission_pct, 0)
FROM employees;
```

---

### COALESCE

Returns the first non-NULL value:

```
COALESCE(phone_mobile, phone_home, phone_office)
```

It is standard SQL and accepts multiple arguments.

---

### NULLIF

```
NULLIF(a, b)
```

Returns NULL if:

```
a = b
```

Otherwise, it returns `a`.

Very useful for avoiding division by zero:

```sql
amount / NULLIF(quantity, 0)
```

---

## 1.6. WHERE

Operators:

```text
=
<> or !=
>
<
>=
<=
```

Example:

```sql
SELECT *
FROM employees
WHERE salary = 10000;
```

---

## BETWEEN

```sql
WHERE salary BETWEEN 5000 AND 10000
```

logically equivalent to:

```sql
WHERE salary >= 5000
  AND salary <= 10000
```

The limits are included.

---

## IN

```sql
WHERE department_id IN (10, 20, 30)
```

for:

```sql
WHERE department_id = 10
OR department_id = 20
OR department_id = 30
```

---

## 1.7. LIKE and text searches

```sql
WHERE last_name LIKE 'S%'
```

means:

```
starts with S
```

Wildcards:

```
% → 0 or more characters
_ → exactly one character
```

Examples:

```
LIKE '%SQL%'
```

contains SQL.

```
LIKE '_a%'
```

The second character is a.

Attention to performance:

```
LIKE 'ABC%'
```

may allow the use of an index.

But:

```
LIKE '%ABC'
```

generally cannot use a normal B-tree index effectively.

---

## 1.8. AND, OR, and operator precedence

```sql
WHERE department_id = 10
   OR (department_id = 20 AND salary > 5000)
```

`AND` has higher precedence than `OR`.

So Oracle interprets:

```
department_id = 10
OR
(
department_id = 20
AND salary > 5000
)
```

If you want something else:

```sql
WHERE (department_id = 10 OR department_id = 20)
  AND salary > 5000;
```

Use parentheses when the expression becomes complex.

---

# 1.9. ORDER BY

```sql
ORDER BY salary
```

default:

```
ASC
```

Descending order:

```sql
ORDER BY salary DESC
```

More columns:

```sql
ORDER BY department_id,
salary DESC;
```

Oracle sorts first by department and then, within each department, by salary.

---

## 1.10. DISTINCT

```sql
SELECT DISTINCT department_id
FROM employees;
```

Removes duplicate rows from the final result.

With several columns:

```sql
SELECT DISTINCT department_id,
job_id
FROM employees;
```

uniqueness applies to the combination:

```
department_id + job_id
```

Attention: DISTINCT may require sorting or hashing and may be costly for large volumes.

---

## 1.11. Scalar functions

Scalar functions operate on values from a row and return a single value.

Examples:

```sql
UPPER(last_name)
LOWER(last_name)
TRIM(name)
SUBSTR(name, 1, 10)
LENGTH(name)
ROUND(amount, 2)
```

Example:

```sql
SELECT UPPER(last_name),
LENGTH(last_name)
FROM employees;
```

---

## 1.12. Data conversion

Very important in Oracle.

### TO_CHAR

```
TO_CHAR(hire_date, 'YYYY-MM-DD')
```

or:


```sql
TO_CHAR(amount, '999G999D99')
```

---

### TO_DATE


```sql
TO_DATE('2026-09-23', 'YYYY-MM-DD')
```

---

### TO_NUMBER


```sql
TO_NUMBER('123.45')
```

Avoid implicit conversions.

Instead of:


```sql
WHERE numeric_column = '123'
```

Better:


```sql
WHERE numeric_column = 123
```

Implicit conversions can cause:

```
ORA-01722
```

and performance issues.

---

## 1.13. CASE

It is one of the most important SQL constructions.

```sql
SELECT employee_id,
       salary,
       CASE
           WHEN salary >= 15000 THEN 'HIGH'
           WHEN salary >= 8000  THEN 'MEDIUM'
           ELSE 'LOW'
       END AS salary_category
FROM employees;
```

It can be used in:

```sql
SELECT
ORDER BY
GROUP BY
aggregates
```

Very useful example:

```
SUM(
CASE
WHEN status = 'SUCCESS' THEN 1
ELSE 0
END
)
```

---

## 1.14. Aggregate functions

The most important:


```text
COUNT
SUM
AVG
MIN
MAX
```

Example:


```sql
SELECT COUNT(*) AS employee_count,
       AVG(salary) AS avg_salary,
       MAX(salary) AS max_salary
FROM employees;
```

Important difference:


```sql
COUNT(*)
```

counts all rows.


```sql
COUNT(commission_pct)
```

counts only non-NULL values.

---

## 1.15. GROUP BY

Example:


```sql
SELECT department_id,
       COUNT(*) AS employee_count,
       AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;
```

Conceptual:

```
employees
   ↓
department_id group
   ↓
Aggregated functions are calculated for each group
```

Important rule:

if a column appears in SELECT and is not aggregated, it should generally occur in GROUP BY.

Wrong:


```sql
SELECT department_id,
       last_name,
       AVG(salary)
FROM employees
GROUP BY department_id;
```

---

## 1.16. HAVING

`WHERE` filters rows.

`HAVING` filters groups.

Example:


```sql
SELECT department_id,
       AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING AVG(salary) > 10000;
```

Conceptual order:

```
employees
   ↓
WHERE
   ↓
GROUP BY
   ↓
HAVING
```

---

## 1.17. JOIN

Joins are essential in SQL.

Suppose:

```
EMPLOYEES
---------
employee_id
department_id
salary

DEPARTMENTS
-----------
department_id
department_name
```

---

## INNER JOIN


```sql
SELECT e.employee_id,
       d.department_name
FROM employees e
JOIN departments d
  ON d.department_id = e.department_id;
```

Returns only rows that have a matching row in both tables.

---

## 1.18. LEFT JOIN


```sql
SELECT e.employee_id,
d.department_name
FROM employees e
LEFT JOIN departments d
ON d.department_id = e.department_id;
```

Returns:

```
all employees
+
the department when one exists
```

If there is no department:

```
department_name = NULL
```

---

## 1.19. Classic LEFT JOIN + WHERE trap

You have:

```sql
SELECT *
FROM employees e
LEFT JOIN departments d
ON d.department_id = e.department_id
WHERE d.location_id = 100;
```

In practice, this effectively turns the `LEFT JOIN` into an `INNER JOIN` for rows where `d.location_id` is NULL.

To keep employees without department:

```sql
SELECT *
FROM employees e
LEFT JOIN departments d
ON d.department_id = e.department_id
AND d.location_id = 100;
```

The placement of the condition in:

```
ON
```

and:

```sql
WHERE
```

This distinction is very important.

---

## 1.20. SELF JOIN

A table is joined to itself.

Example: employee and manager:

```sql
SELECT e.first_name AS employee,
       m.first_name AS manager
FROM employees e
LEFT JOIN employees m
  ON m.employee_id = e.manager_id;
```

---

## 1.21. Cartesian join

If you forget the Join condition:

```sql
SELECT *
FROM employees e,
     departments d;
```

you can get:

```
nr_employees × nr_departments
```

For example:

```
10,000 × 1,000
=
10,000,000 rows
```

It's one of the classic SQL errors.

---

## 1.22. Subqueries

Example:

```sql
SELECT *
FROM employees
WHERE salary > (
    SELECT AVG(salary)
    FROM employees
);
```

The subquery calculates:

```
AVG(salary)
```

The outer query then uses that result.

---

## 1.23. Correlated subquery

```sql
SELECT e.*
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employees e2
    WHERE e2.department_id = e.department_id
);
```

Meaning:

> employees who have their salary above the average of their department.

The outer query and inner subquery are correlated through:

```
e.department_id
```

---

## 1.24. EXISTS

Very important.

```sql
SELECT *
FROM customers c
WHERE EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

It means:

> return the customer if at least one order exists.

Oracle is not actually interested in the value of:

```sql
SELECT 1
```

but the existence of a row.

---

## 1.25. NOT EXISTS

Example:

```sql
SELECT *
FROM customers c
WHERE NOT EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

Returns customers without orders.

It's an extremely important pattern in:

- ETL;
- data quality;
- reconciliation;
- DWH.

---

## 1.26. IN vs EXISTS

You could write:

```sql
WHERE customer_id IN (
SELECT customer_id
FROM orders
)
```

or:

```sql
WHERE EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
)
```

The optimizer can transform both forms.

You don't have to remember the old rule:

> EXISTS is always faster than IN.

That's not true.

Oracle Optimizer decides based on statistics, cardinality, and query structure.

---

## 1.27. NOT IN and NULL: an important trap

You have:

```sql
WHERE customer_id NOT IN (
SELECT customer_id
FROM orders
);
```

If the subquery returns a `NULL`, the result may be unexpected because of SQL three-valued logic.

Safer:

```sql
WHERE NOT EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

For anti-joins, `NOT EXISTS` is often the clearest approach.

---

## 1.28. UNION and UNION ALL

### UNION

```sql
SELECT customer_id
FROM customers_2025

UNION

SELECT customer_id
FROM customers_2026;
```

Eliminates duplicates.

---

### UNION ALL

```sql
SELECT customer_id
FROM customers_2025

UNION ALL

SELECT customer_id
FROM customers_2026;
```

Keeps duplicates.

ETL/DWH often prefers:

```
UNION ALL
```

if the duplicate does not have to be removed, as it avoids the additional duplicate-elimination operation.

---

## 1.29. INTERSECT

Returns common values:

```sql
SELECT customer_id
FROM source_customers

INTERSECT

SELECT customer_id
FROM dwh_customers;
```

---

## 1.30. MINUS

Very useful in reconciliation:

```sql
SELECT customer_id
FROM source_customers

MINUS

SELECT customer_id
FROM dwh_customers;
```

It means:

> It exists in the source, but does not exist in DWH.

Excellent for ETL checks.

---

## 1.31. CTE

Example:

```sql
WITH dept_stats AS (
    SELECT department_id,
           AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
)
SELECT e.employee_id,
       e.salary,
       d.avg_salary
FROM employees e
JOIN dept_stats d
  ON d.department_id = e.department_id
WHERE e.salary > d.avg_salary;
```

Advantages:

- more readable query;
- separate logic;
- easy to debug;
- Very useful in complex DWH queries.

---

## 1.32. Recursive / hierarchical queries

Oracle has a classic:

```
START WITH
CONNECT BY
```

Example:

```sql
SELECT employee_id,
       manager_id,
       LEVEL
FROM employees
START WITH manager_id IS NULL
CONNECT BY PRIOR employee_id = manager_id;
```

Useful for:

- organizational charts;
- categories;
- trees;
- parent-child structures.

---

## 1.33. Analytic functions

Unlike `GROUP BY`, analytic functions **do not collapse individual rows**.

Example:

```sql
SELECT employee_id,
       department_id,
       salary,
       AVG(salary) OVER (
           PARTITION BY department_id
       ) AS dept_avg
FROM employees;
```

The result keeps each employee, but adds the department average.

Conceptual:

```
GROUP BY
row → group → one result / group

Analytical
rows → logical group → each row remains
```

---

## 1.34. ROW_NUMBER

```sql
ROW_NUMBER() OVER (
    PARTITION BY department_id
    ORDER BY salary DESC
)
```

Example:

```sql
SELECT *
FROM (
    SELECT e.*,
           ROW_NUMBER() OVER (
               PARTITION BY department_id
               ORDER BY salary DESC
           ) AS rn
    FROM employees e
)
WHERE rn <= 3;
```

Returns:

> the first 3 employees by salary from each department.

Pattern very common.

---

## 1.35. ROW_NUMBER vs RANK vs DENSE_RANK

Data:

```
Salary
------
100
100
90
80
```

### ROW_NUMBER

```
100 →
100 → 2
90 → 3
80 → 4
```

### RANK

```
100 →
100 →
90 → 3
80 → 4
```

### DENSE_RANK

```
100 →
100 →
90 → 2
80 → 3
```

---

## 1.36. LAG and LEAD

Extremely useful for temporal data.

```sql
SELECT account_id,
       transaction_date,
       amount,
       LAG(amount) OVER (
           PARTITION BY account_id
           ORDER BY transaction_date
       ) AS previous_amount
FROM transactions;
```

LAG → previous row.

LEAD → next row.

Very useful for:

- differences between periods;
- change detection;
- SCD;
- audit;
- banking transactions.

---

## 1.37. Running total

```sql
SELECT account_id,
       transaction_date,
       amount,
       SUM(amount) OVER (
           PARTITION BY account_id
           ORDER BY transaction_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_balance
FROM transactions;
```

Conceptual result:

```
+ 100 → 100
-20 → 80
+ 50 → 130
```

Very relevant in banking.

---

## 1.38. FIRST_VALUE and LAST_VALUE


```sql
FIRST_VALUE(amount) OVER (...)
```

and:


```sql
LAST_VALUE(amount) OVER (...)
```

Be careful: `LAST_VALUE` is affected by the window frame and is a classic source of confusion.

---

## 1.39. Conditional aggregation

A very important pattern:


```sql
SELECT customer_id,
       SUM(
           CASE
               WHEN transaction_type = 'CREDIT' THEN amount
               ELSE 0
           END
       ) AS credit_total,
       SUM(
           CASE
               WHEN transaction_type = 'DEBIT' THEN amount
               ELSE 0
           END
       ) AS debit_total
FROM transactions
GROUP BY customer_id;
```

Very used in:

- reports;
- banking;
- DWH;
- aggregation.

---

## 1.40. PIVOT

Oracle can pivot values into columns:

```sql
SELECT *
FROM sales
PIVOT (
SUM(amount)
FOR year IN (
2024 AS y2024,
2025 AS y2025,
2026 AS y2026
)
);
```

Transform approximately:

```
year
```

in:

```
2024, 2025, 2026
```

---

## 1.41. MERGE

Very important in ETL.


```sql
MERGE INTO target t
USING source s
   ON (t.customer_id = s.customer_id)
WHEN MATCHED THEN
    UPDATE SET
        t.customer_name = s.customer_name
WHEN NOT MATCHED THEN
    INSERT (
        customer_id,
        customer_name
    )
    VALUES (
        s.customer_id,
        s.customer_name
    );
```

Concept:

```
match exists → UPDATE

no match → INSERT
```

It is the basis of many processes:

```
UPSERT
```

and SCD.

---

## 1.42. INSERT


```sql
INSERT INTO employees (
employee_id,
first_name,
salary
)
VALUES (
1001,
'John',
8000
);
```

Or insert from a query:


```sql
INSERT INTO target_table
SELECT *
FROM source_table;
```

Very common in ETL.

---

## 1.43. UPDATE


```sql
UPDATE employees
SET salary = salary * 1.05
WHERE department_id = 50;
```

Pay close attention to:


```sql
WHERE
```

Without WHERE:


```sql
UPDATE employees
SET salary = salary * 1.05;
```

This updates all rows.

---

## 1.44. DELETE vs TRUNCATE

### DELETE


```sql
DELETE FROM stage_transactions;
```

DML.

It can include a:

```sql
WHERE
```

and can be rolled back before `COMMIT`.

---

### TRUNCATE

```sql
TRUNCATE TABLE stage_transactions;
```

DDL.

It is generally more efficient for completely emptying a table.

Frequently used for:

```
STAGING tables
```

---

## 1.45. COMMIT and ROLLBACK


```sql
COMMIT;
```

confirms the transaction.


```sql
ROLLBACK;
```

cancels uncommitted changes.

Example:


```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 2;

COMMIT;
```

The two operations should be treated as one logical transaction.

---

## 1.46. SAVEPOINT


```sql
SAVEPOINT before_step2;
```

Then:

```
ROLLBACK TO before_step2;
```

Allows a partial rollback within the transaction.

---

## 1.47. Date and time

Modern Oracle versions provide types such as:

```
DATE
TIMESTAMP
TIMESTAMP WITH TIME ZONE
```

Oracle `DATE` includes:

```
day
month
year
hour
minute
second
```

Example:

```
SYSDATE
```

Returns the database server date and time.


```sql
SYSTIMESTAMP
```

includes fractional seconds and time zone information.

---

## 1.48. TRUNC for dates

Very important:


```sql
TRUNC (transaction_date)
```

removes the time component for comparison purposes.

Example:


```sql
WHERE TRUNC (transaction_date) = DATE '2026-09-23'
```

But this form can prevent efficient use of a normal index on `transaction_date`.

Preferably often:


```sql
WHERE transaction_date >= DATE '2026-09-23'
  AND transaction_date <  DATE '2026-09-24'
```

This is an example of writing SQL that is both functionally correct and more index-friendly.

---

## 1.49. Sargability and function-based indexes

An important concept for optimization.

Less favorable query:


```sql
WHERE UPPER(last_name) = 'SMITH'
```

If you have a normal index:

```
INDEX (last_name)
```

Oracle may not be able to use it efficiently.

Alternatives:

```sql
WHERE last_name = 'SMITH'
```

or function-based index:

```sql
CREATE INDEX idx_emp_upper_name
ON employees (UPPER(last_name));
```

---

## 1.50. Conversions and indexes

Problem:

```sql
WHERE TO_CHAR(order_id) = '123'
```

if:

```
order_id NUMBER
```

Better:

```sql
WHERE order_id = 123
```

Practical rule:

> Try not to apply functions to the indexed column if not necessary.

---

## 1.51. Bind variables

Instead of:

```sql
WHERE customer_id = 123
```

in applications, the following shall be used:

```sql
WHERE customer_id =: customer_id
```

Advantages:

- cursor reuse;
- less hard parsing;
- more efficient use of the shared pool;
- protection from SQL injection in applications;
- more predictable performance.

---

## 1.52. Execution plan

Oracle decides how to execute the query.

Simplified example:

```sql
SELECT STATEMENT
TABLE ACCESS BY INDEX ROWID EMPLOYEES
INDEX RANGE SCAN IDX_EMP_DEPT
```

Execution plans are generally read:

> From the bottom up.

First:

```text
INDEX RANGE SCAN
```

then:

```
TABLE ACCESS BY INDEX ROWID
```

then:

```sql
SELECT
```

In Oracle, `DBMS_XPLAN` is commonly used to display and inspect execution plans.

---

## 1.53. Full table scan

```text
TABLE ACCESS FULL
```

does not automatically indicate a problem.

It can be the best strategy if:

- the table is small;
- a large part of the table must be read;
- the query is DWH;
- sequential access is cheaper than thousands of indexed lookups.

---

## 1.54. INDEX UNIQUE SCAN

It usually appears for:

```sql
WHERE primary_key =: value
```

or UNIQUE index.

Oracle knows that the lookup can return at most one row.

---

## 1.55. INDEX RANGE SCAN

Example:

```sql
WHERE salary BETWEEN 5000 AND 10000
```

or:

```sql
WHERE department_id = 50
```

on a non-unique index.

The index can return multiple rows.

---

## 1.56. Cardinality

One of the most important concepts of optimization.

Cardinality represents the optimizer's estimate of:

```
how many rows an operation will produce
```

Example:

```
E-Rows = 10
A-rows = 1,000,000
```

It's a very important signal.

The optimizer estimated 10 rows, but the actual result was one million rows.

This can cause the Oracle to choose a very bad plan.

---

## 1.57. Selectivity

A condition:

```sql
WHERE customer_id = 123
```

can be very selective.

For example:

```
1 row out of 10 million
```

The index is very attractive.

Instead:

```sql
WHERE status = 'ACTIVE'
```

if:

```
90% of the table = ACTIVE
```

the index may not be useful.

Oracle may prefer:

```text
TABLE ACCESS FULL
```

---

## 1.58. Statistics

The optimizer uses statistics such as:

```
row count
number of distinct values
distribution of values
histograms
index statistics
```

for cost estimation.

Incorrect statistics → wrong estimates → wrong plan.

---

## 1.59. Histograms

Example:

```
STATUS
------

ACTIVE 99%
SUSPENDED 0.5%
CLOSED 0.5%
```

A simple statistic such as:

```
3 distinct values
```

does not describe the distribution.

A histogram can help the optimizer understand thto:

```sql
WHERE status = 'SUSPENDED'
```

is very selective.

---

## 1.60. Join algorithms

Oracle may mainly use:

### Nested Loops

Concept:

```
for each row of A
search in B
```

Good when the first set is small and there is effective access in the second table.

---

### Hash Join

Concept:

```
build hash table
+
scan the other set
```

Very good for:

- large volumes;
- DWH;
- joins between large row sets.

---

### Sort Merge Join

Both sets are ordered by the Join key and then combined.

Less common than the other two in many workloads, but still important to understand.

---

## 1.61. Predicate pushdown and early filtering

General principle:

> remove unnecessary rows as early as possible.

For example, it is more effective to get quickly from:

```
100 million rows
```

to:

```
10,000 rows
```

than to perform joins and sorts on all 100 million rows.

The optimizer often tries to do so automatically.

---

## 1.62. Top-N queries

In modern Oracle:

```sql
SELECT *
FROM employees
ORDER BY salary DESC
FETCH FIRST 10 ROWS ONLY;
```

For the top 10 per group, you usually use:

```
ROW_NUMBER()
```

---

## 1.63. Deduplication

A highly important ETL pattern.

You have:

```
customer_id
timestamp
```

and you want the latest row for each customer:

```sql
SELECT *
FROM (
SELECT s.*,
ROW_NUMBER() OVER
PARTITION  customer_id
ORDER BY update_timestamp DESC
) rn
FROM staging_customer
)
WHERE rn = 1;
```

This is one of the most useful SQL patterns for a Data Developer.

---

## 1.64. Detecting duplicates

```sql
SELECT customer_id,
       COUNT(*) AS cnt
FROM customers
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

Or for several columns:

```sql
GROUP BY customer_id,
         source_system
HAVING COUNT(*) > 1
```

---

## 1.65. Detecting invalid data

Example ETL:

```sql
SELECT *
FROM staging
WHERE source_customer_id IS NULL;
```

Or values that can't be converted:

Modern Oracle versions provide functions such as:

```sql
VALIDATE_CONVERSION(value AS NUMBER)
```

Example:

```sql
SELECT value
FROM staging
WHERE VALIDATE_CONVERSION (value AS NUMBER) = 0;
```

Very useful for Data Quality.

---

## 1.66. Source vs. target reconciliation

A critical pattern in DWH.

Number of rows:

```sql
SELECT COUNT(*)
FROM source;
```

versus:

```sql
SELECT COUNT(*)
FROM target;
```

Differences:

```sql
SELECT business_key
FROM source
MINUS
SELECT business_key
FROM target;
```

and vice versa:

```sql
SELECT business_key
FROM target

MINUS

SELECT business_key
FROM source;
```

---

## 1.67. Incremental loading

Instead of loading the entire table:

```sql
SELECT *
FROM transactions;
```

you can load only new or changed data:

```sql
WHERE update_timestamp > :last_watermark
```

Pattern:

```
Source
 ↓
watermark
 ↓
increment
 ↓
staging
 ↓
Transform
 ↓
DWH
```

This is a fundamental concept for ETL.

---

## 1.68. SQL in OLTP vs. SQL in DWH

In OLTP you usually have:

```
few rows
Very selective access
indexes
nested loops
short transactions
```

Example:

```sql
SELECT *
FROM account
WHERE account_id =: id;
```

In DWH:

```
millions / billions of rows
scans
aggregation
hash joins
partitioning
parallelism
```

Example:


```sql
SELECT customer_segment,
SUM(amount)
FROM fact_transactions
WHERE transaction_date = DATE '2026-01-01'
GROUP BY customer_segment;
```

SQL that is efficient in OLTP is not necessarily efficient in DWH.

---

## 1.69. SQL patterns worth recognizing immediately

At Data Developer level, you should recognize these patterns immediately:

```
EXISTS
→ existence of a related row

NOT EXISTS
→ missing related row

ROW_NUMBER
→ ranking / deduplication / latest row

LAG / LEAD
→ time-based comparison

SUM OVER
→ running total

GROUP BY + HAVING
→ aggregation + group filtering

CASE + SUM
→ conditional aggregation

MERGE
→ UPSERT

MINUS
→ reconciliation

CTE
→ decomposition of a complex query
```

---

## 1.70. The most important SQL mistakes to avoid

In practice, they cause a lot of problems:

1. implicit conversions;
2. NOT IN with NULL;
3. Cartesian joins by accident;
4. functions applied unnecessarily on indexed columns;
5. `SELECT *` when unnecessary;
6. DISTINCT used to hide a wrong JOIN;
7. Useless GROUP BY;
8. UNION when UNION ALL is sufficient;
9. update / delete without WHERE;
10. wrong filtering after LEFT JOIN;
11. the assumption that an index will be used only because it exists;
12. the assumption that Full Table Scan is automatically bad;
13. ignoring cardinality;
14. ignoring NULL;
15. a functionally correct query that is unnecessarily expensive.

---

## 1.71. Mental model for advanced SQL

For any more complex query, think it in this order:

```
1. What's the initial dataset?

2. What relationships and join keys exist between tables?

3. What rows must be removed?

4. Do we need aggregation?

5. Do I have to keep every row?
→ analytic functions

6. Do I have to check the existence?
→ EXISTS

7. Do I have to check missing?
→ NOT EXISTS

8. Do I have to pick a single row from a group?
→ ROW_NUMBER

9. Does it have to be inserted / updated?
→ MERGE

10. How many rows do I estimate at each stage?

11. What execution plan should I expect to see?
```

The last two questions often distinguish someone who knows SQL syntax from someone who starts thinking like an **Oracle Data Developer**.

---

## What would I consider mandatory for your level

Across this chapter, I would place the strongest emphasis on:

```
JOINs
    ↓
GROUP BY / HAVING
    ↓
subqueries
    ↓
EXISTS / NOT EXISTS
    ↓
CTE
    ↓
CASE
    ↓
analytic functions
ROW_NUMBER
RANK
LAG
LEAD
SUM OVER
    ↓
MERGE
    ↓
NULL semantics
    ↓
data conversions
    ↓
SQL for ETL / reconciliation
    ↓
execution plans
    ↓
cardinality / selectivity
    ↓
indexes
    ↓
Nested Loops / Hash Join
```

These topics form the SQL core I would expect from a **Senior Oracle / Data Developer**.

---

## Questions and answers

### How would you briefly explain SQL from fundamentals to advanced to a colleague who knows basic SQL?

SQL from fundamentals to advanced covers projection, filtering, NULL semantics, joins, subqueries, `EXISTS`, set operators, CTEs, hierarchical queries, and analytic functions. In practice, first determine the input data and required result, then validate the implementation, execution plan, and impact on the wider data flow.

### What are two common practical problems when working with advanced SQL?

Two recurring problems are misunderstanding the data grain and suffering performance degradation at production scale. I explicitly verify projection, filtering, NULL semantics, joins, subqueries, `EXISTS`, set operators, CTEs, hierarchical queries, and analytic functions, then compare the result with a trusted control set.

### How do you check that the result is correct and not just fast?

I compare row counts, amounts, and keys with the source or a reference result; I test NULLs, duplicates, boundary conditions, and batch reruns. Only then do I evaluate execution time, resource usage, and the execution plan.

### What information did you collect before you modified an existing solution?

I collect the functional requirement, data grain, schema and keys, volume, data distribution, dependencies, execution plans and timings, errors/logs, and acceptance criteria. I also document how to roll back to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a banking flow, advanced SQL is often combined with logging, auditing, reconciliation, and impact analysis.
