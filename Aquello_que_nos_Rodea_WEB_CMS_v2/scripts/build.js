
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
function plainTextToHTML(src=''){
  const normalized=String(src||'').replace(/\r\n/g,'\n').trim();
  if(!normalized) return '';
  return normalized.split(/\n\s*\n/)
    .map(block=>block.trim()).filter(Boolean)
    .map(block=>`<p>${esc(block).replace(/\n/g,'<br>')}</p>`)
    .join('\n');
}
function head(title, desc, image='/assets/img/hero.webp'){
 return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>try{if(localStorage.getItem('aqnr_age_ok')==='yes')document.documentElement.classList.add('age-verified')}catch(e){}</script>
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#070706"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website">
<meta property="og:image" content="${esc(image)}"><link rel="icon" href="assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Special+Elite&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css?v=mixed-digital-carousel-20260920"><script defer src="assets/js/main.js?v=age-privacy-sensitive-v2-20260919"></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-published-date]').forEach(function(el){
    const raw=el.getAttribute('data-published-date');
    const start=raw?new Date(raw+'T00:00:00'):null;
    if(!start || Number.isNaN(start.getTime())){el.hidden=true;return;}
    const age=Date.now()-start.getTime();
    el.hidden=age<0 || age>=7*24*60*60*1000;
  });

  // Si esta página se abrió desde una tarjeta de ARCHIVOS RELACIONADOS,
  // muestra un acceso persistente para regresar al expediente exacto de origen.
  const params=new URLSearchParams(window.location.search);
  const from=params.get('aqnr_from');
  const fromLabel=params.get('aqnr_from_label');
  if(from){
    try{
      const target=new URL(from,window.location.href);
      if(target.origin===window.location.origin && target.href!==window.location.href){
        // Todas las conexiones posteriores conservan el primer expediente de la ruta.
        document.querySelectorAll('.related-archive-card').forEach(function(card){
          try{
            const next=new URL(card.href,window.location.href);
            if(next.origin!==window.location.origin) return;
            next.searchParams.set('aqnr_from',target.href);
            next.searchParams.set('aqnr_from_label',fromLabel||'EXPEDIENTE DE ORIGEN');
            card.href=next.href;
          }catch(e){}
        });
        const wrap=document.createElement('div');
        wrap.className='connection-return-tab';
        const link=document.createElement('a');
        link.className='connection-return-link';
        link.href=target.href;
        link.setAttribute('aria-label','Volver al expediente de origen');
        const mark=document.createElement('span');
        mark.className='connection-return-mark';
        mark.setAttribute('aria-hidden','true');
        mark.textContent='↶';
        const copy=document.createElement('span');
        copy.className='connection-return-copy';
        const small=document.createElement('small');
        small.textContent='VOLVER AL PUNTO DE ORIGEN';
        const strong=document.createElement('strong');
        strong.textContent=fromLabel||'EXPEDIENTE DE ORIGEN';
        copy.appendChild(small); copy.appendChild(strong);
        link.appendChild(mark); link.appendChild(copy); wrap.appendChild(link);
        document.body.appendChild(wrap);
      }
    }catch(e){}
  }
});
</script></head>`;
}
function header(active=''){
 return `<div class="age-gate" id="ageGate" role="dialog" aria-modal="true" aria-labelledby="ageGateTitle"><div class="age-panel"><div class="age-symbol">◉</div><p class="eyebrow">ACCESO AL ARCHIVO // +18</p><h2 id="ageGateTitle">Contenido para adultos</h2><p>Esta web contiene ficción de terror y puede incluir violencia, imágenes perturbadoras y contenido sexual. El acceso está reservado a mayores de 18 años.</p><button class="btn primary" id="ageEnter" type="button">Sí, soy mayor de 18 años</button><a class="btn ghost" href="about:blank">Salir</a></div></div><div class="grain" aria-hidden="true"></div><header class="site-header">
<a class="brand" href="index.html"><span class="brand-mark">◉</span><span>AQUELLO QUE NOS RODEA</span></a>
<button class="menu-toggle" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button>
<nav class="main-nav">
<a href="index.html" class="nav-link ${active==='inicio'?'active':''}">Inicio</a>
<a href="relatos.html" class="nav-link ${active==='relatos'?'active':''}">Relatos</a>
<a href="archivo-microrrelatos.html" class="nav-link ${active==='microrrelatos'?'active':''}">Microrrelatos</a>
<a href="archivo.html" class="nav-link ${active==='archivo'?'active':''}">El Archivo</a>
<a href="sobre.html" class="nav-link ${active==='sobre'?'active':''}">Dylan P. MOЯBO</a>
</nav></header>`;
}
function footer(site){
 return `<footer class="site-footer"><div class="footer-sigil">◉</div>
<p><strong>${esc(site.site_title).toUpperCase()}</strong></p>
<p>Un universo de horror creado por <strong>${esc(site.author)}</strong>.</p>
<p class="footer-small">${esc(site.footer_note)}</p>
<p class="footer-small">© 2026 ${esc(site.author)}. Todos los derechos reservados.</p><button type="button" class="cookie-settings-link" id="cookieSettings">Configurar cookies</button></footer>
<div class="cookie-banner" id="cookieBanner" role="dialog" aria-labelledby="cookieTitle" aria-describedby="cookieDescription" hidden><div class="cookie-banner-inner"><div><strong id="cookieTitle">Privacidad y cookies</strong><p id="cookieDescription">Usamos almacenamiento técnico para recordar tu confirmación de edad y esta elección. Google Analytics, que mide las visitas, solo se activará si aceptas.</p><details><summary>Más información</summary><p>Si aceptas, Google Analytics podrá instalar cookies de medición y recibir datos de navegación. Puedes rechazarlo y seguir usando toda la web. Cambia tu decisión cuando quieras desde «Configurar cookies», al pie de cualquier página.</p></details></div><div class="cookie-actions"><button type="button" id="cookieReject">Rechazar</button><button type="button" id="cookieAccept">Aceptar</button></div></div></div>`;
}
function wordCount(s){return String(s).trim().split(/\s+/).filter(Boolean).length;}

function publicationTimestamp(item){
 const raw=String(item && item.published_date || '').trim();
 if(!raw) return null;
 const value=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(raw)?`${raw}T00:00:00`:raw);
 return Number.isFinite(value)?value:null;
}
function latestPublished(items){
 const dated=(Array.isArray(items)?items:[]).filter(x=>publicationTimestamp(x)!==null);
 if(dated.length) return dated.slice().sort((a,b)=>publicationTimestamp(a)-publicationTimestamp(b))[dated.length-1];
 return items && items.length ? items[items.length-1] : null;
}
function newBadge(item){
 if(item && item.show_new_badge===true){
   return `<span class="new-badge">NOVEDAD</span>`;
 }
 const raw=String(item && item.published_date || '').trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '';
 return `<span class="new-badge" data-published-date="${esc(raw)}" hidden>NOVEDAD</span>`;
}

function relatedLinkWithReturn(url,sourceHref='',sourceLabel=''){
 const raw=String(url||'').trim();
 const from=String(sourceHref||'').trim();
 if(!raw || !from) return raw;

 // Ignora protocolos que no son páginas web.
 if(/^(?:mailto:|tel:|javascript:|data:)/i.test(raw)) return raw;

 // Si el enlace se pegó como URL completa, también debe conservar el contexto
 // cuando apunta a la propia web de Aquello que nos Rodea. La V4 trataba
 // cualquier https://... como externo y por eso podía desaparecer el botón de vuelta.
 if(/^(?:https?:)?\/\//i.test(raw)){
   try{
     const absolute=raw.startsWith('//')?'https:'+raw:raw;
     const parsed=new URL(absolute);
     const host=parsed.hostname.toLowerCase().replace(/^www\./,'');
     if(host!=='dylanpmorbo-collab.github.io') return raw;
   }catch(e){ return raw; }
 }

 const hashAt=raw.indexOf('#');
 const hash=hashAt>=0?raw.slice(hashAt):'';
 const base=hashAt>=0?raw.slice(0,hashAt):raw;
 const sep=base.includes('?')?'&':'?';
 return `${base}${sep}aqnr_from=${encodeURIComponent(from)}&aqnr_from_label=${encodeURIComponent(String(sourceLabel||'EXPEDIENTE DE ORIGEN'))}${hash}`;
}
function relatedArchiveMarkup(item,sourceHref='',sourceLabel=''){
 if(!item || item.show_related_archive!==true) return '';
 const related=(Array.isArray(item.related_archive)?item.related_archive:[])
   .filter(x=>x && x.title && x.url);
 if(!related.length) return '';
 return `<section class="related-archive-block reveal" aria-label="Archivos relacionados">
   <div class="related-archive-heading">
     <div>
       <p class="related-archive-kicker">TRAZAS DETECTADAS</p>
       <div class="section-label">ARCHIVOS RELACIONADOS // ${String(related.length).padStart(2,'0')}</div>
     </div>
     <span class="related-archive-sigil" aria-hidden="true">◉</span>
   </div>
   <div class="related-archive-grid">
     ${related.map(link=>{
       const thumb=String(link.thumbnail||link.image||'').trim();
       const contextualUrl=relatedLinkWithReturn(link.url,sourceHref,sourceLabel);
       return `<a class="related-archive-card${thumb?' has-thumbnail':''}" href="${esc(contextualUrl)}">
         <div class="related-archive-media">
           ${thumb?`<img src="${esc(thumb)}" alt="" loading="lazy">`:`<span class="related-archive-placeholder" aria-hidden="true">◉</span>`}
           <span class="related-archive-type">${esc(link.type||'ARCHIVO')}</span>
         </div>
         <div class="related-archive-copy">
           <h3>${esc(link.title)}</h3>
           ${link.description?`<p>${esc(link.description)}</p>`:''}
           <span class="related-archive-open">CONSULTAR EXPEDIENTE <b aria-hidden="true">→</b></span>
         </div>
       </a>`;
     }).join('')}
   </div>
 </section>`;
}

if(fs.existsSync(DIST)) fs.rmSync(DIST,{recursive:true,force:true});
fs.mkdirSync(DIST,{recursive:true});
copyDir(path.join(ROOT,'assets'),path.join(DIST,'assets'));

const site=readJSON(path.join(ROOT,'content/config/site.json'));
const archiveSectionImages=readJSON(path.join(ROOT,'content/config/archivo-secciones.json'));
const archiveCorkboards=readJSON(path.join(ROOT,'content/config/corcheras-archivo.json'));
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

const microDir=path.join(ROOT,'content/microrrelatos');
const micros=fs.existsSync(microDir)
 ? fs.readdirSync(microDir).filter(x=>x.endsWith('.json')).map(x=>readJSON(path.join(microDir,x)))
    .filter(x=>x.published!==false)
    .sort((a,b)=>String(a.archive_number).localeCompare(String(b.archive_number),undefined,{numeric:true}) || String(a.title).localeCompare(String(b.title)))
 : [];

const featured=stories.find(s=>s.featured)||stories[0];
const latestStory=latestPublished(stories);

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
<div class="feature-copy"><div class="story-label-row"><p class="archive-code">ARCHIVO ${esc(featured.archive_number)}${featured.age_restricted?' · +18':''}</p>${newBadge(featured)}</div>
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
<div class="story-info"><div class="story-label-row"><p class="archive-code">ARCHIVO ${esc(s.archive_number)}${s.age_restricted?' · +18':''}</p>${newBadge(s)}</div>
<h2><a href="relato-${esc(s.slug)}.html">${esc(s.title).toUpperCase()}</a></h2>
<p>${esc(s.excerpt)}</p><div class="meta-row"><span>${wordCount(s.body).toLocaleString('es-ES')} palabras</span><span>${esc(s.reading_time)}</span></div>
<a class="text-link" href="relato-${esc(s.slug)}.html">ABRIR EXPEDIENTE →</a></div></article>`).join('');
const latestStorySpotlight=latestStory && latestStory.cover ? `<a class="stories-latest reveal" href="relato-${esc(latestStory.slug)}.html" aria-label="Abrir el último relato publicado: ${esc(latestStory.title)}">
  <div class="stories-latest-top"><span>ÚLTIMO RELATO PUBLICADO</span>${newBadge(latestStory)}</div>
  <div class="stories-latest-cover"><img src="${esc(latestStory.cover)}" alt="Portada de ${esc(latestStory.title)}"></div>
  <div class="stories-latest-caption"><strong>${esc(latestStory.title).toUpperCase()}</strong><span>ABRIR EXPEDIENTE →</span></div>
</a>` : '';
const list=`${head(`Relatos | ${site.site_title}`,'Relatos de '+site.author)}<body>${header('relatos')}<main>
<section class="page-hero compact stories-page-hero"><div class="stories-page-hero-copy"><p class="eyebrow">ÍNDICE DE EXPEDIENTES</p><h1>RELATOS</h1><p>Historias independientes. Al menos al principio.</p></div>${latestStorySpotlight}</section>
<section class="section"><div class="section-label">ARCHIVOS DISPONIBLES // ${String(stories.length).padStart(2,'0')}</div><div class="story-list">${rows}</div></section>
</main>${footer(site)}</body></html>`;
fs.writeFileSync(path.join(DIST,'relatos.html'),list);

// INDIVIDUAL STORIES
for(const s of stories){
 const wc=wordCount(s.body);
 const noticeText=String(s.content_warning||'Contenido dirigido a público adulto.').trim();
 const legalStart=noticeText.search(/\bCopyright\b/i);
 const warningText=(legalStart>=0?noticeText.slice(0,legalStart):noticeText).trim();
 const legalText=String(s.legal_notice||(legalStart>=0?noticeText.slice(legalStart):'')).trim();
 const warning=s.age_restricted?`<section class="content-warning reveal"><div class="warning-mark">!</div><div>
 <h2>Advertencia de contenido</h2><div class="content-warning-text">${plainTextToHTML(warningText)}</div></div></section>`:'';
 const legalNotice=legalText?`<aside class="legal-notice reveal"><h2>Aviso legal</h2><div>${plainTextToHTML(legalText)}</div></aside>`:'';
 const page=`${head(`${s.title} | ${site.author}`,s.excerpt,s.cover)}<body class="story-page">${header('relatos')}<main>
 <div class="reading-progress"><span></span></div><section class="story-hero">
 <div class="story-cover"><img src="${esc(s.cover)}" alt="Portada de ${esc(s.title)}"></div>
 <div class="story-heading"><div class="story-label-row"><p class="archive-code">ARCHIVO ${esc(s.archive_number)} · RELATO COMPLETO${s.age_restricted?' · +18':''}</p>${newBadge(s)}</div>
 <h1>${esc(s.title).toUpperCase()}</h1><p class="byline">por <strong>${esc(site.author)}</strong></p>
 <div class="meta-row"><span>${wc.toLocaleString('es-ES')} palabras</span><span>${esc(s.reading_time)}</span></div>
 <a class="btn primary" href="#relato">Comenzar lectura</a></div></section>${warning}${renderCorkboard(s.corkboard,s.title,true)}
 <section class="reader-shell" id="relato"><aside class="reader-tools"><button data-reader="minus">A−</button><button data-reader="plus">A+</button></aside>
 <article class="story-text"><div class="story-marker">ARCHIVO ${esc(s.archive_number)}</div>${markdownToHTML(s.body)}<div class="story-end">FIN</div></article>
 ${legalNotice}
 ${relatedArchiveMarkup(s,`relato-${s.slug}.html`,s.title)}
 </section>
 <section class="post-story reveal"><p class="eyebrow">HAS TERMINADO EL ARCHIVO ${esc(s.archive_number)}</p><h2>El archivo permanece abierto.</h2>
 <div class="hero-actions"><a class="btn primary" href="archivo.html">Consultar el archivo</a><a class="btn ghost" href="relatos.html">Volver a relatos</a></div></section>
 </main>${footer(site)}</body></html>`;
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
 {key:'entidades',label:'ENTIDADES',typeLabel:'ENTIDAD',eyebrow:'CATÁLOGO // ENTIDADES',desc:'Seres, presencias y formas de vida cuya existencia ha quedado registrada.',items:archiveByCategory('ENTIDAD'),file:'archivo-entidades.html',image:String(archiveSectionImages.entidades||'/assets/img/archivo-secciones/entidades.png').trim()},
 {key:'personajes',label:'PERSONAJES',typeLabel:'PERSONA',eyebrow:'CATÁLOGO // PERSONAS',desc:'Individuos relacionados con los expedientes, los sucesos y aquello que permanece oculto.',items:characters,file:'archivo-personajes.html',image:String(archiveSectionImages.personajes||'/assets/img/archivo-secciones/personajes.png').trim()},
 {key:'lugares',label:'LUGARES',typeLabel:'LUGAR',eyebrow:'CATÁLOGO // LUGARES',desc:'Localizaciones vinculadas a anomalías, testimonios o acontecimientos registrados.',items:archiveByCategory('LUGAR'),file:'archivo-lugares.html',image:String(archiveSectionImages.lugares||'/assets/img/archivo-secciones/lugares.png').trim()},
 {key:'planos',label:'PLANOS',typeLabel:'PLANO',eyebrow:'CATÁLOGO // PLANOS',desc:'Capas de realidad, territorios dimensionales y estructuras que existen fuera de las coordenadas ordinarias.',items:archiveByCategory('PLANO'),file:'archivo-planos.html',image:String(archiveSectionImages.planos||'/assets/img/archivo-secciones/planos.png').trim()},
 {key:'organizaciones',label:'ORGANIZACIONES',typeLabel:'ORGANIZACIÓN',eyebrow:'CATÁLOGO // ORGANIZACIONES',desc:'Grupos, cultos, instituciones y redes cuya actividad aparece en los archivos.',items:archiveByCategory('ORGANIZACIÓN'),file:'archivo-organizaciones.html',image:String(archiveSectionImages.organizaciones||'/assets/img/archivo-secciones/organizaciones.png').trim()},
 {key:'documentos',label:'DOCUMENTOS',typeLabel:'DOCUMENTO',eyebrow:'CATÁLOGO // DOCUMENTOS',desc:'Textos, pruebas, registros y materiales recuperados o parcialmente descifrados.',items:archiveByCategory('DOCUMENTO'),file:'archivo-documentos.html',image:String(archiveSectionImages.documentos||'/assets/img/archivo-secciones/documentos.png').trim()},
 {key:'sucesos',label:'SUCESOS',typeLabel:'SUCESO',eyebrow:'CATÁLOGO // SUCESOS',desc:'Incidentes cuya explicación permanece incompleta, contradictoria o clasificada.',items:archiveByCategory('SUCESO'),file:'archivo-sucesos.html',image:String(archiveSectionImages.sucesos||'/assets/img/archivo-secciones/sucesos.png').trim()},
 {key:'otros',label:'OTROS ARCHIVOS',typeLabel:'ARCHIVO',eyebrow:'CATÁLOGO // OTROS',desc:'Anotaciones que todavía no encajan en una clasificación estable.',items:archiveByCategory('OTRO'),file:'archivo-otros.html',image:String(archiveSectionImages.otros||'/assets/img/archivo-secciones/otros.png').trim()},
 {key:'relatos',label:'RELATOS',typeLabel:'RELATO',eyebrow:'FICCIÓN // RELATOS',desc:'Relatos completos vinculados a los expedientes y conexiones del Archivo.',items:stories,file:'archivo-relatos.html',image:String(archiveSectionImages.relatos||'/assets/img/archivo-secciones/conexiones.png').trim()},
 {key:'microrrelatos',label:'MICRORRELATOS',typeLabel:'MICRORRELATO',eyebrow:'FICCIÓN BREVE // MICRORRELATOS',desc:'Historias mínimas recuperadas del Archivo. Se entienden solas; las conexiones pueden aparecer mucho después.',items:micros,file:'archivo-microrrelatos.html',image:String(archiveSectionImages.microrrelatos||'/assets/img/archivo-secciones/conexiones.png').trim()}
];

function itemTitle(section,item){
 if(!item) return 'SIN ANOTACIONES';
 return section.key==='personajes' ? (item.name||item.title||'SIN NOMBRE') : (item.title||item.name||'SIN TÍTULO');
}
function itemSummary(section,item){
 if(!item) return 'Todavía no hay información pública en esta sección.';
 if((section.key==='microrrelatos' || section.key==='relatos') && item.excerpt) return shortArchiveText(item.excerpt);
 if(item.summary) return shortArchiveText(item.summary);
 if(item.note) return shortArchiveText(item.note);
 if(item.body) return shortArchiveText(item.body);
 return 'Expediente disponible para consulta.';
}
function itemImage(item){ return item ? (item.image||item.cover||'') : ''; }
function itemStatus(item){ return item && item.status ? item.status : ''; }
function itemArchiveNumber(item){ return item && item.archive_number ? item.archive_number : '—'; }
function itemSlug(section,item){
 const custom=archiveSlug(item.slug||'');
 const fromTitle=archiveSlug(itemTitle(section,item));
 const fromNumber=archiveSlug(itemArchiveNumber(item));
 return custom || fromTitle || `expediente-${fromNumber||'sin-numero'}`;
}
function itemHref(section,item){
 if(section.key==='microrrelatos') return `micro-${itemSlug(section,item)}.html`;
 if(section.key==='relatos') return `relato-${itemSlug(section,item)}.html`;
 return `archivo-${section.key}-${itemSlug(section,item)}.html`;
}
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
     <div class="archive-entry-card-top"><p class="archive-code">${section.typeLabel} // ${esc(itemArchiveNumber(item))}</p>${section.key==='microrrelatos' || section.key==='relatos'?newBadge(item):''}${itemStatus(item)?`<span class="archive-entry-status">${esc(itemStatus(item))}</span>`:''}</div>
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
     ${(g.caption||g.description)?`<figcaption>${g.caption?`<strong>${esc(g.caption)}</strong>`:''}${g.description?`<span>${esc(g.description).replace(/\r?\n/g,'<br>')}</span>`:''}</figcaption>`:''}
   </figure>`).join('')}</div>
 </section>`;
}

const digitalPlatforms={
 INSTAGRAM:['Instagram','INSTAGRAM','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>'],
 FACEBOOK:['Facebook','FACEBOOK','<path d="M15.5 4H13a3 3 0 0 0-3 3v13M8 11h7"/>'],
 CITAS:['Citas','CITAS','<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'],
 TINDER:['Citas','CITAS','<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'],
 WHATSAPP:['WhatsApp','MENSAJERÍA','<path d="M5 18 3 21l4-1a9 9 0 1 0-3-3"/><path d="M9 8c1 4 3 6 7 7l1.5-1.5-2.5-1.5-1.2 1.1c-1.4-.6-2.4-1.6-3-3L12 9 10.5 6.5Z"/>'],
 TELEGRAM:['Telegram','MENSAJERÍA','<path d="m3 11 18-8-4 18-5-6-3 3v-5L21 3 9 13Z"/>'],
 YOUTUBE:['YouTube','OTROS','<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>'],
 TIKTOK:['TikTok','OTROS','<path d="M14 3v11a4 4 0 1 1-4-4M14 3c1 3 3 4 6 4"/>'],
 X:['X','OTROS','<path d="M4 3h4l12 18h-4L4 3ZM20 3 4 21"/>'],
 DISPOSITIVO:['Galería del dispositivo','OTROS','<rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>'],
 OTROS:['Otra fuente','OTROS','<path d="M6 2h9l4 4v16H6Z"/><path d="M15 2v5h4M9 12h7M9 16h7"/>']
};
function digitalFootprintMarkup(item){
 if(!item || item.show_digital_footprint!==true) return '';
 const pieces=(Array.isArray(item.digital_footprint)?item.digital_footprint:[])
   .filter(x=>x && (x.image||x.video||x.caption||x.messages?.length||x.original_capture||(Array.isArray(x.images)&&x.images.some(photo=>photo&&photo.image))));
 if(!pieces.length) return '';
 const filters=['TODAS','INSTAGRAM','FACEBOOK','CITAS','MENSAJERÍA','OTROS'];
 const cards=pieces.map((piece,index)=>{
   const platformKey=String(piece.platform||'OTROS').toUpperCase();
   const platform=digitalPlatforms[platformKey]||digitalPlatforms.OTROS;
   const [source,filter,icon]=platform;
   const provenance=piece.source||(platformKey==='TINDER'?'Tinder':source);
   const type=String(piece.type||'Fragmento digital').trim();
   const photos=[...(piece.image?[{image:piece.image,alt:piece.alt,sensitive:piece.image_sensitive}]:[]),...(Array.isArray(piece.images)?piece.images:[])]
     .filter(photo=>photo&&photo.image);
   const photoMarkup=(photo,i)=>'<div class="digital-photo'+(photo.sensitive===true?' digital-sensitive':'')+'"><img src="'+esc(photo.image)+'" alt="'+esc(photo.alt||piece.title||'Foto '+String(i+1)+' de la publicación')+'" loading="lazy">'+(photo.sensitive===true?'<div class="digital-sensitive-warning"><p>Esta imagen puede resultar ofensiva o contener contenido sexual explícito.</p><button type="button" data-digital-reveal>Mostrar imagen</button></div>':'')+'</div>';
   const videoMarkup=piece.video
     ? '<video controls playsinline preload="metadata"'+(piece.poster?' poster="'+esc(piece.poster)+'"':'')+' aria-label="'+esc(piece.title||type)+'"><source src="'+esc(piece.video)+'">Tu navegador no puede reproducir este vídeo.</video>'
     : '';
   const photoSlides=photos.map((photo,i)=>photoMarkup(photo,i));
   const slides=videoMarkup
     ? (piece.video_position==='LAST'?[...photoSlides,videoMarkup]:[videoMarkup,...photoSlides])
     : photoSlides;
   const media=slides.length>1
     ? '<div class="digital-carousel" data-digital-carousel tabindex="0" aria-label="Galería de '+String(slides.length)+' elementos de esta publicación"><div class="digital-carousel-viewport">'+slides.map((slide,i)=>'<div class="digital-carousel-slide" data-digital-slide'+(i?' hidden':'')+'>'+slide+'</div>').join('')+'</div><div class="digital-carousel-controls"><button type="button" data-digital-prev aria-label="Elemento anterior">←</button><span data-digital-counter aria-live="polite">1 / '+String(slides.length)+'</span><button type="button" data-digital-next aria-label="Elemento siguiente">→</button></div></div>'
     : slides[0]||'';
   const comments=(Array.isArray(piece.comments)?piece.comments:[]).filter(x=>x && (x.author||x.text));
   const messages=(Array.isArray(piece.messages)?piece.messages:[]).filter(x=>x && (x.author||x.text));
   const details=[['FUENTE',provenance],['TIPO',type],['ARCHIVADO',piece.archived],['ESTADO',piece.status]]
     .filter(x=>x[1]).map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('');
   return '<article class="digital-piece reveal" data-digital-filter="'+esc(filter)+'">'+
     '<header class="digital-piece-head"><span class="digital-platform-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+icon+'</svg></span><div><span class="digital-platform-name">'+esc(source)+'</span><p>'+esc(type)+(piece.date?' · '+esc(piece.date):'')+'</p></div><span class="digital-piece-index">'+String(index+1).padStart(2,'0')+'</span></header>'+
     (piece.title?'<h3>'+esc(piece.title)+'</h3>':'')+
     (piece.location?'<p class="digital-piece-location">'+esc(piece.location)+'</p>':'')+
     (media?'<div class="digital-piece-media">'+media+'</div>':'')+
     ((piece.handle||piece.caption)?'<div class="digital-piece-caption">'+(piece.handle?'<strong>'+esc(piece.handle)+'</strong>':'')+plainTextToHTML(piece.caption)+'</div>':'')+
     (piece.reactions?'<p class="digital-piece-reactions">'+esc(piece.reactions)+'</p>':'')+
     (comments.length?'<div class="digital-piece-comments">'+comments.map(x=>'<p><strong>'+esc(x.author||'Usuario')+'</strong> '+esc(x.text||'')+'</p>').join('')+'</div>':'')+
     (messages.length?'<div class="digital-piece-messages">'+messages.map(x=>'<p><span>'+esc(x.author||'Remitente')+(x.time?' · '+esc(x.time):'')+'</span>'+esc(x.text||'').replace(/\r?\n/g,'<br>')+'</p>').join('')+'</div>':'')+
     (piece.original_capture?'<a class="digital-original-link" href="'+esc(piece.original_capture)+'" target="_blank" rel="noopener">VER CAPTURA ORIGINAL ↗</a>':'')+
     (details?'<dl class="digital-piece-details">'+details+'</dl>':'')+'</article>';
 }).join('');
 return '<details class="digital-footprint" aria-labelledby="digital-footprint-title">'+
   '<summary class="digital-footprint-toggle"><span><small class="archive-code">EVIDENCIA DIGITAL // '+String(pieces.length).padStart(2,'0')+'</small><strong id="digital-footprint-title">HUELLA DIGITAL</strong></span><span class="digital-footprint-toggle-action"><span class="digital-closed-label">DESPLEGAR ↓</span><span class="digital-open-label">REDUCIR ↑</span></span></summary>'+
   '<div class="digital-footprint-content"><p class="digital-footprint-description">Actividad recuperada de perfiles públicos, dispositivos y cuentas vinculadas al sujeto.</p>'+
   '<div class="digital-filters" role="group" aria-label="Filtrar huella digital">'+filters.map((x,i)=>'<button type="button" data-digital-button="'+x+'" aria-pressed="'+(i===0?'true':'false')+'">'+x+'</button>').join('')+'</div>'+
   '<div class="digital-grid">'+cards+'</div></div>'+
   '<script>(function(){const section=document.currentScript.closest(".digital-footprint");if(!section)return;section.addEventListener("toggle",function(){if(!section.open)section.querySelectorAll("video").forEach(video=>video.pause());});section.querySelectorAll("[data-digital-button]").forEach(button=>button.addEventListener("click",function(){const selected=button.dataset.digitalButton;section.querySelectorAll("[data-digital-button]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));section.querySelectorAll("[data-digital-filter]").forEach(card=>{card.hidden=selected!=="TODAS"&&card.dataset.digitalFilter!==selected;if(card.hidden)card.querySelectorAll("video").forEach(video=>video.pause());});}));section.querySelectorAll("[data-digital-reveal]").forEach(button=>button.addEventListener("click",function(){const photo=button.closest(".digital-sensitive");photo.classList.remove("digital-sensitive","is-pixelated");photo.querySelector("canvas")?.remove();button.parentElement.remove();}));section.querySelectorAll("[data-digital-carousel]").forEach(carousel=>{const slides=Array.from(carousel.querySelectorAll("[data-digital-slide]"));const counter=carousel.querySelector("[data-digital-counter]");let current=0;function show(offset){slides[current].querySelectorAll("video").forEach(video=>video.pause());slides[current].hidden=true;current=(current+offset+slides.length)%slides.length;slides[current].hidden=false;counter.textContent=(current+1)+" / "+slides.length;}carousel.querySelector("[data-digital-prev]").addEventListener("click",()=>show(-1));carousel.querySelector("[data-digital-next]").addEventListener("click",()=>show(1));carousel.addEventListener("keydown",event=>{if(event.target!==carousel)return;if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();show(event.key==="ArrowLeft"?-1:1);}});});})();<\/script>'+
   '</details>';
}

function digitalPressMarkup(item){
 if(!item || item.show_digital_press!==true) return '';
 const pieces=(Array.isArray(item.digital_press)?item.digital_press:[])
   .filter(piece=>piece && (piece.image||piece.video||piece.headline||piece.summary));
 if(!pieces.length) return '';
 const cards=pieces.map((piece,index)=>{
   const outlet=String(piece.outlet||'MEDIO NO IDENTIFICADO').trim();
   const kind=String(piece.kind||'Noticia').trim();
   const comments=(Array.isArray(piece.comments)?piece.comments:[]).filter(x=>x && (x.author||x.text));
   const details=[['MEDIO',outlet],['TIPO',kind],['PUBLICADO',piece.date],['ARCHIVADO',piece.archived],['ESTADO',piece.status]]
     .filter(x=>x[1]).map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value)+'</dd></div>').join('');
   const image=piece.image?'<figure class="archive-press-media"><img src="'+esc(piece.image)+'" alt="'+esc(piece.headline||'Captura de prensa')+'" loading="lazy"><figcaption>CAPTURA ARCHIVADA</figcaption></figure>':'';
   const video=piece.video?'<div class="archive-press-media"><video controls playsinline preload="metadata"'+(piece.poster?' poster="'+esc(piece.poster)+'"':'')+' aria-label="'+esc(piece.headline||'Vídeo de prensa')+'"><source src="'+esc(piece.video)+'">Tu navegador no puede reproducir este vídeo.</video></div>':'';
   const original=String(piece.url||'').trim();
   const originalLink=/^https?:\/\//i.test(original)?'<a class="archive-press-original" href="'+esc(original)+'" target="_blank" rel="noopener noreferrer">CONSULTAR NOTICIA ORIGINAL ↗</a>':'';
   return '<article class="archive-press-card reveal">'+
     '<header class="archive-press-card-head"><span class="archive-press-icon" aria-hidden="true">▤</span><div><strong>'+esc(outlet)+'</strong><span>'+esc(kind)+(piece.date?' · '+esc(piece.date):'')+'</span></div><b>'+String(index+1).padStart(2,'0')+'</b></header>'+
     (piece.headline?'<h3>'+esc(piece.headline)+'</h3>':'')+
     (piece.byline?'<p class="archive-press-byline">'+esc(piece.byline)+'</p>':'')+
     image+video+
     (piece.summary?'<div class="archive-press-summary">'+plainTextToHTML(piece.summary)+'</div>':'')+
     (piece.reactions?'<p class="archive-press-reactions">'+esc(piece.reactions)+'</p>':'')+
     (comments.length?'<div class="archive-press-comments"><h4>COMENTARIOS RECUPERADOS</h4>'+comments.map(x=>'<p><strong>'+esc(x.author||'Usuario')+'</strong>'+(x.date?' <time>'+esc(x.date)+'</time>':'')+' · '+esc(x.text||'').replace(/\r?\n/g,'<br>')+'</p>').join('')+'</div>':'')+
     (piece.archive_note?'<aside class="archive-press-note"><strong>NOTA DE ARCHIVO</strong>'+plainTextToHTML(piece.archive_note)+'</aside>':'')+
     (details?'<dl class="archive-press-details">'+details+'</dl>':'')+originalLink+
     '</article>';
 }).join('');
 return '<details class="archive-press digital-footprint" aria-labelledby="archive-press-title">'+
   '<summary class="digital-footprint-toggle"><span><small class="archive-code">RECORTES RECUPERADOS // '+String(pieces.length).padStart(2,'0')+'</small><strong id="archive-press-title">PRENSA DIGITAL</strong></span><span class="digital-footprint-toggle-action"><span class="digital-closed-label">DESPLEGAR ↓</span><span class="digital-open-label">REDUCIR ↑</span></span></summary>'+
   '<div class="digital-footprint-content"><p class="digital-footprint-description">Noticias y material audiovisual incorporados al expediente.</p><div class="archive-press-list">'+cards+'</div></div>'+
   '<script>(function(){const section=document.currentScript.closest(".archive-press");if(!section)return;section.addEventListener("toggle",function(){if(!section.open)section.querySelectorAll("video").forEach(video=>video.pause());});})();<\/script>'+
   '</details>';
}

function archiveDocuments(item){
  if(!item || item.show_documents!==true) return '';
  const documents=(Array.isArray(item.documents)?item.documents:[])
    .map((doc,docIndex)=>{
      const pages=(Array.isArray(doc && doc.pages)?doc.pages:[])
        .filter(page=>page && page.image)
        .map((page,pageIndex)=>({
          image:String(page.image||''),
          caption:String(page.caption||`Página ${pageIndex+1}`),
          translations:(Array.isArray(page.translations)?page.translations:[])
            .filter(t=>t && t.code && t.text)
            .map(t=>({
              language:String(t.language||t.code||'Traducción'),
              code:String(t.code||'').trim().toLowerCase(),
              text:String(t.text||'')
            }))
        }));
      if(!doc || !doc.title || !pages.length) return null;
      return {title:String(doc.title),description:String(doc.description||''),pages,docIndex};
    })
    .filter(Boolean);
  if(!documents.length) return '';

  const cards=documents.map((doc,index)=>{
    const payload=JSON.stringify(doc.pages).replace(/</g,'\\u003c');
    return `<article class="archive-document reveal" data-archive-document>
      <header class="archive-document-heading">
        <div>
          <p class="archive-code">DOCUMENTO // ${String(index+1).padStart(2,'0')}</p>
          <h2>${esc(doc.title)}</h2>
          ${doc.description?`<p>${esc(doc.description)}</p>`:''}
        </div>
        <span class="archive-document-mark" aria-hidden="true">▧</span>
      </header>
      <div class="archive-document-language" hidden>
        <span>IDIOMA</span>
        <div class="archive-document-language-options" role="group" aria-label="Idioma del documento"></div>
      </div>
      <div class="archive-document-viewer">
        <button class="archive-document-nav archive-document-prev" type="button" aria-label="Páginas anteriores">‹</button>
        <div class="archive-document-stage" tabindex="0" aria-label="Visor del documento ${esc(doc.title)}">
          <div class="archive-document-spread">
            <figure class="archive-document-page archive-document-page-left">
              <button class="archive-document-page-open" type="button" aria-label="Ampliar página">
                <span class="archive-document-page-canvas"><img alt="" loading="lazy"><span class="archive-document-translation" hidden><span class="archive-document-translation-label"></span><span class="archive-document-translation-text"></span></span></span>
              </button>
              <figcaption></figcaption>
            </figure>
            <div class="archive-document-gutter" aria-hidden="true"></div>
            <figure class="archive-document-page archive-document-page-right">
              <button class="archive-document-page-open" type="button" aria-label="Ampliar página">
                <span class="archive-document-page-canvas"><img alt="" loading="lazy"><span class="archive-document-translation" hidden><span class="archive-document-translation-label"></span><span class="archive-document-translation-text"></span></span></span>
              </button>
              <figcaption></figcaption>
            </figure>
          </div>
        </div>
        <button class="archive-document-nav archive-document-next" type="button" aria-label="Páginas siguientes">›</button>
      </div>
      <div class="archive-document-footer">
        <span class="archive-document-counter" aria-live="polite"></span>
        <button class="archive-document-examine" type="button">⌕ EXAMINAR DOCUMENTO</button>
      </div>
      <script type="application/json" class="archive-document-data">${payload}</script>
      <div class="archive-document-modal" hidden aria-hidden="true">
        <div class="archive-document-modal-backdrop" data-document-close></div>
        <div class="archive-document-modal-panel" role="dialog" aria-modal="true" aria-label="${esc(doc.title)}">
          <button class="archive-document-modal-close" type="button" data-document-close aria-label="Cerrar documento">×</button>
          <div class="archive-document-modal-toolbar">
            <div class="archive-document-modal-language" hidden><span>IDIOMA</span><div class="archive-document-modal-language-options"></div></div>
            <div class="archive-document-zoom-controls" aria-label="Controles de zoom">
              <button type="button" data-document-zoom-out aria-label="Reducir zoom">−</button>
              <span data-document-zoom-label>100%</span>
              <button type="button" data-document-zoom-in aria-label="Aumentar zoom">+</button>
              <button type="button" data-document-zoom-reset>RESTABLECER</button>
            </div>
          </div>
          <button class="archive-document-modal-nav archive-document-modal-prev" type="button" aria-label="Página anterior">‹</button>
          <div class="archive-document-modal-viewport" tabindex="0" aria-label="Página ampliada. Usa la rueda del ratón o los botones para acercar y arrastra para desplazarte.">
            <figure class="archive-document-modal-page">
              <div class="archive-document-modal-transform">
                <span class="archive-document-modal-page-canvas"><img alt="" draggable="false"><span class="archive-document-translation archive-document-modal-translation" hidden><span class="archive-document-translation-label"></span><span class="archive-document-translation-text"></span></span></span>
              </div>
              <figcaption></figcaption>
            </figure>
          </div>
          <button class="archive-document-modal-nav archive-document-modal-next" type="button" aria-label="Página siguiente">›</button>
          <span class="archive-document-modal-counter" aria-live="polite"></span>
        </div>
      </div>
    </article>`;
  }).join('');

  return `<section class="archive-documents-block">
    <div class="section-label">DOCUMENTOS RECUPERADOS // ${String(documents.length).padStart(2,'0')}</div>
    <div class="archive-documents-stack">${cards}</div>
    <script>
    (function(){
      const mobileQuery=window.matchMedia('(max-width:700px)');
      document.querySelectorAll('[data-archive-document]').forEach(function(viewer){
        if(viewer.dataset.documentReady==='true') return;
        viewer.dataset.documentReady='true';
        const dataEl=viewer.querySelector('.archive-document-data');
        let pages=[];
        try{ pages=JSON.parse(dataEl ? dataEl.textContent : '[]'); }catch(e){ return; }
        if(!pages.length) return;

        const stage=viewer.querySelector('.archive-document-stage');
        const spread=viewer.querySelector('.archive-document-spread');
        const left=viewer.querySelector('.archive-document-page-left');
        const right=viewer.querySelector('.archive-document-page-right');
        const prev=viewer.querySelector('.archive-document-prev');
        const next=viewer.querySelector('.archive-document-next');
        const counter=viewer.querySelector('.archive-document-counter');
        const examine=viewer.querySelector('.archive-document-examine');
        const languageBar=viewer.querySelector('.archive-document-language');
        const languageOptions=viewer.querySelector('.archive-document-language-options');
        const modal=viewer.querySelector('.archive-document-modal');
        const modalViewport=modal.querySelector('.archive-document-modal-viewport');
        const modalTransform=modal.querySelector('.archive-document-modal-transform');
        const modalImg=modal.querySelector('.archive-document-modal-page img');
        const modalCaption=modal.querySelector('.archive-document-modal-page figcaption');
        const modalTranslation=modal.querySelector('.archive-document-modal-translation');
        const modalCounter=modal.querySelector('.archive-document-modal-counter');
        const modalPrev=modal.querySelector('.archive-document-modal-prev');
        const modalNext=modal.querySelector('.archive-document-modal-next');
        const modalLanguage=modal.querySelector('.archive-document-modal-language');
        const modalLanguageOptions=modal.querySelector('.archive-document-modal-language-options');
        const zoomIn=modal.querySelector('[data-document-zoom-in]');
        const zoomOut=modal.querySelector('[data-document-zoom-out]');
        const zoomReset=modal.querySelector('[data-document-zoom-reset]');
        const zoomLabel=modal.querySelector('[data-document-zoom-label]');

        let index=0, modalIndex=0, touchStartX=null, lastFocus=null, selectedLanguage='original';
        let zoom=1, panX=0, panY=0, dragging=false, dragStartX=0, dragStartY=0, dragOriginX=0, dragOriginY=0;
        let pinchStartDistance=0, pinchStartZoom=1;
        const MIN_ZOOM=.75, MAX_ZOOM=5, ZOOM_STEP=.25;
        const isMobile=()=>mobileQuery.matches;
        const step=()=>isMobile()?1:2;
        const languages=[];
        pages.forEach(page=>(Array.isArray(page.translations)?page.translations:[]).forEach(t=>{
          const code=String(t.code||'').toLowerCase();
          if(code && !languages.some(x=>x.code===code)) languages.push({code:code,language:t.language||code.toUpperCase()});
        }));

        function clampIndex(value){
          const max=isMobile()?pages.length-1:Math.max(0,pages.length-(pages.length%2===0?2:1));
          return Math.max(0,Math.min(value,max));
        }
        function translationFor(page){
          if(!page || selectedLanguage==='original') return null;
          return (Array.isArray(page.translations)?page.translations:[]).find(t=>String(t.code||'').toLowerCase()===selectedLanguage) || null;
        }
        function applyTranslation(container,page){
          const overlay=container.querySelector('.archive-document-translation');
          if(!overlay) return;
          const t=translationFor(page);
          if(!t){ overlay.hidden=true; overlay.querySelector('.archive-document-translation-label').textContent=''; overlay.querySelector('.archive-document-translation-text').textContent=''; return; }
          overlay.hidden=false;
          overlay.scrollTop=0;
          overlay.querySelector('.archive-document-translation-label').textContent='TRADUCCIÓN // '+String(t.language||t.code||'').toUpperCase();
          overlay.querySelector('.archive-document-translation-text').textContent=t.text||'';
        }
        function resetPageGeometry(figure,img){
          if(!figure || !img) return;
          const open=figure.querySelector('.archive-document-page-open');
          const canvas=figure.querySelector('.archive-document-page-canvas');
          [figure,open,canvas,img].forEach(function(el){
            if(!el) return;
            el.style.removeProperty('width');
            el.style.removeProperty('height');
            el.style.removeProperty('max-width');
            el.style.removeProperty('max-height');
            el.style.removeProperty('aspect-ratio');
          });
          // Fuerza al navegador a descartar la geometría de la imagen anterior.
          void img.offsetWidth;
        }
        function syncSpreadGeometry(){
          if(!spread) return;
          if(isMobile()){ spread.style.removeProperty('grid-template-columns'); return; }
          const leftImg=left.querySelector('img');
          const rightImg=right.querySelector('img');
          if(right.hidden || !leftImg.naturalWidth || !leftImg.naturalHeight || !rightImg.naturalWidth || !rightImg.naturalHeight){
            spread.style.removeProperty('grid-template-columns');
            return;
          }
          // Reparte el ancho según la proporción natural para que ambas páginas tengan la misma altura.
          const leftRatio=leftImg.naturalWidth/leftImg.naturalHeight;
          const rightRatio=rightImg.naturalWidth/rightImg.naturalHeight;
          spread.style.gridTemplateColumns='minmax(0,'+leftRatio+'fr) 16px minmax(0,'+rightRatio+'fr)';
        }
        function setPage(figure,page,pageIndex){
          const img=figure.querySelector('img');
          const cap=figure.querySelector('figcaption');
          resetPageGeometry(figure,img);
          if(!page){ figure.hidden=true; img.removeAttribute('src'); img.alt=''; cap.textContent=''; syncSpreadGeometry(); return; }
          figure.hidden=false;
          img.onload=function(){
            resetPageGeometry(figure,img);
            requestAnimationFrame(function(){ syncSpreadGeometry(); void figure.offsetHeight; });
          };
          // Limpiar primero src evita que una imagen anterior conserve su caja al sustituirse.
          img.removeAttribute('src');
          img.src=page.image;
          img.alt=page.caption || ('Página '+(pageIndex+1)); cap.textContent=page.caption || '';
          figure.querySelector('.archive-document-page-open').dataset.pageIndex=String(pageIndex);
          applyTranslation(figure,page);
        }
        function render(){
          index=clampIndex(index);
          if(!isMobile() && index%2===1) index=Math.max(0,index-1);
          setPage(left,pages[index],index);
          if(isMobile()) right.hidden=true; else setPage(right,pages[index+1],index+1);
          prev.disabled=index<=0;
          next.disabled=index+step()>=pages.length;
          if(isMobile()) counter.textContent=(index+1)+' / '+pages.length;
          else { const end=Math.min(index+2,pages.length); counter.textContent=(index+1)+(end>index+1?'–'+end:'')+' / '+pages.length; }
          syncLanguageButtons();
        }
        function resetTranslationScroll(){ viewer.querySelectorAll('.archive-document-translation').forEach(el=>{el.scrollTop=0;}); }
        function go(delta){ index=clampIndex(index+delta*step()); render(); resetTranslationScroll(); }
        function makeLanguageButtons(target){
          target.innerHTML='';
          [{code:'original',language:'ORIGINAL'}].concat(languages).forEach(lang=>{
            const btn=document.createElement('button'); btn.type='button'; btn.dataset.language=lang.code;
            btn.textContent=lang.code==='original'?'ORIGINAL':String(lang.language||lang.code).toUpperCase();
            btn.addEventListener('click',()=>{selectedLanguage=lang.code; render(); if(!modal.hidden) renderModal(); resetTranslationScroll();});
            target.appendChild(btn);
          });
        }
        function syncLanguageButtons(){
          viewer.querySelectorAll('[data-language]').forEach(btn=>{
            const active=btn.dataset.language===selectedLanguage;
            btn.classList.toggle('active',active); btn.setAttribute('aria-pressed',active?'true':'false');
          });
        }
        if(languages.length){ languageBar.hidden=false; modalLanguage.hidden=false; makeLanguageButtons(languageOptions); makeLanguageButtons(modalLanguageOptions); }

        function setZoom(value,anchorX,anchorY){
          const old=zoom; zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));
          if(anchorX!==undefined && anchorY!==undefined && old!==zoom){
            const rect=modalViewport.getBoundingClientRect();
            const cx=anchorX-rect.left-rect.width/2-panX;
            const cy=anchorY-rect.top-rect.height/2-panY;
            const factor=zoom/old;
            panX-=cx*(factor-1); panY-=cy*(factor-1);
          }
          if(zoom<=1){ panX=0; panY=0; }
          modalTransform.style.transform='translate('+panX+'px,'+panY+'px) scale('+zoom+')';
          zoomLabel.textContent=Math.round(zoom*100)+'%';
          modalViewport.classList.toggle('is-zoomed',zoom>1.001);
        }
        function resetZoom(){ panX=0; panY=0; setZoom(1); }
        function openModal(pageIndex){
          modalIndex=Math.max(0,Math.min(Number(pageIndex)||0,pages.length-1));
          lastFocus=document.activeElement; modal.hidden=false; modal.setAttribute('aria-hidden','false');
          document.body.classList.add('archive-document-modal-open'); resetZoom(); renderModal();
          modal.querySelector('.archive-document-modal-close').focus();
        }
        function closeModal(){
          modal.hidden=true; modal.setAttribute('aria-hidden','true'); document.body.classList.remove('archive-document-modal-open'); resetZoom();
          if(lastFocus && typeof lastFocus.focus==='function') lastFocus.focus();
        }
        function renderModal(){
          const page=pages[modalIndex]; modalImg.src=page.image; modalImg.alt=page.caption || ('Página '+(modalIndex+1));
          modalCaption.textContent=page.caption || ''; modalCounter.textContent=(modalIndex+1)+' / '+pages.length;
          modalPrev.disabled=modalIndex<=0; modalNext.disabled=modalIndex>=pages.length-1;
          applyTranslation(modal.querySelector('.archive-document-modal-page'),page); syncLanguageButtons();
        }
        function modalGo(delta){ modalIndex=Math.max(0,Math.min(modalIndex+delta,pages.length-1)); resetZoom(); renderModal(); resetTranslationScroll(); }

        prev.addEventListener('click',()=>go(-1)); next.addEventListener('click',()=>go(1)); examine.addEventListener('click',()=>openModal(index));
        viewer.querySelectorAll('.archive-document-page-open').forEach(btn=>btn.addEventListener('click',()=>openModal(Number(btn.dataset.pageIndex||0))));
        viewer.querySelectorAll('[data-document-close]').forEach(btn=>btn.addEventListener('click',closeModal));
        modalPrev.addEventListener('click',()=>modalGo(-1)); modalNext.addEventListener('click',()=>modalGo(1));
        zoomIn.addEventListener('click',()=>setZoom(zoom+ZOOM_STEP)); zoomOut.addEventListener('click',()=>setZoom(zoom-ZOOM_STEP)); zoomReset.addEventListener('click',resetZoom);
        stage.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft'){e.preventDefault();go(-1);} if(e.key==='ArrowRight'){e.preventDefault();go(1);} });
        stage.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;},{passive:true});
        stage.addEventListener('touchend',function(e){ if(touchStartX===null) return; const distance=e.changedTouches[0].clientX-touchStartX; touchStartX=null; if(Math.abs(distance)>=45) go(distance>0?-1:1); },{passive:true});

        modalViewport.addEventListener('wheel',function(e){ e.preventDefault(); setZoom(zoom+(e.deltaY<0?ZOOM_STEP:-ZOOM_STEP),e.clientX,e.clientY); },{passive:false});
        modalViewport.addEventListener('dblclick',function(e){ e.preventDefault(); if(zoom>1.05) resetZoom(); else setZoom(2,e.clientX,e.clientY); });
        modalViewport.addEventListener('pointerdown',function(e){ if(zoom<=1) return; dragging=true; modalViewport.setPointerCapture(e.pointerId); dragStartX=e.clientX; dragStartY=e.clientY; dragOriginX=panX; dragOriginY=panY; modalViewport.classList.add('is-dragging'); });
        modalViewport.addEventListener('pointermove',function(e){ if(!dragging) return; panX=dragOriginX+(e.clientX-dragStartX); panY=dragOriginY+(e.clientY-dragStartY); setZoom(zoom); });
        function endDrag(e){ if(!dragging) return; dragging=false; modalViewport.classList.remove('is-dragging'); try{modalViewport.releasePointerCapture(e.pointerId);}catch(err){} }
        modalViewport.addEventListener('pointerup',endDrag); modalViewport.addEventListener('pointercancel',endDrag);
        modalViewport.addEventListener('touchstart',function(e){ if(e.touches.length===2){ const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY; pinchStartDistance=Math.hypot(dx,dy); pinchStartZoom=zoom; } },{passive:true});
        modalViewport.addEventListener('touchmove',function(e){ if(e.touches.length===2 && pinchStartDistance>0){ e.preventDefault(); const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY; const distance=Math.hypot(dx,dy); setZoom(pinchStartZoom*(distance/pinchStartDistance)); } },{passive:false});
        modalViewport.addEventListener('touchend',function(e){ if(e.touches.length<2) pinchStartDistance=0; },{passive:true});

        document.addEventListener('keydown',function(e){ if(modal.hidden) return; if(e.key==='Escape'){e.preventDefault();closeModal();} else if(e.key==='ArrowLeft'){e.preventDefault();modalGo(-1);} else if(e.key==='ArrowRight'){e.preventDefault();modalGo(1);} else if(e.key==='+' || e.key==='='){e.preventDefault();setZoom(zoom+ZOOM_STEP);} else if(e.key==='-'){e.preventDefault();setZoom(zoom-ZOOM_STEP);} else if(e.key==='0'){e.preventDefault();resetZoom();} });
        if(typeof mobileQuery.addEventListener==='function') mobileQuery.addEventListener('change',render); else if(typeof mobileQuery.addListener==='function') mobileQuery.addListener(render);
        render();
      });
    })();
    </script>
  </section>`;
}


function policeInlineMarkdown(value=''){
 let text=esc(value);
 text=text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
 text=text.replace(/`([^`]+)`/g,'<code>$1</code>');
 text=text.replace(/\*\*(.+?)\*\*|__(.+?)__/g,(_,a,b)=>'<strong>'+(a||b)+'</strong>');
 text=text.replace(/\*([^*\n]+)\*|_([^_\n]+)_/g,(_,a,b)=>'<em>'+(a||b)+'</em>');
 return text;
}
function policeMarkdownToHTML(source=''){
 return String(source||'').replace(/\r\n/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(block=>{
   const lines=block.split('\n');
   const heading=block.match(/^(#{1,4})\s+(.+)$/);
   if(heading && lines.length===1) return '<h'+Math.min(heading[1].length+2,6)+'>'+policeInlineMarkdown(heading[2])+'</h'+Math.min(heading[1].length+2,6)+'>';
   if(/^[-*_]{3,}$/.test(block)) return '<hr>';
   if(lines.every(line=>/^\s*[-*+]\s+/.test(line))) return '<ul>'+lines.map(line=>'<li>'+policeInlineMarkdown(line.replace(/^\s*[-*+]\s+/,''))+'</li>').join('')+'</ul>';
   if(lines.every(line=>/^\s*\d+[.)]\s+/.test(line))) return '<ol>'+lines.map(line=>'<li>'+policeInlineMarkdown(line.replace(/^\s*\d+[.)]\s+/,''))+'</li>').join('')+'</ol>';
   if(lines.every(line=>/^\s*>\s?/.test(line))) return '<blockquote>'+lines.map(line=>policeInlineMarkdown(line.replace(/^\s*>\s?/,''))).join('<br>')+'</blockquote>';
   return '<p>'+lines.map(policeInlineMarkdown).join('<br>')+'</p>';
 }).join('\n');
}
function paginatePoliceReport(text,maxChars=1300,firstPageChars=maxChars){
 const blocks=String(text||'').replace(/\r\n/g,'\n').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
 const pages=[]; let current=[],size=0;
 for(const block of blocks){
   const limit=pages.length===0?firstPageChars:maxChars;
   if(current.length && size+block.length+2>limit){pages.push(current.join('\n\n'));current=[];size=0;}
   current.push(block);size+=block.length+2;
 }
 if(current.length) pages.push(current.join('\n\n'));
 return pages;
}
function archivePoliceReport(item){
 if(item.show_police_report!==true) return '';
 let reports=(Array.isArray(item.police_reports)?item.police_reports:[])
   .filter(report=>report && String(report.body||'').trim())
   .slice(0,5)
   .map((report,index)=>{
     const images=[report.image,report.image_2,report.image_3].filter(Boolean).map(String);
     return {
       title:String(report.title||('INFORME '+String(index+1).padStart(2,'0'))),
       type:String(report.type||'POLICIAL').trim()||'POLICIAL',
       images,
       pages:paginatePoliceReport(report.body,1300,images.length?Math.max(450,850-images.length*130):1300)
     };
   });
 // Conserva los expedientes creados antes de la lista de informes.
 if(!reports.length && String(item.police_report||'').trim()){
   reports=[{title:'INFORME',type:'POLICIAL',images:[],pages:paginatePoliceReport(item.police_report)}];
 }
 if(!reports.length) return '';
 const folders=reports.map((report,index)=>'<button type="button" class="archive-police-folder" data-police-open="'+index+'" data-report-type="'+esc(report.type.toUpperCase())+'" aria-label="Abrir '+esc(report.title)+'">'+
   '<span class="archive-police-folder-tab" aria-hidden="true"></span>'+
   '<span class="archive-police-folder-cover">'+(report.images[0]?'<img src="'+esc(report.images[0])+'" alt="" loading="lazy">':'<span aria-hidden="true">▤</span>')+'</span>'+
   '<span class="archive-police-folder-copy"><small>'+esc(report.type.toUpperCase())+' // '+String(index+1).padStart(2,'0')+'</small><strong>'+esc(report.title)+'</strong><span>'+String(report.pages.length).padStart(2,'0')+' FOLIO'+(report.pages.length===1?'':'S')+' · ABRIR EXPEDIENTE →</span></span></button>').join('');
 const templates=reports.map((report,index)=>'<template data-police-template="'+index+'">'+report.pages.map((page,pageIndex)=>'<article class="archive-police-report" data-police-page="'+pageIndex+'"'+(pageIndex?' hidden':'')+'>'+
   (pageIndex===0?'<div class="archive-police-report-heading">'+esc(report.title)+'</div>':'')+
   (pageIndex===0 && report.images.length?'<div class="archive-police-report-attachments">'+report.images.map((image,i)=>'<figure class="archive-police-report-attachment"><img src="'+esc(image)+'" alt="Imagen adjunta '+(i+1)+' de '+esc(report.title)+'" loading="lazy"></figure>').join('')+'</div>':'')+
   '<div class="archive-police-report-text">'+policeMarkdownToHTML(page)+'</div>'+
   '<div class="archive-police-report-folio">FOLIO '+String(pageIndex+1).padStart(2,'0')+' / '+String(report.pages.length).padStart(2,'0')+'</div></article>').join('')+'</template>').join('');
 return '<section class="archive-police-report-block" aria-label="Informes">'+
   '<div class="section-label">INFORMES // '+String(reports.length).padStart(2,'0')+'</div>'+
   '<div class="archive-police-folder-grid">'+folders+'</div>'+templates+
   '<dialog class="archive-police-dialog" aria-labelledby="archive-police-dialog-title"><div class="archive-police-dialog-shell">'+
   '<header class="archive-police-dialog-header"><div><small id="archive-police-dialog-type">INFORME</small><h2 id="archive-police-dialog-title"></h2></div><button type="button" data-police-close aria-label="Cerrar informe">✕</button></header>'+
   '<div class="archive-police-dialog-scroll"><div data-police-pages></div></div>'+
   '<footer class="archive-police-dialog-footer"><button type="button" data-police-prev>← ANTERIOR</button><span data-police-counter></span><button type="button" data-police-next>SIGUIENTE →</button></footer>'+
   '</div></dialog>'+
   '<script>(function(){const block=document.currentScript.closest(".archive-police-report-block");if(!block)return;const dialog=block.querySelector(".archive-police-dialog");const viewer=block.querySelector("[data-police-pages]");const scroll=block.querySelector(".archive-police-dialog-scroll");const prev=block.querySelector("[data-police-prev]");const next=block.querySelector("[data-police-next]");const counter=block.querySelector("[data-police-counter]");let page=0,trigger=null;function showPage(){const pages=[...viewer.querySelectorAll("[data-police-page]")];pages.forEach((el,i)=>el.hidden=i!==page);counter.textContent="FOLIO "+(page+1)+" / "+pages.length;prev.disabled=page===0;next.disabled=page>=pages.length-1;scroll.scrollTop=0;}block.querySelectorAll("[data-police-open]").forEach(button=>button.addEventListener("click",()=>{const template=block.querySelector(\'[data-police-template="\'+button.dataset.policeOpen+\'"]\');if(!template)return;trigger=button;viewer.replaceChildren(template.content.cloneNode(true));dialog.querySelector("#archive-police-dialog-title").textContent=button.querySelector("strong").textContent;dialog.querySelector("#archive-police-dialog-type").textContent="INFORME // "+button.dataset.reportType;page=0;showPage();dialog.showModal();document.body.classList.add("archive-police-dialog-open");dialog.querySelector("[data-police-close]").focus();}));prev.addEventListener("click",()=>{if(page>0){page--;showPage();}});next.addEventListener("click",()=>{if(page<viewer.querySelectorAll("[data-police-page]").length-1){page++;showPage();}});dialog.querySelector("[data-police-close]").addEventListener("click",()=>dialog.close());dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener("close",()=>{document.body.classList.remove("archive-police-dialog-open");viewer.replaceChildren();if(trigger)trigger.focus();});})();<\/script>'+
   '</section>';
}

function archiveInformationBlocks(item){
 const blocks=(Array.isArray(item.sections)?item.sections:[]).filter(x=>x && (x.title || x.body));
 return blocks.map((block,i)=>`<section class="archive-info-block reveal">
   <p class="archive-code">ANOTACIÓN // ${String(i+1).padStart(2,'0')}</p>
   ${block.title?`<h2>${esc(block.title)}</h2>`:''}
   ${block.body?`<div class="archive-extra">${markdownToHTML(block.body)}</div>`:''}
 </section>`).join('');
}

function microReadingTime(item){
 if(item.reading_time) return item.reading_time;
 const words=wordCount(item.body||'');
 return words<260 ? '< 1 min' : `${Math.max(1,Math.ceil(words/230))} min aprox.`;
}
function microEntryPage(section,item){
 const title=itemTitle(section,item);
 const excerpt=item.excerpt||itemSummary(section,item);
 const image=itemImage(item);
 const body=markdownToHTML(item.body||'');
 const noticeText=String(item.content_warning||'').trim();
 const legalStart=noticeText.search(/\bCopyright\b/i);
 const warningText=(legalStart>=0?noticeText.slice(0,legalStart):noticeText).trim();
 const legalText=String(item.legal_notice||(legalStart>=0?noticeText.slice(legalStart):'')).trim();
 const warning=item.age_restricted===true && warningText?`<section class="content-warning reveal"><div class="warning-mark">!</div><div><h2>Advertencia de contenido</h2><div class="content-warning-text">${plainTextToHTML(warningText)}</div></div></section>`:'';
 const legalNotice=legalText?`<aside class="legal-notice reveal"><h2>Aviso legal</h2><div>${plainTextToHTML(legalText)}</div></aside>`:'';
 return `${head(`${title} | Microrrelato | ${site.site_title}`,excerpt,image||'/assets/img/hero.webp')}
 <body class="archive-area micro-story-page">${header('microrrelatos')}${archiveTopNav('microrrelatos')}<main>
 <section class="micro-story-hero${image?'':' no-image'}">
   <div class="micro-story-heading">
     <div class="story-label-row"><p class="eyebrow">MICRORRELATO // ${esc(itemArchiveNumber(item))}</p>${newBadge(item)}</div>
     <h1>${esc(String(title).toUpperCase())}</h1>
     <p class="micro-story-excerpt">${esc(excerpt)}</p>
     <div class="meta-row"><span>${wordCount(item.body||'').toLocaleString('es-ES')} palabras</span><span>${esc(microReadingTime(item))}</span></div>
     <a class="btn primary" href="#lectura">LEER</a>
   </div>
   ${image?`<figure class="micro-story-cover reveal"><img src="${esc(image)}" alt="Ilustración de ${esc(title)}"></figure>`:''}
 </section>
 ${warning}${renderCorkboard(item.corkboard,title,true)}
 <section class="reader-shell micro-reader" id="lectura">
   <aside class="reader-tools"><button data-reader="minus" aria-label="Reducir texto">A−</button><button data-reader="plus" aria-label="Aumentar texto">A+</button></aside>
   <article class="story-text micro-story-text">
     <div class="story-marker">MICRORRELATO // ${esc(itemArchiveNumber(item))}</div>
     ${body}
     <div class="story-end">FIN</div>
   </article>
   ${legalNotice}
   ${relatedArchiveMarkup(item,`micro-${itemSlug(section,item)}.html`,title)}
 </section>
 <section class="post-story reveal">
   <p class="eyebrow">ARCHIVO BREVE CERRADO</p>
   <h2>Hay historias que sólo necesitan unas líneas.</h2>
   <div class="hero-actions"><a class="btn primary" href="archivo-microrrelatos.html">Volver a microrrelatos</a><a class="btn ghost" href="archivo.html">Índice general</a></div>
 </section>
 </main>${footer(site)}</body></html>`;
}

function archiveEntryPage(section,item){
 if(section.key==='microrrelatos') return microEntryPage(section,item);
 const title=itemTitle(section,item);
 const summary=itemSummary(section,item);
 const image=itemImage(item);
 const facts=itemFacts(section,item);
 const body=item.body ? markdownToHTML(item.body) : '';
 const blocks=archiveInformationBlocks(item);
 const note=item.note ? `<aside class="archive-entry-note reveal"><p class="archive-code">NOTA DE ARCHIVO</p><div class="archive-entry-note-text">${plainTextToHTML(item.note)}</div></aside>` : '';
 const boardMarkup=renderCorkboard(item.corkboard,title,true);
 const fullInformation=(body||blocks||note) ? `${body?`<div class="archive-entry-main-text reveal">${body}</div>`:''}${blocks}${note}` : '';
 const factList=facts.length ? `<dl class="archive-entry-facts">${facts.map(f=>`<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : '';
 const detailsMarkup=(factList||fullInformation||boardMarkup) ? `<div class="archive-entry-layout${factList&&(fullInformation||boardMarkup)?'':' archive-entry-layout-single'}">
   ${factList?`<aside class="archive-entry-sidebar reveal"><p class="archive-code">DATOS DEL EXPEDIENTE</p><h2>${esc(section.typeLabel)}</h2>${factList}</aside>`:''}
   ${(fullInformation||boardMarkup)?`<article class="archive-entry-content">${fullInformation?`<div class="section-label">INFORMACIÓN ARCHIVADA</div>${fullInformation}`:''}${boardMarkup}</article>`:''}
 </div>` : '';
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
   ${detailsMarkup}
   ${archiveGallery(item)}
   ${section.key==='personajes'?digitalFootprintMarkup(item):digitalPressMarkup(item)}
   ${archiveDocuments(item)}
   ${archivePoliceReport(item)}
   ${relatedArchiveMarkup(item,itemHref(section,item),title)}
 </section>
 </main>${footer(site)}</body></html>`;
}

const hubCards=archiveSectionDefs.map(section=>{
 const latest=latestItem(section);
 return `<a class="archive-hub-card reveal" href="${section.file}">
   <div class="archive-hub-top"><span>${section.label}</span><b>${String(section.items.length).padStart(2,'0')}</b></div>
   <div class="archive-hub-copy">
     <p class="archive-code">${section.key==='microrrelatos' || section.key==='relatos'?'ÚLTIMA HISTORIA':'ÚLTIMA ANOTACIÓN'}</p>
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

function renderCorkboard(board,label,entry=false){
if(!board || board.enabled!==true) return '';
const design=['b','c'].includes(String(board.design||'').toLowerCase())?String(board.design).toLowerCase():'a';
const positions=[[15,12],[38,12],[61,12],[84,12],[15,40],[38,40],[61,40],[84,40],[15,68],[38,68],[61,68],[84,68]];
const clamp=(value,min,max,fallback)=>{const n=Number(value);return value===null||value===undefined||value===''||!Number.isFinite(n)?fallback:Math.min(max,Math.max(min,n));};
const pieces=(Array.isArray(board.pieces)?board.pieces:[]).slice(0,12).map((piece,index)=>{
 if(!piece || typeof piece!=='object') return null;
 const id=String(piece.id||('pieza-'+(index+1))).trim();
 const type=piece.type==='foto'?'foto':'nota';
 const image=String(piece.image||'').trim(), text=String(piece.text||'').trim(), title=String(piece.title||'').trim();
 if(type==='foto'?!image:(!text&&!title)) return null;
 return {id,type,image,text,title,x:clamp(piece.x,12,88,positions[index][0]),y:clamp(piece.y,8,72,positions[index][1]),rotation:clamp(piece.rotation,-12,12,[-3,2,-2,4][index%4])};
}).filter(Boolean);
if(!pieces.length) return '';
const byId=new Map(pieces.map(piece=>[piece.id,piece]));
const threads=(Array.isArray(board.threads)?board.threads:[]).slice(0,18).map(thread=>{
 const from=byId.get(String(thread&&thread.from||'').trim()),to=byId.get(String(thread&&thread.to||'').trim());
 if(!from||!to||from===to) return '';
 return '<path d="M '+from.x+' '+from.y+' Q '+((from.x+to.x)/2)+' '+((from.y+to.y)/2+3)+' '+to.x+' '+to.y+'"/>';
}).join('');
const cards=pieces.map(piece=>{
 const content=piece.type==='foto'
 ? '<img src="'+esc(piece.image)+'" alt="'+esc(piece.title||'Fotografía del tablón')+'" loading="lazy">'+(piece.title?'<figcaption>'+esc(piece.title)+'</figcaption>':'')
 : (piece.title?'<strong>'+esc(piece.title)+'</strong>':'')+(piece.text?'<p>'+esc(piece.text).replace(/\r?\n/g,'<br>')+'</p>':'');
 return '<article class="archive-corkboard-piece archive-corkboard-'+piece.type+'" style="--piece-x:'+piece.x+'%;--piece-y:'+piece.y+'%;--piece-rotation:'+piece.rotation+'deg" aria-label="'+esc(piece.title||'Pieza del tablón')+'">'+
 content+'</article>';
}).join('');
const pins=pieces.map(piece=>'<span class="archive-corkboard-pin" style="--piece-x:'+piece.x+'%;--piece-y:'+piece.y+'%" aria-hidden="true"></span>').join('');
return '<section class="section archive-corkboard-section'+(entry?' archive-entry-corkboard':'')+'" aria-label="Tablón de conexiones de '+esc(label)+'">'+
'<div class="section-label">CORCHERA // '+esc(label)+'</div>'+
'<h2>'+esc(String(board.title||'TABLÓN DE CONEXIONES'))+'</h2>'+
'<p class="archive-corkboard-hint">Desliza para explorar el tablón →</p>'+
'<div class="archive-corkboard-scroll"><div class="archive-corkboard-stage archive-corkboard-design-'+design+'">'+
'<svg class="archive-corkboard-threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+threads+'</svg>'+
cards+pins+'</div></div></section>';
}
function archiveCorkboard(section){return renderCorkboard(archiveCorkboards[section.key],section.label);}

// Páginas de cada sección + página completa de cada expediente
for(const section of archiveSectionDefs){
 const list=section.items.length
   ? `<div class="archive-entry-grid">${section.items.map(item=>archiveEntryCard(section,item)).join('')}</div>`
   : `<div class="archive-empty reveal"><p class="archive-code">SIN DATOS DISPONIBLES</p><h2>NO HAY EXPEDIENTES PÚBLICOS.</h2><p>Esta sección permanece vacía o clasificada por el momento.</p></div>`;
 const sectionPage=`${head(`${section.label} | El Archivo | ${site.site_title}`,section.desc,section.image||'/assets/img/hero.webp')}
 <body class="archive-area">${header(section.key==='microrrelatos'?'microrrelatos':'archivo')}${archiveTopNav(section.key)}<main>
 <section class="page-hero compact archive-section-hero${section.image?'':' no-art'}">
   <div class="archive-section-hero-copy">
     <p class="eyebrow">${section.eyebrow}</p>
     <h1>${section.label}</h1>
     <p>${section.desc}</p>
   </div>
   ${section.image?`<div class="archive-section-hero-art reveal" aria-hidden="true"><img src="${section.image}" alt=""></div>`:''}
 </section>
 <section class="section archive-section-shell">
   <div class="archive-back-row"><a class="text-link" href="archivo.html">← VOLVER AL ÍNDICE GENERAL</a><span>${String(section.items.length).padStart(2,'0')} EXPEDIENTE${section.items.length===1?'':'S'}</span></div>
   ${list}
 </section>
 ${archiveCorkboard(section)}
 </main>${footer(site)}</body></html>`;
 fs.writeFileSync(path.join(DIST,section.file),sectionPage);
 for(const item of section.items){
   if(section.key!=='relatos') fs.writeFileSync(path.join(DIST,itemHref(section,item)),archiveEntryPage(section,item));
 }
}


// La página "Sobre" sigue siendo fija por ahora
let about=fs.readFileSync(path.join(ROOT,'sobre.static.html'),'utf8');
about=about.replaceAll('href="assets/','href="/assets/').replaceAll('src="assets/','src="/assets/');
fs.writeFileSync(path.join(DIST,'sobre.html'),about);

// robots + sitemap placeholder
fs.writeFileSync(path.join(DIST,'robots.txt'),'User-agent: *\\nAllow: /\\n');
console.log(`Construida web con ${stories.length} relato(s) y ${micros.length} microrrelato(s).`);