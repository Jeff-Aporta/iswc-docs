/**
 * boot.ts — tema y paleta antes del primer pintado.
 *
 * Uno de los dos scripts planos del proyecto (con `hojas.ts`): el build lo
 * transpila a un script clásico, no a un módulo, porque corre síncrono en
 * <head> antes de que exista ningún módulo. Diferirlo haría que la página
 * parpadeara en claro antes de aplicar el tema.
 *
 * Precedencia: `?s=` (enlace compartido) → localStorage → dark.
 * `prefers-color-scheme` NO participa: el tema es explícito, igual que en el
 * kit is-*, para que un enlace compartido se vea igual en cualquier equipo.
 */
(function () {
  var TEMAS: Record<string, 1 | undefined> = { dark: 1, light: 1 };
  var raiz = document.documentElement;
  var tema: string | null = null;
  var paleta = 'contapyme';

  var s = new URLSearchParams(location.search).get('s');
  if (s) {
    try {
      var pad = s.replace(/-/g, '+').replace(/_/g, '/');
      while (pad.length % 4) pad += '=';
      var estado = JSON.parse(decodeURIComponent(escape(atob(pad))));
      if (TEMAS[estado.theme]) tema = estado.theme;
      if (estado.palette) paleta = String(estado.palette);
    } catch (e) {
      /* `?s=` corrupto: se ignora y se sigue con el tema guardado */
    }
  }

  if (!tema) {
    try {
      var guardado = localStorage.getItem('is-theme');
      if (guardado && TEMAS[guardado]) tema = guardado;
    } catch (e) {
      /* almacenamiento bloqueado */
    }
  }

  tema = tema || 'dark';

  raiz.classList.toggle('theme-dark', tema === 'dark');
  raiz.classList.toggle('theme-light', tema === 'light');
  raiz.dataset.theme = tema;
  raiz.dataset.palette = paleta;

  // <iswc-theme-toggle> escribe sobre <html>; se persiste para la próxima visita.
  new MutationObserver(function () {
    try {
      localStorage.setItem('is-theme', raiz.dataset.theme || 'dark');
    } catch (e) {
      /* almacenamiento bloqueado */
    }
  }).observe(raiz, { attributes: true, attributeFilter: ['data-theme'] });
})();
