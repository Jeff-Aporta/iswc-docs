/**
 * kit-tags.ts — tags `is-*` que el visor carga con el loader del kit.
 *
 * Fuente de verdad para hosts (ISS PatyIA, demos, Pages): se publica en
 * `dist/cdn/js/kit-tags.js` y se importa antes de `L.load(...DOCS_KIT_TAGS)`.
 *
 * Si un `docs-*` empieza a usar otro tag del kit, añadirlo **aquí** (y en LLM.md).
 * No duplicar la lista en el host: sin el tag el custom element no hace upgrade.
 */
export const DOCS_KIT_TAGS = [
  'iswc-button',
  'iswc-button-group',
  'iswc-copy-button',
  'iswc-dropdown',
  'iswc-dropdown-item',
  'iswc-checkbox',
  'iswc-input',
  'iswc-option',
  'iswc-select',
  'iswc-textarea',
  'iswc-file-input',
  'iswc-spinner',
  'iswc-tag',
  'iswc-theme-toggle',
  'iswc-toast',
  'iswc-format-bytes',
  'iswc-format-date',
  'iswc-format-number',
  'iswc-relative-time',
  'iswc-callout',
  'iswc-details',
  'iswc-dialog',
  'iswc-divider',
  'iswc-drawer',
  'iswc-split-panel',
  'iswc-icon',
  'iswc-code',
  'iswc-md-render',
  // Docs (`x-iss-doc-md`): HTML embebido que `iswc-md-render` pinta por innerHTML.
  'iswc-flowchart',
  'iswc-sequence-diagram',
  'iswc-er-diagram',
  'iswc-diagram-lightbox',
] as const;

export type DocsKitTag = (typeof DOCS_KIT_TAGS)[number];

/**
 * Componentes propios, por dónde viven. Fuente única del registro: el loader (`docs-loader`),
 * el bundle de compatibilidad (`all.min.js`), la galería de demos y el guardián de registro
 * salen de aquí. Un componente nuevo se declara UNA vez, en la lista que le toca.
 *
 * - `DOCS_TAGS`: transversales (los usan los dos drivers) → `js/components/docs/<tag>.js`.
 * - `VIEW_TAGS`: exclusivos de una vista → `view/<vista>/components/<tag>.js`.
 *   Una vista no importa componentes de otra; lo compartido sube a `DOCS_TAGS`.
 */
export const DOCS_TAGS = [
  'docs-method',
  'docs-path',
  'docs-json',
  'docs-doc',
  'docs-home',
  'docs-params',
  'docs-body',
  'docs-try',
  'docs-auth',
  'docs-export',
  'docs-doc-reload',
  'docs-doc-actions',
  'docs-layout',
  'docs-driver-switch',
  'docs-viewer',
] as const;

export const VIEW_TAGS = {
  app: ['docs-responses', 'docs-operation', 'docs-tag-group', 'docs-info', 'docs-server', 'docs-nav', 'docs-app'],
  minidoc: ['docs-minidoc-code', 'docs-minidoc-view', 'docs-minidoc'],
} as const satisfies Record<string, readonly `docs-${string}`[]>;

export type DocsTag = (typeof DOCS_TAGS)[number] | (typeof VIEW_TAGS)[keyof typeof VIEW_TAGS][number];
export type DocsVista = keyof typeof VIEW_TAGS;

/** Carpeta publicada (relativa a `dist/cdn/`) de un componente propio; `null` si no es nuestro. */
export function rutaComponente(tag: string): string | null {
  if ((DOCS_TAGS as readonly string[]).includes(tag)) return 'js/components/docs/';
  for (const [vista, tags] of Object.entries(VIEW_TAGS)) {
    if ((tags as readonly string[]).includes(tag)) return `view/${vista}/components/`;
  }
  return null;
}
