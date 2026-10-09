/**
 * <docs-auth> — sesión JWT: chip de estado, diálogo de login y pegado de token.
 *
 * Pegar un JWT a mano está al mismo nivel que iniciar sesión, no escondido:
 * en desarrollo se prueba a menudo con un token que ya se tiene, y forzar el
 * login contra el orquestador para eso es fricción sin ninguna ganancia.
 *
 * Props: { authEnabled, auth, session }
 * Evento: docs-session-change  detail: { session }
 */
type Props = {
    authEnabled: boolean;
    auth: DocsAuthConfig;
    session: DocsSesion | null;
};
declare class DocsAuth extends HTMLElement {
    #private;
    constructor();
    connectedCallback(): void;
    get props(): Props;
    set props(v: Partial<Props> | null | undefined);
    /** Punto de entrada público: `docs-app` lo llama cuando una operación pide JWT. */
    abrirLogin(hint?: string): void;
}
export { DocsAuth };
