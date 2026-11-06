/* ---------- BÁO CÁO CHO HALKEN (Google Apps Script) ---------- */
const REPORT_URL=/*__REPORT__*/'';
let lastSig='',lastSent=0;
function reportPayload(){
  const days={};const d0=new Date();
  for(let i=0;i<14;i++){const x=new Date(d0);x.setDate(d0.getDate()-i);const k=dkey(x);const v=LOG[k];
    if(v&&v.s>0)days[k]={s:v.s,a:v.a,f:v.f||'',t:v.t||'',l:(v.l||[]).join(' | '),rv:v.rv||0}}
  return {v:1,sent:new Date().toISOString(),today:today(),goal:S.goal,streak:streak(),
    studied:studied().length,due:srsDueList(true).length,srs:srsList(true).length,known:ALL.filter(w=>(store.p[w.id]||{}).k).length,total:ALL.length,
    totalMin:Math.round(Object.values(LOG).reduce((x,d)=>x+d.s,0)/60),days};
}
function sendReport(force){
  if(!REPORT_URL||!navigator.onLine)return;
  const p=reportPayload();const sig=JSON.stringify(p.days)+p.known;
  if(!force&&sig===lastSig)return;
  if(!force&&Date.now()-lastSent<60000)return;
  lastSig=sig;lastSent=Date.now();
  try{fetch(REPORT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(p),keepalive:true}).catch(()=>{lastSig=''})}catch(e){lastSig=''}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)sendReport(true)});
setInterval(()=>{if(view==='study')sendReport(false)},5*60000);
