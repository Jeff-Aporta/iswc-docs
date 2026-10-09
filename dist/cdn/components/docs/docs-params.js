import{crearComponente as $,define as h,html as t,emitir as g}from"./_shared.js";import{paramEnum as v,paramInputMode as b,paramTypeLabel as f,sanitizeParamInputValue as w}from"../../js/param-schema.js";function P(e,s,l,c){const i=String(e.name??""),m=f(e.schema),r=[e.description,m&&`\xB7 ${m}`].filter(Boolean).join(" "),u=v(e.schema);if(u.length)return t`
      <iswc-select
        class="campo"
        full-width
        label="${i}"
        hint="${r}"
        value="${s}"
        ${l?"disabled":""}
        ${e.required?"required":""}
        oniswc-change=${n=>c(String(n.target.value??""))}
      >
        ${u.map(n=>t`<iswc-option value="${n}">${n}</iswc-option>`)}
      </iswc-select>
    `;const a=e.example!=null?String(e.example):i;return t`
    <iswc-input
      class="campo"
      full-width
      clearable
      label="${i}"
      hint="${r}"
      placeholder="${a}"
      inputmode="${b(e.schema)}"
      value="${s}"
      ${l?"disabled":""}
      ${e.required?"required":""}
      oniswc-input=${n=>{const o=n.target,p=w(e.schema,o.value);p!==o.value&&(o.value=p),c(p)}}
    ></iswc-input>
  `}const d=$(import.meta.url,(e,{params:s,values:l,disabled:c,titulo:i},m)=>{const r=Array.isArray(s)?s.filter(a=>a?.name):[];if(!r.length)return;const u=a=>n=>g(m,"docs-param-change",{name:a,value:n});e.append(t`
      <section class="bloque">
        ${i?t`<h4 class="titulo">${i}</h4>`:null}
        <div class="campos">
          ${r.map(a=>{const n=String(a.name),o=a.in&&a.in!=="path"?t`<span class="ubicacion">${a.in}</span>`:null;return t`
              <div class="fila" data-in="${a.in??""}">
                ${P(a,l?.[n]??"",c,u(n))}
                ${o}
              </div>
            `})}
        </div>
      </section>
    `)},{params:[],values:{},disabled:!1,titulo:""},"docs-params");h("docs-params",d);export{d as DocsParams};
