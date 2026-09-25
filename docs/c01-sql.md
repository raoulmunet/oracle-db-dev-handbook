---
title: 'C01. SQL from Fundamentals to Advanced'
description: 'Complete English handbook chapter based on the original C01 course.'
sidebar_position: 1
---

# C01. SQL from Fundamentals to Advanced

<div className="chapter-kicker">Chapter C01 · Complete course</div>

Below you have a compact but comprehensive course for **1. SQL from fundamental to advanced**, thought especially for Oracle and for your direction of **Data Developer / Oracle / ETL / DWH**.

# 1. SQL is fundamentally until advanced

SQL is the language by which you question, transform and modify the data in the database. In Oracle, for a Data Developer, you must master not only the syntax, but also **as Oracle interprets the** interrogation and what impact it has on performance.

---

## 1.1. Relational model and structure of an interrogation

A relational basis shall contain mainly:

- tables;
- columns;
- rows;
- primary keys;
- external keys;
- constraints;
- Incas;
- views.

Example:

(date: image / svg + xml)

SQL
```
SELECT employee_id,
first_name,
salary
FROM
WHERE department_id = 50
ORDER BY salary DESC;
```

Order in which we write:

```
SELECT
FROM
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

It's very important.

For example:

(date: image / svg + xml)

SQL
```
SELECT salary * 12 AS annual_salary
FROM
WHERE annual_salary;
```

does not work in Oracle because the annual\ _ salary alias does not yet exist at the time of evaluation of WHERE.

You have to:

(date: image / svg + xml)

SQL
```
SELECT salary * 12 AS annual_salary
FROM
WHERE salary * 12 › 100000;
```

---

# 1.2. SELECT

Basic form:

(date: image / svg + xml)

SQL
```
SELECT column1,
column2
FROM table_name;
```

All columns:

(date: image / svg + xml)

SQL
```
SELECT *
FROM employment;
```

In the real code it is preferable to list the columns:

(date: image / svg + xml)

SQL
```
SELECT employee_id,
first_name,
last_name,
salary
FROM employment;
```

Advantages:

- clearer code;
- less data transferred;
- more stable if the table structure changes.

---

# 1.3. Expressions and aliases

You can calculate values directly in SQL:

(date: image / svg + xml)

SQL
```
SELECT employee_id,
Salary,
salary * 12 AS annual_salary
FROM employment;
```

Oracle concatenation:

(date: image / svg + xml)

SQL
```
SELECT first_name; ' '; last_name; AS; full_name;
FROM employment;
```

Alias:

(date: image / svg + xml)

SQL
```
SELECT salary * 12 annual_salary
FROM employment;
```

or more explicitly:

(date: image / svg + xml)

SQL
```
SELECT salary * 12 AS annual_salary
FROM employment;
```

---

# 1.4. NULL

NULL does not mean:

```
0
''
false
```

It means:

> unknown or absent value.

Wrong:

(date: image / svg + xml)

SQL
```
WHERE commission_pct = NULL
```

Right:

(date: image / svg + xml)

SQL
```
WHERE commission_pct IS NULL
```

or:

(date: image / svg + xml)

SQL
```
WHERE commission_pct IS NOT NULL
```

Operations with NULL typically produce NULL:

(date: image / svg + xml)

SQL
```
salary + NULL
```

→ NULL

---

# 1.5. NVL, COALESCE and NULLIF

### NVL

Specific oracles:

```
NVL (commission_pct, 0)
```

Example:

```
SELECT salary,
NVL (commission_pct, 0)
FROM employment;
```

---

### COALESCE

Returns the first non-NULL value:

```
COALESCE (phone_mobile, phone_home, phone_office)
```

It is standard SQL and allows for several arguments.

---

### NULLIF

```
NULLIF (a, b)
```

Returns NULL if:

```
a = b
```

Otherwise return a.

Very useful to avoid zero division:

```
% 1% 2
```

---

# 1.6. WHERE

Operators:

```
=
♪ ♪
!
;
;
=
=
```

Example:

```
SELECT *
FROM
WHERE salary = 10000;
```

---

## BETWEEN

```
WHERE salary BETWEEN 5000 AND 10000
```

logically equivalent to:

```
WHERE salary = 5000
AND salary = 10000
```

The limits are included.

---

## IN

```
WHERE department_id IN (10, 20, 30)
```

for:

```
WHERE department_id = 10
OR department_id = 20
OR department_id = 30
```

---

# 1.7. LIKE and text searches

```
WHERE last_name LIKE 'S%'
```

means:

```
start with S
```

Wildcards:

```
% → 0 or more characters
_ → exactly a character
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

# 1.8. AND, OR and precedence of operators

```
WHERE department_id = 10
OR department_id = 20
AND salary
```

AND takes priority over OR.

So Oracle interprets:

```
department_id = 10
OR
(
department_id = 20
AND salary › 5000
)
```

If you want something else:

```
WHERE (department_id = 10 OR department_id = 20)
AND salary is 5000;
```

Use parentheses when the expression becomes complex.

---

# 1.9. ORDER BY

```
ORDER BY salary
```

default:

```
ASC
```

Decreaser:

```
ORDER BY salary DESC
```

More columns:

```
ORDER BY department_id,
Salary DESC;
```

Oracle sort first by department, then inside each department by salary.

---

# 1.10 DISTINCT

```
SELECTQ1QX department_id
FROM employment;
```

Remove the duplicates from the final result.

With several columns:

```
SELECT DISTINCT department_id,
job_id
FROM employment;
```

the uniqueness is for the combination:

```
department_id + job_id
```

Attention: DISTINCT may require sorting or hashing and may be costly for large volumes.

---

# 1.11. Scalar functions

The scalar functions receive a row and return a value.

Examples:

```
UPPER (last_name)
LOWER (last_name)
TRIM (name)
SUBSTR (name, 1.10)
LENGTH (name)
ROUND (amount 2)
```

Example:

```
SELECT UPPER (last_name),
LENGTH (last_name)
FROM employment;
```

---

# 1.12. Data Conversion

Very important in Oracle.

### TO\ _ CHAR

```
TO_CHAR (hire_date, 'YYYY-MM-DD')
```

or:

(date: image / svg + xml)

SQL
```
TO_CHAR (amount, '999G999D99')
```

---

### TO\ _ DATE

(date: image / svg + xml)

SQL
```
TO_DATE ('2026-09-23', 'YYYY-MM-DD')
```

---

### TO\ _ NUMBER

(date: image / svg + xml)

SQL
```
TO_NUMBER ('123.45')
```

Avoid default conversions.

Instead of:

(date: image / svg + xml)

SQL
```
WHERE numeric_column = '123'
```

Better:

(date: image / svg + xml)

SQL
```
WHERE numeric_column = 123
```

Default conversions can cause:

```
ORA-01722
```

and performance issues.

---

# 1.13. CASE

It is one of the most important SQL constructions.

```
SELECT employee_id,
Salary,
CASE
WHEN salary = 15000 THEN 'HIGH'
WHEN salary = 8000 THEN 'MEDIUM'
ELSE 'LOW'
ENDQ1QX salary_category
FROM employment;
```

It can be used in:

```
SELECT
ORDER BY
GROUP BY
aggregates
```

Very useful example:

```
SUM (
CASE
WHEN status = 'SUCCESS' THEN 1
ELSE 0
END
)
```

---

# 1.14. Aggregated functions

The most important:

(date: image / svg + xml)

SQL
```
COUNT
SUM
AVG
MIN
MAX
```

Example:

(date: image / svg + xml)

SQL
```
SELECT COUNT (*),
AVG (salary)
MAX (salary)
FROM employment;
```

Important difference:

(date: image / svg + xml)

SQL
```
COUNT *
```

count all rows.

(date: image / svg + xml)

SQL
```
COUNT (commission_pct)
```

Only count non-NULL values.

---

# 1.15. GROUP BY

Example:

(date: image / svg + xml)

SQL
```
SELECT department_id,
COUNT (*) AS employee_count,
AVG (salary) AS avg_salary
FROM
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

(date: image / svg + xml)

SQL
```
SELECT department_id,
last_name,
AVG (salary)
FROM
GROUP BY department_id;
```

---

# 1.16. HAVING

WHERE filters the lines.

HAVING filters the groups.

Example:

(date: image / svg + xml)

SQL
```
SELECT department_id,
AVG (salary)
FROM
GROUPQ1QX department_id
HAVING AVG (salary)
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

# 1.17. JOIN

JOIN-s are essential for SQL.

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

(date: image / svg + xml)

SQL
```
SELECT e.employee_id,
d.department_name
FROM employment e
JOIN departments
ON d.department_id = e.department_id;
```

Return only the rows that have the correspondent in both tables.

---

# 1.18. LEFT JOIN

(date: image / svg + xml)

SQL
```
SELECT e.employee_id,
d.department_name
FROM employment e
LEFT JOIN departments d
ON d.department_id = e.department_id;
```

Return:

```
all employees
+
department if there is
```

If there is no department:

```
department_name = NULL
```

---

# 1.19. Classic LEFT JOIN + WHERE

You have:

```
SELECT *
FROM employment e
LEFT JOIN departments d
ON d.department_id = e.department_id
WHERE d.location_id = 100;
```

In practice, you've turned the JOIN- almost into an INNER JOIN.

To keep employees without department:

```
SELECT *
FROM employment e
LEFT JOIN departments d
ON d.department_id = e.department_id
AND d.location_id = 100;
```

The difference between the condition laid down in:

```
ON
```

and:

```
WHERE
```

It's very important.

---

# 1.20. SELF JOIN

A table is connected with himself.

Example manager employed:

```
SELECT e.first_name AS employee,
m.first_name AS manager
FROM employment e
LEFT JOIN employees
ON m.employee_id = e.manager_id;
```

---

# 1.21. Cartesian Join

If you forget the Join condition:

```
SELECT *
FROM employment e,
departments d,
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

# 1.22.

Example:

```
SELECT *
FROM
WHERE salary
(
SELECT AVG (salary)
FROM
);
```

The subquery calculates:

```
AVG (salary)
```

And the outside query uses the result.

---

# 1.23. Correlated Subquery

```
SELECT is.
FROM employment e
WHERE salary
(
SELECT AVG (e2.salary)
FROM employees e2
WHERE e2.department_id = e.department_id
);
```

Meaning:

> employees who have their salary above the average of their department.

The external and inner subquery shall be correlated by:

```
e.department_id
```

---

# 1.24. EXISTS

Very important.

```
SELECT *
FROM customers c
WHERE EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

It means:

> return the client if there is at least one order.

Oracle is not actually interested in the value of:

```
SELECT 1
```

but the existence of a row.

---

# 1.25. NOT EXISTS

Example:

```
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

# 1.26. IN vs EXISTS

You could write:

```
WHERE customer_id IN (
SELECT customer_id
FROM orders
)
```

or:

```
WHERE EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
)
```

The optimiser can transform both shapes.

You don't have to remember the old rule:

> EXISTS is always faster than IN.

That's not true.

The Oracle Optimizer decides according to statistics and structure.

---

# 1.27. NOT IN and NULL is an important trap

You have:

```
WHERE customer_id NOT IN (
SELECT customer_id
FROM orders
);
```

If the subquery contains an NULL, the result may become unexpected.

Safer:

```
WHERE NOT EXISTS (
SELECT 1
FROM orders o
WHERE o.customer_id = c.customer_id
);
```

For anti-joints, NOT EXISTS is often the clearest approach.

---

# 1.28. UNION and UNION ALL

### UNION

```
SELECT customer_id
FROM customers_2025

UNION

SELECT customer_id
FROM customers_2026;
```

Eliminate duplicates.

---

### UNION ALL

```
SELECT customer_id
FROM customers_2025

UNION ALL

SELECT customer_id
FROM customers_2026;
```

Keep the duplicates.

ETL/DWH often prefers:

```
UNION ALL
```

if the duplicate does not have to be removed, as it avoids the additional deduction operation.

---

# 1.29. INTERSECT

Returns common values:

```
SELECT customer_id
FROM source_customers

INTERSECT

SELECT customer_id
FROM dwh_customers;
```

---

# 1.30. MINUS

Very useful in reconciliation:

```
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

# 1.31. CTE

Example:

```
WITH dept_stats AS (
SELECT department_id,
AVG (salary) AS avg_salary
FROM
GROUPQ1QX department_id
)
SELECT e.employee_id,
e.salary,
d.avg_salary
FROM employment e
JOIN dept_stats d
ON d.department_id = e.department_id
WHERE e.salary n.e.d.avg_salary;
```

Advantages:

- more readable query;
- separate logic;
- easy to debug;
- Very useful in complex DWH querys.

---

# 1.32. Recursive / hierarchical queries

The Oracle has a classic:

```
START WITH
CONNECT BY
```

Example:

```
SELECT employee_id,
manager_id,
LEVEL
FROM
START WITH manager_id IS NULL
CONNECT BY PRIOR employee_id = manager_id;
```

Useful for:

- Organigrams;
- categories;
- trees;
- parental-child structures.

---

# 1.33. Analytical functions include one of the most important advanced topics.

Unlike GROUP BY, the analytical functions **do not remove the individual rows**.

Example:

```
SELECT employee_id,
department_id,
Salary,
AVG (salary)
PARTITIONQ1QX department_id
) AS dept_avg
FROM employment;
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

# 1.34. ROW\ _ NUMBER

```
ROW_NUMBER () OVER
PARTITIONQ1QX department_id
ORDER BY salary DESC
)
```

Example:

```
SELECT *
FROM (
SELECT is. *,
ROW_NUMBER () OVER
PARTITIONQ1QX department_id
ORDER BY salary DESC
) rn
FROM employment e
)
WHERE rn = 3;
```

Return:

> the first 3 employees by salary from each department.

Pattern very common.

---

# 1.35. ROW\ _ NUMBER vs RANK vs DENSE\ _ RANK

Data:

```
Salary
------
100
100
90
80
```

### ROW\ _ NUMBER

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

### DENSE _ RANK

```
100 →
100 →
90 → 2
80 → 3
```

---

# 1.36. LAG and LEAD

Extremely useful for temporal data.

```
SELECT account_id,
transaction_date,
% 1% 2
LAG (amount) OVER (
PARTITIONQ1QX account_id
ORDERQ1QX transaction_date
) AS previous_amount
FROM transactions;
```

LAG → previous row.

LEAD → next row.

Very useful for:

- differences between periods;
- the detection of changes;
- SCD;
- audit;
- banking transactions.

---

# 1.37. Total Running

```
SELECT account_id,
transaction_date,
% 1% 2
SUM (amount) OVER (
PARTITIONQ1QX account_id
ORDERQ1QX transaction_date
ROWS BETWEEN UNBOUNDED PRECEDING
ANDQ1QX ROW
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

# 1.38. FIRST\ _ VALUE and LAST\ _ VALUE

(date: image / svg + xml)

SQL
```
FIRST_VALUE (amount) OVER (...)
```

and:

(date: image / svg + xml)

SQL
```
LAST_VALUE (amount) OVER (...)
```

Attention: LAST\ _ VALUE is affected by window frame and is a classic source of confusion.

---

# 1.39. Conditional Aggregation

A very important pattern:

(date: image / svg + xml)

SQL
```
SELECT customer_id,

SUM (
CASE
WHEN transaction_type = 'CREDIT'
THEN amount
ELSE 0
END
) AS credit_total

SUM (
CASE
WHEN transaction_type = 'DEBIT'
THEN amount
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

# 1.40. PIVOT

Oracle can turn values into columns:

```
SELECT *
FROM sales
PIVOT (
SUM (amount)
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

# 1.41. MERGE

Very important in ETL.

(date: image / svg + xml)

SQL
```
MERGE INTO target t
USING
ON (t.customer_id = s.customer_id)

WHENQ1QX THEN
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
There are → UPDATE

there are no → INSERT
```

It is the basis of many processes:

```
UPSERT
```

and SCD.

---

# 1.42. INSERT

(date: image / svg + xml)

SQL
```
INSERT INTO employment (
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

Or insert query:

(date: image / svg + xml)

SQL
```
INSERTQ1QX target_table
SELECT *
FROM source_table;
```

Very common in ETL.

---

# 1.43. UPDATE

(date: image / svg + xml)

SQL
```
UPDATE
SET salary = salary * 1.05
WHERE department_id = 50;
```

extreme attention to:

(date: image / svg + xml)

SQL
```
WHERE
```

Without WHERE:

(date: image / svg + xml)

SQL
```
UPDATE
SET salary = salary * 1.05;
```

You update all rows.

---

# 1.44. DELETE vs TRUNCATE

### DELETE

(date: image / svg + xml)

SQL
```
DELETE FROM stage_transactions;
```

DML.

He could have:

```
WHERE
```

and can be rollback-looking before commit.

---

### TRUNCATE

```
TRUNCATE TABLE stage_transactions;
```

DDL.

It is much more effective for fully emptying a table.

Frequently used for:

```
STAGING tables
```

---

# 1.45. COMMIT and ROLLBACK

(date: image / svg + xml)

SQL
```
COMMIT;
```

confirm the transaction.

(date: image / svg + xml)

SQL
```
ROLLBACK;
```

cancels unconfirmed changes.

Example:

(date: image / svg + xml)

SQL
```
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

# 1.46. SAVEPOINT

(date: image / svg + xml)

SQL
```
SAVEPOINT before_step2;
```

Then:

```
ROLLBACK TO before_step2;
```

Allow partial rollback within the transaction.

---

# 1.47. Data and time

Modern oracles have types such as:

```
DATE
TIMESTAMP
TIMESTAMP WITH TIME ZONE
```

DATE Oracle includes:

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

Server date.

(date: image / svg + xml)

SQL
```
SYSTIMESTAMP
```

includes higher accuracy and timezones.

---

# 1.48. TRUNC for data

Very important:

(date: image / svg + xml)

SQL
```
TRUNC (transaction_date)
```

delete the time component.

Example:

(date: image / svg + xml)

SQL
```
WHERE TRUNC (transaction_date) = DATE '2026-09-23'
```

But this form can prevent the use of a normal index on the transaction _ data.

Preferably often:

(date: image / svg + xml)

SQL
```
WHERE transaction_date = DATE '2026-09-23'
AND transaction_date - DATE '2026-09-24'
```

This is an example of SQL correctly functioning but also performing.

---

# 1.49.

An important concept for optimization.

Less favourable query:

(date: image / svg + xml)

SQL
```
WHERE UPPER (last_name) = 'SMITH'
```

If you have a normal index:

```
INDEX (last_name)
```

Oracle can't always use it efficiently.

Alternatives:

```
WHERE last_name = 'SMITH'
```

or function-based index:

```
CREATEQ1QX idx_emp_upper_name
ON employed (UPPER (last_name));
```

---

# 1.50. Conversion and indexes

Problem:

```
WHERE TO_CHAR (order_id) = '123'
```

if:

```
order_id NUMBER
```

Better:

```
WHERE order_id = 123
```

Practical rule:

> Try not to apply functions to the indexed column if not necessary.

---

# 1.51. Bind variables

Instead of:

```
WHERE customer_id = 123
```

in applications, the following shall be used:

```
WHERE customer_id =: customer_id
```

Advantages:

- re-use of cursor;
- less hard parsing;
- shared pool more efficiently;
- protection from SQL injection in applications;
- more predictable performance.

---

# 1.52. Execution Plan

Oracle decides how to execute the query.

Simplified example:

```
SELECT STATEMENT
TABLE ACCESS BY INDEX ROWID EMPLOYEES
INDEX RANGE SCAN IDX_EMP_DEPT
```

Read in general:

> From the bottom up.

First:

```
INDERANGE SCAN
```

then:

```
TABLE ACCESS BY INDEX ROWID
```

then:

```
SELECT
```

Just as we started talking in the chat room about DBMS\ _ XPLAN.

---

# 1.53. Full Table Scan

```
TABLEQ1QX FULL
```

does not automatically mean problem.

It can be the best strategy if:

- the table is small;
- a large part of the table must be read;
- the query is DWH;
- Sequential access is more effective than thousands of looks through the index.

---

# 1.54. INDEX UNIQUE SCAN

It usually appears for:

```
WHERE primary_key =: value
```

or UNIQUE index.

The Oracle knows that the result can have a maximum of one line.

---

# 1.55. INDEX RANGE SCAN

Example:

```
WHERE salary BETWEEN 5000 AND 10000
```

or:

```
WHERE department_id = 50
```

on a non-unique index.

The index can return several times.

---

# 1.56. Cardinal

One of the most important concepts of optimization.

Cardinality represents the optimiser's estimation for:

```
how many lines will produce an operation
```

Example:

```
E-Rows = 10
A-rows = 1,000,000
```

It's a very important signal.

The optimiser estimated 10 lines, but in reality it was a million.

This can cause the Oracle to choose a very bad plan.

---

# 1.57.

A condition:

```
WHERE customer_id = 123
```

can be very selective.

For example:

```
1 row out of 10 million
```

The index is very attractive.

Instead:

```
WHERE status = 'ACTIVE'
```

if:

```
90% of the table = ACTIVE
```

the index may not be useful.

Oracle may prefer:

```
FULLQ1QX SCAN
```

---

# 1.58. Statistics

Optimizer uses statistics:

```
row number
number of distinct values
distribution of values
histograms
index statistics
```

for cost estimation.

Incorrect statistics → wrong estimates → wrong plan.

---

# 1.59. Histograms

Example:

```
STATUS
------

ACTIVE 99%
SUSPENDED 0.5%
CLOSED 0.5%
```

A simple statistical type:

```
3 separate values
```

does not describe the distribution.

Histogram can help the optimiser understand that:

```
WHERE status = 'SUSPENDED'
```

is very selective.

---

# 1.60. JOIN algorithms

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
- Joins between big sets.

---

### Sort Merge Join

Both sets are ordered by the Join key and then combined.

Rarely than the other two, but important to know.

---

# 1.61. Predicted pushdown and early filtration

General principle:

> remove data that are not necessary as early as possible.

For example, it is more effective to get quickly from:

```
100 million rows
```

at:

```
10,000 rows
```

than to do joints and sorting on all 100 million.

The optimiser often tries to do so automatically.

---

# 1.62. Top-queries

In modern Oracle:

```
SELECT *
FROM
ORDER BY salary DESC
FETCH FIRST 10 ROWS ONLY;
```

For the top 10 per group, you usually use:

```
ROW_NUMBER ()
```

---

# 1.63. Decoupling

Highly important pattern in ETL.

You have:

```
customer_id
timestamp
```

and you want the last row for every customer:

```
SELECT *
FROM (
SELECT. *,
ROW_NUMBER () OVER
PARTITIONQ1QX customer_id
ORDER BY update_timestamp DESC
) rn
FROM staging_customer
)
WHERE rn = 1;
```

This is one of the most useful SQL squares for Data Developer.

---

# 1.64. Detection of duplicates

```
SELECT customer_id,
COUNT *
FROM customers
GROUPQ1QX customer_id
HAVING COUNT (*)
```

Or for several columns:

```
GROUP BY customer_id,
source_system
HAVING COUNT (*)
```

---

# 1.65. Detection of invalid data

Example ETL:

```
SELECT *
FROM staging
WHERE source_customer_id IS NULL;
```

Or values that can't be converted:

Modern oracles can allow approaches such as:

```
VALIDATE_CONVERSION value
```

Example:

```
SELECT value
FROM staging
WHERE VALIDATE_CONVERSION (value AS NUMBER) = 0;
```

Very useful for Data Quality.

---

# 1.66. Reconciliation Source vs. Target

A critical pattern in DWH.

Number of rows:

```
SELECT COUNT *
FROM source;
```

versus:

```
SELECT COUNT *
FROM target;
```

Differences:

```
SELECT business_key
FROM

MINUS

SELECT business_key
FROM target;
```

and vice versa:

```
SELECT business_key
FROM target

MINUS

SELECT business_key
FROM source;
```

---

# 1.67. Incremental Loading

Instead of loading the entire table:

```
SELECT *
FROM transactions;
```

you can only take the new data:

```
WHERE update_timestamp
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

# 1.68. SQL in OLTP vs SQL in DWH

In OLTP you usually have:

```
few rows
Very selective access
indexes
nested loops
short transactions
```

Example:

```
SELECT *
FROM account
WHERE account_id =: id;
```

In DWH:

```
million / billion rows
scans
aggregation
hash joins
partitioning
parallelism
```

Example:

(date: image / svg + xml)

SQL
```
SELECT customer_segment,
SUM (amount)
FROM fact_transactions
WHERE transaction_date = DATE '2026-01-01'
GROUP BY customer_segment;
```

SQL good in OLTP is not necessarily SQL good in DWH.

---

# 1.69. SQL patents that are worth recognizing immediately

For Data Developer level, you should see the query and admit instantly:

```
EXISTS
→ there is relationship

NOT EXISTS
→ missing relationship

ROW_NUMBER
→ ranking / deducting / late row

LAG / LEAD
→ Time comparison

SUM OVER
→ total running

GROUP BY + HAVING
→ aggregation + group filtration

CASE + SUM
→ conditional aggregation

MERGE
→ UPSERT

MINUS
→ Reconciliation

CTE
→ decomposition of a complex query
```

---

# 1.70. The most important SQL mistakes to avoid

In practice, they cause a lot of problems:

1. default conversions;
2. NOT IN with NULL;
3. Cartesian joins by accident;
4. functions applied unnecessarily on indexed columns;
5. SELECT\ *
6. DISTINCT used to hide a wrong JOIN;
7. Useless GROUP BY;
8. UNION when UNION ALL is sufficient;
9. update / delete without WHERE;
10. wrong filtering after LEFT JOIN;
11. the assumption that an index will be used only because it exists;
12. the assumption that Full Table Scan is automatically bad;
13. ignoring cardinality;
14. ignoring NULL;
15. properly functional query, but extremely expensive.

---

# 1.71. Mental Model for Advanced SQL

For any more complex query, think it in this order:

```
1. What's the initial dataset?

2. What do I have between tables?

3. What rows must be removed?

4. Do we need aggregation?

5. Do I have to keep every row?
→ analytic functions

6. Do I have to check the existence?
→ EXISTS

7. Do I have to check missing?
→ NOT EXISTS

8. Do I have to pick a single line out of a group?
→ ROW_NUMBER

9. Does it have to be inserted / updated?
→ MERGE

10. How many lines do I estimate at each stage?

11. What execution plan should I expect to see?
```

The last two questions make the difference between someone who knows **** and someone who starts thinking like an **Oracle Data Developer**.

---

## What would I consider mandatory for your level

Of all the chapter, I would put the maximum emphasis on:

```
JOIN-uri
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

These are the SQL core that I would expect from an **Senior Oracle / Data Developer**, including for roles such as the Data Developer you are studying.

---

## Questions and answers

### How would you briefly explain the fundamental SQL until advanced to a colleague who knows the SQL, but not this area?

SQL fundamentally up to advanced covers SELECT, project, filtering and NULL semantics, joins, subqueries, EXISTS and set operators, CTES, hierarchical queries and analytical functions. In practice, determine first what data enter and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to SQL fundamentally until advanced?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For SQL fundamentally until advanced, I explicitly follow SELECT, project, filtering and NULL semantics, joins, subqueries, EXISTS and set operators, CTES, hierarchical queries and analytical functions and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the fundamental SQL until advanced occurs along with logging, auditing, reconciliation and impact analysis.
