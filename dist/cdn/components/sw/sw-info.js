import{crearComponente as t,define as p,html as o}from"./_shared.js";import"./sw-doc.js";const i=t(import.meta.url,(l,{spec:r})=>{const n=r?.info;if(!n)return;const s=String(n.description??"").trim();let e=null;s&&(e=document.createElement("sw-doc"),e.props={markdown:s}),l.append(o`
      <header class="info">
        <div class="linea">
          <h1 class="titulo">${n.title??"API"}</h1>
          ${n.version?o`<span class="version">v${n.version}</span>`:null}
        </div>
        ${e?o`<div class="descripcion">${e}</div>`:null}
      </header>
    `)},{spec:null},"sw-info");p("sw-info",i);export{i as SwInfo};
