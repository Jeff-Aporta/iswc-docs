/**
 * param-schema.ts — del `schema` de un parámetro a cómo se edita en pantalla.
 *
 * El saneado es por tipo declarado, no por `type="number"` del input nativo:
 * el kit usa `iswc-input`, y dejar que el navegador decida da comportamientos
 * distintos por locale (coma vs punto decimal).
 */
export declare const paramSchemaType: (schema: SwSchema | undefined) => string;
/** Recorta lo que el tipo no admite mientras se escribe (integer: solo dígitos). */
export declare function sanitizeParamInputValue(schema: SwSchema | undefined, raw: unknown): string;
/** `inputmode` del teclado móvil. */
export declare function paramInputMode(schema: SwSchema | undefined): 'numeric' | 'decimal' | 'text';
/** Valores cerrados del parámetro, si los declara (pinta un `iswc-select`). */
export declare function paramEnum(schema: SwSchema | undefined): string[];
/** Etiqueta corta del tipo: `array<string>`, `string(date-time)`, `integer`. */
export declare function paramTypeLabel(schema: SwSchema | undefined): string;
/** Valor inicial: `example` → `default` → primer `enum` → vacío. */
export declare function paramInitialValue(param: SwParam): string;
