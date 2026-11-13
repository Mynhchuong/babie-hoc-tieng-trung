/* ---- Bài đọc / đối thoại (file nghe: audio/<mã>.mp3, thiếu thì dùng giọng đọc của máy) ---- */
const KIND_VI={'對話一':'Đối thoại 1','對話二':'Đối thoại 2','短文':'Bài đọc','生詞一':'Đọc từ vựng 1','生詞二':'Đọc từ vựng 2'};
const codeOf=id=>id.replace(/^d\d+-/,'');   // d1-01-02 → 01-02 (đúng mã in trong sách)
const AUDIO_EXT=['mp3','m4a','wav','ogg'];
const speakable=t=>t.replace(/[（(][^）)]*[）)]/g,'').replace(/[…]+/g,'，');
function speakAll(texts){
  if(!('speechSynthesis' in window)){toast('Trình duyệt không hỗ trợ đọc');return}
  speechSynthesis.cancel();
  // đoạn văn dài thì cắt theo câu để giọng đọc của máy không bị ngắt giữa chừng
  texts.map(speakable).flatMap(t=>t.match(/[^。！？；]+[。！？；]?/g)||[]).filter(t=>t.trim()).forEach(t=>{const u=new SpeechSynthesisUtterance(t);
    u.lang=voice?voice.lang:'zh-TW';if(voice)u.voice=voice;u.rate=.85;speechSynthesis.speak(u)});
}
function reading(){
  keyHandler=null;
  const items=deckReads(),multi=deckLessons.length>1;let lastL=null;
  const rline=(x,i,j)=>{const [who,hz,py,vi]=x;
    if(who==='*')return `<div class="rl note"><div class="rhz" lang="zh-Hant">${esc(hz)}</div><div class="rpy">${esc(py)}</div><div class="rvi">${esc(vi)}</div></div>`;
    return `<div class="rl" data-r="${i}" data-j="${j}"><div class="who" lang="zh-Hant">${esc(who)}</div><div class="rtx"><div class="rhz" lang="zh-Hant">${esc(hz)}</div><div class="rpy">${esc(py)}</div><div class="rvi">${esc(vi)}</div></div></div>`};
  $('#stage').innerHTML=`
  <div class="opts rdopts"><span>Đang xem:</span>
    <label><input type="checkbox" id="rdPy" ${S.rdPy?'checked':''}> Pinyin</label>
    <label><input type="checkbox" id="rdVi" ${S.rdVi?'checked':''}> Tiếng Việt</label>
    <span class="muted small">Bấm vào từng câu để nghe và xem pinyin + nghĩa của câu đó.</span></div>
  <div id="rdAll" class="${S.rdPy?'py ':''}${S.rdVi?'vi':''}">${items.map(({r,l},i)=>{
    const head=multi&&l!==lastL?`<h3 class="rl-h">${ic('flower','',"width:30px;height:30px;vertical-align:-8px")} Bài ${l.n} · ${esc(l.title||'')} <span class="muted small">${esc(l.titleVi||'')}</span></h3>`:'';lastL=l;
    return `${head}<div class="card rd">
      <div class="rd-h"><span class="code">🎧 ${esc(codeOf(r.id))}</span><span class="pill">${esc(KIND_VI[r.kind]||r.kind)}</span>
        <b class="rt" lang="zh-Hant">${esc(r.title)}</b><span class="muted small">${esc(r.titleVi)}</span></div>
      <div class="aud"><audio controls preload="metadata">${AUDIO_EXT.map(e=>`<source src="audio/${esc(r.id)}.${e}">`).join('')}</audio>
        <div class="noaud" hidden>Chưa có file nghe <i>${esc(codeOf(r.id))}</i>${r.lines.length?' — ':''}</div>
        ${r.lines.length?`<button class="btn" data-all="${i}">🔊 Nghe giọng máy</button>`:''}</div>
      ${r.lines.length?`<div class="board rdb">${r.lines.map((x,j)=>rline(x,i,j)).join('')}</div>`:`<p class="muted small" style="margin:4px 4px 0">Nghe đọc từ vựng của phần này — xem chữ và nghĩa ở tab <b>Danh sách</b>.</p>`}</div>`}).join('')}</div>`;
  const all=$('#rdAll');
  $('#rdPy').onchange=e=>{S.rdPy=e.target.checked;save();all.classList.toggle('py',S.rdPy)};
  $('#rdVi').onchange=e=>{S.rdVi=e.target.checked;save();all.classList.toggle('vi',S.rdVi)};
  all.querySelectorAll('audio').forEach(a=>{
    a.addEventListener('error',e=>{if(e.target===a.lastElementChild){a.hidden=true;a.parentNode.querySelector('.noaud').hidden=false}},true);
    a.addEventListener('play',()=>{if('speechSynthesis' in window)speechSynthesis.cancel();all.querySelectorAll('audio').forEach(o=>{if(o!==a)o.pause()})})});
  all.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{
    const r=items[+b.dataset.all].r;sfx('pop');speakAll(r.lines.filter(x=>x[0]!=='*').map(x=>x[1]))});
  all.querySelectorAll('.rl[data-r]').forEach(el=>el.onclick=()=>{
    all.querySelectorAll('audio').forEach(a=>a.pause());
    el.classList.toggle('open');if('speechSynthesis' in window){speechSynthesis.cancel();
      if(el.classList.contains('open'))speakAll([items[+el.dataset.r].r.lines[+el.dataset.j][1]])}});
}
