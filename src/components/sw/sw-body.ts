/**
 * <sw-body> — editor del cuerpo JSON de la petición.
 *
 * Controlado como `sw-params`: emite `sw-body-change` y no guarda el texto.
 * La validación es en vivo pero **no bloquea**: mostrar el error y dejar
 * ejecutar es lo correcto, porque a veces se quiere ver justo qué contesta la
 * API ante un cuerpo mal formado.
 *
 * Evento: sw-body-change  detail: { value, error }
 */

import { crearComponente, define, html, emitir } from './_shared.js';
import { resolveTryItBodyExamples, validateBodyJson, formatBodyExample } from '../../js/tryit-body.js';

type Props = { op: SwOp | null; value: string; disabled: boolean; };

const SwBody = crearComponente<Props>(
  import.meta.url,
  (root, { op, value, disabled }, host) => {
    if (!op) return;

    const texto = String(value ?? '');
    const error = validateBodyJson(texto);
    const ejemplos = resolveTryItBodyExamples(op);
    const requerido = op.requestBody?.required === true;

    const emitirCambio = (v: string): void => emitir(host, 'sw-body-change', { value: v, error: validateBodyJson(v) });

    root.append(html`
      <section class="bloque">
        <header class="cabecera">
          <h4 class="titulo">
            Cuerpo (application/json)
            ${requerido ? html`<span class="requerido" title="Requerido">*</span>` : null}
          </h4>
          ${ejemplos.length
            ? html`
                <div class="ejemplos" role="group" aria-label="Ejemplos de cuerpo">
                  ${ejemplos.map(
                    (ex) => html`
                      <iswc-button
                        size="small"
                        variant="outlined"
                        color="neutral"
                        ${disabled ? 'disabled' : ''}
                        oniswc-click=${() => emitirCambio(formatBodyExample(ex.example))}
                      >
                        ${ex.icon ? html`<iswc-icon slot="start" icon="${ex.icon}"></iswc-icon>` : null}
                        ${ex.label}
                      </iswc-button>
                    `,
                  )}
                </div>
              `
            : null}
        </header>

        <iswc-textarea
          class="editor"
          full-width
          resize="auto"
          min-rows="6"
          max-rows="22"
          spellcheck="false"
          value="${texto}"
          ${disabled ? 'disabled' : ''}
          ${error ? 'error' : ''}
          error-text="${error ?? ''}"
          oniswc-input=${(e: Event) => emitirCambio(String((e.target as HTMLTextAreaElement).value ?? ''))}
        ></iswc-textarea>
      </section>
    `);
  },
  { op: null, value: '', disabled: false },
  'sw-body',
);

define('sw-body', SwBody);
export { SwBody };
