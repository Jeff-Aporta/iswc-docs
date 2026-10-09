import{convertIsCodeToFences as v}from"./postman-md.js";import{ISS_SWAGGER_METHODS as L}from"./iss-swagger-doc.js";const S=/<(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)\b[\s\S]*?<\/(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)>/gi,b=/<\/?[a-z][\s\S]*?>/gi;function n(e){return!!e&&typeof e=="object"&&!Array.isArray(e)}function r(e){return typeof e=="string"?e.trim():""}function A(e){return e.toLowerCase().normalize("NFD").replace(/\p{M}/gu,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}function y(e){let t=v(String(e??""));return t=t.replace(S,`

_(Diagrama: ver el visor HTML \`/is-swagger\`.)_

`),t=t.replace(/<script\b[\s\S]*?<\/script>/gi,""),t=t.replace(b,""),t.replace(/\n{3,}/g,`

`).trim()}function R(e){if(!n(e))return{};if(n(e.meta)||n(e.general)||n(e.config)&&e.config.kind==="config"||n(e.paths)&&e.paths.kind==="paths"){const i=n(e.meta)?e.meta:{},c=n(e.paths)?e.paths:{},g=n(e.config)?e.config:{},s=n(g.catalog)?g.catalog:{},l=n(e.general)?e.general:{},p=n(i.info)?i.info:void 0,f=Array.isArray(l.secciones)?l.secciones:void 0;return{info:p,paths:n(c.paths)?c.paths:void 0,docs:n(s.docs)?s.docs:void 0,general:{titulo:r(l.titulo)||void 0,resumen:r(l.resumen)||void 0,secciones:f}}}const t=n(e.catalog)?e.catalog:{};return{info:n(e.info)?e.info:void 0,paths:n(e.paths)?e.paths:void 0,docs:n(t.docs)?t.docs:n(e.docs)?e.docs:void 0}}function M(e){const t=[];for(const i of L)n(e[i])&&t.push([i,e[i]]);return t}function z(e){const t=R(e),i=r(t.info?.title)||r(t.general?.titulo)||"API",c=r(t.info?.description)||r(t.general?.resumen),g=r(t.info?.version),s=[];s.push(`# ${i}`),s.push(""),c&&(s.push(c),s.push("")),g&&s.push(`Versi\xF3n **${g}**.`),s.push("Documento generado desde IS-Swagger para agentes. El visor humano es `/is-swagger`; esta p\xE1gina es `/LLM.md`."),s.push(""),s.push("## \xCDndice"),s.push("");const l=t.paths??{},p=new Map;for(const[a,m]of Object.entries(l))if(n(m))for(const[o,d]of M(m)){const h=(Array.isArray(d.tags)?d.tags.map($=>r($)).filter(Boolean):[])[0]||"API",k={ruta:a,method:o.toUpperCase(),summary:r(d.summary)||`${o.toUpperCase()} ${a}`,doc:r(d.doc)||void 0,security:r(d.security)||void 0,description:r(d.description)||void 0},w=p.get(h)??[];w.push(k),p.set(h,w)}for(const a of p.keys())s.push(`- [${a}](#${A(a)})`);if(s.push(""),t.general?.secciones?.length){s.push("## Contexto"),s.push("");for(const a of t.general.secciones){r(a.titulo)&&s.push(`### ${a.titulo}`);const m=r(a.markdown);m&&(s.push(""),s.push(y(m)),s.push(""))}}const f=t.docs??{};for(const[a,m]of p){s.push(`## ${a}`),s.push("");for(const o of m){s.push(`### \`${o.method}\` \`${o.ruta}\``),s.push(""),s.push(`**${o.summary}**`),o.security==="bearer"&&s.push(""),o.security==="bearer"&&s.push("_Requiere Bearer JWT._"),o.description&&o.description!==o.summary&&(s.push(""),s.push(o.description));const d=o.doc?r(f[o.doc]):"";d&&(s.push(""),s.push(y(d))),s.push("")}}return s.join(`
`).replace(/\n{3,}/g,`

`).trim()+`
`}function C(e){const t=u(e.title||"API \xB7 LLM.md"),i=u(e.llmMdHref||"LLM.md"),c=String(e.kitCdn||"").replace(/\/+$/,""),g=r(e.kitPin),s=u(e.palette||"contapyme"),l=g&&g!=="main"?`L.pin('${u(g)}');`:"";return`<!DOCTYPE html>
<html lang="es" data-theme="dark" data-palette="${s}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${t}</title>
<meta name="robots" content="noindex"/>
<link rel="stylesheet" href="${u(c)}/is-base.min.css"/>
<link rel="stylesheet" href="${u(c)}/palettes.min.css"/>
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
  <iswc-callout tone="info">Esto es lo que leen los agentes en <code>${i}</code>. El visor interactivo es <a href="is-swagger">/is-swagger</a>.</iswc-callout>
  <iswc-md-render readonly placeholder="Cargando\u2026"></iswc-md-render>
</main>
<script type="module">
import { ISWebComponentsLoader as L } from '${u(c)}/loader.min.js';
${l}
await L.load('iswc-md-render','iswc-callout','iswc-icon');
const el = document.querySelector('iswc-md-render');
const r = await fetch('${i}', { headers: { accept: 'text/markdown, text/plain;q=0.9' } });
el.value = r.ok ? await r.text() : '# Error\\nNo se pudo cargar ' + '${i}' + ' (' + r.status + ').';
<\/script>
</body>
</html>`}function u(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}export{C as buildIssSwaggerLlmViewHtml,y as issDocToLlmMarkdown,z as issSwaggerToMarkdown};
