/**
 * <sw-minidoc-code> — columna derecha del driver `sw-minidoc`.
 *
 * Petición (cURL o body raw del ejemplo activo) + respuesta por código de estado.
 * Si hay varios ejemplos de body, un chip cambia el estado del ejemplo: el cURL y
 * el JSON crudo se regeneran con ese cuerpo, listo para copiar y forzar el caso.
 */
import { toneToIsColor } from '../../js/openapi.js';
import './sw-json.js';
type Props = {
    op: SwOp | null;
    spec: SwSpec | null;
    serverBase: string;
    requiereBearer: boolean;
};
declare class SwMinidocCode extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { SwMinidocCode, toneToIsColor };
