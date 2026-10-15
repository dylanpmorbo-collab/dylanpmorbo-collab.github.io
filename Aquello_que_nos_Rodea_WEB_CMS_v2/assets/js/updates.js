/* Novedades del Archivo: el seguimiento permanece únicamente en este navegador. */
(() => {
  const KEY='aqnr_updates_v1';
  const items=Array.isArray(window.AQNR_UPDATES)?window.AQNR_UPDATES.filter(item=>item&&item.id&&item.href):[];
  const byId=new Map(items.map(item=>[item.id,item]));
  const pageName=value=>{
    try{return new URL(value,location.href).pathname.split('/').pop()||'index.html'}catch{return ''}
  };
  let state;
  try{
    const raw=localStorage.getItem(KEY);
    state=raw?JSON.parse(raw):null;
  }catch{state=null}
  const firstVisit=!state||!state.known||!Array.isArray(state.unread);
  if(firstVisit)state={known:{},unread:[]};
  const currentIds=new Set(items.map(item=>item.id));
  state.unread=state.unread.filter(id=>currentIds.has(id)&&byId.get(id)?.notify!==false);
  for(const item of items){
    const version=String(item.version||'');
    if(!firstVisit&&state.known[item.id]!==version&&item.notify!==false&&!state.unread.includes(item.id))state.unread.push(item.id);
    state.known[item.id]=version;
    if(item.notify===false)state.unread=state.unread.filter(id=>id!==item.id);
  }
  for(const id of Object.keys(state.known))if(!currentIds.has(id))delete state.known[id];
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
  save();

  const toggle=document.querySelector('[data-updates-toggle]');
  const panel=document.querySelector('[data-updates-panel]');
  const list=document.querySelector('[data-updates-list]');
  const count=document.querySelector('[data-updates-count]');
  const unread=()=>new Set(state.unread);
  function badge(){const span=document.createElement('span');span.className='archive-unread-badge';span.textContent='NUEVO';return span}
  function refresh(scope=document){
    const ids=unread();
    scope.querySelectorAll('[data-update-id]').forEach(target=>{
      const active=ids.has(target.dataset.updateId);
      target.classList.toggle('has-unread-update',active);
      let marker=target.querySelector(':scope > .archive-unread-badge');
      if(active&&!marker)target.appendChild(badge());
      if(!active&&marker)marker.remove();
    });
    document.querySelectorAll('a[href]').forEach(link=>{
      const page=pageName(link.href);
      const match=items.find(item=>item.kind==='page'&&pageName(item.href)===page);
      if(match)link.classList.toggle('has-unread-page',ids.has(match.id));
    });
    count.textContent=String(state.unread.length);
    count.hidden=!state.unread.length;
    toggle.setAttribute('aria-label',state.unread.length?'Novedades: '+state.unread.length+' archivos sin abrir':'Novedades: no hay archivos nuevos');
    list.replaceChildren();
    if(!state.unread.length){const empty=document.createElement('p');empty.className='site-updates-empty';empty.textContent='No hay archivos nuevos sin abrir. La recuperación continúa.';list.appendChild(empty);return}
    for(const id of state.unread.slice().reverse()){
      const item=byId.get(id);if(!item)continue;
      const link=document.createElement('a');link.className='site-updates-item';link.href=item.href;
      const context=document.createElement('small');context.textContent=item.context||'ARCHIVO';
      const title=document.createElement('strong');title.textContent=item.title||'Archivo recuperado';
      const action=document.createElement('span');action.textContent='LOCALIZAR →';
      link.append(context,title,action);list.appendChild(link);
    }
  }
  function markOpened(id){
    if(!id||!byId.has(id)||!state.unread.includes(id))return;
    state.unread=state.unread.filter(value=>value!==id);save();refresh();
  }
  window.AQNRUpdates={markOpened,refresh};
  const currentPage=pageName(location.href);
  for(const item of items)if(item.kind==='page'&&pageName(item.href)===currentPage)markOpened(item.id);
  refresh();
  toggle?.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))});
  panel?.querySelector('[data-updates-close]')?.addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel&&!panel.hidden){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}});
  document.addEventListener('click',event=>{
    if(panel&&!panel.hidden&&!event.target.closest('.site-updates')){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}
    const gallery=event.target.closest('a.archive-gallery-item [data-update-id], .archive-gallery-item a[data-update-id]');
    if(gallery)markOpened(gallery.dataset.updateId);
  });
  document.addEventListener('toggle',event=>{
    if(event.target.matches('.archive-press-card[data-update-id]')&&event.target.open)markOpened(event.target.dataset.updateId);
  },true);
  window.addEventListener('storage',event=>{
    if(event.key!==KEY||!event.newValue)return;
    try{const incoming=JSON.parse(event.newValue);if(incoming?.known&&Array.isArray(incoming.unread)){state=incoming;refresh()}}catch{}
  });
})();

