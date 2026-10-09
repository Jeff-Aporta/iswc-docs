import{crearComponente as d,define as v,html as s,emitir as m}from"./_shared.js";import{normalizeServerBase as u}from"../../js/server-base.js";const n=d(import.meta.url,(a,{value:c,options:l},p)=>{const o=(l??[]).filter(Boolean),r=String(c??""),i=e=>{const t=u(e);t!==r&&m(p,"docs-server-change",{serverBase:t})};a.append(s`
      <div class="barra">
        <label class="etiqueta" for="server">Servidor</label>
        <iswc-input
          id="server"
          class="campo"
          full-width
          spellcheck="false"
          placeholder="https://host/api"
          value="${r}"
          oniswc-change=${e=>i(String(e.target.value??""))}
        ></iswc-input>
        ${o.length>1?s`
              <iswc-dropdown
                class="atajos"
                oniswc-select=${e=>{const t=e.detail?.item;t&&i(t.getAttribute("value")??"")}}
              >
                <iswc-button slot="trigger" variant="outlined" color="neutral" with-caret>Conocidos</iswc-button>
                ${o.map(e=>s`
                    <iswc-dropdown-item type="checkbox" value="${e}" ${e===r?"checked":""}>
                      ${e}
                    </iswc-dropdown-item>
                  `)}
              </iswc-dropdown>
            `:null}
      </div>
    `)},{value:"",options:[]},"docs-server");v("docs-server",n);export{n as DocsServer};
