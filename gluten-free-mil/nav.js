// Gluten-Free mil: ナビは最小構成（アンカー＋追従CTAのみ）のためハンバーガーなし。
// ヘッダーメニューを追加する場合は .hamburger / .site-nav.open の対を必ず実装すること。
(function(){
  var btn=document.querySelector('.hamburger'), nav=document.querySelector('.site-nav');
  if(btn&&nav){btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open);});}
})();
