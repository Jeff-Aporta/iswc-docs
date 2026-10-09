/**
 * nav.ts — pestañas de sección del visor.
 *
 * Una spec grande no se navega bien como una lista única de tags. `config.nav`
 * declara secciones que filtran los grupos visibles; sin `nav`, hay una sola
 * pestaña implícita con todo, y la barra ni se pinta.
 */

export const NAV_ALL = '__all__';

/** Pestañas visibles según la sesión (`requiresSession` esconde las privadas). */
export function resolveVisibleNavTabs(config: DocsConfig, session: DocsSesion | null): DocsNavTab[] {
  const tabs = Array.isArray(config?.nav) ? config.nav : [];
  return tabs.filter((t) => t?.id && (!t.requiresSession || !!session?.token));
}

/** Id de pestaña activa: la de la URL si sigue siendo válida, si no la primera. */
export function resolveActiveNavTab(tabs: DocsNavTab[], preferido: string): string {
  if (!tabs.length) return NAV_ALL;
  if (preferido && tabs.some((t) => t.id === preferido)) return preferido;
  return tabs[0]!.id;
}

/**
 * Grupos que corresponden a una pestaña. Una pestaña sin `tags` no filtra:
 * sirve para tener una sección «Todo» junto a otras más concretas.
 */
export function filterGroupsByNavTab(groups: DocsGrupo[], tabs: DocsNavTab[], activeId: string): DocsGrupo[] {
  if (!tabs.length || activeId === NAV_ALL) return groups;
  const tab = tabs.find((t) => t.id === activeId);
  if (!tab || !tab.tags?.length) return groups;
  const permitidos = new Set(tab.tags);
  return groups.filter((g) => permitidos.has(g.name));
}

/** Búsqueda libre sobre ruta, resumen, tag y `operationId`. Vacío = sin filtrar. */
export function filterGroupsByQuery(groups: DocsGrupo[], query: string): DocsGrupo[] {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return groups;

  const coincide = (op: DocsOp, grupo: string, entidad = ''): boolean =>
    [op.path, op.method, op.summary, op.description, op.operationId, grupo, entidad]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));

  return groups
    .map((g) => {
      const operations = g.operations.filter((op) => coincide(op, g.name));
      const subgroups = g.subgroups
        .map((s) => ({
          ...s,
          operations: s.operations.filter((op) => coincide(op, g.name, s.name || s.id)),
        }))
        .filter((s) => s.operations.length);
      return { ...g, operations, subgroups };
    })
    .filter((g) => g.operations.length);
}

export const contarOperaciones = (groups: DocsGrupo[]): number =>
  groups.reduce((n, g) => n + g.operations.length, 0);
