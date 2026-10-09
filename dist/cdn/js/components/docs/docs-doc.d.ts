/**
 * <docs-doc> — prosa Markdown vía `<iswc-md-render>` (kit is-webcomponents).
 *
 * El host debe haber cargado el tag `iswc-md-render` (y los `is-*` que el MD
 * embute: `iswc-code`, `iswc-flowchart`, …). El cuerpo va en un
 * `<script type="text/markdown">` hijo — no en el atributo `value` — para
 * que HTML embebido (`<iswc-flowchart>`, `<iswc-code>`) no se rompa por comillas.
 */
declare const DocsDoc: CustomElementConstructor;
export { DocsDoc };
