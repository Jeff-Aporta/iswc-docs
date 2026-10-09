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
