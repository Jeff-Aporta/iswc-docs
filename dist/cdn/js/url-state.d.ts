/**
 * url-state.ts — navegación del visor dentro de `?s=<base64url>`.
 *
 * Un enlace tiene que reabrir exactamente lo mismo: pestaña de nav, operación
 * y sub-pestaña. Eso vive en la bolsa estándar `?s=` junto a tema/paleta/q:
 *
 *   ?s=<base64url({ op, tab, opt, theme, … })>
 *
 * No se escriben `?op=` / `?tab=` / `?opt=` planos (legado: se migran al leer).
 *
 * Cambiar de operación o de sección **es** navegar dentro del SPA, así que cada
 * cambio entra en el historial (`pushState`): atrás y adelante recorren la
 * misma secuencia de vistas que el lector recorrió. Solo las escrituras que
 * corrigen la URL sin que el lector haya navegado —restaurar el estado inicial,
 * migrar params legacy— se hacen con `replaceState` (`{ push: false }`).
 */
export declare const PARAM_TAB = "tab";
export declare const PARAM_OP = "op";
export declare const PARAM_OP_TAB = "opt";
export declare const OP_TABS: readonly ["try", "examples", "doc"];
export type SwOpTab = (typeof OP_TABS)[number];
export declare const OP_TAB_DEFAULT: SwOpTab;
export type SwUrlState = {
    tab: string;
    op: string;
    opTab: SwOpTab;
};
export declare function readUrlState(): SwUrlState;
/**
 * Fusiona solo las claves presentes; `''` borra el campo en `?s=`.
 *
 * `push` por defecto: quien llama está reflejando una navegación del lector.
 * Pásalo en `false` para sincronizar la URL con un estado que el visor resolvió
 * solo (la sección o la operación por defecto), que no es un paso atrás.
 */
export declare function mergeUrlState(patch: Partial<SwUrlState>, opts?: {
    push?: boolean;
}): void;
/**
 * Avisa de cualquier cambio de estado, venga de `mergeUrlState` o del botón
 * atrás del navegador. Devuelve la función para desuscribirse.
 */
export declare function subscribeUrlState(fn: (estado: SwUrlState) => void): () => void;
