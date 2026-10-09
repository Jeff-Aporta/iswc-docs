const n="sw-dialog-host-css",r=`
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
`;function a(){if(typeof document>"u"||document.getElementById(n))return;const t=document.createElement("style");t.id=n,t.textContent=r,document.head.appendChild(t)}function d(t){a();const e=document.createElement("iswc-dialog");e.setAttribute("label",t.label),e.setAttribute("light-dismiss",""),t.className&&e.classList.add(...t.className.split(/\s+/).filter(Boolean));const o=t.width||"min(52rem, calc(100vw - 2rem))";e.setAttribute("width",o),e.style.setProperty("--is-dialog-width",o),e.style.setProperty("--spacing","var(--is-dialog-spacing, 1.1rem)"),e.append(t.content),e.addEventListener("iswc-after-hide",s=>{s.target===e&&e.remove()}),document.body.appendChild(e);const i=e;return typeof i.show=="function"?i.show():i.open=!0,e}export{a as ensureDialogHostStyles,d as openHostDialog};
