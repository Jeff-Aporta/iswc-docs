/**
 * kit-tags.ts — tags `is-*` que el visor carga con el loader del kit.
 *
 * Fuente de verdad para hosts (ISS PatyIA, demos, Pages): se publica en
 * `dist/cdn/js/kit-tags.js` y se importa antes de `L.load(...SW_KIT_TAGS)`.
 *
 * Si un `sw-*` empieza a usar otro tag del kit, añadirlo **aquí** (y en LLM.md).
 * No duplicar la lista en el host: sin el tag el custom element no hace upgrade.
 */
export declare const SW_KIT_TAGS: readonly ["iswc-button", "iswc-button-group", "iswc-copy-button", "iswc-dropdown", "iswc-dropdown-item", "iswc-checkbox", "iswc-input", "iswc-option", "iswc-select", "iswc-textarea", "iswc-file-input", "iswc-spinner", "iswc-tag", "iswc-theme-toggle", "iswc-toast", "iswc-format-bytes", "iswc-format-date", "iswc-format-number", "iswc-relative-time", "iswc-callout", "iswc-details", "iswc-dialog", "iswc-divider", "iswc-drawer", "iswc-split-panel", "iswc-icon", "iswc-code", "iswc-md-render", "iswc-flowchart", "iswc-sequence-diagram", "iswc-er-diagram", "iswc-diagram-lightbox"];
export type SwKitTag = (typeof SW_KIT_TAGS)[number];
