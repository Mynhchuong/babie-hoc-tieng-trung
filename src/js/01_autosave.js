/* ---------- TỰ LƯU RA FILE tien_do_hoc.json (Chrome / Edge) ---------- */
const FS_OK='showSaveFilePicker' in window&&'indexedDB' in window;
let fh=null,fileState='none',fileTimer=null,lastFileSave=0;   // none | need | on
function idb(){return new Promise((ok,no)=>{const r=indexedDB.open('onTiengTrung',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function kvGet(k){const db=await idb();return new Promise(ok=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(null)})}
async function kvSet(k,v){const db=await idb();return new Promise(ok=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=ok;t.onerror=ok})}
function fileSaveSoon(){if(fileState!=='on')return;clearTimeout(fileTimer);fileTimer=setTimeout(writeFile,Date.now()-lastFileSave>15000?800:8000)}
let writing=false,writeAgain=false;
async function writeFile(){
  if(!fh||fileState!=='on'||noSave)return;
  if(writing){writeAgain=true;return}          // đang ghi thì đợi xong rồi ghi tiếp, không ghi chồng
  writing=true;
  try{const w=await fh.createWritable();await w.write(JSON.stringify(store));await w.close();lastFileSave=Date.now();showFileStatus()}
  catch(e){let p='prompt';try{p=await fh.queryPermission({mode:'readwrite'})}catch(x){}
    if(p!=='granted'){fileState='need';showFileStatus()}}  // chỉ hỏi lại quyền khi thật sự mất quyền
  finally{writing=false;if(writeAgain){writeAgain=false;writeFile()}}
}
async function readFileStore(){const f=await fh.getFile();const t=await f.text();if(!t.trim())return null;const o=JSON.parse(t);return o&&o.p&&o.s?o:null}
// nối dữ liệu trình duyệt với file (không bao giờ ghi đè mất phần nào): lấy bản mới hơn làm gốc, bổ sung phần còn thiếu từ bản kia
async function syncFromFile(){
  let o=null;try{o=await readFileStore()}catch(e){}
  if(o){const r=mergeStores(store,o);if(r.add>0){replaceStoreAndReload(JSON.stringify(r.m));return true}}
  fileState='on';await writeFile();return false;
}
async function initFile(){
  if(!FS_OK)return;
  try{fh=await kvGet('fh')}catch(e){fh=null}
  if(!fh){showFileStatus();return}
  let p='prompt';try{p=await fh.queryPermission({mode:'readwrite'})}catch(e){}
  if(p==='granted'){await syncFromFile()}else{fileState='need'}
  showFileStatus();
}
async function resumeFile(){
  try{const p=await fh.requestPermission({mode:'readwrite'});if(p!=='granted'){toast('Chưa được cho phép lưu file');return}
    if(!await syncFromFile()){toast('Đã bật tự lưu tiến độ ♥')}}catch(e){toast('Không mở được file, chọn lại nha');fh=null;fileState='none'}
  showFileStatus();
}
async function pickNewFile(){
  try{fh=await showSaveFilePicker({suggestedName:'tien_do_hoc.json',startIn:'documents',types:[{description:'Tiến độ học',accept:{'application/json':['.json']}}]});
    await kvSet('fh',fh);
    let o=null;try{o=await readFileStore()}catch(e){}
    if(o){const r=mergeStores(store,o);if(r.add>0){toast('Đã nối tiến độ có sẵn trong file ♥');setTimeout(()=>replaceStoreAndReload(JSON.stringify(r.m)),600);return}}
    fileState='on';await writeFile();toast('Đã bật tự lưu vào '+fh.name+' ♥');
  }catch(e){if(e&&e.name!=='AbortError')toast('Không tạo được file')}
  showFileStatus();
}
async function pickOldFile(){
  try{const [h]=await showOpenFilePicker({types:[{description:'Tiến độ học',accept:{'application/json':['.json']}}]});
    fh=h;const p=await fh.requestPermission({mode:'readwrite'});if(p!=='granted')return;
    const o=await readFileStore();if(!o){toast('File không đúng định dạng');return}
    await kvSet('fh',fh);const r=mergeStores(store,o);toast('Đã mở tiến độ, đang tải lại…');setTimeout(()=>replaceStoreAndReload(JSON.stringify(r.m)),700);
  }catch(e){if(e&&e.name!=='AbortError')toast('Không mở được file')}
}
function fileBanner(){
  if(!FS_OK)return '';
  if(fileState==='need')return `<div class="banner card" id="fbn">💾 <b>Bấm để tiếp tục tự lưu tiến độ</b> vào file <i>${esc(fh.name)}</i><div class="spacer"></div><button class="btn primary" id="fRes">Cho phép lưu</button></div>`;
  if(fileState==='none'&&!(S.hideFileTip&&Date.now()-S.hideFileTip<3*864e5))return `<div class="banner card" id="fbn">💾 <span><b>Bật tự lưu tiến độ</b> (làm 1 lần, để khỏi mất khi cập nhật app): bấm nút ${isWork()?'xanh':'hồng'} → cửa sổ hiện ra thì bấm <b>Save / Lưu</b> là xong.</span><div class="spacer"></div><button class="btn ghost" id="fHide">Để sau</button><button class="btn primary" id="fNew">Bật tự lưu</button></div>`;
  return '';
}
function showFileStatus(){
  const el=$('#fstat');if(el)el.innerHTML=fileState==='on'?`💾 Tự lưu: ${lastFileSave?new Date(lastFileSave).toTimeString().slice(0,5):'bật'}`:'';
  const b=$('#fbn');if(view==='home'&&(b||fileState!=='on')&&!$('.modal')){const html=fileBanner();if(b){if(html)b.outerHTML=html;else b.remove()}else if(html){const h=$('header.top');if(h)h.insertAdjacentHTML('afterend',html)}bindBanner()}
}
function bindBanner(){
  const r=$('#fRes');if(r)r.onclick=resumeFile;
  const n=$('#fNew');if(n)n.onclick=pickNewFile;
  const h=$('#fHide');if(h)h.onclick=()=>{S.hideFileTip=Date.now();save();$('#fbn').remove()};
}
window.addEventListener('pagehide',()=>{if(fileState==='on')writeFile()});

