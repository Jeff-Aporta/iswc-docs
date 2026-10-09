/**
 * driver.ts — qué presentación del visor está activa.
 *
 * El visor tiene dos drivers (`docs-app` y `docs-minidoc`) que leen el mismo documento y lo pintan
 * distinto. Cuál se usa es una preferencia del lector, no del documento, así que vive fuera de
 * los dos: si la guardara uno de ellos, el otro no podría leerla sin depender de su hermano.
 *
 * Se persiste en dos sitios, y el orden importa:
 *
 *   1. `driver` dentro de `?s=` — para que un enlace compartido llegue con la vista que se quiso
 *      enseñar. Manda sobre la preferencia guardada: quien comparte decide.
 *   2. `localStorage` — para que la elección sobreviva a recargar sin ensuciar la URL de quien
 *      no la ha tocado nunca.
 *
 * El param plano `?driver=` es legado: se migra a `?s=` al leer/escribir.
 */

import { migrateLegacyNavToS, readSState, writeSState } from './search-state.js';
import { CLAVE_DRIVER_LEGADO, driverActual } from './legado.js';

export const PARAM_DRIVER = 'driver';
const CLAVE_ALMACEN = 'docs:driver';

export type DocsDriver = {
  /** Tag del custom element que monta este driver. */
  id: 'docs-app' | 'docs-minidoc';
  label: string;
  /** Una línea para el `title` del selector: qué gana quien lo elige. */
  detalle: string;
};

export const DRIVERS: readonly DocsDriver[] = [
  { id: 'docs-app', label: 'Clásico', detalle: 'Lista por secciones; cada operación se despliega en su sitio' },
  { id: 'docs-minidoc', label: 'Documento', detalle: 'Índice lateral, una operación por página y el código a la derecha' },
] as const;

export const DRIVER_DEFAULT: DocsDriver['id'] = 'docs-minidoc';

/** `true` si el valor es uno de los drivers registrados. */
export function esDriver(v: unknown): v is DocsDriver['id'] {
  return DRIVERS.some((d) => d.id === v);
}

export function driverMeta(id: string): DocsDriver {
  return DRIVERS.find((d) => d.id === id) ?? DRIVERS[0]!;
}

/** Driver activo: `?s=.driver`, luego preferencia guardada, luego el de por defecto. */
export function readDriver(): DocsDriver['id'] {
  try {
    migrateLegacyNavToS();
    const enS = readSState()[PARAM_DRIVER];
    // El guardia estrecha la expresion que recibe, no la variable: hay que
    // pasarle el valor ya recortado para poder devolver ese mismo.
    const recortado = driverActual(typeof enS === 'string' ? enS.trim() : null);
    if (esDriver(recortado)) return recortado;
  } catch {
    /* URL ilegible: se sigue con la preferencia guardada */
  }
  try {
    const almacen = globalThis.localStorage;
    const viejo = almacen?.getItem(CLAVE_DRIVER_LEGADO);
    if (viejo != null) {
      almacen?.removeItem(CLAVE_DRIVER_LEGADO);
      const migrado = driverActual(viejo);
      if (esDriver(migrado) && almacen?.getItem(CLAVE_ALMACEN) == null) almacen?.setItem(CLAVE_ALMACEN, migrado);
    }
    const guardado = driverActual(almacen?.getItem(CLAVE_ALMACEN));
    if (esDriver(guardado)) return guardado;
  } catch {
    /* almacenamiento bloqueado (modo privado, cookies off) */
  }
  return DRIVER_DEFAULT;
}

/**
 * Fija el driver activo en `?s=` y en la preferencia guardada.
 *
 * Usa `replaceState`: cambiar de presentación no es navegar, y meterlo en el historial obligaría
 * a pulsar «atrás» dos veces para volver a la página anterior.
 */
export function writeDriver(id: string): void {
  const valido = esDriver(id) ? id : DRIVER_DEFAULT;
  try {
    globalThis.localStorage?.setItem(CLAVE_ALMACEN, valido);
  } catch {
    /* almacenamiento bloqueado: la URL basta para esta sesión */
  }
  try {
    if (typeof location === 'undefined') return;
    // El default no se escribe: una URL sin `driver` en `?s=` es la que hay que poder compartir.
    writeSState({ [PARAM_DRIVER]: valido === DRIVER_DEFAULT ? '' : valido });
  } catch {
    /* sin History API no se puede reflejar; la preferencia ya quedó guardada */
  }
}
