const fs = require('fs');
const path = require('path');

module.exports = function buildScanner({ root, dist, site, archiveEntries, characters, head, header, footer, esc }) {
  const configPath = path.join(root, 'content/config/escaner-interplanar.json');
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : { enabled: false };
  if (config.enabled === false) return;

  const isLocalImage = value => typeof value === 'string' && /^\/assets\/uploads\/[\w\W]+\.(?:png|jpe?g|webp|avif)$/i.test(value);
  const exists = value => isLocalImage(value) && fs.existsSync(path.join(root, value.slice(1)));
  const signalConfig = Array.isArray(config.signals) ? config.signals : [];
  const privateLayers = new Set(signalConfig.map(item => item && item.overlay).filter(Boolean));
  const folderSettings = new Set((Array.isArray(config.folder_rules) ? config.folder_rules : [])
    .filter(rule => rule && typeof rule.folder === 'string' && /^[^./][^\\]*$/.test(rule.folder) && !rule.folder.split('/').includes('..'))
    .map(rule => rule.folder.replace(/^\/+|\/+$/g, '')));
  function folderVisible(folder) {
    if (folder === 'escaner/capas' || folder.startsWith('escaner/capas/')) return false;
    return folderSettings.has(folder);
  }
  const metadata = new Map();
  function collect(node, inheritedTitle = '') {
    if (Array.isArray(node)) return node.forEach(value => collect(value, inheritedTitle));
    if (!node || typeof node !== 'object') return;
    const title = String(node.title || node.caption || node.name || inheritedTitle || '').trim();
    for (const [key, value] of Object.entries(node)) {
      if (/^image(?:_\d+)?$/.test(key) && isLocalImage(value) && title && !metadata.has(value)) metadata.set(value, title);
      else if (value && typeof value === 'object') collect(value, title);
    }
  }
  [...archiveEntries, ...characters].forEach(item => collect(item));
  const entries = new Map();
  function add(value, title) {
    // Las capas nunca aparecen como fotografías, incluso si alguien las añade
    // por error a un expediente o a additional_images.
    if (!exists(value) || privateLayers.has(value) || value.startsWith('/assets/uploads/escaner/capas/')) return;
    const segments = value.slice('/assets/uploads/'.length).split('/');
    const filename = segments.pop();
    const folder = segments.join('/');
    if (!folderVisible(folder)) return;
    if (entries.has(value)) {
      if (title) entries.get(value).title = String(title).trim();
      return;
    }
    entries.set(value, {
      image: value,
      title: String(title || metadata.get(value) || filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')).trim(),
      folder_path: folder,
      folder: folder.replaceAll('/', ' / ') || 'Archivo',
      filename
    });
  }
  function walk(directory, parts = []) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.isDirectory()) {
        const nested = [...parts, item.name];
        if (nested.join('/') === 'escaner/capas') continue;
        walk(path.join(directory, item.name), nested);
      } else if (item.isFile() && /\.(?:png|jpe?g|webp|avif)$/i.test(item.name)) {
        add('/assets/uploads/' + [...parts, item.name].join('/'));
      }
    }
  }
  const uploads = path.join(root, 'assets/uploads');
  if (fs.existsSync(uploads)) walk(uploads);
  (Array.isArray(config.additional_images) ? config.additional_images : []).forEach(item => {
    if (item && item.image) add(item.image, item.title);
  });
  const signals = new Map(signalConfig
    .filter(item => item && exists(item.image) && /^\/assets\/uploads\/escaner\/capas\/[^/]+\.png$/i.test(item.overlay || '') && exists(item.overlay))
    .map(item => [item.image, item.overlay]));
  const catalog = [...entries.values()].map(item => ({ ...item, overlay: signals.get(item.image) || '' }))
    .sort((a, b) => a.folder.localeCompare(b.folder, 'es') || a.title.localeCompare(b.title, 'es'));
  const data = JSON.stringify(catalog).replace(/</g, '\\u003c');
  const title = String(config.page_title || 'Escáner interplanar');
  const tablet = exists(config.tablet_image) ? config.tablet_image : '/assets/uploads/escaner/tableta-scrappunk-cenital.png';
  const wallpaper = exists(config.desktop_wallpaper) ? config.desktop_wallpaper : '';
  const initialView = config.browser_view === 'list' ? 'list' : 'desktop';
  const scannerHead = head(`${title} | ${site.site_title}`, config.intro || 'Escáner de fotografías del Archivo.', tablet)
    .replace('</head>', '<link rel="stylesheet" href="assets/css/scanner.css?v=4"></head>');
  const page = `${scannerHead}
<body class="scanner-page">${header('escaner')}<main class="scanner-main">
  <div class="scanner-heading"><p class="eyebrow">GRAN MERCADO // INSTRUMENTO DE LECTURA</p><h1>${esc(title)}</h1><p>${esc(config.intro || '')}</p></div>
  <div class="scanner-tablet-scroll"><section class="scanner-tablet" aria-label="Tableta de escaneo interplanar">
    <img class="scanner-tablet-art" src="${esc(tablet)}" alt="Tableta scrappunk vista desde arriba, con una amplia pantalla central" loading="eager">
    <div class="scanner-screen" data-scanner data-scanner-initial-view="${initialView}"${wallpaper ? ` style="--scanner-wallpaper:url('${encodeURI(wallpaper).replace(/'/g, '%27')}')"` : ''}>
      <header class="scanner-screen-head"><span class="scanner-live-dot" aria-hidden="true"></span><strong>ARCHIVO DE IMÁGENES</strong><span data-scanner-status>ESPERANDO SELECCIÓN</span></header>
      <div class="scanner-browser-bar"><label for="scannerSearch">BUSCAR</label><input id="scannerSearch" type="search" placeholder="Fotografía o carpeta…" autocomplete="off"><button type="button" data-scanner-view-toggle aria-label="Cambiar vista del explorador">VISTA: ESCRITORIO</button></div>
      <div class="scanner-browser" data-scanner-browser>
        <div class="scanner-desktop" data-scanner-desktop><nav class="scanner-breadcrumb" data-scanner-breadcrumb aria-label="Ruta de carpetas"></nav><div class="scanner-desktop-grid" data-scanner-desktop-grid></div></div>
        <div class="scanner-list" data-scanner-list hidden><aside class="scanner-folders" aria-label="Carpetas de imágenes"><div data-scanner-folders></div></aside><div class="scanner-files"><div class="scanner-files-head"><strong data-scanner-folder-title>FOTOGRAFÍAS</strong><span data-scanner-count></span></div><div class="scanner-grid" data-scanner-grid></div></div></div>
      </div>
      <div class="scanner-viewer" data-scanner-viewer hidden>
        <div class="scanner-viewer-head"><button type="button" data-scanner-back>← VOLVER</button><strong data-scanner-title></strong><div class="scanner-viewer-nav" aria-label="Recorrer fotografías de esta carpeta"><button type="button" data-scanner-previous aria-label="Fotografía anterior de esta carpeta" title="Fotografía anterior" disabled>‹</button><button type="button" data-scanner-next aria-label="Fotografía siguiente de esta carpeta" title="Fotografía siguiente" disabled>›</button></div><span data-scanner-file-count></span></div>
        <div class="scanner-photo-stage" data-scanner-stage><div class="scanner-photo-frame" data-scanner-frame tabindex="0" aria-label="Fotografía; mueve el puntero para explorarla con la lente">
          <img class="scanner-photo" data-scanner-photo alt=""><div class="scanner-lens" data-scanner-lens aria-hidden="true"><div class="scanner-lens-content" data-scanner-lens-content><img class="scanner-lens-photo" data-scanner-lens-photo alt=""><img class="scanner-lens-overlay" data-scanner-overlay alt="" hidden></div><i class="scanner-lens-crosshair"></i></div>
        </div></div>
        <div class="scanner-controls"><button type="button" data-scanner-toggle aria-pressed="false">ACTIVAR LENTE</button><label>DIÁMETRO <input type="range" data-scanner-size min="100" max="340" value="210"></label><label>ZOOM <input type="range" data-scanner-zoom min="100" max="250" value="100"><output data-scanner-zoom-value>100 %</output></label></div>
        <div class="scanner-notes"><label for="scannerNotes">ANOTACIONES PERSONALES <small>Guardadas solo en este navegador</small></label><textarea id="scannerNotes" data-scanner-notes rows="2" placeholder="Anota lo que has encontrado…"></textarea></div>
      </div>
    </div>
  </section></div>
  <script type="application/json" id="scannerCatalog">${data}</script>
</main>${footer(site)}<script defer src="assets/js/scanner.js?v=4"></script></body></html>`;
  fs.writeFileSync(path.join(dist, 'escaner.html'), page);
  console.log(`Escáner: ${catalog.length} imágenes y ${catalog.filter(item => item.overlay).length} señales configuradas.`);
};
