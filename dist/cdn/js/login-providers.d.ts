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
/** Petición de login ya resuelta por un proveedor. */
export type DocsLoginRequest = {
    endpoint: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
};
/** Contexto con que se invoca a cada proveedor. */
export type DocsLoginProviderCtx = {
    base: string;
    username: string;
    password: string;
    opts: DocsLoginOpts;
};
export type DocsLoginProvider = (ctx: DocsLoginProviderCtx) => DocsLoginRequest;
export declare const wrapPassword: (plain: string) => string;
/** Usuario QA InSoft: el dominio no aporta al login del orquestador. */
export declare const stripContapymeEmail: (value: unknown) => string;
/**
 * `orquestador` (default): contrato actual del visor — POST a loginUrl+loginPath con la password
 * "wrapeada"; en loginKind 'portal' manda `semail` (sin dominio) como identificador.
 */
export declare const proveedorOrquestador: DocsLoginProvider;
/**
 * `patyia-portal-login`: el `portal-login` de PatyIA espera la password **en claro** (hace md5
 * server-side) y `semail` con dominio tal cual; responde `{ok, token, ...}` con el shape estándar.
 */
export declare const proveedorPatyiaPortal: DocsLoginProvider;
/** Registro de proveedores conocidos (los hosts pueden aportar más vía `loginProviders`). */
export declare const LOGIN_PROVIDERS: Record<string, DocsLoginProvider>;
/** Resuelve el proveedor por id con fallback al por defecto (`orquestador`). */
export declare function resolveLoginProvider(id?: string | null): DocsLoginProvider;
