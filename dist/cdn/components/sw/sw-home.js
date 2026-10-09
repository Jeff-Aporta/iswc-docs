import{crearComponente as r,define as s,html as n}from"./_shared.js";import"./sw-doc.js";const a=r(import.meta.url,(i,{spec:l})=>{const e=l?.info;if(!e){i.append(n`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `);return}const c=String(e.description??"").trim();let o=null;c&&(o=document.createElement("sw-doc"),o.props={markdown:c}),i.append(n`
      <article class="home">
        <header class="home-cab">
          <h1 class="home-titulo">${e.title??"API"}</h1>
          ${e.version?n`<p class="home-version">v${e.version}</p>`:null}
        </header>
        ${o?n`<div class="home-doc">${o}</div>`:n`
              <iswc-callout color="neutral" variant="plain" icon="mdi:book-open-page-variant-outline">
                Elige una operación en el índice para ver su documentación.
              </iswc-callout>
            `}
      </article>
    `)},{spec:null},"sw-home");s("sw-home",a);export{a as SwHome};
