/**
 * <docs-export> — descargas: ISWC Docs (config), OpenAPI 3 y Postman.
 *
 * Los formatos se generan al pulsar, no al pintar el menú: serializar la spec
 * tres veces en cada repintado de la barra sería trabajo tirado.
 *
 * Postman es async (rasteriza diagramas a PNG); el resto suele ser sync.
 */
declare const DocsExport: CustomElementConstructor;
export { DocsExport };
