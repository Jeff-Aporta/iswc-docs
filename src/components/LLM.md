# `components` para LLM

## Propósito

La capa de pintado. Traduce los datos que produce
[`../js/`](../js/LLM.md) a tags `is-*` del kit. Nada más.

| Carpeta | Qué es |
| --- | --- |
| `sw/` | Los componentes del visor. [Catálogo](sw/LLM.md) |
| `demo/` | Galería de previews, uno por componente. [Detalle](demo/LLM.md) |

## Qué componente elegir

Antes de crear un `sw-*` nuevo, la pregunta no es «¿cómo lo pinto?» sino
**«¿qué tag del kit lo pinta ya?»**. Un `sw-*` solo existe para traducir un
concepto del documento (una operación, un parámetro, una respuesta) a esos
tags. Si el componente nuevo no traduce nada del dominio, no debería existir.

Catálogo del kit:
[catalog.md](https://raw.githubusercontent.com/Jeff-Aporta/is-webcomponents/main/src/skills/is-webcomponents/catalog.md).
Confirmar props y eventos en el `.md` del módulo, nunca por el nombre del tag.

## Anatomía de un `sw-*`

Un `.ts` y un `.css` **hermano**. Nada más, y en ese orden:

```
src/components/sw/sw-x.ts     ← estructura y eventos
src/components/sw/sw-x.css    ← estilo, siempre aparte
```

El build los copia planos y hermanos a `dist/cdn/`, y ese es todo el contrato
de `adoptCss(shadow, import.meta.url)`: de `sw-x.js` deriva `sw-x.css`.

### Dos formas de escribirlo

**`crearComponente(import.meta.url, render, props)`** — por defecto. Asignar
`props` repinta el shadow entero. Correcto para lo inmutable. Se encarga solo
del CSS (adopción y precarga).

**`#render()` a mano** — solo cuando repintar entero rompería algo: el foco del
usuario, una animación o el coste diferido. Son once: `sw-app`, `sw-nav`,
`sw-auth`, `sw-operation`, `sw-tag-group`, `sw-try`, la envoltura `sw-viewer`, el
armazón `sw-layout`, y los tres del driver de vistas — `sw-minidoc`,
`sw-minidoc-view`, `sw-minidoc-code`. Estos deben, además:

- `adoptCss(this.#root, import.meta.url)` al final de **cada** salida del render;
- `precargarCss(import.meta.url)` junto al `define(...)`.

Guardián: `tests/invariantes.test.ts`.

### Cuándo NO repintar entero

- `sw-try` reparte el repintado en zonas (URL, aviso, resultado): escribir en un
  parámetro le quitaría el foco al campo en cada tecla.
- `sw-nav` ignora un cambio de `query` que venga solo: lo está escribiendo el
  usuario en ese mismo shadow.
- `sw-operation` no rehace la tarjeta al cambiar de pestaña ni de servidor.
- `sw-tag-group` distingue «cambió el grupo» de «cambió qué está abierto».
- `sw-operation` monta su cuerpo **al abrir**. Una spec de doscientos endpoints
  crearía doscientos `sw-try` antes de que nadie mire ninguno. No lo deshagas
  «para simplificar».

## El CSS: hojas construidas, no `<link>`

Esto es lo más fácil de romper sin enterarse, así que va explícito.

Un `<link rel="stylesheet">` dentro de un ShadowRoot **no bloquea el pintado de
ese shadow**. El navegador pinta los hijos sin estilos y los recoloca cuando
resuelve la hoja — también si viene del caché HTTP, porque cargar un `<link>`
nunca es síncrono. Con un shadow root no se nota. Al cambiar de sección se
destruyen y recrean decenas, y se ve **la vista entera desordenarse durante un
frame y recolocarse**. Ese era el flicker.

`adoptCss` descarga el `.css` una vez por href, construye una `CSSStyleSheet` y
la aplica con `adoptedStyleSheets`:

- se aplica **síncrona**, en el mismo frame;
- es propiedad del ShadowRoot, no un hijo: `replaceChildren()` no se la lleva;
- la comparten todas las instancias.

`precargarCss` dispara esa descarga al **cargar el módulo**, no al montar la
primera instancia, para que el primer pintado tampoco parpadee.

El `<link>` sigue existiendo como respaldo, y solo en dos casos: la primera
aparición de un href (mientras baja el texto) y los navegadores sin hojas
construibles.

> **Intento fallido, para que nadie lo repita.** El primer arreglo fue
> conservar el `<link>` a través de `replaceChildren` (`replaceChildrenKeepCss`,
> y el patrón `const css = root.querySelector(…)` antes del clear +
> `root.prepend(css)` al final). **No bastaba**: el problema nunca fue perder el
> `<link>`, sino que aplicarlo jamás es síncrono. Si vuelves a ver ese patrón en
> el código, es una regresión.

Guardianes: `tests/css-adopcion.test.ts`, `tests/hojas.test.ts`.

## Composición y relaciones

`sw-app` es el **único** dueño del estado: config, spec, grupos, sesión,
servidor, pestaña, operación abierta y búsqueda. Todo lo demás es controlado.

- Escritura de la URL: solo `sw-app`, vía `js/url-state.ts`.
- Un hijo que necesita cambiar algo **emite**. Nunca escribe.
- `sw-tag-group` reemite sin interpretar: no puede saber qué hay abierto en otro
  grupo.

Eventos del visor: `sw-op-toggle`, `sw-op-tab`, `sw-param-change`,
`sw-body-change`, `sw-server-change`, `sw-search`, `sw-nav-tab`,
`sw-session-change`, `sw-need-login`, `sw-reset`.

## Dependencias compartidas

`sw/_shared.ts` y nada más:

| Export | Uso |
| --- | --- |
| `adoptCss`, `precargarCss` | CSS del componente (arriba) |
| `crearComponente` | Fábrica con `props` y repintado entero |
| `define` | Registro idempotente: recargar el mismo fuente no lanza |
| `html`, `raw`, `esc`, `el`, `rec` | Plantillas y escapado |
| `emitir` | `CustomEvent` que cruza el Shadow DOM |
| `avisar` | Toast del kit; si no está montado, no hace nada |

**Lo que `_shared.ts` no debe volver a tener**: formato de fechas, bytes o
números. El kit ya los trae y entran con `all.min.js`.

## Patrones comunes

- `props` por **propiedad**, nunca por atributo: llevan objetos y saltos de línea.
- Toda entrada del documento pasa por `esc()` o por `` html`` ``. `raw()` es la
  excepción, y solo para HTML ya saneado (`renderMarkdown`).
- Estados por atributo del host en el CSS propio: `:host([attr])` top-level,
  nunca `&[attr]` dentro de `:host { }`.
- CSS anidado. Nada de repetir el selector padre en plano.
- Listeners en `document`/`window`: solo en `connectedCallback`, y se quitan en
  `disconnectedCallback`.

## Qué hacer

- Delegar en el `is-*` que ya existe.
- CSS en el `.css` hermano.
- Adoptar el CSS **después** de rellenar el shadow.
- Registrar el componente nuevo en los **cuatro** sitios: `index.html`,
  `sw/all.ts`, `demo/manifest.js` y `demo/previews/sw-x.html`.

## Qué no hacer

- CSS en una constante del `.ts`. Es el error heredado de is-tkts: impide
  minificarlo aparte, lo saca del caché del navegador y lo deja fuera del
  alcance de las herramientas de CSS.
- Volver al patrón de conservar el `<link>` a mano.
- Pintar UI genérica a mano existiendo el tag del kit.
- Lógica de negocio dentro de un componente.
- Que un hijo escriba la URL o el estado global.
- Asumir que `<iswc-button type="submit">` envía el form: el `<button>` real está
  en Shadow DOM. `sw-auth` escucha `iswc-click` y llama `requestSubmit()`.

## Errores conocidos y prevención

1. **CSS embebido en el `.ts`** — guardián: `tests/estructura.test.ts`.
2. **Flicker por `<link>` en el shadow** — arriba, con el intento fallido.
   Guardianes: `css-adopcion.test.ts`, `hojas.test.ts`.
3. **Diálogo montado en `document.body` con CSS en el shadow** — el diálogo de
   confirmación de `sw-try` vive en light DOM, así que su CSS está en
   `src/css/app.css` (`.sw-confirmar-*`). Un `.css` de componente **nunca**
   alcanza a un nodo fuera de su shadow.
4. **Un custom element que `createElement` monta sin estar importado** — no hace
   upgrade: el tag queda en el DOM sin shadow y la vista sale vacía, **sin error
   en consola**. Guardián: `estructura.test.ts`.
5. **Valores de enum inventados en un `is-*`** — `variant="ghost"` donde no
   existe no da error, no avisa y no se ve: se pinta con los valores por
   defecto. Verificar el enum en el `.md` del módulo.
6. **`iswc-button type="submit"`** — ver arriba. Error conocido del kit.

El patrón de fallo de este stack es siempre el mismo: **el artefacto se genera
bien y el contenido está mal**. Build verde, navegador contento, y el CSS no
llega, o el evento no salta, o el componente no está en la galería. Antes de
escribir un test nuevo, la pregunta útil es: *¿qué par de cosas puede
desincronizarse aquí sin que nada se rompa?*

## Navegación

- Índice de `src`: [`../LLM.md`](../LLM.md)
- Catálogo `sw-*`: [`sw/LLM.md`](sw/LLM.md)
- Galería: [`demo/LLM.md`](demo/LLM.md)
- Dominio: [`../js/LLM.md`](../js/LLM.md)
- Leyes del repo: [`../../LLM.md`](../../LLM.md)
