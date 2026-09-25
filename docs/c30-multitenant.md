---
title: 'C30. Oracle Multitenant'
description: 'Complete English handbook chapter based on the original C30 course.'
sidebar_position: 30
---

# C30. Oracle Multitenant

<div className="chapter-kicker">Chapter C30 · Complete course</div>

Oracle Multitenant is the architecture by which a single Physical Oracle base, called **CDB, can accommodate several independent logic bases called **PDB, or Pluggable Databases**.

Starting with Oracle Database 21c, Multitenant architecture is the only architecture supported for new Oracle bases; the old **non-CDB** model was depended. The same model is used in Oracle AI Database 26ai.

In our laboratory Oracle 26ai, the structure is essentially:

```
Oracle Instant: FREE
        |
        v
+-----------------------------+
= = sync, corrected by elderman = = @ elder _ man
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
Oracle Instant
                       |
                       v
CDB: PROD
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
PDB_SALESQ1QX PDB_DWH
```

PDB-s share the CDB- infrastructure, but for the application they behave largely as separate bases.

Oracle describes PDB-ul as a portable collection of schematics, schematics and non-schematic objects that appear on the application as a separate base.

---

# 30.2. CDB

**CDB** is the physical Oracle base containing containers.

An CDB shall:

```
CDB
− CDB$ROOT
− PDB$SEED
− Zero or more PDB-uri created by the user
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

At operating system level, CDB-ul is the database. Control files and online redo logs are at CDB level and are shared by PDB-uri. However, each container has its own relevant datafiles / tablespaces.

---

# 30.3. CDB$ROOT

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
- information about PDB-uri;
- CDB- Joint Infrastructure.

In general, **does not create the application tables in CDB$ROOT**.

I mean this is not normal practice:

```
ALTER SESSION SET CONTAINER = CDB$ROOT;

CREATE TABLE customers (...);
```

For the application you will work in an PDB.

---

# 30.4. PDB = Plugable Database

PDB- is the container in which it is usually located:

- the users of the application;
- schemes;
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

# 30.5. PDB$SEED

PDB$SEED is an PDB specially used as templates for creating other PDB-uri.

Conceptual:

```
PDB$SEED
    |
♪ Clane ♪
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

PDB$SEED is supplied by Oracle and is not intended to be used as an application base; normally you do not change it.

---

# 30.6. Container

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
FROM v $containers;
```

Example:

```
CON_IDQ1QX OPEN_MODE
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

# 30.7. How do you check which container you're in?

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
FROM v $database;
```

Attention to the difference.

If you run:

```
SELECT
FROM v $database;
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

# 30.8. CDB\ _ NAME vs PDB\ _ NAME

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

You have a court:

```
Instant FREE
```

which serves its CDB-ul and PDB-s.

---

# 30.9. Change of container

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

# 30.10. Listing PDB-uri

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
FROM v $pdf;
```

Or:

```
SELECT con_id,
name,
open_mode
FROM v $containers;
```

---

# 30.11. States of an PDB

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
FROM v $pdf;
```

can turn:

```
FREEPDB1Q1QX WRITE
```

For a normal application this is the mode you want.

---

# 30.12. Opening an PDB

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

PDB-s are administered through ALTER PLUGGABLE DATABASE.

---

# 30.13. Why SAVE STATE is very important

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

# 30.14. Creating an PDB

A conceptual example:

```
CREATE PLUGGABLE DATABASE dev_pdb
ADMINQ1QX dev_admin
IDENTIFIED BY
```

You must be connected to the CDB root and have the necessary privileges CREATE PLUGGABLE DATABASE; CDB- must be opened READ WRITE.

Then:

```
ALTER PLUGGABLE DATABASE dev_pdb OPEN;
```

and:

```
ALTER PLUGGABLE DATABASE dev_pdb SAVE STATE;
```

---

# 30.15. A Great Advantage: PDB-uri Cloning

An PDB can be cloned.

For example:

```
DEV_PDB
   |
♪ Clane ♪
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

Oracle supports the creation of PDB-s through seed, cloning, plugging, relocation and other Multitenant mechanisms.

---

# 30.16. Plug / Unplug

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

# 30.17. Instant vs CDB vs PDB

This is one of the most important technical discussion concepts.

Do not confuse:

```
Instant
Database
CDB
PDB
Scheme
```

Conceptual structure:

```
Oracle Instant
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
+ -- HR scheme
          |
+ -- OE scheme
```

### Instant

Position = mainly:

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

CDB = multitenant base.

### PDB

PDB = logic base plugin.

### Scheme

The scheme belongs to a user and contains its objects:

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

It's the HR scheme from an PDB:

```
FREE
- FREEPDB1
- HR
```

---

# 30.18 Service Name and PDB

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

# 30.19. Why should not be confused SID with Service

In a Multitenant environment:

```
SID / instance:
FREE

Service:
FREEPDB1
```

So a typical configuration is:

```
Instant:
FREE

PDB:
FREEPDB1

Service:
FREEPDB1
```

This difference explains many problems connecting the Oracle.

---

# 30.20. Local users

A user created in an PDB is usually local **user.

For example:

```
ALTER SESSION SET CONTAINER = FREEPDB1;

CREATEQ1QX app_user
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

Furthermore, two PDB-uri can have local users with the same name without conflict.

---

# 30.21. Common users

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
CREATEQ1QX C##MONITOR
IDENTIFIED BY password
CONTAINER = ALL;
```

Oracle uses the parameter by default:

```
COMMON_USER_PREFIX
```

with the prefix C # #.

For the normal development of applications you will almost always use:

```
local users in PDB
```

not common users.

---

# 30.22. Dictionary date in Multitenant architecture

You have three very useful categories of views:

```
USER_ *
ALL_ *
DBA_ *
```

but the Multitenant also appears:

```
CDB_ *
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

CON\ _ ID tells you which container the object belongs to.

---

# 30.23. Why CON\ _ ID is important

In many dynamic performance views you will see:

```
CON_ID
```

Example:

```
SELECT con_id,
username,
stasis
FROM v $session;
```

In an CDB with many PDB-uri:

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
v $containers
```

for example:

```
SELECT
s.status,
c.name AS container_name
FROM v $session
JOIN v $containers c
ON c.con_id = s.con_id
WHERE s.username IS NOT NULL;
```

This is a very good diagnostic interrogation.

---

# 30.24. CDB views vs DBA views

A simplified rule:

```
DBA_ * → current container perspective

CDB_ * → perspective of several containers
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

# 30.25. Isolation of PDB-uri

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

These PDB-uri have separate objects and data.

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

# 30.26. But infrastructure is common

Isolation does not mean that each PDB has its own court.

Typically:

```
INSTANCE
                    |
CDB PROD
       +------------+------------+
       |            |            |
CRM_PDBQ1QX DWH_PDB
```

PDB-uri can share resources such as:

```
SGA
background processes
redo infrastructure
control files
```

This is one of the reasons why Multitenant reduces overhead from many completely independent bases.

---

# 30.27. Resource Management

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

# 30.28. Application Containers

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

PDB-uri can share metadata and some common objects of the application.

For an ordinary Data Developer it's enough to know the concept.

---

# 30.29. Example SaaS

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

# 30.30. Multitenant Benefits

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

each with its own court

you can have:

CDB_COMPANY
 |
+ -- DEV_PDB
+ -- TEST_PDB
+ -- UAT_PDB
+ -- REPORT_PDB
```

---

# 30.31. An extremely common trap

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

# 30.32. Another very common problem

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

or you don't find the scheme.

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

# 30.33. Example of complete diagnosis

When you have an Oracle Multitenant problem:

```
SELECT
FROM v $database;
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
PDB-uri
current service
```

and you can understand exactly where you are.

---

# 30.34. Diagnosis for our laboratory

For Oracle 26ai Free:

```
SELECT
FROM v $database;
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

may show schemes such as:

```
HR
OE
DEV_LAB
...
```

if they were created in that PDB.

---

# 30.35. Privileges and Current Container

A privilege may exist:

```
local
```

or:

```
common
```

For example, if in an PDB you execute:

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

# 30.36. PDB in an DWH scenario

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

In DWH\ _ PDB:

```
STG
ODS
DWH
ETL
REPORTING
```

They can be different schemes.

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

A PDB may contain many schemes.

---

# 30.37. CDB/PDB and ETL

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
scheme
```

It's not enough to know just the Oracle server.

---

# 30.38. What a Data Developer needs to know about Multitenant

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

DBA_ * vs CDB_ *

PDB OPEN / CLOSE
SAVE STATE
```

And especially the relationship:

```
Instant
   ↓
CDB
   ↓
PDB
   ↓
Scheme
   ↓
Objects
```

---

## Questions and answers

What is a **?**

A Database Container is the base of the multitenant Oracle containing CDB$ROOT, PDB$SEED and one or more PDB-uri.

---

**2. What is an PDB?**

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
FROM v $pdf;
```

---

**8. How do you change the container?**

```
ALTER SESSION SET CONTAINER = FREEPDB1;
```

---

**9. Is HR a PDB scheme?**

No.

```
PDB
- HR schema
```

---

**10. Each PDB has its own Oracle court?**

No. More PDB-uri from an CDB are served by the infrastructure of the CDB court.

---

**11. What is CON\ _ ID?**

Container ID from Multitenant architecture.

---

**12. What is the difference between local user and common user?**

Local user:

```
exists in a certain PDB
```

Common user:

```
may exist in several containers of CDB-
```

---

**13. Why does CDB\ _ * views? *\ *

To be able to see information from several containers, together with CON\ _ ID.

---

**14. Why is SAVE STATE useful?**

For Oracle to retain the opening status of PDB- and restore it after the restart of CDB-.

---

**15. What service should be used by an application?**

Usually the PDB- service, not the CDB robot.

---

## Questions and answers

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

but the HR scheme is in:

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

# 30.41. Scenario DWH

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

# 30.42. Mental Model to Memorize

Note the following diagram:

```
ORACLE SERVER
                       |
Oracle Instant
                       |
                       v
                 +-----------+
CDB
                 +-----------+
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
CDB$ROOTQ1QX FREEPDB1
                                      |
                     +----------------+----------------+
                     |                |                |
                     v                v                v
HRQ1QX OE
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
Instant → Scheme
```

and neither:

```
PDB = Scheme
```

---

## Cheat sheet

```
- What container are they in?
SHOW CON_NAME;

- What PDB-uri is there?
SHOW PDBS;

-- List of containers
SELECT con_id,
name,
open_mode
FROM v $containers;

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

-- CDB-
SELECT
FROM v $database;
```

## Questions and answers

If you have to remember only six things from the whole module:

```
1. CDB = base Oracle multitenant.

2. PDB = the logical basis for applications and data.

3. CDB$ROOT = common infrastructure.

4. PDB$SEED = templates for PDB-uri.

5. Instant → CDB → PDB → Schedule → Objects.

6. If there is a strange problem with users, objects or privileges:
immediately check SHOW CON_NAME and SERVICE_NAME.
```

For our laboratory Oracle 26ai, the image that deserves to have it permanently in mind is:

```
Instant / CDB
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

This distinction explains including many of the problems I've already encountered with **listener, FREEPDB1 serviculum, DataGrip, installation of schemes and privileges on V $...**.

---

## Questions and answers

### How would you briefly explain the CDB / PDB and Oracle Multitenant to a colleague who knows SQL, but not this area?

The CDB / PDB is covered by the Oracle Multitenant covers the CDB root, PDBs and containers, common vs local users, services and connection routing. In practice, I first determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to CDB / PDB and Oracle Multitenant?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For CDB / PDB, the Oracle Multitenant explicitly follows CDB root, PDBs and containers, common vs local users, services and connection routing and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the CDB / PDB, Oracle Multitenant, appears together with logging, auditing, reconciliation and impact analysis.
