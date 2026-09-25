---
title: 'C40. Impact Analysis'
description: 'Complete English handbook chapter based on the original C40 course.'
sidebar_position: 40
---

# C40. Impact Analysis

<div className="chapter-kicker">Chapter C40 · Complete course</div>

**Impact Analysis** means identifying **that will be affected by a change before the change is implemented**.

In Oracle, ETL and DWH, the fundamental question is:

> If I change this object, this column or this rule, what other objects and processes can be affected?

It is one of the most important concepts for an **Oracle Data Developer / DWH Developer / Technical Business Analyst**, because in a real system almost nothing is completely isolated.

The mental model is:

```
CHANGE
  |
  v
DEPENDENCIES
  |
+ --
+ --
+ --
+ --
+ --
+ -- www. MATERIALIZED VIEWS
+ -- = ETL / ODI
+ --
+ - APIS
+ -- www. DOWNSTREAM SYSTEMS
```

---

## 40.1 What Impact Analysis is

Suppose we have:

```
CUSTOMER.STATUS
```

and someone asks:

```
VARCHAR2 (1)
   ↓
VARCHAR2 (20)
```

or change of values:

```
A / I
```

in:

```
ACTIVE / INACTIVE / SUSPENDED
```

Change seems simple.

But CUSTOMER.STATUS can be used by:

```
CUSTOMER
   |
+ --
   |
+ --
   |
+ --
   |
+ --
   |
+ --
   |
+ --
   |
+ --
```

Impact Analysis tries to discover this **graph before the** modification.

---

# 40.2 Main types of impact

You have to think about the impact on multiple levels.

### 1. Structural Impact

Changes such as:

```
ALTER TABLE custodian
MODIFY status VARCHAR2 (20);
```

may affect:

- views,
- materialized views;
- PL/SQL;
- triggers,
- indexes;
- Constraints;
- ETL mappings.

---

### 2. Semantic Impact

Sometimes the structure doesn't change, but the meaning of the data changes.

Example:

```
STATUS = 'A'
```

means:

```
ACTIVE
```

and subsequently appear:

```
ACTIVE
PENDING
BLOCKED
CLOSED
```

Code:

```
WHERE status = 'A'
```

is no longer compatible with the new model.

This is **semantic** impact.

---

### 3. Impact on Data

Change may require:

```
date of migration
data cleanup
backfill
recalculation
historical correction
```

Example:

```
customer_type
```

it shall become binding:

```
ALTER TABLE custodian
MODIFY customer_type NOT NULL;
```

It must be examined whether it already exists:

```
SELECT COUNT *
FROM custodian
WHERE customer_type IS NULL;
```

---

### 4. Functional Impact

Changing a business rule can affect several processes.

Example:

```
Customer Active
```

it was defined as:

```
status = 'ACTIVE'
```

and the new rule is:

```
status = 'ACTIVE'
AND close_date IS NULL
AND blocked_flag = 'N'
```

Impact may occur in:

```
PL/SQL
ETL
reports
dashboards
APIS
batch jobs
reconciliation
```

---

### 5. Performance Impact

A change may be logically correct, but it may affect performance.

Example:

```
WHERE TRUNC (transaction_date) =: p_date
```

Replace:

```
WHERE transaction_date; p_date
AND transaction_date, p_date + 1
```

Existing index on:

```
TRANSACTION_DATE
```

may no longer be used efficiently.

So Impact Analysis must also include:

```
Implementation Plan
Index
Partition pruning
Cardinality
Statistics
Join methods
```

---

# 40.3 Impact Analysis is an addiction graph

The most useful way to think about the problem is like a graph.

Example:

```
SRC_CUSTOMER
      |
      v
STG_CUSTOMER
      |
      v
DWH_CUSTOMER
      |
      v
DIM_CUSTOMER
      |
      +----------+
      |          |
      v          v
FACT_LOAN FACT_ACCOUNT
      |          |
      +----+-----+
           |
           v
REPORTING
```

If you change:

```
SRC_CUSTOMER.CUSTOMER_ID
```

you must follow the impact of **downstream**.

This is very close to the idea of **Data Linage**.

The simplified difference is:

```
Date of Lineage:
Where does the date come from and where does it go?

Impact Analysis:
what will be affected if I change anything?
```

---

# 40.4 Impact upstream vs downstream

There are two important directions.

## Downstream impact

Question:

> What does this object use?

Example:

```
CUSTOMER
   ↓
VIEW
   ↓
PACKAGE
   ↓
ETL
   ↓
REPORT
```

If I change CUSTOMER, you track down.

---

## Upstream impact

Question:

> Where did this information come from?

Example:

```
REPORT_TOTAL_BALANCE
         ↑
FACT_ACCOUNT
         ↑
DWH_ACCOUNT
         ↑
STG_ACCOUNT
         ↑
CORE_BANKING
```

If the report has a problem, Impact Analysis can go backwards to identify the source.

---

# 40.5 Dependency analysis in Oracle

Oracle keeps dependencies between many objects.

Important views:

```
USER_DEPENDENCIES
ALL_DEPENDENCIES
DBA_DEPENDENCIES
```

Example:

```
SELECT
type,
referenced_name,
referenced_type
FROM user_dependencies
ORDER BY name
```

---

# 40.6 Who depends on CUSTOMER?

Example:

```
SELECT
type
FROM user_dependencies
WHERE referenced_name = 'CUSTOMER';
```

Possible result:

```
NAME TYPE
---------------------  ----------------
VW_CUSTOMER_ACTIVE VIEW
PKG_CUSTOMERQ1QX BODY
PRC_CUSTOMER_LOAD PROCEDURE
TRG_CUSTOMER_AUDIT TRIGGER
```

This is the first stage of the technical analysis.

---

# 40.7 Which objects uses a package?

Reverse direction:

```
SELECT referenced_name,
referenced_type
FROM user_dependencies
WHERE name = 'PKG_CUSTOMER';
```

You can get:

```
CUSTOMER TABLE
ACCOUNT TABLE
VW_BALANCE VIEW
```

That way you can build addictive grafts.

---

# 40.8 USER\ _ DEPENDENCIES is not enough

Very important in the technical discussion:

> Oracle dependence metadata does not always identify all real dependencies.

Problem example:

```
EXECUTE IMMEDIATE
'SELECT status FROM customer WHERE customer_id =:1';
```

The table name is in a string.

Dependency tracking may not offer the same visibility as for static SQL.

And more difficult:

```
v_sql:
'SELECT * FROM ';
```

This is one reason why Impact Analysis cannot just mean:

```
SELECT * FROM user_dependencies;
```

---

# 40.9 Search for references in code

For PL/SQL you can use:

```
USER_SOURCE
ALL_SOURCE
DBA_SOURCE
```

Example:

```
SELECT
type,
line,
text
FROM user_source
WHERE UPPER (text) LIKE '%CUSTOMER%'
ORDER BY name, line
```

Or for a column:

```
SELECT
type,
line,
text
FROM user_source
WHERE UPPER (text) LIKE '%CUSTOMER_ID%'
ORDER BY name, line
```

Very useful in Impact Analysis.

---

# 40.10 Attention to false positives

Search:

```
LIKE '%STATUS%'
```

can find:

```
CUSTOMER_STATUS
ACCOUNT_STATUS
PAYMENT_STATUS
STATUS_DATE
```

Therefore, the search in the code is useful, but must be interpreted.

---

# 40.11 Impact on Views

Suppose:

```
CREATE VIEW vw_active_customer AS
SELECT customer_id,
customer_name
FROM custodian
WHERE status = 'A';
```

The business changes the statuses to:

```
ACTIVE
INACTIVE
```

The View must be changed:

```
WHERE status = 'ACTIVE'
```

Otherwise there's not necessarily an Oracle error.

The View may remain:

```
VALID
```

but it produces the wrong results.

This is an extremely important distinction:

```
VALID object
;
correct business logic
```

---

# 40.12 Impact on PL/SQL

Example:

```
IF v_status = 'A' THEN
process_customer;
END IF;
```

If the domain becomes:

```
ACTIVE
INACTIVE
SUSPENDED
```

The code needs to be changed.

Impact Analysis must find:

```
packages
procedus
function
triggers
anonymous jobs
scheduler jobs
```

---

# 40.13 INVALID Objects After Modification

After structural changes check:

```
SELECT object_name,
object_type,
stasis
FROM user_objects
WHERE status = 'INVALID';
```

Example:

```
PKG_CUSTOMER PACKAGE BODY INVALID
VW_CUSTOMERQ1QX INVALID
```

This is an important post-deployment control.

But again:

```
no INVALID objects
```

does not guarantee a lack of functional impact.

---

# 40.14 Compilation errors

For PL/SQL objects:

```
SELECT
type,
line,
position,
text
FROM user_errors
ORDER BY name, sequence
```

Or:

```
SHOW ERRORS;
```

You can recommend:

```
ALTER PACKAGE pkg_customer COMPILE;
```

or:

```
ALTER PACKAGE pkg_customer COMPILE BODY;
```

---

# 40.15 Impact on constraints

Suppose:

```
CUSTOMER.CUSTOMER_ID
```

It changes the guy.

The following shall be identified:

```
PK
FK
UK
CHECK
```

Example:

```
SELECT constraint_name,
constraint_type,
table_name
FROM user_constraints
WHERE table_name = 'CUSTOMER';
```

For columns:

```
SELECT constraint_name,
column_name
FROM user_cons_columns
WHERE table_name = 'CUSTOMER';
```

---

# 40.16 Impact on indexes

For the amended column:

```
SELECT index_name,
column_name,
column_position
FROM user_ind_columns
WHERE table_name = 'CUSTOMER';
```

If you change a column used in:

```
B-tree index
function-based index
Unique index
composite index
```

the impact must be checked.

---

# 40.17 Functional-based indexes

Example:

```
CREATEQ1QX ix_customer_status
ON custodian (UPPER (status));
```

If the logic or type of column changes, this index should be included in Impact Analysis.

---

# 40.18 Impact on materialized views

Example:

```
CUSTOMER
   |
   v
MV_CUSTOMER_SUMMARY
```

It has to be checked:

```
query definition
refresh mode
refresh performance
fast refresh eligibility
refreshs schedule
```

You can inspect:

```
SELECT mview_name,
refresh_mode,
refresh_method
FROM user_mviews;
```

---

# 40.19 Impact on ETL

This is where the analysis becomes critical.

Example:

```
CUSTOMER.STATUS
```

is extracted by:

```
SOURCE
  ↓
STAGING
  ↓
TRANSFORMATION
  ↓
DIM_CUSTOMER
```

If the guy becomes:

```
VARCHAR2 (1)
```

→

```
VARCHAR2 (20)
```

must be checked:

```
source extract
staging data
mapping
transformation
look up
Target datatype
validation rules
reject rules
```

---

# 40.20 Example ETL

We have:

```
INSERT INTO stg_customer (
customer_id,
stasis
)
SELECT
customer_id,
stasis
FROM src_customer;
```

But:

```
SRC_CUSTOMER.STATUS VARCHAR2 (20)
STG_CUSTOMER.STATUS VARCHAR2 (1)
```

The result may be:

```
ORA-12899
```

or data truncated in other ETL technologies.

Impact Analysis must identify this incompatibility before production.

---

# 40.21 Impact on SCD

Suppose:

```
CUSTOMER.STATUS
```

is an SCD Type 2 attribute.

Its change generates:

```
exhale old size row
insert new dimension row
```

Example:

```
CUSTOMER_ID, STATUS, VALID_FROM, VALID_TO
------------------------------------------------
101, ACTIVE, 2025-0101, 2026-09-01
101, BLOCKED, 2026-09-02, 9999-12-31
```

If the status rule changes, it can greatly increase the number of historical versions.

The impact may be:

```
Storage
ETL runtime
fact look up
logical reporting
historical interpretation
```

---

# 40.22 Impact on fact tables

If you change the key to a size:

```
CUSTOMER_ID
```

or:

```
CUSTOMER_SK
```

can affect:

```
FACT_ACCOUNT
FACT_LOAN
FACT_PAYMENT
FACT_TRANSACTION
```

This impact is usually much higher than it appears from the original table.

---

# 40.23 Impact on partitioning

Example:

```
PARTITION BY RANGE (transaction_date)
```

If you change:

```
TRANSACTION_DATE
```

or the rules by which it is populated, verify:

```
partition pruning
partition key
ETL loading
Part maintenance
historical partitions
```

---

# 40.24 Impact on SQL performance

Suppose a column:

```
CUSTOMER_TYPE
```

had:

```
10 distinct values
```

and the new model has:

```
10,000 distinct values
```

Change:

```
cardinality
selectivity
Estimated optimiser
index usefulness
common strategies
```

After significant changes it may be necessary to update the statistics.

Example:

```
BEGIN
DBMS_STATS.GATHER_TABLE_STATS (
Ownname = "USER,"
tablets
);
END;
/
```

---

# 40.25 Impact on APIS

Suppose the API- returns:

```
{
(PHP 4 = 4.1.0)
}
```

and the new value is:

```
{
= = References = =
}
```

Impact may occur in:

```
frontend
middleware
other services
external partners
Validation schemas
API documentation
```

These dependencies do not occur in:

```
USER_DEPENDENCIES
```

---

# 40.26 Impact on reports

A report may contain:

```
CASE
WHEN status = 'A' THEN 'Active'
ELSE 'Inactive'
END
```

If the statuses change, the report can produce wrong results without any SQL error.

The Impact Analysis should therefore include:

```
technical dependencies
+
business logic dependencies
```

---

# 40.27 Impact on Reconciliation

Suppose:

```
SOURCE customers = 1,000,000
DWH customers = 1,000,000
```

After change:

```
SOURCE ACTIVE = 750,000
DWH ACTIVE = 620,000
```

A change of mapping can produce differences.

That's why the deployment should be followed by:

```
row-count reconciliation
amount reconciliation
status distribution
null distribution
business-rule validation
```

---

# 40.28 Impact on Data Quality

A change can cause:

```
New NULL-uri
duplicates
invalid codes
Orphan Records
data on conversion errors
Expected distributions
```

Example:

```
SELECT status,
COUNT *
FROM custodian
GROUP BY status
ORDER BY status;
```

It's a simple check, but very strong.

---

# 40.29 Impact Analysis before vs after change

Ideal:

```
BEFORE CHANGE
    ↓
Impact Analysis
    ↓
Implementation
    ↓
Testing
    ↓
Deployment
    ↓
Validation
```

No:

```
CHANGE
  ↓
PRODUCTION ERROR
  ↓
Impact Analysis
```

---

# 40.30 Practical Impact Analysis Workflow

A very good workflow is:

```
1. Understand the change
        ↓
2. Identify modified object
        ↓
3. Identify Direct Dependent
        ↓
4. Identify Indirect Dependents
        ↓
5. Search for uses in code
        ↓
6. Analyze ETL / DWH
        ↓
7. Analyze business logic
        ↓
8. Analyze Performance
        ↓
9. Define tests
        ↓
10. Validate after deployment
```

---

# 40.31 Complete example

Requirement:

> Column ACCOUNT.STATUS should be extended from two values to four values.

Today:

```
A = Assets
C = Closed
```

New:

```
ACTIVE
CLOSED
BLOCKED
DORMANT
```

---

### Step 1 Check existing data

```
SELECT status,
COUNT *
FROM account
GROUP BY status;
```

---

### Step 2: Check metadata

```
SELECT column_name,
data_type,
data_length
FROM user_tab_columns
WHERE table_name = 'ACCOUNT'
AND column_name = 'STATUS';
```

---

### Step 3: Check for dependencies

```
SELECT
type
FROM user_dependencies
WHERE referenced_name = 'ACCOUNT';
```

---

### Step 4 Search PL/SQL

```
SELECT
type,
line,
text
FROM user_source
WHERE UPPER (text) LIKE '%STATUS%'
ORDER BY name, line
```

In particular:

```
WHERE UPPER (text) LIKE '%ACCOUNT%'
OR UPPER (text) LIKE '%STATUS%'
```

---

### Step 5

You can inspect:

```
SELECT view_name,
text
FROM user_views;
```

You're looking for expressions like:

```
status = 'A'
```

---

### Step 6: Analyze ETL

```
CORE_ACCOUNT.STATUS
       ↓
STG_ACCOUNT.STATUS
       ↓
DWH_ACCOUNT.STATUS
       ↓
DIM_ACCOUNT.STATUS
       ↓
REPORTING
```

Check:

```
date
mapping
validation
transformations
SCD
looks
report filters
```

---

### Step 7

Example:

```
SELECT status,
COUNT *
FROM dwh_account
GROUP BY status;
```

The expected distribution must appear.

---

# 40.32 Direct dependencies vs transitional dependencies

Let's have:

```
TABLE_A
   ↓
VIEW_B
   ↓
VIEW_C
   ↓
PACKAGE_D
```

VIEW\ _ B is directly dependent on TABLE\ _ A.

But:

```
VIEW_C
PACKAGE_D
```

are dependent indirectly.

Serious Impact Analysis must also follow these.

---

# 40.33 Recursive dependence analysis

Conceptual:

```
A → B
B → C
C → D
```

Change in A may affect:

```
B, C and D
```

Not just B.

For advanced analysis you can build recursive graphics from ALL\ _ DEPENDENCIES.

---

# 40.34 DDL vs DML impact

It is useful to separate:

### DDL changes

```
ADD COLUMN
DROP COLUMN
RENAME COLUMN
MODIFY DATATYPE
CREATE/DROP INDEX
CHANGE CONSTRAINT
```

These can affect structure and compilation.

---

### DML/business changes

```
New status value
different calculation
new filtering rule
changed mapping
```

They may not invalidate anything, but they can change the results.

They're often more dangerous precisely because the system continues to run.

---

# 40.35 DROP COLUMN

Suppose:

```
ALTER TABLE custodian
DROP COLUMN segment_code;
```

The impact on:

```
views
packages
procedus
function
triggers
indexes
Constraints
materialized views
ETL
reports
APIS
```

Otherwise you can get:

```
ORA-00904: invalid identity
```

or objects:

```
INVALID
```

---

# 40.36 Rename is more dangerous than it looks

Change:

```
CUSTOMER_NO
```

in:

```
CUSTOMER_ID
```

can affect dozens or hundreds of objects.

In practice a gradual process is frequently safer:

```
add new color
    ↓
population
    ↓
adapt consumers
    ↓
validated
    ↓
depressed old column
    ↓
drop later
```

than a brutal rename in a large ecosystem.

---

# 40.37 Impact Analysis and Dynamic SQL

Dynamic SQL is one of the most difficult areas.

Example:

```
v_sql: =
'SELECT balance FROM '
v_owner;
```

You don't have a simple static addiction.

The following should be considered:

```
source code
configuration tables
metadata
logs
naping conventions
runtime execution
```

---

# 40.38 Impact Analysis and configuration-driving ETL

In mature ETL- systems can be configured:

```
ETL_MAPPING
ETL_SOURCE
ETL_TARGET
ETL_RULES
```

For example:

```
SOURCE_TABLE TARGET_TABLE SOURCE_COLUMN TARGET_COLUMN
ACCOUNT DWH_ACCOUNT STATUS ACCOUNT_STATUS
```

Dependency information exists in data / configuration, not in PL/SQL.

Impact Analysis should therefore also include ETL metadata.

---

# 40.39 Impact Analysis in ODI

In ODI you could have:

```
Datastore
   ↓
Mapping
   ↓
Package
   ↓
Scenario
   ↓
Load Plan
```

If you change a datastore or column:

```
ACCOUNT.STATUS
```

check:

```
Mappings
Expressions
Joins
Filters
Lookups
Knowledge Modules
Screenplay
Load Plans
Target datastores
```

This is the impact at orchestration level.

---

# 40.40 Impact Analysis and Batch Processing

An object can be used in a chain:

```
JOB_01
  ↓
JOB_02
  ↓
JOB_03
  ↓
JOB_04
```

If you change the JOB\ _ 02 output, you need to consider:

```
JOB_03
JOB_04
downstream reports
reconciliation
restartability
```

Impact Analysis does not stop at SQL level.

---

# 40.41 Impact Analysis and Data Linage

The two concepts are perfectly completed.

Date of Lineage:

```
SOURCE
  ↓
STAGING
  ↓
DWH
  ↓
MART
  ↓
REPORT
```

Impact Analysis:

```
CHANGE HERE
    |
+ ---- → what breaks or changes downstream?
```

That's why a good solution by Data Linage greatly simplifies Impact Analysis.

---

# 40.42 Impact Analysis and Reconciliation

After implementation of the change check if the results are correct.

Examples:

```
SELECT COUNT *
FROM src_customer;
```

versus:

```
SELECT COUNT *
FROM dwh_customer;
```

or:

```
SELECT SUM (balance)
FROM src_account;
```

versus:

```
SELECT SUM (balance)
FROM fact_account;
```

Impact Analysis says:

```
what to check
```

Reconciliation confirms:

```
if the change has produced the correct result
```

---

# 40.43 Impact Assessment Checklist

For any important change ask:

- What's the modified object?
- Is it structural change or business logic?
- Which Oracle objects depend directly on him?
- Are there indirect dependencies?
- Is it used in Dynamic SQL?
- Is it used in ETL/ODI?
- Is it propagated in staging / DWH/marts?
- Is it used in an SCD?
- Is it used in fact tables?
- Are there any reports or APIS addicts?
- Are indexes or partitions affected?
- Are the constraints affected?
- Are new statistics needed?
- What objects can INVALID become?
- What tests should be run?
- What reconciliation must be done?

This is a very good checklist and for review.

---

# 40.44 What do you check for after deployment

At least:

```
SELECT object_name,
object_type,
stasis
FROM user_objects
WHERE status = 'INVALID';
```

Then:

```
SELECT
type,
line,
position,
text
FROM user_errors;
```

But also data validations:

```
SELECT status,
COUNT *
FROM custodian
GROUP BY status;
```

plus:

```
ETL run status
batch logs
row countries
reconciliation
performance
report validation
```

---

# 40.45

### Mistake 1

> I checked USER\ _ DEPENDENCIES, so I'm done.

No.

You can have:

```
Dynamic SQL
ODI
BI reports
APIS external
configuration
tabs
other databasses
```

---

### Mistake 2

> All objects are VALID, so everything is fine.

No.

You can have the wrong logic:

```
status = 'A'
```

although the status is now:

```
ACTIVE
```

---

### Mistake 3

You're just analyzing direct addicts.

The following shall also be pursued:

```
transitive / downstream dependencies
```

---

### Mistake 4

You're just analyzing the structure.

The impact may be:

```
semantic
business
date
performance
operational
```

---

### Mistake 5

You're not validating after the deposition.

Impact Analysis should lead to an **** plan test.

---

# 40.46 Real script DWH / Banking

Suppose the Core Banking system:

```
ACCOUNT.STATUS
```

receive a new value:

```
FROZEN
```

There used to be only:

```
ACTIVE
CLOSED
BLOCKED
```

The flow is:

```
CORE_BANKING.ACCOUNT
        ↓
STG_ACCOUNT
        ↓
DWH_ACCOUNT
        ↓
DIM_ACCOUNT
        ↓
FACT_DAILY_BALANCE
        ↓
MART_RISK
        ↓
REPORT_RISK
```

The following should be considered:

```
1. extract mapping
2. staging data
3. validation rules
4. logical rejected-row
5. DWH mapping
6. SCD rules
7. report filters
8. risk calculations
9. reconciliation
10. historical interpretation
```

Suppose ETL has:

```
CASE
WHEN status = 'ACTIVE' THEN 'OPEN'
ELSE 'CLOSED'
END
```

FROZEN would become incorrect:

```
CLOSED
```

The system is not a glitch.

But the data is wrong.

This is exactly the kind of problem that Impact Analysis needs to prevent.

---

# 40.47 Oracle exercise 26ai

Create:

```
CREATE TABLE custodian (
customer_id NUMBER PRIMARY KEY,
customer_name VARCHAR2 (100),
VARCHAR2 status (1)
);
```

View:

```
CREATE VIEW vw_active_customer AS
SELECT customer_id,
customer_name
FROM custodian
WHERE status = 'A';
```

Procedure:

```
CREATE OR REPLACE PROCEDURE show_active_customer AS
BEGIN
FOR r IN
SELECT *
FROM vw_active_customer
)
LOOP
DBMS_OUTPUT.PUT_LINE (r.customer_name);
END LOOP;
END;
/
```

---

### Exercise 1

Discover who depends on CUSTOMER:

```
SELECT
type
FROM user_dependencies
WHERE referenced_name = 'CUSTOMER';
```

---

### Exercise 2

Discover what the procedure uses:

```
SELECT referenced_name,
referenced_type
FROM user_dependencies
WHERE name = 'SHOW_ACTIVE_CUSTOMER';
```

---

### Exercise 3

Modify:

```
ALTER TABLE custodian
MODIFY status VARCHAR2 (20);
```

And change the business rule:

```
A
```

in:

```
ACTIVE
```

Identify all necessary changes.

---

### Exercise 4

Check the invalid objects:

```
SELECT object_name,
object_type,
stasis
FROM user_objects
WHERE status = 'INVALID';
```

Notice that a semantic problem may exist even if all objects are VALID.

---

## Questions and answers

### 1. What is Impact Analysis?

**Response:**

The process by which we identify objects, processes and systems that can be affected by a change before it is implemented.

---

### 2. How do you do Impact Analysis in Oracle?

I'd start with:

```
USER_DEPENDENCIES / ALL_DEPENDENCIES
USER_SOURCE / ALL_SOURCE
USER_OBJECTS
USER_ERRORS
metadata for indexes / constraints / views
```

then I would continue with:

```
ETL/ODI
reports
APIS
downstream systems
business logic
```

---

### 3. Is USER sufficient?

No.

It does not fully identify:

```
Dynamic SQL
external systems
reports
logic configuration-driver
ETL metadata
```

---

### 4. What difference exists between Data Linage and Impact Analysis?

Data Lineage describes the data route:

```
source → target
```

Impact Analysis asks:

```
If I change this point, what is affected?
```

---

### 5. What do you check after a change?

```
INVALID objects
compilation errors
ETL execution
data quality
reconciliation
reports
performance
```

---

### 6. Can an VALID object be affected?

Yeah.

Very important.

It can be:

```
syntactically valid
```

but:

```
semantically wrong
```

---

### 7. What is the difference between direct and indirect impact?

Example:

```
TABLE → VIEW → PACKAGE
```

VIEW is directly dependent on the table.

PACKAGE may represent indirect / transitory impact.

---

### 8. What role does Impact Analysis play in an DWH?

It is critical because a single column can be propagated by:

```
source
→ Staging
→ DWH
→ size
→ fact
→ mart
→ report
```

---

## Questions and answers

A very good wording:

> I start Impact Analysis by identifying the object and type of structural, semantic or business change. Then I check Oracle's dependencies through ALL\ _ DEPENDENCIES, I look for references in the code through ALL\ _ SOURCE and I check views, constraints, indexes and objects that can become invalid. In an DWH I also follow the lineage through staging, mappings ETL/ODI, dimensions, facts, witnesses and reports. I am not just relying on dependence metadata because dynamic SQL, configuration-driving ETL and external systems can introduce additional dependencies. Finally, I define tests, reconciliation and post-deploying validations.

This is very close to what is expected to be a role **Senior Oracle / DWH / Data Developer**.

---

# 40.50 Mental pattern to memorize

When you hear:

> **Impact Analysis**

think immediately:

```
CHANGE
   |
   v
WHAT USES IT?
   |
+ -- * Oracle dependencies
+ --
+ -- *
+ -- = Indexes / Constraints
+ -- = ETL / ODI
+ --
+ --
+ - APIS
+ -- = External systems
   |
   v
WHAT CAN BREAK?
   |
+ --
+ -- * Data quality
+ - Business logic
+ -- • Performance
+ --
   |
   v
TEST
   |
   v
DEPLOY
   |
   v
VALIDATE
```

---

# What should remain after module 40

For an Oracle Data Developer you must know very well the following idea:

```
Impact Analysis is just dependence query.
```

It is the combination of:

```
Technical dependencies
        +
Linage date
        +
Business rules
        +
ETL dependence
        +
Operational dependencies
        +
Testing
        +
Reconciliation
```

The most important Oracle instruments are:

Diagram: see HTML/PDF export

SQL
```
USER_DEPENDENCIES
ALL_DEPENDENCIES

USER_SOURCE
ALL_SOURCE

USER_OBJECTS
USER_ERRORS

USER_CONSTRAINTS
USER_CONS_COLUMNS

USER_INDEXES
USER_IND_COLUMNS

USER_VIEWS
USER_MVIEWS
```

And the final model to memorize is:

```
CHANGE
                 |
                 v
IMPACT ANALYSIS
                 |
       +---------+---------+
       |                   |
TECHNICAL FUNCTIONAL
       |                   |
depending business rules
PL/SQL data meaning
indexes reports
APIS constraints
       |                   |
       +---------+---------+
                 |
                 v
ETL / DWH FLOW
                 |
                 v
SOURCE → STAGING → DWH → DIM/FACT → MART → REPORT
                 |
                 v
TEST
                 |
                 v
RECONCILIATION
                 |
                 v
DEPLOYMENT
```

**Key idea:** in a large Oracle / DWH system, the difficulty of a change is not necessarily the change in itself, but **identifying all places where that change propagates the effects of**.

---

## Questions and answers

### How would you briefly explain Impact Analysis to a colleague who knows SQL, but not this area?

Impact Analysis covers identity what can break before a change, upstream vs downstream dependencies, database object dependencies. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Impact Analysis?

Two recurring problems are the misinterpretation of data or granularity and the degradation of performance at real volume. For Impact Analysis, explicitly follow identity what can break before a change, upstream vs downstream dependencies, database object dependencies and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

Change the type of column to DIM _ CUSTOMER.
