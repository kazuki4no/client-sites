/* =========================================================
   1案統合版LP 共通JS
   ①ハンバーガー開閉 ②スクロール連動アニメーション ③スライダー
   外部ライブラリ不使用。いずれも失敗しても内容が消えないよう組んでいる。
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ① ハンバーガー ----------
     開閉クラス名 .open は style.css の .site-nav.open と一致させること。
     ズレると押しても無反応になる（LP制作ルールの必須不変条件）。 */
  var btn = document.querySelector('.hamburger');
  var nav = document.querySelector('.site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    // アンカーを押したらメニューを閉じる（1枚もののLPなので必須）
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- ② スクロール連動アニメーション ----------
     IntersectionObserver 非対応・例外時は全要素を可視にして終わる。 */
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

  /* ---------- ③ スライダー ---------- */
  var track = document.getElementById('sliderTrack');
  var dotsBox = document.getElementById('sliderDots');
  if (!track) return;

  var slides = track.children;
  var total = slides.length;
  if (total < 2) return;

  var index = 0;
  var timer = null;
  var INTERVAL = 5000;

  // ドットを枚数ぶん生成
  var dots = [];
  if (dotsBox) {
    for (var k = 0; k < total; k++) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', (k + 1) + '枚目を表示');
      (function (n) {
        d.addEventListener('click', function () { go(n); restart(); });
      })(k);
      dotsBox.appendChild(d);
      dots.push(d);
    }
  }

  function go(n) {
    index = (n + total) % total;
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === index);
      dots[i].setAttribute('aria-current', i === index ? 'true' : 'false');
    }
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

  // マウス・キーボード操作中は自動送りを止める
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

  // タブを離れている間は動かさない
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });

  go(0);
  start();
})();
