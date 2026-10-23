const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

module.exports = function buildScanner({ root, dist, site, archiveEntries, characters, head, header, footer, esc, accessDescriptor, orderedDigitalItems, itemHref, secretFichas = [] }) {
  const configPath = path.join(root, 'content/config/escaner-interplanar.json');
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : { enabled: false };
  if (config.enabled === false) return;

  const isLocalImage = value => typeof value === 'string' && /^\/assets\/uploads\/[\w\W]+\.(?:png|jpe?g|webp|avif)$/i.test(value);
  const exists = value => isLocalImage(value) && fs.existsSync(path.join(root, value.slice(1)));
  const signalConfig = Array.isArray(config.signals) ? config.signals : [];
  const privateLayers = new Set(signalConfig.map(item => item && item.overlay).filter(Boolean));
  const validRule = rule => rule && typeof rule.folder === 'string' && /^[^./][^\\]*$/.test(rule.folder) && !rule.folder.split('/').includes('..');
  const folderSettings = new Map((Array.isArray(config.folder_rules) ? config.folder_rules : [])
    .filter(validRule)
    .map(rule => [rule.folder.replace(/^\/+|\/+$/g, ''), rule]));
  (Array.isArray(config.secret_folder_rules) ? config.secret_folder_rules : [])
    .filter(validRule)
    .forEach(rule => {
      const folder = rule.folder.replace(/^\/+|\/+$/g, '');
      folderSettings.set(folder, { ...folderSettings.get(folder), ...rule, secret: true });
    });
  const folderLabels = Object.fromEntries([...folderSettings]
    .filter(([, rule]) => typeof rule.label === 'string' && rule.label.trim())
    .map(([folder, rule]) => [folder, rule.label.trim()]));
  const folderIcons = Object.fromEntries([...folderSettings]
    .map(([folder, rule]) => {
      const color = String(rule.icon_color || '').trim();
      const image = String(rule.icon_image || '').trim();
      return [folder, {
        ...( /^#[0-9a-fA-F]{6}$/.test(color) ? { color } : {} ),
        ...( /^\/assets\/uploads\/[^?#]+\.png$/i.test(image) && exists(image) ? { image } : {} )
      }];
    })
    .filter(([, icon]) => Object.keys(icon).length));
  const secretCodes = Object.fromEntries([...folderSettings]
    .filter(([, rule]) => rule.secret && String(rule.code ?? '').trim())
    .map(([folder, rule]) => [folder, createHash('sha256').update(String(rule.code).trim()).digest('hex')]));
  function folderVisible(folder) {
    if (folder === 'escaner/capas' || folder.startsWith('escaner/capas/')) return false;
    return folderSettings.has(folder);
  }
  function secretAncestors(folder) {
    const parts = folder.split('/');
    return parts.map((_, index) => parts.slice(0, index + 1).join('/'))
      .filter(path => folderSettings.get(path)?.secret === true);
  }
  const imageAccess = new Map();
  const accessSources = new Map();
  const categoryKeys = {
    'ENTIDAD':'entidades','ORGANIZACIÓN':'organizaciones','DOCUMENTO':'documentos',
    'SUCESO':'sucesos','TESTIMONIO':'testimonios','LUGAR':'lugares','PLANO':'planos'
  };
  function addAccess(image, page, gates) {
    if (!isLocalImage(image) || !gates.length) return;
    const existing = imageAccess.get(image) || [];
    for (const gate of gates) {
      const scoped = { ...gate, page };
      if (!existing.some(value => JSON.stringify(value) === JSON.stringify(scoped))) existing.push(scoped);
    }
    imageAccess.set(image, existing);
  }
  function collectDigitalAccess(item, sectionKey) {
    if (item.show_digital_reports !== true) return;
    const section = { key: sectionKey };
    const page = itemHref(section, item);
    const reports = (Array.isArray(item.digital_reports) ? item.digital_reports : [])
      .filter(report => report && (report.title || report.folders?.length)).slice(0, 30);
    reports.forEach((report, reportIndex) => {
      const title = String(report.title || ('INFORME DIGITAL ' + String(reportIndex + 1).padStart(2, '0')));
      const reportGate = accessDescriptor(report, 'informe', reportIndex + ':' + title, report.label_image);
      const reportGates = reportGate ? [reportGate] : [];
      accessSources.set(page + '|'+ reportIndex, reportGates);
      addAccess(report.label_image, page, reportGates);
      const folders = orderedDigitalItems(report.folders).filter(folder => folder.title || folder.files?.length).slice(0, 40);
      folders.forEach((folder, folderIndex) => {
        const name = String(folder.title || ('CARPETA ' + String(folderIndex + 1).padStart(2, '0')));
        const folderGate = accessDescriptor(folder, 'carpeta', reportIndex + ':' + folderIndex + ':' + String(report.title || '') + ' / ' + name, folder.icon);
        const folderGates = folderGate ? [...reportGates, folderGate] : reportGates;
        accessSources.set(page + '|' + reportIndex + '|' + folderIndex, folderGates);
        addAccess(folder.icon, page, folderGates);
        const files = orderedDigitalItems(folder.files)
          .filter(file => file.image || file.video || file.annotated_image || String(file.kind || '').toUpperCase() === 'TEXTO').slice(0, 100);
        files.forEach((file, fileIndex) => {
          const fileTitle = String(file.title || ('ARCHIVO ' + String(fileIndex + 1).padStart(2, '0')));
          const fileGate = accessDescriptor(file, 'archivo', reportIndex + ':' + folderIndex + ':' + fileIndex + ':' + String(report.title || '') + ' / ' + String(folder.title || '') + ' / ' + fileTitle, file.image || file.poster);
          const gates = fileGate ? [...folderGates, fileGate] : folderGates;
          accessSources.set(page + '|' + reportIndex + '|' + folderIndex + '|' + fileIndex, gates);
          for (const image of [file.image, file.annotated_image, file.poster, file.fake_pixel_image]) addAccess(image, page, gates);
        });
      });
    });
  }
  archiveEntries.forEach(item => collectDigitalAccess(item, categoryKeys[String(item.category || '').toUpperCase()] || 'otros'));
  characters.forEach(item => collectDigitalAccess(item, 'personajes'));
  function gatesForFolder(folder) {
    const gates = [];
    const segments = folder.split('/');
    for (let index = 1; index <= segments.length; index++) {
      const source = folderSettings.get(segments.slice(0, index).join('/'))?.access_from;
      if (!source) continue;
      const page = String(source.page || '');
      const locator = [source.report, source.folder, source.file]
        .filter(value => Number.isInteger(value) && value >= 0).join('|');
      const inherited = accessSources.get(page + '|' + locator);
      if (!inherited) throw Error('Acceso de escáner sin correspondencia: ' + folder);
      for (const gate of inherited) if (!gates.some(value => JSON.stringify(value) === JSON.stringify({ ...gate, page }))) gates.push({ ...gate, page });
    }
    return gates;
  }
  const metadata = new Map();
  function collect(node, inheritedTitle = '') {
    if (Array.isArray(node)) return node.forEach(value => collect(value, inheritedTitle));
    if (!node || typeof node !== 'object') return;
    const title = String(node.title || node.caption || node.name || inheritedTitle || '').trim();
    for (const [key, value] of Object.entries(node)) {
      if (/^image(?:_\d+)?$/.test(key) && isLocalImage(value)) {
        const imageTitle=String(node[key+'_title']||title).trim();
        if (imageTitle && !metadata.has(value)) metadata.set(value, imageTitle);
      }
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
      secret_folders: secretAncestors(folder),
      filename,
      access: [...new Map([...(imageAccess.get(value) || []), ...gatesForFolder(folder)]
        .map(gate => [JSON.stringify(gate), gate])).values()]
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
  const ficheFolders = [...new Set(secretFichas.map(ficha => ficha.folder).filter(Boolean))]
    .map(folder => ({folder_path: folder, folder: folder.replaceAll('/', ' / '), secret_folders: secretAncestors(folder), fiche_folder: true}));
  const catalog = [...entries.values()].map(item => ({ ...item, overlay: signals.get(item.image) || '' })).concat(ficheFolders)
    .sort((a, b) => a.folder.localeCompare(b.folder, 'es') || String(a.title || '').localeCompare(String(b.title || ''), 'es'));
  const data = JSON.stringify(catalog).replace(/</g, '\\u003c');
  const codeData = JSON.stringify(secretCodes).replace(/</g, '\\u003c');
  const labelData = JSON.stringify(folderLabels).replace(/</g, '\\u003c');
  const iconData = JSON.stringify(folderIcons).replace(/</g, '\\u003c');
  const ficheData = JSON.stringify(secretFichas.filter(ficha => ficha.folder)).replace(/</g, '\\u003c');
  const title = String(config.page_title || 'Escáner interplanar');
  const tablet = exists(config.tablet_image) ? config.tablet_image : '/assets/uploads/escaner/tableta-scrappunk-cenital.png';
  const wallpaper = exists(config.desktop_wallpaper) ? config.desktop_wallpaper : '';
  const initialView = config.browser_view === 'list' ? 'list' : 'desktop';
  const scannerHead = head(`${title} | ${site.site_title}`, config.intro || 'Escáner de fotografías del Archivo.', tablet)
    .replace('</head>', '<link rel="stylesheet" href="assets/css/scanner.css?v=7"></head>');
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
      <div class="scanner-secret-lock" data-scanner-secret-lock hidden>
        <div class="scanner-secret-panel" role="dialog" aria-modal="true" aria-labelledby="scannerSecretTitle">
          <div class="scanner-secret-panel-head"><strong id="scannerSecretTitle">ACCESO RESTRINGIDO</strong><button type="button" data-scanner-secret-cancel aria-label="Cerrar ventana de código">×</button></div>
          <p data-scanner-secret-name></p>
          <form data-scanner-secret-form><label for="scannerSecretCode">CÓDIGO DE ACCESO</label><input id="scannerSecretCode" data-scanner-secret-code type="text" autocomplete="off" spellcheck="false" required><p data-scanner-secret-error role="alert" hidden>CÓDIGO INCORRECTO</p><button type="submit">ABRIR CARPETA →</button></form>
        </div>
      </div>
    </div>
  </section></div>
  <script type="application/json" id="scannerCatalog">${data}</script>
  <script type="application/json" id="scannerSecretCodes">${codeData}</script>
  <script type="application/json" id="scannerFolderLabels">${labelData}</script>
  <script type="application/json" id="scannerFolderIcons">${iconData}</script>
  <script type="application/json" id="scannerSecretFichas">${ficheData}</script>
</main>${footer(site)}<script defer src="assets/js/scanner-access.js?v=1"></script><script defer src="assets/js/scanner-folders.js?v=4"></script><script defer src="assets/js/scanner.js?v=11"></script></body></html>`;
  fs.writeFileSync(path.join(dist, 'escaner.html'), page);
  console.log(`Escáner: ${catalog.filter(item => item.image).length} imágenes y ${catalog.filter(item => item.overlay).length} señales configuradas.`);
};
