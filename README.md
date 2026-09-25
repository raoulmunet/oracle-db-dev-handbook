# Oracle Data Developer Handbook

Complete English Docusaurus edition of the C01–C40 Oracle Data Developer course.

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

The published handbook is available at:

<https://raoulmunet.github.io/oracle-db-dev-handbook/>

The included GitHub Actions workflow builds and deploys the site automatically
after each push to `main`.

`docusaurus.config.js` derives the GitHub owner and repository name from GitHub Actions environment variables, so project pages and `<username>.github.io` repositories both work without hard-coding your username.
