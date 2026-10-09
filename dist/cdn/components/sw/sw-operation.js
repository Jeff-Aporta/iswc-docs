import{adoptCss as u,precargarCss as h,define as b,html as a,emitir as c}from"./_shared.js";import{operationRequiresBearer as w,jsonPretty as E}from"../../js/openapi.js";import{OP_TAB_DEFAULT as v}from"../../js/url-state.js";import"./sw-method.js";import"./sw-path.js";import"./sw-try.js";import"./sw-responses.js";import"./sw-doc.js";import"./sw-json.js";const f=[{id:"try",label:"Probar",icon:"mdi:play-circle-outline"},{id:"examples",label:"Respuestas",icon:"mdi:reply-outline"},{id:"doc",label:"Doc",icon:"mdi:book-open-page-variant"}];class m extends HTMLElement{#t;#e={op:null,spec:null,serverBase:"",authEnabled:!1,docMd:"",abierto:!1,tab:v};#s=null;#o=!1;constructor(){super(),this.#t=this.attachShadow({mode:"open"})}connectedCallback(){this.#a()}get props(){return this.#e}set props(e){const t={...this.#e};if(this.#e={...this.#e,...e??{}},!this.isConnected)return;if(t.op!==this.#e.op||t.spec!==this.#e.spec||t.abierto!==this.#e.abierto){this.#o=!1,this.#a();return}(t.tab!==this.#e.tab||t.serverBase!==this.#e.serverBase)&&this.#n()}#i(){const{op:e,spec:t,serverBase:o,authEnabled:i,docMd:l,tab:p}=this.#e;if(!e)return null;if(p==="doc"){const s=document.createElement("sw-doc");return s.props={markdown:l||e.description||"",vacio:"Esta operaci\xF3n no trae documentaci\xF3n en el documento."},s}if(p==="examples"){const s=document.createElement("sw-responses");s.props={responses:e.responses??null};const n=e.requestBody?.content?.["application/json"]?.schema;if(!n)return s;const d=document.createElement("sw-json");return d.props={value:E(n),maxHeight:"20rem"},a`
        <div class="ejemplos">
          <section>
            <h4 class="subtitulo">Cuerpo esperado (schema)</h4>
            ${d}
          </section>
          <section>
            <h4 class="subtitulo">Respuestas</h4>
            ${s}
          </section>
        </div>
      `}const r=document.createElement("sw-try");return r.props={op:e,spec:t,serverBase:o,authEnabled:i},r.addEventListener("sw-need-login",s=>c(this,"sw-need-login",s.detail)),r}#n(){const e=this.#s;if(!e)return;const{tab:t}=this.#e;for(const i of e.parentElement?.querySelectorAll(".pestana")??[])i.toggleAttribute("selected",i.dataset.tab===t);e.replaceChildren();const o=this.#i();o&&e.append(o),this.#o=!0}#a(){const{op:e,spec:t,abierto:o,authEnabled:i,tab:l}=this.#e;if(this.#t.replaceChildren(),this.#s=null,!e){u(this.#t,import.meta.url,"sw-operation");return}const p=i&&w(e,t),r=document.createElement("sw-method");r.props={method:e.method};const s=document.createElement("sw-path");s.props={path:e.path},this.#t.append(a`
      <iswc-details
        class="tarjeta"
        variant="outlined"
        data-method="${e.method}"
        ${o?"open":""}
        oniswc-show=${()=>c(this,"sw-op-toggle",{operationId:e.operationId,abierto:!0})}
        oniswc-hide=${()=>c(this,"sw-op-toggle",{operationId:e.operationId,abierto:!1})}
      >
        <div slot="summary" class="resumen">
          ${r}
          ${p?a`
                <span class="candado" title="Requiere Authorization: Bearer &lt;JWT&gt;" aria-label="Requiere sesión">
                  <iswc-icon icon="mdi:lock-outline"></iswc-icon>
                </span>
              `:null}
          ${s}
          <span class="sumario">${e.summary??""}</span>
          ${e.deprecated?a`<iswc-tag color="warning" variant="outlined" class="obsoleta">obsoleta</iswc-tag>`:null}
        </div>

        ${o?a`
              <div class="cuerpo">
                ${e.description&&e.summary&&e.description!==e.summary?a`<p class="descripcion">${e.description}</p>`:null}

                <nav class="pestanas" role="tablist">
                  ${f.map(n=>a`
                      <button
                        type="button"
                        class="pestana"
                        role="tab"
                        data-tab="${n.id}"
                        ${n.id===l?"selected":""}
                        aria-selected="${n.id===l?"true":"false"}"
                        onclick=${()=>c(this,"sw-op-tab",{operationId:e.operationId,tab:n.id})}
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
    `),this.#s=this.#t.querySelector(".zona-pestana"),o&&!this.#o&&this.#n(),u(this.#t,import.meta.url,"sw-operation")}}h(import.meta.url,"sw-operation"),b("sw-operation",m);export{m as SwOperation};
