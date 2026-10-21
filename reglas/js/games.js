/* games.js — cronómetro de 20s + laberinto + matemáticas + tres en ralla + bingo */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const sfx = ()=> window.__sfx || {click(){},pop(){},step(){},tick(){},win(){},lose(){},ok(){}};
const toast = m => window.__toast && window.__toast(m);

/* ================= CRONÓMETRO REUTILIZABLE ================= */
const CIRC = 2 * Math.PI * 52;
function Timer(opts){
  const ring = opts.ring, num = opts.num, btn = opts.btn, arc = opts.arc;
  const total = opts.seconds || 20;
  let left = total, running = false, raf = null, last = 0;
  const endCb = opts.onEnd || null;

  function paint(){
    num.textContent = Math.ceil(left);
    const frac = Math.max(0, Math.min(1, left / total));
    arc.style.strokeDasharray = CIRC;
    arc.style.strokeDashoffset = CIRC * (1 - frac);
    ring.classList.toggle('warn', left <= 10 && left > 5);
    ring.classList.toggle('danger', left <= 5);
  }
  function loop(t){
    if(!running) return;
    if(!last) last = t;
    const dt = (t - last) / 1000; last = t;
    left -= dt;
    if(left <= 0){
      left = 0; paint(); stop(); sfx().lose();
      if(endCb) endCb();
      return;
    }
    if(Math.ceil(left) !== Number(num.textContent)) sfx().tick();
    paint();
    raf = requestAnimationFrame(loop);
  }
  function start(){
    if(running) return;
    if(opts.onStart) opts.onStart();
    running = true; last = 0; left = total;
    btn.textContent = 'PARAR'; btn.classList.add('running');
    paint(); sfx().pop();
    raf = requestAnimationFrame(loop);
  }
  function stop(){
    running = false; cancelAnimationFrame(raf); raf = null;
    btn.textContent = 'INICIAR'; btn.classList.remove('running');
  }
  function reset(){ stop(); left = total; paint(); }
  btn.addEventListener('click', ()=>{ running ? (stop(), sfx().step()) : start(); });
  paint();
  return { start, stop, reset, isRunning: ()=>running, get left(){ return left; } };
}

/* ================= PREMIOS ================= */
let prizes = 0;
function addPrize(){
  prizes++;
  const chip = $('#prizeCount');
  if(chip) chip.textContent = prizes + (prizes === 1 ? ' premio' : ' premios');
}

/* ================= LABERINTO ================= */
const labTimer = Timer({
  ring: $('#labTimerRing'), num: $('#labTimerNum'), btn: $('#labTimerBtn'), arc: $('#labTimerArc'),
  seconds: 20,
  onEnd: ()=> labResult('lose','¡Se acabó el tiempo!','El jugador puede volver a intentarlo con otro laberinto.')
});
function labResult(kind, title, sub){
  const box = $('#labResult');
  box.className = 'result-card ' + kind;
  $('#labResultTitle').textContent = title;
  $('#labResultSub').textContent = sub;
  box.hidden = false;
  if(kind === 'win'){ sfx().win(); addPrize(); } else sfx().lose();
}
$('#labFinishBtn').addEventListener('click', ()=>{
  if(labTimer.isRunning()){
    labTimer.stop();
    labResult('win','¡GANASTE EL PREMIO!','El laberinto se resolvió antes de que se acabara el tiempo.');
  }else{
    labResult('lose','PERDISTE','El tiempo ya se había agotado cuando terminó el laberinto.');
  }
});

/* ================= MATEMÁTICAS ================= */
const OPS = [
  {t:'84 + 21', a:105}, {t:'73 + 79', a:152}, {t:'67 − 42', a:25}, {t:'42 × 46', a:1932},
  {t:'62 + 95', a:157}, {t:'53 × 44', a:2332}, {t:'46 − 11', a:35}, {t:'38 + 27', a:65}
];
const GOAL = 5;
let solved = new Set();
const mathTimer = Timer({
  ring: $('#mathTimerRing'), num: $('#mathTimerNum'), btn: $('#mathTimerBtn'), arc: $('#mathTimerArc'),
  seconds: 20,
  onStart: ()=>{
    solved = new Set();
    goalShown = false;
    $$('#opsGrid .op-card').forEach(c=>c.classList.remove('done'));
    $('#mathAnswers').hidden = true;
    $('#mathGoalCard').hidden = true;
    paintMath();
  },
  onEnd: ()=> revealAnswers()
});
let goalShown = false;
function paintMath(){
  $('#mathDone').textContent = solved.size;
  const card = $('#mathGoalCard');
  if(solved.size >= GOAL && !goalShown){
    goalShown = true;
    card.hidden = false;
    $('#mathGoalSub').textContent = solved.size + ' operaciones resueltas. Deja que el tiempo termine para ver las respuestas.';
    sfx().win();
    toast('¡Meta cumplida! ' + solved.size + ' operaciones');
  }
  if(solved.size < GOAL && goalShown){
    goalShown = false;
    card.hidden = true;
  }
}
$$('#opsGrid .op-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    const i = Number(card.dataset.i);
    if(solved.has(i)){ solved.delete(i); card.classList.remove('done'); }
    else { solved.add(i); card.classList.add('done'); }
    paintMath(); sfx().pop();
  });
});
function revealAnswers(){
  $('#answersList').innerHTML = OPS.map((o,i)=>`<li><span>${i+1}. ${o.t}</span><b>${o.a}</b></li>`).join('');
  const n = solved.size;
  const ok = n >= GOAL;
  $('#mathScore').innerHTML = 'Resueltas <b>' + n + '</b> de ' + OPS.length + ' · meta ' + GOAL + ' → <b>' + (ok ? '¡CUMPLIDA!' : 'FALTAN ' + (GOAL - n)) + '</b>';
  $('#mathAnswers').hidden = false;
  if(ok){ sfx().win(); toast('¡Meta alcanzada! ' + n + ' operaciones en 20 segundos'); }
  else { sfx().lose(); toast('Meta no alcanzada: ' + n + ' de ' + GOAL); }
}
/* ================= TRES EN RALLA ================= */
let scoreX = 0, scoreO = 0;
function paintScore(){ $('#scoreX').textContent = scoreX; $('#scoreO').textContent = scoreO; }
let markSel = 'X';
$$('.mark-btn').forEach(b=>{
  b.addEventListener('click', ()=>{
    markSel = b.dataset.mark;
    $$('.mark-btn').forEach(x=>x.classList.toggle('active', x===b));
    sfx().pop();
  });
});
$$('#ttt .tt').forEach(cell=>{
  cell.addEventListener('click', ()=>{
    if(cell.classList.contains('x') || cell.classList.contains('o')){
      cell.classList.remove('x'); cell.classList.remove('o'); cell.textContent='';
    }else{
      cell.classList.add(markSel==='0' ? 'o' : 'x');
      cell.textContent = markSel;
    }
    sfx().pop();
  });
  cell.addEventListener('contextmenu', e=>{
    e.preventDefault();
    if(cell.classList.contains('x')){ cell.classList.remove('x'); cell.textContent=''; }
    else if(cell.classList.contains('o')){ cell.classList.remove('o'); cell.textContent=''; }
    else { cell.classList.add(markSel==='0' ? 'o' : 'x'); cell.textContent = markSel; }
    sfx().pop();
  });
});
function tttResult(title, sub){
  const box = $('#tttResult');
  box.className = 'result-card ' + (title.indexOf('0') >= 0 ? 'win' : 'lose');
  $('#tttResultTitle').textContent = title;
  $('#tttResultSub').textContent = sub;
  box.hidden = false;
}
$('#btnWinX').addEventListener('click', ()=>{
  scoreX++; paintScore();
  tttResult('¡Gana X!','El jugador X suma un punto. Ronda nueva cuando quieran.');
  sfx().win();
});
$('#btnWinO').addEventListener('click', ()=>{
  scoreO++; paintScore();
  tttResult('¡Gana 0!','El jugador 0 suma su punto: con ganar una vez ya tiene el premio.');
  sfx().win();
});
$('#btnResetTtt').addEventListener('click', ()=>{
  $$('#ttt .tt').forEach(c=>{ c.className = 'tt'; c.textContent = ''; });
  $('#tttResult').hidden = true;
  sfx().step();
});
paintScore();

/* ================= BINGO ================= */
let drawn = [];
const bingoBtns = $$('#bingoNums .bnum');
function paintBingo(){
  $('#bingoCount').textContent = drawn.length;
  const ORDEN = [1,8,6,9,3,5,2,7,4];
  $('#bingoDots').innerHTML = ORDEN.map(n=>'<i class="' + (drawn.includes(n)?'on':'') + '">' + n + '</i>').join('');
  bingoBtns.forEach(b=> b.classList.toggle('done', drawn.includes(Number(b.dataset.n))));
}
function markNumber(n){
  if(drawn.includes(n)) return false;
  if(drawn.length >= 9) return false;
  drawn.push(n);
  const btn = bingoBtns.find(x=>Number(x.dataset.n)===n);
  if(btn) btn.classList.add('win');
  paintBingo(); sfx().pop();
  $('#bingoCurrent').textContent = '¡Salió el ' + n + '!';
  if(drawn.length === 9){
    const box = $('#bingoResult');
    box.className = 'result-card win';
    $('#bingoResultTitle').textContent = '¡BINGO COMPLETO!';
    $('#bingoResultSub').textContent = 'Ya salieron los 9 números. Quien tenga el cartón completo canta bingo y gana el premio.';
    box.hidden = false;
    sfx().win(); addPrize();
  }
  return true;
}
bingoBtns.forEach(b=>{
  b.addEventListener('click', ()=>{
    const n = Number(b.dataset.n);
    if(drawn.includes(n)){ toast('El ' + n + ' ya había salido'); sfx().step(); return; }
    markNumber(n);
  });
});
const btnSurprise = $('#bingoSurprise');
if(btnSurprise) btnSurprise.addEventListener('click', ()=>{
  const pool = [1,2,3,4,5,6,7,8,9].filter(x=>!drawn.includes(x));
  if(!pool.length) return;
  markNumber(pool[Math.floor(Math.random()*pool.length)]);
});
paintBingo();

})();
