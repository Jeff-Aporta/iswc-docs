import{crearComponente as r,define as s,html as n}from"./_shared.js";import"./sw-doc.js";const l=r(import.meta.url,(i,{spec:c})=>{const e=c?.info;if(!e){i.append(n`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `);return}const a=String(e.description??"").trim();let o=null;a&&(o=document.createElement("sw-doc"),o.props={markdown:a}),i.append(n`
      <article class="home">
        <header class="home-cab">
          <h1 class="home-titulo">${e.title??"API"}</h1>
          ${e.version?n`<p class="home-version">v${e.version}</p>`:null}
        </header>
        ${o?n`<div class="home-doc">${o}</div>`:n`
              <is-callout color="neutral" variant="plain" icon="mdi:book-open-page-variant-outline">
                Elige una operación en el índice para ver su documentación.
              </is-callout>
            `}
      </article>
    `)},{spec:null},"sw-home");s("sw-home",l);export{l as SwHome};
