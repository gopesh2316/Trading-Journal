// Basic enhancements: theme toggle, mobile menu, year
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.remove('no-js');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle using a 'light' class on body
  const btn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');

  btn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Mobile menu
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('show');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});
