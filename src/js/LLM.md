# `js` para LLM

## Propósito

Dominio del visor. **Sin DOM.** Es lo que se prueba sin navegador y lo que
decide *qué* se ve; el *cómo* vive en [`../components/`](../components/LLM.md).

La única excepción son los dos archivos en JavaScript plano (`boot.js`,
`hojas.js`), que sí tocan el documento porque corren antes de que exista ningún
módulo. Están al final de esta página.

## Qué módulo elegir

| Módulo | Responsabilidad |
| --- | --- |
| `config.ts` | De dónde sale el documento y cómo se carga. `resolveBootConfig`, `loadViewerDocument` |
| `conn.ts` | `?conn=<base64url>` — autoconexión ISS |
| `insoft-config.ts` | Traduce el formato InSoft (`kind:"config"`) a lo que el visor lee |
| `openapi.ts` | Agrupa por tag, ordena, resuelve `$ref`, deduce seguridad. `METHOD_COLOR` |
| `is-document.ts` | Forma normalizada del documento |
| `nav.ts` | Pestañas visibles, filtro por tab y por query, conteo |
| `url-state.ts` | Navegación `op`/`tab`/`opt` dentro de `?s=`. Suscripción al «atrás» |
| `search-state.ts` | `?s=` — bolsa base64url (tema, paleta, query, navegación) |
| `server-base.ts` | Base del servidor: opciones, `?server=`, deducción |
| `auth.ts` | Sesión JWT, credenciales guardadas, `wrapPassword` |
| `api-fetch.ts` | Ejecuta la petición del «Probar» |
| `http-error.ts` | Traduce fallos de red y HTTP a mensaje de usuario |
| `param-schema.ts` | Del `schema` de un parámetro al tipo de campo |
| `tryit-body.ts` | Si la operación lleva cuerpo y con qué ejemplo |
| `tryit-attach.ts` | Adjuntos del «Probar»: cuándo mostrar el picker y cómo empaquetarlos |
| `markdown.ts` | Markdown → HTML **ya escapado** |
| `export.ts` | Documento JSON, colección Postman, formato IS |
| `postman-md.ts` | MD InSoft → Postman: diagramas→PNG, `iswc-code`→fences |
| `iss-docs-piezas.ts` | Forma y asserts de piezas `docs__*.json`. CDN: `dist/cdn/js/iss-docs-piezas.{js,d.ts,ts}` |
| `iss-docs-md.ts` | JSON → Markdown agentes. CDN: `js/iss-docs-md.js` y `js/iss-docs-md.min.js` |
| `json-cache.ts` | Cache 24 h de config/spec; `clearJsonCache` + `force` para el botón actualizar |

## Reusar antes de crear

- Formato de fechas, bytes y números: **no se escribe aquí**. El kit trae
  `<iswc-format-date>`, `<iswc-format-bytes>`, `<iswc-format-number>` y
  `<iswc-relative-time>`. Ver [`../LLM.md`](../LLM.md).
- Nada de este directorio debe importar de `../components/`. La flecha va en un
  solo sentido.

## Patrones comunes

- Funciones puras que reciben el documento y devuelven datos. Sin estado de
  módulo salvo constantes.
- Lo que puede fallar devuelve un error con **la URL que falló** dentro: el
  visor lo enseña en pantalla, no en la consola.
- `search-state` y `url-state` son los únicos que tocan `location`, y solo los
  llama `docs-app`.

## Qué hacer

- Escribir el caso nuevo como función pura y probarlo en `tests/*.test.ts`
  contra `dist/cdn/`.
- Mantener el documento InSoft como entrada **no confiable**: nada de asumir
  que un campo existe o tiene el tipo declarado.
- `?conn=` gana sobre el `<script id="docs-config">` y sobre `?spec=`/`?api=`.

## Qué no hacer

- Tocar el DOM desde aquí. Si hace falta el DOM, el sitio es `../components/`.
- Emitir `spec.openapi`: el visor parsea InSoft, y ese campo sería residual.
- Dejar `auth.enabled: false` cuando el visor trae `viewer.auth.enabled: true`.
- Escribir la URL fuera de `url-state.ts` / `search-state.ts`.
- Pintar `"null"` en el editor de cuerpo: `formatBodyExample` de ausencia → `{ }`.
- Poner `accept=` en el picker de try-it, o mostrarlo en un QUERY de listado.

## Errores conocidos y prevención

1. **`?conn=` ignorado por el `specUrl` del `<script>`** — el visor caía al demo
   local y el usuario veía otra API. Fix: `resolveBootConfig` hace
   `delete config.specUrl` cuando hay conn. Guardián: `tests/conn.test.ts`,
   `tests/invariantes.test.ts`.
2. **`auth.enabled: false` con `viewer.auth.enabled: true`** — sin `loginUrl`,
   `resolveAuthConfig` desactivaba la sesión y no había forma de entrar. Fix:
   `DEFAULT_AUTH_LOGIN_URL` en `insoft-config.ts`.
3. **Búsqueda escondida por la pestaña activa** — con query, `filterGroupsByNavTab`
   se salta: el usuario tecleó algo y no quiere que la nav se lo esconda.
4. **`prefers-color-scheme`** — no se usa. El tema es explícito para que un
   enlace compartido se vea igual en cualquier equipo.
5. **Cuerpo try-it `"null"`** — `$ref` sin example. `tryit-body.ts`. Tests:
   `dominio.test.ts`.
6. **FileReader en Node** — polyfill con `arrayBuffer` + `btoa`, no FileReader.

## Los dos archivos en JavaScript plano

No son módulos: son `<script>` clásicos, síncronos, en el `<head>`, **antes**
del kit y de todo `type="module"`. Si llegaran después, el trabajo que hacen ya
no serviría de nada. El build los copia tal cual a `dist/cdn/`.

| Archivo | Qué hace | Si llega tarde |
| --- | --- | --- |
| `boot.js` | Tema y paleta en `<html>` desde `?s=` → localStorage → dark | Flash claro en cada carga |
| `hojas.js` | Caché de `CSSStyleSheet` construidas, compartida por todos los shadow roots | Flicker al cambiar de sección |

`hojas.js` envuelve `ShadowRoot.prototype.prepend` porque los `is-*` del CDN
enlazan su CSS con `<link>` y no se puede tocar su fuente. La **primera**
aparición de cada href se deja pasar tal cual —así ningún componente puede
quedarse sin estilos por esa capa— y a partir de la segunda adopta la hoja ya
construida. Publica el caché en `globalThis.__docsHojas`, que `_shared.ts` reusa.

Guardián: `tests/hojas.test.ts`.

## Navegación

- Índice de `src`: [`../LLM.md`](../LLM.md)
- Pintado: [`../components/LLM.md`](../components/LLM.md)
- Leyes del repo: [`../../LLM.md`](../../LLM.md)
