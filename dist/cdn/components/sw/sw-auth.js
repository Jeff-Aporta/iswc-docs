import{adoptCss as l,precargarCss as v,define as g,html as a,emitir as b,avisar as r}from"./_shared.js";import{clearJwt as f,fetchTestJwt as k,getStoredJwt as E,normalizeJwt as S,readCredentials as T,saveCredentials as L,sessionLabel as $,storeJwt as c}from"../../js/auth.js";class d extends HTMLElement{#e;#a={authEnabled:!1,auth:{},session:null};#s=null;#i=!1;#t="";constructor(){super(),this.#e=this.attachShadow({mode:"open"})}connectedCallback(){this.#o()}get props(){return this.#a}set props(e){this.#a={...this.#a,...e??{}},this.isConnected&&this.#o()}abrirLogin(e){e&&(this.#t=e),this.#o(),this.#s?.show()}#n(){b(this,"sw-session-change",{session:E()})}async#r(e,s,o){const{auth:t}=this.#a;this.#i=!0,this.#t="",this.#o(),this.#s?.show();try{const i=await k(t.loginUrl,e,s,{loginPath:t.loginPath,loginKind:t.loginKind,appId:t.app,provider:t.provider});c(i.token,{username:e,nombre:i.nombre,expiresAt:i.expiresAt}),L(e,s,o),this.#i=!1,this.#n(),r("Sesi\xF3n iniciada.","success"),this.#s?.hide()}catch(i){this.#i=!1,this.#t=i?.message??String(i),this.#o(),this.#s?.show()}}#l(e){const s=S(e);if(!s){this.#t="Pega un JWT v\xE1lido (con o sin el prefijo \xABBearer\xBB).",this.#o(),this.#s?.show();return}c(s,{username:"JWT pegado"}),this.#n(),r("Token guardado para esta pesta\xF1a.","success"),this.#s?.hide()}#c(){f(),this.#n(),r("Sesi\xF3n cerrada.")}#o(){const{authEnabled:e,session:s}=this.#a;if(this.#e.replaceChildren(),this.#s=null,!e){l(this.#e,import.meta.url,"sw-auth");return}const o=T(),t=!!s?.token;this.#e.append(a`
      <div class="auth">
        ${t?a`
              <iswc-dropdown class="menu">
                <iswc-button slot="trigger" variant="outlined" color="success" with-caret>
                  <iswc-icon slot="start" icon="mdi:account-check-outline"></iswc-icon>
                  ${$(s)}
                </iswc-button>
                <iswc-dropdown-item onclick=${()=>this.abrirLogin()}>Cambiar sesión</iswc-dropdown-item>
                <iswc-dropdown-item color="danger" onclick=${()=>this.#c()}>Cerrar sesión</iswc-dropdown-item>
              </iswc-dropdown>
            `:a`
              <iswc-button variant="outlined" color="neutral" oniswc-click=${()=>this.abrirLogin()}>
                <iswc-icon slot="start" icon="mdi:login-variant"></iswc-icon>
                Iniciar sesión
              </iswc-button>
            `}

        <iswc-dialog class="dialogo" label="Sesión para probar endpoints">
          ${this.#t?a`
                <iswc-callout color="danger" variant="filled-outlined" icon="mdi:alert-outline">
                  <pre class="error">${this.#t}</pre>
                </iswc-callout>
              `:null}

          <form
            class="formulario"
            onsubmit=${h=>{h.preventDefault();const n=this.#e,p=n.querySelector("#usuario")?.value??"",w=n.querySelector("#clave")?.value??"",m=n.querySelector("#recordar")?.checked??!1;this.#r(p,w,m)}}
          >
            <iswc-input
              id="usuario"
              full-width
              label="Usuario o correo"
              autocomplete="username"
              value="${o.username}"
              ${this.#i?"disabled":""}
            ></iswc-input>
            <iswc-input
              id="clave"
              type="password"
              full-width
              password-toggle
              label="Contraseña"
              autocomplete="current-password"
              value="${o.password}"
              ${this.#i?"disabled":""}
            ></iswc-input>
            <iswc-checkbox id="recordar" ${o.remember?"checked":""}>
              Recordar en este equipo
            </iswc-checkbox>
            <p class="nota">
              El token vive solo en esta pestaña. «Recordar» guarda las credenciales
              ofuscadas en este navegador; no lo actives en un equipo compartido.
            </p>
            <iswc-button type="submit" color="brand" ${this.#i?"loading":""}>Entrar</iswc-button>
          </form>

          <iswc-divider></iswc-divider>

          <div class="pegar">
            <iswc-input
              id="token"
              full-width
              label="…o pega un JWT"
              placeholder="eyJhbGciOi…"
              spellcheck="false"
            ></iswc-input>
            <iswc-button
              variant="outlined"
              color="neutral"
              oniswc-click=${()=>this.#l(this.#e.querySelector("#token")?.value??"")}
            >
              Usar token
            </iswc-button>
          </div>
        </iswc-dialog>
      </div>
    `),this.#s=this.#e.querySelector(".dialogo");const i=this.#e.querySelector('iswc-button[type="submit"]'),u=this.#e.querySelector("form");i?.addEventListener("iswc-click",()=>u?.requestSubmit()),l(this.#e,import.meta.url,"sw-auth")}}v(import.meta.url,"sw-auth"),g("sw-auth",d);export{d as SwAuth};
