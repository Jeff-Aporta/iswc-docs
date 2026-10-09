/**
 * all.ts — barril de los componentes `docs-*`.
 *
 * Solo lo usa el build para producir `dist/cdn/all.min.js`: un único
 * `<script type="module">` en lugar de listar cada archivo. El CSS **no** entra
 * en el bundle; cada componente lo sigue pidiendo desde `dist/cdn/components/docs/<tag>.css`,
 * así que ese directorio tiene que estar publicado.
 *
 * El `setCssBase` va primero y en su propia sentencia: dentro del bundle todos los módulos
 * comparten `import.meta.url`, que apunta a `all.min.js` en la raíz del CDN, y sin fijar la
 * base los componentes buscarían sus hojas en `dist/cdn/` en vez de en `components/docs/`.
 * Los `import` se ejecutan en orden, así que la base queda puesta antes de que ningún
 * componente registre su tag y precargue su hoja.
 */
export {};
