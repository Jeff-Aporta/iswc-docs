import{adoptCss as l,precargarCss as u,define as h,html as n}from"./_shared.js";import{buildCurl as m}from"../../js/curl.js";import{defaultTryItBodyText as b,formatBodyExample as y,resolveTryItBodyExample as f,resolveTryItBodyExamples as g}from"../../js/tryit-body.js";import{jsonPretty as a,extractJsonExample as v,responseTone as E,toneToIsColor as j}from"../../js/openapi.js";import"./docs-json.js";class c extends HTMLElement{#t;#e={op:null,spec:null,serverBase:"",requiereBearer:!1};#s="";#o="";#i="curl";#a=null;#c=null;#n=null;#r=null;constructor(){super(),this.#t=this.attachShadow({mode:"open"})}connectedCallback(){this.#b()}get props(){return this.#e}set props(t){const e=this.#e.op?.operationId;this.#e={...this.#e,...t??{}},this.#e.op?.operationId!==e&&(this.#s="",this.#o="",this.#i="curl"),this.isConnected&&this.#b()}get#d(){return g(this.#e.op??void 0)}get#l(){const t=this.#d;return t.length?(t.find(s=>s.id===this.#o)??t[0])?.example:f(this.#e.op??void 0)}get#y(){const t=this.#l;return t!==void 0?y(t):b(this.#e.op??void 0)}get#f(){const{op:t,spec:e,serverBase:s,requiereBearer:o}=this.#e;return m(t,e,s,o,this.#l).texto}get#u(){return this.#i==="body"?this.#y:this.#f}get#g(){return Object.keys(this.#e.op?.responses??{}).sort((e,s)=>{const o=Number(e)||999,r=Number(s)||999;return o-r})}#v(t){const e=this.#e.op?.responses?.[t],s=v(e?.content?.["application/json"]);if(s!=null)return a(s);const o=e?.content?.["application/json"]?.schema;return o?a(o):e?.description?`// ${e.description}`:"// Sin cuerpo documentado"}#p(){const t=this.#c;if(!t)return;for(const s of this.#t.querySelectorAll(".vista"))s.toggleAttribute("data-activo",s.dataset.vista===this.#i);for(const s of this.#t.querySelectorAll(".ejemplo"))s.toggleAttribute("data-activo",s.dataset.id===this.#o);const e=document.createElement("docs-json");e.props={value:this.#u,lang:this.#i==="body"?"json":"shell",maxHeight:this.#i==="body"?"22rem":"18rem"},t.replaceChildren(e),this.#n&&(this.#n.value=this.#u)}#h(){const t=this.#a;if(!t)return;for(const o of this.#t.querySelectorAll(".estado"))o.toggleAttribute("data-activo",o.dataset.code===this.#s);const e=this.#v(this.#s),s=document.createElement("docs-json");s.props={value:e,lang:"json",maxHeight:"26rem"},t.replaceChildren(s),this.#r&&(this.#r.value=e)}#E(t){this.#o=t,this.#p()}#m(t){this.#i=t,this.#p()}#b(){const{op:t}=this.#e;if(this.#t.replaceChildren(),this.#a=null,this.#c=null,this.#n=null,this.#r=null,!t){l(this.#t,import.meta.url,"docs-minidoc-code");return}const e=this.#d;e.length?e.some(i=>i.id===this.#o)||(this.#o=e[0].id):this.#o="";const s=this.#l!==void 0&&this.#l!==null,o=this.#g;(!this.#s||!o.includes(this.#s))&&(this.#s=o[0]??"");const r=e.length?n`
          <div class="ejemplos" role="group" aria-label="Ejemplos de body">
            ${e.map(i=>n`
                <button
                  type="button"
                  class="ejemplo"
                  data-id="${i.id}"
                  title="Usar este body en cURL y Body raw"
                  onclick=${()=>this.#E(i.id)}
                >${i.label}</button>
              `)}
          </div>
        `:null,p=s?n`
          <button type="button" class="vista" data-vista="curl" onclick=${()=>this.#m("curl")}>cURL</button>
          <button type="button" class="vista" data-vista="body" onclick=${()=>this.#m("body")}>Body raw</button>
        `:n`<span class="panel-titulo">cURL</span>`,d=o.map(i=>n`
        <button
          type="button"
          class="estado"
          data-code="${i}"
          data-tono="${E(i)}"
          onclick=${()=>{this.#s=i,this.#h()}}
        >${i}</button>
      `);this.#t.append(n`
      <section class="panel">
        <header class="panel-cab vistas" role="tablist" aria-label="Formato de la petición">
          ${p}
          <iswc-copy-button class="al-final" copy-label="Copiar petición"></iswc-copy-button>
        </header>
        ${r}
        <div class="peticion"></div>
      </section>

      <section class="panel">
        <header class="panel-cab estados" role="tablist">
          ${d}
          <iswc-copy-button class="al-final" copy-label="Copiar respuesta"></iswc-copy-button>
        </header>
        <div class="cuerpo"></div>
      </section>
    `),this.#c=this.#t.querySelector(".peticion"),this.#a=this.#t.querySelector(".cuerpo"),this.#n=this.#t.querySelector(".vistas iswc-copy-button"),this.#r=this.#t.querySelector(".estados iswc-copy-button"),this.#p(),this.#h(),l(this.#t,import.meta.url,"docs-minidoc-code")}}u(import.meta.url,"docs-minidoc-code"),h("docs-minidoc-code",c);export{c as DocsMinidocCode,j as toneToIsColor};
