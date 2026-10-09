/**
 * <docs-nav> — barra superior: marca, secciones, búsqueda y acciones.
 *
 * La búsqueda emite en cada tecla y no se debounce aquí: filtrar es una
 * operación en memoria sobre un array ya construido, y retrasarla se nota
 * como lentitud sin ahorrar nada.
 *
 * Eventos: docs-nav-tab { tab } · docs-search { query }
 */
import './docs-auth.js';
import './docs-driver-switch.js';
import './docs-doc-actions.js';
type Props = {
    brand: DocsBrand;
    tabs: DocsNavTab[];
    activeTab: string;
    query: string;
    spec: DocsSpec | null;
    config: DocsConfig;
    authEnabled: boolean;
    auth: DocsAuthConfig;
    session: DocsSesion | null;
};
declare class DocsNav extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
    /** `docs-app` delega aquí cuando una operación reclama sesión. */
    abrirLogin(hint?: string): void;
}
export { DocsNav };
