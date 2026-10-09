/**
 * hojas.ts — caché de hojas de estilo compartida por todos los shadow roots.
 *
 * Segundo script plano del proyecto, y por el mismo motivo que `boot.ts`: el
 * build lo transpila a script clásico para que corra síncrono en `<head>`,
 * antes del kit `is-*` del CDN. Si llegara después, los componentes del kit ya
 * habrían construido su shadow.
 *
 * ## El problema
 *
 * Un `<link rel="stylesheet">` dentro de un ShadowRoot **no** bloquea el
 * pintado de ese shadow. El navegador pinta los hijos sin estilos y los vuelve
 * a pintar cuando resuelve la hoja — también si viene del caché HTTP, porque
 * cargar un `<link>` nunca es síncrono. Con un shadow root eso no se nota; al
 * cambiar de sección se destruyen y recrean decenas (cada `iswc-icon`,
 * `iswc-details`, `iswc-button`, `iswc-tag` de la lista) y se ve la vista entera
 * desordenarse durante un frame y recolocarse. Es el flicker que se reporta.
 *
 * El kit `is-*` enlaza dos hojas por componente (`scrollbars.css` y la suya) y
 * lo hace con `shadow.prepend(...)`. Viene del CDN: no se puede tocar su
 * fuente, pero sí el punto por el que pasa.
 *
 * ## La solución
 *
 * Se envuelve `ShadowRoot.prototype.prepend` y se cambian esos `<link>` por la
 * misma `CSSStyleSheet` construida, ya descargada, vía `adoptedStyleSheets`:
 * una hoja construida se aplica de forma síncrona, en el mismo frame, y no
 * vuelve a tocar la red.
 *
 * La **primera** vez que aparece un href se deja pasar el `<link>` tal cual y
 * solo se dispara la descarga en paralelo: así ningún componente puede quedar
 * sin estilos por culpa de esta capa, ni siquiera si el `fetch` falla. A
 * partir de la segunda —es decir, en todo repintado— ya se adopta la hoja.
 *
 * Los componentes `docs-*` usan `adoptCss` de `_shared.ts`, que comparte estos
 * mismos mapas por `window.__docsHojas` para no descargar dos veces cada hoja.
 */
(function () {
  var soporta = false;
  try {
    soporta = 'adoptedStyleSheets' in ShadowRoot.prototype && typeof new CSSStyleSheet().replaceSync === 'function';
  } catch (e) {
    soporta = false;
  }
  if (!soporta) return;

  /** href absoluto → hoja construida. */
  var hojas = new Map<string, CSSStyleSheet>();
  /** href absoluto → descarga en curso: N shadow roots no piden N veces. */
  var cargas = new Map<string, Promise<CSSStyleSheet | null>>();

  // `_shared.ts` reusa estos mapas si existen. Un solo caché para el kit y
  // para los `docs-*`: sin esto cada capa pediría por su cuenta la misma hoja.
  // `globalThis` y no `window` porque es lo que lee `_shared.ts`; en el
  // navegador son el mismo objeto.
  (globalThis as Record<string, unknown>).__docsHojas = { hojas: hojas, cargas: cargas };

  function descargar(href: string): Promise<CSSStyleSheet | null> {
    var enCurso = cargas.get(href);
    if (enCurso) return enCurso;

    var carga = fetch(href)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + href);
        return r.text();
      })
      .then(function (texto) {
        var hoja = new CSSStyleSheet();
        hoja.replaceSync(texto);
        hojas.set(href, hoja);
        return hoja;
      })
      .catch(function () {
        // Sin hoja construida se siguen enlazando `<link>`: se pierde la ruta
        // rápida, no los estilos.
        return null;
      });

    cargas.set(href, carga);
    return carga;
  }

  function adoptar(shadow: ShadowRoot, hoja: CSSStyleSheet): void {
    if (shadow.adoptedStyleSheets.indexOf(hoja) === -1) {
      shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.concat(hoja);
    }
  }

  /** href absoluto si el nodo es una hoja enlazada; cadena vacía si no. */
  function hrefDeHoja(nodo: Node | null | undefined): string {
    // Los tres accesos siguientes solo son validos tras confirmar que es un
    // <link>, y eso es justo lo que comprueba la primera linea; el estrechado
    // se hace explicito para que el tipo lo acompane.
    if (!nodo || nodo.nodeType !== 1) return '';
    var link = nodo as HTMLLinkElement;
    if (link.tagName !== 'LINK') return '';
    if (link.rel !== 'stylesheet' || !link.href) return '';
    return link.href;
  }

  var prependOriginal = ShadowRoot.prototype.prepend;

  ShadowRoot.prototype.prepend = function () {
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
        // Hoja ya construida: se adopta en el acto y el `<link>` sobra.
        adoptar(this, hoja);
        continue;
      }

      // Primera aparición de este href: el `<link>` se queda y cubre el hueco
      // mientras baja el texto. Los siguientes shadow roots ya la adoptan.
      restantes.push(nodo);
      descargar(href);
    }

    if (restantes.length) prependOriginal.apply(this, restantes);
  };
})();
