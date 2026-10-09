/**
 * <docs-path> — ruta de la operación con los `{parámetros}` resaltados.
 *
 * Distinguir el segmento variable del literal es lo que hace escaneable una
 * lista de rutas parecidas (`/tercero/{id}` vs `/tercero/lista`), y evita
 * leer mal un `{id}` como parte fija del path.
 */
declare const DocsPath: CustomElementConstructor;
export { DocsPath };
