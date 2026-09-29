const fs = require('fs');
const path = require('path');

const dist = path.resolve(process.argv[2] || path.join(__dirname, '..', 'dist'));
const output = path.resolve(process.argv[3] || path.join(__dirname, '..', 'scanner-preview'));
const page = fs.readFileSync(path.join(dist, 'escaner.html'), 'utf8');
const main = page.match(/<main class="scanner-main">[\s\S]*?<\/main>/)?.[0];
const catalogText = page.match(/<script type="application\/json" id="scannerCatalog">([\s\S]*?)<\/script>/)?.[1];
const tablet = page.match(/class="scanner-tablet-art" src="([^"]+)"/)?.[1];
const wallpaper = page.match(/--scanner-wallpaper:url\('([^']+)'\)/)?.[1];
if (!main || !catalogText || !tablet) throw new Error('La página del escáner no está construida.');
const catalog = JSON.parse(catalogText);
const needed = new Set([
  tablet,
  ...(wallpaper ? [decodeURI(wallpaper)] : []),
  ...catalog.flatMap(item => [item.image, item.overlay]).filter(Boolean),
  '/assets/css/scanner.css',
  '/assets/js/scanner.js'
]);
for (const url of needed) {
  if (!/^\/assets\/[\w\W]+$/.test(url) || url.split('/').some(segment => segment === '..' || segment === '.')) throw new Error(`Ruta de medio no válida: ${url}`);
  const relative = url.slice(1).replaceAll('/', path.sep);
  const from = path.join(dist, relative);
  const to = path.join(output, relative);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}
const portableMain = main.replaceAll('/assets/', 'assets/');
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Escáner interplanar · Prueba portátil</title><link rel="stylesheet" href="assets/css/scanner.css"><style>body{margin:0;font-family:Georgia,serif}.scanner-main{padding-top:28px}.eyebrow{letter-spacing:.14em;font:11px Arial,sans-serif;color:#bba475}.scanner-heading{padding-top:4px}</style></head><body class="scanner-page">${portableMain}<script defer src="assets/js/scanner.js"></script></body></html>`;
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'Abrir escáner.html'), html);
fs.writeFileSync(path.join(output, 'LEEME.txt'), 'Abre "Abrir escáner.html" con doble clic. Esta copia sirve para probar el diseño y los controles sin publicar la web. Las anotaciones se guardan solo en ese navegador.\r\n');
console.log(`Prueba portátil: ${catalog.length} imágenes, ${needed.size} recursos.`);
