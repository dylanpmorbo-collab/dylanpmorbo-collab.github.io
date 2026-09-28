(() => {
  document.querySelectorAll('.archive-physical-press').forEach(section => {
    const dialog=section.querySelector('.archive-physical-press-dialog');
    const buttons=[...section.querySelectorAll('[data-physical-press-open]')];
    if(!dialog||!buttons.length)return;
    const image=dialog.querySelector('[data-physical-press-large]');
    const counter=dialog.querySelector('[data-physical-press-counter]');
    const previous=dialog.querySelector('[data-physical-press-prev]');
    const next=dialog.querySelector('[data-physical-press-next]');
    let index=0,trigger=null;
    function show(){
      const thumbnail=buttons[index].querySelector('img');
      image.src=thumbnail.currentSrc||thumbnail.src;
      image.alt=thumbnail.alt;
      counter.textContent='RECORTE '+(index+1)+' / '+buttons.length;
      previous.disabled=index===0;
      next.disabled=index===buttons.length-1;
    }
    buttons.forEach((button,i)=>button.addEventListener('click',()=>{
      trigger=button;index=i;show();dialog.showModal();
      dialog.querySelector('[data-physical-press-close]').focus();
    }));
    previous.addEventListener('click',()=>{if(index>0){index--;show();}});
    next.addEventListener('click',()=>{if(index<buttons.length-1){index++;show();}});
    dialog.querySelector('[data-physical-press-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;show();}
      if(event.key==='ArrowRight'&&index<buttons.length-1){event.preventDefault();index++;show();}
    });
    dialog.addEventListener('close',()=>{
      image.removeAttribute('src');
      if(trigger?.isConnected)trigger.focus();
    });
  });
})();
