// src/js/gallery.js
// Galería secuencial + badge de marca en hover + filtros por categoría (opcional)
// Lee /public/data/projects.json y soporta tamaños: wide, tall, xl, 3x2, 2x3.

const PROJECTS_URL = `${import.meta.env.BASE_URL}data/projects.json`;

const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

// ====== Estado global para evitar renders solapados ======
let __renderToken = 0;
const __timers = new Set();
function cancelPendingTimers() { for (const t of __timers) clearTimeout(t); __timers.clear(); }

// ---------- Helpers UI ----------
function createSkeleton(size) {
  const a = document.createElement('div');
  a.className = `tile tile--skeleton${size ? ` tile--${size}` : ''}`;
  a.setAttribute('aria-hidden', 'true');
  a.innerHTML = `
    <div class="tile__media tile__media--skeleton"></div>
    <div class="tile__overlay tile__overlay--skeleton">
      <div class="sk-line"></div>
      <div class="sk-line sk-line--short"></div>
    </div>
  `;
  return a;
}

// Pre-carga una imagen y devuelve el <img> listo para reusar
function preloadImage(src, alt = '') {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.className = 'tile__img';
    img.alt = alt;
    img.decoding = 'async';
    img.loading = 'eager';            // importante: queremos que cargue ya
    img.referrerPolicy = 'no-referrer';

    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Monta skeleton interno + (si carga) <img> dentro del media
function mountCoverInto(mediaEl, imgOrNull) {
  // Añade skeleton interno para el fade-in
  const sk = document.createElement('div');
  sk.className = 'tile__media--skeleton';
  mediaEl.appendChild(sk);

  if (imgOrNull) {
    // Imagen lista: insértala y quita skeleton
    mediaEl.appendChild(imgOrNull);
    if (sk.parentNode === mediaEl) sk.remove();
    mediaEl.classList.add('is-loaded');
  } else {
    // Si no hay imagen (falló), dejamos el skeleton como fallback
    sk.classList.add('is-error');
  }
}

function createTile(project, preparedImg) {
  const { title, url, cover, brandLabel, slug, size } = project;

  const a = document.createElement('a');
  a.href   = url || '#';
  a.target = url ? '_blank' : '_self';
  a.rel    = url ? 'noopener noreferrer' : '';
  a.className = `tile${size ? ` tile--${size}` : ''}`;
  if (slug) a.dataset.slug = slug;

  const media = document.createElement('div');
  media.className = 'tile__media';

  // Monta portada con la imagen ya pre-cargada (o fallback)
  mountCoverInto(media, preparedImg);

  const overlay = document.createElement('div');
  overlay.className = 'tile__overlay';
  overlay.innerHTML = `<h3 class="tile__title">${title ?? ''}</h3>`;

  const badge = document.createElement('span');
  badge.className = 'tile__brand-badge';
  if (brandLabel) badge.textContent = brandLabel;

  a.append(media, overlay, badge);

  // Abrir lightbox (si lo usas); evita meta-click
  a.addEventListener('click', (e) => {
    const metaClick = e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1;
    if (metaClick) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-lightbox', { detail: { project } }));
  });

  return a;
}

function uniqueCategories(projects) {
  return [...new Set(projects.map(p => p.category).filter(Boolean))];
}

function buildFilters(container, categories, onChange) {
  container.innerHTML = '';

  const mkBtn = (label, val, active = false) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `gf-btn${active ? ' is-active' : ''}`;
    btn.textContent = label;
    btn.dataset.filter = val;
    return btn;
  };

  container.appendChild(mkBtn('Todo', 'all', true));
  categories.forEach(cat => container.appendChild(mkBtn(cat, cat)));

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.gf-btn');
    if (!btn || btn.classList.contains('is-active')) return;

    qsa('.gf-btn', container).forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    onChange(btn.dataset.filter);
  });
}

// ---------- Render secuencial (espera la portada de cada tile) ----------
async function renderSequential(gridEl, projects) {
  // Cancela cualquier render en curso
  const run = ++__renderToken;
  cancelPendingTimers();
  gridEl.innerHTML = '';

  for (let i = 0; i < projects.length; i++) {
    if (run !== __renderToken) return; // cancelado

    const p = projects[i];
    const skeleton = createSkeleton(p.size);
    gridEl.appendChild(skeleton);

    // Pre-carga la portada
    const img = await preloadImage(p.cover, p.title || '');

    if (run !== __renderToken) return; // cancelado durante la espera

    // Crea tile reusando la imagen cargada (o fallback si null)
    const tile = createTile(p, img);

    // Reemplaza skeleton solo si sigue en el grid
    if (skeleton.parentNode === gridEl) {
      gridEl.replaceChild(tile, skeleton);
    }

    // Pequeño respiro para percibir el efecto "uno a uno"
    await new Promise((res) => {
      const t = setTimeout(res, 70);
      __timers.add(t);
    });
  }
}

// ---------- Init ----------
export async function initGallery() {
  const grid = qs('#galleryGrid') || qs('.gallery-grid');
  if (!grid) return;

  let data = [];
  try {
    const res = await fetch(PROJECTS_URL, { cache: 'no-store' });
    data = await res.json();
  } catch (e) {
    console.error('Error cargando projects.json', e);
    return;
  }

  // Sanitiza, filtra visibles y normaliza arrays
  const projects = data
    .filter(p => p && p.visible !== false)
    .map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
      videos: Array.isArray(p.videos) ? p.videos : [],
    }));

  // Filtros por categoría (si existe el contenedor)
  const filtersWrap = qs('#galleryFilters');
  if (filtersWrap) {
    const cats = uniqueCategories(projects);
    buildFilters(filtersWrap, cats, (filter) => {
      const list = filter === 'all' ? projects : projects.filter(p => p.category === filter);
      renderSequential(grid, list);
    });
  }

  // Primer render
  renderSequential(grid, projects);
}

// Auto-init si se importa directamente desde main.js
document.addEventListener('DOMContentLoaded', initGallery);
