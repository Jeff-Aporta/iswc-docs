/**
 * curl.ts — muestra de petición cURL para una operación.
 *
 * El panel derecho de `docs-minidoc` enseña la llamada antes de que nadie pulse «Probar»: es lo
 * primero que copia quien viene a integrar. Se construye desde la operación y el servidor
 * activo, sin tocar el DOM ni la red.
 *
 * No usa los valores que el usuario haya escrito en el formulario de pruebas: esto documenta la
 * forma de la llamada, no reproduce un intento concreto.
 */
/** Valor de muestra de un parámetro: el declarado, si no el default, si no el tipo. */
export declare function ejemploDeParam(p: DocsParam): string;
export type MuestraCurl = {
    /** Comando completo, ya partido en líneas con `\` de continuación. */
    texto: string;
    /** Cada línea suelta, para pintarla con resaltado sin volver a partir el texto. */
    lineas: string[];
};
/**
 * Comando cURL de la operación contra `serverBase`.
 *
 * `requiereBearer` decide si aparece la cabecera `Authorization`; el token nunca se incrusta,
 * se deja el placeholder `<token>` — una muestra que se copia a un chat o a un ticket no debe
 * arrastrar credenciales de nadie.
 */
export declare function buildCurl(op: DocsOp | null | undefined, spec: DocsSpec | null | undefined, serverBase: string, requiereBearer?: boolean, cuerpoOverride?: unknown): MuestraCurl;
