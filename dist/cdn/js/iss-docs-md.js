import{convertIsCodeToFences as v}from"./postman-md.js";import{ISS_DOCS_METHODS as L}from"./iss-docs-piezas.js";const b=/<(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)\b[\s\S]*?<\/(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)>/gi,D=/<\/?[a-z][\s\S]*?>/gi;function n(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function r(e){return typeof e=="string"?e.trim():""}function M(e){return e.toLowerCase().normalize("NFD").replace(/\p{M}/gu,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}function y(e){let t=v(String(e??""));return t=t.replace(b,`

_(Diagrama: ver el visor HTML.)_

`),t=t.replace(/<script\b[\s\S]*?<\/script>/gi,""),t=t.replace(D,""),t.replace(/\n{3,}/g,`

`).trim()}function A(e){if(!n(e))return{};if(n(e.meta)||n(e.general)||n(e.config)&&e.config.kind==="config"||n(e.paths)&&e.paths.kind==="paths"){const i=n(e.meta)?e.meta:{},c=n(e.paths)?e.paths:{},d=n(e.config)?e.config:{},s=n(d.catalog)?d.catalog:{},m=n(e.general)?e.general:{},u=n(i.info)?i.info:void 0,p=Array.isArray(m.secciones)?m.secciones:void 0;return{info:u,paths:n(c.paths)?c.paths:void 0,docs:n(s.docs)?s.docs:void 0,general:{titulo:r(m.titulo)||void 0,resumen:r(m.resumen)||void 0,secciones:p}}}const t=n(e.catalog)?e.catalog:{};return{info:n(e.info)?e.info:void 0,paths:n(e.paths)?e.paths:void 0,docs:n(t.docs)?t.docs:n(e.docs)?e.docs:void 0}}function R(e){const t=[];for(const i of L)n(e[i])&&t.push([i,e[i]]);return t}function P(e){const t=A(e),i=r(t.info?.title)||r(t.general?.titulo)||"API",c=r(t.info?.description)||r(t.general?.resumen),d=r(t.info?.version),s=[];s.push(`# ${i}`),s.push(""),c&&(s.push(c),s.push("")),d&&s.push(`Versi\xF3n **${d}**.`),s.push("Documento generado desde ISWC Docs para agentes. El visor humano es el visor HTML del host; esta p\xE1gina es `/LLM.md`."),s.push(""),s.push("## \xCDndice"),s.push("");const m=t.paths??{},u=new Map;for(const[a,f]of Object.entries(m))if(n(f))for(const[o,l]of R(f)){const h=(Array.isArray(l.tags)?l.tags.map($=>r($)).filter(Boolean):[])[0]||"API",k={ruta:a,method:o.toUpperCase(),summary:r(l.summary)||`${o.toUpperCase()} ${a}`,doc:r(l.doc)||void 0,security:r(l.security)||void 0,description:r(l.description)||void 0},w=u.get(h)??[];w.push(k),u.set(h,w)}for(const a of u.keys())s.push(`- [${a}](#${M(a)})`);if(s.push(""),t.general?.secciones?.length){s.push("## Contexto"),s.push("");for(const a of t.general.secciones){r(a.titulo)&&s.push(`### ${a.titulo}`);const f=r(a.markdown);f&&(s.push(""),s.push(y(f)),s.push(""))}}const p=t.docs??{};for(const[a,f]of u){s.push(`## ${a}`),s.push("");for(const o of f){s.push(`### \`${o.method}\` \`${o.ruta}\``),s.push(""),s.push(`**${o.summary}**`),o.security==="bearer"&&s.push(""),o.security==="bearer"&&s.push("_Requiere Bearer JWT._"),o.description&&o.description!==o.summary&&(s.push(""),s.push(o.description));const l=o.doc?r(p[o.doc]):"";l&&(s.push(""),s.push(y(l))),s.push("")}}return s.join(`
`).replace(/\n{3,}/g,`

`).trim()+`
`}function S(e){const t=g(e.title||"API \xB7 LLM.md"),i=g(e.llmMdHref||"LLM.md"),c=String(e.kitCdn||"").replace(/\/+$/,""),d=r(e.kitPin),s=g(e.palette||"contapyme"),m=e.visorHref?`El visor interactivo es <a href="${g(e.visorHref)}">${g(e.visorHref)}</a>.`:"",u=d&&d!=="main"?`L.pin('${g(d)}');`:"";return`<!DOCTYPE html>
<html lang="es" data-theme="dark" data-palette="${s}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${t}</title>
<meta name="robots" content="noindex"/>
<link rel="stylesheet" href="${g(c)}/is-base.min.css"/>
<link rel="stylesheet" href="${g(c)}/palettes.min.css"/>
<style>
  html,body{margin:0;min-height:100%;font-family:var(--is-font-sans,system-ui,sans-serif)}
  .llm-view{max-width:52rem;margin:0 auto;padding:1.25rem 1.5rem 3rem}
  .llm-view__hdr{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.25rem}
  .llm-view__hdr h1{margin:0;font-size:1.15rem;font-weight:650}
  .llm-view a{color:var(--is-accent,#38bdf8)}
</style>
</head>
<body>
<main class="llm-view">
  <header class="llm-view__hdr">
    <h1>${t}</h1>
    <a href="${i}">LLM.md</a>
  </header>
  <iswc-callout tone="info">Esto es lo que leen los agentes en <code>${i}</code>. ${m}</iswc-callout>
  <iswc-md-render readonly placeholder="Cargando\u2026"></iswc-md-render>
</main>
<script type="module">
import { ISWebComponentsLoader as L } from '${g(c)}/loader.min.js';
${u}
await L.load('iswc-md-render','iswc-callout','iswc-icon');
const el = document.querySelector('iswc-md-render');
const r = await fetch('${i}', { headers: { accept: 'text/markdown, text/plain;q=0.9' } });
el.value = r.ok ? await r.text() : '# Error\\nNo se pudo cargar ' + '${i}' + ' (' + r.status + ').';
<\/script>
</body>
</html>`}function g(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}export{S as buildIssDocsLlmViewHtml,y as issDocToLlmMarkdown,P as issDocsToMarkdown};
