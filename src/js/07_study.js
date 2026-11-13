/* ================= STUDY ================= */
const deckReads=()=>deckLessons.flatMap(l=>(l.readings||[]).map(r=>({r,l})));
function openDeck(words,name,lessons){deck=words.slice();deckLessons=lessons||[];deckName=name;combo=0;{const d=day(today());d.l=d.l||[];if(!d.l.includes(name))d.l.push(name);}mode='flash';search='';study()}
function study(){
  view='study';gen++;
  const modes=[['flash','Thẻ ghi nhớ','heart'],['quiz','Trắc nghiệm','star'],['write','Viết pinyin','lipstick'],['list','Danh sách','envelope']];combo=0;
  if(deckReads().length)modes.push(['read','Bài đọc','glasses']);
  if(!modes.some(m=>m[0]==mode))mode='flash';
  $('#app').innerHTML=`
  <div class="studyhead">
    <button class="btn" id="bBack">← Trang chủ</button>
    ${deckLessons.length===1&&DATA.books[deckLessons[0]._bi]?`<span class="bk-mini">${coverHTML(DATA.books[deckLessons[0]._bi])}</span>`:ic('tiara','',"width:42px;height:42px")}<h2>${esc(deckName)}</h2><span class="muted small" style="font-weight:600">${deck.length} từ</span>
    <span class="timer" id="tmr">⏱ Hôm nay: ${fmt((LOG[today()]||{s:0}).s)}</span>
    <button class="btn round" id="bOpt" title="Tùy chọn">⚙️</button>
  </div>
  <div class="tabs modes">${modes.map(m=>`<button class="tab ${m[0]==mode?'on':''}" data-m="${m[0]}">${ic(m[2],'tab-ic')}${m[1]}</button>`).join('')}</div>
  <div class="opts" id="opts" style="display:${S.optOpen?'flex':'none'}">
    <span>Mặt trước:</span>
    <span class="seg"><button data-f="hz" class="${S.front=='hz'?'on':''}">Chữ Hán</button><button data-f="vi" class="${S.front=='vi'?'on':''}">Tiếng Việt</button></span>
    <label><input type="checkbox" id="oPy" ${S.showPy?'checked':''}> Hiện pinyin</label>
    <label><input type="checkbox" id="oSh" ${S.shuffle?'checked':''}> Trộn thứ tự</label>
    <label><input type="checkbox" id="oSnd" ${S.sound?'checked':''}> Âm thanh hiệu ứng</label>
  </div>
  <div id="stage"></div>${mascotHTML()}`;bindMascot();
  $('#bBack').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();home()};
  $('#bOpt').onclick=()=>{S.optOpen=!S.optOpen;save();$('#opts').style.display=S.optOpen?'flex':'none'};
  document.querySelectorAll('[data-m]').forEach(t=>t.onclick=()=>{mode=t.dataset.m;study()});
  document.querySelectorAll('[data-f]').forEach(t=>t.onclick=()=>{S.front=t.dataset.f;save();study()});
  $('#oPy').onchange=e=>{S.showPy=e.target.checked;save();study()};
  $('#oSh').onchange=e=>{S.shuffle=e.target.checked;save();study()};
  $('#oSnd').onchange=e=>{S.sound=e.target.checked;save()};
  if(!deck.length){$('#stage').innerHTML='<div class="card gold done muted">Chưa có từ nào ở đây.</div>';return}
  ({flash,quiz,write,list,read:reading})[mode]();
}
const order=()=>S.shuffle?shuffle(deck):deck.slice();
const pyHtml=w=>S.showPy?`<div class="py">${esc(w.py)}</div>`:'';

