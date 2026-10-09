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

const S_KEY = 's';

/** Params planos que ya no se escriben; se borran al tocar `?s=`. */
export const LEGACY_NAV_PARAMS = ['op', 'tab', 'opt', 'driver', 'server'] as const;

const b64 = {
  encode(s: string): string {
    let bin = '';
    for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(s: string): string {
    let pad = s.replace(/-/g, '+').replace(/_/g, '/');
    while (pad.length % 4) pad += '=';
    const bin = atob(pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  },
};

function scrubLegacy(url: URL): void {
  for (const k of LEGACY_NAV_PARAMS) url.searchParams.delete(k);
}

/** Lee la bolsa completa desde la URL. Vacía si no hay `?s=` o está corrupto. */
export function readSState(): Record<string, unknown> {
  if (typeof location === 'undefined') return {};
  const raw = new URLSearchParams(location.search).get(S_KEY);
  if (!raw) return {};
  try {
    const obj = JSON.parse(b64.decode(raw));
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

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
export function writeSState(patch: Record<string, unknown>, opts: { push?: boolean } = {}): void {
  if (typeof location === 'undefined') return;
  const actual = readSState();
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries({ ...actual, ...patch })) {
    if (v === undefined) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    limpio[k] = v;
  }
  const url = new URL(location.href);
  scrubLegacy(url);
  if (Object.keys(limpio).length) {
    url.searchParams.set(S_KEY, b64.encode(JSON.stringify(limpio)));
  } else {
    url.searchParams.delete(S_KEY);
  }
  if (url.href === location.href) return;
  if (opts.push) history.pushState(history.state, '', url);
  else history.replaceState(history.state, '', url);
}

/** Query actual: lee de la URL. Cadena vacía si no hay. */
export function getQuery(): string {
  const q = readSState().q;
  return typeof q === 'string' ? q : '';
}

/** Persiste el query sin tocar tema ni paleta. Cadena vacía lo borra. */
export function setQuery(q: string): void {
  writeSState({ q });
}

/** Borra toda la bolsa `?s=` (tema, paleta, query y navegación). */
export function clearSState(): void {
  if (typeof location === 'undefined') return;
  const url = new URL(location.href);
  url.searchParams.delete(S_KEY);
  scrubLegacy(url);
  history.replaceState(history.state, '', url);
}

/**
 * Si la URL aún trae params planos de navegación, los mete en `?s=` y los borra.
 * Idempotente. Devuelve `true` si migró algo.
 */
export function migrateLegacyNavToS(): boolean {
  if (typeof location === 'undefined') return false;
  let sp: URLSearchParams;
  try {
    sp = new URLSearchParams(location.search);
  } catch {
    return false;
  }
  const actual = readSState();
  /** @type {Record<string, unknown>} */
  const patch: Record<string, unknown> = {};
  let hay = false;
  for (const k of LEGACY_NAV_PARAMS) {
    const plano = String(sp.get(k) ?? '').trim();
    if (!plano) continue;
    hay = true;
    const enS = actual[k];
    if (enS == null || (typeof enS === 'string' && !enS.trim())) patch[k] = plano;
  }
  if (!hay) return false;
  if (Object.keys(patch).length) writeSState(patch);
  else {
    const url = new URL(location.href);
    scrubLegacy(url);
    history.replaceState(history.state, '', url);
  }
  return true;
}
