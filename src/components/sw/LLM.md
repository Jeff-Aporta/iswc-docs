# `sw` para LLM — catálogo

## Propósito

Los componentes del visor. Cada uno traduce **un concepto del documento** a
tags `is-*` del kit. El que no traduce nada del dominio no debería existir.

Cómo se escribe uno, cómo se adopta el CSS y qué está prohibido:
[`../LLM.md`](../LLM.md). Leer eso **antes** que esta tabla.

## Componentes

`props` se asigna siempre por **propiedad**, nunca por atributo.

| Tag | Props | Emite | Qué traduce |
| --- | --- | --- | --- |
| `<sw-app>` | — (lee config y URL) | — | Shell. Único dueño del estado |
| `<sw-nav>` | `brand`, `tabs`, `activeTab`, `query`, `spec`, `config`, `authEnabled`, `auth`, `session` | `sw-nav-tab`, `sw-search`, `sw-reset`, `sw-session-change` | Barra superior: marca, secciones, búsqueda, acciones |
| `<sw-info>` | `spec` | — | Cabecera del documento en `sw-app`: título, versión y `info.description` |
| `<sw-home>` | `spec` | — | Portada del visor: `info.description` completa vía `sw-doc` (clic en logo en minidoc) |
| `<sw-server>` | `value`, `options` | `sw-server-change` | Selector del host contra el que se prueba |
| `<sw-tag-group>` | `group`, `spec`, `serverBase`, `authEnabled`, `docIndex`, `opAbierta`, `opTab` | reemite los de `sw-operation` | Un tag con sus operaciones (y subgrupos) |
| `<sw-operation>` | `op`, `spec`, `serverBase`, `authEnabled`, `docMd`, `abierto`, `tab` | `sw-op-toggle`, `sw-op-tab`, `sw-need-login` | Tarjeta desplegable de una operación |
| `<sw-try>` | `op`, `spec`, `serverBase`, `authEnabled` | `sw-need-login` | «Probar»: cuerpo JSON, adjuntos si la op los admite, respuesta |
| `<sw-params>` | `params`, `values`, `disabled`, `titulo` | `sw-param-change` | Campos de los parámetros |
| `<sw-body>` | `op`, `value`, `disabled` | `sw-body-change` | Editor del cuerpo JSON |
| `<sw-responses>` | `responses` | — | Respuestas **declaradas** (documentación, no resultado) |
| `<sw-doc>` | `markdown`, `vacio` | — | Prosa Markdown vía `iswc-md-render` (HTML embebido: `iswc-flowchart`, `iswc-sequence-diagram`, `iswc-er-diagram`, `iswc-code`) |
| `<sw-json>` | `value`, `maxHeight` | — | Bloque JSON con resaltado y copiar |
| `<sw-method>` | `method` | — | Chip del verbo HTTP. Delega en `<iswc-tag>` |
| `<sw-path>` | `path` | — | Ruta con los `{parámetros}` resaltados |
| `<sw-auth>` | `authEnabled`, `auth`, `session` | `sw-session-change` | Sesión JWT: chip, diálogo de login, pegado de token |
| `<sw-export>` | `spec`, `config` | — | Descargas: documento JSON, Postman, IS (trigger solo icono) |
| `<sw-doc-reload>` | — | `sw-doc-reload` | Actualiza config desde API (invalida cache 24 h); solo icono |
| `<sw-doc-actions>` | `spec`, `config` | `sw-doc-reload` | Pastilla: descarga + recarga en `<iswc-button-group pill>` (cabeceras) |
| `<sw-viewer>` | `conn`, `driver` | — | Envoltura: monta el driver elegido y escucha `sw-driver-change` |
| `<sw-driver-switch>` | `value` | `sw-driver-change` | Selector de presentación, en la cabecera junto al tema |
| `<sw-layout>` | — (slots) | `sw-layout-modo` | Armazón de 3 zonas: splits arrastrables y colapso a cajón |
| `<sw-minidoc>` | `conn` (o atributo JSON) | — | **Driver 2.** Shell de vistas: índice, operación, código |
| `<sw-minidoc-view>` | `op`, `spec`, `grupo`, `serverBase`, `authEnabled`, `docMd` | `sw-need-login` | La operación entera como página de manual |
| `<sw-minidoc-code>` | `op`, `spec`, `serverBase`, `requiereBearer` | — | Columna derecha: cURL y respuesta por código de estado |

### Los once con `#render()` a mano

`sw-app`, `sw-nav`, `sw-auth`, `sw-operation`, `sw-tag-group`, `sw-try`,
`sw-viewer`, `sw-layout`, `sw-minidoc`, `sw-minidoc-view`, `sw-minidoc-code`. Los
demás usan `crearComponente`. Cada uno de los seis debe llamar
`adoptCss(this.#root, import.meta.url)` al final de **cada** salida del render y
`precargarCss(import.meta.url)` junto al `define(...)`. Guardián:
`tests/invariantes.test.ts`.

## Composición y relaciones

```
sw-app
├── sw-nav ── sw-auth · sw-doc-actions · iswc-theme-toggle
├── sw-info
├── sw-server
└── sw-tag-group *
    └── sw-operation *
        ├── sw-method · sw-path
        └── sw-doc | sw-try | sw-responses      ← pestaña activa
            └── sw-try ── sw-params · sw-body · sw-json
```

Un asterisco marca lo que se repite por documento. `sw-operation` monta el
bloque de abajo **al abrir**, no al pintar la lista.

### Driver 2: `sw-minidoc`

```
sw-minidoc
└── sw-layout                    ← splits arrastrables + cajones en pantalla estrecha
    ├── slot cabecera ── iswc-icon · iswc-input · sw-auth · sw-doc-actions · sw-driver-switch · iswc-theme-toggle
    ├── slot inicio (índice) ── sw-method *
    ├── slot centro ── sw-minidoc-view
    │   ├── sw-method · sw-path
    │   ├── (parámetros por sitio: path, query, header, cookie)
    │   └── sw-json | sw-try (en iswc-dialog, al pulsar «Probar»)
    └── slot fin ── sw-minidoc-code
        └── sw-json  ← cURL arriba, respuesta del código activo abajo
```

Los dos drivers son alternativas completas, no modos: leen el mismo documento
con el mismo dominio y no comparten estado. `sw-app` despliega en su sitio y
sirve para barrer una API; `sw-minidoc` dedica la página a una operación y
sirve para integrarla. Ninguno registra el tag del otro, así que montar los dos
en la misma página funciona — solo duplicaría la carga del documento.

## Reusar antes de crear

Lo que estos componentes **no** deben pintar a mano, porque el kit lo trae:

| Necesidad | Tag del kit |
| --- | --- |
| Botón, menú, copiar | `<iswc-button>`, `<iswc-dropdown>`, `<iswc-copy-button>` |
| Chip / etiqueta | `<iswc-tag>` |
| Aviso, tarjeta, desplegable | `<iswc-callout>`, `<iswc-card>`, `<iswc-details>` |
| Diálogo | `<iswc-dialog>` |
| Campo, área, selector, casilla | `<iswc-input>`, `<iswc-textarea>`, `<iswc-select>`, `<iswc-checkbox>` |
| Icono | `<iswc-icon icon="mdi:…">` |
| Carga | `<iswc-spinner>`, `<is-skeleton>` |
| Notificación | `<iswc-toast>` (vía `avisar()`) |
| Fecha, bytes, número, tiempo relativo | `<iswc-format-date>`, `<iswc-format-bytes>`, `<iswc-format-number>`, `<iswc-relative-time>` |
| Tema | `<iswc-theme-toggle>` |

Dependencia interna: `_shared.ts` y nada más.

## Patrones comunes

- Un `.ts` + un `.css` **hermano**. El CSS nunca dentro del `.ts`.
- CSS anidado; `:host([attr])` top-level para estados del host.
- Reemitir sin interpretar cuando el componente no puede saber el contexto
  (`sw-tag-group` con los eventos de `sw-operation`).
- Los formatos de descarga se generan al pulsar, no al pintar el menú.

## Qué hacer

- Delegar en el `is-*` que ya existe y confirmar su API en el `.md` del módulo.
- Registrar el componente nuevo en los **cuatro** sitios: `index.html`,
  `all.ts`, `demo/manifest.js`, `demo/previews/sw-x.html`.
- Escapar toda entrada del documento.

## Qué no hacer

- Añadir un `sw-*` que solo pinte UI genérica.
- Formato de fechas, bytes o números a mano.
- Escribir la URL o el estado global desde un hijo.
- Repintar entero donde el usuario tiene el foco.
- Dejar el componente registrado en un sitio y no en los otros tres: parcial es
  un bug mudo.

## Errores conocidos y prevención

Los transversales están en [`../LLM.md`](../LLM.md). Los propios de esta capa:

- **`sw-try` repintando entero** — le quitaba el foco al campo en cada tecla.
  Por eso reparte el repintado en zonas (URL, aviso, resultado).
- **`sw-try` cuerpo `"null"` / picker MIME** — ver raíz `LLM.md` errores 17–18.
  `<iswc-file-input multiple>` sin `accept=`. No `type="file"` nativo.
- **`sw-nav` repintando con cada tecla** — la búsqueda la escribe el usuario en
  ese mismo shadow. Ignora el cambio de `query` cuando viene solo.
- **`sw-operation` montando todo al pintar la lista** — doscientos endpoints,
  doscientos `sw-try`. Monta al abrir.
- **«OpenAPI» como marca en la UI** — el visor parsea **InSoft**. `sw-info` no
  pinta badge de versión OpenAPI; `sw-export` ofrece **IS-Swagger (config)**,
  **OpenAPI 3** y **Postman** como descargas (conversión local). Guardián:
  `tests/invariantes.test.ts`.
- **Barras de pestañas a mano** (`sw-nav` secciones, `sw-operation` pestañas) —
  deuda conocida frente a `<iswc-tab-group>`, con su motivo en
  [`../../LLM.md`](../../LLM.md). No es permiso para añadir una tercera.
- **Títulos del índice minidoc en 2+ líneas** — el panel es estrecho; `.op-nombre`
  debe ser **una línea** con `overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap` (no `-webkit-line-clamp: 2`). El path debajo ya tenía
  ellipsis; el título no. Guardián visual: screenshot del panel; CSS en
  `sw-minidoc.css`.
- **Repetir el verbo HTTP en el summary** — el chip `sw-method` ya lo muestra.
  El host (PatyIA) vigila summaries/H2 sin `(GET|QUERY|…)`.

## Módulos internos

`_shared.ts` no es un componente y no se registra. Es la única dependencia
compartida de esta carpeta.

## Navegación

- Capa de pintado: [`../LLM.md`](../LLM.md)
- Índice de `src`: [`../../LLM.md`](../../LLM.md)
- Leyes del repo: [`../../../LLM.md`](../../../LLM.md)
