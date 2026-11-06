/* ---- Danh sách ---- */
function list(){
  const q=normVi(search),qp=normPy(search);
  const rows=deck.filter(w=>!search||w.hz.includes(search.trim())||(qp&&normPy(w.py).includes(qp))||normVi(w.vi).includes(q));
  $('#stage').innerHTML=`
  <div class="row" style="margin-bottom:10px">
    <input class="search" id="q" placeholder="Tìm chữ Hán / pinyin / tiếng Việt" value="${esc(search)}">
    <button class="btn" id="cp">📋 Copy cho Quizlet</button>
    <button class="btn" id="dl">⬇ Tải file .txt</button>
  </div>
  <div class="card" style="padding:4px 12px;overflow-x:auto"><table class="list">
    <tr><th></th><th>Chữ Hán</th><th>Pinyin</th><th>Tiếng Việt</th><th></th><th></th></tr>
    ${rows.map(w=>`<tr><td><button class="star ${P(w.id).st?'on':''}" data-st="${w.id}">★</button></td>
      <td class="hz">${esc(w.hz)}</td><td class="py">${esc(w.py)}</td><td><input class="vi-ed ${w.vi!==w.orig?'edited':''}" data-ed="${w.id}" value="${esc(w.vi)}" title="Bấm để sửa nghĩa"></td>
      <td>${P(w.id).k?'<span class="pill">thuộc</span>':P(w.id).w?'<span class="pill r">sai '+P(w.id).w+'</span>':''}</td>
      <td><button class="star" style="color:var(--muted)" data-sp="${esc(w.hz)}">🔊</button></td></tr>`).join('')}
  </table></div>
  <p class="hint">✏️ Bấm vào ô nghĩa tiếng Việt để sửa, sửa xong bấm Enter hoặc bấm ra ngoài là tự lưu. Xóa trống rồi Enter để trả về nghĩa gốc.</p>
  <p class="hint">Quizlet: vào <b>Tạo học phần → Nhập</b>, dán nội dung. Giữa thuật ngữ và định nghĩa chọn <b>Tab</b>, giữa các thẻ chọn <b>Dòng mới</b>.</p>`;
  const qi=$('#q');const reQ=()=>{search=qi.value;const pos=qi.selectionStart;list();const n=$('#q');n.focus();n.setSelectionRange(pos,pos)};
  qi.oninput=e=>{if(!e.isComposing)reQ()};qi.oncompositionend=reQ;
  document.querySelectorAll('[data-st]').forEach(b=>b.onclick=()=>{const p=P(b.dataset.st);p.st^=1;save();b.classList.toggle('on')});
  document.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>speak(b.dataset.sp));
  document.querySelectorAll('[data-ed]').forEach(inp=>{
    const commit=()=>{const w=ALL.find(x=>x.id===inp.dataset.ed);let v=inp.value.trim();
      if(!v)v=w.orig;if(v===w.vi){inp.value=v;return}
      w.vi=v;inp.value=v;if(v===w.orig)delete EDIT[w.id];else EDIT[w.id]=v;save();
      inp.classList.toggle('edited',v!==w.orig);toast(v===w.orig?'Đã trả về nghĩa gốc':'Đã lưu nghĩa mới ♡')};
    inp.onchange=commit;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();inp.blur()}};
  });
  const txt=()=>deck.map(w=>`${w.hz} (${w.py})\t${w.vi}`).join('\n');
  $('#cp').onclick=()=>{const t=txt();
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Đã copy '+deck.length+' từ — dán vào Quizlet'))
    .catch(()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Đã copy')}catch(e){toast('Không copy được')}a.remove()})};
  $('#dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+txt()],{type:'text/plain'}));a.download=deckName.replace(/[\\/:*?"<>|·]/g,'').trim()+'.txt';a.click()};
  keyHandler=null;
}

