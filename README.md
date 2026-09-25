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

1. Create the GitHub repository `oracle-db-dev-handbook`.
2. Push this project to `main`.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. The included workflow builds and deploys the site automatically.

`docusaurus.config.js` derives the GitHub owner and repository name from GitHub Actions environment variables, so project pages and `<username>.github.io` repositories both work without hard-coding your username.
