# iswc-docs — contexto rápido para agentes

Visor de APIs InSoft en web components (`docs-*` + kit `is-*`). Sin React, sin MUI, sin Babel.

Este archivo es el contrato **público** (CDN). El `LLM.md` de la raíz del repo es para quien edita el visor.

CDN (siempre por SHA de 40 hex publicado; nunca `@main`):

```
https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@<sha40>/dist/cdn/
```

| Recurso | URL relativa al CDN |
|---|---|
| Este markdown | `LLM.md` |
| Visor (bundle) | `all.min.js` |
| Tags `is-*` que carga el visor | `js/kit-tags.js` |
| Tipos + asserts de piezas JSON | `js/iss-docs-piezas.js` · `.d.ts` · `.ts` |
| JSON → markdown de una API | `js/iss-docs-md.js` (módulos hermanos) o `js/iss-docs-md.min.js` (un solo ESM) |
| Tipos ambiente del visor | `types/docs.d.ts` |

## 1. Piezas JSON (`docs__*.json`)

Un host no publica OpenAPI como contrato: publica piezas con `kind` distinto. **No mezclar kinds.**

| `kind` | Fichero típico | Qué lleva |
|---|---|---|
| `meta` | `docs__meta.json` | `info.title`, visor, nav, tags |
| `paths` | `docs__paths.json` | `paths` (operaciones). `kind` **no** es `"config"` |
| `config` | `docs__config.json` | `catalog` (docs, schemas, payloads). **Sin** `paths`. Docs en `catalog.docs`, no en la raíz |
| `general` | `docs__general.json` | Portada: `titulo`, `resumen`, `secciones` |

El host entrega el documento **unido** (meta+paths+catalog) de dos formas:

1. **Quemado** en `conn.spec` (preferido en ISS / PatyIA).
2. **Un GET** a `paths.docs` (default `/docs?v=json`), solo si no hay `spec` quemado.

No existe `GET …/system/swagger/config.json` ni piezas sueltas por red.

Métodos de operación: `get` `post` `put` `patch` `delete` `query` `options` `head`. Cada op necesita `summary`. Si `op.doc` existe, debe haber `catalog.docs[id]`.

## 2. Consistencia en Deno (no reescribir el shape)

```ts
import {
  assertIssDocsPiezas,
  type IssDocsPiezas,
  type IssDocsMetaFile,
  type IssDocsPathsFile,
  type IssDocsCatalogFile,
  type IssDocsGeneralFile,
} from "https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@<sha40>/dist/cdn/js/iss-docs-piezas.ts";

const errs = assertIssDocsPiezas({ meta, paths, config, general });
if (errs.length) throw new Error(errs.join("\n"));
```

Wrangler no resuelve `https:`: pin el `.js` (o el `.min.js` del convertidor) en `vendor/` y alias.

Tipos del visor (spec interna, no las piezas): `dist/cdn/types/docs.d.ts`.

## 3. Markdown para que un LLM controle *tu* API

No sirvas un `.md` escrito a mano. Genera:

```ts
import { issDocsToMarkdown, buildIssDocsLlmViewHtml } from
  "https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@<sha40>/dist/cdn/js/iss-docs-md.min.js";

const md = issDocsToMarkdown({ meta, paths, config, general });
```

`GET /LLM.md` = ese string. `GET /LLM.view` = `buildIssDocsLlmViewHtml({ kitCdn, llmMdHref: "/LLM.md" })`.

## 4. Embeber el visor

```html
<script type="module">
  import { ISWebComponentsLoader as L } from
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13/dist/cdn/loader.min.js";
  import { DOCS_KIT_TAGS } from
    "https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@<sha40>/dist/cdn/js/kit-tags.js";
  await L.load(...DOCS_KIT_TAGS);
</script>
<script type="module" src="https://cdn.jsdelivr.net/gh/Jeff-Aporta/iswc-docs@<sha40>/dist/cdn/all.min.js"></script>
```

Lista de tags: solo `js/kit-tags.js`. No duplicarla en el host (sin el tag, el custom element no hace upgrade y no hay error en consola).

`conn.spec` (JSON quemado) gana sobre cualquier fetch. Sin `spec`, el visor pide `paths.docs` (default `/docs?v=json`). Documento InSoft (`kind:"config"`) pasa por `parseInsoftConfig`; no asumas OpenAPI en la UI.

## 5. Leyes cortas

- CSS del visor: hoja **hermana** del componente, no constantes en el `.ts`.
- Reusar `is-*` del kit. Los `docs-*` solo traducen datos del documento al kit.
- Listados de APIs InSoft: HTTP **QUERY** + JSON en el body (`sqlFiltering`), nunca `GET ?q=`.
- Tras cambiar CSS/JS del visor: rebuild, push a `main`, y el host bumpea el pin SHA si no usa `@main`.
