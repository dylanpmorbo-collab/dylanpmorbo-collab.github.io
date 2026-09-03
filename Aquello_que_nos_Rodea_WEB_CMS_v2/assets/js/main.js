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
  if(gate){
    if(localStorage.getItem('aqnr_age_ok')==='yes') gate.classList.add('hidden');
    document.querySelector('#ageEnter')?.addEventListener('click',()=>{localStorage.setItem('aqnr_age_ok','yes');gate.classList.add('hidden')});
  }
})();
