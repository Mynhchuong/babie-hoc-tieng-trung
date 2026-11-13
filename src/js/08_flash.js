/* ---- Thẻ ghi nhớ ---- */
function flash(q){
  const my=gen;let cards=q||order(),i=0,flipped=false,unknown=[],busy=false;
  const draw=dir=>{
    if(i>=cards.length){
      celebrate();
      $('#stage').innerHTML=`<div class="card gold done">${ic('doll-cheer','done-doll')}<div class="score">${cards.length-unknown.length}/${cards.length}</div>
      <p>từ đã thuộc trong lượt này</p><div class="actions">
      ${unknown.length?`<button class="btn primary big-l" id="again">🔁 Ôn lại ${unknown.length} từ chưa thuộc</button>`:''}
      <button class="btn big-l" id="restart">↺ Học lại từ đầu</button></div></div>`;
      const a=$('#again');if(a)a.onclick=()=>flash(shuffle(unknown));$('#restart').onclick=()=>flash();return}
    const w=cards[i];flipped=false;busy=false;
    const front=S.front=='hz'?`<div class="big-hz">${esc(w.hz)}</div>${pyHtml(w)}`:`<div class="vi">${esc(w.vi)}</div>`;
    $('#stage').innerHTML=`
    <div class="progress"><span>Thẻ ${i+1} / ${cards.length}</span><div class="bar"><i style="width:${i*100/cards.length}%"></i></div>
      ${P(w.id).k?'<span class="pill">đã thuộc</span>':''}</div>
    <div class="flash enter ${dir||''}" id="fc">
      <div class="stamp yes">ĐÃ THUỘC ✓</div><div class="stamp no">CHƯA THUỘC ✗</div>
      <div class="in">
        <div class="board face front"><span class="corner">${S.front=='hz'?'Chữ Hán':'Tiếng Việt'}</span>${front}<div class="tap-hint">👆 Bấm để lật · kéo phải = thuộc · kéo trái = chưa</div></div>
        <div class="board face back"><span class="corner">Đáp án</span><button class="spk" data-s title="Đọc lại">🔊</button>
          <div class="big-hz sm">${esc(w.hz)}</div><div class="py">${esc(w.py)}</div><div class="divider"></div><div class="vi">${esc(w.vi)}</div></div>
      </div></div>
    <div class="fc-actions">
      <button class="btn big" id="prev" ${i?'':'disabled'}><span class="i">←</span><b>Từ trước</b><kbd>←</kbd></button>
      <button class="btn big no" id="no"><span class="i">✗</span><b>Chưa thuộc</b><kbd>1</kbd></button>
      <button class="btn big primary" id="flipb"><span class="i">⟲</span><b>Lật thẻ</b><kbd>Space</kbd></button>
      <button class="btn big yes" id="yes"><span class="i">✓</span><b>Đã thuộc</b><kbd>2</kbd></button>
      <button class="btn big starb ${P(w.id).st?'on':''}" id="st"><span class="i">★</span><b>${P(w.id).st?'Đã đánh dấu':'Đánh dấu'}</b><kbd>S</kbd></button>
    </div>`;
    const fc=$('#fc');
    const doFlip=()=>{flipped=!flipped;fc.classList.toggle('flip',flipped);sfx('flip');
      if(flipped)setTimeout(()=>speak(w.hz),250);else if('speechSynthesis' in window)speechSynthesis.cancel()};
    // kéo / vuốt thẻ
    let sx=0,sy=0,dx=0,drag=false,down=false;
    fc.onpointerdown=e=>{if(e.target.closest('[data-s]')||busy)return;down=true;drag=false;sx=e.clientX;sy=e.clientY;dx=0;fc.setPointerCapture(e.pointerId)};
    fc.onpointermove=e=>{if(!down)return;dx=e.clientX-sx;if(!drag&&Math.abs(dx)>10&&Math.abs(dx)>Math.abs(e.clientY-sy))drag=true;
      if(drag){fc.style.transition='none';fc.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;
        fc.querySelector('.stamp.yes').style.opacity=Math.max(0,Math.min(1,dx/110));fc.querySelector('.stamp.no').style.opacity=Math.max(0,Math.min(1,-dx/110))}};
    fc.onpointerup=e=>{if(!down)return;down=false;
      if(!drag){if(!e.target.closest('[data-s]'))doFlip();return}
      fc.style.transition='';
      if(Math.abs(dx)>110)mark(dx>0?1:0);
      else{fc.style.transform='';fc.querySelectorAll('.stamp').forEach(x=>x.style.opacity=0)}};
    fc.querySelector('[data-s]').onclick=e=>{e.stopPropagation();speak(w.hz,true)};
    $('#flipb').onclick=doFlip;
    $('#prev').onclick=()=>{i--;draw('from-left')};
    $('#no').onclick=()=>mark(0);$('#yes').onclick=()=>mark(1);
    $('#st').onclick=()=>toggleStar();
    if('speechSynthesis' in window)speechSynthesis.cancel();
  };
  const toggleStar=()=>{const w=cards[i];if(!w)return;const p=P(w.id);p.st^=1;save();const b=$('#st');b.classList.toggle('on',!!p.st);b.querySelector('b').textContent=p.st?'Đã đánh dấu':'Đánh dấu';
    if(p.st){sfx('ok');burst(b,8)}};
  const mark=k=>{
    if(busy||!cards[i])return;busy=true;
    const w=cards[i],p=P(w.id);p.k=k;logAns();if(!k){p.w++;unknown.push(w)}srsPractice(w.id,!!k,'flash');save();
    const fc=$('#fc'),btn=k?$('#yes'):$('#no');
    if(k){fxGood(btn)}else{sfx('no');combo=0;mascot('bad')}
    fc.style.transition='transform .35s ease-in, opacity .35s';fc.style.transform=`translateX(${k?520:-520}px) rotate(${k?24:-24}deg)`;fc.style.opacity=0;
    fc.querySelector(k?'.stamp.yes':'.stamp.no').style.opacity=1;
    setTimeout(()=>{if(gen===my){i++;draw()}},300);
  };
  keyHandler=e=>{
    if(e.code=='Space'){e.preventDefault();$('#flipb')&&$('#flipb').click()}
    else if(e.key=='1'){$('#no')&&mark(0)}else if(e.key=='2'){$('#yes')&&mark(1)}
    else if(busy){}else if(e.key=='ArrowLeft'&&i>0){i--;draw('from-left')}else if(e.key=='ArrowRight'&&i<cards.length-1){i++;draw()}
    else if(e.key.toLowerCase()=='s'&&$('#st'))toggleStar();
  };
  draw();
}

