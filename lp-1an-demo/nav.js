/* =========================================================
   1案統合版LP 共通JS（第2版）
   ①ハンバーガー開閉 ②スクロール連動アニメーション ③全幅はみ出しスライダー
   外部ライブラリ不使用。いずれも失敗しても内容が消えないよう組んでいる。
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ① ハンバーガー ----------
     開閉クラス名 .open は style.css の .site-nav.open と一致させること。 */
  var btn = document.querySelector('.hamburger');
  var nav = document.querySelector('.site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- ② スクロール連動アニメーション ---------- */
  var targets = document.querySelectorAll('.reveal');
  function showAll() {
    for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-in');
  }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
      for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
    } catch (err) {
      showAll();
    }
  }

  /* ---------- ③ 全幅はみ出しスライダー ----------
     中央のスライドを画面中央に寄せ、左右の隣スライドを覗かせる（peek）。
     トラックの左右パディングが (100% - スライド幅)/2 なので、
     1枚目・最終枚でも端に不自然な余白が出ない。
     位置は実測（offsetLeft / offsetWidth）から出すため、
     スライド幅やgapをCSS側で変えてもJSの修正は要らない。 */
  var track = document.getElementById('sliderTrack');
  var dotsBox = document.getElementById('sliderDots');
  if (!track) return;

  var viewport = track.parentElement;
  var slides = Array.prototype.slice.call(track.children);
  var total = slides.length;
  if (total < 2) return;

  var index = 0;
  var timer = null;
  var INTERVAL = 5000;

  var dots = [];
  if (dotsBox) {
    slides.forEach(function (_, k) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', (k + 1) + '枚目を表示');
      d.addEventListener('click', function () { go(k); restart(); });
      dotsBox.appendChild(d);
      dots.push(d);
    });
  }

  function go(n) {
    index = (n + total) % total;
    var s = slides[index];
    // スライドの中心を viewport の中心に合わせる
    var x = s.offsetLeft + s.offsetWidth / 2 - viewport.clientWidth / 2;
    track.style.transform = 'translateX(' + (-x) + 'px)';
    slides.forEach(function (el, i) { el.classList.toggle('is-current', i === index); });
    dots.forEach(function (el, i) {
      el.classList.toggle('active', i === index);
      el.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }
  function next() { go(index + 1); }
  function prev() { go(index - 1); }

  function start() { if (!reduce && !timer) timer = setInterval(next, INTERVAL); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); start(); }

  var btnPrev = document.querySelector('.slider-btn.prev');
  var btnNext = document.querySelector('.slider-btn.next');
  if (btnPrev) btnPrev.addEventListener('click', function () { prev(); restart(); });
  if (btnNext) btnNext.addEventListener('click', function () { next(); restart(); });

  var slider = document.querySelector('.slider');
  if (slider) {
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
  }

  // スワイプ（横移動が縦より大きいときだけ反応させ、縦スクロールを妨げない）
  var x0 = null, y0 = null;
  track.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; stop();
  }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    var dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); }
    x0 = y0 = null;
    start();
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  // 幅が変わるとスライド幅（vw基準）も変わるので、位置を測り直す
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var keep = track.style.transition;
      track.style.transition = 'none';   // リサイズ中はアニメーションさせない
      go(index);
      void track.offsetWidth;            // 反映させてから transition を戻す
      track.style.transition = keep;
    }, 150);
  });

  // 画像の読み込みで幅が確定してからもう一度合わせる
  window.addEventListener('load', function () { go(index); });

  go(0);
  start();
})();
