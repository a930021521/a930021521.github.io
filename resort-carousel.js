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

  var RS={"岩原": {"f": [["交通", "越後湯澤站東口免費接駁巴士約 10 分鐘（平日需於前一日 17:00 前預約）"], ["雪道", "全 20 條；初級 40%・中級 40%・上級 20%，最大坡度 35°"], ["特色", "主坡最寬約 200 公尺，最長滑行距離 4,000 公尺"], ["設施", "雪季每日夜滑；設有圍網隔離的兒童雪地遊樂區"]], "fit": "初次上板、希望在寬闊坡面穩定進階的學員與家庭", "full": "img/maps/iwappara.jpg", "sm": "img/maps/iwappara-sm.webp", "ss": "img/maps/iwappara-xs.webp 680w, img/maps/iwappara-sm.webp 800w", "alt": "岩原スキー場 雪道地圖（官方）", "cs": "岩原スキー場 官方網站", "cu": "https://iwa-ppara.com/gelande/", "site": "https://iwa-ppara.com/"}, "中里": {"f": [["交通", "越後湯澤站西口免費接駁巴士約 15 分鐘；或搭 JR 上越線約 10 分鐘"], ["雪道", "從最大坡度 14°、全長 1,010 公尺的緩坡，到 32° 的蘑菇與深雪上級道"], ["特色", "附 100 公尺雪地手扶梯的初學區與兒童雪地遊樂設施"], ["設施", "非壓雪與樹林滑行區、地形公園"]], "fit": "初次接觸雪地的家庭與兒童，以及希望縮短移動時間的旅客", "full": "img/maps/nakazato.jpg", "sm": "img/maps/nakazato-sm.webp", "ss": "img/maps/nakazato-xs.webp 680w, img/maps/nakazato-sm.webp 800w", "alt": "湯沢中里スノーリゾート 雪道地圖（官方）", "cs": "湯沢中里スノーリゾート 官方網站", "cu": "https://www.yuzawa-nakazato.com/winter/gerende/course/", "site": "https://www.yuzawa-nakazato.com/winter/"}, "苗場": {"f": [["交通", "越後湯澤站東口搭路線巴士約 45 分鐘；冬季另有急行巴士"], ["雪道", "全 24 條、約 134 公頃；初級 42%・中級 25%・上級 33%，最長 4,000 公尺"], ["特色", "世界盃雪上技巧賽道；降雪後 4 條非壓雪道可享粉雪"], ["設施", "旺季每日夜滑至 20:30；雪地公園；小學生以下纜車券免費"]], "fit": "追求長距離與多樣坡面的中高級學員，及入住度假飯店的家庭", "full": "img/maps/naeba.webp", "sm": "img/maps/naeba-sm.webp", "ss": "img/maps/naeba-xs.webp 680w, img/maps/naeba-sm.webp 800w", "alt": "苗場スキー場 雪道地圖（官方）", "cs": "苗場スキー場 官方網站", "cu": "https://www.princehotels.co.jp/ski/naeba/winter/coursemap/", "site": "https://www.princehotels.co.jp/ski/naeba/winter/"}, "神樂": {"f": [["交通", "越後湯澤站東口路線巴士：三俣約 20 分鐘、田代約 35 分鐘（詳見官方時刻表）"], ["雪道", "全 30 條、約 166 公頃；最長 6,000 公尺、最大坡度 32°、標高差 1,225 公尺"], ["特色", "三區共通纜車券；苗場ドラゴンドラ可連通苗場"], ["設施", "纜椅／纜車 17 座；雪地公園；小學生以下纜車券免費"]], "fit": "想滑長距離與粉雪、或希望一券暢遊多區域的中高級學員", "full": "img/maps/kagura.jpg", "sm": "img/maps/kagura-sm.webp", "ss": "img/maps/kagura-xs.webp 680w, img/maps/kagura-sm.webp 800w", "alt": "かぐらスキー場 雪道地圖（官方）", "cs": "かぐらスキー場 官方網站", "cu": "https://www.princehotels.co.jp/ski/kagura/winter/coursemap/", "site": "https://www.princehotels.co.jp/ski/kagura/winter/"}, "神立": {"f": [["交通", "越後湯澤站東口免費接駁巴士約 7 分鐘，雪季每日運行"], ["雪道", "全 16 條、總面積 130 公頃；初級 30%・中級 40%・上級 30%"], ["特色", "主坡全長 1,100 公尺、平均寬 50 公尺；初學者也能完成 2,500 公尺長滑"], ["設施", "雪地公園、蘑菇道、樹林與非壓雪區；週末前夜延長夜滑"]], "fit": "兼顧基礎練習與公園地形的單板學員，及重視交通效率的行程", "full": "img/maps/kandatsu.jpg", "sm": "img/maps/kandatsu-sm.webp?v=2", "ss": "img/maps/kandatsu-xs.webp 680w, img/maps/kandatsu-sm.webp?v=2 800w", "alt": "神立スノーリゾート 雪道地圖（官方）", "cs": "神立スノーリゾート 官方網站", "cu": "https://www.kandatsu.com/course-guide/", "site": "https://www.kandatsu.com/"}, "石打丸山": {"f": [["交通", "越後湯澤站東口免費接駁巴士，約 10 分鐘"], ["雪道", "全 25 條、纜椅 14 座，最長滑行距離 4,000 公尺"], ["特色", "非壓雪樹林滑行區與雪地公園，100% 天然雪"], ["夜滑", "16:00–20:00，最多 9 條雪道開放"]], "fit": "已能自主轉彎、希望挑戰更多地形的中級學員", "full": "img/maps/ishiuchi.webp", "sm": "img/maps/ishiuchi-sm.webp", "ss": "img/maps/ishiuchi-xs.webp 680w, img/maps/ishiuchi-sm.webp 800w", "alt": "石打丸山スキー場 雪道地圖（官方）", "cs": "石打丸山スキー場 官方網站", "cu": "https://ishiuchi.or.jp/winter/ski/lift-course/", "site": "https://ishiuchi.or.jp/winter/"}, "二世古": {"f": [["交通", "JR 俱知安站或二世古站轉乘巴士或計程車前往各雪場；距札幌約 100 公里"], ["雪場", "Grand Hirafu、HANAZONO、Niseko Village、安努普利四座，可使用全山共通纜車券"], ["特色", "來自日本海的季風帶來豐沛降雪，以粉雪聞名"], ["設施", "四座雪場之間有接駁巴士；HANAZONO 設有道內最大級的雪地公園；Grand Hirafu 雪季設有夜滑"]], "fit": "想體驗粉雪、在多座雪場之間探索不同地形的學員", "full": "img/maps/niseko.jpg", "sm": "img/maps/niseko-sm.webp", "ss": "img/maps/niseko-xs.webp 680w, img/maps/niseko-sm.webp 800w", "alt": "ニセコユナイテッド 雪道地圖（官方）", "cs": "ニセコユナイテッド 官方網站", "cu": "https://www.niseko.ne.jp/ja/map/", "site": "https://www.niseko.ne.jp/"}, "留壽都": {"f": [["交通", "新千歲機場、札幌市區開車各約 90 分鐘；兩地皆有預約制巴士，約 120 分鐘"], ["雪道", "全 37 條，4 座纜車、14 座纜椅；最長 3,500 公尺，最大坡度 40°"], ["特色", "位於羊蹄山東南、靠近太平洋側，乾爽粉雪加上冬季晴天率高；2025 年 World Ski Awards 日本最佳滑雪度假村"], ["設施", "West Mt. 設有夜滑；Samurai Kids Park 兒童雪地遊樂區；初中級雪地公園 Freedom Park"]], "fit": "全家同行、想住在度假村一次滑遍三座山的學員，以及想追粉雪的進階學員", "full": "img/maps/rusutsu.jpg", "sm": "img/maps/rusutsu-sm.webp", "ss": "img/maps/rusutsu-xs.webp 680w, img/maps/rusutsu-sm.webp 800w", "alt": "ルスツリゾート 雪道地圖（官方）", "cs": "ルスツリゾート 官方網站", "cu": "https://rusutsu.com/trail-map/", "site": "https://rusutsu.com/rusutsu-in-winter/"}, "富良野": {"f": [["交通", "JR 富良野站搭計程車約 12 分鐘；旭川機場搭巴士約 1 小時 20 分鐘"], ["雪道", "全 28 條、約 194 公頃，最長滑行距離 4,000 公尺，最大坡度 34°"], ["特色", "分為富良野、北之峰兩區，標高差 839 公尺"], ["設施", "新富良野王子大飯店可直接上下雪場；雪地公園；小學生以下纜車券免費"]], "fit": "想在長距離雪道穩定進階的學員，及入住度假飯店的家庭", "full": "img/maps/furano.jpg", "sm": "img/maps/furano-sm.webp", "ss": "img/maps/furano-xs.webp 680w, img/maps/furano-sm.webp 800w", "alt": "富良野スキー場 雪道地圖（官方）", "cs": "富良野スキー場 官方網站", "cu": "https://www.princehotels.co.jp/ski/furano/winter/coursemap/", "site": "https://www.princehotels.co.jp/ski/furano/winter/"}, "星野": {"f": [["交通", "JR Tomamu 站（僅特急停靠）有接駁巴士，約 5 分鐘到 The Tower"], ["雪道", "全 29 條；上級 4・中級 14・初級 10・初心 1，最長滑行距離 4,200 公尺"], ["特色", "上級者限定開放的非壓雪粉雪區（需辦理手續並戴安全帽）"], ["設施", "道內最大級的坡面公園，分初・中・上三種難度；兒童故事型家庭雪道"]], "fit": "全家同行、希望住宿與滑雪一次到位的旅客，以及想挑戰粉雪的進階學員", "full": "img/maps/tomamu.jpg", "sm": "img/maps/tomamu-sm.webp", "ss": "img/maps/tomamu-xs.webp 680w, img/maps/tomamu-sm.webp 800w", "alt": "星野リゾート トマム 雪道地圖（官方）", "cs": "星野リゾート トマム 官方網站", "cu": "https://www.snowtomamu.jp/winter/ski/ski-slope/", "site": "https://www.snowtomamu.jp/winter/"}, "札幌國際": {"f": [["交通", "札幌市區、小樽、定山溪溫泉有預約制滑雪巴士；開車從札幌市中心約 60 分鐘、定山溪溫泉約 30 分鐘"], ["雪道", "上級到初級都有；初級的林間～メルヘン滑道全長 3.6 公里，最大坡度 12°"], ["特色", "100% 天然雪；雪季從 11 月下旬營業到 5 月上旬"], ["設施", "纜車（Sky Cabin）；不滑雪也能玩的雪地遊樂區；5 間餐廳與 2 間咖啡廳"]], "fit": "住在札幌或定山溪、想當日往返的學員與家庭", "full": "img/maps/sapporo-kokusai.jpg", "sm": "img/maps/sapporo-kokusai-sm.webp", "ss": "img/maps/sapporo-kokusai-xs.webp 680w, img/maps/sapporo-kokusai-sm.webp 800w", "alt": "札幌国際スキー場 雪道地圖（官方）", "cs": "札幌国際スキー場 官方網站", "cu": "https://www.sapporo-kokusai.jp/slopes/", "site": "https://www.sapporo-kokusai.jp/"}, "手稻": {"f": [["交通", "JR 手稻站搭 JR 北海道巴士約 16 分鐘；開車從札幌市中心約 40 分鐘"], ["雪道", "全 15 條；初級 7・中級 4・上級 4，最長約 6 公里"], ["特色", "分為山頂一帶的 Highland 區與靠近山麓的 Olympia 區，保留奧運使用過的 FIS 公認雪道"], ["設施", "Olympia 區設有夜滑；8 人座纜車；聖火台一帶可眺望石狩灣"]], "fit": "住在札幌市區、想當日往返並挑戰多樣坡面的學員", "full": "img/maps/teine.jpg", "sm": "img/maps/teine-sm.webp", "ss": "img/maps/teine-xs.webp 680w, img/maps/teine-sm.webp 800w", "alt": "サッポロテイネ 雪道地圖（官方）", "cs": "サッポロテイネ 官方網站", "cu": "https://sapporo-teine.com/snow/course", "site": "https://sapporo-teine.com/snow/"}};
  var RL={yz:"<b>主要據點・越後湯澤</b>六座雪場皆可從越後湯澤站當日往返。依程度與目標，由教練建議最適合的場地。",hk:"<b>北海道</b>北海道課程費用與安排，歡迎私訊詢問。"};
  var RF={yz:"資料來源：各雪場官方網站、越後湯澤觀光協會（2026 年 10 月查閱）。營業期間、接駁與夜滑時間每季可能調整，請以官方最新公告為準。",hk:"資料來源：各雪場官方網站（2026 年 10 月查閱）。營業期間、交通與夜滑時間每季可能調整，請以官方最新公告為準。"};
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  function backHTML(o){var s=RS[o.n];
    if(!s) return '<div class="rc-face rc-back" aria-hidden="true"><button type="button" class="rc-backbtn">返回</button></div>';
    return '<div class="rc-face rc-back" aria-hidden="true"><div class="rc-bhead"><p class="rc-bk">'+esc(o.en)+'</p><p class="rc-back-t">'+esc(o.n)+'</p></div>'
      +'<div class="rc-scroll"><button type="button" class="rc-zoom" data-full="'+esc(s.full)+'" aria-label="放大查看 '+esc(o.n)+' 雪道地圖"><img src="'+esc(s.sm)+'"'+(s.ss?' srcset="'+esc(s.ss)+'" sizes="(max-width:640px) 78vw, 410px"':'')+' alt="'+esc(s.alt)+'" loading="lazy" decoding="async"><span class="rc-zoomtag" aria-hidden="true">放大地圖</span></button>'
      +'<p class="rc-src">圖片來源：<a href="'+esc(s.cu)+'" target="_blank" rel="noopener">'+esc(s.cs)+'</a></p>'
      +'<dl class="rc-facts">'+s.f.map(function(r){return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')+'<div class="rc-fit"><dt>適合</dt><dd>'+esc(s.fit)+'</dd></div></dl></div>'
      +'<div class="rc-bfoot"><a class="rc-site" href="'+esc(s.site)+'" target="_blank" rel="noopener">官方網站<span aria-hidden="true"> ↗</span></a><button type="button" class="rc-backbtn">返回</button></div></div>'}
  var CR={"iwappara": {"a": "Famifamifami", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Iwappara.jpg", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "nakazato": {"a": "Abasaa", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Yuzawa_Nakazato_Snow_Resort_on_5_January_2020.JPG", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "naeba": {"a": "Syced", "l": "CC0", "u": "https://commons.wikimedia.org/wiki/File:Naeba_ski_resort,_January_2026_(27332).jpg", "lu": "https://creativecommons.org/publicdomain/zero/1.0/"}, "kagura": {"a": "senngokujidai4434", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Kagura_Ski_Resort_(41113004182).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}, "kandatsu": {"a": "苗場山", "l": "CC BY-SA 3.0", "u": "https://commons.wikimedia.org/wiki/File:Kandatu.jpg", "lu": "https://creativecommons.org/licenses/by-sa/3.0/"}, "ishiuchi": {"a": "yuukokukirei", "l": "CC BY 3.0", "u": "https://commons.wikimedia.org/wiki/File:Ishiuchi,_Minamiuonuma,_Niigata_Prefecture_949-6372,_Japan_-_panoramio_(1).jpg", "lu": "https://creativecommons.org/licenses/by/3.0/"}, "niseko": {"a": "Alisterio1010", "l": "CC BY-SA 4.0", "u": "https://commons.wikimedia.org/wiki/File:Niseko_United_Ski_Resort_in_Hokkaido_Japan.jpg", "lu": "https://creativecommons.org/licenses/by-sa/4.0/"}, "rusutsu": {"a": "Jeremy Eades", "l": "CC BY-SA 2.0", "u": "https://commons.wikimedia.org/wiki/File:Shiribetsudake_%26_Yoteizan_(2143420699).jpg", "lu": "https://creativecommons.org/licenses/by-sa/2.0/"}, "furano": {"a": "wakimasa", "l": "Public domain", "u": "https://commons.wikimedia.org/wiki/File:Furano_Snow_Resort_view3.JPG", "lu": "https://creativecommons.org/publicdomain/mark/1.0/"}, "tomamu": {"a": "pakku", "l": "CC BY 3.0", "u": "https://commons.wikimedia.org/wiki/File:%E3%83%88%E3%83%9E%E3%83%A0%E3%83%BB%E3%82%BF%E3%83%AF%E3%83%BC_-_panoramio.jpg", "lu": "https://creativecommons.org/licenses/by/3.0/"}, "sapporo-kokusai": {"a": "MIKI Yoshihito", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:SAPPORO_KOKUSAI_ski_area._(16049261484).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}, "teine": {"a": "MIKI Yoshihito", "l": "CC BY 2.0", "u": "https://commons.wikimedia.org/wiki/File:Sapporo_Teine_Ski_Resort._(31250544382).jpg", "lu": "https://creativecommons.org/licenses/by/2.0/"}};
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
    li.innerHTML='<div class="rc-flip"><div class="rc-face rc-front"><div class="rc-media"><div class="rc-bg" aria-hidden="true">'+front+'</div>'+credit+'</div><div class="rc-body"><p class="rc-region">'+o.r+'</p><h4 class="rc-name">'+o.n+'</h4><p class="rc-en">'+o.en+'</p><p class="rc-desc">'+o.d+'</p><span class="rc-tag">'+o.t+'</span><div class="rc-btns"><a class="rc-book" href="#booking" data-resort="'+o.v+'">預約</a><a class="rc-price rc-link" href="#'+price+'">看課程費用<span aria-hidden="true"> →</span></a><button type="button" class="rc-mapbtn rc-link" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13"><path d="M1 3.5l4.5-2 5 2 4.5-2v11l-4.5 2-5-2-4.5 2z M5.5 1.5v11 M10.5 3.5v11" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>看地圖</button></div></div></div>'+backHTML(o)+'</div>';
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
      c.style.transform='perspective('+(mobile?900:1600)+'px) translateX('+x+'px) translateZ('+z+'px) rotateY('+rot+'deg)';
      c.style.zIndex=100-a; c.style.opacity=a>2?0:(a===2?(mobile?0:0):1);
      c.style.setProperty('--dim',a?(a===1?(mobile?0.62:0.38):0.7):0);
      c.style.pointerEvents=a>2?'none':'';
      if(c.style.transition==='none'){void c.offsetWidth;c.style.transition='';}
      c.classList.toggle('is-active',a===0);
      c.setAttribute('aria-hidden',a?'true':'false');
      if(a&&c.classList.contains('flipped'))flip(c,false);
      c.querySelectorAll('.rc-front a,.rc-front button').forEach(function(l){l.tabIndex=(a||c.classList.contains('flipped'))?-1:0});
      c.querySelectorAll('.rc-back a,.rc-back button').forEach(function(l){l.tabIndex=(a||!c.classList.contains('flipped'))?-1:0});
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
    c.querySelectorAll('.rc-back a,.rc-back button').forEach(function(l){l.tabIndex=on?0:-1});if(!on){var sc=c.querySelector('.rc-scroll');if(sc)sc.scrollTop=0}
  }
  root.addEventListener('click',function(e){
    var c=e.target.closest('.rc-card'); if(!c||!c.classList.contains('is-active')) return;
    if(e.target.closest('.rc-mapbtn')){flip(c,true);c.querySelector('.rc-backbtn').focus({preventScroll:true});return}
    if(e.target.closest('.rc-backbtn')){flip(c,false);c.querySelector('.rc-mapbtn').focus({preventScroll:true});return}
    var z=e.target.closest('.rc-zoom'); if(z&&c.classList.contains('flipped')){zoom(z);return}
  });
  var dlg=document.getElementById('lightbox'), zlast=null;
  function zoom(b){
    if(!dlg||!dlg.showModal){window.open(b.dataset.full,'_blank','noopener');return}
    var im=dlg.querySelector('img'); zlast=b; im.src=b.dataset.full; im.alt=(b.querySelector('img')||{}).alt||'';
    dlg.showModal(); document.documentElement.style.overflow='hidden';
  }
  if(dlg) dlg.addEventListener('close',function(){if(zlast){zlast.focus({preventScroll:true});zlast=null}});
  var leadEl=root.querySelector('.rc-lead'), fineEl=root.querySelector('.rc-fine');
  function info(){
    if(leadEl) leadEl.innerHTML=filter==='all'?RL.yz:RL[filter];
    if(fineEl) fineEl.textContent=filter==='hk'?RF.hk:RF.yz;
  }
  function setFilter(f){
    root.querySelectorAll('.rc-pill').forEach(function(q){q.setAttribute('aria-pressed',q.dataset.f===f?'true':'false')});
    filter=f; idx=0; build(); info();
  }
  function go(k){idx=(k+list.length)%list.length;render()}
  root.querySelector('.rc-prev').onclick=function(){go(idx-1)};
  root.querySelector('.rc-next').onclick=function(){go(idx+1)};
  root.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){go(idx-1);e.preventDefault()}else if(e.key==='ArrowRight'){go(idx+1);e.preventDefault()}});
  root.querySelectorAll('.rc-pill').forEach(function(p){p.onclick=function(){setFilter(p.dataset.f)}});
  // #hokkaido links / hash: land on the carousel with the 北海道 filter
  function hkHash(){if(location.hash==='#hokkaido')setFilter('hk')}
  document.querySelectorAll('a[href="#hokkaido"]').forEach(function(a){a.addEventListener('click',function(){setFilter('hk')})});
  addEventListener('hashchange',hkHash);
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
  build(); info(); hkHash();
})();
