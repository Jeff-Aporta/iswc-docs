import{adoptCss as m,precargarCss as v,define as g,html as e,emitir as t,esc as w}from"./_shared.js";import"./sw-auth.js";import"./sw-driver-switch.js";import"./sw-doc-actions.js";class u extends HTMLElement{#i;#s={brand:{},tabs:[],activeTab:"",query:"",spec:null,config:{},authEnabled:!1,auth:{},session:null};#e=null;constructor(){super(),this.#i=this.attachShadow({mode:"open"})}connectedCallback(){this.#t()}get props(){return this.#s}set props(s){const a={...this.#s};this.#s={...this.#s,...s??{}},this.isConnected&&(a.query!==this.#s.query&&Object.keys(s??{}).length===1||this.#t())}abrirLogin(s){this.#e?.abrirLogin(s)}#t(){const{brand:s,tabs:a,activeTab:r,query:o,spec:c,config:p,authEnabled:d,auth:h,session:b}=this.#s;this.#i.replaceChildren();const n=document.createElement("sw-auth");n.props={authEnabled:d,auth:h,session:b},n.addEventListener("sw-session-change",i=>t(this,"sw-session-change",i.detail)),this.#e=n;const l=document.createElement("sw-doc-actions");l.props={spec:c,config:p},this.#i.append(e`
      <header class="barra">
        <button
          type="button"
          class="marca"
          aria-label="Ir al inicio"
          title="Ir al inicio"
          onclick=${()=>t(this,"sw-reset",null)}
        >
          ${s?.icon?e`<is-icon class="marca-icono" icon="${s.icon}"></is-icon>`:null}
          <div class="marca-texto">
            <span class="marca-titulo">${s?.title??c?.info?.title??"API"}</span>
            ${s?.subtitle?e`<span class="marca-sub">${s.subtitle}</span>`:null}
          </div>
        </button>

        <is-input
          class="busqueda"
          type="search"
          clearable
          placeholder="Buscar ruta, resumen u operationId…"
          aria-label="Buscar operaciones"
          value="${o}"
          onis-input=${i=>t(this,"sw-search",{query:String(i.target.value??"")})}
        >
          <is-icon slot="start" icon="mdi:magnify"></is-icon>
        </is-input>

        <div class="acciones">
          ${l}
          ${n}
          <sw-driver-switch></sw-driver-switch>
          <is-theme-toggle></is-theme-toggle>
        </div>
      </header>

      ${o.trim()?e`
            <div class="busqueda-titulo" role="status" aria-live="polite">
              <is-icon icon="mdi:magnify"></is-icon>
              <span>Resultados para <code class="busqueda-titulo__q">${w(o)}</code></span>
              <button
                type="button"
                class="busqueda-limpiar"
                aria-label="Limpiar búsqueda"
                onclick=${()=>t(this,"sw-search",{query:""})}
              >
                <is-icon icon="mdi:close"></is-icon>
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
                      ${i.id===r?"selected":""}
                      aria-selected="${i.id===r?"true":"false"}"
                      onclick=${()=>t(this,"sw-nav-tab",{tab:i.id})}
                    >
                      ${i.icon?e`<is-icon icon="${i.icon}"></is-icon>`:null}
                      ${i.label}
                    </button>
                  `)}
              </nav>
            `:null}
    `),m(this.#i,import.meta.url,"sw-nav")}}v(import.meta.url,"sw-nav"),g("sw-nav",u);export{u as SwNav};
