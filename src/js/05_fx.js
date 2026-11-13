/* ================= HIỆU ỨNG + BÚP BÊ ================= */
if(S.sound===undefined)S.sound=true;
let actx=null;
function tone(f,t0,d,type='sine',vol=.12){const a=actx,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,a.currentTime+t0);
  g.gain.setValueAtTime(0,a.currentTime+t0);g.gain.linearRampToValueAtTime(vol,a.currentTime+t0+.01);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+t0+d);
  o.connect(g).connect(a.destination);o.start(a.currentTime+t0);o.stop(a.currentTime+t0+d+.02)}
function sfx(k){
  if(!S.sound||isWork())return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
  if(k==='ok'){tone(880,0,.12);tone(1318,.09,.22)}
  else if(k==='no'){tone(260,0,.18,'triangle',.14);tone(196,.12,.25,'triangle',.12)}
  else if(k==='flip'){tone(620,0,.06,'sine',.06)}
  else if(k==='combo'){tone(988,0,.08);tone(1318,.07,.08);tone(1760,.14,.18)}
  else if(k==='win'){[523,659,784,1046,1318].forEach((f,i)=>tone(f,i*.11,.3,'sine',.1))}
  else if(k==='pop'){tone(1200,0,.05,'sine',.05)}}catch(e){}
}
function burst(el,n=14,good=true){
  if(isWork())return;
  const r=el.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2,n,good)}
function burstAt(cx,cy,n=14,good=true,far=1){
  const chars=good?['♥','✦','♥','★','♡']:['💧'];
  const cols=good?['#ff5aa9','#ffd34d','#e0218a','#ff8cc6','#fff']:['#7fd6f5'];
  for(let k=0;k<(good?n:5);k++){const sp=document.createElement('span');sp.className='fxp';sp.textContent=chars[k%chars.length];
    const ang=Math.random()*Math.PI*2,dist=(60+Math.random()*90)*far;
    sp.style.cssText=`left:${cx}px;top:${cy}px;color:${cols[k%cols.length]};font-size:${14+Math.random()*16}px;--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist-(good?40:-30)}px;--rot:${Math.random()*360-180}deg`;
    document.body.appendChild(sp);setTimeout(()=>sp.remove(),1000)}
}
function confetti(){
  if(isWork())return;
  const cols=['#ff5aa9','#ffd34d','#9fe7f5','#e0218a','#ff8cc6','#fff'];
  for(let k=0;k<70;k++){const c=document.createElement('span');c.className='conf';c.textContent=k%3?'':'♥';
    c.style.cssText=`left:${Math.random()*100}vw;background:${k%3?cols[k%cols.length]:'transparent'};color:${cols[k%cols.length]};animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*.6}s;--sx:${Math.random()*160-80}px;transform:rotate(${Math.random()*360}deg)`;
    document.body.appendChild(c);setTimeout(()=>c.remove(),4800)}
}
function shake(el){if(!el)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
let combo=0;
function comboUp(el){combo++;if(isWork())return;if(combo>=3){const c=document.createElement('div');c.className='combo';c.innerHTML=`🔥 Combo x${combo}!`;
  document.body.appendChild(c);setTimeout(()=>c.remove(),1100);sfx('combo')}
  if(combo>=5)dance(combo)}
const MSG={
  hi:['Học một chút nha ♥','Hôm nay mình học bài nào đây?','加油！Cố lên nha!','Anh Halken đang chờ tin vui nè 💌','Bấm vào tớ đi ♡'],
  good:['Giỏi quá!','Đúng rồi nè ♥','太棒了！Tuyệt vời!','Nhớ nhanh ghê!','Xinh mà còn giỏi 🎀','好厲害！'],
  bad:['Không sao, lần sau nhớ nha','Sai xíu thôi mà ♡','Ôn lại chút là thuộc liền','Cố lên, sắp thuộc rồi!'],
  hot:['Đang cháy rồi nè 🔥','Dừng sao được, giỏi quá!','Combo khủng luôn 😍','Bồ ơi đỉnh quá trời!','Cứ đà này là thuộc hết! 🎀'],
  win:['Xong bài rồi! Giỏi quá trời 🎉','Hoàn thành! Thưởng 1 ly trà sữa nè 🧋','Babie đỉnh nhất ♥']
};
const pick=a=>a[Math.random()*a.length|0];
function mascot(mood,text){
  const m=$('#mascot');if(!m)return;
  if(mood!=='good')stopDance(m);
  const u=m.querySelector('use');u.setAttribute('href','#i-'+({good:'doll-cheer',bad:'doll-sad',win:'doll-cheer',hi:'doll-wave'}[mood]||'doll'));
  const b=m.querySelector('.bubble');b.textContent=text||pick(MSG[mood]||MSG.hi);
  m.classList.remove('bounce');void m.offsetWidth;m.classList.add('bounce','talk');
  clearTimeout(m._t);m._t=setTimeout(()=>{m.classList.remove('talk');u.setAttribute('href','#i-doll')},2600);
}
// chuỗi đúng dài (từ x5): búp bê nhảy múa vui vẻ vài giây, càng dài (x8+) càng nhanh; sai hoặc xong bài thì dừng
let danceT=null;
const isDancing=()=>{const m=$('#mascot');return !!m&&m.classList.contains('dance')};
function stopDance(m){clearTimeout(danceT);if(m)m.classList.remove('dance','dance2')}
function dance(n){
  const m=$('#mascot');if(!m)return;
  const hold=n>=8?5000:3500,end=()=>{stopDance(m);m.classList.remove('talk');m.querySelector('use').setAttribute('href','#i-doll')};
  clearTimeout(danceT);
  if(!m.classList.contains('dance')){
    mascot('good',pick(MSG.hot));m.classList.remove('bounce');m.classList.add('dance');
    const iv=setInterval(()=>{if(!document.body.contains(m)||!m.classList.contains('dance')){clearInterval(iv);return}burst(m.querySelector('svg'),3)},800);
  }
  m.classList.toggle('dance2',n>=8);clearTimeout(m._t);
  m.querySelector('use').setAttribute('href','#i-doll-cheer');m.classList.add('talk');
  danceT=setTimeout(end,hold);
}
function fxGood(el){sfx('ok');burst(el);comboUp(el);if(!isDancing())mascot('good')}
function fxBad(el){sfx('no');shake(el);burst(el,5,false);combo=0;mascot('bad')}
function celebrate(){sfx('win');confetti();setTimeout(()=>mascot('win'),200)}
function mascotHTML(){if(isWork())return '';return `<div class="mascot" id="mascot" title="Bấm vào tớ nè"><div class="bubble">${pick(MSG.hi)}</div><svg class="ic"><use href="#i-doll"/></svg></div>`}
function bindMascot(){const m=$('#mascot');if(m)m.onclick=()=>{sfx('pop');burst(m.querySelector('svg'),10);mascot('hi')}}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn,.tab,.choice');if(b&&S.sound)sfx('pop')});

