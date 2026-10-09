/**
 * <sw-minidoc-view> — columna central del driver `sw-minidoc`: una operación, entera.
 *
 * A diferencia de `sw-operation`, aquí no hay acordeón ni pestañas: la operación seleccionada
 * se lee de arriba abajo como una página de manual — título, barra de endpoint, autorización,
 * parámetros agrupados por sitio (path, query, header, cookie) y cuerpo. Nada está plegado,
 * porque el driver ya filtró a una sola operación y esconder la mitad no ahorra nada.
 *
 * «Probar» abre `sw-try` en un panel anclado al botón (iswc-dropdown), no en un modal
 * centrado: queda pegado al trigger y no compite con la lectura del manual.
 */
import './sw-method.js';
import './sw-path.js';
import './sw-json.js';
import './sw-try.js';
import './sw-doc.js';
type Props = {
    op: SwOp | null;
    spec: SwSpec | null;
    grupo: string;
    serverBase: string;
    authEnabled: boolean;
    docMd: string;
};
declare class SwMinidocView extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { SwMinidocView };
