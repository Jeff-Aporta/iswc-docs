import{adoptCss as m,precargarCss as w,define as v,html as e,emitir as t,esc as g}from"./_shared.js";import"./sw-auth.js";import"./sw-driver-switch.js";import"./sw-doc-actions.js";class u extends HTMLElement{#i;#s={brand:{},tabs:[],activeTab:"",query:"",spec:null,config:{},authEnabled:!1,auth:{},session:null};#e=null;constructor(){super(),this.#i=this.attachShadow({mode:"open"})}connectedCallback(){this.#t()}get props(){return this.#s}set props(s){const a={...this.#s};this.#s={...this.#s,...s??{}},this.isConnected&&(a.query!==this.#s.query&&Object.keys(s??{}).length===1||this.#t())}abrirLogin(s){this.#e?.abrirLogin(s)}#t(){const{brand:s,tabs:a,activeTab:c,query:o,spec:r,config:p,authEnabled:d,auth:h,session:b}=this.#s;this.#i.replaceChildren();const n=document.createElement("sw-auth");n.props={authEnabled:d,auth:h,session:b},n.addEventListener("sw-session-change",i=>t(this,"sw-session-change",i.detail)),this.#e=n;const l=document.createElement("sw-doc-actions");l.props={spec:r,config:p},this.#i.append(e`
      <header class="barra">
        <button
          type="button"
          class="marca"
          aria-label="Ir al inicio"
          title="Ir al inicio"
          onclick=${()=>t(this,"sw-reset",null)}
        >
          ${s?.icon?e`<iswc-icon class="marca-icono" icon="${s.icon}"></iswc-icon>`:null}
          <div class="marca-texto">
            <span class="marca-titulo">${s?.title??r?.info?.title??"API"}</span>
            ${s?.subtitle?e`<span class="marca-sub">${s.subtitle}</span>`:null}
          </div>
        </button>

        <iswc-input
          class="busqueda"
          type="search"
          clearable
          placeholder="Buscar ruta, resumen u operationId…"
          aria-label="Buscar operaciones"
          value="${o}"
          oniswc-input=${i=>t(this,"sw-search",{query:String(i.target.value??"")})}
        >
          <iswc-icon slot="start" icon="mdi:magnify"></iswc-icon>
        </iswc-input>

        <div class="acciones">
          ${l}
          ${n}
          <sw-driver-switch></sw-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>
      </header>

      ${o.trim()?e`
            <div class="busqueda-titulo" role="status" aria-live="polite">
              <iswc-icon icon="mdi:magnify"></iswc-icon>
              <span>Resultados para <code class="busqueda-titulo__q">${g(o)}</code></span>
              <button
                type="button"
                class="busqueda-limpiar"
                aria-label="Limpiar búsqueda"
                onclick=${()=>t(this,"sw-search",{query:""})}
              >
                <iswc-icon icon="mdi:close"></iswc-icon>
                Limpiar
              </button>
            </div>
          `:a.length>1?e`
              <nav class="secciones" role="tablist" aria-label="Secciones">
                ${a.map(i=>e`
                    <button
                      type="button"
                      class="seccion"
                      role="tab"
                      ${i.id===c?"selected":""}
                      aria-selected="${i.id===c?"true":"false"}"
                      onclick=${()=>t(this,"sw-nav-tab",{tab:i.id})}
                    >
                      ${i.icon?e`<iswc-icon icon="${i.icon}"></iswc-icon>`:null}
                      ${i.label}
                    </button>
                  `)}
              </nav>
            `:null}
    `),m(this.#i,import.meta.url,"sw-nav")}}w(import.meta.url,"sw-nav"),v("sw-nav",u);export{u as SwNav};
