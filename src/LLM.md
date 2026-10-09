# `src` para LLM — iswc-docs

Índice de las fuentes del visor. **Punto de entrada para cualquier agente que
vaya a tocar este proyecto.** Las leyes del repo y la historia de errores viven
en la raíz: [`../LLM.md`](../LLM.md). Lo que rompa cualquiera de los dos se
revierte.

## Qué es esto

Un visor de documentación de APIs en web components sin framework. Lee un
documento **formato InSoft** (`{kind:"config", …}`) o una spec OpenAPI 3, y
pinta navegación, tarjetas por operación y un «Probar» que ejecuta la petición
de verdad.

No hay React, ni MUI, ni Babel, ni bundler. TypeScript → módulos ES planos.

## Mapa

| Carpeta | Documento | Qué vive ahí |
| --- | --- | --- |
| `js/` | [js/LLM.md](js/LLM.md) | Dominio puro: sin DOM. Lo que decide **qué** se ve |
| `components/` | [components/LLM.md](components/LLM.md) | Pintado: traduce esos datos a `is-*`. El **cómo** se ve |
| `components/docs/` | [components/docs/LLM.md](components/docs/LLM.md) | Catálogo de los tags `docs-*` |
| `../docs/` | [../docs/LLM.md](../docs/LLM.md) | Sitio documental: prosa + una página por `docs-*` |
| `cdn/` | [cdn/LLM.md](cdn/LLM.md) | Contrato **público** que el build copia a `dist/cdn/LLM.md` |
| `css/` | — | `app.css`: solo lo que vive en **light DOM** (el diálogo de confirmación) |
| `types/` | — | `docs.d.ts`: tipos ambiente; el build los publica en `dist/cdn/types/` |

`js/boot.js` y `js/hojas.js` son los dos únicos archivos en JavaScript plano:
corren síncronos en `<head>`, antes de que exista ningún módulo. Ver
[js/LLM.md](js/LLM.md).

## La regla que manda sobre todas

**Nada se reimplementa si el kit `is-*` ya lo resuelve.**

Este proyecto consume [is-webcomponents](https://github.com/Jeff-Aporta/is-webcomponents)
por CDN. Antes de escribir HTML/CSS/JS propio para un botón, un diálogo, una
tabla, un toast, un icono, un formato de fecha o de bytes:

1. Buscar la intención en el [catálogo del kit](https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13/skills/is-webcomponents/catalog.md).
2. Abrir el `LLM.md` de la categoría y el `.md` del módulo.
3. Confirmar props y eventos **en el MD**. No inferir la API desde el nombre.
4. Usar el tag `is-*`. Los `docs-*` solo **traducen datos** del documento al kit.

Un `docs-*` que pinta UI genérica en vez de delegar en un `is-*` está mal, aunque
funcione.

### Lo que ya pasó por no hacerlo

- `_shared.ts` tuvo un `fecha()` con su propio `Intl.DateTimeFormat` —que no
  llamaba nadie— y un `formatBytes()` con su propia tabla de unidades. El kit
  trae `<iswc-format-date>`, `<iswc-format-bytes>`, `<iswc-format-number>` y
  `<iswc-relative-time>`, y todos entran con `all.min.js`. Dos formatos de salida
  que podían divergir del resto de la app sin que nada avisara. Eliminados.
- `variant="ghost"` en un `is-*` que no acepta ese valor: no da error, no
  avisa y no se ve — el componente se pinta con los valores por defecto.
  Verificar el enum en el `.md` del módulo antes de usarlo.

### Deuda conocida (documentada a propósito, no es descuido)

| Qué | Kit | Por qué sigue a mano |
| --- | --- | --- |
| Barra de secciones de `docs-nav` | `<iswc-tab-group>` | Las pestañas no tienen panel: filtran una lista que pinta `docs-app`. Migrarlo obliga a paneles vacíos |
| Pestañas de `docs-operation` | `<iswc-tab-group>` | El cuerpo se monta **al abrir** (ver «coste diferido» en `../LLM.md`); `iswc-tab-group` monta los tres paneles |
| Códigos de estado de `docs-minidoc-code` | `<iswc-tab-group>` | Son etiquetas de un solo panel que se repinta (200/400/429…), no tres paneles vivos. Con `iswc-tab-group` habría un panel por código y el JSON se montaría N veces para enseñar uno |
| `adoptCss` de `_shared.ts` | `IsUi.adoptCss` (`helpers/ui`) | Ver abajo |

Ninguna es excusa para añadir más UI a mano. Si alguna se migra, se borra su
fila de esta tabla y del test que la vigila.

## `adoptCss`: la excepción, y por qué

`_shared.ts` **reimplementa** `IsUi.adoptCss` a propósito, y por dos razones:

1. Atar el arranque de un componente a que `all.min.js` haya terminado de
   cargar convierte un fallo del CDN en una página vacía.
2. La versión del kit enlaza un `<link rel="stylesheet">` por ShadowRoot. Un
   `<link>` dentro de un shadow **no bloquea el pintado de ese shadow**: el
   navegador pinta los hijos sin estilos y los recoloca al resolver la hoja,
   también desde caché. La versión local adopta una `CSSStyleSheet` construida
   y cacheada por href — síncrona, y sobrevive a `replaceChildren()`.

Esto es una mejora sobre el kit, no una divergencia por comodidad. **Lo correcto
a medio plazo es subirla a `helpers/ui` del kit** y dejar aquí solo la copia sin
dependencia del CDN. Mientras tanto, `js/hojas.js` parchea los shadow roots que
sí vienen del kit. Todo el detalle en [components/LLM.md](components/LLM.md).

## Flujo de datos, en una frase por capa

1. `js/config.ts` resuelve de dónde sale el documento (`?conn=` > `<script
   id="docs-config">` > `?spec=`/`?api=`) y lo carga.
2. `js/insoft-config.ts` traduce el formato InSoft a la forma que el visor lee;
   `js/openapi.ts` agrupa operaciones por tag y resuelve `$ref`.
3. `docs-app` guarda **todo** el estado y reparte `props`.
4. Cada `docs-*` pinta y **emite**; ninguno escribe la URL ni el estado global.

## Qué hacer

- Leer [`../LLM.md`](../LLM.md) antes de tocar nada.
- Dominio sin DOM en `js/`, pintado en `components/`.
- `props` por **propiedad**, nunca por atributo: llevan objetos y saltos de línea.
- Toda entrada del documento pasa por `esc()` o por la plantilla `` html`` ``.
- Un componente nuevo se registra en **cuatro** sitios: `index.html`,
  `components/docs/all.ts`, `../docs/manifest.js` y su página.
- `deno task test` antes de dar nada por hecho.

## Qué no hacer

- Reimplementar lo que el kit ya trae.
- Meter CSS de componente en una constante del `.ts` (error heredado de is-tkts).
- Meter CSS de componente del kit en el `<head>`: ahí solo van tema y paletas.
- Lógica de negocio dentro de un componente.
- Que un hijo escriba la URL o el estado global.
- `innerHTML` con texto del documento.
- Llamar «OpenAPI» al sistema en la UI: el visor parsea **InSoft**.
- Inventar props, `data-*` o valores de enum que no estén en el MD del módulo.

## Navegación

- Leyes, historia de errores y testing: [`../LLM.md`](../LLM.md)
- Kit: [SKILL.md](https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13/skills/is-webcomponents/SKILL.md)
  · [catalog.md](https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13/skills/is-webcomponents/catalog.md)
  · [índice de componentes](https://cdn.jsdelivr.net/gh/Jeff-Aporta/is-webcomponents@eab3227d6a0666bcb2c1f053901c14effb02ca13/specs/componentes.md)
