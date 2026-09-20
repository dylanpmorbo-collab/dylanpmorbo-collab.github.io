/* Keep documentary cards packed after lazy media, filtering and carousel changes. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.digital-grid').forEach(grid => {
    const cards = Array.from(grid.querySelectorAll('.digital-piece'));
    let frame = 0;

    function fitMedia() {
      grid.querySelectorAll('.digital-carousel').forEach(carousel => {
        const viewport = carousel.querySelector('.digital-carousel-viewport');
        const slide = carousel.querySelector('.digital-carousel-slide:not([hidden])');
        const media = slide?.querySelector('img, video');
        if (!viewport || !media) return;
        const width = media.naturalWidth || media.videoWidth;
        const height = media.naturalHeight || media.videoHeight;
        viewport.style.aspectRatio = width && height
          ? String(Math.max(.8, Math.min(1.7, width / height)))
          : '4 / 3';
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
  });
});
