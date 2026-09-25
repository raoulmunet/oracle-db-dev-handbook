---
title: 'C03. Transactions and Concurrency'
description: 'Complete English handbook chapter based on the original C03 course.'
sidebar_position: 3
---

# C03. Transactions and Concurrency

<div className="chapter-kicker">Chapter C03 · Complete course</div>

Below you have a short but sufficiently comprehensive course for **3. Transactions and competition Oracle**, built on the structure of the Concepts Oracle DB, ACID, Transaction boundaries, SCN, UNDO/REDO, MVCC, read consistency, locking / deadlocks, isolation levels and practical part PL/SQL.

# 3. Transactions and Oracle Competition

## 1. What is a transaction

A **transaction** is a logical unit of work made up of one or more SQL operations to be treated together.

Classic example: bank transfer.

```
UPDATE accounts
SET balance = balance - 1000
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 1000
WHERE account_id = 20;

COMMIT;
```

The two UPDATE-uri represent the same logical operation.

We don't want the situation:

```
Account 10: -1000
Account 20: + 0
```

The changes are therefore confirmed together by:

```
COMMIT;
```

or cancelled together by:

```
ROLLBACK;
```

---

# 2. ACID Properties

A transaction complies with the principles of **ACID**.

## Atomic

The transaction is:

> everything or nothing.

If the transfer contains two operations:

```
UPDATE cont_sursa...
UPDATE cont_destinatie...
```

and the second fails, the application can do:

```
ROLLBACK;
```

to cancel the first modification.

---

## Consistency

The transaction must leave the database in a valid state.

For example:

```
ALTER TABLE accounts
ADDQ1QX chk_balance
CHECK (balance = 0);
```

The Oracle does not allow the completion of an operation that violates the rule.

---

## Isolation

Competitive transactions must not produce inconsistent results.

If:

```
Session A
Session B
```

change the same data, Oracle controls access by:

- MVCC;
- UNDO;
- the row locks,
- isolation levels.

---

## Durability

After:

```
COMMIT;
```

Confirmed changes must survive a possible failure of the court.

A key role is **REDO**.

---

# 3. When a transaction begins and ends

In Oracle we don't usually write:

```
BEGIN TRANSACTION;
```

as in other DBMS-uri.

A transaction begins by default when performing the first DML operation:

```
INSERT
UPDATE
DELETE
MERGE
```

Example:

```
UPDATE
SET salary = salary * 1.10
WHERE department_id = 50;
```

From that moment on, there is an active transaction.

It ends by:

```
COMMIT;
```

or:

```
ROLLBACK;
```

---

# 4.COMMIT

COMMIT confirms the transaction.

```
UPDATE
SET salary = salary + 500
WHERE employee_id = 100;

COMMIT;
```

After COMMIT:

- the changes become final;
- the other sessions may see them;
- the transaction locations are released;
- The Oracle can no longer make ROLLBACK on them.

Important:

```
COMMIT;
```

does not necessarily mean:

> All the data blocks were immediately written in the datafiles.

Sustainability is primarily guaranteed by the REDO mechanism.

---

# 5.ROLLBACK

ROLLBACK cancels unconfirmed changes.

```
UPDATE
SET salary = salary * 10;

ROLLBACK;
```

After rollback, the data returns to the pre-trade status.

Oracle can do that because of the information stored in **UNDO**.

---

# 6. SAVEPOINT

SAVEPOINT allows partial rollback.

```
UPDATE
SET salary = salary + 100
WHERE department_id = 10;

SAVEPOINT dept10_done;

UPDATE
SET salary = salary + 200
WHERE department_id = 20;
```

If we only want to cancel the second update:

```
ROLLBACK TO dept10_done;
```

The first UPDATE remains active in the transaction.

Then we can do:

```
COMMIT;
```

---

# 7. UNDO and REDO

It's very important that you don't confuse them.

## UNDO

UNDO describes, simplified:

> how I can go back to my previous value.

Example:

```
Salary = 5000

UPDATE:
salary = 6000
```

The Oracle shall retain sufficient information to enable it to rebuild:

```
Salary = 5000
```

UNDO is used for:

- ROLLBACK;
- read consistency,
- consistent reads;
- recovery in certain situations.

---

## REDO

REDO describes the changes made to the database.

It is mainly used for:

> recovery.

Simplified:

```
UNDO - How do I get back
REDO - How to Remake Modification
```

It's a pedagogical simplification, but very useful.

---

# 8. SCN - System Change Number

Oracle uses **SCN** to logically order changes in the database.

Think of SCN as some kind of:

> Internal logic clock of the database.

Simplified:

```
SCN 100
SCN 101
SCN 102
SCN 103
```

Transactions and operations are associated with such logical points.

SCN is extremely important for:

- read consistency,
- recovery,
- Flashback,
- Data Guard;
- internal synchronisation of changes.

---

# 9. The fundamental problem of competition

We're assuming two sessions.

## Session A

```
SELECT salary
FROM
WHERE employee_id = 100;
```

result:

```
5000
```

Then:

```
UPDATE
SET salary = 6000
WHERE employee_id = 100;
```

but without:

```
COMMIT;
```

---

## Session B

execute:

```
SELECT salary
FROM
WHERE employee_id = 100;
```

The question is:

```
Does he see 5000 or 6000?
```

He'll normally see:

```
5000
```

Because A's modification has not yet been confirmed.

This is one of the fundamental ideas of the Oracle.

---

# 10. MVCC = Multi-Version Competition Control

Oracle uses an **MVCC** competition model.

The idea:

> readers can see a consistent version of the data, even if another session changes it.

Suppose:

```
Initial value = 5000
```

Session A:

```
UPDATE
SET salary = 6000
WHERE employee_id = 100;
```

Session B executes:

```
SELECT salary
FROM
WHERE employee_id = 100;
```

Oracle can rebuild the previous version:

```
5000
```

using information from **UNDO**.

---

# 11. Oracle: Readers don't block writers

One of the most important Oracle principles:

> Readers don't block writers.

One:

```
SELECT
```

normal does not block a:

```
UPDATE
```

on the same dates.

And normally:

> Writers don't block readers.

An unconfirmed UPDATE does not automatically prevent a simple SELECT.

The reader sees a consistent version using UNDO.

---

# 12. Writers can block writers

The situation differs between two DML operations.

Session A:

```
UPDATE
SET salary = 6000
WHERE employee_id = 100;
```

No comment.

Session B:

```
UPDATE
SET salary = 7000
WHERE employee_id = 100;
```

Session B will wait.

Reason:

Session A holds an **row lock** for that row.

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

```
COMMIT;
```

or:

```
ROLLBACK;
```

In Session A, Session B can continue.

---

# 13. Row Locks

When Oracle changes a line:

```
UPDATE
SET salary = salary + 100
WHERE employee_id = 100;
```

that row is protected against any change in competition from another transaction.

Very important:

Oracle doesn't normally block the entire table just because you modified a line.

If A amends:

```
employee_id = 100
```

B may amend:

```
employee_id = 101
```

without waiting.

---

# 14. TX and TM locks

At troubleshooting you will frequently meet two types.

## TX

TX represents the location associated with the transaction.

He is very often involved in:

```
row lock content
```

For example:

```
Session A UPDATE row X
Session B UPDATE row X
```

Session B can get to wait on an TX lock.

---

## TM

TM is associated with the object / table affected by DML.

One:

```
UPDATE employees...
```

produce and locking relevant to the EMPLOYEES object.

TM locks are important including in situations related to:

- DML;
- foreign keys,
- DDL;
- competition between operations on objects.

---

# 15. Statement consistency

The Oracle guarantees that a statement sees a consistent picture of the data.

Example:

```
SELECT SUM (amount)
FROM transactions;
```

If the query lasts 30 seconds and other sessions change the table at that time, Oracle does not arbitrarily calculate:

```
half of the data ahead
+
half after changes
```

The query is evaluated against a consistent point.

The concept is called:

> statement-level read consistency.

---

# 16. Read consistency and UNDO

Suppose a query starts at:

```
SCN 5000
```

During the execution, other transactions exchange data.

The Oracle may have the current value in block:

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

# 17. ORA-01555 = Snapshot Too Old

The previous concept explains one of the famous Oracle errors:

```
ORA-01555: snapshot too old
```

Typical script:

- very long query;
- many competing changes;
- Oracle needs old versions of UNDO;
- that information is no longer available.

Simplified:

```
query started
    |
♪ A long time ♪
old needs version

UNDO old version
- ♪ Overwritten ♪
```

The Oracle can no longer rebuild the consistent image required for the query.

---

# 18. Isolation levels

Oracle supports several relevant ways of isolation.

The important ones for the course are:

```
READ COMMITTED
SERIALIZABLE
READ ONLY
```

---

# 19. READ COMMITTED

It's the normal / default level.

```
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

Each station sees the confirmed data before the beginning of that station.

Example:

Session A:

```
SELECT salary
FROM
WHERE employee_id = 100;
```

result:

```
5000
```

Session B:

```
UPDATE
SET salary = 6000
WHERE employee_id = 100;

COMMIT;
```

Session A again runs:

```
SELECT salary
FROM
WHERE employee_id = 100;
```

can see:

```
6000
```

So two SELECT-s in the same transaction can see different values.

---

# 20. SERIALIZABLE

We can ask:

```
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

Oracle tries to give the transaction a consistent view corresponding to the start of the transaction.

Conceptual example:

```
Transaction A starts

Salary = 5000
```

B amends:

```
salary = 6000
COMMIT
```

May continue to work logically with the previous image.

If A tries to modify data that has changed in the meantime, it may occur:

```
ORA-08177:
can serialize access for this translation
```

---

# 21. READ ONLY

We can declare:

```
SET TRANSACTION READ ONLY;
```

The transaction receives a consistent image for queries and does not allow normal DML.

Very useful conceptually for:

- reports;
- analytical processes;
- Extractions that need to see the same logical image.

---

# 22. SELECT FOR UPDATE

Sometimes we want to say:

> I read this line because I intend to change it.

Then we can use:

```
SELECT salary
FROM
WHERE employee_id = 100
FOR UPDATE;
```

This gets a lock on the row.

Example:

```
SELECT balance
INTO v_balance
FROM accounts
WHERE account_id = 10
FOR UPDATE;
```

then:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

---

# 23. NOWAIT

If we don't want to wait after a lock:

```
SELECT *
FROM accounts
WHERE account_id = 10
FOR UPDATE NOWAIT;
```

If the line is already blocked, Oracle returns an error immediately instead of waiting.

It is very useful for applications that want to deal explicitly with conflicts.

---

# 24. SKIP LOCKED

Very useful for competing processing:

```
SELECT *
FROM job_queue
WHERE status = 'READY'
FOR UPDATE SKIP LOCKED;
```

If some rows are already blocked by another worker, the Oracle jumps them.

Example:

```
Worker 1
job 1
job 2

Worker 2
job 3
job 4
```

instead of Worker 2 to wait for Worker 1.

It's a very useful pattern for:

- quee processing;
- batch processing;
- Parallel workers.

---

# 25. Blocking session

Suppose:

Session A:

```
UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;
```

No comment.

Session B:

```
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
locked session
```

---

# 26. Deadlock

Normal blocking is not the same thing as the deadlock.

Example:

Session A:

```
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 1;
```

Session B:

```
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 2;
```

Then A:

```
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 2;
```

A wait after B.

But B runs:

```
UPDATE accounts
SET balance = balance + 10
WHERE account_id = 1;
```

Now we have:

```
A holds row 1
A waits row 2

B holds row 2
B waits row 1
```

I mean:

```
A ------- B.
^      |
|      v
+------+
```

This is an **deadlock**.

The Oracle detects the cycle and produces:

```
ORA-00060: deadlock detected while waiting for resource
```

---

# 27. Best Prevention for Deadlock

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
A: 1 - then 2
B: 1 - ed 2
```

This greatly reduces the possibility of deadlocks.

---

# 28. Lost update

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

If the app makes you stupid:

```
UPDATE accounts
SET balance = 1100;
```

then:

```
UPDATE accounts
SET balance = 1200;
```

A's modification may be lost.

That is why it is often preferable:

```
UPDATE accounts
SET balance = balance + 100
WHERE account_id = 1;
```

for:

```
UPDATE accounts
SET balance =: calculated_value;
```

where it is possible to make sense.

---

# 29. Optimistic locking

A very used pattern of applications is:

```
version_number
```

Example:

```
account_id = 10
Balance = 1000
version_no = 7
```

The app reads version 7.

Update:

```
UPDATE accounts
SET balance = 1200,
version_no = version_no + 1
WHERE account_id = 10
AND version_no = 7;
```

If:

```
SQL
```

That means someone's changed the line.

This is a form of:

> Optimistic competition control.

---

# 30. Pessimistic Locking

Instead of detecting the conflict later, we can block the line forward.

```
SELECT *
FROM accounts
WHERE account_id = 10
FOR UPDATE;
```

This model is called conceptual:

> Pessimistic locking.

The comparison is:

```
Optimistic:
I suppose there will be no conflict
detect conflict at UPDATE

Pessimistic:
blocking the resource forward
```

---

# 31. Important long-term locations

One of the most dangerous things in an Oracle application:

```
UPDATE
↓
user thoughts for 5 minutes
↓
COMMIT
```

In all that time, another transaction can be blocked.

A good transaction should be:

> as short as possible.

Good pattern:

```
read necessity data
logical preparation
bengin change
UPDATE
UPDATE
COMMIT
```

No:

```
UPDATE
external API call
sleep
user confirmation
another API
COMMIT
```

---

# 32. COMMIT too often

The other extreme isn't good either.

Bad example:

```
FOR r IN (...) LOOP

UPDATE...

COMMIT;

END LOOP;
```

If you process 1,000,000 rows, you could produce 1,000,000 comms.

Problems:

- overhead;
- performance;
- artificial broken logic transaction;
- more difficult recovery;
- risk of partial results.

Better it can be:

```
logical batch
```

For example, I commit to the level of logical unit of work.

---

# 33. DDL and default COMMIT

You need to know that DDL operations behave differently than DML.

Examples:

```
CREATE TABLE
ALTER TABLE
DROP TABLE
TRUNCATE
```

Oracle produces default commits in the context of DDL.

That's why you don't have to treat:

```
CREATE TABLE...
```

like a simple UPDATE rollbackable.

For example, you don't have to rely on:

```
CREATE TABLE test (...);

ROLLBACK;
```

To make the table disappear.

---

# 34. Autonomous transactions

In PL/SQL there are:

```
PRAGMA AUTONOMOUS_TRANSACTION;
```

This creates a transaction independent of the calling transaction.

Classic example: logging.

```
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

The main program can do:

```
ROLLBACK;
```

but the login remains because the autonomous transaction made its own:

```
COMMIT;
```

---

# 35. Why autonomous transaction should be used with care

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

The autonomous transaction shall not be confused with:

> a small commit of the main transaction.

It's a completely separate transaction.

Excessive use may complicate:

- consistency;
- depoggingu;
- the lockings;
- application logic.

The best-known reasonable case is independent login.

---

# 36. Correct PL/SQL transaction example

```
BEGIN

UPDATE accounts
SET balance = balance - 100
WHERE account_id = 10;

UPDATE accounts
SET balance = balance + 100
WHERE account_id = 20;

COMMIT;

EXCEPTION
WHENQ1QX THEN

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

faillure
   |
+ --
   |
+ --
```

RAISE propagates the original exception to the caller.

---

# 37. A more realistic pattern with SAVEPOINT

```
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
WHENQ1QX THEN
ROLLBACK TO batch_started;
RAISE;
END;

COMMIT;

END;
/
```

Here we can better control what part of the transaction we cancel.

---

# 38. Essential exercise: two DataGrip sessions

To really understand competition, the best lab is with two consoles.

Open:

```
Session A
Session B
```

## Session A

```
UPDATE
SET salary = salary + 100
WHERE employee_id = 100;
```

Don't comment.

---

## Session B

```
SELECT salary
FROM
WHERE employee_id = 100;
```

Notice that the SELECT- works.

Then:

```
UPDATE
SET salary = salary + 200
WHERE employee_id = 100;
```

Now Session B will wait.

---

## Session A

execute:

```
COMMIT;
```

Session B will continue.

This experiment demonstrates simultaneously:

```
MVCC
read consistency
Reader vs writer
Writer vs Writer
row locking
COMMIT
```

And it's worth handmade a few times.

---

# 39. The mental model to be retained

You can summarize Oracle's competition as follows:

```
Oracle competition
                          |
          +---------------+---------------+
          |                               |
READERS WRITERS
          |                               |
          v                               v
MVCCQ1QX LOCKS
          |                               |
          v                               v
Consistent Read TX / TM Locks
          |
          v
UNDO
```

and above all:

```
SCN
```

establish the logical order of change.

---

## Questions and answers

For an Oracle / Data Developer role, I would consider it mandatory to be able to explain fluently:

- what is a transaction and ACID;
- COMMIT, ROLLBACK, SAVEPOINT;
- the difference between **UNDO and REDO**;
- what **SCN** is;
- how **works read consistency**;
- what **MVCC** is;
- why an SELECT is not usually blocked by an UPDATE;
- why two UPDATE-uri on the same line lock;
- row locks, TX and TM;
- blocking session versus deadlock;
- ORA-00060;
- READ COMMITTED versus SERIALIZABLE;
- SELECT... FOR UPDATE;
- NOWAIT and SKIP LOCKED;
- transactions too long;
- too often;
- PRAGMA AUTONOMOUS\ _ TRANSACTION

A very good form for review would be:

> **Oracle uses multiverse competition control and undo-based read consistency. Readers normally do not block writers, and writers normally do not block readers. Concurrent writers may block each other when they change the same rows. Oracle uses row-level location and reconstruction older versions of blocks from undo to provide consistent reports.

This phrase focuses a very large part of the philosophy of competition Oracle.

The next logical step of the course would be to make **a complete practical laboratory in two sessions DataGrip**, with V$SESSION, blocking sessions, TX/TM locks, FOR UPDATE, NOWAIT, SKIP LOCKED and a intentionally provoked deadlock.

---

## Questions and answers

### How would you briefly explain Transactions and Oracle competition to a colleague who knows SQL, but not this area?

Transactions and competition Oracle covers ACID and translation boundaries, COMMIT, ROLLBACK and SAVEPOINT, UNDO, REDO and SCN. In practice, first, I determine what data enter and what result must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to Transactions and Oracle competition?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For Transactions and competition Oracle, explicitly follow ACID and Transaction boundaries, COMMIT, ROLLBACK and SAVEPOINT, UNDO, REDO and SCN and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

A batch updates its balances and is resumed after an error.
