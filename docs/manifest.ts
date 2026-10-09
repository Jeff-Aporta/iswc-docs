/**
 * manifest.js — catálogo del sitio documental.
 *
 * Única fuente de verdad: el shell (`index.html`) pinta el nav desde aquí y
 * cada entrada apunta a su página. Hay dos clases de entrada y se mantienen
 * separadas a propósito:
 *
 *   `paginas`     → documentación en prosa: por qué existe, stack, estrategias,
 *                   arquitectura, comparativa. Se leen en orden.
 *   `componentes` → un `docs-*` cada uno, con sus casos en vivo. Se consultan.
 *
 * Añadir un `docs-*` sin entrada en `componentes` lo deja fuera del sitio;
 * `tests/estructura.test.mjs` avisa si eso pasa, y también si una entrada
 * apunta a una página que no existe en disco.
 */

/** Documentación en prosa. El orden del array es el orden de lectura. */
export const paginas = [
  { tag: 'inicio', title: 'Inicio', page: 'paginas/inicio.html', icon: 'mdi:home-variant-outline', category: 'documentacion' },
  { tag: 'porque', title: 'Por qué existe', page: 'paginas/porque.html', icon: 'mdi:help-circle-outline', category: 'documentacion' },
  { tag: 'comparativa', title: 'Frente a Postman', page: 'paginas/comparativa.html', icon: 'mdi:compare-horizontal', category: 'documentacion' },
  { tag: 'stack', title: 'El stack', page: 'paginas/stack.html', icon: 'mdi:layers-triple-outline', category: 'documentacion' },
  { tag: 'arquitectura', title: 'Arquitectura', page: 'paginas/arquitectura.html', icon: 'mdi:sitemap-outline', category: 'documentacion' },
  { tag: 'estrategias', title: 'Estrategias', page: 'paginas/estrategias.html', icon: 'mdi:chess-knight', category: 'documentacion' },
  { tag: 'empezar', title: 'Empezar', page: 'paginas/empezar.html', icon: 'mdi:rocket-launch-outline', category: 'documentacion' },
];

/** Un `docs-*` por entrada. `category` agrupa el nav. */
export const componentes = [
  { tag: 'docs-app', title: 'Visor completo', page: 'previews/docs-app.html', category: 'shell' },

  { tag: 'docs-method', title: 'Método', page: 'previews/docs-method.html', category: 'atomos' },
  { tag: 'docs-path', title: 'Ruta', page: 'previews/docs-path.html', category: 'atomos' },
  { tag: 'docs-json', title: 'JSON', page: 'previews/docs-json.html', category: 'atomos' },
  { tag: 'docs-doc', title: 'Markdown', page: 'previews/docs-doc.html', category: 'atomos' },

  { tag: 'docs-params', title: 'Parámetros', page: 'previews/docs-params.html', category: 'operacion' },
  { tag: 'docs-body', title: 'Cuerpo', page: 'previews/docs-body.html', category: 'operacion' },
  { tag: 'docs-responses', title: 'Respuestas', page: 'previews/docs-responses.html', category: 'operacion' },
  { tag: 'docs-try', title: 'Probar', page: 'previews/docs-try.html', category: 'operacion' },
  { tag: 'docs-operation', title: 'Operación', page: 'previews/docs-operation.html', category: 'operacion' },

  { tag: 'docs-tag-group', title: 'Grupo de tag', page: 'previews/docs-tag-group.html', category: 'shell' },
  { tag: 'docs-info', title: 'Cabecera', page: 'previews/docs-info.html', category: 'shell' },
  { tag: 'docs-home', title: 'Portada', page: 'previews/docs-home.html', category: 'shell' },
  { tag: 'docs-server', title: 'Servidor', page: 'previews/docs-server.html', category: 'shell' },
  { tag: 'docs-auth', title: 'Sesión', page: 'previews/docs-auth.html', category: 'shell' },
  { tag: 'docs-export', title: 'Descargas', page: 'previews/docs-export.html', category: 'shell' },
  { tag: 'docs-doc-reload', title: 'Actualizar documento', page: 'previews/docs-doc-reload.html', category: 'shell' },
  { tag: 'docs-doc-actions', title: 'Documento (pill)', page: 'previews/docs-doc-actions.html', category: 'shell' },
  { tag: 'docs-nav', title: 'Barra superior', page: 'previews/docs-nav.html', category: 'shell' },

  { tag: 'docs-viewer', title: 'Envoltura de drivers', page: 'previews/docs-viewer.html', category: 'shell' },
  { tag: 'docs-driver-switch', title: 'Selector de vista', page: 'previews/docs-driver-switch.html', category: 'shell' },
  { tag: 'docs-layout', title: 'Armazón de 3 zonas', page: 'previews/docs-layout.html', category: 'shell' },

  { tag: 'docs-minidoc', title: 'Visor por vistas', page: 'previews/docs-minidoc.html', category: 'minidoc' },
  { tag: 'docs-minidoc-view', title: 'Ficha de operación', page: 'previews/docs-minidoc-view.html', category: 'minidoc' },
  { tag: 'docs-minidoc-code', title: 'Petición y respuesta', page: 'previews/docs-minidoc-code.html', category: 'minidoc' },
];

/** Orden y etiqueta de los grupos del nav. */
export const categorias = [
  { id: 'documentacion', label: 'Documentación' },
  { id: 'atomos', label: 'Átomos' },
  { id: 'operacion', label: 'Operación' },
  { id: 'shell', label: 'Shell' },
  { id: 'minidoc', label: 'Driver minidoc' },
];

export default [...paginas, ...componentes];
