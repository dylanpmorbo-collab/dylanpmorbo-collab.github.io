(() => {
  const root = document.querySelector('[data-scanner]');
  const source = document.getElementById('scannerCatalog');
  if (!root || !source) return;
  let catalog = [];
  try { catalog = JSON.parse(source.textContent); } catch { return; }
  const allImages = catalog;
  let secretCodes = {};
  try { secretCodes = JSON.parse(document.getElementById('scannerSecretCodes')?.textContent || '{}') || {}; } catch {}
  const folderTools = window.ScannerFolders;
  const revealedSecrets = new Set();
  const secretStorageKey = 'aqnr_scanner_secret_folders_v1';
  let storedSecrets = {};
  try { storedSecrets = JSON.parse(localStorage.getItem(secretStorageKey) || '{}') || {}; } catch {}
  folderTools.secretPaths(allImages).forEach(path => {
    if (storedSecrets[path] === (secretCodes[path] || 'open')) revealedSecrets.add(path);
  });
  const seenStorageKey = 'aqnr_scanner_visited_secret_folders_v1';
  let storedSeenSecrets = {};
  try { storedSeenSecrets = JSON.parse(localStorage.getItem(seenStorageKey) || '{}') || {}; } catch {}
  const seenSecrets = new Set([...revealedSecrets]
    .filter(path => storedSeenSecrets[path] === (secretCodes[path] || 'open')));
  function isAccessible(item) {
    try { return window.ScannerAccess.isAccessible(item, location.pathname, localStorage); }
    catch { return !item.access?.length; }
  }
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
  const secretLock = $('[data-scanner-secret-lock]');
  const secretForm = $('[data-scanner-secret-form]');
  const secretInput = $('[data-scanner-secret-code]');
  const secretError = $('[data-scanner-secret-error]');
  let pendingFolder = '';
  let secretAttempt = 0;
  const approvedCodes = new Set();
  const key = 'aqnr_scanner_notes_v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { saved = {}; }
  let folderNames = [];
  let folder = folderNames[0] || '';
  const folderPaths = new Set();
  function visibleImages() { return folderTools.visibleItems(catalog, revealedSecrets); }
  function secretMatches() { return folderTools.matchingSecrets(catalog, search.value); }
  function secretsOnPath(path) {
    return folderTools.secretPaths(catalog).filter(secret => path === secret || path.startsWith(secret + '/'));
  }
  function rememberSecrets(paths) {
    paths.forEach(path => {
      revealedSecrets.add(path);
      storedSecrets[path] = secretCodes[path] || 'open';
    });
    try { localStorage.setItem(secretStorageKey, JSON.stringify(storedSecrets)); } catch {}
  }
  function markSecretVisited(path) {
    if (!revealedSecrets.has(path) || seenSecrets.has(path)) return;
    seenSecrets.add(path);
    storedSeenSecrets[path] = secretCodes[path] || 'open';
    try { localStorage.setItem(seenStorageKey, JSON.stringify(storedSeenSecrets)); } catch {}
  }
  function addDiscoveryMark(button, path) {
    if (!folderTools.hasUnvisitedSecret(path, revealedSecrets, seenSecrets)) return;
    button.append(element('span', 'scanner-folder-alert', '!'));
    button.title = 'Carpeta secreta descubierta pendiente de visitar en esta ruta';
  }
  function openFolder(path) {
    rememberSecrets(secretsOnPath(path));
    desktopPath = path;
    folder = catalog.find(item => folderTools.pathOf(item) === path)?.folder || path.replaceAll('/', ' / ');
    search.value = '';
    renderBrowser();
  }
  function closeSecretLock() {
    secretAttempt++;
    pendingFolder = '';
    approvedCodes.clear();
    secretLock.hidden = true;
    secretInput.value = '';
    secretError.hidden = true;
    search.focus();
  }
  function continueSecretOpen() {
    const needed = secretsOnPath(pendingFolder)
      .find(path => secretCodes[path] && !revealedSecrets.has(path) && !approvedCodes.has(path));
    if (needed) {
      secretLock.hidden = false;
      $('[data-scanner-secret-name]').textContent = displayLabel(needed.split('/').at(-1));
      secretInput.value = '';
      secretError.textContent = 'CÓDIGO INCORRECTO';
      secretError.hidden = true;
      secretInput.focus();
      secretLock.dataset.path = needed;
      return;
    }
    const path = pendingFolder;
    pendingFolder = '';
    approvedCodes.clear();
    secretLock.hidden = true;
    openFolder(path);
  }
  function requestOpenFolder(path) {
    secretAttempt++;
    pendingFolder = path;
    approvedCodes.clear();
    continueSecretOpen();
  }
  function secretFolderButton(path) {
    const button = element('button', 'scanner-desktop-folder scanner-secret-result');
    button.type = 'button';
    button.append(element('span', 'scanner-folder-icon'), element('span', 'scanner-desktop-label', displayLabel(path.split('/').at(-1))));
    button.addEventListener('click', () => requestOpenFolder(path));
    return button;
  }
  function refreshAccess() {
    catalog = allImages.filter(isAccessible);
    folderNames = [...new Set(visibleImages().map(item => item.folder))];
    if (!folderNames.includes(folder)) folder = folderNames[0] || '';
    folderPaths.clear();
    catalog.forEach(item => {
      const parts = String(item.folder_path ?? item.folder.replaceAll(' / ', '/')).split('/').filter(Boolean);
      parts.forEach((_, index) => folderPaths.add(parts.slice(0, index + 1).join('/')));
    });
    if (desktopPath && !folderTools.hasVisibleContents(catalog, desktopPath, revealedSecrets)) desktopPath = '';
    if (current && !isAccessible(current)) closeImage();
    renderBrowser();
  }
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
  function displayLabel(value) { return String(value ?? '').toLocaleUpperCase('es'); }
  function status(text) { $('[data-scanner-status]').textContent = text; }
  function photoButton(item, className) {
    const button = element('button', className);
    button.type = 'button';
    const image = element('img'); image.src = item.image; image.alt = ''; image.loading = 'lazy';
    const title = element('span', '', displayLabel(item.title));
    button.append(image, title);
    button.addEventListener('click', () => openImage(item));
    return button;
  }
  function renderFolders() {
    folderNames = [...new Set(visibleImages().map(item => item.folder))];
    if (!folderNames.includes(folder)) folder = folderNames[0] || '';
    folders.replaceChildren();
    folderNames.forEach(name => {
      const button = element('button', 'scanner-folder' + (name === folder ? ' is-active' : ''), '▣  ' + displayLabel(name));
      const path = name.replaceAll(' / ', '/');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(name === folder));
      addDiscoveryMark(button, path);
      button.addEventListener('click', () => { markSecretVisited(path); folder = name; search.value = ''; renderBrowser(); });
      folders.append(button);
    });
  }
  function renderGrid() {
    const query = search.value.trim().toLocaleLowerCase('es');
    const items = visibleImages().filter(item => query
      ? (item.title + ' ' + item.folder + ' ' + item.filename).toLocaleLowerCase('es').includes(query)
      : item.folder === folder);
    const secretFolders = query ? secretMatches() : [];
    $('[data-scanner-folder-title]').textContent = query ? 'RESULTADOS DE BÚSQUEDA' : displayLabel(folder);
    $('[data-scanner-count]').textContent = secretFolders.length
      ? secretFolders.length + ' CARPETA' + (secretFolders.length === 1 ? '' : 'S') + ' · ' + items.length + ' ARCHIVO' + (items.length === 1 ? '' : 'S')
      : items.length + ' ARCHIVO' + (items.length === 1 ? '' : 'S');
    grid.replaceChildren();
    secretFolders.forEach(path => grid.append(secretFolderButton(path)));
    items.forEach(item => grid.append(photoButton(item, 'scanner-file')));
    if (!items.length && !secretFolders.length) grid.append(element('p', 'scanner-empty', catalog.length ? 'No hay imágenes en esta carpeta.' : 'Todavía no hay imágenes publicadas para escanear.'));
  }
  function renderDesktop() {
    const query = search.value.trim().toLocaleLowerCase('es');
    desktopGrid.replaceChildren();
    breadcrumb.replaceChildren();
    const addCrumb = (label, path) => {
      const button = element('button', '', displayLabel(label));
      button.type = 'button';
      button.addEventListener('click', () => { desktopPath = path; search.value = ''; renderDesktop(); });
      breadcrumb.append(button);
    };
    addCrumb('ESCRITORIO', '');
    if (query) {
      breadcrumb.append(element('span', '', '› RESULTADOS'));
      const secretFolders = secretMatches();
      secretFolders.forEach(path => desktopGrid.append(secretFolderButton(path)));
      const matches = visibleImages().filter(item => (item.title + ' ' + item.folder + ' ' + item.filename).toLocaleLowerCase('es').includes(query));
      matches.forEach(item => desktopGrid.append(photoButton(item, 'scanner-desktop-file')));
      if (!matches.length && !secretFolders.length) desktopGrid.append(element('p', 'scanner-empty', 'No hay imágenes que coincidan.'));
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
      return parent === desktopPath && folderTools.hasVisibleContents(catalog, path, revealedSecrets);
    }).sort((a, b) => a.localeCompare(b, 'es'));
    children.forEach(path => {
      const button = element('button', 'scanner-desktop-folder');
      button.type = 'button';
      button.append(element('span', 'scanner-folder-icon'), element('span', 'scanner-desktop-label', displayLabel(path.split('/').at(-1))));
      addDiscoveryMark(button, path);
      button.addEventListener('click', () => { markSecretVisited(path); desktopPath = path; renderDesktop(); });
      desktopGrid.append(button);
    });
    visibleImages().filter(item => folderTools.pathOf(item) === desktopPath)
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
    if (!isAccessible(item)) { refreshAccess(); return; }
    const lensWasEnabled = enabled;
    current = item;
    browser.hidden = true;
    viewer.hidden = false;
    $('[data-scanner-title]').textContent = displayLabel(item.title);
    $('[data-scanner-file-count]').textContent = displayLabel(item.folder);
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
  secretForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!pendingFolder) return;
    const attempt = secretAttempt;
    const requestedFolder = pendingFolder;
    const requestedCodePath = secretLock.dataset.path;
    const expected = secretCodes[requestedCodePath];
    const value = secretInput.value.trim();
    if (!value || !expected) { secretError.hidden = false; return; }
    let actual = '';
    try {
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
      actual = [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    } catch {
      if (secretAttempt !== attempt) return;
      secretError.textContent = 'NO SE PUDO VERIFICAR EL CÓDIGO';
      secretError.hidden = false;
      return;
    }
    if (secretAttempt !== attempt || pendingFolder !== requestedFolder || secretLock.dataset.path !== requestedCodePath) return;
    if (actual !== expected) {
      secretError.textContent = 'CÓDIGO INCORRECTO';
      secretError.hidden = false;
      secretInput.select();
      return;
    }
    approvedCodes.add(requestedCodePath);
    continueSecretOpen();
  });
  $('[data-scanner-secret-cancel]').addEventListener('click', closeSecretLock);
  secretLock.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeSecretLock(); }
    if (event.key === 'Tab') {
      const controls = secretLock.querySelectorAll('button, input');
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
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
  window.addEventListener('pageshow', refreshAccess);
  window.addEventListener('focus', refreshAccess);
  window.addEventListener('storage', event => {
    if (event.key?.startsWith('archivo-acceso-v1:') || event.key?.startsWith('archivo-circuito-v1:') || event.key === null) refreshAccess();
  });
  refreshAccess();
})();
