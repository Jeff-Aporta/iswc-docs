/**
 * <sw-try> — «Probar»: arma la petición, la ejecuta y enseña la respuesta.
 *
 * Es el único componente del visor que no repinta entero en cada cambio, y lo
 * es a propósito: escribir en un parámetro no puede rehacer el shadow, porque
 * el campo perdería el foco a cada tecla. El repintado se parte en tres zonas
 * independientes —URL de previsualización, aviso de error y resultado— y solo
 * se toca la que cambió.
 *
 * Props: { op, spec, serverBase, authEnabled }
 * Evento: sw-need-login  detail: { hint }  — cuando falta JWT y hace falta.
 */
import './sw-params.js';
import './sw-body.js';
import './sw-json.js';
type Props = {
    op: SwOp | null;
    spec: SwSpec | null;
    serverBase: string;
    authEnabled: boolean;
};
declare class SwTry extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { SwTry };
