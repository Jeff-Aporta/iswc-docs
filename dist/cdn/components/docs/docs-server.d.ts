/**
 * <docs-server> — selector del host contra el que se prueba.
 *
 * Combina las bases del documento con una libre editable: una spec pública
 * casi nunca lista el entorno local, y obligar a editar la URL de cada
 * petición a mano es lo que hace inservible un visor para desarrollo.
 *
 * Evento: docs-server-change  detail: { serverBase }
 */
declare const DocsServer: CustomElementConstructor;
export { DocsServer };
