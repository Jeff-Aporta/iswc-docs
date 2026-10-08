// @ts-nocheck — mismo estilo que su hermano tk-diagrama2mmd.
/**
 * tk-diagrama2webcomponents.ts — JSON nativo del kit → etiquetas de is-webcomponents.
 *
 * Hermana de `tk-diagrama2mmd`: misma entrada, otra salida. Mermaid sirve para GitHub, que no
 * ejecuta JavaScript; esto sirve para un visor propio, donde el kit dibuja el diagrama de verdad
 * — con sus grupos, colores y el `open-on-click`.
 *
 * Traduce mejor que Mermaid en dos sentidos: no pierde nada por el camino (el JSON viaja entero
 * dentro del componente) y cubre motores que Mermaid no tiene, como el Venn.
 *
 * El `engine` del documento ES el nombre de la etiqueta, así que no hay tabla que mantener: lo
 * que el kit sepa pintar, esto lo emite.
 */

const MOTORES = new Set([
  'iswc-sequence-diagram', 'iswc-flowchart', 'iswc-state-diagram', 'iswc-er-diagram',
  'iswc-class-diagram', 'iswc-gantt', 'iswc-timeline', 'iswc-mindmap', 'iswc-sankey-diagram',
  'iswc-quadrant-chart', 'iswc-block-diagram', 'iswc-component-diagram', 'iswc-use-case-diagram',
  'iswc-swimlane-diagram', 'iswc-journey-map', 'iswc-venn-diagram',
]);

/** Módulo y hoja del kit que hace falta para un motor. El kit no publica bundle único. */
export function activosDe(engine: string): { js: string; css: string } | null {
  const tag = String(engine ?? '').toLowerCase();
  if (!MOTORES.has(tag)) return null;
  const base = tag.replace(/^is-/, '');
  return { js: `diagrams/${base}.min.js`, css: `diagrams/${base}.min.css` };
}

/** `</script>` dentro del JSON cerraría la etiqueta antes de tiempo. */
function seguro(json: string): string {
  return json.replace(/<\/script/gi, '<\\/script');
}

/**
 * Documento de diagrama → etiqueta del kit lista para insertar.
 * Devuelve '' si el motor no se reconoce, igual que hace la versión Mermaid.
 */
export function diagramaTk2webcomponent(doc, opciones = {}) {
  if (!doc) return '';
  const tag = String(doc.engine ?? '').toLowerCase();
  if (!MOTORES.has(tag)) return '';

  // El payload viaja bajo su propia clave (sequence, flowchart, erDiagram…); se manda el
  // documento entero menos los metadatos, que no son del componente.
  const { engine, alt, _doc, source, ...resto } = doc;
  const cuerpo = Object.keys(resto).length ? resto : doc;

  const attrs = [];
  if (opciones.abrirAlClic !== false) attrs.push('open-on-click');
  if (alt) attrs.push(`alt="${String(alt).replace(/"/g, '&quot;')}"`);
  const abre = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`;
  return `${abre}\n<script type="application/json">\n${seguro(JSON.stringify(cuerpo, null, 2))}\n</script>\n</${tag}>`;
}

/** Motores presentes en un conjunto de documentos: para cargar solo lo que se usa. */
export function motoresUsados(docs) {
  const vistos = new Set();
  for (const d of docs ?? []) {
    const tag = String(d?.engine ?? '').toLowerCase();
    if (MOTORES.has(tag)) vistos.add(tag);
  }
  return [...vistos].sort();
}
