/**
 * JSON ISWC Docs → Markdown para agentes (GET /LLM.md).
 * Sin DOM. El HTML humano es `buildIssDocsLlmViewHtml` + `<iswc-md-render>`.
 */
import { convertIsCodeToFences } from './postman-md.js';
import { ISS_DOCS_METHODS, type IssDocsMethod } from './iss-docs-piezas.js';

const FLOW_RE = /<(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)\b[\s\S]*?<\/(?:iswc-flowchart|iswc-sequence-diagram|iswc-er-diagram)>/gi;
const TAG_RE = /<\/?[a-z][\s\S]*?>/gi;

function obj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function str(x: unknown): string {
  return typeof x === 'string' ? x.trim() : '';
}

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Prosa para el modelo: sin web components, fences de iswc-code. */
export function issDocToLlmMarkdown(md: string): string {
  let out = convertIsCodeToFences(String(md ?? ''));
  out = out.replace(FLOW_RE, '\n\n_(Diagrama: ver el visor HTML.)_\n\n');
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  out = out.replace(TAG_RE, '');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

type Piezas = {
  info?: { title?: string; description?: string; version?: string };
  paths?: Record<string, Record<string, Record<string, unknown>>>;
  docs?: Record<string, string>;
  general?: { titulo?: string; resumen?: string; secciones?: Array<{ titulo?: string; markdown?: string }> };
};

function piezasFromInput(input: unknown): Piezas {
  if (!obj(input)) return {};
  if (obj(input.meta) || obj(input.general) || (obj(input.config) && input.config.kind === 'config')
    || (obj(input.paths) && input.paths.kind === 'paths')) {
    const meta = obj(input.meta) ? input.meta : {};
    const pathsFile = obj(input.paths) ? input.paths : {};
    const cfg = obj(input.config) ? input.config : {};
    const catalog = obj(cfg.catalog) ? cfg.catalog : {};
    const gen = obj(input.general) ? input.general : {};
    const info = obj(meta.info) ? (meta.info as Piezas['info']) : undefined;
    const secciones = Array.isArray(gen.secciones)
      ? (gen.secciones as Array<{ titulo?: string; markdown?: string }>)
      : undefined;
    return {
      info,
      paths: obj(pathsFile.paths) ? (pathsFile.paths as Piezas['paths']) : undefined,
      docs: obj(catalog.docs) ? (catalog.docs as Record<string, string>) : undefined,
      general: { titulo: str(gen.titulo) || undefined, resumen: str(gen.resumen) || undefined, secciones },
    };
  }
  const catalog = obj(input.catalog) ? input.catalog : {};
  return {
    info: obj(input.info) ? (input.info as Piezas['info']) : undefined,
    paths: obj(input.paths) ? (input.paths as Piezas['paths']) : undefined,
    docs: obj(catalog.docs) ? (catalog.docs as Record<string, string>) : (obj(input.docs) ? (input.docs as Record<string, string>) : undefined),
  };
}

function metodosDe(ops: Record<string, unknown>): Array<[IssDocsMethod, Record<string, unknown>]> {
  const out: Array<[IssDocsMethod, Record<string, unknown>]> = [];
  for (const m of ISS_DOCS_METHODS) {
    if (obj(ops[m])) out.push([m, ops[m] as Record<string, unknown>]);
  }
  return out;
}

/** Markdown canónico para GET /LLM.md. */
export function issDocsToMarkdown(input: unknown): string {
  const p = piezasFromInput(input);
  const title = str(p.info?.title) || str(p.general?.titulo) || 'API';
  const desc = str(p.info?.description) || str(p.general?.resumen);
  const ver = str(p.info?.version);
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  if (desc) {
    lines.push(desc);
    lines.push('');
  }
  if (ver) lines.push(`Versión **${ver}**.`);
  lines.push('Documento generado desde ISWC Docs para agentes. El visor humano es el visor HTML del host; esta página es `/LLM.md`.');
  lines.push('');
  lines.push('## Índice');
  lines.push('');

  const paths = p.paths ?? {};
  const byTag = new Map<string, Array<{ ruta: string; method: string; summary: string; doc?: string; security?: string; description?: string }>>();
  for (const [ruta, ops] of Object.entries(paths)) {
    if (!obj(ops)) continue;
    for (const [method, op] of metodosDe(ops)) {
      const tags = Array.isArray(op.tags) ? op.tags.map((t) => str(t)).filter(Boolean) : [];
      const tag = tags[0] || 'API';
      const row = {
        ruta,
        method: method.toUpperCase(),
        summary: str(op.summary) || `${method.toUpperCase()} ${ruta}`,
        doc: str(op.doc) || undefined,
        security: str(op.security) || undefined,
        description: str(op.description) || undefined,
      };
      const list = byTag.get(tag) ?? [];
      list.push(row);
      byTag.set(tag, list);
    }
  }

  for (const tag of byTag.keys()) {
    lines.push(`- [${tag}](#${slug(tag)})`);
  }
  lines.push('');

  if (p.general?.secciones?.length) {
    lines.push('## Contexto');
    lines.push('');
    for (const s of p.general.secciones) {
      if (str(s.titulo)) lines.push(`### ${s.titulo}`);
      // `str` recorta y devuelve '' si no era cadena: se usa ese resultado en
      // vez del original, que sigue siendo `string | undefined`.
      const markdown = str(s.markdown);
      if (markdown) {
        lines.push('');
        lines.push(issDocToLlmMarkdown(markdown));
        lines.push('');
      }
    }
  }

  const docs = p.docs ?? {};
  for (const [tag, ops] of byTag) {
    lines.push(`## ${tag}`);
    lines.push('');
    for (const op of ops) {
      lines.push(`### \`${op.method}\` \`${op.ruta}\``);
      lines.push('');
      lines.push(`**${op.summary}**`);
      if (op.security === 'bearer') lines.push('');
      if (op.security === 'bearer') lines.push('_Requiere Bearer JWT._');
      if (op.description && op.description !== op.summary) {
        lines.push('');
        lines.push(op.description);
      }
      const doc = op.doc ? str(docs[op.doc]) : '';
      if (doc) {
        lines.push('');
        lines.push(issDocToLlmMarkdown(doc));
      }
      lines.push('');
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export type IssDocsLlmViewOpts = {
  title?: string;
  /** Href same-origin del markdown (p. ej. `/api/LLM.md`). */
  llmMdHref?: string;
  /** Raíz CDN del kit, con `/dist/cdn`. */
  kitCdn: string;
  kitPin?: string;
  palette?: string;
  /** Ruta del visor interactivo en el host; sin ella no se enlaza. */
  visorHref?: string;
};

/** Página HTML: `<iswc-md-render>` pinta el GET /LLM.md. */
export function buildIssDocsLlmViewHtml(opts: IssDocsLlmViewOpts): string {
  const title = esc(opts.title || 'API · LLM.md');
  const href = esc(opts.llmMdHref || 'LLM.md');
  const kit = String(opts.kitCdn || '').replace(/\/+$/, '');
  const pin = str(opts.kitPin);
  const palette = esc(opts.palette || 'contapyme');
  const visor = opts.visorHref ? `El visor interactivo es <a href="${esc(opts.visorHref)}">${esc(opts.visorHref)}</a>.` : '';
  const pinLine = pin && pin !== 'main' ? `L.pin('${esc(pin)}');` : '';
  return `<!DOCTYPE html>
<html lang="es" data-theme="dark" data-palette="${palette}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title}</title>
<meta name="robots" content="noindex"/>
<link rel="stylesheet" href="${esc(kit)}/is-base.min.css"/>
<link rel="stylesheet" href="${esc(kit)}/palettes.min.css"/>
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
    <h1>${title}</h1>
    <a href="${href}">LLM.md</a>
  </header>
  <iswc-callout tone="info">Esto es lo que leen los agentes en <code>${href}</code>. ${visor}</iswc-callout>
  <iswc-md-render readonly placeholder="Cargando…"></iswc-md-render>
</main>
<script type="module">
import { ISWebComponentsLoader as L } from '${esc(kit)}/loader.min.js';
${pinLine}
await L.load('iswc-md-render','iswc-callout','iswc-icon');
const el = document.querySelector('iswc-md-render');
const r = await fetch('${href}', { headers: { accept: 'text/markdown, text/plain;q=0.9' } });
el.value = r.ok ? await r.text() : '# Error\\nNo se pudo cargar ' + '${href}' + ' (' + r.status + ').';
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
