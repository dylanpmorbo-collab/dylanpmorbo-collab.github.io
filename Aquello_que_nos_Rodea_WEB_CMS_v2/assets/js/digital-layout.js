/* Keep documentary cards packed after lazy media, filtering and carousel changes. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.digital-grid').forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.digital-piece'));
    const imageRatios = new WeakMap();
    let frame = 0;

    function fitMedia() {
      grid.querySelectorAll('.digital-carousel').forEach(carousel => {
        const viewport = carousel.querySelector('.digital-carousel-viewport');
        if (!viewport) return;
        const mediaItems = Array.from(carousel.querySelectorAll('.digital-carousel-slide img, .digital-carousel-slide video'));
        const ratios = mediaItems.map(media => {
            const width = media.naturalWidth || media.videoWidth;
            const height = media.naturalHeight || media.videoHeight;
            return width && height ? width / height : imageRatios.get(media);
          }).filter(Number.isFinite);
        if (ratios.length === mediaItems.length && ratios.length)
          viewport.style.aspectRatio = String(Math.max(.8, Math.min(1.7, Math.min(...ratios))));
      });
    }

    function prepareMedia() {
      grid.querySelectorAll('.digital-carousel-slide img').forEach(img => {
        if (img.naturalWidth) return;
        const probe = new Image();
        probe.onload = () => {
          imageRatios.set(img, probe.naturalWidth / probe.naturalHeight);
          schedule();
        };
        probe.src = img.currentSrc || img.src;
      });
      grid.querySelectorAll('.digital-carousel-slide video').forEach(video => {
        video.preload = 'metadata';
        if (!video.readyState) video.load();
      });
    }

    function layout() {
      frame = 0;
      fitMedia();
      if (window.matchMedia('(max-width: 760px)').matches) return;
      cards.forEach(card => {
        if (card.hidden) {
          card.style.gridRowEnd = '';
          return;
        }
        card.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((card.getBoundingClientRect().height + 22) / 4));
      });
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(layout);
    }

    grid.classList.add('is-masonry');
    schedule();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(schedule);
      cards.forEach(card => observer.observe(card));
    }
    const changes = new MutationObserver(schedule);
    changes.observe(grid, {subtree: true, attributes: true, attributeFilter: ['hidden']});
    grid.addEventListener('load', schedule, true);
    grid.addEventListener('loadedmetadata', schedule, true);
    window.addEventListener('resize', schedule);
    const section = grid.closest('.digital-footprint');
    if (section?.open) prepareMedia();
    else section?.addEventListener('toggle', () => {
      if (section.open) prepareMedia();
    }, {once: true});
  });
});
