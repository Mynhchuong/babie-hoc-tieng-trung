/* ================= BÁO CÁO HỌC TẬP: hôm nay · điểm mạnh/yếu · thành quả =================
   Dữ liệu theo dõi: store.p[id].c (số lần đúng) + .w (số lần sai) + .kd (ngày đầu thuộc);
   LOG[ngày].m = {kiểu:[đúng,sai]} · .tm = {chế độ:giây} · .wr = {id:số lần sai hôm đó}; store.ec = số lần nhầm pinyin theo luật. */
const KIND_NAME={flash:'Thẻ ghi nhớ (tự đánh giá)',quiz:'Trắc nghiệm Hán→Việt',quizv:'Trắc nghiệm Việt→Hán',write:'Viết pinyin',review:'Ôn tập ngắt quãng'};
const MODE_NAME={flash:'Thẻ ghi nhớ',quiz:'Trắc nghiệm',write:'Viết pinyin',list:'Danh sách',read:'Bài đọc',review:'Ôn tập'};
const PY_RULES=[['zh','z'],['ch','c'],['sh','s'],['n','l'],['f','h'],['r','l'],['ang','an'],['eng','en'],['ing','in']];   // các cặp hay nhầm
const pct=x=>Math.round(x*100)+'%';
const fmtMin=s=>s<60?s+' giây':Math.round(s/60)+' phút';
const dayLabel=k=>{const [y,m,d]=k.split('-');return `${d}/${m}/${y}`};

// luật nhầm pinyin: gõ khác đáp án đúng đúng 1 chỗ theo cặp (zh↔z, n↔l, ing↔in…) thì ghi lại
function pyConfusion(correctPy,typed){
  const t=normPy(typed);if(!t)return null;
  for(const v of pyVariants(correctPy))for(const [a,b] of PY_RULES)for(const [x,y] of [[a,b],[b,a]]){
    let i=-1;while((i=v.indexOf(x,i+1))>=0)if(v.slice(0,i)+y+v.slice(i+x.length)===t)return a+'↔'+b;
  }
  return null;
}
// ghi 1 lần trả lời (gọi từ Thẻ / Trắc nghiệm / Viết / Ôn tập)
function track(id,ok,kind,typed){
  const p=P(id),d=day(today());
  if(ok)p.c=(p.c||0)+1;
  if(p.k&&!p.kd)p.kd=today();
  d.m=d.m||{};(d.m[kind]=d.m[kind]||[0,0])[ok?0:1]++;
  if(!ok){d.wr=d.wr||{};d.wr[id]=(d.wr[id]||0)+1;
    if(kind==='write'&&typed){const r=pyConfusion(BYID[id].py,typed);if(r){store.ec=store.ec||{};store.ec[r]=(store.ec[r]||0)+1}}}
}
// tiến độ cũ chưa có ngày đầu thuộc → gán ngày học đầu tiên (hoặc hôm nay)
if(!S.kd1){const first=Object.keys(LOG).filter(k=>LOG[k].s>0).sort()[0]||today();ALL.forEach(w=>{const p=store.p[w.id];if(p&&p.k&&!p.kd)p.kd=first});S.kd1=1;save()}

function lessonStats(){
  const out=[];
  DATA.books.forEach((b,bi)=>b.lessons.forEach(l=>{const ws=l._w||[];let c=0,w=0,k=0,due=0;
    ws.forEach(x=>{const p=store.p[x.id];if(!p)return;c+=p.c||0;w+=p.w||0;if(p.k)k++;if(isDue(p))due++});
    out.push({b,bi,l,n:ws.length,k,c,w,att:c+w,acc:c+w?c/(c+w):null,due})}));
  return out;
}
function wordRank(){return ALL.map(x=>{const p=store.p[x.id]||{},att=(p.c||0)+(p.w||0);return {x,p,att,w:p.w||0,acc:att?(p.c||0)/att:null}}).filter(r=>r.att>=2)}
const hardWords=()=>wordRank().filter(r=>r.w>=2&&r.acc<.7).sort((a,b)=>b.w-a.w||a.acc-b.acc).slice(0,10);
const solidWords=()=>wordRank().filter(r=>r.att>=3&&r.acc>=.9&&r.p.k).sort((a,b)=>b.att-a.att).slice(0,8);
function modeAcc(days){const r={};for(let i=0;i<days;i++){const d=new Date();d.setDate(d.getDate()-i);const v=(LOG[dkey(d)]||{}).m;if(v)for(const k in v){const t=r[k]||(r[k]=[0,0]);t[0]+=v[k][0];t[1]+=v[k][1]}}return r}
function bestStreak(){let best=0,cur=0,prev=null;Object.keys(LOG).filter(k=>LOG[k].s>=60).sort().forEach(k=>{const d=new Date(k+'T00:00:00');
  cur=prev&&Math.round((d-prev)/864e5)===1?cur+1:1;prev=d;best=Math.max(best,cur)});return best}
const sumLog=f=>Object.values(LOG).reduce((a,d)=>a+(f(d)||0),0);

// nhận xét mạnh / yếu / gợi ý
function insights(){
  const strong=[],weak=[],tips=[],ma=modeAcc(30),kinds=Object.keys(ma).map(k=>({k,n:ma[k][0]+ma[k][1],acc:ma[k][0]/(ma[k][0]+ma[k][1]||1)})).filter(x=>x.n>=8);
  if(kinds.length>=2){const s=[...kinds].sort((a,b)=>b.acc-a.acc),hi=s[0],lo=s[s.length-1];
    if(hi.acc-lo.acc>=.1){strong.push(`${KIND_NAME[hi.k]}: đúng ${pct(hi.acc)}`);weak.push(`${KIND_NAME[lo.k]}: đúng ${pct(lo.acc)} — nên luyện thêm`)}
    else if(hi.acc>=.85)strong.push(`Các kiểu ôn đều đúng khoảng ${pct(hi.acc)}`)}
  else if(kinds.length===1){const x=kinds[0];(x.acc>=.85?strong:x.acc<.6?weak:tips).push(`${KIND_NAME[x.k]}: đúng ${pct(x.acc)}`)}
  const ls=lessonStats().filter(x=>x.att>=12&&x.acc!==null).sort((a,b)=>a.acc-b.acc);
  ls.filter(x=>x.acc<.75).slice(0,2).forEach(x=>weak.push(`Bài ${x.l.n} (${x.b.short||x.b.name}): chỉ đúng ${pct(x.acc)}`));
  [...ls].reverse().filter(x=>x.acc>=.9).slice(0,2).forEach(x=>strong.push(`Bài ${x.l.n} (${x.b.short||x.b.name}): đúng ${pct(x.acc)}`));
  const ec=Object.entries(store.ec||{}).sort((a,b)=>b[1]-a[1])[0];
  if(ec&&ec[1]>=2){weak.push(`Hay nhầm pinyin ${ec[0]} (${ec[1]} lần)`);tips.push(`Luyện riêng cặp âm ${ec[0]}: nghe giọng đọc rồi gõ lại`)}
  let n7=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);if((LOG[dkey(d)]||{}).s>=60)n7++}
  if(n7>=5)strong.push(`Học đều đặn: ${n7}/7 ngày gần đây`);else if(n7<=2&&Object.keys(LOG).length>3)weak.push(`Tuần này mới học ${n7}/7 ngày — học đều mỗi ngày sẽ nhớ lâu hơn`);
  const h=hardWords().length,due=srsDueList(true).length;
  if(h)tips.push(`Có ${h} từ hay sai — bấm "Ôn các từ yếu" bên dưới`);
  if(due>=10)tips.push(`Có ${due} từ đến hạn ôn lại — vào "Ôn lại từ đã học" trước khi học bài mới`);
  const fresh=lessonStats().filter(x=>x.n&&!x.att&&!x.k).slice(0,3);if(fresh.length&&fresh.length<lessonStats().length)tips.push(`Chưa học: ${fresh.map(x=>'Bài '+x.l.n).join(', ')}`);
  return {strong,weak,tips};
}

function badgeList(){
  const k=ALL.filter(w=>(store.p[w.id]||{}).k).length,mat=ALL.filter(w=>{const c=store.p[w.id];return inSrs(c)&&c.s==='r'&&c.iv>=21}).length;
  const hours=sumLog(d=>d.s)/3600,answers=sumLog(d=>d.a),rv=sumLog(d=>d.rv),best=bestStreak(),done=lessonStats().filter(x=>x.n&&x.k===x.n).length,nl=lessonStats().length;
  const B=[],add=(id,icon,name,cur,need)=>B.push({id,icon,name,cur,need,have:cur>=need});
  [3,7,14,30,60].forEach(n=>add('st'+n,'🔥',`Chuỗi ${n} ngày`,best,n));
  [...new Set([50,100,250,500,ALL.length])].filter(n=>n<=ALL.length).forEach(n=>add('w'+n,'📚',n===ALL.length?'Thuộc hết tất cả từ':`Thuộc ${n} từ`,k,n));
  [1,5,10,25,50].forEach(n=>add('h'+n,'⏱',`Học đủ ${n} giờ`,hours,n));
  [1,5,10,nl].filter(n=>n<=nl).forEach(n=>add('l'+n,'🎀',n===nl?'Thuộc hết mọi bài':`Thuộc trọn ${n} bài`,done,n));
  [100,500,1000].forEach(n=>add('r'+n,'🔁',`Ôn tập ${n} lượt`,rv,n));
  [25,100,300].forEach(n=>add('m'+n,'💎',`${n} từ thuộc lâu`,mat,n));
  [500,2000,5000].forEach(n=>add('a'+n,'✏️',`Làm ${n} câu`,answers,n));
  return B;
}
// huy hiệu mới → báo nhẹ 1 dòng (không pháo hoa)
function checkBadges(){
  const got=new Set(store.bd||[]),nw=badgeList().filter(b=>b.have&&!got.has(b.id));
  if(!nw.length)return;
  if(got.size||sumLog(d=>d.s)>600)setTimeout(()=>toast('🏆 Huy hiệu mới: '+nw[nw.length-1].name),900);
  store.bd=[...got,...nw.map(b=>b.id)];save();
}

/* ---------- giao diện báo cáo ---------- */
const bar=(v,cls='')=>`<div class="rbar ${cls}"><i style="width:${Math.max(2,Math.round(v*100))}%"></i></div>`;
const accCls=a=>a>=.85?'g':a>=.65?'y':'r';
function rpToday(){
  const d=LOG[today()]||{s:0,a:0},y=new Date();y.setDate(y.getDate()-1);const yd=LOG[dkey(y)]||{s:0};
  if(!(d.s>0))return `<p class="muted">Hôm nay bồ chưa học buổi nào. Học một chút rồi quay lại xem báo cáo nha ♡</p><p class="muted small">Hôm qua: ${yd.s?fmtMin(yd.s):'không học'}</p>`;
  const m=d.m||{},tot=Object.values(m).reduce((a,x)=>[a[0]+x[0],a[1]+x[1]],[0,0]),n=tot[0]+tot[1],tm=Object.entries(d.tm||{}).sort((a,b)=>b[1]-a[1]),tmax=Math.max(1,...tm.map(x=>x[1]));
  const wr=Object.entries(d.wr||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const gp=Math.round(d.s*100/(S.goal*60));
  return `<div class="srs-stats"><div><b>${Math.round(d.s/60)}</b>phút học (${gp}% mục tiêu)</div><div><b>${d.f||'–'}–${d.t||'–'}</b>giờ học</div><div><b>${d.a||0}</b>câu đã làm</div>
    <div><b>${n?pct(tot[0]/n):'–'}</b>trả lời đúng</div><div><b>${d.rv||0}</b>lượt ôn lại</div><div><b>${yd.s?(d.s>=yd.s?'▲':'▼')+Math.abs(Math.round((d.s-yd.s)/60)):'–'}</b>phút so với hôm qua</div></div>
  <h4>Hôm nay học bằng cách nào</h4>${tm.length?tm.map(([k,s])=>`<div class="rrow"><span>${MODE_NAME[k]||k}</span>${bar(s/tmax)}<em>${fmtMin(s)}</em></div>`).join(''):'<p class="muted small">Chưa ghi nhận.</p>'}
  <h4>Đúng / sai theo từng kiểu</h4>${Object.keys(m).length?Object.entries(m).map(([k,[r,w]])=>`<div class="rrow"><span>${KIND_NAME[k]||k}</span>${bar(r/(r+w||1),accCls(r/(r+w||1)))}<em>${r}/${r+w} đúng</em></div>`).join(''):'<p class="muted small">Chưa có câu nào.</p>'}
  <h4>Từ sai nhiều nhất hôm nay</h4>${wr.length?wr.map(([id,c])=>{const w=BYID[id];return `<div class="logrow"><span><b class="hzs">${esc(w.hz)}</b> ${esc(w.py)} <span class="muted small">${esc(w.vi)}</span></span><span>sai ${c} lần</span></div>`}).join(''):'<p class="muted">Hôm nay chưa sai từ nào, giỏi quá! 🎀</p>'}
  ${(d.l||[]).length?`<h4>Hôm nay đã học</h4><p class="muted">${(d.l||[]).map(esc).join(' · ')}</p>`:''}`;
}
function rpSw(){
  const ins=insights(),ma=modeAcc(30),hard=hardWords(),solid=solidWords(),ec=Object.entries(store.ec||{}).sort((a,b)=>b[1]-a[1]).slice(0,4),ls=lessonStats().filter(x=>x.att>=8&&x.acc!==null).sort((a,b)=>a.acc-b.acc);
  const list=(a,empty)=>a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p class="muted small">${empty}</p>`;
  const row=w=>`<div class="logrow"><span><b class="hzs">${esc(w.x.hz)}</b> ${esc(w.x.py)} <span class="muted small">${esc(w.x.vi)}</span></span><span>${w.w} sai · đúng ${pct(w.acc)}</span></div>`;
  return `<div class="rp-cols"><div class="rp-box good"><h4>💪 Điểm mạnh</h4>${list(ins.strong,'Học thêm vài buổi để app nhận ra điểm mạnh của bồ nha.')}</div>
    <div class="rp-box bad"><h4>🌱 Điểm cần cố gắng</h4>${list(ins.weak,'Chưa thấy điểm yếu rõ rệt — tuyệt vời!')}</div></div>
  ${ins.tips.length?`<div class="rp-box tip"><h4>💡 Gợi ý</h4>${list(ins.tips,'')}</div>`:''}
  <h4>Đúng bao nhiêu % (30 ngày gần nhất)</h4>${Object.keys(ma).length?Object.entries(ma).map(([k,[r,w]])=>`<div class="rrow"><span>${KIND_NAME[k]||k}</span>${bar(r/(r+w||1),accCls(r/(r+w||1)))}<em>${pct(r/(r+w||1))} (${r+w} câu)</em></div>`).join(''):'<p class="muted small">Chưa đủ dữ liệu.</p>'}
  <h4>Theo từng bài</h4>${ls.length?`<p class="muted small">Yếu nhất → mạnh nhất (bài đã làm ≥ 8 câu)</p>`+ls.slice(0,3).concat(ls.length>6?ls.slice(-3):ls.slice(3)).map(x=>`<div class="rrow"><span>Bài ${x.l.n} · ${esc(x.l.title||'')}${DATA.books.length>1?` <span class="muted small">${esc(x.b.short||x.b.name)}</span>`:''}</span>${bar(x.acc,accCls(x.acc))}<em>${pct(x.acc)} · thuộc ${x.k}/${x.n}</em></div>`).join(''):'<p class="muted small">Làm thêm vài câu trong mỗi bài để so sánh.</p>'}
  <h4>Từ khó nhất</h4>${hard.length?hard.map(row).join('')+`<button class="btn primary" id="rpHard" style="margin-top:10px">💔 Ôn các từ yếu (${hard.length})</button>`:'<p class="muted">Chưa có từ nào sai nhiều.</p>'}
  <h4>Từ vững nhất</h4>${solid.length?solid.map(row).join(''):'<p class="muted small">Chưa đủ dữ liệu.</p>'}
  ${ec.length?`<h4>Hay nhầm pinyin</h4>${ec.map(([k,n])=>`<div class="logrow"><span><b>${esc(k)}</b></span><span>${n} lần</span></div>`).join('')}`:''}`;
}
function rpAll(){
  const days=Object.keys(LOG).filter(k=>LOG[k].s>0).sort(),first=days[0],k=ALL.filter(w=>(store.p[w.id]||{}).k).length,mat=ALL.filter(w=>{const c=store.p[w.id];return inSrs(c)&&c.s==='r'&&c.iv>=21}).length;
  const att=ALL.reduce((a,w)=>{const p=store.p[w.id]||{};return [a[0]+(p.c||0),a[1]+(p.w||0)]},[0,0]),studied=days.filter(d=>LOG[d].s>=60).length,tot=sumLog(d=>d.s),top=[...days].sort((a,b)=>LOG[b].s-LOG[a].s)[0];
  const ls=lessonStats(),done=ls.filter(x=>x.n&&x.k===x.n).length,B=badgeList();
  // từ mới thuộc theo tuần (10 tuần gần nhất)
  const wk=[];for(let i=9;i>=0;i--){const e=new Date();e.setDate(e.getDate()-i*7);wk.push({e,n:0})}
  ALL.forEach(w=>{const p=store.p[w.id];if(!p||!p.k||!p.kd)return;const t=new Date(p.kd+'T00:00:00');for(let i=wk.length-1;i>=0;i--){const s=new Date(wk[i].e);s.setDate(s.getDate()-6);if(t>=new Date(s.getFullYear(),s.getMonth(),s.getDate())&&t<=new Date(wk[i].e.getFullYear(),wk[i].e.getMonth(),wk[i].e.getDate(),23,59)){wk[i].n++;break}}});
  const wmx=Math.max(1,...wk.map(x=>x.n));
  return `<div class="srs-stats"><div><b>${first?dayLabel(first):'–'}</b>ngày bắt đầu học</div><div><b>${studied}</b>ngày đã học</div><div><b>${(tot/3600).toFixed(1)}</b>giờ học tổng</div>
    <div><b>${k}/${ALL.length}</b>từ đã thuộc</div><div><b>${mat}</b>từ thuộc lâu</div><div><b>${att[0]+att[1]?pct(att[0]/(att[0]+att[1])):'–'}</b>đúng từ trước tới giờ</div>
    <div><b>${bestStreak()}</b>chuỗi dài nhất (ngày)</div><div><b>${streak()}</b>chuỗi hiện tại</div><div><b>${done}/${ls.length}</b>bài thuộc trọn</div>
    <div><b>${sumLog(d=>d.a)}</b>câu đã làm</div><div><b>${sumLog(d=>d.rv)}</b>lượt ôn lại</div><div><b>${top?Math.round(LOG[top].s/60):0}'</b>ngày học nhiều nhất</div></div>
  <h4>Từ mới thuộc theo tuần</h4><div class="fcast wide">${wk.map(x=>`<div><em>${x.n||''}</em><i style="height:${Math.round(x.n*50/wmx)+3}px"></i><span>${x.e.getDate()}/${x.e.getMonth()+1}</span></div>`).join('')}</div>
  <h4>Huy hiệu (${B.filter(b=>b.have).length}/${B.length})</h4><div class="badges">${B.map(b=>`<div class="bdg ${b.have?'on':''}" title="${esc(b.name)}"><span>${b.icon}</span><b>${esc(b.name)}</b><small>${b.have?'Đã đạt ✓':Math.floor(b.cur*10)/10+'/'+b.need}</small></div>`).join('')}</div>`;
}
function showReport(tab=1){
  const T=[['Hôm nay',rpToday],['Điểm mạnh · yếu',rpSw],['Thành quả',rpAll]];
  const m=modal(`<h3>${ic('diamond','',"width:34px;height:34px;vertical-align:-8px")} Báo cáo học tập</h3>
    <div class="tabs rp-tabs">${T.map((t,i)=>`<button class="tab ${i+1==tab?'on':''}" data-rp="${i+1}">${t[0]}</button>`).join('')}</div><div id="rpBody"></div>`);
  const show=n=>{m.querySelectorAll('[data-rp]').forEach(b=>b.classList.toggle('on',+b.dataset.rp===n));$('#rpBody').innerHTML=T[n-1][1]();
    const hb=$('#rpHard');if(hb)hb.onclick=()=>{m.remove();openDeck(hardWords().map(r=>r.x),'💔 Từ yếu nhất')}};
  m.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>show(+b.dataset.rp));show(tab);
}
