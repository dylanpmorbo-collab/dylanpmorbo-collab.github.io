(() => {
  document.querySelectorAll('.archive-police-report-block').forEach(block => {
    const dialog=block.querySelector('.archive-police-dialog');
    if(!dialog) return;
    const viewer=dialog.querySelector('[data-police-pages]');
    const scroll=dialog.querySelector('.archive-police-dialog-scroll');
    const prev=dialog.querySelector('[data-police-prev]');
    const next=dialog.querySelector('[data-police-next]');
    const indexButton=dialog.querySelector('[data-police-index-button]');
    const counter=dialog.querySelector('[data-police-counter]');
    const lightbox=block.querySelector('.archive-police-image-dialog');
    const large=lightbox.querySelector('[data-police-image-large]');
    const imageCounter=lightbox.querySelector('[data-police-image-counter]');
    const imagePrev=lightbox.querySelector('[data-police-image-prev]');
    const imageNext=lightbox.querySelector('[data-police-image-next]');
    const reveal=document.createElement('button');
    reveal.type='button';
    reveal.className='archive-police-image-reveal';
    reveal.textContent='MOSTRAR ORIGINAL';
    reveal.setAttribute('aria-label','Mostrar fotografía original ampliada');
    reveal.hidden=true;
    lightbox.appendChild(reveal);
    imagePrev.textContent='← ANTERIOR';
    imageNext.textContent='SIGUIENTE →';
    let page=0,trigger=null,images=[],imageIndex=0,imageTrigger=null,imageOriginal='',imageRevealed=false;
    const pages=()=>[...viewer.querySelectorAll('[data-police-page]')];
    function showPage(){
      const all=pages();
      all.forEach((element,i)=>{element.hidden=i!==page;});
      const active=all[page];
      const documentNumber=active?.dataset.policeDocument;
      counter.textContent=active?.hasAttribute('data-police-index')?'ÍNDICE · '+all.length+' FOLIOS':'FOLIO '+(page+1)+' / '+all.length+(documentNumber!==undefined?' · DOCUMENTO '+(Number(documentNumber)+1):'');
      prev.disabled=page===0;
      next.disabled=page>=all.length-1;
      indexButton.hidden=!all[0]?.hasAttribute('data-police-index')||page===0;
      scroll.scrollTop=0;
    }
    function setPage(value){
      if(value<0||value>=pages().length)return;
      page=value;showPage();
    }
    block.querySelectorAll('[data-police-open]').forEach(button=>button.addEventListener('click',()=>{
      const template=block.querySelector('[data-police-template="'+button.dataset.policeOpen+'"]');
      if(!template)return;
      trigger=button;
      viewer.replaceChildren(template.content.cloneNode(true));
      dialog.querySelector('#archive-police-dialog-title').textContent=button.querySelector('strong').textContent;
      dialog.querySelector('#archive-police-dialog-type').textContent='EXPEDIENTE // '+button.dataset.reportType;
      page=0;showPage();dialog.showModal();
      document.body.classList.add('archive-police-dialog-open');
      dialog.querySelector('[data-police-close]').focus();
    }));
    viewer.addEventListener('click',event=>{
      const jump=event.target.closest('[data-police-jump]');
      if(jump){
        const target=pages().findIndex(element=>element.dataset.policeDocument===jump.dataset.policeJump);
        setPage(target);return;
      }
      const photo=event.target.closest('[data-police-image-open]');
      if(!photo)return;
      imageTrigger=photo;
      images=[...viewer.querySelectorAll('[data-police-image-open]')];
      imageIndex=images.indexOf(photo);
      showImage();lightbox.showModal();
      lightbox.querySelector('[data-police-image-close]').focus();
    });
    prev.addEventListener('click',()=>setPage(page-1));
    next.addEventListener('click',()=>setPage(page+1));
    indexButton.addEventListener('click',()=>setPage(0));
    dialog.querySelector('[data-police-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('keydown',event=>{
      if(lightbox.open)return;
      if(event.key==='ArrowLeft'){event.preventDefault();setPage(page-1);}
      if(event.key==='ArrowRight'){event.preventDefault();setPage(page+1);}
    });
    dialog.addEventListener('close',()=>{
      document.body.classList.remove('archive-police-dialog-open');
      viewer.replaceChildren();if(trigger?.isConnected)trigger.focus();
    });
    function showImage(){
      const thumb=images[imageIndex]?.querySelector('img');
      if(!thumb)return;
      imageOriginal=thumb.dataset.globalOriginal||thumb.getAttribute('src')||'';
      imageRevealed=false;
      const censored=!!thumb.dataset.globalMode;
      large.src=thumb.currentSrc||thumb.src;
      large.alt=thumb.alt;
      large.classList.toggle('archive-police-image-pixelated',censored);
      large.classList.toggle('archive-police-image-pixel-pending',censored&&thumb.dataset.globalMode==='pixelado'&&!thumb.classList.contains('global-censored-ready'));
      reveal.hidden=!censored;
      imageCounter.textContent='IMAGEN '+(imageIndex+1)+' / '+images.length;
      imagePrev.disabled=imageIndex===0;imageNext.disabled=imageIndex===images.length-1;
    }
    viewer.addEventListener('load',event=>{
      const thumb=images[imageIndex]?.querySelector('img');
      if(event.target!==thumb||imageRevealed||!lightbox.open||!thumb.classList.contains('global-censored-ready'))return;
      large.src=thumb.currentSrc||thumb.src;
      large.classList.remove('archive-police-image-pixel-pending');
    },true);
    reveal.addEventListener('click',()=>{
      if(!imageOriginal)return;
      imageRevealed=true;
      large.src=imageOriginal;
      large.classList.remove('archive-police-image-pixelated','archive-police-image-pixel-pending');
      reveal.hidden=true;
    });
    imagePrev.addEventListener('click',()=>{if(imageIndex>0){imageIndex--;showImage();}});
    imageNext.addEventListener('click',()=>{if(imageIndex<images.length-1){imageIndex++;showImage();}});
    lightbox.querySelector('[data-police-image-close]').addEventListener('click',()=>lightbox.close());
    lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
    lightbox.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'&&imageIndex>0){event.preventDefault();imageIndex--;showImage();}
      if(event.key==='ArrowRight'&&imageIndex<images.length-1){event.preventDefault();imageIndex++;showImage();}
    });
    lightbox.addEventListener('close',()=>{
      large.removeAttribute('src');images=[];
      imageOriginal='';imageRevealed=false;reveal.hidden=true;
      if(imageTrigger?.isConnected)imageTrigger.focus();
    });
  });
})();
