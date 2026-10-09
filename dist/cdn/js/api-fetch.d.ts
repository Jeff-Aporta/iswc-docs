/**
 * api-fetch.ts — `fetch` contra la API probada, con JWT y errores legibles.
 *
 * Devuelve siempre `{ data, res, text, ok }` sin lanzar por status: «Probar»
 * necesita enseñar el cuerpo de un 400 igual que el de un 200. Solo lanza
 * cuando la petición ni siquiera llegó a salir (red, CORS, host caído).
 */
export declare function authHeaders(includeAuth?: boolean): Record<string, string>;
export type DocsFetchOpts = Omit<RequestInit, 'headers'> & {
    headers?: Record<string, string>;
    /** `false` no adjunta el JWT (endpoints públicos). */
    auth?: boolean;
};
export type DocsFetchResult = {
    data: unknown;
    res: Response;
    text: string;
    ok: boolean;
};
export declare function fetchApiRaw(url: string, opts?: DocsFetchOpts): Promise<DocsFetchResult>;
export declare function fetchApiJson(url: string, opts?: DocsFetchOpts & {
    errorHint?: string;
}): Promise<DocsFetchResult>;
/**
 * Error de negocio dentro de un 200.
 *
 * Las APIs InSoft envuelven la respuesta en `{ encabezado: { resultado } }`:
 * un `resultado:false` es un fallo aunque el status sea 200, y sin esto el
 * visor lo pintaría como éxito.
 */
export declare function extractEnvelopeError(data: unknown): string;
