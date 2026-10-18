const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const buildScanner=require('./build-scanner');
const access=require('../assets/js/scanner-access');

const page='archivo-sucesos-prueba.html';
const circuit={page,type:'circuito',key:'informe:0:Prueba',level:'basico'};
const code={page,type:'codigo',key:'carpeta:0:0:Prueba / Cerrada',hash:'a'.repeat(64)};
const image={page,type:'imagen',key:'archivo:0:0:0:Prueba / Cerrada / Fotografía',level:'medio',image:'/assets/uploads/fotos/pista.png'};
const scannerPath='/escaner.html';
assert.equal(access.storageKey(circuit,scannerPath),'archivo-circuito-v1:/'+page+'|'+circuit.key+'|basico');
assert.equal(access.storageKey(code,scannerPath),'archivo-acceso-v1:/'+page+'|'+code.key+'|codigo|'+code.hash+'|');
assert.equal(access.storageKey(image,scannerPath),'archivo-acceso-v1:/'+page+'|'+image.key+'|imagen|medio|'+image.image);
assert.equal(access.storageKey(circuit,'/subcarpeta/escaner.html'),'archivo-circuito-v1:/subcarpeta/'+page+'|'+circuit.key+'|basico');
const values=new Map();
const storage={getItem:key=>values.get(key)||null};
const photo={access:[circuit,code,image]};
assert.equal(access.isAccessible(photo,scannerPath,storage),false);
values.set(access.storageKey(circuit,scannerPath),JSON.stringify({solved:true}));
values.set(access.storageKey(code,scannerPath),JSON.stringify({solved:true}));
assert.equal(access.isAccessible(photo,scannerPath,storage),false,'No basta desbloquear informe y carpeta');
values.set(access.storageKey(image,scannerPath),JSON.stringify({solved:true}));
assert.equal(access.isAccessible(photo,scannerPath,storage),true);
assert.equal(access.isAccessible({access:[]},scannerPath,storage),true);
assert.equal(access.isAccessible({access:[{...code,page:'../otro.html'}]},scannerPath,storage),false);

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'scanner-access-'));
try{
  fs.mkdirSync(path.join(temp,'content/config'),{recursive:true});
  fs.mkdirSync(path.join(temp,'assets/uploads/fotos'),{recursive:true});
  fs.mkdirSync(path.join(temp,'dist'),{recursive:true});
  fs.writeFileSync(path.join(temp,'assets/uploads/fotos/pista.png'),'');
  fs.writeFileSync(path.join(temp,'assets/uploads/fotos/otra.png'),'');
  fs.writeFileSync(path.join(temp,'content/config/escaner-interplanar.json'),JSON.stringify({
    enabled:true,folder_rules:[{folder:'fotos',access_from:{page,report:0,folder:0}}]
  }));
  const item={category:'SUCESO',show_digital_reports:true,digital_reports:[{
    title:'Prueba',access_method:'corriente',circuit_difficulty:'basico',folders:[{
      title:'Cerrada',access_method:'codigo',access_code:'SECRETO',files:[{
        title:'Fotografía',image:'/assets/uploads/fotos/pista.png',access_method:'imagen',circuit_difficulty:'medio'
      }]
    }]
  }]};
  const descriptor=(node,kind,key,defaultImage)=>{
    if(node.access_method==='corriente')return {type:'circuito',key:kind+':'+key,level:node.circuit_difficulty};
    if(node.access_method==='codigo')return {type:'codigo',key:kind+':'+key,hash:'a'.repeat(64)};
    if(node.access_method==='imagen')return {type:'imagen',key:kind+':'+key,level:node.circuit_difficulty,image:defaultImage};
    return null;
  };
  buildScanner({root:temp,dist:path.join(temp,'dist'),site:{site_title:'Prueba'},archiveEntries:[item],characters:[],
    head:()=>'<html><head></head>',header:()=>'',footer:()=>'',esc:value=>String(value),accessDescriptor:descriptor,
    orderedDigitalItems:items=>items||[],itemHref:()=>page});
  const html=fs.readFileSync(path.join(temp,'dist/escaner.html'),'utf8');
  const catalog=JSON.parse(html.split('id="scannerCatalog">')[1].split('</script>')[0]);
  const linked=catalog.find(entry=>entry.filename==='pista.png');
  const inherited=catalog.find(entry=>entry.filename==='otra.png');
  assert.deepEqual(linked.access.map(gate=>gate.type),['circuito','codigo','imagen']);
  assert.deepEqual(inherited.access.map(gate=>gate.type),['circuito','codigo']);
  assert.equal(access.isAccessible(linked,scannerPath,storage),true);
  assert.equal(access.isAccessible(inherited,scannerPath,{getItem:()=>null}),false);
  assert.match(html,/scanner-access\.js/);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log('Escáner: claves compartidas, herencia y desbloqueo individual OK');
