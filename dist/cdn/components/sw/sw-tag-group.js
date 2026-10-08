import{adoptCss as l,precargarCss as h,define as g,html as p,emitir as d}from"./_shared.js";import"./sw-operation.js";class c extends HTMLElement{#s;#t={group:null,spec:null,serverBase:"",authEnabled:!1,docIndex:{},opAbierta:"",opTab:"try"};#e=new Map;constructor(){super(),this.#s=this.attachShadow({mode:"open"})}connectedCallback(){this.#o()}get props(){return this.#t}set props(t){const s={...this.#t};if(this.#t={...this.#t,...t??{}},!this.isConnected)return;s.group===this.#t.group&&s.spec===this.#t.spec&&s.docIndex===this.#t.docIndex?this.#r():this.#o()}#r(){const{opAbierta:t,opTab:s,serverBase:o,authEnabled:e}=this.#t;for(const[a,i]of this.#e)i.props={abierto:a===t,tab:s,serverBase:o,authEnabled:e}}#n(t){const{spec:s,serverBase:o,authEnabled:e,docIndex:a,opAbierta:i,opTab:u}=this.#t,r=document.createElement("sw-operation");return r.props={op:t,spec:s,serverBase:o,authEnabled:e,docMd:a?.[t.operationId]??"",abierto:t.operationId===i,tab:u},r.addEventListener("sw-op-toggle",n=>d(this,"sw-op-toggle",n.detail)),r.addEventListener("sw-op-tab",n=>d(this,"sw-op-tab",n.detail)),r.addEventListener("sw-need-login",n=>d(this,"sw-need-login",n.detail)),this.#e.set(t.operationId,r),r}#o(){const{group:t}=this.#t;if(this.#s.replaceChildren(),this.#e.clear(),!t){l(this.#s,import.meta.url,"sw-tag-group");return}const s=t.subgroups.length?t.subgroups.flatMap(e=>e.operations):t.operations,o=p`<div class="operaciones">${s.map(e=>this.#n(e))}</div>`;this.#s.append(p`
      <section class="grupo">
        <header class="cabecera">
          <h2 class="titulo">
            ${t.name}
            <span class="contador">${t.operations.length}</span>
          </h2>
          ${t.description?p`<p class="descripcion">${t.description}</p>`:null}
        </header>
        ${o}
      </section>
    `),l(this.#s,import.meta.url,"sw-tag-group")}}h(import.meta.url,"sw-tag-group"),g("sw-tag-group",c);export{c as SwTagGroup};
