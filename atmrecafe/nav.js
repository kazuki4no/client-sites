(function(){
  var btn=document.querySelector('.hamburger'),nav=document.querySelector('.site-nav');
  if(btn&&nav){btn.addEventListener('click',function(){
    var open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open);});
  }
})();
