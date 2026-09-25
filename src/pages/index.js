import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const areas = [
  ['01–03', 'SQL and PL/SQL Foundations', 'SQL, PL/SQL, transactions and concurrency', '/c01-sql'],
  ['04–09', 'Operational and Analytical Systems', 'OLTP, OLAP, DWH, SCD, ETL and data quality', '/c04-oltp'],
  ['10–18', 'Oracle SQL Performance', 'Optimizer, plans, indexes, joins, partitioning and database objects', '/c10-optimizer'],
  ['19–23', 'Oracle Architecture', 'Storage, memory, redo, undo, parsing and bind variables', '/c19-storage'],
  ['24–28', 'Tuning and Diagnostics', 'SQL optimization, monitoring, hints, parallelism and TEMP', '/c24-sql-optimization'],
  ['29–32', 'Security and Recovery', 'Security, multitenant, connectivity, backup and recovery', '/c29-security'],
  ['33–36', 'Data Engineering', 'Data modeling, ODI orchestration, CDC and batch processing', '/c33-data-modeling'],
  ['37–40', 'Banking Data Operations', 'Reconciliation, banking concepts, lineage and impact analysis', '/c37-reconciliation'],
];

export default function Home() {
  return <Layout title="Oracle Data Developer Handbook" description="Complete English C01–C40 Oracle Data Developer course">
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.eyebrow}>ORACLE DATA DEVELOPER HANDBOOK</div>
        <div className={styles.heroGrid}>
          <div>
            <h1>From SQL execution to trustworthy data systems</h1>
            <p className={styles.lead}>The complete English C01–C40 course: detailed explanations, Oracle examples, mental models, production scenarios and questions with answers.</p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/intro">Open the handbook</Link>
              <Link className="button button--outline button--lg" to="/glossary">Browse the glossary</Link>
            </div>
          </div>
          <div className={styles.flow} aria-label="Oracle data development learning flow">
            <span>SQL</span><b>→</b><span>PL/SQL</span><b>→</b><span>DWH</span><b>→</b>
            <span>ETL</span><b>→</b><span>Performance</span><b>→</b><span>Operations</span>
          </div>
        </div>
      </div>
    </header>
    <main className="container">
      <section className={styles.summary}>
        <div><strong>40</strong><span>complete chapters</span></div>
        <div><strong>8</strong><span>connected subject areas</span></div>
        <div><strong>C01–C40</strong><span>source explanations retained</span></div>
      </section>
      <section className={styles.catalogue}>
        <div className={styles.sectionHeading}><p>HANDBOOK STRUCTURE</p><h2>One path from foundations to operational data work</h2></div>
        <div className={styles.cards}>
          {areas.map(([range,title,description,to]) => <Link className={styles.card} to={to} key={range}>
            <span className={styles.range}>C{range}</span><h3>{title}</h3><p>{description}</p><span className={styles.open}>Open chapters →</span>
          </Link>)}
        </div>
      </section>
    </main>
  </Layout>;
}
