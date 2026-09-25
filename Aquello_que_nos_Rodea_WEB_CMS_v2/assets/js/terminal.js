(function(){
  const scene=document.querySelector('[data-terminal-scene]');
  if(!scene) return;

  const eyes=scene.querySelector('[data-terminal-eyes]');
  const pupils=eyes?Array.from(eyes.querySelectorAll('b')):[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(eyes && pupils.length && !reduced){
    scene.addEventListener('pointermove',function(event){
      const box=eyes.getBoundingClientRect();
      const dx=event.clientX-(box.left+box.width/2);
      const dy=event.clientY-(box.top+box.height/2);
      const length=Math.max(1,Math.hypot(dx,dy));
      const x=Math.max(-4,Math.min(4,dx/length*4));
      const y=Math.max(-2,Math.min(2,dy/length*2));
      pupils.forEach(function(pupil){pupil.style.transform='translate('+x+'px,'+y+'px)';});
    });
    scene.addEventListener('pointerleave',function(){
      pupils.forEach(function(pupil){pupil.style.transform='translate(0,0)';});
    });
    const blink=function(){
      eyes.classList.add('is-blinking');
      setTimeout(function(){eyes.classList.remove('is-blinking');},150);
      setTimeout(blink,2800+Math.random()*5200);
    };
    setTimeout(blink,1800+Math.random()*2600);
  }

  const poster=scene.querySelector('[data-terminal-poster]');
  const posterImage=poster?poster.querySelector('img'):null;
  if(poster && posterImage){
    let posters=[];
    try{posters=JSON.parse(document.getElementById('terminalPosterData').textContent||'[]');}catch(e){}
    const fixed=poster.dataset.fixed||'';
    let chosen=null;
    if(poster.dataset.mode==='fija' && fixed) chosen={image:fixed,label:'Cartel fijado'};
    else if(posters.length){
      let pool=posters;
      try{
        const previous=sessionStorage.getItem('aqnr_terminal_poster');
        if(previous && posters.length>1) pool=posters.filter(function(item){return item.image!==previous;});
      }catch(e){}
      chosen=pool[Math.floor(Math.random()*pool.length)];
    }else if(fixed) chosen={image:fixed,label:'Cartel recuperado'};
    if(chosen){
      posterImage.src=chosen.image;
      posterImage.alt=chosen.label||'Cartel deteriorado recuperado';
      posterImage.hidden=false;
      poster.classList.add('has-image');
      try{sessionStorage.setItem('aqnr_terminal_poster',chosen.image);}catch(e){}
    }
  }

  const textarea=scene.querySelector('textarea');
  const count=scene.querySelector('[data-terminal-count]');
  const status=scene.querySelector('[data-terminal-status]');
  const send=scene.querySelector('[data-terminal-send]');
  const finalMessage=scene.dataset.success||'TRANSMISIÓN SIMULADA // EL CANAL EXTERNO TODAVÍA NO ESTÁ CONECTADO';
  if(textarea && count){
    textarea.addEventListener('input',function(){
      count.textContent=String(textarea.value.length);
      if(status) status.textContent=textarea.value?'MENSAJE EN MEMORIA_':'ESPERANDO ENTRADA_';
    });
  }
  function transmit(){
    if(!textarea || !status) return;
    if(!textarea.value.trim()){
      status.textContent='ERROR // NO HAY MENSAJE';
      textarea.focus();
      return;
    }
    scene.classList.add('is-transmitting');
    status.textContent='BUSCANDO ENLACE...';
    setTimeout(function(){
      status.textContent=finalMessage;
      scene.classList.remove('is-transmitting');
    },900);
  }
  if(send) send.addEventListener('click',transmit);
  if(textarea) textarea.addEventListener('keydown',function(event){
    if((event.ctrlKey||event.metaKey) && event.key==='Enter'){event.preventDefault();transmit();}
  });
})();
