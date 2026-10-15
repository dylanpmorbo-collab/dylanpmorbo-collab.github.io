const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const puzzle=require('../assets/js/circuit-puzzle.js');
const puzzleSource=fs.readFileSync(path.join(__dirname,'..','assets','js','circuit-puzzle.js'),'utf8');
assert.match(puzzleSource,/circuit-terminal-a'\)\.style\.gridRow=String\(board\.start\+1\)/);
assert.match(puzzleSource,/circuit-terminal-b'\)\.style\.gridRow=String\(board\.end\+1\)/);
assert.match(puzzleSource,/button\.classList\.toggle\('is-entry'/);
assert.match(puzzleSource,/button\.classList\.toggle\('is-exit'/);
for(const [level,size] of Object.entries(puzzle.SIZES)){
  for(let attempt=0;attempt<300;attempt++){
    const board=puzzle.generate(level);
    assert.ok(puzzle.valid(board,size),`${level}: invalid board`);
    assert.equal(puzzle.trace(board).solved,false,`${level}: already solved`);
    board.tiles.forEach(tile=>{if(!tile.fixed)tile.rotation=0;});
    assert.equal(puzzle.trace(board).solved,true,`${level}: no solution`);
  }
}

const source=fs.readFileSync(path.join(__dirname,'build.js'),'utf8');
const start=source.indexOf('function circuitAttributes(');
const end=source.indexOf('function archivePoliceReport(',start);
assert.ok(start>=0&&end>start);
const context={
  esc:value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),
  reportImportance:()=> 'basico',
  orderedDigitalItems:items=>Array.isArray(items)?items:[],
  globalCensorship:new Map(),
  imagePath:value=>value,
  digitalFileUpdateId:()=> 'test-notification',
  plainTextToHTML:value=>String(value),
  markdownToHTML:value=>String(value)
};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);
const item={show_digital_reports:true,digital_reports:[{
  title:'Informe de prueba',circuit_difficulty:'basico',
  folders:[{title:'Carpeta de prueba',circuit_difficulty:'medio',files:[{
    title:'Foto de prueba',kind:'IMAGEN',image:'foto-secreta.webp',circuit_difficulty:'dificil'
  }]}]
}]};
const html=context.archiveDigitalReports({key:'sucesos'},item).html;
assert.match(html,/data-digital-open="0"[^>]*data-circuit-level="basico"/);
assert.match(html,/data-retro-folder="0"[^>]*data-circuit-level="medio"/);
assert.match(html,/data-retro-file="0"[^>]*data-circuit-level="dificil"/);
assert.doesNotMatch(html,/<span class="retro-file-thumb"><img src="foto-secreta.webp"/);
assert.match(html,/assets\/js\/circuit-puzzle\.js/);
console.log('Circuitos 4×4, 6×6 y 8×8; informe, carpeta y archivo: OK');

