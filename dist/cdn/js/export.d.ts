/**
 * export.ts — descargas del visor: IS-Swagger (config InSoft), OpenAPI 3 y Postman.
 *
 * Todo se genera en el navegador desde la spec / config ya cargada. No hay endpoint
 * de exportación: el visor es 100 % front y una descarga que dependiera del host
 * dejaría de funcionar al abrir el HTML suelto.
 *
 * Postman: la description de cada request usa `x-iss-doc-md` convertido —
 * diagramas `is-*` → PNG transparente en `<img src="data:…">`, `<iswc-code>` → fences.
 */
export type SwFormatoExport = {
    id: string;
    label: string;
    icon: string;
    filename: string;
    build(): string | Promise<string>;
};
/** OpenAPI 3.0 portable a partir del SwSpec interno del visor. */
export declare function toOpenApi30(spec: SwSpec): Record<string, unknown>;
/**
 * OpenAPI 3 → Postman Collection v2.1.
 *
 * Los `{param}` de OpenAPI se traducen a `:param` (la sintaxis de Postman) y
 * cada segmento va también en `path[]`, que es lo que Postman usa realmente
 * para construir la petición; `raw` solo se muestra en la barra de la app.
 *
 * La description de cada item es el markdown InSoft ya convertido para Postman
 * (PNG de diagramas + fences de código).
 */
export declare function toPostmanCollection(spec: SwSpec, nombre?: string): Promise<Record<string, unknown>>;
export declare function buildExportFormats(spec: SwSpec | null, config: SwConfig): SwFormatoExport[];
export declare function descargarTexto(filename: string, contenido: string, mime?: string): void;
export declare function copiarAlPortapapeles(texto: string): Promise<boolean>;
