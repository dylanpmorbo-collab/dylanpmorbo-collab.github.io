const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync(require.resolve('./build.js'),'utf8');
const start=source.indexOf('function physicalDocumentPages(');
const end=source.indexOf('function archiveInformationBlocks(',start);
assert(start>=0&&end>start);
const context={
  archiveDigitalReports:()=>({count:0,html:''}),
  reportImportance:value=>value||'basico',
  esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function policeInlineMarkdown('),source.indexOf('const reportImportanceLabels=')),context);
vm.runInContext(source.slice(start,end),context);
const fixture={show_police_report:true,police_reports:[{
  title:'Expediente de prueba',type:'POLICIAL',documents:[
    {title:'Primero',paper:'blanco',letterhead:'membrete.png',body:'Un texto',image:'foto-1.png'},
    {title:'Segundo',paper:'verde',body:'Otro texto'}
  ]
}]};
const html=context.archivePoliceReportV2(fixture);
assert(html.includes('ÍNDICE DEL EXPEDIENTE'));
assert(html.includes('data-police-jump="1"'));
assert(html.includes('data-paper="verde"'));
assert(html.includes('class="archive-police-letterhead"'));
assert.strictEqual((html.match(/class="archive-police-letterhead"/g)||[]).length,1);
assert(html.includes('data-police-image-open'));
assert(!context.archivePoliceReportV2({show_police_report:false}).includes('archive-police-dialog'));
const single=context.archivePoliceReportV2({show_police_report:true,police_reports:[{title:'Solo',documents:[{title:'Hoja',body:'Texto'}]}]});
assert(!single.includes('ÍNDICE DEL EXPEDIENTE'));
const long=context.archivePoliceReportV2({show_police_report:true,police_reports:[{title:'Expediente largo',documents:[{
  title:'Diligencias preliminares',body:'Texto '.repeat(400),image:'foto-1.png',image_2:'foto-2.png'
}]}]});
assert.strictEqual((long.match(/class="archive-police-report-heading">Diligencias preliminares<\/div>/g)||[]).length,1);
assert(!long.includes('Diligencias preliminares<small> · CONTINUACIÓN'));
assert(long.includes('class="archive-police-report-heading">ANEXO FOTOGRÁFICO</div>'));
assert(!long.includes('Diligencias preliminares · ANEXO FOTOGRÁFICO'));
console.log('Expedientes físicos: pruebas correctas');
