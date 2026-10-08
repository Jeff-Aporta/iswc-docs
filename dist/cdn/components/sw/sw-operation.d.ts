/**
 * <sw-operation> — tarjeta desplegable de una operación.
 *
 * El contenido se monta **al abrir**, no al pintar la lista: una spec con
 * doscientos endpoints crearía doscientos `sw-try` con sus campos y su CSS
 * antes de que nadie mire ninguno.
 *
 * El estado abierto/pestaña se refleja en la URL (`?s=` → `op` / `opt`) para que un
 * enlace lleve a la operación exacta que alguien quiere enseñar.
 */
import { type SwOpTab } from '../../js/url-state.js';
import './sw-method.js';
import './sw-path.js';
import './sw-try.js';
import './sw-responses.js';
import './sw-doc.js';
import './sw-json.js';
type Props = {
    op: SwOp | null;
    spec: SwSpec | null;
    serverBase: string;
    authEnabled: boolean;
    docMd: string;
    abierto: boolean;
    tab: SwOpTab;
};
declare class SwOperation extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { SwOperation };
