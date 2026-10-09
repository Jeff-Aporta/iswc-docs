/**
 * Estilos del host light-DOM para diálogos del visor (`iswc-dialog` montado en body).
 * El CSS de `app.css` no llega al embed de PatyIA; se inyecta una sola vez.
 */

const STYLE_ID = 'sw-dialog-host-css';

const CSS = /* css */ `
  .sw-confirmar-texto {
    margin: 0 0 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--is-text, #e6edf3);
  }
  .sw-confirmar-url {
    display: block;
    margin: 0 0 0.25rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--is-border-soft, var(--is-border, #1f242b));
    border-radius: 0.5rem;
    background: var(--iswc-code-bg, #0f1318);
    color: var(--is-text, #e6edf3);
    font-family: var(--is-font-mono, ui-monospace, "Cascadia Code", Menlo, monospace);
    font-size: 0.75rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .sw-confirmar-acciones {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    width: 100%;
  }
  iswc-dialog.sw-dialog-try,
  iswc-dialog.sw-dialog-confirm {
    --is-dialog-width: min(52rem, calc(100vw - 2rem));
    --is-dialog-spacing: 1.1rem;
    --spacing: var(--is-dialog-spacing);
  }
  iswc-dialog.sw-dialog-try sw-try {
    display: block;
    min-width: 0;
  }
`;

export function ensureDialogHostStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Monta un `iswc-dialog` en `document.body` con ancho usable y estilos de confirmación. */
export function openHostDialog(opts: { label: string; className?: string; content: Node | DocumentFragment; width?: string; }): HTMLElement {
  ensureDialogHostStyles();
  const dlg = document.createElement('iswc-dialog');
  dlg.setAttribute('label', opts.label);
  dlg.setAttribute('light-dismiss', '');
  if (opts.className) dlg.classList.add(...opts.className.split(/\s+/).filter(Boolean));
  const width = opts.width || 'min(52rem, calc(100vw - 2rem))';
  dlg.setAttribute('width', width);
  dlg.style.setProperty('--is-dialog-width', width);
  dlg.style.setProperty('--spacing', 'var(--is-dialog-spacing, 1.1rem)');
  dlg.append(opts.content);
  // Solo el propio iswc-dialog puede cerrarse: tooltips/dropdowns anidados emiten iswc-hide composed.
  dlg.addEventListener('iswc-after-hide', (e: Event) => {
    if (e.target !== dlg) return;
    dlg.remove();
  });
  document.body.appendChild(dlg);
  const el = dlg as HTMLElement & { open?: boolean; show?: () => void };
  if (typeof el.show === 'function') el.show();
  else el.open = true;
  return dlg;
}
