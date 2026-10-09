/**
 * nav.ts — pestañas de sección del visor.
 *
 * Una spec grande no se navega bien como una lista única de tags. `config.nav`
 * declara secciones que filtran los grupos visibles; sin `nav`, hay una sola
 * pestaña implícita con todo, y la barra ni se pinta.
 */
export declare const NAV_ALL = "__all__";
/** Pestañas visibles según la sesión (`requiresSession` esconde las privadas). */
export declare function resolveVisibleNavTabs(config: DocsConfig, session: DocsSesion | null): DocsNavTab[];
/** Id de pestaña activa: la de la URL si sigue siendo válida, si no la primera. */
export declare function resolveActiveNavTab(tabs: DocsNavTab[], preferido: string): string;
/**
 * Grupos que corresponden a una pestaña. Una pestaña sin `tags` no filtra:
 * sirve para tener una sección «Todo» junto a otras más concretas.
 */
export declare function filterGroupsByNavTab(groups: DocsGrupo[], tabs: DocsNavTab[], activeId: string): DocsGrupo[];
/** Búsqueda libre sobre ruta, resumen, tag y `operationId`. Vacío = sin filtrar. */
export declare function filterGroupsByQuery(groups: DocsGrupo[], query: string): DocsGrupo[];
export declare const contarOperaciones: (groups: DocsGrupo[]) => number;
