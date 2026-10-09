import{adoptCss as u,precargarCss as h,define as b,html as a,emitir as p}from"./_shared.js";import{operationRequiresBearer as E,jsonPretty as v}from"../../js/openapi.js";import{OP_TAB_DEFAULT as f}from"../../js/url-state.js";import"./docs-method.js";import"./docs-path.js";import"./docs-try.js";import"./docs-responses.js";import"./docs-doc.js";import"./docs-json.js";const w=[{id:"try",label:"Probar",icon:"mdi:play-circle-outline"},{id:"examples",label:"Respuestas",icon:"mdi:reply-outline"},{id:"doc",label:"Doc",icon:"mdi:book-open-page-variant"}];class m extends HTMLElement{#t;#e={op:null,spec:null,serverBase:"",authEnabled:!1,docMd:"",abierto:!1,tab:f};#o=null;#s=!1;constructor(){super(),this.#t=this.attachShadow({mode:"open"})}connectedCallback(){this.#a()}get props(){return this.#e}set props(e){const t={...this.#e};if(this.#e={...this.#e,...e??{}},!this.isConnected)return;if(t.op!==this.#e.op||t.spec!==this.#e.spec||t.abierto!==this.#e.abierto){this.#s=!1,this.#a();return}(t.tab!==this.#e.tab||t.serverBase!==this.#e.serverBase)&&this.#n()}#i(){const{op:e,spec:t,serverBase:s,authEnabled:i,docMd:c,tab:l}=this.#e;if(!e)return null;if(l==="doc"){const o=document.createElement("docs-doc");return o.props={markdown:c||e.description||"",vacio:"Esta operaci\xF3n no trae documentaci\xF3n en el documento."},o}if(l==="examples"){const o=document.createElement("docs-responses");o.props={responses:e.responses??null};const n=e.requestBody?.content?.["application/json"]?.schema;if(!n)return o;const d=document.createElement("docs-json");return d.props={value:v(n),maxHeight:"20rem"},a`
        <div class="ejemplos">
          <section>
            <h4 class="subtitulo">Cuerpo esperado (schema)</h4>
            ${d}
          </section>
          <section>
            <h4 class="subtitulo">Respuestas</h4>
            ${o}
          </section>
        </div>
      `}const r=document.createElement("docs-try");return r.props={op:e,spec:t,serverBase:s,authEnabled:i},r.addEventListener("docs-need-login",o=>p(this,"docs-need-login",o.detail)),r}#n(){const e=this.#o;if(!e)return;const{tab:t}=this.#e;for(const i of e.parentElement?.querySelectorAll(".pestana")??[])i.toggleAttribute("selected",i.dataset.tab===t);e.replaceChildren();const s=this.#i();s&&e.append(s),this.#s=!0}#a(){const{op:e,spec:t,abierto:s,authEnabled:i,tab:c}=this.#e;if(this.#t.replaceChildren(),this.#o=null,!e){u(this.#t,import.meta.url,"docs-operation");return}const l=i&&E(e,t),r=document.createElement("docs-method");r.props={method:e.method};const o=document.createElement("docs-path");o.props={path:e.path},this.#t.append(a`
      <iswc-details
        class="tarjeta"
        variant="outlined"
        data-method="${e.method}"
        ${s?"open":""}
        oniswc-show=${()=>p(this,"docs-op-toggle",{operationId:e.operationId,abierto:!0})}
        oniswc-hide=${()=>p(this,"docs-op-toggle",{operationId:e.operationId,abierto:!1})}
      >
        <div slot="summary" class="resumen">
          ${r}
          ${l?a`
                <span class="candado" title="Requiere Authorization: Bearer &lt;JWT&gt;" aria-label="Requiere sesión">
                  <iswc-icon icon="mdi:lock-outline"></iswc-icon>
                </span>
              `:null}
          ${o}
          <span class="sumario">${e.summary??""}</span>
          ${e.deprecated?a`<iswc-tag color="warning" variant="outlined" class="obsoleta">obsoleta</iswc-tag>`:null}
        </div>

        ${s?a`
              <div class="cuerpo">
                ${e.description&&e.summary&&e.description!==e.summary?a`<p class="descripcion">${e.description}</p>`:null}

                <nav class="pestanas" role="tablist">
                  ${w.map(n=>a`
                      <button
                        type="button"
                        class="pestana"
                        role="tab"
                        data-tab="${n.id}"
                        ${n.id===c?"selected":""}
                        aria-selected="${n.id===c?"true":"false"}"
                        onclick=${()=>p(this,"docs-op-tab",{operationId:e.operationId,tab:n.id})}
                      >
                        <iswc-icon icon="${n.icon}"></iswc-icon>
                        ${n.label}
                      </button>
                    `)}
                </nav>

                <div class="zona-pestana"></div>
              </div>
            `:null}
      </iswc-details>
    `),this.#o=this.#t.querySelector(".zona-pestana"),s&&!this.#s&&this.#n(),u(this.#t,import.meta.url,"docs-operation")}}h(import.meta.url,"docs-operation"),b("docs-operation",m);export{m as DocsOperation};
