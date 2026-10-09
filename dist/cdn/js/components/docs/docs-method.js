import{crearComponente as m,define as s,html as a}from"../../base/componente.js";import{METHOD_COLOR as d}from"../../dominio/openapi.js";const t=m(import.meta.url,(e,{method:r})=>{const o=String(r??"").toLowerCase();e.append(a`
      <iswc-tag class="metodo" color="${d[o]??"neutral"}" variant="filled" data-method="${o}">
        ${o.toUpperCase()}
      </iswc-tag>
    `)},{method:"get"},"docs-method");s("docs-method",t);export{t as DocsMethod};
