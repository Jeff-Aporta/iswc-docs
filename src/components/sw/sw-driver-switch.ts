/**
 * <sw-driver-switch> — selector de presentación, para la cabecera.
 *
 * Vive suelto y no dentro de un driver porque los dos lo montan: `sw-minidoc` en su cabecera y
 * `sw-nav` en la de `sw-app`, en ambos casos a la izquierda del conmutador de tema. Si lo
 * tuviera uno de los dos, el otro tendría que importar a su hermano para no quedarse sin él.
 *
 * No monta nada: escribe la preferencia y emite `sw-driver-change`. Quien decide qué hacer con
 * eso es `sw-viewer`, que es el único que sabe dónde está montado el driver actual.
 */

import { crearComponente, define, emitir, html } from './_shared.js';
import { DRIVERS, driverMeta, readDriver, writeDriver, type SwDriver } from '../../js/driver.js';

type Props = {
  /** Driver activo. Si va vacío se resuelve solo (URL → preferencia guardada → default). */
  value: SwDriver['id'] | '';
};

const SwDriverSwitch = crearComponente<Props>(
  import.meta.url,
  (root, { value }, host) => {
    const activo = value || readDriver();
    root.append(html`
      <iswc-select
        class="selector"
        size="small"
        value="${activo}"
        title="${driverMeta(activo).detalle}"
        aria-label="Presentación de la documentación"
        oniswc-change=${(e: Event) => {
          const elegido = String((e.target as HTMLInputElement).value ?? '');
          writeDriver(elegido);
          emitir(host, 'sw-driver-change', { driver: driverMeta(elegido).id });
        }}
      >
        ${DRIVERS.map((d) => html`<iswc-option value="${d.id}" title="${d.detalle}">${d.label}</iswc-option>`)}
      </iswc-select>
    `);
  },
  { value: '' },
  'sw-driver-switch',
);

define('sw-driver-switch', SwDriverSwitch);
export { SwDriverSwitch };
