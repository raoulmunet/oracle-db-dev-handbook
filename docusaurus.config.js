// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const owner = process.env.GITHUB_REPOSITORY_OWNER || 'YOUR_GITHUB_USERNAME';
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'oracle-db-dev-handbook';
const isUserSite = repository === `${owner}.github.io`;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Oracle DB Developer Handbook',
  tagline: 'Practical reference for Oracle SQL, PL/SQL, DWH and data engineering',
  favicon: 'img/favicon.ico',
  url: `https://${owner}.github.io`,
  baseUrl: isUserSite ? '/' : `/${repository}/`,
  organizationName: owner,
  projectName: repository,
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {mermaid: true},
  themes: ['@docusaurus/theme-mermaid'],
  presets: [[
    'classic',
    {
      docs: {sidebarPath: './sidebars.js', routeBasePath: '/', editUrl: undefined},
      blog: false,
      theme: {customCss: './src/css/custom.css'},
      sitemap: {changefreq: 'weekly', priority: 0.5},
    },
  ]],
  themeConfig: {
    navbar: {
      title: 'Oracle DB Developer',
      items: [
        {type:'docSidebar', sidebarId:'courseSidebar', position:'left', label:'Handbook'},
        {to:'/glossary', label:'Glossary', position:'left'},
        {href:`https://github.com/${owner}/${repository}`, label:'GitHub', position:'right'},
      ],
    },
    footer: {style:'dark', links:[{title:'Handbook',items:[{label:'Start',to:'/intro'},{label:'Glossary',to:'/glossary'}]}], copyright:`Copyright © ${new Date().getFullYear()} · Oracle DB Developer Handbook`},
    prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula, additionalLanguages:['sql','bash','java']},
  },
};
export default config;
