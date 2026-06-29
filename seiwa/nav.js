document.querySelectorAll('.menu-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const header = button.closest('.site-header');
    const open = header.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  });
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    const header = link.closest('.site-header');
    if (!header) return;
    header.classList.remove('is-open');
    header.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  });
});
