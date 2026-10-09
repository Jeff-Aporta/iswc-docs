/**
 * login-providers.ts — personalización del login por servidor (config como datos + lógica como arrow-fn).
 *
 * El visor hoy tiene un único contrato de login (orquestador/dsclientes con password "wrapeada"). Para
 * poder autenticar contra backends distintos (p. ej. el `portal-login` nativo de PatyIA, que espera la
 * password en claro y hace md5 server-side; o un worker Deno con su propio JWT system) sin tocar la UI,
 * cada proveedor es una arrow-fn pura que decide: URL, headers y body del POST de login y cómo leer el
 * token. La selección la hace el host con datos (JSON: `viewer.auth.provider`/por origen); el fallback
 * es el proveedor por defecto (comportamiento actual, sin cambios).
 */
import type { DocsLoginOpts } from './auth.js';
import { APP_LOGIN_ORQUESTADOR } from './legado.js';

/** Petición de login ya resuelta por un proveedor. */
export type DocsLoginRequest = {
  endpoint: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

/** Contexto con que se invoca a cada proveedor. */
export type DocsLoginProviderCtx = {
  base: string;            // auth.loginUrl / serverBase ya resuelto (sin slash final)
  username: string;
  password: string;
  opts: DocsLoginOpts;
};

export type DocsLoginProvider = (ctx: DocsLoginProviderCtx) => DocsLoginRequest;

/* ── Password "wrapped" (César día-UTC + prefijo/sufijo) ─ contrato del orquestador/dsclientes ── */

const PREFIX = 'abc123';
const SUFFIX = 'xyz987';

const caesar = (text: string, shift: number): string =>
  text
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    })
    .join('');

export const wrapPassword = (plain: string): string =>
  plain ? caesar(PREFIX + plain + SUFFIX, new Date().getUTCDate()) : plain;

/* ── Helpers ── */

const url = (base: string, path: string): string =>
  `${String(base).trim().replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

const joinAppId = (opts: DocsLoginOpts): string => opts.appId || APP_LOGIN_ORQUESTADOR;

/** Usuario QA InSoft: el dominio no aporta al login del orquestador. */
export const stripContapymeEmail = (value: unknown): string =>
  String(value ?? '').trim().replace(/@contapyme\.(com|co)$/i, '');

/* ── Proveedores ── */

/**
 * `orquestador` (default): contrato actual del visor — POST a loginUrl+loginPath con la password
 * "wrapeada"; en loginKind 'portal' manda `semail` (sin dominio) como identificador.
 */
export const proveedorOrquestador: DocsLoginProvider = ({ base, username, password, opts }) => {
  const path = String(opts.loginPath || '/auth/login').trim();
  const portal = opts.loginKind === 'portal' || path.includes('portal-login');
  const body: Record<string, unknown> = portal
    ? { semail: stripContapymeEmail(username), password: wrapPassword(password), app: joinAppId(opts) }
    : { username, password: wrapPassword(password), app: joinAppId(opts) };
  const itercero = String(opts.itercero ?? '').trim();
  if (itercero) body.itercero = itercero;
  return {
    endpoint: url(base, path),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-App-Id': joinAppId(opts) },
    body,
  };
};

/**
 * `patyia-portal-login`: el `portal-login` de PatyIA espera la password **en claro** (hace md5
 * server-side) y `semail` con dominio tal cual; responde `{ok, token, ...}` con el shape estándar.
 */
export const proveedorPatyiaPortal: DocsLoginProvider = ({ base, username, password, opts }) => {
  const path = String(opts.loginPath || '/auth/portal-login').trim();
  const body: Record<string, unknown> = {
    semail: String(username ?? '').trim(),
    password, // en claro — el server hace md5 (passwordForDs)
  };
  const itercero = String(opts.itercero ?? '').trim();
  if (itercero) body.itercero = itercero;
  return {
    endpoint: url(base, path),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-App-Id': opts.appId || 'isa-patyia' },
    body,
  };
};

/** Registro de proveedores conocidos (los hosts pueden aportar más vía `loginProviders`). */
export const LOGIN_PROVIDERS: Record<string, DocsLoginProvider> = {
  orquestador: proveedorOrquestador,
  'patyia-portal': proveedorPatyiaPortal,
};

/** Resuelve el proveedor por id con fallback al por defecto (`orquestador`). */
export function resolveLoginProvider(id?: string | null): DocsLoginProvider {
  const key = String(id ?? '').trim();
  return (key && LOGIN_PROVIDERS[key]) || proveedorOrquestador;
}
