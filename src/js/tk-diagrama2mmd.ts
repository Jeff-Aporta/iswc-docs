// @ts-nocheck — portado literal desde el .mjs de documentales; se tipa cuando se toque su logica.
/**
 * tk-diagrama2mmd.mjs — JSON nativo del kit is-webcomponents → fuente Mermaid.
 *
 * Fuente unica de la conversion. Vivia en VideosYT/documentales/is-tkts/scripts y se
 * consolido aqui el 2026-09-01 para que la consuman por ruta absoluta tanto los
 * documentales como PatyIA/api/doc, sin copiarse la traduccion cada uno.
 *
 * Cubre 16 motores del kit. Devuelve "" cuando Mermaid no tiene equivalente
 * (Venn), y entonces el consumidor decide si cae a imagen o a un enlace al visor.
 */
import { sequence2mmd } from './tk-json2mmd.js';

const limpiar = (s) => String(s ?? '')
  .replace(/\{\{iconify:\s*\{[^}]*\}\s*\}\}/g, '')
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

/** Texto seguro para Mermaid (mismas sustituciones que el traductor de secuencia). */
const txt = (s) => limpiar(s).replace(/[;|]/g, ',').replace(/"/g, "'");

/** Id válido para Mermaid: ni guiones ni espacios. */
const idSeguro = (s) => String(s ?? '').replace(/[^A-Za-z0-9_]/g, '_') || 'A';

/** Ids cortos y estables por diagrama (n0, n1, …), para no arrastrar los del payload. */
const contador = (prefijo) => {
  const mapa = new Map();
  return (raw) => {
    const clave = String(raw ?? '');
    if (!mapa.has(clave)) mapa.set(clave, `${prefijo}${mapa.size}`);
    return mapa.get(clave);
  };
};

/** Base común de todo lo que sea nodos + aristas (flujo, bloques, componentes, casos de uso, carriles). */
function nodosYAristas({ direction = 'TB', nodos, aristas, subgrafos = [] }) {
  const id = contador('n');
  const dir = ['TB', 'BT', 'LR', 'RL'].includes(direction) ? direction : 'TB';
  const lineas = [`flowchart ${dir}`];
  const forma = (n) => {
    const t = txt(n.label);
    if (n.kind === 'decision') return `${id(n.id)}{"${t}"}`;
    if (n.kind === 'start' || n.kind === 'end') return `${id(n.id)}(["${t}"])`;
    return `${id(n.id)}["${t}"]`;
  };
  for (const g of subgrafos) {
    const dentro = nodos.filter((n) => n.grupo === g.id);
    if (!dentro.length) continue;
    lineas.push(`    subgraph ${id(`sg-${g.id}`)}["${txt(g.name)}"]`);
    for (const n of dentro) lineas.push(`        ${forma(n)}`);
    lineas.push('    end');
  }
  for (const n of nodos.filter((x) => !subgrafos.some((g) => g.id === x.grupo))) {
    lineas.push(`    ${forma(n)}`);
  }
  for (const a of aristas) {
    const etiqueta = a.label ? `|"${txt(a.label)}"|` : '';
    const flecha = a.kind === 'dashed' ? '-.->' : '-->';
    lineas.push(`    ${id(a.from)} ${flecha}${etiqueta} ${id(a.to)}`);
  }
  return lineas.join('\n');
}

const flowchart2mmd = (f) => (!f?.nodes?.length ? '' : nodosYAristas({
  direction: f.direction,
  nodos: f.nodes.map((n) => ({ id: n.id, label: n.label, kind: n.kind, grupo: n.group })),
  aristas: (f.edges ?? []).map((e) => ({ from: e.from, to: e.to, label: e.label, kind: e.kind })),
  subgrafos: (f.groups ?? []).map((g) => ({ id: g.id, name: g.name })),
}));

function state2mmd(sd) {
  if (!sd?.states?.length) return '';
  const id = contador('s');
  const lineas = ['stateDiagram-v2'];
  // Los pseudoestados inicial y final son `[*]` en Mermaid, no estados con nombre.
  const ref = (sid) => {
    const s = sd.states.find((x) => x.id === sid);
    return (s?.kind === 'start' || s?.kind === 'end') ? '[*]' : id(sid);
  };
  for (const s of sd.states) {
    if (s.kind === 'start' || s.kind === 'end') continue;
    lineas.push(`    ${id(s.id)} : ${txt(s.label || s.id)}`);
  }
  for (const t of sd.transitions ?? []) {
    lineas.push(`    ${ref(t.from)} --> ${ref(t.to)}${t.label ? ` : ${txt(t.label)}` : ''}`);
  }
  return lineas.join('\n');
}

function er2mmd(er) {
  if (!er?.entities?.length) return '';
  const lineas = ['erDiagram'];
  for (const r of er.relations ?? []) {
    const izq = r.fromCard === 'many' ? '}o' : '||';
    const der = r.toCard === 'many' ? 'o{' : '||';
    lineas.push(`    ${idSeguro(r.from)} ${izq}--${der} ${idSeguro(r.to)} : "${txt(r.label || 'relaciona')}"`);
  }
  for (const e of er.entities) {
    lineas.push(`    ${idSeguro(e.id)} {`);
    for (const a of e.attributes ?? []) {
      // En Mermaid, PK y FK son PALABRAS CLAVE de la tercera columna, no tipos:
      // usarlas como tipo (que es como viajan en el payload del kit) rompe el
      // parser entero. Se mueven a su sitio y el tipo cae a `campo`.
      const bruto = String(a.type ?? '').trim().toUpperCase();
      const clave = bruto === 'PK' || bruto === 'FK' ? ` ${bruto}` : '';
      const tipo = clave ? 'campo' : idSeguro(a.type || 'campo');
      lineas.push(`        ${tipo} ${idSeguro(a.name)}${clave}`);
    }
    lineas.push('    }');
  }
  return lineas.join('\n');
}

function class2mmd(cd) {
  if (!cd?.classes?.length) return '';
  const lineas = ['classDiagram'];
  for (const c of cd.classes) {
    lineas.push(`    class ${idSeguro(c.id)}["${txt(c.name)}"] {`);
    for (const a of c.attributes ?? []) lineas.push(`        ${txt(a.name)}`);
    for (const m of c.methods ?? []) lineas.push(`        ${txt(m.name)}`);
    lineas.push('    }');
  }
  const rel = { inheritance: '--|>', dependency: '..>', composition: '--*', aggregation: '--o' };
  for (const r of cd.relations ?? []) {
    lineas.push(`    ${idSeguro(r.from)} ${rel[r.kind] ?? '-->'} ${idSeguro(r.to)}${r.label ? ` : ${txt(r.label)}` : ''}`);
  }
  return lineas.join('\n');
}

function gantt2mmd(g) {
  if (!g?.tasks?.length) return '';
  const grupos = new Map((g.groups ?? []).map((x) => [x.id, x.name]));
  const lineas = ['gantt', `    title ${txt(g.title || 'Cronograma')}`, `    dateFormat ${g.dateFormat || 'YYYY-MM-DD'}`];
  let seccion = null;
  for (const t of g.tasks) {
    if (t.group && t.group !== seccion) {
      seccion = t.group;
      lineas.push(`    section ${txt(grupos.get(t.group) || t.group)}`);
    }
    const marca = t.milestone ? 'milestone, ' : '';
    // Mermaid exige duracion tambien en los hitos: sin ella el gantt entero no compila.
    const fin = t.duration ? `, ${t.duration}` : (t.end ? `, ${t.end}` : (t.milestone ? ', 0d' : ''));
    lineas.push(`    ${txt(t.label)} :${marca}${idSeguro(t.id)}, ${t.start}${fin}`);
  }
  return lineas.join('\n');
}

const timeline2mmd = (tl) => (!tl?.events?.length ? '' : [
  'timeline',
  `    title ${txt(tl.title || 'Línea de tiempo')}`,
  ...tl.events.map((e) => `    ${txt(e.date)} : ${txt(e.label)}`),
].join('\n'));

function mindmap2mmd(mm) {
  if (!mm?.nodes?.length) return '';
  const hijos = new Map();
  for (const n of mm.nodes) {
    const p = n.parent ?? '__raiz';
    if (!hijos.has(p)) hijos.set(p, []);
    hijos.get(p).push(n);
  }
  const lineas = ['mindmap'];
  const pintar = (n, nivel) => {
    lineas.push(`${'  '.repeat(nivel)}${txt(n.label)}`);
    for (const h of hijos.get(n.id) ?? []) pintar(h, nivel + 1);
  };
  for (const raiz of hijos.get('__raiz') ?? []) pintar(raiz, 1);
  return lineas.join('\n');
}

function sankey2mmd(sk) {
  if (!sk?.links?.length) return '';
  const nombre = new Map((sk.nodes ?? []).map((n) => [n.id, n.label ?? n.id]));
  // Tres reglas del `sankey-beta` que no están en su documentación y cuestan
  // un "Parse error on line 2" mudo:
  //   - la coma separa columnas: no puede aparecer dentro de una etiqueta;
  //   - las filas van pegadas a la cabecera, sin línea en blanco;
  //   - las tildes rompen el parser, así que se quitan SOLO en esta copia
  //     Mermaid (el PNG del componente conserva el texto correcto).
  const celda = (v) => txt(nombre.get(v) ?? v)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/,/g, ' ');
  return ['sankey-beta', ...sk.links.map((l) => `${celda(l.from)},${celda(l.to)},${l.value}`)].join('\n');
}

function quadrant2mmd(q) {
  if (!q?.points?.length) return '';
  const lineas = ['quadrantChart', `    title ${txt(q.title || 'Matriz')}`];
  if (q.xAxis?.left || q.xAxis?.right) lineas.push(`    x-axis ${txt(q.xAxis.left || 'bajo')} --> ${txt(q.xAxis.right || 'alto')}`);
  if (q.yAxis?.bottom || q.yAxis?.top) lineas.push(`    y-axis ${txt(q.yAxis.bottom || 'bajo')} --> ${txt(q.yAxis.top || 'alto')}`);
  const c = q.quadrants ?? {};
  if (c.topRight) lineas.push(`    quadrant-1 ${txt(c.topRight)}`);
  if (c.topLeft) lineas.push(`    quadrant-2 ${txt(c.topLeft)}`);
  if (c.bottomLeft) lineas.push(`    quadrant-3 ${txt(c.bottomLeft)}`);
  if (c.bottomRight) lineas.push(`    quadrant-4 ${txt(c.bottomRight)}`);
  for (const p of q.points) lineas.push(`    ${txt(p.label)}: [${p.x}, ${p.y}]`);
  return lineas.join('\n');
}

const block2mmd = (bd) => (!bd?.blocks?.length ? '' : nodosYAristas({
  direction: 'LR',
  nodos: bd.blocks.map((b) => ({ id: b.id, label: b.label })),
  aristas: (bd.edges ?? []).map((e) => ({ from: e.from, to: e.to, label: e.label, kind: e.kind })),
}));

const component2mmd = (cd) => (!cd?.components?.length ? '' : nodosYAristas({
  direction: 'LR',
  nodos: cd.components.map((c) => ({ id: c.id, label: c.stereotype ? `<<${c.stereotype}>> ${c.label}` : c.label })),
  aristas: (cd.links ?? []).map((l) => ({ from: l.from, to: l.to, label: l.label })),
}));

/** Casos de uso: los actores entran como nodos redondeados; los estereotipos, como etiqueta. */
const useCase2mmd = (uc) => (!uc?.cases?.length ? '' : nodosYAristas({
  direction: 'LR',
  nodos: [
    ...(uc.actors ?? []).map((a) => ({ id: a.id, label: `Actor: ${a.label}`, kind: 'start' })),
    ...uc.cases.map((c) => ({ id: c.id, label: c.label })),
  ],
  aristas: (uc.links ?? []).map((l) => ({
    from: l.from,
    to: l.to,
    label: l.kind === 'include' ? 'include'
      : l.kind === 'extend' ? 'extend'
        : l.kind === 'generalization' ? 'es un' : l.label,
    kind: (l.kind === 'include' || l.kind === 'extend') ? 'dashed' : undefined,
  })),
}));

/** Carriles: cada carril es un subgrafo, que es lo más cercano que tiene Mermaid. */
const swimlane2mmd = (sw) => (!sw?.steps?.length ? '' : nodosYAristas({
  direction: 'LR',
  nodos: sw.steps.map((s) => ({ id: s.id, label: s.label, kind: s.kind, grupo: s.lane })),
  aristas: (sw.links ?? []).map((l) => ({ from: l.from, to: l.to, label: l.label })),
  subgrafos: (sw.lanes ?? []).map((l) => ({ id: l.id, name: l.name })),
}));

function journey2mmd(j) {
  if (!j?.steps?.length) return '';
  const fases = new Map((j.phases ?? []).map((f) => [f.id, f.name]));
  const lineas = ['journey', `    title ${txt(j.title || 'Recorrido')}`];
  let seccion = null;
  for (const s of j.steps) {
    if (s.phase !== seccion) {
      seccion = s.phase;
      lineas.push(`    section ${txt(fases.get(s.phase) || s.phase)}`);
    }
    lineas.push(`      ${txt(s.label)}: ${s.score ?? 3}: ${txt(s.actor || 'Equipo')}`);
  }
  return lineas.join('\n');
}

const TRADUCTORES = {
  'iswc-sequence-diagram': (doc) => sequence2mmd(doc.sequence),
  'iswc-flowchart': (doc) => flowchart2mmd(doc.flowchart),
  'iswc-state-diagram': (doc) => state2mmd(doc.stateDiagram),
  'iswc-er-diagram': (doc) => er2mmd(doc.erDiagram),
  'iswc-class-diagram': (doc) => class2mmd(doc.classDiagram),
  'iswc-gantt': (doc) => gantt2mmd(doc.gantt),
  'iswc-timeline': (doc) => timeline2mmd(doc.timeline),
  'iswc-mindmap': (doc) => mindmap2mmd(doc.mindmap),
  'iswc-sankey-diagram': (doc) => sankey2mmd(doc.sankey),
  'iswc-quadrant-chart': (doc) => quadrant2mmd(doc.quadrant),
  'iswc-block-diagram': (doc) => block2mmd(doc.blockDiagram),
  'iswc-component-diagram': (doc) => component2mmd(doc.componentDiagram),
  'iswc-use-case-diagram': (doc) => useCase2mmd(doc.useCase),
  'iswc-swimlane-diagram': (doc) => swimlane2mmd(doc.swimlane),
  'iswc-journey-map': (doc) => journey2mmd(doc.journey),
  // iswc-venn-diagram: Mermaid no tiene diagrama de Venn. Se queda el PNG.
};

/** Documento `<TK>-diagrama.json` (cualquier motor) → fuente Mermaid, o ''. */
export function diagramaTk2mmd(doc) {
  if (!doc) return '';
  if (doc.source) return String(doc.source).replace(/\r\n/g, '\n').trim();
  const traductor = TRADUCTORES[String(doc.engine ?? '').toLowerCase()];
  try {
    return traductor ? traductor(doc) : '';
  } catch {
    // Un payload raro no puede tumbar la generación del documento entero.
    return '';
  }
}
