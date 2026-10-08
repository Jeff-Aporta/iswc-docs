/**
 * doc-kit.js — lo poco que las páginas documentales necesitan de JavaScript.
 *
 * Las páginas son HTML estático a propósito: son prosa, no aplicación. Este
 * módulo solo cablea la navegación, porque una página dentro del iframe no
 * puede cambiar el nav del shell por sí misma — tiene que pedírselo.
 *
 * Uso: `<script type="module" src="../doc-kit.js"></script>` y marcar los
 * enlaces con `data-ir-a="<tag>"`. Nada más.
 */

/** Pide al shell que navegue. Fuera del iframe, abre la página directamente. */
export function irA(tag: string): void {
  if (window.parent !== window) {
    parent.postMessage({ type: 'iswc-select', tag }, location.origin);
    return;
  }
  // Página abierta a pelo (pantalla completa): se resuelve contra el manifest.
  void navegarSuelto(tag);
}

async function navegarSuelto(tag: string): Promise<void> {
  try {
    const { default: catalogo } = await import('./manifest.js');
    const entrada = catalogo.find((c) => c.tag === tag);
    if (entrada) location.href = `../${entrada.page}${location.search}`;
  } catch {
    /* sin manifest no hay a dónde ir: se deja la página como está */
  }
}

/** Delegación única en el documento: sirve para enlaces añadidos después. */
document.addEventListener('click', (e: Event) => {
  const nodo = e.target instanceof Element ? e.target.closest('[data-ir-a]') : null;
  if (!nodo) return;
  e.preventDefault();
  irA(nodo.getAttribute('data-ir-a') ?? '');
});

/**
 * Teclado: los enlaces-tarjeta son `<button>`, así que Enter y Espacio ya
 * funcionan solos. Esto solo cubre los `<a>` sin `href` que se usan como
 * enlace interno, para que no queden fuera del foco.
 */
for (const nodo of document.querySelectorAll<HTMLAnchorElement>('a[data-ir-a]:not([href])')) {
  nodo.setAttribute('role', 'link');
  nodo.tabIndex = 0;
  nodo.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    irA(nodo.getAttribute('data-ir-a') ?? '');
  });
}
