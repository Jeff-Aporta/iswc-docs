/**
 * docs.d.ts — tipos ambiente del visor.
 *
 * Declaración global (sin `import`/`export` en el archivo) para que todo
 * `src/**` los vea sin ceremonia, igual que `types/tk.d.ts` en is-tkts.
 */

/* ── OpenAPI (subconjunto que el visor realmente lee) ───────── */

/** `query` incluido: es método HTTP estándar (RFC 9110 + draft QUERY) y el API lo usa para
 *  filtrar con cuerpo JSON donde una query string no da abasto. */
type DocsMetodo = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'query' | 'options' | 'head';

interface DocsSchema {
  type?: string;
  format?: string;
  enum?: unknown[];
  items?: DocsSchema;
  properties?: Record<string, DocsSchema>;
  required?: string[];
  example?: unknown;
  description?: string;
  default?: unknown;
  [k: string]: unknown;
}

interface DocsMediaType {
  schema?: DocsSchema;
  example?: unknown;
  examples?: Record<string, { value?: unknown; summary?: string }>;
}

interface DocsParam {
  name?: string;
  in?: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  example?: unknown;
  schema?: DocsSchema;
  $ref?: string;
  [k: string]: unknown;
}

interface DocsRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, DocsMediaType>;
}

interface DocsResponse {
  description?: string;
  content?: Record<string, DocsMediaType>;
}

interface DocsOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: DocsParam[];
  requestBody?: DocsRequestBody;
  responses?: Record<string, DocsResponse>;
  security?: unknown;
  [k: string]: unknown;
}

/** Operación ya aplanada: el visor siempre trabaja con `path` y `method`. */
interface DocsOp extends DocsOperation {
  path: string;
  method: DocsMetodo;
  operationId: string;
}

interface DocsTag {
  name: string;
  description?: string;
  /** `x-isa-subgroups` — subcarpetas declaradas por el tag. */
  'x-isa-subgroups'?: DocsSubgrupoDef[];
  [k: string]: unknown;
}

interface DocsServer {
  url: string;
  description?: string;
  variables?: Record<string, { default?: string; enum?: string[] }>;
}

interface DocsSpec {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: DocsServer[];
  tags?: DocsTag[];
  paths?: Record<string, Record<string, DocsOperation>>;
  components?: {
    parameters?: Record<string, DocsParam>;
    schemas?: Record<string, DocsSchema>;
    securitySchemes?: Record<string, { type?: string; scheme?: string; bearerFormat?: string }>;
  };
  [k: string]: unknown;
}

/* ── Agrupación ─────────────────────────────────────────────── */

interface DocsSubgrupoDef {
  id: string;
  name?: string;
  icon?: string;
}

interface DocsSubgrupo extends DocsSubgrupoDef {
  operations: DocsOp[];
}

interface DocsGrupo {
  name: string;
  description: string;
  meta: DocsTag | Record<string, never>;
  operations: DocsOp[];
  /** Vacío cuando el tag no declara subgrupos con nombre. */
  subgroups: DocsSubgrupo[];
}

/* ── Configuración del visor ────────────────────────────────── */

interface DocsAuthConfig {
  enabled?: boolean;
  /** Base del main-orchestrator / system-login. */
  loginUrl?: string;
  loginPath?: string;
  loginKind?: 'portal' | 'lab' | string;
  app?: string;
  /** Id de login-provider por server (login-providers.ts); sin él se usa el default orquestador. */
  provider?: string;
}

interface DocsBrand {
  title?: string;
  icon?: string;
  subtitle?: string;
}

interface DocsNavTab {
  id: string;
  label: string;
  icon?: string;
  /** Tags que quedan visibles al activar la pestaña. Vacío = todos. */
  tags?: string[];
  /** Solo visible con sesión iniciada. */
  requiresSession?: boolean;
}

interface DocsConfig {
  ns?: string;
  /** Base `/api` del host con el que se prueba (Try it out). */
  apiBase?: string;
  specUrl?: string;
  /**
   * Documento en memoria: OpenAPI, documento IS o InSoft `kind:"config"`.
   * Si está, el visor no pide `paths.docs`.
   */
  spec?: DocsSpec | Record<string, unknown>;
  brand?: DocsBrand;
  auth?: DocsAuthConfig;
  nav?: DocsNavTab[];
  /** `false` oculta el selector de servidor. */
  serverSelect?: boolean;
  exports?: Record<string, string>;
  [k: string]: unknown;
}

/* ── Sesión ─────────────────────────────────────────────────── */

interface DocsSesion {
  token: string;
  username?: string;
  nombre?: string;
  expiresAt?: string;
  [k: string]: unknown;
}

/* ── Resultado de Try it out ────────────────────────────────── */

interface DocsResultado {
  status: number;
  statusText: string;
  elapsed: number;
  body: string;
  ok: boolean;
}

/* ── Plantillas (`_shared.ts`) ──────────────────────────────── */

type DocsAtributos = Record<string, unknown>;
type DocsHijos = Array<Node | string | null | undefined> | Node | string | null | undefined;
interface DocsHtmlCrudo {
  readonly __crudo: unique symbol;
}

/**
 * Caché de hojas construidas que `js/hojas.js` monta en `<head>`. Lo comparten
 * los shadow roots del kit `is-*` (vía el parche de `ShadowRoot.prototype.
 * prepend`) y el `adoptCss` de `_shared.ts`: una sola descarga por hoja.
 */
interface DocsCacheHojas {
  hojas: Map<string, CSSStyleSheet>;
  cargas: Map<string, Promise<CSSStyleSheet | null>>;
}

/* ── Globales inyectadas por el host ────────────────────────── */

interface Window {
  __DOCS_CONFIG__?: DocsConfig;
  __docsHojas?: DocsCacheHojas;
  IsToast?: {
    host(): { create(msg: string, opts?: Record<string, unknown>): Promise<unknown> } | null;
    error(msg: string, duration?: number): unknown;
    success(msg: string, duration?: number): unknown;
  };
}
