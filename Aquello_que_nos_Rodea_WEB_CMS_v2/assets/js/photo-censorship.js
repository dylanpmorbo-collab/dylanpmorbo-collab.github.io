(() => {
  'use strict';
  const catalog = window.AQNR_PHOTO_CENSORSHIP || {};
  if (!Object.keys(catalog).length) return;

  function imagePath(value) {
    try {
      const url = new URL(value, document.baseURI);
      if (url.origin !== location.origin) return '';
      return decodeURIComponent(url.pathname).replace(/\/+/g, '/');
    } catch (_) {
      return '';
    }
  }

  function setRenderedSource(img, source) {
    img.dataset.globalRenderedSrc = source;
    img.src = source;
  }

  function removeButton(img) {
    img._globalCensorButton?.remove();
    img._globalCensorButton = null;
  }

  function clear(img) {
    removeButton(img);
    img.classList.remove('global-censored', 'global-censored-ready');
    img.removeAttribute('data-global-mode');
    img.removeAttribute('data-global-original');
    img.removeAttribute('data-global-key');
    img.removeAttribute('data-global-fake');
    delete img.dataset.globalRenderedSrc;
  }

  function pixelate(img, original, key) {
    const source = new Image();
    source.onload = () => {
      if (img.dataset.globalKey !== key || img.dataset.globalRevealed === 'true') return;
      try {
        const width = source.naturalWidth;
        const height = source.naturalHeight;
        if (!width || !height) return;
        const scale = Math.min(1, 2400 / Math.max(width, height));
        const outWidth = Math.max(1, Math.round(width * scale));
        const outHeight = Math.max(1, Math.round(height * scale));
        const block = Math.max(10, Math.round(Math.max(outWidth, outHeight) / 42));
        const tiny = document.createElement('canvas');
        tiny.width = Math.max(1, Math.round(outWidth / block));
        tiny.height = Math.max(1, Math.round(outHeight / block));
        tiny.getContext('2d').drawImage(source, 0, 0, tiny.width, tiny.height);
        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(tiny, 0, 0, outWidth, outHeight);
        setRenderedSource(img, canvas.toDataURL('image/png'));
        img.classList.add('global-censored-ready');
      } catch (_) {
        // Si el navegador no admite canvas para esta foto, queda el desenfoque.
      }
    };
    source.src = original;
  }

  function apply(img) {
    if (!(img instanceof HTMLImageElement) || img.hasAttribute('data-retro-image')) return;
    const currentSrc = img.getAttribute('src') || '';
    if (img.dataset.globalRenderedSrc && currentSrc === img.dataset.globalRenderedSrc) return;
    if (img.dataset.globalRevealed === 'true') {
      if (imagePath(currentSrc) === img.dataset.globalKey) return;
      delete img.dataset.globalRevealed;
    }
    const staticKey = img.dataset.globalKey;
    const key = staticKey && (currentSrc === img.dataset.globalFake || currentSrc === img.dataset.globalOriginal)
      ? staticKey : imagePath(currentSrc);
    const rule = catalog[key];
    if (!rule) {
      if (img.dataset.globalMode) clear(img);
      return;
    }
    if (img.dataset.globalMode && img.dataset.globalKey === key && img._globalCensorButton) return;
    if (img.dataset.globalMode) clear(img);
    const original = img.dataset.globalOriginal || currentSrc;
    img.dataset.globalMode = rule.mode;
    img.dataset.globalOriginal = original;
    img.dataset.globalKey = key;
    img.classList.add('global-censored');
    img.removeAttribute('srcset');

    const parent = img.parentElement;
    if (!parent) return;
    const host = parent.tagName === 'BUTTON' || parent.tagName === 'A' ? parent.parentElement : parent;
    if (!host) return;
    host.classList.add('global-censor-host');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'global-censor-reveal';
    button.textContent = 'MOSTRAR';
    button.setAttribute('aria-label', 'Mostrar fotografía original');
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      img.dataset.globalRevealed = 'true';
      removeButton(img);
      img.classList.remove('global-censored', 'global-censored-ready');
      setRenderedSource(img, original);
      img.removeAttribute('data-global-mode');
      host.querySelector('[data-digital-zoom]')?.removeAttribute('hidden');
    });
    host.appendChild(button);
    img._globalCensorButton = button;
    host.querySelector('[data-digital-zoom]')?.setAttribute('hidden', '');

    if (rule.mode === 'falso') {
      img.dataset.globalFake = rule.fake;
      setRenderedSource(img, rule.fake);
      img.classList.add('global-censored-ready');
    } else {
      pixelate(img, original, key);
    }
  }

  function scan(root) {
    if (root instanceof HTMLImageElement) apply(root);
    root.querySelectorAll?.('img').forEach(apply);
  }

  function start() {
    scan(document);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') apply(record.target);
        else record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src']
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
