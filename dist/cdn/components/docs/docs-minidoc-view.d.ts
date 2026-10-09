/**
 * <docs-minidoc-view> — columna central del driver `docs-minidoc`: una operación, entera.
 *
 * A diferencia de `docs-operation`, aquí no hay acordeón ni pestañas: la operación seleccionada
 * se lee de arriba abajo como una página de manual — título, barra de endpoint, autorización,
 * parámetros agrupados por sitio (path, query, header, cookie) y cuerpo. Nada está plegado,
 * porque el driver ya filtró a una sola operación y esconder la mitad no ahorra nada.
 *
 * «Probar» abre `docs-try` en un panel anclado al botón (iswc-dropdown), no en un modal
 * centrado: queda pegado al trigger y no compite con la lectura del manual.
 */
import './docs-method.js';
import './docs-path.js';
import './docs-json.js';
import './docs-try.js';
import './docs-doc.js';
type Props = {
    op: DocsOp | null;
    spec: DocsSpec | null;
    grupo: string;
    serverBase: string;
    authEnabled: boolean;
    docMd: string;
};
declare class DocsMinidocView extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { DocsMinidocView };
