/**
 * <docs-params> — campos de los parámetros de una operación.
 *
 * Es un componente controlado: no guarda los valores, los emite en
 * `docs-param-change` y quien lo monta (`docs-try`) es el dueño del estado. Así
 * la URL de previsualización y la petición leen siempre la misma fuente.
 *
 * Props:
 *   params    DocsParam[] ya resueltos (sin `$ref`)
 *   values    Record<string,string>
 *   disabled  boolean
 * Evento:
 *   docs-param-change  detail: { name, value }
 */
declare const DocsParams: CustomElementConstructor;
export { DocsParams };
