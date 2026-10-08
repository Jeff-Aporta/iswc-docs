/**
 * prefs.ts — estado de interfaz persistido, con caducidad por versión de build.
 *
 * El visor guarda geometría en `localStorage`: el ancho de los paneles que el usuario arrastra.
 * Eso está bien mientras el componente no cambie de forma, y es una trampa en cuanto cambia: un
 * valor escrito por una versión con un fallo —o por un layout que ya no existe— sobrevive a la
 * corrección y la anula. Pasó de verdad: una carga guardó `0px` de ancho y, a partir de ahí,
 * cada carga siguiente restauraba ese cero aunque el fallo ya estuviera arreglado.
 *
 * La regla: cada build lleva un sello de fecha y hora, y al arrancar se compara con el que
 * escribió la geometría guardada. Si no coinciden, la geometría se descarta — es barata de
 * rehacer y el reparto por defecto siempre es razonable.
 *
 * Lo que **no** caduca son las preferencias que el usuario eligió a propósito, como el driver:
 * cambiar de versión no debe cambiarle la vista a nadie. Por eso la purga enumera las claves de
 * geometría en vez de vaciar el almacén entero.
 */

import { SW_VERSION } from './version.js';

const CLAVE_VERSION = 'sw:build';

/** Almacén del kit `is-*`, donde `iswc-split-panel` guarda su posición. */
const CLAVE_KIT = 'is-components';

/** Geometría que se descarta al cambiar de build. Es lo que un layout nuevo invalida. */
const GEOMETRIA: Array<{ componente: string; claves: string[] }> = [
  { componente: 'iswc-split-panel', claves: ['sw:split:inicio', 'sw:split:fin'] },
];

function leer(clave: string): string | null {
  try {
    return globalThis.localStorage?.getItem(clave) ?? null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    globalThis.localStorage?.setItem(clave, valor);
  } catch {
    /* almacenamiento bloqueado: sin persistencia, pero nada que romper */
  }
}

/** Borra solo las entradas de geometría propias, dejando intacto lo demás del almacén del kit. */
function purgarGeometria(): void {
  const crudo = leer(CLAVE_KIT);
  if (!crudo) return;
  let datos: Record<string, Record<string, unknown>>;
  try {
    datos = JSON.parse(crudo) as Record<string, Record<string, unknown>>;
  } catch {
    return;
  }
  let tocado = false;
  for (const { componente, claves } of GEOMETRIA) {
    const rama = datos?.[componente];
    if (!rama || typeof rama !== 'object') continue;
    for (const clave of claves) {
      if (clave in rama) {
        delete rama[clave];
        tocado = true;
      }
    }
    if (Object.keys(rama).length === 0) delete datos[componente];
  }
  if (tocado) escribir(CLAVE_KIT, JSON.stringify(datos));
}

/**
 * Descarta la geometría guardada si la escribió otra versión del componente.
 *
 * Se llama al cargar el módulo del layout, antes de que ningún `iswc-split-panel` se monte: su
 * `connectedCallback` restaura de `localStorage`, así que purgar después no serviría de nada.
 *
 * Devuelve `true` si purgó, para poder afirmarlo en una prueba.
 */
export function caducarPrefsSiCambioBuild(): boolean {
  const guardada = leer(CLAVE_VERSION);
  if (guardada === SW_VERSION) return false;
  purgarGeometria();
  escribir(CLAVE_VERSION, SW_VERSION);
  return true;
}

export { SW_VERSION, CLAVE_VERSION, CLAVE_KIT, GEOMETRIA };
