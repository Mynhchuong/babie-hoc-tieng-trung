let keyHandler=null;
document.addEventListener('keydown',e=>{if(view!=='study'||!keyHandler)return;if(e.target.tagName==='INPUT'&&(e.key!=='Enter'||e.target.dataset.ed!==undefined))return;keyHandler(e)});
home();
if(PREV_VER&&PREV_VER!==APP_VER)setTimeout(()=>toast('Đã cập nhật app ♥'+(APP_NOTES?' — '+APP_NOTES:'')),1200);
{const rec=(()=>{try{const r=sessionStorage.getItem('ttRec');sessionStorage.removeItem('ttRec');return r}catch(e){return null}})();if(rec)setTimeout(()=>toast('Đã khôi phục tiến độ từ bản sao tự động ngày '+rec+' ♥'),600)}
autoRecover().then(r=>{if(!r)initFile()});
setTimeout(()=>sendReport(true),3000);
