const sidebars = {
  courseSidebar: [
    'intro',
    {type:'category', label:'I · SQL and PL/SQL Foundations', items:['c01-sql','c02-plsql','c03-transactions']},
    {type:'category', label:'II · Operational and Analytical Systems', items:['c04-oltp','c05-olap','c06-data-warehouse','c07-scd','c08-etl-elt','c09-data-quality']},
    {type:'category', label:'III · Oracle SQL Performance', items:['c10-optimizer','c11-execution-plans','c12-indexes','c13-statistics','c14-join-algorithms','c15-partitioning','c16-materialized-views','c17-database-objects','c18-constraints']},
    {type:'category', label:'IV · Oracle Architecture', items:['c19-storage','c20-architecture','c21-memory','c22-redo-undo','c23-parsing-binds']},
    {type:'category', label:'V · Tuning and Diagnostics', items:['c24-sql-optimization','c25-sql-monitoring','c26-hints','c27-parallel','c28-temp']},
    {type:'category', label:'VI · Security, Connectivity and Recovery', items:['c29-security','c30-multitenant','c31-connectivity','c32-backup-recovery']},
    {type:'category', label:'VII · Data Engineering', items:['c33-data-modeling','c34-odi-orchestration','c35-cdc','c36-batch-processing']},
    {type:'category', label:'VIII · Banking Data Operations', items:['c37-reconciliation','c38-banking-data','c39-data-lineage','c40-impact-analysis']},
    'glossary',
  ],
};
export default sidebars;
