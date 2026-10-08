import{adoptCss as d,precargarCss as g,define as v,html as s,emitir as $}from"./_shared.js";import{ejemploDeParam as E}from"../../js/curl.js";import{jsonPretty as f,operationRequiresBearer as q,resolveParams as y}from"../../js/openapi.js";import"./sw-method.js";import"./sw-path.js";import"./sw-json.js";import"./sw-try.js";import"./sw-doc.js";const P=[{in:"path",titulo:"Par\xE1metros de ruta"},{in:"query",titulo:"Par\xE1metros de consulta"},{in:"header",titulo:"Cabeceras"},{in:"cookie",titulo:"Cookies"}];class u extends HTMLElement{#e;#s={op:null,spec:null,grupo:"",serverBase:"",authEnabled:!1,docMd:""};constructor(){super(),this.#e=this.attachShadow({mode:"open"})}connectedCallback(){this.#o()}get props(){return this.#s}set props(e){this.#s={...this.#s,...e??{}},this.isConnected&&this.#o()}#t(e){const o=e.schema,n=[o?.type,o?.format].filter(Boolean).join(" \xB7 ")||"string",t=E(e),a=Array.isArray(o?.enum)?o?.enum??[]:[];return s`
      <article class="param">
        <div class="param-cab">
          <code class="param-nombre">${e.name}</code>
          <span class="param-tipo">${n}</span>
          ${e.required?s`<span class="param-req">obligatorio</span>`:null}
        </div>
        ${e.description?s`<p class="param-desc">${e.description}</p>`:null}
        ${a.length?s`<p class="param-enum">Valores: ${a.map(r=>s`<code>${String(r)}</code>`)}</p>`:null}
        ${t&&!t.startsWith("<")?s`<p class="param-ej">Ejemplo: <code>${t}</code></p>`:null}
      </article>
    `}#a(e){return P.flatMap(({in:o,titulo:n})=>{const t=e.filter(a=>a.in===o);return t.length?[s`
          <section class="bloque">
            <h2 class="bloque-titulo">${n}</h2>
            ${t.map(a=>this.#t(a))}
          </section>
        `]:[]})}#o(){const{op:e,spec:o,grupo:n,authEnabled:t,docMd:a}=this.#s;if(this.#e.replaceChildren(),!e){this.#e.append(s`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `),d(this.#e,import.meta.url,"sw-minidoc-view");return}const r=document.createElement("sw-method");r.props={method:e.method};const p=document.createElement("sw-path");p.props={path:e.path};const h=y(e,o),w=t&&q(e,o),m=e.requestBody?.content?.["application/json"]?.schema;let i=null;m&&(i=document.createElement("sw-json"),i.props={value:f(m),maxHeight:"24rem"});let l=null;a&&(l=document.createElement("sw-doc"),l.props={markdown:a});const c=document.createElement("sw-try");c.props={op:e,spec:o,serverBase:this.#s.serverBase,authEnabled:t},c.addEventListener("sw-need-login",b=>$(this,"sw-need-login",b.detail)),this.#e.append(s`
      ${n?s`<p class="eyebrow">${n}</p>`:null}
      <h1 class="titulo">${e.summary||e.operationId}</h1>
      ${e.description?s`<p class="entradilla">${e.description}</p>`:null}

      <div class="endpoint">
        ${r}
        ${p}
        <is-dropdown class="probar-pop" placement="bottom-end" distance="6">
          <is-button slot="trigger" class="probar" variant="solid" color="success">
            Probar
            <is-icon slot="end" icon="mdi:play"></is-icon>
          </is-button>
          ${c}
        </is-dropdown>
      </div>

      ${w?s`
            <section class="bloque">
              <h2 class="bloque-titulo">Autorización</h2>
              <article class="param">
                <div class="param-cab">
                  <code class="param-nombre">Authorization</code>
                  <span class="param-tipo">string · header</span>
                  <span class="param-req">obligatorio</span>
                </div>
                <p class="param-desc">Esquema <code>Bearer</code>. Inicia sesión en el visor y la cabecera se envía sola al probar.</p>
                <p class="param-ej">Ejemplo: <code>Authorization: Bearer &lt;token&gt;</code></p>
              </article>
            </section>
          `:null}

      ${this.#a(h)}

      ${i?s`
            <section class="bloque">
              <h2 class="bloque-titulo">Cuerpo de la petición</h2>
              ${i}
            </section>
          `:null}

      ${l?s`
            <section class="bloque">
              <h2 class="bloque-titulo">Notas</h2>
              ${l}
            </section>
          `:null}
    `),d(this.#e,import.meta.url,"sw-minidoc-view")}}g(import.meta.url,"sw-minidoc-view"),v("sw-minidoc-view",u);export{u as SwMinidocView};
