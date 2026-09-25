---
title: 'C03. Transactions and Concurrency'
description: 'Complete English handbook chapter based on the original C03 course.'
sidebar_position: 3
---

# C03. Transactions and Concurrency

<div className="chapter-kicker">Chapter C03 · Complete course</div>

This chapter provides a concise but comprehensive course on **Oracle transactions and concurrency**, covering ACID, transaction boundaries, SCN, UNDO/REDO, MVCC, read consistency, locking and deadlocks, isolation levels, and practical PL/SQL patterns.

## 3. Transactions and Concurrency

## 1. What is a transaction

A **transaction** is a logical unit of work made up of one or more SQL operations to be treated together.

Classic example: bank transfer.

```sql
UPDATE accounts
SET balance = balance - 1000
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 1000
WHERE account_id = 20;

COMMIT;
```

The two `UPDATE` statements represent the same logical operation.

We don't want the situation:

```
Account 10: -1000
Account 20: + 0
```

The changes are therefore committed together by:

```sql
COMMIT;
```

or cancelled together by:

```sql
ROLLBACK;
```

---

## 2. ACID properties

A transaction complies with the principles of **ACID**.

### Atomic

A transaction should be:

> all or nothing.

If the transfer contains two operations:

```sql
UPDATE source_account ...
UPDATE destination_account ...
```

and the second fails, the application can do:

```sql
ROLLBACK;
```

to cancel the first modification.

---

### Consistency

The transaction must leave the database in a valid state.

For example:

```sql
ALTER TABLE accounts
ADD CONSTRAINT chk_balance
CHECK (balance >= 0);
```

Oracle does not allow an operation to complete if it violates the constraint.

---

### Isolation

Competitive transactions must not produce inconsistent results.

If:

```
Session A
Session B
```

change the same data, Oracle controls access by:

- MVCC;
- UNDO;
- row locks;
- isolation levels.

---

### Durability

After:

```sql
COMMIT;
```

Committed changes must survive a database or system failure.

A key role is **REDO**.

---

## 3. When a transaction begins and ends

In Oracle we don't usually write:

```sql
BEGIN TRANSACTION;
```

as in some other DBMS products.

A transaction begins implicitly when the first DML statement is executed:

```sql
INSERT
UPDATE
DELETE
MERGE
```

Example:

```sql
UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 50;
```

From that moment on, there is an active transaction.

It ends by:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

---

## 4. COMMIT

COMMIT confirms the transaction.

```sql
UPDATE employees
SET salary = salary + 500
WHERE employee_id = 100;

COMMIT;
```

After COMMIT:

- the changes become final;
- the other sessions may see them;
- transaction locks are released;
- The they can no longer be rolled back.

Important:

```sql
COMMIT;
```

does not necessarily mean:

> All the data blocks were immediately written in the datafiles.

Durability is primarily guaranteed by the REDO mechanism.

---

## 5. ROLLBACK

`ROLLBACK` cancels uncommitted changes.

```sql
UPDATE employees
SET salary = salary * 10;

ROLLBACK;
```

After rollback, the data returns to its state before the transaction changes.

Oracle can do that because of the information stored in **UNDO**.

---

## 6. SAVEPOINT

`SAVEPOINT` allows a partial rollback within a transaction.

```sql
UPDATE employees
SET salary = salary + 100
WHERE department_id = 10;

SAVEPOINT dept10_done;

UPDATE employees
SET salary = salary + 200
WHERE department_id = 20;
```

If we only want to cancel the second update:

```
ROLLBACK TO dept10_done;
```

The first UPDATE remains active in the transaction.

Then we can do:

```sql
COMMIT;
```

---

## 7. UNDO and REDO

It is important not to confuse them.

### UNDO

Simplified, UNDO describes:

> how Oracle can reconstruct the previous state.

Example:

```
Salary = 5000

UPDATE:
salary = 6000
```

Oracle retains enough information to reconstruct:

```
Salary = 5000
```

UNDO is used for:

- ROLLBACK;
- read consistency;
- consistent reads;
- recovery in certain situations.

---

### REDO

REDO records changes made to the database.

It is mainly used for:

> recovery.

Simplified:

```
UNDO - how to reconstruct the previous state
REDO - how to replay the change
```

It's a pedagogical simplification, but very useful.

---

## 8. SCN - System Change Number

Oracle uses **SCN** to logically order changes in the database.

Think of SCN as some kind of:

> internal logical clock of the database.

Simplified:

```
SCN 100
SCN 101
SCN 102
SCN 103
```

Transactions and operations are associated with such logical points.

SCN is extremely important for:

- read consistency;
- recovery,
- Flashback,
- Data Guard;
- internal synchronization of changes.

---

## 9. The fundamental concurrency problem

Assume two sessions.

### Session A

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

result:

```
5000
```

Then:

```sql
UPDATE employees
SET salary = 6000
WHERE employee_id = 100;
```

but without:

```sql
COMMIT;
```

---

### Session B

execute:

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

The question is:

```
Does Session B see 5000 or 6000?
```

It will normally see:

```
5000
```

Because Session A's change has not yet been committed.

This is one of the fundamental ideas of Oracle concurrency.

---

## 10. MVCC = Multi-Version Concurrency Control

Oracle uses an **MVCC** model.

The idea is:

> readers can see a consistent version of the data, even if another session changes it.

Suppose:

```
Initial value = 5000
```

Session A:

```sql
UPDATE employees
SET salary = 6000
WHERE employee_id = 100;
```

Session B executes:

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

Oracle can rebuild the previous version:

```
5000
```

using information from **UNDO**.

---

## 11. Oracle: readers don't block writers

One of the most important Oracle principles:

> Readers don't block writers.

A:

```sql
SELECT
```

normally does not block an:

```sql
UPDATE
```

on the same data.

And normally:

> Writers don't block readers.

An uncommitted `UPDATE` does not normally prevent a simple `SELECT`.

The reader sees a consistent version using UNDO.

---

## 12. Writers can block writers

The situation differs between two DML operations.

Session A:

```sql
UPDATE employees
SET salary = 6000
WHERE employee_id = 100;
```

Without committing.

Session B:

```sql
UPDATE employees
SET salary = 7000
WHERE employee_id = 100;
```

Session B will wait.

Reason:

Session A holds a **row lock** on that row.

The situation is:

```
Session A
   |
+ -- LOCK employee_id = 100

Session B
   |
+ -- WAIT
```

After:

```sql
COMMIT;
```

or:

```sql
ROLLBACK;
```

After Session A commits or rolls back, Session B can continue.

---

## 13. Row locks

When Oracle changes a row:

```sql
UPDATE employees
SET salary = salary + 100
WHERE employee_id = 100;
```

that row is protected from conflicting changes by another transaction.

Very important:

Oracle does not normally lock the entire table just because one row was modified.

If Session A modifies:

```
employee_id = 100
```

Session B may modify:

```
employee_id = 101
```

without waiting.

---

## 14. TX and TM locks

When troubleshooting concurrency, you will frequently encounter two lock types.

### TX

TX represents a transaction-related enqueue.

It is commonly involved in:

```
row lock contention
```

For example:

```
Session A UPDATE row X
Session B UPDATE row X
```

Session B may wait on a TX enqueue.

---

### TM

TM is associated with the object or table affected by DML.

A:

```sql
UPDATE employees
SET salary = salary + 100
WHERE employee_id = 100;
```

also acquires a TM lock related to the `EMPLOYEES` object.

TM locks are important including in situations related to:

- DML;
- foreign keys;
- DDL;
- concurrency between operations on database objects.

---

## 15. Statement-level consistency

Oracle guarantees that a statement sees a consistent image of the data.

Example:

```sql
SELECT SUM(amount)
FROM transactions;
```

If the query lasts 30 seconds and other sessions change the table at that time, Oracle does not arbitrarily calculate:

```
half of the data before changes
+
half after changes
```

The query is evaluated against a consistent point in time.

The concept is called:

> statement-level read consistency.

---

## 16. Read consistency and UNDO

Suppose a query starts at:

```
SCN 5000
```

During execution, other transactions may change data.

Oracle may have the current value in the data block:

```
6000
```

but the query needs the value corresponding to its consistent point:

```
5000
```

Oracle uses UNDO to rebuild the required version.

Conceptual:

```
Current block
     |
     v
UNDO
     |
     v
older version
     |
     v
consistent result
```

---

## 17. ORA-01555: snapshot too old

The previous concept explains one of the famous Oracle errors:

```
ORA-01555: snapshot too old
```

Typical scenario:

- very long query;
- many competing changes;
- Oracle needs old versions of UNDO;
- that information is no longer available.

Simplified:

```
query started
    |
♪ A long time ♪
query still needs an older version

old UNDO version
overwritten / reused
```

Oracle can no longer reconstruct the consistent image required by the query.

---

## 18. Isolation levels

Oracle supports several transaction isolation modes.

The important ones for the course are:

```
READ COMMITTED
SERIALIZABLE
READ ONLY
```

---

## 19. READ COMMITTED

This is Oracle's default isolation level.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

Each statement sees committed data as of the beginning of that statement.

Example:

Session A:

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

result:

```
5000
```

Session B:

```sql
UPDATE
SET salary = 6000
WHERE employee_id = 100;

COMMIT;
```

Session A again runs:

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

can see:

```
6000
```

Therefore, two `SELECT` statements in the same transaction can see different committed values.

---

## 20. SERIALIZABLE

We can ask:

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

Oracle provides a transaction-level consistent view based on the start of the serializable transaction.

Conceptual example:

```
Transaction A starts

Salary = 5000
```

Session B changes the row:

```
salary = 6000
COMMIT
```

Session A can continue to see its earlier consistent view.

If A tries to modify data that has changed in the meantime, it may occur:

```
ORA-08177:
can't serialize access for this transaction
```

---

## 21. READ ONLY

We can declare:

```sql
SET TRANSACTION READ ONLY;
```

The transaction gets a consistent view for queries and does not allow normal DML.

Very useful conceptually for:

- reports;
- analytical processes;
- extracts that need a consistent logical image.

---

## 22. SELECT FOR UPDATE

Sometimes we want to say:

> I am reading this row because I intend to update it.

Then we can use:

```sql
SELECT salary
FROM employees
WHERE employee_id = 100
FOR UPDATE;
```

This acquires a row lock.

Example:

```sql
SELECT balance
INTO v_balance
FROM accounts
WHERE account_id = 10
FOR UPDATE;
```

then:

```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

---

## 23. NOWAIT

If we don't want to wait after a lock:

```sql
SELECT *
FROM accounts
WHERE account_id = 10
FOR UPDATE NOWAIT;
```

If the row is already locked, Oracle returns an error immediately instead of waiting.

It is very useful for applications that want to deal explicitly with conflicts.

---

## 24. SKIP LOCKED

Very useful for concurrent processing:

```sql
SELECT *
FROM job_queue
WHERE status = 'READY'
FOR UPDATE SKIP LOCKED;
```

If some rows are already locked by another worker, Oracle skips them.

Example:

```
Worker 1
job 1
job 2

Worker 2
job 3
job 4
```

so Worker 2 does not wait for Worker 1.

It's a very useful pattern for:

- queue processing;
- batch processing;
- parallel workers.

---

## 25. Blocking sessions

Suppose:

Session A:

```sql
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

Without committing.

Session B:

```sql
UPDATE accounts
SET balance = balance + 200
WHERE account_id = 10;
```

B will wait.

We say:

```
A = blocker
B = waiter
```

or:

```
blocking session
waiting session
```

---

## 26. Deadlock

Normal blocking is not the same as a deadlock.

Example:

Session A:

```sql
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 1;
```

Session B:

```sql
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 2;
```

Then A:

```sql
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 2;
```

Session A waits for Session B.

But B runs:

```sql
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 1;
```

Now we have:

```text
A holds row 1
A waits for row 2

B holds row 2
B waits for row 1
```

I mean:

```
A ------- B.
^      |
|      v
+------+
```

This is a **deadlock**.

Oracle detects the cycle and raises:

```
ORA-00060: deadlock detected while waiting for resource
```

---

## 27. Deadlock prevention

One of the most important rules:

> Access resources in the same order.

Problem:

Transaction A:

```
lock account 1
lock account 2
```

Transaction B:

```
lock account 2
lock account 1
```

Safer:

```
A: 1 → then 2
B: 1 → then 2
```

This greatly reduces the possibility of deadlocks.

---

## 28. Lost update

We assume value:

```
Balance = 1000
```

Read:

```
1000
```

B reads:

```
1000
```

Calculate:

```
1000 + 100 = 1100
```

B calculates:

```
1000 + 200 = 1200
```

If the application writes back stale calculated values:

```sql
UPDATE accounts
SET balance = 1100
WHERE account_id = 1;
```

then:

```sql
UPDATE accounts
SET balance = 1200
WHERE account_id = 1;
```

A's modification may be lost.

That is why it is often preferable:

```sql
UPDATE accounts
SET balance = balance + 100
WHERE account_id = 1;
```

for:

```sql
UPDATE accounts
SET balance = :calculated_value
WHERE account_id = :account_id;
```

when such an atomic update matches the business logic.

---

## 29. Optimistic locking

A common application pattern is:

```
version_number
```

Example:

```
account_id = 10
Balance = 1000
version_no = 7
```

The application reads version 7.

Update:

```sql
UPDATE accounts
SET balance = 1200,
version_no = version_no + 1
WHERE account_id = 10
AND version_no = 7;
```

If `SQL%ROWCOUNT = 0`, that means another session changed the row first.

This is a form of:

> optimistic concurrency control.

---

## 30. Pessimistic locking

Instead of detecting a conflict later, we can lock the row before updating it.

```sql
SELECT *
FROM accounts
WHERE account_id = 10
FOR UPDATE;
```

This model is called:

> Pessimistic locking.

The comparison is:

```
Optimistic:
assume there will be no conflict
detect conflict at UPDATE

Pessimistic:
lock the resource in advance
```

---

## 31. Long-running transactions and locks

One of the most dangerous things in an Oracle application:

```sql
UPDATE
↓
user waits for 5 minutes
↓
COMMIT
```

In all that time, another transaction can be blocked.

A good transaction should be:

> as short as possible.

Good pattern:

```
read required data
perform logical preparation
begin transaction changes
UPDATE
UPDATE
COMMIT
```

No:

```sql
UPDATE
external API call
sleep
user confirmation
another API
COMMIT
```

---

## 32. COMMIT too often

The opposite extreme is also problematic.

Bad example:

```
FOR r IN (...) LOOP

UPDATE...

COMMIT;

END LOOP;
```

If you process 1,000,000 rows, you could produce 1,000,000 commits.

Problems:

- overhead;
- performance;
- artificially fragmented business transactions;
- more difficult recovery;
- risk of partial results.

A better approach is to commit at the level of a:

```
logical batch
```

For example, commit at the boundary of a logical unit of work.

---

## 33. DDL and implicit COMMIT

You need to know that DDL operations behave differently than DML.

Examples:

```sql
CREATE TABLE
ALTER TABLE
DROP TABLE
TRUNCATE
```

Oracle performs implicit commits around DDL statements.

That's why you don't have to treat:

```sql
CREATE TABLE...
```

like a rollbackable DML statement.

For example, you don't have to rely on:

```sql
CREATE TABLE test (...);

ROLLBACK;
```

to make the table disappear.

---

## 34. Autonomous transactions

In PL/SQL, an autonomous transaction is declared with:

```
PRAGMA AUTONOMOUS_TRANSACTION;
```

This creates a transaction independent of the calling transaction.

Classic example: logging.

```sql
CREATE OR REPLACE PROCEDURE log_error (
p_message VARCHAR2
)
IS
PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN

INSERT INTO error_log (
log_date,
message
)
VALUES (
SYSDATE,
p_message
);

COMMIT;

END;
/
```

The main program can execute:

```sql
ROLLBACK;
```

but the log entry remains because the autonomous transaction issued its own:

```sql
COMMIT;
```

---

## 35. Why autonomous transactions should be used with care

Example:

```
main transaction
    |
+ -- changes account
    |
+ -- autonomous procedure
            |
+ -- Commit
```

An autonomous transaction should not be confused with:

> a partial commit of the main transaction.

It's a completely separate transaction.

Excessive use may complicate:

- consistency;
- debugging;
- locking behavior;
- application logic.

A common appropriate use case is independent logging.

---

## 36. Correct PL/SQL transaction example

```sql
BEGIN
    UPDATE accounts
    SET balance = balance - 100
    WHERE account_id = 10;

    UPDATE accounts
    SET balance = balance + 100
    WHERE account_id = 20;

    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/
```

The logic is:

```
success
   |
+ --

failure
   |
+ --
   |
+ --
```

`RAISE` propagates the original exception to the caller.

---

## 37. A more realistic pattern with SAVEPOINT

```sql
BEGIN
    UPDATE batch_control
    SET status = 'RUNNING'
    WHERE batch_id = 100;

    SAVEPOINT batch_started;

    BEGIN
        UPDATE fact_sales
        SET processed_flag = 'Y'
        WHERE batch_id = 100;

    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK TO batch_started;
            RAISE;
    END;

    COMMIT;
END;
/
```

This allows more precise control over which part of the transaction is rolled back.

---

## 38. Essential exercise: two DataGrip sessions

To really understand concurrency, the best lab is with two consoles.

Open:

```
Session A
Session B
```

### Session A

```sql
UPDATE employees
SET salary = salary + 100
WHERE employee_id = 100;
```

Do not commit yet.

---

### Session B

```sql
SELECT salary
FROM employees
WHERE employee_id = 100;
```

Notice that the `SELECT` still works.

Then:

```sql
UPDATE employees
SET salary = salary + 200
WHERE employee_id = 100;
```

Now Session B will wait.

---

### Session A

execute:

```sql
COMMIT;
```

Session B will continue.

This experiment demonstrates simultaneously:

```
MVCC
read consistency
reader vs. writer
writer vs. writer
row locking
COMMIT
```

It is worth repeating this experiment a few times.

---

## 39. Mental model to remember

You can summarize Oracle's concurrency as follows:

```
Oracle concurrency
                          |
          +---------------+---------------+
          |                               |
READERS WRITERS
          |                               |
          v                               v
MVCC  LOCKS
          |                               |
          v                               v
consistent read TX / TM Locks
          |
          v
UNDO
```

and above all:

```
SCN
```

establishes the logical ordering of database changes.

---

## Questions and answers

For an Oracle / Data Developer role, I would consider it mandatory to be able to explain fluently:

- what is a transaction and ACID;
- COMMIT, ROLLBACK, SAVEPOINT;
- the difference between **UNDO and REDO**;
- what **SCN** is;
- how **works read consistency**;
- what **MVCC** is;
- why a `SELECT` is not usually blocked by an `UPDATE`;
- why two `UPDATE` statements on the same row can block each other;
- row locks, TX and TM;
- blocking session versus deadlock;
- ORA-00060;
- READ COMMITTED versus SERIALIZABLE;
- SELECT... FOR UPDATE;
- NOWAIT and SKIP LOCKED;
- transactions that remain open too long;
- committing too often;
- PRAGMA AUTONOMOUS_TRANSACTION

A very good form for review would be:

> **Oracle uses multi-version concurrency control and UNDO-based read consistency. Readers normally do not block writers, and writers normally do not block readers. Concurrent writers may block each other when they modify the same rows. Oracle uses row-level locking and reconstructs older block versions from UNDO to provide consistent reads.

This phrase focuses a very large part of the philosophy of Oracle concurrency.

A natural next step would be a complete two-session DataGrip lab using `V$SESSION`, blocking sessions, TX/TM locks, `FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, and an intentionally generated deadlock.

---

## Questions and answers

### How would you briefly explain Oracle transactions and concurrency to a colleague who knows SQL?

Oracle transactions and concurrency cover ACID properties, transaction boundaries, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, UNDO, REDO, SCN, MVCC, locking, and isolation levels. In practice, I first identify the transaction boundary and expected consistency, then verify locking behavior, error handling, and performance implications.

### What are two common practical problems related to Oracle transactions and concurrency?

Two recurring problems are incorrect transaction boundaries and concurrency issues such as blocking or deadlocks. I explicitly verify ACID requirements, `COMMIT`/`ROLLBACK` behavior, locking order, isolation level, and whether UNDO and REDO behavior matches the workload.

### How do you check that the result is correct and not just fast?

I compare row counts, amounts, and keys with the source or a reference result; I test NULLs, duplicates, boundary conditions, and batch reruns. Only then do I evaluate execution time, resource usage, and locking behavior.

### What information did you collect before you modified an existing solution?

I collect the functional requirement, transaction boundary, schema and keys, volume, data distribution, dependencies, execution plans and timings, errors/logs, locking behavior, and acceptance criteria. I also document the rollback strategy.

### Give an example of a DWH or banking flow where this concept changes design.

A banking batch updates account balances and must restart safely after an error without duplicating or losing changes.
