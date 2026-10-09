import{adoptCss as a,precargarCss as d,define as h,html as n,avisar as c}from"./_shared.js";import{loadViewerDocument as m,resolveBootConfig as w}from"../../js/config.js";import{buildDocIndex as f,groupOperationsByTag as g,operationRequiresBearer as l,sortGroupsBySpecOrder as b}from"../../js/openapi.js";import{filterGroupsByQuery as v}from"../../js/nav.js";import{inferDefaultServerBase as S,readServerFromUrl as E}from"../../js/server-base.js";import{mergeUrlState as u,readUrlState as y,subscribeUrlState as k}from"../../js/url-state.js";import{getStoredJwt as C,resolveAuthConfig as M}from"../../js/auth.js";import"./sw-method.js";import"./sw-auth.js";import"./sw-layout.js";import"./sw-driver-switch.js";import"./sw-doc-actions.js";import"./sw-minidoc-view.js";import"./sw-minidoc-code.js";import"./sw-home.js";class p extends HTMLElement{#e;#n={};#i={};#s=null;#r=[];#v={};#p=null;#a="";#t="";#S="";#c="cargando";#d="";#h=!1;#m=null;#w=null;#o=null;#f=null;#g=null;#b=null;#E=()=>{this.#l({force:!0})};constructor(){super(),this.#e=this.attachShadow({mode:"open"})}get doc(){return this.#b}set doc(t){this.#b=t&&typeof t=="object"?t:null,this.isConnected&&this.#l()}#$(){const t=this.getAttribute("doc");if(!t?.trim())return null;try{const e=JSON.parse(t);return e&&typeof e=="object"?e:null}catch{return null}}get conn(){return this.#g}set conn(t){this.#g=t&&typeof t=="object"?t:null,this.isConnected&&this.#l()}#L(){const t=this.getAttribute("conn");if(!t?.trim())return null;try{const e=JSON.parse(t);return e&&typeof e=="object"?e:null}catch{return null}}connectedCallback(){this.#t=y().op,this.#f=k(t=>{const e=this.#k(t.op);e!==this.#t&&(this.#t=e,this.#u())}),this.addEventListener("sw-doc-reload",this.#E),this.#M(),this.#l()}disconnectedCallback(){this.removeEventListener("sw-doc-reload",this.#E),this.#f?.(),this.#f=null}async#l(t={}){if(!(t.force&&this.#h)){t.force&&(this.#h=!0,c("Actualizando documentaci\xF3n\u2026","brand"));try{const e=this.#b??this.#$(),s=w(e!=null?null:this.#g??this.#L(),e),{config:i,spec:o}=await m(s,{force:t.force});this.#n=i,this.#i=M(i),this.#s=o,this.#r=b(g(o),o),this.#v=f(o),this.#p=this.#i.enabled?C():null,this.#a=E()||S(o,i),this.#t=this.#k(this.#t),this.#c="listo",t.force&&c("Documentaci\xF3n actualizada","success")}catch(e){this.#c="error",this.#d=e?.message??String(e),t.force&&c(this.#d,"danger")}finally{this.#h=!1}this.#M()}}get#y(){return this.#r.flatMap(t=>t.operations)}#k(t){return t&&this.#y.some(e=>e.operationId===t)?t:""}get#T(){return v(this.#r,this.#S)}get#A(){return this.#y.find(t=>t.operationId===this.#t)??null}get#H(){const t=this.#t;return this.#r.find(e=>e.operations.some(s=>s.operationId===t))?.name??""}#I(t){t!==this.#t&&(this.#t=t,u({op:t}),this.#u())}#B(){this.#t&&(this.#t="",u({op:""},{push:!1}),this.#u())}#u(){for(const e of this.#e.querySelectorAll(".op"))e.toggleAttribute("data-activo",e.dataset.op===this.#t);const t=this.#w;if(t)if(t.replaceChildren(),this.#t){const e=this.#A,s=this.#i.enabled&&l(e??void 0,this.#s),i=document.createElement("sw-minidoc-view");i.props={op:e,spec:this.#s,grupo:this.#H,serverBase:this.#a,authEnabled:this.#i.enabled,docMd:e?this.#v[e.operationId]??"":""},t.append(i),i.scrollIntoView({block:"start"}),this.#o&&(this.#o.props={op:e,spec:this.#s,serverBase:this.#a,requiereBearer:s});return}else{const e=document.createElement("sw-home");e.props={spec:this.#s},t.append(e)}this.#o&&(this.#o.props={op:null,spec:this.#s,serverBase:this.#a,requiereBearer:!1})}#q(t){const e=document.createElement("sw-method");e.props={method:t.method};const s=String(t.path||""),o=this.#i.enabled&&l(t,this.#s)?n`<iswc-icon class="op-lock" icon="mdi:lock" title="Requiere JWT" aria-label="Requiere JWT"></iswc-icon>`:n`<span class="op-lock op-lock--vacio" aria-hidden="true"></span>`;return n`
      <button
        type="button"
        class="op"
        data-op="${t.operationId}"
        title="${s}"
        ${t.operationId===this.#t?"data-activo":""}
        onclick=${()=>this.#I(t.operationId)}
      >
        ${o}
        ${e}
        <span class="op-texto">
          <span class="op-nombre">${t.summary||t.operationId}</span>
          <span class="op-path">${s}</span>
        </span>
      </button>
    `}#C(){const t=this.#m;if(!t)return;const e=this.#T.map(s=>{const i=s.subgroups.length?s.subgroups.flatMap(o=>o.operations):s.operations;return n`
        <section class="grupo">
          <h3 class="grupo-titulo">${s.name}</h3>
          ${i.map(o=>this.#q(o))}
        </section>
      `});t.replaceChildren(...e.length?e:[n`<p class="sin-resultados">Sin coincidencias.</p>`])}#M(){if(this.#e.replaceChildren(),this.#m=null,this.#w=null,this.#o=null,this.#c==="cargando"){this.#e.append(n`<div class="centrado"><iswc-spinner></iswc-spinner></div>`),a(this.#e,import.meta.url,"sw-minidoc");return}if(this.#c==="error"){this.#e.append(n`
        <div class="centrado">
          <iswc-callout color="danger" variant="outlined">
            <strong>No se pudo cargar la documentación.</strong>
            <p>${this.#d}</p>
          </iswc-callout>
        </div>
      `),a(this.#e,import.meta.url,"sw-minidoc");return}const t=this.#n.brand?.title||this.#s?.info?.title||"API",e=document.createElement("sw-minidoc-code"),s=document.createElement("sw-auth");s.props={authEnabled:this.#i.enabled,auth:this.#i,session:this.#p},s.addEventListener("sw-session-change",r=>{this.#p=r.detail?.session??null});const i=document.createElement("sw-doc-actions");i.props={spec:this.#s,config:this.#n};const o=this.#n.brand?.icon||"mdi:api";this.#e.append(n`
      <sw-layout>
        <div slot="cabecera" class="cabecera">
          <button type="button" class="marca" aria-label="Ir al inicio" title="Ir al inicio" onclick=${()=>this.#B()}>
            <iswc-icon class="marca-logo" icon="${o}"></iswc-icon>
            <span class="marca-texto">${t}</span>
          </button>
          <iswc-input
            class="buscar"
            type="search"
            placeholder="Buscar endpoint…"
            oniswc-input=${r=>{this.#S=String(r.target.value??""),this.#C()}}
          ></iswc-input>
          ${s}
          ${i}
          <sw-driver-switch></sw-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>

        <nav slot="inicio" class="indice" aria-label="Índice de endpoints"></nav>
        <div slot="centro" class="centro"></div>
        <div slot="fin">${e}</div>
      </sw-layout>
    `),this.#m=this.#e.querySelector(".indice"),this.#w=this.#e.querySelector(".centro"),this.#o=e,this.#C(),this.#u(),a(this.#e,import.meta.url,"sw-minidoc")}}d(import.meta.url,"sw-minidoc"),h("sw-minidoc",p);export{p as SwMinidoc};
