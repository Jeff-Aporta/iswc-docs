const paginas = [
  { tag: "inicio", title: "Inicio", page: "paginas/inicio.html", icon: "mdi:home-variant-outline", category: "documentacion" },
  { tag: "porque", title: "Por qu\xE9 existe", page: "paginas/porque.html", icon: "mdi:help-circle-outline", category: "documentacion" },
  { tag: "comparativa", title: "Frente a Postman", page: "paginas/comparativa.html", icon: "mdi:compare-horizontal", category: "documentacion" },
  { tag: "stack", title: "El stack", page: "paginas/stack.html", icon: "mdi:layers-triple-outline", category: "documentacion" },
  { tag: "arquitectura", title: "Arquitectura", page: "paginas/arquitectura.html", icon: "mdi:sitemap-outline", category: "documentacion" },
  { tag: "estrategias", title: "Estrategias", page: "paginas/estrategias.html", icon: "mdi:chess-knight", category: "documentacion" },
  { tag: "empezar", title: "Empezar", page: "paginas/empezar.html", icon: "mdi:rocket-launch-outline", category: "documentacion" }
];
const componentes = [
  { tag: "docs-app", title: "Visor completo", page: "previews/docs-app.html", category: "shell" },
  { tag: "docs-method", title: "M\xE9todo", page: "previews/docs-method.html", category: "atomos" },
  { tag: "docs-path", title: "Ruta", page: "previews/docs-path.html", category: "atomos" },
  { tag: "docs-json", title: "JSON", page: "previews/docs-json.html", category: "atomos" },
  { tag: "docs-doc", title: "Markdown", page: "previews/docs-doc.html", category: "atomos" },
  { tag: "docs-params", title: "Par\xE1metros", page: "previews/docs-params.html", category: "operacion" },
  { tag: "docs-body", title: "Cuerpo", page: "previews/docs-body.html", category: "operacion" },
  { tag: "docs-responses", title: "Respuestas", page: "previews/docs-responses.html", category: "operacion" },
  { tag: "docs-try", title: "Probar", page: "previews/docs-try.html", category: "operacion" },
  { tag: "docs-operation", title: "Operaci\xF3n", page: "previews/docs-operation.html", category: "operacion" },
  { tag: "docs-tag-group", title: "Grupo de tag", page: "previews/docs-tag-group.html", category: "shell" },
  { tag: "docs-info", title: "Cabecera", page: "previews/docs-info.html", category: "shell" },
  { tag: "docs-home", title: "Portada", page: "previews/docs-home.html", category: "shell" },
  { tag: "docs-server", title: "Servidor", page: "previews/docs-server.html", category: "shell" },
  { tag: "docs-auth", title: "Sesi\xF3n", page: "previews/docs-auth.html", category: "shell" },
  { tag: "docs-export", title: "Descargas", page: "previews/docs-export.html", category: "shell" },
  { tag: "docs-doc-reload", title: "Actualizar documento", page: "previews/docs-doc-reload.html", category: "shell" },
  { tag: "docs-doc-actions", title: "Documento (pill)", page: "previews/docs-doc-actions.html", category: "shell" },
  { tag: "docs-nav", title: "Barra superior", page: "previews/docs-nav.html", category: "shell" },
  { tag: "docs-viewer", title: "Envoltura de drivers", page: "previews/docs-viewer.html", category: "shell" },
  { tag: "docs-driver-switch", title: "Selector de vista", page: "previews/docs-driver-switch.html", category: "shell" },
  { tag: "docs-layout", title: "Armaz\xF3n de 3 zonas", page: "previews/docs-layout.html", category: "shell" },
  { tag: "docs-minidoc", title: "Visor por vistas", page: "previews/docs-minidoc.html", category: "minidoc" },
  { tag: "docs-minidoc-view", title: "Ficha de operaci\xF3n", page: "previews/docs-minidoc-view.html", category: "minidoc" },
  { tag: "docs-minidoc-code", title: "Petici\xF3n y respuesta", page: "previews/docs-minidoc-code.html", category: "minidoc" }
];
const categorias = [
  { id: "documentacion", label: "Documentaci\xF3n" },
  { id: "atomos", label: "\xC1tomos" },
  { id: "operacion", label: "Operaci\xF3n" },
  { id: "shell", label: "Shell" },
  { id: "minidoc", label: "Driver minidoc" }
];
var stdin_default = [...paginas, ...componentes];
export {
  categorias,
  componentes,
  stdin_default as default,
  paginas
};
