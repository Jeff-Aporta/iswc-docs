import{crearComponente as n,define as v,emitir as p,html as t}from"./_shared.js";import{DRIVERS as w,driverMeta as a,readDriver as d,writeDriver as m}from"../../js/driver.js";const l=n(import.meta.url,(s,{value:c},o)=>{const i=c||d();s.append(t`
      <iswc-select
        class="selector"
        size="small"
        value="${i}"
        title="${a(i).detalle}"
        aria-label="Presentación de la documentación"
        oniswc-change=${e=>{const r=String(e.target.value??"");m(r),p(o,"sw-driver-change",{driver:a(r).id})}}
      >
        ${w.map(e=>t`<iswc-option value="${e.id}" title="${e.detalle}">${e.label}</iswc-option>`)}
      </iswc-select>
    `)},{value:""},"sw-driver-switch");v("sw-driver-switch",l);export{l as SwDriverSwitch};
