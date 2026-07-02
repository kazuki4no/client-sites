// ハンバーガー開閉（全ページ共通）
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.nav-toggle');
  if (btn) {
    document.querySelector('.site-header').classList.toggle('open');
    return;
  }
  // メニュー内リンクを押したら閉じる
  if (e.target.closest('.nav-menu a')) {
    document.querySelector('.site-header').classList.remove('open');
  }
});
