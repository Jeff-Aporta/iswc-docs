import{crearComponente as m,define as v,html as o}from"./_shared.js";import{extractJsonExample as l,jsonPretty as p,responseTone as j,toneToIsColor as f}from"../../js/openapi.js";import"./sw-json.js";function $(t){const a=t?.content??{},n=Object.keys(a),s=n.includes("application/json")?"application/json":n[0];if(!s)return"";const e=a[s],r=l(e);return r!==void 0?p(r):e.schema?p(e.schema):""}const u=m(import.meta.url,(t,{responses:a})=>{const n=Object.entries(a??{});if(!n.length){t.append(o`
        <is-callout color="neutral" variant="plain" icon="mdi:reply-outline">
          La operación no declara respuestas.
        </is-callout>
      `);return}t.append(o`
      <div class="lista">
        ${n.map(([s,e])=>{const r=f(j(s)),c=$(e),d=!!e?.content&&l(Object.values(e.content)[0])===void 0;return o`
            <is-details class="respuesta" variant="outlined" data-code="${s}">
              <div slot="summary" class="resumen">
                <is-tag color="${r}" variant="filled-outlined" class="codigo">${s}</is-tag>
                <span class="descripcion">${e?.description??""}</span>
              </div>
              ${c?o`
                    <div class="cuerpo">
                      <span class="etiqueta">${d?"Schema":"Ejemplo"}</span>
                      ${(()=>{const i=document.createElement("sw-json");return i.props={value:c,maxHeight:"20rem"},i})()}
                    </div>
                  `:o`<p class="sin-cuerpo">Sin cuerpo declarado.</p>`}
            </is-details>
          `})}
      </div>
    `)},{responses:null},"sw-responses");v("sw-responses",u);export{u as SwResponses};
