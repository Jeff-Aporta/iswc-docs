/**
 * <docs-minidoc-code> — columna derecha del driver `docs-minidoc`.
 *
 * Petición (cURL o body raw del ejemplo activo) + respuesta por código de estado.
 * Si hay varios ejemplos de body, un chip cambia el estado del ejemplo: el cURL y
 * el JSON crudo se regeneran con ese cuerpo, listo para copiar y forzar el caso.
 */

import { adoptCss, precargarCss, define, html } from './_shared.js';
import { buildCurl } from '../../js/curl.js';
import {
  defaultTryItBodyText,
  formatBodyExample,
  resolveTryItBodyExample,
  resolveTryItBodyExamples,
  type DocsBodyEjemplo,
} from '../../js/tryit-body.js';
import { jsonPretty, extractJsonExample, responseTone, toneToIsColor } from '../../js/openapi.js';
import './docs-json.js';

type Props = { op: DocsOp | null; spec: DocsSpec | null; serverBase: string; requiereBearer: boolean; };

type VistaPeticion = 'curl' | 'body';

class DocsMinidocCode extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = { op: null, spec: null, serverBase: '', requiereBearer: false };
  /** Código de estado visible. Se reinicia al cambiar de operación, no al repintar. */
  #estado = '';
  /** Ejemplo de body activo (`id` de `resolveTryItBodyExamples`, o `''` = default). */
  #ejemploId = '';
  #vista: VistaPeticion = 'curl';
  #cuerpoNodo: HTMLElement | null = null;
  #peticionNodo: HTMLElement | null = null;
  #copiarPeticion: (HTMLElement & { value?: string }) | null = null;
  #copiarRespuesta: (HTMLElement & { value?: string }) | null = null;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.#render();
  }

  get props(): Props {
    return this.#props;
  }

  set props(v: Partial<Props> | null | undefined) {
    const antes = this.#props.op?.operationId;
    this.#props = { ...this.#props, ...(v ?? {}) };
    if (this.#props.op?.operationId !== antes) {
      this.#estado = '';
      this.#ejemploId = '';
      this.#vista = 'curl';
    }
    if (this.isConnected) this.#render();
  }

  get #ejemplos(): DocsBodyEjemplo[] {
    return resolveTryItBodyExamples(this.#props.op ?? undefined);
  }

  get #cuerpoActivo(): unknown {
    const lista = this.#ejemplos;
    if (lista.length) {
      const elegido = lista.find((e) => e.id === this.#ejemploId) ?? lista[0];
      return elegido?.example;
    }
    return resolveTryItBodyExample(this.#props.op ?? undefined);
  }

  get #cuerpoTexto(): string {
    const cuerpo = this.#cuerpoActivo;
    if (cuerpo !== undefined) return formatBodyExample(cuerpo);
    return defaultTryItBodyText(this.#props.op ?? undefined);
  }

  get #curlTexto(): string {
    const { op, spec, serverBase, requiereBearer } = this.#props;
    return buildCurl(op, spec, serverBase, requiereBearer, this.#cuerpoActivo).texto;
  }

  get #peticionTexto(): string {
    return this.#vista === 'body' ? this.#cuerpoTexto : this.#curlTexto;
  }

  /** Códigos de respuesta declarados, con los 2xx primero: es lo que se mira primero. */
  get #codigos(): string[] {
    const todos = Object.keys(this.#props.op?.responses ?? {});
    return todos.sort((a, b) => {
      const na = Number(a) || 999;
      const nb = Number(b) || 999;
      return na - nb;
    });
  }

  #cuerpoDeEstado(code: string): string {
    const resp = this.#props.op?.responses?.[code];
    const ejemplo = extractJsonExample(resp?.content?.['application/json']);
    if (ejemplo !== undefined && ejemplo !== null) return jsonPretty(ejemplo);
    const schema = resp?.content?.['application/json']?.schema;
    if (schema) return jsonPretty(schema);
    return resp?.description ? `// ${resp.description}` : '// Sin cuerpo documentado';
  }

  #pintarPeticion(): void {
    const zona = this.#peticionNodo;
    if (!zona) return;
    for (const t of this.#root.querySelectorAll('.vista')) {
      t.toggleAttribute('data-activo', (t as HTMLElement).dataset.vista === this.#vista);
    }
    for (const t of this.#root.querySelectorAll('.ejemplo')) {
      t.toggleAttribute('data-activo', (t as HTMLElement).dataset.id === this.#ejemploId);
    }
    const json = document.createElement('docs-json');
    (json as HTMLElement & { props: unknown }).props = {
      value: this.#peticionTexto,
      lang: this.#vista === 'body' ? 'json' : 'shell',
      maxHeight: this.#vista === 'body' ? '22rem' : '18rem',
    };
    zona.replaceChildren(json);
    if (this.#copiarPeticion) this.#copiarPeticion.value = this.#peticionTexto;
  }

  #pintarCuerpo(): void {
    const zona = this.#cuerpoNodo;
    if (!zona) return;
    for (const t of this.#root.querySelectorAll('.estado')) {
      t.toggleAttribute('data-activo', (t as HTMLElement).dataset.code === this.#estado);
    }
    const texto = this.#cuerpoDeEstado(this.#estado);
    const json = document.createElement('docs-json');
    (json as HTMLElement & { props: unknown }).props = {
      value: texto,
      lang: 'json',
      maxHeight: '26rem',
    };
    zona.replaceChildren(json);
    if (this.#copiarRespuesta) this.#copiarRespuesta.value = texto;
  }

  #elegirEjemplo(id: string): void {
    this.#ejemploId = id;
    this.#pintarPeticion();
  }

  #elegirVista(vista: VistaPeticion): void {
    this.#vista = vista;
    this.#pintarPeticion();
  }

  #render(): void {
    const { op } = this.#props;
    this.#root.replaceChildren();
    this.#cuerpoNodo = null;
    this.#peticionNodo = null;
    this.#copiarPeticion = null;
    this.#copiarRespuesta = null;

    if (!op) {
      adoptCss(this.#root, import.meta.url, 'docs-minidoc-code');
      return;
    }

    const ejemplos = this.#ejemplos;
    if (ejemplos.length) {
      if (!ejemplos.some((e) => e.id === this.#ejemploId)) this.#ejemploId = ejemplos[0]!.id;
    } else {
      this.#ejemploId = '';
    }

    const tieneCuerpo = this.#cuerpoActivo !== undefined && this.#cuerpoActivo !== null;
    const codigos = this.#codigos;
    if (!this.#estado || !codigos.includes(this.#estado)) this.#estado = codigos[0] ?? '';

    const chipsEjemplo = ejemplos.length
      ? html`
          <div class="ejemplos" role="group" aria-label="Ejemplos de body">
            ${ejemplos.map(
              (ex) => html`
                <button
                  type="button"
                  class="ejemplo"
                  data-id="${ex.id}"
                  title="Usar este body en cURL y Body raw"
                  onclick=${() => this.#elegirEjemplo(ex.id)}
                >${ex.label}</button>
              `,
            )}
          </div>
        `
      : null;

    const pestanasVista = tieneCuerpo
      ? html`
          <button type="button" class="vista" data-vista="curl" onclick=${() => this.#elegirVista('curl')}>cURL</button>
          <button type="button" class="vista" data-vista="body" onclick=${() => this.#elegirVista('body')}>Body raw</button>
        `
      : html`<span class="panel-titulo">cURL</span>`;

    const pestanasEstado = codigos.map((code) =>
      html`
        <button
          type="button"
          class="estado"
          data-code="${code}"
          data-tono="${responseTone(code)}"
          onclick=${() => {
            this.#estado = code;
            this.#pintarCuerpo();
          }}
        >${code}</button>
      `,
    );

    this.#root.append(html`
      <section class="panel">
        <header class="panel-cab vistas" role="tablist" aria-label="Formato de la petición">
          ${pestanasVista}
          <iswc-copy-button class="al-final" copy-label="Copiar petición"></iswc-copy-button>
        </header>
        ${chipsEjemplo}
        <div class="peticion"></div>
      </section>

      <section class="panel">
        <header class="panel-cab estados" role="tablist">
          ${pestanasEstado}
          <iswc-copy-button class="al-final" copy-label="Copiar respuesta"></iswc-copy-button>
        </header>
        <div class="cuerpo"></div>
      </section>
    `);

    this.#peticionNodo = this.#root.querySelector('.peticion');
    this.#cuerpoNodo = this.#root.querySelector('.cuerpo');
    this.#copiarPeticion = this.#root.querySelector('.vistas iswc-copy-button');
    this.#copiarRespuesta = this.#root.querySelector('.estados iswc-copy-button');
    this.#pintarPeticion();
    this.#pintarCuerpo();
    adoptCss(this.#root, import.meta.url, 'docs-minidoc-code');
  }
}

precargarCss(import.meta.url, 'docs-minidoc-code');
define('docs-minidoc-code', DocsMinidocCode);
export { DocsMinidocCode, toneToIsColor };
