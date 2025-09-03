// main.js — Artífices (overlay móvil, scroll-lock, focus trap, tema, bento grid)
import './css/index.css';

(() => {
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {
    /* =========================================
       BASE
    ========================================= */
    const body     = document.body;
    const headerEl = qs('#header');

    /* =========================================
       MENÚ MÓVIL — overlay + scroll lock + focus trap
    ========================================= */
    const mobileMenuButton = qs('#mobile-menu-button');
    const mobileMenu       = qs('#mobile-menu');
    const menuOpenIcon     = qs('#menu-open-icon');
    const menuCloseIcon    = qs('#menu-close-icon');
    let lastFocused = null;

    const getFocusable = (root) =>
      root ? qsa('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])', root) : [];

    const setMenuAria = (isOpen) => {
      if (!mobileMenuButton || !mobileMenu) return;
      mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    };

    const openMenu = () => {
      if (!mobileMenu || !mobileMenuButton) return;
      lastFocused = document.activeElement;

      mobileMenu.classList.remove('is-hidden');
      requestAnimationFrame(() => mobileMenu.classList.add('open'));

      body.classList.add('menu-open'); // CSS: body.menu-open { overflow: hidden; }
      setMenuAria(true);

      if (menuOpenIcon)  menuOpenIcon.classList.add('is-hidden');
      if (menuCloseIcon) menuCloseIcon.classList.remove('is-hidden');

      const f = getFocusable(mobileMenu);
      if (f.length) f[0].focus();
    };

    const closeMenu = () => {
      if (!mobileMenu || !mobileMenuButton) return;

      mobileMenu.classList.remove('open');
      mobileMenu.addEventListener('transitionend', () => {
        mobileMenu.classList.add('is-hidden');
      }, { once: true });

      body.classList.remove('menu-open');
      setMenuAria(false);

      if (menuOpenIcon)  menuOpenIcon.classList.remove('is-hidden');
      if (menuCloseIcon) menuCloseIcon.classList.add('is-hidden');

      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    // Estado ARIA inicial coherente
    if (mobileMenu && mobileMenuButton) {
      const hidden = mobileMenu.classList.contains('is-hidden');
      setMenuAria(!hidden ? true : false); // hidden => aria-expanded=false / aria-hidden=true
    }

    // Toggle botón
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('open') && !mobileMenu.classList.contains('is-hidden');
        if (isOpen) closeMenu(); else openMenu();
      });

      // Cerrar al tocar un link del menú
      qsa('.mobile-nav-link', mobileMenu).forEach(link => {
        link.addEventListener('click', () => {
          if (mobileMenu.classList.contains('open')) closeMenu();
        });
      });

      // Cerrar tocando el fondo (backdrop)
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
          closeMenu();
        }
      });

      // Esc para cerrar + focus trap con Tab
      mobileMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeMenu();
        } else if (e.key === 'Tab') {
          const f = getFocusable(mobileMenu);
          if (!f.length) return;
          const first = f[0];
          const last  = f[f.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      });

      // Autocierre al pasar a desktop
      window.addEventListener('resize', () => {
        if (window.matchMedia('(min-width: 768px)').matches && !mobileMenu.classList.contains('is-hidden')) {
          closeMenu();
        }
      }, { passive: true });
    }

    /* =========================================
       FORMULARIO DE CONTACTO
    ========================================= */
    const contactForm = qs('#contactForm');
    const formStatus  = qs('#formStatus');

    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name    = qs('#name')?.value.trim();
        const email   = qs('#email')?.value.trim();
        const message = qs('#message')?.value.trim();

        if (name && email && message) {
          formStatus.textContent = '¡Gracias por tu mensaje! Me pondré en contacto contigo pronto.';
          formStatus.style.color = '#4ade80'; // verde
          contactForm.reset();
        } else {
          formStatus.textContent = 'Por favor, completa todos los campos requeridos.';
          formStatus.style.color = '#f87171'; // rojo
        }
        setTimeout(() => { formStatus.textContent = ''; }, 5000);
      });
    }

    /* =========================================
       HEADER shrink en scroll
    ========================================= */
    const onScrollHeader = () => {
      if (!headerEl) return;
      if (window.scrollY > 50) {
        headerEl.classList.add('shrink');
        body.classList.add('header-shrink');
      } else {
        headerEl.classList.remove('shrink');
        body.classList.remove('header-shrink');
      }
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    /* =========================================
       ANIMACIONES ON-SCROLL
    ========================================= */
    const scrollElements = qsa('.animate-on-scroll');
    if ('IntersectionObserver' in window && scrollElements.length) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      scrollElements.forEach(el => observer.observe(el));
    } else {
      scrollElements.forEach(el => el.classList.add('is-visible'));
    }

    /* =========================================
       THEME TOGGLE (Light/Dark) con persistencia
    ========================================= */
    const themeToggleButton = qs('#theme-toggle');
    const themeIconLight    = qs('#theme-icon-light');
    const themeIconDark     = qs('#theme-icon-dark');

    const applyTheme = (theme, persist = true) => {
      const isLight = theme === 'light';
      body.classList.toggle('light-mode', isLight);

      if (themeIconLight) themeIconLight.classList.toggle('is-hidden', isLight);
      if (themeIconDark)  themeIconDark.classList.toggle('is-hidden', !isLight);

      if (persist) localStorage.setItem('theme', theme);
    };

    const savedTheme = localStorage.getItem('theme');
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = prefersDarkQuery.matches ? 'dark' : 'light';

    // Aplica tema inicial
    applyTheme(savedTheme || systemTheme, Boolean(savedTheme));

    // Toggle manual
    if (themeToggleButton) {
      themeToggleButton.addEventListener('click', () => {
        const isLight = body.classList.contains('light-mode');
        applyTheme(isLight ? 'dark' : 'light', true);
      });
    }

    // Seguir cambios del sistema si no hay preferencia guardada
    if (!savedTheme && prefersDarkQuery?.addEventListener) {
      prefersDarkQuery.addEventListener('change', (e) => {
        applyTheme(e.matches ? 'dark' : 'light', false);
      });
    }

    // Sincroniza entre pestañas
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme' && e.newValue) applyTheme(e.newValue, false);
    });

/* =========================================
   BENTO GRID — Proyectos Behance (JSON externo, secuencial + skeleton)
========================================= */
const galleryGrid = qs('#galleryGrid');
if (galleryGrid) {
  const jsonURL = `${import.meta.env.BASE_URL}data/projects.json`; // soporta base en Vite

  const buildTile = (p) => {
    const a = document.createElement('a');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow';
    a.className = `tile${p.size ? ` tile--${p.size}` : ''} is-loading`;
    a.setAttribute('aria-label', p.title);

    const img = document.createElement('img');
    img.alt = p.title;
    img.decoding = 'async';
    img.dataset.src = p.image; // no asignamos src aún (secuencial)

    const overlay = document.createElement('div');
    overlay.className = 'tile-overlay';
    overlay.innerHTML = `<h3 class="tile-title">${p.title}</h3>`;

    a.append(img, overlay);
    return a;
  };

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const SEQUENTIAL_DELAY_MS = 120;

  const loadSequentially = async (tiles) => {
    for (const tile of tiles) {
      const img = tile.querySelector('img');
      const src = img?.dataset?.src;
      if (!img || !src) continue;

      const loadOne = new Promise((resolve) => {
        const cleanup = () => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        };
        const onLoad = () => {
          tile.classList.remove('is-loading');
          tile.classList.add('is-loaded');
          cleanup(); resolve();
        };
        const onError = () => {
          tile.remove();
          cleanup(); resolve();
        };
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
        img.src = src; // dispara la descarga de ESTA imagen
      });

      await loadOne;
      await delay(SEQUENTIAL_DELAY_MS);

      if (document.hidden) {
        await new Promise(res => {
          const resume = () => { document.removeEventListener('visibilitychange', resume); res(); };
          document.addEventListener('visibilitychange', resume, { once: true });
        });
      }
    }
  };

  const hydrate = async () => {
    try {
      const res = await fetch(jsonURL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const projects = await res.json();
      if (!Array.isArray(projects)) throw new Error('JSON inválido: se esperaba un array');

      // Render inicial con skeletons
      const frag = document.createDocumentFragment();
      projects.forEach(p => frag.appendChild(buildTile(p)));
      galleryGrid.innerHTML = ''; // por si existía contenido previo
      galleryGrid.appendChild(frag);

      const tiles = Array.from(galleryGrid.querySelectorAll('.tile'));

      // Cargar cuando la galería entre a viewport
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              obs.disconnect();
              loadSequentially(tiles);
            }
          });
        }, { rootMargin: '0px 0px -20% 0px' });
        obs.observe(galleryGrid);
      } else {
        loadSequentially(tiles);
      }
    } catch (err) {
      console.error('[Bento] No se pudo cargar projects.json', err);
      // Fallback UX: mensaje mínimo
      galleryGrid.innerHTML = `<p class="muted">No se pudo cargar la galería en este momento.</p>`;
    }
  };

  hydrate();
}



  });
})();
