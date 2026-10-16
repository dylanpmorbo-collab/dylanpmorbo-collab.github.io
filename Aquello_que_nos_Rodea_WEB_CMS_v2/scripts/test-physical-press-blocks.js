const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
const markdownImages = source.slice(source.indexOf('function markdownImageHTML('), source.indexOf('function copyDir('));
const markdown = source.slice(source.indexOf('function inlineMarkdown('), source.indexOf('function plainTextToHTML('));
const helpers = source.slice(source.indexOf('function physicalPressBlocks('), source.indexOf('function galleryUpdateId('));
const renderer = source.slice(source.indexOf('function physicalPressMarkup('), source.indexOf('function digitalPressMarkup('));
const {physicalPressMarkup} = vm.runInNewContext(
  `${markdownImages}\n${markdown}\n${helpers}\n${renderer}\n({physicalPressMarkup})`,
  {
    esc: value => String(value ?? '').replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char])),
    pressUpdateId: (_section, _item, _kind, piece) => String(piece.image),
  },
);

const item = {
  show_physical_press: true,
  physical_press_title: 'PRENSA FÍSICA',
  physical_press: [{headline: 'Primer recorte', image: '/primero.png', show_translation: true, translation_text: '**Traducido**\n\n- primera línea\n- segunda línea'}],
  physical_press_blocks: [
  {title: 'DOCUMENTOS', pieces: [{headline: 'Segundo recorte', image: '/segundo.png'}]},
  ],
};
const html = physicalPressMarkup({}, item);
assert.equal((html.match(/class="archive-physical-press digital-footprint"/g) || []).length, 2);
assert.match(html, /id="prensa-fisica"/);
assert.match(html, /id="prensa-fisica-2"/);
assert.match(html, /<strong>PRENSA FÍSICA<\/strong>/);
assert.match(html, /<strong>DOCUMENTOS<\/strong>/);
assert.match(html, /Primer recorte/);
assert.match(html, /Segundo recorte/);
assert.equal((html.match(/physical-press\.js/g) || []).length, 1);
assert.equal((html.match(/class="archive-physical-press-dialog"/g) || []).length, 2);
assert.match(html, /class="archive-physical-press-translation-text"><p><strong>Traducido<\/strong><\/p>/);
assert.match(html, /<ul><li>primera línea<\/li><li>segunda línea<\/li><\/ul>/);
assert.match(html, /MOSTRAR TRADUCCIÓN/);

const legacy = physicalPressMarkup({}, {show_physical_press: true, physical_press: [{headline: 'Antiguo', image: '/antiguo.png'}]});
assert.match(legacy, /<strong>PRENSA FÍSICA<\/strong>/);
assert.match(legacy, /Antiguo/);
console.log('Bloques de recortes: dos bloques independientes y compatibilidad anterior correctos.');
