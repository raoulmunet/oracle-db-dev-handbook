---
title: 'C17. Database Objects'
description: 'Complete English handbook chapter based on the original C17 course.'
sidebar_position: 17
---

# C17. Database Objects

<div className="chapter-kicker">Chapter C17 · Complete course</div>

## 1. What is a Database Object?

In Oracle, a **database object** is a structure created and stored in the database, normally belonging to a **schema**.

Examples:

```
HR.EMPLOYEES
HR.DEPARTMENTS
DEV_LAB.LOAD_CUSTOMER
DWH.FACT_SALES
```

Where:

```
HR = schema / owner
EMPLOYEES = object
```

A schema is the collection of objects owned by a user:

```
SCHEMA HR
│
− TABLE EMPLOYEES
− TABLE DEPARTMENTS
− VIEW EMP_DETAILS_V
− INDEX EMP_PK
− SEQUENCE EMP_SEQ
− PROCEDURE LOAD_EMPLOYEE
− PACKAGE PKG_EMPLOYEE
```

In Oracle, the concepts of **user** and **schema** are closely linked: a user's schema normally has the same name as the user.

---

## 2. Main Database Objects

For an Oracle Data Developer, the most important are:

* * *
| | | | |
* * * * * * * *
The INDEX accelerates access to data
The PACKAGE group procedures, functions and other elements
The TRIGGER automatically executes the code at certain events
The DATABASE LINK allows access to another Oracle base

---

## 3. TABLE

TABLE is the fundamental object of data storage.

```
CREATE TABLE customers (
customer_id NUMBER,
VARCHAR2 (100) name,
email VARCHAR2 (200),
created_at DATE
);
```

Oracle creates information in Data Dictionary about structure, columns and properties.

We can see the table:

```
SELECT *
FROM user_tables
WHERE table_name = 'CUSTOMERS';
```

Column:

```
SELECT column_name,
data_type,
data_length,
nullable
FROM user_tab_columns
WHERE table_name = 'CUSTOMERS';
```

---

## 4.CONSTRAINTS

Constraints protect the integrity of **data.

The main types are:

```
PRIMARY KEY
FOREIGN KEY
UNIQUE
NOT NULL
CHECK
```

Example:

```
CREATE TABLE departments (
department_id NUMBER
CONSTRAINT pk_departments PRIMARY KEY,

department_name VARCHAR2 (100)
CONSTRAINT uq_departments_name UNIQUE
);
```

and:

```
CREATE TABLE employment (
employee_id NUMBER
CONSTRAINT pk_employees PRIMARY KEY,

department_id NUMBER,

salary NUMBER
CONSTRAINT chk_employee_salary
CHECK (salary >= 0),

CONSTRAINT fk_emp_department
FOREIGN KEY (department_id)
REFERENCES departments (department_id)
);
```

In a DWH/ETL system, constraints can detect problems such as:

```
duplicate business key
orphan foreign key
NULL in mandatory field
value outside the allowed range
```

---

## 5.INDEX

The index is a separate structure that allows Oracle to find the rows faster.

```
CREATE INDEX idx_emp_department
ON employment (department_id);
```

The Oracle can then execute:

```
INDERANGE SCAN
```

for:

```
TABLE ACCESS FULL
```

Important:

> The index is an object data separate from the table.

Can be deleted without deleting the table:

```
DROP INDEX idx_emp_department;
```

The data remains intact.

---

## 6. VIEW

An VIEW represents a saved SQL query.

```
CREATE VIEW active_customers_v AS
SELECT customer_id,
name,
email
FROM customers
WHERE status = 'ACTIVE';
```

Use:

```
SELECT *
FROM active_customers_v;
```

The normal **View does not store the result of the** query.

Conceptual:

```
VIEW
   ↓
SELECT...
   ↓
TABLES
```

It is commonly used for:

- structure abstraction;
- security;
- simplification of queries;
- the exposure of a stable logical model to applications.

---

## 7. MATERIALIZED VIEW

The materialized View physically stores the result of the query.

```
CREATE MATERIALIZED VIEW mv_daily_sales
BUILD IMMEDIATE
REFRESH COMPLETE
ON DEMAND
AS
SELECT sale_date,
SUM (amount) total_amount
FROM fact_sales
GROUP BY sale_date;
```

Essential difference:

```
VIEW
→ perform the query on access

MATERIALIZED VIEW
→ The result is stored
```

Materialized Views are important for:

```
DWH
OLAP
reporting
query acceleration
pre-aggregations
```

This is the subject treated in detail in **module 16**.

---

## 8.SEQUENCE

Sequence generates numerical values.

```
CREATE SEQUENCE seq_customer
START WITH 1
INCREMENT BY 1;
```

Use:

```
SELECT seq_customer.NEXTVAL
FROM dual;
```

or:

```
INSERT INTO customers (
customer_id,
name
)
VALUES (
seq_customer.NEXTVAL,
'ABC'
);
```

Last value obtained in session:

```
SELECT seq_customer.CURRVAL
FROM dual;
```

Important:

**sequencer does not guarantee consecutive numbers without** goals.

For example:

```
100
101
104
105
```

It's perfectly normal.

There may be gaps due to:

- rollbacks;
- caching;
- concurrency;
- The restarts.

---

## 9. IDENTITY COLUMN

In modern versions of Oracle we can also use:

```
CREATE TABLE customers (
customer_id NUMBER
GENERATED ALWAYS AS IDENTITY,

VARCHAR2 (100)
);
```

At insert:

```
INSERT INTO customers (name)
VALUES ('Oracle');
```

Oracle automatically generates ID-.

Conceptually, identity uses mechanisms similar to a sequence.

---

## 10. SYNONYM

A synonym is an alias for an object.

Suppose:

```
DWH.DIM_CUSTOMER
```

We can create:

```
CREATE TABLE dim_customer
FOR dwh.dim_customer;
```

and then:

```
SELECT *
FROM dim_customer;
```

for:

```
SELECT *
FROM dwh.dim_customer;
```

There are two important types:

```
PRIVATE SYNONYM
PUBLIC SYNONYM
```

Private:

```
CREATE SYNONYM emp
FOR hr employees;
```

Public:

```
CREATE PUBLIC SYNONYM emp
FOR hr employees;
```

Public synonym can be seen by all users, but:

> The synonym does not grant privileges.

The user shall continue to have:

```
GRANT SELECT ON hr.employees TO user1;
```

---

## 11. PROCEDURE

Procedure is a reusable PL/SQL object.

```
CREATE OR REPLACE PROCEDURE load_customer (
p_name VARCHAR2
)
IS
BEGIN

INSERT INTO customers (
customer_id,
name
)
VALUES (
seq_customer.NEXTVAL,
p_name
);

END;
/
```

Execution:

```
BEGIN
load_customer ('ABC');
END;
/
```

The procedures are extremely important in ETL.

Example:

```
PKG_ETL.LOAD_STAGE
PKG_ETL.LOAD_DIMENSION
PKG_ETL.LOAD_FACT
```

---

## 12.FUNCTION

The function looks like procedure, but it returns a value.

```
CREATE OR REPLACE FUNCTION calculate_tax (
p_amount NUMBER
)
RETURN NUMBER
IS
BEGIN

RETURN p_amount * 0.19;

END;
/
```

Use:

```
SELECT calculate_tax (1000)
FROM dual;
```

Result:

```
190
```

---

## 13. PACKAGE

Package is one of the most important PL/SQL objects.

Group:

```
procedus
function
variables
constants
Types
cursors
exceptions
```

One pack has two components:

```
PACKAGE SPECIFICATION
PACKAGE BODY
```

Example:

```
CREATE OR REPLACE PACKAGE pkg_customer AS

PROCEDURE load_customer (
p_name VARCHAR2
);

FUNCTION customer_exists (
p_customer_id NUMBER
) RETURN BOOLEAN;

END pkg_customer;
/
```

Body:

```
CREATE OR REPLACE PACKAGE BODY pkg_customer AS

PROCEDURE load_customer (
p_name VARCHAR2
)
IS
BEGIN

INSERT INTO customers (
customer_id,
name
)
VALUES (
seq_customer.NEXTVAL,
p_name
);

END;

FUNCTION customer_exists (
p_customer_id NUMBER
)
RETURN BOOLEAN
IS
v_count NUMBER;
BEGIN

SELECT COUNT(*)
INTO v_count
FROM customers
WHERE customer_id = p_customer_id;

RETURN v_count;

END;

END pkg_customer;
/
```

In real applications it is preferable to:

```
PKG_CUSTOMER
PKG_ORDER
PKG_PAYMENT
PKG_ETL_CUSTOMER
PKG_DWH_LOAD
```

instead of a large number of independent proceedings.

---

## 14. TRIGGER

Trigger automatically runs the code when an event occurs.

For example:

```
CREATE OR REPLACE TRIGGER trg_customer_audit
AFTER INSERT ON custom
FOR EACH ROW
BEGIN

INSERT INTO customer_audit (
customer_id,
operation_date
)
VALUES (
NEW.customer_id,
SYSDATE
);

END;
/
```

The Trigger is automatically executed:

```
INSERT customers
       ↓
trigger
       ↓
INSERT customer_audit
```

There are triggers:

```
BEFORE INSERT
AFTER INSERT

BEFORE UPDATE
AFTER UPDATE

BEFORE DELETE
AFTER DELETE
```

but also:

```
DDL triggers
database trigger
logon triggers
```

In complex systems they should be used carefully as they can introduce implicitly executed logic and more difficult to see.

---

## 15. DATABASE LINK

Database Link allows access to another Oracle base.

Conceptual example:

```
SELECT *
FROM customers @ CRM_DB;
```

Here:

```
Customers
    ↓
CRM_DB
```

is on another Oracle base.

Database Links are often used in:

```
ETL
date of migration
Legacy integration
distributed systems
```

For example:

```
INSERT INTO staging_customer
SELECT *
FROM crm.customer @ crm_prod;
```

---

## 16. DIRECTORY

DIRECTORY is an Oracle object that represents a filesystem director.

Example:

```
CREATE DIRECTORY data_dir
AS '/data/import';
```

Privileges

```
GRANT READ, WRITE
ON DIRECTORY data_dir
TO dev_lab;
```

It can be used by:

```
UTL_FILE
Pump Date
External Tables
```

---

## 17. EXTERNAL TABLE

External Table allows you to access a file as if it were a table.

Conceptual:

```
CSV FILE
   ↓
EXTERNAL TABLE
   ↓
SELECT
```

For example:

```
SELECT *
FROM external_transactions;
```

although data may exist in:

```
Transactions.csv
```

It is very useful in ETL processes.

---

## 18. TYPE

Oracle allows the creation of its own types.

Example:

```
CREATE TYPE address_type AS OBJECT (
VARCHAR2 street (100),
city VARCHAR2 (100)
);
/
```

We can also create collections:

```
CREATE TYPE number_list AS TABLE OF NUMBER;
/
```

They are useful in PL/SQL and in certain objective-relational models.

---

## 19. Schema and Object Ownership

If the user:

```
HR
```

create:

```
CREATE TABLE employment (...);
```

the object is:

```
HR.EMPLOYEES
```

Another user can access the table only after receiving the necessary privileges:

```
GRANT SELECT
ON hr employees
TO dev_lab;
```

Then:

```
SELECT *
FROM hr employees;
```

---

## 20. Object Naming

The Oracle is implicitly normalizing the name to the uppercase.

If we write:

```
CREATE TABLE custodian (...);
```

Date Dictionary contains:

```
CUSTOMER
```

Therefore:

```
SELECT *
FROM user_tables
WHERE table_name = 'CUSTOMER';
```

It works.

No:

```
WHERE table_name = 'customer';
```

---

## 21. Quoted Identifiers

It is possible:

```
CREATE TABLE
| CustomerId | NUMBER
);
```

But then it has to be written permanently:

```
SELECT, CustomerId
FROM;
```

Therefore in most Oracle projects:

> Quoted identifiers are avoided.

Preferably:

```
CUSTOMER
CUSTOMER_ID
SOURCE_SYSTEM_ID
LOAD_DATE
```

---

## 22. USER_OBJECTS

One of the most useful views of Data Dictionary:

```
SELECT object_name,
object_type,
status
FROM user_objects
ORDER BY object_type,
object_name;
```

Example:

```
OBJECT_NAME       OBJECT_TYPE       STATUS
------------       -----------       ------
CUSTOMERS          TABLE             VALID
PKG_CUSTOMER       PACKAGE           VALID
PKG_CUSTOMER       PACKAGE BODY      VALID
SEQ_CUSTOMER       SEQUENCE          VALID
CUSTOMER_V         VIEW              VALID
```

---

## 23. ALL_OBJECTS vs USER_OBJECTS vs DBA_OBJECTS

Pattern very important Oracle:

```
USER_*
ALL_*
DBA_*
```

### USER _OBJECTS

Objects in its own schema:

```
SELECT *
FROM user_objects;
```

### ALL _OBJECTS

Objects accessible to the user:

```
SELECT *
FROM all_objects;
```

### DBA _OBJECTS

All objects in the database:

```
SELECT *
FROM dba_objects;
```

It requires additional privileges.

This pattern appears everywhere:

```
USER_TABLES
ALL_TABLES
DBA_TABLES

USER_INDEXES
ALL_INDEXES
DBA_INDEXES

USER_CONSTRAINTS
ALL_CONSTRAINTS
DBA_CONSTRAINTS
```

---

## 24. VALID and INVALID Objects

Objects PL/SQL and views may have the status:

```
VALID
INVALID
```

Check:

```
SELECT object_name,
object_type,
status
FROM user_objects
WHERE status = 'INVALID';
```

Example:

```
PKG_ETL_CUSTOMER PACKAGE BODY INVALID
```

It can occur if an addict object changes.

---

## 25. Dependencies

Oracle automatically follows the relationships between objects.

For example:

```
TABLE CUSTOMER
      ↑
VIEW
      ↑
PACKAGE
```

You can see addictions:

```
SELECT
type,
referenced_name,
referenced_type
FROM user_dependencies;
```

Example:

```
PKG_REPORT
     ↓
CUSTOMER_V
     ↓
CUSTOMERS
```

If we modify CUSTOMERS, Oracle can invalidate:

```
CUSTOMER_V
PKG_REPORT
```

---

## 26. The Recompitation of Objects

Procedure:

```
ALTER PROCEDURE load_customer COMPILE;
```

Function:

```
ALTER FUNCTION calculate_tax COMPILE;
```

Package:

```
ALTER PACKAGE pkg_customer COMPILE;
```

Package Body:

```
ALTER PACKAGE pkg_customer
COMPILE BODY;
```

View:

```
ALTER VIEW customer_v COMPILE;
```

---

## 27. Compilation errors

After:

```
CREATE OR REPLACE PROCEDURE...
```

We can check:

```
SHOW ERRORS;
```

or:

```
SELECT line,
position,
text
FROM user_errors
WHERE
ORDER BY sequence;
```

For a Data Developer, USER_ERRORS is very useful.

---

## 28. CREATE OR REPLACE

For items such as:

```
VIEW
PROCEDURE
FUNCTION
PACKAGE
TRIGGER
```

we can use:

```
CREATE OR REPLACE
```

Example:

```
CREATE OR REPLACE VIEW customer_v AS
SELECT...
```

This replaces the existing definition.

For the table we cannot do:

```
CREATE OR REPLACE TABLE
```

Instead, we use:

```
ALTER TABLE
```

---

## 29. ALTER

Modification of an existing object:

```
ALTER TABLE Customers
ADD status VARCHAR2 (20);
```

or:

```
ALTER TABLE Customers
ADD CONSTRAINT chk_customer_status
CHECK (
status IN ('ACTIVE', 'INACTIVE')
);
```

---

## 30. DROP

Delete an object:

```
DROP TABLE custom;
```

```
DROP VIEW customer_v;
```

```
DROP SEQUENCE seq_customer;
```

```
DROP PACKAGE pkg_customer;
```

DDL normally produces **by default commit**.

---

## 31. TRUNCATE

```
TRUNCATE TABLE staging_customer;
```

Clear all rows very quickly.

Important difference:

```
DELETE
= DML
= may have WHERE
= can be rollback

TRUNCATE
= DDL
= all rows
= default commit
```

In ETL it is very common:

```
TRUNCATE TABLE stg_customer;

INSERT INTO stg_customer
SELECT...
```

---

## 32. COMMENT

We can document data objects.

```
COMMENT ON TABLE custom
IS 'Master customer table';
```

Column:

```
COMMENT ON COLUMN customers.customer_id
IS 'Surrogate customer identifier';
```

Comments can be seen in:

```
USER_TAB_COMMENTS
USER_COL_COMMENTS
```

Very useful in a large DWH.

---

## 33. Object Privileges

Typical privileges:

```
SELECT
INSERT
UPDATE
DELETE
EXECUTE
REFERENCES
```

Example:

```
GRANT SELECT
ON dwh.fact_sales
TO reporting_user;
```

For package:

```
GRANT EXECUTE
ON pkg_etl
TO etl_user;
```

Withdrawal:

```
REVOKE SELECT
ON dwh.fact_sales
FROM reporting_user;
```

---

## 34. Object Privilege vs. System Privilege

Very important in interviews.

Object privileges:

```
GRANT SELECT
ON hr employees
TO user1;
```

System privileges:

```
GRANT CREATE TABLE
TO user1;
```

Difference:

```
OBJECT PRIVILEGE
    ↓
operation on a concrete object

SYSTEM PRIVILEGE
    ↓
Database/schema-level operation
```

---

## 35. Database Objects in an DWH

An DWH Oracle may have:

```
SOURCE
   ↓
EXTERNAL TABLE / DB LINK
   ↓
STAGING TABLE
   ↓
ETL PACKAGE
   ↓
DIMENSION TABLE
   ↓
FACT TABLE
   ↓
INDEX
   ↓
MATERIALIZED VIEW
   ↓
REPORTING VIEW
```

For example:

```
CRM.CUSTOMER
      │
* DB LINK *
      ▼
STG_CUSTOMER
      │
* PKG_ETL_CUSTOMER
      ▼
DIM_CUSTOMER
      │
− INDEX
      │
      ▼
FACT_SALES
      │
      ▼
MV_MONTHLY_SALES
      │
      ▼
VW_SALES_REPORT
```

This is a very realistic example of cooperation between database objects.

---

## 36. Practically complete example

We create the table:

```
CREATE TABLE dim_product (
product_key NUMBER PRIMARY KEY,
product_code VARCHAR2 (30),
product_name VARCHAR2 (200),
active_flag CHAR (1)
);
```

Sequence:

```
CREATE SEQUENCE seq_product
START WITH 1
INCREMENT BY 1;
```

Index:

```
CREATE INDEX idx_product_code
ON dim_product (product_code);
```

View:

```
CREATE VIEW active_products_v AS
SELECT product_key,
product_code,
product_name
FROM dim_product
WHERE active_flag = 'Y';
```

Procedure:

```
CREATE OR REPLACE PROCEDURE add_product (
p_code VARCHAR2,
p_name VARCHAR2
)
IS
BEGIN

INSERT INTO dim_product (
product_key,
product_code,
product_name,
active_flag
)
VALUES (
seq_product.NEXTVAL,
p_code,
p_name,
'Y'
);

END;
/
```

We have now:

```
DIM_PRODUCT
     │
− PK
− IDX_PRODUCT_CODE
     │
− SEQ_PRODUCT
     │
− ADD_PRODUCT
     │
- ACTIVE_PRODUCTS_V
```

---

## 37. Oracle Exercises 26ai

In the DEV_LAB schema, it creates a small model:

```
PRODUCT
CATEGORY
SALES
```

Then:

1. Create PK and FK.
2. Create sequence for PRODUCT_ID.
3. Create index on PRODUCT_CODE.
4. Create View ACTIVE_PRODUCTS_V.
5. Create ADD_Product Procedures.
6. Create PKG pack.
7. Create synonym for PRODUCT.
8. Add comments to the table and columns.
9. Find all objects using:

```
USER_OBJECTS
```

10. Find all addicts with:

```
USER_DEPENDENCIES
```

11. Identify any INVALID objects.
12. It intentionally creates an error in a package and investigates it using:

```
USER_ERRORS
```

---

## 39. The Real DWH Scenario

You have the pipelineum:

```
SOURCE CRM
      ↓
STG_CUSTOMER
      ↓
DIM_CUSTOMER
      ↓
FACT_TRANSACTION
      ↓
MV_CUSTOMER_MONTHLY
      ↓
REPORT
```

Database objects involved could be:

```
DATABASE LINK
      ↓
STAGING TABLE
      ↓
PACKAGE PKG_LOAD_CUSTOMER
      ↓
DIMENSION TABLE
      ↓
INDEX
      ↓
FACT TABLE
      ↓
MATERIALIZED VIEW
      ↓
REPORTING VIEW
```

If DIM_CUSTOMER changes structure, it shall be checked:

```
views
packages
procedus
materialized views
triggers
```

for possible dependencies and INVALID objects.

Useful controls:

```
SELECT *
FROM user_dependencies
WHERE referenced_name = 'DIM_CUSTOMER';
```

and:

```
SELECT object_name,
object_type,
status
FROM user_objects
WHERE status = 'INVALID';
```

---

## Questions and answers

### 1. What is a date object?

A structure defined and stored in the database, such as backgammon, view, index, sequence or packaging.

---

### 2. What is the difference between a table and a view?

Tables store data.

View stores the definition of query.

---

### 3. View vs Materialized View?

```
VIEW
→ query executed on access

MATERIALIZED VIEW
→ the result of the physically stored query
```

---

### 4. What is a synonym?

Alias for an object date.

They don't grant the Prieleges.

---

### 5. Sequence guarantees gapless numbers?

No.

Rollbacks, caching, and concurrent activity can produce gaps.

---

### 6. USER_OBJECTS vs ALL_OBJECTS?

```
USER_OBJECTS
→ user objects

ALL_OBJECTS
→ Accessible Objects
```

---

### 7. What does INVALID object mean?

An object that can no longer be executed correctly until it is refilled / corrected.

---

### 8. What can invalidate a package?

Modification of an object dependent, for example:

```
tables
view
type
package
```

---

### 9. Object privilege versus system privilege?

```
SELECT ON HR.EMPLOYEES
        ↓
Object privileges

CREATE TABLE
        ↓
system privileges
```

---

### 10. Why are we using packages?

For:

```
encapsulation
modularity
Success
public / private API
maintenance
```

---

The important mental scheme is:

```
DATABASE
   │
- SCHEMA
         │
− TABLE
● COLUMNS
● CONSTRAINTS
► INDEXES
         │
− VIEW
− MATERIALIZED VIEW
− SEQUENCE
− SYNONYM
         │
− PROCEDURE
− FUNCTION
− PACKAGE
− TRIGGER
         │
− TYPE
− DATABASE LINK
- DIRECTORY
```

And for their administration and investigation, it's worth knowing very well:

(date: image / svg + xml)

SQL
```
USER_OBJECTS
USER_TABLES
USER_TAB_COLUMNS
USER_INDEXES
USER_CONSTRAINTS
USER_VIEWS
USER_SEQUENCES
USER_DEPENDENCIES
USER_ERRORS
```

### Key idea

In a real Oracle application, objects do not exist in isolation. They form a **dependency graph**:

```
TABLE
  ↓
VIEW
  ↓
PACKAGE
  ↓
ETL
  ↓
MATERIALIZED VIEW
  ↓
REPORT
```

Therefore, for an **Oracle Data Developer**, it is not enough just to know how to create objects. You also need to understand **ownershipul, privileges, addictions, status VALID/INVALID and the impact of modification of an object on other** objects.

---

### How would you briefly explain Database Objects to a colleague who knows SQL, but not this area?

Database Objects covers tables, views and materialized views, sequences and identity columns, synonyms. In practice, I first determine what data comes in and what result needs to be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Database Objects?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Database Objects, explicitly follow tables, views and materialized views, sequences and identity columns, synonyms and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Database Objects appears together with logging, auditing, reconciliation and impact analysis.
