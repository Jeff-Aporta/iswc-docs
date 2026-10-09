/**
 * postman-md.ts — convierte el markdown InSoft (`x-iss-doc-md`) a algo que
 * Postman pueda pintar: diagramas `is-*` → `<img src="data:image/png;base64,…">`
 * con fondo transparente, y `<iswc-code>` → fences ```lang.
 *
 * La rasterización de diagramas solo corre en el navegador (necesita el kit
 * cargado y un SVG real). Fuera de DOM, los bloques de diagrama se omiten con
 * un aviso en texto.
 */

const EXT_DOC_MD = 'x-iss-doc-md';

/** Tags de diagrama del kit que el export sabe rasterizar. */
export const POSTMAN_DIAGRAM_TAGS = [
  'iswc-flowchart',
  'iswc-sequence-diagram',
  'iswc-state-diagram',
  'iswc-block-diagram',
  'iswc-swimlane-diagram',
  'iswc-component-diagram',
  'iswc-class-diagram',
  'iswc-er-diagram',
  'iswc-mindmap',
  'iswc-gantt',
  'iswc-timeline',
  'iswc-org-chart',
  'iswc-journey-map',
  'iswc-sankey-diagram',
  'iswc-venn-diagram',
  'iswc-use-case-diagram',
  'iswc-quadrant-chart',
] as const;

const DIAGRAM_BLOCK_RE = new RegExp(
  `<(${POSTMAN_DIAGRAM_TAGS.join('|')})\\b[\\s\\S]*?<\\/\\1>`,
  'gi',
);

const IS_CODE_RE = /<iswc-code\b([^>]*)>([\s\S]*?)<\/iswc-code>/gi;

function decodeHtmlEntities(s: string): string {
  return String(s ?? '')
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function attrOf(attrs: string, name: string): string | null {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')`, 'i');
  const m = attrs.match(re);
  return m ? (m[1] ?? m[2] ?? '') : null;
}

/** `<iswc-code lang="http" value="…">` / hijos → fence markdown. */
export function convertIsCodeToFences(md: string): string {
  return String(md ?? '').replace(IS_CODE_RE, (_full, attrs: string, body: string) => {
    const lang = attrOf(attrs, 'lang') || '';
    const valueAttr = attrOf(attrs, 'value');
    const code = (valueAttr != null ? decodeHtmlEntities(valueAttr) : String(body ?? ''))
      .replace(/^\n/, '')
      .replace(/\n$/, '');
    return `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  });
}

function waitFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function waitForSvg(host: Element, ms = 4000): Promise<SVGSVGElement | null> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const root = (host as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
    const svg = root?.querySelector?.('svg') as SVGSVGElement | null;
    if (svg && (svg.getBoundingClientRect().width > 0 || svg.viewBox?.baseVal?.width > 0)) {
      return svg;
    }
    await waitFrame();
  }
  const root = (host as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
  return (root?.querySelector?.('svg') as SVGSVGElement | null) ?? null;
}

/** SVG del shadow → PNG data-URL con fondo transparente. */
export async function svgToTransparentPngDataUrl(svg: SVGSVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('xmlns:xlink')) {
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }

  let w = svg.viewBox?.baseVal?.width || 0;
  let h = svg.viewBox?.baseVal?.height || 0;
  if (!w || !h) {
    try {
      const box = svg.getBBox();
      w = Math.ceil(box.x + box.width) || svg.clientWidth || 640;
      h = Math.ceil(box.y + box.height) || svg.clientHeight || 360;
    } catch {
      w = svg.clientWidth || 640;
      h = svg.clientHeight || 360;
    }
  }
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No se pudo rasterizar el SVG del diagrama'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(w));
    canvas.height = Math.max(1, Math.ceil(h));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D no disponible');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Monta un bloque `is-*` offscreen, espera el SVG y lo pasa a PNG. */
export async function rasterizeDiagramHtml(html: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  Object.assign(wrap.style, {
    position: 'fixed',
    left: '-12000px',
    top: '0',
    width: '960px',
    background: 'transparent',
    pointerEvents: 'none',
    zIndex: '-1',
  } as CSSStyleDeclaration);
  document.body.appendChild(wrap);

  try {
    wrap.innerHTML = html;
    const host = wrap.firstElementChild as (HTMLElement & {
      updateComplete?: () => Promise<unknown>;
      payload?: unknown;
    }) | null;
    if (!host) return null;

    if (typeof host.updateComplete === 'function') {
      await host.updateComplete();
    }
    await waitFrame();
    await waitFrame();

    const svg = await waitForSvg(host);
    if (!svg) return null;
    return await svgToTransparentPngDataUrl(svg);
  } catch {
    return null;
  } finally {
    wrap.remove();
  }
}

/** Sustituye cada diagrama del MD por `<img src="data:image/png;base64,…">`. */
export async function convertDiagramsToPngImgs(md: string): Promise<string> {
  const src = String(md ?? '');
  const matches = [...src.matchAll(DIAGRAM_BLOCK_RE)];
  if (!matches.length) return src;

  let out = src;
  // De atrás hacia adelante para no invalidar índices.
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const m = matches[i]!;
    const block = m[0];
    const start = m.index ?? 0;
    const end = start + block.length;
    const dataUrl = await rasterizeDiagramHtml(block);
    const replacement = dataUrl
      ? `\n<img alt="Diagrama de flujo" src="${dataUrl}" />\n`
      : '\n_(Diagrama no disponible en esta exportación)_\n';
    out = out.slice(0, start) + replacement + out.slice(end);
  }
  return out;
}

/** Pipeline completo: diagramas → PNG, `iswc-code` → fences. */
export async function issDocMdForPostman(md: string): Promise<string> {
  const withImgs = await convertDiagramsToPngImgs(md);
  return convertIsCodeToFences(withImgs).trim();
}

export function opDocMd(op: Record<string, unknown> | null | undefined): string {
  if (!op) return '';
  const md = op[EXT_DOC_MD];
  if (typeof md === 'string' && md.trim()) return md;
  if (typeof op.description === 'string') return op.description;
  if (typeof op.summary === 'string') return op.summary;
  return '';
}
