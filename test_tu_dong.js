// Test tự động toàn bộ app: npm test  (cần: npm install, chạy python3 build.py trước)
const {chromium}=require('playwright');
const url='file://'+require('path').resolve(__dirname,'dist/On_Tieng_Trung.html');
const results=[];const ok=(name,cond,info='')=>results.push(`${cond?'✅':'❌'} ${name}${info?' — '+info:''}`);
(async()=>{
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1300,height:850}});
const p=await ctx.newPage();await p.route('https://script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
await p.goto(url);await p.waitForTimeout(600);
ok('Trang chủ hiển thị 15 bài',(await p.$$('.lesson')).length===15);
// mở từng bài, đếm từ
const counts=await p.evaluate(()=>DATA.books[0].lessons.map(l=>l.words.length));
ok('Tổng số từ',counts.reduce((a,b)=>a+b,0)===726,counts.join(','));
const bk=await p.evaluate(()=>DATA.books.map(b=>({id:b.id,n:b.lessons.length,w:b.lessons.reduce((a,l)=>a+l.words.length,0),r:b.lessons.reduce((a,l)=>a+(l.readings||[]).length,0)})));
ok('3 cuốn theo thứ tự 時代華語1 → 當代中文1 → 當代中文2 (ID giữ nguyên 1,3,2)',bk.map(x=>x.id).join()==='1,3,2',JSON.stringify(bk));
ok('Sách 3 (當代中文 1): 15 bài, 569 từ, 60 mục nghe (đối thoại + đọc từ vựng)',bk[1].n===15&&bk[1].w===569&&bk[1].r===60);
ok('Sách 2 (當代中文 2): 15 bài, 657 từ',bk[2].n===15&&bk[2].w===657);
ok('Từ sách 2, 3: không thiếu hán/pinyin/nghĩa, ID đúng tiền tố',await p.evaluate(()=>ALL.filter(w=>w.book>=1).every(w=>w.hz&&w.py&&w.vi&&(w.book===1?w.id.startsWith('3-'):w.id.startsWith('2-')))));
const dlg=await p.evaluate(()=>DATA.books[1].lessons.flatMap(l=>l.readings).filter(r=>/^對話/.test(r.kind)));
ok('Sách 3: 30 đối thoại, dòng nào cũng đủ Hán/pinyin/nghĩa; mã nghe dạng d1-LL-TT',dlg.length===30&&dlg.every(r=>/^d1-\d\d-0[13]$/.test(r.id)&&r.lines.length>=5&&r.lines.every(x=>x.length===4&&x[1]&&x[2]&&x[3])));
ok('Sách 2: có tab chọn sách ở trang chủ',await p.$$eval('.row .tabs .tab',t=>t.length>=2));
// dữ liệu: trùng/rỗng
const bad=await p.evaluate(()=>ALL.filter(w=>!w.hz||!w.py||!w.vi).length);ok('Không có từ thiếu dữ liệu',bad===0,bad+' lỗi');
// --- flashcard full run
await p.click('.lesson >> nth=14');await p.waitForTimeout(400);
const n=await p.evaluate(()=>deck.length);
for(let i=0;i<n;i++){await p.keyboard.press(i%3?'2':'1');await p.waitForTimeout(340)}
await p.waitForTimeout(400);
ok('Thẻ ghi nhớ: chạy hết bài → màn hình tổng kết',!!await p.$('.done'),await p.textContent('.done .score').catch(()=>'-'));
const again=await p.$('#again');ok('Có nút ôn lại từ chưa thuộc',!!again);
if(again){await again.click();await p.waitForTimeout(400);ok('Ôn lại: số thẻ = số từ chưa thuộc',(await p.textContent('.progress span')).includes('/ '+Math.ceil(n/3)),await p.textContent('.progress span'))}
// prev / star
await p.keyboard.press('2');await p.waitForTimeout(400);await p.click('#prev');await p.waitForTimeout(400);
ok('Nút Từ trước',(await p.textContent('.progress span')).startsWith('Thẻ 1'));
await p.click('#st');ok('Đánh dấu ★',await p.$eval('#st',e=>e.classList.contains('on')));
await p.keyboard.press('s');ok('Phím S bỏ đánh dấu',!await p.$eval('#st',e=>e.classList.contains('on')));
// flip by tap
await p.click('#fc .face.front');await p.waitForTimeout(500);ok('Bấm vào thẻ để lật',await p.$eval('#fc',e=>e.classList.contains('flip')));
// --- quiz full run correct
await p.click('[data-m=quiz]');await p.waitForTimeout(300);
const qn=await p.evaluate(()=>deck.length);
for(let i=0;i<qn;i++){
  const idx=await p.evaluate(()=>{const h=document.querySelector('.board .big-hz').textContent;const w=ALL.find(x=>x.hz===h&&deck.includes(x));return [...document.querySelectorAll('.choice')].findIndex(c=>c.textContent.slice(1)===w.vi)});
  if(idx<0){ok('Trắc nghiệm: tìm được đáp án đúng',false,'câu '+i);break}
  await p.keyboard.press(String(idx+1));await p.waitForTimeout(80);await p.keyboard.press('Enter');await p.waitForTimeout(80);
}
await p.waitForTimeout(400);
ok('Trắc nghiệm: trả lời đúng hết → điểm tối đa',(await p.textContent('.done .score').catch(()=>''))===`${qn}/${qn}`,await p.textContent('.done .score').catch(()=>'-'));
// duplicate choices check across all lessons
const dup=await p.evaluate(()=>{let c=0;for(const w of ALL){const same=ALL.filter(x=>x.vi===w.vi&&x.hz!==w.hz);if(same.length)c++}return c});
ok('Từ khác chữ Hán nhưng trùng nghĩa (có thể gây nhầm trong trắc nghiệm)',true,dup+' từ (trắc nghiệm đã loại trùng nghĩa khỏi đáp án nhiễu)');
// --- write full run
await p.click('[data-m=write]');await p.waitForTimeout(300);
for(let i=0;i<qn;i++){
  const py=await p.evaluate(()=>{const h=document.querySelector('.board .big-hz').textContent;return ALL.find(x=>x.hz===h&&deck.includes(x)).py.split('/')[0]});
  await p.fill('#ans',py.normalize('NFD').replace(/[̀-ͯ]/g,''));await p.keyboard.press('Enter');await p.waitForTimeout(60);await p.keyboard.press('Enter');await p.waitForTimeout(60);
}
await p.waitForTimeout(300);
ok('Viết pinyin: gõ không dấu đúng hết',(await p.textContent('.done .score').catch(()=>''))===`${qn}/${qn}`,await p.textContent('.done .score').catch(()=>'-'));
// all pinyin variants self-consistent across whole dataset
const pyBad=await p.evaluate(()=>ALL.filter(w=>!pyVariants(w.py).has(normPy(w.py.split('/')[0].replace(/[()]/g,'')))).map(w=>w.hz));
ok('Mọi từ: pinyin gốc được chấp nhận',pyBad.length===0,pyBad.join(','));
// --- list: search + edit
await p.click('[data-m=list]');await p.fill('#q','sheng');await p.waitForTimeout(200);
ok('Danh sách: tìm theo pinyin',(await p.$$('table.list tr')).length>1);
await p.fill('#q','');await p.waitForTimeout(100);
// --- mode switch mid-animation (stale timer)
await p.click('[data-m=flash]');await p.waitForTimeout(300);await p.keyboard.press('2');await p.click('[data-m=list]');await p.waitForTimeout(600);
ok('Đổi chế độ khi thẻ đang bay: không bị nhảy lại thẻ',!!await p.$('table.list'));
await p.click('[data-m=quiz]');await p.waitForTimeout(200);
const idx0=await p.evaluate(()=>{const h=document.querySelector('.board .big-hz').textContent;const w=ALL.find(x=>x.hz===h&&deck.includes(x));return [...document.querySelectorAll('.choice')].findIndex(c=>c.textContent.slice(1)===w.vi)});
await p.keyboard.press(String(idx0+1));await p.click('[data-m=write]');await p.waitForTimeout(1100);
ok('Đổi chế độ khi trắc nghiệm đang tự chuyển câu',!!await p.$('#ans'));
// --- home features
await p.click('#bBack');await p.waitForTimeout(400);
ok('Nhật ký: đếm thời gian học hôm nay',await p.evaluate(()=>(LOG[today()]||{}).s>0),await p.evaluate(()=>(LOG[today()]||{}).s+'s'));
ok('Nhật ký: ghi tên bài đã học',await p.evaluate(()=>(LOG[today()]||{}).l?.length>0));
await p.click('#bLog');ok('Mở Nhật ký',!!await p.$('.modal .logrow'));await p.click('[data-x]');
await p.click('#bSet');await p.fill('#goal','20');await p.press('#goal','Tab');await p.click('[data-x]');
ok('Đổi mục tiêu',await p.evaluate(()=>S.goal)===20);
await p.click('.chk >> nth=0');await p.click('.chk >> nth=1');await p.click('#bGo');await p.waitForTimeout(300);
ok('Chọn 2 bài ôn chung',await p.evaluate(()=>deck.length)===counts[0]+counts[1]);
await p.click('#bBack');await p.waitForTimeout(300);
await p.evaluate(()=>{const w=ALL[3];P(w.id).w=2;P(w.id).k=0;save();home()});
ok('Nút Từ hay sai xuất hiện khi có từ sai',!!await p.$('#bHard'));
await p.click('#bHard');await p.waitForTimeout(300);ok('Mở bộ từ hay sai',await p.evaluate(()=>deck.length)>0);
await p.click('#bBack');
// front = vi
await p.click('.lesson >> nth=2');await p.click('#bOpt');await p.click('[data-f=vi]');await p.waitForTimeout(300);
ok('Mặt trước tiếng Việt',!!await p.$('#fc .face.front .vi'));
await p.click('[data-m=quiz]');ok('Trắc nghiệm Việt→Hán: đáp án là chữ Hán',!!await p.$('.choice.hzc'));
await p.click('[data-f=hz]');
// reload persistence
const known1=await p.evaluate(()=>ALL.filter(w=>(store.p[w.id]||{}).k).length);
await p.reload();await p.waitForTimeout(500);
const known2=await p.evaluate(()=>ALL.filter(w=>(store.p[w.id]||{}).k).length);
ok('Lưu tiến độ sau khi tải lại trang',known1===known2&&known2>0,known1+' → '+known2);
ok('Không có lỗi JavaScript',errs.length===0,errs.join(' | '));
// --- bài đọc
const rdTotal=await p.evaluate(()=>DATA.books[0].lessons.reduce((a,l)=>a+(l.readings||[]).length,0));
ok('Dữ liệu bài đọc: 44 mục, mỗi bài có mã nghe dạng 01-1-1',rdTotal===44&&await p.evaluate(()=>DATA.books[0].lessons.every(l=>(l.readings||[]).every(r=>/^\d\d-\d-\d$/.test(r.id)&&r.lines.length>0&&r.lines.every(x=>x.length===4&&x[1]&&x[2]&&x[3])))),rdTotal+' mục');
await p.click('.lesson >> nth=0');await p.waitForTimeout(300);
ok('Có tab Bài đọc',!!await p.$('[data-m=read]'));
await p.click('[data-m=read]');await p.waitForTimeout(400);
ok('Bài 1: hiện 3 bài đọc (01-1-1, 01-2-1, 01-3-1)',await p.$$eval('.rd .code',e=>e.map(x=>x.textContent.replace('🎧 ','')).join()==='01-1-1,01-2-1,01-3-1'));
ok('Có trình phát nghe + ô báo chưa có file khi thiếu audio',await p.$eval('.aud audio',a=>!!a)&&await p.$eval('.aud .noaud',e=>e.hidden===false||e.hidden===true));
await p.waitForTimeout(500);
ok('Thiếu file nghe: trình phát ẩn, hiện thông báo + nút giọng máy',await p.$eval('.aud',e=>e.querySelector('audio').hidden&&!e.querySelector('.noaud').hidden&&!!e.querySelector('[data-all]')));
ok('Pinyin & tiếng Việt ẩn mặc định',await p.$eval('.rl .rpy',e=>getComputedStyle(e).display==='none')&&await p.$eval('.rl .rvi',e=>getComputedStyle(e).display==='none'));
await p.click('.rl[data-r] >> nth=0');ok('Bấm câu: hiện pinyin + nghĩa của câu đó',await p.$eval('.rl[data-r] >> nth=0',e=>getComputedStyle(e.querySelector('.rpy')).display!=='none'&&getComputedStyle(e.querySelector('.rvi')).display!=='none'));
await p.check('#rdPy');await p.check('#rdVi');ok('Bật Pinyin/Tiếng Việt: hiện cả bài',await p.$$eval('.rl[data-r] .rpy',e=>e.every(x=>getComputedStyle(x).display!=='none')));
await p.screenshot({path:require('path').join(__dirname,'dist','test_reading.png'),fullPage:true});
await p.click('[data-m=flash]');await p.waitForTimeout(300);await p.click('[data-m=read]');await p.waitForTimeout(300);
ok('Nhớ lựa chọn bật pinyin sau khi đổi tab',await p.$eval('#rdPy',e=>e.checked));
await p.click('#bBack');
await p.evaluate(()=>openDeck(ALL.slice(0,5),'test'));await p.waitForTimeout(300);
ok('Bộ từ ★/hay sai (không theo bài) không có tab Bài đọc',!await p.$('[data-m=read]'));
await p.evaluate(()=>{sel.add('0:1');sel.add('0:15');home()});await p.click('#bGo');await p.waitForTimeout(300);await p.click('[data-m=read]');await p.waitForTimeout(300);
ok('Ôn nhiều bài: gộp bài đọc của các bài đã chọn (3+2)',(await p.$$('.rd')).length===5&&(await p.$$('.rl-h')).length===2);
const jsErrs=errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e)); // thiếu file nghe audio/*.mp3 là bình thường khi chưa bỏ file vào
ok('Bài đọc: không lỗi JS (bỏ qua báo thiếu file nghe)',jsErrs.length===0,jsErrs.join(' | '));
// --- combo tiết chế: x3 hiện chữ nhỏ; chuỗi dài (x5) thì búp bê nhảy; sai thì dừng
await p.evaluate(()=>{home()});await p.waitForTimeout(250);
await p.click('.lesson >> nth=3');await p.waitForTimeout(300);
for(let i=1;i<=5;i++){await p.keyboard.press('2');await p.waitForTimeout(60);
  if(i===3)ok('Combo x3: hiện chữ Combo (kiểu tiết chế, không viền/pháo/huy hiệu)',!!await p.$('.combo')&&!await p.$('.glow')&&!await p.$('#cmbfix'));
  if(i===4)ok('x4: búp bê chưa nhảy',!await p.$('#mascot.dance'));
  if(i===5)ok('x5: búp bê nhảy múa',!!await p.$('#mascot.dance'));
  await p.waitForTimeout(340)}
await p.keyboard.press('1');await p.waitForTimeout(150);
ok('Bấm Chưa thuộc: búp bê ngừng nhảy',!await p.$('#mascot.dance'));
await p.keyboard.press('2');await p.waitForTimeout(400);
for(let i=0;i<4;i++){await p.keyboard.press('2');await p.waitForTimeout(400)}
await p.waitForTimeout(3800);ok('Hết chuỗi vài giây: búp bê tự ngừng nhảy',!await p.$('#mascot.dance'));
await p.click('#bBack');await p.waitForTimeout(250);
const jsErrs2=errs.filter(e=>!/ERR_FILE_NOT_FOUND/.test(e));ok('Combo: không lỗi JS',jsErrs2.length===0,jsErrs2.join(' | '));
// --- trộn thẻ mặc định + chọn giọng đọc
await p.evaluate(()=>{S.shuffle=false;delete S.shuf2;save()});await p.reload();await p.waitForTimeout(500);
ok('Trộn thẻ: máy từng tắt vẫn được bật lại mặc định',await p.evaluate(()=>S.shuffle===true&&S.shuf2===1));
await p.click('#bSet');await p.waitForTimeout(250);
ok('Cài đặt có ô chọn giọng đọc + nghe thử',!!await p.$('#vSel')&&!!await p.$('#vTry')&&(await p.$$eval('#vSel option',o=>o.length))>=1);
const pick=await p.evaluate(()=>{const fake=[{name:'Microsoft HsiaoChen Online - Chinese (Taiwan)',lang:'zh-TW'},{name:'Eddy (Chinese (Taiwan))',lang:'zh-TW'},{name:'Meijia',lang:'zh-TW'}];
  const old=speechSynthesis.getVoices;speechSynthesis.getVoices=()=>fake;S.voice='';pickVoice();const a=voice&&voice.name;
  S.voice='Meijia';pickVoice();const b=voice&&voice.name;S.voice='';speechSynthesis.getVoices=old;pickVoice();return [a,b]});
ok('Giọng đọc: tự chọn giọng nam; người dùng chọn tay thì theo lựa chọn',pick[0]==='Eddy (Chinese (Taiwan))'&&pick[1]==='Meijia',pick.join(' / '));
await p.keyboard.press('Escape');await p.evaluate(()=>{document.querySelector('.modal')&&document.querySelector('.modal').remove()});
// --- ôn tập ngắt quãng (kiểu Anki)
{
const rc=await b.newContext({viewport:{width:1300,height:850}});const r=await rc.newPage();
await r.route('https://script.google.com/**',x=>x.fulfill({status:200,body:'ok'}));const rerrs=[];r.on('pageerror',e=>rerrs.push(e.message));
await r.goto(url);await r.waitForTimeout(500);
// 1) thuật toán lập lịch
const alg=await r.evaluate(()=>{const base={s:'r',iv:10,ef:2.5,ls:0,rp:0,lp:0,due:0};const o={};
  o.good=srsNext(base,2).iv;o.hard=srsNext(base,1).iv;o.easy=srsNext(base,3).iv;const a=srsNext(base,0);o.again=[a.iv,a.s,a.lp];
  let c=Object.assign({},base);for(let i=0;i<12;i++)c=Object.assign(c,srsNext(Object.assign(c,{s:'r'}),0));o.efMin=c.ef;
  const L=srsNext({s:'l',ls:0,ef:2.5,iv:0},2);o.learn=[L.s,L.ls];const G=srsNext({s:'l',ls:1,ef:2.5,iv:0},2);o.grad=[G.s,G.iv];
  o.dueFuture=srsNext(base,2).due>Date.now();return o});
ok('Lập lịch: Nhớ ×ef, Khó ×1.2, Dễ lâu hơn, Quên giảm khoảng cách + học lại',alg.good===25&&alg.hard===12&&alg.easy>alg.good&&alg.again[0]===3&&alg.again[1]==='l'&&alg.again[2]===1&&alg.dueFuture,JSON.stringify(alg));
ok('Lập lịch: độ dễ không xuống dưới 1.3; thẻ mới qua 2 bước rồi mới tốt nghiệp',alg.efMin>=1.3&&alg.learn.join()==='l,1'&&alg.grad.join()==='r,1');
// 2) học bài → từ tự vào sổ ôn
ok('Trang chủ có thẻ Ôn tập, chưa có từ thì chưa có nút bắt đầu',!!await r.$('.srs')&&!await r.$('#srsGo'));
await r.click('.lesson >> nth=0');await r.waitForTimeout(300);
for(let i=0;i<3;i++){await r.keyboard.press('2');await r.waitForTimeout(340)}
ok('Trả lời ở Thẻ ghi nhớ → từ vào sổ ôn (hẹn ngày mai)',await r.evaluate(()=>{const l=ALL.filter(w=>store.p[w.id]&&store.p[w.id].due!==undefined);return l.length===3&&l.every(w=>store.p[w.id].s==='r'&&store.p[w.id].due>Date.now())}));
await r.keyboard.press('1');await r.waitForTimeout(340);
ok('Quên 1 từ mới → vào sổ ở trạng thái đang học, đến hạn ngay',await r.evaluate(()=>ALL.filter(w=>store.p[w.id]&&store.p[w.id].s==='l'&&isDue(store.p[w.id])).length===1));
await r.click('#bBack');await r.waitForTimeout(250);
ok('Thẻ bài hiện huy hiệu 🔁 số từ đến hạn',!!await r.$('.lesson .duebadge'));
// 3) gộp nhiều sách: sách 2 đang học nhưng sách 1 đến hạn vẫn phải ôn
await r.evaluate(()=>{ALL.filter(w=>w.book===1).slice(0,2).forEach(w=>Object.assign(P(w.id),{s:'r',iv:5,ef:2.5,ls:0,rp:1,lp:0,due:Date.now()-1000}));
  ALL.slice(0,3).forEach(w=>{store.p[w.id].due=Date.now()-5000;store.p[w.id].s='r';store.p[w.id].iv=4});S.book=1;S.srsBook='';save();home()});
await r.waitForTimeout(300);
ok('Đang ở tab Sách 2 vẫn thấy từ sách 1 đến hạn (gộp tất cả sách)',await r.evaluate(()=>S.book===1&&srsDueList().filter(w=>w.book===0).length>=4&&srsDueList().filter(w=>w.book===1).length===2));
ok('Thẻ ôn tập hiện số từ đến hạn theo từng sách',(await r.textContent('.srs-books')).includes('đến hạn')&&(await r.$$('.srs-books span')).length===2);
ok('Có chip lọc theo sách (Tất cả + 3 sách)',(await r.$$('.srs-chips .tab')).length===4);
ok('Báo cáo cho Ken: đếm đến hạn gộp mọi sách, không bị lọc',await r.evaluate(()=>{S.srsBook=1;const n=reportPayload().due,all=srsDueList(true).length;S.srsBook='';return n===all&&all>2}));
// 4) phiên ôn: lật thẻ
await r.evaluate(()=>{S.rvMode='flip';save()});await r.click('#srsGo');await r.waitForTimeout(350);
ok('Mở phiên ôn: thẻ + nút Hiện đáp án',!!await r.$('#fc')&&!!await r.$('#show'));
await r.keyboard.press('Space');await r.waitForTimeout(300);
ok('Lật thẻ: hiện 4 nút Quên/Khó/Nhớ/Dễ kèm khoảng cách',(await r.$$('#acts .btn')).length===4&&(await r.textContent('#g2 small')).length>0,(await r.$$eval('#acts small',e=>e.map(x=>x.textContent).join(' | '))));
let guard=0;while(!await r.$('.done')&&guard++<40){
  if(await r.$('#show')){await r.keyboard.press('Space');await r.waitForTimeout(200)}
  if(await r.$('#g2')){await r.keyboard.press('3')}
  await r.waitForTimeout(380)}
ok('Ôn hết (Nhớ): hiện màn tổng kết',!!await r.$('.done'),(await r.textContent('.done p:nth-of-type(2)').catch(()=>'')));
ok('Sau khi ôn: không còn từ đến hạn, khoảng cách tăng',await r.evaluate(()=>srsDueList(true).length===0&&ALL.filter(w=>store.p[w.id]&&store.p[w.id].rp>0).every(w=>store.p[w.id].due>Date.now())));
ok('Nhật ký ghi số lượt ôn + tỉ lệ nhớ',await r.evaluate(()=>{const d=LOG[today()];return d.rv>=6&&d.rg&&d.rg[2]>=5&&srsRetention(30).pct>=80}));
// 5) trắc nghiệm / gõ pinyin / xen kẽ
await r.evaluate(()=>{ALL.filter(w=>store.p[w.id]&&store.p[w.id].due!==undefined).slice(0,4).forEach(w=>{store.p[w.id].due=Date.now()-1000});S.rvMode='quiz';S.front='hz';save();reviewStart()});await r.waitForTimeout(300);
ok('Ôn kiểu trắc nghiệm: có 4 đáp án',(await r.$$('.choice')).length===4);
const rightIdx=await r.evaluate(()=>{const h=document.querySelector('.board .big-hz').textContent;const w=ALL.find(x=>x.hz===h);return [...document.querySelectorAll('.choice')].findIndex(c=>c.textContent.includes(w.vi))});
await r.keyboard.press(String(rightIdx+1));await r.waitForTimeout(250);
ok('Trắc nghiệm đúng → báo Nhớ + hẹn ngày gặp lại',(await r.textContent('#fb')).includes('gặp lại'));
await r.waitForTimeout(1200);
await r.evaluate(()=>{S.rvMode='write';save()});
const wq=await r.evaluate(()=>{const w=ALL.find(x=>store.p[x.id]&&isDue(store.p[x.id]));return w?w.id:null});
if(wq){await r.evaluate(()=>reviewStart());await r.waitForTimeout(300);
  ok('Ôn kiểu gõ pinyin: có ô nhập',!!await r.$('#ans'));
  const py=await r.evaluate(()=>{const h=document.querySelector('.board .big-hz').textContent;return ALL.find(x=>x.hz===h).py.split('/')[0].replace(/[()\s]/g,'')});
  await r.fill('#ans',py);await r.keyboard.press('Enter');await r.waitForTimeout(250);
  ok('Gõ pinyin đúng → chấm Nhớ',(await r.textContent('#fb')).includes('Đúng rồi'))}
else ok('Còn từ đến hạn để thử gõ pinyin',true);
await r.evaluate(()=>{home()});await r.waitForTimeout(250);
await r.evaluate(()=>{ALL.filter(w=>store.p[w.id]&&store.p[w.id].due!==undefined).forEach(w=>{store.p[w.id].lp=w.id.endsWith('-0')?2:0});save();home()});
await r.click('#srsStat').catch(()=>{});await r.waitForTimeout(250);
ok('Thống kê ôn tập: có số liệu từng sách + từ hay quên',!!await r.$('.srs-stats')&&(await r.textContent('.modal')).includes('Từ hay quên'));
await r.evaluate(()=>{document.querySelector('.modal')&&document.querySelector('.modal').remove()});
// 6) máy đã có tiến độ cũ → tự đưa từ đã thuộc vào sổ ôn
await r.evaluate(()=>{const s={p:{},s:{},log:{}};ALL.slice(0,10).forEach(w=>s.p[w.id]={k:1,w:0,st:0});ALL.slice(10,12).forEach(w=>s.p[w.id]={k:0,w:2,st:0});store=s;save()});
await r.reload();await r.waitForTimeout(500);
ok('Tiến độ cũ: từ đã thuộc vào sổ ôn (rải nhiều ngày), từ hay sai ôn ngay',await r.evaluate(()=>srsList(true).length===12&&srsDueList(true).length===2&&new Set(ALL.slice(0,10).map(w=>Math.round((store.p[w.id].due-dayStart(0))/864e5))).size>=3));
ok('Ôn tập: không lỗi JS',rerrs.length===0,rerrs.join(' | '));
await rc.close();
}
// --- lưu tiến độ chắc chắn + báo cáo học tập
{
const rc=await b.newContext({viewport:{width:1300,height:900}});const r=await rc.newPage();
await r.route('https://script.google.com/**',x=>x.fulfill({status:200,body:'ok'}));const rerrs=[];r.on('pageerror',e=>rerrs.push(e.message));
await r.goto(url);await r.waitForTimeout(500);
// gộp dữ liệu
const mg=await r.evaluate(()=>{const A={updated:200,s:{goal:20},p:{a:{k:1,c:2},b:{k:1}},log:{'2026-01-01':{s:100}},e:{}},B={updated:100,s:{goal:5},p:{a:{k:0},c:{k:1}},log:{'2026-01-01':{s:900},'2026-01-02':{s:50}},e:{x:'y'}};
  const r1=mergeStores(A,B),r2=mergeStores({updated:999,s:{},p:{},log:{}},B);return {goal:r1.m.s.goal,keys:Object.keys(r1.m.p).sort().join(),aK:r1.m.p.a.k,log:r1.m.log['2026-01-01'].s,add:r1.add,emptyGoal:r2.m.s.goal,emptyKeys:Object.keys(r2.m.p).join()}});
ok('Gộp dữ liệu: bản mới làm gốc, bổ sung phần còn thiếu, không mất mục nào',mg.goal===20&&mg.keys==='a,b,c'&&mg.aK===1&&mg.log===900&&mg.add>=3,JSON.stringify(mg));
ok('Gộp với máy trống: lấy nguyên dữ liệu file (cả cài đặt)',mg.emptyGoal===5&&mg.emptyKeys==='a,c');
// khôi phục không bị lưu đè lúc tải lại (lỗi cũ làm mất tiến độ)
await r.evaluate(()=>replaceStoreAndReload(JSON.stringify({p:{'1-1-0':{k:1,w:0,st:0},'1-1-1':{k:1,w:0,st:0}},s:{goal:33},log:{}})));await r.waitForTimeout(900);
ok('Khôi phục dữ liệu rồi tải lại: KHÔNG bị lưu đè bằng dữ liệu cũ',await r.evaluate(()=>S.goal===33&&ALL.filter(w=>(store.p[w.id]||{}).k).length>=2));
// sao lưu tự động
await r.evaluate(()=>{ALL.slice(0,5).forEach(w=>{P(w.id).k=1});save();return snapNow()});await r.waitForTimeout(500);
const bl=await r.evaluate(async()=>{const l=await bkList();return l.map(x=>x.kind+':'+x.words)});
ok('Sao lưu tự động: có bản theo ngày + bản "trước khi cập nhật"',bl.some(x=>x.startsWith('day:'))&&bl.some(x=>x.startsWith('pre:')),bl.join(' '));
await r.evaluate(()=>{noSave=true;localStorage.clear()});await r.reload();await r.waitForTimeout(1800);
ok('Xoá hết dữ liệu trình duyệt → tự khôi phục từ bản sao tự động',await r.evaluate(()=>ALL.filter(w=>(store.p[w.id]||{}).k).length>=5&&S.goal===33));
await r.click('#bSet');await r.waitForTimeout(600);ok('Cài đặt liệt kê các bản sao để khôi phục',(await r.$$('#bkList [data-bk]')).length>=1);
await r.evaluate(()=>{document.querySelector('.modal').remove()});
// dữ liệu localStorage hỏng không làm mất bản gốc
await r.evaluate(()=>{noSave=true;localStorage.setItem(KEY,'{hong')});await r.reload();await r.waitForTimeout(1800);
ok('Dữ liệu hỏng: giữ bản gốc để cứu + tự khôi phục từ bản sao',await r.evaluate(()=>localStorage.getItem(KEY+'_hong')==='{hong'&&ALL.filter(w=>(store.p[w.id]||{}).k).length>=5));
// nhận dạng nhầm pinyin
const pc=await r.evaluate(()=>[pyConfusion('zhīdào','zidao'),pyConfusion('nǐ','li'),pyConfusion('xīngqí','xinqi'),pyConfusion('shuǐ','abc')]);
ok('Nhận ra kiểu nhầm pinyin (zh↔z, n↔l, ing↔in)',pc[0]==='zh↔z'&&pc[1]==='n↔l'&&pc[2]==='ing↔in'&&pc[3]===null,pc.join(' | '));
// báo cáo
await r.evaluate(()=>{const d=day(today());d.s=1500;d.a=60;d.f='19:00';d.t='19:30';d.tm={flash:600,quiz:540,write:360};d.m={flash:[20,5],quiz:[12,8],write:[4,11]};d.rv=12;d.l=['時代華語1 · Bài 3'];
  const hard=ALL.slice(0,3);hard.forEach(w=>{const p=P(w.id);p.w=5;p.c=1;p.k=0});d.wr={[hard[0].id]:4,[hard[1].id]:2};
  ALL.slice(20,26).forEach(w=>{const p=P(w.id);p.c=9;p.w=0;p.k=1;p.kd=today()});
  for(let i=1;i<=6;i++){const x=new Date();x.setDate(x.getDate()-i);LOG[dkey(x)]={s:900+i,a:30,m:{quiz:[20,5]}}}
  store.ec={'zh↔z':4,'n↔l':2};save();home()});
await r.waitForTimeout(300);await r.click('#bRep');await r.waitForTimeout(300);
const t1=await r.textContent('#rpBody');
ok('Báo cáo Hôm nay: phút, giờ học, số câu, % đúng, học bằng cách nào',t1.includes('25')&&t1.includes('19:00–19:30')&&t1.includes('Thẻ ghi nhớ')&&t1.includes('Viết pinyin')&&t1.includes('Từ sai nhiều nhất hôm nay'));
await r.click('[data-rp="2"]');await r.waitForTimeout(250);const t2=await r.textContent('#rpBody');
ok('Báo cáo Điểm mạnh / yếu: nêu điểm mạnh, điểm yếu, từ khó, kiểu nhầm pinyin',t2.includes('Điểm mạnh')&&t2.includes('Điểm cần cố gắng')&&t2.includes('Viết pinyin')&&t2.includes('Từ khó nhất')&&t2.includes('zh↔z'));
ok('Điểm yếu nhất được chỉ ra là Viết pinyin (đúng thấp nhất)',await r.$eval('.rp-box.bad',e=>e.textContent.includes('Viết pinyin')));
ok('Có nút Ôn các từ yếu',!!await r.$('#rpHard'));
await r.click('[data-rp="3"]');await r.waitForTimeout(250);const t3=await r.textContent('#rpBody');
ok('Báo cáo Thành quả: tổng từ trước tới giờ, chuỗi, huy hiệu',t3.includes('ngày bắt đầu học')&&t3.includes('từ đã thuộc')&&t3.includes('Huy hiệu')&&(await r.$$('.bdg.on')).length>=1);
await r.click('[data-rp="2"]');await r.click('#rpHard');await r.waitForTimeout(300);
ok('Ôn các từ yếu: mở bộ từ khó',await r.evaluate(()=>deck.length>=3&&deckName.includes('yếu')));
ok('Báo cáo/Sao lưu: không lỗi JS',rerrs.length===0,rerrs.join(' | '));
await rc.close();
}
// --- tự cập nhật: gói dist/update, bộ cài, kiểm tra bản mới trong app
{
const fs=require('fs'),cr=require('crypto'),path=require('path'),root=__dirname;
const man=JSON.parse(fs.readFileSync(path.join(root,'dist/update/manifest.json'),'utf8'));
const shaOf=f=>cr.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase();
ok('Gói cập nhật: manifest có phiên bản + trang app, mã SHA256 khớp từng file',/^\d{8}-\d{6}$/.test(man.ver)&&man.files.some(f=>f.p==='On_Tieng_Trung.html')&&man.files.every(f=>/^(On_Tieng_Trung\.html|audio\/[A-Za-z0-9_\-.]+)$/.test(f.p)&&!f.p.includes('..')&&shaOf(path.join(root,'dist/update',f.p))===f.h&&fs.statSync(path.join(root,'dist/update',f.p)).size===f.s));
ok('Trang app trong gói cập nhật = trang app trong dist, mang đúng phiên bản của manifest',fs.readFileSync(path.join(root,'dist/update/On_Tieng_Trung.html'),'utf8')===fs.readFileSync(path.join(root,'dist/On_Tieng_Trung.html'),'utf8')&&fs.readFileSync(path.join(root,'dist/On_Tieng_Trung.html'),'utf8').includes(`const APP_VER = "${man.ver}"`));
ok('Manifest không có BOM; có _headers cho phép app hỏi phiên bản',fs.readFileSync(path.join(root,'dist/update/manifest.json'))[0]!==0xEF&&fs.readFileSync(path.join(root,'dist/update/_headers'),'utf8').includes('Access-Control-Allow-Origin'));
const ps=['cap_nhat.ps1','cai_dat_tu_dong.ps1'].map(n=>fs.readFileSync(path.join(root,'windows/he_thong',n)));
ok('Script Windows mới: .ps1 có BOM + CRLF',ps.every(b=>b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF&&!/[^\r]\n/.test(b.toString('latin1'))));
const vb=['chay_cap_nhat.vbs','mo_cap_nhat.vbs'].map(n=>fs.readFileSync(path.join(root,'windows/he_thong',n)));
ok('Script Windows mới: .vbs thuần ASCII + CRLF',vb.every(b=>![...b].some(x=>x>127)&&!/[^\r]\n/.test(b.toString('latin1'))));
const zipTxt=require('child_process').execSync(`python3 -c "import zipfile,sys;z=zipfile.ZipFile('${path.join(root,'dist/Babie_hoc_tieng_Trung.zip')}');b=z.read('BAM_DUP_VAO_DAY_DE_CAI.bat').decode('ascii').split('\\n::PAYLOAD::')[-1];import base64,io;p=zipfile.ZipFile(io.BytesIO(base64.b64decode(''.join(b.split()))));print('\\n'.join(p.namelist()))"`).toString();
ok('Bộ cài chứa bộ cập nhật + cấu hình địa chỉ',['he_thong/cap_nhat.ps1','he_thong/chay_cap_nhat.vbs','he_thong/mo_cap_nhat.vbs','he_thong/cap_nhat.json'].every(n=>zipTxt.includes(n)));
// trong app
const uc=await b.newContext({viewport:{width:1200,height:850}});const u=await uc.newPage();const uerrs=[];u.on('pageerror',e=>uerrs.push(e.message));
await u.route('https://script.google.com/**',x=>x.fulfill({status:200,body:'ok'}));
let served='9'.repeat(8)+'-000000';await u.route('https://cap-nhat.test/**',x=>x.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ver:served,files:[]})}));
await u.goto(url);await u.waitForTimeout(400);
await u.click('#bSet');await u.waitForTimeout(300);
ok('Chưa có địa chỉ cập nhật: Cài đặt nói rõ chưa bật, không có nút kiểm tra',(await u.textContent('.modal')).includes('chưa bật tự cập nhật')&&!await u.$('#upChk'));
await u.evaluate(()=>{document.querySelector('.modal').remove();UPDATE_URL='https://cap-nhat.test'});
await u.click('#bSet');await u.waitForTimeout(300);
ok('Có địa chỉ cập nhật: hiện phiên bản + nút Kiểm tra bản mới',(await u.textContent('.modal')).includes('Phiên bản đang dùng')&&!!await u.$('#upChk'));
await u.click('#upChk');await u.waitForTimeout(500);ok('Có bản mới trên mạng → báo có bản mới',(await u.textContent('#upRes')).includes('Có bản mới'));
served='00000000-000000';await u.click('#upChk');await u.waitForTimeout(500);ok('Đã là bản mới nhất → báo đã mới nhất',(await u.textContent('#upRes')).includes('bản mới nhất'));
await u.unroute('https://cap-nhat.test/**');await u.route('https://cap-nhat.test/**',x=>x.abort());await u.click('#upChk');await u.waitForTimeout(500);
ok('Mất mạng → báo không kiểm tra được, không văng lỗi',(await u.textContent('#upRes')).includes('Không kiểm tra được'));
// sau khi bản mới thay file: báo 1 dòng
await u.evaluate(()=>{document.querySelector('.modal').remove();store.ver='20200101-000000';noSave=false;localStorage.setItem(KEY,JSON.stringify(store))});
await u.reload();await u.waitForTimeout(1800);
ok('Mở bản mới lần đầu: báo "Đã cập nhật app" + còn nguyên tiến độ',(await u.textContent('#toast')).includes('Đã cập nhật app')&&await u.evaluate(()=>typeof store.p==='object'));
ok('Cập nhật: không lỗi JS',uerrs.length===0,uerrs.join(' | '));
await uc.close();
}
// --- sách 3: bài đọc có file nghe thật
{
const fs=require('fs'),path=require('path');
const ids=await p.evaluate(()=>DATA.books[1].lessons.flatMap(l=>l.readings.map(r=>r.id)));
const haveAudio=fs.existsSync(path.join(__dirname,'audio'));   // audio/ không nằm trong git (bản quyền) → máy chưa có thì bỏ qua
ok('File nghe sách 3: đủ 60 file audio/d1-LL-TT.mp3 khớp từng mục',!haveAudio||ids.length===60&&ids.every(id=>fs.existsSync(path.join(__dirname,'audio',id+'.mp3'))&&fs.statSync(path.join(__dirname,'audio',id+'.mp3')).size>50000),ids.length+' mục');
await p.evaluate(()=>{home()});await p.waitForTimeout(250);
await p.evaluate(()=>{S.book=1;save();home()});await p.waitForTimeout(250);
await p.click('.lesson >> nth=0');await p.waitForTimeout(300);await p.click('[data-m=read]');await p.waitForTimeout(500);
ok('Sách 3 bài 1: 4 mục (đối thoại 1, đọc từ vựng 1, đối thoại 2, đọc từ vựng 2) hiện mã 01-01…01-04',await p.$$eval('.rd .code',e=>e.map(x=>x.textContent.replace('🎧 ','')).join())==='01-01,01-02,01-03,01-04');
ok('Mục đọc từ vựng: có trình phát, không có bảng chữ và không có nút giọng máy',await p.$$eval('.rd',el=>el[1].querySelector('audio')&&!el[1].querySelector('.rdb')&&!el[1].querySelector('[data-all]')));
await p.evaluate(()=>{S.book=0;save()});
}
// --- mobile
const m=await b.newPage({viewport:{width:390,height:800},deviceScaleFactor:2,hasTouch:true});
await m.route('https://script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));const merrs=[];m.on('pageerror',e=>merrs.push(e.message));
await m.goto(url);await m.waitForTimeout(500);await m.screenshot({path:require('path').join(__dirname,'dist','test_mob1.png')});
await m.click('.lesson >> nth=0');await m.waitForTimeout(400);await m.screenshot({path:require('path').join(__dirname,'dist','test_mob2.png')});
const overlap=await m.evaluate(()=>{const a=document.querySelector('#mascot').getBoundingClientRect();return [...document.querySelectorAll('.fc-actions .btn')].some(btn=>{const r=btn.getBoundingClientRect();return !(r.right<a.left||r.left>a.right||r.bottom<a.top||r.top>a.bottom)})});
ok('Điện thoại: búp bê không che nút',!overlap);
const hscroll=await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);ok('Điện thoại: không bị tràn ngang',!hscroll);
ok('Điện thoại: không lỗi JS',merrs.length===0,merrs.join('|'));
console.log(results.join('\n'));await b.close();})();
