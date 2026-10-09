import{crearComponente as u,define as w,emitir as p,html as c,avisar as n}from"./_shared.js";import{buildExportFormats as g,descargarTexto as b}from"../../js/export.js";const a=u(import.meta.url,(r,{spec:s,config:l},d)=>{const t=g(s,l??{});r.append(c`
      <iswc-button-group class="grupo" pill label="Documento" aria-label="Documento">
        ${t.length?c`
              <iswc-dropdown
                class="dl"
                placement="bottom-end"
                oniswc-select=${i=>{const m=i.detail?.item?.getAttribute("value"),e=t.find(o=>o.id===m);e&&(async()=>{try{e.id==="postman"&&n("Generando Postman (diagramas \u2192 PNG)\u2026","brand");const o=await Promise.resolve(e.build());b(e.filename,o),n(`Descargado: ${e.filename}`,"success")}catch(o){n(`No se pudo generar el archivo: ${o?.message??o}`,"danger")}})()}}
              >
                <iswc-button
                  slot="trigger"
                  variant="outlined"
                  color="neutral"
                  aria-label="Descargar documento"
                  title="Descargar documento"
                >
                  <iswc-icon icon="mdi:download-outline"></iswc-icon>
                </iswc-button>
                ${t.map(i=>c`
                    <iswc-dropdown-item value="${i.id}">
                      <iswc-icon slot="icon" icon="${i.icon}"></iswc-icon>
                      ${i.label}
                    </iswc-dropdown-item>
                  `)}
              </iswc-dropdown>
            `:null}
        <iswc-button
          class="rl"
          variant="outlined"
          color="neutral"
          aria-label="Actualizar documentación"
          title="Actualizar desde el servidor (ignora cache local de 24 h)"
          oniswc-click=${()=>p(d,"sw-doc-reload",null)}
        >
          <iswc-icon icon="mdi:refresh"></iswc-icon>
        </iswc-button>
      </iswc-button-group>
    `)},{spec:null,config:{}},"sw-doc-actions");w("sw-doc-actions",a);export{a as SwDocActions};
