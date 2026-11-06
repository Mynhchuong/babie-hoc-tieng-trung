/* ================= NHẬT KÝ HỌC ================= */
store.log=store.log||{};const LOG=store.log;
if(!S.goal)S.goal=15;
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>dkey(new Date());
const day=k=>LOG[k]||(LOG[k]={s:0,a:0,f:null,t:null});
let lastAct=Date.now(),tick=0;
['mousedown','keydown','touchstart','wheel'].forEach(ev=>document.addEventListener(ev,()=>lastAct=Date.now(),{passive:true}));
setInterval(()=>{
  if(view!=='study'||document.hidden||Date.now()-lastAct>90000)return;
  const d=day(today()),now=new Date(),hm=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
  d.s++;if(!d.f)d.f=hm;d.t=hm;(d.tm=d.tm||{})[mode]=(d.tm[mode]||0)+1;
  if(++tick%10===0)save();
  const t=$('#tmr');if(t)t.textContent='⏱ Hôm nay: '+fmt(d.s);
},1000);
window.addEventListener('beforeunload',save);
document.addEventListener('visibilitychange',save);
function logAns(){day(today()).a++}
function fmt(sec){const m=Math.floor(sec/60);if(m<1)return sec+' giây';const h=Math.floor(m/60);return h?`${h} giờ ${m%60} phút`:`${m} phút`}
function streak(){
  let n=0;const d=new Date();
  if(!(LOG[dkey(d)]&&LOG[dkey(d)].s>=60))d.setDate(d.getDate()-1);
  while(LOG[dkey(d)]&&LOG[dkey(d)].s>=60){n++;d.setDate(d.getDate()-1)}
  return n;
}
const studied=()=>Object.keys(LOG).filter(k=>LOG[k].s>=60);
let calM=null;
function calendar(){
  const now=new Date();if(!calM)calM=new Date(now.getFullYear(),now.getMonth(),1);
  const y=calM.getFullYear(),m=calM.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  let h='';['T2','T3','T4','T5','T6','T7','CN'].forEach(w=>h+=`<div class="w">${w}</div>`);
  for(let i=0;i<first;i++)h+='<div></div>';
  for(let d=1;d<=n;d++){
    const k=`${y}-${pad(m+1)}-${pad(d)}`,s=(LOG[k]||{}).s||0,g=S.goal*60;
    const lv=s<60?'':s<g/2?'l1':s<g?'l2':'l3';
    h+=`<div class="d ${lv} ${k==today()?'td':''}" title="${s?fmt(s):''}">${d}</div>`;
  }
  return `<div class="card cal">${ic('bow','corner-ic',"top:-24px;left:50%;margin-left:-28px;width:56px;height:56px")}<div class="hd"><button id="cP">‹</button><b>Tháng ${m+1} / ${y}</b><button id="cN">›</button></div>
    <div class="days">${h}</div>
    <div class="legend">ít <i style="background:#ffd6ea"></i><i style="background:#ff9fcd"></i><i style="background:#e0218a"></i> đủ mục tiêu</div></div>`;
}


