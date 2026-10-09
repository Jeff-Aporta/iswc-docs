# iswc-docs

Visor de APIs de InSoft en web components. Remake de
[`../is-swagger`](../is-swagger) sin React, sin MUI y sin Babel.

Documentación completa: **[`docs/index.html`](docs/index.html)**.

## Por qué el remake

`is-swagger` era React + MUI + Babel en el navegador. Portable no era: para
incrustarlo hacía falta arrastrar React, ReactDOM, MUI, Emotion y un
transpilador en runtime, y el visor no funcionaba abriendo el HTML a pelo.

Aquí el único runtime es el navegador:

| | `is-swagger` | `iswc-docs` |
|---|---|---|
| UI | React 18 + MUI 5 + Emotion | Web components vanilla + kit `is-*` por CDN |
| Transpilación | Babel **en el navegador** | esbuild en build; el navegador recibe ESM plano |
| Fuente | `.jsx` | `.ts` (solo se borran los tipos, sin bundler) |
| CSS | Emotion `sx` + un `.css` global | Un `.css` hermano por componente, adoptado en su shadow |
| Estado | Context + hooks | Un solo dueño (`docs-app`), hijos controlados |
| Distribución | 4 bundles + vendor CJS | `dist/cdn/` plano: un `.js` y un `.css` por módulo |

## Arranque

```bash
deno install
deno task build     # src/**.ts -> dist/cdn/*.js (+ *.css copiados)
deno task serve     # http://localhost:4190
```

`deno task dev` deja el build en watch. `deno task test` compila y corre `deno test`.

CDN (cuando `dist/` está en GitHub): `https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@main/dist/cdn/`.
Agentes: [`dist/cdn/LLM.md`](src/cdn/LLM.md). Tests Deno de piezas JSON: `dist/cdn/js/iss-docs-piezas.ts`.

## Cómo se le dice qué documentar

Por orden de precedencia:

1. `?conn=<base64url>`, `?spec=<url>` o `?api=<base>` — el enlace manda sobre todo.
2. `window.__DOCS_CONFIG__` — lo inyecta el host que embebe el visor.
3. `<script type="application/json" id="docs-config">` en `index.html`.

Que 1 gane sobre 2 es deliberado: un host puede fijar su API por defecto y aun
así dejar que alguien comparta un enlace a otra sin tocar nada.

```json
{
  "ns": "ISA",
  "specUrl": "./demo/openapi.sample.json",
  "apiBase": "https://host/api",
  "brand": { "title": "ISWC Docs", "subtitle": "Visor de APIs", "icon": "mdi:api" },
  "auth": { "enabled": true, "loginUrl": "https://main-orchestrator/api", "loginKind": "portal" },
  "nav": [
    { "id": "publica", "label": "Pública", "icon": "mdi:earth" },
    { "id": "admin", "label": "Admin", "tags": ["Admin"], "requiresSession": true }
  ],
  "serverSelect": true
}
```

Con `apiBase` y sin `specUrl`, el documento se busca en las rutas que el ISS ya
expone (`/system/swagger/config.json`). Se acepta el **documento InSoft**
(`kind: "config"`), un **documento IS** (`{ kind, version, viewer, spec }`) o un
OpenAPI 3 suelto — pero OpenAPI es un formato que el visor *acepta*, no lo que el
visor *es*: la palabra no sale a la interfaz.

## Estructura

```
index.html                    SPA autosuficiente (carga dist/cdn por <script type="module">)
demo/openapi.sample.json      documento de muestra: subgrupos, enum, JWT, obsoleta
scripts/build.ts             esbuild -> dist/cdn plano
src/
  css/app.css                 canvas y light DOM (lo que no cabe en un shadow)
  js/                         dominio puro, sin DOM
  components/docs/              componentes del visor: <tag>.ts + <tag>.css
  types/docs.d.ts          tipos ambiente
docs/                         sitio documental (no se compila)
  index.html                  shell: barra + índice + iframe
  paginas/                    prosa: por qué, stack, arquitectura, estrategias
  previews/                   una página por `docs-*`, con casos en vivo
  video/                      (reservado; hero → YouTube unlisted)
dist/cdn/                     artefacto publicado: todo plano y hermano
  LLM.md, js/*.d.ts, types/     contrato para agentes y tests Deno
tests/                        deno test contra dist/cdn
```

Las carpetas están separadas a propósito, igual que en
[`is-tkts/app`](../is-tkts/app): `js/` es lo que se puede probar sin navegador,
`components/` es lo que pinta, y `docs/` es cómo se lee y se mira.

## El contrato del CSS

Cada componente tiene su `.css` **hermano**, nunca CSS dentro del `.ts`:

```
src/components/docs/docs-operation.ts
src/components/docs/docs-operation.css
        ↓ build
dist/cdn/docs-operation.js
dist/cdn/docs-operation.css
```

`adoptCss(shadow, import.meta.url)` deriva la hoja del módulo y la enlaza en el
ShadowRoot — el mismo contrato que `IsUi.adoptCss` del kit. Se llama **después**
de rellenar el shadow, porque vaciarlo se lleva el `<link>`.

Esto corrige el error de `is-tkts`, donde el CSS vivía en constantes del `.ts`:
así no se puede minificar aparte, no se cachea aparte y ninguna herramienta de
CSS lo ve. `tests/estructura.test.ts` falla si vuelve a aparecer.

## Componentes

| Tag | Qué hace |
|---|---|
| `docs-app` | Shell y **único dueño del estado** |
| `docs-nav` | Marca, secciones, búsqueda, descargas, sesión, tema |
| `docs-info` | Título, versión y descripción del documento |
| `docs-server` | Host contra el que se prueba |
| `docs-tag-group` | Un tag con sus operaciones (y subgrupos) |
| `docs-operation` | Tarjeta desplegable con pestañas Probar / Respuestas / Doc |
| `docs-try` | Arma la petición, la ejecuta y enseña la respuesta |
| `docs-params` · `docs-body` | Campos y editor JSON (controlados) |
| `docs-responses` | Respuestas declaradas en el documento |
| `docs-auth` | Login JWT y pegado de token |
| `docs-export` | Documento JSON, colección Postman y paquete IS |
| `docs-method` · `docs-path` · `docs-json` · `docs-doc` | Átomos |

Sitio documental: `docs/index.html`.

## Extensiones `x-*` que se respetan

| Extensión | Dónde | Efecto |
|---|---|---|
| `x-isa-subgroups` | tag | Declara y **ordena** las subcarpetas |
| `x-isa-subgroup` | operación | La mete en una de ellas |
| `x-iss-doc-md` | operación | Markdown de la pestaña «Doc» |
| `x-iss-request-body` | operación | Ejemplo del cuerpo |
| `x-iss-request-body-examples` | operación | Varios ejemplos con nombre |

## Estado en la URL

`?tab=<sección>&op=<operationId>&opt=<try|examples|doc>&server=<base>`

Parámetros planos y editables a mano, no un blob codificado. Las escrituras usan
`replaceState`: desplegar una tarjeta no debe llenar el historial.

MIT · [Jeff-Aporta](https://github.com/Jeff-Aporta)
