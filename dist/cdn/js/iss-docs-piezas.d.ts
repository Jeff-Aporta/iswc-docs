/**
 * Forma de las piezas JSON ISWC Docs (meta / paths / config / general).
 * El visor pide el documento unido en GET …/config.json; esa ruta no se lista
 * en paths: es cable interno. Deno: importar este módulo y llamar a los assert.
 */
export declare const ISS_DOCS_METHODS: readonly ["get", "post", "put", "patch", "delete", "query", "options", "head"];
export type IssDocsMethod = (typeof ISS_DOCS_METHODS)[number];
export type IssDocsInfo = {
    title: string;
    description?: string;
    version?: string;
};
export type IssDocsOp = {
    summary?: string;
    description?: string;
    tags?: string[];
    subgroup?: string;
    doc?: string;
    security?: string;
    [k: string]: unknown;
};
export type IssDocsMetaFile = {
    kind: 'meta';
    version: number;
    info: IssDocsInfo;
    viewer?: Record<string, unknown>;
    [k: string]: unknown;
};
export type IssDocsPathsFile = {
    kind: 'paths';
    version: number;
    paths: Record<string, Partial<Record<IssDocsMethod, IssDocsOp>>>;
};
export type IssDocsCatalog = {
    schemas?: Record<string, Record<string, unknown>>;
    payloads?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    docs?: Record<string, string>;
    lookups?: Record<string, unknown>;
    listFilters?: Record<string, unknown>;
    inputRecommendations?: Record<string, unknown>;
    bodyPresets?: Record<string, unknown>;
    requestBodyExamples?: Record<string, unknown>;
    tryitConfirm?: Record<string, unknown>;
    tryitAttachments?: {
        templates?: Record<string, unknown>;
    };
};
/** Fichero en disco `docs__config.json`: catálogo, sin paths. */
export type IssDocsCatalogFile = {
    kind: 'config';
    version: number;
    catalog: IssDocsCatalog;
    paths?: never;
};
/** Documento unido que el visor descarga (handler, no operación del índice). */
export type InsoftConfig = {
    kind: string;
    version: number;
    info?: IssDocsInfo;
    viewer?: Record<string, unknown>;
    protocol?: {
        serverUrl?: string;
    };
    tags?: Array<Record<string, unknown>>;
    paths?: Record<string, Record<string, unknown>>;
    docs?: Record<string, string>;
    catalog?: IssDocsCatalog;
};
export type InsoftCatalog = IssDocsCatalog;
export type IssDocsGeneralFile = {
    kind: 'general';
    version: number;
    titulo?: string;
    resumen?: string;
    secciones?: unknown[];
    [k: string]: unknown;
};
export declare function assertIssDocsMeta(doc: unknown): string[];
export declare function assertIssDocsPaths(doc: unknown): string[];
export declare function assertIssDocsCatalogFile(doc: unknown): string[];
export declare function assertIssDocsGeneral(doc: unknown): string[];
/** paths.op.doc → catalog.docs[id]. */
export declare function assertIssDocsDocsResuelven(pathsDoc: unknown, catalogDoc: unknown): string[];
/** Lo que un host Deno pasa a `assertIssDocsPiezas` (ficheros o piezas vivas). */
export type IssDocsPiezas = {
    meta?: unknown;
    paths?: unknown;
    config?: unknown;
    general?: unknown;
};
export declare function assertIssDocsPiezas(piezas: IssDocsPiezas): string[];
