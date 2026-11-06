/* ---- Trắc nghiệm ---- */
function quiz(){
  const my=gen;let qs=order(),i=0,right=0,wrongs=[],locked=false;
  const pool=deck.length>=4?deck:ALL;
  const draw=()=>{
    if(i>=qs.length){
      celebrate();$('#stage').innerHTML=`<div class="card gold done">${ic('doll-cheer','done-doll')}<div class="score">${right}/${qs.length}</div><p>câu đúng</p>
      <div class="actions">${wrongs.length?`<button class="btn primary" id="again">Làm lại ${wrongs.length} câu sai</button>`:''}<button class="btn" id="restart">Làm lại tất cả</button></div></div>`;
      const a=$('#again');if(a)a.onclick=()=>{qs=shuffle(wrongs);wrongs=[];i=0;right=0;draw()};
      $('#restart').onclick=()=>quiz();return}
    locked=false;const w=qs[i];
    const okOpt=x=>x.id!==w.id&&x.vi!==w.vi&&x.hz!==w.hz;
    let others=shuffle(pool.filter(okOpt)).slice(0,3);
    if(others.length<3)others=others.concat(shuffle(ALL.filter(x=>okOpt(x)&&!others.includes(x))).slice(0,3-others.length));
    const opts=shuffle([w,...others]);const askHz=S.front=='hz';
    $('#stage').innerHTML=`
    <div class="progress"><span>Câu ${i+1} / ${qs.length}</span><div class="bar"><i style="width:${i*100/qs.length}%"></i></div><span>Đúng ${right}</span></div>
    <div class="board q"><button class="spk" data-s>🔊</button>
      ${askHz?`<div class="big-hz" style="font-size:64px">${esc(w.hz)}</div>${pyHtml(w)}`:`<div class="vi">${esc(w.vi)}</div>`}
    </div>
    <div class="choices">${opts.map((o,k)=>`<button class="choice ${askHz?'':'hzc'}" data-k="${k}"><span class="k">${k+1}</span><span>${esc(askHz?o.vi:o.hz)}${!askHz&&S.showPy?`<div class="small muted" style="font-family:var(--ui)">${esc(o.py)}</div>`:''}</span></button>`).join('')}</div>
    <div id="fb"></div>`;
    $('[data-s]').onclick=()=>speak(w.hz);
    if(S.auto&&askHz)speak(w.hz);
    const pick=k=>{
      if(locked){next();return}locked=true;
      const ok=opts[k].id===w.id;const btns=document.querySelectorAll('.choice');
      btns.forEach((b,j)=>{if(opts[j].id===w.id)b.classList.add('ok')});
      const p=P(w.id);
      logAns();if(ok){right++;p.k=1;fxGood(btns[k])}else{btns[k].classList.add('bad');p.w++;p.k=0;wrongs.push(w);fxBad(btns[k])}
      srsPractice(w.id,ok,askHz?'quiz':'quizv');save();
      $('#fb').innerHTML=`<div class="feedback ${ok?'ok':'bad'}">${ok?'Chính xác!':'Sai rồi.'} <b style="font-family:var(--hz)">${esc(w.hz)}</b> ${esc(w.py)} = ${esc(w.vi)} <span class="small">— bấm <kbd>Enter</kbd> để tiếp</span></div>`;
      if(!askHz)speak(w.hz);
      if(ok)setTimeout(()=>{if(gen===my&&locked&&qs[i]===w)next()},900);
    };
    const next=()=>{i++;draw()};
    document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
    keyHandler=e=>{if(/^[1-4]$/.test(e.key)&&!locked&&opts[+e.key-1])pick(+e.key-1);else if(e.key=='Enter'&&locked)next()};
  };
  draw();
}

