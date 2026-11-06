const DATA = /*__DATA__*/null;
const APP_VER = /*__VER__*/'dev';
let UPDATE_URL = /*__UPDATE__*/'';       // nơi đặt bản cập nhật (config.json update_url)
const APP_NOTES = /*__NOTES__*/'';       // 'có gì mới' của bản này (thay_doi.txt)   // build.py ghi dấu giờ build; đổi phiên bản → tự sao lưu dữ liệu cũ trước khi dùng bản mới

/* ---------- storage (an toàn khi mở file trực tiếp) ---------- */
const KEY='onTiengTrung_v1';
let store={},noSave=false;   // noSave: đang khôi phục dữ liệu rồi tải lại → cấm lưu đè dữ liệu cũ
const BOOT_RAW=(()=>{try{return localStorage.getItem(KEY)}catch(e){return null}})();
try{store=JSON.parse(BOOT_RAW||'{}')||{}}catch(e){store={};try{localStorage.setItem(KEY+'_hong',BOOT_RAW)}catch(x){}}   // dữ liệu hỏng: giữ bản gốc lại để cứu
const PREV_VER=store.ver;store.ver=APP_VER;
store.p=store.p||{}; store.s=store.s||{};
function save(){if(noSave)return;store.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}fileSaveSoon();snapSoon()}
// thay toàn bộ dữ liệu rồi tải lại (dùng khi khôi phục / nối từ file) — KHÔNG để beforeunload ghi đè
function replaceStoreAndReload(raw){noSave=true;try{localStorage.setItem(KEY,raw)}catch(e){}location.reload()}
