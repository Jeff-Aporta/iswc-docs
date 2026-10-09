import{adoptCss as l,precargarCss as r,define as d,html as h,emitir as u}from"./_shared.js";import{caducarPrefsSiCambioBuild as p}from"../../js/prefs.js";p();const m=[{sel:".split-externo",pct:18},{sel:".split-interno",pct:36}],b=40,f="(max-width: 87.5rem)",w="(max-width: 60rem)";class c extends HTMLElement{#i;#e=null;#t=null;#s=()=>this.#o();constructor(){super(),this.#i=this.attachShadow({mode:"open"})}connectedCallback(){this.#l(),typeof matchMedia=="function"&&(this.#e=matchMedia(f),this.#t=matchMedia(w),this.#e.addEventListener("change",this.#s),this.#t.addEventListener("change",this.#s)),this.#o(),this.#c()}disconnectedCallback(){this.#e?.removeEventListener("change",this.#s),this.#t?.removeEventListener("change",this.#s),this.#e=this.#t=null}#c(){requestAnimationFrame(()=>{for(const{sel:n,pct:i}of m){const e=this.#i.querySelector(n);if(!e)continue;const t=e.getBoundingClientRect().width;if(t<1)continue;const s=Number(e.getAttribute("position-in-pixels"));Number.isFinite(s)&&s>b||(e.positionInPixels=Math.round(t*i/100))}})}get#n(){return this.#e?.matches??!1}get#a(){return this.#t?.matches??!1}abrir(n){const i=this.#i.querySelector(`iswc-drawer[data-lado="${n}"]`);i&&(i.open=!0)}#o(){const n=[["inicio",this.#a],["fin",this.#n]];for(const[i,e]of n){const t=this.#i.querySelector(e?`iswc-drawer[data-lado="${i}"] .hueco`:`.hueco-${i}`),s=this.#i.querySelector(`slot[name="${i}"]`);t&&s&&s.parentElement!==t&&t.append(s);const a=this.#i.querySelector(`iswc-split-panel[data-zona="${i}"]`);a&&(e?a.setAttribute("collapse",i==="inicio"?"start":"end"):a.removeAttribute("collapse"));const o=this.#i.querySelector(`.hamburguesa-${i}`);o&&(o.hidden=!e)}u(this,"docs-layout-modo",{inicio:this.#a?"cajon":"panel",fin:this.#n?"cajon":"panel"})}#l(){this.#i.replaceChildren(),this.#i.append(h`
      <header class="cabecera">
        <iswc-button
          class="hamburguesa hamburguesa-inicio"
          variant="plain"
          size="small"
          hidden
          aria-label="Abrir el índice de endpoints"
          oniswc-click=${()=>this.abrir("inicio")}
        ><iswc-icon icon="mdi:menu"></iswc-icon></iswc-button>

        <div class="cabecera-slot"><slot name="cabecera"></slot></div>

        <iswc-button
          class="hamburguesa hamburguesa-fin"
          variant="plain"
          size="small"
          hidden
          aria-label="Abrir la petición y la respuesta"
          oniswc-click=${()=>this.abrir("fin")}
        ><iswc-icon icon="mdi:code-braces"></iswc-icon></iswc-button>
      </header>

      <iswc-split-panel class="split-externo" data-zona="inicio" position="18" snap="14% 18% 24%" snap-threshold="16" storage-key="docs:split:inicio">
        <div slot="start" class="lateral hueco-inicio"><slot name="inicio"></slot></div>
        <div slot="end" class="resto">
          <iswc-split-panel
            class="split-interno"
            data-zona="fin"
            primary="end"
            position="36"
            snap="28% 36% 44%"
            snap-threshold="16"
            storage-key="docs:split:fin:v2"
          >
            <div slot="start" class="centro"><slot name="centro"></slot></div>
            <div slot="end" class="lateral hueco-fin"><slot name="fin"></slot></div>
          </iswc-split-panel>
        </div>
      </iswc-split-panel>

      <iswc-drawer data-lado="inicio" placement="start" label="Endpoints"><div class="hueco"></div></iswc-drawer>
      <iswc-drawer data-lado="fin" placement="end" label="Petición y respuesta"><div class="hueco"></div></iswc-drawer>
    `),l(this.#i,import.meta.url,"docs-layout")}}r(import.meta.url,"docs-layout"),d("docs-layout",c);export{c as DocsLayout};
