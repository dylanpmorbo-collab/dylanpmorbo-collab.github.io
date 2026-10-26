(function(){
  const scene=document.querySelector('[data-terminal-scene]');
  if(!scene) return;

  const viewport=scene.closest('.terminal-scene-viewport');
  if(viewport && window.innerWidth<900){
    viewport.scrollLeft=(scene.clientWidth-viewport.clientWidth)/2;
  }

  const eyes=scene.querySelector('[data-terminal-eyes]');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(eyes && !reduced){
    scene.addEventListener('pointermove',function(event){
      const box=eyes.getBoundingClientRect();
      const dx=event.clientX-(box.left+box.width/2);
      const dy=event.clientY-(box.top+box.height/2);
      const length=Math.max(1,Math.hypot(dx,dy));
      eyes.style.setProperty('--eye-x',Math.round(dx/length*3)+'px');
      eyes.style.setProperty('--eye-y',Math.round(dy/length*2)+'px');
    });
    scene.addEventListener('pointerleave',function(){
      eyes.style.setProperty('--eye-x','0px');
      eyes.style.setProperty('--eye-y','0px');
    });
    const blink=function(){
      eyes.classList.add('is-blinking');
      setTimeout(function(){eyes.classList.remove('is-blinking');},140);
      setTimeout(blink,3000+Math.random()*5200);
    };
    setTimeout(blink,1800+Math.random()*2600);
  }

  const form=scene.querySelector('[data-terminal-form]');
  const textarea=scene.querySelector('textarea[name="message"]');
  const count=scene.querySelector('[data-terminal-count]');
  const status=scene.querySelector('[data-terminal-status]');
  const send=scene.querySelector('[data-terminal-send]');
  const physicalSend=scene.querySelector('[data-terminal-physical-send]');
  const endpoint=scene.dataset.endpoint||'';
  const finalMessage=scene.dataset.success||'TRANSMISIÓN RECIBIDA // EL ARCHIVO HA RECIBIDO SU MENSAJE';
  let pending=false;

  if(textarea && count){
    textarea.addEventListener('input',function(){
      count.textContent=String(textarea.value.length);
      if(status) status.textContent=textarea.value?'MENSAJE PREPARADO_':'ESPERANDO ENTRADA_';
    });
  }

  async function transmit(event){
    if(event) event.preventDefault();
    if(!form || !textarea || !status || pending) return;
    const message=textarea.value.trim();
    if(!message){
      status.textContent='ERROR // NO HAY MENSAJE';
      textarea.focus();
      return;
    }
    if(!endpoint){
      status.textContent='ERROR // CANAL NO CONFIGURADO';
      return;
    }
    pending=true;
    if(send) send.disabled=true;
    if(physicalSend) physicalSend.disabled=true;
    scene.classList.add('is-transmitting');
    status.textContent='TRANSMITIENDO...';
    const controller=new AbortController();
    const timeout=setTimeout(function(){controller.abort();},15000);
    try{
      const payload=Object.fromEntries(new FormData(form));
      payload.message=message;
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload),
        signal:controller.signal
      });
      const result=await response.json();
      if(!response.ok || (result.success!==true && result.success!=='true')) throw new Error('La transmisión no fue aceptada');
      status.textContent=finalMessage;
      textarea.value='';
      if(count) count.textContent='0';
    }catch(error){
      status.textContent=error.name==='AbortError'?'SIN RESPUESTA // INTÉNTALO DE NUEVO':'ERROR DE TRANSMISIÓN // INTÉNTALO DE NUEVO';
    }finally{
      clearTimeout(timeout);
      pending=false;
      if(send) send.disabled=false;
      if(physicalSend) physicalSend.disabled=false;
      scene.classList.remove('is-transmitting');
    }
  }
  if(form) form.addEventListener('submit',transmit);
  if(physicalSend) physicalSend.addEventListener('click',function(){if(form) form.requestSubmit();});
  if(textarea) textarea.addEventListener('keydown',function(event){
    if((event.ctrlKey||event.metaKey) && event.key==='Enter'){
      event.preventDefault();
      if(form) form.requestSubmit();
    }
  });
})();
