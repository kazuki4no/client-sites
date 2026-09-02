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

/* =========================================================
   ④ カウントアップ＋グラフ描画（広告LP用・2026-09-02）
   数字はHTMLに最終値を書いてあり、JSは上書きで演出するだけ。
   JSが落ちても最終値がそのまま見える（実績が0のままになる事故を防ぐ）。
   画面に入った1回だけ発火。reduced-motion時は何もしない（=最終値表示）。
   ========================================================= */
(function () {
  'use strict';
  var reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* グラフ：.graph-box に .is-in を付けるだけ（アニメはCSS側） */
  var graphs = document.querySelectorAll('.graph-box');
  var nums = document.querySelectorAll('.stat .num[data-count]');
  if (!graphs.length && !nums.length) return;

  function fmt(n) { return n.toLocaleString('ja-JP'); }

  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!target || reduce) { el.textContent = fmt(target || 0) || el.textContent; return; }
    var dur = 1200;
    var t0 = null;
    function tick(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (reduce || !('IntersectionObserver' in window)) {
    for (var g = 0; g < graphs.length; g++) graphs[g].classList.add('is-in');
    return; /* 数字はHTMLの最終値のまま */
  }
  try {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('graph-box')) el.classList.add('is-in');
        else runCount(el);
        io2.unobserve(el);
      });
    }, { threshold: 0.4 });
    var i;
    for (i = 0; i < graphs.length; i++) io2.observe(graphs[i]);
    for (i = 0; i < nums.length; i++) io2.observe(nums[i]);
  } catch (err) {
    for (var k = 0; k < graphs.length; k++) graphs[k].classList.add('is-in');
  }
})();

/* =========================================================
   ⑤ ヘッダーのスクロール連動（現在地の下線・2026-09-02追加）
   ナビの href="#id" とセクションを突き合わせ、画面中央付近にある
   セクションのリンクへ .active を付ける。失敗しても飾りが消えるだけ。
   ========================================================= */
(function () {
  'use strict';
  var links = document.querySelectorAll('.site-nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  var sections = [];
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var sec = document.getElementById(id);
    if (sec) { map[id] = a; sections.push(sec); }
  });
  if (!sections.length) return;
  function setActive(id) {
    links.forEach(function (a) { a.classList.remove('active'); });
    if (id && map[id]) map[id].classList.add('active');
  }
  try {
    var inview = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inview[e.target.id] = e.isIntersecting; });
      // いま帯に入っているものが無ければ下線を消す（最上部で前回の下線が残る問題の対策）
      var current = null;
      sections.forEach(function (s) { if (inview[s.id]) current = current || s.id; });
      setActive(current);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  } catch (err) { /* 飾りなので何もしない */ }
})();
