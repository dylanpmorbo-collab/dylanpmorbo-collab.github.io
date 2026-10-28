(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if(menu && nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false')})}
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  document.querySelectorAll('.redacted').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('revealed')));

  document.querySelectorAll('[data-sandbox-carousel]').forEach(carousel=>{
    const slides=Array.from(carousel.querySelectorAll('[data-sandbox-slide]'));
    const counter=carousel.querySelector('[data-sandbox-counter]');
    if(slides.length<2||!counter)return;
    let current=0;
    const show=step=>{
      slides[current].querySelectorAll('video').forEach(video=>video.pause());
      slides[current].hidden=true;
      current=(current+step+slides.length)%slides.length;
      slides[current].hidden=false;
      counter.textContent=`${current+1} / ${slides.length}`;
    };
    carousel.querySelector('[data-sandbox-prev]')?.addEventListener('click',()=>show(-1));
    carousel.querySelector('[data-sandbox-next]')?.addEventListener('click',()=>show(1));
    carousel.addEventListener('keydown',event=>{
      if(event.target!==carousel||!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();
      show(event.key==='ArrowLeft'?-1:1);
    });
  });

  document.querySelectorAll('.archive-testimonies').forEach(panel=>{
    const audio=panel.querySelector('.testimony-audio');
    const playButton=panel.querySelector('[data-testimony-play]');
    const pauseButton=panel.querySelector('[data-testimony-pause]');
    const stopButton=panel.querySelector('[data-testimony-stop]');
    const state=panel.querySelector('[data-testimony-state]');
    const time=panel.querySelector('[data-testimony-time]');
    const title=panel.querySelector('[data-testimony-title]');
    const meta=panel.querySelector('[data-testimony-meta]');
    const tracks=Array.from(panel.querySelectorAll('[data-testimony-track]'));
    const transcripts=Array.from(panel.querySelectorAll('[data-testimony-transcript]'));
    if(!audio||!playButton||!pauseButton||!stopButton)return;
    panel.classList.add('is-ready');
    const format=seconds=>Number.isFinite(seconds)?String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(Math.floor(seconds%60)).padStart(2,'0'):'--:--';
    const updateTime=()=>{time.textContent=format(audio.currentTime)+' / '+format(audio.duration)};
    const setState=value=>{state.textContent=value;panel.classList.toggle('is-playing',value==='REPRODUCIENDO')};
    playButton.addEventListener('click',()=>{
      audio.play().then(()=>setState('REPRODUCIENDO')).catch(()=>setState('NO SE PUEDE REPRODUCIR'));
    });
    pauseButton.addEventListener('click',()=>{audio.pause();setState('EN PAUSA')});
    stopButton.addEventListener('click',()=>{
      audio.pause();
      try{audio.currentTime=0}catch(e){}
      updateTime();
      setState('DETENIDO');
    });
    tracks.forEach((button,index)=>button.addEventListener('click',()=>{
      audio.pause();
      audio.src=button.dataset.testimonySrc;
      audio.load();
      title.textContent=button.dataset.testimonyTitle;
      meta.textContent=button.dataset.testimonyMeta;
      tracks.forEach(track=>track.setAttribute('aria-pressed',String(track===button)));
      transcripts.forEach((transcript,i)=>{transcript.hidden=i!==index});
      setState('LISTO PARA REPRODUCIR');
      updateTime();
    }));
    audio.addEventListener('timeupdate',updateTime);
    audio.addEventListener('loadedmetadata',updateTime);
    audio.addEventListener('ended',()=>{setState('FIN DE LA GRABACIÓN');updateTime()});
    audio.addEventListener('error',()=>setState('NO SE PUEDE REPRODUCIR'));
    updateTime();
  });

  document.querySelectorAll('.digital-sensitive img').forEach(img=>{
    const pixelate=()=>{
      if(!img.naturalWidth || !img.parentElement?.classList.contains('digital-sensitive'))return;
      try{
        const canvas=document.createElement('canvas');
        canvas.width=32;
        canvas.height=Math.max(1,Math.round(32*img.naturalHeight/img.naturalWidth));
        canvas.setAttribute('aria-hidden','true');
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        img.parentElement.insertBefore(canvas,img.nextSibling);
        img.parentElement.classList.add('is-pixelated');
      }catch(e){}
    };
    if(img.complete)pixelate();
    else img.addEventListener('load',pixelate,{once:true});
  });

  const story = document.querySelector('.story-text');
  if(story){
    const progress = document.querySelector('.reading-progress span');
    const updateProgress=()=>{const rect=story.getBoundingClientRect();const total=story.offsetHeight-window.innerHeight;const passed=Math.min(total,Math.max(0,-rect.top));const pct=total>0?(passed/total)*100:0;if(progress)progress.style.width=pct+'%'};
    addEventListener('scroll',updateProgress,{passive:true});updateProgress();
    let size=parseFloat(getComputedStyle(story).fontSize);
    document.querySelector('[data-reader="minus"]')?.addEventListener('click',()=>{size=Math.max(16,size-1);story.style.fontSize=size+'px'});
    document.querySelector('[data-reader="plus"]')?.addEventListener('click',()=>{size=Math.min(28,size+1);story.style.fontSize=size+'px'});
    document.querySelector('[data-reader="focus"]')?.addEventListener('click',()=>document.body.classList.toggle('focus-mode'));
  }
  const scrollTopButton=document.createElement('button');
  scrollTopButton.className='scroll-to-top';
  scrollTopButton.type='button';
  scrollTopButton.setAttribute('aria-label','Volver arriba');
  scrollTopButton.setAttribute('title','Volver arriba');
  scrollTopButton.textContent='↑';
  document.body.appendChild(scrollTopButton);
  const updateScrollTopButton=()=>scrollTopButton.classList.toggle('is-visible',window.scrollY>500);
  scrollTopButton.addEventListener('click',()=>{
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});
  });
  addEventListener('scroll',updateScrollTopButton,{passive:true});
  updateScrollTopButton();

  const gate=document.querySelector('#ageGate');
  const ageButton=document.querySelector('#ageEnter');
  const lockPage=locked=>{
    Array.from(document.body.children).forEach(child=>{
      if(child!==gate)child.inert=locked;
    });
  };
  const ageVerified=document.documentElement.classList.contains('age-verified');
  lockPage(!ageVerified);
  if(!ageVerified)ageButton?.focus();
  ageButton?.addEventListener('click',()=>{
    try{localStorage.setItem('aqnr_age_ok','yes')}catch(e){}
    document.documentElement.classList.add('age-verified');
    lockPage(false);
    document.querySelector('.brand')?.focus();
    updateCookieBanner();
  });

  const banner=document.querySelector('#cookieBanner');
  const measureId='G-KSM55EYY2L';
  let analyticsLoaded=false;
  const readChoice=()=>{
    try{
      const saved=JSON.parse(localStorage.getItem('aqnr_cookie_choice')||'null');
      if(saved && Date.now()-saved.time<365*24*60*60*1000 && ['accepted','rejected'].includes(saved.value))return saved.value;
    }catch(e){}
    return null;
  };
  const saveChoice=value=>{
    try{localStorage.setItem('aqnr_cookie_choice',JSON.stringify({value,time:Date.now()}))}catch(e){}
  };
  const enableAnalytics=()=>{
    if(analyticsLoaded)return;
    analyticsLoaded=true;
    window['ga-disable-'+measureId]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',measureId);
    const script=document.createElement('script');
    script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+measureId;
    document.head.appendChild(script);
  };
  const disableAnalytics=()=>{
    window['ga-disable-'+measureId]=true;
    document.cookie.split(';').forEach(cookie=>{
      const name=cookie.trim().split('=')[0];
      if(/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)){
        document.cookie=name+'=; Max-Age=0; path=/; SameSite=Lax';
        document.cookie=name+'=; Max-Age=0; path=/; domain='+location.hostname+'; SameSite=Lax';
      }
    });
  };
  function updateCookieBanner(){
    if(banner)banner.hidden=!(document.documentElement.classList.contains('age-verified')&&!readChoice());
  }
  document.querySelector('#cookieAccept')?.addEventListener('click',()=>{
    saveChoice('accepted');enableAnalytics();updateCookieBanner();
  });
  document.querySelector('#cookieReject')?.addEventListener('click',()=>{
    saveChoice('rejected');disableAnalytics();updateCookieBanner();
  });
  document.querySelector('#cookieSettings')?.addEventListener('click',()=>{
    if(banner){banner.hidden=false;banner.querySelector('button')?.focus()}
  });
  if(readChoice()==='accepted')enableAnalytics();
  else disableAnalytics();
  updateCookieBanner();
})();


// Amplía las imágenes y los vídeos de cada apartado libre sin alterar su carrusel.
(() => {
  const galleries=Array.from(document.querySelectorAll('.sandbox-carousel'));
  if(!galleries.length||typeof HTMLDialogElement==='undefined')return;

  const dialog=document.createElement('dialog');
  dialog.className='sandbox-lightbox';
  dialog.setAttribute('aria-label','Galería ampliada');
  dialog.innerHTML=
    '<div class="sandbox-lightbox-top"><strong data-sandbox-lightbox-title></strong><button type="button" data-sandbox-lightbox-close aria-label="Cerrar ampliación">×</button></div>'+
    '<div class="sandbox-lightbox-media" data-sandbox-lightbox-media></div>'+
    '<p class="sandbox-lightbox-caption" data-sandbox-lightbox-caption></p>'+
    '<div class="sandbox-lightbox-controls"><button type="button" data-sandbox-lightbox-prev aria-label="Anterior imagen o vídeo">← Anterior</button><span data-sandbox-lightbox-counter aria-live="polite"></span><button type="button" data-sandbox-lightbox-next aria-label="Siguiente imagen o vídeo">Siguiente →</button></div>';
  document.body.appendChild(dialog);

  const mediaBox=dialog.querySelector('[data-sandbox-lightbox-media]');
  const caption=dialog.querySelector('[data-sandbox-lightbox-caption]');
  const counter=dialog.querySelector('[data-sandbox-lightbox-counter]');
  const previous=dialog.querySelector('[data-sandbox-lightbox-prev]');
  const next=dialog.querySelector('[data-sandbox-lightbox-next]');
  const close=dialog.querySelector('[data-sandbox-lightbox-close]');
  let activeGallery=null;
  let activeSlides=[];
  let activeIndex=0;
  let returnFocus=null;

  const stopVideo=element=>{
    element?.querySelectorAll('video').forEach(video=>video.pause());
  };
  const show=index=>{
    if(!activeSlides.length)return;
    stopVideo(mediaBox);
    activeIndex=(index+activeSlides.length)%activeSlides.length;
    const slide=activeSlides[activeIndex];
    const source=slide.querySelector('.sandbox-slide-media img, .sandbox-slide-media video');
    if(!source)return;
    const enlarged=source.cloneNode(true);
    if(enlarged.tagName==='IMG')enlarged.removeAttribute('loading');
    if(enlarged.tagName==='VIDEO'){
      enlarged.controls=true;
      enlarged.preload='metadata';
    }
    mediaBox.replaceChildren(enlarged);
    const description=slide.querySelector('figcaption')?.textContent?.trim()||'';
    caption.textContent=description;
    caption.hidden=!description;
    counter.textContent=String(activeIndex+1)+' / '+String(activeSlides.length);
    previous.hidden=next.hidden=activeSlides.length<2;

    // Mantiene sincronizado el carrusel de la ficha al avanzar en la ampliación.
    const visible=activeSlides.findIndex(item=>!item.hidden);
    if(visible>=0&&visible!==activeIndex){
      const advance=activeGallery?.querySelector('[data-sandbox-next]');
      for(let i=0;i<(activeIndex-visible+activeSlides.length)%activeSlides.length;i++)advance?.click();
    }
  };
  const open=(gallery,index,trigger)=>{
    if(dialog.open)return;
    activeGallery=gallery;
    dialog.querySelector('[data-sandbox-lightbox-title]').textContent=gallery.closest('.sandbox-card')?.querySelector('h2')?.textContent||'Galería';
    activeSlides=Array.from(gallery.querySelectorAll('[data-sandbox-slide]'));
    returnFocus=trigger;
    stopVideo(gallery);
    show(index);
    dialog.showModal();
    close.focus();
  };

  galleries.forEach(gallery=>{
    const slides=Array.from(gallery.querySelectorAll('[data-sandbox-slide]'));
    slides.forEach((slide,index)=>{
      const wrapper=slide.querySelector('.sandbox-slide-media');
      if(!wrapper)return;
      const source=wrapper.querySelector('img,video');
      if(!source)return;
      const button=document.createElement('button');
      button.type='button';
      button.className='sandbox-expand';
      button.setAttribute('aria-label',source.tagName==='VIDEO'?'Ampliar vídeo':'Ampliar imagen');
      button.title='Ampliar';
      button.textContent='⤢';
      wrapper.appendChild(button);
      button.addEventListener('click',()=>open(gallery,index,button));
      if(source.tagName==='IMG'){
        source.addEventListener('click',()=>open(gallery,index,button));
      }
    });
  });
  previous.addEventListener('click',()=>show(activeIndex-1));
  next.addEventListener('click',()=>show(activeIndex+1));
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  dialog.addEventListener('keydown',event=>{
    if(event.target.tagName==='VIDEO')return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      show(activeIndex+(event.key==='ArrowLeft'?-1:1));
    }
  });
  dialog.addEventListener('close',()=>{
    stopVideo(mediaBox);
    mediaBox.replaceChildren();
    const focusTarget=activeSlides[activeIndex]?.querySelector('.sandbox-expand')||returnFocus;
    activeGallery=null;
    activeSlides=[];
    focusTarget?.focus();
    returnFocus=null;
  });
})();

/* Distribución compacta del sandbox sin alterar el orden de las tarjetas. */
(() => {
  const grids = Array.from(document.querySelectorAll('.sandbox-grid'));
  if (!grids.length || !('ResizeObserver' in window)) return;
  const narrow = window.matchMedia('(max-width:700px)');
  grids.forEach(grid => {
    const cards = Array.from(grid.children).filter(card => card.classList.contains('sandbox-card'));
    if (cards.length < 3) return;
    let queued = false;
    const layout = () => {
      queued = false;
      if (narrow.matches) {
        grid.classList.remove('is-masonry');
        cards.forEach(card => { card.style.gridRowEnd = ''; });
        return;
      }
      const spans = cards.map(card => Math.max(1, Math.ceil((card.getBoundingClientRect().height + 22) / 8)));
      cards.forEach((card, index) => { card.style.gridRowEnd = 'span ' + spans[index]; });
      grid.classList.add('is-masonry');
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(layout);
    };
    const observer = new ResizeObserver(schedule);
    cards.forEach(card => observer.observe(card));
    window.addEventListener('resize', schedule, {passive:true});
    narrow.addEventListener?.('change', schedule);
    schedule();
  });
})();
