/**
 * <docs-driver-switch> — selector de presentación, para la cabecera.
 *
 * Vive suelto y no dentro de un driver porque los dos lo montan: `docs-minidoc` en su cabecera y
 * `docs-nav` en la de `docs-app`, en ambos casos a la izquierda del conmutador de tema. Si lo
 * tuviera uno de los dos, el otro tendría que importar a su hermano para no quedarse sin él.
 *
 * No monta nada: escribe la preferencia y emite `docs-driver-change`. Quien decide qué hacer con
 * eso es `docs-viewer`, que es el único que sabe dónde está montado el driver actual.
 */
declare const DocsDriverSwitch: CustomElementConstructor;
export { DocsDriverSwitch };
