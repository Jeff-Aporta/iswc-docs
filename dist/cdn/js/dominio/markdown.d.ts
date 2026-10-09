/**
 * markdown.ts — subconjunto de Markdown → HTML, sin dependencias.
 *
 * Cubre lo que aparece en `description` y `x-iss-doc-md` de una spec:
 * encabezados, listas, tablas GFM, cita, regla, código cercado e inline.
 * Todo se escapa antes de componer, así que una descripción con `<script>`
 * se pinta como texto y no como script.
 *
 * Es puro (string → string) para poder probarlo sin navegador.
 */
export declare const esc: (s: unknown) => string;
/** Inline: `code`, **negrita**, *cursiva*, ~~tachado~~, [link](url). */
export declare function inlineMd(src: unknown): string;
export declare function renderMarkdown(src: unknown): string;
