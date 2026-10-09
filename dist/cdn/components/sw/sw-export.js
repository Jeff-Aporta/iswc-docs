import{crearComponente as l,define as p,html as r,avisar as n}from"./_shared.js";import{buildExportFormats as w,descargarTexto as u}from"../../js/export.js";const a=l(import.meta.url,(s,{spec:c,config:d})=>{const i=w(c,d??{});i.length&&s.append(r`
      <iswc-dropdown
        class="menu"
        placement="bottom-end"
        oniswc-select=${e=>{const m=e.detail?.item?.getAttribute("value"),t=i.find(o=>o.id===m);t&&(async()=>{try{t.id==="postman"&&n("Generando Postman (diagramas \u2192 PNG)\u2026","brand");const o=await Promise.resolve(t.build());u(t.filename,o),n(`Descargado: ${t.filename}`,"success")}catch(o){n(`No se pudo generar el archivo: ${o?.message??o}`,"danger")}})()}}
      >
        <iswc-button slot="trigger" variant="plain" color="neutral" aria-label="Descargar documento" title="Descargar documento">
          <iswc-icon icon="mdi:download-outline"></iswc-icon>
        </iswc-button>
        ${i.map(e=>r`
            <iswc-dropdown-item value="${e.id}">
              <iswc-icon slot="icon" icon="${e.icon}"></iswc-icon>
              ${e.label}
            </iswc-dropdown-item>
          `)}
      </iswc-dropdown>
    `)},{spec:null,config:{}},"sw-export");p("sw-export",a);export{a as SwExport};
