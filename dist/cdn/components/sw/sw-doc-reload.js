import{crearComponente as r,define as i,emitir as a,html as l}from"./_shared.js";const o=r(import.meta.url,(e,n,c)=>{e.append(l`
      <iswc-button
        class="btn"
        variant="plain"
        color="neutral"
        aria-label="Actualizar documentación"
        title="Actualizar desde el servidor (ignora cache local de 24 h)"
        oniswc-click=${()=>a(c,"sw-doc-reload",null)}
      >
        <iswc-icon icon="mdi:refresh"></iswc-icon>
      </iswc-button>
    `)},{},"sw-doc-reload");i("sw-doc-reload",o);export{o as SwDocReload};
