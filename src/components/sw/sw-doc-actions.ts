/**
 * <sw-doc-actions> — descarga + recarga en un `<iswc-button-group pill>`.
 *
 * Une los dos iconos de documento (export y refresh) para que se lean como
 * una sola pastilla. Emite `sw-doc-reload` igual que `<sw-doc-reload>`.
 */

import { crearComponente, define, emitir, html, avisar } from './_shared.js';
import { buildExportFormats, descargarTexto } from '../../js/export.js';

type Props = { spec: SwSpec | null; config: SwConfig; };

const SwDocActions = crearComponente<Props>(
  import.meta.url,
  (root, { spec, config }, host) => {
    const formatos = buildExportFormats(spec, config ?? {});

    root.append(html`
      <iswc-button-group class="grupo" pill label="Documento" aria-label="Documento">
        ${formatos.length
          ? html`
              <iswc-dropdown
                class="dl"
                placement="bottom-end"
                oniswc-select=${(e: Event) => {
                  const item = (e as CustomEvent<{ item: HTMLElement }>).detail?.item;
                  const id = item?.getAttribute('value');
                  const formato = formatos.find((f) => f.id === id);
                  if (!formato) return;
                  void (async () => {
                    try {
                      if (formato.id === 'postman') {
                        avisar('Generando Postman (diagramas → PNG)…', 'brand');
                      }
                      const contenido = await Promise.resolve(formato.build());
                      descargarTexto(formato.filename, contenido);
                      avisar(`Descargado: ${formato.filename}`, 'success');
                    } catch (err) {
                      avisar(`No se pudo generar el archivo: ${(err as Error)?.message ?? err}`, 'danger');
                    }
                  })();
                }}
              >
                <iswc-button
                  slot="trigger"
                  variant="outlined"
                  color="neutral"
                  aria-label="Descargar documento"
                  title="Descargar documento"
                >
                  <iswc-icon icon="mdi:download-outline"></iswc-icon>
                </iswc-button>
                ${formatos.map(
                  (f) => html`
                    <iswc-dropdown-item value="${f.id}">
                      <iswc-icon slot="icon" icon="${f.icon}"></iswc-icon>
                      ${f.label}
                    </iswc-dropdown-item>
                  `,
                )}
              </iswc-dropdown>
            `
          : null}
        <iswc-button
          class="rl"
          variant="outlined"
          color="neutral"
          aria-label="Actualizar documentación"
          title="Actualizar desde el servidor (ignora cache local de 24 h)"
          oniswc-click=${() => emitir(host, 'sw-doc-reload', null)}
        >
          <iswc-icon icon="mdi:refresh"></iswc-icon>
        </iswc-button>
      </iswc-button-group>
    `);
  },
  { spec: null, config: {} },
  'sw-doc-actions',
);

define('sw-doc-actions', SwDocActions);
export { SwDocActions };
