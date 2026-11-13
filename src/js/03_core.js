const S=store.s; // settings
if(S.front===undefined)S.front='hz'; if(!S.py2){S.showPy=false;S.py2=1}
store.e=store.e||{};const EDIT=store.e;
if(S.auto===undefined)S.auto=false; if(S.shuffle===undefined)S.shuffle=true;
if(!S.shuf2){S.shuffle=true;S.shuf2=1}   // bật lại 'Trộn thẻ' một lần cho máy từng lưu trạng thái tắt
if(S.book===undefined)S.book=0;

/* ---------- giao diện: 'pink' (mặc định) | 'work' (trung tính khi đi làm: không hồng, không tiếng, không hiệu ứng) ----------
   Mở bằng đường link ...?theme=work (hoặc ?theme=pink) để chọn ngay không cần vào Cài đặt. */
try{const q=new URLSearchParams(location.search).get('theme');if(q==='work'||q==='pink')S.theme=q}catch(e){}
if(S.theme!=='work')S.theme='pink';
const isWork=()=>S.theme==='work';
const PINK_ICON=(document.querySelector('link[rel=icon]')||{}).href||'';
const WORK_ICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%23364b63'/%3E%3Ctext x='50' y='72' font-size='66' text-anchor='middle' fill='white' font-family='sans-serif'%3E文%3C/text%3E%3C/svg%3E";
function applyTheme(){document.documentElement.dataset.theme=S.theme;document.title=isWork()?'Ôn tiếng Trung':'Halken nhắc Babie học tiếng Trung ♥';
  const l=document.querySelector('link[rel=icon]');if(l)l.href=isWork()?WORK_ICON:PINK_ICON}
function setTheme(t){S.theme=t;save();applyTheme()}
const plain=s=>isWork()?String(s).replace(/\s*[♥♡🎀🎉💌🧋]+/g,''):s;   // bỏ trái tim/nơ khỏi câu chữ ở giao diện làm việc
applyTheme();

/* ---------- bìa sách: ảnh bìa thật nếu có (build nhúng từ bia/bia_<ID sách>.jpg), không thì tự vẽ ---------- */
const COVER_COL={1:['#e0567a','#b3305a'],2:['#7c6bd1','#4d3fa6'],3:['#2f93c4','#1c6a94']};
function coverHTML(b){
  if(b.cover)return `<span class="cover"><img src="${b.cover}" alt="" draggable="false"></span>`;
  const m=String(b.name).match(/^(.*?)\s*(\d+)$/),hz=m?m[1]:b.name,no=m?m[2]:'',c=COVER_COL[b.id]||['#6b7785','#3e4856'];
  return `<span class="cover gen" style="background:linear-gradient(160deg,${c[0]},${c[1]})"><span class="cv-hz">${esc(hz)}</span><span class="cv-no">${esc(no)}</span><span class="cv-sub">${esc(b.short||'')}</span></span>`;
}

/* ---------- flatten words ---------- */
const ALL=[];
DATA.books.forEach((b,bi)=>b.lessons.forEach(l=>l.words.forEach((w,i)=>{
  const id=`${b.id}-${l.n}-${i}`;const o={id,hz:w[0],py:w[1],vi:EDIT[id]||w[2],orig:w[2],book:bi,lesson:l.n};
  ALL.push(o);(l._w=l._w||[]).push(o);l._bi=bi;
})));
const P=id=>store.p[id]||(store.p[id]={k:0,w:0,st:0});

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const ic=(n,c='',st='')=>`<svg class="ic ${c}" style="${st}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const LESSON_IC=['crown','heel','butterfly','dress','cupcake','balloon','gift','teddy','lipstick','rainbow','icecream','diamond','lollipop','wand','carriage','tiara','flower','glasses','perfume','star','envelope'];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function toast(m){m=plain(m);const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1800)}
function normPy(s){return s.replace(/[üǖǘǚǜ]/gi,'v').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ü|u:/g,'v').replace(/[^a-z]/g,'')}
function normVi(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}

/* ---------- đọc to (giọng Đài Loan nếu máy có) ---------- */
let voice=null;
// giọng nam ưu tiên (Windows: Zhiwei, Edge: YunJhe; macOS: Eddy, Reed, Rocko, Grandpa); Web Speech không có thông tin giới tính nên dò theo tên
const MALE_VOICES=['YunJhe','Yun-Jhe','Zhiwei','Eddy','Reed','Rocko','Grandpa'];
const zhVoices=()=>'speechSynthesis' in window?speechSynthesis.getVoices().filter(v=>/^zh/i.test(v.lang)):[];
function pickVoice(){
  if(!('speechSynthesis' in window))return;
  const vs=speechSynthesis.getVoices(),tw=vs.filter(v=>/zh[-_]TW/i.test(v.lang));
  voice=(S.voice&&vs.find(v=>v.name===S.voice))
    ||MALE_VOICES.map(n=>tw.find(v=>v.name.toLowerCase().includes(n.toLowerCase()))).find(Boolean)
    ||tw[0]||vs.find(v=>/zh[-_]HK/i.test(v.lang))||vs.find(v=>/^zh/i.test(v.lang))||null;
}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(t,manual){
  if(isWork()&&manual!==true)return;   // giao diện làm việc: không tự đọc to, chỉ đọc khi bấm nút 🔊
  if(!('speechSynthesis' in window)){toast('Trình duyệt không hỗ trợ đọc');return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);
  u.lang=voice?voice.lang:'zh-TW';if(voice)u.voice=voice;u.rate=.85;speechSynthesis.speak(u);
}

/* ---------- state ---------- */
let gen=0;
let view='home', sel=new Set(), deck=[], deckLessons=[], deckName='', mode='flash', search='';

