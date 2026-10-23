const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const buildScanner = require('./build-scanner');
const scannerFolders = require('../assets/js/scanner-folders');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-folders-'));
const dist = path.join(root, 'dist');
const uploads = path.join(root, 'assets', 'uploads');
const configPath = path.join(root, 'content', 'config', 'escaner-interplanar.json');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/hL8AAAAASUVORK5CYII=', 'base64');
let builtHtml = '';

function image(relativePath) {
  const file = path.join(uploads, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

function catalog(folderRules, additionalImages = [], secretFolderRules = []) {
  fs.writeFileSync(configPath, JSON.stringify({
    enabled: true,
    folder_rules: folderRules,
    secret_folder_rules: secretFolderRules,
    additional_images: additionalImages,
    signals: []
  }));
  buildScanner({
    root, dist, site: { site_title: 'Test' }, archiveEntries: [], characters: [],
    head: () => '<html><head></head>', header: () => '', footer: () => '', esc: value => value
  });
  builtHtml = fs.readFileSync(path.join(dist, 'escaner.html'), 'utf8');
  return JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerCatalog">([^<]*)<\/script>/)[1]);
}

try {
  fs.mkdirSync(dist);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  image('prensa/recorte.png');
  image('prensa/adjuntos/foto.png');
  image('prensa/adjuntos/detalles/primer-plano.png');
  image('nueva/sin-regla.png');
  image('escaner/capas/secreta.png');
  image('escaner/icono.png');
  image('escaner/icono.webp');

  const oneFolder = catalog(
    [{ folder: 'prensa/adjuntos' }],
    [{ image: '/assets/uploads/prensa/adjuntos/foto.png', title: 'Adjunto' }]
  );
  assert.deepEqual(oneFolder.map(item => item.filename), ['foto.png']);

  const selectedFolders = catalog(
    [{ folder: 'prensa', label: 'Hemeroteca', icon_color: '#4B8DC7' },
      { folder: 'prensa/adjuntos', label: 'Pruebas', icon_color: '#9B4D9E', icon_image: '/assets/uploads/escaner/icono.png' }],
    [
      { image: '/assets/uploads/prensa/adjuntos/foto.png', title: 'Adjunto' },
      { image: '/assets/uploads/nueva/sin-regla.png', title: 'Carpeta nueva' }
    ]
  );
  assert.deepEqual(selectedFolders.map(item => item.filename).sort(), ['foto.png', 'recorte.png']);
  const labels = JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerFolderLabels">([^<]*)<\/script>/)[1]);
  assert.deepEqual(labels, { prensa: 'Hemeroteca', 'prensa/adjuntos': 'Pruebas' });
  const icons = JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerFolderIcons">([^<]*)<\/script>/)[1]);
  assert.deepEqual(icons, {
    prensa: { color: '#4B8DC7' },
    'prensa/adjuntos': { color: '#9B4D9E', image: '/assets/uploads/escaner/icono.png' }
  });
  catalog([{ folder: 'prensa', icon_image: '/assets/uploads/escaner/icono.webp' }]);
  assert.deepEqual(JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerFolderIcons">([^<]*)<\/script>/)[1]), {
    prensa: { image: '/assets/uploads/escaner/icono.webp' }
  });
  assert.equal(scannerFolders.displayPath('prensa/adjuntos', labels), 'Hemeroteca / Pruebas');
  assert.equal(selectedFolders.find(item => item.filename === 'foto.png').image,
    '/assets/uploads/prensa/adjuntos/foto.png');

  const selectedSubfolder = catalog([{ folder: 'prensa/adjuntos/detalles' }]);
  assert.deepEqual(selectedSubfolder.map(item => item.filename), ['primer-plano.png']);

  const noneSelected = catalog([]);
  assert.deepEqual(noneSelected, []);

  const secret = catalog(
    [{ folder: 'prensa' }], [],
    [{ folder: 'prensa/adjuntos' }, { folder: 'prensa/adjuntos/detalles' }]
  );
  assert.deepEqual(secret.map(item => item.filename).sort(), ['foto.png', 'primer-plano.png', 'recorte.png']);
  assert.deepEqual(secret.find(item => item.filename === 'recorte.png').secret_folders, []);
  assert.deepEqual(secret.find(item => item.filename === 'foto.png').secret_folders, ['prensa/adjuntos']);
  assert.deepEqual(secret.find(item => item.filename === 'primer-plano.png').secret_folders,
    ['prensa/adjuntos', 'prensa/adjuntos/detalles']);
  assert.deepEqual(scannerFolders.secretPaths(secret), ['prensa/adjuntos', 'prensa/adjuntos/detalles']);
  const revealed = new Set(['prensa/adjuntos', 'prensa/adjuntos/detalles']);
  const visited = new Set();
  assert.equal(scannerFolders.hasUnvisitedSecret('prensa', revealed, visited), true);
  assert.equal(scannerFolders.hasUnvisitedSecret('prensa/adjuntos', revealed, visited), true);
  assert.equal(scannerFolders.hasUnvisitedSecret('nueva', revealed, visited), false);
  visited.add('prensa/adjuntos');
  assert.equal(scannerFolders.hasUnvisitedSecret('prensa/adjuntos', revealed, visited), true);
  visited.add('prensa/adjuntos/detalles');
  assert.equal(scannerFolders.hasUnvisitedSecret('prensa', revealed, visited), false);
  assert.deepEqual(scannerFolders.matchingSecrets(secret, 'adjunto'), []);
  assert.deepEqual(scannerFolders.matchingSecrets(secret, ' ADJUNTOS '), ['prensa/adjuntos']);
  assert.deepEqual(scannerFolders.matchingSecrets(secret, 'PRUEBAS', { 'prensa/adjuntos': 'Pruebas' }), ['prensa/adjuntos']);
  assert.deepEqual(scannerFolders.matchingSecrets(secret, 'ADJUNTOS', { 'prensa/adjuntos': 'Pruebas' }), []);
  assert.deepEqual(scannerFolders.matchingSecrets(secret, 'foto.png'), []);
  assert.deepEqual(scannerFolders.visibleItems(secret, new Set()).map(item => item.filename), ['recorte.png']);
  assert.equal(scannerFolders.hasVisibleContents(secret, 'prensa/adjuntos', new Set()), false);
  assert.equal(scannerFolders.hasVisibleContents(secret, 'prensa', new Set()), true);
  assert.deepEqual(scannerFolders.visibleItems(secret, new Set(['prensa/adjuntos'])).map(item => item.filename).sort(),
    ['foto.png', 'recorte.png']);
  assert.equal(scannerFolders.hasVisibleContents(secret, 'prensa/adjuntos/detalles', new Set(['prensa/adjuntos'])), false);
  assert.equal(scannerFolders.hasVisibleContents(secret, 'prensa/adjuntos/detalles',
    new Set(['prensa/adjuntos', 'prensa/adjuntos/detalles'])), true);

  const onlySecret = catalog([], [], [{ folder: 'prensa/adjuntos' }]);
  assert.deepEqual(onlySecret.map(item => item.filename), ['foto.png']);
  assert.equal(scannerFolders.hasVisibleContents(onlySecret, 'prensa', new Set()), false);
  assert.deepEqual(scannerFolders.matchingSecrets(onlySecret, 'adjuntos'), ['prensa/adjuntos']);

  catalog([{ folder: 'prensa', icon_color: 'red', icon_image: 'https://example.com/icono.png' }]);
  assert.deepEqual(JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerFolderIcons">([^<]*)<\/script>/)[1]), {});

  const codedSecret = catalog([], [], [{ folder: 'prensa/adjuntos', code: ' CLAVE-7 ' }]);
  assert.deepEqual(scannerFolders.matchingSecrets(codedSecret, 'adjuntos'), ['prensa/adjuntos']);
  const codes = JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerSecretCodes">([^<]*)<\/script>/)[1]);
  assert.deepEqual(codes, {
    'prensa/adjuntos': createHash('sha256').update('CLAVE-7').digest('hex')
  });
  assert.equal(builtHtml.includes('CLAVE-7'), false);
  assert.equal(builtHtml.includes('data-scanner-secret-lock'), true);
  catalog([], [], [{ folder: 'prensa/adjuntos' }]);
  assert.deepEqual(JSON.parse(builtHtml.match(/<script type="application\/json" id="scannerSecretCodes">([^<]*)<\/script>/)[1]), {});

  console.log('Carpetas visibles y secretas del escáner: OK');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
