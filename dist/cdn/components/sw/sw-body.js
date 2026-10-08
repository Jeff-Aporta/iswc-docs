import{crearComponente as b,define as $,html as o,emitir as v}from"./_shared.js";import{resolveTryItBodyExamples as y,validateBodyJson as n,formatBodyExample as h}from"../../js/tryit-body.js";const c=b(import.meta.url,(d,{op:r,value:u,disabled:t},p)=>{if(!r)return;const l=String(u??""),s=n(l),a=y(r),m=r.requestBody?.required===!0,i=e=>v(p,"sw-body-change",{value:e,error:n(e)});d.append(o`
      <section class="bloque">
        <header class="cabecera">
          <h4 class="titulo">
            Cuerpo (application/json)
            ${m?o`<span class="requerido" title="Requerido">*</span>`:null}
          </h4>
          ${a.length?o`
                <div class="ejemplos" role="group" aria-label="Ejemplos de cuerpo">
                  ${a.map(e=>o`
                      <is-button
                        size="small"
                        variant="outlined"
                        color="neutral"
                        ${t?"disabled":""}
                        onis-click=${()=>i(h(e.example))}
                      >
                        ${e.icon?o`<is-icon slot="start" icon="${e.icon}"></is-icon>`:null}
                        ${e.label}
                      </is-button>
                    `)}
                </div>
              `:null}
        </header>

        <is-textarea
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
          onis-input=${e=>i(String(e.target.value??""))}
        ></is-textarea>
      </section>
    `)},{op:null,value:"",disabled:!1},"sw-body");$("sw-body",c);export{c as SwBody};
