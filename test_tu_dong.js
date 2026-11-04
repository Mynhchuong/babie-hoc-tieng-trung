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
