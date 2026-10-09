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

import { setCssBase } from './_shared.js';

setCssBase(new URL('./components/docs/', import.meta.url).href);

await import('./docs-method.js');
await import('./docs-path.js');
await import('./docs-json.js');
await import('./docs-doc.js');
await import('./docs-home.js');
await import('./docs-params.js');
await import('./docs-body.js');
await import('./docs-responses.js');
await import('./docs-try.js');
await import('./docs-operation.js');
await import('./docs-tag-group.js');
await import('./docs-info.js');
await import('./docs-server.js');
await import('./docs-auth.js');
await import('./docs-export.js');
await import('./docs-doc-reload.js');
await import('./docs-doc-actions.js');
await import('./docs-nav.js');
await import('./docs-app.js');

// Segundo driver: mismo documento, presentación por vistas. Se registra junto al de acordeones
// para que una página pueda montar cualquiera de los dos sin pedir otro bundle.
await import('./docs-minidoc-code.js');
await import('./docs-minidoc-view.js');
await import('./docs-minidoc.js');

// Armazon de tres zonas y selector de presentacion, compartidos por los dos drivers.
await import('./docs-layout.js');
await import('./docs-driver-switch.js');

// Envoltura que monta uno u otro.
await import('./docs-viewer.js');
