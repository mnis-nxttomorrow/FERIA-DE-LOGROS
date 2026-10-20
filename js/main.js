/* IA+DEV main.js — interacciones, sonido WebAudio, progreso, easter eggs */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- Progreso: se reinicia en cada recarga ----------
   Solo el avance de la experiencia. Las preferencias (sonido, tema dia/noche
   y posicion del robot) se conservan para no molestar al recargar. */
try{
  localStorage.removeItem('iadev-progress');
  localStorage.removeItem('iadev-done');
  localStorage.removeItem('iadev-route');
}catch(e){}

/* ---------- Sonido (Web Audio, sin archivos) ---------- */
let audioCtx = null;
let soundOn = localStorage.getItem('iadev-sound') !== 'off';
function ctx(){ if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } if(audioCtx.state==='suspended') audioCtx.resume(); return audioCtx; }
function tone(freq=440, dur=0.08, type='square', vol=0.05, when=0){
  if(!soundOn) return;
  try{
    const c = ctx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }catch(e){}
}
const SFX = {
  hover(){ tone(660,.05,'square',.03); },
  click(){ tone(520,.07,'square',.06); tone(780,.06,'square',.04,.05); },
  ok(){ [523,659,784].forEach((f,i)=>tone(f,.1,'square',.05,i*.08)); },
  bad(){ tone(180,.18,'sawtooth',.05); tone(140,.2,'sawtooth',.05,.1); },
  unlock(){ [392,523,659,784,1046].forEach((f,i)=>tone(f,.12,'triangle',.06,i*.07)); },
  pop(){ tone(880,.05,'square',.05); },
  step(){ tone(300+Math.random()*200,.03,'square',.02); },
  start(){ [262,392,523,659].forEach((f,i)=>tone(f,.14,'square',.06,i*.09)); }
};
document.addEventListener('pointerover', e=>{
  if(e.target.closest('button, a, .card')){ /* hover muy discreto, sin spam */ }
});

/* toggle */
const soundBtn = $('#soundToggle');
function renderSound(){ soundBtn.classList.toggle('off', !soundOn); soundBtn.innerHTML = (soundOn?'♪ <span>Sonido ON</span>':'<span>Sonido OFF</span>'); soundBtn.setAttribute('aria-pressed', soundOn); }
soundBtn.addEventListener('click', ()=>{ soundOn=!soundOn; localStorage.setItem('iadev-sound', soundOn?'on':'off'); renderSound(); document.dispatchEvent(new Event('iadev-sound')); if(soundOn) SFX.ok(); toast(soundOn?'Sonido activado':'Sonido apagado'); });
renderSound();

/* ---------- Modo noche / día ---------- */
const themeBtn = $('#themeToggle');
function nightOn(){ return document.body.classList.contains('noche'); }
function renderTheme(){
  const n = nightOn();
  document.body.classList.toggle('noche', n);
  if(themeBtn){ themeBtn.innerHTML = (n?'☀ <span>Día</span>':'☾ <span>Noche</span>'); themeBtn.setAttribute('aria-pressed', n); themeBtn.title = n?'Cambiar a modo día':'Cambiar a modo noche'; }
}
try{ if(localStorage.getItem('iadev-theme')==='noche') document.body.classList.add('noche'); }catch(e){}
renderTheme();
if(themeBtn) themeBtn.addEventListener('click', ()=>{
  document.body.classList.toggle('noche');
  const n = nightOn();
  try{ localStorage.setItem('iadev-theme', n?'noche':'dia'); }catch(e){}
  renderTheme(); SFX.pop();
  toast(n?'Modo noche activado':'Modo día activado');
});

/* ---------- Toast ---------- */
let toastT;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }
window.__toast = toast; window.__sfx = SFX;
document.addEventListener('click', e=>{ if(e.target.closest('button,a')) SFX.click(); });

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('visible'); onSectionSeen(en.target);} }),{threshold:.15});
$$('.reveal').forEach(el=>io.observe(el));

/* ---------- Progreso ---------- */
const lineFill = $('#progressLineFill'), miniLabel = $('#miniProgressLabel');
let maxSection = parseInt(localStorage.getItem('iadev-progress')||'0',10);
function onSectionSeen(el){
  const sec = el.closest('.section');
  if(sec && sec.dataset.progress){ maxSection = Math.max(maxSection, parseInt(sec.dataset.progress,10)); localStorage.setItem('iadev-progress', maxSection); updateProgress(); }
  if(sec && sec.id==='guia'){ const cb=$('#completeBanner'); if(cb) cb.hidden = false; }
}
function updateProgress(){
  const h = document.documentElement;
  const scrollPct = Math.round((h.scrollTop)/(h.scrollHeight-h.clientHeight)*100) || 0;
  const pct = Math.max(scrollPct, maxSection, parseInt(localStorage.getItem('iadev-progress')||'0',10));
  lineFill.style.width = pct + '%';
  miniLabel.textContent = 'Progreso ' + Math.min(100,pct) + '%';
  if(pct>=98 && !localStorage.getItem('iadev-done')){ localStorage.setItem('iadev-done','1'); SFX.unlock(); toast('HAS COMPLETADO LA EXPERIENCIA'); }
}
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

/* ---------- Nav ---------- */
const links = $$('.nav-links a');
const secIO = new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){ links.forEach(a=>a.classList.toggle('active', a.getAttribute('href')==='#'+en.target.id)); }
}),{rootMargin:'-40% 0px -55% 0px'});
$$('main .section').forEach(s=>secIO.observe(s));
$('#menuBtn').addEventListener('click', ()=> $('#navLinks').classList.toggle('open'));
$('#navLinks').addEventListener('click', e=>{ if(e.target.tagName==='A') $('#navLinks').classList.remove('open'); });

$('#btnComenzar').addEventListener('click', ()=>{
  SFX.start();
  $('#que-pasa').scrollIntoView({behavior:'smooth'});
  toast('Bienvenido/a. Pixel te acompaña en el recorrido');
});

/* ---------- Héroe: selfie ---------- */
const deskCard = document.getElementById('deskCard');
let selfies = 0;
if(deskCard){
  deskCard.style.cursor = 'pointer';
  deskCard.addEventListener('click', ()=>{
    selfies++; SFX.pop();
    deskCard.style.transform = 'rotate(-1deg) scale(.99)';
    setTimeout(()=>deskCard.style.transform='',180);
    if(selfies===5){ SFX.unlock(); toast('Secreto descubierto: Tigre e IA posan para ti. ¡Sigue explorando!'); }
    if(selfies===12){ toast('Tigre dice: “prueba ↑↑↓↓←→←→ B A”'); }
  });
}

/* ---------- Conceptos ---------- */
const cards = $$('#conceptGrid .card');
const countEl = $('#conceptCount');
function paintConcepts(){
  const seen = cards.filter(c=>c.classList.contains('seen')).length;
  countEl.textContent = seen + '/8';
  if(seen>0) $('#checkConcepts').textContent = '●';
  if(seen===8 && !window.__c8){ window.__c8=true; SFX.unlock(); toast('¡Descubriste las 8 ideas! +20% de sabiduría'); }
}
cards.forEach(c=>{
  const mark = ()=>{ if(!c.classList.contains('seen')){ c.classList.add('seen'); SFX.pop(); paintConcepts(); } };
  c.addEventListener('pointerenter', mark);
  c.addEventListener('focus', mark);
  c.addEventListener('click', mark);
});
paintConcepts();

/* ---------- Herramientas ---------- */
const TOOLS = {
  chatgpt:{name:'ChatGPT', icon:'chatgpt.png', desc:'Para aprender, explicar código, generar ideas, depurar y crear prototipos rápidos.', list:['Explica errores en lenguaje simple','Te da ejemplos que puedes modificar','Bueno para empezar desde cero'], when:'Úsalo cuando: estás aprendiendo, te atascas o quieres una primera versión para experimentar.'},
  claude:{name:'Claude', icon:'claude.png', desc:'Para trabajar con textos largos, analizar proyectos y razonar paso a paso sobre código.', list:['Lee archivos largos sin perderse','Razona con calma antes de responder','Cuida el estilo y la explicación'], when:'Úsalo cuando: tienes un proyecto grande o necesitas pensar bien una decisión de diseño.'},
  gemini:{name:'Gemini', icon:'gemini.png', desc:'Para asistencia con programación, análisis y herramientas del ecosistema de Google.', list:['Conecta con docs, sheets y búsqueda','Ayuda a analizar datos y código','Útil para prototipos web rápidos'], when:'Úsalo cuando: trabajas con herramientas de Google o quieres investigar + programar a la vez.'},
  deepseek:{name:'DeepSeek', icon:'deepseek.png', desc:'Para programación, razonamiento y experimentar con modelos de IA abiertos.', list:['Muy bueno resolviendo lógica','Puedes probarlo y compararlo','Interesante para curiosos técnicos'], when:'Úsalo cuando: quieres practicar algoritmos o experimentar con modelos.'},
  copilot:{name:'GitHub Copilot', icon:'copilot.png', desc:'Para asistencia directamente mientras escribes código en tu editor.', list:['Sugiere la siguiente línea','Autocompleta funciones enteras','Aprende de tu estilo'], when:'Úsalo cuando: ya escribes código y quieres ir más rápido, revisando cada sugerencia.'}
};
const tabs = $$('.tool-tabs .tab');
function showTool(key){
  const t = TOOLS[key];
  $('#toolName').textContent = t.name;
  $('#toolDesc').textContent = t.desc;
  $('#toolIllus').innerHTML = '<img src="assets/logos/' + t.icon + '?v=2" alt="Logo de ' + t.name + '" />';
  $('#toolIllus').title = t.name;
  $('#toolList').innerHTML = t.list.map(x=>`<li>${x}</li>`).join('');
  $('#toolWhen').textContent = t.when;
  tabs.forEach(b=>b.classList.toggle('active', b.dataset.tool===key));
  SFX.pop();
}
tabs.forEach(b=>b.addEventListener('click', ()=>showTool(b.dataset.tool)));
showTool('chatgpt');

/* ---------- Compañero IA ---------- */
let brokenClicks = 0, fixed = false;
$('#btnTryCounter').addEventListener('click', ()=>{
  brokenClicks += fixed?1:2;
  $('#tryResult').textContent = `clics: ${brokenClicks} ${fixed?'(ahora sí sube de 1 en 1)':'(debería subir de 1 en 1… ¿o no?)'}`;
  SFX.step();
});
const steps = ['leyendo líneas','revisando la suma','comparando con lo esperado','preparando explicación'];
$('#btnAskAI').addEventListener('click', ()=>{
  const th = $('#aiThinking'), an = $('#aiAnswer');
  an.hidden = true; th.hidden = false;
  let i = 0;
  $('#thinkStep').textContent = steps[0];
  const iv = setInterval(()=>{
    i++; SFX.step();
    if(i<steps.length){ $('#thinkStep').textContent = steps[i]; }
    else{ clearInterval(iv); th.hidden = true; an.hidden = false; SFX.ok(); an.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }, 650);
});
$('#btnFix').addEventListener('click', ()=>{
  fixed = true;
  document.querySelector('#codeBlock .err').textContent = '1';
  document.querySelector('#codeBlock .err').classList.remove('err');
  SFX.unlock(); toast('¡Error corregido! El contador ya suma de 1 en 1');
  $('#btnFix').textContent = 'Corregido. ¡Prueba el contador!';
});

/* ---------- ¿Confiarías? ---------- */
const CASES = [
  {q:'¿Confiarías en este código para tu app de verdad?', good:'¡Buen instinto! Funciona, pero guarda la contraseña <b>“1234” escrita directamente</b> en el código. Cualquiera que lo lea entra. Es <b>código inseguro</b>: anda, pero no es de fiar. La IA a veces propone atajos así.', score:'intuición: precavida'},
  {q:'Caso 2: la IA te dio esta función “que calcula el promedio”. ¿La usarías sin probarla?', code:`<span class="kw">function</span> <span class="fn">promedio</span>(a, b) {\n  <span class="kw">return</span> a + b / <span class="num">2</span>; <span class="cm">// ¿seguro?</span>\n}`, good:'¡Exacto! Por orden de operaciones hace <b>a + (b/2)</b>, no el promedio real. La IA <b>se equivocó en lógica</b> y lo dijo con total seguridad. Moraleja: prueba siempre con ejemplos.', score:'intuición: tester'},
  {q:'Caso 3: le pediste “ordena la lista” y generó 40 líneas confusas que funcionan. ¿Lo dejas así?', code:`<span class="cm">// 40 líneas con variables x1, x2, tmp7… funciona, pero nadie lo entiende</span>\n<span class="kw">function</span> <span class="fn">ordenar</span>(l){ <span class="cm">/* …magia confusa… */</span> }`, good:'Sabia decisión. Funcionar no es lo mismo que estar bien hecho. Ese código será <b>imposible de mantener</b>. Un buen dev pide a la IA una versión <b>simple y legible</b>, y la revisa.', score:'intuición: de diseñador'}
];
let caseIdx = 0;
const out = $('#trustOut');
function showCase(){
  const c = CASES[caseIdx];
  document.querySelector('#desconfiar .trust-top .pill').textContent = `caso ${caseIdx+1} / 3`;
  document.querySelector('#desconfiar .trust-q').textContent = c.q;
  if(c.code) document.querySelector('#desconfiar .code code').innerHTML = c.code;
  out.hidden = true; $('#btnTrustNext').hidden = true;
}
$('#btnTrustYes').addEventListener('click', ()=>revealTrust(false));
$('#btnTrustNo').addEventListener('click', ()=>revealTrust(true));
function revealTrust(wasCareful){
  const c = CASES[caseIdx];
  out.className = 'trust-out ' + (wasCareful?'good':'bad');
  out.innerHTML = (wasCareful?'':'<b>A la IA también se le cree demasiado fácil.</b><br/>') + c.good;
  out.hidden = false;
  $('#trustScore').textContent = c.score;
  $('#btnTrustNext').hidden = caseIdx>=2;
  $('#btnTrustNext').textContent = caseIdx>=2 ? 'Terminado ✓' : 'Siguiente trampa →';
  wasCareful ? SFX.ok() : SFX.bad();
}
$('#btnTrustNext').addEventListener('click', ()=>{ caseIdx=Math.min(2,caseIdx+1); showCase(); });

/* ---------- Timeline futuro ---------- */
const ERAS = {
  antes:{w:'10%', t:'Antes: pasabas horas con sintaxis. Cada punto y coma era una batalla.'},
  ahora:{w:'55%', t:'Ahora: escribes, preguntas a la IA, comparas, revisas y mejoras. Vas 3× más rápido.'},
  futuro:{w:'100%', t:'Futuro: tú piensas, diseñas y diriges. La IA ejecuta borradores y tú decides qué merece existir.'}
};
$$('.t-step').forEach(b=>b.addEventListener('click', ()=>{
  $$('.t-step').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  const e = ERAS[b.dataset.era];
  $('#tFill').style.width = e.w;
  $('#tText').textContent = e.t; SFX.pop();
}));

/* ---------- Guía: constructor de prompts ---------- */
const PROMPTS = {
  explicar: {
    nuevo: '“Estoy aprendiendo a programar. Explícame este código línea por línea, con palabras simples y un ejemplo de la vida real:\n\n[pega tu código aquí]”',
    algo: '“Explícame qué hace este código y dime si hay una forma más clara o eficiente de escribirlo:\n\n[pega tu código aquí]”'
  },
  error: {
    nuevo: '“Soy principiante y me sale este error. Dime en palabras simples qué significa y por dónde empiezo a buscar el problema:\n\n[pega el error aquí]”',
    algo: '“Este código falla con este error. Dame 2 posibles causas ordenadas de más a menos probable y cómo comprobar cada una:\n\n[pega código + error]”'
  },
  empezar: {
    nuevo: '“Quiero hacer mi primer mini-proyecto: una lista de tareas en [Python/JavaScript]. Dame los pasos en orden, sin escribir todo el código por mí, y pregúntame al final de cada paso si entendí.”',
    algo: '“Quiero construir [tu idea]. Propón la estructura del proyecto en archivos, qué hace cada parte y por cuál empiezo. Código corto, explicación clara.”'
  },
  mejorar: {
    nuevo: '“Este es mi código y funciona, pero creo que puede estar mejor. Dime qué mejorarías primero y por qué, sin cambiarlo todo de golpe:\n\n[pega tu código]”',
    algo: '“Revisa este código como si fueras mi compañero senior: legibilidad, errores posibles y rendimiento. Dame máximo 3 observaciones accionables:\n\n[pega tu código]”'
  }
};
const TIPS = {
  explicar: 'Tip: después pide “¿y si cambio esta línea, qué pasaría?” para comprobar que entendiste.',
  error: 'Tip: pega SIEMPRE el mensaje de error completo. Sin eso, la IA adivina.',
  empezar: 'Tip: pide que NO te dé todo hecho. Aprendes más si escribes tú con su guía.',
  mejorar: 'Tip: pide pocas mejoras a la vez. Aplicar 10 cambios juntos es como no cambiar nada.'
};
function paintPrompt(){
  const t=$('#pbTask'), l=$('#pbLevel');
  if(!t||!l) return;
  $('#promptText').textContent = PROMPTS[t.value][l.value];
  $('#promptTip').textContent = TIPS[t.value];
}
['pbTask','pbLevel'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change',()=>{paintPrompt();SFX.pop();hopPixel();}); });
paintPrompt();
const btnCopy=$('#btnCopyPrompt');
if(btnCopy) btnCopy.addEventListener('click', async ()=>{
  const txt=$('#promptText').textContent;
  try{ await navigator.clipboard.writeText(txt); toast('Prompt copiado. Pégalo en tu IA favorita'); }
  catch(e){ toast('No se pudo copiar, selecciónalo manualmente'); }
  SFX.ok();
});

/* ---------- Guía: mitos (voltear) ---------- */
$$('.myth').forEach(m=>m.addEventListener('click',()=>{
  m.classList.toggle('flipped'); SFX.pop();
  hopPixel();
  const total=$$('.myth.flipped').length;
  if(total===4&&!window.__m4){
    window.__m4=true; SFX.unlock();
    pixelConfetti(m.closest('.guide-block'));
    sayPixel('¡Cazadora de mitos! Ninguna te la cuela ya.');
    cheerPixel();
  }
}));

/* ---------- Guía: ruta (checklist con memoria) ---------- */
const routeBoxes=$$('#routeList input[type="checkbox"]');
function paintRoute(){
  const done=routeBoxes.filter(b=>b.checked).length;
  const c=$('#routeCount'); if(c) c.textContent=done+'/5';
  const rd=$('#routeDone'); if(rd) rd.hidden=done<5;
  try{ localStorage.setItem('iadev-route', JSON.stringify(routeBoxes.map(b=>b.checked))); }catch(e){}
  if(done===5&&!window.__r5){window.__r5=true;SFX.unlock();toast('¡Ruta completa! Piensas como desarrollador');cheerPixel();}
}
try{
  const saved=JSON.parse(localStorage.getItem('iadev-route')||'[]');
  routeBoxes.forEach((b,i)=>{ if(saved[i]) b.checked=true; });
}catch(e){}
routeBoxes.forEach(b=>b.addEventListener('change',()=>{paintRoute();SFX.pop();}));
paintRoute();

/* ---------- Guía: Pixel-guía que comenta cada bloque ---------- */
const pgSpeech = $('#pgSpeech');
function sayPixel(msg){
  if(!pgSpeech) return;
  pgSpeech.classList.add('swap');
  setTimeout(()=>{ pgSpeech.textContent=msg; pgSpeech.classList.remove('swap'); },180);
}
function hopPixel(){ const el=document.querySelector('.pg-img'); if(!el)return; el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); }
function cheerPixel(){ const el=document.querySelector('.pg-img'); if(!el)return; el.classList.remove('cheer'); void el.offsetWidth; el.classList.add('cheer'); }
function pixelConfetti(block){
  if(!block) return;
  const box=document.createElement('span');
  box.className='px-confetti'; box.setAttribute('aria-hidden','true');
  const colors=['#FFC94D','#E84A8A','#8affc1','#6D4AC8','#fff'];
  for(let i=0;i<16;i++){
    const s=document.createElement('i');
    s.style.left=(5+Math.random()*90)+'%';
    s.style.background=colors[i%colors.length];
    s.style.animationDelay=(Math.random()*.35)+'s';
    box.appendChild(s);
  }
  block.appendChild(box);
  setTimeout(()=>box.remove(),1800);
}
const sayIO=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting&&en.target.dataset.say) sayPixel(en.target.dataset.say);
}),{rootMargin:'-30% 0px -50% 0px'});
$$('#guia .guide-block').forEach(b=>sayIO.observe(b));

/* ---------- Glosario ---------- */
const GLOSS = {
  prompt: '<b>prompt:</b> lo que le escribes a la IA. Como darle instrucciones a un ayudante: mientras más claras, mejor ayuda.',
  modelo: '<b>modelo:</b> el “cerebro” entrenado detrás de la IA. ChatGPT, Claude o Gemini son modelos distintos, como cocineros con estilos propios.',
  alucinacion: '<b>alucinación:</b> cuando la IA inventa algo y lo dice muy segura. Por eso siempre verificamos.',
  token: '<b>token:</b> los pedacitos en que la IA corta el texto para leerlo. Las preguntas cortas gastan menos.',
  dataset: '<b>dataset:</b> la montaña de textos y código con la que aprendió el modelo. De ahí saca lo que sabe… y también sus errores.',
  depurar: '<b>depurar:</b> buscar y arreglar errores en tu programa (en inglés, <i>debuggear</i>). La IA es buena compañera para eso.'
};
$$('#glossChips button').forEach(b=>b.addEventListener('click',()=>{
  $$('#glossChips button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $('#glossDef').innerHTML = GLOSS[b.dataset.g];
  SFX.pop();
}));

/* ---------- Versus sin/con IA ---------- */
const VERSUS = {
  sin: {label:'~45 min, a solas', bar:96, note:'Funciona, pero tardas más y las dudas se quedan contigo.',
    steps:['Buscas en Google “botón que saluda javascript”.','Abres 3 foros con respuestas de hace 6 años.','Copias un código que casi funciona y lo ajustas a ciegas.','Pruebas, falla, repites. Nadie te explica el porqué.']},
  con: {label:'~15 min, acompañado', bar:34, note:'Llegas al mismo botón, pero entendiendo cada línea.',
    steps:['Describes lo que quieres a la IA.','Pegas el borrador que te propone.','Le pides que explique línea por línea.','Pruebas, preguntas el porqué y lo ajustas.']}
};
function paintVersus(mode){
  const v=VERSUS[mode];
  $$('.versus-toggle .tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  $('#versusSteps').innerHTML=v.steps.map(s=>`<li>${s}</li>`).join('');
  $('#versusLabel').textContent=v.label;
  requestAnimationFrame(()=>{ $('#versusBar').style.width=v.bar+'%'; });
  $('#versusNote').textContent=v.note;
}
$$('.versus-toggle .tab').forEach(b=>b.addEventListener('click',()=>{paintVersus(b.dataset.mode);SFX.pop();}));
if($('#versusSteps')) paintVersus('sin');

/* ---------- Anatomía del prompt ---------- */
const ANA = {
  rol: '<b>ROL:</b> le dices QUÉ papel jugar. “Tutor paciente” responde distinto que “experto apurado”.',
  ctx: '<b>CONTEXTO:</b> le cuentas DÓNDE estás. Con tu nivel, ajusta las palabras que usa.',
  task: '<b>TAREA:</b> la orden clara y concreta. Una tarea por prompt funciona mejor que cinco.',
  fmt: '<b>FORMATO:</b> le pides CÓMO responder: con ejemplo, paso a paso, en lista. Así no te da un muro de texto.'
};
$$('#anatomy .ana').forEach(b=>b.addEventListener('click',()=>{
  $$('#anatomy .ana').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  $('#anatomyOut').innerHTML=ANA[b.dataset.a];
  SFX.pop(); hopPixel();
}));

/* ---------- Proyecto: qué quieres construir ---------- */
const PROJ = {
  juego: {plan:['Un personaje que se mueve con las flechas.','Algo que recoger para ganar puntos.','Una pantalla de “ganaste”.'],
    prompt:'“Quiero hacer mi primer videojuego web con JavaScript: un cuadrado que se mueve con flechas y recoge estrellas. Dame el plan en 3 pasos y el código del paso 1 explicado.”',
    tip:'Tip: empieza sin gráficos. Cuadrados de colores valen.'},
  web: {plan:['Una página con tu nombre y lo que te gusta.','Un botón que cambie algo al pulsarlo.','Publícala gratis para mostrarla.'],
    prompt:'“Quiero mi primera página web con HTML y CSS: mi nombre, una foto y un botón que cambie el color de fondo. Dame el código explicado parte por parte.”',
    tip:'Tip: si algo se ve raro, describe lo que ves y pide el arreglo.'},
  app: {plan:['Una lista donde agregar tareas.','Que se guarden al recargar la página.','Un botón para borrar las hechas.'],
    prompt:'“Quiero una app de lista de tareas en JavaScript: agregar, tachar y borrar, guardando en el navegador. Dame primero la estructura y luego el código del paso 1.”',
    tip:'Tip: pide una función a la vez, no la app entera.'}
};
function paintProj(key){
  const p=PROJ[key];
  $$('#projPick .tab').forEach(b=>b.classList.toggle('active',b.dataset.proj===key));
  $('#projPlan').innerHTML=p.plan.map(s=>`<li>${s}</li>`).join('');
  $('#projPrompt').textContent=p.prompt;
  $('#projTip').textContent=p.tip;
}
$$('#projPick .tab').forEach(b=>b.addEventListener('click',()=>{paintProj(b.dataset.proj);closePreview();SFX.pop();hopPixel();}));
if($('#projPlan')) paintProj('juego');
const btnCopyProj=$('#btnCopyProj');
if(btnCopyProj) btnCopyProj.addEventListener('click', async ()=>{
  try{ await navigator.clipboard.writeText($('#projPrompt').textContent); toast('Prompt copiado. Pégalo en tu IA favorita'); }
  catch(e){ toast('No se pudo copiar, selecciónalo manualmente'); }
  SFX.ok();
});

/* ---------- Vista previa viva (PASO 5) ---------- */
let previewKind = null, previewRAF = 0, pvJump = false;
const pvStage=$('#previewStage'), pvBody=$('#previewBody'), pvTitle=$('#previewTitle'), pvHint=$('#previewHint');
const PREVIEWS = {
  juego:{title:'Mini juego: recoge las 3 estrellas', hint:'Mueve con ← → o A D y salta con ESPACIO. ¡Atrapa las 3 estrellas!'},
  web:{title:'Mini web: tu primera página', hint:'Escribe tu nombre y pulsa el botón de color.'},
  app:{title:'Mini app: lista de tareas', hint:'Agrega tareas, táchalas con el cuadrito y bórralas con la ×.'}
};
function currentProj(){ const a=document.querySelector('#projPick .tab.active'); return a?a.dataset.proj:'juego'; }
function closePreview(){ if(!pvStage) return; pvStage.hidden=true; previewKind=null; cancelAnimationFrame(previewRAF); }
const btnClosePv=$('#btnClosePreview');
if(btnClosePv) btnClosePv.addEventListener('click',()=>{closePreview();SFX.pop();});
const btnPv=$('#btnPreview');
if(btnPv) btnPv.addEventListener('click',()=>{ openPreview(currentProj()); SFX.ok(); hopPixel(); });
function openPreview(kind){
  previewKind=kind; pvJump=false; cancelAnimationFrame(previewRAF);
  pvTitle.textContent=PREVIEWS[kind].title;
  pvHint.textContent=PREVIEWS[kind].hint;
  pvBody.innerHTML='';
  pvStage.hidden=false;
  pvStage.scrollIntoView({behavior:'smooth',block:'nearest'});
  if(kind==='juego') buildMiniGame();
  else if(kind==='web') buildMiniWeb();
  else buildMiniApp();
}
const pvKeys={};
window.addEventListener('keydown',e=>{
  if(previewKind!=='juego') return;
  if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(e.key)){ pvKeys[e.key.toLowerCase()]=true; e.preventDefault(); }
  if([' ','ArrowUp','w','W'].includes(e.key)){ pvJump=true; e.preventDefault(); }
});
window.addEventListener('keyup',e=>{ pvKeys[e.key.toLowerCase()]=false; });
function buildMiniGame(){
  const cv=document.createElement('canvas');
  cv.width=520; cv.height=240; cv.className='pv-canvas'; cv.tabIndex=0;
  pvBody.appendChild(cv);
  const g=cv.getContext('2d');
  const P={x:30,y:190,w:26,h:26,vy:0,ground:false};
  const plats=[{x:110,y:158,w:100},{x:310,y:112,w:100}];
  const stars=[{x:60,y:196},{x:160,y:126},{x:360,y:80}].map(s=>({...s,taken:false}));
  let won=false;
  const GY=cv.height-8;
  (function loop(){
    if(previewKind!=='juego') return;
    if(pvKeys['arrowleft']||pvKeys['a']) P.x-=4;
    if(pvKeys['arrowright']||pvKeys['d']) P.x+=4;
    P.x=Math.max(4,Math.min(cv.width-P.w-4,P.x));
    if(pvJump){ pvJump=false; if(P.ground){ P.vy=-9.5; P.ground=false; SFX.step(); } }
    P.vy+=0.5; if(P.vy>12) P.vy=12;
    P.y+=P.vy; P.ground=false;
    if(P.y+P.h>=GY){ P.y=GY-P.h; P.vy=0; P.ground=true; }
    plats.forEach(pl=>{
      if(P.vy>=0&&P.x+P.w>pl.x&&P.x<pl.x+pl.w&&P.y+P.h>=pl.y&&P.y+P.h<=pl.y+16){ P.y=pl.y-P.h; P.vy=0; P.ground=true; }
    });
    g.fillStyle='#1e1b26'; g.fillRect(0,0,cv.width,cv.height);
    g.fillStyle='#6D4AC8'; g.fillRect(0,GY,cv.width,8);
    g.fillStyle='#3a3550';
    plats.forEach(pl=>{ g.fillRect(pl.x,pl.y,pl.w,10); g.fillStyle='#8affc1'; g.fillRect(pl.x,pl.y,pl.w,3); g.fillStyle='#3a3550'; });
    stars.forEach(s=>{
      if(s.taken) return;
      const bob=Math.sin(Date.now()/300+s.x)*4;
      g.fillStyle='#FFC94D'; g.fillRect(s.x-8,s.y+bob-8,16,16);
      g.fillStyle='#232027'; g.font='bold 11px monospace'; g.fillText('*',s.x-4,s.y+bob+4);
      if(P.x<s.x+10&&P.x+P.w>s.x-10&&P.y<s.y+12&&P.y+P.h>s.y-12){ s.taken=true; SFX.step(); }
    });
    g.fillStyle='#8affc1'; g.fillRect(P.x,P.y,P.w,P.h);
    g.strokeStyle='#000'; g.lineWidth=2; g.strokeRect(P.x,P.y,P.w,P.h);
    const left=stars.filter(s=>!s.taken).length;
    g.fillStyle='#fff'; g.font='bold 14px monospace'; g.fillText('Estrellas: '+(3-left)+'/3',12,22);
    if(left===0&&!won){ won=true; SFX.unlock(); }
    if(won){ g.fillStyle='#14121c'; g.fillRect(120,80,280,80); g.strokeStyle='#FFC94D'; g.lineWidth=3; g.strokeRect(120,80,280,80); g.fillStyle='#FFC94D'; g.font='bold 22px monospace'; g.fillText('¡GANASTE!',196,128); }
    previewRAF=requestAnimationFrame(loop);
  })();
}
function buildMiniWeb(){
  pvBody.innerHTML='<div class="pv-web" id="pvWeb"><h4>Hola, <span id="pvName">explorador</span></h4><p>Esta es tu primera página. Todo esto es HTML + CSS + JS.</p><label>Tu nombre <input id="pvInput" maxlength="18" placeholder="Escribe aquí" /></label> <button id="pvColor">Cambiar color</button></div>';
  const web=$('#pvWeb'), cols=['#efe8ff','#fff3d1','#e6f7ee','#ffe1e1']; let ci=0;
  $('#pvInput').addEventListener('input',e=>{ $('#pvName').textContent=e.target.value.trim()||'explorador'; });
  $('#pvColor').addEventListener('click',()=>{ ci=(ci+1)%cols.length; web.style.background=cols[ci]; SFX.pop(); });
}
function buildMiniApp(){
  pvBody.innerHTML='<div class="pv-app"><div class="pv-row"><input id="pvTask" maxlength="40" placeholder="Nueva tarea" /> <button id="pvAdd">Agregar</button></div><ul id="pvList"></ul></div>';
  const list=$('#pvList');
  function addTask(txt){
    const li=document.createElement('li');
    li.innerHTML='<label><input type="checkbox" /> <span></span></label><button class="pv-x" aria-label="Borrar">×</button>';
    li.querySelector('span').textContent=txt;
    li.querySelector('.pv-x').addEventListener('click',()=>{ li.remove(); SFX.pop(); });
    li.querySelector('input').addEventListener('change',()=>SFX.step());
    list.appendChild(li);
  }
  const seed=['Probar mi primer prompt','Romper algo a propósito'];
  seed.forEach(addTask);
  $('#pvAdd').addEventListener('click',()=>{
    const v=$('#pvTask').value.trim();
    if(!v) return;
    addTask(v); $('#pvTask').value=''; SFX.ok();
  });
  $('#pvTask').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#pvAdd').click(); });
}
/* ---------- FAQ ---------- */
$$('#faq .faq-q').forEach(q=>q.addEventListener('click',()=>{
  const a=q.nextElementSibling, open=q.classList.toggle('open');
  a.style.maxHeight=open?a.scrollHeight+'px':'0';
  SFX.pop();
}));

/* ---------- Recompensa: juguete ---------- */
const btnJug=$('#btnJuguete');
if(btnJug) btnJug.addEventListener('click',()=>{
  $('#jugueteOut').hidden=false;
  btnJug.disabled=true; btnJug.textContent='Recompensa revelada';
  $('#jugueteOut').scrollIntoView({behavior:'smooth',block:'center'});
  SFX.unlock(); toast('¡Recompensa conseguida! Guárdala con orgullo');
  cheerPixel();
});

/* ---------- Dots laterales + Pixel orgulloso ---------- */
const dots=$$('#sideDots a');
const dotIO=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting) dots.forEach(d=>d.classList.toggle('active',d.dataset.sec===en.target.id));
}),{rootMargin:'-40% 0px -55% 0px'});
$$('main .section').forEach(s=>dotIO.observe(s));
dots.forEach(d=>d.addEventListener('click',()=>SFX.pop()));
const _onSectionSeen=onSectionSeen;
onSectionSeen=function(el){
  _onSectionSeen(el);
  const sec=el.closest?el.closest('.section'):null;
  if(sec&&sec.id==='guia') document.body.dataset.stage='end';
};

/* ---------- BIT, el robot que acompaña ---------- */
const BIT_SAY = {
  inicio:['¡Hola! Soy Bit, tu IA de bolsillo. Baja conmigo y te explico todo sin tecnicismos.','curious'],
  'que-pasa':['Mira esto: la IA ya programa al lado de las personas. Pasa el cursor por cada tarjeta.','happy'],
  herramientas:['Cinco ayudantes y cero magia. Toca cada pestaña y compara para qué sirve cada uno.','curious'],
  companero:['Aquí verás a la IA encontrar un error de verdad. Pulsa el botón morado y observa.','happy'],
  desconfiar:['Ojo avizor: en esta zona la IA se equivoca a propósito. Desconfía conmigo.','alert'],
  futuro:['El futuro no da miedo: tú diriges y la IA ejecuta. Toca cada época.','happy'],
  guia:['La recta final: llévate prompts, reglas y tu diploma. Yo marco contigo.','happy'],
};
const BIT_TIPS = [
  'Un buen prompt lleva rol, contexto, tarea y formato.',
  'Si la IA se equivoca, repregunta: también se aprende así.',
  'Pide siempre la explicación, no solo el código.',
  'Empieza en pequeño: un botón que salude vale oro.',
  'Nunca pegues contraseñas ni datos privados.',
  '¿Atascado? Describe lo que ves en pantalla, no lo que crees.',
];
const bitEl=$('#bit'), bitBubble=$('#bitBubble'), bitBot=$('#bitBot'), bitImg=$('#bitImg');
const BIT_IMG={curious:'assets/cast/ia-saluda.png?v=2',happy:'assets/cast/ia-celebra.png?v=2',alert:'assets/cast/ia-explica.png?v=2'};
let bitTip=0;
function bitSay(msg,mood){
  if(!bitBubble) return;
  bitBubble.classList.add('swap');
  setTimeout(()=>{
    bitBubble.innerHTML=msg;
    if(mood&&bitEl){ bitEl.dataset.mood=mood; if(bitImg&&BIT_IMG[mood]) bitImg.src=BIT_IMG[mood]; }
    bitBubble.classList.remove('swap');
  },180);
}
const bitIO=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting&&BIT_SAY[en.target.id]) bitSay(BIT_SAY[en.target.id][0],BIT_SAY[en.target.id][1]);
}),{rootMargin:'-35% 0px -50% 0px'});
$$('main .section').forEach(s=>bitIO.observe(s));
if(bitBot){
  try{
    const saved=JSON.parse(localStorage.getItem('iadev-bit-pos')||'null');
    if(saved&&bitEl){
      bitEl.style.left=Math.max(0,Math.min(window.innerWidth-90,saved.x))+'px';
      bitEl.style.top=Math.max(0,Math.min(window.innerHeight-150,saved.y))+'px';
      bitEl.style.bottom='auto';
    }
  }catch(e){}
  let drag=null;
  bitBot.addEventListener('pointerdown',e=>{
    const r=bitEl.getBoundingClientRect();
    drag={x0:e.clientX,y0:e.clientY,left:r.left,top:r.top,moved:false};
    try{ bitBot.setPointerCapture(e.pointerId); }catch(err){}
  });
  bitBot.addEventListener('pointermove',e=>{
    if(!drag) return;
    const dx=e.clientX-drag.x0, dy=e.clientY-drag.y0;
    if(Math.abs(dx)+Math.abs(dy)>6) drag.moved=true;
    if(drag.moved){
      bitEl.style.left=Math.max(0,Math.min(window.innerWidth-90,drag.left+dx))+'px';
      bitEl.style.top=Math.max(0,Math.min(window.innerHeight-150,drag.top+dy))+'px';
      bitEl.style.bottom='auto';
    }
  });
  const endDrag=e=>{
    if(!drag) return;
    if(drag.moved){
      try{ localStorage.setItem('iadev-bit-pos',JSON.stringify({x:parseFloat(bitEl.style.left),y:parseFloat(bitEl.style.top)})); }catch(err){}
    }else{
      bitSay('<b>IA aconseja:</b> '+BIT_TIPS[bitTip%BIT_TIPS.length],'happy');
      bitTip++; SFX.pop();
      bitBot.style.animation='none'; void bitBot.offsetWidth; bitBot.style.animation='';
    }
    drag=null;
  };
  bitBot.addEventListener('pointerup',endDrag);
  bitBot.addEventListener('pointercancel',()=>{drag=null;});
}

/* ---------- Easter eggs ---------- */
const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let ki = 0;
window.addEventListener('keydown', e=>{
  if(e.key === konami[ki]){ ki++; if(ki===konami.length){ ki=0; SFX.unlock(); toast('KONAMI activado: modo dorado por 10s'); const him=document.querySelector('#deskCard .selfie'); document.body.style.filter='saturate(1.4)'; if(him) him.style.filter='sepia(1) saturate(2.2)'; setTimeout(()=>{document.body.style.filter=''; if(him) him.style.filter='';},10000); } }
  else ki = (e.key===konami[0])?1:0;
});

})();
