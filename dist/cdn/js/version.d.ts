/**
 * version.ts — sello del build, para caducar el estado persistido.
 *
 * `__DOCS_BUILD__` lo sustituye esbuild en tiempo de compilación (ver `scripts/build.ts`). En
 * desarrollo, si alguien carga el `.ts` sin pasar por el build, cae a `'dev'`: eso hace que la
 * geometría guardada se descarte en cada arranque, que es justo lo que conviene mientras se
 * está tocando el layout.
 */
export declare const DOCS_VERSION: string;
