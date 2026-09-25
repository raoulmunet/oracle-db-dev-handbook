---
title: 'C02. PL/SQL'
description: 'Complete English handbook chapter based on the original C02 course.'
sidebar_position: 2
---

# C02. PL/SQL

<div className="chapter-kicker">Chapter C02 · Complete course</div>

Below you have a short but comprehensive PL/SQL** course, thought mainly for real work with Oracle, ETL/DWH and Oracle Data Developer interviews. The central idea: **PL/SQL = SQL + procedural logic**. SQL works ideally set-based; PL/SQL comes into play when you need flow control, error treatment, modulation, batch processing or procedural logic close to data.

# 2. PL/SQL is fundamentally → advanced

## 1. What PL/SQL is

PL/SQL is the Oracle procedural extension for SQL.

SQL says mainly **what data you want**:

```
SELECT employee_id salary
FROM
WHERE department_id = 50;
```

PL/SQL allows you to say **as well as how** logic should be performed:

```
BEGIN
UPDATE
SET salary = salary * 1.05
WHERE department_id = 50;

DBMS_OUTPUT.PUT_LINE (SQL% ROWCOUNT; ' employees updated');
END;
/
```

PL/SQL introduces:

- variables;
- IF;
- CASE;
- loops;
- cursors;
- exceptions;
- procedures;
- functions;
- the packages,
- collections,
- bulk processing;
- Dynamic SQL;
- Triggers.

A very important principle:

> If a problem can be effectively solved by a single SQL, do not unnecessarily turn it into an PL/SQL loop.

I mean:

```
UPDATE
SET salary = salary * 1.10
WHERE department_id = 50;
```

is almost always preferable to:

```
FOR r IN
SELECT employee_id
FROM
WHERE department_id = 50
)
LOOP
UPDATE
SET salary = salary * 1.10
WHERE employee_id = r.employee_id;
END LOOP;
```

This is the reason for the expression:

**row-by-row = slow-by-slow**.

---

# 2. Structure of an PL/SQL Block

General form:

```
DECLARE
-- statements
BEGIN
-- executable code
EXCEPTION
-- treatment of errors
END;
/
```

Example:

```
DECLARE
v_salary NUMBER;
BEGIN
SELECT salary
INTO v_salary
FROM
WHERE employee_id = 100;

DBMS_OUTPUT.PUT_LINE ('Salary = ');

EXCEPTION
WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('Employee not found');
END;
/
```

The three areas are:

```
DECLARE optional
Mandatory BEGIN
EXCEPTION optional
END;
```

A block without declarations:

```
BEGIN
DBMS_OUTPUT.PUT_LINE ('Hello PL/SQL');
END;
/
```

---

# 3. Variables and data types

Simple example:

```
DECLARE
v_name VARCHAR2 (100);
v_salary NUMBER (10.2);
v_date DATE;
v_active BOOLEAN;
BEGIN
v_name: = 'John';
v_salary: = 5000;
v_date: = SYSDATE;
v_active: = TRUE;
END;
/
```

The award operator shall be:

```
: =
```

No:

```
=
```

---

# 4.% TYPE

Very important in real Oracle code.

Instead of:

```
v_salary NUMBER (10.2);
```

you can write:

```
v_salary employees.salary% TYPE;
```

The advantage is that the variable inherits the type of column.

If the definition of column changes, the code shall not necessarily be changed.

Example:

```
DECLARE
v_salary employees.salary% TYPE;
BEGIN
SELECT salary
INTO v_salary
FROM
WHERE employee_id = 100;
END;
/
```

It's a highly recommended pattern.

---

# 5.% ROWTYPE

Allows the definition of a variable with the structure of a whole row.

```
DECLARE
v_emp employees% ROWTYPE;
BEGIN
SELECT *
INTO v_emp
FROM
WHERE employee_id = 100;

DBMS_OUTPUT.PUT_LINE (v_emp.first_name);
DBMS_OUTPUT.PUT_LINE (v_emp.salary);
END;
/
```

Conceptual:

```
v_emp.employee_id
v_emp.first_name
v_emp.salary
v_emp.department_id
...
```

---

# 6. SELECT INTO

In PL/SQL, an SELECT that has to bring values into variables uses:

```
SELECT...
INTO...
FROM...
```

Example:

```
DECLARE
v_name employees.last_name% TYPE;
v_salary employees.salary% TYPE;
BEGIN
SELECT last_name salary
INTO v_name, v_salary
FROM
WHERE employee_id = 100;
END;
/
```

But SELECT INTO expects **exactly one row**.

If he finds nothing:

```
NO_DATA_FOUND
```

If he finds several lines:

```
TOO_MANY_ROWS
```

Example:

```
EXCEPTION
WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('No employee');

WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('Multiple employees');
```

This is a very common subject of the technical discussion.

---

# 7. Control flow - IF

Syntax:

```
IF condition THEN
    ...
ELSIF condition THEN
    ...
ELSE
    ...
END IF;
```

Example:

```
IF v_salary
v_level: = 'LOW';

ELSIF v_salary
v_level: = 'MEDIUM';

ELSE
v_level: = 'HIGH';
END IF;
```

---

# 8.CASE

It can be more elegant than many ELSIF.

```
CASE
WHEN v_salary
v_level: = 'LOW';

WHEN v_salary
v_level: = 'MEDIUM';

ELSE
v_level: = 'HIGH';
END CASE;
```

Or:

```
CASE v_status
WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('New');

WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('Processed');

WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE ('Error');
END CASE;
```

---

# 9. Loops PL/SQL

## Basic LOOP

```
LOOP
v_counter: = v_counter + 1;

EXIT WHEN v_counter
END LOOP;
```

## WHILE

```
WHILE v_counter

v_counter: = v_counter + 1;

END LOOP;
```

## FOR

```
FOR i IN 1.. 10 LOOP
DBMS_OUTPUT.PUT_LINE (i);
END LOOP;
```

Very simple and very used.

---

# 10. Default Cursor

Oracle automatically creates a cursor for the executed SQL-s.

After:

```
UPDATE
SET salary = salary * 1.05
WHERE department_id = 50;
```

you can use:

```
SQL
```

Example:

```
DBMS_OUTPUT.PUT_LINE (
SQL% ROWCOUNT
);
```

There are also:

```
SQL
SQL
SQL
SQL
```

---

# 11. Explicit Cursor

A cursor is a result set that you process.

```
DECLARE

CURSORQ1QX IS
SELECT employee_id,
last_name,
salary
FROM
WHERE department_id = 50;

BEGIN

FOR r IN c_emp LOOP

DBMS_OUTPUT.PUT_LINE (
r.employee_id
r.last_name
);

END LOOP;

END;
/
```

The advantage of FOR cursor LOOP is that Oracle automatically manages:

```
OPEN
FETCH
CLOSE
```

---

# 12. Classic version OPEN / FETCH / CLOSE

```
OPEN c_emp;

LOOP

FETCH c_emp
INTO v_id, v_name;

EXIT WHEN c_emp% NOTFOUND;

    ...

END LOOP;

CLOSE c_emp;
```

You must understand this mechanism even if FOR LOOP is often more comfortable.

---

# 13. Parametrized Cursors

Very useful:

```
CURSOR c_emp (p_department_id NUMBER) IS

SELECT employee_id,
last_name,
salary
FROM
WHERE department_id = p_department_id;
```

Use:

```
FOR r IN c_emp (50) LOOP
    ...
END LOOP;
```

You can then reuse the cursor.

---

# 14. Exception handling

Structure:

```
BEGIN

    ...

EXCEPTION

WHENQ1QX THEN
        ...

WHENQ1QX THEN
        ...

WHENQ1QX THEN
        ...

END;
/
```

WHEN OTHERS means:

> any exception that has not already been treated.

Example:

```
EXCEPTION
WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE (SQLERRM);
```

But in a real system it's not good to swallow the error.

This is a dangerous practice:

```
WHENQ1QX THEN
NULL;
```

Because the error completely disappears.

---

# 15. SQLCODE and SQLERRM

In an exception handler you can find out:

```
SQLCODE
```

and:

```
SQLERRM
```

Example:

```
EXCEPTION
WHENQ1QX THEN

DBMS_OUTPUT.PUT_LINE (
'Code: ' - SQLCODE
);

DBMS_OUTPUT.PUT_LINE (
'Message: ' - SQLERRM
);

RAISE;
END;
/
```

Very useful for login.

In practice, values must be captured in the context of the exception.

For example:

```
EXCEPTION
WHENQ1QX THEN
log_error (
SQLCODE,
SQLERRM
);

RAISE;
```

---

# 16. RAISE

RAISE triggers or reproaches an exception.

Very important:

```
EXCEPTION
WHENQ1QX THEN

log_error (...);

RAISE;
END;
```

In this case:

1. the error occurs;
2. you record it;
3. RAISE sends the same error above to the caller.

No:

```
RAISE;
```

The procedure could appear to be successful.

This pattern is very important for ETL.

---

# 17. Exceptions defined by the programmer

```
DECLARE

e_invalid_salary EXCEPTION;

BEGIN

IF v_salary
RAISE e_invalid_salary;
END IF;

EXCEPTION

WHENQ1QX THEN
DBMS_OUTPUT.PUT_LINE (
'Salary cannot be negative'
);

END;
/
```

---

# 18. RAISE\ _ APPLICATION\ _ ERROR

Allows the generation of an Oracle error of its own.

```
RAISE_APPLICATION_ERROR (
-20001,
'Salary cannot be negative'
);
```

Standard interval for customa errors:

```
-20,000... -20999
```

Example:

```
IF p_amount

RAISE_APPLICATION_ERROR (
-20001,
'Amount must be positive'
);

END IF;
```

Very used in applications.

---

# 19. Procedure

A procedure runs an operation.

```
CREATE OR REPLACE PROCEDURE increase_salary (
p_employee_id IN NUMBER,
p_percentQ1QX NUMBER
)
IS
BEGIN

UPDATE
SET salary =
salary * (1 + p_percent / 100)
WHERE employee_id = p_employee_id;

END;
/
```

Call:

```
BEGIN
increase_salary (100.5);
END;
/
```

---

# 20. IN, OUT, IN OUT parameters

## IN

Entry value.

```
p_employee_idQ1QX NUMBER
```

## OUT

The procedure returns a value:

```
p_salaryQ1QX NUMBER
```

## IN OUT

Receive and modify the same variable:

```
p_value IN OUT NUMBER
```

Example:

```
CREATE OR REPLACE PROCEDURE get_salary (
p_employee_id IN NUMBER,
p_salaryQ1QX NUMBER
)
IS
BEGIN

SELECT salary
INTO p_salary
FROM
WHERE employee_id = p_employee_id;

END;
/
```

---

# 21. Functions

A function returns a value.

```
CREATE OR REPLACE FUNCTION get_salary (
p_employee_id NUMBER
)
RETURN NUMBER
IS
v_salary employees.salary% TYPE;
BEGIN

SELECT salary
INTO v_salary
FROM
WHERE employee_id = p_employee_id;

RETURN v_salary;

END;
/
```

Call:

```
SELECT get_salary (100)
FROM dual;
```

Conceptual difference:

```
Procedure
execute an action

Function
calculate and return a value
```

Although procedural things can be much more complex.

---

# 22. Packages

Packages are extremely important in Oracle.

A pack groups:

```
procedus
function
variables
constants
Types
cursors
exceptions
```

Structure:

```
PACKAGE SPECIFICATION
PACKAGE BODY
```

---

# 23. Package specification

Public interface:

```
CREATE OR REPLACE PACKAGE pkg_employee
IS

PROCEDURE increase_salary (
p_employee_id NUMBER,
p_percent NUMBER
);

FUNCTION get_salary (
p_employee_id NUMBER
)
RETURN NUMBER;

END pkg_employee;
/
```

Everything in the specification is public.

---

# 24. Package Body

Implementation:

```
CREATE OR REPLACE PACKAGE BODY pkg_employee
IS

PROCEDURE increase_salary (
p_employee_id NUMBER,
p_percent NUMBER
)
IS
BEGIN

UPDATE
SET salary =
salary * (1 + p_percent / 100)
WHERE employee_id = p_employee_id;

END;

FUNCTION get_salary (
p_employee_id NUMBER
)
RETURN NUMBER
IS
v_salary employees.salary% TYPE;
BEGIN

SELECT salary
INTO v_salary
FROM
WHERE employee_id = p_employee_id;

RETURN v_salary;

END;

END pkg_employee;
/
```

Call:

```
BEGIN
pkg_employee.increase_salary (100.5);
END;
/
```

---

# 25. Public and Private Members in Package

If a procedure occurs only in:

```
PACKAGE BODY
```

But not in specification, it's private.

Example:

```
PACKAGEQ1QX pkg_employee
IS

PROCEDURE write_log (...) IS
BEGIN
       ...
END;
```

Write\ _ log can be used internally, but not by caller.

This is an encapsulation mechanism.

---

# 26. Package State

A package can have global variables:

```
CREATEQ1QX pkg_session
IS
g_user_id NUMBER;
END;
/
```

The amount may remain available for the duration of the Oracle session.

This is called:

**pack state**.

It should be used carefully because it introduces state in session.

---

# 27. Collections

PL/SQL allows collections.

The three main types:

```
Associative Array
Nested Table
VARRAY
```

Conceptual example:

```
TYPE t_ids IS TABLE OF NUMBER
INDEX BY PLS_INTEGER;

v_ids t_ids;
```

Then:

```
v_ids (1): = 100;
v_ids (2): = 101;
v_ids (3): = 102;
```

---

# 28. BULK COLLECT

Allows loading several rows into collections.

Instead of doing a lot of fetchies:

```
SELECT employee_id
BULK COLLECT INTO v_ids
FROM
WHERE department_id = 50;
```

Example:

```
DECLARE

TYPE t_ids IS TABLE OF employees.employee_id% TYPE;

v_ids t_ids;

BEGIN

SELECT employee_id
BULK COLLECT INTO v_ids
FROM
WHERE department_id = 50;

END;
/
```

Main advantage:

reduce the number of context switches between:

```
PL/SQL engine
;
SQL engine
```

---

# 29. FORALL

FORALL runs DML in bulk.

Example:

```
FORALL i IN 1.. v_ids.COUNT

UPDATE
SET salary = salary * 1.05
WHERE employee_id = v_ids (i);
```

Compared to:

```
FOR i IN 1.. v_ids.COUNT LOOP

UPDATE
SET salary = salary * 1.05
WHERE employee_id = v_ids (i);

END LOOP;
```

FORALL is usually much more effective.

Common:

```
BULK COLLECT
      ↓
PL/SQL collection
      ↓
FORALL
      ↓
INSERT / UPDATE / DELETE
```

Very important to ETL.

---

# 30. Attention to memory with BULK COLLECT

This can be dangerous:

```
SELECT *
BULK COLLECT INTO v_data
FROM gigantic_table;
```

Because he's trying to upload everything in memory of the process.

The batch processing is often used:

```
FETCH c_data
BULK COLLECT INTO v_data
LIMIT 1000;
```

Conceptual example:

```
LOOP

FETCH c_data
BULK COLLECT INTO v_rows
LIMIT 1000;

EXIT WHEN v_rows.COUNT = 0;

    ...

END LOOP;
```

This is an important pattern for large volumes.

---

# 31. Dynamic SQL

Sometimes SQL- is not fully known when compiling.

Example:

```
EXECUTE IMMEDIATE
'DELETE FROM staging_transactions';
```

More realistic:

```
v_sql:
* UPDATE employment *
SET salary = salary *: 1
WHERE department_id =: 2

EXECUTEQ1QX v_sql
USING 1.05, 50;
```

---

# 32. Bind Variables

He prefers:

```
WHERE department_id =: 1
```

for concatenation:

```
'WHERE department_id = ' - p_department_id
```

Bind Variables offers benefits related to:

```
security
overhead parse
cursor failed
SQL injection
```

Especially for outside strings, uncontrolled concatenation is dangerous.

---

# 33.SQL injection

Problem code:

```
v_sql:
*
FROM customers
WHERE
"p_name 'is replaced by the following:
```

A manipulated input may alter SQL-.

Safer:

```
v_sql:
*
FROM customers
WHERE
```

and:

```
EXECUTEQ1QX v_sql
...
USING p_name;
```

---

# 34. Dynamic SQL with INTO

Example:

```
EXECUTE IMMEDIATE
*)
FROM = v_table_name
INTO v_count;
```

Important remark:

values can be bind variables.

The names of objects, such as:

```
backtables
color
```

I can't be bind variables in the same way.

That's why Dynamic SQL that builds object names must be validated very carefully.

---

# 35. Triggers

Trigger is PL/SQL code executed automatically at an event.

Example:

```
CREATE OR REPLACE TRIGGER trg_employee_salary
BEFORE UPDATE OF salary
ON
FORQ1QX ROW
BEGIN

IF: NEW.salary; OLD.salary THEN

RAISE_APPLICATION_ERROR (
-20001,
'Salary cannot decrease'
);

END IF;

END;
/
```

---

# 36.: OLD and: NEW

In a row trigger:

```
: OLD
```

represents the old value.

```
: NEW
```

is the new value.

Example:

```
IF: NEW.salary; OLD.salary THEN
    ...
END IF;
```

---

# 37. BEFORE / AFTER

You can have:

```
BEFORE INSERT
AFTER INSERT

BEFORE UPDATE
AFTER UPDATE

BEFORE DELETE
AFTER DELETE
```

and combinations:

```
BEFORE INSERT OR UPDATE
```

---

# 38. Row Trigger vs Statement Trigger

With:

```
FORQ1QX ROW
```

Trigger runs for each row.

No:

```
FORQ1QX ROW
```

run a date for the statement.

If:

```
UPDATE
SET salary = salary * 1.05;
```

amend 10,000 lines:

row trigger:

```
10,000 executions
```

Trigger statement:

```
1 execution
```

The difference is very important.

---

# 39. Triggers; carefully used

Triggers can create hidden logic.

For example:

```
UPDATE CUSTOMER
```

It looks trivial, but it can start:

```
TRIGGER
   ↓
UPDATE ACCOUNT
   ↓
other TRIGGER
   ↓
INSERT AUDIT
```

For this reason, in many systems explicit logic is preferred in:

```
packages
procedus
ETL
application layer
```

where possible.

---

# 40. Transactions in PL/SQL

The main commands are:

```
COMMIT;
ROLLBACK;
SAVEPOINT;
```

Example:

```
BEGIN

UPDATE accounts
SET balance = balance - 100
WHERE account_id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 2;

COMMIT;

EXCEPTION

WHENQ1QX THEN
ROLLBACK;
RAISE;

END;
/
```

---

# 41. SAVEPOINT

```
SAVEPOINT before_step2;
```

Then:

```
ROLLBACK TO before_step2;
```

You can only return to a certain point in the transaction.

---

# 42. Who should give COMMIT?

This is an important subject of design.

Imagine:

```
procedure_a
    ↓
procedure_b
    ↓
procedure_c
```

If the procedure\ _ b does:

```
COMMIT;
```

then the caller loses the opportunity to make rollback on the respective changes.

Therefore, in many architectures:

> internal procedures do not do COMMIT; the transaction is controlled by the higher level.

It's not an absolute rule, but it's a very important practice.

---

# 43. Pattern ETL - Logging + Error Propagation

A simplified pattern:

```
BEGIN

INSERT INTO target_table (...)
SELECT...
FROM staging_table;

EXCEPTION

WHENQ1QX THEN

log_error (
p_process = = 'LOAD_CUSTOMERS',
p_code = = SQLCODE,
p_message = = SQLERRM
);

RAISE;

END;
/
```

Flux:

```
ETL step
   ↓
error
   ↓
exception handler
   ↓
log error
   ↓
RAISE
   ↓
ETL framework sees FAIL
```

This is a much healthier pattern than:

```
WHENQ1QX THEN
NULL;
```

---

# 44. Error stack

For serious debugging, SQLERRM is not always enough.

Oracle offers:

```
DBMS_UTILITY.FORMAT_ERROR_STACK
```

and:

```
DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
```

Example:

```
EXCEPTION
WHENQ1QX THEN

DBMS_OUTPUT.PUT_LINE (
DBMS_UTILITY.FORMAT_ERROR_STACK
);

DBMS_OUTPUT.PUT_LINE (
DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
);

RAISE;
END;
/
```

FORMAT\ _ ERROR\ _ BACKTRACE is very useful because it can show the line in the code where the problem actually occurred.

---

# 45. A good login pattern

For example:

```
EXCEPTION
WHENQ1QX THEN

pkg_log.write_error (
p_process = = 'LOAD_ACCOUNTS',
p_sqlcode = = SQLCODE,
p_sqlerrm = = SQLERRM,
p_stack = = DBMS_UTILITY.FORMAT_ERROR_STACK,
p_backtrace = = DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
);

RAISE;
```

For DWH/ETL systems, this is an extremely useful pattern.

---

# 46. Autonomous Transaction

There are cases where the logger must keep the error even if the main transaction makes rollback.

Use:

```
PRAGMA AUTONOMOUS_TRANSACTION;
```

Conceptual example:

```
CREATE PROCEDURE log_error (...)
IS
PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN

INSERT INTO error_log (...);

COMMIT;
END;
```

Thus:

```
business transaction → ROLLBACK

logging transaction → COMMIT
```

But autonomous transactions must be used in a controlled manner.

---

# 47. Complete example of ETL procedure

A realistic example:

```
CREATE OR REPLACE PROCEDURE load_customers
IS
BEGIN

INSERT INTO dwh_customer (
customer_id,
customer_name,
load_date
)
SELECT
customer_id,
customer_name,
SYSDATE
FROM stg_customer
WHERE NOT EXISTS (
SELECT 1
FROM dwh_customer d
WHERE d.customer_id = s.customer_id
);

DBMS_OUTPUT.PUT_LINE (
SQL% ROWCOUNT
);

EXCEPTION

WHENQ1QX THEN

pkg_log.write_error (
p_process = = 'LOAD_CUSTOMERS',
p_sqlcode = = SQLCODE,
p_sqlerrm = = SQLERRM,
p_backtrace =
DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
);

RAISE;

END;
/
```

Note that insertion is:

```
INSERT INTO...
SELECT...
```

and not:

```
cursor
→ loop
→ insert
→ loop
→ insert
...
```

It's exactly the difference between:

```
set-based processing
```

and:

```
row-by-row processing
```

---

# 48. Set-based vs procedural

This is one of the most important ideas for an Oracle developer.

### Weak

```
FOR r IN
SELECT *
FROM staging_customer
)
LOOP

INSERT INTO custodian (...)
VALUES (...);

END LOOP;
```

### Preferably

```
INSERT INTO custodian (...)
SELECT...
FROM staging_customer;
```

If, however, for each row, complex procedural logic must be executed, then you can reach:

```
BULK COLLECT
+
FORALL
```

---

# 49. Correct mental order when solving the problem

In Oracle, he thinks about it this way:

```
1. Can I do everything in one SQL?

↓ no

2. Can I make bulk processing?

↓ no

3. I need PL/SQL row-by-row?
```

Not the other way around.

---

# 50. Procedure vs function vs package

A simple representation:

```
PACKAGE
│
− FUNCTION
Returns value
│
− PROCEDURE
He's performing an operation.
│
− TYPES
− CONSTANTS
− VARIABLES
− CURSORS
− PRIVATE HELPERS
```

In mature Oracle projects, much of the logic of PL/SQL is organized in packages.

---

## Questions and answers

For an Oracle / Data Developer role, I would consider it mandatory to be able to explain without hesitation:

```
PL/SQL block
DECLARE / BEGIN / EXCEPTION / END

% TYPE
% ROWTYPE

SELECT INTO
NO_DATA_FOUND
TOO_MANY_ROWS

IF / CASE
LOOP / FOR / WHILE

default cursor
explicit cursor
Parametrized cursor

procedure
function
package specification
pack body
public / private members
Package State

exception handling
SQLCODE
SQLERRM
RAISE
RAISE_APPLICATION_ERROR

transactions
COMMIT
ROLLBACK
SAVEPOINT

collections
BULK COLLECT
FORALL
LIMIT

Dynamic SQL
EXECUTE IMMEDIATE
bind variables
SQL injection

triggers
BEFORE / AFTER
row / statement
: OLD /: NEW
```

---

## Questions and answers

### What is the difference between procedure and function?

The function must return a value through RETURN; the procedure is mainly directed at performing an operation and can return information through OUT parameters.

### What if SELECT INTO finds nothing?

```
NO_DATA_FOUND
```

### What if he finds two lines?

```
TOO_MANY_ROWS
```

### What's RAISE doing?

Trigger an exception or, in a handler, propagate the current exception to the caller.

### Why BULK COLLECT?

Reduce the number of transfers between PL/SQL engine and SQL engine.

### Why FORALL?

Allows bulk execution of DML collection operations.

### # Package spec vs body?

Spec:

```
public interface
```

Body:

```
Implementation + Private Members
```

### Why are they playing variables in Dynamic SQL?

For security, reuse of the cursor and reduction of overhead parse.

### What problem is there with WHEN OTHERS THEN NULL?

It completely hides the error.

---

# 53. Important Traps

Remember in particular these:

```
1. SELECT INTO demands exactly one line.

2. WHEN OTHERS THEN NULL is almost always a bad idea.

3. COMMIT in lowlevel procedures can destroy transaction control.

4. Cursor + loop for millions of rows can be very slow.

5. SQL set-based should be preferred when possible.

6. BULK COLLECT without LIMIT can consume a lot of memory.

7. Dynamic SQL by concatenation can produce SQL injection.

8. Triggers can hide important logic.

9. The logic of an error without RAISE can transform an apparent FAIL into an SUCCESS.

10. % TYPE and% ROWTYPE reduce dependence on manual type definition.
```

---

# 54. Mental Model for PL/SQL in ETL/DWH

For the Data Developer job, imagine PL/SQL as follows:

```
SOURCE
   │
   ▼
STAGING
   │
   ▼
PL/SQL PACKAGE
   │
- validation of data
- Transformations
- Business rules
- Error handling
- Logging
- * Batch control *
   │
   ▼
DWH
   │
- - Dimensions
¶ ¶ facts ¶
```

And for volumes:

```
SQL setbased
      │
− INSERT SELECT
− UPDATE
- MERGE

↓ if not enough

BULK COLLECT + FORALL

↓ if logic requires it

procedural row-by-row
```

This is one of the key ideas to remember.

---

# 55. What to remain

If you have to compress the entire course into a single page, remember:

```
PL/SQL = SQL + procedural programming

Block:
DECLARE
BEGIN
EXCEPTION
END;

Data:
% TYPE
% ROWTYPE
SELECT INTO

Flow:
IF
CASE
FOR
WHILE
LOOP

Date of processing:
default cursor
explicit cursor
Parametrized cursor

Modulation:
procedure
function
package

Errors:
EXCEPTION
SQLCODE
SQLERRM
RAISE
RAISE_APPLICATION_ERROR
FORMAT_ERROR_STACK
FORMAT_ERROR_BACKTRACE

Performance:
SET-BASED FIRST
BULK COLLECT
FORALL
LIMIT

Dynamic:
EXECUTE IMMEDIATE
bind variables

Database events:
triggers
: OLD
: NEW

Transactions:
COMMIT
ROLLBACK
SAVEPOINT
```

And the principle that links them all:

**SQL set-based first → bulk PL/SQL if necessary → row-by-row only when logic really demands it.**

The next natural step for the course would be to take **PL/SQL advanced / expert** separately and to deepen the things that most likely appear at the technical discussion: **cursors and bulk processing, packages, exception / error stack, translations, dynamic SQL and a complete example of ETL DWH pack with login and batch control**.

---

## Questions and answers

### How would you briefly explain PL / SQL fundamentally until advanced to a colleague who knows SQL, but not this area?

PL / SQL covers anonymous blocks, variables, records and control flow, procedures, functions, packages and scopes, explicit and implicitly cursors. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to PL / SQL?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For PL / SQL, I explicitly follow anonymous blocks, variables, records and control flow, procedures, functions, packages and scopes, explicit and implicitly cursors and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, PL / SQL fundamentally until advanced occurs along with logging, auditing, reconciliation and impact analysis.
