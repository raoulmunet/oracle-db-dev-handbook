# Oracle DB Developer Handbook

A practical technical reference for Oracle SQL, PL/SQL, DWH and data engineering.

The handbook is organized as a comprehensive C01–C40 reference covering SQL, PL/SQL, Oracle architecture, performance tuning, Data Warehouse concepts, ETL/ELT, data modeling, data quality, reconciliation, lineage and banking data operations.

## Published site

https://raoulmunet.github.io/oracle-db-dev-handbook/

## Local run

```bash
npm install
npm run start
```

Requires Node.js 20+.

## Production build

```bash
npm run build
npm run serve
```

## GitHub Pages

The included GitHub Actions workflow builds and deploys the site automatically after each push to `main`.

`docusaurus.config.js` derives the GitHub owner and repository name from GitHub Actions environment variables, so project pages and `<username>.github.io` repositories both work without hard-coding the username.
