(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if(menu && nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false')})}
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  document.querySelectorAll('.redacted').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('revealed')));

  document.querySelectorAll('.archive-testimonies').forEach(panel=>{
    const audio=panel.querySelector('.testimony-audio');
    const playButton=panel.querySelector('[data-testimony-play]');
    const pauseButton=panel.querySelector('[data-testimony-pause]');
    const stopButton=panel.querySelector('[data-testimony-stop]');
    const state=panel.querySelector('[data-testimony-state]');
    const time=panel.querySelector('[data-testimony-time]');
    const title=panel.querySelector('[data-testimony-title]');
    const meta=panel.querySelector('[data-testimony-meta]');
    const soundButton=panel.querySelector('[data-testimony-sound]');
    const tracks=Array.from(panel.querySelectorAll('[data-testimony-track]'));
    const transcripts=Array.from(panel.querySelectorAll('[data-testimony-transcript]'));
    if(!audio||!playButton||!pauseButton||!stopButton)return;
    panel.classList.add('is-ready');
    let effectsOn=true;
    let soundContext;
    try{effectsOn=localStorage.getItem('testimony-effects')!=='off'}catch(e){}
    const updateSoundButton=()=>{
      if(!soundButton)return;
      soundButton.textContent=effectsOn?'EFECTOS: SÍ':'EFECTOS: NO';
      soundButton.setAttribute('aria-pressed',String(effectsOn));
      soundButton.setAttribute('aria-label',effectsOn?'Silenciar efectos del magnetófono':'Activar efectos del magnetófono');
      soundButton.title=effectsOn?'Silenciar efectos del magnetófono':'Activar efectos del magnetófono';
    };
    updateSoundButton();
    soundButton?.addEventListener('click',()=>{
      effectsOn=!effectsOn;
      try{localStorage.setItem('testimony-effects',effectsOn?'on':'off')}catch(e){}
      updateSoundButton();
    });
    const mechanicalClick=(delay=0,pitch=1,volume=.08)=>{
      if(!effectsOn)return;
      try{
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        if(!AudioContext)return;
        soundContext=soundContext||new AudioContext();
        if(soundContext.state==='suspended')soundContext.resume();
        const at=soundContext.currentTime+delay;
        const oscillator=soundContext.createOscillator();
        const gain=soundContext.createGain();
        oscillator.type='triangle';
        oscillator.frequency.setValueAtTime(180*pitch,at);
        oscillator.frequency.exponentialRampToValueAtTime(65*pitch,at+.065);
        gain.gain.setValueAtTime(volume,at);
        gain.gain.exponentialRampToValueAtTime(.001,at+.075);
        oscillator.connect(gain).connect(soundContext.destination);
        oscillator.start(at);
        oscillator.stop(at+.08);
      }catch(e){}
    };
    const format=seconds=>Number.isFinite(seconds)?String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(Math.floor(seconds%60)).padStart(2,'0'):'--:--';
    const updateTime=()=>{time.textContent=format(audio.currentTime)+' / '+format(audio.duration)};
    const setState=value=>{state.textContent=value;panel.classList.toggle('is-playing',value==='REPRODUCIENDO')};
    playButton.addEventListener('click',()=>{
      mechanicalClick(0,1.15);
      audio.play().then(()=>setState('REPRODUCIENDO')).catch(()=>setState('NO SE PUEDE REPRODUCIR'));
    });
    pauseButton.addEventListener('click',()=>{mechanicalClick(0,.9);audio.pause();setState('EN PAUSA')});
    stopButton.addEventListener('click',()=>{
      mechanicalClick(0,.7);
      audio.pause();
      try{audio.currentTime=0}catch(e){}
      updateTime();
      setState('DETENIDO');
    });
    tracks.forEach((button,index)=>button.addEventListener('click',()=>{
      if(button.getAttribute('aria-pressed')==='true')return;
      mechanicalClick(0,.7,.1);
      mechanicalClick(.13,1.25,.07);
      mechanicalClick(.29,.95,.085);
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
