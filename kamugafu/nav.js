(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (nav) nav.classList.remove('open');
      var offset = header ? header.offsetHeight : 0;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
