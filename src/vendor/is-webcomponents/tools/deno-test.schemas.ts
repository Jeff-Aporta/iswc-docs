// @vendor is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13 dist/cdn/tools/deno-test.schemas.ts
// No editar: se cambia en iswc y se descarga con `deno task vendor:iswc`.
/**
 * Contratos (tipos) de `deno-test.ts`. W54: los tipos top-level viven en
 * *.schemas.ts.
 */
import type { TestCooldown } from "./test-cooldown.schemas.ts";

export interface DenoTestOptions {
    /** Flags de `deno test` (p. ej. `-A`, `--no-check`). */
    args?: string[];
    /** Entorno del proceso hijo. Default `process.env`. */
    env?: Record<string, string | undefined>;
    /** `true`: un archivo a la vez (estado compartido). Default: cola de `testConcurrency()`. */
    serial?: boolean;
    /** Cooldown a usar. Default `testCooldownFromEnv()`. */
    cooldown?: TestCooldown;
    /** Ejecutable de Deno. Default `"deno"`. */
    deno?: string;
}
