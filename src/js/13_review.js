/* ================= ÔN TẬP NGẮT QUÃNG (kiểu Anki) =================
   Mỗi từ là 1 thẻ trong store.p[id] (id = sách-bài-thứ tự → dùng chung cho mọi sách, thêm sách mới là tự có).
   Trường thêm: due (ms đến hạn) · iv (khoảng cách, ngày) · ef (độ dễ) · s ('l' đang học | 'r' đã thuộc) · ls (bước học) · rp (lần ôn) · lp (lần quên)
   Từ vào sổ ôn khi bồ trả lời ở Thẻ ghi nhớ / Trắc nghiệm / Viết (srsPractice). Ôn tập chỉ chấm lịch cho thẻ đã đến hạn. */
const DAY_MS=864e5,SRS_STEPS=[1,10],LEARN_AHEAD=15*60e3,BYID=Object.fromEntries(ALL.map(w=>[w.id,w]));
if(S.srsMax===undefined)S.srsMax=30; if(S.srsBook===undefined)S.srsBook='';
const dayStart=k=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate()+k).getTime()};
const inSrs=c=>!!c&&c.due!==undefined;
const isDue=c=>inSrs(c)&&c.due<=Date.now()+(c.s==='l'?LEARN_AHEAD:0);
const inBook=w=>S.srsBook===''||w.book===S.srsBook;
const srsList=all=>ALL.filter(w=>(all||inBook(w))&&inSrs(store.p[w.id]));   // all=true: bỏ qua bộ lọc sách
const srsDueList=all=>srsList(all).filter(w=>isDue(store.p[w.id]));
const loc=w=>{const b=DATA.books[w.book];return `${b.short||b.name} · Bài ${w.lesson}`};
function fmtIv(d){if(d<1)return '<1 ngày';if(d<30)return d+' ngày';if(d<365)return (d/30).toFixed(1).replace('.',',').replace(',0','')+' tháng';return (d/365).toFixed(1).replace('.',',').replace(',0','')+' năm'}

// Lập lịch: g = 0 Quên · 1 Khó · 2 Nhớ · 3 Dễ → trả về bản sao thẻ đã cập nhật (không ghi vào store)
function srsNext(c,g){
  const n=Object.assign({ef:2.5,iv:0,ls:0,rp:0,lp:0,s:'l'},c),now=Date.now();n.rp++;
  const grad=iv=>{n.s='r';n.iv=iv;n.ls=0;n.due=dayStart(iv)};
  if(n.s==='l'){                                   // đang học / vừa quên
    if(g===0){n.ls=0;n.due=now+SRS_STEPS[0]*60e3}
    else if(g===1)n.due=now+6*60e3
    else if(g===2){if(n.ls<SRS_STEPS.length-1){n.ls++;n.due=now+SRS_STEPS[n.ls]*60e3}else grad(Math.max(1,n.iv||1))}
    else grad(Math.max(4,(n.iv||1)*2));
  }else{                                           // đã thuộc: ôn theo khoảng cách ngày
    const iv=Math.max(1,n.iv||1);
    if(g===0){n.lp++;n.ef=Math.max(1.3,n.ef-.2);n.iv=Math.max(1,Math.round(iv*.3));n.s='l';n.ls=SRS_STEPS.length-1;n.due=now+SRS_STEPS[n.ls]*60e3}
    else if(g===1){n.ef=Math.max(1.3,n.ef-.15);n.iv=Math.max(iv+1,Math.round(iv*1.2));n.due=dayStart(n.iv)}
    else if(g===2){n.iv=Math.max(iv+1,Math.round(iv*n.ef));n.due=dayStart(n.iv)}
    else{n.ef+=.15;n.iv=Math.max(iv+2,Math.round(iv*n.ef*1.3));n.due=dayStart(n.iv)}
  }
  return n;
}
function srsGrade(id,g){
  const p=P(id);Object.assign(p,srsNext(p,g));
  p.k=g>=2?1:0;if(g===0)p.w=(p.w||0)+1;
  logAns();const d=day(today());d.rv=(d.rv||0)+1;(d.rg=d.rg||[0,0,0,0])[g]++;track(id,g>=2,'review');save();
}
// Trả lời ở các chế độ học thường: từ chưa có trong sổ thì vào sổ; từ chưa đến hạn mà quên thì gọi ôn sớm
function srsPractice(id,ok,kind,typed){
  const p=P(id);track(id,ok,kind||'flash',typed);
  if(!inSrs(p)){Object.assign(p,{s:ok?'r':'l',iv:1,ef:2.5,ls:0,rp:0,lp:0,due:ok?dayStart(1):Date.now()});return}
  if(!ok&&p.due>Date.now())p.due=Date.now();
}
// Máy đã có tiến độ từ trước: từ đã thuộc vào sổ (rải 1–5 ngày tới cho khỏi dồn), từ hay sai thì ôn ngay
if(!S.srs1){let j=0;ALL.forEach(w=>{const p=store.p[w.id];if(!p||inSrs(p))return;
  if(p.k)Object.assign(p,{s:'r',iv:3,ef:2.5,ls:0,rp:0,lp:0,due:dayStart(1+(j++%5))});
  else if(p.w>0)Object.assign(p,{s:'l',iv:1,ef:2.5,ls:0,rp:0,lp:0,due:Date.now()})});S.srs1=1;save()}

function srsStats(){
  const l=srsList(),fc=Array(7).fill(0),t0=dayStart(0);let due=0,learn=0,young=0,mature=0;
  l.forEach(w=>{const c=store.p[w.id];if(isDue(c)){due++;fc[0]++}else{const off=Math.floor((c.due-t0)/DAY_MS);if(off>=0&&off<7)fc[off]++}
    if(c.s==='l')learn++;else if(c.iv>=21)mature++;else young++});
  return {total:l.length,due,learn,young,mature,fc};
}
// tỉ lệ nhớ đúng (Nhớ + Dễ) trong N ngày gần nhất, theo nhật ký chấm lịch
function srsRetention(days=30){let a=0,r=0;for(let i=0;i<days;i++){const d=new Date();d.setDate(d.getDate()-i);const v=(LOG[dkey(d)]||{}).rg;if(v){a+=v[0]+v[1]+v[2]+v[3];r+=v[2]+v[3]}}return a?{pct:Math.round(r*100/a),n:a}:null}
const dueBy=()=>DATA.books.map((b,i)=>({b,n:srsDueList(true).filter(w=>w.book===i).length,t:srsList(true).filter(w=>w.book===i).length}));
function srsCard(){
  const st=srsStats(),nb=DATA.books.length,WD=['CN','T2','T3','T4','T5','T6','T7'],ret=srsRetention();
  const chips=nb>1?`<div class="tabs srs-chips"><button class="tab ${S.srsBook===''?'on':''}" data-sb="">Tất cả sách</button>${DATA.books.map((b,i)=>`<button class="tab ${S.srsBook===i?'on':''}" data-sb="${i}">${esc(b.short||b.name)}</button>`).join('')}</div>`:'';
  if(!st.total)return `<div class="card srs">${chips}<div class="srs-row"><div><h3>🔁 Ôn lại từ đã học</h3>
    <p class="muted">${S.srsBook!==''?'Sách này chưa có từ nào trong sổ ôn.':'Chưa có từ nào trong sổ ôn.'} Học một bài ở bên dưới (thẻ ghi nhớ, trắc nghiệm hoặc viết) — từ nào bồ trả lời sẽ tự vào sổ ôn, đến hạn thì hiện ở đây để ôn lại.</p></div></div></div>`;
  const mx=Math.max(1,...st.fc),bars=st.fc.map((v,i)=>`<div title="${v} từ"><em>${v||''}</em><i style="height:${Math.round(v*40/mx)+3}px"></i><span>${i?WD[(new Date().getDay()+i)%7]:'Nay'}</span></div>`).join('');
  const nxt=st.fc.slice(1).findIndex(v=>v>0),pc=n=>Math.round(n*100/st.total);
  const per=nb>1&&S.srsBook===''?`<p class="small srs-books">${dueBy().filter(x=>x.t).map(x=>`<span><b>${esc(x.b.short||x.b.name)}</b>: ${x.n?`<u>${x.n} đến hạn</u>`:'chưa đến hạn'}</span>`).join('')}</p>`:'';
  return `<div class="card srs">${chips}<div class="srs-row">
    <div class="srs-big"><b>${st.due}</b><span>từ cần ôn</span></div>
    <div class="srs-mid"><h3>🔁 Ôn lại từ đã học</h3>
      <p class="muted">${st.due?`Đến hạn ôn hôm nay${st.learn?` · ${st.learn} từ đang học`:''}${nb>1&&S.srsBook===''?' (gộp tất cả sách)':''}.`:`Hôm nay ôn xong rồi 🎀${nxt>=0?` Lần ôn tiếp theo: ${st.fc[nxt+1]} từ ${nxt?`sau ${nxt+1} ngày`:'ngày mai'}.`:''}`}</p>
      ${per}
      <div class="srs-state" title="Đang học · Đã nhớ (<21 ngày) · Thuộc lâu (≥21 ngày)"><i class="l" style="width:${pc(st.learn)}%"></i><i class="y" style="width:${pc(st.young)}%"></i><i class="m" style="width:${pc(st.mature)}%"></i></div>
      <p class="muted small">Sổ ôn ${st.total} từ: <b class="cl">${st.learn} đang học</b> · <b class="cy">${st.young} đã nhớ</b> · <b class="cm">${st.mature} thuộc lâu</b>${ret?` · nhớ đúng 30 ngày qua <b>${ret.pct}%</b>`:''}</p>
      <div class="row" style="gap:8px;margin-top:8px">${st.due?`<button class="btn primary big-l" id="srsGo">▶ Bắt đầu ôn (${Math.min(st.due,S.srsMax)} từ)</button>`:''}<button class="btn" id="srsStat">📊 Thống kê</button></div></div>
    <div class="fcast" title="Số từ đến hạn trong 7 ngày tới">${bars}</div></div></div>`;
}
function showSrsStats(){
  const st=srsStats(),ret7=srsRetention(7),ret30=srsRetention(30),W=['CN','T2','T3','T4','T5','T6','T7'];
  const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const v=LOG[dkey(d)]||{};days.push({w:W[d.getDay()],n:v.rv||0})}
  const mx=Math.max(1,...days.map(x=>x.n)),hard=srsList(true).filter(w=>store.p[w.id].lp>0).sort((a,b)=>store.p[b.id].lp-store.p[a.id].lp).slice(0,8);
  modal(`<h3>${ic('diamond','',"width:34px;height:34px;vertical-align:-8px")} Thống kê ôn tập</h3>
  <div class="srs-stats"><div><b>${st.total}</b>từ trong sổ</div><div><b>${st.due}</b>đến hạn</div><div><b>${st.mature}</b>thuộc lâu</div>
    <div><b>${ret30?ret30.pct+'%':'–'}</b>nhớ đúng 30 ngày</div><div><b>${ret7?ret7.pct+'%':'–'}</b>nhớ đúng 7 ngày</div><div><b>${streak()}</b>ngày liên tiếp</div></div>
  <p class="muted small" style="margin:14px 0 4px">Số từ đã ôn mỗi ngày (14 ngày gần nhất)</p>
  <div class="fcast wide">${days.map(x=>`<div><em>${x.n||''}</em><i style="height:${Math.round(x.n*50/mx)+3}px"></i><span>${x.w}</span></div>`).join('')}</div>
  <p class="muted small" style="margin:14px 0 4px">Theo từng sách</p>
  ${dueBy().map(x=>{const mt=ALL.filter(w=>w.book===DATA.books.indexOf(x.b)&&inSrs(store.p[w.id])&&store.p[w.id].s==='r'&&store.p[w.id].iv>=21).length,tot=ALL.filter(w=>w.book===DATA.books.indexOf(x.b)).length;
    return `<div class="logrow"><span><b>${esc(x.b.name)}</b></span><span>${x.t}/${tot} từ trong sổ · ${mt} thuộc lâu · <b>${x.n}</b> đến hạn</span></div>`}).join('')}
  <p class="muted small" style="margin:14px 0 4px">Từ hay quên nhất</p>
  ${hard.length?hard.map(w=>`<div class="logrow"><span><b style="font-family:var(--hz);font-size:18px">${esc(w.hz)}</b> ${esc(w.py)} <span class="muted small">${esc(w.vi)}</span></span><span>quên ${store.p[w.id].lp} lần</span></div>`).join(''):'<p class="muted">Chưa có từ nào bị quên ♡</p>'}`);
}
function bindSrs(){
  const go=$('#srsGo');if(go)go.onclick=reviewStart;const ss=$('#srsStat');if(ss)ss.onclick=showSrsStats;
  document.querySelectorAll('[data-sb]').forEach(b=>b.onclick=()=>{S.srsBook=b.dataset.sb===''?'':+b.dataset.sb;save();home()});
}

function reviewStart(){
  const list=shuffle(srsDueList()),isL=w=>store.p[w.id].s==='l';
  const q=[...list.filter(isL),...list.filter(w=>!isL(w))].slice(0,S.srsMax||30).map(w=>w.id);
  if(!q.length){toast('Chưa có từ nào cần ôn ♡');return}
  const d=day(today());d.l=d.l||[];if(!d.l.includes('🔁 Ôn tập'))d.l.push('🔁 Ôn tập');
  view='study';gen++;deck=[];deckLessons=[];deckName='🔁 Ôn tập';mode='review';combo=0;
  review(q);
}
const RV_MODES=[['flip','Lật thẻ'],['quiz','Trắc nghiệm'],['write','Gõ pinyin'],['mix','Xen kẽ']];
function review(queue){
  const my=gen,stat=[0,0,0,0];let done=0,busy=false;
  $('#app').innerHTML=`
  <div class="studyhead">
    <button class="btn" id="bBack">← Trang chủ</button>
    ${ic('tiara','',"width:42px;height:42px")}<h2>🔁 Ôn tập</h2><span class="muted small" style="font-weight:600">${queue.length} từ · gộp mọi sách</span>
    <span class="timer" id="tmr">⏱ Hôm nay: ${fmt((LOG[today()]||{s:0}).s)}</span>
  </div>
  <div class="opts" id="opts"><span>Cách ôn:</span>
    <span class="seg">${RV_MODES.map(([k,t])=>`<button data-rm="${k}" class="${(S.rvMode||'flip')==k?'on':''}">${t}</button>`).join('')}</span>
    <span>Mặt trước:</span><span class="seg"><button data-f="hz" class="${S.front=='hz'?'on':''}">Chữ Hán</button><button data-f="vi" class="${S.front=='vi'?'on':''}">Tiếng Việt</button></span>
    <label><input type="checkbox" id="oPy" ${S.showPy?'checked':''}> Hiện pinyin</label>
  </div>
  <div id="stage"></div>${mascotHTML()}`;bindMascot();
  $('#bBack').onclick=()=>{if('speechSynthesis' in window)speechSynthesis.cancel();home()};
  document.querySelectorAll('[data-rm]').forEach(t=>t.onclick=()=>{S.rvMode=t.dataset.rm;save();review(queue)});
  document.querySelectorAll('[data-f]').forEach(t=>t.onclick=()=>{S.front=t.dataset.f;save();review(queue)});
  $('#oPy').onchange=e=>{S.showPy=e.target.checked;save();review(queue)};
  const finish=()=>{
    celebrate();keyHandler=null;const more=srsDueList().length,st=srsStats(),nxt=st.fc.slice(1).findIndex(v=>v>0),ret=srsRetention(1);
    $('#stage').innerHTML=`<div class="card gold done">${ic('doll-cheer','done-doll')}<div class="score">${done}</div><p>lượt ôn xong 🎀</p>
      <p>Quên ${stat[0]} · Khó ${stat[1]} · Nhớ ${stat[2]} · Dễ ${stat[3]}${ret?` · nhớ đúng hôm nay ${ret.pct}%`:''}</p>
      ${more?'':`<p>Hôm nay ôn xong hết rồi!${nxt>=0?` Lần ôn tiếp theo: ${st.fc[nxt+1]} từ ${nxt?`sau ${nxt+1} ngày`:'ngày mai'}.`:''}</p>`}
      <div class="actions">${more?`<button class="btn primary big-l" id="more">▶ Ôn thêm (${Math.min(more,S.srsMax)} từ)</button>`:''}<button class="btn big-l" id="home2">← Trang chủ</button></div></div>`;
    const m=$('#more');if(m)m.onclick=reviewStart;$('#home2').onclick=home;
  };
  // chấm lịch + hiệu ứng; thẻ chưa thuộc thì gặp lại sau vài thẻ
  const commit=(g,btn)=>{
    const id=queue.shift();srsGrade(id,g);stat[g]++;done++;
    if(g>=2)fxGood(btn);else{sfx('no');combo=0;mascot('bad')}
    if(store.p[id].s==='l')queue.splice(Math.min(queue.length,2+(Math.random()*3|0)),0,id);
    return store.p[id];
  };
  const when=c=>c.s==='l'?'vài phút nữa':fmtIv(c.iv);
  const head=(w,pp)=>`<div class="progress"><span>Đã ôn ${done}</span><div class="bar"><i style="width:${done*100/(done+queue.length)}%"></i></div><span>Còn ${queue.length}</span>
    <span class="pill ${pp.s==='l'?'r':''}">${pp.s==='l'?'đang học':'cách '+fmtIv(pp.iv||1)}</span><span class="muted small">${esc(loc(w))}</span></div>`;
  const modeFor=(w,pp)=>{const m=S.rvMode||'flip';if(m!=='mix')return m;
    return pp.s==='l'?'quiz':pp.iv>=21?(Math.random()<.5?'write':'flip'):(Math.random()<.5?'quiz':'flip')};
  const draw=()=>{
    if(!queue.length){finish();return}
    const w=BYID[queue[0]],pp=store.p[w.id];busy=false;
    ({flip:drawFlip,quiz:drawQuiz,write:drawWrite})[modeFor(w,pp)](w,pp);
  };
  const drawFlip=(w,pp)=>{
    let flipped=false;
    const front=S.front=='hz'?`<div class="big-hz">${esc(w.hz)}</div>${pyHtml(w)}`:`<div class="vi">${esc(w.vi)}</div>`;
    $('#stage').innerHTML=`${head(w,pp)}
    <div class="flash enter" id="fc"><div class="in">
      <div class="board face front"><span class="corner">${S.front=='hz'?'Chữ Hán':'Tiếng Việt'}</span>${front}<div class="tap-hint">👆 Nghĩ câu trả lời rồi bấm để xem đáp án</div></div>
      <div class="board face back"><span class="corner">Đáp án</span><button class="spk" data-s title="Đọc lại">🔊</button>
        <div class="big-hz sm">${esc(w.hz)}</div><div class="py">${esc(w.py)}</div><div class="divider"></div><div class="vi">${esc(w.vi)}</div></div>
    </div></div>
    <div class="fc-actions" id="acts"><button class="btn big primary" id="show"><span class="i">⟲</span><b>Hiện đáp án</b><kbd>Space</kbd></button></div>`;
    const fc=$('#fc');
    const grade=g=>{
      if(busy||!flipped)return;busy=true;commit(g,$('#g'+g));
      fc.style.transition='transform .35s ease-in, opacity .35s';fc.style.transform=`translateX(${g>=2?520:-520}px) rotate(${g>=2?24:-24}deg)`;fc.style.opacity=0;
      setTimeout(()=>{if(gen===my)draw()},300);
    };
    const doFlip=()=>{if(flipped)return;flipped=true;fc.classList.add('flip');sfx('flip');setTimeout(()=>speak(w.hz),250);
      const lab=g=>{const n=srsNext(pp,g);return n.s==='l'?Math.max(1,Math.round((n.due-Date.now())/60e3))+' phút':fmtIv(n.iv)};
      $('#acts').innerHTML=[['Quên','no','✗'],['Khó','','…'],['Nhớ','yes','✓'],['Dễ','primary','★']].map(([t,c,i],g)=>
        `<button class="btn big ${c}" id="g${g}"><span class="i">${i}</span><b>${t}</b><small>${lab(g)}</small><kbd>${g+1}</kbd></button>`).join('');
      [0,1,2,3].forEach(g=>$('#g'+g).onclick=()=>grade(g))};
    fc.onclick=e=>{if(e.target.closest('[data-s]'))return;doFlip()};
    fc.querySelector('[data-s]').onclick=e=>{e.stopPropagation();speak(w.hz,true)};
    $('#show').onclick=doFlip;
    if('speechSynthesis' in window)speechSynthesis.cancel();
    keyHandler=e=>{
      if(e.code=='Space'||e.key=='Enter'){e.preventDefault();doFlip()}
      else if(flipped&&/^[1-4]$/.test(e.key))grade(+e.key-1);
    };
  };
  const drawQuiz=(w,pp)=>{
    const askHz=S.front=='hz',okOpt=x=>x.id!==w.id&&x.vi!==w.vi&&x.hz!==w.hz;
    let others=shuffle(ALL.filter(x=>okOpt(x)&&x.book===w.book)).slice(0,3);
    if(others.length<3)others=others.concat(shuffle(ALL.filter(x=>okOpt(x)&&!others.includes(x))).slice(0,3-others.length));
    const opts=shuffle([w,...others]);let locked=false,adv=false;
    const go=()=>{if(adv)return;adv=true;if(gen===my)draw()};
    $('#stage').innerHTML=`${head(w,pp)}
    <div class="board q"><button class="spk" data-s>🔊</button>
      ${askHz?`<div class="big-hz" style="font-size:64px">${esc(w.hz)}</div>${pyHtml(w)}`:`<div class="vi">${esc(w.vi)}</div>`}</div>
    <div class="choices">${opts.map((o,k)=>`<button class="choice ${askHz?'':'hzc'}" data-k="${k}"><span class="k">${k+1}</span><span>${esc(askHz?o.vi:o.hz)}${!askHz&&S.showPy?`<div class="small muted" style="font-family:var(--ui)">${esc(o.py)}</div>`:''}</span></button>`).join('')}</div>
    <div id="fb"></div>`;
    $('[data-s]').onclick=()=>speak(w.hz,true);
    const pick=k=>{
      if(locked){go();return}locked=true;busy=true;
      const ok=opts[k].id===w.id,btns=document.querySelectorAll('.choice');
      btns.forEach((b,j)=>{if(opts[j].id===w.id)b.classList.add('ok')});if(!ok)btns[k].classList.add('bad');
      const np=commit(ok?2:0,btns[k]);if(!ok)shake(btns[k]);
      $('#fb').innerHTML=`<div class="feedback ${ok?'ok':'bad'}">${ok?'Nhớ rồi!':'Quên mất rồi.'} <b style="font-family:var(--hz)">${esc(w.hz)}</b> ${esc(w.py)} = ${esc(w.vi)} <span class="small">— gặp lại: ${when(np)}${ok?'':' · bấm <kbd>Enter</kbd> để tiếp'}</span></div>`;
      if(!askHz||!ok)speak(w.hz);
      if(ok)setTimeout(go,1000);
    };
    document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
    keyHandler=e=>{if(/^[1-4]$/.test(e.key)&&!locked)pick(+e.key-1);else if(e.key=='Enter'&&locked)go()};
  };
  const drawWrite=(w,pp)=>{
    let st=0,adv=false;const go=()=>{if(adv)return;adv=true;if(gen===my)draw()};
    $('#stage').innerHTML=`${head(w,pp)}
    <div class="board q write"><button class="spk" data-s>🔊</button>
      <div class="big-hz" style="font-size:72px">${esc(w.hz)}</div>
      <p class="muted small">Gõ pinyin của chữ này — không cần dấu thanh, VD: <i>xuesheng</i> hoặc <i>xue2sheng1</i></p>
      <input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ pinyin rồi bấm Enter" style="font-family:var(--ui)">
      <div id="fb"></div>
      <div class="fc-actions"><button class="btn big" id="hint"><span class="i">💡</span><b>Gợi ý nghĩa</b></button><button class="btn big no" id="skip"><span class="i">?</span><b>Không biết</b></button><button class="btn big primary" id="chk"><span class="i">✓</span><b>Kiểm tra</b><kbd>Enter</kbd></button></div>
    </div>`;
    const inp=$('#ans');inp.focus();$('[data-s]').onclick=()=>speak(w.hz,true);
    $('#hint').onclick=()=>{$('#fb').innerHTML=`<div class="feedback" style="background:#fff;color:var(--hot)">Nghĩa: <b>${esc(w.vi)}</b></div>`;inp.focus()};
    const check=give=>{
      if(st){go();return}
      const v=normPy(inp.value);if(!give&&!v){inp.focus();return}
      st=1;busy=true;const ok=!give&&pyVariants(w.py).has(v),np=commit(ok?2:0,inp);if(!ok)shake(inp);
      $('#fb').innerHTML=`<div class="feedback ${ok?'ok':'bad'}">${ok?'Đúng rồi! 🎀':'Chưa đúng, đáp án:'}
        <div style="margin-top:6px"><b style="font-family:var(--hz);font-size:22px">${esc(w.hz)}</b> &nbsp;<b style="font-size:20px">${esc(w.py)}</b> — ${esc(w.vi)}</div><div class="small">gặp lại: ${when(np)}</div></div>`;
      $('#chk').innerHTML='<span class="i">→</span><b>Từ tiếp theo</b><kbd>Enter</kbd>';$('#hint').style.display='none';$('#skip').style.display='none';speak(w.hz);
    };
    $('#chk').onclick=()=>check(false);$('#skip').onclick=()=>check(true);
    keyHandler=e=>{if(e.key=='Enter'){e.preventDefault();check(false)}};
  };
  draw();
}
