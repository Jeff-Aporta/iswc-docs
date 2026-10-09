import{crearComponente as r,define as i,emitir as a,html as l}from"./_shared.js";const o=r(import.meta.url,(c,n,e)=>{c.append(l`
      <iswc-button
        class="btn"
        variant="plain"
        color="neutral"
        aria-label="Actualizar documentación"
        title="Actualizar desde el servidor (ignora cache local de 24 h)"
        oniswc-click=${()=>a(e,"docs-doc-reload",null)}
      >
        <iswc-icon icon="mdi:refresh"></iswc-icon>
      </iswc-button>
    `)},{},"docs-doc-reload");i("docs-doc-reload",o);export{o as DocsDocReload};
