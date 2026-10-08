/**
 * Forma de las piezas JSON IS-Swagger (meta / paths / config / general).
 * El visor pide el documento unido en GET …/config.json; esa ruta no se lista
 * en paths: es cable interno. Deno: importar este módulo y llamar a los assert.
 */
export declare const ISS_SWAGGER_METHODS: readonly ["get", "post", "put", "patch", "delete", "query", "options", "head"];
export type IssSwaggerMethod = (typeof ISS_SWAGGER_METHODS)[number];
export type IssSwaggerInfo = {
    title: string;
    description?: string;
    version?: string;
};
export type IssSwaggerOp = {
    summary?: string;
    description?: string;
    tags?: string[];
    subgroup?: string;
    doc?: string;
    security?: string;
    [k: string]: unknown;
};
export type IssSwaggerMetaFile = {
    kind: 'meta';
    version: number;
    info: IssSwaggerInfo;
    viewer?: Record<string, unknown>;
    [k: string]: unknown;
};
export type IssSwaggerPathsFile = {
    kind: 'paths';
    version: number;
    paths: Record<string, Partial<Record<IssSwaggerMethod, IssSwaggerOp>>>;
};
export type IssSwaggerCatalog = {
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
/** Fichero en disco `swagger__config.json`: catálogo, sin paths. */
export type IssSwaggerCatalogFile = {
    kind: 'config';
    version: number;
    catalog: IssSwaggerCatalog;
    paths?: never;
};
/** Documento unido que el visor descarga (handler, no operación del índice). */
export type InsoftConfig = {
    kind: string;
    version: number;
    info?: IssSwaggerInfo;
    viewer?: Record<string, unknown>;
    protocol?: {
        serverUrl?: string;
    };
    tags?: Array<Record<string, unknown>>;
    paths?: Record<string, Record<string, unknown>>;
    docs?: Record<string, string>;
    catalog?: IssSwaggerCatalog;
};
export type InsoftCatalog = IssSwaggerCatalog;
export type IssSwaggerGeneralFile = {
    kind: 'general';
    version: number;
    titulo?: string;
    resumen?: string;
    secciones?: unknown[];
    [k: string]: unknown;
};
export declare function assertIssSwaggerMeta(doc: unknown): string[];
export declare function assertIssSwaggerPaths(doc: unknown): string[];
export declare function assertIssSwaggerCatalogFile(doc: unknown): string[];
export declare function assertIssSwaggerGeneral(doc: unknown): string[];
/** paths.op.doc → catalog.docs[id]. */
export declare function assertIssSwaggerDocsResuelven(pathsDoc: unknown, catalogDoc: unknown): string[];
/** Lo que un host Deno pasa a `assertIssSwaggerPiezas` (ficheros o piezas vivas). */
export type IssSwaggerPiezas = {
    meta?: unknown;
    paths?: unknown;
    config?: unknown;
    general?: unknown;
};
export declare function assertIssSwaggerPiezas(piezas: IssSwaggerPiezas): string[];
