import{adoptCss as c,precargarCss as p,define as h,html as n,avisar as a}from"./_shared.js";import{loadViewerDocument as m,resolveBootConfig as f}from"../../js/config.js";import{buildDocIndex as g,groupOperationsByTag as b,operationRequiresBearer as l,sortGroupsBySpecOrder as v}from"../../js/openapi.js";import{filterGroupsByQuery as w}from"../../js/nav.js";import{inferDefaultServerBase as E,readServerFromUrl as D}from"../../js/server-base.js";import{mergeUrlState as d,readUrlState as y,subscribeUrlState as k}from"../../js/url-state.js";import{getStoredJwt as S,resolveAuthConfig as C}from"../../js/auth.js";import"./docs-method.js";import"./docs-auth.js";import"./docs-layout.js";import"./docs-driver-switch.js";import"./docs-doc-actions.js";import"./docs-minidoc-view.js";import"./docs-minidoc-code.js";import"./docs-home.js";class u extends HTMLElement{#o;#n={};#e={};#s=null;#r=[];#w={};#u=null;#c="";#t="";#E="";#a="cargando";#p="";#h=!1;#m=null;#f=null;#i=null;#g=null;#b=null;#v=null;#D=()=>{this.#l({force:!0})};constructor(){super(),this.#o=this.attachShadow({mode:"open"})}get doc(){return this.#v}set doc(t){this.#v=t&&typeof t=="object"?t:null,this.isConnected&&this.#l()}#M(){const t=this.getAttribute("doc");if(!t?.trim())return null;try{const o=JSON.parse(t);return o&&typeof o=="object"?o:null}catch{return null}}get conn(){return this.#b}set conn(t){this.#b=t&&typeof t=="object"?t:null,this.isConnected&&this.#l()}#$(){const t=this.getAttribute("conn");if(!t?.trim())return null;try{const o=JSON.parse(t);return o&&typeof o=="object"?o:null}catch{return null}}connectedCallback(){this.#t=y().op,this.#g=k(t=>{const o=this.#k(t.op);o!==this.#t&&(this.#t=o,this.#d())}),this.addEventListener("docs-doc-reload",this.#D),this.#C(),this.#l()}disconnectedCallback(){this.removeEventListener("docs-doc-reload",this.#D),this.#g?.(),this.#g=null}async#l(t={}){if(!(t.force&&this.#h)){t.force&&(this.#h=!0,a("Actualizando documentaci\xF3n\u2026","brand"));try{const o=this.#v??this.#M(),s=f(o!=null?null:this.#b??this.#$(),o),{config:e,spec:i}=await m(s,{force:t.force});this.#n=e,this.#e=C(e),this.#s=i,this.#r=v(b(i),i),this.#w=g(i),this.#u=this.#e.enabled?S():null,this.#c=D()||E(i,e),this.#t=this.#k(this.#t),this.#a="listo",t.force&&a("Documentaci\xF3n actualizada","success")}catch(o){this.#a="error",this.#p=o?.message??String(o),t.force&&a(this.#p,"danger")}finally{this.#h=!1}this.#C()}}get#y(){return this.#r.flatMap(t=>t.operations)}#k(t){return t&&this.#y.some(o=>o.operationId===t)?t:""}get#L(){return w(this.#r,this.#E)}get#T(){return this.#y.find(t=>t.operationId===this.#t)??null}get#A(){const t=this.#t;return this.#r.find(o=>o.operations.some(s=>s.operationId===t))?.name??""}#H(t){t!==this.#t&&(this.#t=t,d({op:t}),this.#d())}#I(){this.#t&&(this.#t="",d({op:""},{push:!1}),this.#d())}#d(){for(const o of this.#o.querySelectorAll(".op"))o.toggleAttribute("data-activo",o.dataset.op===this.#t);const t=this.#f;if(t)if(t.replaceChildren(),this.#t){const o=this.#T,s=this.#e.enabled&&l(o??void 0,this.#s),e=document.createElement("docs-minidoc-view");e.props={op:o,spec:this.#s,grupo:this.#A,serverBase:this.#c,authEnabled:this.#e.enabled,docMd:o?this.#w[o.operationId]??"":""},t.append(e),e.scrollIntoView({block:"start"}),this.#i&&(this.#i.props={op:o,spec:this.#s,serverBase:this.#c,requiereBearer:s});return}else{const o=document.createElement("docs-home");o.props={spec:this.#s},t.append(o)}this.#i&&(this.#i.props={op:null,spec:this.#s,serverBase:this.#c,requiereBearer:!1})}#B(t){const o=document.createElement("docs-method");o.props={method:t.method};const s=String(t.path||""),i=this.#e.enabled&&l(t,this.#s)?n`<iswc-icon class="op-lock" icon="mdi:lock" title="Requiere JWT" aria-label="Requiere JWT"></iswc-icon>`:n`<span class="op-lock op-lock--vacio" aria-hidden="true"></span>`;return n`
      <button
        type="button"
        class="op"
        data-op="${t.operationId}"
        title="${s}"
        ${t.operationId===this.#t?"data-activo":""}
        onclick=${()=>this.#H(t.operationId)}
      >
        ${i}
        ${o}
        <span class="op-texto">
          <span class="op-nombre">${t.summary||t.operationId}</span>
          <span class="op-path">${s}</span>
        </span>
      </button>
    `}#S(){const t=this.#m;if(!t)return;const o=this.#L.map(s=>{const e=s.subgroups.length?s.subgroups.flatMap(i=>i.operations):s.operations;return n`
        <section class="grupo">
          <h3 class="grupo-titulo">${s.name}</h3>
          ${e.map(i=>this.#B(i))}
        </section>
      `});t.replaceChildren(...o.length?o:[n`<p class="sin-resultados">Sin coincidencias.</p>`])}#C(){if(this.#o.replaceChildren(),this.#m=null,this.#f=null,this.#i=null,this.#a==="cargando"){this.#o.append(n`<div class="centrado"><iswc-spinner></iswc-spinner></div>`),c(this.#o,import.meta.url,"docs-minidoc");return}if(this.#a==="error"){this.#o.append(n`
        <div class="centrado">
          <iswc-callout color="danger" variant="outlined">
            <strong>No se pudo cargar la documentación.</strong>
            <p>${this.#p}</p>
          </iswc-callout>
        </div>
      `),c(this.#o,import.meta.url,"docs-minidoc");return}const t=this.#n.brand?.title||this.#s?.info?.title||"API",o=document.createElement("docs-minidoc-code"),s=document.createElement("docs-auth");s.props={authEnabled:this.#e.enabled,auth:this.#e,session:this.#u},s.addEventListener("docs-session-change",r=>{this.#u=r.detail?.session??null});const e=document.createElement("docs-doc-actions");e.props={spec:this.#s,config:this.#n};const i=this.#n.brand?.icon||"mdi:api";this.#o.append(n`
      <docs-layout>
        <div slot="cabecera" class="cabecera">
          <button type="button" class="marca" aria-label="Ir al inicio" title="Ir al inicio" onclick=${()=>this.#I()}>
            <iswc-icon class="marca-logo" icon="${i}"></iswc-icon>
            <span class="marca-texto">${t}</span>
          </button>
          <iswc-input
            class="buscar"
            type="search"
            placeholder="Buscar endpoint…"
            oniswc-input=${r=>{this.#E=String(r.target.value??""),this.#S()}}
          ></iswc-input>
          ${s}
          ${e}
          <docs-driver-switch></docs-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>

        <nav slot="inicio" class="indice" aria-label="Índice de endpoints"></nav>
        <div slot="centro" class="centro"></div>
        <div slot="fin">${o}</div>
      </docs-layout>
    `),this.#m=this.#o.querySelector(".indice"),this.#f=this.#o.querySelector(".centro"),this.#i=o,this.#S(),this.#d(),c(this.#o,import.meta.url,"docs-minidoc")}}p(import.meta.url,"docs-minidoc"),h("docs-minidoc",u);export{u as DocsMinidoc};
