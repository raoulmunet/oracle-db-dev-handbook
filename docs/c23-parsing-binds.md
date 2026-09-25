---
title: 'C23. Parsing and Bind Variables'
description: 'Complete English handbook chapter based on the original C23 course.'
sidebar_position: 23
---

# C23. Parsing and Bind Variables

<div className="chapter-kicker">Chapter C23 · Complete course</div>

The parsing is one of the most important areas for the performance of the Oracle. Two queries that do exactly the same can have very different costs if one reuses the SQL- already processed by the Oracle, and the other forces the base to parsing repeatedly.

The central idea is:

> **Band variables allow Oracle to reuse the cursor and execute the plane for the same SQL, avoiding repeated hard parses.**

---

## 1. What Parsing Means

When you send to the Oracle:

```
SELECT *
FROM
WHERE employee_id = 100;
```

Oracle does not simply execute text SQL.

They have to analyze it first.

The process includes, simplified:

```
SQL received
   ↓
Syntax check
   ↓
Semantic check
   ↓
Search existing cursor
   ↓
Optimizer
   ↓
Implementation Plan
   ↓
Execution
```

This stage of analysis is called **parsing**.

---

# 2. The two important types of parsing

There are two main situations:

```
Parse
¶ ¶ Hard Parse ¶
¶ Soft Parse ¶
```

The difference is very important for performance.

---

## 3. Hard Parse

In an **hard park**, the Oracle must do almost all of the SQL- training process.

For example, the first execution:

```
SELECT *
FROM
WHERE employee_id = 100;
```

The Oracle must verify:

- syntax;
- the existence of objects;
- the privileges;
- the types of columns;
- statistics;
- access methods;
- order of joints;
- available inks;
- the estimated costs.

The optimiser then produces the execution of the plane.

Conceptual example:

```
SELECT *
FROM
WHERE employee_id = 100;

        ↓

Parser

        ↓

Optimizer

        ↓

TABLE ACCESS BY INDEX ROWID
INDEX UNIQUE SCAN EMP_EMP_ID_PK
```

Execution of the plane and associated cursor are then kept in **Shared Pool**.

---

# 4. Soft Parse

Suppose the same command is executed again:

```
SELECT *
FROM
WHERE employee_id = 100;
```

Oracle is looking for the SQL-ul in Shared Pool.

If it finds a reusable cursor:

```
SQL received
      ↓
existing cursor found
      ↓
execution plan reused
      ↓
execution
```

This is one:

**soft parse**

The optimiser doesn't have to redo the whole process.

---

# 5. Hard Parse vs Soft Parse

Comparative:

Features of Hard Parse of Soft Parse
- - - - - - - - -
* SQL check *
Optimiszer, yes, no, usually
New plan, yeah, no
CPU consumption is lower
The difference Shared Pool is higher and smaller
♪ Weak ♪ ♪ Weak ♪

In an OLTP system with thousands of transactions / second, the difference can be enormous.

---

# 6. The Literal Problem SQL

Suppose the app executes:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

then:

```
SELECT *
FROM customers
WHERE customer_id = 101;
```

then:

```
SELECT *
FROM customers
WHERE customer_id = 102;
```

Logically, they're the same interrogation.

But the text SQL is different.

Oracle can see:

```
SQL 1
customer_id = 100

SQL 2
customer_id = 101

SQL 3
customer_id = 102
```

The result may be:

```
3 SQL states
3 cursors
3 hard parses
```

If you have 100,000 clients:

```
100,000 different SQL texts
```

You can reach a very large number of hard parses.

---

# 7. Bind Variables

The solution is the use of **bind variables**.

Instead of:

```
SELECT *
FROM customers
WHERE customer_id = 100;
```

We write:

```
SELECT *
FROM customers
WHERE customer_id =: customer_id;
```

: custodian\ _ id este bind variable.

In different executions:

```
customer_id = 100
customer_id = 101
customer_id = 102
```

the text SQL remains:

```
SELECT *
FROM customers
WHERE customer_id =: customer_id
```

So Oracle can reuse the cursor.

---

# 8. What happens internally

First execution:

```
SELECT *
FROM customers
WHERE customer_id =: id;
```

with:

```
: id = 100
```

Oracle goes:

```
Hard Parse
      ↓
execution plan
      ↓
cursor in Shared Pool
      ↓
executes
```

Second execution:

```
: id = 101
```

Oracle finds the cursor:

```
Soft Parse
      ↓
bind: id = 101
      ↓
executes
```

Third:

```
: id = 102
```

Again:

```
Soft Parse
      ↓
executes
```

---

# 9. The Advantages of Bind Variables

Bind variables have many advantages.

Main:

```
fewer hard parses
```

but also:

- Less CPU;
- Shared Pool more efficiently;
- less latch / mutex content;
- better scalability;
- less cursors;
- protection against SQL injection when used correctly from the application.

---

# 10. Example PL/SQL

Band variables appear naturally in SQL executed from PL/SQL.

Example:

```
DECLARE
v_customer_id NUMBER: = 100;
v_name customers.customer_name% TYPE;
BEGIN

SELECT customer_name
INTO v_name
FROM customers
WHERE customer_id = v_customer_id;

DBMS_OUTPUT.PUT_LINE (v_name);

END;
/
```

Oracle can treat the PL/SQL variable as a bind value in the internal SQL-.

---

# 11. SQL Dynamic Wrong

A very common problem occurs with dynamic SQL.

Bad example:

```
EXECUTE IMMEDIATE
* SELECT customer_name *
FROM customers
WHERE customer_id
INTO v_name;
```

If:

```
v_customer_id = 100
```

Oracle receives:

```
SELECT customer_name
FROM customers
WHERE customer_id = 100
```

and for 101 he receives:

```
SELECT customer_name
FROM customers
WHERE customer_id = 101
```

The texts of SQL are different.

---

# 12. Correct version with variable bind

```
EXECUTE IMMEDIATE
* SELECT customer_name *
FROM customers
WHERE customer_id =: 1
INTO v_name
USING v_customer_id;
```

SQL- remains constant:

```
SELECT customer_name
FROM customers
WHERE customer_id =: 1
```

and the values are transmitted separately.

---

## Questions and answers

Wrong version:

```
v_sql:
* * *
SET balance = balance +) p_amount
' WHERE account_id = ';

EXECUTE IMMEDIATE v_sql;
```

If we have:

```
account 100 / amount 50
account 101 / amount 70
account 102 / amount 40
```

Oracle receives three different texts.

Correct version:

```
v_sql:
* * *
SET balance = balance +: amount
WHERE account_id =: account_id;

EXECUTEQ1QX v_sql
USING p_amount, p_account_id;
```

Now SQL- is reusable.

---

# 14. Bind Variables and Shared Pool

Shared Pool is part of SGA.

Conceptual:

```
SGA
│
¶ ¶ Buffer Cache ¶
│
¶ ¶ Shared Pool ¶
      │
- Library Cache
● SQL cursors
- Execution plans
      │
- Data Dictionary Cache
```

SQL- is stored in **Library Cache**.

If SQL- is reusable:

```
New SQL
   ↓
Library Cache
   ↓
existing cursor
   ↓
Soft Parse
```

---

# 15. What is a cursor in this context

An Oracle cursor represents the internal structure associated with an SQL command.

Contains information such as:

```
SQL text
execution plan
metadata
runtime information
bind information
```

In Oracle you will frequently meet the terms:

```
parent cursor
child cursor
```

---

# 16. Parent Cursor and Child Cursor

Suppose:

```
SELECT *
FROM orders
WHERE customer_id =: id;
```

Oracle creates conceptually:

```
Parent Cursor
│
- Child Cursor 0
- Child Cursor 1
- Child Cursor 2
```

Parent cursorul is associated with text SQL.

Child cursors can exist if Oracle needs different execution options.

For example because of:

- different band types;
- NLS settings;
- Optimizer settings;
- object changes,
- differences in privileges;
- Adaptive cursor sharing.

---

# 17. Why isn't there always only one cursor

Two sessions may execute:

```
SELECT *
FROM orders
WHERE customer_id =: id;
```

but with different contexts.

For example:

```
Session 1
optimizer_mode = ALL_ROWS

Session 2
optimizer_mode = FIRST_ROWS
```

Oracle can create different child cursors.

---

# 18. Bind Peeking

Here comes a very important concept.

At the first hard parse:

```
SELECT *
FROM orders
WHERE status =: status;
```

Oracle can inspect the value of the bind.

For example:

```
: status = 'CANCELLED'
```

The optimiser sees this value when he generates the plan.

This mechanism is called:

**band peeking**

---

# 19. The problem of unbalanced distributions

Let's assume the table:

```
ORDERS

status rows
--------------------
ACTIVE 9.000,000
CANCELLED 5,000
FAILED 2,000
```

There is an index:

```
CREATEQ1QX idx_orders_status
ON orders (status);
```

For:

```
status = 'FAILED'
```

An index can be excellent.

But for:

```
status = 'ACTIVE'
```

may be more effective:

```
FULLQ1QX SCAN
```

---

# 20. Bind Variable and Plan

SQL:

```
SELECT *
FROM orders
WHERE status =: status;
```

First execution:

```
: status = 'FAILED'
```

The optimiser can choose:

```
INDERANGE SCAN
```

Second execution:

```
: status = 'ACTIVE'
```

If the same plan is reused:

```
INDERANGE SCAN
```

can become very ineffective.

This is one of the classic problems associated with the band variables.

---

# 21. Adaptive Sharing Course

Oracle can detect that the same SQL needs different plans depending on the Bind values.

The mechanism is called:

**Adaptive Saring** Cursor

Conceptual:

```
SELECT *
FROM orders
WHERE status =: status
```

can reach:

```
Child Cursor 0
FAILED
→ INDEX RANGE SCAN

Child Cursor 1
ACTIVE
→ FULL TABLE SCAN
```

So Oracle retains the advantage of the band variables, but may have several plans.

---

# 22. Bend-sensitive cursor

Oracle can identify a straight cursor:

```
BIND_SENSITIVE
```

I mean:

> the performance of the plan could depend on the bind values.

You can see information in:

```
V$SQL
```

for example:

```
SELECT
sql_id,
child_number,
is_bind_sensitive,
is_bind_aware,
executions
FROM v $sql
WHERE sql_text LIKE '%orders%';
```

---

# 23. Bend-aware cursor

If Oracle determines that the distribution of values produces significant selectivity differences, the cursor may become:

```
BIND_AWARE
```

Then Oracle can use different child cursors for different categories of wind values.

---

# 24. Histogram and Band Variables

Histograms help the optimiser understand uneven distributions.

For example:

```
ACTIVE 99%
CANCELLED 0.07%
FAILED 0.03%
```

Without the histogram, the optimiser may assume approximately:

```
1 / număr_valori_distincte
```

for each value.

With the histogram, it can estimate selectivity more correctly.

Bind peeking + histogram + Adaptive Sharing Cursor are closely linked in such cases.

---

# 25. SQL Injection

Bind variables are not only important for performance.

They are also the standard mechanism for separating:

```
SQL code
```

by:

```
user date
```

Dangerous example:

```
v_sql:
*
FROM users
WHERE username = ''' || p_username || '''
```

If the implant is constructed badly, there is a risk of SQL injection.

Correct version:

```
v_sql:
*
FROM users
WHERE username

OPEN rc FOR v_sql
USING p_username;
```

The value is treated as a date, not as SQL.

---

# 26. Bind variables cannot replace SQL objects

Very important:

bind variables can represent **values**, not SQL objects.

Right:

```
SELECT *
FROM
WHERE department_id =: dept;
```

But you can't do:

```
SELECT *
FROM: table_name;
```

or:

```
ORDER BY: column_name;
```

in the sense of replacing the name of the column.

SQL objects require Dynamic SQL.

---

# 27. Example with dynamic table name

If the table is variable:

```
v_sql:
*)
FROM;

EXECUTEQ1QX v_sql
INTO v_count;
```

Observe:

```
Table name → controlled concatenation
values → bind variables
```

The recommended patent is:

```
SQL structure → built controlled
data values → bind variables
```

---

# 28. Parsing in an important loop

Bad example:

```
FOR r IN
SELECT customer_id
FROM customers
)
LOOP

EXECUTE IMMEDIATE
= = sync, corrected by elderman = = @ elder _ man
WHERE customer_id = "customer_id ';

END LOOP;
```

You have potential:

```
100,000 customers
→ 100.000 SQL texts
→ many parses
```

Better version:

```
FOR r IN
SELECT customer_id
FROM customers
)
LOOP

EXECUTE IMMEDIATE
= = sync, corrected by elderman = = @ elder _ man
WHERE customer_id =: 1
USING r.customer_id;

END LOOP;
```

But even this can be improved.

---

# 29. SQL set-based is even better

In fact, if logic allows:

```
DELETE FROM orders
WHERE customer_id IN (
SELECT customer_id
FROM customers
);
```

It's preferable.

Pattern:

```
row-by-row
      ↓

bind variables

      ↓

set-based SQL
```

Often the last one is the best.

---

# 30. Parse calls vs Executions

In V$SQL we can see:

```
SELECT
sql_id,
executions,
parse_calls,
Loads,
invalidations,
sql_text
FROM v $sql
WHERE executions
```

A good SQL for reuse could have:

```
EXECUTIONS 1,000,000
PARSE_CALLS 20
```

That's a lot of executions and few parsings.

A problematic SQL:

```
EXECUTIONS 100,000
PARSE_CALLS 100,000
```

can indicate a problem of cursor success.

---

# 31. Very Important: Soft Parse does not mean zero cost

It's a common mistake to say:

> soft parse costs nothing.

That's not true.

Soft parse is cheaper than hard parse, but still involves:

- look in library cache,
- checks;
- synchronization;
- CPU.

That's why well-built applications sometimes try to reuse even the cursor already open.

---

# 32. Parse once, execute many

The ideal model is approximately:

```
PARSE

EXECUTE
EXECUTE
EXECUTE
EXECUTE
EXECUTE
...
```

No:

```
PARSE
EXECUTE

PARSE
EXECUTE

PARSE
EXECUTE
```

The concept is often expressed as:

> **Parse once, execute many.

---

# 33. Example JDBC

Bad example:

```
String sql =
* SELECT * FROM customers WHERE customer_id * FROM customerId;

Statement stmt = conn.createSitement ();

Stmt.executeQuery (sql);
```

Better:

```
PreparedStatus stmt =
Conn. PrepareStatement (
* FROM customers WHERE customer_id =?
);

Stmt.setInt (1, customerId);

Stmt.executeQuery ();
```

? gets the wind variable in the interaction with Oracle.

---

# 34. Example Python

With Oracle driver:

```
course. Executes (
♪ ♪
SELECT *
FROM customers
WHERE customer_id =:
♪ ♪
id = 100
)
```

No:

```
course. Executes (
♪ ♪
SELECT *
FROM customers
WHERE customer_id = {customer_id}
♪ ♪
)
```

---

# 35. Example DWH / ETL

Let's assume an ETL trial:

```
1 million transactions
```

A bad code generates:

```
UPDATE fact_transactions
SET amount = 100
WHERE transaction_id = 1;

UPDATE fact_transactions
SET amount = 200
WHERE transaction_id = 2;

UPDATE fact_transactions
SET amount = 300
WHERE transaction_id = 3;
```

Each SQL has different text.

Better:

```
UPDATE fact_transactions
SET%
WHERE transaction_id =: transaction_id;
```

Repeatedly executed with binds.

And better yet, for the high volume, it can be:

```
MERGE
```

or set-based operation.

---

# 36. Parsing Storm

A phenomenon called informal can occur in highly charged systems:

**parse storm**

Many sessions simultaneously make hard parse for many SQL-uri.

Symptoms:

```
High CPU
Shared Pool matter
library cache content
metex waits
many child cursors
```

The problem is frequently related to:

```
SQL with literal
```

for:

```
bind variables
```

---

# 37. CURSOR\ _ SHARING

The Oracle has the parameter:

```
CURSOR_SHARING
```

Important values:

```
EXACT
FORCE
```

---

## EXACT

Oracle tries to reuse SQL only if the text is compatible / exactly according to the matching mechanism.

Example:

```
customer_id = 100
```

and:

```
customer_id = 101
```

are different SQL-s.

---

## FORCE

Oracle can automatically replace certain literals with domestically generated bindums.

Conceptual:

```
WHERE customer_id = 100
```

can become something like:

```
WHERE customer_id =: SYS_B_0
```

This can reduce the hard parsing of poorly designed applications.

However:

> CURSOR\ _ SHARING = FORCE is not an ideal substitute for the bind variables correctly implemented in the application.

---

# 38. How to find SQL-uri with many parses

Example:

```
SELECT
sql_id,
executions,
parse_calls,
ROUND (parse_calls / NULLIF (executions, 0), 3) AS parse_per_exec
sql_text
FROM v $sql
WHERE executions
ORDER BY parse_per_exec DESC;
```

If you find:

```
parse_calls
```

It's worth investigating.

---

# 39. How to find almost identical SQL-uri

Suppose in V$SQL:

```
SELECT * FROM accounts WHERE account_id = 100
SELECT * FROM accounts WHERE account_id = 101
SELECT * FROM accounts WHERE account_id = 102
SELECT * FROM accounts WHERE account_id = 103
```

It's a strong indication that the app does not use the bind variables.

---

# 40. What SQL\ _ ID is

The Oracle shall generate an identifier:

```
SQL_ID
```

for SQL status.

Example:

```
SELECT
sql_id,
sql_text
FROM v $sql;
```

Bind variables:

```
SELECT *
FROM accounts
WHERE account_id =:
```

you will basically have a reused SQL status.

With literals:

```
account_id = 100
account_id = 101
account_id = 102
```

you will see more distinct SQL-s.

---

# 41. Parse → Bind → Execute → Fetch

For an SELECT, the complete conceptual model is:

```
PARSE
  ↓
BIND
  ↓
EXECUTE
  ↓
FETCH
```

Example:

```
SELECT
FROM customers
WHERE customer_id =: id;
```

Oracle:

```
PARSE
SQL-

BIND
: id = 100

EXECUTE

FETCH
rows
```

For DML:

```
PARSE
BIND
EXECUTE
```

you don't have the FETCH stage in the same sense.

---

## Questions and answers

### What is hard parse?

The process in which Oracle has to compile a new SQL, including semantic checks and the generation of the plane execution by the optimiser.

---

### What is soft parse?

Oracle finds a compatible cursor in Shared Pool and reuses the execution of the existing planet.

---

### Why are the bind variables important?

Because they allow the cursor to be re-used, they reduce the hard parsing, the consumption of CPU and the contention in Shared Pool.

---

### What is the difference between these two SQL-uri?

```
SELECT *
FROM custodian
WHERE id = 10;
```

and:

```
SELECT *
FROM custodian
WHERE id =: id;
```

The first one contains literally and can generate distinct SQL-s for each value.

The second allows the same SQL to be re-used.

---

### Bind variables can have disadvantages?

For columns with very uneven distributions, the same access strategy may not be optimal for all values.

Oracle manages this situation including by:

```
bind peeking
adaptive cursor sharing
bind-aware cursors
```

---

### What's the bind peeking?

At hard parse, the optimiser can inspect the initial value of the variable band to estimate selectivity and build the execution of the plane.

---

### What is Adaptive Sharing Cursor?

Mechanism through which Oracle can maintain several child cursors and execution plans for the same SQL with the bind variables, depending on the selectivity of the band values.

---

### Is soft parse free?

No.

It is much cheaper than hard parse, but still has the cost of CPU and library cache lookup.

---

## Questions and answers

Interviewer:

> We have a banking application where the CPU- database is very high, but the SQL-s are simple.

A good answer:

> I would first check if we have many hard parses. In V$SQL I would compare PARSE\ _ CALS with EXECUTIONS and I would look for almost identical SQL-s that differ only by literal values. If the application generates SQL as count\ _ id = 100, account\ _ id = 101 etc., I would recommend using the band variables. I would then check the number of child courses and the reasons why they are not re-used. For SQL-uri sensitive to data distribution I would analyze and bind peeking, histograms and Adaptive Course Sharing.

This is a very good response for a role of **Oracle Data Developer / PL/SQL Developer**.

---

# 44. Mental Pattern To Remember

for review, remember the chain:

```
SQL
 ↓
Parsing
 ↓
Hard Parse / Soft Parse
 ↓
Shared Pool
 ↓
Library Cache
 ↓
Cursor
 ↓
Implementation Plan
```

and for the bind variables:

```
Literals
   ↓
many SQL texts
   ↓
many hard parses
   ↓
CPU + content

Bind Variables
   ↓
Same SQL text
   ↓
cursor failed
   ↓
more soft parses
   ↓
better scalability
```

But there's the nuance:

```
bind variables
      +
skewed date
      ↓
bind peeking
      ↓
inappropriate plan for some values
      ↓
Adaptive Sharing Cursor
      ↓
multiple child cursors
```

---

## Essential to your course

For the level of **Oracle Data Developer**, I would consider it mandatory to be able to explain these 8 concepts without hesitation:

1. **Hard Parse vs Soft Parse**
2. **Shared Pool / Library Cache**
3. **Band Variables**
4. **Parse once, execute many**
5. **Parent Cursor vs Child Cursor**
6. **Band Peeking**
7. **Adaptive Saring** Cursor
8. **Why Dynamic SQL should use USING for** values

The link with the previous modules is very important:

```
Statistics
     ↓
Optimizer
     ↓
Parsing
     ↓
Bind Peeking
     ↓
Implementation Plan
     ↓
Child Cursor
     ↓
Adaptive Sharing Cursor
```

This explains why **Parsing and Bind Variables** is not only a syntax subject, but a central one for Oracle performance tuning.

---

## Questions and answers

### How would you briefly explain Parsing and Bind Variables to a colleague who knows SQL, but not this area?

Parsing and Bind Variables covers SQL parsing lifecycle, hard parse vs soft parse, shared pool and cursor success. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Parsing and Bind Variables?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Parsing and Bind Variables, I explicitly follow SQL parsing lifecycle, hard parse vs soft parse, shared pool and cursor success and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Parsing and Bind Variables appear together with logging, auditing, reconciliation and impact analysis.
