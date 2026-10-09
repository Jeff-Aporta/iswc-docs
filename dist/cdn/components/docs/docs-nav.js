import{adoptCss as m,precargarCss as v,define as g,html as e,emitir as t,esc as w}from"./_shared.js";import"./docs-auth.js";import"./docs-driver-switch.js";import"./docs-doc-actions.js";class u extends HTMLElement{#i;#s={brand:{},tabs:[],activeTab:"",query:"",spec:null,config:{},authEnabled:!1,auth:{},session:null};#e=null;constructor(){super(),this.#i=this.attachShadow({mode:"open"})}connectedCallback(){this.#t()}get props(){return this.#s}set props(s){const a={...this.#s};this.#s={...this.#s,...s??{}},this.isConnected&&(a.query!==this.#s.query&&Object.keys(s??{}).length===1||this.#t())}abrirLogin(s){this.#e?.abrirLogin(s)}#t(){const{brand:s,tabs:a,activeTab:c,query:n,spec:r,config:d,authEnabled:p,auth:h,session:b}=this.#s;this.#i.replaceChildren();const o=document.createElement("docs-auth");o.props={authEnabled:p,auth:h,session:b},o.addEventListener("docs-session-change",i=>t(this,"docs-session-change",i.detail)),this.#e=o;const l=document.createElement("docs-doc-actions");l.props={spec:r,config:d},this.#i.append(e`
      <header class="barra">
        <button
          type="button"
          class="marca"
          aria-label="Ir al inicio"
          title="Ir al inicio"
          onclick=${()=>t(this,"docs-reset",null)}
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
          value="${n}"
          oniswc-input=${i=>t(this,"docs-search",{query:String(i.target.value??"")})}
        >
          <iswc-icon slot="start" icon="mdi:magnify"></iswc-icon>
        </iswc-input>

        <div class="acciones">
          ${l}
          ${o}
          <docs-driver-switch></docs-driver-switch>
          <iswc-theme-toggle></iswc-theme-toggle>
        </div>
      </header>

      ${n.trim()?e`
            <div class="busqueda-titulo" role="status" aria-live="polite">
              <iswc-icon icon="mdi:magnify"></iswc-icon>
              <span>Resultados para <code class="busqueda-titulo__q">${w(n)}</code></span>
              <button
                type="button"
                class="busqueda-limpiar"
                aria-label="Limpiar búsqueda"
                onclick=${()=>t(this,"docs-search",{query:""})}
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
                      onclick=${()=>t(this,"docs-nav-tab",{tab:i.id})}
                    >
                      ${i.icon?e`<iswc-icon icon="${i.icon}"></iswc-icon>`:null}
                      ${i.label}
                    </button>
                  `)}
              </nav>
            `:null}
    `),m(this.#i,import.meta.url,"docs-nav")}}v(import.meta.url,"docs-nav"),g("docs-nav",u);export{u as DocsNav};
