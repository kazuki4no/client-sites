// BeeHappy LP 共通スクリプト
(function () {
  // ページ内アンカーをスムーススクロール（ヘッダー分オフセット）
  var header = document.querySelector('.site-header');
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = header ? header.offsetHeight : 0;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset + 1;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
