import{crearComponente as m,define as v,html as o}from"./_shared.js";import{extractJsonExample as l,jsonPretty as p,responseTone as j,toneToIsColor as f}from"../../js/openapi.js";import"./docs-json.js";function $(t){const c=t?.content??{},n=Object.keys(c),s=n.includes("application/json")?"application/json":n[0];if(!s)return"";const e=c[s],a=l(e);return a!==void 0?p(a):e.schema?p(e.schema):""}const d=m(import.meta.url,(t,{responses:c})=>{const n=Object.entries(c??{});if(!n.length){t.append(o`
        <iswc-callout color="neutral" variant="plain" icon="mdi:reply-outline">
          La operación no declara respuestas.
        </iswc-callout>
      `);return}t.append(o`
      <div class="lista">
        ${n.map(([s,e])=>{const a=f(j(s)),r=$(e),u=!!e?.content&&l(Object.values(e.content)[0])===void 0;return o`
            <iswc-details class="respuesta" variant="outlined" data-code="${s}">
              <div slot="summary" class="resumen">
                <iswc-tag color="${a}" variant="filled-outlined" class="codigo">${s}</iswc-tag>
                <span class="descripcion">${e?.description??""}</span>
              </div>
              ${r?o`
                    <div class="cuerpo">
                      <span class="etiqueta">${u?"Schema":"Ejemplo"}</span>
                      ${(()=>{const i=document.createElement("docs-json");return i.props={value:r,maxHeight:"20rem"},i})()}
                    </div>
                  `:o`<p class="sin-cuerpo">Sin cuerpo declarado.</p>`}
            </iswc-details>
          `})}
      </div>
    `)},{responses:null},"docs-responses");v("docs-responses",d);export{d as DocsResponses};
