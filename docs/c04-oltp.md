---
title: 'C04. OLTP'
description: 'Complete English handbook chapter based on the original C04 course.'
sidebar_position: 4
---

# C04. OLTP

<div className="chapter-kicker">Chapter C04 · Complete course</div>

## 1. What OLTP is

**OLTP = Online Transaction Processing**.

An OLTP system is designed to process a large number of small, fast operations carried out concurrently by many users or applications.

Typical examples include:

- banking systems: payments, transfers, accounts;
- ERP systems: invoices, orders, inventory;
- e-commerce systems: orders, payments, customers;
- CRM systems: customers, contacts, activities.

The key characteristic is:

> **Many short transactions read or modify a small number of rows and must respond very quickly.**

For example:

```sql
SELECT balance
FROM accounts
WHERE account_id = :account_id;
```

or:

```sql
UPDATE accounts
SET balance = balance - :amount
WHERE account_id = :account_id;
```

These operations are very different from a DWH query that may process millions of rows.

---

## 2. The OLTP mental model

In a simplified banking application, we might have:

```text
CUSTOMERS
    |
   1:N
    v
ACCOUNTS
    |
   1:N
    v
TRANSACTIONS
```

For example:

```sql
CREATE TABLE customers (
    customer_id   NUMBER PRIMARY KEY,
    customer_name VARCHAR2(100) NOT NULL
);

CREATE TABLE accounts (
    account_id  NUMBER PRIMARY KEY,
    customer_id NUMBER NOT NULL,
    balance     NUMBER(15,2) NOT NULL,

    CONSTRAINT fk_account_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers (customer_id)
);

CREATE TABLE transactions (
    transaction_id NUMBER PRIMARY KEY,
    account_id     NUMBER NOT NULL,
    amount         NUMBER(15,2) NOT NULL,
    transaction_ts TIMESTAMP DEFAULT SYSTIMESTAMP,

    CONSTRAINT fk_transaction_account
        FOREIGN KEY (account_id)
        REFERENCES accounts (account_id)
);
```

This is a typical OLTP model: clear relationships, primary and foreign keys, and relatively normalized data.

---

## 3. Characteristics of an OLTP system

Typical OLTP characteristics include:

- frequent `INSERT`, `UPDATE`, `DELETE`, and selective `SELECT` operations;
- only a few rows are usually accessed by each statement;
- transactions are short;
- many concurrent users or application sessions;
- potentially high contention on popular rows;
- data consistency is critical;
- the data model is usually normalized;
- indexes are very important;
- queries are usually short and selective;
- joins are often based on PK/FK relationships;
- parallel query is rarely required for normal transactional lookups;
- full table scans are usually undesirable for highly selective lookups.

A typical example is:

```sql
SELECT *
FROM accounts
WHERE account_id = :id;
```

If `account_id` is the primary key, Oracle will typically use a plan similar to:

```text
INDEX UNIQUE SCAN
TABLE ACCESS BY INDEX ROWID
```

---

## 4. Normalization

In OLTP systems, we usually want to avoid unnecessary duplication of data.

Instead of storing everything in one table:

```text
TRANSACTIONS
------------------------------------------
transaction_id
customer_name
customer_address
account_number
current_balance
transaction_amount
...
```

we normally separate the entities:

```text
CUSTOMERS
ACCOUNTS
TRANSACTIONS
```

and connect them through keys.

The advantages are important for transactional applications:

```text
less redundancy
      ↓
simpler updates
      ↓
fewer inconsistencies
      ↓
better integrity
```

In OLTP systems, data models close to **Third Normal Form (3NF)** are common.

In a DWH, the situation is often different: denormalization may be intentional because it can improve analytical query performance and simplify reporting structures.

---

## 5. Primary keys and foreign keys

Keys are fundamental in OLTP systems.

A primary key:

```sql
customer_id NUMBER PRIMARY KEY
```

uniquely identifies a customer.

A foreign key:

```sql
FOREIGN KEY (customer_id)
REFERENCES customers (customer_id)
```

ensures referential integrity.

We cannot have:

```text
ACCOUNTS.customer_id = 9999
```

if customer `9999` does not exist.

Oracle will raise an error such as:

```text
ORA-02291: integrity constraint violated - parent key not found
```

This is exactly the type of protection we want in an OLTP system.

---

## 6. ACID

OLTP transactions should comply with the **ACID** properties.

### Atomicity

The operation is completed entirely or not at all.

For a bank transfer:

```text
subtract 100 from account A
+
add 100 to account B
```

It is not acceptable to perform only the first operation.

```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 20;

COMMIT;
```

If an error occurs before the transaction is committed:

```sql
ROLLBACK;
```

### Consistency

The data must move from one valid state to another valid state.

We can enforce rules such as:

```sql
CHECK (balance >= 0)
```

or implement business rules through PL/SQL where appropriate.

### Isolation

Concurrent transactions must not corrupt one another.

Oracle supports this using mechanisms such as:

```text
locks
+
undo
+
read consistency
+
MVCC
```

### Durability

After:

```sql
COMMIT;
```

the committed changes must survive failures.

Oracle uses mechanisms such as **redo** to recover committed transactions after a crash.

---

## 7. Transaction boundaries

A very important question in OLTP is:

> **Which operations form one logical transaction?**

For example, a bank transfer might contain:

```sql
UPDATE accounts
SET balance = balance - :amount
WHERE account_id = :source_account;

UPDATE accounts
SET balance = balance + :amount
WHERE account_id = :target_account;

INSERT INTO transactions (...)
VALUES (...);

COMMIT;
```

These operations together form one transaction.

It would be incorrect to do this:

```text
UPDATE account A
COMMIT

UPDATE account B
COMMIT
```

because if the second operation fails, money would already have been removed from the first account.

Rule:

```text
business transaction
        =
transaction boundary
```

---

## 8. COMMIT, ROLLBACK, and SAVEPOINT

### COMMIT

`COMMIT` confirms the transaction.

```sql
COMMIT;
```

After a commit:

```text
changes become permanent
+
transaction locks are released
```

### ROLLBACK

`ROLLBACK` cancels uncommitted changes.

```sql
ROLLBACK;
```

### SAVEPOINT

A savepoint allows a partial rollback within a transaction.

```sql
SAVEPOINT before_payment;

UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

-- other operations

ROLLBACK TO before_payment;
```

The rest of the transaction can continue after the rollback to the savepoint.

---

## 9. Read consistency in Oracle

Oracle has a very important mechanism:

> **A `SELECT` sees a consistent image of the data.**

Assume two sessions.

### Session A

```sql
UPDATE accounts
SET balance = 900
WHERE account_id = 10;
```

but without:

```sql
COMMIT;
```

### Session B

executes:

```sql
SELECT balance
FROM accounts
WHERE account_id = 10;
```

Session B must not see Session A's uncommitted value.

Oracle reconstructs the appropriate earlier version of the data using **UNDO** when necessary.

Conceptually:

```text
Session A

1000 → UPDATE → 900
                 |
                 +-- uncommitted

Session B
    |
    +----------------------> 1000
```

This is one of the most important features of Oracle's concurrency model.

---

## 10. MVCC

The concept is called **Multi-Version Concurrency Control (MVCC)**.

Instead of readers normally being blocked by writers:

```text
writer changes data
reader reads a consistent version
```

The result, in normal situations, is:

```text
reader does not block writer
writer does not block reader
```

However:

```text
writer can block writer
```

when two transactions try to modify the same row.

---

## 11. Row locking

Assume:

### Session 1

```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Oracle acquires a **row-level lock** on the affected row.

If Session 2 executes:

```sql
UPDATE accounts
SET balance = balance + 50
WHERE account_id = 10;
```

Session 2 will wait.

Conceptually:

```text
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

When Session 1 executes either:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

the transaction ends and the lock is released.

---

## 12. Blocking

Blocking occurs when one transaction holds a lock that another transaction needs.

It is especially dangerous when an application behaves like this:

```text
BEGIN TRANSACTION
UPDATE
...
user waits 5 minutes
...
COMMIT
```

In an OLTP system, transactions should be:

> **as short as possible.**

Long transactions increase:

```text
blocking
lock contention
UNDO consumption
risk of deadlocks
```

---

## 13. Deadlocks

A deadlock occurs when:

```text
Transaction A
holds row 1
waits for row 2

Transaction B
holds row 2
waits for row 1
```

Conceptually:

```text
T1                            T2

LOCK Account A               LOCK Account B
      |                             |
      v                             v
WAIT Account B  <---------->  WAIT Account A
              deadlock
```

Oracle detects the situation and raises:

```text
ORA-00060: deadlock detected while waiting for resource
```

An important prevention technique is to make the application access resources in a consistent order.

For example, always lock or update:

```text
lower account_id first
then
higher account_id
```

---

## 14. Isolation levels

In Oracle, the most commonly used isolation level is:

```text
READ COMMITTED
```

and it is the default.

Under `READ COMMITTED`, each statement sees committed data as of the beginning of that statement.

Oracle also provides:

```text
SERIALIZABLE
```

which provides transaction-level consistency and attempts to provide behavior equivalent to serial execution. If Oracle detects that the transaction cannot be serialized, it may raise `ORA-08177`.

There is also:

```sql
SET TRANSACTION READ ONLY;
```

for transactions that need a consistent read-only view of the data.

In typical OLTP applications:

> **READ COMMITTED is the standard choice.**

---

## 15. Indexes in OLTP

Indexes are essential because OLTP workloads perform many selective lookups.

Example:

```sql
SELECT *
FROM accounts
WHERE account_id = :id;
```

If `account_id` is the primary key, the plan may contain:

```text
INDEX UNIQUE SCAN
```

which is very efficient for a single-row lookup.

For:

```sql
SELECT *
FROM transactions
WHERE account_id = :account_id
ORDER BY transaction_ts DESC;
```

an index such as this may be useful:

```sql
CREATE INDEX idx_transactions_account_ts
ON transactions (account_id, transaction_ts DESC);
```

The exact benefit depends on data distribution, query patterns, index design, and the execution plan.

---

## 16. Why we do not index everything

Every index must be maintained.

For an operation such as:

```sql
INSERT INTO transactions (...)
VALUES (...);
```

Oracle may need to update:

```text
table data
+
primary-key index
+
account_id index
+
transaction_ts index
+
other indexes
```

Therefore:

```text
more indexes
    ↓
SELECT may become faster
    ↓
INSERT / UPDATE / DELETE become more expensive
```

OLTP design requires balance.

---

## 17. Selectivity

An index is especially useful when a condition returns only a small fraction of the table.

A highly selective example is:

```sql
WHERE transaction_id = 123456
```

which may return:

```text
1 row out of 100 million
```

This is an excellent candidate for indexed access.

But:

```sql
WHERE status = 'ACTIVE'
```

may not benefit from an index if 90% of the rows are `ACTIVE`.

Oracle may prefer:

```text
TABLE ACCESS FULL
```

The optimizer decides based on statistics, estimated cardinality, cost, clustering, and other factors.

---

## 18. Foreign keys and indexes

In OLTP systems, it is frequently useful to index foreign-key columns.

For example:

```text
TRANSACTIONS.account_id
```

can be indexed as:

```sql
CREATE INDEX idx_transactions_account
ON transactions (account_id);
```

Potential benefits include:

```text
faster joins
faster child-row lookups
reduced locking issues in some parent-key update/delete scenarios
```

A foreign key does **not** automatically create an index in Oracle, so indexing foreign-key columns should be evaluated explicitly based on access and locking patterns.

---

## 19. Bind variables

Bind variables are extremely important in Oracle OLTP systems.

Instead of sending many SQL statements that differ only by literal values:

```sql
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

an application should normally use:

```sql
SELECT *
FROM accounts
WHERE account_id = :account_id;
```

Oracle can then reuse the parsed cursor more effectively.

Important benefits include:

```text
less hard parsing
lower CPU usage
less pressure on the shared pool
better cursor reuse
protection against SQL injection when binds are used correctly
```

In an OLTP system executing thousands of SQL statements per second, this is critical.

---

## 20. Typical OLTP execution plans

A very common OLTP plan looks like:

```text
SELECT STATEMENT
TABLE ACCESS BY INDEX ROWID ACCOUNTS
INDEX UNIQUE SCAN PK_ACCOUNTS
```

Read from the bottom up:

```text
INDEX UNIQUE SCAN
        ↓
find ROWID
        ↓
TABLE ACCESS BY INDEX ROWID
        ↓
return row
```

Another example:

```text
NESTED LOOPS
  TABLE ACCESS BY INDEX ROWID CUSTOMERS
    INDEX UNIQUE SCAN PK_CUSTOMERS

  TABLE ACCESS BY INDEX ROWID ACCOUNTS
    INDEX RANGE SCAN IDX_ACCOUNTS_CUSTOMER
```

This pattern is very characteristic of OLTP workloads:

```text
few rows
+
indexes
+
Nested Loops
```

---

## 21. Nested Loops in OLTP

Assume:

```sql
SELECT a.*
FROM customers c
JOIN accounts a
  ON a.customer_id = c.customer_id
WHERE c.customer_id = :id;
```

Oracle might execute:

```text
INDEX UNIQUE SCAN PK_CUSTOMERS
        ↓
1 customer
        ↓
NESTED LOOPS
        ↓
INDEX RANGE SCAN IDX_ACCOUNTS_CUSTOMER
```

If we have:

```text
1 customer
5 accounts
```

this can be very efficient.

In a DWH workload, if we process:

```text
10 million customers
100 million transactions
```

A **Hash Join** may be more appropriate.

---

## 22. Transactions must be short

An important OLTP rule is:

> **Do not keep transactions open longer than necessary.**

Bad pattern:

```text
UPDATE
  ↓
wait for user input
  ↓
30 seconds
  ↓
another UPDATE
  ↓
wait for user confirmation
  ↓
COMMIT
```

Better pattern:

```text
receive all required input
  ↓
begin transaction
  ↓
UPDATE
UPDATE
INSERT
  ↓
COMMIT
```

This keeps lock duration as short as possible.

---

## 23. COMMIT too often

The opposite extreme is also problematic.

For example:

```sql
FOR ... LOOP
    INSERT ...;
    COMMIT;
END LOOP;
```

can be very inefficient and may also break the intended business transaction.

If:

```text
100 INSERTs
```

form one logical business transaction, the normal pattern is:

```text
100 INSERTs

COMMIT
```

not:

```text
INSERT
COMMIT
INSERT
COMMIT
...
```

The transaction boundary should be determined by business meaning, not by an arbitrary row count.

---

## 24. OLTP and PL/SQL

PL/SQL is very useful for transactional business operations.

Example:

```sql
CREATE OR REPLACE PROCEDURE transfer_money (
    p_from_account IN NUMBER,
    p_to_account   IN NUMBER,
    p_amount       IN NUMBER
)
IS
BEGIN
    UPDATE accounts
    SET balance = balance - p_amount
    WHERE account_id = p_from_account;

    UPDATE accounts
    SET balance = balance + p_amount
    WHERE account_id = p_to_account;

    INSERT INTO transactions (
        transaction_id,
        account_id,
        amount,
        transaction_ts
    )
    VALUES (
        transaction_seq.NEXTVAL,
        p_from_account,
        -p_amount,
        SYSTIMESTAMP
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
/
```

Very important: the decision to issue:

```sql
COMMIT;
```

often belongs to the layer that controls the complete business transaction rather than to every internal procedure.

A production implementation should also validate insufficient funds, missing accounts, invalid amounts, and the number of rows affected by each DML statement.

---

## 25. Data integrity

In OLTP systems, the database should protect the data.

We should not rely only on the application.

Important mechanisms include:

```text
PRIMARY KEY
FOREIGN KEY
NOT NULL
UNIQUE
CHECK
```

For example:

```sql
status VARCHAR2(20) NOT NULL
    CHECK (status IN ('ACTIVE', 'BLOCKED', 'CLOSED'))
```

This ensures that even another program writing directly to the database cannot insert an invalid status value.

---

## 26. OLTP vs. OLAP / DWH

This is one of the most important contrasts to understand.

| Characteristic | OLTP | OLAP / DWH |
|---|---|---|
| Main purpose | Current business operations | Analysis and reporting |
| Data | Mostly current operational data | Large volumes of current and historical data |
| Rows processed per query | Usually few | Often thousands to millions or more |
| Data model | Usually normalized | Often dimensional / denormalized |
| Index usage | Very important for selective access | Important, but large scans are also common |
| Typical join | Nested Loops for selective access | Hash Join often common for large sets |
| Full table scans | Often undesirable for point lookups | Often normal and efficient |
| Parallelism | Usually limited | Often useful |
| Concurrency | Usually very high | Typically lower transactional contention |

Example OLTP query:

```sql
SELECT balance
FROM accounts
WHERE account_id = :id;
```

Example OLAP query:

```sql
SELECT
    region,
    product_category,
    SUM(amount)
FROM fact_sales
WHERE sale_date >= DATE '2025-01-01'
  AND sale_date <  DATE '2026-01-01'
GROUP BY
    region,
    product_category;
```

The first query might read:

```text
1 row
```

while the second might process:

```text
100 million rows
```

This is why the same SQL strategy cannot be optimal for both workloads.

---

## 27. OLTP → ETL → DWH

A useful general model is:

```text
OLTP
 |
 +-- Customers
 +-- Accounts
 +-- Transactions
 |
 v
STAGING
 |
 v
ETL / ODI
 |
 +-- Validation
 +-- Transformations
 +-- Reference-data checks
 |
 v
DWH
 |
 +-- Dimensions
 +-- Facts
 |
 v
OLAP / BI / Reports
```

OLTP answers questions such as:

> What is the account balance now?

A DWH answers questions such as:

> How have corporate-customer balances evolved by region over the last three years?

---

## 28. Complete example: bank transfer

Assume:

```text
Account A = 1000
Account B = 500
```

We transfer:

```text
100
```

A simplified transaction could be:

```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 20;

INSERT INTO transactions (
    transaction_id,
    account_id,
    amount,
    transaction_ts
)
VALUES (
    transaction_seq.NEXTVAL,
    10,
    -100,
    SYSTIMESTAMP
);

INSERT INTO transactions (
    transaction_id,
    account_id,
    amount,
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

```text
Account A = 900
Account B = 600
```

Oracle must simultaneously support:

```text
Atomicity
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

This apparently simple operation brings together most of the essential OLTP concepts.

---

## 29. What to check for OLTP performance

For an OLTP SQL statement, one of the main questions is often:

```text
How many rows do I actually need to find?
```

If the answer is:

```text
1
5
10
100
```

and the table contains:

```text
50 million rows
```

we often expect selective access such as:

```text
index access
```

rather than an unnecessary:

```text
full table scan
```

A healthy execution profile may look conceptually like:

```text
INDEX UNIQUE / RANGE SCAN
        ↓
TABLE ACCESS BY INDEX ROWID
        ↓
NESTED LOOPS
        ↓
few rows returned
```

This is not an absolute rule: Oracle may still choose a full scan when statistics and cost estimates make it cheaper.

---

## 30. Important OLTP anti-patterns

The following situations should be recognized quickly:

```text
SELECT * when all columns are not required

functions on indexed columns without a matching function-based index:
WHERE UPPER(code) = ...

transactions kept open for too long

COMMIT after every row

excessive or unnecessary indexes

missing indexes on columns used constantly for selective lookup

SQL without bind variables

updates affecting millions of rows during peak hours

heavy analytical queries executed directly against OLTP tables

locking resources in inconsistent order

leaving all integrity enforcement exclusively to the application
```

---

## 32. Memorization scheme

If you want to retain OLTP as one mental model:

```text
OLTP
 |
 +----------------------+----------------------+
 |                      |                      |
DATA                TRANSACTIONS           PERFORMANCE
 |                      |                      |
PK / FK                 ACID                  Indexes
Constraints             COMMIT                Selectivity
Normalization           ROLLBACK              Nested Loops
                        SAVEPOINT              Bind variables
                           |
                       CONCURRENCY
                           |
                   +-------+-------+
                   |               |
                  UNDO            LOCKS
                   |               |
            Read consistency   Row locking
                   |               |
                  MVCC          Blocking
                                   |
                                Deadlocks
```

The central idea is:

> **OLTP in Oracle = short transactions + consistent data + high concurrency + highly selective access to a small number of rows.**

The fundamental contrast to remember is:

```text
OLTP
few rows + indexes + Nested Loops + short transactions

vs.

DWH / OLAP
many rows + scans + Hash Joins + aggregations + parallelism
```

---

## Questions and answers

### What characterizes an OLTP system?

A strong compact answer is:

> An OLTP system is optimized for a high volume of short, concurrent transactions, typically involving `INSERT`, `UPDATE`, `DELETE`, and highly selective `SELECT` statements. The data model is generally normalized and uses primary keys, foreign keys, and integrity constraints. Performance relies heavily on selective indexes, bind variables, and access to a small number of rows, often through Nested Loops. In Oracle, concurrency is managed using row-level locking, UNDO, and read consistency through MVCC, allowing readers and writers to block each other as little as possible. Transaction boundaries should follow the business operation, with `COMMIT` or `ROLLBACK` applied to the complete logical unit of work.

---

### How would you briefly explain OLTP to a colleague who knows SQL but not this area?

OLTP covers highly concurrent transactional workloads, normalized data models, referential integrity, short transactions, and selective indexed access. In practice, I first identify what data enters the process and what result is required, then I check the implementation, execution plan, transaction boundaries, locking behavior, and the effect on the overall business flow.

### What are two common practical OLTP problems?

Two recurring problems are incorrect transaction or data interpretation and performance degradation at real production volume. In OLTP systems, I pay particular attention to concurrency, transaction boundaries, normalized models, referential integrity, selective indexes, and whether the SQL still behaves correctly and efficiently under realistic load.

### How do you check that the result is correct and not merely fast?

I compare row counts, amounts, keys, and business totals with the source or a known reference result. I test `NULL` values, duplicates, boundary conditions, and exceptional cases. Only after validating correctness do I evaluate elapsed time, resource consumption, locking, and the execution plan.

### What information do you collect before modifying an existing OLTP solution?

I collect the functional requirement, data grain, schema and keys, expected volume, data distribution, dependencies, execution plans, timings, known errors, logging information, concurrency requirements, and acceptance criteria. I also identify how to roll back the change safely if necessary.

### Give an example of a DWH or banking flow where OLTP concepts affect the design.

In a banking flow, OLTP design interacts directly with logging, auditing, reconciliation, data lineage, and impact analysis. A transfer must be atomic and auditable in the source system, while downstream ETL and DWH processes must preserve enough information to reconcile the resulting balances and transaction history.
