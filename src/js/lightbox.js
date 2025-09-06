// Lightbox accesible para proyectos de la galería
// Escucha window "open-lightbox" con { project }
// Muestra project.images (y luego project.videos) — NO usa cover.

const qs  = (s, r = document) => r.querySelector(s);

let lb, lbBackdrop, lbContent, lbClose, lbBrand, lbTitle, lbExternal,
    lbStage, lbFigure, lbPrev, lbNext, lbCounter;

let lastActive = null;
let items = [];
let index = 0;
let openToken = 0;

function ensureDom() {
  if (qs('#lightbox')) return;

  const tpl = document.createElement('div');
  tpl.innerHTML = `
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" hidden>
      <div class="lightbox__backdrop" data-close></div>
      <div class="lightbox__content" role="document">
        <button class="lightbox__close" type="button" aria-label="Cerrar">×</button>

        <header class="lightbox__header">
          <span class="lightbox__brand-chip is-hidden" id="lbBrand"></span>
          <h3 class="lightbox__title" id="lbTitle"></h3><a class="lightbox__external is-hidden" id="lbExternal" target="_blank" rel="noopener">Ver proyecto</a>
          
        </header>

        <div class="lightbox__stage">
          <button class="lightbox__nav lightbox__prev" type="button" aria-label="Anterior"></button>
          <figure class="lightbox__figure is-loading" id="lbFigure" aria-live="polite"></figure>
          <button class="lightbox__nav lightbox__next" type="button" aria-label="Siguiente"></button>
          <div class="lightbox__counter" id="lbCounter"></div>
          
        </div>
      </div>
    </div>
  `.trim();
  document.body.appendChild(tpl.firstChild);

  lb          = qs('#lightbox');
  lbBackdrop  = lb.querySelector('.lightbox__backdrop');
  lbContent   = lb.querySelector('.lightbox__content');
  lbClose     = lb.querySelector('.lightbox__close');
  lbBrand     = qs('#lbBrand');
  lbTitle     = qs('#lbTitle');
  lbExternal  = qs('#lbExternal');
  lbStage     = lb.querySelector('.lightbox__stage');
  lbFigure    = qs('#lbFigure');
  lbPrev      = lb.querySelector('.lightbox__prev');
  lbNext      = lb.querySelector('.lightbox__next');
  lbCounter   = qs('#lbCounter');

  // Eventos base
  lbBackdrop.addEventListener('click', close);
  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', () => go(-1));
  lbNext.addEventListener('click', () => go(1));

  // Teclado
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'Tab') trapFocus(e);
  }, true);

  // Gestos simples
  let startX = null;
  lbStage.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  lbStage.addEventListener('pointerup', (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
    startX = null;
  });
}

function trapFocus(e) {
  const f = lbContent.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
  if (!f.length) return;
  const first = f[0];
  const last  = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function open(project) {
  ensureDom();

  // Construir lista de items: primero imágenes, luego videos
  const imgs = Array.isArray(project.images) ? project.images : [];
  const vids = Array.isArray(project.videos) ? project.videos : [];
  items = [
    ...imgs.map(src => ({ type: 'image', src })),
    ...vids.map(src => ({ type: 'video', src }))
  ];
  if (!items.length) return; // nada que mostrar

  index = 0;
  openToken++;

  // Header
  lbTitle.textContent = project.title || '';
  if (project.brandLabel) {
    lbBrand.textContent = project.brandLabel;
    lbBrand.classList.remove('is-hidden');
  } else {
    lbBrand.classList.add('is-hidden');
  }
  if (project.url) {
    lbExternal.href = project.url;
    lbExternal.classList.remove('is-hidden');
  } else {
    lbExternal.classList.add('is-hidden');
  }

  // Mostrar
  lastActive = document.activeElement;
  document.body.classList.add('lb-open');
  lb.hidden = false;
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  lbContent.focus();
  lbContent.setAttribute('tabindex', '-1');

  render(index);
}

function close() {
  if (!lb) return;
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  lb.hidden = true;
  document.body.classList.remove('lb-open');
  // Limpieza
  lbFigure.innerHTML = '';
  if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
}

function go(step) {
  if (!items.length) return;
  index = (index + step + items.length) % items.length;
  render(index);
}

function render(i) {
  const myToken = openToken;
  const item = items[i];
  lbFigure.classList.add('is-loading');
  lbFigure.innerHTML = '';

  // Contador
  lbCounter.textContent = `${i + 1}/${items.length}`;

  if (item.type === 'image') {
    const img = new Image();
    img.className = 'lightbox__img';
    img.alt = ''; // decorativo en full view
    img.decoding = 'async';
    img.loading = 'eager';
    img.addEventListener('load', () => {
      if (myToken !== openToken) return;
      lbFigure.classList.remove('is-loading');
    }, { once: true });
    img.addEventListener('error', () => {
      if (myToken !== openToken) return;
      lbFigure.classList.remove('is-loading');
      const err = document.createElement('div');
      err.className = 'lightbox__error';
      err.textContent = 'No se pudo cargar la imagen.';
      lbFigure.appendChild(err);
    }, { once: true });
    lbFigure.appendChild(img);
    img.src = item.src;
  } else {
    // Video (iframe)
    const wrap = document.createElement('div');
    wrap.className = 'lightbox__video';
    const iframe = document.createElement('iframe');
    iframe.className = 'lightbox__iframe';
    iframe.src = item.src;
    iframe.title = 'Video del proyecto';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.loading = 'eager';

    iframe.addEventListener('load', () => {
      if (myToken !== openToken) return;
      lbFigure.classList.remove('is-loading');
    }, { once: true });

    wrap.appendChild(iframe);
    lbFigure.appendChild(wrap);
  }

  // Navegación visible/oculta cuando corresponde
  const many = items.length > 1;
  lbPrev.style.display = many ? '' : 'none';
  lbNext.style.display = many ? '' : 'none';
}

// Evento público desde la galería
window.addEventListener('open-lightbox', (e) => {
  const { project } = e.detail || {};
  if (!project) return;
  open(project);
});

// Cerrar con Escape también si se abrió antes de construir DOM
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && qs('#lightbox') && !qs('#lightbox').hidden) close();
});

// al final de src/js/lightbox.js
export function initLightbox() {
  ensureDom(); // crea el DOM del lightbox si no existe (idempotente)
}

function mountVideo(figureEl, url) {
  figureEl.dataset.kind = 'video';
  figureEl.classList.add('is-loading');

  const wrap = document.createElement('div');
  wrap.className = 'lightbox__video';

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer';
  iframe.addEventListener('load', () => {
    figureEl.classList.remove('is-loading');
  });

  wrap.appendChild(iframe);
  figureEl.replaceChildren(wrap);
}

function mountImage(figureEl, src, alt='') {
  figureEl.dataset.kind = 'image';
  figureEl.classList.add('is-loading');

  const img = new Image();
  img.className = 'lightbox__img';
  img.alt = alt;
  img.decoding = 'async';
  img.loading = 'eager';
  img.referrerPolicy = 'no-referrer';

  img.onload = () => figureEl.classList.remove('is-loading');
  img.onerror = () => figureEl.classList.remove('is-loading');

  img.src = src;
  figureEl.replaceChildren(img);
}
