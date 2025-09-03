// Galería (Bento) con JSON externo, filtros por categoría (sin marcas),
// hash routing #galeria/<cat>, skeleton y carga secuencial. Sin dependencias.

(() => {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const galleryGrid = qs('#galleryGrid');
  if (!galleryGrid) return;

  const jsonURL = `${import.meta.env.BASE_URL}data/projects.json`;

  const gallerySection = galleryGrid.closest('#galeria');
  const sectionHead    = gallerySection?.querySelector('.section-head');

  const CATEGORIES = [
    { slug: 'all',        label: 'Todos' },
    { slug: 'branding',   label: 'Branding' },
    { slug: 'web',        label: 'Web/App' },
    { slug: 'social',     label: 'Social Media' },
    { slug: 'packaging',  label: 'Packaging' },
    { slug: 'editorial',  label: 'Editorial' },
    { slug: 'publicidad', label: 'Publicidad' }
  ];

  let ALL = [];
  let activeCategory = 'all';

  // ----- HASH: #galeria/<cat> (soporta viejo /<cat>/<brand>, ignorando la marca)
  const parseHash = () => {
    const h = window.location.hash || '';
    const m = h.match(/^#galeria(?:\/([a-z-]+))?(?:\/[a-z0-9-]+)?$/i);
    const cat = m?.[1] || 'all';
    return { cat };
  };
  const updateHash = (cat) => {
    const base = '#galeria';
    const c = cat && cat !== 'all' ? `/${cat}` : '';
    const next = `${base}${c}`;
    if (window.location.hash !== next) window.location.hash = next;
  };

  // ----- UI builders
  const buildChips = (items, activeSlug, onClick) => {
    const wrap = document.createElement('div');
    wrap.className = 'gallery-filters';
    wrap.setAttribute('role', 'toolbar');
    wrap.setAttribute('aria-label', 'Filtrar por categoría');

    items.forEach(it => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `chip ${it.slug === activeSlug ? 'is-active' : ''}`;
      btn.textContent = it.label;
      btn.dataset.slug = it.slug;
      btn.setAttribute('aria-pressed', String(it.slug === activeSlug));
      btn.addEventListener('click', () => onClick(it.slug));
      wrap.appendChild(btn);
    });
    return wrap;
  };

  const brandText = (p) => p.brandLabel || (p.brand ? p.brand.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  const buildTile = (p) => {
    const a = document.createElement('a');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow';
    a.className = `tile${p.size ? ` tile--${p.size}` : ''} is-loading`;
    a.setAttribute('aria-label', p.title);
    a.dataset.brand = p.brand || '';

    const badge = document.createElement('span');
    badge.className = 'tile-badge';
    badge.textContent = brandText(p);
    if (!badge.textContent) badge.classList.add('is-hidden');

    const img = document.createElement('img');
    img.alt = p.title;
    img.decoding = 'async';
    img.dataset.src = p.image; // se setea luego (carga secuencial)

    const overlay = document.createElement('div');
    overlay.className = 'tile-overlay';
    overlay.innerHTML = `<h3 class="tile-title">${p.title}</h3>`;

    a.append(badge, img, overlay);
    return a;
  };

  // ----- Carga secuencial
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const SEQ_DELAY = 120;

  const sequentialLoad = async (tiles) => {
    for (const tile of tiles) {
      const img = tile.querySelector('img');
      const src = img?.dataset?.src;
      if (!img || !src) continue;

      const done = new Promise((resolve) => {
        const cleanup = () => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        };
        const onLoad = () => {
          tile.classList.remove('is-loading');
          tile.classList.add('is-loaded');
          cleanup(); resolve();
        };
        const onError = () => { tile.remove(); cleanup(); resolve(); };
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
        img.src = src; // dispara descarga de ESTA imagen
      });

      await done;
      await delay(SEQ_DELAY);

      if (document.hidden) {
        await new Promise(res => {
          const resume = () => { document.removeEventListener('visibilitychange', resume); res(); };
          document.addEventListener('visibilitychange', resume, { once: true });
        });
      }
    }
  };

  // ----- Chips estado
  const setActiveChip = (container, slug) => {
    container?.querySelectorAll('.chip').forEach(b => {
      const is = b.dataset.slug === slug;
      b.classList.toggle('is-active', is);
      b.setAttribute('aria-pressed', String(is));
    });
  };

  // ----- Render
  const render = (catSlug = activeCategory) => {
    activeCategory = catSlug;

    const items = ALL.filter(p => (catSlug === 'all') || (p.category === catSlug));

    const frag = document.createDocumentFragment();
    items
      .slice()
      .sort((a, b) => {
        const w = (x) => x.size === 'xl' ? 2 : x.size === 'wide' ? 1 : 0;
        return w(b) - w(a);
      })
      .forEach(p => frag.appendChild(buildTile(p)));

    galleryGrid.innerHTML = '';
    galleryGrid.appendChild(frag);

    const tiles = qsa('.tile', galleryGrid);
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.disconnect();
            sequentialLoad(tiles);
          }
        });
      }, { rootMargin: '0px 0px -20% 0px' });
      obs.observe(galleryGrid);
    } else {
      sequentialLoad(tiles);
    }
  };

  // ----- Init
  const hydrate = async () => {
    try {
      const res = await fetch(jsonURL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('JSON inválido');

      // Soporta ?previewHidden=1 para ver también los ocultos
      const previewHidden = new URLSearchParams(location.search).has('previewHidden');
      ALL = (previewHidden ? json : json.filter(p => p.visible !== false)).slice();

      const { cat } = parseHash();
      activeCategory = CATEGORIES.some(c => c.slug === cat) ? cat : 'all';

      // Filtros (solo categorías)
      const catsUI = buildChips(CATEGORIES, activeCategory, (slug) => {
        activeCategory = slug;
        updateHash(activeCategory);
        render(activeCategory);
        setActiveChip(catsUI, activeCategory);
      });

      // Inserta bajo el header de sección
      if (sectionHead?.parentNode) {
        sectionHead.parentNode.insertBefore(catsUI, sectionHead.nextSibling);
      } else {
        gallerySection?.prepend(catsUI);
      }

      render(activeCategory);

      window.addEventListener('hashchange', () => {
        const { cat: c } = parseHash();
        activeCategory = CATEGORIES.some(x => x.slug === c) ? c : 'all';
        render(activeCategory);
        setActiveChip(qs('.gallery-filters'), activeCategory);
      });
    } catch (e) {
      console.error('[Galería] Error al cargar JSON', e);
      galleryGrid.innerHTML = `<p class="muted">No se pudo cargar la galería.</p>`;
    }
  };

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
})();
