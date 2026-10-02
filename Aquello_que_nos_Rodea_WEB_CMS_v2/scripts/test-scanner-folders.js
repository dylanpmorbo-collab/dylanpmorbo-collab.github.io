const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const buildScanner = require('./build-scanner');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-folders-'));
const dist = path.join(root, 'dist');
const uploads = path.join(root, 'assets', 'uploads');
const configPath = path.join(root, 'content', 'config', 'escaner-interplanar.json');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/hL8AAAAASUVORK5CYII=', 'base64');

function image(relativePath) {
  const file = path.join(uploads, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

function catalog(folderRules, additionalImages = []) {
  fs.writeFileSync(configPath, JSON.stringify({
    enabled: true,
    folder_rules: folderRules,
    additional_images: additionalImages,
    signals: []
  }));
  buildScanner({
    root, dist, site: { site_title: 'Test' }, archiveEntries: [], characters: [],
    head: () => '<html><head></head>', header: () => '', footer: () => '', esc: value => value
  });
  const html = fs.readFileSync(path.join(dist, 'escaner.html'), 'utf8');
  return JSON.parse(html.match(/<script type="application\/json" id="scannerCatalog">([^<]*)<\/script>/)[1]);
}

try {
  fs.mkdirSync(dist);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  image('prensa/recorte.png');
  image('prensa/adjuntos/foto.png');
  image('prensa/adjuntos/detalles/primer-plano.png');
  image('nueva/sin-regla.png');
  image('escaner/capas/secreta.png');

  const oneFolder = catalog(
    [{ folder: 'prensa/adjuntos' }],
    [{ image: '/assets/uploads/prensa/adjuntos/foto.png', title: 'Adjunto' }]
  );
  assert.deepEqual(oneFolder.map(item => item.filename), ['foto.png']);

  const selectedFolders = catalog(
    [{ folder: 'prensa' }, { folder: 'prensa/adjuntos' }],
    [
      { image: '/assets/uploads/prensa/adjuntos/foto.png', title: 'Adjunto' },
      { image: '/assets/uploads/nueva/sin-regla.png', title: 'Carpeta nueva' }
    ]
  );
  assert.deepEqual(selectedFolders.map(item => item.filename).sort(), ['foto.png', 'recorte.png']);

  const selectedSubfolder = catalog([{ folder: 'prensa/adjuntos/detalles' }]);
  assert.deepEqual(selectedSubfolder.map(item => item.filename), ['primer-plano.png']);

  const noneSelected = catalog([]);
  assert.deepEqual(noneSelected, []);

  console.log('Lista de inclusión de carpetas del escáner: OK');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
