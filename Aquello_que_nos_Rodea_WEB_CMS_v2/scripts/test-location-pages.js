const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'aqnr-location-test-'));

try {
  for (const folder of ['assets', 'content', 'scripts']) {
    fs.cpSync(path.join(root, folder), path.join(scratch, folder), { recursive: true });
  }
  fs.copyFileSync(path.join(root, 'sobre.static.html'), path.join(scratch, 'sobre.static.html'));

  const plane = {
    title: 'Plano de prueba', slug: 'plano-de-prueba', plane_order: 6, published: true,
    summary: '', definition: '', perception: '', machinery_role: '', contact: '',
    sandbox: [
      { title: 'Solo texto', text: 'Descripción libre.' },
      { title: 'Pruebas visuales', text: 'Texto e imágenes y vídeo.', content_order: 'TEXTO_PRIMERO', media: [
        { kind: 'image', image: '/foto-1.jpg', caption: 'Primera' },
        { kind: 'video', video: '/clip.mp4', poster: '/portada.jpg' },
        { kind: 'image', image: '/foto-2.jpg', caption: 'Segunda' }
      ] }
    ]
  };
  const place = {
    title: 'Torre hundida', slug: 'torre-hundida', place_order: 1, published: true,
    panorama: '/torre-panorama.jpg', summary: 'Un lugar de prueba.',
    sandbox: [{ title: 'Hallazgos', media: [
      { kind: 'video', video: '/hallazgo.mp4' },
      { kind: 'image', image: '/hallazgo.jpg' }
    ] }]
  };
  fs.writeFileSync(path.join(scratch, 'content/planos/plano-de-prueba.json'), JSON.stringify(plane));
  fs.mkdirSync(path.join(scratch, 'content/lugares'), { recursive: true });
  fs.writeFileSync(path.join(scratch, 'content/lugares/torre-hundida.json'), JSON.stringify(place));

  const result = spawnSync(process.execPath, [path.join(scratch, 'scripts/build.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const planeHtml = fs.readFileSync(path.join(scratch, 'dist/archivo-planos-plano-de-prueba.html'), 'utf8');
  const placeHtml = fs.readFileSync(path.join(scratch, 'dist/archivo-lugares-torre-hundida.html'), 'utf8');
  const planeIndex = fs.readFileSync(path.join(scratch, 'dist/archivo-planos.html'), 'utf8');
  const placeIndex = fs.readFileSync(path.join(scratch, 'dist/archivo-lugares.html'), 'utf8');
  const richardHtml = fs.readFileSync(path.join(scratch, 'dist/archivo-sucesos-homicidio-richard-alcoy.html'), 'utf8');

  assert.match(planeHtml, /<h2>Solo texto<\/h2>/);
  assert.match(planeHtml, /<h2>Pruebas visuales<\/h2>/);
  assert.match(planeHtml, /data-sandbox-counter[^>]*>1 \/ 3</);
  assert.match(planeHtml, /<video controls playsinline/);
  assert.match(planeHtml, /<img src="\/foto-1.jpg"/);
  assert.ok(planeHtml.indexOf('Texto e imágenes y vídeo.') < planeHtml.indexOf('data-sandbox-carousel'));
  assert.doesNotMatch(planeHtml, /<div class="plane-introduction">/);
  assert.doesNotMatch(planeHtml, /<div class="plane-panel-grid">/);
  assert.doesNotMatch(planeHtml, />Sandbox</);
  const emptyPlaneCard = planeIndex.match(/<a class="archive-entry-card[^>]*href="archivo-planos-plano-de-prueba.html"[\s\S]*?<\/a>/)?.[0];
  assert.ok(emptyPlaneCard);
  assert.doesNotMatch(emptyPlaneCard, /archive-entry-card-placeholder|archive-entry-summary|EXPEDIENTE DISPONIBLE/);

  assert.match(placeHtml, /<img class="plane-hero-image" src="\/torre-panorama.jpg"/);
  assert.match(placeHtml, /← VOLVER A LOS LUGARES/);
  assert.match(placeHtml, /<h2>Hallazgos<\/h2>/);
  assert.match(placeHtml, /data-sandbox-counter[^>]*>1 \/ 2</);
  assert.doesNotMatch(placeHtml, /<div class="plane-introduction">/);
  assert.doesNotMatch(placeHtml, />Sandbox</);
  assert.match(placeIndex, /archivo-lugares-torre-hundida.html/);
  assert.ok(fs.existsSync(path.join(scratch, 'dist/archivo-planos-plano-humano.html')));
  const mapImage = /<img class="markdown-image" src="\/assets\/uploads\/archivo\/mapa-web\.webp"/g;
  assert.equal([...richardHtml.matchAll(mapImage)].length, 2, 'El mapa Markdown debe verse en el informe físico y el digital de Richard.');
  assert.match(richardHtml, /archive-police-report-text[\s\S]*?<figure class="markdown-figure"><img class="markdown-image" src="\/assets\/uploads\/archivo\/mapa-web\.webp"/);
  assert.match(richardHtml, /retro-text-document[\s\S]*?<figure class="markdown-figure"><img class="markdown-image" src="\/assets\/uploads\/archivo\/mapa-web\.webp"/);
  console.log('OK: Planos, Lugares y las imágenes Markdown de los informes físicos y digitales.');
} finally {
  if (scratch.startsWith(os.tmpdir() + path.sep) && path.basename(scratch).startsWith('aqnr-location-test-')) {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
