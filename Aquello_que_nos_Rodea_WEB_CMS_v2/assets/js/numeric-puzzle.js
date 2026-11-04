(function(root){
  'use strict';
  const LENGTHS={basico:4,medio:5,dificil:6};
  const fallback=new Map();
  const storageKey=key=>'archivo-cifras-v1:'+key;
  function read(key){
    try{const value=root.localStorage.getItem(storageKey(key));return value===null?(fallback.get(key)||null):JSON.parse(value);}
    catch{return fallback.get(key)||null;}
  }
  function save(key,value){
    fallback.set(key,value);
    try{root.localStorage.setItem(storageKey(key),JSON.stringify(value));}catch{}
  }
  function generate(length,random=Math.random){
    const digits=Array.from({length:10},(_,index)=>String(index));
    for(let index=digits.length-1;index>0;index--){
      const other=Math.floor(random()*(index+1));
      [digits[index],digits[other]]=[digits[other],digits[index]];
    }
    return digits.slice(0,length).join('');
  }
  function valid(secret,length){return typeof secret==='string'&&secret.length===length&&/^\d+$/.test(secret)&&new Set(secret).size===length;}
  function scoreGuess(secret,guess){
    const exact=Array.from(guess,(digit,index)=>digit===secret[index]);
    const remaining=new Map();
    for(let index=0;index<secret.length;index++)if(!exact[index])remaining.set(secret[index],(remaining.get(secret[index])||0)+1);
    return Array.from(guess,(digit,index)=>{
      if(exact[index])return 'exacto';
      const count=remaining.get(digit)||0;
      if(count){remaining.set(digit,count-1);return 'presente';}
      return 'ausente';
    });
  }
  function guard({host,key,level,label,onSolve,onCancel}){
    const length=LENGTHS[level];
    if(!host||!length)return false;
    const stored=read(key);
    if(stored?.solved)return false;
    const secret=valid(stored?.secret,length)?stored.secret:generate(length);
    const guesses=stored?.secret===secret&&Array.isArray(stored.guesses)?stored.guesses.filter(row=>valid(row?.guess,length)).slice(-20):[];
    const locked=Array.from({length},(_,index)=>guesses.find(row=>row.guess[index]===secret[index])?.guess[index]||'');
    save(key,{secret,guesses,solved:false});
    host.querySelector('[data-numeric-overlay]')?.remove();
    const overlay=document.createElement('section');
    overlay.className='numeric-overlay';overlay.dataset.numericOverlay='';
    overlay.setAttribute('aria-label','Descifrar combinación · '+label);
    const panel=document.createElement('div');panel.className='numeric-panel';
    panel.innerHTML='<small>ARCHIVO // ACCESO CIFRADO</small><h2></h2><p>Descifra la combinación. Las cifras correctas quedan fijas; las que pertenecen al código, pero ocupan otra posición, se marcan en rojo. Las demás desaparecen.</p><form><div class="numeric-slots" role="group" aria-label="Combinación"></div><p class="numeric-status" role="status" aria-live="polite"></p><div class="numeric-actions"><button type="submit">COMPROBAR CIFRAS</button><button type="button" data-numeric-cancel>VOLVER</button></div></form><div class="numeric-history" aria-label="Intentos anteriores"></div>';
    panel.querySelector('h2').textContent=label;
    overlay.append(panel);root.ArchiveHackDevice?.mount(overlay,panel);host.append(overlay);
    const slots=panel.querySelector('.numeric-slots');
    const inputs=Array.from({length},(_,index)=>{
      const input=document.createElement('input');
      input.type='text';input.inputMode='numeric';input.pattern='[0-9]';input.maxLength=1;
      input.autocomplete='off';input.setAttribute('aria-label','Cifra '+(index+1));
      input.value=locked[index];input.disabled=Boolean(locked[index]);
      if(locked[index])input.classList.add('is-locked');
      slots.append(input);return input;
    });
    function firstFree(){return inputs.find(input=>!input.disabled);}
    function renderHistory(){
      const history=panel.querySelector('.numeric-history');history.replaceChildren();
      for(const row of guesses.slice(-8).reverse()){
        const line=document.createElement('div');line.className='numeric-attempt';
        const feedback=scoreGuess(secret,row.guess);
        for(let index=0;index<length;index++){
          const digit=document.createElement('span');digit.className='numeric-digit is-'+feedback[index];
          digit.textContent=feedback[index]==='ausente'?'·':row.guess[index];
          digit.setAttribute('aria-label',feedback[index]==='exacto'?'Cifra correcta':feedback[index]==='presente'?'Cifra en otra posición':'Cifra ausente');
          line.append(digit);
        }
        history.append(line);
      }
    }
    function enterDigits(value,start){
      let index=start;
      for(const digit of String(value).replace(/\D/g,'')){
        while(index<length&&inputs[index].disabled)index++;
        if(index>=length)break;
        inputs[index].value=digit;index++;
      }
      (inputs.slice(index).find(input=>!input.disabled)||firstFree())?.focus();
    }
    slots.addEventListener('input',event=>{
      const index=inputs.indexOf(event.target);if(index<0)return;
      const value=event.target.value;
      event.target.value='';enterDigits(value,index);
    });
    slots.addEventListener('paste',event=>{
      event.preventDefault();enterDigits(event.clipboardData?.getData('text')||'',Math.max(0,inputs.indexOf(event.target)));
    });
    slots.addEventListener('keydown',event=>{
      const index=inputs.indexOf(event.target);if(index<0)return;
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();const next=event.key==='ArrowLeft'?-1:1;
        for(let at=index+next;at>=0&&at<length;at+=next)if(!inputs[at].disabled){inputs[at].focus();break;}
      }
      if(event.key==='Backspace'&&!event.target.value){
        for(let at=index-1;at>=0;at--)if(!inputs[at].disabled){inputs[at].value='';inputs[at].focus();break;}
      }
    });
    panel.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();event.stopPropagation();
      const status=panel.querySelector('.numeric-status');
      if(inputs.some(input=>!input.value)){status.textContent='COMPLETA TODAS LAS CIFRAS';firstFree()?.focus();return;}
      const guess=inputs.map(input=>input.value).join('');
      if(new Set(guess).size!==length){status.textContent='CADA CIFRA DEBE SER DISTINTA';firstFree()?.focus();return;}
      const feedback=scoreGuess(secret,guess);
      guesses.push({guess});save(key,{secret,guesses,solved:feedback.every(value=>value==='exacto')});
      renderHistory();
      for(let index=0;index<length;index++){
        const input=inputs[index];input.classList.remove('is-present');
        if(feedback[index]==='exacto'){input.disabled=true;input.classList.add('is-locked');locked[index]=guess[index];}
        else if(feedback[index]==='presente'){input.classList.add('is-present');}
        else input.value='';
      }
      if(feedback.every(value=>value==='exacto')){
        status.textContent='COMBINACIÓN CORRECTA · ACCESO CONCEDIDO';
        root.setTimeout(()=>{if(overlay.isConnected){overlay.remove();onSolve?.();}},650);
      }else{
        status.textContent='ROJO: CIFRA EN OTRA POSICIÓN · VACÍO: CIFRA AUSENTE';
        root.setTimeout(()=>{for(const input of inputs)if(!input.disabled){input.value='';input.classList.remove('is-present');}firstFree()?.focus();},1000);
      }
    });
    overlay.addEventListener('click',event=>{
      event.stopPropagation();if(event.target.closest('[data-numeric-cancel]')){overlay.remove();onCancel?.();}
    });
    renderHistory();firstFree()?.focus();return true;
  }
  const api={LENGTHS,generate,valid,scoreGuess,guard};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ArchiveNumericPuzzle=api;
})(typeof window!=='undefined'?window:globalThis);
