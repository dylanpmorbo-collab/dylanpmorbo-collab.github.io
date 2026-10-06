const fs = require('fs');
const path = require('path');

function imagePath(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim(), 'https://archivo.local/');
    if (url.origin !== 'https://archivo.local') return '';
    return decodeURIComponent(url.pathname).replace(/\/+/g, '/');
  } catch (_) {
    return '';
  }
}

function loadPhotoCensorship(root) {
  const filename = path.join(root, 'content', 'config', 'censura-fotos.json');
  const config = JSON.parse(fs.readFileSync(filename, 'utf8'));
  const entries = new Map();
  for (const row of (Array.isArray(config.photos) ? config.photos : [])) {
    if (!row || !row.image || !['pixelado', 'falso'].includes(row.mode)) continue;
    const key = imagePath(row.image);
    if (!key) continue;
    if (row.mode === 'falso' && !imagePath(row.fake_pixel_image)) {
      throw new Error('La foto con falso pixelado necesita una imagen sustituta: ' + row.image);
    }
    if (entries.has(key)) throw new Error('Foto repetida en censura global: ' + row.image);
    entries.set(key, {
      mode: row.mode,
      fake: row.mode === 'falso' ? row.fake_pixel_image : ''
    });
  }
  return entries;
}

function escapeAttr(value) {
  return String(value).replace(/[&"<>]/g, char => ({
    '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'
  }[char]));
}

function walkHtml(folder, callback) {
  for (const item of fs.readdirSync(folder, {withFileTypes: true})) {
    const filename = path.join(folder, item.name);
    if (item.isDirectory()) walkHtml(filename, callback);
    else if (item.name.endsWith('.html')) callback(filename);
  }
}

function buildPhotoCensorship({root, dist, entries}) {
  const data = Object.fromEntries(entries);
  fs.writeFileSync(
    path.join(dist, 'assets', 'js', 'photo-censorship-data.js'),
    'window.AQNR_PHOTO_CENSORSHIP = ' + JSON.stringify(data).replace(/</g, '\\u003c') + ';\n'
  );
  const head = '<link rel="stylesheet" href="/assets/css/photo-censorship.css?v=visor-fotos-20261006">' +
    '<script src="/assets/js/photo-censorship-data.js?v=1"></script>' +
    '<script defer src="/assets/js/photo-censorship.js?v=visor-fotos-20261006"></script>';
  let pageCount = 0;
  walkHtml(dist, filename => {
    let html = fs.readFileSync(filename, 'utf8');
    html = html.replace(/<img\b[^>]*>/gi, tag => {
      const source = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
      if (!source) return tag;
      const original = tag.match(/\bdata-original\s*=\s*(["'])(.*?)\1/i);
      const key = imagePath(original ? original[2] : source[2]);
      const rule = entries.get(key);
      if (!rule || /\bdata-retro-image\b/i.test(tag) || /\bdata-global-mode\b/i.test(tag)) return tag;
      const originalSrc = original ? original[2] : source[2];
      let result = tag.replace(/\s+srcset\s*=\s*(["']).*?\1/gi, '');
      if (rule.mode === 'falso') {
        result = result.replace(/\bsrc\s*=\s*(["']).*?\1/i, 'src="' + escapeAttr(rule.fake) + '"');
      }
      return result.replace(/\s*\/?>$/, match =>
        ' data-global-mode="' + rule.mode + '" data-global-original="' +
        escapeAttr(originalSrc) + '" data-global-key="' + escapeAttr(key) + '"' +
        (rule.mode === 'falso' ? ' data-global-fake="' + escapeAttr(rule.fake) + '"' : '') +
        match);
    });
    if (html.includes('</head>')) {
      html = html.replace('</head>', head + '</head>');
      fs.writeFileSync(filename, html);
      pageCount += 1;
    }
  });
  console.log('Censura global: ' + entries.size + ' fotos configuradas en ' + pageCount + ' páginas.');
}

module.exports = {imagePath, loadPhotoCensorship, buildPhotoCensorship};
