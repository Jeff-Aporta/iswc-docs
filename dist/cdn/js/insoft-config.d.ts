/**
 * insoft-config.ts — documento InSoft `kind:"config"` → spec del visor.
 *
 * El host entrega el JSON en bruto (quemado en la página / `conn.spec`).
 * Aquí se transforma en el `DocsSpec` interno que el resto del visor entiende.
 *
 * Mismo algoritmo que `iss-exports.browser.mjs::buildOpenApiFromConfig`, pero
 * recortado a lo que el visor consume: nada de `openapi: "3.0.3"` en la
 * salida (el visor no enseña OpenAPI en la UI), y los templates de respuesta
 * que InSoft define se traducen a las respuestas OpenAPI canónicas.
 *
 *   config.paths["/x"].get.responses.template === "ok"
 *     → responses: { "200": { description, content: { "application/json":
 *         { schema: INSOFT_ENVELOPE, example: catalog.payloads[key] } } } }
 *
 *   config.paths["/x"].get.security === "bearer"
 *     → security: [{ Bearer: [] }]
 *
 *   config.paths["/x"].get.doc === "systemOpenai"
 *     → x-iss-doc-md: catalog.docs["systemOpenai"]
 */
import type { InsoftConfig } from './iss-docs-piezas.js';
/** Orquestador que canjea credenciales por JWT. Si el visor no trae
 *  `auth.loginUrl` propio, se cae al orquestador público de InSoft. */
export declare const DEFAULT_AUTH_LOGIN_URL = "https://main-orchestrator.jeffaporta.workers.dev";
/** Detecta si el JSON es un `kind: "config"` de InSoft. */
export declare function isInsoftConfig(doc: unknown): doc is InsoftConfig;
/** Convierte un `InsoftConfig` en `{config, spec}` para `loadViewerDocument`. */
export declare function parseInsoftConfig(raw: InsoftConfig, apiBase: string): {
    config: DocsConfig;
    spec: DocsSpec;
};
