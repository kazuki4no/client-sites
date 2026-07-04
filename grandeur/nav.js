document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var header = document.querySelector('.site-header');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) header.classList.remove('open');
    });
  }
});
