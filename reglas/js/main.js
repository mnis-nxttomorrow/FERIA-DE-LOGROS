/* main.js — motor general: sonido, tema, navegación, toasts, reveals */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- Sonido (Web Audio) ---------- */
let audioCtx = null;
let soundOn = localStorage.getItem('mj-sound') !== 'off';
function ctx(){ if(!audioCtx){ const C = window.AudioContext||window.webkitAudioContext; if(!C) return null; audioCtx = new C(); } if(audioCtx.state==='suspended') audioCtx.resume(); return audioCtx; }
function tone(freq=440, dur=.08, type='square', vol=.05, when=0){
  if(!soundOn) return;
  try{
    const c = ctx(); if(!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + .02);
  }catch(e){}
}
const SFX = {
  click(){ tone(520,.06,'square',.05); tone(780,.05,'square',.03,.05); },
  pop(){ tone(880,.05,'square',.04); },
  step(){ tone(300+Math.random()*200,.03,'square',.02); },
  tick(){ tone(880,.04,'square',.035); },
  win(){ [523,659,784,1046].forEach((f,i)=>tone(f,.12,'square',.05,i*.09)); },
  lose(){ tone(220,.18,'sawtooth',.05); tone(165,.22,'sawtooth',.05,.12); },
  ok(){ [659,784,988].forEach((f,i)=>tone(f,.09,'triangle',.05,i*.07)); }
};
document.addEventListener('click', e=>{ if(e.target.closest('button,a,.op-card,.bnum,.tt')) SFX.click(); });

/* toggle sonido */
const soundBtn = $('#soundToggle');
function renderSound(){ if(!soundBtn) return; soundBtn.classList.toggle('off', !soundOn); soundBtn.innerHTML = (soundOn?'♪ <span>Sonido ON</span>':'<span>Sonido OFF</span>'); soundBtn.setAttribute('aria-pressed', soundOn); }
if(soundBtn) soundBtn.addEventListener('click', ()=>{ soundOn=!soundOn; localStorage.setItem('mj-sound', soundOn?'on':'off'); renderSound(); if(soundOn) SFX.ok(); toast(soundOn?'Sonido activado':'Sonido apagado'); });
renderSound();

/* ---------- Modo noche / día ---------- */
const themeBtn = $('#themeToggle');
function renderTheme(){
  const n = document.body.classList.contains('noche');
  if(themeBtn){ themeBtn.innerHTML = (n?'☀ <span>Día</span>':'☾ <span>Noche</span>'); themeBtn.setAttribute('aria-pressed', n); themeBtn.title = n?'Cambiar a modo día':'Cambiar a modo noche'; }
}
try{ if(localStorage.getItem('mj-theme')==='noche') document.body.classList.add('noche'); }catch(e){}
renderTheme();
if(themeBtn) themeBtn.addEventListener('click', ()=>{
  document.body.classList.toggle('noche');
  const n = document.body.classList.contains('noche');
  try{ localStorage.setItem('mj-theme', n?'noche':'dia'); }catch(e){}
  renderTheme(); SFX.pop();
  toast(n?'Modo noche activado':'Modo día activado');
});

/* ---------- Toast ---------- */
let toastT;
function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }
window.__toast = toast; window.__sfx = SFX;

/* ---------- Reveal + scroll ---------- */
const io = new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting) en.target.classList.add('visible'); }),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));
const lineFill = $('#progressLineFill');
window.addEventListener('scroll', ()=>{
  const h=document.documentElement;
  const p = Math.round(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)||0;
  if(lineFill) lineFill.style.width = p + '%';
}, {passive:true});

/* ---------- Nav ---------- */
const links = $$('.nav-links a');
const navIO = new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting) links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+en.target.id));
}),{rootMargin:'-40% 0px -55% 0px'});
$$('main section').forEach(s=>navIO.observe(s));
const menuBtn = $('#menuBtn');
if(menuBtn) menuBtn.addEventListener('click', ()=> $('#navLinks').classList.toggle('open'));
$('#navLinks').addEventListener('click', e=>{ if(e.target.tagName==='A') $('#navLinks').classList.remove('open'); });

const btnVer = $('#btnVerJuegos');
if(btnVer) btnVer.addEventListener('click', ()=>{ $('#juegos').scrollIntoView({behavior:'smooth'}); SFX.pop(); });

})();
