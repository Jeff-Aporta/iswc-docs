/**
 * server-base.ts — a qué host apunta «Probar».
 *
 * La base se elige una vez y la comparten todas las operaciones. Se persiste
 * en `?s=.server` para que un enlace compartido apunte al mismo entorno; sin
 * eso, quien recibe el enlace prueba contra otro servidor sin enterarse.
 *
 * El param plano `?server=` es legado y se migra a la bolsa `?s=`.
 */

import { resolveServerUrl } from './openapi.js';
import { migrateLegacyNavToS, readSState, writeSState } from './search-state.js';

export const SERVER_URL_PARAM = 'server';

export const normalizeServerBase = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .replace(/\/+$/, '');

/**
 * Base por defecto: `config.apiBase` → `servers[0]` → origen actual.
 * Una `url` relativa en `servers` se resuelve contra el origen, como manda
 * OpenAPI: `{"url": "/api"}` en producción significa «este mismo host».
 */
export function inferDefaultServerBase(spec: DocsSpec | null | undefined, config: DocsConfig = {}): string {
  const apiBase = normalizeServerBase(config.apiBase);
  if (apiBase) return apiBase;

  const raw = resolveServerUrl(spec);
  const origin = normalizeServerBase(typeof location !== 'undefined' ? location.origin : '');
  if (!raw) return origin;
  if (/^https?:\/\//i.test(raw)) return normalizeServerBase(raw);
  return normalizeServerBase(`${origin}${raw.startsWith('/') ? raw : `/${raw}`}`);
}

/** Todas las bases ofrecibles: las del documento más la configurada. */
export function serverOptions(spec: DocsSpec | null | undefined, config: DocsConfig = {}): string[] {
  const out: string[] = [];
  const push = (v: string): void => {
    const s = normalizeServerBase(v);
    if (s && !out.includes(s)) out.push(s);
  };
  push(String(config.apiBase ?? ''));
  (spec?.servers ?? []).forEach((_s, i) => push(resolveServerUrl(spec, i)));
  push(typeof location !== 'undefined' ? location.origin : '');
  return out;
}

export function joinApiUrl(serverBase: unknown, apiPath: unknown): string {
  const base = normalizeServerBase(serverBase);
  const path = String(apiPath ?? '');
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function readServerFromUrl(): string {
  if (typeof location === 'undefined') return '';
  try {
    migrateLegacyNavToS();
    return normalizeServerBase(readSState()[SERVER_URL_PARAM]);
  } catch {
    return '';
  }
}

export function writeServerToUrl(base: string): void {
  if (typeof location === 'undefined') return;
  try {
    writeSState({ [SERVER_URL_PARAM]: normalizeServerBase(base) });
  } catch {
    /* URL no manipulable (file://) */
  }
}
