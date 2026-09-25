---
title: 'C25. SQL Monitoring and Diagnostics'
description: 'Complete English handbook chapter based on the original C25 course.'
sidebar_position: 25
---

# C25. SQL Monitoring and Diagnostics

<div className="chapter-kicker">Chapter C25 · Complete course</div>

SQL Monitoring and diagnostic means to be able to answer questions quickly:

- What's SQL running now?
- Why are you running slow?
- Where does it take time: CPU, I/O, locks, network, TEMP?
- What execution plan does he really use?
- How many lines does Oracle estimate and how many actually process?
- Is there blocking sessions?
- Has S-changed the plan to previous executions?
- The problem is SQL-, statistics, indexes, competition or infrastructure?

For an **Oracle Data Developer / DWH Developer**, this is one of the most important practical topics.

---

## 1. Diagnosis Levels

You can look at the diagnosis of SQL on four levels:

```
SQL status
     ↓
Implementation Plan
     ↓
Session / Wait Events
     ↓
Date / System resources
```

The recommended order is:

```
1. Identifying slow SQL-
2. Identifying SQL_ID
3. Checking execution of the real plan
4. Comparing estimates vs real values
5. Checking the waits
6. Checking blocking
7. Checking CPU / I/O / TEMP
8. Checking statistics and history plan
```

You don't start directly by adding indexes.

---

# 2. SQL\ _ ID

Oracle identifies SQL-uri by SQL\ _ ID.

Example:

```
SELECT sql_id,
sql_text
FROM v $sql
WHERE sql_text LIKE '%DWH_ACCOUNT%';
```

Possible result:

```
SQL_ID SQL_TEXT
-------------  ---------------------------------------
3g7k51x8mj9ab SELECT... FROM DWH_ACCOUNT...
```

From here on out, almost all investigations can be done using:

```
SQL_ID = 3g7k51x8mj9ab
```

---

# 3. V$SQL; QQ1QXuri are in the shared pool

V$SQL is one of the most important viewes for diagnosis.

Example:

```
SELECT
sql_id,
executions,
elapsed_time,
cpu_time,
buffer_gets,
disk_reads,
rows_processed
FROM v $sql
WHERE sql_id = '3g7k51x8mj9ab';
```

The values are generally cumulative for the cursor.

## Important metrics

### _

Total time spent running SQL-.

```
elapsed_time
```

Includes:

```
CPU
+
I/O waits
+
locks
+
Other waits
```

---

### _

Time actually consumed on CPU.

If:

```
elapsed_time - cpu_time
```

The problem is likely CPU / processing.

If:

```
elapsed_time - cpu_time
```

SQL- is waiting for something.

For example:

```
I/O
locks
network
TEMP
```

---

### BUFFER\ _ GETS

Number of blocks accessed from the cache buffer.

Very important.

Example:

```
buffer_gets = 20.000,000
```

may indicate:

```
Full large scan
inefficient joints
Nested excessive loops
```

---

### DISK\ _ Reads

The number of blocks physically read on the disk.

---

### EXECUTIONS

How many times has SQL- been executed?

You can calculate average values:

```
SELECT
sql_id,
executions,
elapsed_time / NULLIF (executions, 0) / 1000000 AS avg_seconds,
buffer_gets / NULLIF (executions, 0) AS avg_buffer_gets
FROM v $sql
WHERE sql_id = '3g7k51x8mj9ab';
```

---

# 4. V$SESSION

V$SESSION shows the Oracle sessions.

Example:

```
SELECT
sid,
serial #,
username,
status,
sql_id,
event,
wait_class,
seconds_in_wait
FROM v $session
WHERE username IS NOT NULL;
```

You can see:

```
SID
SQL_ID
STATUS
EVENT
WAIT_CLASS
```

---

## ACTIVE vs INACTIVE

```
ACTIVE
```

does not necessarily mean that the session consumes CPU.

It can be:

```
ACTIVE
but wait I/O
```

That's why you're checking:

```
EVENT
WAIT_CLASS
```

---

# 5. Wait Events

Oracle is largely diagnosed by:

> What's the session waiting for?

Example:

```
SELECT
sid,
sql_id,
event,
wait_class,
States,
seconds_in_wait
FROM v $session
WHERE status = 'ACTIVE';
```

---

# 6. The Most Important Wait Classes

Examples:

```
I/O User
Application
Competition
Commit
Network
System I/O
Configuration
```

---

## I/O User

Examples:

```
db file sequential read
db file scattered read
direct path read
```

### db file sequential read

Usually:

```
single block read
```

common with:

```
look index
```

Doesn't mean it's automatically a problem.

---

### direct path read

It can occur at:

```
large table scan
parallel query
apron
hash joins
```

Very relevant to DWH.

---

# 7. Blocking sessions

One of the most common real problems.

Example:

```
SELECT
sid,
serial #,
username,
blocking_session,
event,
sql_id
FROM v $session
WHERE blocking_session IS NOT NULL;
```

Example result:

```
SID BLOCKING_SESSION
---  ----------------
142 87
```

It means:

```
session 142
     ↓
is blocked by
     ↓
session 87
```

---

## Finding the blocker

```
SELECT
sid,
serial #,
username,
status,
sql_id
FROM v $session
WHERE side = 87;
```

The problem can be:

```
UPDATE without COMMIT
DELETE Long
ETL contestant
job locked
```

---

# 8. Execution Plan

For diagnosis, EXPLAIN PLAN is not sufficient.

Preferably:

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
'3g7k51x8mj9ab',
NULL,
'ALLSTATS LAST'
)
);
```

Here you see the plan that was actually used.

---

# 9. Estimates vs. Reality

One of the most powerful diagnostic techniques.

In DBMS\ _ XPLAN you aim:

```
E-Rows
A-Rows
```

where:

```
E-rows = Estimated Rows
A-Rows = Current Rows
```

Example:

```
E-Rows = 100
A-rows = 4,000,000
```

This is a major problem.

The optimiser thought he was going to process:

```
100 rows
```

but in reality:

```
4 million
```

He can make the wrong choice:

```
NESTED LOOPS
```

for:

```
HASH JOIN
```

---

# 10. Example of diagnosis

We assume:

```
SELECT a.account_id,
SUM (t.amount)
FROM dwh_account
JOIN transactions t
ON t.account_id = a.account_id
WHERE a.country = 'RO'
GROUP BY a.account_id;
```

SQL- is running for 4 minutes.

The plan shows:

```
NESTED LOOPS
TABLEQ1QX DWH_ACCOUNT
INDEX RANGE SCAN TRANSACTIONS_IDX
```

But the real statistics are:

```
DWH_ACCOUNT

E-Rows = 20
A-rows = 300,000
```

The optimiser thought:

```
20 accounts
```

will be found.

In reality:

```
300,000
```

Result:

```
300,000 index looks
```

The problem isn't necessarily the index.

The real problem can be:

```
wrong statistics
```

or skewed distribution:

```
country = 'RO'
```

---

# 11. V$SQL\ _ PLAN

Plans can also be read directly.

```
SELECT
d,
parent_id,
operation,
options,
object_name,
cardinality,
cost
FROM v $sql_plan
WHERE sql_id = '3g7k51x8mj9ab'
ORDER BY id;
```

However, for human analysis it is usually more comfortable:

```
DBMS_XPLAN
```

---

# 12. SQL Monitor

Oracle has Real-Time SQL Monitoring for sufficiently expensive or explicitly monitored operations.

Important views:

```
V$SQL_MONITOR
V$SQL_PLAN_MONITOR
```

Example:

```
SELECT
sql_id,
status,
sql_exec_start,
elapsed_time,
cpu_time,
buffer_gets,
disk_reads
FROM v $sql_monitor
WHERE sql_id = '3g7k51x8mj9ab';
```

You can see an execution in almost real time.

---

# 13. V$SQL\ _ PLAN\ _ MONITOR

Show progress at plan level operator level.

Conceptual:

```
HASH JOIN
    ↓
TABLE ACCESS FULL FACT_SALES
    ↓
TABLE ACCESS FULL DIM_CUSTOMER
```

You can see:

```
How many lines have passed
how much I/O has become
which operator consumes time
```

It is very useful at:

```
ETL
DWH
long queries
parallel queries
```

---

# 14. SQL Monitor report

A very useful report can be generated with:

```
SELECT DBMS_SQLTUNE.REPORT_SQL_MONITOR (
sql_id = = '3g7k51x8mj9ab',
type = rec
report_level = = 'ALL'
)
FROM dual;
```

Conceptually, see:

```
SQL
↓
Implementation plan
↓
Timing per operator
↓
Rows
↓
I/O
↓
Wait events
```

It's one of the best ways to diagnose a long SQL.

---

# 15. How to Force Monitoring

You can use the hint:

```
SELECT / * + MONITOR * /
       ...
FROM...
```

or:

```
SELECT / * + NO_MONITOR * /
       ...
FROM...
```

MONITOR is useful in the laboratory to intentionally analyze a query.

---

# 16. Session waits

You can analyze active sessions:

```
SELECT
sid,
sql_id,
event,
wait_class,
States,
seconds_in_wait
FROM v $session
WHERE status = 'ACTIVE'
AND username IS NOT NULL;
```

Example:

```
EVENT WAIT_CLASS
-------------------------  ----------
db file sequential read User I/O
```

Interpretation:

```
SQL- makes many single block reads
```

Possibly:

```
repetitive look index
nested loops
```

---

# 17.TEMP usage

Analytical querys can consume massive TEMP.

Example:

```
ORDER BY
GROUP BY
HASH JOIN
HASHQ1QX BY
analytic functions
```

You can investigate TEMP through views such as:

```
V$TEMPSEG_USAGE
```

Conceptual:

```
Insufficient PGA
       ↓
Sort / hash does not fit in the memory
       ↓
Spill to TEMP
       ↓
I/O
       ↓
slow query
```

---

# 18. PGA and workshops

You can analyze the work with:

```
V$SQL_WORKAREA
```

Relevant operations:

```
SORT
HASH JOIN
GROUP BY
```

The important thing is whether the operation is running:

```
Optimal
```

or reach:

```
One-pass
multi-pass
```

Conceptual:

```
Optimal
    ↓
in memory

One-pass
    ↓
Part TEMP

multi-pass
    ↓
TEMP
    ↓
very slowly
```

---

# 19. Long Operations

For certain long operations there are:

```
V$SESSION_LONGOPS
```

Example:

```
SELECT
sid,
opname,
sodium,
totalwork,
units,
elapsed_seconds,
time_remaining
FROM v $session_longops
WHERE totalwork
AND sofar and totalwork;
```

You can see about progress.

Example:

```
Table Scan
Spray = 700000
total work = 1000000
```

about:

```
70%
```

---

# 20. SQL that consumes most resources

### After elapsed time

```
SELECT *
FROM (
SELECT
sql_id,
executions,
elapsed_time / 1000000 elapsed_seconds,
sql_text
FROM v $sql
ORDER BY elapsed_time DESC
)
WHERE ROWNUM
```

---

### After CPU

```
SELECT *
FROM (
SELECT
sql_id,
cpu_time / 1000000 cpu_seconds,
executions,
sql_text
FROM v $sql
ORDER BY cpu_time DESC
)
WHERE ROWNUM
```

---

### After buffer gets

```
SELECT *
FROM (
SELECT
sql_id,
buffer_gets,
executions,
sql_text
FROM v $sql
ORDER BY buffer_gets DESC
)
WHERE ROWNUM
```

---

# 21. Warning per execution

Cumulative values may mislead.

Example:

```
SQL A

elapsed = 10,000 sec
executions = 1,000,000
```

may be acceptable.

But:

```
SQL B

elapsed = 500 sec
executions = 1
```

It's probably problematic.

That's why we're calculating:

```
SELECT
sql_id,
executions,
ROUND (
elapsed_time /
NULLIF (executions, 0)
1000000,
3
) avg_seconds
FROM v $sql;
```

---

# 22. Child cursors

The same SQL\ _ ID may have several:

```
CHILD_NUMBER
```

Example:

```
SELECT
sql_id,
child_number,
plan_hash_value,
executions
FROM v $sql
WHERE sql_id = '3g7k51x8mj9ab';
```

You can discover:

```
child 0 → plan A
child 1 → plan B
```

---

# 23. PLAN\ _ HASH\ _ VALUE

An essential concept.

```
PLAN_HASH_VALUE
```

identify roughly the structure of the plan.

Example:

```
yesterday:

SQL_ID = abc123
PLAN_HASH_VALUE = 148923

today:

SQL_ID = abc123
PLAN_HASH_VALUE = 987341
```

SQL- is the same, but the plan has changed.

If the performance deteriorated exactly then:

```
regression plan
```

He's a very important suspect.

---

# 24. Diagnosing a regression plan

Situation:

```
yesterday: 3 seconds
today: 2 minutes
```

Investigation:

```
1. The same SQL_ID?
2. The same PLAN_HASH_VALUE?
3. Have the statistics changed?
4. Has the data changed?
5. Have they changed the wind?
6. Is there another child cursor?
```

---

# 25. Bind values and diagnosis

An SQL:

```
SELECT *
FROM orders
WHERE customer_id =: customer_id;
```

may have very different behaviors for:

```
Customers 10 → 3 rows
curator 999 → 5,000,000 rows
```

The same SQL may need different strategies.

Concepts such as:

```
bind peeking
adaptive cursor sharing
histograms
```

discussed in previous modules.

---

# 26. ASH

Conceptually, ASH answers the question:

> What were active sessions doing at various times?

The data may contain:

```
session
SQL_ID
event
wait class
Object
timestamp
```

It is extremely useful when the problem:

```
It happened 20 minutes ago.
```

and is no longer active.

Instead of just seeing:

```
What happens now
```

you can investigate:

```
what happens then
```

However, ASH/AWR involves functionalities that may depend on the edition / licensing of Oracle used in that environment.

---

# 27. AWR = Automatic Workload Repository

AWR keeps track of database performance.

Conceptual:

```
Snapshot 10: 00 a.m.
Snapshot 11: 00 a.m.
```

You can compare the activity between them.

AWR can highlight:

```
SQL
Top waits
CPU
I/O
load profiles
instance efficiency
SQL
SQL ordered by CPU
SQL ordered by reads
```

---

# 28. Diagnostic live vs historical

Remember the difference:

```
V$SESSION
V$SQL
V$SQL_MONITOR

        ↓

current situation
```

while:

```
ASH
AWR
```

are used more for:

```
historical
```

---

# 29. Practical diagnostic pattern

This is the workshop worth memorizing.

## Step 1 Find SQL-ul

```
SELECT sql_id,
sql_text
FROM v $sql
WHERE sql_text LIKE '%transactions%';
```

---

## Step 2 Check SQL Statistics

```
SELECT
executions,
elapsed_time,
cpu_time,
buffer_gets,
disk_reads
FROM v $sql
WHERE sql_id =: sql_id;
```

---

## Step 3 I'm checking the session

```
SELECT
sid,
status,
event,
wait_class
FROM v $session
WHERE sql_id =: sql_id;
```

---

## Step 4 checking the real plan

```
SELECT *
FROM TABLE (
DBMS_XPLAN.DISPLAY_CURSOR (
sql_id,
NULL,
'ALLSTATS LAST'
)
);
```

---

## Step 5

```
E-Rows
vs
A-Rows
```

---

## Step 6 I'm looking for the expensive operator

For example:

```
TABLEQ1QX FULL
HASH JOIN
NESTED LOOPS
SORT
```

---

## Step 7

```
CPU?
I/O?
lock?
TEMP?
```

---

## Step 8 determines root cause

Possible causes:

```
statistics
index
join order
common algorithm
cardinality
Variable band
data skew
blocking
TEMP
PGA
parallelism
data volume
```

---

# 30. Realistic DWH Screenplay

You have an ETL job:

```
LOAD_FACT_TRANSACTIONS
```

Normally:

```
12 minutes
```

Today:

```
1h 20 min
```

The investigation may show:

```
SQL_ID = abc123

elapsed high time
Relatively low CPU

Wait:
direct path read temp
```

Plan:

```
HASH JOIN
```

but SQL Monitor shows:

```
HASH JOIN
TEMP spill = 45 GB
```

Technical conclusion:

```
hash table does not fit in PGA
        ↓
Spill to TEMP
        ↓
Massive I/O
        ↓
Slow ETL
```

You would not yet prove that you have to index.

---

# 31. Another scenario of statistics

ETL slow.

DBMS\ _ XPLAN:

```
E-Rows = 1,000
A-Rows = 25.000,000
```

The optimiser chose:

```
NESTED LOOPS
```

Root probably cause:

```
cardinality estimate very wrong
```

The investigation shall continue to:

```
Statistics
histograms
data skew
```

---

# 32. Another Screenplay

Job ETL is apparently frozen.

V$SESSION shows:

```
WAIT_CLASS = Application
EVENT = enq: TX - row lock count
```

and:

```
BLOCKING_SESSION = 218
```

The investigation shows that session 218:

```
UPDATE
without COMMIT
```

The problem is not SQL tuning.

The problem is:

```
Locking / transaction
```

---

# 33. What NU you must do

Do not follow this pattern:

```
Slow SQL
   ↓
add index
```

The correct patter:

```
Slow SQL
   ↓
measure
   ↓
identify operator / wait
   ↓
cause root
   ↓
only then amends
```

---

# 34. Important Views to Memorize

for review, this list is very useful:

View
♪ ♪ ♪ ♪ ♪
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = =
= = sync, corrected by elderman = = @ elder _ man
= = sync, corrected by elderman = = @ elder _ man

---

# 35. Important functions / packages

You have to admit:

```
DBMS_XPLAN
DBMS_SQLTUNE
DBMS_STATS
```

and concepts:

```
SQL_ID
CHILD_NUMBER
PLAN_HASH_VALUE
E-Rows
A-Rows
Wait Event
Wait Class
Blocking Session
SQL Monitor
ASH
AWR
```

---

## Questions and answers

### How do you investigate a slow SQL?

Good answer:

> I start by identifying the SQL\ _ IDD and I check the statistics in V$SQL. Then I check the session in V$SESSION for wait events and blocking. I analyze the actual DBMS\ _ XPLAN.DISPLAY\ _ CURSOR and I compare E-Rows with A-Rows. If the query is long, I use the SQL Monitor to identify the time-consuming operator. Depending on the outcome, I investigate statistics, indexes, joints, PGA/TEMP or competition.

---

### What is the difference between CPU\ _ TIME and ELAPSED\ _ TIME?

```
CPU_TIME
```

is the actual time on CPU.

```
ELAPSED_TIME
```

include:

```
CPU + wait
```

---

### What does a large difference between E-Rows and A-Rows indicate?

Usually:

```
cardinality estimate wrong
```

possibly caused by:

```
Statistics
histograms
data skew
correlated predicates
net values
```

---

### Why is SQL important?

Because it allows the correlation between:

```
SQL text
V$SQL
V$SESSION
execution plan
SQL Monitor
ASH/AWR
```

---

### What is PLAN\ _ HASH\ _ VALUE?

An identifier of the plane's execution form.

It is very useful for detecting:

```
regression plan
```

---

### How do you differentiate a SQL problem from a blocking one?

Check:

```
V$SESSION.EVENT
WAIT_CLASS
BLOCKING_SESSION
```

If it occurs, for example:

```
enq: TX - row lock count
```

The main problem is the lockdown, not necessarily the SQL plan.

---

# 37. Mental Map

for review you can memorize:

```
Slow SQL
                    │
                    ▼
SQL_ID
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
V$SQLQ1QX PLAN
          │         │         │
          ▼         ▼         ▼
CPU/I/OQ1QX DBMS_XPLAN
          │         │         │
= = sync, corrected by elderman = = @ elder _ man
          │         │         │
          └─────────┼─────────┘
                    ▼
ROOT CAUSE
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
Statistics Locks Resources
       │                           │
Cardinality PGA / TEMP
       │
Index
       │
Joins
```

## Key idea of the module

**SQL tuning starts by diagnosis, not by modification of SQL-.**

The essential workshop for an Oracle Data Developer is:

```
SQL_ID
   ↓
V$SQL
   ↓
V$SESSION / wait
   ↓
DBMS_XPLAN
   ↓
E-Rows vs A-Rows
   ↓
SQL Monitor
   ↓
Root cause
   ↓
Optimisation
```

And the four questions you should ask almost automatically when an SQL is slow are:

```
1. Where does time go?
2. What operator in the plan is the problem?
3. Are the optimiser's estimates correct?
4. Is SQL- working or waiting for something?
```

They direct the link between the **Implementation Plans → Statistics → Join Algorithms → Parsing / Bind Variables → SQL Optimization → SQL Monitoring Diagnostic**.

---

## Questions and answers

### How would you briefly explain SQL Monitoring and diagnosis to a colleague who knows SQL, but not this area?

SQL Monitoring and diagnostic covers SQL _ ID and cursor-level inspection, V $SQL, V $SESSION and wait events, blocking sessions and locations. In practice, I first determine what dates enter and what results must be obtained, then I check implementation, execution plan and effects on flow.

### What are the two most common practical problems related to SQL Monitoring and diagnostic?

Two recurring problems are misinterpretation of data or granularity and degradation of performance at real volume. For SQL Monitoring and diagnostic, I explicitly follow SQL _ ID and cursor-level inspection, V $SQL, V $SESSION and wait events, blocking sessions and locks and compare the result with a control set.

### How do you check that the result is correct and not just fast?

I compare the number of rows, amounts and keys with the source or with a reference result; I test NULLs, duplicates, limits and rerouting of the batch.I only then check time, resources and execution plan.

### What information did you collect before you modified an existing solution?

I collect functional requirement, grain, scheme and keys, volume, data distribution, dependencies, plans and time, errors / lobes and acceptance criteria. I note how to return to the previous state.

### Give an example of a DWH or banking flow where this concept changes design.

An ODI job looks stuck.
