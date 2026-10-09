/**
 * Estilos del host light-DOM para diálogos del visor (`iswc-dialog` montado en body).
 * El CSS de `app.css` no llega al embed de PatyIA; se inyecta una sola vez.
 */
export declare function ensureDialogHostStyles(): void;
/** Monta un `iswc-dialog` en `document.body` con ancho usable y estilos de confirmación. */
export declare function openHostDialog(opts: {
    label: string;
    className?: string;
    content: Node | DocumentFragment;
    width?: string;
}): HTMLElement;
