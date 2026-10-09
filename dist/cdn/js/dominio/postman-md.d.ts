/**
 * postman-md.ts — convierte el markdown InSoft (`x-iss-doc-md`) a algo que
 * Postman pueda pintar: diagramas `is-*` → `<img src="data:image/png;base64,…">`
 * con fondo transparente, y `<iswc-code>` → fences ```lang.
 *
 * La rasterización de diagramas solo corre en el navegador (necesita el kit
 * cargado y un SVG real). Fuera de DOM, los bloques de diagrama se omiten con
 * un aviso en texto.
 */
/** Tags de diagrama del kit que el export sabe rasterizar. */
export declare const POSTMAN_DIAGRAM_TAGS: readonly ["iswc-flowchart", "iswc-sequence-diagram", "iswc-state-diagram", "iswc-block-diagram", "iswc-swimlane-diagram", "iswc-component-diagram", "iswc-class-diagram", "iswc-er-diagram", "iswc-mindmap", "iswc-gantt", "iswc-timeline", "iswc-org-chart", "iswc-journey-map", "iswc-sankey-diagram", "iswc-venn-diagram", "iswc-use-case-diagram", "iswc-quadrant-chart"];
/** `<iswc-code lang="http" value="…">` / hijos → fence markdown. */
export declare function convertIsCodeToFences(md: string): string;
/** SVG del shadow → PNG data-URL con fondo transparente. */
export declare function svgToTransparentPngDataUrl(svg: SVGSVGElement): Promise<string>;
/** Monta un bloque `is-*` offscreen, espera el SVG y lo pasa a PNG. */
export declare function rasterizeDiagramHtml(html: string): Promise<string | null>;
/** Sustituye cada diagrama del MD por `<img src="data:image/png;base64,…">`. */
export declare function convertDiagramsToPngImgs(md: string): Promise<string>;
/** Pipeline completo: diagramas → PNG, `iswc-code` → fences. */
export declare function issDocMdForPostman(md: string): Promise<string>;
export declare function opDocMd(op: Record<string, unknown> | null | undefined): string;
