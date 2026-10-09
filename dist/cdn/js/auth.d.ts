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
export declare const DEFAULT_AUTH_LOGIN_PATH = "/auth/login";
export declare const DEFAULT_AUTH_APP_ID = "swagger";
/** El desplazamiento es el día UTC del mes: el backend calcula el mismo. */
export declare const wrapPassword: (plain: string) => string;
export type DocsCredenciales = {
    username: string;
    password: string;
    remember: boolean;
};
export declare function readCredentials(): DocsCredenciales;
export declare function saveCredentials(username: string, password: string, remember: boolean): void;
/** `null` también cuando el token está guardado pero ya caducó (y lo limpia). */
export declare function getStoredJwt(): DocsSesion | null;
export declare function storeJwt(token: string, meta?: Partial<DocsSesion>): void;
export declare function clearJwt(): void;
/** Acepta que peguen el header entero: `Bearer eyJ…` → `eyJ…`. */
export declare const normalizeJwt: (raw: unknown) => string;
/** `juan.perez@contapyme.com` → `juan.perez`. El dominio no aporta al chip. */
export declare const stripContapymeEmail: (value: unknown) => string;
/** Primer nombre en Capitalizado — sin MAYÚSCULAS SOSTENIDAS de la BD. */
export declare function formatSessionChipLabel(value: unknown, fallback?: string): string;
export declare function sessionLabel(session: DocsSesion | null): string;
export type DocsLoginOpts = {
    loginPath?: string;
    loginKind?: string;
    appId?: string;
    itercero?: string;
    provider?: string;
};
/** Preferido cuando el backend responde MULTI_EMPRESA sin elección del usuario. */
export declare const DEFAULT_APP_ITERCERO = "810000630";
export type DocsLoginRespuesta = DocsSesion & {
    ok?: boolean;
};
export declare function fetchTestJwt(authBase: unknown, username: string, password: string, opts?: DocsLoginOpts): Promise<DocsLoginRespuesta>;
/** `auth` con los valores por defecto ya resueltos; `enabled:false` si no hay dónde loguearse. */
export declare function resolveAuthConfig(config: DocsConfig): DocsAuthConfig;
