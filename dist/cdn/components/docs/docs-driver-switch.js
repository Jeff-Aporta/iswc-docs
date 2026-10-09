import{crearComponente as n,define as d,emitir as v,html as t}from"./_shared.js";import{DRIVERS as p,driverMeta as c,readDriver as m,writeDriver as w}from"../../js/driver.js";const o=n(import.meta.url,(a,{value:s},l)=>{const i=s||m();a.append(t`
      <iswc-select
        class="selector"
        size="small"
        value="${i}"
        title="${c(i).detalle}"
        aria-label="Presentación de la documentación"
        oniswc-change=${e=>{const r=String(e.target.value??"");w(r),v(l,"docs-driver-change",{driver:c(r).id})}}
      >
        ${p.map(e=>t`<iswc-option value="${e.id}" title="${e.detalle}">${e.label}</iswc-option>`)}
      </iswc-select>
    `)},{value:""},"docs-driver-switch");d("docs-driver-switch",o);export{o as DocsDriverSwitch};
