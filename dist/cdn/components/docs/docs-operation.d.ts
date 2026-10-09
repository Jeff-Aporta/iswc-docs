/**
 * <docs-operation> — tarjeta desplegable de una operación.
 *
 * El contenido se monta **al abrir**, no al pintar la lista: una spec con
 * doscientos endpoints crearía doscientos `docs-try` con sus campos y su CSS
 * antes de que nadie mire ninguno.
 *
 * El estado abierto/pestaña se refleja en la URL (`?s=` → `op` / `opt`) para que un
 * enlace lleve a la operación exacta que alguien quiere enseñar.
 */
import { type DocsOpTab } from '../../js/url-state.js';
import './docs-method.js';
import './docs-path.js';
import './docs-try.js';
import './docs-responses.js';
import './docs-doc.js';
import './docs-json.js';
type Props = {
    op: DocsOp | null;
    spec: DocsSpec | null;
    serverBase: string;
    authEnabled: boolean;
    docMd: string;
    abierto: boolean;
    tab: DocsOpTab;
};
declare class DocsOperation extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { DocsOperation };
