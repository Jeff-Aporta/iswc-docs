/**
 * _shared.ts — base común de los componentes `sw-*`.
 *
 * Tres cosas y nada más: plantillas (`html`), adopción del CSS hermano
 * (`adoptCss`) y la fábrica `crearComponente`. Todo lo que sea dominio vive
 * en `js/`; todo lo que sea estilo vive en el `.css` hermano.
 *
 * **El CSS nunca se escribe aquí dentro.** `adoptCss(shadow, import.meta.url)`
 * deriva `sw-foo.css` de `sw-foo.js` y lo adopta en el ShadowRoot; el build
 * copia ambos al mismo directorio plano. Meter el CSS en una constante del
 * `.ts` —como se hizo en is-tkts— impide minificarlo aparte, lo saca del
 * caché del navegador y lo deja fuera del alcance de las herramientas de CSS.
 *
 * Mismo contrato que `IsUi.adoptCss` del kit is-webcomponents; se reimplementa
 * en 6 líneas para no atar el arranque de un componente a que `all.min.js` ya
 * haya terminado de cargar.
 */

/* ── CSS ────────────────────────────────────────────────────── */

/**
 * El CSS de los `sw-*` se adopta como hoja construida (`adoptedStyleSheets`),
 * no como `<link>` dentro del shadow. La diferencia es el flicker:
 *
 *   - Un `<link>` dentro de un ShadowRoot **no** bloquea el pintado de ese
 *     shadow. El navegador pinta los hijos sin estilos y los vuelve a pintar
 *     cuando resuelve la hoja — aunque venga del caché. Cambiar de sección
 *     destruye y recrea decenas de shadow roots, así que se ve la vista entera
 *     desordenarse durante un frame y recolocarse.
 *   - `adoptedStyleSheets` es una propiedad del ShadowRoot, no un hijo:
 *     `replaceChildren()` no se la lleva, y una hoja ya construida se aplica
 *     de forma síncrona, en el mismo frame. Sin frame sin estilos.
 *
 * La hoja se descarga **una vez por href** y se comparte entre todas las
 * instancias; a partir de ahí adoptarla no toca la red ni el disco.
 *
 * El `<link>` sigue existiendo como respaldo: solo se usa en el primer
 * componente que necesita una hoja aún no descargada, y en navegadores sin
 * hojas construibles.
 */

/**
 * `js/hojas.js` monta el mismo caché en `<head>` para los shadow roots del kit
 * `is-*`, que vienen del CDN y enlazan su CSS con `<link>`. Si está, se reusan
 * sus mapas: una sola descarga por hoja para todo el visor.
 */
const compartido = (globalThis as { __swHojas?: SwCacheHojas }).__swHojas;

/** Hojas ya construidas, por href absoluto. */
const HOJAS: Map<string, CSSStyleSheet> = compartido?.hojas ?? new Map<string, CSSStyleSheet>();
/** Descargas en curso, por href: N instancias no piden N veces la misma hoja. */
const CARGAS: Map<string, Promise<CSSStyleSheet | null>> =
  compartido?.cargas ?? new Map<string, Promise<CSSStyleSheet | null>>();

const SOPORTA_HOJAS = (() => {
  try {
    return 'adoptedStyleSheets' in ShadowRoot.prototype && typeof new CSSStyleSheet().replaceSync === 'function';
  } catch {
    return false;
  }
})();

/**
 * `…/sw-foo.js` → `…/sw-foo.css`. El build los deja hermanos y planos.
 *
 * `nombre` existe por el bundle: dentro de `sw.all.js`, `import.meta.url` vale
 * lo mismo para **todos** los módulos, así que derivar del nombre de archivo da
 * `sw.all.css` —que no existe— y los componentes se pintan sin estilos. El
 * *directorio* sí es correcto en los dos casos, así que basta con decir qué
 * hoja se quiere de ese directorio.
 */
/**
 * Directorio del que salen las hojas cuando el módulo no está donde está su CSS.
 *
 * `dist/cdn` es folderizado: las hojas viven junto a su componente, en
 * `components/sw/`. Los módulos sueltos las encuentran por `import.meta.url`, pero
 * `all.min.js` está en la raíz del CDN y derivaría `dist/cdn/sw-app.css`, que no existe.
 * El barril lo fija una vez al cargarse; sin fijar, se conserva el comportamiento de hermano.
 */
let CSS_BASE: string | null = null;

/** Fija el directorio de las hojas. Lo llama el barril del bundle, nadie más. */
export function setCssBase(url: string): void {
  try {
    CSS_BASE = new URL(url, typeof location !== 'undefined' ? location.href : undefined).href;
  } catch {
    CSS_BASE = null;
  }
}

const hrefCss = (moduleUrl: string, nombre?: string): string => {
  const hoja = nombre ? `${nombre}.css` : null;
  if (CSS_BASE && hoja) return new URL(hoja, CSS_BASE).href;
  const u = new URL(moduleUrl);
  u.pathname = nombre
    ? u.pathname.replace(/[^/]+$/, `${nombre}.css`)
    : u.pathname.replace(/\.js$/i, '.css');
  if (!CSS_BASE) return u.href;
  return new URL(u.pathname.replace(/^.*\//, ''), CSS_BASE).href;
};

function descargarHoja(href: string): Promise<CSSStyleSheet | null> {
  const enCurso = CARGAS.get(href);
  if (enCurso) return enCurso;

  const carga = fetch(href)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${href}`))))
    .then((texto) => {
      const hoja = new CSSStyleSheet();
      hoja.replaceSync(texto);
      HOJAS.set(href, hoja);
      return hoja;
    })
    // Sin hoja construida el `<link>` de respaldo se queda puesto, así que el
    // componente no se pinta sin estilos: solo pierde la ruta rápida.
    .catch(() => null);

  CARGAS.set(href, carga);
  return carga;
}

const enlazar = (shadow: ShadowRoot, href: string): HTMLLinkElement => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  shadow.prepend(link);
  return link;
};

const adoptar = (shadow: ShadowRoot, hoja: CSSStyleSheet): void => {
  if (!shadow.adoptedStyleSheets.includes(hoja)) {
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, hoja];
  }
};

/**
 * Empieza a descargar el `.css` hermano sin esperar a que se monte ninguna
 * instancia. Se llama al cargar el módulo: para cuando el visor termina de
 * pedir la spec, todas las hojas están construidas y el primer pintado
 * tampoco parpadea.
 */
export function precargarCss(moduleUrl: string, nombre?: string): void {
  if (SOPORTA_HOJAS) void descargarHoja(hrefCss(moduleUrl, nombre));
}

/**
 * Adopta el `.css` hermano del módulo en el ShadowRoot.
 *
 * Llamar **después** de rellenar el shadow: el `<link>` de respaldo es un hijo
 * y `replaceChildren()` se lo llevaría.
 */
export function adoptCss(shadow: ShadowRoot, moduleUrl: string, nombre?: string): void {
  const href = hrefCss(moduleUrl, nombre);

  if (!SOPORTA_HOJAS) {
    if (!shadow.querySelector('link[rel="stylesheet"]')) enlazar(shadow, href);
    return;
  }

  const hoja = HOJAS.get(href);
  if (hoja) {
    adoptar(shadow, hoja);
    return;
  }

  // Primera vez en toda la página: el `<link>` cubre el hueco mientras llega
  // el texto, y se retira al adoptar para no dejar dos copias vivas.
  const link = enlazar(shadow, href);
  void descargarHoja(href).then((h) => {
    if (!h) return;
    adoptar(shadow, h);
    link.remove();
  });
}

/* ── DOM ────────────────────────────────────────────────────── */

export const el = (tag: string, attrs: SwAtributos = {}, children: SwHijos = []): HTMLElement => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'text') node.textContent = String(v);
    else if (k === 'html') node.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v as EventListener);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  const lista = Array.isArray(children) ? children : [children];
  for (const c of lista) {
    if (c == null) continue;
    node.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
};

export const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/* ── Plantillas ─────────────────────────────────────────────── */

const CRUDO = Symbol('sw-html-crudo');

/** Marca una cadena como HTML de confianza dentro de `html`. */
export const raw = (valor: unknown): SwHtmlCrudo =>
  ({ [CRUDO]: String(valor ?? '') }) as unknown as SwHtmlCrudo;

const esCrudo = (v: unknown): v is SwHtmlCrudo => typeof v === 'object' && v !== null && CRUDO in v;

/**
 * `html` — plantilla etiquetada que devuelve un DocumentFragment.
 *
 * Se lee como JSX y no depende de ningún framework:
 *
 *   root.append(html`
 *     <h2 class="titulo">${titulo}</h2>
 *     <iswc-button oniswc-click=${() => ejecutar()}>Ejecutar</iswc-button>
 *   `);
 *
 * Reglas de interpolación:
 *   - primitivo            → texto escapado (sirve también dentro de atributos)
 *   - Node / fragmento     → se inserta el nodo tal cual
 *   - array                → cada elemento, en orden
 *   - función tras `on…=`  → addEventListener sobre ese elemento
 *   - `raw(str)`           → HTML sin escapar (solo para HTML ya saneado)
 *   - null / false         → nada
 *
 * El escape por defecto es lo que hace seguro pintar una spec de terceros.
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): DocumentFragment => {
  const nodos: Node[] = [];
  const handlers: Array<{ evento: string; fn: EventListener }> = [];
  let acc = '';

  for (let i = 0; i < strings.length; i++) {
    acc += strings[i];
    if (i >= values.length) continue;
    const v = values[i];

    if (v == null || v === false || v === true) continue;

    // Manejador de evento: la plantilla trae `onclick=` justo antes del valor.
    // Se admite guion (`oniswc-change=`) porque los `is-*` emiten eventos propios
    // (`iswc-input`, `iswc-change`, `iswc-click`), no los nativos.
    const enAtributoEvento = typeof v === 'function' && /\s+on([a-zA-Z][\w-]*)=\s*$/.test(acc);
    if (enAtributoEvento) {
      const m = acc.match(/\s+on([a-zA-Z][\w-]*)=\s*$/)!;
      acc = acc.slice(0, acc.length - m[0].length);
      acc += ` data-sw-ev="${handlers.length}"`;
      handlers.push({ evento: m[1]!.toLowerCase(), fn: v as EventListener });
      continue;
    }

    if (esCrudo(v)) {
      acc += (v as unknown as Record<symbol, string>)[CRUDO];
      continue;
    }

    const lista = Array.isArray(v) ? v : [v];
    for (const item of lista) {
      if (item == null || item === false || item === true) continue;
      if (item instanceof Node) {
        acc += `<template data-sw-nodo="${nodos.length}"></template>`;
        nodos.push(item);
      } else if (esCrudo(item)) {
        acc += (item as unknown as Record<symbol, string>)[CRUDO];
      } else {
        acc += esc(item);
      }
    }
  }

  const plantilla = document.createElement('template');
  plantilla.innerHTML = acc;
  const frag = plantilla.content;

  for (const marca of [...frag.querySelectorAll('template[data-sw-nodo]')]) {
    const idx = Number((marca as HTMLElement).dataset.swNodo);
    marca.replaceWith(nodos[idx] ?? document.createComment('sw:nodo'));
  }

  for (const nodo of [...frag.querySelectorAll('[data-sw-ev]')]) {
    const idx = Number((nodo as HTMLElement).dataset.swEv);
    const h = handlers[idx];
    if (h) nodo.addEventListener(h.evento, h.fn);
    nodo.removeAttribute('data-sw-ev');
  }

  return frag;
};

/* ── Registro ───────────────────────────────────────────────── */

/** Registro idempotente: volver a cargar el mismo fuente no lanza. */
export const define = (tag: string, clase: CustomElementConstructor): void => {
  if (!customElements.get(tag)) customElements.define(tag, clase);
};

/**
 * Fábrica de componente con estado propio.
 *
 * `props` es la única entrada: los payloads del visor llevan objetos anidados
 * y saltos de línea, que no caben en un atributo HTML. Cada asignación
 * repinta entero; no hay diffing porque una operación es inmutable dentro de
 * su versión del documento, así que no hay estado interno que conservar.
 */
export const crearComponente = <P extends object>(
  moduleUrl: string,
  render: (root: ShadowRoot, props: P, host: HTMLElement) => void,
  inicial: P,
  /** Nombre de la hoja (`sw-method`). Obligatorio para funcionar dentro del bundle. */
  nombre?: string,
): CustomElementConstructor => {
  // La fábrica se llama al cargar el módulo: la hoja empieza a bajar ya, no
  // cuando se monte la primera instancia.
  precargarCss(moduleUrl, nombre);
  return class extends HTMLElement {
    #props: P = inicial;
    #root: ShadowRoot;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
      this.#render();
    }

    get props(): P {
      return this.#props;
    }

    set props(v: Partial<P> | null | undefined) {
      this.#props = { ...this.#props, ...(v ?? {}) };
      if (this.isConnected) this.#render();
    }

    #render(): void {
      this.#root.replaceChildren();
      render(this.#root, this.#props, this);
      // La hoja adoptada sobrevive al `replaceChildren` de arriba: repintar no
      // vuelve a pedirla ni deja un frame sin estilos.
      adoptCss(this.#root, moduleUrl, nombre);
    }
  };
};

/* ── Utilidades de vista ────────────────────────────────────── */

/** Emite un evento que cruza el Shadow DOM (los `is-*` usan el mismo contrato). */
export const emitir = (host: HTMLElement, nombre: string, detail?: unknown): void => {
  host.dispatchEvent(new CustomEvent(nombre, { detail, bubbles: true, composed: true }));
};

/** Notificación con el toaster del kit; si no está montado, no hace nada. */
export function avisar(mensaje: string, color: 'brand' | 'success' | 'warning' | 'danger' = 'brand'): void {
  const host = document.querySelector('iswc-toast') as
    | (HTMLElement & { create(msg: string, opts?: Record<string, unknown>): Promise<unknown> })
    | null;
  void host?.create(mensaje, { color });
}

/*
 * Aquí NO va formato de fechas, bytes ni números: el kit ya trae
 * `<iswc-format-date>`, `<iswc-format-bytes>`, `<iswc-format-number>` y
 * `<iswc-relative-time>`, y todos entran con `all.min.js`. Este archivo llegó a
 * tener un `fecha()` con su propio formateador —que no llamaba nadie— y un
 * `formatBytes()` con su propia tabla de unidades: dos formatos de salida que
 * podían divergir del resto de la app sin que nada avisara.
 */
