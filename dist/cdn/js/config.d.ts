/**
 * config.ts — de dónde sale la configuración del visor y cómo se carga la spec.
 *
 * Precedencia:
 *   1. Atributo/propiedad `doc` — JSON único quemado por el host (vía PatyIA / ISS).
 *   2. `conn.spec` / `?conn=` con `spec` — mismo documento vía payload conn.
 *   3. `paths.docs` / default `/docs?v=json` — un GET solo si no hay documento quemado.
 *   4. `?spec=<url>` / `config.specUrl` — demos OpenAPI sueltos.
 *
 * No existe `/system/swagger/config.json`.
 */
import type { DocsConn } from './conn.js';
export declare const DEFAULT_NS = "ISA";
/** Normaliza a `https://host/…/api` (añade el `/api` si falta, sin query ni hash). */
export declare function normalizeApiBase(input: unknown): string;
/**
 * Materializa un `spec` ya en memoria (sin red): InSoft `kind:"config"`, documento IS u OpenAPI.
 */
export declare function materializeEmbeddedSpec(config: DocsConfig, raw: unknown): {
    config: DocsConfig;
    spec: DocsSpec;
} | null;
/**
 * Config base, antes de consultar la red.
 *
 * @param connDirecto  Conn del anfitrión (`conn=` / propiedad). Opcional.
 * @param docDirecto   Documento InSoft/OpenAPI quemado (`doc=` / propiedad). Preferido en ISS.
 */
export declare function resolveBootConfig(connDirecto?: DocsConn | null, docDirecto?: unknown): DocsConfig;
export declare function loadViewerDocument(config: DocsConfig, opts?: {
    force?: boolean;
}): Promise<{
    config: DocsConfig;
    spec: DocsSpec;
}>;
export declare function loadSpec(config: DocsConfig): Promise<DocsSpec>;
