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
