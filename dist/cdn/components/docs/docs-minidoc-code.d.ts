/**
 * <docs-minidoc-code> — columna derecha del driver `docs-minidoc`.
 *
 * Petición (cURL o body raw del ejemplo activo) + respuesta por código de estado.
 * Si hay varios ejemplos de body, un chip cambia el estado del ejemplo: el cURL y
 * el JSON crudo se regeneran con ese cuerpo, listo para copiar y forzar el caso.
 */
import { toneToIsColor } from '../../js/openapi.js';
import './docs-json.js';
type Props = {
    op: DocsOp | null;
    spec: DocsSpec | null;
    serverBase: string;
    requiereBearer: boolean;
};
declare class DocsMinidocCode extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { DocsMinidocCode, toneToIsColor };
