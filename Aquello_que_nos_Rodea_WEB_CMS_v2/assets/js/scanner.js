(() => {
  const root = document.querySelector('[data-scanner]');
  const source = document.getElementById('scannerCatalog');
  if (!root || !source) return;
  let catalog = [];
  try { catalog = JSON.parse(source.textContent); } catch { return; }
  const $ = selector => root.querySelector(selector);
  const folders = $('[data-scanner-folders]');
  const grid = $('[data-scanner-grid]');
  const desktopGrid = $('[data-scanner-desktop-grid]');
  const breadcrumb = $('[data-scanner-breadcrumb]');
  const desktop = $('[data-scanner-desktop]');
  const list = $('[data-scanner-list]');
  const viewToggle = $('[data-scanner-view-toggle]');
  const search = $('#scannerSearch');
  const browser = $('[data-scanner-browser]');
  const viewer = $('[data-scanner-viewer]');
  const previous = $('[data-scanner-previous]');
  const next = $('[data-scanner-next]');
  const stage = $('[data-scanner-stage]');
  const frame = $('[data-scanner-frame]');
  const photo = $('[data-scanner-photo]');
  const lensPhoto = $('[data-scanner-lens-photo]');
  const overlay = $('[data-scanner-overlay]');
  const lens = $('[data-scanner-lens]');
  const lensContent = $('[data-scanner-lens-content]');
  const size = $('[data-scanner-size]');
  const zoom = $('[data-scanner-zoom]');
  const toggle = $('[data-scanner-toggle]');
  const notes = $('[data-scanner-notes]');
  const key = 'aqnr_scanner_notes_v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { saved = {}; }
  const folderNames = [...new Set(catalog.map(item => item.folder))];
  let folder = folderNames[0] || '';
  const folderPaths = new Set();
  catalog.forEach(item => {
    const parts = String(item.folder_path ?? item.folder.replaceAll(' / ', '/')).split('/').filter(Boolean);
    parts.forEach((_, index) => folderPaths.add(parts.slice(0, index + 1).join('/')));
  });
  let desktopPath = '';
  let view = root.dataset.scannerInitialView === 'list' ? 'list' : 'desktop';
  try { if (localStorage.getItem('aqnr_scanner_view') === 'list' || localStorage.getItem('aqnr_scanner_view') === 'desktop') view = localStorage.getItem('aqnr_scanner_view'); } catch {}
  let current = null;
  let enabled = false;
  let overlayValid = false;
  let cursor = { x: 0, y: 0 };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function status(text) { $('[data-scanner-status]').textContent = text; }
  function photoButton(item, className) {
    const button = element('button', className);
    button.type = 'button';
    const image = element('img'); image.src = item.image; image.alt = ''; image.loading = 'lazy';
    const title = element('span', '', item.title);
    button.append(image, title);
    button.addEventListener('click', () => openImage(item));
    return button;
  }
  function renderFolders() {
    folders.replaceChildren();
    folderNames.forEach(name => {
      const button = element('button', 'scanner-folder' + (name === folder ? ' is-active' : ''), '▣  ' + name.toUpperCase());
      button.type = 'button';
      button.setAttribute('aria-pressed', String(name === folder));
      button.addEventListener('click', () => { folder = name; search.value = ''; renderBrowser(); });
      folders.append(button);
    });
  }
  function renderGrid() {
    const query = search.value.trim().toLocaleLowerCase('es');
    const items = catalog.filter(item => query
      ? (item.title + ' ' + item.folder + ' ' + item.filename).toLocaleLowerCase('es').includes(query)
      : item.folder === folder);
    $('[data-scanner-folder-title]').textContent = query ? 'RESULTADOS DE BÚSQUEDA' : folder.toUpperCase();
    $('[data-scanner-count]').textContent = items.length + ' ARCHIVO' + (items.length === 1 ? '' : 'S');
    grid.replaceChildren();
    items.forEach(item => grid.append(photoButton(item, 'scanner-file')));
    if (!items.length) grid.append(element('p', 'scanner-empty', catalog.length ? 'No hay imágenes en esta carpeta.' : 'Todavía no hay imágenes publicadas para escanear.'));
  }
  function renderDesktop() {
    const query = search.value.trim().toLocaleLowerCase('es');
    desktopGrid.replaceChildren();
    breadcrumb.replaceChildren();
    const addCrumb = (label, path) => {
      const button = element('button', '', label);
      button.type = 'button';
      button.addEventListener('click', () => { desktopPath = path; search.value = ''; renderDesktop(); });
      breadcrumb.append(button);
    };
    addCrumb('ESCRITORIO', '');
    if (query) {
      breadcrumb.append(element('span', '', '› RESULTADOS'));
      const matches = catalog.filter(item => (item.title + ' ' + item.folder + ' ' + item.filename).toLocaleLowerCase('es').includes(query));
      matches.forEach(item => desktopGrid.append(photoButton(item, 'scanner-desktop-file')));
      if (!matches.length) desktopGrid.append(element('p', 'scanner-empty', 'No hay imágenes que coincidan.'));
      return;
    }
    let partial = '';
    for (const segment of desktopPath.split('/').filter(Boolean)) {
      partial = partial ? partial + '/' + segment : segment;
      breadcrumb.append(element('span', '', '›'));
      addCrumb(segment, partial);
    }
    const children = [...folderPaths].filter(path => {
      const parent = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
      return parent === desktopPath;
    }).sort((a, b) => a.localeCompare(b, 'es'));
    children.forEach(path => {
      const button = element('button', 'scanner-desktop-folder');
      button.type = 'button';
      button.append(element('span', 'scanner-folder-icon'), element('span', 'scanner-desktop-label', path.split('/').at(-1)));
      button.addEventListener('click', () => { desktopPath = path; renderDesktop(); });
      desktopGrid.append(button);
    });
    catalog.filter(item => (item.folder_path ?? item.folder.replaceAll(' / ', '/')) === desktopPath)
      .forEach(item => desktopGrid.append(photoButton(item, 'scanner-desktop-file')));
    if (!desktopGrid.children.length) desktopGrid.append(element('p', 'scanner-empty', 'Esta carpeta no contiene imágenes visibles.'));
  }
  function renderBrowser() {
    desktop.hidden = view !== 'desktop';
    list.hidden = view !== 'list';
    viewToggle.textContent = view === 'desktop' ? 'VISTA: ESCRITORIO' : 'VISTA: LISTADO';
    viewToggle.setAttribute('aria-label', view === 'desktop' ? 'Cambiar a listado de carpetas' : 'Cambiar a escritorio de carpetas');
    renderFolders(); renderGrid(); renderDesktop();
  }
  function fit() {
    if (!current || !photo.naturalWidth || viewer.hidden) return;
    const maxWidth = stage.clientWidth - 24;
    const maxHeight = stage.clientHeight - 24;
    const factor = Math.min(maxWidth / photo.naturalWidth, maxHeight / photo.naturalHeight) * Number(zoom.value) / 100;
    const width = Math.max(1, Math.round(photo.naturalWidth * factor));
    const height = Math.max(1, Math.round(photo.naturalHeight * factor));
    frame.style.width = width + 'px';
    frame.style.height = height + 'px';
    lensContent.style.width = width + 'px';
    lensContent.style.height = height + 'px';
    cursor = { x: width / 2, y: height / 2 };
    placeLens();
  }
  function placeLens() {
    if (!current) return;
    const radius = Number(size.value) / 2;
    const x = Math.max(0, Math.min(frame.clientWidth, cursor.x));
    const y = Math.max(0, Math.min(frame.clientHeight, cursor.y));
    lens.style.width = size.value + 'px';
    lens.style.height = size.value + 'px';
    lens.style.left = x - radius + 'px';
    lens.style.top = y - radius + 'px';
    lensContent.style.left = radius - x + 'px';
    lensContent.style.top = radius - y + 'px';
  }
  function setLens(on) {
    enabled = on;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.textContent = on ? 'DESACTIVAR LENTE' : 'ACTIVAR LENTE';
    lens.hidden = !on;
    status(on ? (overlayValid ? 'SEÑAL INTERPLANAR EN LECTURA' : 'ESPECTRO ABIERTO · SIN SEÑAL ASOCIADA') : 'ESPERANDO LECTURA');
    if (on) placeLens();
  }
  function validateOverlay() {
    if (!current?.overlay || !photo.naturalWidth || !overlay.complete || !overlay.naturalWidth) return;
    overlayValid = photo.naturalWidth === overlay.naturalWidth && photo.naturalHeight === overlay.naturalHeight;
    overlay.hidden = !overlayValid;
    if (!overlayValid) status('CAPA INCOMPATIBLE · MEDIDAS DISTINTAS');
    else if (enabled) status('SEÑAL INTERPLANAR EN LECTURA');
  }
  function folderImages(item) {
    const path = item.folder_path ?? item.folder;
    return catalog.filter(candidate => (candidate.folder_path ?? candidate.folder) === path);
  }
  function updateImageNavigation() {
    const siblings = current ? folderImages(current) : [];
    const index = siblings.findIndex(item => item.image === current?.image);
    previous.disabled = index <= 0;
    next.disabled = index < 0 || index >= siblings.length - 1;
  }
  function moveImage(direction) {
    if (!current) return;
    const siblings = folderImages(current);
    const index = siblings.findIndex(item => item.image === current.image);
    const target = siblings[index + direction];
    if (target) openImage(target, true);
  }
  function openImage(item, preserveView = false) {
    const lensWasEnabled = enabled;
    current = item;
    browser.hidden = true;
    viewer.hidden = false;
    $('[data-scanner-title]').textContent = item.title;
    $('[data-scanner-file-count]').textContent = item.folder.toUpperCase();
    photo.src = item.image;
    photo.alt = item.title;
    lensPhoto.src = item.image;
    overlayValid = false;
    overlay.hidden = true;
    if (item.overlay) overlay.src = item.overlay;
    else overlay.removeAttribute('src');
    notes.value = saved[item.image] || '';
    if (!preserveView) zoom.value = '100';
    $('[data-scanner-zoom-value]').textContent = zoom.value + ' %';
    setLens(preserveView && lensWasEnabled);
    updateImageNavigation();
    if (photo.complete && photo.naturalWidth) requestAnimationFrame(() => { fit(); validateOverlay(); });
    else photo.addEventListener('load', () => { fit(); validateOverlay(); }, { once: true });
    if (item.overlay && overlay.complete) validateOverlay();
  }
  function closeImage() {
    setLens(false);
    current = null;
    viewer.hidden = true;
    browser.hidden = false;
    photo.removeAttribute('src');
    lensPhoto.removeAttribute('src');
    overlay.removeAttribute('src');
    status('ESPERANDO SELECCIÓN');
  }
  search.addEventListener('input', () => { renderGrid(); renderDesktop(); });
  viewToggle.addEventListener('click', () => {
    view = view === 'desktop' ? 'list' : 'desktop';
    try { localStorage.setItem('aqnr_scanner_view', view); } catch {}
    renderBrowser();
  });
  $('[data-scanner-back]').addEventListener('click', closeImage);
  previous.addEventListener('click', () => moveImage(-1));
  next.addEventListener('click', () => moveImage(1));
  toggle.addEventListener('click', () => setLens(!enabled));
  size.addEventListener('input', placeLens);
  zoom.addEventListener('input', () => {
    $('[data-scanner-zoom-value]').textContent = zoom.value + ' %';
    fit();
  });
  frame.addEventListener('pointermove', event => {
    if (!enabled) return;
    const rect = frame.getBoundingClientRect();
    cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    placeLens();
  });
  frame.addEventListener('keydown', event => {
    if (!enabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 30 : 10;
    cursor.x += event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
    cursor.y += event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0;
    placeLens();
  });
  overlay.addEventListener('load', validateOverlay);
  notes.addEventListener('input', () => {
    if (!current) return;
    if (notes.value.trim()) saved[current.image] = notes.value;
    else delete saved[current.image];
    try { localStorage.setItem(key, JSON.stringify(saved)); } catch { status('NO SE PUDIERON GUARDAR LAS NOTAS'); }
  });
  window.addEventListener('resize', fit);
  renderBrowser();
})();
