import{adoptCss as m,precargarCss as v,define as $,html as o,emitir as w}from"./_shared.js";import{ejemploDeParam as E}from"../../js/curl.js";import{jsonPretty as f,operationRequiresBearer as q,resolveParams as y}from"../../js/openapi.js";import"./docs-method.js";import"./docs-path.js";import"./docs-json.js";import"./docs-try.js";import"./docs-doc.js";const P=[{in:"path",titulo:"Par\xE1metros de ruta"},{in:"query",titulo:"Par\xE1metros de consulta"},{in:"header",titulo:"Cabeceras"},{in:"cookie",titulo:"Cookies"}];class u extends HTMLElement{#e;#o={op:null,spec:null,grupo:"",serverBase:"",authEnabled:!1,docMd:""};constructor(){super(),this.#e=this.attachShadow({mode:"open"})}connectedCallback(){this.#s()}get props(){return this.#o}set props(e){this.#o={...this.#o,...e??{}},this.isConnected&&this.#s()}#t(e){const s=e.schema,n=[s?.type,s?.format].filter(Boolean).join(" \xB7 ")||"string",t=E(e),a=Array.isArray(s?.enum)?s?.enum??[]:[];return o`
      <article class="param">
        <div class="param-cab">
          <code class="param-nombre">${e.name}</code>
          <span class="param-tipo">${n}</span>
          ${e.required?o`<span class="param-req">obligatorio</span>`:null}
        </div>
        ${e.description?o`<p class="param-desc">${e.description}</p>`:null}
        ${a.length?o`<p class="param-enum">Valores: ${a.map(r=>o`<code>${String(r)}</code>`)}</p>`:null}
        ${t&&!t.startsWith("<")?o`<p class="param-ej">Ejemplo: <code>${t}</code></p>`:null}
      </article>
    `}#a(e){return P.flatMap(({in:s,titulo:n})=>{const t=e.filter(a=>a.in===s);return t.length?[o`
          <section class="bloque">
            <h2 class="bloque-titulo">${n}</h2>
            ${t.map(a=>this.#t(a))}
          </section>
        `]:[]})}#s(){const{op:e,spec:s,grupo:n,authEnabled:t,docMd:a}=this.#o;if(this.#e.replaceChildren(),!e){this.#e.append(o`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `),m(this.#e,import.meta.url,"docs-minidoc-view");return}const r=document.createElement("docs-method");r.props={method:e.method};const p=document.createElement("docs-path");p.props={path:e.path};const h=y(e,s),b=t&&q(e,s),d=e.requestBody?.content?.["application/json"]?.schema;let i=null;d&&(i=document.createElement("docs-json"),i.props={value:f(d),maxHeight:"24rem"});let c=null;a&&(c=document.createElement("docs-doc"),c.props={markdown:a});const l=document.createElement("docs-try");l.props={op:e,spec:s,serverBase:this.#o.serverBase,authEnabled:t},l.addEventListener("docs-need-login",g=>w(this,"docs-need-login",g.detail)),this.#e.append(o`
      ${n?o`<p class="eyebrow">${n}</p>`:null}
      <h1 class="titulo">${e.summary||e.operationId}</h1>
      ${e.description?o`<p class="entradilla">${e.description}</p>`:null}

      <div class="endpoint">
        ${r}
        ${p}
        <iswc-dropdown class="probar-pop" placement="bottom-end" distance="6">
          <iswc-button slot="trigger" class="probar" variant="solid" color="success">
            Probar
            <iswc-icon slot="end" icon="mdi:play"></iswc-icon>
          </iswc-button>
          ${l}
        </iswc-dropdown>
      </div>

      ${b?o`
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

      ${i?o`
            <section class="bloque">
              <h2 class="bloque-titulo">Cuerpo de la petición</h2>
              ${i}
            </section>
          `:null}

      ${c?o`
            <section class="bloque">
              <h2 class="bloque-titulo">Notas</h2>
              ${c}
            </section>
          `:null}
    `),m(this.#e,import.meta.url,"docs-minidoc-view")}}v(import.meta.url,"docs-minidoc-view"),$("docs-minidoc-view",u);export{u as DocsMinidocView};
