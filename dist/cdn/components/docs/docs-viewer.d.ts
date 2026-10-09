/**
 * <docs-viewer> — monta el driver elegido y deja cambiarlo en caliente.
 *
 * El anfitrión ISS quema el documento en el atributo `doc` (JSON completo).
 * `conn` queda solo para demos / `?conn=`; PatyIA no lo usa.
 */
import type { DocsConn } from '../../js/conn.js';
import { type DocsDriver } from '../../js/driver.js';
import './docs-app.js';
import './docs-minidoc.js';
declare class DocsViewer extends HTMLElement {
    #private;
    constructor();
    /** Conn del anfitrión. Se ignora si también hay `doc`. */
    get conn(): DocsConn | null;
    set conn(v: DocsConn | null);
    /** Documento InSoft/OpenAPI quemado (`doc=`). Si llega, `conn` se ignora. */
    get doc(): unknown;
    set doc(v: unknown);
    get driver(): DocsDriver['id'];
    set driver(v: DocsDriver['id']);
    connectedCallback(): void;
}
export { DocsViewer };
