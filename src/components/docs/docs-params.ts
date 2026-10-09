/**
 * <docs-params> — campos de los parámetros de una operación.
 *
 * Es un componente controlado: no guarda los valores, los emite en
 * `docs-param-change` y quien lo monta (`docs-try`) es el dueño del estado. Así
 * la URL de previsualización y la petición leen siempre la misma fuente.
 *
 * Props:
 *   params    DocsParam[] ya resueltos (sin `$ref`)
 *   values    Record<string,string>
 *   disabled  boolean
 * Evento:
 *   docs-param-change  detail: { name, value }
 */

import { crearComponente, define, html, emitir } from './_shared.js';
import { paramEnum, paramInputMode, paramTypeLabel, sanitizeParamInputValue } from '../../js/param-schema.js';

type Props = { params: DocsParam[]; values: Record<string, string>; disabled: boolean; titulo: string; };

/** `iswc-select` cuando el schema declara `enum`; `iswc-input` en cualquier otro caso. */
function campo(p: DocsParam, valor: string, disabled: boolean, onChange: (v: string) => void): Node {
  const nombre = String(p.name ?? '');
  const tipo = paramTypeLabel(p.schema);
  const hint = [p.description, tipo && `· ${tipo}`].filter(Boolean).join(' ');
  const opciones = paramEnum(p.schema);

  if (opciones.length) {
    return html`
      <iswc-select
        class="campo"
        full-width
        label="${nombre}"
        hint="${hint}"
        value="${valor}"
        ${disabled ? 'disabled' : ''}
        ${p.required ? 'required' : ''}
        oniswc-change=${(e: Event) => onChange(String((e.target as HTMLInputElement).value ?? ''))}
      >
        ${opciones.map((o) => html`<iswc-option value="${o}">${o}</iswc-option>`)}
      </iswc-select>
    `;
  }

  const placeholder = p.example != null ? String(p.example) : nombre;
  return html`
    <iswc-input
      class="campo"
      full-width
      clearable
      label="${nombre}"
      hint="${hint}"
      placeholder="${placeholder}"
      inputmode="${paramInputMode(p.schema)}"
      value="${valor}"
      ${disabled ? 'disabled' : ''}
      ${p.required ? 'required' : ''}
      oniswc-input=${(e: Event) => {
        const input = e.target as HTMLInputElement;
        const limpio = sanitizeParamInputValue(p.schema, input.value);
        // El saneado se refleja de vuelta: si no, el campo enseña un carácter
        // que el estado ya descartó y el usuario no entiende por qué falla.
        if (limpio !== input.value) input.value = limpio;
        onChange(limpio);
      }}
    ></iswc-input>
  `;
}

const DocsParams = crearComponente<Props>(
  import.meta.url,
  (root, { params, values, disabled, titulo }, host) => {
    const lista = Array.isArray(params) ? params.filter((p) => p?.name) : [];
    if (!lista.length) return;

    const onChange = (name: string) => (v: string) => emitir(host, 'docs-param-change', { name, value: v });

    root.append(html`
      <section class="bloque">
        ${titulo ? html`<h4 class="titulo">${titulo}</h4>` : null}
        <div class="campos">
          ${lista.map((p) => {
            const nombre = String(p.name);
            const marca = p.in && p.in !== 'path' ? html`<span class="ubicacion">${p.in}</span>` : null;
            return html`
              <div class="fila" data-in="${p.in ?? ''}">
                ${campo(p, values?.[nombre] ?? '', disabled, onChange(nombre))}
                ${marca}
              </div>
            `;
          })}
        </div>
      </section>
    `);
  },
  { params: [], values: {}, disabled: false, titulo: '' },
  'docs-params',
);

define('docs-params', DocsParams);
export { DocsParams };
