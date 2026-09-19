(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if(menu && nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false')})}
  const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  document.querySelectorAll('.redacted').forEach(el=>el.addEventListener('click',()=>el.classList.toggle('revealed')));

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
