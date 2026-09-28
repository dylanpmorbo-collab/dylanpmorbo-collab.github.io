(() => {
  const root = document.querySelector('[data-scanner]');
  const source = document.getElementById('scannerCatalog');
  if (!root || !source) return;
  let catalog = [];
  try { catalog = JSON.parse(source.textContent); } catch { return; }
  const $ = selector => root.querySelector(selector);
  const folders = $('[data-scanner-folders]');
  const grid = $('[data-scanner-grid]');
  const search = $('#scannerSearch');
  const browser = $('[data-scanner-browser]');
  const viewer = $('[data-scanner-viewer]');
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
  function renderFolders() {
    folders.replaceChildren();
    folderNames.forEach(name => {
      const button = element('button', 'scanner-folder' + (name === folder ? ' is-active' : ''), '▣  ' + name.toUpperCase());
      button.type = 'button';
      button.setAttribute('aria-pressed', String(name === folder));
      button.addEventListener('click', () => { folder = name; search.value = ''; renderFolders(); renderGrid(); });
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
    items.forEach(item => {
      const button = element('button', 'scanner-file');
      button.type = 'button';
      const image = element('img'); image.src = item.image; image.alt = ''; image.loading = 'lazy';
      const title = element('span', '', item.title);
      button.append(image, title);
      button.addEventListener('click', () => openImage(item));
      grid.append(button);
    });
    if (!items.length) grid.append(element('p', 'scanner-empty', catalog.length ? 'No hay imágenes en esta carpeta.' : 'Todavía no hay imágenes publicadas para escanear.'));
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
  function openImage(item) {
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
    zoom.value = '100';
    $('[data-scanner-zoom-value]').textContent = '100 %';
    setLens(false);
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
  search.addEventListener('input', renderGrid);
  $('[data-scanner-back]').addEventListener('click', closeImage);
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
  renderFolders();
  renderGrid();
})();
