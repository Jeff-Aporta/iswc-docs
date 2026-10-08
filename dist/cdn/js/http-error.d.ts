/**
 * http-error.ts — mensajes legibles para respuestas HTTP fallidas.
 *
 * Un `401` a secas no le dice nada a quien está probando un endpoint. Aquí se
 * compone: etiqueta del estado, detalle que devolvió la API, URL y una pista
 * accionable según el contexto (login, PUT de config, lookup…).
 */
export type SwHttpErrorOpts = {
    statusText?: string;
    data?: unknown;
    detail?: string;
    endpoint?: string;
    hint?: string;
    defaultHint?: string;
    context?: 'login' | string;
};
/** Extrae el mensaje de error de las tres formas que usan las APIs InSoft. */
export declare function extractApiError(data: unknown): string;
export declare function formatHttpError(status: number, opts?: SwHttpErrorOpts): string;
export declare function formatLoginError(res: Response, data: unknown, endpoint: string): string;
