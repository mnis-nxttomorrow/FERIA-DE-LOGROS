/* story.js — intro RPG + interludios Tigre/IA + música ambiental (WebAudio, sin archivos) */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const CAST = 'assets/cast/';
const BG = 'assets/img/fondo-nave.jpg';
const V = '?v=2';

const DIALOGS = {
  intro: [
    {who:'tigre', pose:'tigre-feliz', name:'Tigre', text:'¡Por fin despegamos! Siempre quise aprender a programar... pero no sé ni por dónde empezar.'},
    {who:'ia', pose:'ia-saluda', name:'IA', text:'Hola, Tigre. Soy IA. No vengo a programar por ti: vengo a enseñarte cómo se hace.'},
    {who:'tigre', pose:'tigre-saluda', name:'Tigre', text:'¿O sea que no harás mi tarea? Qué robot más vago.'},
    {who:'ia', pose:'ia-explica', name:'IA', text:'Haré algo mejor: te explicaré cada línea, te ayudaré con los errores y celebraremos cuando funcione.'},
    {who:'tigre', pose:'tigre-guino', name:'Tigre', text:'Trato hecho. ¿Por dónde empezamos, profe?'},
    {who:'ia', pose:'ia-presenta', name:'IA', text:'Por el principio: entra al cuaderno y descubre cómo programamos juntos.'},
  ],
  s1: [
    {who:'tigre', pose:'tigre-saluda', name:'Tigre', text:'Hay tantos nombres: ChatGPT, Claude, Gemini... ¿Son robots distintos?'},
    {who:'ia', pose:'ia-explica', name:'IA', text:'Son modelos distintos, como cocineros con estilos propios. Todos ayudan a programar.'},
    {who:'tigre', pose:'tigre-feliz', name:'Tigre', text:'¿Y cuál uso yo?'},
    {who:'ia', pose:'ia-presenta', name:'IA', text:'El que tengas a mano. Abajo los comparamos uno por uno para que elijas.'},
    {who:'tigre', pose:'tigre-corre', name:'Tigre', text:'¡Vamos a verlos!'},
  ],
  s2: [
    {who:'tigre', pose:'tigre-feliz', name:'Tigre', text:'¡La IA me dio un código que funciona a la primera! Lo pego y listo.'},
    {who:'ia', pose:'ia-triste', name:'IA', text:'Espera, Tigre. Que funcione no significa que esté bien.'},
    {who:'tigre', pose:'tigre-saluda', name:'Tigre', text:'¿Me estás diciendo que desconfíe de ti?'},
    {who:'ia', pose:'ia-explica', name:'IA', text:'De mí y de todas: a veces invento cosas muy seguro. Revisa siempre.'},
    {who:'tigre', pose:'tigre-guino', name:'Tigre', text:'Entendido: confiar sí, verificar siempre.'},
  ],
  s3: [
    {who:'tigre', pose:'tigre-corre', name:'Tigre', text:'¡Ya entendí la idea! Pero... ¿y ahora qué hago yo solo?'},
    {who:'ia', pose:'ia-presenta', name:'IA', text:'Practicar. Te preparé una guía: prompts, reglas, un plan y hasta un premio.'},
    {who:'tigre', pose:'tigre-feliz', name:'Tigre', text:'¿Premio? Eso suena a meta final de videojuego.'},
    {who:'ia', pose:'ia-celebra', name:'IA', text:'Mejor: es tu primera misión como desarrollador. Yo marco contigo.'},
    {who:'tigre', pose:'tigre-saluda', name:'Tigre', text:'¡A construir!'},
  ],
};
const SCENE_TITLES = {
  s1: 'Escena 1 · ¿Cuántas IAs hay?',
  s2: 'Escena 2 · Confía, pero verifica',
  s3: 'Escena 3 · El mapa',
};

/* ---------- audio ---------- */
let actx = null, gestured = false;
let bgm = null;
function ensureBgm(){
  if(bgm) return bgm;
  bgm = document.createElement('audio');
  bgm.src = 'assets/music/fondo.mp3' + V;
  bgm.loop = true;
  bgm.volume = 0.45;
  bgm.preload = 'auto';
  bgm.style.display = 'none';
  document.body.appendChild(bgm);
  return bgm;
}
window.addEventListener('pointerdown', ()=>{ gestured = true; }, true);
window.addEventListener('keydown', ()=>{ gestured = true; }, true);
function soundOn(){ try{ return localStorage.getItem('iadev-sound') !== 'off'; }catch(e){ return true; } }
function ac(){
  if(!actx){ const C = window.AudioContext || window.webkitAudioContext; if(!C) return null; actx = new C(); }
  if(actx.state === 'suspended') actx.resume();
  return actx;
}
function blip(who){
  if(!soundOn() || !gestured) return;
  const c = ac(); if(!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.value = who === 'ia' ? 330 : 620;
  const t = c.currentTime;
  g.gain.setValueAtTime(0.035, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.09);
}
function musicStart(){
  if(!soundOn() || !gestured) return;
  try{
    const a = ensureBgm();
    if(a.paused) a.play().catch(()=>{});
  }catch(e){}
}
function musicStop(){ try{ if(bgm && !bgm.paused) bgm.pause(); }catch(e){} }
document.addEventListener('iadev-sound', ()=>{ soundOn() ? musicStart() : musicStop(); });

/* ---------- motor de diálogo ---------- */
function renderDlg(mount, lines, opts){
  opts = opts || {};
  mount.innerHTML =
    '<div class="dlg" style="background-image:url(' + BG + V + ')">' +
      '<div class="dlg-actors">' +
        '<img class="actor left" alt="Tigre" />' +
        '<img class="actor right" alt="IA" />' +
      '</div>' +
      '<div class="dlg-box"><span class="dlg-name"></span><p class="dlg-text"></p>' +
      '<div class="dlg-foot"><span class="dlg-dots"></span>' +
      (opts.skippable ? '<button class="dlg-skip">Saltar</button>' : '') +
      '<button class="dlg-next">Siguiente</button></div></div>' +
    '</div>';
  const box = mount.querySelector('.dlg-box'),
        txt = mount.querySelector('.dlg-text'),
        name = mount.querySelector('.dlg-name'),
        dots = mount.querySelector('.dlg-dots'),
        next = mount.querySelector('.dlg-next'),
        imgL = mount.querySelector('.actor.left'),
        imgR = mount.querySelector('.actor.right');
  let i = 0, timer = null, done = false;
  dots.innerHTML = lines.map(()=>'<i></i>').join('');
  function paintDots(){ Array.from(dots.children).forEach((d,k)=>d.classList.toggle('on', k<=i)); }
  function show(k){
    i = k;
    const L = lines[k];
    name.textContent = L.name;
    name.className = 'dlg-name ' + L.who;
    imgL.src = CAST + poseOf(lines, k, 'tigre') + V;
    imgR.src = CAST + poseOf(lines, k, 'ia') + V;
    imgL.classList.toggle('dim', L.who !== 'tigre');
    imgR.classList.toggle('dim', L.who !== 'ia');
    next.textContent = (k === lines.length - 1) ? (opts.cta || 'Continuar') : 'Siguiente';
    let c = 0; done = false; txt.textContent = '';
    clearInterval(timer);
    blip(L.who);
    timer = setInterval(()=>{
      c++;
      txt.textContent = L.text.slice(0, c);
      if(c % 3 === 0) blip(L.who);
      if(c >= L.text.length){ clearInterval(timer); done = true; }
    }, 22);
    paintDots();
  }
  function poseOf(ls, k, side){
    for(let j = k; j >= 0; j--) if(ls[j].who === side) return ls[j].pose + '.png';
    for(let j = 0; j < ls.length; j++) if(ls[j].who === side) return ls[j].pose + '.png';
    return side === 'tigre' ? 'tigre-feliz.png' : 'ia-saluda.png';
  }
  function advance(){
    if(!done){ clearInterval(timer); txt.textContent = lines[i].text; done = true; return; }
    if(i < lines.length - 1) show(i + 1);
    else { clearInterval(timer); if(opts.onDone) opts.onDone(); }
  }
  next.addEventListener('click', (e)=>{ e.stopPropagation(); advance(); });
  box.addEventListener('click', advance);
  const skip = mount.querySelector('.dlg-skip');
  if(skip) skip.addEventListener('click', (e)=>{ e.stopPropagation(); clearInterval(timer); if(opts.onDone) opts.onDone(); });
  show(0);
}

/* ---------- intro ---------- */
function openIntro(){
  const ov = $('#intro');
  if(!ov) return;
  document.body.style.overflow = 'hidden';
  renderDlg($('#introStage'), DIALOGS.intro, {
    cta: 'Entrar al cuaderno', skippable: true,
    onDone: closeIntro,
  });
}
function closeIntro(){
  const ov = $('#intro');
  if(!ov || ov.classList.contains('gone')) return;
  ov.classList.add('gone');
  document.body.style.overflow = '';
  musicStart();
  setTimeout(()=>ov.remove(), 600);
}
window.__reopenIntro = openIntro;

/* ---------- interludios ---------- */
function poster(mount, key){
  mount.innerHTML =
    '<button class="rpg-poster" style="background-image:url(' + BG + V + ')">' +
      '<img class="rpg-t" src="' + CAST + 'tigre-feliz.png' + V + '" alt="Tigre" loading="lazy" />' +
      '<span class="rpg-info"><b>' + SCENE_TITLES[key] + '</b><i>Diálogo entre Tigre y la IA · toca para ver</i></span>' +
      '<img class="rpg-i" src="' + CAST + 'ia-saluda.png' + V + '" alt="IA" loading="lazy" />' +
    '</button>';
  mount.querySelector('.rpg-poster').addEventListener('click', ()=>{
    renderDlg(mount, DIALOGS[key], {cta: 'Seguir explorando', onDone: ()=>poster(mount, key)});
    if(window.__sfx) window.__sfx.pop();
  });
}

/* ---------- arranque ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  $$('.rpg').forEach(m=>{ if(DIALOGS[m.dataset.scene]) poster(m, m.dataset.scene); });
  const skip = $('#btnSkipIntro');
  if(skip) skip.addEventListener('click', closeIntro);
  openIntro();
  const ri = $('#btnReIntro');
  if(ri) ri.addEventListener('click', ()=>location.reload());
});
})();
