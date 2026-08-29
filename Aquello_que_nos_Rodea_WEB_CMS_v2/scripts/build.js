
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


// EL ARCHIVO — portada por secciones + una página propia para cada sección
function archiveDossier(x){
 const facts=(x.facts||[]).map(f=>`<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('');
 const status=x.status?`<dt>Estado</dt><dd>${esc(x.status)}</dd>`:'';
 const image=x.image?`<div class="dossier-image"><img src="${esc(x.image)}" alt="${esc(x.title)}"></div>`:'';
 const body=x.body?`<div class="archive-extra">${markdownToHTML(x.body)}</div>`:'';
 const note=x.note?`<p class="note">${esc(x.note)}</p>`:'';
 return `<article class="dossier reveal">${image}<div class="dossier-body">
 <p class="archive-code">${esc(x.category||'ARCHIVO')} // ${esc(x.archive_number||'—')}</p>
 <h2>${esc(String(x.title||'').toUpperCase())}</h2>
 ${(status||facts)?`<dl>${status}${facts}</dl>`:''}
 <p>${esc(x.summary||'')}</p>${body}${note}</div></article>`;
}

function characterDossier(x){
 const autoFacts=[];
 if(x.alias) autoFacts.push({label:'Alias',value:x.alias});
 if(x.age) autoFacts.push({label:'Edad',value:x.age});
 if(x.occupation) autoFacts.push({label:'Ocupación',value:x.occupation});
 const allFacts=[...autoFacts,...(x.facts||[])];
 const facts=allFacts.map(f=>`<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('');
 const status=x.status?`<dt>Estado</dt><dd>${esc(x.status)}</dd>`:'';
 const image=x.image?`<div class="dossier-image"><img src="${esc(x.image)}" alt="${esc(x.name)}"></div>`:'';
 const body=x.body?`<div class="archive-extra">${markdownToHTML(x.body)}</div>`:'';
 return `<article class="dossier reveal">${image}<div class="dossier-body">
 <p class="archive-code">PERSONA // ${esc(x.archive_number||'—')}</p>
 <h2>${esc(String(x.name||'').toUpperCase())}</h2>
 ${(status||facts)?`<dl>${status}${facts}</dl>`:''}
 <p>${esc(x.summary||'')}</p>${body}</div></article>`;
}

function connectionDossier(c){
 const locked=String(c.status||'').toUpperCase()==='DISPONIBLE'?'':' locked-text';
 return `<article class="connection-record reveal">
 <p class="archive-code">CONEXIÓN // ${esc(c.archive_number||'—')}</p>
 <h2>${esc(String(c.title||'').toUpperCase())}</h2>
 <p class="connection-status${locked}">${esc(c.status||'DESCONOCIDO')}</p>
 </article>`;
}

const archiveByCategory=(cat)=>archiveEntries.filter(x=>(x.category||'ARCHIVO')===cat);

const archiveSectionDefs=[
 {key:'entidades',label:'ENTIDADES',eyebrow:'CATÁLOGO // ENTIDADES',desc:'Seres, presencias y formas de vida cuya existencia ha quedado registrada.',items:archiveByCategory('ENTIDAD'),render:archiveDossier,file:'archivo-entidades.html'},
 {key:'personajes',label:'PERSONAJES',eyebrow:'CATÁLOGO // PERSONAS',desc:'Individuos relacionados con los expedientes, los sucesos y aquello que permanece oculto.',items:characters,render:characterDossier,file:'archivo-personajes.html'},
 {key:'lugares',label:'LUGARES',eyebrow:'CATÁLOGO // LUGARES',desc:'Localizaciones vinculadas a anomalías, testimonios o acontecimientos registrados.',items:archiveByCategory('LUGAR'),render:archiveDossier,file:'archivo-lugares.html'},
 {key:'organizaciones',label:'ORGANIZACIONES',eyebrow:'CATÁLOGO // ORGANIZACIONES',desc:'Grupos, cultos, instituciones y redes cuya actividad aparece en los archivos.',items:archiveByCategory('ORGANIZACIÓN'),render:archiveDossier,file:'archivo-organizaciones.html'},
 {key:'documentos',label:'DOCUMENTOS',eyebrow:'CATÁLOGO // DOCUMENTOS',desc:'Textos, pruebas, registros y materiales recuperados o parcialmente descifrados.',items:archiveByCategory('DOCUMENTO'),render:archiveDossier,file:'archivo-documentos.html'},
 {key:'sucesos',label:'SUCESOS',eyebrow:'CATÁLOGO // SUCESOS',desc:'Incidentes cuya explicación permanece incompleta, contradictoria o clasificada.',items:archiveByCategory('SUCESO'),render:archiveDossier,file:'archivo-sucesos.html'},
 {key:'otros',label:'OTROS ARCHIVOS',eyebrow:'CATÁLOGO // OTROS',desc:'Anotaciones que todavía no encajan en una clasificación estable.',items:archiveByCategory('OTRO'),render:archiveDossier,file:'archivo-otros.html'},
 {key:'conexiones',label:'CONEXIONES',eyebrow:'ÍNDICE // CONEXIONES',desc:'Coincidencias, vínculos y patrones que conectan expedientes aparentemente independientes.',items:connections,render:connectionDossier,file:'archivo-conexiones.html'}
];

function latestItem(section){
 return section.items.length ? section.items[section.items.length-1] : null;
}
function itemTitle(section,item){
 if(!item) return 'SIN ANOTACIONES';
 return section.key==='personajes' ? item.name : item.title;
}
function itemSummary(section,item){
 if(!item) return 'Todavía no hay información pública en esta sección.';
 if(section.key==='conexiones') return `Estado: ${item.status||'DESCONOCIDO'}.`;
 return item.summary || item.note || item.body || 'Expediente disponible para consulta.';
}
function archiveSectionNav(){
 return `<nav class="archive-section-nav" aria-label="Secciones del archivo">
 ${archiveSectionDefs.map(s=>`<a href="${s.file}">${s.label}</a>`).join('')}
 </nav>`;
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

const archivePage=`${head(`El Archivo | ${site.site_title}`,'Índice general del archivo de '+site.site_title)}
<body>${header('archivo')}<main>
<section class="page-hero archive-hero"><div><p class="eyebrow">SECCIÓN // ARCHIVO</p><h1>EL ARCHIVO</h1><p>No deberías saber todo esto todavía.</p></div></section>
<section class="section archive-hub">
 <div class="section-label">ÍNDICE GENERAL // ACCESO PARCIAL</div>
 <p class="archive-hub-intro">El archivo está dividido en secciones. Cada una conserva sus propios expedientes. Debajo aparece la anotación pública más reciente de cada categoría.</p>
 ${archiveSectionNav()}
 <div class="archive-hub-grid">${hubCards}</div>
</section>
<section class="section"><div class="section-label">ADVERTENCIA</div><div class="terminal reveal">
<p>&gt; NO CONFÍES EN TODO LO QUE LEAS AQUÍ.</p>
<p>&gt; ALGUNOS TESTIMONIOS MIENTEN.</p>
<p>&gt; OTROS NO SABEN QUE ESTÁN MINTIENDO.</p>
<p class="blink">&gt; _</p></div></section>
</main>${footer(site)}</body></html>`;

fs.writeFileSync(path.join(DIST,'archivo.html'),archivePage);

// Páginas independientes de cada sección
for(const section of archiveSectionDefs){
 const list=section.items.length
   ? `<div class="archive-dossier-stack">${section.items.map(section.render).join('')}</div>`
   : `<div class="archive-empty reveal"><p class="archive-code">SIN DATOS DISPONIBLES</p><h2>NO HAY EXPEDIENTES PÚBLICOS.</h2><p>Esta sección permanece vacía o clasificada por el momento.</p></div>`;
 const sectionPage=`${head(`${section.label} | El Archivo | ${site.site_title}`,section.desc)}
 <body>${header('archivo')}<main>
 <section class="page-hero compact archive-section-hero"><div>
   <p class="eyebrow">${section.eyebrow}</p>
   <h1>${section.label}</h1>
   <p>${section.desc}</p>
 </div></section>
 <section class="section archive-section-shell">
   <div class="archive-back-row"><a class="text-link" href="archivo.html">← VOLVER AL ÍNDICE GENERAL</a><span>${String(section.items.length).padStart(2,'0')} EXPEDIENTE${section.items.length===1?'':'S'}</span></div>
   ${archiveSectionNav()}
   ${list}
 </section>
 </main>${footer(site)}</body></html>`;
 fs.writeFileSync(path.join(DIST,section.file),sectionPage);
}

// La página "Sobre" sigue siendo fija por ahora
let about=fs.readFileSync(path.join(ROOT,'sobre.static.html'),'utf8');
about=about.replaceAll('href="assets/','href="/assets/').replaceAll('src="assets/','src="/assets/');
fs.writeFileSync(path.join(DIST,'sobre.html'),about);

// robots + sitemap placeholder
fs.writeFileSync(path.join(DIST,'robots.txt'),'User-agent: *\\nAllow: /\\n');
console.log(`Construida web con ${stories.length} relato(s).`);
