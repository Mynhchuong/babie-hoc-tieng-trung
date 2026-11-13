/* ================= HOME ================= */
function home(){
  if(view==='study')setTimeout(()=>sendReport(true),300);
  view='home';gen++;save();
  const b=DATA.books[S.book];
  const stars=ALL.filter(w=>P(w.id).st).length, hard=ALL.filter(w=>P(w.id).w>0&&!P(w.id).k).length;
  const td=LOG[today()]||{s:0,a:0},pct=Math.min(100,Math.round(td.s*100/(S.goal*60)));
  const st=streak(),days=studied(),total=Object.values(LOG).reduce((x,d)=>x+d.s,0),known=ALL.filter(w=>P(w.id).k).length;
  const hr=new Date().getHours(),hi=hr<11?'Chào buổi sáng':hr<14?'Chào buổi trưa':hr<18?'Chào buổi chiều':'Chào buổi tối';
  const msg=td.s<60?'Hôm nay mình chưa học nè, học một chút nha ♡':pct<100?`Còn ${Math.max(1,Math.ceil((S.goal*60-td.s)/60))} phút nữa là đủ mục tiêu rồi!`:'Hôm nay giỏi quá, đủ mục tiêu rồi 🎀';
  $('#app').innerHTML=`
  <header class="top">
    ${ic('crown','brand-ic')}<div class="brand">${isWork()?'Ôn tiếng Trung':`Halken nhắc Babie học tiếng Trung ${ic('heart','',"width:.8em;height:.8em;vertical-align:-.05em")}`}</div>
    <div class="spacer"></div>
    <span class="timer" id="fstat"></span>${REPORT_URL&&!isWork()?`<span class="timer" title="Tiến độ học được gửi cho Halken mỗi ngày">📤 ${isWork()?'Báo cáo':'Báo cáo cho Halken'}</span>`:""}
    <button class="btn primary" id="bRep">📈 Báo cáo</button>
    <button class="btn" id="bLog">📒 Nhật ký</button>
    <button class="btn" id="bTheme" title="Đổi giao diện hồng / làm việc">◐ ${isWork()?'Giao diện hồng':'Giao diện làm việc'}</button>
    <button class="btn" id="bSet">⚙️ Cài đặt</button>
  </header>
  ${fileBanner()}
  <div class="dash">
    <div class="card gold today">${ic('wand','corner-ic',"top:-26px;right:18px;width:64px;height:64px;--r:14deg")}${isWork()?'':`<div class="home-doll" id="homeDoll"><div class="bubble">${pick(MSG.hi)}</div>${ic('doll-wave')}</div>`}
      <div class="ring" style="--p:${pct}"><div><b>${Math.floor(td.s/60)}</b><span>/ ${S.goal} phút</span></div></div>
      <div style="flex:1">
        <h3>${hi}${plain(' ♡')}</h3><p>${plain(msg)}</p>
        <div class="stats">
          <div><b>🔥 ${st}</b>ngày liên tiếp</div>
          <div><b>${days.length}</b>ngày đã học</div>
          <div><b>${known}</b>từ đã thuộc</div>
          <div><b>${Math.round(total/60)}</b>phút tổng</div>
        </div>
        ${S.last?`<button class="btn primary" id="bCont" style="margin-top:14px">Học tiếp ${esc(S.last.name)} →</button>`:''}
      </div>
    </div>
    ${calendar()}
  </div>
  ${srsCard()}
  <div class="row">
    <div class="books">${DATA.books.map((x,i)=>{const t=ALL.filter(w=>w.book===i),k=t.filter(w=>P(w.id).k).length;
      return `<button class="bk ${i==S.book?'on':''}" data-b="${i}" title="${esc(x.name)}">${coverHTML(x)}<span class="bk-n">${esc(x.name)}</span><span class="bk-p"><i style="width:${t.length?Math.round(k*100/t.length):0}%"></i></span><span class="bk-s">${k}/${t.length} từ thuộc</span></button>`}).join('')}</div>
    <div class="spacer"></div>
    ${stars?`<button class="btn" id="bStar">★ Đánh dấu (${stars})</button>`:''}
    ${hard?`<button class="btn" id="bHard">💔 Hay sai (${hard})</button>`:''}
  </div>
  <p class="lead">Bấm vào bài để học · bấm nút tròn góc phải để chọn nhiều bài ôn chung</p>
  <div class="grid">${b.lessons.map(l=>{
    const ws=l._w||[],dueN=ws.filter(w=>isDue(store.p[w.id])).length,k=ws.filter(w=>P(w.id).k).length,p=ws.length?Math.round(k*100/ws.length):0,key=S.book+':'+l.n;
    return `<div class="card lesson ${sel.has(key)?'sel':''}" data-l="${l.n}">${ic(LESSON_IC[(l.n-1)%LESSON_IC.length],'lesson-ic')}
      <div class="chk" data-c="${key}">${sel.has(key)?'✓':''}</div>
      <div class="num">Bài ${l.n}${p==100?' 🎀':''}</div>
      <div class="tt">${esc(l.title||'')}</div>
      <div class="tv">${esc(l.titleVi||'')}</div>
      <div class="meta"><span>${ws.length} từ</span><span>thuộc ${p}%</span>${dueN?`<span class="duebadge" title="Từ đến hạn ôn lại">🔁 ${dueN}</span>`:''}</div>
      <div class="bar"><i style="width:${p}%"></i></div></div>`}).join('')}</div>
  ${sel.size?`<div class="card selbar">${ic('heart','',"width:30px;height:30px")}<b>Đã chọn ${sel.size} bài</b><span class="muted small">(${selWords().length} từ)</span><div class="spacer"></div>
    <button class="btn ghost" id="bClr">Bỏ chọn</button><button class="btn primary" id="bGo">Ôn các bài đã chọn →</button></div>`:''}
  `;
  document.querySelectorAll('[data-b]').forEach(t=>t.onclick=()=>{S.book=+t.dataset.b;save();home()});
  document.querySelectorAll('.lesson').forEach(el=>el.onclick=e=>{
    const c=e.target.closest('.chk');
    if(c){const k=c.dataset.c;sel.has(k)?sel.delete(k):sel.add(k);home();return}
    const l=b.lessons.find(x=>x.n==el.dataset.l);
    S.last={b:S.book,n:l.n,name:`Bài ${l.n}`};save();
    openDeck(l._w,`${b.short||b.name} · Bài ${l.n} ${l.title||''}`,[l]);
  });
  const cont=$('#bCont');if(cont)cont.onclick=()=>{const bb=DATA.books[S.last.b];const l=bb&&bb.lessons.find(x=>x.n==S.last.n);if(l)openDeck(l._w,`${bb.short||bb.name} · Bài ${l.n} ${l.title||''}`,[l])};
  const g=$('#bGo');if(g)g.onclick=()=>openDeck(selWords(),`Ôn ${sel.size} bài`,selLessons());
  const c=$('#bClr');if(c)c.onclick=()=>{sel.clear();home()};
  const bs=$('#bStar');if(bs)bs.onclick=()=>openDeck(ALL.filter(w=>P(w.id).st),'★ Từ đánh dấu');
  const bh=$('#bHard');if(bh)bh.onclick=()=>openDeck(ALL.filter(w=>P(w.id).w>0&&!P(w.id).k),'💔 Từ hay sai');
  $('#cP').onclick=()=>{calM.setMonth(calM.getMonth()-1);home()};
  $('#cN').onclick=()=>{calM.setMonth(calM.getMonth()+1);home()};
  $('#bRep').onclick=()=>showReport();$('#bLog').onclick=showLog;checkBadges();$('#bSet').onclick=showSettings;bindBanner();bindSrs();showFileStatus();
  const bt=$('#bTheme');if(bt)bt.onclick=()=>{setTheme(isWork()?'pink':'work');home()};
  const hd=$('#homeDoll');if(hd)hd.onclick=()=>{sfx('pop');burst(hd,12);const b=hd.querySelector('.bubble');b.textContent=pick(MSG.hi.concat(MSG.good));hd.classList.remove('bounce');void hd.offsetWidth;hd.classList.add('bounce')};
  const rg=$('.ring');if(rg){const p=rg.style.getPropertyValue('--p');rg.style.setProperty('--p',0);requestAnimationFrame(()=>requestAnimationFrame(()=>rg.style.setProperty('--p',p)))}
  document.querySelectorAll('.stats b').forEach(el=>{const m=el.textContent.match(/(\D*)(\d+)/);if(!m)return;const end=+m[2],pre=m[1];let t0=null;
    const st=ts=>{t0=t0||ts;const k=Math.min(1,(ts-t0)/700);el.textContent=pre+Math.round(end*k*(2-k));if(k<1)requestAnimationFrame(st)};requestAnimationFrame(st)});
  document.querySelectorAll('.lesson').forEach(c=>{c.onmousemove=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.style.transform=`perspective(600px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateY(-4px)`};c.onmouseleave=()=>c.style.transform=''});
}
function modal(html){
  const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="card">${html}<div class="actions"><button class="btn primary" data-x>Đóng</button></div></div>`;
  m.onclick=e=>{if(e.target===m||e.target.closest('[data-x]')){m.remove();home()}};
  document.body.appendChild(m);return m;
}
function showLog(){
  const ks=Object.keys(LOG).filter(k=>LOG[k].s>0).sort().reverse();
  const W=['CN','T2','T3','T4','T5','T6','T7'];
  modal(`<h3>${ic('lipstick','',"width:34px;height:34px;vertical-align:-8px")} Nhật ký học</h3>
  ${ks.length?ks.map(k=>{const d=LOG[k],[y,m,dd]=k.split('-');const wd=W[new Date(+y,m-1,+dd).getDay()];
    return `<div class="logrow"><span>${wd}, ${dd}/${m}/${y} <span class="muted small">${d.f?d.f+' – '+d.t:''}</span></span><span><b>${fmt(d.s)}</b> <span class="muted small">· ${d.a} câu</span></span></div>`}).join('')
  :'<p class="muted">Chưa có buổi học nào. Bắt đầu học là nhật ký tự ghi lại nha ♡</p>'}
  <div class="actions" style="justify-content:flex-start"><button class="btn" id="csv">⬇ Tải nhật ký (Excel/CSV)</button></div>`);
  $('#csv').onclick=()=>{
    const rows=['Ngày,Bắt đầu,Kết thúc,Số phút,Số câu đã làm',...ks.slice().reverse().map(k=>{const d=LOG[k],[y,m,dd]=k.split('-');return `${dd}/${m}/${y},${d.f||''},${d.t||''},${(d.s/60).toFixed(1)},${d.a}`})];
    dl('Nhat_ky_hoc_tieng_Trung.csv','﻿'+rows.join('\r\n'));
  };
}
function dl(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
function showSettings(){
  const m=modal(`<h3>${ic('bow','',"width:36px;height:36px;vertical-align:-9px")} Cài đặt</h3>
  <div class="field">Mục tiêu mỗi ngày: <input type="number" id="goal" min="1" max="240" value="${S.goal}"> phút</div>
  <div class="field" style="margin-top:10px">🔁 Mỗi lượt ôn tập tối đa: <input type="number" id="srsMax" min="5" max="200" value="${S.srsMax}"> từ</div>
  <div class="field" style="margin-top:12px">🔊 Giọng đọc: <select id="vSel"></select> <button class="btn" id="vTry">▶ Nghe thử</button></div>
  <div class="muted small">Mặc định tự chọn giọng nam tiếng Đài Loan nếu máy có (Windows: Zhiwei · Edge: YunJhe · Mac: Eddy, Reed…).</div>
  <div class="field" style="margin-top:12px">🎨 Giao diện: <span class="seg"><button data-th="pink" class="${isWork()?'':'on'}">Hồng</button><button data-th="work" class="${isWork()?'on':''}">Làm việc (trung tính, im lặng)</button></span></div>
  <div class="muted small">Giao diện làm việc: màu xám xanh, không búp bê, không tiếng hiệu ứng, không tự đọc to (chỉ đọc khi bấm 🔊). Mẹo: mở trang bằng đường link có đuôi <b>?theme=work</b> để vào thẳng giao diện này.</div>
  <h3 style="margin-top:18px">⏰ Nhắc học trên máy tính</h3>
  <div class="note">Khi cài, máy đã tự bật nhắc lúc <b>6 giờ tối</b> mỗi ngày. Tới giờ Windows hiện thông báo <i>"Anh người yêu nhắc em học tiếng Trung nè ♥"</i>, bấm <b>"Học ngay"</b> là mở trang này 🎀<br>
  Muốn <b>đổi giờ</b> hoặc <b>tắt nhắc</b>: bấm nút <b>Start</b> (cửa sổ Windows) → gõ <b>đổi giờ</b> → mở <b>"Đổi giờ nhắc học"</b>.<br>
  <span class="muted small">Nếu không thấy thông báo: kiểm tra Windows đã bật Thông báo và không ở chế độ Không làm phiền.</span></div>
  <h3 style="margin-top:18px">💾 Tự lưu tiến độ ra file</h3>
  ${FS_OK?`<div class="note">${fileState==='on'?`✅ Đang tự lưu vào file <b>${esc(fh.name)}</b> mỗi khi học.`:fileState==='need'?`Đã có file <b>${esc(fh.name)}</b>, cần bấm cho phép lại.`:'Chưa bật.'}<br>
    File <b>tien_do_hoc.json</b> nằm trong <b>Tài liệu (Documents)</b>. Khi anh gửi bản mới, cài đè lên là tiến độ vẫn còn.</div>
    <div class="row" style="margin-top:10px">${fileState==='need'?'<button class="btn primary" id="sRes">Cho phép lưu</button>':''}<button class="btn ${fileState==='none'?'primary':''}" id="sNew">${fileState==='none'?'Bật tự lưu (tạo file)':'Đổi file lưu'}</button><button class="btn" id="sOld">📂 Mở file tiến độ cũ</button></div>`
  :'<p class="muted small">Trình duyệt này không hỗ trợ tự lưu ra file — dùng Chrome hoặc Edge nha. Vẫn có thể sao lưu tay bên dưới.</p>'}
  <h3 style="margin-top:18px">🛟 Sao lưu tự động</h3>
  <div class="note">App tự giữ bản sao tiến độ mỗi ngày (14 ngày gần nhất) và <b>trước mỗi lần cập nhật app</b>. Lỡ mất tiến độ thì bấm <b>Khôi phục</b> ở bản mong muốn.</div>
  <div id="bkList" class="muted small" style="margin-top:8px">Đang đọc…</div>
  <h3 style="margin-top:18px">🔄 Cập nhật app</h3>
  <div class="note">Phiên bản đang dùng: <b>${esc(fmtVer(APP_VER))}</b>.<br>${UPDATE_URL?'Máy tự cập nhật khi có bản mới (cần có mạng) — tiến độ học vẫn giữ nguyên. Muốn cập nhật ngay: menu Start → <b>Cập nhật app ngay</b>.':'Bản cài này chưa bật tự cập nhật.'}
    ${UPDATE_URL?'<div class="row" style="margin-top:8px"><button class="btn" id="upChk">🔍 Kiểm tra bản mới</button><span id="upRes" class="muted small"></span></div>':''}</div>
  <h3 style="margin-top:18px">📦 Sao lưu tay</h3>
  <div class="row"><button class="btn" id="bk">⬇ Tải bản sao lưu</button><label class="btn">⬆ Khôi phục<input type="file" id="rs" accept=".json" hidden></label></div>`);
  const sn=$('#sNew');if(sn)sn.onclick=()=>{m.remove();pickNewFile().then(home)};
  const so=$('#sOld');if(so)so.onclick=()=>pickOldFile();
  const sr=$('#sRes');if(sr)sr.onclick=()=>{m.remove();resumeFile().then(home)};
  bkList().then(l=>{const el=$('#bkList');if(!el)return;const KN={day:'Bản sao hằng ngày',pre:'Trước khi cập nhật app',latest:'Mới nhất'};
    el.innerHTML=l.length?l.slice(0,10).map(x=>`<div class="logrow"><span>${KN[x.kind]||'Bản sao'} · ${new Date(x.t).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}<br><span class="muted small">${x.words} từ đã thuộc · ${x.days} ngày học · ${x.min} phút</span></span><button class="btn" data-bk="${esc(x.key)}">Khôi phục</button></div>`).join(''):'Chưa có bản sao nào (sẽ tự tạo khi bồ học).';
    el.querySelectorAll('[data-bk]').forEach(b=>b.onclick=async()=>{if(confirm('Khôi phục tiến độ về bản này? (Tiến độ hiện tại vẫn được cất lại để quay về nếu cần)')){toast('Đang khôi phục…');await bkRestore(b.dataset.bk)}})});
  const uc=$('#upChk');if(uc)uc.onclick=async()=>{const o=$('#upRes');o.textContent='Đang hỏi…';const r=await checkUpdate();
    o.textContent=r.err?'Không kiểm tra được (máy có mạng chưa?)':r.newer?`Có bản mới (${fmtVer(r.ver)}) — máy sẽ tự cập nhật trong vài giờ, hoặc bấm "Cập nhật app ngay" ở menu Start rồi mở lại app.`:'Đang là bản mới nhất rồi ♥'};
  m.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.th);m.remove();home()});
  const vs=$('#vSel'),fillV=()=>{const l=zhVoices();vs.innerHTML=`<option value="">Tự động (ưu tiên giọng nam)</option>`+l.map(v=>`<option value="${esc(v.name)}" ${S.voice===v.name?'selected':''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')};
  fillV();if(!zhVoices().length)vs.insertAdjacentHTML('afterend',' <span class="muted small">(máy chưa có giọng tiếng Trung)</span>');
  vs.onchange=()=>{S.voice=vs.value;save();pickVoice();speak('你好，我是你的中文老師。',true)};
  $('#vTry').onclick=()=>speak('你好，我是你的中文老師。',true);
  $('#srsMax').onchange=e=>{S.srsMax=Math.max(5,Math.min(200,+e.target.value||30));save();toast('Mỗi lượt ôn '+S.srsMax+' từ')};
  $('#goal').onchange=e=>{S.goal=Math.max(1,Math.min(240,+e.target.value||15));save();toast('Đã lưu mục tiêu '+S.goal+' phút')};
  $('#bk').onclick=()=>dl(`Sao_luu_tieng_Trung_${today()}.json`,JSON.stringify(store),'application/json');
  $('#rs').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o.p||!o.s)throw 0;
    const r=mergeStores(store,o);toast('Đã khôi phục, đang tải lại…');setTimeout(()=>replaceStoreAndReload(JSON.stringify(r.m)),800)}catch(x){toast('File không đúng định dạng')}})};
}
function selLessons(){const out=[];sel.forEach(k=>{const [bi,n]=k.split(':');out.push(DATA.books[bi].lessons.find(x=>x.n==n))});return out}
function selWords(){const out=[];sel.forEach(k=>{const [bi,n]=k.split(':');const l=DATA.books[bi].lessons.find(x=>x.n==n);out.push(...l._w)});return out}

