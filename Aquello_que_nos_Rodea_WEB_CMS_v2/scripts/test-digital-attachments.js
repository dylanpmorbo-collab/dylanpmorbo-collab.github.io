const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'build.js'),'utf8');
const start=source.indexOf('const reportImportanceLabels=');
const end=source.indexOf('function archivePoliceReport(',start);
assert.ok(start>=0 && end>start,'No se encontró el generador de informes digitales.');
const context={
  esc(value=''){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));},
  plainTextToHTML(value){return '<p>'+String(value)+'</p>';}
};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);
const report={
  show_digital_reports:true,
  digital_reports:[{title:'Prueba',folders:[{title:'Dispositivo',files:[{
    title:'Conversación',kind:'IMAGEN',image:'chat.png',video:'video-antiguo.mp4',
    attachments:[{title:'Fotografía',image:'foto.png'},{title:'Clip',video:'clip.mp4',image:'portada.png'}]
  }]}]}]
};
const html=context.archiveDigitalReports(report).html;
assert.match(html,/ARCHIVOS ADJUNTOS AL DOCUMENTO/);
assert.match(html,/video-antiguo\.mp4/);
assert.match(html,/data-retro-attachment-template="0"/);
assert.match(html,/data-retro-attachment-template="1"/);
assert.match(html,/data-retro-attachment-template="2"/);
assert.match(html,/foto\.png/);
assert.match(html,/clip\.mp4/);
console.log('Adjuntos digitales: generación y vídeo heredado correctos.');
