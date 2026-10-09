/**
 * driver.ts — qué presentación del visor está activa.
 *
 * El visor tiene dos drivers (`docs-app` y `docs-minidoc`) que leen el mismo documento y lo pintan
 * distinto. Cuál se usa es una preferencia del lector, no del documento, así que vive fuera de
 * los dos: si la guardara uno de ellos, el otro no podría leerla sin depender de su hermano.
 *
 * Se persiste en dos sitios, y el orden importa:
 *
 *   1. `driver` dentro de `?s=` — para que un enlace compartido llegue con la vista que se quiso
 *      enseñar. Manda sobre la preferencia guardada: quien comparte decide.
 *   2. `localStorage` — para que la elección sobreviva a recargar sin ensuciar la URL de quien
 *      no la ha tocado nunca.
 *
 * El param plano `?driver=` es legado: se migra a `?s=` al leer/escribir.
 */
export declare const PARAM_DRIVER = "driver";
export type DocsDriver = {
    /** Tag del custom element que monta este driver. */
    id: 'docs-app' | 'docs-minidoc';
    label: string;
    /** Una línea para el `title` del selector: qué gana quien lo elige. */
    detalle: string;
};
export declare const DRIVERS: readonly DocsDriver[];
export declare const DRIVER_DEFAULT: DocsDriver['id'];
/** `true` si el valor es uno de los drivers registrados. */
export declare function esDriver(v: unknown): v is DocsDriver['id'];
export declare function driverMeta(id: string): DocsDriver;
/** Driver activo: `?s=.driver`, luego preferencia guardada, luego el de por defecto. */
export declare function readDriver(): DocsDriver['id'];
/**
 * Fija el driver activo en `?s=` y en la preferencia guardada.
 *
 * Usa `replaceState`: cambiar de presentación no es navegar, y meterlo en el historial obligaría
 * a pulsar «atrás» dos veces para volver a la página anterior.
 */
export declare function writeDriver(id: string): void;
