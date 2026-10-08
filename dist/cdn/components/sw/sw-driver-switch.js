import{crearComponente as c,define as v,emitir as p,html as t}from"./_shared.js";import{DRIVERS as d,driverMeta as a,readDriver as m,writeDriver as w}from"../../js/driver.js";const l=c(import.meta.url,(s,{value:o},n)=>{const i=o||m();s.append(t`
      <is-select
        class="selector"
        size="small"
        value="${i}"
        title="${a(i).detalle}"
        aria-label="Presentación de la documentación"
        onis-change=${e=>{const r=String(e.target.value??"");w(r),p(n,"sw-driver-change",{driver:a(r).id})}}
      >
        ${d.map(e=>t`<is-option value="${e.id}" title="${e.detalle}">${e.label}</is-option>`)}
      </is-select>
    `)},{value:""},"sw-driver-switch");v("sw-driver-switch",l);export{l as SwDriverSwitch};
