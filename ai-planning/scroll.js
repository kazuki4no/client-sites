// スクロール連動演出（全ページ共通）
// 1) 要素のフェードイン  2) 重要フレーズのマーカー線引き  3) ヒーロー強調線
(function () {
  // ヒーローのマーカー線はページ読込後に発火
  window.addEventListener('load', function () {
    document.body.classList.add('loaded');
  });

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var reveals = document.querySelectorAll(
    '.section-head, .svc-card, .merit, .target, .law, .feat, .idea, ' +
    '.work-card, .col-post, .voice, .stat, .message-sec .inner, ' +
    '.photo-strip img, .info-table, .career-table, .req-table, .contact-cta'
  );
  reveals.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 4) * 0.04 + 's'; // 横並びカードのわずかな時間差
  });

  // マーカー線対象（.uline）は個別に監視（フェードとは独立して線が引かれる）
  var ulines = document.querySelectorAll('.uline');

  var all = Array.prototype.slice.call(reveals).concat(Array.prototype.slice.call(ulines));

  if (!('IntersectionObserver' in window)) {
    all.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 40px 0px' } // 画面下端に少し入る手前で発火);
  all.forEach(function (el) { io.observe(el); });
})();
