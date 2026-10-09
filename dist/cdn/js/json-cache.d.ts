/**
 * json-cache.ts — cache local de los JSON del documento (config/spec).
 *
 * TTL mínimo 24 h: mientras la entrada sea fresca se sirve del almacén y no
 * se golpea la API. Al caducar se pide actualización; si la red falla, se
 * conserva lo cacheado (aunque esté caducado) para que el visor no quede en
 * blanco.
 *
 * Recarga manual (`force: true` / `clearJsonCache`): el botón «actualizar» de
 * la cabecera invalida el almacén y vuelve a pedir red.
 */
export declare const JSON_CACHE_TTL_MS: number;
export declare const JSON_CACHE_PREFIX = "docs:json-cache:v1:";
export type JsonCacheSource = 'cache' | 'network' | 'stale-cache';
export type JsonCacheEntry = {
    /** Epoch ms del último GET exitoso. */
    fetchedAt: number;
    data: unknown;
};
export type FetchJsonCachedResult = {
    data: unknown;
    source: JsonCacheSource;
};
export declare function readJsonCache(url: string): JsonCacheEntry | null;
export declare function writeJsonCache(url: string, data: unknown, fetchedAt?: number): void;
/** Borra una URL o, sin argumento, todas las entradas `docs:json-cache:v1:`. */
export declare function clearJsonCache(url?: string): void;
export declare function isJsonCacheFresh(entry: JsonCacheEntry | null | undefined, now?: number, ttlMs?: number): boolean;
/**
 * Sirve JSON con cache de 24 h y fallback a entrada caducada si la API falla.
 *
 * @param fetchNetwork GET real (sin cache HTTP del navegador); lanza si falla.
 * @param opts.force  Ignora frescura: pide red y reescribe el cache (botón reload).
 */
export declare function fetchJsonCached(url: string, fetchNetwork: (url: string) => Promise<unknown>, opts?: {
    now?: number;
    ttlMs?: number;
    force?: boolean;
}): Promise<FetchJsonCachedResult>;
