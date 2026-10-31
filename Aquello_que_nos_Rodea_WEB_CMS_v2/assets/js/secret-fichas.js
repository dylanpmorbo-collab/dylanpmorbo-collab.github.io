(() => {
  const storagePrefix = 'aqnr_secret_ficha_v1:';
  const fingerprint = ficha => ficha.accessType === 'code' ? ficha.codeHash : 'open';
  function isUnlocked(ficha) {
    try { return localStorage.getItem(storagePrefix + ficha.target) === fingerprint(ficha); }
    catch { return false; }
  }
  function remember(ficha) {
    try { localStorage.setItem(storagePrefix + ficha.target, fingerprint(ficha)); } catch {}
  }
  async function hash(value) {
    const bytes = new TextEncoder().encode(value.trim());
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function closeOverlay(overlay) { overlay.remove(); }
  function prompt(ficha, host, onSuccess, onCancel) {
    const dialog = ficha.dialog || {};
    const overlay = document.createElement('div');
    overlay.className = 'secret-ficha-overlay' + (host !== document.body ? ' in-scanner' : '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', dialog.title || 'Acceso restringido');
    const panel = document.createElement('div');
    panel.className = 'secret-ficha-panel';
    if (dialog.background) panel.style.setProperty('--secret-background', dialog.background);
    if (dialog.accent) panel.style.setProperty('--secret-accent', dialog.accent);
    if (dialog.text) panel.style.setProperty('--secret-text', dialog.text);
    if (dialog.image) panel.style.setProperty('--secret-image', `url("${encodeURI(dialog.image).replaceAll('"', '%22')}")`);
    const eyebrow = document.createElement('p'); eyebrow.className = 'secret-ficha-eyebrow'; eyebrow.textContent = dialog.eyebrow || 'EXPEDIENTE CLASIFICADO';
    const title = document.createElement('h2'); title.textContent = dialog.title || 'ACCESO RESTRINGIDO';
    const description = document.createElement('p'); description.textContent = dialog.description || 'Introduce el código para consultar esta ficha.';
    const form = document.createElement('form');
    const label = document.createElement('label'); label.textContent = dialog.label || 'CÓDIGO DE ACCESO';
    const input = document.createElement('input'); input.type = 'text'; input.required = true; input.autocomplete = 'off'; input.spellcheck = false; input.placeholder = dialog.placeholder || '';
    label.append(input);
    const error = document.createElement('p'); error.className = 'secret-ficha-error'; error.hidden = true; error.setAttribute('role', 'alert');
    const actions = document.createElement('div'); actions.className = 'secret-ficha-actions';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = dialog.cancel || 'VOLVER';
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = dialog.submit || 'ABRIR FICHA →';
    actions.append(cancel, submit); form.append(label, error, actions); panel.append(eyebrow, title, description, form); overlay.append(panel); host.append(overlay);
    const abort = () => { closeOverlay(overlay); if (onCancel) onCancel(); };
    cancel.addEventListener('click', abort);
    overlay.addEventListener('keydown', event => { if (event.key === 'Escape') abort(); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      submit.disabled = true;
      try {
        const valid = ficha.accessType === 'code' && await hash(input.value) === ficha.codeHash;
        if (!valid) { error.textContent = dialog.error || 'CÓDIGO INCORRECTO'; error.hidden = false; input.select(); return; }
        remember(ficha); closeOverlay(overlay); onSuccess();
      } catch { error.textContent = 'NO SE PUDO COMPROBAR EL CÓDIGO EN ESTE NAVEGADOR'; error.hidden = false; }
      finally { submit.disabled = false; }
    });
    input.focus();
  }
  function open(ficha, scannerRoot) {
    if (!ficha || !ficha.target) return;
    const navigate = () => { location.href = ficha.target; };
    if (isUnlocked(ficha) || ficha.accessType === 'none') { navigate(); return; }
    prompt(ficha, scannerRoot || document.body, navigate);
  }
  window.AQNRSecretFichas = { open, isUnlocked };
  function syncRelatedConnections() {
    document.querySelectorAll('[data-secret-ficha-connection]').forEach(card => {
      const target = card.getAttribute('data-secret-ficha-connection');
      let unlocked = false;
      try { unlocked = localStorage.getItem(storagePrefix + target) === card.dataset.secretFichaFingerprint; } catch {}
      card.hidden = !unlocked;
    });
    document.querySelectorAll('.related-archive-gateway').forEach(gate => {
      const count = gate.querySelectorAll('.related-archive-card:not([hidden])').length;
      const label = gate.querySelector('.related-archive-heading .section-label');
      if (label) label.textContent = 'ARCHIVOS RELACIONADOS // ' + String(count).padStart(2, '0');
    });
  }
  function initializePage() {
    syncRelatedConnections();
    document.querySelectorAll('[data-secret-ficha-card]').forEach(card => {
      const target = card.getAttribute('data-secret-ficha-card');
      try { if (localStorage.getItem(storagePrefix + target) !== card.dataset.secretFichaFingerprint) return; } catch { return; }
      card.hidden = false;
    });
    document.querySelectorAll('[data-secret-ficha-count]').forEach(counter => {
      const initial = Number(counter.dataset.secretFichaCount) || 0;
      const count = initial + document.querySelectorAll('[data-secret-ficha-card]:not([hidden])').length;
      counter.textContent = String(count).padStart(2, '0') + ' EXPEDIENTE' + (count === 1 ? '' : 'S');
    });
    if (document.querySelector('[data-secret-ficha-card]:not([hidden])')) {
      document.querySelectorAll('[data-secret-ficha-empty]').forEach(empty => { empty.hidden = true; });
    }
    const source = document.getElementById('secretFichaConfig');
    if (!source) return;
    let ficha;
    try { ficha = JSON.parse(source.textContent); } catch { return; }
    const unlock = () => { remember(ficha); document.body.classList.remove('secret-ficha-locked'); };
    if (isUnlocked(ficha) || ficha.accessType === 'none') { unlock(); return; }
    prompt(ficha, document.body, unlock, () => { location.href = 'archivo.html'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePage);
  else initializePage();
  window.addEventListener('pageshow', syncRelatedConnections);
  window.addEventListener('storage', event => { if (event.key?.startsWith(storagePrefix)) syncRelatedConnections(); });
})();
