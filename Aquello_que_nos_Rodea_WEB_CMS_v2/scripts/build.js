
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function readJSON(p){ return JSON.parse(fs.readFileSync(p,'utf8')); }
function esc(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function copyDir(src,dst){
  fs.mkdirSync(dst,{recursive:true});
  for(const ent of fs.readdirSync(src,{withFileTypes:true})){
    const a=path.join(src,ent.name), b=path.join(dst,ent.name);
    ent.isDirectory()?copyDir(a,b):fs.copyFileSync(a,b);
  }
}
function inlineMarkdown(s){
  let x=esc(s);
  x=x.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  x=x.replace(/\*(.+?)\*/g,'<em>$1</em>');
  return x;
}
function markdownToHTML(src=''){
  return String(src).replace(/\r\n/g,'\n').split(/\n\s*\n/)
    .map(b=>b.trim()).filter(Boolean)
    .map(b=>{
      if(/^###\s+/.test(b)) return `<h3>${inlineMarkdown(b.replace(/^###\s+/,''))}</h3>`;
      if(/^##\s+/.test(b)) return `<h2>${inlineMarkdown(b.replace(/^##\s+/,''))}</h2>`;
      if(/^#\s+/.test(b)) return `<h1>${inlineMarkdown(b.replace(/^#\s+/,''))}</h1>`;
      return `<p>${inlineMarkdown(b).replace(/\n/g,'<br>')}</p>`;
    }).join('\n');
}
function head(title, desc, image='/assets/img/hero.webp'){
 return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#070706"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">
<meta property="og:image" content="${esc(image)}"><link rel="icon" href="assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css"><script defer src="assets/js/main.js"></script></head>`;
}
function header(active=''){
 return `<div class="grain" aria-hidden="true"></div><header class="site-header">
<a class="brand" href="index.html"><span class="brand-mark">◉</span><span>AQUELLO QUE NOS RODEA</span></a>
<button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button>
<nav class="main-nav">
<a href="index.html" class="nav-link ${active==='inicio'?'active':''}">Inicio</a>
<a href="relatos.html" class="nav-link ${active==='relatos'?'active':''}">Relatos</a>
<a href="archivo.html" class="nav-link ${active==='archivo'?'active':''}">El Archivo</a>
<a href="sobre.html" class="nav-link ${active==='sobre'?'active':''}">Dylan P. MOЯBO</a>
</nav></header>`;
}
function footer(site){
 return `<footer class="site-footer"><div class="footer-sigil">◉</div>
<p><strong>${esc(site.site_title).toUpperCase()}</strong></p>
<p>Un universo de horror creado por <strong>${esc(site.author)}</strong>.</p>
<p class="footer-small">${esc(site.footer_note)}</p>
<p class="footer-small">© 2026 ${esc(site.author)}. Todos los derechos reservados.</p></footer>`;
}
function wordCount(s){return String(s).trim().split(/\s+/).filter(Boolean).length;}

if(fs.existsSync(DIST)) fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
copyDir(path.join(ROOT,'assets'),path.join(DIST,'assets'));
copyDir(path.join(ROOT,'admin'),path.join(DIST,'admin'));

const site=readJSON(path.join(ROOT,'content/config/site.json'));
const archiveBookPath=path.join(ROOT,'content/config/libro-archivo.json');
const archiveBook=fs.existsSync(archiveBookPath)?readJSON(archiveBookPath):{enabled:false,pages:[]};
const archiveBookPages=Array.isArray(archiveBook.pages)?archiveBook.pages.filter(p=>p && p.image && p.enabled!==false):[];
const storyDir=path.join(ROOT,'content/relatos');
const stories=fs.readdirSync(storyDir).filter(x=>x.endsWith('.json')).map(x=>readJSON(path.join(storyDir,x)))
 .filter(s=>s.published!==false)
 .sort((a,b)=>String(a.archive_number).localeCompare(String(b.archive_number),undefined,{numeric:true}));

const archiveDir=path.join(ROOT,'content/archivo');
const archiveEntries=fs.existsSync(archiveDir)
 ? fs.readdirSync(archiveDir).filter(x=>x.endsWith('.json')).map(x=>readJSON(path.join(archiveDir,x)))
    .filter(x=>x.published!==false)
    .sort((a,b)=>String(a.category).localeCompare(String(b.category)) || String(a.archive_number).localeCompare(String(b.archive_number),undefined,{numeric:true}))
 : [];

const characterDir=path.join(ROOT,'content/personajes');
const characters=fs.existsSync(characterDir)
 ? fs.readdirSync(characterDir).filter(x=>x.endsWith('.json')).map(x=>readJSON(path.join(characterDir,x)))
    .filter(x=>x.published!==false)
    .sort((a,b)=>String(a.archive_number).localeCompare(String(b.archive_number),undefined,{numeric:true}) || String(a.name).localeCompare(String(b.name)))
 : [];

const connectionsDir=path.join(ROOT,'content/conexiones');
const connections=fs.existsSync(connectionsDir)
 ? fs.readdirSync(connectionsDir).filter(x=>x.endsWith('.json')).map(x=>readJSON(path.join(connectionsDir,x)))
    .filter(x=>x.published!==false)
    .sort((a,b)=>String(a.archive_number).localeCompare(String(b.archive_number),undefined,{numeric:true}))
 : [];

const featured=stories.find(s=>s.featured)||stories[0];

// HOME
const home = `${head(`${site.site_title} | ${site.author}`,site.tagline)}<body class="home">${header('inicio')}<main>
<section class="hero"><div class="hero-bg"></div><div class="hero-content reveal">
<p class="eyebrow">ARCHIVO // ACCESO PARCIAL</p><h1>AQUELLO QUE<br>NOS RODEA</h1>
<p class="hero-lead">${esc(site.tagline)}</p><div class="hero-actions">
<a class="btn primary" href="relatos.html">Leer los relatos</a><a class="btn ghost" href="archivo.html">Entrar en el archivo</a>
</div></div><div class="scroll-cue">DESCIENDE <span>↓</span></div></section>
<section class="section intro reveal"><div class="section-label">01 // EL UMBRAL</div><div class="intro-grid">
<h2>${esc(site.intro_title.split('Hasta')[0])}<br><em>${site.intro_title.includes('Hasta')?'Hasta'+esc(site.intro_title.split('Hasta').slice(1).join('Hasta')):''}</em></h2>
<div><p>${esc(site.intro_text)}</p><p>${esc(site.intro_text_2)}</p></div></div></section>
${featured?`<section class="section feature reveal"><div class="section-label">02 // RELATO DESTACADO</div><div class="feature-card">
<a class="feature-image" href="relato-${esc(featured.slug)}.html"><img src="${esc(featured.cover)}" alt="Portada de ${esc(featured.title)}"></a>
<div class="feature-copy"><p class="archive-code">ARCHIVO ${esc(featured.archive_number)}${featured.age_restricted?' · +18':''}</p>
<h2>${esc(featured.title).toUpperCase()}</h2><p>${esc(featured.excerpt)}</p>
<div class="meta-row"><span>Relato completo</span><span>Lectura: ${esc(featured.reading_time)}</span></div>
<a class="text-link" href="relato-${esc(featured.slug)}.html">ABRIR EL EXPEDIENTE →</a></div></div></section>`:''}
<section class="quote-band reveal"><blockquote>«El pánico estropea el sabor.»</blockquote><span>— Archivo 001</span></section>
<section class="cta reveal"><p class="eyebrow">EL ARCHIVO ACABA DE ABRIRSE</p><h2>Algunas cosas deberían permanecer ocultas.</h2>
<a class="btn primary" href="archivo.html">Seguir investigando</a></section></main>${footer(site)}</body></html>`;
fs.writeFileSync(path.join(DIST,'index.html'),home);

// STORIES LIST
const rows=stories.map(s=>`<article class="story-row">
<a class="story-thumb" href="relato-${esc(s.slug)}.html"><img src="${esc(s.cover)}" alt="Portada de ${esc(s.title)}"></a>
<div class="story-info"><p class="archive-code">ARCHIVO ${esc(s.archive_number)}${s.age_restricted?' · +18':''}</p>
<h2><a href="relato-${esc(s.slug)}.html">${esc(s.title).toUpperCase()}</a></h2>
<p>${esc(s.excerpt)}</p><div class="meta-row"><span>${wordCount(s.body).toLocaleString('es-ES')} palabras</span><span>${esc(s.reading_time)}</span></div>
<a class="text-link" href="relato-${esc(s.slug)}.html">ABRIR EXPEDIENTE →</a></div></article>`).join('');
const list=`${head(`Relatos | ${site.site_title}`,'Relatos de '+site.author)}<body>${header('relatos')}<main>
<section class="page-hero compact"><div><p class="eyebrow">ÍNDICE DE EXPEDIENTES</p><h1>RELATOS</h1><p>Historias independientes. Al menos al principio.</p></div></section>
<section class="section"><div class="section-label">ARCHIVOS DISPONIBLES // ${String(stories.length).padStart(2,'0')}</div><div class="story-list">${rows}</div></section>
</main>${footer(site)}</body></html>`;
fs.writeFileSync(path.join(DIST,'relatos.html'),list);

// INDIVIDUAL STORIES
for(const s of stories){
 const wc=wordCount(s.body);
 const warning=s.age_restricted?`<section class="content-warning reveal"><div class="warning-mark">!</div><div>
 <h2>Advertencia de contenido</h2><p>${esc(s.content_warning||'Contenido dirigido a público adulto.')}</p></div></section>`:'';
 const gate=s.age_restricted?`<div class="age-gate" id="ageGate" role="dialog" aria-modal="true"><div class="age-panel">
 <div class="age-symbol">◉</div><p class="eyebrow">ARCHIVO ${esc(s.archive_number)} // ACCESO RESTRINGIDO</p><h2>Contenido para adultos</h2>
 <p>${esc(s.content_warning||'Este relato está dirigido a público adulto.')}</p>
 <button class="btn primary" id="ageEnter">Tengo 18 años o más</button><a class="btn ghost" href="relatos.html">Salir del expediente</a></div></div>`:'';
 const page=`${head(`${s.title} | ${site.author}`,s.excerpt,s.cover)}<body class="story-page">${header('relatos')}<main>
 <div class="reading-progress"><span></span></div><section class="story-hero">
 <div class="story-cover"><img src="${esc(s.cover)}" alt="Portada de ${esc(s.title)}"></div>
 <div class="story-heading"><p class="archive-code">ARCHIVO ${esc(s.archive_number)} · RELATO COMPLETO${s.age_restricted?' · +18':''}</p>
 <h1>${esc(s.title).toUpperCase()}</h1><p class="byline">por <strong>${esc(site.author)}</strong></p>
 <div class="meta-row"><span>${wc.toLocaleString('es-ES')} palabras</span><span>${esc(s.reading_time)}</span></div>
 <a class="btn primary" href="#relato">Comenzar lectura</a></div></section>${warning}
 <section class="reader-shell" id="relato"><aside class="reader-tools"><button data-reader="minus">A−</button><button data-reader="plus">A+</button><button data-reader="focus">◐</button></aside>
 <article class="story-text"><div class="story-marker">ARCHIVO ${esc(s.archive_number)}</div>${markdownToHTML(s.body)}<div class="story-end">FIN</div></article></section>
 <section class="post-story reveal"><p class="eyebrow">HAS TERMINADO EL ARCHIVO ${esc(s.archive_number)}</p><h2>El archivo permanece abierto.</h2>
 <div class="hero-actions"><a class="btn primary" href="archivo.html">Consultar el archivo</a><a class="btn ghost" href="relatos.html">Volver a relatos</a></div></section>
 ${gate}</main>${footer(site)}</body></html>`;
 fs.writeFileSync(path.join(DIST,`relato-${s.slug}.html`),page);
}


// EL ARCHIVO — índice por secciones + tarjetas de resumen + expediente completo por entrada
function archiveSlug(value=''){
 return String(value)
   .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
   .toLowerCase()
   .replace(/[^a-z0-9]+/g,'-')
   .replace(/^-+|-+$/g,'');
}
function plainArchiveText(value=''){
 return String(value)
   .replace(/<[^>]*>/g,' ')
   .replace(/[#*_>`~\[\]()!-]/g,' ')
   .replace(/\s+/g,' ')
   .trim();
}
function shortArchiveText(value='',max=230){
 const text=plainArchiveText(value);
 return text.length>max ? `${text.slice(0,max).trimEnd()}…` : text;
}
function archiveByCategory(cat){ return archiveEntries.filter(x=>(x.category||'ARCHIVO')===cat); }

const archiveSectionDefs=[
 {key:'entidades',label:'ENTIDADES',typeLabel:'ENTIDAD',eyebrow:'CATÁLOGO // ENTIDADES',desc:'Seres, presencias y formas de vida cuya existencia ha quedado registrada.',items:archiveByCategory('ENTIDAD'),file:'archivo-entidades.html',image:'/assets/img/archivo-secciones/entidades.png'},
 {key:'personajes',label:'PERSONAJES',typeLabel:'PERSONA',eyebrow:'CATÁLOGO // PERSONAS',desc:'Individuos relacionados con los expedientes, los sucesos y aquello que permanece oculto.',items:characters,file:'archivo-personajes.html',image:'/assets/img/archivo-secciones/personajes.png'},
 {key:'lugares',label:'LUGARES',typeLabel:'LUGAR',eyebrow:'CATÁLOGO // LUGARES',desc:'Localizaciones vinculadas a anomalías, testimonios o acontecimientos registrados.',items:archiveByCategory('LUGAR'),file:'archivo-lugares.html',image:'/assets/img/archivo-secciones/lugares.png'},
 {key:'planos',label:'PLANOS',typeLabel:'PLANO',eyebrow:'CATÁLOGO // PLANOS',desc:'Capas de realidad, territorios dimensionales y estructuras que existen fuera de las coordenadas ordinarias.',items:archiveByCategory('PLANO'),file:'archivo-planos.html',image:'/assets/img/archivo-secciones/planos.png'},
 {key:'organizaciones',label:'ORGANIZACIONES',typeLabel:'ORGANIZACIÓN',eyebrow:'CATÁLOGO // ORGANIZACIONES',desc:'Grupos, cultos, instituciones y redes cuya actividad aparece en los archivos.',items:archiveByCategory('ORGANIZACIÓN'),file:'archivo-organizaciones.html',image:'/assets/img/archivo-secciones/organizaciones.png'},
 {key:'documentos',label:'DOCUMENTOS',typeLabel:'DOCUMENTO',eyebrow:'CATÁLOGO // DOCUMENTOS',desc:'Textos, pruebas, registros y materiales recuperados o parcialmente descifrados.',items:archiveByCategory('DOCUMENTO'),file:'archivo-documentos.html',image:'/assets/img/archivo-secciones/documentos.png'},
 {key:'sucesos',label:'SUCESOS',typeLabel:'SUCESO',eyebrow:'CATÁLOGO // SUCESOS',desc:'Incidentes cuya explicación permanece incompleta, contradictoria o clasificada.',items:archiveByCategory('SUCESO'),file:'archivo-sucesos.html',image:'/assets/img/archivo-secciones/sucesos.png'},
 {key:'otros',label:'OTROS ARCHIVOS',typeLabel:'ARCHIVO',eyebrow:'CATÁLOGO // OTROS',desc:'Anotaciones que todavía no encajan en una clasificación estable.',items:archiveByCategory('OTRO'),file:'archivo-otros.html',image:'/assets/img/archivo-secciones/otros.png'},
 {key:'conexiones',label:'CONEXIONES',typeLabel:'CONEXIÓN',eyebrow:'ÍNDICE // CONEXIONES',desc:'Coincidencias, vínculos y patrones que conectan expedientes aparentemente independientes.',items:connections,file:'archivo-conexiones.html',image:'/assets/img/archivo-secciones/conexiones.png'}
];

function itemTitle(section,item){
 if(!item) return 'SIN ANOTACIONES';
 return section.key==='personajes' ? (item.name||item.title||'SIN NOMBRE') : (item.title||item.name||'SIN TÍTULO');
}
function itemSummary(section,item){
 if(!item) return 'Todavía no hay información pública en esta sección.';
 if(item.summary) return shortArchiveText(item.summary);
 if(item.note) return shortArchiveText(item.note);
 if(item.body) return shortArchiveText(item.body);
 if(section.key==='conexiones') return `Estado: ${item.status||'DESCONOCIDO'}.`;
 return 'Expediente disponible para consulta.';
}
function itemImage(item){ return item && item.image ? item.image : ''; }
function itemStatus(item){ return item && item.status ? item.status : ''; }
function itemArchiveNumber(item){ return item && item.archive_number ? item.archive_number : '—'; }
function itemSlug(section,item){
 const custom=archiveSlug(item.slug||'');
 const fromTitle=archiveSlug(itemTitle(section,item));
 const fromNumber=archiveSlug(itemArchiveNumber(item));
 return custom || fromTitle || `expediente-${fromNumber||'sin-numero'}`;
}
function itemHref(section,item){ return `archivo-${section.key}-${itemSlug(section,item)}.html`; }
function itemFacts(section,item){
 const facts=[];
 if(itemStatus(item)) facts.push({label:'Estado',value:itemStatus(item)});
 if(section.key==='personajes'){
   if(item.alias) facts.push({label:'Alias',value:item.alias});
   if(item.age) facts.push({label:'Edad',value:item.age});
   if(item.occupation) facts.push({label:'Ocupación',value:item.occupation});
 }
 for(const fact of (Array.isArray(item.facts)?item.facts:[])){
   if(fact && (fact.label || fact.value)) facts.push({label:fact.label||'Dato',value:fact.value||'—'});
 }
 return facts;
}
function latestItem(section){ return section.items.length ? section.items[section.items.length-1] : null; }
function archiveTopNav(activeKey='index'){
 const indexLink=`<a href="archivo.html" class="${activeKey==='index'?'active':''}" ${activeKey==='index'?'aria-current="page"':''}>EL ARCHIVO</a>`;
 const sectionLinks=archiveSectionDefs.map(s=>`<a href="${s.file}" class="${activeKey===s.key?'active':''}" ${activeKey===s.key?'aria-current="page"':''}>${s.label}</a>`).join('');
 return `<div class="archive-top-nav" aria-label="Navegación interna del Archivo"><nav class="archive-top-nav-inner">${indexLink}${sectionLinks}</nav></div>`;
}
function archiveEntryCard(section,item){
 const title=itemTitle(section,item);
 const image=itemImage(item);
 const facts=itemFacts(section,item).slice(0,2);
 const compactFacts=facts.length ? `<dl class="archive-entry-card-facts">${facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : '';
 return `<a class="archive-entry-card reveal" href="${itemHref(section,item)}">
   ${image?`<div class="archive-entry-card-image"><img src="${esc(image)}" alt="${esc(title)}"></div>`:`<div class="archive-entry-card-image archive-entry-card-placeholder" aria-hidden="true"><span>◉</span></div>`}
   <div class="archive-entry-card-body">
     <div class="archive-entry-card-top"><p class="archive-code">${section.typeLabel} // ${esc(itemArchiveNumber(item))}</p>${itemStatus(item)?`<span class="archive-entry-status">${esc(itemStatus(item))}</span>`:''}</div>
     <h2>${esc(String(title).toUpperCase())}</h2>
     <p class="archive-entry-summary">${esc(itemSummary(section,item))}</p>
     ${compactFacts}
     <span class="archive-entry-open">CONSULTAR EXPEDIENTE →</span>
   </div>
 </a>`;
}
function archiveGallery(item){
 const gallery=(Array.isArray(item.gallery)?item.gallery:[]).filter(g=>g && g.image).slice(0,10);
 if(!gallery.length) return '';
 return `<section class="archive-entry-gallery-block">
   <div class="section-label">EVIDENCIAS VISUALES // ${String(gallery.length).padStart(2,'0')}</div>
   <div class="archive-entry-gallery">${gallery.map((g,i)=>`<figure class="archive-gallery-item reveal">
     <a href="${esc(g.image)}" target="_blank" rel="noopener"><img src="${esc(g.image)}" alt="${esc(g.caption||`${item.title||item.name||'Expediente'} — imagen ${i+1}`)}"></a>
     ${(g.caption||g.description)?`<figcaption>${g.caption?`<strong>${esc(g.caption)}</strong>`:''}${g.description?`<span>${esc(g.description)}</span>`:''}</figcaption>`:''}
   </figure>`).join('')}</div>
 </section>`;
}
function archiveInformationBlocks(item){
 const blocks=(Array.isArray(item.sections)?item.sections:[]).filter(x=>x && (x.title || x.body));
 return blocks.map((block,i)=>`<section class="archive-info-block reveal">
   <p class="archive-code">ANOTACIÓN // ${String(i+1).padStart(2,'0')}</p>
   ${block.title?`<h2>${esc(block.title)}</h2>`:''}
   ${block.body?`<div class="archive-extra">${markdownToHTML(block.body)}</div>`:''}
 </section>`).join('');
}
function archiveEntryPage(section,item){
 const title=itemTitle(section,item);
 const summary=itemSummary(section,item);
 const image=itemImage(item);
 const facts=itemFacts(section,item);
 const body=item.body ? markdownToHTML(item.body) : '';
 const blocks=archiveInformationBlocks(item);
 const note=item.note ? `<aside class="archive-entry-note reveal"><p class="archive-code">NOTA DE ARCHIVO</p><p>${esc(item.note)}</p></aside>` : '';
 const fullInformation=(body||blocks||note) ? `${body?`<div class="archive-entry-main-text reveal">${body}</div>`:''}${blocks}${note}` : `<div class="archive-entry-empty-copy reveal"><p>La ficha está abierta, pero todavía no contiene información adicional desclasificada.</p></div>`;
 const factList=facts.length ? `<dl class="archive-entry-facts">${facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : `<p class="archive-entry-no-facts">Sin datos complementarios publicados.</p>`;
 const heroClass=image?'':' no-image';
 return `${head(`${title} | ${section.label} | El Archivo | ${site.site_title}`,summary,image||section.image)}
 <body class="archive-area archive-entry-page">${header('archivo')}${archiveTopNav(section.key)}<main>
 <section class="archive-entry-hero${heroClass}">
   <div class="archive-entry-hero-copy">
     <p class="eyebrow">${section.typeLabel} // EXPEDIENTE ${esc(itemArchiveNumber(item))}</p>
     <h1>${esc(String(title).toUpperCase())}</h1>
     <p>${esc(summary)}</p>
     ${itemStatus(item)?`<span class="archive-entry-hero-status">${esc(itemStatus(item))}</span>`:''}
   </div>
   ${image?`<figure class="archive-entry-hero-image reveal"><img src="${esc(image)}" alt="${esc(title)}"></figure>`:''}
 </section>
 <section class="section archive-entry-shell">
   <div class="archive-back-row"><a class="text-link" href="${section.file}">← VOLVER A ${section.label}</a><a class="text-link" href="archivo.html">ÍNDICE GENERAL</a></div>
   <div class="archive-entry-layout">
     <aside class="archive-entry-sidebar reveal">
       <p class="archive-code">DATOS DEL EXPEDIENTE</p>
       <h2>${esc(section.typeLabel)}</h2>
       ${factList}
     </aside>
     <article class="archive-entry-content">
       <div class="section-label">INFORMACIÓN ARCHIVADA</div>
       ${fullInformation}
     </article>
   </div>
   ${archiveGallery(item)}
 </section>
 </main>${footer(site)}</body></html>`;
}

const hubCards=archiveSectionDefs.map(section=>{
 const latest=latestItem(section);
 return `<a class="archive-hub-card reveal" href="${section.file}">
   <div class="archive-hub-top"><span>${section.label}</span><b>${String(section.items.length).padStart(2,'0')}</b></div>
   <div class="archive-hub-copy">
     <p class="archive-code">ÚLTIMA ANOTACIÓN</p>
     <h2>${esc(String(itemTitle(section,latest)||'').toUpperCase())}</h2>
     <p>${esc(itemSummary(section,latest))}</p>
   </div>
   <span class="archive-hub-enter">ENTRAR EN LA SECCIÓN →</span>
 </a>`;
}).join('');

const archiveBookMarkup=archiveBook.enabled!==false && archiveBook.book_image ? `
<div class="archive-book-shell reveal" aria-label="Libro del Archivo">
  <img class="archive-book-base" src="${esc(archiveBook.book_image)}" alt="Libro abierto del Archivo">
  <div class="archive-book-page-slot" style="--book-page-left:${Number(archiveBook.page_left??51)}%;--book-page-top:${Number(archiveBook.page_top??10)}%;--book-page-width:${Number(archiveBook.page_width??44)}%;--book-page-height:${Number(archiveBook.page_height??79)}%;--book-page-rotate:${Number(archiveBook.page_rotate??0)}deg;">
    <img id="archiveBookPageImage" class="archive-book-page-image" alt="Anotación del Archivo">
  </div>
  <script type="application/json" id="archiveBookPagesData">${JSON.stringify(archiveBookPages).replace(/</g,'\u003c')}</script>
</div>` : '';

const archivePage=`${head(`El Archivo | ${site.site_title}`,'Índice general del archivo de '+site.site_title)}
<body class="archive-area">${header('archivo')}${archiveTopNav('index')}<main>
<section class="page-hero archive-hero"><div class="archive-hero-copy"><p class="eyebrow">SECCIÓN // ARCHIVO</p><h1>EL ARCHIVO</h1><p class="archive-random-phrase" id="archiveRandomPhrase">No deberías saber todo esto todavía.</p></div>${archiveBookMarkup}</section>
<section class="section archive-hub">
 <div class="section-label">ÍNDICE GENERAL // ACCESO PARCIAL</div>
 <p class="archive-hub-intro">El archivo está dividido en secciones. Cada una conserva sus propios expedientes. Entra en una sección para consultar las fichas resumidas y abrir cada expediente completo.</p>
 <div class="archive-hub-grid">${hubCards}</div>
</section>
<section class="section"><div class="section-label">ADVERTENCIA</div><div class="terminal reveal">
<p>&gt; NO CONFÍES EN TODO LO QUE LEAS AQUÍ.</p>
<p>&gt; ALGUNOS TESTIMONIOS MIENTEN.</p>
<p>&gt; OTROS NO SABEN QUE ESTÁN MINTIENDO.</p>
<p class="blink">&gt; _</p></div></section>
<script>
(function(){
  const el=document.getElementById('archiveRandomPhrase');
  if(!el) return;
  fetch('/assets/data/frases-archivo.txt',{cache:'no-store'})
    .then(r=>{if(!r.ok) throw new Error('No se pudo cargar el archivo de frases'); return r.text();})
    .then(text=>{
      const phrases=text.split(/\\r?\\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('#'));
      if(!phrases.length) return;
      let pool=phrases;
      try{
        const previous=sessionStorage.getItem('aqnrArchivePhrase');
        if(previous && phrases.length>1) pool=phrases.filter(x=>x!==previous);
      }catch(e){}
      const phrase=pool[Math.floor(Math.random()*pool.length)];
      el.textContent=phrase;
      try{sessionStorage.setItem('aqnrArchivePhrase',phrase);}catch(e){}
    })
    .catch(()=>{})
    .finally(()=>el.classList.add('is-loaded'));
})();
</script>
<script>
(function(){
  const img=document.getElementById('archiveBookPageImage');
  const dataEl=document.getElementById('archiveBookPagesData');
  if(!img || !dataEl) return;
  let pages=[];
  try{pages=JSON.parse(dataEl.textContent||'[]');}catch(e){return;}
  pages=pages.filter(p=>p && p.image && p.enabled!==false);
  if(!pages.length){img.closest('.archive-book-page-slot')?.classList.add('is-empty');return;}

  const randomMode=${archiveBook.random_mode!==false?'true':'false'};
  const first=pages.find(p=>p.first===true);
  const fixed=pages.find(p=>p.fixed===true) || first || pages[0];
  let chosen=null;

  if(!randomMode){
    chosen=fixed;
  }else{
    let shouldShowFirst=false;
    if(first){
      try{shouldShowFirst=sessionStorage.getItem('aqnrArchiveBookFirst')!==first.image;}catch(e){shouldShowFirst=true;}
    }
    if(first && shouldShowFirst){
      chosen=first;
      try{sessionStorage.setItem('aqnrArchiveBookFirst',first.image);}catch(e){}
    }else{
      let pool=pages;
      try{
        const previous=sessionStorage.getItem('aqnrArchiveBookLast');
        if(previous && pages.length>1){
          const filtered=pages.filter(p=>p.image!==previous);
          if(filtered.length) pool=filtered;
        }
      }catch(e){}
      chosen=pool[Math.floor(Math.random()*pool.length)];
    }
  }

  if(!chosen) return;
  img.alt=chosen.label || 'Anotación del Archivo';
  img.addEventListener('load',()=>img.classList.add('is-loaded'),{once:true});
  img.src=chosen.image;
  try{sessionStorage.setItem('aqnrArchiveBookLast',chosen.image);}catch(e){}
})();
</script>
</main>${footer(site)}</body></html>`;

fs.writeFileSync(path.join(DIST,'archivo.html'),archivePage);

// Páginas de cada sección + página completa de cada expediente
for(const section of archiveSectionDefs){
 const list=section.items.length
   ? `<div class="archive-entry-grid">${section.items.map(item=>archiveEntryCard(section,item)).join('')}</div>`
   : `<div class="archive-empty reveal"><p class="archive-code">SIN DATOS DISPONIBLES</p><h2>NO HAY EXPEDIENTES PÚBLICOS.</h2><p>Esta sección permanece vacía o clasificada por el momento.</p></div>`;
 const sectionPage=`${head(`${section.label} | El Archivo | ${site.site_title}`,section.desc)}
 <body class="archive-area">${header('archivo')}${archiveTopNav(section.key)}<main>
 <section class="page-hero compact archive-section-hero">
   <div class="archive-section-hero-copy">
     <p class="eyebrow">${section.eyebrow}</p>
     <h1>${section.label}</h1>
     <p>${section.desc}</p>
   </div>
   <div class="archive-section-hero-art reveal" aria-hidden="true"><img src="${section.image}" alt=""></div>
 </section>
 <section class="section archive-section-shell">
   <div class="archive-back-row"><a class="text-link" href="archivo.html">← VOLVER AL ÍNDICE GENERAL</a><span>${String(section.items.length).padStart(2,'0')} EXPEDIENTE${section.items.length===1?'':'S'}</span></div>
   ${list}
 </section>
 </main>${footer(site)}</body></html>`;
 fs.writeFileSync(path.join(DIST,section.file),sectionPage);
 for(const item of section.items){
   fs.writeFileSync(path.join(DIST,itemHref(section,item)),archiveEntryPage(section,item));
 }
}


// La página "Sobre" sigue siendo fija por ahora
let about=fs.readFileSync(path.join(ROOT,'sobre.static.html'),'utf8');
about=about.replaceAll('href="assets/','href="/assets/').replaceAll('src="assets/','src="/assets/');
fs.writeFileSync(path.join(DIST,'sobre.html'),about);

// robots + sitemap placeholder
fs.writeFileSync(path.join(DIST,'robots.txt'),'User-agent: *\\nAllow: /\\n');
console.log(`Construida web con ${stories.length} relato(s).`);
