import{adoptCss as E,precargarCss as q,define as C,html as m,emitir as L}from"./_shared.js";import{jsonPretty as R,operationRequiresBearer as P,resolveParams as S}from"../../js/openapi.js";import{defaultTryItBodyText as k,shouldShowTryItBody as T}from"../../js/tryit-body.js";import{opAllowsAttachments as x,packTryItBody as A}from"../../js/tryit-attach.js";import{paramInitialValue as H}from"../../js/param-schema.js";import{joinApiUrl as M}from"../../js/server-base.js";import{fetchApiRaw as B,extractEnvelopeError as z}from"../../js/api-fetch.js";import{formatHttpError as O,extractApiError as U}from"../../js/http-error.js";import{getStoredJwt as D}from"../../js/auth.js";import{openHostDialog as I}from"../../js/dialog-host.js";import"./docs-params.js";import"./docs-body.js";import"./docs-json.js";const j=new Set(["delete","put","patch"]),N=(b,t)=>b.replace(/\{(\w+)\}/g,(s,e)=>encodeURIComponent(t[e]??`{${e}}`));class $ extends HTMLElement{#s;#t={op:null,spec:null,serverBase:"",authEnabled:!1};#e={};#a="";#n=[];#u=null;#o=!1;#r=null;#i="";#l=null;#w=null;#d=null;#p=null;#h=null;constructor(){super(),this.#s=this.attachShadow({mode:"open"})}connectedCallback(){this.#S()}get props(){return this.#t}set props(t){const s=this.#t.op;this.#t={...this.#t,...t??{}},this.#t.op!==s&&this.#T(),this.isConnected&&this.#S()}#T(){const{op:t,spec:s}=this.#t;if(this.#e={},t)for(const e of S(t,s)){const i=H(e);i&&(this.#e[String(e.name)]=i)}this.#a=t?k(t):"",this.#n=[],this.#u=null,this.#r=null,this.#i="",this.#o=!1}get#c(){const{op:t,spec:s}=this.#t;return t?S(t,s):[]}#m(){const{op:t,serverBase:s}=this.#t;if(!t)return"";let e=M(s,N(t.path,this.#e));if(t.method==="query")return e;const i=new URLSearchParams;for(const o of this.#c){if(o.in!=="query")continue;const n=this.#e[String(o.name)];n!=null&&String(n).length&&i.set(String(o.name),n)}const p=i.toString();return p&&(e+=(e.includes("?")?"&":"?")+p),e}#y(){const{op:t,spec:s,authEnabled:e}=this.#t;return!!e&&P(t??void 0,s)}#j(){const{op:t}=this.#t;if(t){if(this.#y()&&!D()?.token){L(this,"docs-need-login",{hint:"Este endpoint requiere JWT. Inicia sesi\xF3n para ejecutarlo."});return}if(j.has(t.method)){this.#$();return}this.#b()}}#$(){const{op:t}=this.#t;t&&I({label:"Confirmar operaci\xF3n",className:"docs-dialog-confirm",width:"min(32rem, calc(100vw - 2rem))",content:m`
        <p class="docs-confirmar-texto">
          Vas a ejecutar <strong>${t.method.toUpperCase()}</strong> sobre un endpoint que modifica datos.
        </p>
        <code class="docs-confirmar-url">${this.#m()}</code>
        <div slot="footer" class="docs-confirmar-acciones">
          <iswc-button variant="plain" color="neutral" oniswc-click=${s=>{s.currentTarget.closest("iswc-dialog")?.remove()}}>Cancelar</iswc-button>
          <iswc-button
            color="danger"
            oniswc-click=${s=>{s.currentTarget.closest("iswc-dialog")?.remove(),this.#b()}}
          >
            Ejecutar de todos modos
          </iswc-button>
        </div>
      `})}async#b(){const{op:t}=this.#t;if(!t)return;this.#o=!0,this.#i="",this.#r=null,this.#f(),this.#v(),this.#g();const s=this.#m();try{const e={};for(const r of this.#c){if(r.in!=="header")continue;const l=this.#e[String(r.name)];l&&(e[String(r.name)]=l)}const i={method:t.method.toUpperCase(),headers:e};if(T(t)||this.#n.length){let r=this.#a.trim()||"{}";if(t.method==="query"&&(r==="{}"||!r)){const f={};for(const v of this.#c){if(v.in!=="query")continue;const c=this.#e[String(v.name)];c!=null&&String(c).length&&(f[String(v.name)]=c)}Object.keys(f).length&&(r=JSON.stringify(f))}const l=await A(t,this.#t.spec,r,this.#n);l.multipart||(e["Content-Type"]="application/json"),i.body=l.body}const p=performance.now(),{data:o,res:n,text:g,ok:h}=await B(s,i),w=Math.round(performance.now()-p);let y=g;o!==null&&typeof o=="object"&&(y=R(o)),h?this.#i=z(o):this.#i=O(n.status,{statusText:n.statusText,data:typeof o=="object"?o:void 0,detail:U(o)||(typeof o=="string"?o:""),endpoint:s}),this.#r={status:n.status,statusText:n.statusText,elapsed:w,body:y,ok:h}}catch(e){this.#i=e?.message??String(e)}finally{this.#o=!1,this.#f(),this.#v(),this.#g()}}#E(){const t=this.#m();this.#l&&(this.#l.textContent=t),this.#w?.setAttribute("value",t)}#f(){const t=this.#h;t&&(t.toggleAttribute("loading",this.#o),t.toggleAttribute("disabled",this.#o))}#v(){const t=this.#d;if(!t||(t.replaceChildren(),!this.#i))return;const s=this.#r?.ok?"warning":"danger";t.append(m`
      <iswc-callout color="${s}" variant="filled-outlined" icon="mdi:alert-outline">
        <pre class="aviso-texto">${this.#i}</pre>
      </iswc-callout>
    `)}#g(){const t=this.#p;if(!t)return;t.replaceChildren();const s=this.#r;if(!s)return;const e=document.createElement("docs-json");e.props={value:s.body,maxHeight:"32rem"},t.append(m`
      <div class="resultado">
        <div class="resultado-meta">
          <iswc-tag color="${s.ok?"success":"danger"}" variant="filled" class="resultado-status">
            ${s.status} ${s.statusText}
          </iswc-tag>
          <span class="resultado-dato">${s.elapsed} ms</span>
          <span class="resultado-dato">
            <iswc-format-bytes value="${new Blob([s.body]).size}"></iswc-format-bytes>
          </span>
        </div>
        ${e}
      </div>
    `)}#S(){const{op:t,spec:s}=this.#t;if(this.#s.replaceChildren(),this.#l=this.#d=this.#p=this.#h=null,!t){E(this.#s,import.meta.url,"docs-try");return}const e=this.#c,i=e.filter(a=>a.in==="path"),p=e.filter(a=>a.in==="query"||a.in==="header"),o=(a,u)=>{const d=document.createElement(a);return d.props=u,d},n=i.length?o("docs-params",{params:i,values:this.#e,disabled:this.#o,titulo:"Ruta"}):null,g=p.length?o("docs-params",{params:p,values:this.#e,disabled:this.#o,titulo:"Query y cabeceras"}):null,h=T(t)?o("docs-body",{op:t,value:this.#a,disabled:this.#o}):null,w=a=>{const{name:u,value:d}=a.detail;this.#e[u]=d,this.#E()};n?.addEventListener("docs-param-change",w),g?.addEventListener("docs-param-change",w),h?.addEventListener("docs-body-change",a=>{const u=a.detail;this.#a=u.value,this.#u=u.error;const d=h.shadowRoot?.querySelector("iswc-textarea")??null;d&&d.value!==u.value&&(d.value=u.value)});const r=x(t,s)?m`
          <section class="adjuntos">
            <h4 class="adjuntos-titulo">Archivos adjuntos</h4>
            <iswc-file-input
              class="adjuntos-input"
              multiple
              label="Adjuntar archivos"
              hint="Cualquier tipo. Van con la petición."
              ${this.#o?"disabled":""}
            ></iswc-file-input>
          </section>
        `:null,l=!!this.#u,f=this.#y(),v=j.has(t.method);this.#s.append(m`
      <div class="panel">
        <div class="preview">
          <span class="preview-metodo">${t.method.toUpperCase()}</span>
          <code class="preview-url"></code>
          <iswc-copy-button class="preview-copiar" copy-label="Copiar URL"></iswc-copy-button>
        </div>

        ${n}
        ${g}
        ${h}
        ${r}

        <div class="acciones">
          <iswc-button
            class="ejecutar"
            color="${v?"danger":"brand"}"
            ${l?"disabled":""}
            oniswc-click=${()=>this.#j()}
          >
            <iswc-icon slot="start" icon="mdi:play-circle-outline"></iswc-icon>
            Ejecutar
          </iswc-button>
          ${f?m`
                <span class="candado" title="Requiere Authorization: Bearer &lt;JWT&gt;">
                  <iswc-icon icon="mdi:lock-outline"></iswc-icon>
                  Requiere sesión
                </span>
              `:null}
        </div>

        <div class="zona-aviso"></div>
        <div class="zona-resultado"></div>
      </div>
    `),this.#l=this.#s.querySelector(".preview-url"),this.#w=this.#s.querySelector(".preview-copiar"),this.#d=this.#s.querySelector(".zona-aviso"),this.#p=this.#s.querySelector(".zona-resultado"),this.#h=this.#s.querySelector(".ejecutar");const c=this.#s.querySelector(".adjuntos-input");c&&(this.#n.length&&(c.files=this.#n),c.addEventListener("iswc-change",()=>{this.#n=c.files??[]})),this.#E(),this.#v(),this.#g(),this.#f(),E(this.#s,import.meta.url,"docs-try")}}q(import.meta.url,"docs-try"),C("docs-try",$);export{$ as DocsTry};
