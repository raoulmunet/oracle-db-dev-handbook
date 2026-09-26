---
title: Glossary
---

# Oracle / DWH / Data Engineering Glossary

## A-Rows

The actual number of rows produced by a row source during execution, shown in runtime execution-plan statistics.

**Pages:** [C01](./c01-sql.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C28](./c28-temp.md)

## Access path

The method Oracle uses to retrieve rows, such as a table scan or an index scan.

**Pages:** [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C19](./c19-storage.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md)

## ACID

Atomicity, Consistency, Isolation and Durability.

**Pages:** [C03](./c03-transactions.md), [C04](./c04-oltp.md)

## ASH

Active Session History, a record of sampled active-session activity used to investigate database performance.

**Pages:** [C25](./c25-sql-monitoring.md)

## AWR

Automatic Workload Repository, a repository of database performance statistics collected over time for analysis.

**Pages:** [C25](./c25-sql-monitoring.md)

## B-tree index

An index structure that stores sorted key values with row locators, supporting efficient equality and range lookups.

**Pages:** [C01](./c01-sql.md), [C12](./c12-indexes.md), [C19](./c19-storage.md), [C24](./c24-sql-optimization.md), [C40](./c40-impact-analysis.md)

## Batch

A group of records or operations processed together as one unit of work.

**Pages:** [C01](./c01-sql.md), [C02](./c02-plsql.md), [C03](./c03-transactions.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C18](./c18-constraints.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## Bind variable

A placeholder such as `:x` that lets one SQL statement be reused with different values.

**Pages:** [C10](./c10-optimizer.md), [C15](./c15-partitioning.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md)

## Bitmap index

An index that represents key values with bitmaps identifying matching rows; it is often useful for low-cardinality columns in read-heavy analytical workloads.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C12](./c12-indexes.md)

## Business key

A key derived from business data that identifies an entity in its source or business domain.

**Pages:** [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C17](./c17-database-objects.md), [C18](./c18-constraints.md), [C33](./c33-data-modeling.md), [C37](./c37-reconciliation.md)

## Cardinality

Estimated or actual number of rows produced by an operation.

**Pages:** [C01](./c01-sql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C21](./c21-memory.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C28](./c28-temp.md), [C33](./c33-data-modeling.md), [C40](./c40-impact-analysis.md)

## CDB

Container Database.

**Pages:** [C20](./c20-architecture.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md)

## CDC

Change Data Capture.

**Pages:** [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md), [C39](./c39-data-lineage.md)

## Checkpoint

A point in the redo stream, identified by an SCN, up to which changed data has been written to data files; it limits the work needed for instance recovery.

**Pages:** [C20](./c20-architecture.md), [C22](./c22-redo-undo.md), [C32](./c32-backup-recovery.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md)

## CKM

Check Knowledge Module, an Oracle Data Integrator module that checks data flow or data model integrity against defined constraints.

**Pages:** [C34](./c34-odi-orchestration.md)

## Clustering factor

An index statistic that describes how closely the order of index entries matches the physical order of rows in the table.

**Pages:** [C10](./c10-optimizer.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C19](./c19-storage.md)

## Conformed dimension

A dimension shared by multiple facts or data marts with consistent attributes and meanings, enabling comparable analysis.

**Pages:** [C06](./c06-data-warehouse.md), [C33](./c33-data-modeling.md)

## Control total

A summary value, such as a row count or amount total, used to verify that data was transferred or processed completely and accurately.

**Pages:** [C09](./c09-data-quality.md), [C37](./c37-reconciliation.md), [C40](./c40-impact-analysis.md)

## Data lineage

The origin, transformations and movement of data from source to consumer.

**Pages:** [C04](./c04-oltp.md), [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## Data mart

A data store organized for analysis of a particular business subject or area, usually as part of a larger data warehouse.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C33](./c33-data-modeling.md), [C35](./c35-cdc.md), [C37](./c37-reconciliation.md), [C39](./c39-data-lineage.md)

## Data profiling

The examination of data structure, values, distributions, and relationships to assess its content and quality.

**Pages:** [C09](./c09-data-quality.md)

## Datafile

An operating-system file that stores database data and belongs to an Oracle tablespace.

**Pages:** [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C32](./c32-backup-recovery.md)

## Deadlock

A cycle of sessions waiting for resources held by one another, so none can proceed; Oracle detects the cycle and rolls back one statement.

**Pages:** [C03](./c03-transactions.md), [C04](./c04-oltp.md)

## Dimension

A set of descriptive attributes, such as customer, product, or time, used to analyze facts in a data warehouse.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C17](./c17-database-objects.md), [C33](./c33-data-modeling.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C40](./c40-impact-analysis.md)

## DOP

Degree of Parallelism: the number of parallel execution servers or processes requested or chosen for an operation.

**Pages:** [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md)

## E-Rows

The number of rows the optimizer estimates a row source will produce, as shown in an execution plan.

**Pages:** [C01](./c01-sql.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C28](./c28-temp.md)

## ELT

Extract, Load, Transform.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C16](./c16-materialized-views.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md)

## ETL

Extract, Transform, Load.

**Pages:** [C01](./c01-sql.md), [C02](./c02-plsql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C18](./c18-constraints.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## Extent

A set of contiguous Oracle data blocks allocated to a segment.

**Pages:** [C19](./c19-storage.md), [C34](./c34-odi-orchestration.md)

## Fact table

A table that stores measurable business events at a defined grain, with keys linking to descriptive dimensions.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C11](./c11-execution-plans.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C26](./c26-hints.md), [C28](./c28-temp.md), [C33](./c33-data-modeling.md), [C39](./c39-data-lineage.md)

## Fast refresh

An incremental materialized-view refresh that applies recorded changes instead of recomputing the entire view, when the view meets refresh requirements.

**Pages:** [C16](./c16-materialized-views.md), [C40](./c40-impact-analysis.md)

## FORALL

A PL/SQL statement that bulk-binds collection values to a DML statement, reducing context switches between the PL/SQL and SQL engines.

**Pages:** [C02](./c02-plsql.md), [C08](./c08-etl-elt.md), [C36](./c36-batch-processing.md)

## Grain

The exact business meaning represented by one row.

**Pages:** [C01](./c01-sql.md), [C02](./c02-plsql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C18](./c18-constraints.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## Hard parse

A parse that creates a new executable cursor when Oracle cannot reuse a suitable one; it includes optimization and row-source generation.

**Pages:** [C20](./c20-architecture.md), [C21](./c21-memory.md), [C23](./c23-parsing-binds.md)

## High-water mark

The boundary in a segment up to which blocks have been formatted for use; a full table scan can read blocks below this boundary even when some contain no current rows.

**Pages:** [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C35](./c35-cdc.md)

## Histogram

Column statistics describing how values are distributed, helping the optimizer estimate selectivity when values are skewed.

**Pages:** [C01](./c01-sql.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C13](./c13-statistics.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md)

## Idempotency

The property that repeating an operation produces the same final state as running it once, without duplicating its intended effects.

**Pages:** [C08](./c08-etl-elt.md), [C32](./c32-backup-recovery.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C38](./c38-banking-data.md)

## IKM

Integration Knowledge Module, an Oracle Data Integrator module that loads or integrates data into a target using a chosen strategy.

**Pages:** [C34](./c34-odi-orchestration.md)

## Instance

The Oracle Database memory structures and background processes that manage access to database files.

**Pages:** [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C25](./c25-sql-monitoring.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md)

## JKM

Journalizing Knowledge Module, an Oracle Data Integrator module that sets up capture of source changes for change data capture.

**Pages:** [C34](./c34-odi-orchestration.md)

## Join order

The sequence in which tables or row sources are joined in a query execution plan.

**Pages:** [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C23](./c23-parsing-binds.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md)

## LKM

Loading Knowledge Module, an Oracle Data Integrator module that moves source data to a staging area using a technology-specific method.

**Pages:** [C34](./c34-odi-orchestration.md)

## Local index

A partitioned index whose partitions correspond to the partitions of its underlying table.

**Pages:** [C12](./c12-indexes.md), [C15](./c15-partitioning.md)

## Materialized view

A database object that stores the result of a query and can be refreshed as its source data changes.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C10](./c10-optimizer.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C24](./c24-sql-optimization.md)

## MERGE

A SQL statement that conditionally updates target rows when they match a source and inserts rows when they do not.

**Pages:** [C01](./c01-sql.md), [C02](./c02-plsql.md), [C03](./c03-transactions.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C39](./c39-data-lineage.md)

## MVCC

Multi-Version Concurrency Control: Oracle’s use of undo data to provide read-consistent versions of rows while transactions modify data.

**Pages:** [C03](./c03-transactions.md), [C04](./c04-oltp.md), [C19](./c19-storage.md), [C22](./c22-redo-undo.md)

## NDV

Number of Distinct Values: the count of distinct values in a column or set of columns, used in optimizer statistics.

**Pages:** [C13](./c13-statistics.md)

## Nested Loops

A join method that processes each row from one input and searches the other input for matching rows, often using an index.

**Pages:** [C01](./c01-sql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C21](./c21-memory.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C26](./c26-hints.md), [C28](./c28-temp.md)

## OLAP

Online Analytical Processing.

**Pages:** [C04](./c04-oltp.md), [C05](./c05-olap.md), [C08](./c08-etl-elt.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C33](./c33-data-modeling.md)

## OLTP

Online Transaction Processing.

**Pages:** [C01](./c01-sql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C10](./c10-optimizer.md), [C12](./c12-indexes.md), [C14](./c14-join-algorithms.md), [C16](./c16-materialized-views.md), [C18](./c18-constraints.md), [C19](./c19-storage.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C33](./c33-data-modeling.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md)

## Partition pruning

The elimination of table or index partitions that cannot contain rows matching a query’s partition-key predicates.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C08](./c08-etl-elt.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C19](./c19-storage.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C34](./c34-odi-orchestration.md), [C36](./c36-batch-processing.md), [C40](./c40-impact-analysis.md)

## PDB

Pluggable Database.

**Pages:** [C20](./c20-architecture.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C32](./c32-backup-recovery.md)

## PGA

Private/process memory used by sessions and workareas.

**Pages:** [C02](./c02-plsql.md), [C11](./c11-execution-plans.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C25](./c25-sql-monitoring.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md), [C36](./c36-batch-processing.md)

## Plan hash value

A numeric hash derived from an execution plan and used to compare plan identity; different values indicate different plans, while matching values are a useful plan-comparison signal.

**Pages:** [C11](./c11-execution-plans.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md)

## Predicate

A condition in SQL that determines which rows qualify, or how rows from different row sources match.

**Pages:** [C01](./c01-sql.md), [C05](./c05-olap.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C28](./c28-temp.md)

## Query rewrite

An optimizer transformation that substitutes an eligible materialized view for parts of a query while preserving its result.

**Pages:** [C05](./c05-olap.md), [C10](./c10-optimizer.md), [C12](./c12-indexes.md), [C16](./c16-materialized-views.md), [C24](./c24-sql-optimization.md)

## Reconciliation

Evidence that source and target agree under defined rules.

**Pages:** [C01](./c01-sql.md), [C02](./c02-plsql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C16](./c16-materialized-views.md), [C17](./c17-database-objects.md), [C18](./c18-constraints.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C32](./c32-backup-recovery.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C37](./c37-reconciliation.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## Redo

Change information used for durability and recovery.

**Pages:** [C03](./c03-transactions.md), [C04](./c04-oltp.md), [C08](./c08-etl-elt.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C32](./c32-backup-recovery.md), [C35](./c35-cdc.md)

## Restartability

The ability to resume or rerun a failed data process from a known point while preserving correct results and avoiding unintended duplicate work.

**Pages:** [C08](./c08-etl-elt.md), [C22](./c22-redo-undo.md), [C32](./c32-backup-recovery.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md), [C40](./c40-impact-analysis.md)

## RKM

Reverse-Engineering Knowledge Module, an Oracle Data Integrator module that reads source metadata into an ODI model.

**Pages:** [C34](./c34-odi-orchestration.md)

## SARGable

Describes a predicate that can be evaluated using an index search condition, allowing the database to avoid examining every row when an appropriate index exists.

**Pages:** [C10](./c10-optimizer.md), [C12](./c12-indexes.md), [C15](./c15-partitioning.md)

## SCD

Slowly Changing Dimension.

**Pages:** [C01](./c01-sql.md), [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C09](./c09-data-quality.md), [C18](./c18-constraints.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C37](./c37-reconciliation.md), [C38](./c38-banking-data.md), [C39](./c39-data-lineage.md), [C40](./c40-impact-analysis.md)

## SCN

System Change Number: a logical database timestamp that orders changes and identifies a point in the database’s redo history.

**Pages:** [C03](./c03-transactions.md), [C08](./c08-etl-elt.md), [C20](./c20-architecture.md), [C22](./c22-redo-undo.md), [C32](./c32-backup-recovery.md), [C35](./c35-cdc.md)

## Segment

The storage allocated for a database object, such as a table, index, or undo segment, within a tablespace.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C15](./c15-partitioning.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C35](./c35-cdc.md), [C38](./c38-banking-data.md)

## Selectivity

The fraction of rows expected to satisfy a predicate; lower selectivity means fewer rows qualify.

**Pages:** [C01](./c01-sql.md), [C04](./c04-oltp.md), [C05](./c05-olap.md), [C10](./c10-optimizer.md), [C11](./c11-execution-plans.md), [C12](./c12-indexes.md), [C13](./c13-statistics.md), [C14](./c14-join-algorithms.md), [C15](./c15-partitioning.md), [C23](./c23-parsing-binds.md), [C24](./c24-sql-optimization.md), [C26](./c26-hints.md), [C40](./c40-impact-analysis.md)

## Service name

A logical name that identifies a database service to Oracle Net clients and can direct connections to one or more database instances.

**Pages:** [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md)

## SGA

Shared memory area of an Oracle instance.

**Pages:** [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C23](./c23-parsing-binds.md), [C29](./c29-security.md), [C30](./c30-multitenant.md), [C31](./c31-connectivity.md)

## Soft parse

A parse that reuses a suitable cursor already in the shared pool, avoiding the full optimization and row-source generation required by a hard parse.

**Pages:** [C20](./c20-architecture.md), [C21](./c21-memory.md), [C23](./c23-parsing-binds.md)

## Source-to-target mapping

A specification that relates source fields to target columns and defines the transformations and rules used to populate the target.

**Pages:** [C06](./c06-data-warehouse.md), [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md)

## Spill

The writing of intermediate sort or hash-workarea data to temporary storage when it does not fit in memory.

**Pages:** [C05](./c05-olap.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C28](./c28-temp.md)

## Star schema

A dimensional model with a central fact table linked directly to surrounding dimension tables.

**Pages:** [C05](./c05-olap.md), [C06](./c06-data-warehouse.md), [C15](./c15-partitioning.md), [C33](./c33-data-modeling.md)

## Surrogate key

A generated technical key without business semantics.

**Pages:** [C07](./c07-scd.md), [C08](./c08-etl-elt.md), [C18](./c18-constraints.md), [C33](./c33-data-modeling.md)

## Tablespace

A logical storage container in an Oracle database that groups segments and is backed by one or more datafiles.

**Pages:** [C08](./c08-etl-elt.md), [C11](./c11-execution-plans.md), [C14](./c14-join-algorithms.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C22](./c22-redo-undo.md), [C24](./c24-sql-optimization.md), [C28](./c28-temp.md), [C29](./c29-security.md), [C32](./c32-backup-recovery.md), [C33](./c33-data-modeling.md), [C34](./c34-odi-orchestration.md)

## TEMP

The temporary tablespace used for temporary segments and work such as sorts and hash operations that cannot be completed entirely in memory.

**Pages:** [C05](./c05-olap.md), [C11](./c11-execution-plans.md), [C14](./c14-join-algorithms.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C21](./c21-memory.md), [C24](./c24-sql-optimization.md), [C25](./c25-sql-monitoring.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C34](./c34-odi-orchestration.md), [C36](./c36-batch-processing.md)

## Undo

Information used for rollback and consistent reads.

**Pages:** [C03](./c03-transactions.md), [C04](./c04-oltp.md), [C08](./c08-etl-elt.md), [C19](./c19-storage.md), [C20](./c20-architecture.md), [C22](./c22-redo-undo.md), [C27](./c27-parallel.md), [C28](./c28-temp.md), [C32](./c32-backup-recovery.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md)

## VPD

Virtual Private Database, an Oracle security feature that applies policy-generated predicates to SQL so users see only authorized rows.

**Pages:** [C29](./c29-security.md)

## Watermark

A marker used to delimit incremental data already processed from new data.

**Pages:** [C01](./c01-sql.md), [C08](./c08-etl-elt.md), [C34](./c34-odi-orchestration.md), [C35](./c35-cdc.md), [C36](./c36-batch-processing.md)

