# `docs` para LLM — sitio documental

## Propósito

Es **documentación**, no una galería de la app. Vive fuera de `src/` porque no
se compila: es HTML plano que consume `dist/cdn/` como cualquier otro
consumidor. Se publica tal cual (GitHub Pages) y se abre con `npm run serve` →
`docs/index.html`.

Dos clases de página, y la distinción importa:

| Clase | Dónde | Para qué |
| --- | --- | --- |
| Prosa | `paginas/*.html` | Por qué existe, comparativa, stack, arquitectura, estrategias, empezar. Se **leen** en orden. |
| Componente | `previews/*.html` | Un `sw-*` con sus casos en vivo. Se **consultan**. |

## Anatomía

| Archivo | Qué es |
| --- | --- |
| `manifest.js` | **Única fuente de verdad**: `paginas`, `componentes`, `categorias` |
| `index.html` | Shell: barra, índice desde el manifest, iframe con la página |
| `doc-kit.js` | Lo único que las páginas de prosa necesitan: `data-ir-a` → navegación |
| `preview-boot.js` | Tema y paleta dentro del iframe, antes del primer pintado |
| `preview-kit.js` | `crear()`, `caso()`, `montar()`, `registrarEventos()` |
| `styles/shell.css` | Chrome del sitio |
| `styles/doc.css` | Páginas de prosa |
| `styles/hero.css` | Solo la portada (composición de dos columnas con el vídeo) |
| `styles/preview.css` | Páginas de componente |
| `video/` | (vacío / reservado) — el hero usa YouTube unlisted `k0XcnhHQlzc` |

## Reglas de rutas

Todas las páginas viven a **dos niveles** de la raíz
(`docs/paginas/`, `docs/previews/`), así que:

```
../../dist/cdn/<módulo>.js     los componentes
../../src/css/app.css          el canvas de la app (solo `sw-app.html`)
../styles/doc.css              estilos del sitio
../preview-boot.js             tema
../doc-kit.js                  navegación de la prosa
```

Con un nivel de más o de menos, el import apunta a un directorio que no existe
y la página sale en blanco **sin ningún error visible**. Guardián:
`tests/estructura.test.ts`.

## Cómo se escribe una página de prosa

HTML estático. La navegación interna se declara, no se programa:

```html
<button type="button" class="tarjeta tarjeta--enlace" data-ir-a="comparativa">
  <iswc-icon class="tarjeta__icono" icon="mdi:compare-horizontal"></iswc-icon>
  <h3 class="tarjeta__titulo">Frente a Postman</h3>
  <p>Qué gana y qué pierde.</p>
</button>
```

`doc-kit.js` delega el click en el documento: pide al shell que navegue con
`postMessage`, y si la página está abierta a pelo resuelve la ruta contra el
manifest. No hace falta cablear nada por página.

### Piezas de `doc.css` disponibles

`.seccion` · `.rejilla` + `.tarjeta` · `.tabla` · `.diagrama` + `.diagrama__pie`
· `.contraste` (antes/después) · `.cifras` + `.cifra` · `.nota` · `.pasos`.

Antes de inventar un bloque, mirar si ya está. La medida de lectura es
`--doc-medida` (68ch); tablas y diagramas se salen de ella a propósito, porque
comparar y leer un flujo necesitan ancho.

## Cómo se escribe una página de componente

Declara **datos**, no chrome:

```js
import { crear, caso, montar } from '../preview-kit.js';
import '../../dist/cdn/components/sw/sw-method.js';

montar('sw-method', 'Chip del método HTTP.', [
  caso('Verbos', 'Ancho fijo para que las rutas se alineen',
    crear('sw-method', { method: 'get' }),
    crear('sw-method', { method: 'delete' }),
  ),
]);
```

`crear()` asigna `props` **por propiedad** — los payloads llevan objetos
anidados y saltos de línea, que no caben en un atributo. Escribir el andamiaje
a mano en cada archivo es lo que convirtió las previews del kit en 400 líneas
por tag: no se repite aquí.

## Diagramas

Se usan los del kit, nunca imágenes ni Mermaid: `<iswc-flowchart>`,
`<iswc-block-diagram>`, `<iswc-sequence-diagram>`, `<iswc-timeline>`. Config por
`<script type="application/json">` hijo, y `open-on-click` para el visor a
pantalla completa.

Envolver siempre en `.diagrama` y añadir `.diagrama__pie` con lo que hay que
mirar: un diagrama sin pie obliga a adivinar qué se estaba señalando.

## Qué hacer

- Añadir la entrada al `manifest.js` **y** el archivo a la vez.
- Cubrir los estados que importan: vacío, error, contenido largo, sin sesión.
- Usar los tokens `--is-*`; nunca colores sueltos.
- Hablar del **documento InSoft**, no de «OpenAPI», al nombrar lo que el visor lee.

## Qué no hacer

- Llamar «OpenAPI» al visor. Es un formato que acepta, no lo que es.
  Guardián: `tests/invariantes.test.ts`.
- Lógica de página como string o `eval`.
- Chrome a mano pudiendo usar `caso()` o las clases de `doc.css`.
- Dejar una entrada del manifest sin su HTML, o al revés.
- Meter `docs/` en el pipeline de TypeScript: no es fuente del visor.

## Errores conocidos y prevención

1. **Componente sin entrada en el manifest** — queda fuera del sitio y nadie lo
   vuelve a mirar. Guardián: `tests/estructura.test.ts`.
2. **Profundidad de ruta equivocada** — página en blanco, sin error.
   Guardián: `tests/estructura.test.ts`.
3. **`sw.all.js` dejaba los componentes sin estilos** — dentro del bundle,
   `import.meta.url` vale lo mismo para todos los módulos, así que `adoptCss`
   derivaba `sw.all.css`, que no existe. Afectaba justo a `previews/sw-app.html`,
   la página estrella. Resuelto pasando el nombre de la hoja como tercer
   argumento (`adoptCss(shadow, import.meta.url, 'sw-method')`): el *directorio*
   de `import.meta.url` sí es correcto en los dos casos. Guardianes:
   `tests/estructura.test.ts` e `tests/invariantes.test.ts`.
4. **El vídeo del hero pesa** — va con `preload="metadata"` y sin `autoplay`.
   Arrancar sonido sin que nadie lo pida es lo que hace cerrar la pestaña.

## Navegación

- Índice y leyes del proyecto: [`../LLM.md`](../LLM.md)
- Índice de `src`: [`../src/LLM.md`](../src/LLM.md)
- Capa de pintado: [`../src/components/LLM.md`](../src/components/LLM.md)
- Catálogo `sw-*`: [`../src/components/sw/LLM.md`](../src/components/sw/LLM.md)
