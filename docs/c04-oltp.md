---
title: 'C04. OLTP'
description: 'Complete English handbook chapter based on the original C04 course.'
sidebar_position: 4
---

# C04. OLTP

<div className="chapter-kicker">Chapter C04 · Complete course</div>

## 1. What OLTP is

**OLTP = Online Transaction Processing**.

An OLTP system is built to process a large number of small and fast operations, carried out simultaneously by many users or applications.

Classical examples:

- banking system: payments, transfers, accounts;
- ERP: invoices, orders, stocks;
- e-commerce: orders, payments, customers;
- CRM: customers, contacts, activities.

The key feature is:

> **many short transactions that read or modify few lines and have to respond very quickly.**

For example:

```
SELECT balance
FROM accounts
WHERE account_id =: account_id;
```

or:

```
UPDATE accounts
SET balance = balance -: amount
WHERE account_id =: account_id;
```

These are very different from an DWH query that can process millions of rows.

---

# 2. The OLTP Mental Model

In a simplified banking application we can have:

```
CUSTOMERS
    |
1: N
    v
ACCOUNTS
    |
1: N
    v
TRANSACTIONS
```

For example:

```
CREATE TABLE customers (
customer_id NUMBER PRIMARY KEY,
VARCHAR2 (100) NOT NULL
);

CREATE TABLE accounts (
account_id NUMBER PRIMARY KEY,
customer_id NUMBER NOT NULL,
balance NUMBER (15.2) NOT NULL,

CONSTRAINT fk_account_customer
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
);

CREATE
transaction_id NUMBER PRIMARY KEY,
account_id NUMBER NOT NULL,
amount NUMBER (15.2) NOT NULL,
transaction_ts TIMESTAMP DEFAULT SYSTIMESTAMP,

CONSTRAINT fk_transaction_account
FOREIGN KEY (account_id)
REFERENCES accounts (account_id)
);
```

This is a typical OLTP model: clear relationships, PK/FK and relatively normalized data.

---

# 3. Characteristics of an OLTP system

Features of OLTP
♪ ♪ ♪ ♪ ♪
Operation - INSERT / UPDATE / DELETE / SELECT
The row usually accessed few
The duration of the short transaction
• Simultani users; many
• Very high competition
Consistency of criticism
The data model usually normalized
Very important indexes
* Short and selective Querys *
• Joins usually on PK/FK
* * *
* Parallel Query rarely required *
Full Table Scan usually unwanted for lookups

A typical example:

```
SELECT *
FROM accounts
WHERE account_id =: id;
```

Oracle will probably use:

```
INDEUNIQUE SCAN
TABLE ACCESS BY INDEX ROWID
```

if the account\ _ id is PK.

---

# 4. Normalization

In OLTP we want to avoid unnecessary duplication of data.

Instead of:

```
TRANSACTIONS
------------------------------------------
transaction_id
customer_name
customer_address
account_number
current
transaction_amount
...
```

We have:

```
CUSTOMERS
ACCOUNTS
TRANSACTIONS
```

tied through the keys.

Advantages are important for trade applications:

```
less redundancy
        ↓
simpler updates
        ↓
fewer inconsistencies
        ↓
better integrity
```

In OLTP, the models in **3NF are common, which are approximately in **3NF, and Third Normal Form**.

In DWH the situation is often opposite: denormalization can be intended for the performance of analyses.

---

# 5. Mayor Key and Foreign Key

Keys are fundamental in an OLTP.

```
customer_id NUMBER PRIMARY KEY
```

uniquely identifies the client.

Foreign key:

```
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
```

guarantee referential integrity.

We can't have:

```
ACCOUNT.customer_id = 9999
```

if that client doesn't exist.

The Oracle will generate:

```
ORA-02291:
integrity connected violated - parent key not found
```

This is exactly the protective mechanism we want in an OLTP.

---

# 6. ACID

OLTP transactions shall comply with the properties of **ACID**.

## Atomic

The operation is running completely or not at all.

For a bank transfer:

```
subtract 100 from A
+
Add 100 to B
```

it is not acceptable to perform only the first operation.

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 20;

COMMIT;
```

If an error occurs:

```
ROLLBACK;
```

---

## Consistency

The data must pass from a valid state to another valid state.

We can have rules like:

```
CHECK (balance = 0)
```

or business logic implemented through PL/SQL.

---

## Isolation

Simultaneous transactions shall not corrupt each other.

Oracle manages this by:

```
locks
+
undo
+
read consistency
+
MVCC
```

---

## Durability

After:

```
COMMIT;
```

the changes become permanent.

Oracle uses mechanisms such as **redo** to recover confirmed transactions even after a crash.

---

# 7. Transaction Boundary

A very important issue in OLTP is:

> **What operations form a single logical transaction?**

For example, bank transfer:

```
UPDATE accounts
SET balance = balance -: amount
WHERE account_id =: source_account;

UPDATE accounts
SET balance = balance +: amount
WHERE account_id =: target_account;

INSERT INTO transactions (...)
VALUES (...);

COMMIT;
```

The three operations together form the transaction.

It wouldn't be fair:

```
UPDATE account A
COMMIT;

UPDATE account B
COMMIT;
```

Because if the second operation fails, the money has disappeared from the first account.

Rule:

```
business transaction
=
translation boundary
```

---

# 8. COMMIT, ROLLBACK and SAVEPOINT

### COMMIT

Confirm the transaction.

```
COMMIT;
```

After COMMIT:

```
the changes are permanent
+
Locks are released
```

---

### ROLLBACK

Cancel unconfirmed changes.

```
ROLLBACK;
```

---

### SAVEPOINT

Allow partial rollback.

```
SAVEPOINT before_payment;

UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

...

ROLLBACK TO before_payment;
```

The rest of the transaction can continue.

---

# 9. Read Consistency in Oracle

The Oracle has a very important mechanism:

> **an SELECT sees a consistent picture of the data.**

We're assuming two sessions.

### Session A

```
UPDATE accounts
SET balance = 900
WHERE account_id = 10;
```

but without:

```
COMMIT;
```

### Session B

execute:

```
SELECT balance
FROM accounts
WHERE account_id = 10;
```

Session B must not see the unconfirmed value.

Oracle rebuilds the corresponding version using **UNDO**.

Conceptual:

```
Session A

1000 → UPDATE → 900
                 |
uncommited

Session B
     |
+ - - - -
               |
               v
1000
```

This is one of the important differences in the Oracle of Competition mechanism.

---

# 10. MVCC

The concept is called:

**Multi-Version Concurence Control**.

Instead of readers being normally blocked by writers:

```
Writer changes data
Reader reads the consistent version
```

Result:

```
reader does not block writer
writer does not block reader
```

in normal situations.

But:

```
Writer can block Writer
```

if two transactions want to change the same line.

---

# 11. Row locking

We assume:

### Session 1

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle puts an **row lock** in turn.

If Session 2 executes:

```
UPDATE accounts
SET balance = balance + 50
WHERE account_id = 10;
```

Session 2 will wait.

The situation is:

```
Session 1
UPDATE row 10
   |
   v
LOCK row 10
   |
   |
Session 2
UPDATE row 10
   |
   v
WAIT
```

When Session 1 goes:

```
COMMIT;
```

or:

```
ROLLBACK;
```

The location is cleared.

---

# 12. Blocking

Blocking occurs when one transaction holds a lock that another needs.

It is particularly dangerous when an application:

```
BEGIN TRANSACTION
UPDATE
...
user waits 5 minutes
...
COMMIT
```

In an OLTP the transactions must be:

> **as short as possible.**

Long transactions increase:

```
blocking
lock content
consumption of UNDO
risk of deadlock
```

---

# 13. Deadlock

A deadlock appears when:

```
Transaction A
hold row 1
Wait for row 2

Transaction B
keep row 2
wait for row 1
```

Scheme:

```
T1 T2

LOCK Account A LOCK Account B
      |                     |
      v                     v
WAIT Account B
\ ____ ____ ____ ____ ____ _ /
              |
dadlock
```

Oracle detects the situation and generates:

```
ORA-00060:
deadlock detected while waiting for resource
```

An important prevention technique is for the application to access resources in the same order.

For example, always:

```
Lower account_id
then
account_id higher
```

---

# 14. Isolation levels

In Oracle, the most used level is:

```
READ COMMITTED
```

and is the default level.

Each state sees the commited data existing at the beginning of the state.

The Oracle also provides:

```
SERIALIZABLE
```

trying to provide behavior equivalent to a serial execution.

There are also:

```
SET TRANSACTION READ ONLY;
```

for transactions that need to see a consistent image without changes.

In the usual OLTP applications:

> **READ COMMITTED is the standard.

---

# 15. Index in OLTP

The indexes are essential because OLTP makes many selective lookups.

Example:

```
SELECT *
FROM accounts
WHERE account_id =: id;
```

If the account\ _ id is PK:

```
INDEUNIQUE SCAN
```

It's very effective.

For:

```
SELECT *
FROM transactions
WHERE account_id =: account_id
ORDER BY transaction_ts DESC;
```

may be useful:

```
CREATEQ1QX idx_transactions_account_ts
ON transactions (account_id, transaction_ts);
```

---

# 16. Why don't we index everything

Each index must be maintained.

For:

```
INSERT INTO transactions (...)
```

The Oracle must amend:

```
TABLE
+
PK index
+
account_id index
+
transaction_ts index
+
other indexes
```

Therefore:

```
more indexes
    ↓
SELECT potentially faster
    ↓
More expensive INSERT/UPDATE/DELETE
```

OLTP requires balance.

---

# 17. Selectivity

An index is very useful when the condition returns few lines.

Very selective example:

```
WHERE transaction_id = 123456
```

can return:

```
1 row out of 100 million
```

Excellent index.

But:

```
WHERE status = 'ACTIVE'
```

if 90% of the rows are ACTIVE, the index may not be useful.

Oracle may prefer:

```
TABLEQ1QX FULL
```

---

# 18. Foreign Keys and indexes

In OLTP systems it is frequently useful to have indexes on FK columns.

For example:

```
TRANSACTIONS.account_id
```

Can be indexed:

```
CREATEQ1QX idx_transactions_account
ON transactions (account_id);
```

Benefits may include:

```
Quick JOIN
quickly look up
reduction of certain housing problems associated with parental operations
```

---

# 19. Bind Variables

Very important in Oracle OLTP.

Instead of:

```
SELECT *
FROM accounts
WHERE account_id = 1001;

SELECT *
FROM accounts
WHERE account_id = 1002;

SELECT *
FROM accounts
WHERE account_id = 1003;
```

the application uses:

```
SELECT *
FROM accounts
WHERE account_id =: account_id;
```

The Oracle may reuse the cursor.

The advantages are important:

```
less hard parsing
less CPU
less pressure on the shared pool
cursor failed
protection against SQL injection
```

In an OLTP system with thousands of querys per second this is critical.

---

# 20. Execution Typical OLTP Plan

A very common OLTP plan is:

```
SELECT STATEMENT
TABLE ACCESS BY INDEX ROWID ACCOUNTS
INDEX UNIQUE SCAN PK_ACCOUNTS
```

Read from the bottom up:

```
INDEUNIQUE SCAN
        ↓
Find ROWID
        ↓
TABLE ACCESS BY INDEX ROWID
        ↓
return row
```

Other example:

```
NESTED LOOPS
TABLE ACCESS BY INDEX ROWID CUSTOMERS
INDEX UNIQUE SCAN PK_CUSTOMERS

TABLE ACCESS BY INDEX ROWID ACCOUNTS
INDEX RANGE SCAN IDX_ACCOUNT_CUSTOMER
```

This is very characteristic OLTP:

```
few rows
+
indexes
+
Nested Loops
```

---

# 21. Nested Loops in OLTP

We assume:

```
SELECT. *
FROM customers c
JOIN accounts a
ON a.customer_id = c.customer_id
WHERE c.customer_id =: id;
```

Oracle can do:

```
INDEX UNIQUE SCAN PK_CUSTOMERS
        ↓
1 custodian
        ↓
NESTED LOOPS
        ↓
INDEX RANGE SCAN IDX_ACCOUNTS_CUSTOMER
```

If we have:

```
1 custodian
5 accounts
```

It's very effective.

In DWH, if we have:

```
10 million Customers
100 million transactions
```

A Hash Join can be more appropriate.

---

# 22. Transactions must be short

An important OLTP rule:

> **Do not keep transactions open longer than necessary.**

Bad:

```
UPDATE
↓
input user
↓
30 seconds
↓
other UPDATE
↓
user confirmation
↓
COMMIT
```

Okay:

```
receive all data
↓
BEGIN transaction
↓
UPDATE
UPDATE
INSERT
↓
COMMIT
```

So the time that the locations are kept is very small.

---

# 23. COMMIT too often

The opposite extreme is no good either.

For example:

```
FOR...
LOOP
INSERT...;
COMMIT;
END LOOP;
```

it can be very ineffective.

In a logical operation:

```
100 INSERT-uri
```

if they form a single business transaction, normally:

```
100 INSERT-uri

COMMIT;
```

No:

```
INSERT
COMMIT
INSERT
COMMIT
...
```

Transaction boundary must be determined by business meaning, not arbitrary.

---

# 24. OLTP and PL/SQL

PL/SQL is very useful for trading operations.

Example:

```
CREATE OR REPLACE PROCEDURE transfer_money (
p_from_account NUMBER,
p_to_account NUMBER,
p_amount NUMBER
)
IS
BEGIN

UPDATE accounts
SET balance = balance - p_amount
WHERE account_id = p_from_account;

UPDATE accounts
SET balance = balance + p_amount
WHERE account_id = p_to_account;

INSERT
transaction_id,
account_id,
% 1
)
VALUES (
transaction_seq.NEXTVAL,
p_from_account,
-p_amount
);

EXCEPTION
WHENQ1QX THEN
RAISE;
END;
/
```

Very important: often the decision of:

```
COMMIT
```

remains at the level that controls the entire business transaction, not mandatory in each internal procedure.

---

# 25. Data Integrity

In OLTP, the database must protect the data.

We don't have to rely solely on the app.

Examples:

```
PRIMARY KEY
```

```
FOREIGN KEY
```

```
NOT NULL
```

```
UNIQUE
```

```
CHECK
```

For example:

```
VARCHAR2 status (20)
CHECK (IN status ('ACTIVE', 'BLOCKED', 'CLOSED'))
```

This ensures that even another program that writes directly in DB cannot introduce invalid values.

---

# 26.OLTP vs OLAP / DWH

This is one of the most important differences to understand:

= = sync, corrected by elderman = = @ elder _ man
- - - - - - - - -
Purpose of current operations
Date of current and historical data
* * * * * * * *
= = sync, corrected by elderman = =
Row / query is few; million
= = sync, corrected by elderman = =
The Index is very important and depends on it.
# Join typical Nested Loops # Hash Join #
♪ Full Scan often unwanted ♪
* Parallelism *
♪ ♪ ♪ ♪ ♪ ♪
• Very high competition and lower competition

Example OLTP:

```
SELECT balance
FROM accounts
WHERE account_id =: id;
```

Example OLAP:

```
SELECT
region,
product_category,
SUM (amount)
FROM fact_sales
WHERE sale_date = DATE '2025-01-01'
GROUP BY
region,
product_category;
```

The first can read:

```
1 row
```

second:

```
100 million rows
```

This is why the same SQL strategy cannot be optimal for both.

---

# 27. OLTP → ETL → DWH

The general model that it is worth retaining is:

```
OLTP
|
The Customers
= = Notes = =
= = = Transactions = = =
|
v
STAGING
|
v
ETL / ODI
|
♪ ♪ ♪
= = = Validation = = =
= = References = =
♪ ♪ ♪
|
v
DWH
|
+ -- Dimensions
|
+ -- Facts
|
v
OLAP / BI / Reports
```

OLTP responds to:

> What's the balance of the account now?

DWH responds to:

> What has been the evolution of the balances of corporate customers by region over the last three years?

---

# 28. Complete example: bank transfer

We have:

```
Account A = 1000
Account B = 500
```

Transferring:

```
100
```

Transaction:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 20;

INSERT
transaction_id,
account_id,
% 1% 2
transaction_ts
)
VALUES (
transaction_seq.NEXTVAL,
10,
-100,
SYSTIMESTAMP
);

INSERT
transaction_id,
account_id,
% 1% 2
transaction_ts
)
VALUES (
transaction_seq.NEXTVAL,
20,
100,
SYSTIMESTAMP
);

COMMIT;
```

Result:

```
Account A = 900
Account B = 600
```

The Oracle shall simultaneously ensure:

```
Atomic
Consistency
Isolation
Durability

+
row locking
+
read consistency
+
undo
+
redo
+
constraint validation
```

This seemingly simple operation focuses almost all essential concepts of OLTP.

---

# 29. What you need to follow at performance

For an SQL OLTP, the main question is often:

```
How many lines do I have to find?
```

If the answer is:

```
1
5
10
100
```

and the table has:

```
50 million rows
```

we often expect to:

```
index access
```

No:

```
Full table scan
```

A healthy profile can show conceptual:

```
INDEUNIQUE/RANGE SCAN
        ↓
TABLE ACCESS BY INDEX ROWID
        ↓
NESTED LOOPS
        ↓
feel rows
```

---

# 30. Important OLTP anti-patents

It is worth acknowledging immediately the following situations:

```
SELECT * without need

functions on indexed columns:
WHERE UPPER (code) =...

transactions kept open long

COMMIT after each row

excessive unnecessary indexes

missing index on columns used constantly for lookup

SQL without wind variables

updates on millions of rows during peak hours

heavy analytical querys performed directly on OLTP

Locking in inconsistent order

integrity logic left only to the application
```

---

## Questions and answers

If at the technical discussion you are asked:

**- What characterizes an OLTP system?

a very good and compact answer would be:

> A OLTP system is optimized for a large volume of short and competing transactions, usually INSERT, UPDATE, DELETE and SELECT-uri very selective. The model is generally normalized and uses PK, FK and data integrity constraints. The performance is based much on selective indexes, bind variables and access to a small number of lines, frequently through Nested Loops. In Oracle, competition is managed by row-level locking, UNDO and read consistency / MVCC, so that readers and writers block as little as possible. Transaction boundaries must comply with business operation, with COMMIT or ROLLBACK for the entire logical unit.

---

# 32. The memorizing scheme

If you want to retain OLTP in a single mental image:

```
OLTP
                          |
        +-----------------+-----------------+
        |                 |                 |
DATAQ1QX PERFORMANCE
        |                 |                 |
ACID Index Normalisation
PK / FK COMMIT
Constraints ROLLBACK Nested Loops
SAVEPOINT
                             |
CONCURRENCY
                             |
                    +--------+--------+
                    |                 |
UNDO LOCKS
                    |                 |
Read consistency Row locking
                    |                 |
MVCC Block
                                      |
Deadlock
```

The central idea is:

> **OLTP in Oracle = short transactions + consistent data + high competition + very selective access to few rows.**

And the fundamental contrast that it is worth to have permanently in mind is:

```
OLTP
few rows + index + Nested Loops + transactions

vs.

DWH / OLAP
many rows + scans + Hash Join + aggregations + parallelism
```

---

## Questions and answers

### How would you briefly explain the OLTP to a colleague who knows SQL, but not this area?

The OLTP covers high-competition transactional workloads, normalized data models and referential integrity, short transactions and selective indexes. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to the OLTP?

Two recurring problems are the misinterpretation of data or granularity and degradation of performance at real volume. For the OLTP, explicitly follow the high-competition transactional workloads, normalized data models and referential integrity, short translations and selective indexes and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

In a bank flow, the OLTP appears together with logging, auditing, reconciliation and impact analysis.
