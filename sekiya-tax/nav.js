// LPはアンカー導線のみ。ハンバーガーを置く場合の開閉ガード（クラス名 .open は style.css と一致させる）
(function(){
  var btn=document.querySelector('.hamburger'), nav=document.querySelector('.site-nav');
  if(btn&&nav){btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open);});}
})();
