/* ---- Viết ---- */
function pyVariants(py){
  const out=new Set();
  const expand=v=>{const m=v.match(/\(([^)]*)\)/);if(!m){out.add(normPy(v));return}
    expand(v.replace(m[0],m[1]));expand(v.replace(m[0],''));};
  py.split('/').forEach(expand);out.add(normPy(py));out.delete('');
  out.forEach(v=>out.add(v.replace(/v/g,'u')));   // ü: gõ lv hay lu đều được
  return out;
}
function write(){
  let qs=order(),i=0,right=0,wrongs=[],state=0;
  const draw=()=>{
    if(i>=qs.length){
      celebrate();$('#stage').innerHTML=`<div class="card gold done">${ic('doll-cheer','done-doll')}<div class="score">${right}/${qs.length}</div><p>từ viết đúng pinyin</p>
      <div class="actions">${wrongs.length?`<button class="btn primary" id="again">Viết lại ${wrongs.length} từ sai</button>`:''}<button class="btn" id="restart">Làm lại tất cả</button></div></div>`;
      const a=$('#again');if(a)a.onclick=()=>{qs=shuffle(wrongs);wrongs=[];i=0;right=0;draw()};
      $('#restart').onclick=()=>write();return}
    state=0;const w=qs[i];
    $('#stage').innerHTML=`
    <div class="progress"><span>${i+1} / ${qs.length}</span><div class="bar"><i style="width:${i*100/qs.length}%"></i></div><span>Đúng ${right}</span></div>
    <div class="board q write"><button class="spk" data-s>🔊</button>
      <div class="big-hz" style="font-size:72px">${esc(w.hz)}</div>
      <p class="muted small">Gõ pinyin của chữ này — không cần dấu thanh, VD: <i>xuesheng</i> hoặc <i>xue2sheng1</i></p>
      <input id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ pinyin rồi bấm Enter" style="font-family:var(--ui)">
      <div id="fb"></div>
      <div class="fc-actions"><button class="btn big" id="hint"><span class="i">💡</span><b>Gợi ý nghĩa</b></button><button class="btn big no" id="skip"><span class="i">?</span><b>Không biết</b></button><button class="btn big primary" id="chk"><span class="i">✓</span><b>Kiểm tra</b><kbd>Enter</kbd></button></div>
    </div>`;
    const inp=$('#ans');inp.focus();
    $('[data-s]').onclick=()=>speak(w.hz,true);
    if(S.auto)speak(w.hz);
    $('#hint').onclick=()=>{$('#fb').innerHTML=`<div class="feedback" style="background:#fff;color:var(--hot)">Nghĩa: <b>${esc(w.vi)}</b></div>`;inp.focus()};
    const check=give=>{
      if(state){i++;draw();return}
      const v=normPy(inp.value);if(!give&&!v){inp.focus();return}
      state=1;
      const ok=!give&&pyVariants(w.py).has(v);const p=P(w.id);logAns();
      if(ok){right++;p.k=1;fxGood($('#ans'))}else{p.w++;p.k=0;wrongs.push(w);fxBad($('#ans'))}srsPractice(w.id,ok,'write',give?'':inp.value);save();
      $('#fb').innerHTML=`<div class="feedback ${ok?'ok':'bad'}">${ok?'Đúng rồi! 🎀':'Chưa đúng, đáp án:'}
        <div style="margin-top:6px"><b style="font-family:var(--hz);font-size:22px">${esc(w.hz)}</b> &nbsp;<b style="font-size:20px">${esc(w.py)}</b> — ${esc(w.vi)}</div></div>`;
      $('#chk').innerHTML='<span class="i">→</span><b>Từ tiếp theo</b><kbd>Enter</kbd>';$('#hint').style.display='none';$('#skip').style.display='none';speak(w.hz);
    };
    $('#chk').onclick=()=>check(false);$('#skip').onclick=()=>check(true);
    keyHandler=e=>{if(e.key=='Enter'){e.preventDefault();check(false)}};
  };
  draw();
}

