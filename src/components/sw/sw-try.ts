/**
 * <sw-try> — «Probar»: arma la petición, la ejecuta y enseña la respuesta.
 *
 * Es el único componente del visor que no repinta entero en cada cambio, y lo
 * es a propósito: escribir en un parámetro no puede rehacer el shadow, porque
 * el campo perdería el foco a cada tecla. El repintado se parte en tres zonas
 * independientes —URL de previsualización, aviso de error y resultado— y solo
 * se toca la que cambió.
 *
 * Props: { op, spec, serverBase, authEnabled }
 * Evento: sw-need-login  detail: { hint }  — cuando falta JWT y hace falta.
 */

import { adoptCss, precargarCss, define, html, emitir } from './_shared.js';
import { jsonPretty, operationRequiresBearer, resolveParams } from '../../js/openapi.js';
import { defaultTryItBodyText, shouldShowTryItBody } from '../../js/tryit-body.js';
import { opAllowsAttachments, packTryItBody } from '../../js/tryit-attach.js';
import { paramInitialValue } from '../../js/param-schema.js';
import { joinApiUrl } from '../../js/server-base.js';
import { fetchApiRaw, extractEnvelopeError } from '../../js/api-fetch.js';
import { formatHttpError, extractApiError } from '../../js/http-error.js';
import { getStoredJwt } from '../../js/auth.js';
import { openHostDialog } from '../../js/dialog-host.js';
import './sw-params.js';
import './sw-body.js';
import './sw-json.js';

type Props = { op: SwOp | null; spec: SwSpec | null; serverBase: string; authEnabled: boolean; };

/** Métodos que cambian estado: se confirman antes de dispararse. */
const METODOS_PELIGROSOS = new Set(['delete', 'put', 'patch']);

const aplicarPathParams = (path: string, valores: Record<string, string>): string =>
  path.replace(/\{(\w+)\}/g, (_m, k: string) => encodeURIComponent(valores[k] ?? `{${k}}`));

class SwTry extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = { op: null, spec: null, serverBase: '', authEnabled: false };

  #valores: Record<string, string> = {};
  #body = '';
  #archivos: File[] = [];
  #bodyError: string | null = null;
  #ocupado = false;
  #resultado: SwResultado | null = null;
  #aviso = '';

  /** Zonas repintables por separado (ver cabecera del módulo). */
  #urlNodo: HTMLElement | null = null;
  #copiarNodo: HTMLElement | null = null;
  #avisoNodo: HTMLElement | null = null;
  #resultadoNodo: HTMLElement | null = null;
  #botonNodo: HTMLElement | null = null;

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
    const previo = this.#props.op;
    this.#props = { ...this.#props, ...(v ?? {}) };
    // Cambiar de operación reinicia el formulario entero; cambiar solo el
    // servidor no debe borrar lo que el usuario ya escribió.
    if (this.#props.op !== previo) this.#reiniciar();
    if (this.isConnected) this.#render();
  }

  #reiniciar(): void {
    const { op, spec } = this.#props;
    this.#valores = {};
    if (op) {
      for (const p of resolveParams(op, spec)) {
        const inicial = paramInitialValue(p);
        if (inicial) this.#valores[String(p.name)] = inicial;
      }
    }
    this.#body = op ? defaultTryItBodyText(op) : '';
    this.#archivos = [];
    this.#bodyError = null;
    this.#resultado = null;
    this.#aviso = '';
    this.#ocupado = false;
  }

  /* ── Petición ─────────────────────────────────────────────── */

  get #params(): SwParam[] {
    const { op, spec } = this.#props;
    return op ? resolveParams(op, spec) : [];
  }

  #url(): string {
    const { op, serverBase } = this.#props;
    if (!op) return '';
    let url = joinApiUrl(serverBase, aplicarPathParams(op.path, this.#valores));
    // QUERY lleva el filtro en el body. Meterlo en ? rompe las APIs InSoft (400).
    if (op.method === 'query') return url;
    const qs = new URLSearchParams();
    for (const p of this.#params) {
      if (p.in !== 'query') continue;
      const v = this.#valores[String(p.name)];
      if (v != null && String(v).length) qs.set(String(p.name), v);
    }
    const q = qs.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
    return url;
  }

  #necesitaJwt(): boolean {
    const { op, spec, authEnabled } = this.#props;
    return !!authEnabled && operationRequiresBearer(op ?? undefined, spec);
  }

  #pedirEjecucion(): void {
    const { op } = this.#props;
    if (!op) return;

    if (this.#necesitaJwt() && !getStoredJwt()?.token) {
      emitir(this, 'sw-need-login', { hint: 'Este endpoint requiere JWT. Inicia sesión para ejecutarlo.' });
      return;
    }
    if (METODOS_PELIGROSOS.has(op.method)) {
      this.#confirmar();
      return;
    }
    void this.#ejecutar();
  }

  /**
   * Confirmación para métodos que escriben. El diálogo se crea al vuelo y se
   * destruye al cerrarse: tenerlo permanente en el shadow de cada operación
   * multiplicaría por N los nodos de una spec con cien endpoints.
   */
  #confirmar(): void {
    const { op } = this.#props;
    if (!op) return;

    openHostDialog({
      label: 'Confirmar operación',
      className: 'sw-dialog-confirm',
      width: 'min(32rem, calc(100vw - 2rem))',
      content: html`
        <p class="sw-confirmar-texto">
          Vas a ejecutar <strong>${op.method.toUpperCase()}</strong> sobre un endpoint que modifica datos.
        </p>
        <code class="sw-confirmar-url">${this.#url()}</code>
        <div slot="footer" class="sw-confirmar-acciones">
          <iswc-button variant="plain" color="neutral" oniswc-click=${(e: Event) => {
            const dlg = (e.currentTarget as HTMLElement).closest('iswc-dialog');
            dlg?.remove();
          }}>Cancelar</iswc-button>
          <iswc-button
            color="danger"
            oniswc-click=${(e: Event) => {
              const dlg = (e.currentTarget as HTMLElement).closest('iswc-dialog');
              dlg?.remove();
              void this.#ejecutar();
            }}
          >
            Ejecutar de todos modos
          </iswc-button>
        </div>
      `,
    });
  }

  async #ejecutar(): Promise<void> {
    const { op } = this.#props;
    if (!op) return;

    this.#ocupado = true;
    this.#aviso = '';
    this.#resultado = null;
    this.#pintarBoton();
    this.#pintarAviso();
    this.#pintarResultado();

    const url = this.#url();
    try {
      const headers: Record<string, string> = {};
      for (const p of this.#params) {
        if (p.in !== 'header') continue;
        const v = this.#valores[String(p.name)];
        if (v) headers[String(p.name)] = v;
      }

      const init: Parameters<typeof fetchApiRaw>[1] = { method: op.method.toUpperCase(), headers };
      if (shouldShowTryItBody(op) || this.#archivos.length) {
        let cuerpo = this.#body.trim() || '{}';
        if (op.method === 'query' && (cuerpo === '{}' || !cuerpo)) {
          const fromQs: Record<string, unknown> = {};
          for (const p of this.#params) {
            if (p.in !== 'query') continue;
            const v = this.#valores[String(p.name)];
            if (v != null && String(v).length) fromQs[String(p.name)] = v;
          }
          if (Object.keys(fromQs).length) cuerpo = JSON.stringify(fromQs);
        }
        const packed = await packTryItBody(op, this.#props.spec, cuerpo, this.#archivos);
        if (packed.multipart) init.body = packed.body;
        else {
          headers['Content-Type'] = 'application/json';
          init.body = packed.body;
        }
      }

      const inicio = performance.now();
      const { data, res, text, ok } = await fetchApiRaw(url, init);
      const elapsed = Math.round(performance.now() - inicio);

      // Se reformatea solo si era JSON: un HTML de error se enseña tal cual.
      let cuerpo = text;
      if (data !== null && typeof data === 'object') cuerpo = jsonPretty(data);

      if (!ok) {
        this.#aviso = formatHttpError(res.status, {
          statusText: res.statusText,
          data: typeof data === 'object' ? data : undefined,
          detail: extractApiError(data) || (typeof data === 'string' ? data : ''),
          endpoint: url,
        });
      } else {
        this.#aviso = extractEnvelopeError(data);
      }

      this.#resultado = { status: res.status, statusText: res.statusText, elapsed, body: cuerpo, ok };
    } catch (e) {
      this.#aviso = (e as Error)?.message ?? String(e);
    } finally {
      this.#ocupado = false;
      this.#pintarBoton();
      this.#pintarAviso();
      this.#pintarResultado();
    }
  }

  /* ── Pintado parcial ──────────────────────────────────────── */

  /** La URL y el botón de copiar se mantienen en sincronía en un solo sitio. */
  #pintarUrl(): void {
    const url = this.#url();
    if (this.#urlNodo) this.#urlNodo.textContent = url;
    this.#copiarNodo?.setAttribute('value', url);
  }

  #pintarBoton(): void {
    const btn = this.#botonNodo;
    if (!btn) return;
    btn.toggleAttribute('loading', this.#ocupado);
    btn.toggleAttribute('disabled', this.#ocupado);
  }

  #pintarAviso(): void {
    const zona = this.#avisoNodo;
    if (!zona) return;
    zona.replaceChildren();
    if (!this.#aviso) return;
    const color = this.#resultado?.ok ? 'warning' : 'danger';
    zona.append(html`
      <iswc-callout color="${color}" variant="filled-outlined" icon="mdi:alert-outline">
        <pre class="aviso-texto">${this.#aviso}</pre>
      </iswc-callout>
    `);
  }

  #pintarResultado(): void {
    const zona = this.#resultadoNodo;
    if (!zona) return;
    zona.replaceChildren();

    const r = this.#resultado;
    if (!r) return;

    const json = document.createElement('sw-json');
    (json as HTMLElement & { props: unknown }).props = { value: r.body, maxHeight: '32rem' };

    zona.append(html`
      <div class="resultado">
        <div class="resultado-meta">
          <iswc-tag color="${r.ok ? 'success' : 'danger'}" variant="filled" class="resultado-status">
            ${r.status} ${r.statusText}
          </iswc-tag>
          <span class="resultado-dato">${r.elapsed} ms</span>
          <span class="resultado-dato">
            <iswc-format-bytes value="${new Blob([r.body]).size}"></iswc-format-bytes>
          </span>
        </div>
        ${json}
      </div>
    `);
  }

  /* ── Pintado completo ─────────────────────────────────────── */

  #render(): void {
    const { op, spec } = this.#props;
    this.#root.replaceChildren();
    this.#urlNodo = this.#avisoNodo = this.#resultadoNodo = this.#botonNodo = null;
    if (!op) {
      adoptCss(this.#root, import.meta.url, 'sw-try');
      return;
    }

    const params = this.#params;
    const pathParams = params.filter((p) => p.in === 'path');
    const otros = params.filter((p) => p.in === 'query' || p.in === 'header');

    const montar = (tag: string, props: unknown): HTMLElement => {
      const node = document.createElement(tag);
      (node as HTMLElement & { props: unknown }).props = props;
      return node;
    };

    const camposPath = pathParams.length
      ? montar('sw-params', { params: pathParams, values: this.#valores, disabled: this.#ocupado, titulo: 'Ruta' })
      : null;
    const camposOtros = otros.length
      ? montar('sw-params', { params: otros, values: this.#valores, disabled: this.#ocupado, titulo: 'Query y cabeceras' })
      : null;
    const cuerpo = shouldShowTryItBody(op)
      ? montar('sw-body', { op, value: this.#body, disabled: this.#ocupado })
      : null;

    const onParam = (e: Event): void => {
      const { name, value } = (e as CustomEvent<{ name: string; value: string }>).detail;
      this.#valores[name] = value;
      this.#pintarUrl();
    };
    camposPath?.addEventListener('sw-param-change', onParam);
    camposOtros?.addEventListener('sw-param-change', onParam);

    cuerpo?.addEventListener('sw-body-change', (e) => {
      const detail = (e as CustomEvent<{ value: string; error: string | null }>).detail;
      this.#body = detail.value;
      this.#bodyError = detail.error;
      // Un ejemplo aplicado desde los botones cambia el texto: hay que
      // reflejarlo en el textarea, que en ese caso no fue quien lo originó.
      const ta = (cuerpo.shadowRoot?.querySelector('iswc-textarea') ?? null) as (HTMLElement & { value: string }) | null;
      if (ta && ta.value !== detail.value) ta.value = detail.value;
    });

    const muestraAdjuntos = opAllowsAttachments(op, spec);
    const zonaAdjuntos = muestraAdjuntos
      ? html`
          <section class="adjuntos">
            <h4 class="adjuntos-titulo">Archivos adjuntos</h4>
            <iswc-file-input
              class="adjuntos-input"
              multiple
              label="Adjuntar archivos"
              hint="Cualquier tipo. Van con la petición."
              ${this.#ocupado ? 'disabled' : ''}
            ></iswc-file-input>
          </section>
        `
      : null;

    const bloqueaCuerpo = !!this.#bodyError;
    const requiereJwt = this.#necesitaJwt();
    const peligroso = METODOS_PELIGROSOS.has(op.method);

    this.#root.append(html`
      <div class="panel">
        <div class="preview">
          <span class="preview-metodo">${op.method.toUpperCase()}</span>
          <code class="preview-url"></code>
          <iswc-copy-button class="preview-copiar" copy-label="Copiar URL"></iswc-copy-button>
        </div>

        ${camposPath}
        ${camposOtros}
        ${cuerpo}
        ${zonaAdjuntos}

        <div class="acciones">
          <iswc-button
            class="ejecutar"
            color="${peligroso ? 'danger' : 'brand'}"
            ${bloqueaCuerpo ? 'disabled' : ''}
            oniswc-click=${() => this.#pedirEjecucion()}
          >
            <iswc-icon slot="start" icon="mdi:play-circle-outline"></iswc-icon>
            Ejecutar
          </iswc-button>
          ${requiereJwt
            ? html`
                <span class="candado" title="Requiere Authorization: Bearer &lt;JWT&gt;">
                  <iswc-icon icon="mdi:lock-outline"></iswc-icon>
                  Requiere sesión
                </span>
              `
            : null}
        </div>

        <div class="zona-aviso"></div>
        <div class="zona-resultado"></div>
      </div>
    `);

    this.#urlNodo = this.#root.querySelector('.preview-url');
    this.#copiarNodo = this.#root.querySelector('.preview-copiar');
    this.#avisoNodo = this.#root.querySelector('.zona-aviso');
    this.#resultadoNodo = this.#root.querySelector('.zona-resultado');
    this.#botonNodo = this.#root.querySelector('.ejecutar');

    const picker = this.#root.querySelector('.adjuntos-input') as (HTMLElement & { files: File[] }) | null;
    if (picker) {
      if (this.#archivos.length) picker.files = this.#archivos;
      picker.addEventListener('iswc-change', () => {
        this.#archivos = picker.files ?? [];
      });
    }

    this.#pintarUrl();
    this.#pintarAviso();
    this.#pintarResultado();
    this.#pintarBoton();

    adoptCss(this.#root, import.meta.url, 'sw-try');
  }
}

precargarCss(import.meta.url, 'sw-try');
define('sw-try', SwTry);
export { SwTry };
