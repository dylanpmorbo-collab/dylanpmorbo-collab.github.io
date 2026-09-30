const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('./build.js'), 'utf8');
const context = {
  esc: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  archiveDigitalReports: () => ({ count: 0, html: '' }),
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function policeInlineMarkdown('), source.indexOf('function orderedDigitalItems(')), context);
vm.runInContext(source.slice(source.indexOf('function physicalDocumentPages('), source.indexOf('function archiveInformationBlocks(')), context);

const sizeNames = ['a4', 'mini-a4', 'a5', 'a6', 'a7', 'a8'];
const colors = ['blanco', 'crema', 'amarillo', 'gris', 'verde'];
for (const size of sizeNames) for (const orientation of ['portrait', 'landscape']) for (const color of colors) {
  const html = context.archivePoliceReportV2({ show_police_report: true, police_reports: [{
    title: 'Prueba', documents: [{ title: 'Factura', body: '**Negrita** y texto', paper: color,
      paper_size: size, paper_orientation: orientation }],
  }] });
  assert(html.includes(`data-paper-size="${size}"`));
  assert(html.includes(`data-paper-orientation="${orientation}"`));
  assert(html.includes(`data-paper="${color}"`));
  assert(html.includes('<strong>Negrita</strong>'));
}
const old = context.archivePoliceReportV2({ show_police_report: true, police_reports: [{
  title: 'Antiguo', documents: [{ title: 'Hoja', body: 'Texto', paper: 'verde' }],
}] });
assert(old.includes('data-paper-size="a4"'));
assert(old.includes('data-paper-orientation="portrait"'));
assert(old.includes('data-paper="verde"'));
console.log('Tamaños, orientación, colores y Markdown: pruebas correctas');
