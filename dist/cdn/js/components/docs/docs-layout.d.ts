/**
 * <docs-layout> — el armazón de tres zonas del visor: índice · contenido · código.
 *
 * Existe como componente y no como CSS dentro de `docs-minidoc` porque no es solo una rejilla:
 * tiene comportamiento propio —dos divisores arrastrables y dos umbrales de colapso— y ese
 * comportamiento no debe reimplementarse cada vez que un driver quiera esta forma.
 *
 * Se usa por slots:
 *
 *   <docs-layout>
 *     <div slot="cabecera">…</div>
 *     <nav slot="inicio">…</nav>
 *     <main slot="centro">…</main>
 *     <aside slot="fin">…</aside>
 *   </docs-layout>
 *
 * Los dos laterales quedan **pegados a los bordes** de la ventana: el ancho lo administra el
 * usuario arrastrando, y quitarle sitio con márgenes contradice eso.
 *
 * Colapso escalonado, y en este orden a propósito: primero se va el panel de código y después
 * el índice. El código es consulta —lo miras cuando vas a integrar—, mientras que el índice es
 * navegación: sin él no se puede ni cambiar de endpoint. El que estorba primero es el otro.
 */
declare class DocsLayout extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    /** Abre el lateral que esté en modo cajón. */
    abrir(lado: 'inicio' | 'fin'): void;
}
export { DocsLayout };
