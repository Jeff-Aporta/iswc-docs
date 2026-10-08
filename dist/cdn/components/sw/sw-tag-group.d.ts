/**
 * <sw-tag-group> — un tag de la spec con sus operaciones.
 *
 * Si hay `subgroups`, solo se usan para ordenar (la entidad va en el summary).
 * No se pintan divisores/subcarpetas: la lista queda plana bajo el tag.
 */
import type { SwOpTab } from '../../js/url-state.js';
import './sw-operation.js';
type Props = {
    group: SwGrupo | null;
    spec: SwSpec | null;
    serverBase: string;
    authEnabled: boolean;
    docIndex: Record<string, string>;
    /** `operationId` de la operación abierta, o vacío. */
    opAbierta: string;
    opTab: SwOpTab;
};
declare class SwTagGroup extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
}
export { SwTagGroup };
