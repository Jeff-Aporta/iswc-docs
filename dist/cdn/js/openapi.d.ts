/**
 * openapi.ts — lectura de un documento OpenAPI 3.x.
 *
 * Módulo puro: no toca el DOM ni la red. Todo lo que el visor necesita saber
 * de una spec sale de aquí, y por eso es lo único que los tests tienen que
 * cubrir para garantizar que la vista pinta lo correcto.
 *
 * Extensiones propias que se respetan (`x-*`):
 *   x-isa-subgroup    en la operación → id del subgrupo dentro del tag
 *   x-isa-subgroups   en el tag       → definición y orden de esos subgrupos
 *   x-iss-doc-md      en la operación → markdown de la pestaña «Doc»
 *   x-iss-lookup      en el parámetro → autocompletado remoto
 */
/** Id estable de la operación. Sin `operationId`, se deriva de método + ruta. */
export declare function opIdFromOperation(op: DocsOperation | undefined, method: string, path: string): string;
/** Primer ejemplo utilizable de un media type: `example` → `examples` → `schema.example`. */
export declare function extractJsonExample(media: DocsMediaType | undefined): unknown;
export declare function listOperations(spec: DocsSpec | null | undefined): DocsOp[];
export declare function groupOperationsByTag(spec: DocsSpec | null | undefined): DocsGrupo[];
/** Grupos en el orden en que `spec.tags` los declara; el resto, alfabético al final. */
export declare function sortGroupsBySpecOrder(groups: DocsGrupo[], spec: DocsSpec | null | undefined): DocsGrupo[];
/** `operationId` → markdown de la pestaña «Doc». */
export declare function buildDocIndex(spec: DocsSpec | null | undefined): Record<string, string>;
/** Nombre de parámetro → descriptor de lookup, mirando también `$ref`. */
export declare function buildLookupIndex(spec: DocsSpec | null | undefined): Record<string, unknown>;
/** Resuelve el `$ref` de un parámetro contra `components.parameters`. */
export declare function resolveParam(param: DocsParam, spec: DocsSpec | null | undefined): DocsParam;
/** Resuelve `$ref` de un schema contra `components.schemas`. */
export declare function resolveSchema(schema: DocsSchema | undefined, spec: DocsSpec | null | undefined, profundidad?: number): DocsSchema | undefined;
export declare function resolveParams(op: DocsOp, spec: DocsSpec | null | undefined): DocsParam[];
/**
 * ¿La operación exige `Authorization: Bearer`?
 *
 * `security` se lee de la operación y, si no está, del documento. Se aceptan
 * las formas laxas que usan los documentos IS (`"bearer"`, `"none"`, `false`)
 * además del array estándar de OpenAPI.
 */
export declare function operationRequiresBearer(op: DocsOperation | undefined, spec: DocsSpec | null | undefined): boolean;
/** URL del servidor con las variables sustituidas por su `default`. */
export declare function resolveServerUrl(spec: DocsSpec | null | undefined, serverIndex?: number): string;
export declare function jsonPretty(v: unknown): string;
export type DocsTono = 'ok' | 'auth' | 'warn' | 'err' | 'neutral';
/** Tono semántico de un código de respuesta (401/403 se separan del resto de 4xx). */
export declare function responseTone(code: string | number): DocsTono;
/** Tono → `color` de los `is-*` (los únicos valores que el kit acepta). */
export declare function toneToIsColor(tone: DocsTono): 'success' | 'warning' | 'danger' | 'neutral';
/** Color `is-*` por método HTTP. Es la única tabla: chips, bordes y botones la comparten.
 *  QUERY no usa `info`/`brand`: en paleta ContaPyme ambos son azul y se confundían con GET. */
export declare const METHOD_COLOR: Record<string, string>;
