/**
 * <sw-nav> — barra superior: marca, secciones, búsqueda y acciones.
 *
 * La búsqueda emite en cada tecla y no se debounce aquí: filtrar es una
 * operación en memoria sobre un array ya construido, y retrasarla se nota
 * como lentitud sin ahorrar nada.
 *
 * Eventos: sw-nav-tab { tab } · sw-search { query }
 */
import './sw-auth.js';
import './sw-driver-switch.js';
import './sw-doc-actions.js';
type Props = {
    brand: SwBrand;
    tabs: SwNavTab[];
    activeTab: string;
    query: string;
    spec: SwSpec | null;
    config: SwConfig;
    authEnabled: boolean;
    auth: SwAuthConfig;
    session: SwSesion | null;
};
declare class SwNav extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
    /** `sw-app` delega aquí cuando una operación reclama sesión. */
    abrirLogin(hint?: string): void;
}
export { SwNav };
