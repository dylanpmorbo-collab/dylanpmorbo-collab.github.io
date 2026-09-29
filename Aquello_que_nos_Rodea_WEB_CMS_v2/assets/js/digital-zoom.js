document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.digital-footprint:not(.archive-press)');
  if (!sections.length || !document.querySelector('.digital-photo-zoomable')) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'digital-zoom-dialog';
  dialog.setAttribute('aria-label', 'Imagen ampliada');
  dialog.innerHTML = `
    <div class="digital-zoom-toolbar">
      <span>IMAGEN ARCHIVADA</span>
      <div class="digital-zoom-controls" role="group" aria-label="Controles de ampliación">
        <button type="button" data-zoom-out aria-label="Reducir imagen">−</button>
        <button type="button" data-zoom-reset aria-label="Restablecer tamaño">100 %</button>
        <button type="button" data-zoom-in aria-label="Ampliar imagen">+</button>
        <button type="button" data-zoom-close aria-label="Cerrar imagen ampliada">×</button>
      </div>
    </div>
    <div class="digital-zoom-viewport" aria-label="Desplaza la imagen para leerla">
      <img alt="">
    </div>
    <p class="digital-zoom-hint">AMPLÍA CON + Y − · DESPLAZA LA IMAGEN PARA LEER</p>`;
  document.body.appendChild(dialog);

  const viewport = dialog.querySelector('.digital-zoom-viewport');
  const image = viewport.querySelector('img');
  const reset = dialog.querySelector('[data-zoom-reset]');
  const zoomOut = dialog.querySelector('[data-zoom-out]');
  const zoomIn = dialog.querySelector('[data-zoom-in]');
  let zoom = 1;
  let baseWidth = 0;
  let trigger = null;
  let drag = null;

  function setZoom(value) {
    if (!baseWidth) return;
    const next = Math.max(1, Math.min(5, value));
    const previousWidth = baseWidth * zoom || 1;
    const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    const centerY = viewport.scrollTop + viewport.clientHeight / 2;
    zoom = next;
    image.style.width = Math.round(baseWidth * zoom) + 'px';
    reset.textContent = Math.round(zoom * 100) + ' %';
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 5;
    const ratio = (baseWidth * zoom) / previousWidth;
    viewport.scrollLeft = centerX * ratio - viewport.clientWidth / 2;
    viewport.scrollTop = centerY * ratio - viewport.clientHeight / 2;
  }

  function fitImage() {
    if (!dialog.open || !image.naturalWidth || !image.naturalHeight) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    baseWidth = Math.max(80, Math.min(image.naturalWidth, viewport.clientWidth - 32, (viewport.clientHeight - 32) * ratio));
    zoom = 1;
    viewport.scrollTo(0, 0);
    setZoom(1);
  }

  function openImage(photo, source) {
    if (photo.classList.contains('digital-sensitive')) return;
    trigger = photo.querySelector('[data-digital-zoom]');
    image.onload = fitImage;
    image.alt = source.alt || 'Imagen archivada';
    dialog.showModal();
    image.src = source.currentSrc || source.src;
    if (image.complete && image.naturalWidth) fitImage();
    dialog.querySelector('[data-zoom-close]').focus();
  }

  sections.forEach(section => {
    section.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const photo = event.target.closest('.digital-photo-zoomable');
      if (!photo || photo.closest('.digital-footprint') !== section) return;
      if (!event.target.matches('img') && !event.target.closest('[data-digital-zoom]')) return;
      const source = photo.querySelector('img');
      if (source) openImage(photo, source);
    });
    section.addEventListener('toggle', () => {
      if (!section.open && dialog.open) dialog.close();
    });
  });

  zoomOut.addEventListener('click', () => setZoom(zoom - 0.5));
  zoomIn.addEventListener('click', () => setZoom(zoom + 0.5));
  reset.addEventListener('click', () => setZoom(1));
  dialog.querySelector('[data-zoom-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    image.onload = null;
    if (trigger?.isConnected) trigger.focus();
    trigger = null;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + 0.5); }
    if (event.key === '-') { event.preventDefault(); setZoom(zoom - 0.5); }
    if (event.key === '0') { event.preventDefault(); setZoom(1); }
  });
  viewport.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25));
  }, { passive: false });
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || zoom <= 1) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  function endDrag() { drag = null; viewport.classList.remove('is-dragging'); }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
});
