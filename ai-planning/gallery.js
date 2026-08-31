// 実績写真ライトボックス
// カード（.work-card[data-gallery]）をクリックすると、その案件の全写真を閲覧できる
(function () {
  var lb = document.getElementById('lightbox');
  if (!lb) return;
  var img = document.getElementById('lb-img');
  var titleEl = document.getElementById('lb-title');
  var counterEl = document.getElementById('lb-counter');
  var current = { path: '', count: 0, index: 1, title: '' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function show(i) {
    current.index = ((i - 1 + current.count) % current.count) + 1; // ループ
    img.src = current.path + '/' + pad(current.index) + '.jpg';
    img.alt = current.title + ' 写真' + current.index;
    counterEl.textContent = current.index + ' / ' + current.count;
    // 前後の写真を先読み
    [current.index % current.count + 1,
     (current.index - 2 + current.count) % current.count + 1].forEach(function (n) {
      new Image().src = current.path + '/' + pad(n) + '.jpg';
    });
  }

  function open(card) {
    current.path = card.getAttribute('data-gallery').indexOf('images/') === 0
      ? card.getAttribute('data-gallery')
      : 'images/works/' + card.getAttribute('data-gallery');
    current.count = parseInt(card.getAttribute('data-count'), 10) || 1;
    current.title = card.getAttribute('data-title') || '';
    titleEl.textContent = current.title;
    lb.classList.toggle('single', current.count <= 1);
    show(1);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.src = '';
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.work-card[data-gallery]');
    if (card) { open(card); return; }
    if (!lb.classList.contains('open')) return;
    if (e.target.closest('.lb-prev')) { show(current.index - 1); return; }
    if (e.target.closest('.lb-next')) { show(current.index + 1); return; }
    if (e.target.closest('.lb-close') || e.target === lb) { close(); }
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current.index - 1);
    if (e.key === 'ArrowRight') show(current.index + 1);
  });

  // スマホ：スワイプで前後送り
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current.index + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });
})();
