const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'build.js'),'utf8');
const start=source.indexOf('function mediaWithQuickEntry(');
const end=source.indexOf('function digitalFootprintMarkup(',start);
assert.ok(start>=0 && end>start,'No se encontró el lector de fichas completas.');
const context={};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);

const photo=context.mediaWithQuickEntry({
  image:'foto.png',title:'Título anterior',zoom:false,sensitive:true,
  quick_entry:'TÍTULO: Un día raro\nFECHA: 24/09/2026\nDESCRIPCIÓN: Primera línea\nSegunda línea\nALT: Persona junto a la ventana\nAMPLIAR: sí\nOCULTAR: no\nREACCIONES: 🤍 12 🗨️ 2\nCOMENTARIOS:\n@ana: Mira esto\n@luis: Respuesta a @ana\nOtra línea'
});
assert.equal(photo.image,'foto.png');
assert.equal(photo.title,'Un día raro');
assert.equal(photo.date,'24/09/2026');
assert.equal(photo.description,'Primera línea\nSegunda línea');
assert.equal(photo.alt,'Persona junto a la ventana');
assert.equal(photo.zoom,true);
assert.equal(photo.sensitive,false);
assert.equal(photo.reactions,'🤍 12 🗨️ 2');
assert.equal(photo.comments_text,'@ana: Mira esto\n@luis: Respuesta a @ana\nOtra línea');

const video=context.mediaWithQuickEntry({
  video:'clip.mp4',title:'Título anterior',date:'Fecha anterior',
  quick_entry:'TÍTULO:\nFECHA: Nueva fecha\nDESCRIPCIÓN:\nREACCIONES:\nCOMENTARIOS:'
});
assert.equal(video.title,'Título anterior');
assert.equal(video.date,'Nueva fecha');
assert.equal(video.video,'clip.mp4');
assert.equal(video.description,undefined);
console.log('Fichas completas de foto y vídeo: lectura correcta.');
