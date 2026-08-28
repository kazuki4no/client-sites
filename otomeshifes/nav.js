// LP はナビ最小（アンカー＋追従CTA中心）のためハンバーガー不要。
// ヘッダーにメニューを追加する場合は .hamburger / .site-nav.open の対を必ず実装する。
(function(){
  var btn=document.querySelector('.hamburger'), nav=document.querySelector('.site-nav');
  if(btn&&nav){btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open);});}
})();
