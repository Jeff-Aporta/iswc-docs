import{crearComponente as r,define as t,html as e}from"./_shared.js";import"./docs-doc.js";const i=r(import.meta.url,(c,{spec:l})=>{const n=l?.info;if(!n)return;const s=String(n.description??"").trim();let o=null;s&&(o=document.createElement("docs-doc"),o.props={markdown:s}),c.append(e`
      <header class="info">
        <div class="linea">
          <h1 class="titulo">${n.title??"API"}</h1>
          ${n.version?e`<span class="version">v${n.version}</span>`:null}
        </div>
        ${o?e`<div class="descripcion">${o}</div>`:null}
      </header>
    `)},{spec:null},"docs-info");t("docs-info",i);export{i as DocsInfo};
