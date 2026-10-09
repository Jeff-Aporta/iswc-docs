/**
 * search-state.ts — `?s=<base64url>` como bolsa compartida de estado.
 *
 * Contrato estándar de los SPA InSoft: toda la navegación y preferencias de
 * vista van en `?s=` (JSON → base64url), no en params planos. La bolsa mezcla
 * tema/paleta (`boot.js`), query de búsqueda y navegación del visor
 * (`op`, `tab`, `opt`, `driver`, `server`).
 *
 * Los params planos legacy (`?op=`, `?tab=`, `?opt=`, `?driver=`, `?server=`)
 * se leen una vez como fallback y se migran a `?s=` al escribir.
 */
/** Params planos que ya no se escriben; se borran al tocar `?s=`. */
export declare const LEGACY_NAV_PARAMS: readonly ["op", "tab", "opt", "driver", "server"];
/** Lee la bolsa completa desde la URL. Vacía si no hay `?s=` o está corrupto. */
export declare function readSState(): Record<string, unknown>;
/**
 * Escribe la bolsa en la URL, fusionando con lo que ya estuviera.
 * Siempre limpia los params planos de navegación legacy.
 *
 * `push` decide si la escritura entra en el historial. La regla es qué espera
 * el lector al pulsar «atrás»: navegar (abrir otra operación, cambiar de
 * sección) es un paso atrás que quiere deshacer, así que va con `pushState`;
 * ajustar la vista (tema, driver, servidor, teclear en la búsqueda) no lo es y
 * llenaría el historial de estados intermedios, así que va con `replaceState`.
 *
 * Escribir la misma URL nunca empuja: repetir la entrada obligaría a pulsar
 * «atrás» dos veces para llegar al estado anterior de verdad.
 */
export declare function writeSState(patch: Record<string, unknown>, opts?: {
    push?: boolean;
}): void;
/** Query actual: lee de la URL. Cadena vacía si no hay. */
export declare function getQuery(): string;
/** Persiste el query sin tocar tema ni paleta. Cadena vacía lo borra. */
export declare function setQuery(q: string): void;
/** Borra toda la bolsa `?s=` (tema, paleta, query y navegación). */
export declare function clearSState(): void;
/**
 * Si la URL aún trae params planos de navegación, los mete en `?s=` y los borra.
 * Idempotente. Devuelve `true` si migró algo.
 */
export declare function migrateLegacyNavToS(): boolean;
