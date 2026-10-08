/**
 * tryit-body.ts — cuerpo JSON editable de «Probar».
 *
 * El texto inicial sale del ejemplo de la spec o de `x-iss-request-body`.
 * Sin ejemplo el editor queda vacío (`{ }`): un `$ref` sin resolver no debe
 * pintar el literal `null`.
 */
export declare const BODY_HTTP_METHODS: Set<string>;
export declare const EXT_REQUEST_BODY = "x-iss-request-body";
export declare const EXT_REQUEST_BODY_EXAMPLES = "x-iss-request-body-examples";
export type SwBodyEjemplo = {
    id: string;
    label: string;
    icon?: string;
    example: unknown;
};
export declare const opUsesRequestBody: (method: unknown) => boolean;
export declare const shouldShowTryItBody: (op: SwOp | undefined) => boolean;
export declare function resolveTryItBodyExample(op: SwOp | undefined): unknown;
/** Ejemplos con nombre: `x-iss-request-body-examples`, o los `examples` de la spec. */
export declare function resolveTryItBodyExamples(op: SwOp | undefined): SwBodyEjemplo[];
export declare const formatBodyExample: (example: unknown) => string;
export declare const defaultTryItBodyText: (op: SwOp | undefined) => string;
/** Valida el JSON del editor. `null` = correcto. */
export declare function validateBodyJson(text: string): string | null;
