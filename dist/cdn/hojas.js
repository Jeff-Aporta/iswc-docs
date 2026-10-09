(() => {
  (function() {
    var soporta = false;
    try {
      soporta = "adoptedStyleSheets" in ShadowRoot.prototype && typeof new CSSStyleSheet().replaceSync === "function";
    } catch (e) {
      soporta = false;
    }
    if (!soporta) return;
    var hojas = /* @__PURE__ */ new Map();
    var cargas = /* @__PURE__ */ new Map();
    globalThis.__docsHojas = { hojas, cargas };
    function descargar(href) {
      var enCurso = cargas.get(href);
      if (enCurso) return enCurso;
      var carga = fetch(href).then(function(r) {
        if (!r.ok) throw new Error(r.status + " " + href);
        return r.text();
      }).then(function(texto) {
        var hoja = new CSSStyleSheet();
        hoja.replaceSync(texto);
        hojas.set(href, hoja);
        return hoja;
      }).catch(function() {
        return null;
      });
      cargas.set(href, carga);
      return carga;
    }
    function adoptar(shadow, hoja) {
      if (shadow.adoptedStyleSheets.indexOf(hoja) === -1) {
        shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.concat(hoja);
      }
    }
    function hrefDeHoja(nodo) {
      if (!nodo || nodo.nodeType !== 1) return "";
      var link = nodo;
      if (link.tagName !== "LINK") return "";
      if (link.rel !== "stylesheet" || !link.href) return "";
      return link.href;
    }
    var prependOriginal = ShadowRoot.prototype.prepend;
    ShadowRoot.prototype.prepend = function() {
      var restantes = [];
      for (var i = 0; i < arguments.length; i++) {
        var nodo = arguments[i];
        var href = hrefDeHoja(nodo);
        if (!href) {
          restantes.push(nodo);
          continue;
        }
        var hoja = hojas.get(href);
        if (hoja) {
          adoptar(this, hoja);
          continue;
        }
        restantes.push(nodo);
        descargar(href);
      }
      if (restantes.length) prependOriginal.apply(this, restantes);
    };
  })();
})();
