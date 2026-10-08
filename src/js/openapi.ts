/**
 * openapi.ts — lectura de un documento OpenAPI 3.x.
 *
 * Módulo puro: no toca el DOM ni la red. Todo lo que el visor necesita saber
 * de una spec sale de aquí, y por eso es lo único que los tests tienen que
 * cubrir para garantizar que la vista pinta lo correcto.
 *
 * Extensiones propias que se respetan (`x-*`):
 *   x-isa-subgroup    en la operación → id del subgrupo dentro del tag
 *   x-isa-subgroups   en el tag       → definición y orden de esos subgrupos
 *   x-iss-doc-md      en la operación → markdown de la pestaña «Doc»
 *   x-iss-lookup      en el parámetro → autocompletado remoto
 */

/* `query` va en la lista o las operaciones que lo usan no existen para el visor: `listOperations`
   recorre exactamente estos métodos, así que las que quedaban fuera no se agrupaban, no salían en el
   índice y no había forma de abrirlas. El API tiene tres (/conversaciones, /auditoria/terceros y
   /file/query) y ninguna aparecía. */
const HTTP_METHODS: SwMetodo[] = ['get', 'post', 'put', 'patch', 'delete', 'query', 'options', 'head'];

const EXT_SUBGROUP = 'x-isa-subgroup';
const EXT_SUBGROUPS = 'x-isa-subgroups';
const EXT_DOC_MD = 'x-iss-doc-md';
const EXT_LOOKUP = 'x-iss-lookup';

const subgroupDefs = (tagMeta: SwTag | Record<string, unknown> | undefined): SwSubgrupoDef[] => {
  const raw = (tagMeta as Record<string, unknown> | undefined)?.[EXT_SUBGROUPS];
  return Array.isArray(raw) ? (raw as SwSubgrupoDef[]) : [];
};

function resolveSubgroupDef(tagMeta: SwTag | Record<string, unknown> | undefined, subgroupId: string): SwSubgrupoDef {
  const hit = subgroupDefs(tagMeta).find((d) => d?.id === subgroupId);
  if (hit) return { ...hit };
  if (subgroupId) return { id: subgroupId, name: subgroupId, icon: 'mdi:folder-outline' };
  return { id: 'general', name: 'General', icon: 'mdi:folder-outline' };
}

/** Orden declarado en el tag primero; lo no declarado, detrás y en orden de aparición. */
function orderSubgroups(subgroupMap: Map<string, SwSubgrupo>, tagMeta: SwTag | Record<string, unknown> | undefined): SwSubgrupo[] {
  const ordenados: SwSubgrupo[] = [];
  const vistos = new Set<string>();
  for (const def of subgroupDefs(tagMeta)) {
    const id = def?.id;
    if (!id || !subgroupMap.has(id)) continue;
    ordenados.push(subgroupMap.get(id)!);
    vistos.add(id);
  }
  for (const [id, sub] of subgroupMap) {
    if (!vistos.has(id)) ordenados.push(sub);
  }
  return ordenados.filter((s) => s.operations?.length);
}

/** Id estable de la operación. Sin `operationId`, se deriva de método + ruta. */
export function opIdFromOperation(op: SwOperation | undefined, method: string, path: string): string {
  if (op?.operationId) return op.operationId;
  return (
    `${method}_` +
    path
      .replace(/\{(\w+)\}/g, 'by_$1')
      .replace(/[^\w]+/g, '_')
      .replace(/^_|_$/g, '')
  );
}

/** Primer ejemplo utilizable de un media type: `example` → `examples` → `schema.example`. */
export function extractJsonExample(media: SwMediaType | undefined): unknown {
  if (!media || typeof media !== 'object') return undefined;
  if (media.example !== undefined) return media.example;
  if (media.examples && typeof media.examples === 'object') {
    for (const key of Object.keys(media.examples)) {
      const ex = media.examples[key];
      if (ex && ex.value !== undefined) return ex.value;
    }
  }
  if (media.schema?.example !== undefined) return media.schema.example;
  return undefined;
}

export function listOperations(spec: SwSpec | null | undefined): SwOp[] {
  const paths = spec?.paths ?? {};
  const out: SwOp[] = [];
  for (const path of Object.keys(paths)) {
    const item = paths[path];
    if (!item || typeof item !== 'object') continue;
    for (const method of HTTP_METHODS) {
      const op = item[method];
      if (!op) continue;
      out.push({
        ...op,
        path,
        method,
        operationId: opIdFromOperation(op, method, path),
      });
    }
  }
  return out;
}

export function groupOperationsByTag(spec: SwSpec | null | undefined): SwGrupo[] {
  const ops = listOperations(spec);
  const tagMeta = new Map<string, SwTag>();
  for (const t of spec?.tags ?? []) {
    if (t?.name) tagMeta.set(t.name, t);
  }

  type Acc = { name: string; description: string; meta: SwTag | Record<string, never>; operations: SwOp[]; subgroupMap: Map<string, SwSubgrupo>; };
  const groups = new Map<string, Acc>();

  for (const op of ops) {
    const tags = op.tags?.length ? op.tags : ['General'];
    for (const name of tags) {
      if (!groups.has(name)) {
        const meta = tagMeta.get(name) ?? ({} as Record<string, never>);
        groups.set(name, {
          name,
          description: (meta as SwTag).description ?? '',
          meta,
          operations: [],
          subgroupMap: new Map(),
        });
      }
      const g = groups.get(name)!;
      g.operations.push(op);

      const subgroupId = String(op[EXT_SUBGROUP] ?? '').trim();
      // Sin subgrupo declarado se acumula en una clave reservada que nunca
      // colisiona con un id real; si nadie declara ninguno, se descarta entera.
      const subKey = subgroupId || '__default__';
      if (!g.subgroupMap.has(subKey)) {
        g.subgroupMap.set(subKey, { ...resolveSubgroupDef(g.meta, subgroupId), operations: [] });
      }
      g.subgroupMap.get(subKey)!.operations.push(op);
    }
  }

  return [...groups.values()].map((g) => {
    const subgroups = orderSubgroups(g.subgroupMap, g.meta);
    const conNombre = subgroups.some((s) => s.id && s.id !== 'general' && s.id !== '__default__');
    return {
      name: g.name,
      description: g.description,
      meta: g.meta,
      operations: g.operations,
      subgroups: conNombre ? subgroups : [],
    };
  });
}

/** Grupos en el orden en que `spec.tags` los declara; el resto, alfabético al final. */
export function sortGroupsBySpecOrder(groups: SwGrupo[], spec: SwSpec | null | undefined): SwGrupo[] {
  const orden = (spec?.tags ?? []).map((t) => t.name);
  return [...groups].sort((a, b) => {
    const ia = orden.indexOf(a.name);
    const ib = orden.indexOf(b.name);
    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

/** `operationId` → markdown de la pestaña «Doc». */
export function buildDocIndex(spec: SwSpec | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const op of listOperations(spec)) {
    const md = op[EXT_DOC_MD];
    if (typeof md === 'string' && md) out[op.operationId] = md;
  }
  return out;
}

/** Nombre de parámetro → descriptor de lookup, mirando también `$ref`. */
export function buildLookupIndex(spec: SwSpec | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const params = spec?.components?.parameters ?? {};
  for (const [name, def] of Object.entries(params)) {
    const lookup = (def as Record<string, unknown>)?.[EXT_LOOKUP];
    if (lookup) out[name] = lookup;
  }
  for (const op of listOperations(spec)) {
    for (const p of op.parameters ?? []) {
      if (p.$ref) {
        const key = p.$ref.split('/').pop() ?? '';
        const def = params[key] as Record<string, unknown> | undefined;
        if (def?.[EXT_LOOKUP]) out[p.name ?? key] = def[EXT_LOOKUP];
      }
      if (p[EXT_LOOKUP] && p.name) out[p.name] = p[EXT_LOOKUP];
    }
  }
  return out;
}

/** Resuelve el `$ref` de un parámetro contra `components.parameters`. */
export function resolveParam(param: SwParam, spec: SwSpec | null | undefined): SwParam {
  if (!param?.$ref) return param;
  const key = param.$ref.split('/').pop() ?? '';
  const def = spec?.components?.parameters?.[key];
  return def ? { ...def, ...param, $ref: undefined } : param;
}

/** Resuelve `$ref` de un schema contra `components.schemas`. */
export function resolveSchema(schema: SwSchema | undefined, spec: SwSpec | null | undefined, profundidad = 0): SwSchema | undefined {
  if (!schema || profundidad > 8) return schema;
  const ref = typeof schema.$ref === 'string' ? schema.$ref : '';
  if (!ref) return schema;
  const key = ref.split('/').pop() ?? '';
  const def = spec?.components?.schemas?.[key];
  if (!def) return { ...schema, $ref: undefined };
  return resolveSchema({ ...def, ...schema, $ref: undefined }, spec, profundidad + 1);
}

export function resolveParams(op: SwOp, spec: SwSpec | null | undefined): SwParam[] {
  return (op.parameters ?? []).map((p) => resolveParam(p, spec)).filter((p) => !!p.name);
}

/**
 * ¿La operación exige `Authorization: Bearer`?
 *
 * `security` se lee de la operación y, si no está, del documento. Se aceptan
 * las formas laxas que usan los documentos IS (`"bearer"`, `"none"`, `false`)
 * además del array estándar de OpenAPI.
 */
export function operationRequiresBearer(op: SwOperation | undefined, spec: SwSpec | null | undefined): boolean {
  const raw = op?.security ?? spec?.security;
  if (raw === 'bearer' || raw === 'Bearer') return true;
  if (raw === 'none' || raw === false) return false;
  const schemes = spec?.components?.securitySchemes ?? {};
  const sec = Array.isArray(raw) ? raw : [];
  for (const req of sec) {
    if (!req || typeof req !== 'object') continue;
    for (const name of Object.keys(req)) {
      const sch = schemes[name];
      if (sch?.type === 'http' && sch.scheme === 'bearer') return true;
      if (name === 'Bearer') return true;
    }
  }
  return false;
}

/** URL del servidor con las variables sustituidas por su `default`. */
export function resolveServerUrl(spec: SwSpec | null | undefined, serverIndex = 0): string {
  const servers = spec?.servers ?? [];
  const s = servers[serverIndex] ?? servers[0];
  if (!s?.url) return '';
  let url = String(s.url).replace(/\/$/, '');
  for (const [k, v] of Object.entries(s.variables ?? {})) {
    url = url.replace(`{${k}}`, String(v?.default ?? ''));
  }
  return url;
}

export function jsonPretty(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export type SwTono = 'ok' | 'auth' | 'warn' | 'err' | 'neutral';

/** Tono semántico de un código de respuesta (401/403 se separan del resto de 4xx). */
export function responseTone(code: string | number): SwTono {
  const n = Number(code);
  if (n >= 200 && n < 300) return 'ok';
  if (n === 401 || n === 403) return 'auth';
  if (n >= 400 && n < 500) return 'warn';
  if (n >= 500) return 'err';
  return 'neutral';
}

/** Tono → `color` de los `is-*` (los únicos valores que el kit acepta). */
export function toneToIsColor(tone: SwTono): 'success' | 'warning' | 'danger' | 'neutral' {
  if (tone === 'ok') return 'success';
  if (tone === 'auth' || tone === 'warn') return 'warning';
  if (tone === 'err') return 'danger';
  return 'neutral';
}

/** Color `is-*` por método HTTP. Es la única tabla: chips, bordes y botones la comparten.
 *  QUERY no usa `info`/`brand`: en paleta ContaPyme ambos son azul y se confundían con GET. */
export const METHOD_COLOR: Record<string, string> = {
  get: 'info',
  post: 'success',
  put: 'warning',
  patch: 'brand',
  delete: 'danger',
  // Teal propio en sw-method.css / sw-operation.css (el enum iswc-tag no trae cyan).
  query: 'neutral',
  options: 'neutral',
  head: 'neutral',
  trace: 'neutral',
};
