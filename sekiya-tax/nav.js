// LPはアンカー導線のみ。ハンバーガーを置く場合の開閉ガード（クラス名 .open は style.css と一致させる）
(function(){
  var btn=document.querySelector('.hamburger'), nav=document.querySelector('.site-nav');
  if(btn&&nav){btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',open);});}
})();

// スクロール連動フェードイン＋事務所写真スライダー（JS無効時はすべて通常表示）
(function(){
  document.documentElement.classList.add('js');
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && els.length){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
      });
    },{threshold:.16});
    els.forEach(function(el){io.observe(el);});
  }else{
    els.forEach(function(el){el.classList.add('in');});
  }
  document.querySelectorAll('.slider').forEach(function(sl){
    var slides=sl.querySelectorAll('.slide'), dots=sl.querySelectorAll('.dot'), i=0, n=slides.length;
    if(n<2) return;
    function go(k){
      slides[i].classList.remove('on'); if(dots[i])dots[i].classList.remove('on');
      i=(k+n)%n;
      slides[i].classList.add('on'); if(dots[i])dots[i].classList.add('on');
    }
    var t=setInterval(function(){go(i+1);},4200);
    dots.forEach(function(d,k){d.addEventListener('click',function(){clearInterval(t);go(k);});});
  });
})();
