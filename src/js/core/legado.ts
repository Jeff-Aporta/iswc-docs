/**
 * legado.ts — nombres anteriores a iswc-docs que todavía llegan de fuera.
 *
 * El visor se llamó isc-swagger y sus piezas `sw-*`. Hosts ya desplegados, enlaces compartidos y
 * almacenes del navegador siguen usando esos nombres: se aceptan, se traducen al nombre actual y se
 * avisa una vez por consola. Nunca en silencio, para que el host sepa qué debe actualizar.
 *
 * Los valores que viajan por el cable hacia otro sistema (ids de app en el login del orquestador)
 * no son nomenclatura del visor sino contrato ajeno: se conservan tal cual.
 */

/** `kind` del documento IS antes del renombre. */
export const KIND_DOCUMENTO_LEGADO = 'insoft.swagger-viewer';
/** Global que el host fijaba antes de `__DOCS_CONFIG__`. */
export const GLOBAL_CONFIG_LEGADO = '__SWAGGER_CONFIG__';
/** `<script type="application/json">` embebido antes de `#docs-config`. */
export const ID_CONFIG_LEGADO = 'sw-config';
/** Clave del driver en `localStorage` antes de `docs:driver`. */
export const CLAVE_DRIVER_LEGADO = 'sw:driver';

/** Contrato con el orquestador (`main-orchestrator`): ids de app que espera el login. No cambian. */
export const APP_LOGIN_ORQUESTADOR = 'swagger';
export const APP_LOGIN_VISOR = 'swagger-viewer';

const DRIVERS_LEGADO: Readonly<Record<string, string>> = { 'sw-app': 'docs-app', 'sw-minidoc': 'docs-minidoc' };

const avisados = new Set<string>();

/** Avisa una sola vez por nombre viejo. */
export function avisarLegado(viejo: string, nuevo: string): void {
  if (avisados.has(viejo)) return;
  avisados.add(viejo);
  console.warn(`[iswc-docs] «${viejo}» es un nombre legado; usa «${nuevo}». Se acepta por compatibilidad.`);
}

/** Traduce un id de driver viejo (`sw-app`, `sw-minidoc`) al actual; lo demás pasa igual. */
export function driverActual(v: unknown): unknown {
  if (typeof v !== 'string' || !(v in DRIVERS_LEGADO)) return v;
  avisarLegado(v, DRIVERS_LEGADO[v]!);
  return DRIVERS_LEGADO[v];
}
