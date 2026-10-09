/**
 * <docs-responses> — respuestas declaradas en la spec.
 *
 * Es documentación, no resultado: lo que la API contestó de verdad lo pinta
 * `docs-try`. Se colapsa cada código porque una operación con seis respuestas
 * documentadas ocuparía más que la propia operación.
 */

import { crearComponente, define, html } from './_shared.js';
import { extractJsonExample, jsonPretty, responseTone, toneToIsColor } from '../../js/openapi.js';
import './docs-json.js';

type Props = { responses: Record<string, DocsResponse> | null; };

/** Primer media type con algo mostrable; `application/json` tiene prioridad. */
function ejemploDe(resp: DocsResponse): string {
  const content = resp?.content ?? {};
  const claves = Object.keys(content);
  const clave = claves.includes('application/json') ? 'application/json' : claves[0];
  if (!clave) return '';
  const media = content[clave]!;
  const ejemplo = extractJsonExample(media);
  if (ejemplo !== undefined) return jsonPretty(ejemplo);
  return media.schema ? jsonPretty(media.schema) : '';
}

const DocsResponses = crearComponente<Props>(
  import.meta.url,
  (root, { responses }) => {
    const entradas = Object.entries(responses ?? {});
    if (!entradas.length) {
      root.append(html`
        <iswc-callout color="neutral" variant="plain" icon="mdi:reply-outline">
          La operación no declara respuestas.
        </iswc-callout>
      `);
      return;
    }

    root.append(html`
      <div class="lista">
        ${entradas.map(([code, resp]) => {
          const color = toneToIsColor(responseTone(code));
          const cuerpo = ejemploDe(resp);
          const esSchema = !!resp?.content && extractJsonExample(Object.values(resp.content)[0]) === undefined;

          return html`
            <iswc-details class="respuesta" variant="outlined" data-code="${code}">
              <div slot="summary" class="resumen">
                <iswc-tag color="${color}" variant="filled-outlined" class="codigo">${code}</iswc-tag>
                <span class="descripcion">${resp?.description ?? ''}</span>
              </div>
              ${cuerpo
                ? html`
                    <div class="cuerpo">
                      <span class="etiqueta">${esSchema ? 'Schema' : 'Ejemplo'}</span>
                      ${(() => {
                        const j = document.createElement('docs-json');
                        (j as HTMLElement & { props: unknown }).props = { value: cuerpo, maxHeight: '20rem' };
                        return j;
                      })()}
                    </div>
                  `
                : html`<p class="sin-cuerpo">Sin cuerpo declarado.</p>`}
            </iswc-details>
          `;
        })}
      </div>
    `);
  },
  { responses: null },
  'docs-responses',
);

define('docs-responses', DocsResponses);
export { DocsResponses };
