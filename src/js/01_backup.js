/* ---------- SAO LƯU TỰ ĐỘNG + GỘP DỮ LIỆU (chống mất tiến độ khi cập nhật app / xoá cache) ----------
   • Mỗi lần lưu → bản "mới nhất" + 1 bản/ngày (giữ 14 ngày) trong IndexedDB (độc lập với localStorage).
   • Đổi phiên bản app (APP_VER) → lưu nguyên bản dữ liệu cũ ("trước khi cập nhật", giữ 3 bản).
   • Máy trống mà có bản sao → tự khôi phục. Có file tien_do_hoc.json → gộp, không ghi đè. */
const BK='bk:';
const rankOf=o=>o?Object.keys(o.p||{}).filter(k=>{const c=o.p[k];return c&&(c.k||c.w||c.c||c.due!==undefined)}).length+Object.keys(o.log||{}).length:0;
// gộp 2 bản dữ liệu: bản mới hơn làm gốc (cài đặt…), bổ sung từ/ngày/nghĩa còn thiếu từ bản kia. add = số mục được bổ sung
function mergeStores(a,b){
  const ra=rankOf(a),rb=rankOf(b),newer=ra&&!rb?a:rb&&!ra?b:((a.updated||0)>=(b.updated||0)?a:b),older=newer===a?b:a;
  const m=JSON.parse(JSON.stringify(newer));let add=0;m.p=m.p||{};m.s=m.s||{};m.log=m.log||{};m.e=m.e||{};
  for(const id in (older.p||{}))if(!m.p[id]){m.p[id]=older.p[id];add++}
  for(const k in (older.log||{})){const x=m.log[k],y=older.log[k];if(!x||(y.s||0)>(x.s||0)){m.log[k]=y;add++}}
  for(const id in (older.e||{}))if(!m.e[id]){m.e[id]=older.e[id];add++}
  m.updated=Math.max(a.updated||0,b.updated||0);
  return {m,add};
}
async function kvKeys(){const db=await idb();return new Promise(ok=>{const q=db.transaction('kv').objectStore('kv').getAllKeys();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>ok([])})}
async function kvDel(k){const db=await idb();return new Promise(ok=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=ok;t.onerror=ok})}
let bkT=null,bkLast=0;
function snapSoon(){clearTimeout(bkT);bkT=setTimeout(snapNow,Date.now()-bkLast>60000?3000:30000)}
async function snapNow(){
  if(!rankOf(store)||noSave)return;bkLast=Date.now();
  try{const raw=JSON.stringify(store),t=Date.now();await kvSet(BK+'latest',{t,kind:'latest',raw});await kvSet(BK+'d:'+today(),{t,kind:'day',raw});await bkPrune()}catch(e){}
}
async function bkPrune(){
  const ks=(await kvKeys()).filter(k=>typeof k==='string'&&k.startsWith(BK)),days=ks.filter(k=>k.startsWith(BK+'d:')).sort(),pre=ks.filter(k=>k.startsWith(BK+'pre:'));
  for(const k of days.slice(0,Math.max(0,days.length-14)))await kvDel(k);
  if(pre.length>3){const es=await Promise.all(pre.map(async k=>({k,t:((await kvGet(k))||{}).t||0})));es.sort((a,b)=>a.t-b.t);for(const e of es.slice(0,es.length-3))await kvDel(e.k)}
}
// đổi phiên bản app → cất nguyên bản dữ liệu cũ trước khi bản mới đụng vào
(async()=>{if(BOOT_RAW&&PREV_VER!==APP_VER){try{const o=JSON.parse(BOOT_RAW);if(rankOf(o))await kvSet(BK+'pre:'+(PREV_VER||'cu'),{t:Date.now(),kind:'pre',raw:BOOT_RAW})}catch(e){}}})();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});   // xin trình duyệt đừng tự xoá dữ liệu
window.addEventListener('pagehide',()=>{if(!noSave)snapNow()});
async function bkList(){
  const ks=(await kvKeys()).filter(k=>typeof k==='string'&&k.startsWith(BK)&&k!==BK+'latest'),out=[];
  for(const k of ks){const e=await kvGet(k);if(!e||!e.raw)continue;let o=null;try{o=JSON.parse(e.raw)}catch(x){continue}
    out.push({key:k,t:e.t,kind:e.kind,words:Object.values(o.p||{}).filter(c=>c&&c.k).length,days:Object.values(o.log||{}).filter(d=>d.s>=60).length,
      min:Math.round(Object.values(o.log||{}).reduce((a,d)=>a+(d.s||0),0)/60),raw:e.raw})}
  return out.sort((a,b)=>b.t-a.t);
}
async function bkRestore(key){
  const e=await kvGet(key);if(!e)return false;
  if(rankOf(store))await kvSet(BK+'pre:truoc-khoi-phuc',{t:Date.now(),kind:'pre',raw:JSON.stringify(store)});   // phòng khi muốn quay lại
  replaceStoreAndReload(e.raw);return true;
}
// máy trống (xoá cache / máy mới) nhưng còn bản sao tự động → tự khôi phục
async function autoRecover(){
  if(rankOf(store)>0)return false;
  try{const best=(await bkList()).find(x=>x.words||x.days);if(!best)return false;
    try{sessionStorage.setItem('ttRec',new Date(best.t).toLocaleDateString('vi-VN'))}catch(e){}
    replaceStoreAndReload(best.raw);return true}catch(e){return false}
}

// hỏi nơi đặt bản cập nhật xem có bản mới hơn không (chỉ để báo; việc thay file do bộ cập nhật trên Windows làm)
async function checkUpdate(){
  if(!UPDATE_URL)return {err:'off'};
  try{const r=await fetch(UPDATE_URL.replace(/\/$/,'')+'/manifest.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw 0;
    const m=await r.json();return {ver:m.ver,newer:!!m.ver&&m.ver>APP_VER}}catch(e){return {err:'net'}}
}
const fmtVer=v=>/^\d{8}-\d{6}$/.test(v)?`${v.slice(6,8)}/${v.slice(4,6)}/${v.slice(0,4)} ${v.slice(9,11)}:${v.slice(11,13)}`:v;
