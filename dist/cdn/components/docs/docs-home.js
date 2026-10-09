import{crearComponente as r,define as s,html as o}from"./_shared.js";import"./docs-doc.js";const a=r(import.meta.url,(c,{spec:l})=>{const e=l?.info;if(!e){c.append(o`
        <div class="vacio">
          <p>Elige una operación en el índice para ver su documentación.</p>
        </div>
      `);return}const i=String(e.description??"").trim();let n=null;i&&(n=document.createElement("docs-doc"),n.props={markdown:i}),c.append(o`
      <article class="home">
        <header class="home-cab">
          <h1 class="home-titulo">${e.title??"API"}</h1>
          ${e.version?o`<p class="home-version">v${e.version}</p>`:null}
        </header>
        ${n?o`<div class="home-doc">${n}</div>`:o`
              <iswc-callout color="neutral" variant="plain" icon="mdi:book-open-page-variant-outline">
                Elige una operación en el índice para ver su documentación.
              </iswc-callout>
            `}
      </article>
    `)},{spec:null},"docs-home");s("docs-home",a);export{a as DocsHome};
