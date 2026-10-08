/**
 * <sw-layout> — el armazón de tres zonas del visor: índice · contenido · código.
 *
 * Existe como componente y no como CSS dentro de `sw-minidoc` porque no es solo una rejilla:
 * tiene comportamiento propio —dos divisores arrastrables y dos umbrales de colapso— y ese
 * comportamiento no debe reimplementarse cada vez que un driver quiera esta forma.
 *
 * Se usa por slots:
 *
 *   <sw-layout>
 *     <div slot="cabecera">…</div>
 *     <nav slot="inicio">…</nav>
 *     <main slot="centro">…</main>
 *     <aside slot="fin">…</aside>
 *   </sw-layout>
 *
 * Los dos laterales quedan **pegados a los bordes** de la ventana: el ancho lo administra el
 * usuario arrastrando, y quitarle sitio con márgenes contradice eso.
 *
 * Colapso escalonado, y en este orden a propósito: primero se va el panel de código y después
 * el índice. El código es consulta —lo miras cuando vas a integrar—, mientras que el índice es
 * navegación: sin él no se puede ni cambiar de endpoint. El que estorba primero es el otro.
 */

import { adoptCss, precargarCss, define, html, emitir } from './_shared.js';
import { caducarPrefsSiCambioBuild } from '../../js/prefs.js';

// Al cargar el módulo, antes de que ningún `iswc-split-panel` se monte: su connectedCallback
// restaura la posición de localStorage, así que purgar después no serviría de nada.
caducarPrefsSiCambioBuild();

/** Reparto inicial de cada split, en % del track primario. Se reaplica tras el primer layout.
 *  En `.split-interno` el primario es el panel derecho (`primary="end"`): al redimensionar
 *  el viewport ese ancho se mantiene y el centro es quien se ajusta. */
const PROPORCIONES: Array<{ sel: string; pct: number }> = [
  { sel: '.split-externo', pct: 18 },
  { sel: '.split-interno', pct: 36 },
];

/** Por debajo de esto un panel no es «estrecho», es un accidente: se recalcula el reparto. */
const MINIMO_PANEL_PX = 40;

/** Anchos donde cada lateral deja de caber al lado y pasa a cajón. Coinciden con el CSS. */
const UMBRAL_FIN = '(max-width: 87.5rem)';
const UMBRAL_INICIO = '(max-width: 60rem)';

class SwLayout extends HTMLElement {
  #root: ShadowRoot;
  #mqFin: MediaQueryList | null = null;
  #mqInicio: MediaQueryList | null = null;
  #alCambiar = (): void => this.#sincronizarModo();

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.#render();
    // `matchMedia` y no un ResizeObserver: el umbral es de ventana, no del componente, y así
    // el navegador avisa solo en el cruce en vez de en cada píxel de arrastre.
    if (typeof matchMedia === 'function') {
      this.#mqFin = matchMedia(UMBRAL_FIN);
      this.#mqInicio = matchMedia(UMBRAL_INICIO);
      this.#mqFin.addEventListener('change', this.#alCambiar);
      this.#mqInicio.addEventListener('change', this.#alCambiar);
    }
    this.#sincronizarModo();
    this.#corregirProporciones();
  }

  disconnectedCallback(): void {
    this.#mqFin?.removeEventListener('change', this.#alCambiar);
    this.#mqInicio?.removeEventListener('change', this.#alCambiar);
    this.#mqFin = this.#mqInicio = null;
  }

  /**
   * Fija el reparto de los splits en píxeles, ya con el layout medido.
   *
   * `iswc-split-panel` cachea su posición **en píxeles** al conectarse, y ese píxel es canónico:
   * gana sobre el porcentaje y se reaplica en cada resize. Aquí el split se conecta dentro de un
   * shadow recién construido, cuando el host todavía mide 0, así que cachea `0px` — el índice y
   * el contenido colapsaban y el panel de código se quedaba con todo el ancho.
   *
   * Peor aún: con `storage-key` ese cero se persiste en `localStorage`, así que una sola carga
   * mala envenenaba todas las siguientes aunque el bug ya no se diera.
   *
   * Por eso se escribe `positionInPixels` y no `position`: el porcentaje lo pisa el píxel
   * canónico en el primer resize. Un píxel guardado plausible es del usuario y se respeta; uno
   * degenerado (0 o casi) es el síntoma y se corrige.
   */
  #corregirProporciones(): void {
    requestAnimationFrame(() => {
      for (const { sel, pct } of PROPORCIONES) {
        const sp = this.#root.querySelector(sel) as (HTMLElement & { positionInPixels?: number }) | null;
        if (!sp) continue;
        const ancho = sp.getBoundingClientRect().width;
        if (ancho < 1) continue;
        const guardado = Number(sp.getAttribute('position-in-pixels'));
        if (Number.isFinite(guardado) && guardado > MINIMO_PANEL_PX) continue;
        sp.positionInPixels = Math.round((ancho * pct) / 100);
      }
    });
  }

  /** `true` cuando ese lateral ya no cabe al lado y se sirve como cajón. */
  get #finEsCajon(): boolean { return this.#mqFin?.matches ?? false; }
  get #inicioEsCajon(): boolean { return this.#mqInicio?.matches ?? false; }

  /** Abre el lateral que esté en modo cajón. */
  abrir(lado: 'inicio' | 'fin'): void {
    const cajon = this.#root.querySelector(`iswc-drawer[data-lado="${lado}"]`) as (HTMLElement & { open?: boolean }) | null;
    if (cajon) cajon.open = true;
  }

  /**
   * Mueve cada lateral entre su hueco del split y su cajón.
   *
   * El nodo con slot se mueve, no se duplica: dos copias del índice significarían dos listas
   * que se desincronizan en cuanto una se repinta, y el driver solo conoce una.
   */
  #sincronizarModo(): void {
    const estados: Array<['inicio' | 'fin', boolean]> = [
      ['inicio', this.#inicioEsCajon],
      ['fin', this.#finEsCajon],
    ];
    for (const [lado, esCajon] of estados) {
      const destino = this.#root.querySelector(esCajon ? `iswc-drawer[data-lado="${lado}"] .hueco` : `.hueco-${lado}`);
      const ranura = this.#root.querySelector(`slot[name="${lado}"]`);
      if (destino && ranura && ranura.parentElement !== destino) destino.append(ranura);
      // El split oculta el panel vacío: si no, dejaría una franja muerta y un divisor inútil.
      const split = this.#root.querySelector(`iswc-split-panel[data-zona="${lado}"]`) as (HTMLElement & { collapse?: string | null }) | null;
      if (split) {
        if (esCajon) split.setAttribute('collapse', lado === 'inicio' ? 'start' : 'end');
        else split.removeAttribute('collapse');
      }
      const boton = this.#root.querySelector(`.hamburguesa-${lado}`) as HTMLElement | null;
      if (boton) boton.hidden = !esCajon;
    }
    emitir(this, 'sw-layout-modo', { inicio: this.#inicioEsCajon ? 'cajon' : 'panel', fin: this.#finEsCajon ? 'cajon' : 'panel' });
  }

  #render(): void {
    this.#root.replaceChildren();
    this.#root.append(html`
      <header class="cabecera">
        <iswc-button
          class="hamburguesa hamburguesa-inicio"
          variant="plain"
          size="small"
          hidden
          aria-label="Abrir el índice de endpoints"
          oniswc-click=${() => this.abrir('inicio')}
        ><iswc-icon icon="mdi:menu"></iswc-icon></iswc-button>

        <div class="cabecera-slot"><slot name="cabecera"></slot></div>

        <iswc-button
          class="hamburguesa hamburguesa-fin"
          variant="plain"
          size="small"
          hidden
          aria-label="Abrir la petición y la respuesta"
          oniswc-click=${() => this.abrir('fin')}
        ><iswc-icon icon="mdi:code-braces"></iswc-icon></iswc-button>
      </header>

      <iswc-split-panel class="split-externo" data-zona="inicio" position="18" snap="14% 18% 24%" snap-threshold="16" storage-key="sw:split:inicio">
        <div slot="start" class="lateral hueco-inicio"><slot name="inicio"></slot></div>
        <div slot="end" class="resto">
          <iswc-split-panel
            class="split-interno"
            data-zona="fin"
            primary="end"
            position="36"
            snap="28% 36% 44%"
            snap-threshold="16"
            storage-key="sw:split:fin:v2"
          >
            <div slot="start" class="centro"><slot name="centro"></slot></div>
            <div slot="end" class="lateral hueco-fin"><slot name="fin"></slot></div>
          </iswc-split-panel>
        </div>
      </iswc-split-panel>

      <iswc-drawer data-lado="inicio" placement="start" label="Endpoints"><div class="hueco"></div></iswc-drawer>
      <iswc-drawer data-lado="fin" placement="end" label="Petición y respuesta"><div class="hueco"></div></iswc-drawer>
    `);
    adoptCss(this.#root, import.meta.url, 'sw-layout');
  }
}

precargarCss(import.meta.url, 'sw-layout');
define('sw-layout', SwLayout);
export { SwLayout };
