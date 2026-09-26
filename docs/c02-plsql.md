---
title: 'C02. PL/SQL'
description: 'Complete English handbook chapter based on the original C02 course.'
sidebar_position: 2
---

# C02. PL/SQL

<div className="chapter-kicker">Chapter C02 · Complete course</div>

This chapter provides a concise but comprehensive PL/SQL course focused on real-world Oracle work, ETL/DWH, and Oracle Data Developer scenarios. The central idea is: **PL/SQL = SQL + procedural logic**. SQL is ideally set-based; PL/SQL is useful when you need flow control, error handling, modularization, batch processing, or procedural logic close to the data.

## 2. PL/SQL from Fundamentals to Advanced

## 1. What PL/SQL is

PL/SQL is the Oracle procedural extension for SQL.

SQL says mainly **what data you want**:

```sql
SELECT employee_id,
       salary
FROM employees
WHERE department_id = 50;
```

PL/SQL also lets you define **how** the logic should be executed:

```sql
BEGIN
UPDATE
SET salary = salary * 1.05
WHERE department_id = 50;

DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT; ' employees updated');
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
- functionss;
- packages;
- collections,
- bulk processing;
- dynamic SQL;
- triggers.

A very important principle:

> If a problem can be solved efficiently with a single SQL statement, do not unnecessarily turn it into a PL/SQL loop.

For example:

```sql
UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 50;
```

is almost always preferable to:

```sql
FOR r IN (
    SELECT employee_id
    FROM employees
    WHERE department_id = 50
)
LOOP
    UPDATE employees
    SET salary = salary * 1.10
    WHERE employee_id = r.employee_id;
END LOOP;
```

This is the reason for the expression:

**row-by-row = slow-by-slow**.

---

## 2. Structure of a PL/SQL block

General form:

```sql
DECLARE
-- declarations
BEGIN
-- executable code
EXCEPTION
-- exception handling
END;
/
```

Example:

```sql
DECLARE
    v_salary NUMBER;
BEGIN
    SELECT salary
    INTO v_salary
    FROM employees
    WHERE employee_id = 100;

    DBMS_OUTPUT.PUT_LINE('Salary = ' || v_salary);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Employee not found');
END;
/
```

The three sections are:

```sql
DECLARE -- optional
BEGIN   -- mandatory
EXCEPTION -- optional
END;
```

A block without declarations:

```sql
BEGIN
DBMS_OUTPUT.PUT_LINE('Hello PL/SQL');
END;
/
```

---

## 3. Variables and data types

Simple example:

```sql
DECLARE
    v_name   VARCHAR2(100);
    v_salary NUMBER(10,2);
    v_date   DATE;
    v_active BOOLEAN;
BEGIN
    v_name   := 'John';
    v_salary := 5000;
    v_date   := SYSDATE;
    v_active := TRUE;
END;
/
```

The assignment operator is:

```
:=
```

No:

```
=
```

---

## 4. %TYPE

Very important in real Oracle code.

Instead of:

```
v_salary NUMBER(10.2);
```

you can write:

```sql
v_salary employees.salary%TYPE;
```

The advantage is that the variable inherits the type of column.

If the column definition changes, the PL/SQL variable automatically follows the column type, reducing maintenance.

Example:

```sql
DECLARE
    v_salary employees.salary%TYPE;
BEGIN
    SELECT salary
    INTO v_salary
    FROM employees
    WHERE employee_id = 100;
END;
/
```

This is a highly recommended pattern.

---

## 5. %ROWTYPE

Allows you to define a record variable with the structure of an entire table row.

```sql
DECLARE
    v_emp employees%ROWTYPE;
BEGIN
    SELECT *
    INTO v_emp
    FROM employees
    WHERE employee_id = 100;

    DBMS_OUTPUT.PUT_LINE(v_emp.first_name);
    DBMS_OUTPUT.PUT_LINE(v_emp.salary);
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

## 6. SELECT INTO

In PL/SQL, a `SELECT` that retrieves values into variables uses:

```sql
SELECT...
INTO...
FROM...
```

Example:

```sql
DECLARE
    v_name   employees.last_name%TYPE;
    v_salary employees.salary%TYPE;
BEGIN
    SELECT last_name,
           salary
    INTO v_name,
         v_salary
    FROM employees
    WHERE employee_id = 100;
END;
/
```

`SELECT INTO` expects **exactly one row**.

If it finds no rows:

```
NO_DATA_FOUND
```

If he finds multiple rows:

```
TOO_MANY_ROWS
```

Example:

```sql
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('No employee');

    WHEN TOO_MANY_ROWS THEN
        DBMS_OUTPUT.PUT_LINE('Multiple employees');
```

This is a very common PL/SQL topic.

---

## 7. Control flow - IF

Syntax:

```sql
IF condition THEN
    ...
ELSIF condition THEN
    ...
ELSE
    ...
END IF;
```

Example:

```sql
IF v_salary < 5000 THEN
    v_level := 'LOW';
ELSIF v_salary < 10000 THEN
    v_level := 'MEDIUM';
ELSE
    v_level := 'HIGH';
END IF;
```

---

## 8. CASE

It can be more elegant than a long chain of `ELSIF` branches.

```sql
CASE
    WHEN v_salary < 5000 THEN
        v_level := 'LOW';
    WHEN v_salary < 10000 THEN
        v_level := 'MEDIUM';
    ELSE
        v_level := 'HIGH';
END CASE;
```

Or:

```sql
CASE v_status
    WHEN 'NEW' THEN
        DBMS_OUTPUT.PUT_LINE('New');
    WHEN 'PROCESSED' THEN
        DBMS_OUTPUT.PUT_LINE('Processed');
    WHEN 'ERROR' THEN
        DBMS_OUTPUT.PUT_LINE('Error');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Unknown status');
END CASE;
```

---

## 9. PL/SQL loops

## Basic LOOP

```sql
LOOP
    v_counter := v_counter + 1;
    EXIT WHEN v_counter >= 10;
END LOOP;
```

## WHILE

```sql
WHILE v_counter < 10 LOOP
    v_counter := v_counter + 1;
END LOOP;
```

## FOR

```sql
FOR i IN 1..10 LOOP
    DBMS_OUTPUT.PUT_LINE(i);
END LOOP;
```

Simple and commonly used.

---

## 10. Implicit cursor

Oracle automatically creates an implicit cursor for each executed SQL statement.

After:

```sql
UPDATE employees
SET salary = salary * 1.05
WHERE department_id = 50;
```

you can use:

```
SQL
```

Example:

```
DBMS_OUTPUT.PUT_LINE(
SQL%ROWCOUNT
);
```

Other useful implicit cursor attributes are:

```text
SQL%FOUND
SQL%NOTFOUND
SQL%ROWCOUNT
SQL%ISOPEN
```

---

## 11. Explicit cursor

A cursor represents a query result set that PL/SQL can process row by row.

```sql
DECLARE
    CURSOR c_emp IS
        SELECT employee_id,
               last_name,
               salary
        FROM employees
        WHERE department_id = 50;
BEGIN
    FOR r IN c_emp LOOP
        DBMS_OUTPUT.PUT_LINE(
            r.employee_id || ' ' || r.last_name
        );
    END LOOP;
END;
/
```

The advantage of a cursor `FOR` loop is that Oracle automatically manages:

```
OPEN
FETCH
CLOSE
```

---

## 12. Classic OPEN / FETCH / CLOSE pattern

```sql
OPEN c_emp;

LOOP

FETCH c_emp
INTO v_id, v_name;

EXIT WHEN c_emp%NOTFOUND;

    ...

END LOOP;

CLOSE c_emp;
```

You should understand this mechanism even though a cursor `FOR` loop is usually simpler.

---

## 13. Parameterized cursors

Very useful:

```sql
CURSOR c_emp (p_department_id NUMBER) IS
    SELECT employee_id,
           last_name,
           salary
    FROM employees
    WHERE department_id = p_department_id;
```

Use:

```sql
FOR r IN c_emp (50) LOOP
    ...
END LOOP;
```

This allows the cursor definition to be reused for different parameter values.

---

## 14. Exception handling

Structure:

```sql
BEGIN

    ...

EXCEPTION

WHEN  THEN
        ...

WHEN  THEN
        ...

WHEN  THEN
        ...

END;
/
```

`WHEN OTHERS` means:

> any exception that has not already been handled.

Example:

```sql
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(SQLERRM);
```

In a real system, swallowing an error is usually a bad practice.

This is a dangerous practice:

```sql
WHEN OTHERS THEN
    NULL;
```

Because the error is silently ignored.

---

## 15. SQLCODE and SQLERRM

In an exception handler you can find out:

```
SQLCODE
```

and:

```
SQLERRM
```

Example:

```sql
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Code: ' || SQLCODE);
        DBMS_OUTPUT.PUT_LINE('Message: ' || SQLERRM);
        RAISE;
END;
/
```

Very useful for logging.

In practice, these values should be captured inside the exception handler.

For example:

```sql
EXCEPTION
    WHEN OTHERS THEN
        log_error(
            SQLCODE,
            SQLERRM
        );
        RAISE;
```

---

## 16. RAISE

`RAISE` raises a new exception or re-raises the current exception.

Very important:

```sql
EXCEPTION
    WHEN OTHERS THEN
        log_error(...);
        RAISE;
END;
```

In this case:

1. the error occurs;
2. you record it;
3. `RAISE` propagates the same exception to the caller.

No:

```sql
RAISE;
```

Without re-raising the exception, the procedure may appear to have completed successfully.

This pattern is very important for ETL.

---

## 17. User-defined exceptions

```sql
DECLARE
    e_invalid_salary EXCEPTION;
BEGIN
    IF v_salary < 0 THEN
        RAISE e_invalid_salary;
    END IF;

EXCEPTION
    WHEN e_invalid_salary THEN
        DBMS_OUTPUT.PUT_LINE('Salary cannot be negative');
END;
/
```

---

## 18. RAISE_APPLICATION_ERROR

Allows application code to raise a custom Oracle error.

```sql
RAISE_APPLICATION_ERROR(
-20001,
'Salary cannot be negative'
);
```

The standard range for application-defined errors is:

```
-20,000... -20999
```

Example:

```sql
IF p_amount <= 0 THEN
    RAISE_APPLICATION_ERROR(
        -20001,
        'Amount must be positive'
    );
END IF;
```

Commonly used in applications.

---

## 19. Procedures

A procedure performs an operation.

```sql
CREATE OR REPLACE PROCEDURE increase_salary (
    p_employee_id IN NUMBER,
    p_percent     IN NUMBER
)
IS
BEGIN
    UPDATE employees
    SET salary = salary * (1 + p_percent / 100)
    WHERE employee_id = p_employee_id;
END;
/
```

Call:

```sql
BEGIN
    increase_salary(100, 5);
END;
/
```

---

## 20. IN, OUT, and IN OUT parameters

### IN

Input value.

```sql
p_employee_id IN NUMBER
```

### OUT

The procedure returns a value:

```sql
p_salary OUT NUMBER
```

### IN OUT

Receives and can modify the same variable:

```
p_value IN OUT NUMBER
```

Example:

```sql
CREATE OR REPLACE PROCEDURE get_salary (
    p_employee_id IN  NUMBER,
    p_salary      OUT NUMBER
)
IS
BEGIN
    SELECT salary
    INTO p_salary
    FROM employees
    WHERE employee_id = p_employee_id;
END;
/
```

---

## 21. Functions

A functions returns a value.

```sql
CREATE OR REPLACE FUNCTION get_salary (
    p_employee_id NUMBER
)
RETURN NUMBER
IS
    v_salary employees.salary%TYPE;
BEGIN
    SELECT salary
    INTO v_salary
    FROM employees
    WHERE employee_id = p_employee_id;

    RETURN v_salary;
END;
/
```

Call:

```sql
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

In practice, both procedures and functionss can be much more complex.

---

## 22. Packages

Packages are extremely important in Oracle.

A package groups:

```
procedures
functions
variables
constants
types
cursors
exceptions
```

Structure:

```
PACKAGE SPECIFICATION
PACKAGE BODY
```

---

## 23. Package specification

Public interface:

```sql
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

## 24. Package body

Implementation:

```sql
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
v_salary employees.salary%TYPE;
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

```sql
BEGIN
pkg_employee.increase_salary (100.5);
END;
/
```

---

## 25. Public and private package members

If a procedure occurs only in:

```
PACKAGE BODY
```

but not in the package specification, it is private.

Example:

```sql
CREATE OR REPLACE PACKAGE BODY pkg_employee
IS
    PROCEDURE write_log (...)
    IS
    BEGIN
        ...
    END write_log;
END pkg_employee;
/
```

`write_log` can be used internally by the package body but cannot be called from outside the package.

This is an encapsulation mechanism.

---

## 26. Package state

A package can have global variables:

```sql
CREATE OR REPLACE PACKAGE pkg_session
IS
    g_user_id NUMBER;
END pkg_session;
/
```

The value may remain available for the duration of the Oracle session.

This is called:

**package state**.

It should be used carefully because it introduces session-specific state.

---

## 27. Collections

PL/SQL allows collections.

The three main collection types are:

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

```sql
v_ids(1) := 100;
v_ids(2) := 101;
v_ids(3) := 102;
```

---

## 28. BULK COLLECT

Allows multiple rows to be fetched into PL/SQL collections.

Instead of fetching rows one by one:

```sql
SELECT employee_id
BULK COLLECT INTO v_ids
FROM employees
WHERE department_id = 50;
```

Example:

```sql
DECLARE
    TYPE t_ids IS TABLE OF employees.employee_id%TYPE;
    v_ids t_ids;
BEGIN
    SELECT employee_id
    BULK COLLECT INTO v_ids
    FROM employees
    WHERE department_id = 50;
END;
/
```

Main advantage:

reduces the number of context switches between:

```
PL/SQL engine
;
SQL engine
```

---

## 29. FORALL

`FORALL` executes DML statements in bulk using collection elements.

Example:

```sql
FORALL i IN 1..v_ids.COUNT
    UPDATE employees
    SET salary = salary * 1.05
    WHERE employee_id = v_ids(i);
```

Compared to:

```sql
FOR i IN 1..v_ids.COUNT LOOP
    UPDATE employees
    SET salary = salary * 1.05
    WHERE employee_id = v_ids(i);
END LOOP;
```

`FORALL` is usually much more efficient.

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

Very important in ETL.

---

## 30. Memory considerations with BULK COLLECT

This can be dangerous:

```sql
SELECT *
BULK COLLECT INTO v_data
FROM gigantic_table;
```

Because it attempts to load the entire result set into PGA memory.

For large data sets, batch processing with `LIMIT` is often used:

```sql
FETCH c_data
BULK COLLECT INTO v_data
LIMIT 1000;
```

Conceptual example:

```sql
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

## 31. dynamic SQL

Sometimes the SQL statement is not fully known at compile time.

Example:

```sql
EXECUTE IMMEDIATE
'DELETE FROM staging_transactions';
```

More realistic:

```
v_sql:
* UPDATE employment *
SET salary = salary *: 1
WHERE department_id =: 2

EXECUTE  v_sql
USING 1.05, 50;
```

---

## 32. Bind variables

Prefer:

```sql
WHERE department_id = :1
```

instead of concatenation such as:

```sql
'WHERE department_id = ' || p_department_id
```

Bind variables provide benefits related to:

```
security
parse overhead
cursor reuse
SQL injection
```

Especially with external input, uncontrolled string concatenation is dangerous.

---

## 33. SQL injection

Problem code:

```sql
v_sql := '
    SELECT *
    FROM customers
    WHERE customer_name = ''' || p_name || '''';
```

A maliciously crafted input may alter the intended SQL statement.

Safer:

```sql
v_sql := '
    SELECT *
    FROM customers
    WHERE customer_name = :1';
```

and:

```sql
EXECUTE IMMEDIATE v_sql
USING p_name;
```

---

## 34. dynamic SQL with INTO

Example:

```sql
EXECUTE IMMEDIATE
    'SELECT COUNT(*) FROM ' || v_table_name
INTO v_count;
```

Important remark:

values can be supplied through bind variables.

Object names, such as:

```
tables
columns
```

cannot be bind variables in the same way.

That is why dynamic SQL that constructs object names must validate them very carefully.

---

## 35. Triggers

A trigger is PL/SQL code that executes automatically when a specified database event occurs.

Example:

```sql
CREATE OR REPLACE TRIGGER trg_employee_salary
BEFORE UPDATE OF salary
ON employees
FOR EACH ROW
BEGIN
    IF :NEW.salary < :OLD.salary THEN
        RAISE_APPLICATION_ERROR(
            -20001,
            'Salary cannot decrease'
        );
    END IF;
END;
/
```

---

## 36. :OLD and :NEW

In a row trigger:

```
:OLD
```

represents the old value.

```
:NEW
```

represents the new value.

Example:

```sql
IF :NEW.salary < :OLD.salary THEN
    ...
END IF;
```

---

## 37. BEFORE / AFTER

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

## 38. Row trigger vs. statement trigger

With:

```sql
FOR EACH ROW
```

The trigger runs once for each affected row.

No:

```sql
FOR EACH ROW
```

the trigger runs once for the entire SQL statement.

If:

```sql
UPDATE
SET salary = salary * 1.05;
```

amend 10,000 lines:

row trigger:

```
10,000 executions
```

Statement-level trigger:

```
1 execution
```

The difference is very important.

---

## 39. Triggers: use with care

Triggers can introduce hidden side effects and implicit logic.

For example:

```sql
UPDATE CUSTOMER
```

It looks trivial, but it can start:

```
TRIGGER
   ↓
UPDATE ACCOUNT
   ↓
another TRIGGER
   ↓
INSERT AUDIT
```

For this reason, in many systems explicit logic is preferred in:

```
packages
procedures
ETL
application layer
```

where possible.

---

## 40. Transactions in PL/SQL

The main commands are:

```sql
COMMIT;
ROLLBACK;
SAVEPOINT;
```

Example:

```sql
BEGIN
    UPDATE accounts
    SET balance = balance - 100
    WHERE account_id = 1;

    UPDATE accounts
    SET balance = balance + 100
    WHERE account_id = 2;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

---

## 41. SAVEPOINT

```sql
SAVEPOINT before_step2;
```

Then:

```sql
ROLLBACK TO before_step2;
```

You can roll back only to a defined point in the current transaction.

---

## 42. Who should control COMMIT?

This is an important subject of design.

Imagine:

```
procedure_a
    ↓
procedure_b
    ↓
procedure_c
```

If the procedure_b does:

```sql
COMMIT;
```

then the caller loses the ability to roll back those changes as part of a larger transaction.

Therefore, in many architectures:

> internal procedures often avoid `COMMIT`; transaction control is handled at a higher level.

It's not an absolute rule, but it's a very important practice.

---

## 43. ETL pattern - logging + error propagation

A simplified pattern:

```sql
BEGIN
    INSERT INTO target_table (...)
    SELECT ...
    FROM staging_table;

EXCEPTION
    WHEN OTHERS THEN
        log_error(
            p_process => 'LOAD_CUSTOMERS',
            p_code    => SQLCODE,
            p_message => SQLERRM
        );
        RAISE;
END;
/
```

Flow:

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
ETL framework detects failure
```

This is a much healthier pattern than:

```sql
WHEN OTHERS THEN
    NULL;
```

---

## 44. Error stack

For serious debugging, `SQLERRM` alone is not always sufficient.

Oracle offers:

```
DBMS_UTILITY.FORMAT_ERROR_STACK
```

and:

```
DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
```

Example:

```sql
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(
            DBMS_UTILITY.FORMAT_ERROR_STACK
        );

        DBMS_OUTPUT.PUT_LINE(
            DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
        );

        RAISE;
END;
/
```

`FORMAT_ERROR_BACKTRACE` is particularly useful because it can identify the line where the exception originated.

---

## 45. A good logging pattern

For example:

```sql
EXCEPTION
    WHEN OTHERS THEN
        pkg_log.write_error(
            p_process   => 'LOAD_ACCOUNTS',
            p_sqlcode   => SQLCODE,
            p_sqlerrm   => SQLERRM,
            p_stack     => DBMS_UTILITY.FORMAT_ERROR_STACK,
            p_backtrace =>> DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
        );
        RAISE;
```

For DWH/ETL systems, this is an extremely useful pattern.

---

## 46. Autonomous transaction

There are cases where a logging routine must preserve the log entry even if the main transaction rolls back.

Use:

```sql
PRAGMA AUTONOMOUS_TRANSACTION;
```

Conceptual example:

```sql
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

Autonomous transactions should be used carefully and deliberately.

---

## 47. Complete ETL procedure example

A realistic example:

```sql
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

DBMS_OUTPUT.PUT_LINE(
SQL%ROWCOUNT
);

EXCEPTION

WHEN  THEN

pkg_log.write_error (
p_process => 'LOAD_CUSTOMERS',
p_sqlcode => SQLCODE,
p_sqlerrm => SQLERRM,
p_backtrace =>
DBMS_UTILITY.FORMAT_ERROR_BACKTRACE
);

RAISE;

END;
/
```

Note that insertion is:

```sql
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

This illustrates the difference between:

```
set-based processing
```

and:

```
row-by-row processing
```

---

## 48. Set-based vs. procedural processing

This is one of the most important ideas for an Oracle developer.

### Less efficient

```sql
FOR r IN (
    SELECT *
    FROM staging_customer
)
LOOP
    INSERT INTO customer (...)
    VALUES (...);
END LOOP;
```

### Preferred

```sql
INSERT INTO customer (...)
SELECT ...
FROM staging_customer;
```

If complex procedural logic must be executed for each row, then consider:

```
BULK COLLECT
+
FORALL
```

---

## 49. Correct decision order

A useful Oracle decision process is:

```
1. Can I do everything in one SQL?

↓ no

2. Can I use bulk processing?

↓ no

3. Do I really need row-by-row PL/SQL?
```

Not the other way around.

---

## 50. Procedure vs functions vs package

A simple representation:

```
PACKAGE
│
− FUNCTION
Returns value
│
− PROCEDURE
Performs an operation
│
− TYPES
− CONSTANTS
− VARIABLES
− CURSORS
− PRIVATE HELPERS
```

In mature Oracle projects, much of the PL/SQL logic is organized into packages.

---

## Questions and answers

For an Oracle / Data Developer role, I would consider it mandatory to be able to explain without hesitation:

```
PL/SQL block
DECLARE / BEGIN / EXCEPTION / END

%TYPE
%ROWTYPE

SELECT INTO
NO_DATA_FOUND
TOO_MANY_ROWS

IF / CASE
LOOP / FOR / WHILE

implicit cursor
explicit cursor
parameterized cursor

procedure
functions
package specification
package body
public / private members
package state

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

dynamic SQL
EXECUTE IMMEDIATE
bind variables
SQL injection

triggers
BEFORE / AFTER
row-level / statement-level
:OLD /:NEW
```

---

## Further questions and answers

### What is the difference between procedure and functions?

The functions must return a value through RETURN; the procedure is mainly directed at performing an operation and can return information through OUT parameters.

### What happens if SELECT INTO finds no rows?

```
NO_DATA_FOUND
```

### What if he finds two lines?

```
TOO_MANY_ROWS
```

### What's RAISE doing?

It raises an exception or, inside an exception handler, re-raises the current exception to the caller.

### Why BULK COLLECT?

It reduces the number of context switches between the PL/SQL engine and SQL engine.

### Why FORALL?

It allows bulk execution of DML using collection elements.

### Package specification vs. package body?

Spec:

```
public interface
```

Body:

```
Implementation + private members
```

### Why use bind variables in dynamic SQL?

For security, reuse of the cursor and reduction of parse overhead.

### What problem is there with WHEN OTHERS THEN NULL?

It completely hides the error.

---

## 53. Important traps

Remember in particular these:

```
1. `SELECT INTO` requires exactly one row.

2. WHEN OTHERS THEN NULL is almost always a bad idea.

3. `COMMIT` in low-level procedures can break higher-level transaction control.

4. Cursor + loop for millions of rows can be very slow.

5. SQL set-based should be preferred when possible.

6. BULK COLLECT without LIMIT can consume a lot of memory.

7. dynamic SQL built by unsafe string concatenation can enable SQL injection.

8. Triggers can hide important logic.

9. Handling an error without re-raising it can turn a real failure into an apparent success.

10. `%TYPE` and `%ROWTYPE` reduce dependence on manually duplicated type definitions.
```

---

## 54. Mental model for PL/SQL in ETL/DWH

For the Data Developer job, imagine PL/SQL as follows:

```
SOURCE
  |
  v
STAGING
  |
  v
PL/SQL PACKAGE
  |
  +-- Data validation
  +-- Transformations
  +-- Business rules
  +-- Error handling
  +-- Logging
  +-- Batch control
  |
  v
DWH
  |
  +-- Dimensions
  +-- Facts
```

And for volumes:

```
SQL set-based
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

## 55. What to remember

If you have to compress the entire course into a single page, remember:

```
PL/SQL = SQL + procedural programming

Block:
DECLARE
BEGIN
EXCEPTION
END;

Data:
%TYPE
%ROWTYPE
SELECT INTO

Flow:
IF
CASE
FOR
WHILE
LOOP

Data processing:
implicit cursor
explicit cursor
parameterized cursor

Modularity:
procedure
functions
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
:OLD
:NEW

Transactions:
COMMIT
ROLLBACK
SAVEPOINT
```

And the principle that links them all:

**SQL set-based first → bulk PL/SQL if necessary → row-by-row only when logic really demands it.**

A natural next step would be a separate **advanced / expert PL/SQL** chapter covering deeper cursor and bulk-processing patterns, package design, exception stacks, transactions, dynamic SQL, and a complete ETL/DWH package with logging and batch control.

---

## Questions and answers

### How would you briefly explain PL/SQL from fundamentals to advanced to a colleague who knows SQL?

PL/SQL covers anonymous blocks, variables, records and control flow, procedures, functionss, packages and scopes, explicit and implicit cursors. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are two common practical problems related to PL/SQL?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For PL/SQL, I explicitly follow anonymous blocks, variables, records and control flow, procedures, functions, packages and scopes, explicit and implicit cursors and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare row counts, amounts, and keys with the source or a reference result; I test NULLs, duplicates, boundary conditions, and batch reruns. Only then do I evaluate execution time, resource usage, and SQL execution plans.

### What information did you collect before you modified an existing solution?

I collect functionsal requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a banking flow, PL/SQL is often combined with logging, auditing, reconciliation, transaction control, and impact analysis.

