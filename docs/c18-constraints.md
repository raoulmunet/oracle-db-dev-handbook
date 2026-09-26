---
title: 'C18. Constraints and Data Integrity'
description: 'Complete English handbook chapter based on the original C18 course.'
sidebar_position: 18
---

# C18. Constraints and Data Integrity

<div className="chapter-kicker">Chapter C18 · Complete course</div>

In Oracle, **constraints** are declarative rules defined directly in the database to guarantee data integrity.

The main idea:

> The application can validate the data, ETL can validate the data, but the database must remain the last line of defence.

For a Data Developer, constraints are important both in **OLTP** and in **ETL/DWH**, even though in DWH are sometimes used differently.

---

## 18.1. What Data Integrity Means

Data integrity means that data constantly complies with certain rules.

We can talk mainly about:

| Integrity type | Rule |,| --- | --- |,| Entity integrity | Every customer has a unique identifier |,| Referential integrity | Every account must belong to an existing customer |,| Domain integrity | `STATUS` can contain only allowed values |,| Business integrity | A balance must not be negative when that is the business rule |,| Uniqueness | An IBAN must not appear more than once |,
Oracle implements most of these rules through **constraints**.

---

## 18.2. The 5 Main Constraints Oracle

They must be known very well:

1. NOT NULL
2. UNIQUE
3. PRIMARY KEY
4. FOREIGN KEY
5. CHECK

Important:

DEFAULT, INDEX, SEQUENCE, IDENTITY and TRIGGER **are not constraints**.

---

## 18.3. NOT NULL

It requires a value.

```
CREATE TABLE customers (
customer_id NUMBER,
first_name VARCHAR2 (100) NOT NULL,
last_name VARCHAR2 (100) NOT NULL
);
```

This plugin fails:

```
INSERT INTO Customers (customer_id, first_name, last_name)
VALUES (1, 'Raoul', NULL);
```

With a shape error:

```
ORA-01400: cannot insert NULL
```

### Typical use

For mandatory columns:

```
CUSTOMER_ID
TRANSACTION_DATE
ACCOUNT_ID
AMOUNT
SOURCE_SYSTEM
```

But we need to be careful not to do columns NOT NULL just because they usually exist.

---

## 18.4. PRIMARY KEY

Unique identification of each row.

```
CREATE TABLE customers (
customer_id NUMBER
CONSTRAINT pk_customers PRIMARY KEY,

VARCHAR2 (100)
);
```

PRIMARY KEY automatically involves:

```
UNIQUE
+
NOT NULL
```

Therefore:

```
customer_id = NULL
```

It's not allowed.

Neither:

```
customer_id = 100
customer_id = 100
```

It's not allowed.

---

## Primary Key Compound

A key may contain several columns.

```
CREATE TABLE account_balance (
account_id NUMBER,
balance_date DATE,
balance NUMBER,

CONSTRAINT pk_account_balance
PRIMARY KEY (account_id, balance_date)
);
```

The uniqueness is on the combination:

```
(account_id, balance_date)
```

not individually on each column.

---

## 18.5. UNIQUE

UNIQUE ensures that non-NULL values do not repeat.

```
CREATE TABLE customers (
customer_id NUMBER PRIMARY KEY,

email VARCHAR2 (200)
CONSTRAINT uq_customers_email UNIQUE
);
```

We can't have:

```
a @ test.com
a @ test.com
```

---

## PRIMARY KEY vs UNIQUE

Very important difference in the technical discussion:

| Feature | Primary key | Unique constraint |
| --- | --- | --- |
| Purpose | Identifies each row | Enforces uniqueness |
| Number per table | One | More than one is allowed |
| NULL values | Not allowed | Allowed |

Example:

```
CUSTOMER_ID → PRIMARY KEY
EMAIL → UNIQUE
CNP → UNIQUE
```

---

## 18.6. FOREIGN KEY

FOREIGN KEY implements **referential integrity**.

Let's have:

```
CREATE TABLE customers (
customer_id NUMBER
CONSTRAINT pk_customers PRIMARY KEY,

VARCHAR2 (100)
);
```

and:

```
CREATE TABLE accounts (
account_id NUMBER
CONSTRAINT pk_accounts PRIMARY KEY,

customer_id NUMBER NOT NULL,

iban VARCHAR2 (34),

CONSTRAINT fk_accounts_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
);
```

The relationship is:

```
CUSTOMERS
    |
* * *
    |
+ --
```

A client can have multiple accounts.

---

## What prevents FOREIGN KEY

If there is no:

```
CUSTOMER_ID = 999
```

the following insert:

```
INSERT INTO accounts (account_id, customer_id, iban)
VALUES (1001, 999, 'RO...');
```

generate:

```
ORA-02291:
integrity connected violated - parent key not found
```

This is one of the Oracle errors very important for ETL.

Mental:

```
ORA-02291
=
Trying to create CHILD
but there is no PARENT.
```

---

## 18.7. ORA-02292

Reverse situation.

There are:

```
CUSTOMER 100
    |
+ -- ACCOUNT 1001
```

and we try:

```
DELETE FROM Customers
WHERE customer_id = 100;
```

Oracle may return:

```
ORA-02292:
integrity connected violated - child record found
```

Mental:

```
ORA-02292
=
trying to delete PARENT
but there is CHILD.
```

Very good pair of memorized:

```
02291 → missing parent
02292 → there is child
```

---

## 18.8. ON DELETE

Oracle allows controlling the behavior of FOREIGN KEY when erasing the parent.

## Normal version

```
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
```

Do not allow the erasure of the parent if there is children.

---

## ON DELETE CASCADE

```
CONSTRAINT fk_accounts_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
ON DELETE CASCADE
```

If we delete the client:

```
DELETE FROM Customers
WHERE customer_id = 100;
```

Oracle automatically deletes the associated rows from the child table.

It's strong, but it needs to be used carefully.

In a banking system, automatic deletion of transactions because an account has been deleted would usually be extremely dangerous.

---

## ON DELETE SET NULL

```
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
ON DELETE SET NULL
```

In the erasure of the parent:

```
customer_id → NULL
```

It is only possible if the column allows NULL.

---

## What about ON UPDATE CASCADE?

Oracle does not offer directly:

```
ON DELETE CASCADE
```

like some other DBMS-uri.

In practice, PRIMARY KEY-s are usually designed so that they do not need to be modified.

---

## 18.9. CHECK constraint

CHECK validates an expression.

Example:

```
CREATE TABLE accounts (
account_id NUMBER PRIMARY KEY,

VARCHAR2 status (20),

balance NUMBER,

CONSTRAINT ck_accounts_status
CHECK (status IN ('ACTIVE', 'BLOCKED', 'CLOSED')),

CONSTRAINT ck_accounts_balance
CHECK (balance = 0)
);
```

It fails:

```
INSERT INTO accounts
VALUES (1, 'UNKNOWN', 100);
```

Same:

```
INSERT INTO accounts
VALUES (1, 'ACTIVE', -500);
```

---

## 18.10. Attention: CHECK and NULL

Very important in Oracle.

We have:

```
CHECK (balance = 0)
```

What happens for:

```
balance = NULL
```

Expression:

```
NULL = 0
```

is not FALSE.

It's:

```
UNKNOWN
```

and CHECK only rejects the FALSE result.

Therefore, NULL can pass.

If we want mandatory non-equative value:

```
balance NUMBER NOT NULL,

CONSTRAINT ck_balance
CHECK (balance = 0)
```

You have to:

```
NOT NULL
+
CHECK
```

---

## 18.11. Column-level vs tablet-level constraints

Constraint defined by column:

```
customer_id NUMBER PRIMARY KEY
```

is **column-level**.

Constraint defined separately:

```
customer_id NUMBER,

CONSTRAINT pk_customers
PRIMARY KEY (customer_id)
```

is **tablet-level**.

For composite constraints, the tablet-level form should be used:

```
CONSTRAINT uq_customer_source
UNIQUE (source_system, source_customer_id)
```

---

## 18.12. Naming Conventions

It is recommended that we explicitly call the constraints.

For example:

```
PK_CUSTOMERS
FK_ACCOUNTS_CUSTOMER
UQ_CUSTOMERS_EMAIL
CK_ACCOUNTS_STATUS
```

Huge advance when it comes:

```
ORA-02291:
Constraint integrity
(DEV_LAB.FK_ETL_ERROR_BATCH)
raped
```

You know immediately the problematic relationship.

If Oracle generates the name automatically:

```
SYS_C008274
```

The investigation becomes more difficult.

---

## 18.13. Adding a constraint after creating the table

```
ALTER TABLE Customers
ADD CONSTRAINT pk_customers
PRIMARY KEY (customer_id);
```

Foreign key:

```
ALTER TABLE accounts
ADD CONSTRAINT fk_accounts_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id);
```

CHECK:

```
ALTER TABLE accounts
ADD CONSTRAINT ck_accounts_balance
CHECK (balance = 0);
```

---

## 18.14. ENABLE / DISABLE

A constraint may be disabled:

```
ALTER TABLE accounts
DISABLE CONSTRAINT fk_accounts_customer;
```

and reactivated:

```
ALTER TABLE accounts
ENABLE CONSTRAINT fk_accounts_customer;
```

In ETL this can occur at massive charges.

But it's risky.

Problem flow:

```
DISABLE constraint
↓
load 500 million rows
↓
ENABLE constraint
```

If the data contain inconsistencies, reactivation may fail.

---

## 18.15. VALIDATE vs NOVALIDATE

Important concept for large volumes of data.

## ENABLE VALIDATE

```
existing data → validated
new data → validated
```

It's normal behavior.

---

## ENABLE NOVALIDATE

```
existing data → not verified
New data → are verified
```

Conceptual example:

```
ALTER TABLE transactions
ENABLE NOVALIDATE
CONSTRAINT ck_transaction_amount;
```

It can be useful when we have billions of rows legacy and we want to impose the rule only for new data until the history is cleared.

---

## DISABLE NOVALIDATE

Constraint is no longer imposed.

Data can break the rule.

---

## 18.16. DEFERRABLE constraints

By default, Oracle checks a constraint immediately after each station.

But sometimes we want the COMMIT check.

Example:

```
CREATE TABLE employment (
employee_id NUMBER PRIMARY KEY,

manager_id NUMBER,

CONSTRAINT fk_emp_manager
FOREIGN KEY (manager_id)
REFERENCES employment (employee_id)
DEFERRABLE
INITIALLY DEFERRED
);
```

In this case, the rule can be verified at the end of the transaction.

---

## IMMEDIATE vs DEFERRED

```
IMMEDIATE
```

means:

```
Statement verification
```

and:

```
DEFERRED
```

means:

```
verification to COMMIT
```

Useful in complex situations where intermediate operations can temporarily produce an inconsistent state, but the final transaction is valid.

---

## 18.17. Constraints and indexes

Oracle usually creates or uses an index for:

```
PRIMARY KEY
UNIQUE
```

Example:

```
CONSTRAINT pk_customers PRIMARY KEY (customer_id)
```

It will need a structure that allows for effective verification of uniqueness.

But very important:

> FOREIGN KEY does not automatically create an index on the child column.

For example:

```
ACCOUNTS.CUSTOMER_ID
```

may require a separate index:

```
CREATE INDEX ix_accounts_customer
ON accounts (customer_id);
```

Especially for the performance and operations on the parent.

---

## 18.18. Date Dictionary

To see the constraints:

```
SELECT
constraint_name,
constraint_type,
table_name,
status
FROM user_constraints
WHERE table_name = 'ACCOUNTS';
```

| Constraint type | Dictionary code |
| --- | --- |
| Check | C |
| Primary key | P |
| Referential integrity (foreign key) | R |
| Unique | U |

For columns:

```
SELECT
constraint_name,
table_name,
column_name,
position
FROM user_cons_columns
WHERE table_name = 'ACCOUNTS'
ORDER BY constraint_name position;
```

---

## 18.19. How to find out the relationship of an FOREIGN KEY

Query useful for debugging:

```
SELECT
c.constraint_name,
c.table_name child_table,
cc.column_name child_column,
p.table_name parent_table,
pc.column_name parent_column
FROM user_constraints c
JOIN user_cons_columns cc
ON cc.constraint_name = c.constraint_name
JOIN user_constraints
ON p.constraint_name = c.r_constraint_name
JOIN user_cons_columns pc
ON pc.constraint_name = p.constraint_name
AND pc.position = cc.position
WHERE c.constraint_type = 'R';
```

Very useful if you receive:

```
ORA-02291
```

And you want to know:

```
What table?
What column?
What parent?
```

---

## 18.20. Full OLTP banking example

```
CREATE TABLE customers (
customer_id NUMBER
CONSTRAINT pk_customers PRIMARY KEY,

source_customer_id VARCHAR2 (50) NOT NULL,

source_system VARCHAR2 (20) NOT NULL

VARCHAR2 (200) NOT NULL,

email VARCHAR2 (200),

CONSTRAINT uq_customer_source
UNIQUE (source_system, source_customer_id)
);
```

Accounts:

```
CREATE TABLE accounts (
account_id NUMBER
CONSTRAINT pk_accounts PRIMARY KEY,

customer_id NUMBER NOT NULL,

iban VARCHAR2 (34) NOT NULL,

VARCHAR2 status (20) NOT NULL,

balance NUMBER (18.2) DEFAULT 0 NOT NULL,

CONSTRAINT uq_accounts_iban
UNIQUE (iban),

CONSTRAINT fk_accounts_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id),

CONSTRAINT ck_accounts_status
CHECK (status IN ('ACTIVE', 'BLOCKED', 'CLOSED')),

CONSTRAINT ck_accounts_balance
CHECK (balance = 0)
);
```

Now the database guarantees:

```
Unique CUSTOMER_ID
↓
ACCOUNT belongs to an existing CUSTOMER
↓
Unique IBAN
↓
Valid STATUS
↓
BALANCE nen and then = 0
```

---

## 18.21. Constraints in an DWH

In OLTP constraints are usually very important.

In DWH the situation is more nuanced.

A model may have:

```
DIM_CUSTOMER
DIM_ACCOUNT
DIM_DATE
       |
       v
FACT_TRANSACTION
```

FACT_TRANSACTION contains:

```
CUSTOMER_SK
ACCOUNT_SK
DATE_SK
```

Conceptually these are FOREIGN KEY to dimensions.

However, some DWH-uri avoids the physical FK constraints on fact very large tables for reasons of:

```
ETL performance
bulk loading
part exchange
load windows
```

But integrity must be guaranteed elsewhere:

```
ETL / ODI
Data Quality
reconciliation
item tables
Validation queries
```

Lack of physical FK does not mean:

> Integrity doesn't matter.

It means that responsibility is being moved to the ETL/DQ process.

---

## 18.22. Business Key vs Surrogate Key

Very important in DWH.

Source:

```
source_system = 'CRM'
source_customer_id = 12345
```

Size:

```
customer_sk = 781992
```

CUSTOMER_SK is surrogate key.

The key to business can be:

```
CONSTRAINT uq_dim_customer_bk
UNIQUE (source_system, source_customer_id, version_no)
```

or an adapted equivalent SCD rule.

Therefore:

```
business key
;
surrogate key
```

Surrogate key identifies row DWH.

Business key identifies the entity in the source system.

---

## 18.23. Scenario ETL - ORA-02291

Suppose:

```
ETL_BATCH
---------
BATCH_ID
```

and:

```
ETL_ERROR
---------
ERROR_ID
BATCH_ID
```

with:

```
FOREIGN KEY (batch_id)
REFERENCES etl_batch (batch_id)
```

ETL tries:

```
INSERT INTO etl_error (
error_id,
batch_id,
error_message
)
VALUES (
100,
500,
'Invalid customer'
);
```

but ETL_BATCH does not contain:

```
BATCH_ID = 500
```

Result:

```
ORA-02291
```

Correct investigation:

```
SELECT *
FROM etl_batch
WHERE batch_id = 500;
```

If there is no:

```
ETL tries to write child before parent
```

The problem is often the **process order ETL**, not the constraint.

---

## 18.24. Detecting Orphan Records

If the constraints are not active, we need to check manually.

Example:

```
SELECT. *
FROM accounts a
WHERE NOT EXISTS (
SELECT 1
FROM customers c
WHERE c.customer_id = a.customer_id
);
```

The result is:

```
Orphan Records
```

I mean:

```
ACCOUNT
without CUSTOMER
```

This pattern is very important in Data Quality.

---

## 18.25. What NU rules can be solved simply with CHECK

Let's assume the rule:

> The transaction value may not exceed the set-up limit for the account.

I have:

```
TRANSACTIONS.AMOUNT
```

and:

```
ACCOUNTS.TRANSACTION_LIMIT
```

A simple:

```
CHECK (...)
```

cannot directly validate a value from another table.

Here we need:

```
application logic
PL/SQL
ETL validation
possibly trigger
```

In general:

```
constraint
```

is excellent for local and declarative **rules.

The complex cross-table rules must be treated separately.

---

## 18.26. Constraints vs. Data Quality

Constraints:

```
Invalid data does not enter.
```

Date Quality:

```
I detect, classify and manage problematic data.
```

Example:

```
STATUS = 'XYZ'
```

can be locked with:

```
CHECK (status IN (...))
```

But:

```
CLIENT with CNP formally valid
but belonging to the wrong person
```

can not be solved by simple CHECK.

This is why in DWH architecture:

```
SOURCE
   ↓
STAGING
   ↓
DQ validation
   ↓
REJECT / QUARANTINE
   ↓
TRANSFORMATION
   ↓
DWH
```

Constraints are just one of the levels of protection.

---

## 18.27. Laboratory Oracle 26ai

### Exercise 1

Create:

```
CUSTOMERS
ACCOUNTS
TRANSACTIONS
```

with:

```
PK
FK
NOT NULL
UNIQUE
CHECK
```

Relations:

```
CUSTOMERS
   |
+ --- ACCOUNTS
            |
+ --- TRANSACTIONS
```

---

### Exercise 2

Try an account for:

```
customer_id = 99999
```

that doesn't exist.

Identify:

```
ORA-02291
```

---

### Exercise 3

Try to erase a client with accounts.

Identify:

```
ORA-02292
```

---

### Exercise 4

Enter:

```
Balance = -500
```

and check CHECK.

---

### Exercise 5

Enter twice the same:

```
IBAN
```

and notes the violation of UNIQUE.

---

### Exercise 6

Investigate the board:

```
SELECT *
FROM user_constraints
WHERE table_name = 'ACCOUNTS';
```

then:

```
SELECT *
FROM user_cons_columns
WHERE table_name = 'ACCOUNTS';
```

---

### Exercise 7 - DWH

Create:

```
DIM_CUSTOMER
FACT_TRANSACTION
```

and try to load a non-existent CUSTOMER_SK.

Then write the query:

```
NOT EXISTS
```

to detect orphan invoices / transactions.

---

## 18.29. A Useful Way to Debug Constraint Violations

When you encounter a constraint violation, ask:

```
1. What kind of constraint is that?
        ↓
2. What type of constraint is it?
        ↓
3. What column / columns?
        ↓
4. What rule does it enforce?
        ↓
5. The data are wrong
Or is the process wrong?
```

For FK:

```
ORA-02291
    ↓
child → parent missing
    ↓
I'm looking for the key to parenting.
```

For deleterias:

```
ORA-02292
    ↓
parent → child exists
    ↓
I'm looking for children
```

---

## 18.30. What to remember for Data Developer

The most important ideas are:

```
PRIMARY KEY
→ uniquely identifies row

UNIQUE
→ prevents duplicates

FOREIGN KEY
→ guarantees parental-child relationship

CHECK
→ imposes domain rules

NOT NULL
→ the value is mandatory
```

and:

```
ORA-02291
→ Child without parent

ORA-02292
→ attempt to delete parent with children
```

In OLTP:

```
Constraints
→ strong and immediate protection.
```

In DWH:

```
Constraints
+
ETL validation
+
Data Quality
+
Reconciliation
```

together form the integrity protection system.

And the idea of an technical discussion worth memorizing is:

> **Constraints protects the database from impossible states, and in an DWH lack of physical constraint does not remove the integrity rule; it only moves responsibility to ETL and Data Quality.**

---

## Questions and answers

### 1. What are the main Oracle constraints?

```
NOT NULL
UNIQUE
PRIMARY KEY
FOREIGN KEY
CHECK
```

---

### 2. PRIMARY KEY vs UNIQUE?

PRIMARY KEY:

```
unique
+
NOT NULL
+
identify row
```

UNIQUE:

```
ensures uniqueness
and can allow NULL.
```

---

### 3. What does ORA-02291 mean?

Child refers to a parent who doesn't exist.

```
INSERT child
→ parent missing
```

---

### 4. What does ORA-02292 mean?

We're trying to erase a parent who still has children.

---

### 5. FOREIGN KEY automatically creates index?

No.

The index on FOREIGN KEY should be analysed and created separately when necessary.

---

### 6. What does ON DELETE CASCADE do?

Erase the parent automatically causes the child to be removed.

---

### 7. What happens to NULL in an CHECK?

An CHECK rejects FALSE, but NULL can lead to UNKNOWN, so it can pass.

Therefore:

```
CHECK (amount = 0)
```

does not replace:

```
NOT NULL
```

---

### 8. What is ENABLE NOVALIDATE?

Constraint is applied to new data, but the existing data is not validated.

---

### 9. What does DEFERRABLE mean?

Constraint can be checked at the end of the transaction instead of immediately after the statement.

---

### 10. Do you use FOREIGN KEY in DWH?

Depends on the architecture.

Conceptual relationships always exist, but in some large DWH-uri FK constraints are not activated for fact tables for performance reasons ETL. In this case integrity must be guaranteed by ETL and Data Quality.

---

### How would you briefly explain Constraints and integrity to a colleague who knows SQL, but not this area?

Constraints and integrity cover PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK and NOT NULL, entity and referential integrity, immediate vs deferred constraints. In practice, first determine what data enter and what result to achieve, then check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Constraints and integrity?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For Constraints and integrity, explicitly follow PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK and NOT NULL, entity and referential integrity, immediate vs deferred constraints and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, schema and keys, volume, data distribution, dependencies, plans and time, errors / logs and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, Constraints and integrity occur together with logging, auditing, reconciliation and impact analysis.
