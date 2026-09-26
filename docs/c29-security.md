---
title: 'C29. Oracle Security'
description: 'Complete English handbook chapter based on the original C29 course.'
sidebar_position: 29
---

# C29. Oracle Security

<div className="chapter-kicker">Chapter C29 · Complete course</div>

## 29. Security in Oracle Database

Security in Oracle Database means control over three fundamental questions:

1. **Who can connect?
2. **What can see or change after connection?**
3. **How can we then demonstrate what he did?**

For an **Oracle Data Developer / PL/SQL Developer / DWH Developer**, you don't have to be DBA security, but you have to understand very well **users, roles, privileges, object privileges, system privileges, schemas, definition / invoker rights, auditing and protection of sensitive data**.

---

## 1. The Oracle Security Model

Simplified:

```
USER
  |
+ -- = Login
  |
+ -- www. SYSTEM PRIVILEGES
  |
+ --
  |      |
# # # # #
  |
+ -- www. OBJECT PRIVILEGES
         |
+ --
+ --
+ --
+ --
+ --
```

Example:

```
ETL_USER
   |
+ -- ROLE_ETL
   |      |
-- SELECT ON STG_CUSTOMER
-- INSERT ON DWH_CUSTOMER
-- EXECUTE ON PKG_ETL_CUSTOMER
   |
+ -- CREATE SESSION
```

The central idea is:

> You only give the privileges he needs for his work.

This is the principle:

```
Principle of Least Privilege
```

---

## 2. User vs. Schema

In Oracle there is a very important relationship:

```
USER - SCHEMA
```

When you create:

```
CREATE USER hr IDENTIFIED BY password;
```

The Oracle creates the practical schema as well:

```
HR
```

Objects created by user:

```
CREATE TABLE employment (...);
```

there will be that:

```
HR.EMPLOYEES
```

Therefore:

```
SELECT *
FROM hr employees;
```

means:

> select EMPLOYEES from the HR schema.

---

## 3. CREATE USER

Example:

```
CREATE USER etl_user
IDENTIFIED BY
```

The user exists, but it still can't connect.

You have to:

```
GRANT CREATE SESSION TO etl_user;
```

Now:

```
ETL_USER
   |
+ -- CREATE SESSION
```

can open an Oracle session.

---

## 4. System Privileges

**System privileges** allows general operations in the database.

Examples:

```
CREATE SESSION
CREATE TABLE
CREATE VIEW
CREATE PROCEDURE
CREATE SEQUENCE
CREATE TRIGGER
CREATE SYNONYM
```

Example:

```
GRANT CREATE SESSION TO etl_user;

GRANT CREATE TABLE TO etl_user;

GRANT CREATE PROCEDURE TO etl_user;
```

These privileges do not say:

> you can modify the X-table

but:

> you can create certain kinds of objects.

---

## 5. Dangerous Privileges

Some privileges are extremely powerful.

Examples:

```
DROP ANY TABLE
SELECT ANY TABLE
ALTER ANY TABLE
EXECUTE ANY PROCEDURE
CREATE ANY PROCEDURE
```

The word:

```
ANY
```

must be treated with care.

For example:

```
GRANT SELECT ANY TABLE TO etl_user;
```

means that the user can read tables in other schemas, subject to the privilege's scope and applicable container rules.

In general, for applications it is better:

```
GRANT SELECT ON hr.employees TO etl_user;
```

than:

```
GRANT SELECT ANY TABLE TO etl_user;
```

---

## 6. Object Privileges

They control access to individual objects.

Examples:

```
SELECT
INSERT
UPDATE
DELETE
REFERENCES
EXECUTE
```

Example:

```
GRANT SELECT ON hr.employees TO reporting_user;
```

Now:

```
SELECT *
FROM hr employees;
```

is allowed for REPORTING_USER.

---

## 7. Different privileges for the same table

You may grant:

```
GRANT SELECT ON hr.employees TO user1;
```

but not:

```
INSERT
UPDATE
DELETE
```

Thus:

```
SELECT *
FROM hr employees;
```

It works.

But:

```
DELETE FROM hr.employees;
```

it produces a miscarriage of privileges.

---

## 8. UPDATE only on certain columns

The Oracle allows even control at column level for certain operations.

Example:

```
GRANT UPDATE (salary)
ON hr.employees
TO payroll_user;
```

Now the user can change:

```
UPDATE hr employees
SET salary = 7000
WHERE employee_id = 100;
```

But not necessarily other columns.

---

## 9. WITH GRANT OPTION

You can allow a user to pass on the privilege.

```
GRANT SELECT
ON hr.employees
TO use1
WITH GRANT OPTION;
```

Now:

```
HR
 |
+ --
        |
+ --
```

USER1 can execute:

```
GRANT SELECT
ON hr.employees
TO user2;
```

This mechanism should be used carefully in enterprised environments.

---

## 10. Revocation of privileges

Syntax:

```
REVOKE SELECT
ON hr.employees
FROM reporting_user;
```

For system privileges:

```
REVOKE SELECT ANY TABLE
FROM etl_user;
```

---

## 11. Roles

Instead of giving 20 privileges to each user, you create a role.

Example:

```
CREATE ROLE role_reporting;
```

Then:

```
GRANT SELECT ON hr.employment
TO role_reporting;

GRANT SELECT ON hr.departments
TO role_reporting;
```

And:

```
GRANT role_reporting
TO report_user;
```

Architecture becomes:

```
REPORT_USER
     |
+ -- ROLE_REPORTING
              |
+ -- SELECT HR.EMPLOYEES
+ -- SELECT HR.DEPARTMENTS
```

It's a lot easier to administer.

---

## 12. Example Enterprise

You can have:

```
ROLE_DWH_READ
ROLE_DWH_WRITE
ROLE_ETL
ROLE_SUPPORT
ROLE_REPORTING
```

For example:

```
ROLE_DWH_READ
   |
+ -- SELECT DIM_CUSTOMER
+ -- SELECT DIM_PRODUCT
+ -- SELECT FACT_SALES
```

and:

```
ROLE_ETL
   |
+ -- SELECT STAGING
+ -- INSERT DWH
+ -- UPDATE DWH
+ -- EXECUTE ETL PACKAGES
```

---

## 13. The roles are not always sufficient in PL/SQL

This is a very important trap.

Suppose:

```
GRANT SELECT ON hr.employment
TO role_reporting;

GRANT role_reporting
TO dev_user;
```

The user may execute directly:

```
SELECT *
FROM hr employees;
```

But in an PL/SQL procedure with the defining rights:

```
CREATE PROCEDURE test_proc AS
v_count NUMBER;
BEGIN

SELECT COUNT(*)
INTO v_count
FROM hr employees;

END;
/
```

Compilation can fail.

Reason:

> The privileges received by the role are not used in the same way to resolve the static privileges of the stored PL/SQL with defined rights.

A direct grant is usually required:

```
GRANT SELECT
ON hr.employees
TO dev_user;
```

That's a very good question of the Oracle technical discussion.

---

## 14. Define Rights

Default, an Oracle procedure runs with the owner's rights.

Example:

```
CREATE OR REPLACE PROCEDURE delete_old_logs AS
BEGIN

DELETE
FROM app_logs
WHERE log_date; SYSDATE - 90;

END;
/
```

If the procedure belongs to:

```
APP_OWNER
```

and:

```
USER1
```

has:

```
GRANT EXECUTE ON delete_old_logs TO user1;
```

then USER1 can execute:

```
EXEC delete_old_logs;
```

not necessarily having:

```
DELETE FROM APP_LOGS
```

The procedure runs the operation using the rights of APP_OWNER.

---

## 15. AUTHID DEFINER

Explain:

```
CREATE OR REPLACE PROCEDURE p1
AUTHID DEFINER
AS
BEGIN
    ...
END;
/
```

That's the default behavior.

Schema:

```
CALLER
   |
   v
PROCEDURE
   |
   v
Privileges of OWNER
```

---

## 16. Invoker Rights

The alternative is:

```
AUTHID CURRENT_USER
```

Example:

```
CREATE OR REPLACE PROCEDURE p1
AUTHID CURRENT_USER
AS
BEGIN

DELETE FROM employment;

END;
/
```

In this case, Oracle checks the rights of the user performing the procedure.

Conceptual:

```
CALLER
   |
   v
PROCEDURE
   |
   v
Privileges of CALLER
```

---

## 17. DEFINER vs CURRENT_USER

Fundamental difference:

Type) Rights used
| | | | |
The AUTHID DEFINER

Practical example.

An administrative framework may use:

```
AUTHID DEFINER
```

to control exactly the available operations.

A generic utility which must comply with calleric permissions may use:

```
AUTHID CURRENT_USER
```

---

## 18. Why stored procedures can increase security

Instead of giving:

```
GRANT UPDATE
ON accounts
TO app_user;
```

you can only give:

```
GRANT EXECUTE
ON pkg_accounts
TO app_user;
```

The package can validate:

```
business rules
security rules
logging
input validation
```

Thus the user cannot perform arbitrarily:

```
UPDATE accounts
SET balance = 1000000;
```

It's just:

```
EXEC pkg_accounts.transfer_money (...);
```

---

## 19. Views as Security Mechanism

You have the board:

```
EMPLOYEES
```

with:

```
EMPLOYEE_ID
NAME
SALARY
BANK_ACCOUNT
SSN
```

You don't want the reporter to see everything.

You can create:

```
CREATE VIEW employees_public AS

SELECT employee_id,
name
FROM employment;
```

Then:

```
GRANT SELECT
ON employees_public
TO reporting_user;
```

The reporter sees:

```
EMPLOYEE_ID
NAME
```

but not:

```
SALARY
BANK_ACCOUNT
SSN
```

---

## 20. Row-Level Security

Sometimes you don't just want to limit the columns.

You want:

> Let the user see only the ranks of his department.

Conceptual:

```
EMPLOYEES
--------------------------------
John SALES
Anna HR
Mike IT
```

The SALES user sees:

```
John SALES
```

HR sees:

```
Anna HR
```

Oracle offers mechanisms such as:

```
VPD
Virtual Private Database
```

based on:

```
DBMS_RLS
```

---

## 21. Virtual Private Database

Conceptual Oracle can automatically transform:

```
SELECT *
FROM transactions;
```

in:

```
SELECT *
FROM transactions
WHERE department_id = 10;
```

Without the app altering the query.

The police are being applied by the database.

This is very useful for:

```
multi-tenant applications
departments
subsidiaries
business units
data segregation
```

---

## 22. SQL Injection

One of the most important security issues for an Oracle developer.

Dangerous code:

```
v_sql: =
*
FROM users
WHERE username = ''
* p_username *
"'''' ';
```

If the user provides malicious input, the SQL can be changed.

---

## 23. Solution: Bind Variables

Safer:

```
v_sql:
*
FROM users
WHERE username =: x

EXECUTE IMMEDIATE v_sql
USING p_username;
```

Advantages:

```
security
+
performance
+
reducing the hard parsing
```

This is one reason bind variables are important in Oracle.

---

## 24. Dynamic SQL and Security

Sometimes bind variables can't replace the names of objects.

Example:

```
v_sql: =
*)
FROM;
```

Here:

```
p_table_name
```

must be validated very carefully.

Oracle offers packages such as:

```
DBMS_ASSERT
```

Example:

```
v_table: =
DBMS_ASSERT.SQL_OBJECT_NAME (p_table_name);
```

Then:

```
EXECUTE IMMEDIATE
'SELECT COUNT(*) FROM ' - v_table
INTO v_count;
```

---

## 25. SQL Injection in an ETL

Imagine a framework ETL in which metadata contains:

```
SOURCE_TABLE
TARGET_TABLE
WHERE_CONDITION
```

A developer builds:

```
v_sql: =
'INSERT INTO '
* target_table *
* ' SELECT * FROM ' *
"source_table ';
```

If the metadata is not controlled, the framework can become a security breach.

It should be checked:

```
metadata
permits
allowed schemas
Allowed objects
Dynamic SQL
```

---

## 26. Passwords

Passwords shall not:

```
hardcoded in packaging
hardcoded in scriptures
written in Git
written in logos
```

Wrong example:

```
v_password: = 'ProdPassword123';
```

In real applications, use is made of:

```
credit stores
wallets
Secret managers
Oracle Wallet
```

---

## 27. Oracle Wallet

The Oracle Wallet can keep your credentials and certificates.

Conceptual:

```
Application
     |
     v
Oracle Wallet
     |
     v
credentials / certificates
```

Thus the password should not appear in:

```
source code
deployment scripts
Configuration plain text
```

---

## 28. Encryption at Rest

Oracle can protect the data on the disk using:

```
TDE
Transparent Data Encryption
```

The data is encrypted in storage.

Conceptual:

```
Oracle
 |
+ -- Tablespace
 |      |
ed date
 |
+ -- Keystore
        |
+ -- encryption keys
```

The application may continue to execute:

```
SELECT *
FROM custodian;
```

without hand-making:

```
decrypt ()
```

---

## 29. Encryption in Transit

Communication shall also be protected:

```
Application
      |
| Encrypted |
      v
Oracle Database
```

By:

```
TLS
TCPS
Oracle Net encryption
```

Otherwise the information may circulate unencrypted between the client and the server database.

---

## 30. Masking Date

In environments DEV or TEST it is not recommended to copy directly all real data.

Example production:

```
John Smith
john.smith @ example.com
RO49AAAA123456789
```

In TEST:

```
User Test 001
test001
RO00TEST000001
```

This is:

```
Date Masking
```

---

## 31. Audit

Audit means:

> who did what and when?

Example:

```
USER | OBJECT
----------------------------------
RAOUL | ACCOUNT
ETL_USER | FACT_SALES
REPORT_USER | CUSTOMER
```

The Oracle provides audit mechanisms such as:

```
Unified Auditing
```

---

## 32. Example of logical audit in the application

In an DWH you can have:

```
ETL_AUDIT
```

with:

```
BATCH_ID
PROCESS_NAME
START_TIME
END_TIME
ROWS_INSERTED
ROWS_UPDATED
STATUS
ERROR_CODE
ERROR_MESSAGE
```

Example:

```
10025
LOAD_CUSTOMER
10: 00 a.m.
10: 04 a.m.
12000
250
SUCCESS
```

But this is:

```
ETL operational audit
```

not the same as the Oracle security audit.

---

## 33. Separation of Duties

In enterprise systems it is not good that one identity can do everything.

Example:

```
DBA
Developer
Security Admin
Application User
Auditor
```

may have different responsibilities.

Example:

```
DEV_USER
```

it should not necessarily have:

```
DROP TABLE
ALTER SYSTEM
CREATE USER
```

---

## 34. Owner vs Runtime User Schema

Very good pattern in Oracle applications:

```
APP_OWNER
APP_RUNTIME
```

APP_OWNER:

```
Owns tables
owns packages
Owns views
```

But the app doesn't connect with it.

The application shall be connected with:

```
APP_RUNTIME
```

which only has:

```
EXECUTE packages
SELECT
```

Thus:

```
Application
     |
     v
APP_RUNTIME
     |
     v
packages / views
     |
     v
APP_OWNER objects
```

This separation reduces the risk.

---

## 35. Security in an DWH

An DWH may have:

```
SOURCE
STAGING
DWH
REPORTING
```

A simplified model:

```
SRC_USER
   |
   v
STG_USER
   |
   v
ETL_USER
   |
   v
DWH_OWNER
   |
   v
REPORT_USER
```

Privileges can be:

```
ETL_USER

SELECT STAGING
INSERT DWH
UPDATE DWH
EXECUTE ETL_PACKAGES
```

and:

```
REPORT_USER

SELECT reporting views
```

without:

```
INSERT
UPDATE
DELETE
```

---

## 36. Complete ETL configuration example

Create user:

```
CREATE USER etl_user
IDENTIFIED BY
```

We allow connection:

```
GRANT CREATE SESSION
TO etl_user;
```

We create a role:

```
CREATE ROLE role_etl;
```

We allow the reading of staging:

```
GRANT SELECT
ON staging.custodian
TO role_etl;
```

We allow DWH to be modified:

```
GRANT INSERT, UPDATE
ON dwh.dim_customer
TO role_etl;
```

We allow the running of the packager:

```
GRANT EXECUTE
ON dwh.pkg_customer_etl
TO role_etl;
```

Then:

```
GRANT role_etl
TO etl_user;
```

---

## 37. Attention to stored procedures

If ETL_USER has to compile its own PL/SQL that access:

```
STAGING.CUSTOMER
```

may need:

```
GRANT SELECT
ON staging.custodian
TO etl_user;
```

directly, not just by:

```
ROLE_ETL
```

This distinction is common in Oracle projects.

---

## 38. Date Dictionary for privileges

For your own privileges:

```
SELECT *
FROM user_sys_privs;
```

Rolls:

```
SELECT *
FROM user_role_privs;
```

Object privileges:

```
SELECT *
FROM user_tab_privs;
```

---

For administrators:

```
SELECT *
FROM dba_sys_privs;
```

```
SELECT *
FROM dba_role_privs;
```

```
SELECT *
FROM dba_tab_privs;
```

---

## 39. Examples of Diagnostic

You have the error:

```
ORA-01031: insufficient privileges
```

First question:

```
What surgery am I trying to do?
```

Then you check:

```
SELECT *
FROM user_sys_privs;
```

and:

```
SELECT *
FROM user_tab_privs;
```

and:

```
SELECT *
FROM user_role_privs;
```

---

## 40. Very relevant example: V$views

Suppose a developer tries:

```
SELECT *
FROM V$session;
```

and receives:

```
insufficient privileges
```

Access may, for example, be granted through the appropriate privilege of the underlying object:

```
GRANT SELECT
ON SYS.V_$SESSION
TO dev_user;
```

So the user can question:

```
SELECT *
FROM V$session;
```

In practice these grants must be granted by a user with sufficient administrative privileges.

---

## 41. PUBLIC

A privilege may be granted:

```
GRANT SELECT
ON some_table
TO PUBLIC;
```

That means:

> all eligible users of the base can benefit from that privilege.

PUBLIC should be used very carefully.

Better:

```
user specific
```

or:

```
roller specific
```

---

## 42. Synonyms and Security

A synonym:

```
CREATE SYNONYM employment
FOR hr employees;
```

does not grant privileges.

Even if you can write:

```
SELECT *
FROM employment;
```

you must continue to have:

```
SELECT * FROM HR.EMPLOYEES
```

Very important:

> A synonym does not grant privileges on the object it names.

---

## 43. View is automatically privileged

If:

```
USER_A
```

create a view that reads:

```
USER_B.TABLE_X
```

appropriate privileges must exist.

It does not assume that the existence of a synonym or view eliminates security checks.

---

## 44. Security and Database Links

An DB link:

```
DB1
 |
* DB LINK *
 v
DB2
```

may contain information about remote authentication.

Example:

```
SELECT *
FROM customers @ remote_db;
```

Security shall be carefully analysed for:

```
credit storage
prizeleges remote
network
ownership
database link visibility
```

---

## 45. Security and Scheduler Jobs

A job can execute automatic code:

```
DBMS_SCHEDULER
```

It has to be understood:

```
who owns the job
What looks has
what procedure is running
what credential uses
```

A ETL job should not receive more rights than it needs.

---

## 46. Security and PL/SQL packages

A package can act as API security.

Example:

```
PKG_ACCOUNT
```

Expose:

```
transfer_money
close_account
get_balance
```

but the tables:

```
ACCOUNT
TRANSACTION
CUSTOMER_BALANCE
```

are not directly accessible to the application.

Schema:

```
Application
     |
     v
PKG_ACCOUNT
     |
     v
Tables
```

This is a very good Oracle pattern.

---

## 47. Anti-pattern

Weak design:

```
APP_USER
   |
+ -- SELECT ANY TABLE
+ -- INSERT ANY TABLE
+ -- UPDATE ANY TABLE
+ -- DELETE ANY TABLE
```

The app basically has very wide access.

---

Better design:

```
APP_USER
   |
+ -- EXECUTE PKG_CUSTOMER
+ -- EXECUTE PKG_ACCOUNT
+ -- SELECT VW_REPORTING
```

---

## 48. Security and Production

In production, the type accounts shall be avoided:

```
shared developer account
```

for example:

```
dev / dev123
```

Used by 20 people.

The main problem:

```
You don't know who did the surgery anymore.
```

Preferably:

```
individual identities
audit
controlled roles
separation privileges
```

---

## 49. What a Data Developer needs to know

For an Oracle Data Developer role it is important to be able to explain:

```
USER vs SCHEMA

SYSTEM PRIVILEGE
vs
OBJECT PRIVILEGE

ROLE

GRANT
REVOKE

AUTHID DEFINER
AUTHID CURRENT_USER

leave privilege

SQL injection

bind variables

DBMS_ASSERT

views for security

VPD

TDE

auditing

Owner vs runtime user schema
```

---

## 52. Scenario ETL

You have a trial:

```
STAGING → DWH
```

ETL user must:

```
SELECT staging
INSERT DWH
UPDATE DWH
EXECUTE ETL packages
```

but not:

```
DROP TABLE
CREATE USER
ALTER SYSTEM
SELECT ANY TABLE
```

This is the direct application of:

```
leave privilege
```

---

## 54. Pattern to remember

for review, think Oracle security in 5 layers:

```
1. Authotisation
        ↓
Who are you?

2. Authorization
        ↓
What are you allowed to do?

3. Access date
        ↓
What tables / columns / rows do you see?

4. Data Protection
        ↓
Encryption / masking

5. Audit
        ↓
Who did what?
```

Or very short:

```
AUTHENTICATE
     ↓
AUTHORIZE
     ↓
LIMIT DATA
     ↓
PROTECT DATA
     ↓
AUDIT
```

---

## 55. Essence for Oracle Data Developer

If you get the question in the technical discussion:

> How would you address security in an Oracle application or in an DWH?

a very good answer would be:

> I would apply the principle of taking privileges and separate the owner schema from runtime users. I would grant access mainly through roles and object privileges, avoiding ANY privileges. For applications I would prefer access through views and PL/SQL packages instead of direct access to tables. I would use the bind variables and validation of the input to prevent SQL injection. For sensitive data I would consider row-level security, masking and encryption, and for traceability I would use auditing. I would also pay attention to the difference between privileges granted directly and through roles, especially in stored PL/SQL.

This is basically the full image of **worth having for module 29 of Security**.

---

## 30. CDB / PDB = Oracle Multitenant

Oracle Multitenant is the architecture by which a single Physical Oracle base, called **CDB, can accommodate several independent logic bases called **PDB, or Pluggable Databases**.

Starting with Oracle Database 21c, Multitenant architecture is the only architecture supported for new Oracle bases; the old model **non-CDB** was depended. The same model is used in Oracle AI Database 26ai. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

In our laboratory Oracle 26ai, the structure is essentially:

```
Oracle Instance: FREE
        |
        v
+-----------------------------+
|                             |
|  +-----------------------+  |
CDB$ROOT
|  +-----------------------+  |
|                             |
|  +-----------------------+  |
PDB$SEED
|  +-----------------------+  |
|                             |
|  +-----------------------+  |
FREEPDB1
|  |                       |  |
HR
DEV_LAB
OE
DWH_ACCOUNT
|  | ...                   |  |
|  +-----------------------+  |
+-----------------------------+
```

## 30.1. The Fundamental Idea

Before Multitenant, if you wanted three independent Oracle bases, you usually had three bases and three sets of associated processes / structures.

Conceptual:

```
Database A -
Database B - *
Database C - *
```

With Multitenant:

```
Oracle Instance
                       |
                       v
CDB: PROD
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
PDB_SALES | PDB_DWH
```

PDB-s share the CDB- infrastructure, but for the application they behave largely as separate bases.

The Oracle describes the PDB-ul as a portable collection of schematics, schematics and non-schematic objects that appear on the application as a separate base. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.2. CDB

**CDB** is the physical Oracle base containing containers.

An CDB shall:

```
CDB
− CDB$ROOT
− PDB$SEED
− Zero or more PDBs created by the user
```

In practice you will have:

```
CDB
− CDB$ROOT
− PDB$SEED
− APP_PDB
− TEST_PDB
- DWH_PDB
```

At operating system level, CDB-ul is the database. Control files and online redo logs are at CDB level and are shared by PDBs. However, each container has its own relevant datafiles / tablespaces. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.3. CDB$ROOT

CDB$ROOT is the main container.

You can check:

```
SHOW CON_NAME;
```

If you're in the root:

```
CON_NAME
------------------------------
CDB$ROOT
```

The Root contains mainly:

- Oracle metadata;
- Common Oracle objects;
- common users,
- information about PDBs;
- CDB-wide common infrastructure.

In general, **does not create the application tables in CDB$ROOT**.

I mean this is not normal practice:

```
ALTER SESSION SET CONTAINER = CDB$ROOT;

CREATE TABLE customers (...);
```

For the application you will work in a PDB.

---

## 30.4. PDB = Plugable Database

PDB- is the container in which it is usually located:

- the users of the application;
- schemas;
- the tables;
- indexes;
- views,
- PL/SQL packages;
- sequences,
- application dates.

Example:

```
FREE
 |
+ -- CDB$ROOT
 |
+ -- PDB$SEED
 |
+ -- FREEPDB1
       |
+ -- HR
+ -- OE
+ -- DEV_LAB
+ -- DWH_ACCOUNT
```

For you, like Data Developer, **FREEPDB1 is the basis in which you will work almost permanently**.

For example:

```
SELECT *
FROM hr employees;
```

Run in PDB-ul FREEPDB1, not in CDB$ROOT, if HR has been installed there.

---

## 30.5. PDB$SEED

PDB$SEED is a PDB specially used as templates for creating other PDBs.

Conceptual:

```
PDB$SEED
    |
| Clone |
    v
NEW_PDB
```

For example:

```
CREATE PLUGGABLE DATABASE DEV_PDB
ADMIN USER pdf
IDENTIFIED BY Passorder 123;
```

Oracle can use the safe to initialize the new PDB.

PDB$SEED is supplied by Oracle and is not intended for use as an application base; normally you do not change it. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.6. Container

The generic term is **container**.

A container may be:

```
CDB$ROOT
PDB$SEED
PDB user
application root
application PDB
```

Each container has an ID.

You can see:

```
SELECT con_id,
name,
open_mode
FROM V$containers;
```

Example:

```
CON_ID | OPEN_MODE
------ ---------- ----------
1 CDB$ROOT READ WRITE
2 PDB$SEED READ ONLY
3 FREEPDB1 READ WRITE
```

Important:

```
CON_ID = 1
```

means as a rule:

```
CDB$ROOT
```

---

## 30.7. How do you check which container you're in?

The simplest command:

```
SHOW CON_NAME;
```

or SQL:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

Example:

```
FREEPDB1
```

You can also check:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_ID')
FROM dual;
```

or:

```
SELECT
FROM V$database;
```

Attention to the difference.

If you run:

```
SELECT
FROM V$database;
```

you can receive:

```
FREE
```

but:

```
SHOW CON_NAME;
```

may show:

```
FREEPDB1
```

It's not contradiction.

It means:

```
Database / CDB = FREE
Container current = FREEPDB1
```

---

## 30.8. CDB_NAME vs PDB_NAME

This is a very important point.

In your lab:

```
CDB = FREE

PDB = FREEPDB1
```

Therefore:

```
FREE
- FREEPDB1
```

There are two different Oracle courts.

You have a instance:

```
Instance FREE
```

which serves its CDB-ul and PDB-s.

---

## 30.9. Change of container

As a user with the necessary rights:

```
ALTER SESSION SET CONTAINER = FREEPDB1;
```

Check:

```
SHOW CON_NAME;
```

result:

```
FREEPDB1
```

Returning:

```
ALTER SESSION SET CONTAINER = CDB$ROOT;
```

---

## 30.10. Listing PDBs

Of root:

```
SHOW PDBS;
```

Example:

```
CON_ID CON_NAME OPEN MODE RESTRICTED
------  ----------  ----------  ----------
2 PDB$SEED READ ONLY NO
3 FREEPDB1 READ WRITE NO
```

SQL version:

```
SELECT
open_mode
FROM V$pdf;
```

Or:

```
SELECT con_id,
name,
open_mode
FROM V$containers;
```

---

## 30.11. States of a PDB

An PDB may be, among other things:

```
MOUNTED
READ ONLY
READ WRITE
```

For example:

```
SELECT
open_mode
FROM V$pdf;
```

can turn:

```
FREEPDB1 | READ WRITE
```

For a normal application this is the mode you want.

---

## 30.12. Opening a PDB

Of root:

```
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;
```

For all PDB-s:

```
ALTER PLUGGABLE DATABASE ALL OPEN;
```

For read-only:

```
ALTER PLUGGABLE DATABASE FREEPDB1
OPEN READ ONLY;
```

Closure:

```
ALTER PLUGGABLE DATABASE FREEPDB1 CLOSE;
```

PDB-s are administered via ALTER PLUGGABLE DATABASE. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.13. Why SAVE STATE is very important

Suppose you open:

```
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;
```

After the base reboot, you may want the PDB- automatically to return to that condition.

You use:

```
ALTER PLUGGABLE DATABASE FREEPDB1
SAVE STATE;
```

You're basically saying Oracle:

```
Remember the state of this PDB.
```

It's very relevant to your lab, where we want:

```
boot VM
   ↓
Oracle Database starts
   ↓
FREEPDB1 automatically becomes READ WRITE
```

Check:

```
SELECT con_name,
States
FROM dba_pdb_saved_states;
```

---

## 30.14. Creating a PDB

A conceptual example:

```
CREATE PLUGGABLE DATABASE dev_pdb
ADMIN USER dev_admin
IDENTIFIED BY
```

You must be connected to the CDB root and have the necessary CREATE PLUGGABLE DATABASE; CDB- must be opened READ WRITE. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

Then:

```
ALTER PLUGGABLE DATABASE dev_pdb OPEN;
```

and:

```
ALTER PLUGGABLE DATABASE dev_pdb SAVE STATE;
```

---

## 30.15. A Great Advantage: PDBs Cloning

An PDB can be cloned.

For example:

```
DEV_PDB
   |
| Clone |
   v
TEST_PDB
```

Conceptual:

```
CREATE PLUGGABLE DATABASE test_pdb
FROM dev_pdb;
```

It is extremely useful for:

```
DEV
TEST
TRAINING
QA
```

You can quickly create a complete copy of a base.

Oracle supports the creation of PDB-s through seed, cloning, plugging, relocation and other Multitenant mechanisms. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.16. Plug / Unplug

That's where the name comes from:

> **Pluggable Database**

One PDB can be logically detached from one CDB and attached to another.

Conceptual:

```
CDB1
 |
+ -- SALES_PDB
```

unplug:

```
SALES_PDB
     |
     v
metadata + datafiles
```

then:

```
CDB2
 |
+ -- SALES_PDB
```

This is one of the great advantages of Multitenant architecture:

```
base portability
```

---

## 30.17. Instance vs CDB vs PDB

This is one of the most important technical discussion concepts.

Do not confuse:

```
Instance
Database
CDB
PDB
Schema
```

Conceptual structure:

```
Oracle Instance
    |
    v
CDB
    |
+ -- CDB$ROOT
    |
+ -- PDB$SEED
    |
+ -- PDB1
          |
+ -- HR schema
          |
+ -- OE schema
```

### Instance

An Oracle instance consists mainly of:

```
memory
+
background processes
```

I mean:

```
SGA
PGA
DBWn
LGWR
CKPT
SMON
PMON
...
```

### CDB

CDB = container database that supports the multitenant architecture.

### PDB

A PDB is a portable database within a CDB.

### Schema

The schema belongs to a user and contains its objects:

```
tables
views
indexes
packages
sequences
...
```

So:

```
HR
```

is not PDB.

It's the HR schema from a PDB:

```
FREE
- FREEPDB1
- HR
```

---

## 30.18 Service Name and PDB

Applications shall not normally be connected to:

```
CDB$ROOT
```

but directly to the service of PDB-.

In the laboratory:

```
HOST:
192.168.56.10

Port:
1521

Service:
FREEPDB1
```

Connection string:

```
192.168.56.10: 1521 / FREEPDB1
```

Example SQL\ * Plus:

```
sqlplus hr / password @ / / 192.168.56.10: 1521 / FREEPDB1
```

DataGrip:

```
Host: 192.168.56.10
Port: 1521
Service: FREEPDB1
User: HR
Password: ****
```

---

## 30.19. Why should not be confused SID with Service

In a Multitenant environment:

```
SID / instance:
FREE

Service:
FREEPDB1
```

So a typical configuration is:

```
Instance:
FREE

PDB:
FREEPDB1

Service:
FREEPDB1
```

This difference explains many problems connecting the Oracle.

---

## 30.20. Local users

A user created in a PDB is usually local **user.

For example:

```
ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE USER app_user
IDENTIFIED BY password;
```

This user exists in:

```
FREEPDB1
```

not automatically and in another PDB.

If we have:

```
PDB_APP
PDB_DWH
```

we can have:

```
APP_USER in PDB_APP
```

without him in:

```
PDB_DWH
```

Moreover, two PDBs can have local users with the same name without conflict. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

## 30.21. Common users

There are also common users throughout CDB.

For example:

```
SYS
SYSTEM
```

are common users predefined.

For common users created manually, the default convention is the prefix:

```
C # #
```

Example:

```
CREATE USER C##MONITOR
IDENTIFIED BY password
CONTAINER = ALL;
```

Oracle uses the parameter by default:

```
COMMON_USER_PREFIX
```

with the C # # prefix. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

For the normal development of applications you will almost always use:

```
local users in PDB
```

not common users.

---

## 30.22. Dictionary date in Multitenant architecture

You have three very useful categories of views:

```
USER_*
ALL_*
DBA_*
```

but the Multitenant also appears:

```
CDB_*
```

Examples:

```
DBA_TABLES
```

show visible objects in the relevant container.

Instead:

```
CDB_TABLES
```

may provide information for several containers when questioned from the root and the user has the necessary rights.

Example:

```
SELECT con_id,
Owner,
table_name
FROM cdb_tables
WHERE owner = 'HR';
```

CON_ID tells you which container the object belongs to.

---

## 30.23. Why CON_ID is important

In many dynamic performance views you will see:

```
CON_ID
```

Example:

```
SELECT con_id,
username,
status
FROM V$session;
```

In an CDB with many PDBs:

```
CON_ID USERNAME
------  --------
3 HR
3 DEV_LAB
4 APP_USER
5 ETL_USER
```

So you can determine what PDB comes from.

You can do the join with:

```
V$containers
```

for example:

```
SELECT
s.status,
c.name AS container_name
FROM V$session
JOIN V$containers c
ON c.con_id = s.con_id
WHERE s.username IS NOT NULL;
```

This is a very good diagnostic interrogation.

---

## 30.24. CDB views vs DBA views

A simplified rule:

```
DBA_* → current container perspective

CDB_* → perspective of several containers
```

For example:

```
SELECT owner,
table_name
FROM dba_tables;
```

versus:

```
SELECT con_id,
Owner,
table_name
FROM cdb_tables;
```

For Data Developer it is enough to remember this idea.

---

## 30.25. Isolation of PDBs

Suppose:

```
CDB_PROD
 |
+ -- CRM_PDB
 |
+ -- HR_PDB
 |
+ -- DWH_PDB
```

From an application perspective:

```
CRM → CRM_PDB
HR → HR_PDB
DWH → DWH_PDB
```

These PDBs have separate objects and data.

You can have:

```
CRM_PDB.CUSTOMERS
```

and:

```
DWH_PDB.CUSTOMERS
```

without being the same table.

---

## 30.26. But infrastructure is common

Isolation does not mean that each PDB has its own instance.

Typically:

```
INSTANCE
                    |
CDB PROD
       +------------+------------+
       |            |            |
CRM_PDB | DWH_PDB
```

PDBs can share resources such as:

```
SGA
background processes
redo infrastructure
control files
```

This is one of the reasons why Multitenant reduces overhead from many completely independent bases.

---

## 30.27. Resource Management

Because PDB-s share resources, Oracle can control their consumption.

For example conceptual:

```
CRM_PDB → 40% CPU
DWH_PDB → 40% CPU
TEST_PDB → 20% CPU
```

It rather enters the DBA area, but you need to know why it exists:

> a query DWH very hard from a PDB must not consume all resources and affect all other applications.

---

## 30.28. Application Containers

There is an additional, more advanced level:

```
CDB
 |
+ -- Application Root
       |
+ -- APP_PDB1
+ -- APP_PDB2
+ -- APP_PDB3
```

Application Container is especially useful for SaaS / multi-tenant architectures.

For example:

```
SALES_APP
 |
+ -- CUSTOMER_A_PDB
+ -- CUSTOMER_B_PDB
+ -- CUSTOMER_C_PDB
```

PDB-s can share metadata and some common objects of the application. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

For an ordinary Data Developer it's enough to know the concept.

---

## 30.29. Example SaaS

Suppose a company offers an ERP SaaS.

It could have:

```
ERP_CDB
 |
+ -- ERP Application Root
       |
+ -- CUSTOMER_ROMANIA
       |
+ -- CUSTOMER_FRANCE
       |
+ -- CUSTOMER_GERMANY
```

The application code may be common and the data of each client may remain separate.

---

## 30.30. Multitenant Benefits

The main advantages are:

- consolidation;
- logical isolation;
- centralized administration;
- rapid cloning;
- rapid provision;
- Patching more efficiently;
- backup / recovery at PDB level;
- moving PDB between CDB-uri;
- separation of averages;
- reduced consumption of resources from many completely independent courts.

Example:

```
for:

DB_DEV
DB_TEST
DB_UAT
DB_REPORTING

each with its own instance

you can have:

CDB_COMPANY
 |
+ -- DEV_PDB
+ -- TEST_PDB
+ -- UAT_PDB
+ -- REPORT_PDB
```

---

## 30.31. An extremely common trap

You connected SQL Developer like:

```
SYSTEM
```

and create:

```
CREATE USER HR IDENTIFIED BY hr;
```

But you get errors, or the user is not where you expect.

The first question must be:

```
SHOW CON_NAME;
```

He can discover:

```
CDB$ROOT
```

Even though you wanted:

```
FREEPDB1
```

Right:

```
ALTER SESSION SET CONTAINER = FREEPDB1;

CREATE USER HR IDENTIFIED BY hr;
```

This verification should become a reflex:

```
SHOW CON_NAME;
```

---

## 30.32. Another very common problem

You created:

```
DEV_LAB
```

in FREEPDB1.

Then you connect using:

```
Service = FREE
```

and you get:

```
ORA-01017
invalid username / password
```

or you don't find the schema.

The problem may be that you got in:

```
CDB$ROOT
```

for:

```
FREEPDB1
```

PDB service must be used:

```
FREEPDB1
```

---

## 30.33. Example of complete diagnosis

When you have an Oracle Multitenant problem:

```
SELECT
FROM V$database;
```

then:

```
SHOW CON_NAME;
```

then:

```
SHOW PDBS;
```

then:

```
SELECT SYS_CONTEXT ('USERENV', 'SERVICE_NAME')
FROM dual;
```

You have this:

```
CDB
current container
PDBs
current service
```

and you can understand exactly where you are.

---

## 30.34. Diagnosis for our laboratory

For Oracle 26ai Free:

```
SELECT
FROM V$database;
```

should indicate CDB-:

```
FREE
```

and:

```
SHOW PDBS;
```

should include something of the form:

```
PDB$SEED
FREEPDB1
```

For work:

```
ALTER SESSION SET CONTAINER = FREEPDB1;
```

and:

```
SHOW CON_NAME;
```

must return:

```
FREEPDB1
```

Then:

```
SELECT
FROM dba_users
ORDER BY username;
```

may show schemas such as:

```
HR
OE
DEV_LAB
...
```

if they were created in that PDB.

---

## 30.35. Privileges and Current Container

A privilege may exist:

```
local
```

or:

```
common
```

For example, if in a PDB you execute:

```
GRANT SELECT ON employees TO analyst;
```

the privilege is relevant to that PDB.

Instead, the common users administration may use:

```
CONTAINER = ALL
```

or:

```
CONTAINER = CURRENT
```

It's an important topic when you investigate:

```
But I gave you the privilege! Why do I still get ORA-01031?
```

The next question is:

> In which container did you grant privilege and in which container does the session run?

---

## 30.36. PDB in an DWH scenario

A realistic example:

```
CDB_BANK
 |
+ -- CORE_PDB
 |
+ -- CRM_PDB
 |
+ -- DWH_PDB
 |
+ -- REPORTING_PDB
```

In DWH_PDB:

```
STG
ODS
DWH
ETL
REPORTING
```

They can be different schemas.

Example:

```
DWH_PDB
 |
+ -- STG
-- STG_TRANSACTIONS
 |
+ -- DWH
-- FACT_TRANSACTIONS
-- DIM_CUSTOMER
 |
+ -- ETL
+ -- PKG_LOAD_CUSTOMERS
+ -- PKG_LOAD_TRANSACTIONS
```

This clarifies a fundamental difference:

```
PDB
```

A PDB may contain many schemas.

---

## 30.37. CDB/PDB and ETL

In real projects you can have:

```
SOURCE_PDB
      |
* * *
      v
DWH_PDB
```

or the source application may be in a completely different server:

```
Oracle OLTP
    |
    v
ETL / ODI
    |
    v
Oracle DWH PDB
```

For ETL you need to know exactly:

```
host
port
service
schema
```

It's not enough to know just the Oracle server.

---

## 30.38. What a Data Developer needs to know about Multitenant

You don't have to be DBA expert, but you have to master it very well:

```
CDB
PDB
CDB$ROOT
PDB$SEED

CON_ID

SHOW CON_NAME
SHOW PDBS

ALTER SESSION SET CONTAINER

service

local user
common user

DBA_* vs CDB_*

PDB OPEN / CLOSE
SAVE STATE
```

And especially the relationship:

```
Instance
   ↓
CDB
   ↓
PDB
   ↓
Schema
   ↓
Objects
```

---

## 30.41. Scenario DWH

We have:

```
BANK_CDB
 |
+ -- CORE_PDB
 |
+ -- DWH_PDB
```

ODI must execute:

```
BEGIN
ETL.PKG_LOAD_TRANSACTIONS.RUN;
END;
/
```

but receives:

```
PLS-00201 identifier must be deported
```

Packaging exists.

Investigation:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

show:

```
CORE_PDB
```

The package exists in:

```
DWH_PDB
```

The problem is not PL/SQL.

The problem is the ODI connection to:

```
wrong service
```

This is a very realistic example of why a Data Developer needs to understand Multitenant.

---

## 30.42. Mental Model to Memorize

Note the following diagram:

```
ORACLE SERVER
                       |
Oracle Instance
                       |
                       v
                 +-----------+
CDB
                 +-----------+
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
CDB$ROOT | FREEPDB1
                                      |
                     +----------------+----------------+
                     |                |                |
                     v                v                v
HR | OE
                     |
                +----+----+
                |         |
EMPLOYEES DEPARTMENTS
```

And the key relationship:

```
INSTANCE
    ↓
CDB
    ↓
PDB
    ↓
SCHEMA
    ↓
OBJECT
```

No:

```
Instance → Schema
```

and neither:

```
PDB = Schema
```

---

## Cheat sheet

```
- What container are they in?
SHOW CON_NAME;

- What PDBs is there?
SHOW PDBS;

-- List of containers
SELECT con_id,
name,
open_mode
FROM V$containers;

-- Change PDB
ALTER SESSION SET CONTAINER = FREEPDB1;

- Back in the root
ALTER SESSION SET CONTAINER = CDB$ROOT;

-- Open PDB
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;

- Close PDB
ALTER PLUGGABLE DATABASE FREEPDB1 CLOSE;

-- Open all PDB-s
ALTER PLUGGABLE DATABASE ALL OPEN;

-- Memorize the state
ALTER PLUGGABLE DATABASE FREEPDB1 SAVE STATE;

- Current service
SELECT SYS_CONTEXT ('USERENV', 'SERVICE_NAME')
FROM dual;

-- Current container
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;

-- Current CON_ID
SELECT SYS_CONTEXT ('USERENV', 'CON_ID')
FROM dual;

- CDB-
SELECT
FROM V$database;
```

## Questions and answers

### 1. What is the difference between system privileges and object privileges?

**System privileges** allows operations at base level:

```
CREATE TABLE
CREATE SESSION
```

Object privileges allow operations on an object:

```
SELECT * FROM HR.EMPLOYEES
```

---

### 2. What is the difference between user and schema?

In Oracle, a schema is the collection of objects associated with a user.

Typically:

```
USER - SCHEMA - OWNER
```

---

### 3. Why do we use roles?

For:

```
centralisation of privileges
Simplification of administration
consistency
```

---

### 4. What does a privilege mean?

The user shall receive:

> only the privileges necessary for his work.

---

### 5. Why can an SELECT received through the role not be sufficient in a procedure?

For stored PL/SQL, certain privileges must be granted directly to the program owner, not just through a role.

---

### 6. Difference between AUTHID DEFINER and CURRENT_USER?

```
DEFINER
→ privileges owner

CURRENT_USER
→ privileges caller
```

---

### 7. How do you avoid SQL injection?

First:

```
bind variables
```

and for dynamic object names:

```
validation
DBMS_ASSERT
whitelisting
```

---

### 8. How do you hide certain columns?

For example by:

```
VIEW
```

which only exhibit the permitted columns.

---

### 9. How do you restrict rows?

By mechanisms such as:

```
VPD / DBMS_RLS
```

---

### 10. What is TDE?

```
Transparent Data Encryption
```

Encrypt the data at storage level.

---

You get the requirement:

> Reporting users need to be able to see sales, but they don't need to change anything and they don't need to see personal data about customers.

A conceptual solution:

```
DWH tables
     |
     v
Reporting views
     |
     v
ROLE_REPORTING
     |
     v
REPORT_USERS
```

View:

```
CREATE VIEW vw_sales_reporting AS
SELECT s.sale_date,
s.product_id,
S. amount,
c.customer_segment
FROM fact_sales
JOIN dim_customer c
ON c.customer_id = s.customer_id;
```

No:

```
customer_name
email
phone
bank_account
```

Then:

```
GRANT SELECT
ON vw_sales_reporting
TO role_reporting;
```

---

The application shall make:

```
UPDATE ACCOUNT
```

But you don't want to give it to him:

```
GRANT UPDATE ON account TO app_user;
```

You create:

```
CREATE OR REPLACE PACKAGE pkg_account AS

PROCEDURE update_status (
p_account_id NUMBER,
p_status VARCHAR2
);

END pkg_account;
/
```

Implementation:

```
CREATE OR REPLACE PACKAGE BODY pkg_account AS

PROCEDURE update_status (
p_account_id NUMBER,
p_status VARCHAR2
)
AS
BEGIN

UPDATE account
SET status = p_status
WHERE account_id = p_account_id;

END;

END pkg_account;
/
```

Then:

```
GRANT EXECUTE
ON pkg_account
TO app_user;
```

User:

```
cannot change ACCOUNT directly
```

but it can do:

```
BEGIN

pkg_account.update_status (
p_account_id equals 100,
p_status = 'BLOCKED'
);

END;
/
```

---

What is a **?**

A Database Container is the base of the multitenant Oracle containing CDB$ROOT, PDB$SEED and one or more PDBs.

---

**2. What is a PDB?**

A Pluggable Database is a portable logic base within an CDB, which contains the application schematics and data and appears as a separate base for applications.

---

**3. What is the difference between CDB and PDB?**

```
CDB → multitenant base infrastructure
PDB → logic basis in which applications run
```

---

**4. What is CDB$ROOT?**

Main container containing metadata and infrastructure common to the entire CDB.

---

**5. What is PDB$SEED?

The Oracle site used to quickly create PDB-s.

---

**6. How do you check what PDB you are in?**

```
SHOW CON_NAME;
```

or:

```
SELECT SYS_CONTEXT ('USERENV', 'CON_NAME')
FROM dual;
```

---

**7. How do you see PDB-?**

```
SHOW PDBS;
```

or:

```
SELECT
open_mode
FROM V$pdf;
```

---

**8. How do you change the container?**

```
ALTER SESSION SET CONTAINER = FREEPDB1;
```

---

**9. Is HR a PDB schema?**

No.

```
PDB
- HR schema
```

---

**10. Each PDB has its own Oracle instance?**

No. More PDBs from an CDB are served by the infrastructure of the CDB instance.

---

**11. What is CON_ID?**

Container ID from Multitenant architecture.

---

**12. What is the difference between local user and common user?**

Local user:

```
exists in a given PDB
```

Common user:

```
may exist in several containers of CDB-
```

---

**13. Why does CDB_* views? *\ *

To be able to see information from several containers, together with CON_ID.

---

**14. Why is SAVE STATE useful?**

For Oracle to retain the opening status of PDB- and restore it after the restart of CDB-.

---

**15. What service should be used by an application?**

Usually the PDB- service, not the CDB robot.

---

**Problem:**

> The app no longer sees the HR user tables, although they exist.

My investigation would start with:

```
SHOW CON_NAME;
```

If the result is:

```
CDB$ROOT
```

but the HR schema is in:

```
FREEPDB1
```

then the application is connected to the wrong container.

I'm checking:

```
SELECT SYS_CONTEXT ('USERENV', 'SERVICE_NAME')
FROM dual;
```

and connection configuration.

Right:

```
Host = date-host
Port = 1521
Service = FREEPDB1
```

No:

```
Service = FREE
```

if it directs the connection to the root.

**The important idea of the technical discussion:** before I assume that the tables or privileges are missing, I always check the **container and the current** service.

---

If you have to remember only six things from the whole module:

```
1. CDB = base Oracle multitenant.

2. PDB = the logical basis for applications and data.

3. CDB$ROOT = common infrastructure.

4. PDB$SEED = templates for PDBs.

5. Instance → CDB → PDB → Schedule → Objects.

6. If there is a strange problem with users, objects or privileges:
immediately check SHOW CON_NAME and SERVICE_NAME.
```

For our laboratory Oracle 26ai, the image that deserves to have it permanently in mind is:

```
Instance / CDB
FREE
  |
+ -- CDB$ROOT
  |
+ -- PDB$SEED
  |
+ -- FREEPDB1 › here we work
       |
+ -- HR
+ -- OE
+ -- DEV_LAB
+ -- DWH_ACCOUNT
```

This distinction explains including many of the problems I've already encountered with the **listener, the FREEPDB1 servant, DataGrip, the installation of schemas and privileges over the $V...**. (date: image / svg + xml; charset = utf-8,% 3cvg% 20heigh% 2212% 20292929,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,

---

### How would you briefly explain Security to a colleague who knows SQL, but not this area?

Security covers users, schemas and authentication, system vs object privileges, roles and direct grants. In practice, first determine what data enters and what result must be obtained, then check implementation, execution plan and effects on flow.

### What are the two most common practical issues related to Security?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Security, I explicitly follow users, schemas and authentication, system vs object privileges, roles and direct grants and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Security appears together with logging, auditing, reconciliation and impact analysis.
