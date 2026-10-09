/**
 * Forma de las piezas JSON ISWC Docs (meta / paths / config / general).
 * El visor pide el documento unido en GET …/config.json; esa ruta no se lista
 * en paths: es cable interno. Deno: importar este módulo y llamar a los assert.
 */
export const ISS_DOCS_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'query', 'options', 'head'] as const;
export type IssDocsMethod = (typeof ISS_DOCS_METHODS)[number];

export type IssDocsInfo = { title: string; description?: string; version?: string; };

export type IssDocsOp = { summary?: string; description?: string; tags?: string[]; subgroup?: string; doc?: string; security?: string; [k: string]: unknown; };

export type IssDocsMetaFile = { kind: 'meta'; version: number; info: IssDocsInfo; viewer?: Record<string, unknown>; [k: string]: unknown; };

export type IssDocsPathsFile = { kind: 'paths'; version: number; paths: Record<string, Partial<Record<IssDocsMethod, IssDocsOp>>>; };

export type IssDocsCatalog = { schemas?: Record<string, Record<string, unknown>>; payloads?: Record<string, unknown>; requestBodies?: Record<string, unknown>; docs?: Record<string, string>; lookups?: Record<string, unknown>; listFilters?: Record<string, unknown>; inputRecommendations?: Record<string, unknown>; bodyPresets?: Record<string, unknown>; requestBodyExamples?: Record<string, unknown>; tryitConfirm?: Record<string, unknown>; tryitAttachments?: { templates?: Record<string, unknown> }; };

/** Fichero en disco `docs__config.json`: catálogo, sin paths. */
export type IssDocsCatalogFile = { kind: 'config'; version: number; catalog: IssDocsCatalog; paths?: never; };

/** Documento unido que el visor descarga (handler, no operación del índice). */
export type InsoftConfig = { kind: string; version: number; info?: IssDocsInfo; viewer?: Record<string, unknown>; protocol?: { serverUrl?: string }; tags?: Array<Record<string, unknown>>; paths?: Record<string, Record<string, unknown>>; docs?: Record<string, string>; catalog?: IssDocsCatalog; };

export type InsoftCatalog = IssDocsCatalog;

export type IssDocsGeneralFile = { kind: 'general'; version: number; titulo?: string; resumen?: string; secciones?: unknown[]; [k: string]: unknown; };

const METODOS = new Set<string>(ISS_DOCS_METHODS);

function obj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

export function assertIssDocsMeta(doc: unknown): string[] {
  const e: string[] = [];
  if (!obj(doc)) return ['meta: no es objeto'];
  if (doc.kind !== 'meta') e.push(`meta.kind="${String(doc.kind)}" (debe meta)`);
  if (typeof doc.version !== 'number') e.push('meta.version debe ser number');
  const info = doc.info;
  if (!obj(info) || typeof info.title !== 'string' || !info.title.trim()) e.push('meta.info.title requerido');
  return e;
}

export function assertIssDocsPaths(doc: unknown): string[] {
  const e: string[] = [];
  if (!obj(doc)) return ['paths: no es objeto'];
  if (doc.kind !== 'paths') e.push(`paths.kind="${String(doc.kind)}" (debe paths; no copiar kind config)`);
  if (typeof doc.version !== 'number') e.push('paths.version debe ser number');
  if (!obj(doc.paths)) e.push('paths.paths requerido');
  else {
    for (const [ruta, ops] of Object.entries(doc.paths)) {
      if (!ruta.startsWith('/')) e.push(`ruta sin /: ${ruta}`);
      if (!obj(ops)) {
        e.push(`${ruta}: ops no es objeto`);
        continue;
      }
      for (const [metodo, op] of Object.entries(ops)) {
        if (!METODOS.has(metodo)) e.push(`${ruta}: método "${metodo}" no es HTTP/QUERY`);
        if (!obj(op) || typeof op.summary !== 'string' || !op.summary.trim()) {
          e.push(`${metodo.toUpperCase()} ${ruta}: falta summary`);
        }
      }
    }
  }
  return e;
}

export function assertIssDocsCatalogFile(doc: unknown): string[] {
  const e: string[] = [];
  if (!obj(doc)) return ['config: no es objeto'];
  if (doc.kind !== 'config') e.push(`config.kind="${String(doc.kind)}" (debe config)`);
  if (typeof doc.version !== 'number') e.push('config.version debe ser number');
  if (doc.docs !== undefined) e.push('config.docs raíz prohibido (vive en catalog.docs)');
  if (!obj(doc.catalog)) e.push('config.catalog requerido');
  return e;
}

export function assertIssDocsGeneral(doc: unknown): string[] {
  const e: string[] = [];
  if (!obj(doc)) return ['general: no es objeto'];
  if (doc.kind !== 'general') e.push(`general.kind="${String(doc.kind)}" (debe general)`);
  if (typeof doc.version !== 'number') e.push('general.version debe ser number');
  return e;
}

/** paths.op.doc → catalog.docs[id]. */
export function assertIssDocsDocsResuelven(pathsDoc: unknown, catalogDoc: unknown): string[] {
  const e: string[] = [];
  if (!obj(pathsDoc) || !obj(catalogDoc)) return ['docs: piezas incompletas'];
  const paths = obj(pathsDoc.paths) ? pathsDoc.paths : {};
  const catalog = obj(catalogDoc.catalog) ? catalogDoc.catalog : {};
  const docs = obj(catalog.docs) ? catalog.docs : {};
  for (const [ruta, ops] of Object.entries(paths)) {
    if (!obj(ops)) continue;
    for (const [metodo, op] of Object.entries(ops)) {
      if (!obj(op) || typeof op.doc !== 'string') continue;
      if (!(op.doc in docs)) e.push(`${metodo.toUpperCase()} ${ruta}: doc "${op.doc}" ausente en catalog.docs`);
    }
  }
  return e;
}

/** Lo que un host Deno pasa a `assertIssDocsPiezas` (ficheros o piezas vivas). */
export type IssDocsPiezas = {
  meta?: unknown;
  paths?: unknown;
  config?: unknown;
  general?: unknown;
};

export function assertIssDocsPiezas(piezas: IssDocsPiezas): string[] {
  const e: string[] = [];
  if (piezas.meta !== undefined) e.push(...assertIssDocsMeta(piezas.meta));
  if (piezas.paths !== undefined) e.push(...assertIssDocsPaths(piezas.paths));
  if (piezas.config !== undefined) e.push(...assertIssDocsCatalogFile(piezas.config));
  if (piezas.general !== undefined) e.push(...assertIssDocsGeneral(piezas.general));
  if (piezas.paths !== undefined && piezas.config !== undefined) {
    e.push(...assertIssDocsDocsResuelven(piezas.paths, piezas.config));
  }
  return e;
}
