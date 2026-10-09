import{crearComponente as m,define as a,html as s}from"./_shared.js";import{METHOD_COLOR as p}from"../../js/openapi.js";const o=m(import.meta.url,(e,{method:r})=>{const t=String(r??"").toLowerCase();e.append(s`
      <iswc-tag class="metodo" color="${p[t]??"neutral"}" variant="filled" data-method="${t}">
        ${t.toUpperCase()}
      </iswc-tag>
    `)},{method:"get"},"sw-method");a("sw-method",o);export{o as SwMethod};
