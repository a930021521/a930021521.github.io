/* SNOWMODE resort coverflow carousel */
(function(){
  var root=document.getElementById('rc'); if(!root) return;
  var Y='ECHIGO-YUZAWA', H='HOKKAIDO';
  var R=[
    {g:'yz',r:Y,n:'岩原',en:'IWAPPARA',d:'谷川連峰景觀前的寬闊主坡，循序進階的理想場地。',t:'主坡最寬約 200 公尺',img:'iwappara',v:'岩原'},
    {g:'yz',r:Y,n:'中里',en:'YUZAWA NAKAZATO',d:'與 JR 越後中里站直結，下車即是雪場。',t:'車站直結',img:'nakazato',v:'中里'},
    {g:'yz',r:Y,n:'苗場',en:'NAEBA',d:'緊鄰苗場王子大飯店的大型山域，從入門坡到世界盃賽道。',t:'世界盃賽道',img:'naeba',v:'苗場'},
    {g:'yz',r:Y,n:'神樂',en:'KAGURA',d:'かぐら・みつまた・田代三大區域組成的大型山域，雪季長、標高差大。',t:'三大區域',img:'kagura',v:'神樂'},
    {g:'yz',r:Y,n:'神立',en:'KANDATSU',d:'距車站 7 分鐘、100% 天然雪的機動型雪場。',t:'100% 天然雪',img:'kandatsu',v:'神立'},
    {g:'yz',r:Y,n:'石打丸山',en:'ISHIUCHI MARUYAMA',d:'規模完整的大型雪場，整備雪道、樹林與夜滑一次涵蓋。',t:'樹林・夜滑',img:'ishiuchi',v:'石打丸山'},
    {g:'hk',r:H+' · NISEKO',n:'二世古',en:'NISEKO UNITED',d:'安努普利山山腳的四座雪場，統稱 Niseko United。',t:'四座雪場',img:'niseko',v:'北海道・二世古'},
    {g:'hk',r:H+' · RUSUTSU',n:'留壽都',en:'RUSUTSU RESORT',d:'羊蹄山東南側的大型度假村，三座山頭。',t:'三座山頭',img:'rusutsu',v:'北海道・留壽都'},
    {g:'hk',r:H+' · FURANO',n:'富良野',en:'FURANO',d:'十勝岳景觀前的寬闊雪場，以盆地粉雪聞名。',t:'盆地粉雪',img:'furano',v:'北海道・富良野'},
    {g:'hk',r:H+' · TOMAMU',n:'星野',en:'HOSHINO RESORTS TOMAMU',d:'住宿與雪場同在一處的度假村，從入門坡到上級粉雪區都有。',t:'住宿與雪場一處',img:'tomamu',v:'北海道・星野'},
    {g:'hk',r:H+' · SAPPORO',n:'札幌國際',en:'SAPPORO KOKUSAI',d:'距札幌市中心約 60 分鐘車程，100% 天然雪的雪場。',t:'札幌當日往返',img:'sapporo-kokusai',v:'北海道・札幌國際',p:'prices-sapporo'},
    {g:'hk',r:H+' · SAPPORO',n:'手稻',en:'SAPPORO TEINE',d:'1972 年札幌冬季奧運高山滑雪會場，距札幌市區約 15 公里。',t:'1972 冬奧會場',img:'teine',v:'北海道・手稻'}
  ];
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=root.querySelector('.rc-track'), dotsEl=root.querySelector('.rc-dots'), count=root.querySelector('.rc-count'), stage=root.querySelector('.rc-stage'), live=root.querySelector('.rc-live');
  var cards=R.map(function(o,i){
    var li=document.createElement('li'); li.className='rc-card'; li.setAttribute('aria-roledescription','slide');
    li.setAttribute('aria-label',o.n+'（'+(i+1)+'／'+R.length+'）');
    var price=o.p||(o.g==='yz'?'prices-yuzawa':'prices-hokkaido');
    li.innerHTML='<div class="rc-bg" style="background-image:url(img/maps/'+o.img+'-sm.webp)"></div><div class="rc-body"><p class="rc-region">'+o.r+'</p><h4 class="rc-name">'+o.n+'<small>'+o.en+'</small></h4><p class="rc-desc">'+o.d+'</p><span class="rc-tag">'+o.t+'</span><div class="rc-btns"><a class="rc-price" href="#'+price+'">看課程費用</a><a class="rc-book" href="#booking" data-resort="'+o.v+'">預約</a></div></div>';
    track.appendChild(li); return li;
  });
  var filter='all', list=[], idx=0;
  function vis(){return R.map(function(o,i){return i}).filter(function(i){return filter==='all'||R[i].g===filter})}
  function render(){
    var mobile=innerWidth<=640, gap=mobile?150:230;
    list.forEach(function(ci,k){
      var c=cards[ci], off=k-idx, a=Math.abs(off);
      c.hidden=false;
      var x=off*gap*(a>1?0.82:1), rot=off===0?0:(off<0?42:-42), z=-a*160;
      c.style.transform='translateX('+x+'px) translateZ('+z+'px) rotateY('+rot+'deg)';
      c.style.zIndex=100-a; c.style.opacity=a>3?0:(a===0?1:1-a*0.2);
      c.style.filter=a?'brightness('+(1-a*0.18)+')':'none';
      c.style.pointerEvents=a>3?'none':'';
      c.classList.toggle('is-active',a===0);
      c.setAttribute('aria-hidden',a?'true':'false');
      c.querySelectorAll('a').forEach(function(l){l.tabIndex=a?-1:0});
    });
    cards.forEach(function(c,ci){if(list.indexOf(ci)<0){c.hidden=true;c.classList.remove('is-active')}});
    var cur=R[list[idx]];
    count.innerHTML=cur.n+' '+cur.en.split(' ')[0]+'<b>'+(idx+1)+'／'+list.length+'</b>';
    dotsEl.querySelectorAll('.rc-dot').forEach(function(d,k){d.setAttribute('aria-current',k===idx?'true':'false')});
    if(live) live.textContent=cur.n+'，第 '+(idx+1)+' 個，共 '+list.length+' 個';
  }
  function build(){
    list=vis(); idx=Math.min(idx,list.length-1); dotsEl.innerHTML='';
    list.forEach(function(ci,k){var b=document.createElement('button');b.type='button';b.className='rc-dot';b.setAttribute('aria-label','前往 '+R[ci].n);b.onclick=function(){go(k)};dotsEl.appendChild(b)});
    render();
  }
  function go(k){idx=(k+list.length)%list.length;render()}
  root.querySelector('.rc-prev').onclick=function(){go(idx-1)};
  root.querySelector('.rc-next').onclick=function(){go(idx+1)};
  root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){go(idx-1);e.preventDefault()}else if(e.key==='ArrowRight'){go(idx+1);e.preventDefault()}});
  root.querySelectorAll('.rc-pill').forEach(function(p){p.onclick=function(){
    root.querySelectorAll('.rc-pill').forEach(function(q){q.setAttribute('aria-pressed',q===p?'true':'false')});
    filter=p.dataset.f; idx=0; build();
  }});
  cards.forEach(function(c){c.addEventListener('click',function(e){var k=list.indexOf(cards.indexOf(c));if(k!==idx){e.preventDefault();go(k)}})});
  // drag / swipe
  var sx=null, sy=0, moved=false;
  stage.addEventListener('pointerdown',function(e){if(e.target.closest('a,button'))return;sx=e.clientX;sy=e.clientY;moved=false;stage.classList.add('drag')});
  window.addEventListener('pointermove',function(e){if(sx!==null&&Math.abs(e.clientX-sx)>8)moved=true});
  window.addEventListener('pointerup',function(e){if(sx===null)return;var dx=e.clientX-sx;stage.classList.remove('drag');if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(e.clientY-sy)){go(idx+(dx<0?1:-1))}sx=null});
  stage.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  // booking preselect
  root.addEventListener('click',function(e){
    var a=e.target.closest('.rc-book'); if(!a) return;
    var s=document.querySelector('#book-form select[name="resort"]');
    if(s){s.value=a.dataset.resort;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}
  });
  addEventListener('resize',render);
  if(reduce) root.classList.add('rc-reduce');
  build();
})();
