const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const puzzle=require('../assets/js/archive-access.js');

for(const [level,size] of Object.entries(puzzle.SIZES)){
  for(let attempt=0;attempt<150;attempt++){
    const board=puzzle.generate(level);
    assert.ok(puzzle.valid(board,level),`${level}: tablero inválido`);
    assert.equal(puzzle.solved(board.tiles),false,`${level}: tablero ya resuelto`);
    assert.equal(board.tiles.length,size*size);
    assert.equal(puzzle.neighbors(board.tiles.indexOf(-1),size).length>=2,true);
  }
}
assert.equal(puzzle.normalizeCode('  shura   19  '),'SHURA 19');

const source=fs.readFileSync(path.join(__dirname,'build.js'),'utf8');
const start=source.indexOf('function circuitAttributes(');
const end=source.indexOf('function archivePoliceReport(',start);
assert.ok(start>=0&&end>start);
const context={
  crypto,
  esc:value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'),
  reportImportance:()=> 'basico',
  orderedDigitalItems:items=>Array.isArray(items)?items:[],
  globalCensorship:new Map(),
  imagePath:value=>value,
  digitalFileUpdateId:()=> 'test-notification',
  plainTextToHTML:value=>String(value),
  markdownToHTML:value=>String(value)
};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
const item={show_digital_reports:true,digital_reports:[{
  title:'Informe cerrado',access_method:'imagen',circuit_difficulty:'medio',access_image:'informe.webp',
  folders:[{title:'Carpeta cerrada',access_method:'codigo',access_code:'  shura   19  ',files:[
    {title:'Foto cerrada',kind:'IMAGEN',image:'foto-secreta.webp',access_method:'imagen',circuit_difficulty:'dificil'},
    {title:'Texto antiguo',kind:'TEXTO',body:'Pista',circuit_difficulty:'basico'}
  ]}]
}]};
const html=context.archiveDigitalReports({key:'sucesos'},item).html;
assert.match(html,/data-digital-open="0"[^>]*data-access-type="imagen"[^>]*data-access-level="medio"/);
assert.match(html,/data-retro-folder="0"[^>]*data-access-type="codigo"/);
assert.match(html,/data-retro-file="0"[^>]*data-access-type="imagen"[^>]*data-access-level="dificil"/);
assert.match(html,/data-retro-file="1"[^>]*data-circuit-level="basico"/);
assert.doesNotMatch(html,/<span class="retro-file-thumb"><img src="foto-secreta.webp"/);
assert.doesNotMatch(html,/SHURA 19/);
assert.match(html,new RegExp(crypto.createHash('sha256').update('SHURA 19').digest('hex')));
assert.match(html,/assets\/js\/archive-access\.js/);
assert.match(html,/retro-recovery-pending/);
const hiddenRecoveryItem={show_digital_reports:true,digital_reports:[{title:'Informe sin recuperación',folders:[{title:'Carpeta completa',show_recovery_placeholder:false,files:[{title:'Foto',kind:'IMAGEN',image:'foto.webp'}]}]}]};
const hiddenRecoveryHtml=context.archiveDigitalReports({key:'sucesos'},hiddenRecoveryItem).html;
assert.doesNotMatch(hiddenRecoveryHtml,/retro-recovery-pending/);
assert.match(hiddenRecoveryHtml,/foto\.webp/);
assert.equal(context.accessAttributes({access_method:'ninguno',circuit_difficulty:'basico'},'archivo','test',''), '');
assert.throws(()=>context.accessAttributes({access_method:'codigo'},'archivo','sin clave',''),/Falta el código/);
const cms=fs.readFileSync(path.join(__dirname,'..','..','.pages.yml'),'utf8');
assert.equal((cms.match(/- name: show_recovery_placeholder\b/g)||[]).length,2,'Falta el control de recuperación en alguna carpeta del CMS');
for(const field of ['access_method','access_image','access_code']){
  assert.equal((cms.match(new RegExp('- name: '+field+'\\b','g'))||[]).length,6,`Falta el campo ${field} en algún informe, carpeta o archivo del CMS`);
}
puzzle.hashCode('  shura   19  ').then(hash=>{
  assert.equal(hash,crypto.createHash('sha256').update('SHURA 19').digest('hex'));
  console.log('Acceso por imagen 4×4, 6×6 y 8×8; código; compatibilidad con corriente: OK');
}).catch(error=>{console.error(error);process.exitCode=1;});

