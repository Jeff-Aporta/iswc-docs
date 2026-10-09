/**
 * <docs-server> — selector del host contra el que se prueba.
 *
 * Combina las bases del documento con una libre editable: una spec pública
 * casi nunca lista el entorno local, y obligar a editar la URL de cada
 * petición a mano es lo que hace inservible un visor para desarrollo.
 *
 * Evento: docs-server-change  detail: { serverBase }
 */

import { crearComponente, define, html, emitir } from './_shared.js';
import { normalizeServerBase } from '../../js/server-base.js';

type Props = { value: string; options: string[]; };

const DocsServer = crearComponente<Props>(
  import.meta.url,
  (root, { value, options }, host) => {
    const opciones = (options ?? []).filter(Boolean);
    const actual = String(value ?? '');

    const cambiar = (v: string): void => {
      const base = normalizeServerBase(v);
      if (base === actual) return;
      emitir(host, 'docs-server-change', { serverBase: base });
    };

    root.append(html`
      <div class="barra">
        <label class="etiqueta" for="server">Servidor</label>
        <iswc-input
          id="server"
          class="campo"
          full-width
          spellcheck="false"
          placeholder="https://host/api"
          value="${actual}"
          oniswc-change=${(e: Event) => cambiar(String((e.target as HTMLInputElement).value ?? ''))}
        ></iswc-input>
        ${opciones.length > 1
          ? html`
              <iswc-dropdown
                class="atajos"
                oniswc-select=${(e: Event) => {
                  const item = (e as CustomEvent<{ item: HTMLElement }>).detail?.item;
                  if (item) cambiar(item.getAttribute('value') ?? '');
                }}
              >
                <iswc-button slot="trigger" variant="outlined" color="neutral" with-caret>Conocidos</iswc-button>
                ${opciones.map(
                  (o) => html`
                    <iswc-dropdown-item type="checkbox" value="${o}" ${o === actual ? 'checked' : ''}>
                      ${o}
                    </iswc-dropdown-item>
                  `,
                )}
              </iswc-dropdown>
            `
          : null}
      </div>
    `);
  },
  { value: '', options: [] },
  'docs-server',
);

define('docs-server', DocsServer);
export { DocsServer };
