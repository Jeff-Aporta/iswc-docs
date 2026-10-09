/**
 * auth.ts — sesión JWT para «Probar» (system-login / main-orchestrator).
 *
 * El token vive en `sessionStorage`: al cerrar la pestaña se va. Las
 * credenciales opcionales («recordarme») van en `localStorage` y solo el
 * usuario las guarda explícitamente.
 *
 * La ofuscación de la contraseña (César + prefijo/sufijo) **no es cifrado**:
 * replica el contrato que el backend espera en `password`, nada más. Quien
 * lea el almacenamiento local ve la credencial; por eso «recordarme» es opt-in.
 */

import { formatLoginError } from './http-error.js';
import { resolveLoginProvider } from './login-providers.js';
import { APP_LOGIN_ORQUESTADOR } from './legado.js';

const STORAGE_KEY = 'jeffaporta:docs-test-jwt';
const CREDENTIALS_KEY = 'jeffaporta:docs-login-creds';

/** Claves de antes del renombre: se mueven una vez a las nuevas para no cerrar la sesión de nadie. */
function migrarClave(almacen: Storage | undefined, vieja: string, nueva: string): void {
  try {
    const v = almacen?.getItem(vieja);
    if (v == null) return;
    if (almacen?.getItem(nueva) == null) almacen?.setItem(nueva, v);
    almacen?.removeItem(vieja);
  } catch {
    /* almacenamiento bloqueado */
  }
}
migrarClave(globalThis.sessionStorage, 'jeffaporta:swagger-test-jwt', STORAGE_KEY);
migrarClave(globalThis.localStorage, 'jeffaporta:swagger-login-creds', CREDENTIALS_KEY);
const PREFIX = 'abc123';
const SUFFIX = 'xyz987';

export const DEFAULT_AUTH_LOGIN_PATH = '/auth/login';
export const DEFAULT_AUTH_APP_ID = APP_LOGIN_ORQUESTADOR;

/* ── Ofuscación de contraseña (contrato del backend) ────────── */

const caesarEncode = (text: string, shift: number): string =>
  text
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      return c;
    })
    .join('');

/** El desplazamiento es el día UTC del mes: el backend calcula el mismo. */
export const wrapPassword = (plain: string): string =>
  plain ? caesarEncode(PREFIX + plain + SUFFIX, new Date().getUTCDate()) : plain;

/* ── Credenciales recordadas ────────────────────────────────── */

const b64 = {
  encode(s: string): string {
    try {
      return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
    } catch {
      return '';
    }
  },
  decode(s: string): string {
    try {
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      return '';
    }
  },
};

const encodeStoredSecret = (plain: string): string => (plain ? b64.encode(PREFIX + plain + SUFFIX) : '');

const decodeStoredSecret = (enc: string): string => {
  const raw = enc ? b64.decode(enc) : '';
  if (raw.startsWith(PREFIX) && raw.endsWith(SUFFIX)) return raw.slice(PREFIX.length, raw.length - SUFFIX.length);
  return '';
};

export type DocsCredenciales = { username: string; password: string; remember: boolean; };

export function readCredentials(): DocsCredenciales {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return { username: '', password: '', remember: true };
    const saved = JSON.parse(raw) as Record<string, unknown>;
    return {
      username: String(saved.username ?? ''),
      password: saved.passwordEnc ? decodeStoredSecret(String(saved.passwordEnc)) : '',
      remember: saved.remember !== false,
    };
  } catch {
    return { username: '', password: '', remember: true };
  }
}

export function saveCredentials(username: string, password: string, remember: boolean): void {
  try {
    if (!remember) {
      localStorage.removeItem(CREDENTIALS_KEY);
      return;
    }
    localStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify({ remember: true, username, passwordEnc: encodeStoredSecret(password) }),
    );
  } catch {
    /* almacenamiento bloqueado */
  }
}

/* ── Sesión ─────────────────────────────────────────────────── */

/** `null` también cuando el token está guardado pero ya caducó (y lo limpia). */
export function getStoredJwt(): DocsSesion | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as DocsSesion;
    if (!saved.token) return null;
    if (saved.expiresAt && new Date(saved.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

export function storeJwt(token: string, meta: Partial<DocsSesion> = {}): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, ...meta }));
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function clearJwt(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento bloqueado */
  }
}

/** Acepta que peguen el header entero: `Bearer eyJ…` → `eyJ…`. */
export const normalizeJwt = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .replace(/^bearer\s+/i, '');

/* ── Etiquetas visibles ─────────────────────────────────────── */

/** `juan.perez@contapyme.com` → `juan.perez`. El dominio no aporta al chip. */
export const stripContapymeEmail = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .replace(/@contapyme\.(com|co)$/i, '');

/** Primer nombre en Capitalizado — sin MAYÚSCULAS SOSTENIDAS de la BD. */
export function formatSessionChipLabel(value: unknown, fallback = 'JWT'): string {
  const base = stripContapymeEmail(value).split(/[\s.@]+/).filter(Boolean)[0] ?? '';
  if (!base) return fallback;
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

export function sessionLabel(session: DocsSesion | null): string {
  if (!session?.token) return '';
  return formatSessionChipLabel(session.nombre || session.username || '', 'JWT');
}

/* ── Login ──────────────────────────────────────────────────── */

export type DocsLoginOpts = { loginPath?: string; loginKind?: string; appId?: string; itercero?: string; provider?: string };

const isPortalLogin = (opts: DocsLoginOpts): boolean =>
  opts.loginKind === 'portal' || String(opts.loginPath ?? '').includes('portal-login');

/**
 * Endpoint de login. `portal-login` y `test-token` son alias históricos que
 * el orquestador ya no expone: se reescriben a la ruta canónica en vez de
 * dejar que el usuario vea un 404 sin explicación.
 */
function resolveLoginEndpoint(authBase: unknown, loginPath?: string): string {
  let path = loginPath || DEFAULT_AUTH_LOGIN_PATH;
  if (path.includes('portal-login') || path.includes('test-token')) path = DEFAULT_AUTH_LOGIN_PATH;
  const base = String(authBase ?? '').trim().replace(/\/$/, '');
  if (!base) throw new Error('Falta `auth.loginUrl` en la configuración del visor.');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Preferido cuando el backend responde MULTI_EMPRESA sin elección del usuario. */
export const DEFAULT_APP_ITERCERO = '810000630';

export type DocsLoginRespuesta = DocsSesion & { ok?: boolean; };

export async function fetchTestJwt(authBase: unknown, username: string, password: string, opts: DocsLoginOpts = {}): Promise<DocsLoginRespuesta> {
  // Proveedor por server (opcional): si el host configura `opts.provider`, la petición la arma el
  // proveedor (ej. 'patyia-portal' espera password en claro y /auth/portal-login). Sin provider se
  // conserva exactamente el flujo por defecto de abajo (orquestador/dsclientes, sin cambios).
  if (opts.provider) {
    return fetchConProvider(String(authBase ?? '').trim().replace(/\/$/, ''), username, password, opts);
  }

  const portal = isPortalLogin(opts);
  const appId = opts.appId || DEFAULT_AUTH_APP_ID;
  const endpoint = resolveLoginEndpoint(authBase, opts.loginPath);

  const body: Record<string, unknown> = portal
    ? { semail: stripContapymeEmail(username), password: wrapPassword(password), app: appId }
    : { username, password: wrapPassword(password), app: appId };
  const itercero = String(opts.itercero ?? '').trim();
  if (itercero) body.itercero = itercero;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-App-Id': appId },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`No se pudo conectar con el servicio de autenticación (${endpoint}).`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* respuesta sin JSON: formatLoginError lo cubre */
  }

  // El usuario pertenece a varias empresas: se reintenta con InSoft antes de
  // pedirle que elija, que es lo que hace el login del portal.
  if (data?.code === 'MULTI_EMPRESA' && Array.isArray(data.terceros) && data.terceros.length && !itercero) {
    return fetchTestJwt(authBase, username, password, { ...opts, itercero: DEFAULT_APP_ITERCERO });
  }

  if (!res.ok || !data.ok || !data.token) throw new Error(formatLoginError(res, data, endpoint));
  return data as DocsLoginRespuesta;
}

/** Login vía un proveedor por server (login-providers.ts). Sin cambios al flujo por defecto. */
async function fetchConProvider(base: string, username: string, password: string, opts: DocsLoginOpts): Promise<DocsLoginRespuesta> {
  const prov = resolveLoginProvider(opts.provider);
  const req = prov({ base, username, password, opts });
  let res: Response;
  try {
    res = await fetch(req.endpoint, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
    });
  } catch {
    throw new Error(`No se pudo conectar con el servicio de autenticación (${req.endpoint}).`);
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* respuesta sin JSON */
  }
  if (data?.code === 'MULTI_EMPRESA' && Array.isArray(data.terceros) && data.terceros.length && !opts.itercero) {
    return fetchConProvider(base, username, password, { ...opts, itercero: DEFAULT_APP_ITERCERO });
  }
  if (!res.ok || !data.ok || !data.token) throw new Error(formatLoginError(res, data, req.endpoint));
  return data as DocsLoginRespuesta;
}

/** `auth` con los valores por defecto ya resueltos; `enabled:false` si no hay dónde loguearse. */
export function resolveAuthConfig(config: DocsConfig): DocsAuthConfig {  const auth = { ...(config.auth ?? {}) };
  if (auth.enabled === false) return { enabled: false };
  if (!auth.loginUrl) return { ...auth, enabled: false };
  return {
    enabled: true,
    loginUrl: auth.loginUrl,
    loginPath: auth.loginPath || DEFAULT_AUTH_LOGIN_PATH,
    loginKind: auth.loginKind || 'portal',
    app: auth.app || DEFAULT_AUTH_APP_ID,
  };
}
