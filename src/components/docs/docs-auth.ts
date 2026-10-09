/**
 * <docs-auth> — sesión JWT: chip de estado, diálogo de login y pegado de token.
 *
 * Pegar un JWT a mano está al mismo nivel que iniciar sesión, no escondido:
 * en desarrollo se prueba a menudo con un token que ya se tiene, y forzar el
 * login contra el orquestador para eso es fricción sin ninguna ganancia.
 *
 * Props: { authEnabled, auth, session }
 * Evento: docs-session-change  detail: { session }
 */

import { adoptCss, precargarCss, define, html, emitir, avisar } from './_shared.js';
import {
  clearJwt,
  fetchTestJwt,
  getStoredJwt,
  normalizeJwt,
  readCredentials,
  saveCredentials,
  sessionLabel,
  storeJwt,
} from '../../js/auth.js';

type Props = { authEnabled: boolean; auth: DocsAuthConfig; session: DocsSesion | null; };

class DocsAuth extends HTMLElement {
  #root: ShadowRoot;
  #props: Props = { authEnabled: false, auth: {}, session: null };
  #dialogo: HTMLElement | null = null;
  #ocupado = false;
  #error = '';

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
    this.#props = { ...this.#props, ...(v ?? {}) };
    if (this.isConnected) this.#render();
  }

  /** Punto de entrada público: `docs-app` lo llama cuando una operación pide JWT. */
  abrirLogin(hint?: string): void {
    if (hint) this.#error = hint;
    this.#render();
    (this.#dialogo as (HTMLElement & { show(): void }) | null)?.show();
  }

  #anunciarSesion(): void {
    emitir(this, 'docs-session-change', { session: getStoredJwt() });
  }

  async #entrar(usuario: string, clave: string, recordar: boolean): Promise<void> {
    const { auth } = this.#props;
    this.#ocupado = true;
    this.#error = '';
    this.#render();
    (this.#dialogo as (HTMLElement & { show(): void }) | null)?.show();

    try {
      const data = await fetchTestJwt(auth.loginUrl, usuario, clave, {
        loginPath: auth.loginPath,
        loginKind: auth.loginKind,
        appId: auth.app,
        provider: auth.provider,
      });
      storeJwt(data.token, { username: usuario, nombre: data.nombre, expiresAt: data.expiresAt });
      saveCredentials(usuario, clave, recordar);
      this.#ocupado = false;
      this.#anunciarSesion();
      avisar('Sesión iniciada.', 'success');
      // El render lo dispara `docs-app` al propagar la sesión nueva.
      (this.#dialogo as (HTMLElement & { hide(): void }) | null)?.hide();
    } catch (e) {
      this.#ocupado = false;
      this.#error = (e as Error)?.message ?? String(e);
      this.#render();
      (this.#dialogo as (HTMLElement & { show(): void }) | null)?.show();
    }
  }

  #pegarToken(valor: string): void {
    const token = normalizeJwt(valor);
    if (!token) {
      this.#error = 'Pega un JWT válido (con o sin el prefijo «Bearer»).';
      this.#render();
      (this.#dialogo as (HTMLElement & { show(): void }) | null)?.show();
      return;
    }
    storeJwt(token, { username: 'JWT pegado' });
    this.#anunciarSesion();
    avisar('Token guardado para esta pestaña.', 'success');
    (this.#dialogo as (HTMLElement & { hide(): void }) | null)?.hide();
  }

  #salir(): void {
    clearJwt();
    this.#anunciarSesion();
    avisar('Sesión cerrada.');
  }

  #render(): void {
    const { authEnabled, session } = this.#props;
    this.#root.replaceChildren();
    this.#dialogo = null;

    if (!authEnabled) {
      adoptCss(this.#root, import.meta.url, 'docs-auth');
      return;
    }

    const guardadas = readCredentials();
    const activa = !!session?.token;

    this.#root.append(html`
      <div class="auth">
        ${activa
          ? html`
              <iswc-dropdown class="menu">
                <iswc-button slot="trigger" variant="outlined" color="success" with-caret>
                  <iswc-icon slot="start" icon="mdi:account-check-outline"></iswc-icon>
                  ${sessionLabel(session)}
                </iswc-button>
                <iswc-dropdown-item onclick=${() => this.abrirLogin()}>Cambiar sesión</iswc-dropdown-item>
                <iswc-dropdown-item color="danger" onclick=${() => this.#salir()}>Cerrar sesión</iswc-dropdown-item>
              </iswc-dropdown>
            `
          : html`
              <iswc-button variant="outlined" color="neutral" oniswc-click=${() => this.abrirLogin()}>
                <iswc-icon slot="start" icon="mdi:login-variant"></iswc-icon>
                Iniciar sesión
              </iswc-button>
            `}

        <iswc-dialog class="dialogo" label="Sesión para probar endpoints">
          ${this.#error
            ? html`
                <iswc-callout color="danger" variant="filled-outlined" icon="mdi:alert-outline">
                  <pre class="error">${this.#error}</pre>
                </iswc-callout>
              `
            : null}

          <form
            class="formulario"
            onsubmit=${(e: Event) => {
              e.preventDefault();
              const raiz = this.#root;
              const usuario = (raiz.querySelector('#usuario') as HTMLInputElement | null)?.value ?? '';
              const clave = (raiz.querySelector('#clave') as HTMLInputElement | null)?.value ?? '';
              const recordar = (raiz.querySelector('#recordar') as HTMLInputElement | null)?.checked ?? false;
              void this.#entrar(usuario, clave, recordar);
            }}
          >
            <iswc-input
              id="usuario"
              full-width
              label="Usuario o correo"
              autocomplete="username"
              value="${guardadas.username}"
              ${this.#ocupado ? 'disabled' : ''}
            ></iswc-input>
            <iswc-input
              id="clave"
              type="password"
              full-width
              password-toggle
              label="Contraseña"
              autocomplete="current-password"
              value="${guardadas.password}"
              ${this.#ocupado ? 'disabled' : ''}
            ></iswc-input>
            <iswc-checkbox id="recordar" ${guardadas.remember ? 'checked' : ''}>
              Recordar en este equipo
            </iswc-checkbox>
            <p class="nota">
              El token vive solo en esta pestaña. «Recordar» guarda las credenciales
              ofuscadas en este navegador; no lo actives en un equipo compartido.
            </p>
            <iswc-button type="submit" color="brand" ${this.#ocupado ? 'loading' : ''}>Entrar</iswc-button>
          </form>

          <iswc-divider></iswc-divider>

          <div class="pegar">
            <iswc-input
              id="token"
              full-width
              label="…o pega un JWT"
              placeholder="eyJhbGciOi…"
              spellcheck="false"
            ></iswc-input>
            <iswc-button
              variant="outlined"
              color="neutral"
              oniswc-click=${() =>
                this.#pegarToken((this.#root.querySelector('#token') as HTMLInputElement | null)?.value ?? '')}
            >
              Usar token
            </iswc-button>
          </div>
        </iswc-dialog>
      </div>
    `);

    this.#dialogo = this.#root.querySelector('.dialogo');
    // `iswc-button type=submit` vive en Shadow DOM: el submit nativo no cruza,
    // hay que pedirlo explícitamente (error conocido del kit).
    const enviar = this.#root.querySelector('iswc-button[type="submit"]');
    const form = this.#root.querySelector('form');
    enviar?.addEventListener('iswc-click', () => form?.requestSubmit());

    adoptCss(this.#root, import.meta.url, 'docs-auth');
  }
}

precargarCss(import.meta.url, 'docs-auth');
define('docs-auth', DocsAuth);
export { DocsAuth };
