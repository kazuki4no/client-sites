// スクロール連動フェードイン（shimizu-sds.jp風の軽量版・全ページ共通）
// 対象要素に .reveal を自動付与し、画面に入ったら .is-visible を付ける
(function () {
  // 動きを減らす設定のユーザーには適用しない
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var targets = document.querySelectorAll(
    '.section-head, .svc-card, .merit, .target, .law, .feat, .idea, ' +
    '.work-card, .col-post, .voice, .stat, .message-sec .inner, ' +
    '.photo-strip img, .info-table, .career-table, .req-table, .contact-cta'
  );

  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    // 同じ親内で並ぶカードは少しずつ遅らせて時間差で出す
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });

  if (!('IntersectionObserver' in window)) {
    // 古いブラウザではそのまま表示
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target); // 一度表示したら監視解除
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el) { io.observe(el); });
})();
