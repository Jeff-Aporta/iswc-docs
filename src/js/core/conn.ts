/**
 * conn.ts — autoconexión ISS vía `?conn=<base64url>` o conn como objeto al componente.
 *
 * Un solo documento: el JSON InSoft completo (`kind:"config"` + paths + catalog…)
 * vive en `conn.spec` cuando el host lo quema en la página. No existen los
 * antiguos `/system/swagger/{config,meta,paths,docs-config}.json`.
 *
 * Si el host **no** quema el JSON, el visor pide un único endpoint personalizable:
 *   paths.docs  (default `/docs?v=json`, análogo a `?v=md`)
 *
 *   {
 *     apiBase: "https://host/api",
 *     auto: true,
 *     embed: true,
 *     fixedServer: true,
 *     paths: {
 *       info: "/info",
 *       docs: "/docs?v=json"   // personalizable; solo si no hay `spec`
 *     },
 *     spec: { kind: "config", version: 1, … },  // preferido: quemado por el server
 *     title: "ISS PatyIA",
 *     icon: "mdi:robot-happy-outline"
 *   }
 */

/** Path por defecto del JSON único de documentación (relativo a `apiBase`). */
export const DEFAULT_DOCS_JSON_PATH = '/docs?v=json';

/** Rutas auxiliares + documento único. Sin meta/paths/config legacy. */
export const DEFAULT_CONN_PATHS = {
  info: '/info',
  docs: DEFAULT_DOCS_JSON_PATH,
} as const;

export type DocsConnPathValue = string | false | null;

export type DocsConnPaths = Partial<Record<keyof typeof DEFAULT_CONN_PATHS, DocsConnPathValue>> &
  Record<string, DocsConnPathValue | undefined>;

export type DocsConn = {
  apiBase?: string;
  auto?: boolean;
  embed?: boolean;
  fixedServer?: boolean;
  paths?: DocsConnPaths;
  /** Documento único en bruto (InSoft config u OpenAPI). Si viene, no hay fetch a `paths.docs`. */
  spec?: unknown;
  title?: string;
  icon?: string;
  [k: string]: unknown;
};

/** `true` si el host desactivó el fetch del JSON de docs. */
export function isDocsPathDisabled(paths: DocsConnPaths | undefined): boolean {
  if (!paths || !('docs' in paths)) return false;
  const v = paths.docs;
  return v === false || v == null || String(v).trim() === '';
}

/**
 * URL del JSON único de docs, o `""` si no hay fetch.
 * Solo aplica cuando no hay `spec` quemado: path personalizable, default `/docs?v=json`.
 */
export function resolveDocsJsonUrl(apiBase: string, paths: DocsConnPaths | undefined): string {
  if (isDocsPathDisabled(paths)) return '';
  const raw = typeof paths?.docs === 'string' && paths.docs.trim()
    ? paths.docs.trim()
    : DEFAULT_DOCS_JSON_PATH;
  if (/^https?:\/\//i.test(raw)) return raw;
  return joinConnUrl(apiBase, raw);
}

/** Decodifica base64url tolerante a padding. Devuelve `null` si el JSON falla. */
export function parseConnParam(raw: unknown): DocsConn | null {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  let pad = s.replace(/-/g, '+').replace(/_/g, '/');
  while (pad.length % 4) pad += '=';
  let bin: string;
  try {
    bin = atob(pad);
  } catch {
    return null;
  }
  try {
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' ? (obj as DocsConn) : null;
  } catch {
    return null;
  }
}

/** Codifica un objeto a base64url sin padding — para construir `?conn=`. */
export function encodeConnParam(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj ?? {}));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Une `apiBase` con un segmento relativo (admite `?query`). */
export function joinConnUrl(apiBase: string, segment: string | undefined): string {
  const base = String(apiBase ?? '').replace(/\/+$/, '');
  if (!base || !segment) return '';
  if (/^https?:\/\//i.test(segment)) return segment;
  const path = segment.startsWith('/') ? segment : `/${segment}`;
  return `${base}${path}`;
}

/**
 * Resuelve la config del visor a partir de `?conn=<base64url>`.
 */
export function resolveConnConfig(search: string | URLSearchParams | null | undefined): DocsConnResuelto | null {
  const sp =
    search instanceof URLSearchParams
      ? search
      : typeof search === 'string'
        ? new URLSearchParams(search)
        : typeof location !== 'undefined'
          ? new URLSearchParams(location.search)
          : null;
  const raw = sp?.get('conn')?.trim();
  if (!raw) return null;
  return normalizeConn(parseConnParam(raw));
}

/** Forma ya resuelta del conn: lo que el visor consume. */
export type DocsConnResuelto = { apiBase: string; paths: DocsConnPaths; fixedServer: boolean; brand: { title?: string; icon?: string }; spec?: unknown; };

/**
 * Normaliza un `DocsConn` ya deserializado.
 */
export function normalizeConn(conn: DocsConn | null | undefined): DocsConnResuelto | null {
  if (!conn?.apiBase) return null;
  const incoming = conn.paths ?? {};
  const paths: DocsConnPaths = { ...DEFAULT_CONN_PATHS, ...incoming };
  if (isDocsPathDisabled(incoming)) paths.docs = '';
  return {
    apiBase: String(conn.apiBase).replace(/\/+$/, ''),
    paths,
    fixedServer: conn.fixedServer === true,
    brand: {
      title: conn.title ? String(conn.title) : undefined,
      icon: conn.icon ? String(conn.icon) : undefined,
    },
    spec: conn.spec !== undefined ? conn.spec : undefined,
  };
}
