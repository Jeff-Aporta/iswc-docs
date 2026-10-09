import{crearComponente as m,define as v,html as o}from"./_shared.js";import{extractJsonExample as l,jsonPretty as p,responseTone as w,toneToIsColor as j}from"../../js/openapi.js";import"./sw-json.js";function f(t){const a=t?.content??{},n=Object.keys(a),s=n.includes("application/json")?"application/json":n[0];if(!s)return"";const e=a[s],c=l(e);return c!==void 0?p(c):e.schema?p(e.schema):""}const u=m(import.meta.url,(t,{responses:a})=>{const n=Object.entries(a??{});if(!n.length){t.append(o`
        <iswc-callout color="neutral" variant="plain" icon="mdi:reply-outline">
          La operación no declara respuestas.
        </iswc-callout>
      `);return}t.append(o`
      <div class="lista">
        ${n.map(([s,e])=>{const c=j(w(s)),r=f(e),d=!!e?.content&&l(Object.values(e.content)[0])===void 0;return o`
            <iswc-details class="respuesta" variant="outlined" data-code="${s}">
              <div slot="summary" class="resumen">
                <iswc-tag color="${c}" variant="filled-outlined" class="codigo">${s}</iswc-tag>
                <span class="descripcion">${e?.description??""}</span>
              </div>
              ${r?o`
                    <div class="cuerpo">
                      <span class="etiqueta">${d?"Schema":"Ejemplo"}</span>
                      ${(()=>{const i=document.createElement("sw-json");return i.props={value:r,maxHeight:"20rem"},i})()}
                    </div>
                  `:o`<p class="sin-cuerpo">Sin cuerpo declarado.</p>`}
            </iswc-details>
          `})}
      </div>
    `)},{responses:null},"sw-responses");v("sw-responses",u);export{u as SwResponses};
