// main.js — Artífices (overlay móvil, scroll-lock, focus trap, tema, etc.)
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

      body.classList.add('menu-open');
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
      setMenuAria(!hidden);
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
  });
})();
