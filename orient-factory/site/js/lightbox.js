// 写真をクリックすると、別ウインドウではなくページ内で拡大表示する
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('a.zoom'));
  if (!links.length) return;
  var box = document.createElement('div');
  box.className = 'lb';
  box.innerHTML = '<button class="lb-x" aria-label="閉じる">×</button><button class="lb-prev" aria-label="前の写真">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="次の写真">›</button>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('figcaption'), i = 0;
  function show(n) {
    i = (n + links.length) % links.length;
    var a = links[i], t = a.parentNode.querySelector('h3'), d = a.parentNode.querySelector('time');
    img.src = a.getAttribute('href');
    cap.textContent = (d ? d.textContent + '　' : '') + (t ? t.textContent : '');
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() { box.classList.remove('open'); document.body.style.overflow = ''; }
  links.forEach(function (a, n) { a.addEventListener('click', function (e) { e.preventDefault(); show(n); }); });
  box.addEventListener('click', function (e) {
    if (e.target.classList.contains('lb-prev')) show(i - 1);
    else if (e.target.classList.contains('lb-next')) show(i + 1);
    else if (e.target !== img) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
  });
})();
