// さくら胃と腸のクリニック 共通スクリプト：ハンバーガーメニュー開閉
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (!header || !toggle) return;
  toggle.addEventListener('click', function () {
    header.classList.toggle('open');
  });
  // メニュー内リンクをタップしたら閉じる（スマホ）
  header.querySelectorAll('.nav-menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      header.classList.remove('open');
    });
  });
})();
