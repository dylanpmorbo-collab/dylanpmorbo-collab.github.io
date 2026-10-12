(function(root){
  'use strict';
  const DIRECTIONS=['N','E','S','W'];
  const OPPOSITE={N:'S',E:'W',S:'N',W:'E'};
  const DELTA={N:[-1,0],E:[0,1],S:[1,0],W:[0,-1]};
  const SIZES={basico:4,medio:6,dificil:8};
  const fallback=new Map();
  const randomInt=max=>Math.floor(Math.random()*max);
  const storageKey=key=>'archivo-circuito-v1:'+key;
  function read(key){
    try{
      const value=root.localStorage.getItem(storageKey(key));
      return value===null?(fallback.get(key)||null):JSON.parse(value);
    }
    catch{return fallback.get(key)||null;}
  }
  function save(key,value){
    fallback.set(key,value);
    try{root.localStorage.setItem(storageKey(key),JSON.stringify(value));}catch{}
  }
  function turn(direction,rotation){return DIRECTIONS[(DIRECTIONS.indexOf(direction)+rotation)%4];}
  function ports(tile){return tile.base.map(direction=>turn(direction,tile.rotation));}
  function generate(level){
    const size=SIZES[level]||4;
    const paths=new Map();
    const add=(row,col,direction)=>{
      const index=row*size+col;
      if(!paths.has(index))paths.set(index,new Set());
      paths.get(index).add(direction);
    };
    let row=randomInt(size);
    const start=row;
    add(row,0,'W');
    for(let col=0;col<size;col++){
      if(col){add(row,col,'W');}
      if(col===size-1){add(row,col,'E');break;}
      const next=Math.max(0,Math.min(size-1,row+randomInt(3)-1));
      if(next!==row){
        const step=next>row?1:-1;
        while(row!==next){
          add(row,col,step>0?'S':'N');
          row+=step;
          add(row,col,step>0?'N':'S');
        }
      }
      add(row,col,'E');
    }
    const end=row;
    const tiles=Array.from({length:size*size},(_,index)=>{
      const onPath=paths.has(index);
      const fixed=index!==start*size && (onPath?Math.random()<.3:Math.random()<.55);
      return {
        base:onPath?Array.from(paths.get(index)):randomInt(3)===0?['N','S']:['N','E'],
        rotation:fixed&&onPath?0:randomInt(4),fixed
      };
    });
    const board={size,start,end,tiles};
    for(let attempts=0;attempts<40 && trace(board).solved;attempts++){
      for(let index=0;index<tiles.length;index++)if(!tiles[index].fixed)tiles[index].rotation=randomInt(4);
    }
    if(trace(board).solved){
      const first=tiles[start*size];
      first.rotation=[0,1,2,3].find(rotation=>!first.base.map(direction=>turn(direction,rotation)).includes('W'));
    }
    return board;
  }
  function valid(board,size){
    return !!board && board.size===size && Number.isInteger(board.start) && board.start>=0 && board.start<size &&
      Number.isInteger(board.end) && board.end>=0 && board.end<size && Array.isArray(board.tiles) &&
      board.tiles.length===size*size && board.tiles.every(tile=>Array.isArray(tile.base) && tile.base.length===2 &&
        tile.base.every(direction=>DIRECTIONS.includes(direction)) && Number.isInteger(tile.rotation) && tile.rotation>=0 && tile.rotation<4);
  }
  function trace(board){
    const {size,tiles,start,end}=board;
    const energized=new Set();
    const first=start*size;
    if(!ports(tiles[first]).includes('W'))return {solved:false,energized};
    const queue=[first];
    energized.add(first);
    let solved=false;
    for(let i=0;i<queue.length;i++){
      const index=queue[i],row=Math.floor(index/size),col=index%size;
      for(const direction of ports(tiles[index])){
        if(index===end*size+size-1 && direction==='E')solved=true;
        const [dr,dc]=DELTA[direction],nextRow=row+dr,nextCol=col+dc;
        if(nextRow<0||nextRow>=size||nextCol<0||nextCol>=size)continue;
        const next=nextRow*size+nextCol;
        if(!energized.has(next) && ports(tiles[next]).includes(OPPOSITE[direction])){
          energized.add(next);queue.push(next);
        }
      }
    }
    return {solved,energized};
  }
  function tileSVG(tile){
    const lines=ports(tile).map(direction=>{
      const end={N:[50,3],E:[97,50],S:[50,97],W:[3,50]}[direction];
      return '<line x1="50" y1="50" x2="'+end[0]+'" y2="'+end[1]+'"/>';
    }).join('');
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><g>'+lines+'<circle cx="50" cy="50" r="8"/></g></svg>';
  }
  function guard({host,key,level,label,onSolve,onCancel}){
    if(!SIZES[level])return false;
    const saved=read(key);
    if(saved?.solved)return false;
    host.querySelector('[data-circuit-overlay]')?.remove();
    let board=valid(saved?.board,SIZES[level])?saved.board:generate(level);
    save(key,{board,solved:false});
    const overlay=document.createElement('section');
    overlay.className='circuit-overlay';
    overlay.dataset.circuitOverlay='';
    overlay.setAttribute('aria-label','Desencriptar '+label);
    overlay.innerHTML='<div class="circuit-panel"><header><small>ARCHIVO // ACCESO CIFRADO</small><h2></h2><p>Gira las piezas móviles para conducir la corriente desde A hasta B. Los módulos remachados son fijos.</p><div class="circuit-legend"><span><b>A</b> ENTRADA · lado izquierdo</span><span><b>B</b> SALIDA · lado derecho</span></div></header><div class="circuit-play"><div class="circuit-rail"><span class="circuit-terminal circuit-terminal-a" aria-label="Entrada A">A <b aria-hidden="true">▶</b></span></div><div class="circuit-board" role="group" aria-label="Circuito giratorio"></div><div class="circuit-rail"><span class="circuit-terminal circuit-terminal-b" aria-label="Salida B"><b aria-hidden="true">▶</b> B</span></div></div><p class="circuit-status" aria-live="polite"></p><div class="circuit-actions"><button type="button" data-circuit-reset>OTRO CIRCUITO</button><button type="button" data-circuit-cancel>VOLVER</button></div></div>';
    overlay.querySelector('h2').textContent=label;
    const grid=overlay.querySelector('.circuit-board');
    grid.style.setProperty('--circuit-size',String(board.size));
    const buttons=[];
    board.tiles.forEach((tile,index)=>{
      const button=document.createElement('button');
      button.type='button';button.className='circuit-tile';
      button.setAttribute('aria-label','Fila '+(Math.floor(index/board.size)+1)+', columna '+(index%board.size+1)+(tile.fixed?'. Pieza fija.':'. Girar pieza.'));
      button.dataset.circuitTile=String(index);
      button.disabled=!!tile.fixed;
      button.classList.toggle('is-fixed',!!tile.fixed);
      grid.append(button);buttons.push(button);
    });
    function render(){
      const state=trace(board);
      overlay.querySelector('.circuit-play').style.setProperty('--circuit-size',String(board.size));
      overlay.querySelector('.circuit-terminal-a').style.gridRow=String(board.start+1);
      overlay.querySelector('.circuit-terminal-b').style.gridRow=String(board.end+1);
      buttons.forEach((button,index)=>{
        button.innerHTML=tileSVG(board.tiles[index]);
        button.disabled=!!board.tiles[index].fixed;
        button.classList.toggle('is-fixed',!!board.tiles[index].fixed);
        button.setAttribute('aria-label','Fila '+(Math.floor(index/board.size)+1)+', columna '+(index%board.size+1)+(board.tiles[index].fixed?'. Pieza fija.':'. Girar pieza.'));
        button.classList.toggle('is-powered',state.energized.has(index));
        button.classList.toggle('is-entry',index===board.start*board.size);
        button.classList.toggle('is-exit',index===board.end*board.size+board.size-1);
      });
      overlay.querySelector('.circuit-terminal-b').classList.toggle('is-powered',state.solved);
      overlay.querySelector('.circuit-status').textContent=state.solved?'CONEXIÓN RESTABLECIDA · ACCESO CONCEDIDO':'CONEXIÓN INTERRUMPIDA';
      return state.solved;
    }
    overlay.addEventListener('click',event=>{
      event.stopPropagation();
      const button=event.target.closest('button');
      if(!button)return;
      if(button.hasAttribute('data-circuit-cancel')){overlay.remove();onCancel?.();return;}
      if(button.hasAttribute('data-circuit-reset')){
        board=generate(level);save(key,{board,solved:false});render();buttons[board.start*board.size]?.focus();return;
      }
      if(!button.hasAttribute('data-circuit-tile'))return;
      board.tiles[Number(button.dataset.circuitTile)].rotation=(board.tiles[Number(button.dataset.circuitTile)].rotation+1)%4;
      save(key,{board,solved:false});
      if(render()){
        buttons.forEach(tile=>tile.disabled=true);
        save(key,{board,solved:true});
        root.setTimeout(()=>{if(overlay.isConnected){overlay.remove();onSolve();}},650);
      }
    });
    host.append(overlay);render();buttons[board.start*board.size]?.focus();
    return true;
  }
  const api={generate,trace,valid,guard,SIZES};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  root.ArchiveCircuitPuzzle=api;
})(typeof window!=='undefined'?window:globalThis);

