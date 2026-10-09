import{crearComponente as w,define as b,html as o,emitir as $}from"./_shared.js";import{resolveTryItBodyExamples as v,validateBodyJson as n,formatBodyExample as y}from"../../js/tryit-body.js";const c=w(import.meta.url,(d,{op:r,value:u,disabled:t},p)=>{if(!r)return;const l=String(u??""),s=n(l),a=v(r),m=r.requestBody?.required===!0,i=e=>$(p,"sw-body-change",{value:e,error:n(e)});d.append(o`
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
                        ${t?"disabled":""}
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
          value="${l}"
          ${t?"disabled":""}
          ${s?"error":""}
          error-text="${s??""}"
          oniswc-input=${e=>i(String(e.target.value??""))}
        ></iswc-textarea>
      </section>
    `)},{op:null,value:"",disabled:!1},"sw-body");b("sw-body",c);export{c as SwBody};
