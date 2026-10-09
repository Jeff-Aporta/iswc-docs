/**
 * <docs-export> — descargas: ISWC Docs (config), OpenAPI 3 y Postman.
 *
 * Los formatos se generan al pulsar, no al pintar el menú: serializar la spec
 * tres veces en cada repintado de la barra sería trabajo tirado.
 *
 * Postman es async (rasteriza diagramas a PNG); el resto suele ser sync.
 */

import { crearComponente, define, html, avisar } from './_shared.js';
import { buildExportFormats, descargarTexto } from '../../js/export.js';

type Props = { spec: DocsSpec | null; config: DocsConfig; };

const DocsExport = crearComponente<Props>(
  import.meta.url,
  (root, { spec, config }) => {
    const formatos = buildExportFormats(spec, config ?? {});
    if (!formatos.length) return;

    root.append(html`
      <iswc-dropdown
        class="menu"
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
        <iswc-button slot="trigger" variant="plain" color="neutral" aria-label="Descargar documento" title="Descargar documento">
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
    `);
  },
  { spec: null, config: {} },
  'docs-export',
);

define('docs-export', DocsExport);
export { DocsExport };
