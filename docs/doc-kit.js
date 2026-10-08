function irA(tag) {
  if (window.parent !== window) {
    parent.postMessage({ type: "iswc-select", tag }, location.origin);
    return;
  }
  void navegarSuelto(tag);
}
async function navegarSuelto(tag) {
  try {
    const { default: catalogo } = await import("./manifest.js");
    const entrada = catalogo.find((c) => c.tag === tag);
    if (entrada) location.href = `../${entrada.page}${location.search}`;
  } catch {
  }
}
document.addEventListener("click", (e) => {
  const nodo = e.target instanceof Element ? e.target.closest("[data-ir-a]") : null;
  if (!nodo) return;
  e.preventDefault();
  irA(nodo.getAttribute("data-ir-a") ?? "");
});
for (const nodo of document.querySelectorAll("a[data-ir-a]:not([href])")) {
  nodo.setAttribute("role", "link");
  nodo.tabIndex = 0;
  nodo.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    irA(nodo.getAttribute("data-ir-a") ?? "");
  });
}
export {
  irA
};
