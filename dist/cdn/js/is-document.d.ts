/**
 * is-document.ts — «documento IS»: config del visor + spec en un solo JSON.
 *
 * Es el formato que InSoft publica para que un host arranque el visor con una
 * sola URL: `{ kind, version, viewer, spec }`. Se distingue de un OpenAPI
 * suelto por `kind`, y de una config suelta porque trae `spec` dentro.
 */
export declare const IS_DOCUMENT_KIND = "iswc.docs";
export declare const IS_DOCUMENT_VERSION = 1;
export declare function viewerConfigFromBoot(config?: DocsConfig): DocsConfig;
export declare function buildIsDocument(config: DocsConfig, spec: DocsSpec): Record<string, unknown>;
/** Acepta documento IS, o config con spec embebido. `null` si no es ninguno. */
export declare function parseIsDocument(doc: unknown): {
    config: DocsConfig;
    spec: DocsSpec;
} | null;
export declare const isDocumentText: (doc: unknown) => string;
