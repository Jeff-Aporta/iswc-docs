import{crearComponente as $,define as h,html as t,emitir as g}from"./_shared.js";import{paramEnum as v,paramInputMode as w,paramTypeLabel as b,sanitizeParamInputValue as f}from"../../js/param-schema.js";function S(e,s,o,c){const i=String(e.name??""),m=b(e.schema),r=[e.description,m&&`\xB7 ${m}`].filter(Boolean).join(" "),u=v(e.schema);if(u.length)return t`
      <iswc-select
        class="campo"
        full-width
        label="${i}"
        hint="${r}"
        value="${s}"
        ${o?"disabled":""}
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
      inputmode="${w(e.schema)}"
      value="${s}"
      ${o?"disabled":""}
      ${e.required?"required":""}
      oniswc-input=${n=>{const l=n.target,p=f(e.schema,l.value);p!==l.value&&(l.value=p),c(p)}}
    ></iswc-input>
  `}const d=$(import.meta.url,(e,{params:s,values:o,disabled:c,titulo:i},m)=>{const r=Array.isArray(s)?s.filter(a=>a?.name):[];if(!r.length)return;const u=a=>n=>g(m,"sw-param-change",{name:a,value:n});e.append(t`
      <section class="bloque">
        ${i?t`<h4 class="titulo">${i}</h4>`:null}
        <div class="campos">
          ${r.map(a=>{const n=String(a.name),l=a.in&&a.in!=="path"?t`<span class="ubicacion">${a.in}</span>`:null;return t`
              <div class="fila" data-in="${a.in??""}">
                ${S(a,o?.[n]??"",c,u(n))}
                ${l}
              </div>
            `})}
        </div>
      </section>
    `)},{params:[],values:{},disabled:!1,titulo:""},"sw-params");h("sw-params",d);export{d as SwParams};
