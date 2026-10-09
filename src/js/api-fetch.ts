/**
 * api-fetch.ts — `fetch` contra la API probada, con JWT y errores legibles.
 *
 * Devuelve siempre `{ data, res, text, ok }` sin lanzar por status: «Probar»
 * necesita enseñar el cuerpo de un 400 igual que el de un 200. Solo lanza
 * cuando la petición ni siquiera llegó a salir (red, CORS, host caído).
 */

import { getStoredJwt } from './auth.js';
import { formatHttpError, extractApiError } from './http-error.js';

export function authHeaders(includeAuth = true): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!includeAuth) return headers;
  const jwt = getStoredJwt()?.token;
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return headers;
}

export type DocsFetchOpts = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
  /** `false` no adjunta el JWT (endpoints públicos). */
  auth?: boolean;
};

export type DocsFetchResult = { data: unknown; res: Response; text: string; ok: boolean; };

export async function fetchApiRaw(url: string, opts: DocsFetchOpts = {}): Promise<DocsFetchResult> {
  const { auth, headers: extra, ...init } = opts;
  const headers = { ...authHeaders(auth !== false), ...(extra ?? {}) };
  if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', ...init, headers });
  } catch (e) {
    throw new Error(
      formatHttpError(0, {
        detail: (e as Error)?.message ?? String(e),
        endpoint: url,
        defaultHint: 'Comprueba que la API esté en ejecución, que la URL del servidor sea correcta y que permita CORS desde este origen.',
      }),
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { data, res, text, ok: res.ok };
}

export async function fetchApiJson(url: string, opts: DocsFetchOpts & { errorHint?: string } = {}): Promise<DocsFetchResult> {
  const { errorHint, ...rest } = opts;
  const out = await fetchApiRaw(url, rest);
  if (!out.ok) {
    throw new Error(
      formatHttpError(out.res.status, {
        statusText: out.res.statusText,
        data: typeof out.data === 'object' ? out.data : undefined,
        detail: typeof out.data === 'string' ? out.data : undefined,
        endpoint: url,
        hint: errorHint,
      }),
    );
  }
  return out;
}

/**
 * Error de negocio dentro de un 200.
 *
 * Las APIs InSoft envuelven la respuesta en `{ encabezado: { resultado } }`:
 * un `resultado:false` es un fallo aunque el status sea 200, y sin esto el
 * visor lo pintaría como éxito.
 */
export function extractEnvelopeError(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const enc = (data as Record<string, unknown>).encabezado as Record<string, unknown> | undefined;
  if (enc && enc.resultado === false) return extractApiError(data) || 'La API respondió con error.';
  return '';
}
