/**
 * tk-json2mmd.mjs — traduce a Mermaid los diagramas que llegan de la API en
 * formato JSON estructurado.
 *
 * En tks-system conviven dos formas de guardar un diagrama:
 *
 *   1. `kind: "diagram"`  — ya trae `payload.source` en Mermaid. No hay nada
 *      que traducir; solo se limpia.
 *   2. `kind: "sequence"` — trae `payload.sequence` como objeto
 *      (`actors` / `groups` / `messages`), que es lo que dibuja el componente
 *      `<iswc-sequence-diagram>` del kit. Ese objeto NO es Mermaid, así que en
 *      un `.md` no se puede pintar: hay que traducirlo. De eso va este módulo.
 *
 * Decisiones de traducción, y por qué:
 *
 * - **Las etiquetas se limpian de marcado propio del visor.** Los `label`
 *   traen plantillas `{{iconify: {...}}}` para pintar iconos en el
 *   componente; en Mermaid eso es ruido ilegible. Se quitan.
 * - **`;` y `|` se sustituyen por coma.** En Mermaid el `;` termina la
 *   sentencia AUNQUE vaya entre comillas, y el `|` es separador de actor:
 *   una etiqueta con `data:audio/webm;codecs=opus` rompe el diagrama entero
 *   con `Parse error ... got NEWLINE`. No hay escape posible.
 * - **Los `desc` largos van como `Note over`**, no en la flecha: la flecha es
 *   la acción, la nota es la explicación. Metidos en el `label` producen un
 *   diagrama ilegible de tan ancho.
 * - **Los `groups` se traducen a `rect`** con su color, que es lo más cercano
 *   en Mermaid a las bandas de color del componente original.
 */
/**
 * `payload.sequence` (objeto de `<iswc-sequence-diagram>`) -> `sequenceDiagram`.
 * Devuelve '' si el objeto no tiene lo mínimo para dibujar algo.
 */
export declare function sequence2mmd(seq: any): string;
/**
 * Cualquier bloque de diagrama -> fuente Mermaid.
 * `diagram` ya viene en Mermaid; `sequence` se traduce. Cualquier otro, ''.
 */
export declare function bloqueDiagrama2mmd(bloque: any): string;
