/**
 * server-base.ts — a qué host apunta «Probar».
 *
 * La base se elige una vez y la comparten todas las operaciones. Se persiste
 * en `?s=.server` para que un enlace compartido apunte al mismo entorno; sin
 * eso, quien recibe el enlace prueba contra otro servidor sin enterarse.
 *
 * El param plano `?server=` es legado y se migra a la bolsa `?s=`.
 */
export declare const SERVER_URL_PARAM = "server";
export declare const normalizeServerBase: (raw: unknown) => string;
/**
 * Base por defecto: `config.apiBase` → `servers[0]` → origen actual.
 * Una `url` relativa en `servers` se resuelve contra el origen, como manda
 * OpenAPI: `{"url": "/api"}` en producción significa «este mismo host».
 */
export declare function inferDefaultServerBase(spec: DocsSpec | null | undefined, config?: DocsConfig): string;
/** Todas las bases ofrecibles: las del documento más la configurada. */
export declare function serverOptions(spec: DocsSpec | null | undefined, config?: DocsConfig): string[];
export declare function joinApiUrl(serverBase: unknown, apiPath: unknown): string;
export declare function readServerFromUrl(): string;
export declare function writeServerToUrl(base: string): void;
