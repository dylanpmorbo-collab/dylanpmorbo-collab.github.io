const assert=require('assert');
const fs=require('fs');
const vm=require('vm');

const source=fs.readFileSync(require.resolve('./build.js'),'utf8');
const context={esc:value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function policeInlineMarkdown('),source.indexOf('const reportImportanceLabels=')),context);
vm.runInContext(source.slice(source.indexOf('function physicalDocumentPages('),source.indexOf('function archivePoliceReportV2(')),context);

const markdown='| **Indicio** | Procedencia | Observación |\n| :--- | --- | ---: |\n| IND-01 | muro | **positivo** |\n| IND-02 | suelo | <pendiente> |';
const html=context.policeMarkdownToHTML(markdown);
assert(html.includes('<table><thead><tr>'));
assert(html.includes('<th style="text-align:left"><strong>Indicio</strong></th>'));
assert(html.includes('<th style="text-align:right">Observación</th>'));
assert(html.includes('<td style="text-align:right">&lt;pendiente&gt;</td>'));
assert(!html.includes('<p>|'));
assert(context.policeMarkdownToHTML('Antes\n\n'+markdown+'\n\nDespués').includes('</table>\n<p>Después</p>'));
assert(context.policeMarkdownToHTML('A | B\n--- | ---\nuno | dos').includes('<table>'));

const longTable='| Código | Nota |\n| --- | --- |\n'+Array.from({length:100},(_,i)=>'| '+i+' | Dato '+i+' |').join('\n');
const pages=context.physicalDocumentPages(longTable,false);
assert(pages.length>1);
assert(pages.every(page=>page.startsWith('| Código | Nota |\n| --- | --- |')));
assert.strictEqual((pages.join('\n').match(/\| 99 \| Dato 99 \|/g)||[]).length,1);
const withSpacing='Texto anterior.\n\n**CRONOLOGÍA RESUMIDA**\n\n&nbsp;\n\n'+markdown+'\n\nTexto posterior.';
const spacedPages=context.physicalDocumentPages(withSpacing,false);
assert.strictEqual(spacedPages.length,3);
assert.strictEqual(spacedPages[0],'Texto anterior.');
assert(spacedPages[1].startsWith('**CRONOLOGÍA RESUMIDA**\n\n| **Indicio**'));
assert(!spacedPages.join('\n').includes('&nbsp;'));
assert(!context.policeMarkdownToHTML('&nbsp;').includes('nbsp'));
console.log('Markdown de informes físicos: tablas correctas');
