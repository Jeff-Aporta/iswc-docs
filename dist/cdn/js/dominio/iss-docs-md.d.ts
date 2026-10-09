/** Prosa para el modelo: sin web components, fences de iswc-code. */
export declare function issDocToLlmMarkdown(md: string): string;
/** Markdown canónico para GET /LLM.md. */
export declare function issDocsToMarkdown(input: unknown): string;
export type IssDocsLlmViewOpts = {
    title?: string;
    /** Href same-origin del markdown (p. ej. `/api/LLM.md`). */
    llmMdHref?: string;
    /** Raíz CDN del kit, con `/dist/cdn`. */
    kitCdn: string;
    kitPin?: string;
    palette?: string;
    /** Ruta del visor interactivo en el host; sin ella no se enlaza. */
    visorHref?: string;
};
/** Página HTML: `<iswc-md-render>` pinta el GET /LLM.md. */
export declare function buildIssDocsLlmViewHtml(opts: IssDocsLlmViewOpts): string;
