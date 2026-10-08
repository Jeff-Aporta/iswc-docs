# LLM.md — isc-swagger

Contrato del proyecto. **Léelo antes de tocar código.** Lo que rompe esto se revierte.

Esta página son las leyes y la historia de errores. El detalle por capa vive en
`src/`, y se lee en este orden:

| Página | Cuándo |
| --- | --- |
| [`src/LLM.md`](src/LLM.md) | Siempre. Índice, regla de reuso del kit, deuda conocida |
| [`src/cdn/LLM.md`](src/cdn/LLM.md) | Contrato **público** (se copia a `dist/cdn/LLM.md` para el CDN) |
| [`src/js/LLM.md`](src/js/LLM.md) | Vas a tocar dominio, parsers, URL o auth |
| [`src/components/LLM.md`](src/components/LLM.md) | Vas a tocar pintado, CSS o repintado |
| [`src/components/sw/LLM.md`](src/components/sw/LLM.md) | Necesitas props/eventos de un `sw-*` |
| [`docs/LLM.md`](docs/LLM.md) | Vas a tocar el sitio documental |

Guardián de que esas páginas no mienten: `tests/docs.test.ts`.

## Carta de leyes

| Hacer | No hacer |
|---|---|
| CSS en el `.css` **hermano** del componente + `adoptCss(shadow, import.meta.url)` | CSS en una constante del `.ts` (el error de is-tkts) |
| Reusar `is-*` del kit por CDN | Reinventar botones, diálogos, tablas, toasts o iconos |
| **`<iswc-button>`** en vez de `<button>` | Botones nativos en el shadow (el kit ya da todo: variantes, colores, a11y) |
| **`<iswc-input>`** en vez de `<input>` | Inputs nativos (excepto `type="color"`, `type="file"`, `type="range"` — sin equivalente) |
| **`<iswc-select>` + `<iswc-option>`** en vez de `<select>` + `<option>` | Selects nativos (el kit los estiliza y los integra con el tema) |
| **`<iswc-checkbox>`** en vez de `<input type="checkbox">` | Checkboxes nativos en formularios |
| Dominio sin DOM en `src/js/`, pintado en `src/components/` | Lógica de negocio dentro de un componente |
| `sw-app` es el único dueño del estado; los hijos reciben `props` y emiten eventos | Que un hijo escriba la URL o el estado global |
| `props` por **propiedad** | `props` por atributo (llevan objetos y saltos de línea) |
| Adoptar el CSS **después** de rellenar el shadow | Adoptarlo antes: el vaciado se lleva el `<link>` de respaldo |
| CSS como hoja construida cacheada (`adoptedStyleSheets`) | Un `<link>` por shadow root: no bloquea el pintado → flicker |
| `precargarCss(import.meta.url)` al cargar el módulo | Esperar al primer montaje para pedir la hoja |
| Toda entrada de la spec pasa por `esc()` o por `html\`\`` | `innerHTML` con texto del documento |
| `?conn=<base64url>` anula el `specUrl` del `<script>` | Dejar que el demo local gane al server real |
| Buscar por query **siempre** ignora la pestaña activa | Filtrar por tab cuando hay query (esconde lo que el usuario pidió) |
| `?s=<base64url(JSON)>` lleva tema+paleta+q | Parámetros sueltos para el mismo fin (rompe el estado compartido con `boot.ts`) |
| Click en la marca = reset (`?s=`); la `?conn=` se queda | Reiniciar vía location.reload() (rompe el shell sin redibujar) |
| Botón descargar / reload: `variant="plain"` solo icono + `aria-label` | Texto «Descargar» u otro label en la cabecera |
| Reload documento: `clearJsonCache` + `loadViewerDocument(..., { force: true })` | Esperar 24 h o pedir al usuario vaciar localStorage a mano |
| Selector Documento/Clásico: control compacto (~2 rem de alto) | `iswc-select` a altura de campo de formulario grande |
| Registrar el componente en `index.html`, `all.ts` y `docs/manifest.js` | Dejarlo en uno solo (parcial = bug mudo) |
| Tests en `tests/*.test.ts` contra `dist/cdn/` | Importarlos desde `src/`: probaría código que nadie sirve |
| `?conn=` → `kind: "config"` InSoft pasa por `parseInsoftConfig` | Asumir OpenAPI: el spec sintetizado no lleva `openapi:` en la salida |
| `auth.loginUrl` por defecto = `DEFAULT_AUTH_LOGIN_URL` (main-orchestrator) | Dejar `auth.enabled: false` cuando el visor trae `viewer.auth.enabled: true` |
| `index.html` decide `data-modo` (hero vs app) **en `<head>`**, antes del primer pintado | Decidir el modo desde un módulo: el visor parpadea como hero antes de cambiar |
| Título del índice (`.op-nombre`): **1 línea** + `ellipsis` | `-webkit-line-clamp: 2` u otro wrap (rompe el panel estrecho) |
| `SW_KIT_TAGS` en `src/js/kit-tags.ts` (CDN); hosts ISS lo importan | Lista de tags `is-*` hardcodeada en el host (PatyIA ya la erradicó) |
| Tras cambiar CSS/JS del visor: `npm run build` + push `main` + avisar al host que bumpee el pin SHA | Solo editar `src/` sin rebuild/push: jsDelivr sigue el commit viejo |
| Cuerpo try-it vacío = `{ }` (`formatBodyExample`) | `JSON.stringify(null)` → literal `"null"` en el editor |
| Picker de adjuntos general, sin `accept=` | Filtrar MIME por endpoint o inventar un input nativo |
| Host RAG = GitHub Pages; host ISS = jsDelivr `@sha40` | Asumir que un push actualiza los dos canales |
| `dist/cdn/LLM.md` + `js/iss-swagger-doc.{js,d.ts,ts}` para agentes y tests Deno | Reescribir el shape de `swagger__*.json` en cada host |

## Dos drivers, un solo documento

El visor tiene **dos presentaciones intercambiables** del mismo documento. No son modos de un
componente: son dos custom elements, cada uno con su shell, su shadow y su hoja.

| | `<sw-app>` | `<sw-minidoc>` |
|---|---|---|
| Presentación | Lista por tags, la operación se despliega en su sitio | Índice · una operación por página · código fijo a la derecha |
| Para qué | Barrer una API entera, comparar endpoints vecinos | Integrar un endpoint concreto sin perder de vista la petición |
| Inspiración | Swagger UI, corregido | Documentación de plataforma tipo MiniMax |
| Probar | Pestaña dentro de la tarjeta | Botón que abre `sw-try` en un `iswc-dialog` |
| Estado en URL | `?tab`, `?op`, `?opt`, `?server`, `?s` | `?op` |

### Cambiar de driver en caliente

La página no monta un driver a mano: monta **`<sw-viewer>`**, que resuelve cuál toca y saca un
selector fijo abajo a la izquierda. Cambiarlo destruye y recrea el driver; no hay estado que
migrar porque lo compartido (operación abierta, servidor, sesión) ya viaja por la URL y el
almacenamiento, así que la vista nueva aterriza donde estaba la anterior.

La elección vive en `js/driver.ts`, fuera de los dos drivers —es una preferencia del lector, no
del documento— y se resuelve en este orden:

1. `driver` dentro de `?s=`, para que un enlace llegue con la vista que se quiso enseñar.
2. `localStorage`, para que sobreviva a recargar.
3. `sw-app`.

El valor por defecto **no** se escribe en la URL: la que hay que poder compartir es la que no
lleva el parámetro. Añadir un tercer driver es meterlo en `DRIVERS` y registrar su tag; el
selector y la persistencia salen solos.

Comparten **todo** el dominio (`js/config`, `js/openapi`, `js/nav`, `js/auth`) y no comparten
estado entre sí. Reglas para que sigan sin pisarse:

- Ninguno registra el tag del otro. `all.ts` registra los dos; una página monta el que quiera.
- Lo que sea lógica se añade en `src/js/`, nunca en el shell de uno solo — si no, el otro driver
  se queda sin ello y las dos vistas empiezan a divergir.
- Montar los dos a la vez funciona; solo duplica la carga del documento. `sw-viewer`
  mantiene uno solo vivo: al cambiar, reemplaza el nodo entero.

Guardián: `tests/minidoc.test.ts`.

## Estado persistido y caducidad por build

El visor guarda dos cosas en `localStorage`, y se tratan distinto **a propósito**:

| Qué | Clave | Caduca al cambiar de build |
|---|---|---|
| Ancho de los paneles (geometría) | `is-components` → `iswc-split-panel` → `sw:split:*` | **Sí** |
| Driver elegido | `sw:driver` | No |

Cada build lleva un sello de fecha y hora (`__SW_BUILD__`, lo inyecta `scripts/build.ts` y lo
expone `js/version.ts`). Al cargar `sw-layout` se compara con el sello que escribió la geometría
guardada; si no coinciden, la geometría se descarta.

Existe por un caso real: una versión con un fallo guardó `0px` de ancho de panel, y a partir de
ahí **cada** carga restauraba ese cero, incluso después de corregir el fallo. Un estado
persistido que sobrevive al cambio del componente que lo escribió es una trampa: anula la
corrección y el síntoma parece no arreglarse nunca.

La geometría es barata de rehacer y el reparto por defecto siempre es razonable, así que
descartarla no cuesta nada. El driver **no** caduca: es una elección deliberada del lector y
cambiar de versión no debe cambiarle la vista. Por eso `js/prefs.ts` enumera las claves de
geometría en vez de vaciar el almacén — también respeta lo que guarden otros componentes del kit.

Al tocar el layout, añadir aquí la clave nueva. Guardián: `tests/minidoc.test.ts`.

## Arquitectura en tres frases

1. `src/js/` es puro: sin DOM, sin red salvo `fetch` explícito. Es lo que se
   prueba sin navegador y lo que decide qué se ve.
2. `src/components/sw/` traduce esos datos a `is-*`. Cada componente es un
   `.ts` + un `.css` hermano y nada más.
3. `scripts/build.ts` transpila (no empaqueta) a `dist/cdn/`, un directorio
   **plano** donde todo módulo es hermano de todos. Los imports relativos se
   reescriben; los `.css` se copian al lado de su `.js`.

## Estado: un solo dueño

`sw-app` guarda config, spec, grupos, sesión, servidor, pestaña, operación
abierta y búsqueda. Todo lo demás es controlado.

- Escritura de la URL: **solo** `sw-app`, vía `js/url-state.ts`.
- `?s=` (tema+paleta+q) lo escribe `js/search-state.ts`.
- Navegar (sección, operación, sub-pestaña) entra en el historial con `pushState`;
  ajustar la vista (tema, driver, servidor, teclear en la búsqueda) usa `replaceState`.
- Sin `?s=` se abre **siempre** la primera sección y la primera operación: el documento
  no puede elegir otra.
- Un hijo que necesita cambiar algo **emite**: `sw-op-toggle`, `sw-op-tab`,
  `sw-param-change`, `sw-body-change`, `sw-server-change`, `sw-search`,
  `sw-nav-tab`, `sw-session-change`, `sw-need-login`, `sw-reset`.
- `sw-tag-group` reemite sin interpretar: no puede saber qué hay abierto en otro grupo.

## Repintado: cuándo entero y cuándo no

Por defecto, asignar `props` repinta el shadow entero (`crearComponente`). Eso
es correcto para lo inmutable. **No** lo es donde el usuario tiene el foco:

- `sw-try` reparte el repintado en tres zonas (URL, aviso, resultado) porque
  escribir en un parámetro le quitaría el foco al campo en cada tecla.
- `sw-nav` ignora un cambio de `query` que venga solo: lo está escribiendo el
  usuario en ese mismo shadow.
- `sw-operation` no rehace la tarjeta al cambiar de pestaña ni de servidor.
- `sw-tag-group` distingue «cambió el grupo» de «cambió qué está abierto».

### Cambio de pestaña sin flicker

Dos causas distintas, las dos resueltas:

**1. Repintado de más.** `sw-app#cambiarNavTab()` no llama a `#render()`: solo
`#sincronizarNav()` (cambia `activeTab` y `tabs` en la barra) y `#pintarLista()`
(repinta solo la lista filtrada). El shell —nav, info, server— queda intacto.

**2. El CSS llegaba tarde.** Un `<link rel="stylesheet">` dentro de un
ShadowRoot **no bloquea el pintado de ese shadow**: el navegador pinta los
hijos sin estilos y los recoloca al resolver la hoja, también desde caché,
porque cargar un `<link>` nunca es síncrono. Cambiar de sección recrea decenas
de shadow roots, así que se veía la vista entera desordenarse un frame.

La hoja se adopta ahora como `CSSStyleSheet` construida y cacheada por href:

- `adoptCss(shadow, import.meta.url)` (`_shared.ts`) busca la hoja en caché y
  la aplica con `adoptedStyleSheets` — **síncrono**, y sobrevive a
  `replaceChildren()` porque es propiedad del ShadowRoot, no un hijo.
- `precargarCss(import.meta.url)` dispara la descarga al **cargar el módulo**,
  no al montar la primera instancia: así el primer pintado tampoco parpadea.
  `crearComponente` lo hace solo; los `#render()` manuales lo llaman aparte.
- El `<link>` sigue como respaldo: solo en la primera aparición de cada href
  (mientras baja el texto) y en navegadores sin hojas construibles.

**El kit `is-*` viene del CDN y enlaza dos `<link>` por shadow root**, sin
caché. `src/js/hojas.ts` —plano, síncrono en `<head>`, antes que el kit—
envuelve `ShadowRoot.prototype.prepend` y cambia esos `<link>` por la hoja
construida a partir de la segunda aparición del href. La primera se deja pasar
tal cual: ningún componente puede quedarse sin estilos por esa capa. Publica el
caché en `globalThis.__swHojas` y `_shared.ts` lo reusa — una sola descarga por
hoja para todo el visor.

Guardianes: `tests/hojas.test.ts` (el parche del kit y el caché compartido) y
`tests/css-adopcion.test.ts` (adopción síncrona, sin `<link>`, sin segunda
descarga, y que repintar no se lleve la hoja).

## Coste diferido

`sw-operation` monta su cuerpo al abrir, no al pintar la lista. Una spec con
doscientos endpoints crearía doscientos `sw-try` con sus campos y su CSS antes
de que nadie mire ninguno. No lo deshagas «para simplificar».

## Kit `is-*` por CDN: qué se carga y por qué tan poco

**Por defecto: `@main`, sin pin.** Las apps no fijan SHA salvo un caso explícito
(reproducibilidad de un host concreto). Sin `L.pin()`, el loader resuelve el tip de `main`.

`L.pin('<sha>')` solo cuando el host lo declara a propósito (p. ej. `isWebComponentsRef` no
vacío en un ISS). No es el camino normal de `index.html` ni de previews/docs.

### Importación mínima con el loader

`all.min.js` del kit arrastra las 12 categorías. Este visor usa un subconjunto de tags,
declarado **una sola vez** en `src/js/kit-tags.ts` (`SW_KIT_TAGS`) y publicado en
`dist/cdn/js/kit-tags.js`. Hosts e `index.html` importan esa lista; no la duplican.

```html
<script type="module">
  import { ISWebComponentsLoader as L } from
    'https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@3c722aca9579cb2f764c026c6385685c1603e789/dist/cdn/loader.min.js';
  import { SW_KIT_TAGS } from
    'https://cdn.jsdelivr.net/gh/Jeff-Aporta/isc-swagger@main/dist/cdn/js/kit-tags.js';
  await L.load(...SW_KIT_TAGS);
</script>
```

### Inventario: los tags que usa el visor

Si un `sw-*` empieza a usar otro tag del kit, añadirlo **en `src/js/kit-tags.ts`** (y
actualizar esta tabla). El host ISS **no** mantiene `isSwaggerKitTags`: sin el tag el
custom element no hace upgrade y el tag queda en el DOM sin shadow — sin error en consola.
Caso real: sin `iswc-code`, cURL y respuestas salían cajas vacías.

| Categoría | Tags que se usan | Fichero en el CDN |
|---|---|---|
| `actions` | `iswc-button`, `iswc-copy-button`, `iswc-dropdown`, `iswc-dropdown-item` | `actions/<nombre>.min.js` |
| `forms` | `iswc-checkbox`, `iswc-input`, `iswc-option`, `iswc-select`, `iswc-textarea` | `forms/<nombre>.min.js` |
| `feedback` | `iswc-spinner`, `iswc-tag`, `iswc-theme-toggle`, `iswc-toast` | `feedback/<nombre>.min.js` |
| `helpers` | `iswc-format-bytes`, `iswc-format-date`, `iswc-format-number`, `iswc-relative-time` | `helpers/<nombre>.min.js` |
| `layout` | `iswc-callout`, `iswc-details`, `iswc-dialog`, `iswc-divider`, `iswc-drawer`, `iswc-split-panel` | `layout/<nombre>.min.js` |
| `media` | `iswc-icon` | `media/icon.min.js` |
| `code` | `iswc-code` | `code/code.min.js` |
| `helpers` | `iswc-md-render` | `helpers/md-render.min.js` |
| `diagrams` | `iswc-flowchart`, `iswc-sequence-diagram`, `iswc-er-diagram`, `iswc-diagram-lightbox` | `diagrams/<nombre>.min.js` |

Los MD de Notas (`x-iss-doc-md`) pueden embutir `<iswc-flowchart>` e `<iswc-code>` porque
`iswc-md-render` pinta por `innerHTML` y el kit hace upgrade. Al exportar a Postman,
`postman-md.ts` rasteriza diagramas a PNG transparente (`<img src="data:image/png;base64,…">`)
y convierte `<iswc-code>` a fences ```.

El nombre del fichero va **sin** el prefijo `is-`: `iswc-copy-button` vive en
`actions/copy-button.min.js`. El loader hace esa traducción; solo importa al depurar un 404.

Cargar por tag son ~215 KB de JS. Cargar las 6 categorías enteras traería componentes que el
visor no monta (`is-data-grid`, `is-date-picker`, `is-rte`…), así que **no** se usa
`L.load('forms')` aunque sea más corto de escribir.

## Catálogo `is-*` (qué usar en cada sitio)

Regla: si el kit tiene el componente, se usa; si no, HTML nativo plano
(`<input type="color">` para picker de color, `<input type="file">` para
adjuntos por form association, `<input type="range">` para sliders).

| Necesidad | Usar | No usar |
|---|---|---|
| Acción (icono, texto, ambos) | `<iswc-button variant="…" pill? with-caret? color="…">` | `<button>` |
| Campo de texto / búsqueda | `<iswc-input type="search\|text\|email\|…">` | `<input>` |
| Menú desplegable | `<iswc-dropdown>` con `<iswc-dropdown-item>` | `<select>` |
| Set finito de opciones | `<iswc-select>` con `<iswc-option>` | `<select><option>` |
| Booleano | `<iswc-checkbox>` | `<input type="checkbox">` |
| Icono | `<iswc-icon icon="mdi:nombre">` (MDI path) | `<svg>` inline, glifos manuales |
| Diálogo modal | `<iswc-dialog label="…">` | `<dialog>` manual |
| Toast | `<iswc-toast placement="…">` (en `document.body`) | UI de notificación propia |
| Tema | `<iswc-theme-toggle>` | lógica de `data-theme` propia |
| Paleta | `<iswc-palette-selector>` | variables CSS propias |
| Menú contextual | `<is-context-menu>` + `<is-context-menu-item>` | listas flotantes caseras |
| Grupo de botones | `<iswc-button-group>` | `<div>` con `iswc-button` flex |
| FAB | `<is-fab>` | botón circular hecho a mano |
| Speed dial | `<is-speed-dial>` | FAB con sub-acciones caseras |
| Botón copiar | `<iswc-copy-button>` | `<iswc-button>` con handler |
| Botón-icono checkbox | `<iswc-check-icon-button>` | `<iswc-button>` con icono toggle |

Propiedades del kit que **no son atributos**: `variant`, `color`, `pill`,
`with-caret`, `loading`, `disabled` (este sí), `invalid`. Pasarlas como
atributos HTML no falla en silencio — `iswc-button variant="ghost"` se pinta con
los defaults sin error y el botón queda sin estilo. Asignar por propiedad:

```ts
btn.variant = 'plain';
btn.color = 'neutral';
btn.pill = true;
```

## Landing vs app: `data-modo`

`index.html` tiene dos modos:

- **hero**: el visitante llega sin `?conn=` / `?spec=` / `?api=`. Se muestra
  el vídeo promocional en `src/css/hero.css`. Sin JS, el hero se queda
  visible por defecto (atributo `hidden` lo oculta solo vía JS).
- **app**: hay config por URL. El `<sw-app>` se monta y el hero desaparece.

La decisión se hace **en `<head>`**, sincrónica, con un IIFE que escribe
`document.documentElement.dataset.modo`. Razones:

1. **Antes del primer pintado**: si la decisión se tomara desde un `<script
   type="module">` (que es diferido por el navegador), el primer frame se
   pintaría con el modo equivocado y luego saltaría al correcto: flash de
   contenido que no debería estar ahí.
2. **Antes de que los custom elements se registren**: si el `<sw-app>` se
   mostrara antes de que se ejecuten los `<script type="module"
   src="./dist/cdn/sw-*.js">`, su shadow no existiría y se vería el tag
   vacío. El script al final del `<body>` quita el `hidden` del bloque
   correspondiente **después** de que los módulos hayan registrado los
   componentes.

Guardián visual: si ves el `<sw-app>` sin estilos durante un frame al cargar
con `?conn=`, el orden de scripts en `index.html` está mal.

## Identidad: el sistema NO se llama OpenAPI

El visor parsea un formato propio de InSoft (`{kind:"config", version, info,
viewer, paths, catalog, docs, tags}`). OpenAPI nunca debe salir a UI:

- `sw-info.ts` no pinta badge «OpenAPI X.Y».
- `sw-export.ts` no ofrece «OpenAPI 3 (JSON)» — es «Documento (JSON)».
- `index.html` no dice «Visor OpenAPI» en título ni descripción.
- Previews de demo no usan la palabra como marca del visor.
- `parseInsoftConfig` no emite `spec.openapi` (sería un campo residual sin
  significado).

Test: `tests/invariantes.test.ts :: "la spec del InSoft no expone openapi"`
y `:: "index.html no menciona OpenAPI"`.

## `?conn=` (autoconexión ISS)

Base64url de `{apiBase, paths, title, icon, fixedServer, ...}`. Decodificado:

```
apiBase:    "https://host/api",            ← obligado
paths: {                                ← overrides opcionales
  config:    "/system/swagger/config.json",
  meta, paths, docsConfig, testing, info
},
title, icon, fixedServer, embed, auto
```

Precedencia: `?conn=` gana sobre `<script id="sw-config">` y `?spec=/?api=`.
**Bug ya visto**: si el `<script>` trae `specUrl` y `?conn=` no lo borra, el
visor cae al demo local y el usuario ve otra API. Fix: en `resolveBootConfig`,
`delete config.specUrl` cuando hay conn.

Al cargar, `loadViewerDocument`:

1. detecta `kind: "config"` → `parseInsoftConfig`
2. transforma `paths[path][method]` con `responses.template` (`ok`, `auth`,
   `authForbidden`, `authNotFound`, `deleteEnvelope`, `raw`)
3. resuelve `catalog.payloads[key]` → ejemplo de respuesta
4. resuelve `catalog.requestBodies[bodyKey]` → ejemplo de body
5. mueve `catalog.docs[doc]` → `x-iss-doc-md`
6. `tag.subgroups` → `tag.x-isa-subgroups`
7. emite spec sin campo `openapi`

## `?s=` (bolsa de estado visual)

Base64url de `{theme, palette, q, ...}`. La escribe `boot.ts` antes del primer
pintado (tema+paleta). El visor suma `q` (query de búsqueda). F5 restaura todo.

- `js/search-state.ts`: `readSState`, `writeSState(patch, { push })`, `getQuery`, `setQuery`, `clearSState`.
- `setQuery('')` borra la clave; `clearSState()` borra la bolsa entera (reset).
- `boot.js` no se toca: lee `?s=` y deja `q` en paz al cambiar tema/paleta.

## Búsqueda cross-tab

`sw-app#buscar(query)`:
1. persiste con `setQuery(q)` en `?s=`
2. `#pintarLista()` re-filtra
3. `#gruposVisibles`: con query salta `filterGroupsByNavTab` y busca en todos los
   tags; sin query filtra por la pestaña activa

`sw-nav` muestra pestañas cuando no hay query; cuando hay, oculta la fila y
pinta `Resultados para «x»` con botón Limpiar.

## Sesión JWT

`auth.loginUrl` por defecto = `https://main-orchestrator.jeffaporta.workers.dev`.
`isc-swagger` no debe quedarse con `auth.enabled: false` cuando el visor trae
`viewer.auth.enabled: true` — siempre se necesita dónde canjear credenciales.

César (`wrapPassword`) + prefijo/sufijo (`abc123`/`xyz987`): **no es cifrado**,
es el contrato del backend. Documentarlo en UI es parte del contrato.

## Errores aprendidos (no repetir)

1. **CSS embebido en el `.ts`** — heredado de is-tkts, donde estaba justificado
   por el HTML descargable autocontenido. Aquí no aplica. Guardián:
   `tests/estructura.test.ts`.

2. **Imports con carpetas en `dist/`** — el aplanado cubría `from"…"` pero no
   `import"…"` (import por efecto secundario). Un `import '../../js/x.js'`
   quedaba apuntando a un directorio inexistente: 404 y el módulo entero no se
   ejecuta. Guardián: `estructura.test.ts`.

3. **Diálogo montado en `document.body` con CSS en el shadow** — el diálogo de
   confirmación de `sw-try` vive en light DOM, así que su CSS está en
   `src/css/app.css` (`.sw-confirmar-*`). Un `.css` de componente nunca alcanza
   a un nodo fuera de su shadow.

4. **`iswc-button type="submit"` no envía el form** — el `<button>` real está en
   Shadow DOM. `sw-auth` escucha `iswc-click` y llama `requestSubmit()`. Error
   conocido del kit; no confiar en el tipo nativo.

5. **Valores de enum inventados en los `is-*`** — `variant="ghost"` cuando el
   componente no lo acepta no da error, no avisa y no se ve: el elemento se
   pinta con los valores por defecto. Verifica el enum en el `.js` del kit o en
   su `.md` antes de usarlo.

6. **Un CE que `createElement` monta sin estar importado** — no hace upgrade: el
   tag queda en el DOM sin shadow y la vista sale vacía, sin error en consola.
   Guardián: `estructura.test.ts` cruza componentes ↔ `index.html` ↔ `all.ts`.

7. **`prefers-color-scheme`** — no se usa. El tema es explícito (`data-theme`
   en `<html>`, escrito por `boot.js` antes del primer pintado) para que un
   enlace compartido se vea igual en cualquier equipo.

8. **`?conn=` ignorado por `specUrl` del `<script>`** — el visor mostraba el
   demo local en vez del server real. Guardián: `invariantes.test.ts`.

9. **Flicker al cambiar pestaña** — el `<link>` dentro del shadow no bloquea el
   pintado de ese shadow, así que cada uno de los decenas de shadow roots que
   se recrean al cambiar de sección se pintaba un frame sin estilos y la vista
   entera se desordenaba. Conservar el `<link>` a través de `replaceChildren`
   fue el primer intento y **no bastaba**: el problema no era perderlo, era que
   nunca fue síncrono. Fix real: hojas construidas cacheadas por href
   (`adoptedStyleSheets`), más `js/hojas.js` para los shadow roots del kit.
   Guardianes: `hojas.test.ts`, `css-adopcion.test.ts`, `invariantes.test.ts`.

10. **`auth.enabled: false` cuando `viewer.auth.enabled: true`** — el visor no
    tenía `loginUrl`, `resolveAuthConfig` lo desactivaba, no había forma de
    iniciar sesión. Fix: `DEFAULT_AUTH_LOGIN_URL` en `insoft-config.ts`.

11. **OpenAPI en UI** — el visor parsea InSoft, no OpenAPI. Pintar «OpenAPI 3»
    como marca miente. Guardián: `invariantes.test.ts` (3 tests).

12. **Búsqueda escondida por la navTab** — con query la pestaña activa filtraba
    los resultados. Fix: con query, `filterGroupsByNavTab` se salta.

13. **CSS `<link>` no preserva al repintar** — la versión «guardar el `<link>`
    antes del `replaceChildren` y reponerlo al final» se aplicó en todos los
    `#render()` manuales y **no bastaba**. Un `<link>` dentro de un shadow
    nunca bloquea el pintado del shadow: el navegador lo resuelve en
    segundo plano. Aunque el `<link>` sea la misma hoja ya cacheada, el
    repintado se ve sin estilos durante un frame. El fix real es propiedad
    del ShadowRoot, no un hijo: `shadow.adoptedStyleSheets = [hoja]`.
    `js/hojas.js` parchea `ShadowRoot.prototype.prepend` para los shadow
    roots del kit; los nuestros ya usan `adoptCss` directamente.

14. **`iswc-button` ignora atributos que no conoce** — `variant="ghost"` cuando
    el kit no acepta `ghost` se pinta con los valores por defecto sin
    error ni aviso. Lo mismo con `color="brandish"`. Verifica el enum en
    `is-webcomponents/src/components/actions/button.md` antes de usarlo.

15. **El IIFE de `data-modo` debe ir en `<head>`** — la primera vez que se
    intentó decidir hero vs app desde un `<script type="module">` al final
    del body, el primer frame pintaba el modo equivocado y luego saltaba
    al correcto. El IIFE plano en `<head>` lee `location.search` sincrónico
    y escribe `dataset.modo` antes de que el navegador pida ningún recurso.
    Mismo razonamiento que `boot.js`: el dato del modo es estado de UI
    sincrónico, no se puede diferir.

16. **El script final que quita el `hidden` debe ir después de los módulos**
    — si se pone antes de los `<script type="module" src="./dist/cdn/sw-*.js">`,
    el `<sw-app>` aparece con `hidden=false` mientras los componentes aún
    no están registrados: se ve el tag vacío hasta que carguen. Por eso el
    orden en `index.html` es: módulos → IIFE de un-hide.

17. **Cuerpo try-it `"null"`** — `skeletonFromSchema` caía a `null` en `$ref` sin
    example (p. ej. `QUERY /voces`). El editor hacía `JSON.stringify` y el usuario
    veía la palabra null, JSON inválido para un objeto. Fix: no volcar skeleton;
    `formatBodyExample` de `null` o `undefined` pinta `{ }` vacío. Guardián:
    `dominio.test.ts`.

18. **Adjuntos: picker general** — si la op admite archivos (`tryitAttachments`,
    multipart/octet-stream, schema `dataUrl`/`base64`) se pinta `<iswc-file-input
    multiple>` **sin** `accept=`. No hay lista MIME por endpoint. Empaquetado:
    `tryit-attach.ts` → FormData `files`+`body` o data URL en el JSON. `QUERY` de
    listado (sqlFiltering) **no** muestra picker. `api-fetch.ts` no pone
    `Content-Type` a mano sobre `FormData`.

19. **FileReader no existe en Node** — el polyfill de tests debe usar
    `arrayBuffer` + `btoa`. Un `FileReader` inventado no corre en `node --test`.

20. **`npm test` completo puede no terminar** — JSDOM + `search-state` a veces
    cuelga tras los asserts. Un hang no es verde. Correr el archivo puntual
    (`dominio.test.ts`, `invariantes.test.ts`, …).

## Seguridad de lo que se pinta

La spec es entrada no confiable. `html\`\`` escapa todo primitivo por defecto;
`raw()` es la excepción y solo para HTML ya saneado (`renderMarkdown`, que
escapa antes de componer). `sw-json` no ejecuta lo que resalta.

Las credenciales: el JWT va a `sessionStorage` (muere con la pestaña); las
credenciales de «recordarme» a `localStorage`, ofuscadas y **opt-in**. La
ofuscación replica el contrato del backend, no es cifrado — decirlo en la UI es
parte del contrato.

## Añadir un componente `sw-*`

1. `src/components/sw/sw-x.ts` + `src/components/sw/sw-x.css`.
2. `<script type="module">` en `index.html` (orden importa: el shell
   `sw-app` y los componentes que usa van al final del grupo de scripts).
3. Import en `src/components/sw/all.ts` (el build genera `sw.all.js`).
4. Entrada en `docs/manifest.js` + `docs/previews/sw-x.html` (la galería
   nueva vive en `docs/`, no en `src/components/demo/`).
5. Si `#render()` es manual: `adoptCss(this.#root, import.meta.url)` al final
   de cada salida del render, y `precargarCss(import.meta.url)` junto al
   `define(...)`. Con `crearComponente` no hay que hacer nada.
6. `npm test` — `estructura.test.ts` + `invariantes.test.ts` + `docs.test.ts`
   verifican.

## Testing

`npm test` compila y corre `node --test tests/*.test.ts`. La suite entera puede
colgarse en JSDOM/`search-state`: un hang no cuenta como verde; corre el archivo.

| Archivo | Caza |
|---|---|
| `openapi.test.ts` | Lectura de la spec: agrupación, orden, `$ref`, seguridad |
| `dominio.test.ts` | Filtros, URLs, errores HTTP, markdown, Postman, sesión, búsqueda, conn |
| `postman-md.test.ts` | Conversión MD InSoft → Postman (`iswc-code`→fences; pipeline diagramas) |
| `render.test.ts` | Que el shadow se llene (jsdom, `is-*` sin registrar) |
| `app.test.ts` | El ciclo completo de `sw-app` con la spec de demo real |
| `minidoc.test.ts` | Driver 2: vistas, pestañas de estado, cURL y que los dos drivers convivan |
| `estructura.test.ts` | Inventario: cada componente ↔ `index.html` ↔ `all.ts` ↔ preview ↔ CSS hermano |
| `conn.test.ts` | `?conn=`: precedencia, override de paths, default ISS, conn > `<script>` |
| `insoft-config.test.ts` | Parser InSoft con fixture real + smoke contra la red |
| `json-cache.test.ts` | Cache local ≥24 h de los JSON del documento; fallback si la API cae |
| `css-adopcion.test.ts` | `adoptCss`: hoja síncrona desde caché, una descarga por href, repintar no la pierde |
| `docs.test.ts` | Que los `LLM.md` no mienten: catálogo completo, enlaces vivos, reglas que el código sigue cumpliendo |
| `hojas.test.ts` | El parche de `js/hojas.js` sobre los shadow roots del kit y el caché compartido |
| `iss-swagger-doc.test.ts` | Piezas JSON `kind` meta/paths/config vs `assertIssSwaggerPiezas` |
| `iss-swagger-md.test.ts` | JSON → markdown / HTML de `GET /LLM.md` |
| `cdn.test.ts` | Artefactos públicos: `LLM.md`, `.d.ts`, `iss-swagger-doc.ts`, convertidor `.min.js` |
| `invariantes.test.ts` | Regresiones de bugs ya vistos (OpenAPI, flicker, auth, conn, spec por defecto) |

El patrón de fallo de este stack es siempre el mismo: **el artefacto se genera
bien y el contenido está mal**. Build verde, navegador contento, y el CSS no
llega, o el evento no salta, o el componente no está en la galería. Antes de
escribir un test nuevo, la pregunta útil es: *¿qué par de cosas puede
desincronizarse aquí sin que nada se rompa?*

## Gitignore y `tests/`

`tests/` no está ignorado por `.gitignore`: solo `tests/*.tmp`,
`tests/coverage/` y `tests/.cache/`. El fixture real del ISS
(`tests/fixtures/insoft-config.sample.json`, 76 KB) vive dentro del repo
deliberadamente — `insoft-config.test.ts` lo usa para cazar regresiones sin
necesidad de red.

Si en algún momento se mete el repo a git y el fixture resulta pesado, mover
solo el fixture a `.gitignore` con `!tests/fixtures/insoft-config.sample.json`
si se quiere commitear o `tests/fixtures/*.sample.json` si se regenera en CI.
No ignorar `tests/*.test.ts`: son contrato ejecutable.

## Windows

Commits con `-m "..."` plano; nada de heredocs de bash. `git show > archivo` en
PowerShell sale UTF-16 y el contenido «desaparece» al parsearlo — usar
`-Encoding utf8` o `execSync` desde Node.

## Pendiente — estándar demos/e2e iswc (auditoría 2026-09-03, NO ejecutado)

Estado verificado (sin cambios funcionales en esta ronda): consume el kit `is-*`
por CDN (`@sha40`; hosts RAG = GitHub Pages, ISS = jsDelivr) y su «galería» real
es el sitio documental (`docs/previews/*.html` + `docs/manifest.js`, HTML plano
que consume `dist/cdn/`). **No** existe suite e2e con Stagehand
(`src/utils/health/e2e` ausente), ni harness de tests separado, ni demos JSON
`is-preview/v1` con controles; `demo/` solo trae `openapi.sample.json`.

Cuando se ejecute, aplicar el estándar de apps iswc (piloto en PatyIA/app):
harness separado de la app, demos JSON-driven con controles (JSON → prop/attr),
e2e por componente con Stagehand en `src/utils/health/e2e`, sin `.env` (secretos
de rutas fijas) y servidor controlado (ataque a CF-worker: apuntar directo, sin
servidor local). Referencias:
`../is-webcomponents/specs/galeria/{spec,e2e,preview-cdn}.md` y
`PatyIA/app/specs/demo-preview-inventario.md`.

⚠ **No documentar como implementado.** Nota: varios `*.md` de este repo arrastran
mojibake UTF-8 histórico (legacy de re-escrituras PowerShell); corregirlo es
cambio de texto, fuera del alcance de una ronda funcional.