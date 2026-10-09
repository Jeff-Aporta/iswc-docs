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
export declare const DEFAULT_DOCS_JSON_PATH = "/docs?v=json";
/** Rutas auxiliares + documento único. Sin meta/paths/config legacy. */
export declare const DEFAULT_CONN_PATHS: {
    readonly info: "/info";
    readonly docs: "/docs?v=json";
};
export type DocsConnPathValue = string | false | null;
export type DocsConnPaths = Partial<Record<keyof typeof DEFAULT_CONN_PATHS, DocsConnPathValue>> & Record<string, DocsConnPathValue | undefined>;
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
export declare function isDocsPathDisabled(paths: DocsConnPaths | undefined): boolean;
/**
 * URL del JSON único de docs, o `""` si no hay fetch.
 * Solo aplica cuando no hay `spec` quemado: path personalizable, default `/docs?v=json`.
 */
export declare function resolveDocsJsonUrl(apiBase: string, paths: DocsConnPaths | undefined): string;
/** Decodifica base64url tolerante a padding. Devuelve `null` si el JSON falla. */
export declare function parseConnParam(raw: unknown): DocsConn | null;
/** Codifica un objeto a base64url sin padding — para construir `?conn=`. */
export declare function encodeConnParam(obj: unknown): string;
/** Une `apiBase` con un segmento relativo (admite `?query`). */
export declare function joinConnUrl(apiBase: string, segment: string | undefined): string;
/**
 * Resuelve la config del visor a partir de `?conn=<base64url>`.
 */
export declare function resolveConnConfig(search: string | URLSearchParams | null | undefined): DocsConnResuelto | null;
/** Forma ya resuelta del conn: lo que el visor consume. */
export type DocsConnResuelto = {
    apiBase: string;
    paths: DocsConnPaths;
    fixedServer: boolean;
    brand: {
        title?: string;
        icon?: string;
    };
    spec?: unknown;
};
/**
 * Normaliza un `DocsConn` ya deserializado.
 */
export declare function normalizeConn(conn: DocsConn | null | undefined): DocsConnResuelto | null;
