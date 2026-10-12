(function(root){
  'use strict';
  const SIZES={basico:4,medio:6,dificil:8};
  const MOVES={basico:60,medio:150,dificil:320};
  const fallback=new Map();
  const storageKey=key=>'archivo-acceso-v1:'+key;
  function read(key){try{const value=root.localStorage.getItem(storageKey(key));return value===null?(fallback.get(key)||null):JSON.parse(value);}catch{return fallback.get(key)||null;}}
  function save(key,value){fallback.set(key,value);try{root.localStorage.setItem(storageKey(key),JSON.stringify(value));}catch{}}
  function normalizeCode(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toUpperCase();}
  async function hashCode(value){
    if(!root.crypto?.subtle)throw Error('El navegador no permite verificar códigos en esta página. Abre la web publicada por HTTPS.');
    const bytes=new TextEncoder().encode(normalizeCode(value));
    const digest=await root.crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  function neighbors(blank,size){
    const row=Math.floor(blank/size),col=blank%size,result=[];
    if(row>0)result.push(blank-size);
    if(row<size-1)result.push(blank+size);
    if(col>0)result.push(blank-1);
    if(col<size-1)result.push(blank+1);
    return result;
  }
  function solved(tiles){return tiles.every((value,index)=>value===(index===tiles.length-1?-1:index));}
  function generate(level,random=Math.random){
    const size=SIZES[level]||4,tiles=Array.from({length:size*size},(_,i)=>i===size*size-1?-1:i);
    let blank=tiles.length-1,previous=-1;
    for(let step=0;step<(MOVES[level]||MOVES.basico);step++){
      let choices=neighbors(blank,size).filter(index=>index!==previous);
      if(!choices.length)choices=neighbors(blank,size);
      const selected=choices[Math.floor(random()*choices.length)];
      tiles[blank]=tiles[selected];tiles[selected]=-1;previous=blank;blank=selected;
    }
    if(solved(tiles)){const selected=neighbors(blank,size)[0];tiles[blank]=tiles[selected];tiles[selected]=-1;}
    return {size,tiles};
  }
  function valid(board,level){
    const size=SIZES[level];
    return !!size&&board?.size===size&&Array.isArray(board.tiles)&&board.tiles.length===size*size&&
      [...board.tiles].sort((a,b)=>a-b).every((value,index)=>value===index-1);
  }
  function removePrevious(host){host.querySelector('[data-access-overlay]')?.remove();}
  function createOverlay(host,label,kind){
    removePrevious(host);
    const overlay=document.createElement('section');
    overlay.className='access-overlay';overlay.dataset.accessOverlay='';
    overlay.setAttribute('aria-label',kind+' · '+label);
    host.append(overlay);return overlay;
  }
  function guardImage({host,key,level,label,image,onSolve,onCancel}){
    if(!SIZES[level])return false;
    const stored=read(key);
    if(stored?.solved)return false;
    let board=valid(stored?.board,level)?stored.board:generate(level);
    save(key,{board,solved:false});
    const overlay=createOverlay(host,label,'Reconstruir imagen');
    overlay.innerHTML='<div class="access-panel"><header><small>ARCHIVO // RECONSTRUCCIÓN VISUAL</small><h2></h2><p>Mueve una pieza contigua al hueco para reconstruir la imagen. Cada movimiento desplaza una sola pieza.</p></header><div class="access-picture-board" role="group" aria-label="Rompecabezas deslizante"></div><p class="access-status" aria-live="polite"></p><div class="access-actions"><button type="button" data-access-shuffle>MEZCLAR DE NUEVO</button><button type="button" data-access-cancel>VOLVER</button></div></div>';
    overlay.querySelector('h2').textContent=label;
    const grid=overlay.querySelector('.access-picture-board');grid.style.setProperty('--picture-size',board.size);
    const buttons=[];
    for(let i=0;i<board.tiles.length;i++){
      const button=document.createElement('button');button.type='button';button.className='access-picture-tile';
      button.dataset.pictureTile=String(i);grid.append(button);buttons.push(button);
    }
    function render(){
      const blank=board.tiles.indexOf(-1),adjacent=new Set(neighbors(blank,board.size));
      buttons.forEach((button,index)=>{
        const value=board.tiles[index];button.replaceChildren();button.classList.toggle('is-empty',value<0);
        button.disabled=value<0||!adjacent.has(index);
        button.setAttribute('aria-label',value<0?'Hueco vacío':`Fila ${Math.floor(index/board.size)+1}, columna ${index%board.size+1}. ${adjacent.has(index)?'Mover al hueco':'Pieza no contigua'}.`);
        if(value<0)return;
        const picture=document.createElement('img');picture.src=image;picture.alt='';picture.draggable=false;
        picture.style.left=-100*(value%board.size)+'%';
        picture.style.top=-100*Math.floor(value/board.size)+'%';
        picture.style.width=100*board.size+'%';
        picture.style.height=100*board.size+'%';
        button.append(picture);
      });
      overlay.querySelector('.access-status').textContent=solved(board.tiles)?'IMAGEN RECONSTRUIDA · ACCESO CONCEDIDO':'IMAGEN FRAGMENTADA · '+board.size+' × '+board.size;
    }
    overlay.addEventListener('click',event=>{
      event.stopPropagation();const button=event.target.closest('button');if(!button)return;
      if(button.hasAttribute('data-access-cancel')){overlay.remove();onCancel?.();return;}
      if(button.hasAttribute('data-access-shuffle')){board=generate(level);save(key,{board,solved:false});render();buttons[neighbors(board.tiles.indexOf(-1),board.size)[0]]?.focus();return;}
      if(!button.hasAttribute('data-picture-tile'))return;
      const index=Number(button.dataset.pictureTile),blank=board.tiles.indexOf(-1);
      if(!neighbors(blank,board.size).includes(index))return;
      board.tiles[blank]=board.tiles[index];board.tiles[index]=-1;
      const done=solved(board.tiles);save(key,{board,solved:done});render();
      if(done){buttons.forEach(tile=>tile.disabled=true);root.setTimeout(()=>{if(overlay.isConnected){overlay.remove();onSolve();}},650);}
      else buttons[index].focus();
    });
    render();buttons[neighbors(board.tiles.indexOf(-1),board.size)[0]]?.focus();return true;
  }
  function guardCode({host,key,hash,label,onSolve,onCancel}){
    if(!/^[0-9a-f]{64}$/.test(hash||''))return false;
    if(read(key)?.solved)return false;
    const overlay=createOverlay(host,label,'Código de acceso');
    overlay.innerHTML='<div class="access-panel access-code-panel"><header><small>ARCHIVO // ACCESO CIFRADO</small><h2></h2><p>Introduce el código de acceso. Las pistas pueden estar repartidas por el Archivo.</p></header><form data-access-code-form><label for="archive-access-code">CÓDIGO ENCONTRADO</label><input id="archive-access-code" name="code" type="text" maxlength="64" autocomplete="off" autocapitalize="characters" spellcheck="false" required><p class="access-status" aria-live="polite">ACCESO BLOQUEADO</p><div class="access-actions"><button type="submit">COMPROBAR CÓDIGO</button><button type="button" data-access-cancel>VOLVER</button></div></form></div>';
    overlay.querySelector('h2').textContent=label;
    overlay.addEventListener('click',event=>{event.stopPropagation();if(event.target.closest('[data-access-cancel]')){overlay.remove();onCancel?.();}});
    overlay.addEventListener('submit',async event=>{
      event.preventDefault();event.stopPropagation();const form=event.target,input=form.elements.code,status=overlay.querySelector('.access-status');
      const submit=form.querySelector('[type=submit]');submit.disabled=true;
      try{
        if(await hashCode(input.value)===hash){save(key,{solved:true});status.textContent='CÓDIGO CORRECTO · ACCESO CONCEDIDO';
          root.setTimeout(()=>{if(overlay.isConnected){overlay.remove();onSolve();}},550);
        }else{status.textContent='CÓDIGO INCORRECTO';input.select();submit.disabled=false;}
      }catch(error){status.textContent=error.message;submit.disabled=false;}
    });
    overlay.querySelector('input').focus();return true;
  }
  const api={SIZES,generate,valid,neighbors,solved,normalizeCode,hashCode,guardImage,guardCode};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ArchiveAccess=api;
})(typeof window!=='undefined'?window:globalThis);
