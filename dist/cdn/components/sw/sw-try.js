import{adoptCss as E,precargarCss as q,define as C,html as m,emitir as L}from"./_shared.js";import{jsonPretty as R,operationRequiresBearer as P,resolveParams as S}from"../../js/openapi.js";import{defaultTryItBodyText as k,shouldShowTryItBody as T}from"../../js/tryit-body.js";import{opAllowsAttachments as x,packTryItBody as A}from"../../js/tryit-attach.js";import{paramInitialValue as H}from"../../js/param-schema.js";import{joinApiUrl as M}from"../../js/server-base.js";import{fetchApiRaw as B,extractEnvelopeError as z}from"../../js/api-fetch.js";import{formatHttpError as O,extractApiError as U}from"../../js/http-error.js";import{getStoredJwt as I}from"../../js/auth.js";import{openHostDialog as N}from"../../js/dialog-host.js";import"./sw-params.js";import"./sw-body.js";import"./sw-json.js";const j=new Set(["delete","put","patch"]),J=(b,t)=>b.replace(/\{(\w+)\}/g,(s,e)=>encodeURIComponent(t[e]??`{${e}}`));class $ extends HTMLElement{#s;#t={op:null,spec:null,serverBase:"",authEnabled:!1};#e={};#a="";#n=[];#u=null;#i=!1;#r=null;#o="";#l=null;#g=null;#d=null;#p=null;#h=null;constructor(){super(),this.#s=this.attachShadow({mode:"open"})}connectedCallback(){this.#S()}get props(){return this.#t}set props(t){const s=this.#t.op;this.#t={...this.#t,...t??{}},this.#t.op!==s&&this.#T(),this.isConnected&&this.#S()}#T(){const{op:t,spec:s}=this.#t;if(this.#e={},t)for(const e of S(t,s)){const o=H(e);o&&(this.#e[String(e.name)]=o)}this.#a=t?k(t):"",this.#n=[],this.#u=null,this.#r=null,this.#o="",this.#i=!1}get#c(){const{op:t,spec:s}=this.#t;return t?S(t,s):[]}#m(){const{op:t,serverBase:s}=this.#t;if(!t)return"";let e=M(s,J(t.path,this.#e));if(t.method==="query")return e;const o=new URLSearchParams;for(const i of this.#c){if(i.in!=="query")continue;const n=this.#e[String(i.name)];n!=null&&String(n).length&&o.set(String(i.name),n)}const p=o.toString();return p&&(e+=(e.includes("?")?"&":"?")+p),e}#y(){const{op:t,spec:s,authEnabled:e}=this.#t;return!!e&&P(t??void 0,s)}#j(){const{op:t}=this.#t;if(t){if(this.#y()&&!I()?.token){L(this,"sw-need-login",{hint:"Este endpoint requiere JWT. Inicia sesi\xF3n para ejecutarlo."});return}if(j.has(t.method)){this.#$();return}this.#b()}}#$(){const{op:t}=this.#t;t&&N({label:"Confirmar operaci\xF3n",className:"sw-dialog-confirm",width:"min(32rem, calc(100vw - 2rem))",content:m`
        <p class="sw-confirmar-texto">
          Vas a ejecutar <strong>${t.method.toUpperCase()}</strong> sobre un endpoint que modifica datos.
        </p>
        <code class="sw-confirmar-url">${this.#m()}</code>
        <div slot="footer" class="sw-confirmar-acciones">
          <iswc-button variant="plain" color="neutral" oniswc-click=${s=>{s.currentTarget.closest("iswc-dialog")?.remove()}}>Cancelar</iswc-button>
          <iswc-button
            color="danger"
            oniswc-click=${s=>{s.currentTarget.closest("iswc-dialog")?.remove(),this.#b()}}
          >
            Ejecutar de todos modos
          </iswc-button>
        </div>
      `})}async#b(){const{op:t}=this.#t;if(!t)return;this.#i=!0,this.#o="",this.#r=null,this.#f(),this.#v(),this.#w();const s=this.#m();try{const e={};for(const r of this.#c){if(r.in!=="header")continue;const l=this.#e[String(r.name)];l&&(e[String(r.name)]=l)}const o={method:t.method.toUpperCase(),headers:e};if(T(t)||this.#n.length){let r=this.#a.trim()||"{}";if(t.method==="query"&&(r==="{}"||!r)){const f={};for(const v of this.#c){if(v.in!=="query")continue;const c=this.#e[String(v.name)];c!=null&&String(c).length&&(f[String(v.name)]=c)}Object.keys(f).length&&(r=JSON.stringify(f))}const l=await A(t,this.#t.spec,r,this.#n);l.multipart||(e["Content-Type"]="application/json"),o.body=l.body}const p=performance.now(),{data:i,res:n,text:w,ok:h}=await B(s,o),g=Math.round(performance.now()-p);let y=w;i!==null&&typeof i=="object"&&(y=R(i)),h?this.#o=z(i):this.#o=O(n.status,{statusText:n.statusText,data:typeof i=="object"?i:void 0,detail:U(i)||(typeof i=="string"?i:""),endpoint:s}),this.#r={status:n.status,statusText:n.statusText,elapsed:g,body:y,ok:h}}catch(e){this.#o=e?.message??String(e)}finally{this.#i=!1,this.#f(),this.#v(),this.#w()}}#E(){const t=this.#m();this.#l&&(this.#l.textContent=t),this.#g?.setAttribute("value",t)}#f(){const t=this.#h;t&&(t.toggleAttribute("loading",this.#i),t.toggleAttribute("disabled",this.#i))}#v(){const t=this.#d;if(!t||(t.replaceChildren(),!this.#o))return;const s=this.#r?.ok?"warning":"danger";t.append(m`
      <iswc-callout color="${s}" variant="filled-outlined" icon="mdi:alert-outline">
        <pre class="aviso-texto">${this.#o}</pre>
      </iswc-callout>
    `)}#w(){const t=this.#p;if(!t)return;t.replaceChildren();const s=this.#r;if(!s)return;const e=document.createElement("sw-json");e.props={value:s.body,maxHeight:"32rem"},t.append(m`
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
    `)}#S(){const{op:t,spec:s}=this.#t;if(this.#s.replaceChildren(),this.#l=this.#d=this.#p=this.#h=null,!t){E(this.#s,import.meta.url,"sw-try");return}const e=this.#c,o=e.filter(a=>a.in==="path"),p=e.filter(a=>a.in==="query"||a.in==="header"),i=(a,u)=>{const d=document.createElement(a);return d.props=u,d},n=o.length?i("sw-params",{params:o,values:this.#e,disabled:this.#i,titulo:"Ruta"}):null,w=p.length?i("sw-params",{params:p,values:this.#e,disabled:this.#i,titulo:"Query y cabeceras"}):null,h=T(t)?i("sw-body",{op:t,value:this.#a,disabled:this.#i}):null,g=a=>{const{name:u,value:d}=a.detail;this.#e[u]=d,this.#E()};n?.addEventListener("sw-param-change",g),w?.addEventListener("sw-param-change",g),h?.addEventListener("sw-body-change",a=>{const u=a.detail;this.#a=u.value,this.#u=u.error;const d=h.shadowRoot?.querySelector("iswc-textarea")??null;d&&d.value!==u.value&&(d.value=u.value)});const r=x(t,s)?m`
          <section class="adjuntos">
            <h4 class="adjuntos-titulo">Archivos adjuntos</h4>
            <iswc-file-input
              class="adjuntos-input"
              multiple
              label="Adjuntar archivos"
              hint="Cualquier tipo. Van con la petición."
              ${this.#i?"disabled":""}
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
        ${w}
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
    `),this.#l=this.#s.querySelector(".preview-url"),this.#g=this.#s.querySelector(".preview-copiar"),this.#d=this.#s.querySelector(".zona-aviso"),this.#p=this.#s.querySelector(".zona-resultado"),this.#h=this.#s.querySelector(".ejecutar");const c=this.#s.querySelector(".adjuntos-input");c&&(this.#n.length&&(c.files=this.#n),c.addEventListener("iswc-change",()=>{this.#n=c.files??[]})),this.#E(),this.#v(),this.#w(),this.#f(),E(this.#s,import.meta.url,"sw-try")}}q(import.meta.url,"sw-try"),C("sw-try",$);export{$ as SwTry};
