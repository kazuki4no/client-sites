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

  /* ---------- ③ 全幅はみ出しスライダー（無限ループ） ----------
     中央のスライドを画面中央に寄せ、左右の隣を覗かせる（peek）。
     🔴端で余白が出ないよう、実スライドの前後に「複製セット」を1組ずつ足して
     見た目を途切れさせない。端に達したらアニメーション無しで中央セットへ戻す（誰にも見えない）。
     位置は実測（offsetLeft / offsetWidth）で出すので、CSSでスライド幅やgapを変えてもJSは直さなくてよい。 */
  var track = document.getElementById('sliderTrack');
  var dotsBox = document.getElementById('sliderDots');
  if (!track) return;

  var viewport = track.parentElement;
  var real = Array.prototype.slice.call(track.children);
  var N = real.length;
  if (N < 2) return;

  // 前後に複製セットを足す（複製は支援技術から隠す）
  real.slice().reverse().forEach(function (s) {
    var c = s.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.removeAttribute('role');
    track.insertBefore(c, track.firstChild);
  });
  real.forEach(function (s) {
    var c = s.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.removeAttribute('role');
    track.appendChild(c);
  });

  var all = Array.prototype.slice.call(track.children); // 3N枚
  var pos = N;          // 中央セットの先頭＝実スライド0枚目
  var timer = null;
  var INTERVAL = 5000;
  var snapping = false;

  var dots = [];
  if (dotsBox) {
    real.forEach(function (_, k) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', (k + 1) + '枚目を表示');
      d.addEventListener('click', function () { goReal(k); restart(); });
      dotsBox.appendChild(d);
      dots.push(d);
    });
  }

  function place(animate) {
    var s = all[pos];
    var x = s.offsetLeft + s.offsetWidth / 2 - viewport.clientWidth / 2;
    if (!animate) track.style.transition = 'none';
    track.style.transform = 'translateX(' + (-x) + 'px)';
    if (!animate) { void track.offsetWidth; track.style.transition = ''; }
    var r = ((pos % N) + N) % N;
    all.forEach(function (el, i) { el.classList.toggle('is-current', i === pos); });
    dots.forEach(function (el, i) {
      el.classList.toggle('active', i === r);
      el.setAttribute('aria-current', i === r ? 'true' : 'false');
    });
  }

  // 端まで来たら、見た目が同じ中央セットの位置へ静かに戻す
  track.addEventListener('transitionend', function (e) {
    if (e.target !== track || e.propertyName !== 'transform') return;
    if (pos >= 2 * N) { pos -= N; place(false); }
    else if (pos < N) { pos += N; place(false); }
    snapping = false;
  });

  function step(d) {
    if (snapping) return;      // 連打で位置がずれないようにする
    snapping = true;
    pos += d;
    place(true);
    // transitionend が来ない環境（transitionが無効等）でも詰まらないための保険
    setTimeout(function () { snapping = false; }, 900);
  }
  function next() { step(1); }
  function prev() { step(-1); }

  // ドットから実インデックスへ移動（いまの位置から最短で回る）
  function goReal(k) {
    var cur = ((pos % N) + N) % N;
    var d = k - cur;
    if (d > N / 2) d -= N;
    if (d < -N / 2) d += N;
    if (d === 0) return;
    if (snapping) return;
    snapping = true;
    pos += d;
    place(true);
    setTimeout(function () { snapping = false; }, 900);
  }

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

  // 幅が変わるとスライド幅（vw基準）も変わるので測り直す
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { place(false); }, 150);
  });

  // 画像の読み込みで幅が確定してからもう一度合わせる
  window.addEventListener('load', function () { place(false); });

  place(false);
  start();
})();
