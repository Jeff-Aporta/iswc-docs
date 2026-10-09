import{adoptCss as c,precargarCss as h,define as g,html as p,emitir as d}from"./_shared.js";import"./docs-operation.js";class l extends HTMLElement{#s;#o={group:null,spec:null,serverBase:"",authEnabled:!1,docIndex:{},opAbierta:"",opTab:"try"};#t=new Map;constructor(){super(),this.#s=this.attachShadow({mode:"open"})}connectedCallback(){this.#e()}get props(){return this.#o}set props(o){const s={...this.#o};if(this.#o={...this.#o,...o??{}},!this.isConnected)return;s.group===this.#o.group&&s.spec===this.#o.spec&&s.docIndex===this.#o.docIndex?this.#r():this.#e()}#r(){const{opAbierta:o,opTab:s,serverBase:e,authEnabled:t}=this.#o;for(const[a,i]of this.#t)i.props={abierto:a===o,tab:s,serverBase:e,authEnabled:t}}#n(o){const{spec:s,serverBase:e,authEnabled:t,docIndex:a,opAbierta:i,opTab:u}=this.#o,r=document.createElement("docs-operation");return r.props={op:o,spec:s,serverBase:e,authEnabled:t,docMd:a?.[o.operationId]??"",abierto:o.operationId===i,tab:u},r.addEventListener("docs-op-toggle",n=>d(this,"docs-op-toggle",n.detail)),r.addEventListener("docs-op-tab",n=>d(this,"docs-op-tab",n.detail)),r.addEventListener("docs-need-login",n=>d(this,"docs-need-login",n.detail)),this.#t.set(o.operationId,r),r}#e(){const{group:o}=this.#o;if(this.#s.replaceChildren(),this.#t.clear(),!o){c(this.#s,import.meta.url,"docs-tag-group");return}const s=o.subgroups.length?o.subgroups.flatMap(t=>t.operations):o.operations,e=p`<div class="operaciones">${s.map(t=>this.#n(t))}</div>`;this.#s.append(p`
      <section class="grupo">
        <header class="cabecera">
          <h2 class="titulo">
            ${o.name}
            <span class="contador">${o.operations.length}</span>
          </h2>
          ${o.description?p`<p class="descripcion">${o.description}</p>`:null}
        </header>
        ${e}
      </section>
    `),c(this.#s,import.meta.url,"docs-tag-group")}}h(import.meta.url,"docs-tag-group"),g("docs-tag-group",l);export{l as DocsTagGroup};
