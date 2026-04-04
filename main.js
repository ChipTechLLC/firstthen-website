// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-inner')) {
    navLinks && navLinks.classList.remove('open');
  }
});

// Scroll reveal — auto-apply to key elements
const revealSelectors = [
  '.feature-card',
  '.value-card',
  '.product-card',
  '.pricing-card',
  '.story-text',
  '.story-quote',
  '.contact-text',
  '.contact-links',
  '.about-text',
  '.about-values',
];

document.querySelectorAll(revealSelectors.join(', ')).forEach((el, i) => {
  el.classList.add('reveal');
  const delay = i % 6;
  if (delay > 0) el.classList.add(`reveal-d${delay}`);
});

// Also reveal headings/eyebrows within sections (not the hero)
document.querySelectorAll('.features > .container > h2, .pricing > .container > h2, .screenshots > .container > h2').forEach(el => {
  el.classList.add('reveal');
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
