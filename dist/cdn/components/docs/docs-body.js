import{crearComponente as b,define as $,html as o,emitir as v}from"./_shared.js";import{resolveTryItBodyExamples as w,validateBodyJson as n,formatBodyExample as y}from"../../js/tryit-body.js";const c=b(import.meta.url,(d,{op:r,value:u,disabled:s},p)=>{if(!r)return;const t=String(u??""),l=n(t),a=w(r),m=r.requestBody?.required===!0,i=e=>v(p,"docs-body-change",{value:e,error:n(e)});d.append(o`
      <section class="bloque">
        <header class="cabecera">
          <h4 class="titulo">
            Cuerpo (application/json)
            ${m?o`<span class="requerido" title="Requerido">*</span>`:null}
          </h4>
          ${a.length?o`
                <div class="ejemplos" role="group" aria-label="Ejemplos de cuerpo">
                  ${a.map(e=>o`
                      <iswc-button
                        size="small"
                        variant="outlined"
                        color="neutral"
                        ${s?"disabled":""}
                        oniswc-click=${()=>i(y(e.example))}
                      >
                        ${e.icon?o`<iswc-icon slot="start" icon="${e.icon}"></iswc-icon>`:null}
                        ${e.label}
                      </iswc-button>
                    `)}
                </div>
              `:null}
        </header>

        <iswc-textarea
          class="editor"
          full-width
          resize="auto"
          min-rows="6"
          max-rows="22"
          spellcheck="false"
          value="${t}"
          ${s?"disabled":""}
          ${l?"error":""}
          error-text="${l??""}"
          oniswc-input=${e=>i(String(e.target.value??""))}
        ></iswc-textarea>
      </section>
    `)},{op:null,value:"",disabled:!1},"docs-body");$("docs-body",c);export{c as DocsBody};
