const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const {prepareSecretFichas} = require('./secret-fichas');
const folder = 'carpeta/oculta';
const target = 'archivo-entidades-prueba.html';
const valid = new Set([target]);
const folders = new Set([folder]);

const [coded] = prepareSecretFichas({secret_fiches:[{
  target, scanner_folder:folder, code:' CLAVE ', icon_label:'Acceso',
  dialog_title:'Entrada reservada', dialog_accent:'#aabbcc'
}]},valid,folders);
assert.equal(coded.target,target);
assert.equal(coded.folder,folder);
assert.equal(coded.accessType,'code');
assert.equal(coded.codeHash,createHash('sha256').update('CLAVE').digest('hex'));
assert.equal(coded.icon.label,'Acceso');
assert.equal(coded.dialog.title,'Entrada reservada');
assert.equal(coded.dialog.accent,'#aabbcc');
assert.equal(JSON.stringify(coded).includes('CLAVE'),false);

const [linkOnly] = prepareSecretFichas({secret_fiches:[{target}]},valid,folders);
assert.equal(linkOnly.folder,'');
assert.equal(linkOnly.accessType,'none');
assert.equal(linkOnly.codeHash,'');

assert.throws(()=>prepareSecretFichas({secret_fiches:[{target:'archivo-falso.html'}]},valid,folders),/inexistente/);
assert.throws(()=>prepareSecretFichas({secret_fiches:[{target,scanner_folder:'otra'}]},valid,folders),/carpeta secreta/);
assert.throws(()=>prepareSecretFichas({secret_fiches:[{target,access_type:'code'}]},valid,folders),/Falta el código/);
assert.throws(()=>prepareSecretFichas({secret_fiches:[{target},{target}]},valid,folders),/repetida/);
console.log('Fichas secretas: pruebas correctas.');
