/**
 * tk-diagrama2webcomponents.ts — JSON nativo del kit → etiquetas de is-webcomponents.
 *
 * Hermana de `tk-diagrama2mmd`: misma entrada, otra salida. Mermaid sirve para GitHub, que no
 * ejecuta JavaScript; esto sirve para un visor propio, donde el kit dibuja el diagrama de verdad
 * — con sus grupos, colores y el `open-on-click`.
 *
 * Traduce mejor que Mermaid en dos sentidos: no pierde nada por el camino (el JSON viaja entero
 * dentro del componente) y cubre motores que Mermaid no tiene, como el Venn.
 *
 * El `engine` del documento ES el nombre de la etiqueta, así que no hay tabla que mantener: lo
 * que el kit sepa pintar, esto lo emite.
 */
/** Módulo y hoja del kit que hace falta para un motor. El kit no publica bundle único. */
export declare function activosDe(engine: string): {
    js: string;
    css: string;
} | null;
/**
 * Documento de diagrama → etiqueta del kit lista para insertar.
 * Devuelve '' si el motor no se reconoce, igual que hace la versión Mermaid.
 */
export declare function diagramaTk2webcomponent(doc: any, opciones?: {}): string;
/** Motores presentes en un conjunto de documentos: para cargar solo lo que se usa. */
export declare function motoresUsados(docs: any): unknown[];
