/**
 * _shared.ts — base común de los componentes `docs-*`.
 *
 * Tres cosas y nada más: plantillas (`html`), adopción del CSS hermano
 * (`adoptCss`) y la fábrica `crearComponente`. Todo lo que sea dominio vive
 * en `js/`; todo lo que sea estilo vive en el `.css` hermano.
 *
 * **El CSS nunca se escribe aquí dentro.** `adoptCss(shadow, import.meta.url)`
 * deriva `docs-foo.css` de `docs-foo.js` y lo adopta en el ShadowRoot; el build
 * copia ambos al mismo directorio plano. Meter el CSS en una constante del
 * `.ts` —como se hizo en is-tkts— impide minificarlo aparte, lo saca del
 * caché del navegador y lo deja fuera del alcance de las herramientas de CSS.
 *
 * Mismo contrato que `IsUi.adoptCss` del kit is-webcomponents; se reimplementa
 * en 6 líneas para no atar el arranque de un componente a que `all.min.js` ya
 * haya terminado de cargar.
 */
/** Fija el directorio de las hojas. Lo llama el barril del bundle, nadie más. */
export declare function setCssBase(url: string): void;
/**
 * Empieza a descargar el `.css` hermano sin esperar a que se monte ninguna
 * instancia. Se llama al cargar el módulo: para cuando el visor termina de
 * pedir la spec, todas las hojas están construidas y el primer pintado
 * tampoco parpadea.
 */
export declare function precargarCss(moduleUrl: string, nombre?: string): void;
/**
 * Adopta el `.css` hermano del módulo en el ShadowRoot.
 *
 * Llamar **después** de rellenar el shadow: el `<link>` de respaldo es un hijo
 * y `replaceChildren()` se lo llevaría.
 */
export declare function adoptCss(shadow: ShadowRoot, moduleUrl: string, nombre?: string): void;
export declare const el: (tag: string, attrs?: DocsAtributos, children?: DocsHijos) => HTMLElement;
export declare const esc: (s: unknown) => string;
export declare const rec: (v: unknown) => Record<string, unknown>;
/** Marca una cadena como HTML de confianza dentro de `html`. */
export declare const raw: (valor: unknown) => DocsHtmlCrudo;
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
export declare const html: (strings: TemplateStringsArray, ...values: unknown[]) => DocumentFragment;
/** Registro idempotente: volver a cargar el mismo fuente no lanza. */
export declare const define: (tag: string, clase: CustomElementConstructor) => void;
/**
 * Fábrica de componente con estado propio.
 *
 * `props` es la única entrada: los payloads del visor llevan objetos anidados
 * y saltos de línea, que no caben en un atributo HTML. Cada asignación
 * repinta entero; no hay diffing porque una operación es inmutable dentro de
 * su versión del documento, así que no hay estado interno que conservar.
 */
export declare const crearComponente: <P extends object>(moduleUrl: string, render: (root: ShadowRoot, props: P, host: HTMLElement) => void, inicial: P, 
/** Nombre de la hoja (`docs-method`). Obligatorio para funcionar dentro del bundle. */
nombre?: string) => CustomElementConstructor;
/** Emite un evento que cruza el Shadow DOM (los `is-*` usan el mismo contrato). */
export declare const emitir: (host: HTMLElement, nombre: string, detail?: unknown) => void;
/** Notificación con el toaster del kit; si no está montado, no hace nada. */
export declare function avisar(mensaje: string, color?: 'brand' | 'success' | 'warning' | 'danger'): void;
