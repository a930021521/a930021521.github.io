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

  var CR={"iwappara": {"a": "Famifamifami", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Iwappara.jpg", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "nakazato": {"a": "Abasaa", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Yuzawa_Nakazato_Snow_Resort_on_5_January_2020.JPG", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "naeba": {"a": "Syced", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Naeba_ski_resort,_January_2026_(27332).jpg", "lu": "https://creativecommons.org/publicdomain/zero/1.0/"}, "kagura": {"a": "senngokujidai4434", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Kagura_Ski_Resort_(41113004182).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}, "kandatsu": {"a": "苗場山", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Kandatu.jpg", "lu": "https://creativecommons.org/licenses/by-sa/3.0/"}, "ishiuchi": {"a": "Syced", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Ishiuchi_skiing_resort_(32599).jpg", "lu": "https://creativecommons.org/publicdomain/zero/1.0/"}, "niseko": {"a": "Alisterio1010", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Niseko_United_Ski_Resort_in_Hokkaido_Japan.jpg", "lu": "https://creativecommons.org/licenses/by-sa/4.0/"}, "rusutsu": {"a": "alonfloc", "l": "CC BY 3.0", "u": "https://commons.wikimedia.org/wiki/File:%E3%83%AB%E3%82%B9%E3%83%84%E3%83%AA%E3%82%BE%E3%83%BC%E3%83%88_-_panoramio.jpg", "lu": "https://creativecommons.org/licenses/by/3.0/"}, "furano": {"a": "wakimasa", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Furano_Snow_Resort_view2.JPG", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "tomamu": {"a": "Masahiro TAKAGI", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Tomamu_ski_resort_01.jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}, "sapporo-kokusai": {"a": "MIKI Yoshihito", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:SAPPORO_KOKUSAI_ski_area._(16049261484).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}, "teine": {"a": "MIKI Yoshihito", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Sapporo_Teine_Ski_Resort._(31250544382).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}};
  function rnd(s){return function(){s=(s*9301+49297)%233280;return s/233280}}
  function ridge(r,y,amp,n,soft){var p='M0 '+y,step=600/n;for(var k=1;k<=n;k++){var x=k*step,yy=y-(r()*amp)+(k%2?0:amp*0.35);p+=soft?' Q'+(x-step/2).toFixed(0)+' '+(yy-amp*0.6).toFixed(0)+' '+x.toFixed(0)+' '+yy.toFixed(0):' L'+(x-step/2).toFixed(0)+' '+(yy-amp*0.7).toFixed(0)+' L'+x.toFixed(0)+' '+yy.toFixed(0)}return p}
  function bg(o,i){
    var hk=o.g==='hk', r=rnd(i*37+11), h=(hk?200:218)+((i%3)-1)*6, id='rcg'+i;
    var top='hsl('+h+',38%,'+(hk?30:26)+'%)', mid='hsl('+(h+6)+',34%,17%)', bot='hsl('+(h+10)+',40%,9%)';
    var s='<svg viewBox="0 0 600 440" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="'+top+'"/><stop offset=".55" stop-color="'+mid+'"/><stop offset="1" stop-color="'+bot+'"/></linearGradient><radialGradient id="'+id+'g" cx="'+(0.25+r()*0.5)+'" cy=".12" r=".6"><stop offset="0" stop-color="#cfe3f6" stop-opacity=".22"/><stop offset="1" stop-color="#cfe3f6" stop-opacity="0"/></radialGradient></defs><rect width="600" height="440" fill="url(#'+id+')"/><rect width="600" height="440" fill="url(#'+id+'g)"/>';
    if(hk&&(o.img==='niseko'||o.img==='rusutsu')){ // Mt Yotei cone
      var cx=380-r()*120; s+='<path d="M'+(cx-230)+' 300 Q'+(cx-90)+' 200 '+(cx-30)+' 112 L'+(cx+30)+' 112 Q'+(cx+90)+' 200 '+(cx+230)+' 300" fill="none" stroke="#dbe9f6" stroke-opacity=".25" stroke-width="1.4"/><path d="M'+(cx-30)+' 112 l14 18 l12 -8 l14 14 l20 -24" fill="none" stroke="#e8f2fb" stroke-opacity=".22" stroke-width="1.1"/>';
    }
    var lines=hk?[[250,60,5,1,.2],[290,40,7,1,.12],[330,30,9,1,.07]]:[[230,110,6,0,.2],[285,70,8,0,.12],[330,40,11,0,.07]];
    lines.forEach(function(L){s+='<path d="'+ridge(r,L[0],L[1],L[2],L[3])+'" fill="none" stroke="#d6e6f5" stroke-opacity="'+L[4]+'" stroke-width="1.4" stroke-linejoin="round"/>'});
    for(var k=0;k<18;k++)s+='<circle cx="'+(r()*600).toFixed(0)+'" cy="'+(r()*200).toFixed(0)+'" r="'+(0.6+r()*1.2).toFixed(1)+'" fill="#eaf3fb" opacity="'+(0.15+r()*0.35).toFixed(2)+'"/>';
    s+='<text x="570" y="60" text-anchor="end" font-family="Montserrat,sans-serif" font-size="12" letter-spacing="5" fill="#cfe3f6" fill-opacity=".35">'+(hk?'HOKKAIDO':'YUZAWA')+'</text>';
    return s+'</svg>';
  }
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var track=root.querySelector('.rc-track'), dotsEl=root.querySelector('.rc-dots'), count=root.querySelector('.rc-count'), stage=root.querySelector('.rc-stage'), live=root.querySelector('.rc-live');
  var cards=R.map(function(o,i){
    var li=document.createElement('li'); li.className='rc-card'; li.setAttribute('aria-roledescription','slide');
    li.setAttribute('aria-label',o.n+'（'+(i+1)+'／'+R.length+'）');
    var price=o.p||(o.g==='yz'?'prices-yuzawa':'prices-hokkaido');
    var c=CR[o.img], front=c?'<img class="rc-photo" src="img/resorts/'+o.img+'-600.webp" srcset="img/resorts/'+o.img+'-600.webp 600w, img/resorts/'+o.img+'-1080.webp 1080w" sizes="(max-width:640px) 80vw, 540px" alt="" loading="lazy" decoding="async">':bg(o,i);
    var credit=c?'<p class="rc-credit">Photo: <a href="'+c.u+'" target="_blank" rel="noopener">'+c.a+'</a> / <a href="'+c.lu+'" target="_blank" rel="noopener license">'+c.l+'</a></p>':'';
    li.innerHTML='<div class="rc-flip"><div class="rc-face rc-front"><div class="rc-media"><div class="rc-bg" aria-hidden="true">'+front+'</div>'+credit+'</div><div class="rc-body"><p class="rc-region">'+o.r+'</p><h4 class="rc-name">'+o.n+'</h4><p class="rc-en">'+o.en+'</p><p class="rc-desc">'+o.d+'</p><span class="rc-tag">'+o.t+'</span><div class="rc-btns"><a class="rc-book" href="#booking" data-resort="'+o.v+'">預約</a><a class="rc-price rc-link" href="#'+price+'">看課程費用<span aria-hidden="true"> →</span></a><button type="button" class="rc-mapbtn rc-link" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13"><path d="M1 3.5l4.5-2 5 2 4.5-2v11l-4.5 2-5-2-4.5 2z M5.5 1.5v11 M10.5 3.5v11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>看地圖</button></div></div></div><div class="rc-face rc-back" aria-hidden="true"><p class="rc-back-t">'+o.n+' 雪道地圖</p><div class="rc-map"><img src="img/maps/'+o.img+'-sm.webp" alt="'+o.n+'雪道地圖" loading="lazy" decoding="async"></div><button type="button" class="rc-backbtn">返回</button></div></div>';
    track.appendChild(li); return li;
  });
  var filter='all', list=[], idx=0;
  function vis(){return R.map(function(o,i){return i}).filter(function(i){return filter==='all'||R[i].g===filter})}
  function render(){
    var mobile=innerWidth<=640, gap=mobile?innerWidth*0.6:Math.min(440,innerWidth*0.36)*0.82, n=list.length;
    list.forEach(function(ci,k){
      var c=cards[ci], off=k-idx;
      if(n>2){off=((off%n)+n)%n; if(off>n/2) off-=n;}
      var a=Math.abs(off), prev=c._off;
      c.hidden=false;
      // jump without animation when wrapping around the far side
      if(prev!==undefined&&Math.abs(prev-off)>1){c.style.transition='none';}
      c._off=off;
      var x=off*gap*(a>1?(mobile?1:0.82):1), rot=off===0?0:(off<0?(mobile?40:28):(mobile?-40:-28)), z=-a*(mobile?200:280);
      c.style.transform='translateX('+x+'px) translateZ('+z+'px) rotateY('+rot+'deg)';
      c.style.zIndex=100-a; c.style.opacity=a>2?0:(a===2?(mobile?0:0):1);
      c.style.setProperty('--dim',a?(a===1?(mobile?0.62:0.38):0.7):0);
      c.style.pointerEvents=a>2?'none':'';
      if(c.style.transition==='none'){void c.offsetWidth;c.style.transition='';}
      c.classList.toggle('is-active',a===0);
      c.setAttribute('aria-hidden',a?'true':'false');
      if(a&&c.classList.contains('flipped'))flip(c,false);
      c.querySelectorAll('.rc-front a,.rc-front button').forEach(function(l){l.tabIndex=(a||c.classList.contains('flipped'))?-1:0});
      c.querySelectorAll('.rc-back button').forEach(function(l){l.tabIndex=(a||!c.classList.contains('flipped'))?-1:0});
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
  function flip(c,on){
    c.classList.toggle('flipped',on);
    c.querySelector('.rc-mapbtn').setAttribute('aria-pressed',on?'true':'false');
    c.querySelector('.rc-front').setAttribute('aria-hidden',on?'true':'false');
    c.querySelector('.rc-back').setAttribute('aria-hidden',on?'false':'true');
    c.querySelectorAll('.rc-front a,.rc-front button').forEach(function(l){l.tabIndex=on?-1:0});
    c.querySelector('.rc-backbtn').tabIndex=on?0:-1;
  }
  root.addEventListener('click',function(e){
    var c=e.target.closest('.rc-card'); if(!c||!c.classList.contains('is-active')) return;
    if(e.target.closest('.rc-mapbtn')){flip(c,true);c.querySelector('.rc-backbtn').focus({preventScroll:true});return}
    if(e.target.closest('.rc-backbtn')){flip(c,false);c.querySelector('.rc-mapbtn').focus({preventScroll:true});return}
    if(c.classList.contains('flipped')&&e.target.closest('.rc-back')&&!e.target.closest('a')){flip(c,false)}
  });
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
