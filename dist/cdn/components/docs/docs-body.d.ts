/**
 * <docs-body> — editor del cuerpo JSON de la petición.
 *
 * Controlado como `docs-params`: emite `docs-body-change` y no guarda el texto.
 * La validación es en vivo pero **no bloquea**: mostrar el error y dejar
 * ejecutar es lo correcto, porque a veces se quiere ver justo qué contesta la
 * API ante un cuerpo mal formado.
 *
 * Evento: docs-body-change  detail: { value, error }
 */
declare const DocsBody: CustomElementConstructor;
export { DocsBody };
