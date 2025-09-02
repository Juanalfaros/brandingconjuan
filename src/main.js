document.addEventListener('DOMContentLoaded', () => {
  // --- Mobile Menu ---
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuOpenIcon = document.getElementById('menu-open-icon');
  const menuCloseIcon = document.getElementById('menu-close-icon');

  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
      mobileMenuButton.setAttribute('aria-expanded', String(!isExpanded));
      mobileMenu.classList.toggle('is-hidden');
      menuOpenIcon.classList.toggle('is-hidden');
      menuCloseIcon.classList.toggle('is-hidden');
    });
  }

  // Close mobile menu when clicking a link
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (!mobileMenu.classList.contains('is-hidden')) mobileMenuButton.click();
    });
  });

  // --- Contact Form ---
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if (name && email && message) {
        formStatus.textContent = '¡Gracias por tu mensaje! Me pondré en contacto contigo pronto.';
        formStatus.style.color = '#4ade80'; // verde
        contactForm.reset();
      } else {
        formStatus.textContent = 'Por favor, completa todos los campos requeridos.';
        formStatus.style.color = '#f87171'; // rojo
      }
      setTimeout(() => { formStatus.textContent = '' }, 5000);
    });
  }

  // --- Shrink header on scroll ---
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (window.scrollY > 50) header.classList.add('shrink');
    else header.classList.remove('shrink');
  };
  window.addEventListener('scroll', onScrollHeader);
  onScrollHeader();

  // --- Scroll Animations ---
  const scrollElements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  scrollElements.forEach(el => observer.observe(el));
});

// --- Theme Toggle (Light/Dark Mode) ---
const themeToggleButton = document.getElementById('theme-toggle');
const body = document.body;
const themeIconLight = document.getElementById('theme-icon-light');
const themeIconDark = document.getElementById('theme-icon-dark');

// Función para aplicar el tema y guardar la preferencia
const applyTheme = (theme) => {
  if (theme === 'light') {
    body.classList.add('light-mode');
    if (themeIconLight) themeIconLight.classList.add('is-hidden');
    if (themeIconDark) themeIconDark.classList.remove('is-hidden');
  } else {
    body.classList.remove('light-mode');
    if (themeIconLight) themeIconLight.classList.remove('is-hidden');
    if (themeIconDark) themeIconDark.classList.add('is-hidden');
  }
  localStorage.setItem('theme', theme);
};

// Cargar el tema guardado o detectar la preferencia del sistema
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Asegúrate de que el DOM esté cargado para manipular clases
document.addEventListener('DOMContentLoaded', () => {
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Event listener para el botón
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const isLight = body.classList.contains('light-mode');
      applyTheme(isLight ? 'dark' : 'light');
    });
  }
});
