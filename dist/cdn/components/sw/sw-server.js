import{crearComponente as v,define as d,html as s,emitir as m}from"./_shared.js";import{normalizeServerBase as u}from"../../js/server-base.js";const n=v(import.meta.url,(a,{value:c,options:l},p)=>{const i=(l??[]).filter(Boolean),r=String(c??""),o=e=>{const t=u(e);t!==r&&m(p,"sw-server-change",{serverBase:t})};a.append(s`
      <div class="barra">
        <label class="etiqueta" for="server">Servidor</label>
        <iswc-input
          id="server"
          class="campo"
          full-width
          spellcheck="false"
          placeholder="https://host/api"
          value="${r}"
          oniswc-change=${e=>o(String(e.target.value??""))}
        ></iswc-input>
        ${i.length>1?s`
              <iswc-dropdown
                class="atajos"
                oniswc-select=${e=>{const t=e.detail?.item;t&&o(t.getAttribute("value")??"")}}
              >
                <iswc-button slot="trigger" variant="outlined" color="neutral" with-caret>Conocidos</iswc-button>
                ${i.map(e=>s`
                    <iswc-dropdown-item type="checkbox" value="${e}" ${e===r?"checked":""}>
                      ${e}
                    </iswc-dropdown-item>
                  `)}
              </iswc-dropdown>
            `:null}
      </div>
    `)},{value:"",options:[]},"sw-server");d("sw-server",n);export{n as SwServer};
