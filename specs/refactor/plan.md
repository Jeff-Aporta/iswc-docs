# Refactor isc-swagger → iswc-docs — auditoría, destilado y plan

Fecha: 2026-10-08. Estado: **plan, sin código tocado**. Referencias: `ISW-TestPatyIA` (estructura objetivo),
`is-webcomponents` (kit, tools vendorizadas, schema de previews).

---

## 1. Auditoría — estado real hoy

### 1.1 Cifras

| Qué | Valor |
|---|---|
| Fuente | `src/` 11 208 líneas: 30 módulos de dominio (`src/js`), 26 tags `sw-*` (`.ts` + `.css` hermano) |
| Tests | 19 archivos `tests/*.test.ts` (3 061 líneas), `node --test` contra `dist/cdn/` |
| Línea base tests (dist actual, sin rebuild) | **207: 200 verdes · 5 rojos · 2 saltados** |
| Typecheck (`tsc --noEmit`) | **232 errores, todos en `tests/`** (`src/`, `docs/`, `scripts/` en 0) |
| Runtime | Node 22 + npm (`package.json`, `package-lock.json`, `esbuild`, `typescript`, `jsdom`) |
| Zod | **No existe.** Validación a mano (`assertIssSwagger*` devuelve `string[]`) y tipos ambiente en `src/types/swagger.d.ts` |
| Git | `main` = `origin/main`; **129 archivos sin commit** (WIP del 2-oct: migración `is-*` → `iswc-*` y pin del kit `3c722aca`) |
| Mojibake | 16 archivos con `Ã©`/`Â·` (ya en `HEAD`, p. ej. `docs/previews/*.html`) |

### 1.2 Los 5 rojos de la línea base

Todos vienen del WIP `is-*` → `iswc-*` a medias: los tests aún vigilan la forma vieja.

| Test | Motivo |
|---|---|
| `app.test.ts:176` | busca `is-code` en `kit-tags.ts` (ya es `iswc-code`) |
| `cdn.test.ts:26` | interfaces de piezas JSON en el CDN |
| `docs.test.ts:119` | `src/LLM.md` ya no documenta la deuda de pestañas |
| `docs.test.ts:137` | tabla de testing del `LLM.md` desalineada |
| `postman-md.test.ts:39` | pipeline de conversión exportado |

Regla aplicable: se actualiza el test a su intención, no se resucita lo viejo.

### 1.3 Consumidores vivos (lo que el renombre rompe)

| Consumidor | Cómo referencia | Riesgo |
|---|---|---|
| `ISW-TestPatyIA/src/consts/json/_api.json` (+ `_entregable`) | `docViewerCdn: …/isc-swagger@62253f41…` | jsDelivr por nombre de repo viejo |
| `Muéstralo/api/vendor-cdn.ts`, `scripts/vendor-cdn.ts` | `isc-swagger@main/…/iss-swagger-md.js` | **ref mutable** + nombre viejo |
| `Muéstralo/api/src/index.ts:272` | redirige a `jeff-aporta.github.io/isc-swagger/` | GitHub Pages **no redirige** al renombrar |
| `Muéstralo/api/src/utils/system/docs/docs__*.json` | ya usa nombre `docs__*` | `docs__general.json` trae `kind:"config"` v2 (debería ser `general`): drift que hoy nadie detecta |
| `RAG/cache/*` | índices por ruta | reindexar tras mover la carpeta |
| `WT/refactor-*-pojo` | vestigios archivados | ninguno |

### 1.4 Hallazgos

| # | Hallazgo | Severidad |
|---|---|---|
| H1 | Tres formatos de entrada (OpenAPI 3, «documento IS» `insoft.swagger-viewer`, InSoft `kind:"config"`) + 4 piezas `swagger__*.json`, sin un esquema único: cada parser decide a mano qué acepta | Alta |
| H2 | Errores del documento se tragan (`catch {}` → `{}`); un JSON mal formado pinta vacío en vez de explicar qué falla | Alta |
| H3 | Registrar un componente exige 4 sitios a mano (`index.html`, `all.ts`, `docs/manifest.js`, su página) | Media |
| H4 | `@main` recomendado en el contrato público `src/cdn/LLM.md`; pines del kit heterogéneos entre `index.html`, `docs/previews/*` y WIP | Alta |
| H5 | `tk-diagrama2mmd`, `tk-diagrama2webcomponents`, `tk-json2mmd` con `@ts-nocheck` (portados literal) | Media |
| H6 | `markdown.ts` propio frente a `iswc-md-render` del kit (deuda no documentada en la tabla de deuda) | Media |
| H7 | Previews en `docs/previews/*.html` con JS a mano (`preview-kit`), fuera del formato `iswc-preview/v1` que usan iswc e ISW | Media |
| H8 | Sin e2e de navegador: todo es jsdom; «Probar», login, deep links y drivers no se prueban en un navegador real | Alta |
| H9 | Sin cooldown, sin gate único, sin guardián de pines | Media |
| H10 | 232 errores de tipo en tests: fixtures que no casan con tipos ambiente demasiado estrechos | Media |
| H11 | Sin modelo de medios: no hay dónde poner una imagen o un audio base64 en el documento | Alta (bloquea el editor) |

### 1.5 Lo que hay que conservar (vale y está probado)

- Dominio puro sin DOM en `src/js`, pintado en componentes; `sw-app` único dueño del estado; hijos emiten.
- `adoptedStyleSheets` cacheadas + `hojas.ts`/`boot.ts` como scripts planos síncronos en `<head>` (anti-flicker).
- Dos drivers (`sw-app` clásico, `sw-minidoc` por vistas) intercambiables por `sw-viewer`, estado compartido por URL.
- `?s=` base64url como bolsa de estado; `?conn=` gana sobre el demo; geometría persistida que caduca por build.
- Precedencia de carga del documento (`doc` > `conn.spec` > `paths.docs` > `?spec=`).
- Export a OpenAPI / Postman / IS, `LLM.md` generado desde el documento.

### 1.6 Lo que de ISW **no** se copia (defectos del modelo)

- `deno.json` de ISW importa `@iswc/component-schemas` desde `raw.githubusercontent…/main` → ref mutable. Aquí va por SHA.
- `view/*/stagehand/*.test.ts` de ISW son esqueletos que hacen `t.skip`. Aquí los e2e son reales y sin «verdes vacíos» (patrón `crearTestE2E` del harness de ISW).
- `compilerOptions.strict: false` en ISW. Aquí `strict: true`.
- Basura en raíz (`0)`, `mensajes`, `modelo`, `.backup/`). Aquí no.

---

## 2. Destilado — qué es iswc-docs (WHAT)

**iswc-docs** es un visor (y pronto editor) de documentación de APIs InSoft en web components sobre el kit iswc.
Recibe **un documento**, lo **valida con Zod** y lo pinta en uno de dos drivers, permitiendo probar cada operación
contra el servidor real.

| Capacidad | Garantía |
|---|---|
| D1 Documento | Un solo esquema Zod (`DocsDocumento`) describe todo lo que el visor acepta; los demás formatos se normalizan a él |
| D2 Diagnóstico | Todo documento produce `{ ok, datos, errores[], advertencias[] }` con ruta JSON (`paths./x.get.summary`); errores bloquean y se muestran, advertencias se muestran y no bloquean |
| D3 Compatibilidad | Nombres `swagger`/legado se aceptan con advertencia de deprecación, nunca en silencio |
| D4 Visor | Dos drivers, misma fuente, conmutables sin perder posición |
| D5 Probar | Ejecuta la petición real con sesión, cuerpo, adjuntos; errores HTTP legibles |
| D6 Estado | Un enlace reabre exactamente la misma vista |
| D7 Medios | Imágenes y audios en base64 viven en el documento (`media`), se referencian desde markdown y se pintan con el kit |
| D8 Exportación | OpenAPI 3, Postman, documento iswc-docs, `LLM.md` |
| D9 Publicación | CDN por SHA de 40 hex, tipos `.d.ts` y JSON Schema publicados para hosts y editores |

---

## 3. Nomenclatura `swagger` → `docs`

| Antes | Después | Legado |
|---|---|---|
| repo `Jeff-Aporta/isc-swagger`, carpeta `Personal/apps/isc-swagger` | `Jeff-Aporta/iswc-docs`, `Personal/apps/iswc-docs` | — |
| tags `sw-*` (26) | `docs-*` (`docs-viewer`, `docs-app`, `docs-minidoc`, …) | — |
| eventos `sw-op-toggle`, `sw-search`, … | `docs-op-toggle`, `docs-search`, … | — |
| `SW_KIT_TAGS` | `DOCS_KIT_TAGS` + `VIEW_TAGS` | — |
| `src/types/swagger.d.ts` (ambiente) | `z.infer<>` desde `src/js/consts/schemas/*.schemas.ts` | — |
| `iss-swagger-doc.ts` / `assertIssSwagger*` | `documento.schemas.ts` + `validarDocumento()` | re-export con `@deprecated` un ciclo |
| `iss-swagger-md.ts` / `issSwaggerToMarkdown` | `docs-md.ts` / `docsToMarkdown` | idem |
| piezas `swagger__{meta,paths,config,general}.json` | `docs__*.json` (como ya hace Muéstralo) | aceptadas + advertencia |
| `kind: "insoft.swagger-viewer"` | `kind: "iswc.docs"` | aceptado + advertencia |
| `viewer.app: "swagger-viewer"` | `"docs-viewer"` | idem |
| `window.__SWAGGER_CONFIG__`, `<script id="sw-config">` | `__DOCS_CONFIG__`, `id="docs-config"` | leídos + advertencia |
| `__SW_BUILD__`, claves `sw:driver`, `sw:split:*` | `__DOCS_BUILD__`, `docs:*` | `sw:driver` se migra una vez |
| marca «IS-Swagger» | «ISWC Docs» | — |
| extensiones `x-iss-*`, `x-isa-*` | **se conservan**: son contrato del ISS, no nombre de producto | — |

---

## 4. Estructura objetivo (espejo de ISW)

```
iswc-docs/
├── AGENTS.md · CLAUDE.md · README.md
├── deno.json · deno.lock                    ← sin package.json / npm
├── index.html                               ← app standalone (<docs-viewer>)
├── src/
│   ├── js/
│   │   ├── base/            zod.ts · props-registro.ts · _shared.ts (html, esc, adoptCss, define)
│   │   ├── consts/schemas/  documento · media · config · conn · estado · componentes · export · docs-loader  (*.schemas.ts)
│   │   ├── dominio/         openapi · insoft-config · is-document · nav · param-schema · curl · http-error ·
│   │   │                    tryit-body · tryit-attach · export · postman-md · docs-md · diagramas/
│   │   ├── core/            config · conn · json-cache · url-state · search-state · prefs · driver ·
│   │   │                    server-base · auth · login-providers · api-fetch · version
│   │   ├── components/docs/ transversales: docs-viewer · docs-driver-switch · docs-layout · átomos
│   │   │                    (docs-method/path/json/doc/media) · docs-try · docs-auth · docs-diagnostico
│   │   ├── kit-tags.ts      DOCS_KIT_TAGS (iswc-*) + DOCS_TAGS + VIEW_TAGS  ← única lista
│   │   ├── docs-loader.ts   registerApp(tag → ruta) con guardia de prefijo docs-
│   │   └── boot.ts · hojas.ts   (scripts planos)
│   ├── styles/  · cdn/LLM.md (contrato público)
│   ├── utils/   build.ts · build-scss
│   └── vendor/is-webcomponents/{tools,build}   ← vendorizado por SHA, no se edita
├── view/
│   ├── app/       driver clásico: docs-app · docs-tag-group · docs-operation · docs-params · docs-body ·
│   │              docs-responses · docs-nav · docs-info · docs-server · docs-export · docs-doc-actions · docs-doc-reload
│   ├── minidoc/   docs-minidoc · docs-minidoc-view · docs-minidoc-code
│   ├── home/      docs-home (portada desde `general`)
│   ├── guia/      prosa de hoy (inicio, porqué, comparativa, stack, arquitectura, estrategias, empezar)
│   ├── editor/    reservado (README + schema de medios ya listo; sin componentes aún)
│   └── demo/      galería iswc-preview/v1: index.html + manifest.json
│   cada vista:  index.html · README.md · components/{all.ts,_shared.ts,<tag>.{ts,scss,json,md}} ·
│                demo/ · utils/ · tests/ · stagehand/
├── demo/          fixtures de documento (openapi, insoft-config, iswc.docs con medios, uno roto a propósito)
├── specs/         README · constitution · constraints · flujo-sdd · arquitectura · kit · pines · testing ·
│                  documento/ · visor/ · probar/ · estado/ · medios/ · exportacion/ · lessons · plantillas/
├── tests/         health transversales + e2e/{run.ts, lib/}
├── scripts/       run-test-all · gate-cooldown · test-health · vendor-iswc-tools · mirror-guardian
└── dist/cdn/      artefactos trackeados (lo que sirve jsDelivr)
```

`docs/` desaparece como carpeta (chocaría con el nombre del repo): sus páginas pasan a `view/guia/` y sus
previews a JSON `iswc-preview/v1` por componente.

### Registro de componentes (sustituye «4 sitios a mano»)

1. El componente existe como `<tag>.ts` + `<tag>.scss` + `<tag>.json` (preview) + `<tag>.md` (con `## Anatomía`).
2. Se declara **una vez** en `kit-tags.ts` (`DOCS_TAGS` o `VIEW_TAGS.<vista>`).
3. `docs-loader.ts` deriva tag → ruta, pega `?h=` del `asset-hashes.json` y llama `L.registerApp(...)` del loader iswc.
4. Sus props se registran con su schema Zod en `props-registro.ts` (aviso por consola de claves no declaradas).
5. El build genera `view/demo/manifest.json` desde lo anterior; ningún HTML lista tags.

Guardián `tests/registro.test.ts`: cada `.ts` de componente está en `kit-tags`, tiene sus 4 hermanos, su schema de
props y su entrada en el manifest; y al revés, nada declarado sin archivo.

---

## 5. Zod — el documento tipado

Una sola fuente (`src/js/consts/schemas/documento.schemas.ts`); los tipos salen con `z.infer<>`, se borra `swagger.d.ts`.

```
DocsDocumento = {
  kind: "iswc.docs", version: 1,
  info: { title, description?, version? },
  viewer?: DocsViewer,               // brand, nav, auth, exports, tema, general
  general?: DocsGeneral,             // portada: titulo, resumen, secciones[{ id, titulo, icono?, markdown }]
  tags?: DocsTag[],                  // + x-isa-subgroups
  paths: Record<"/…", Partial<Record<Metodo, DocsOperacion>>>,
  catalog?: { schemas, payloads, requestBodies, docs, lookups, listFilters, … },
  media?: Record<id, DocsMedia>,     // nuevo
}
DocsMedia = { tipo: "imagen" | "audio", mime, datos /* base64 */, alt?, titulo?, bytes? }
```

| Regla | Severidad |
|---|---|
| `kind`/`version` desconocidos, `paths` ausente, op sin `summary`, método fuera de `get…query…head`, ruta sin `/` | error |
| `op.doc` sin `catalog.docs[id]`, `$ref` a `#/catalog/schemas/x` inexistente, `media:id` referenciado y ausente | error |
| `media.datos` no es base64 válido, `mime` no casa con `tipo`, tamaño > umbral | error / advertencia (umbral) |
| claves no declaradas (`.passthrough()` + listado), nombres legado `swagger*`, pieza `general` con `kind:"config"` | advertencia |
| imagen sin `alt` | advertencia (accesibilidad) |

Salidas:
- **Runtime**: `validarDocumento(doc)` → `{ ok, datos, errores, advertencias }`; el visor pinta `<docs-diagnostico>`
  (errores bloquean con explicación; advertencias en un callout plegable) y las repite en consola.
- **Hosts Deno**: mismo módulo publicado en `dist/cdn/js/…schemas.{js,d.ts,ts}` (sustituye `assertIssSwaggerPiezas`).
- **Editores/IDE**: `dist/cdn/schemas/iswc-docs.schema.json` generado con `z.toJSONSchema` para `"$schema"`.
- **Normalizadores**: OpenAPI 3 e InSoft `kind:"config"` se convierten a `DocsDocumento` y luego pasan por el mismo `validarDocumento`.

Zod también en: `conn` (`?conn=`), bolsa `?s=`, prefs de `localStorage`, config embebida, respuestas de login,
props de cada componente. Nada de `as` sobre JSON externo: se parsea.

Medios en markdown: `![alt](media:logo)` → `iswc-theme-img`/`img` con data URL; `[audio](media:nota)` → reproductor del kit
(`media/`). El editor futuro solo escribe en `media` y en el markdown: el visor ya sabe pintarlo.

---

## 6. Testing orientado a WHAT

- Cada `specs/<dominio>/spec.md` sigue la plantilla iswc: requerimientos `S-<DOM><n>` en presente, tabla de
  contratos, tabla de aceptación que cita el test.
- Cada test se llama por su requerimiento: `test('DOC2 — op sin summary es error con ruta paths./x.get.summary', …)`.
- Guardián meta `tests/specs-what.test.ts`: todo `S-*` tiene al menos un test que lo cite y todo test cita un `S-*` existente.
- Tres capas:

| Capa | Dónde | Runner |
|---|---|---|
| health transversal | `tests/*.test.ts` | `deno test` (node:test), contra `dist/cdn/` como caja negra |
| health por vista | `view/<v>/tests/*.test.ts` | idem |
| e2e navegador | `view/<v>/stagehand/*.test.ts` + `tests/e2e/lib/harness.ts` | Stagehand 4.1 `localBrowser`, autoservidor 8851+, mock de API |

E2E previstos (reales, sin verdes vacíos):

| Vista | Casos |
|---|---|
| app | carga doc InSoft quemado; pestañas; abrir op; deep link `?s=` reabre; búsqueda ignora pestaña; marca = reset |
| minidoc | índice; una op por página; cURL; «Probar» en diálogo |
| probar | 200 y 400 con cuerpo; 401 → login → reintento; adjuntos; cuerpo vacío `{ }` |
| home | portada desde `general`; imagen y audio base64 pintados |
| viewer | cambio de driver conserva la op; geometría caduca por build |
| diagnóstico | documento roto muestra errores con ruta; legado muestra advertencias |
| demo | cada preview de la galería monta sin errores de consola |

Gate `deno task test:all` (como ISW): guardian (pines) → build (cooldown por huella) → test:health (cooldown por test)
→ test:e2e (cooldown por archivo), x360 vendorizado; `--halt` corta en el primer rojo; `TEST_COOLDOWN=0` solo diagnóstico.

---

## 7. Pines congelados

- Un solo SHA de 40 hex del kit iswc en todo HTML/TS (`index.html`, `view/**`, previews). Nunca `@main`/`@latest`/Pages.
- `deno task pin` (pin-update.mjs vendorizado): inventario, exit 1 si heterogéneo o mutable;
  `deno task pin --nuevo=<sha|ultimo>` verifica en jsDelivr y reemplaza en lote.
- `deno task vendor:iswc`: re-vendoriza `test-cooldown`, `test-queue`, `deno-test`, `pin-update` al mismo SHA.
- Schema de previews (`component.schemas.ts`) importado por SHA, no por `raw…/main`.
- Guardián `tests/pines.test.ts`: homogéneo, sin refs mutables, sin `?h=` en HTML local.
- El contrato público (`src/cdn/LLM.md`) enseña a los hosts a pinear `iswc-docs@<sha40>`.

---

## 8. Fases

Cada fase cierra con su gate en verde y su commit. Nada se publica (push) sin pedirlo.

| Fase | Contenido | Cierra cuando |
|---|---|---|
| F0 Línea base | Decidir el WIP de 129 archivos; registrar baseline (200/5/2, 232 tsc) | WIP commiteado o descartado por decisión explícita |
| F1 Deno | `deno.json` (npm:esbuild, npm:zod 4, npm:jsdom, npm:sass, npm:@browserbasehq/stagehand 4.1), build y tests bajo Deno, fuera npm | mismos 207 tests corren con `deno test`; `deno check` |
| F2 Vendor + pines | `vendor:iswc`, `pin`, un SHA del kit, guardián de pines | `deno task pin` exit 0 |
| F3 Zod | schemas de §5, `validarDocumento`, normalizadores, `docs-diagnostico`, JSON Schema, props-registro; borrar `swagger.d.ts`; typecheck 0 | 0 errores de tipo; fixtures (incl. Muéstralo) diagnosticados |
| F4 Renombre interno | tabla §3 dentro del código (tags, eventos, claves, globals) con legado + advertencias | ningún `sw-`/`swagger` salvo capa legado (guardián) |
| F5 Estructura | `view/` + `src/js/{base,core,dominio,components/docs}`, SCSS anidado, `kit-tags` + `docs-loader` + `registerApp` | guardián de registro verde |
| F6 Demos | `.json` iswc-preview/v1 + `.md` con Anatomía por componente; galería `view/demo`; `docs/` → `view/guia` | cada tag en la galería; previews validan contra el schema del kit |
| F7 Specs WHAT | specs de §6 y reescritura de tests por requerimiento; meta-guardián | cada `S-*` con test y viceversa |
| F8 E2E Stagehand | harness, autoservidor, mock API, casos de §6; gate `test:all` con cooldown | `deno task test:all` verde |
| F9 Medios | `media` en schema, render imagen/audio, fixture con base64, `view/editor/README.md` | e2e home de medios verde |
| F10 Limpieza | mojibake (16), `tk-*` tipados o movidos, decisión `markdown.ts` vs `iswc-md-render`, AGENTS/CLAUDE/README | auditor sin rojos |
| F11 Renombre externo | carpeta, `gh repo rename`, remote, Pages, consumidores (ISW `_api.json`, Muéstralo), RAG | consumidores apuntan a `iswc-docs@<sha40>` y cargan |

F11 va al final a propósito: renombrar al inicio rompe consumidores mientras el código aún no es estable.
Alternativa si se prefiere: renombrar carpeta/repo en F0 y migrar consumidores en F11.

---

## 9. Decisiones

Tomadas por Jeff (2026-10-08):

1. WIP sin commit → **commit local de línea base** (sin push).
2. Prefijo de tags → **`docs-*`**.
3. Renombre externo → **al final (F11)**, y en el mismo paso **se actualizan los consumidores** (ISW `_api.json`, Muéstralo) a `iswc-docs@<sha40>`.
4. Stagehand → **determinista en el gate** (locators sobre shadow DOM); `act/extract` con modelo solo fuera del gate.

Abiertas (se deciden en su fase, con propuesta):

5. `markdown.ts` propio vs `iswc-md-render` del kit; `tk-*` aquí o en el kit (`diagrams`) — F10.
6. `all.min.js` como bundle de compatibilidad durante la transición (propuesta: sí) o solo loader — F5.
