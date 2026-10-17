/* PC · Mascota junto al tablero (Método PC1 y Método PC2)
   - Vive pequeña, sentada sobre el borde superior del tablero (fuera de las casillas).
   - Quieta respira suave; un toque: levanta la guitarra un momento.
   - Al resolver un ejercicio festeja como en Aprende Ajedrez: baila, suben notas
     musicales y levanta la guitarra cada tanto. Al cargar otro ejercicio se calma.
   - Doble toque: ventanita flotante con «Quitar por esta vez», «Quitar para siempre» y cerrar.
   - Arriba a la derecha, a la izquierda del regalo, un botón cuadrado con su carita abre la misma
     ventanita: si está, para quitarla; si no está, «Agregar a la escena».
   - En la misma ventanita, una galería con scroll para elegir entre 11 mascotas; al tocar una,
     la actual se va girando y la nueva aparece con destellos (la ventanita sigue abierta).
   «Por esta vez» dura hasta que se vuelve a abrir la app (sessionStorage);
   «para siempre» queda guardado (localStorage) hasta que se agregue de nuevo. */
(function(){
  'use strict';
  if (window.__pcMascota) return;
  window.__pcMascota = true;

  /* Mascotas: 4 poses cada una (tocando · subiendo · casi arriba · guitarra en alto), mismo lienzo 596×640 */
  function serie(id, nombre){
    return { id: id, nombre: nombre, cara: 'mascotas/' + id + '-cara.webp',
      poses: [0, 1, 2, 3].map(function(k){ return 'mascotas/' + id + '-' + k + '.webp'; }) };
  }
  var MASCOTAS = [
    { id: 'pajaro', nombre: 'Pajarito', cara: 'mascota-cara.png',
      poses: ['mascota.png', 'mascota-sube1.png', 'mascota-sube2.png', 'mascota-rock.png'] },
    serie('gato', 'Gatito'), serie('zorro', 'Zorrito'), serie('pinguino', 'Pingüino'),
    serie('conejita', 'Conejita'), serie('panda', 'Panda'), serie('buho', 'Búho'),
    serie('dino', 'Dino'), serie('rana', 'Ranita'), serie('koala', 'Koala'), serie('corgi', 'Corgi')
  ];
  var CLAVE_ELEGIDA = 'mascotaPC_elegida';  // por dispositivo; sin prefijo pc_ para que no se sincronice
  function buscar(id){ for (var i = 0; i < MASCOTAS.length; i++) if (MASCOTAS[i].id === id) return MASCOTAS[i]; return null; }
  function actual(){
    var id = '';
    try { id = localStorage.getItem(CLAVE_ELEGIDA) || ''; } catch (e) {}
    return buscar(id) || MASCOTAS[0];
  }
  /* En Aprende Ajedrez no hay mascota sobre el tablero: la mascota es la del tutor, junto al globo */
  function tutorCara(){ return document.getElementById('aa-tutor-cara'); }
  function tutorCaja(){ var c = tutorCara(); return c && (c.closest ? c.closest('.aa-tutor') : c.parentElement); }
  var MODO_TUTOR = !!tutorCara();
  function tutorOculto(){ var t = tutorCaja(); return !!(t && t.classList.contains('pcm-sin-cara')); }
  function presente(){ return MODO_TUTOR ? !tutorOculto() : !!el; }
  function guardarElegida(id){ try { localStorage.setItem(CLAVE_ELEGIDA, id); } catch (e) {} }
  function precargar(m){ return m.poses.map(function(src){ var i = new Image(); i.src = src; return i; }); }
  var PROPORCION = 949 / 1016;           // ancho / alto de la caja del personaje
  var CUADRO_MS = 85;
  var DOBLE_MS = 320;
  var CLAVE = 'mascotaPC_oculta_v2';     // 'siempre' (local) o 'sesion' (sesión); sin prefijo pc_ para que no se sincronice
  var CLAVE_AVISO = 'pc_mascota_aviso_v2';
  var reducido = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function nota(color, doble){
    return doble
      ? '<svg viewBox="0 0 40 40"><path d="M14 30V9l20-5v21" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 13l20-5" stroke="' + color + '" stroke-width="5"/><ellipse cx="10" cy="30" rx="6" ry="5" fill="' + color + '"/><ellipse cx="30" cy="25" rx="6" ry="5" fill="' + color + '"/></svg>'
      : '<svg viewBox="0 0 40 40"><path d="M22 30V6q8 2 10 9" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round"/><ellipse cx="17" cy="30" rx="7" ry="5.5" fill="' + color + '"/></svg>';
  }
  var COLORES = ['#FF9FB0', '#B9A4F2', '#8CC4EC', '#F5C96A'];
  var NOTAS = '<div class="pcm-notas" aria-hidden="true">' +
    COLORES.map(function(c, i){ return '<i class="n' + (i + 1) + '">' + nota(c, i % 2 === 1) + '</i>'; }).join('') + '</div>';

  var ICONO = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>',
    basura: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 7h14.4M9.6 7V5.2h4.8V7M7 7l.8 12.2h8.4L17 7M10.3 10.5v5.4M13.7 10.5v5.4"/></svg>',
    mas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>'
  };

  var CSS = '' +
  /* ---------- la mascota ---------- */
  '.pc-mascota{position:absolute;z-index:30;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;cursor:pointer;transform-origin:50% 100%}' +
  '.pc-mascota,.pc-mascota *{-webkit-tap-highlight-color:transparent;outline:none}' +
  '.pc-mascota .pcm-sombra{position:absolute;left:18%;right:18%;bottom:-3%;height:8%;border-radius:50%;background:rgba(0,0,0,.2);filter:blur(1.5px);transform-origin:50% 50%}' +
  '.pc-mascota .pcm-baile{position:absolute;inset:0;transform-origin:50% 100%;animation:pcmRespira 3.4s ease-in-out infinite}' +
  '.pc-mascota .pcm-presion{position:absolute;inset:0;transform-origin:50% 100%;transition:transform .5s cubic-bezier(.3,1.9,.5,1)}' +
  '.pc-mascota.presionada .pcm-presion{transform:scale(1.08,.86);transition:transform .1s ease-out}' +
  '.pc-mascota .pcm-salto{position:absolute;inset:0;transform-origin:50% 100%}' +
  '.pc-mascota .pcm-salto.salta{animation:pcmImpulso .5s ease-in-out}' +
  '.pc-mascota .pcm-pose{position:absolute;left:-12.223%;top:-14.567%;width:114.226%;height:114.567%;max-width:none;display:block;pointer-events:none;-webkit-user-drag:none;opacity:0}' +
  '.pc-mascota[data-pose="0"] .pcm-pose.p0,.pc-mascota[data-pose="1"] .pcm-pose.p1,.pc-mascota[data-pose="2"] .pcm-pose.p2,.pc-mascota[data-pose="3"] .pcm-pose.p3{opacity:1}' +
  '.pc-mascota .pcm-notas{position:absolute;inset:-35% -15% 35% -45%;pointer-events:none;display:none}' +
  '.pc-mascota .pcm-notas i{position:absolute;bottom:0;width:30%;max-width:22px;aspect-ratio:1;opacity:0;animation:pcmNota 2.6s ease-out infinite}' +
  '.pc-mascota .pcm-notas i svg{width:100%;height:100%;display:block;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.15))}' +
  '.pc-mascota .pcm-notas .n1{left:0;animation-delay:0s}.pc-mascota .pcm-notas .n2{right:0;animation-delay:-.65s}' +
  '.pc-mascota .pcm-notas .n3{left:22%;animation-delay:-1.3s}.pc-mascota .pcm-notas .n4{left:55%;animation-delay:-1.95s}' +
  '.pc-mascota.festeja .pcm-baile{animation:pcmBaile 1s ease-in-out infinite}' +
  '.pc-mascota.festeja .pcm-sombra{animation:pcmSombra 1s ease-in-out infinite}' +
  '.pc-mascota.festeja .pcm-notas{display:block}' +
  '.pc-mascota.aterriza .pcm-presion{animation:pcmAterriza .55s cubic-bezier(.3,1.5,.5,1)}' +
  /* destellos (al festejar y al volver) */
  '.pcm-chispas{position:absolute;left:50%;top:55%;width:0;height:0;pointer-events:none;z-index:31}' +
  '.pcm-chispas i{position:absolute;left:-3px;top:-3px;width:6px;height:6px;border-radius:50%;opacity:0;animation:pcmChispa .7s cubic-bezier(.2,.8,.3,1) forwards}' +
  /* aviso de la primera vez */
  '.pc-mascota .pcm-globo{position:absolute;right:-4px;top:calc(100% + 12px);transform:translateY(-6px) scale(.9);transform-origin:85% 0;opacity:0;pointer-events:none;white-space:nowrap;padding:7px 12px;border-radius:14px;background:#fff;color:#3a3a40;font:600 12.5px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.16),0 0 0 .5px rgba(0,0,0,.06);transition:opacity .28s ease,transform .32s cubic-bezier(.34,1.56,.64,1)}' +
  '.pc-mascota .pcm-globo:after{content:"";position:absolute;right:22px;bottom:100%;border:6px solid transparent;border-bottom-color:#fff}' +
  '.pc-mascota .pcm-globo.visible{opacity:1;transform:none}' +
  'html[data-modo="oscuro"] .pc-mascota .pcm-globo{background:#2c2c30;color:#f2f2f5;box-shadow:0 6px 18px rgba(0,0,0,.4),0 0 0 .5px rgba(255,255,255,.1)}' +
  'html[data-modo="oscuro"] .pc-mascota .pcm-globo:after{border-bottom-color:#2c2c30}' +

  /* ---------- botón arriba a la derecha (cuando la mascota no está) ---------- */
  '.pcm-boton{position:absolute;z-index:60;width:2.5rem;height:2.5rem;padding:0;margin:0;border:1px solid var(--line,rgba(0,0,0,.1));border-radius:var(--r-ico,12px);background:var(--tinte-oro,#fbf3e2);box-shadow:var(--luz-interna,0 0 0 transparent),var(--s1,0 2px 8px rgba(0,0,0,.08));display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:visible;-webkit-tap-highlight-color:transparent;transition:transform .2s,border-color .2s,background .2s}' +
  '.pcm-boton img{width:1.6rem;height:1.6rem;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none}' +
  '.pcm-boton:active{transform:scale(.92)}' +
  '@media (hover:hover){.pcm-boton:hover{transform:translateY(-1px);border-color:var(--gold,#E2B65F);background:var(--panel2,#fff)}.pcm-boton:hover img{animation:pcmSaluda .6s ease-in-out}}' +
  '.pcm-boton .pcm-onda{position:absolute;inset:-1px;border-radius:inherit;border:2px solid var(--gold,#E2B65F);opacity:0;pointer-events:none}' +
  '.pcm-boton .pcm-onda.va{animation:pcmOnda .8s ease-out}' +
  '.pcm-boton.recibe img{animation:pcmRecibe .5s cubic-bezier(.3,1.6,.5,1)}' +
  '@keyframes pcmRecibe{0%{transform:scale(.7)}45%{transform:scale(1.22) rotate(-6deg)}100%{transform:none}}' +

  /* ---------- ventanita flotante ---------- */
  '.pcm-pop{position:fixed;z-index:9000;width:min(252px,calc(100vw - 24px));padding:8px;border-radius:22px;background:rgba(250,250,252,.86);-webkit-backdrop-filter:blur(26px) saturate(180%);backdrop-filter:blur(26px) saturate(180%);box-shadow:0 22px 60px rgba(0,0,0,.2),0 2px 8px rgba(0,0,0,.06),0 0 0 .5px rgba(0,0,0,.1);color:#1d1d1f;font:500 15px/1.25 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;-webkit-user-select:none;user-select:none;will-change:transform,opacity}' +
  '@supports not ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))){.pcm-pop{background:#fbfbfd}}' +
  '.pcm-pop *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}.pcm-pop button:focus{outline:none}.pcm-pop button:focus-visible{outline:2px solid var(--acento-tema,#53707F);outline-offset:-2px}' +
  '.pcm-pop-cab{display:flex;align-items:center;gap:9px;padding:4px 4px 10px 6px}' +
  '.pcm-pop-cara{width:30px;height:30px;border-radius:50%;background:color-mix(in srgb,var(--acento-tema,#53707F) 14%,transparent);display:flex;align-items:flex-end;justify-content:center;overflow:hidden;flex:0 0 30px}' +
  '.pcm-pop-cara img{width:26px;height:26px;object-fit:contain;margin-bottom:2px}' +
  '.pcm-pop-cab b{flex:1;font-weight:600;font-size:15px;letter-spacing:-.01em}' +
  '.pcm-pop-x{width:28px;height:28px;border-radius:50%;border:0;padding:0;background:rgba(118,118,128,.14);color:#6e6e73;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,transform .15s}' +
  '.pcm-pop-x svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round}' +
  '.pcm-pop-x:active{transform:scale(.88);background:rgba(118,118,128,.24)}' +
  '.pcm-pop-grupo{border-radius:14px;background:rgba(255,255,255,.75);overflow:hidden;box-shadow:0 0 0 .5px rgba(0,0,0,.06)}' +
  '.pcm-pop-op{position:relative;display:flex;align-items:center;gap:11px;width:100%;min-height:46px;padding:0 14px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background .15s}' +
  '.pcm-pop-op+.pcm-pop-op:before{content:"";position:absolute;left:44px;right:0;top:0;height:.5px;background:rgba(60,60,67,.2)}' +
  '.pcm-pop-op svg{width:19px;height:19px;flex:0 0 19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;opacity:.85}' +
  '.pcm-pop-op:active,.pcm-pop-op.elegida{background:rgba(118,118,128,.16)}' +
  '@media (hover:hover){.pcm-pop-op:hover{background:rgba(118,118,128,.1)}.pcm-pop-x:hover{background:rgba(118,118,128,.22)}}' +
  '.pcm-pop-op.peligro{color:#E5352B}' +
  '.pcm-pop-op.principal{justify-content:center;color:#fff;font-weight:600;background:var(--acento-tema,#53707F);border-radius:14px}' +
  '.pcm-pop-op.principal:active,.pcm-pop-op.principal.elegida{background:var(--acento-tema,#53707F);filter:brightness(.92)}' +
  '.pcm-pop-grupo.solo{background:transparent;box-shadow:none}' +
  '.aa-tutor.pcm-sin-cara .aa-tutor-cara{display:none}.aa-tutor.pcm-sin-cara .aa-tutor-globo:before{display:none}' +
  '.aa-barra-fija.pcm-con-boton{padding-right:58px}' +
  '.pcm-pop.con-galeria{width:min(300px,calc(100vw - 24px))}' +
  '.pcm-gal{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:6px 10px 12px;margin:0 -8px 4px;scroll-snap-type:x proximity;scroll-padding:0 10px;-webkit-overflow-scrolling:touch;touch-action:pan-x;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 22px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 22px),transparent 100%)}' +
  '.pcm-gal::-webkit-scrollbar{display:none}' +
  '.pcm-gal-it{position:relative;flex:0 0 54px;width:54px;height:54px;padding:0;border:0;border-radius:50%;background:rgba(118,118,128,.12);cursor:pointer;scroll-snap-align:start;transition:transform .25s cubic-bezier(.3,1.5,.5,1),background .2s}' +
  '.pcm-gal-it img{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);border-radius:50%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}' +
  '.pcm-gal-it:after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2.5px solid var(--acento-tema,#53707F);opacity:0;transform:scale(.85);transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1)}' +
  '.pcm-gal-it.activa:after{opacity:1;transform:scale(1)}' +
  '.pcm-gal-it.activa{background:color-mix(in srgb,var(--acento-tema,#53707F) 16%,transparent)}' +
  '.pcm-gal-it:active{transform:scale(.9)}' +
  '@media (hover:hover){.pcm-gal-it:hover{transform:translateY(-2px) scale(1.04)}}' +
  '.pcm-pop-cab b{transition:opacity .18s}' +
  'html[data-modo="oscuro"] .pcm-gal-it{background:rgba(255,255,255,.1)}' +
  'html[data-modo="oscuro"] .pcm-pop{background:rgba(40,40,44,.82);color:#f5f5f7;box-shadow:0 22px 60px rgba(0,0,0,.55),0 0 0 .5px rgba(255,255,255,.12)}' +
  'html[data-modo="oscuro"] .pcm-pop-grupo{background:rgba(255,255,255,.07);box-shadow:none}' +
  'html[data-modo="oscuro"] .pcm-pop-x{background:rgba(255,255,255,.12);color:#c7c7cc}' +
  'html[data-modo="oscuro"] .pcm-pop-op+.pcm-pop-op:before{background:rgba(255,255,255,.12)}' +
  'html[data-modo="oscuro"] .pcm-pop-op.peligro{color:#FF5A4F}' +

  /* ---------- movimientos ---------- */
  '@keyframes pcmRespira{0%,100%{transform:scale(1,1)}50%{transform:scale(1.018,.986) translateY(.5%)}}' +
  '@keyframes pcmBaile{0%{transform:translateY(0) rotate(0) scale(1,1)}25%{transform:translateY(-5%) rotate(-5deg) scale(.98,1.03)}50%{transform:translateY(0) rotate(0) scale(1.04,.96)}75%{transform:translateY(-5%) rotate(5deg) scale(.98,1.03)}100%{transform:translateY(0) rotate(0) scale(1,1)}}' +
  '@keyframes pcmSombra{0%,50%,100%{transform:scale(1);opacity:1}25%,75%{transform:scale(.82);opacity:.7}}' +
  '@keyframes pcmImpulso{0%{transform:translateY(0) scale(1,1)}22%{transform:translateY(0) scale(1.07,.9)}50%{transform:translateY(-8%) scale(.96,1.06)}78%{transform:translateY(0) scale(1.03,.97)}100%{transform:none}}' +
  '@keyframes pcmAterriza{0%{transform:scale(1.14,.82)}45%{transform:scale(.95,1.07)}75%{transform:scale(1.02,.98)}100%{transform:none}}' +
  '@keyframes pcmNota{0%{opacity:0;transform:translate(0,0) rotate(-10deg) scale(.6)}15%{opacity:1}50%{transform:translate(6px,-60%) rotate(10deg) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-4px,-130%) rotate(-8deg) scale(.9)}}' +
  '@keyframes pcmChispa{0%{opacity:0;transform:translate(0,0) scale(.3)}20%{opacity:1}100%{opacity:0;transform:translate(var(--cx),var(--cy)) scale(1)}}' +
  '@keyframes pcmOnda{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.55)}}' +
  '@keyframes pcmSaluda{0%,100%{transform:translateY(1px) rotate(0)}30%{transform:translateY(-1px) rotate(-8deg)}65%{transform:translateY(0) rotate(6deg)}}' +
  '@media (prefers-reduced-motion:reduce){.pc-mascota .pcm-baile{animation:none}.pc-mascota.festeja .pcm-baile{animation-duration:2s}.pcm-chispas{display:none}}';

  var estilo = document.createElement('style');
  estilo.id = 'pc-mascota-css';
  estilo.textContent = CSS;
  (document.head || document.documentElement).appendChild(estilo);
  precargar(actual());
  MASCOTAS.forEach(function(m){ var i = new Image(); i.src = m.cara; });

  /* ---------- estado guardado ---------- */
  function leer(){
    try { if (localStorage.getItem(CLAVE) === 'siempre') return 'siempre'; } catch (e) {}
    try { if (sessionStorage.getItem(CLAVE) === 'sesion') return 'sesion'; } catch (e) {}
    return '';
  }
  function guardar(v){
    try { if (v === 'siempre') localStorage.setItem(CLAVE, 'siempre'); else localStorage.removeItem(CLAVE); } catch (e) {}
    try { if (v === 'sesion') sessionStorage.setItem(CLAVE, 'sesion'); else sessionStorage.removeItem(CLAVE); } catch (e) {}
  }

  function animar(nodo, cuadros, opc){
    if (nodo && nodo.animate && !reducido) {
      try { return nodo.animate(cuadros, opc); } catch (e) {}
    }
    return null;
  }
  function alTerminar(a, fn, ms){
    var hecho = false;
    function f(){ if (!hecho) { hecho = true; fn(); } }
    if (a) { a.onfinish = f; a.oncancel = f; }
    setTimeout(f, a ? (ms || 1200) + 200 : 0);
  }

  /* ---------- ubicación: sentada sobre el borde superior del tablero ---------- */
  var el = null, boton = null, pop = null;

  function partes(){
    var b = document.getElementById('board');
    if (!b) return null;
    var marco = b.closest ? (b.closest('.frame') || b.parentElement) : b.parentElement;
    var col = marco && marco.parentElement;
    if (!col) return null;
    var rm = marco.getBoundingClientRect();
    if (!rm.width) return null;
    return { marco: marco, col: col, rm: rm, cab: col.querySelector('.boardhead') };
  }
  function visible(n){ if (!n) return null; var r = n.getBoundingClientRect(); return (r.width && r.height) ? r : null; }

  function colocar(){
    if (!el) return;
    var p = partes();
    if (!p) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = '';
    if (getComputedStyle(p.col).position === 'static') p.col.style.position = 'relative';
    if (el.parentElement !== p.col) p.col.appendChild(el);
    var rc = p.col.getBoundingClientRect(), rm = p.rm;
    var alto = Math.round(Math.max(56, Math.min(78, rm.width * 0.15)));
    var ancho = Math.round(alto * PROPORCION);
    var centro = p.cab && visible(p.cab.querySelector('.boardhead-center'));
    var derecha = p.cab && visible(p.cab.querySelector('.boardhead-right'));
    var borde = derecha ? Math.min(derecha.left - 14, rm.right - 10) : rm.right - 12;
    var minimo = centro ? centro.right + 10 : rm.left + 8;
    var x = Math.max(minimo, borde - ancho);
    el.style.width = ancho + 'px';
    el.style.height = alto + 'px';
    el.style.left = Math.round(x - rc.left) + 'px';
    el.style.top = Math.round(rm.top - rc.top - alto + alto * 0.05) + 'px';
  }

  /* ---------- crear / quitar la mascota ---------- */
  var festejo = { activo: false, t: [] };
  var gesto = null;

  function crear(){
    if (el) return el;
    el = document.createElement('div');
    el.className = 'pc-mascota';
    el.id = 'pc-mascota';
    el.setAttribute('data-pose', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Mascota. Doble toque para ver opciones.');
    el.innerHTML = '<div class="pcm-sombra"></div>' + NOTAS +
      '<div class="pcm-baile"><div class="pcm-presion"><div class="pcm-salto">' +
      actual().poses.map(function(src, i){ return '<img class="pcm-pose p' + i + '" src="' + src + '" alt="" draggable="false">'; }).join('') +
      '</div></div></div>';
    activarGestos(el);
    colocar();
    return el;
  }
  function destruir(){
    calmar();
    if (gesto) gesto.limpiar();
    if (el && el.parentElement) el.parentElement.removeChild(el);
    el = null;
  }

  function posar(p){ if (el) el.setAttribute('data-pose', String(p)); }
  function impulso(){
    var s = el && el.querySelector('.pcm-salto');
    if (!s) return;
    s.classList.remove('salta'); void s.offsetWidth; s.classList.add('salta');
  }
  function chispas(cuantas, radio){
    if (!el || reducido) return;
    var c = document.createElement('div');
    c.className = 'pcm-chispas';
    for (var i = 0; i < cuantas; i++) {
      var a = (Math.PI * 2 * i / cuantas) - Math.PI / 2 + (Math.random() - .5) * .4;
      var r = radio * (0.8 + Math.random() * 0.4);
      var s = document.createElement('i');
      s.style.background = COLORES[i % COLORES.length];
      s.style.setProperty('--cx', Math.round(Math.cos(a) * r) + 'px');
      s.style.setProperty('--cy', Math.round(Math.sin(a) * r) + 'px');
      s.style.animationDelay = (i * 12) + 'ms';
      c.appendChild(s);
    }
    el.appendChild(c);
    setTimeout(function(){ if (c.parentElement) c.parentElement.removeChild(c); }, 1000);
  }

  /* Festejo como en Aprende Ajedrez: baila, notas y guitarra en alto cada tanto */
  function festejar(){
    if (!el) return;
    calmar();
    festejo.activo = true;
    el.classList.add('festeja');
    chispas(8, (el.offsetHeight || 60) * 0.85);
    (function ciclo(){
      if (!festejo.activo) return;
      var t = 0;
      festejo.t.push(setTimeout(impulso, 0));
      [1, 2, 3].forEach(function(p){ festejo.t.push(setTimeout(function(){ posar(p); }, t += CUADRO_MS)); });
      t += 1000;
      festejo.t.push(setTimeout(impulso, t));
      [2, 1, 0].forEach(function(p){ festejo.t.push(setTimeout(function(){ posar(p); }, t += CUADRO_MS)); });
      festejo.t.push(setTimeout(ciclo, t + 1600));
    })();
    avisoPrimeraVez();
  }
  function calmar(){
    festejo.activo = false;
    festejo.t.forEach(clearTimeout); festejo.t = [];
    if (el) el.classList.remove('festeja');
    posar(0);
  }

  function avisoPrimeraVez(){
    var visto = true;
    try { visto = localStorage.getItem(CLAVE_AVISO) === '1'; } catch (e) {}
    if (visto || !el) return;
    try { localStorage.setItem(CLAVE_AVISO, '1'); } catch (e) {}
    var g = document.createElement('div');
    g.className = 'pcm-globo';
    g.textContent = 'Doble toque para opciones';
    var nodo = el;
    nodo.appendChild(g);
    setTimeout(function(){ g.classList.add('visible'); }, 500);
    setTimeout(function(){ g.classList.remove('visible'); }, 3000);
    setTimeout(function(){ if (g.parentElement) g.parentElement.removeChild(g); }, 3400);
  }

  /* Un toque: levanta la guitarra un momento. Doble toque: ventanita. */
  function activarGestos(nodo){
    var ultimo = 0, tUno = null, tLev = [];
    function levantar(){
      if (festejo.activo) { impulso(); return; }
      tLev.forEach(clearTimeout); tLev = [];
      var t = 0;
      impulso();
      [1, 2, 3].forEach(function(p){ tLev.push(setTimeout(function(){ posar(p); }, t += CUADRO_MS)); });
      t += 900;
      tLev.push(setTimeout(impulso, t));
      [2, 1, 0].forEach(function(p){ tLev.push(setTimeout(function(){ posar(p); }, t += CUADRO_MS)); });
    }
    function abajo(e){
      e.preventDefault(); e.stopPropagation();
      nodo.classList.add('presionada');
    }
    function arriba(e){
      e.preventDefault(); e.stopPropagation();
      nodo.classList.remove('presionada');
      var ahora = Date.now();
      if (ahora - ultimo < DOBLE_MS) {
        ultimo = 0; clearTimeout(tUno);
        abrirMenuQuitar();
        return;
      }
      ultimo = ahora;
      clearTimeout(tUno);
      tUno = setTimeout(levantar, DOBLE_MS - 40);
    }
    nodo.addEventListener('pointerdown', abajo);
    nodo.addEventListener('pointerup', arriba);
    nodo.addEventListener('pointercancel', function(){ nodo.classList.remove('presionada'); });
    nodo.addEventListener('pointerleave', function(){ nodo.classList.remove('presionada'); });
    nodo.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirMenuQuitar(); }
    });
    ['mousedown','touchstart','click','dblclick','contextmenu'].forEach(function(t){
      nodo.addEventListener(t, function(e){ e.stopPropagation(); if (t !== 'mousedown' && t !== 'touchstart') e.preventDefault(); }, { passive: false });
    });
    gesto = { limpiar: function(){ clearTimeout(tUno); tLev.forEach(clearTimeout); } };
  }

  /* ---------- botón arriba a la derecha ---------- */
  function regalo(){ return document.getElementById('b-gift'); }
  function colocarBoton(){
    if (!boton) return;
    var barra = MODO_TUTOR && document.getElementById('aa-barra-fija');
    if (barra && barra.getBoundingClientRect().width) {
      if (getComputedStyle(barra).position === 'static') barra.style.position = 'relative';
      if (boton.parentElement !== barra) barra.appendChild(boton);
      barra.classList.add('pcm-con-boton');
      var tabs = barra.querySelector('.tabs'), rt = tabs && tabs.getBoundingClientRect(), rr = barra.getBoundingClientRect();
      var lado = rt && rt.height ? Math.max(34, Math.min(40, rt.height)) : 40;
      boton.style.position = 'absolute';
      boton.style.width = lado + 'px'; boton.style.height = lado + 'px';
      boton.style.left = ''; boton.style.right = '12px';
      boton.style.top = Math.round((rt && rt.height ? rt.top - rr.top + (rt.height - lado) / 2 : (rr.height - lado) / 2)) + 'px';
      return;
    }
    var g = visible(regalo());
    var bar = document.querySelector('.topbar');
    if (g && bar) {
      if (getComputedStyle(bar).position === 'static') bar.style.position = 'relative';
      if (boton.parentElement !== bar) bar.appendChild(boton);
      var rb = bar.getBoundingClientRect();
      boton.style.position = 'absolute';
      var gap = Math.max(8, Math.round(g.width * .25));
      boton.style.width = g.width + 'px';
      boton.style.height = g.height + 'px';
      boton.style.left = Math.round(g.left - rb.left - g.width - gap) + 'px';
      boton.style.top = Math.round(g.top - rb.top) + 'px';
      boton.style.right = '';
    } else {
      if (boton.parentElement !== document.body) document.body.appendChild(boton);
      boton.style.position = 'fixed';
      boton.style.left = '';
      boton.style.right = '12px';
      boton.style.top = '10px';
    }
  }
  function crearBoton(){
    if (boton) return boton;
    boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'pcm-boton';
    boton.setAttribute('aria-label', 'Mascota');
    boton.setAttribute('aria-haspopup', 'dialog');
    boton.innerHTML = '<img src="' + actual().cara + '" alt="" draggable="false"><span class="pcm-onda"></span>';
    boton.addEventListener('click', function(e){ e.stopPropagation(); abrirMenuBoton(); });
    colocarBoton();
    return boton;
  }
  function onda(){
    if (!boton) return;
    var o = boton.querySelector('.pcm-onda');
    o.classList.remove('va'); void o.offsetWidth; o.classList.add('va');
    boton.classList.remove('recibe'); void boton.offsetWidth; boton.classList.add('recibe');
  }
  function quitarBoton(conAnimacion, listo){
    var b = boton; boton = null;
    if (!b) { if (listo) listo(); return; }
    var a = conAnimacion ? animar(b, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.12)', opacity: 1, offset: .35 },
      { transform: 'scale(0)', opacity: 0 }
    ], { duration: 300, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }) : null;
    alTerminar(a, function(){ if (b.parentElement) b.parentElement.removeChild(b); if (listo) listo(); }, 300);
  }

  /* ---------- ventanita flotante ---------- */
  function cerrarPop(elegida, listo){
    var p = pop; pop = null;
    if (!p) { if (listo) listo(); return; }
    document.removeEventListener('pointerdown', p._fuera, true);
    document.removeEventListener('keydown', p._tecla, true);
    window.removeEventListener('resize', p._cerrar);
    var a;
    if (elegida) {
      /* se cierra llevándose la opción elegida: el resto se desvanece y todo se recoge hacia ella */
      elegida.classList.add('elegida');
      var rp = p.getBoundingClientRect(), re = elegida.getBoundingClientRect();
      p.style.transformOrigin = (re.left + re.width / 2 - rp.left) + 'px ' + (re.top + re.height / 2 - rp.top) + 'px';
      Array.prototype.forEach.call(p.querySelectorAll('.pcm-pop-cab,.pcm-gal,.pcm-pop-op'), function(n){
        if (n !== elegida) animar(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
      });
      a = animar(p, [
        { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' },
        { transform: 'scale(.97)', opacity: 1, filter: 'blur(0)', offset: .35 },
        { transform: 'scale(.55)', opacity: 0, filter: 'blur(5px)' }
      ], { duration: 380, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    } else {
      a = animar(p, [
        { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' },
        { transform: 'scale(.88)', opacity: 0, filter: 'blur(4px)' }
      ], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    }
    alTerminar(a, function(){ if (p.parentElement) p.parentElement.removeChild(p); if (listo) listo(); }, 380);
  }

  function abrirPop(ancla, opciones, alElegir){
    if (pop) { cerrarPop(); return; }
    var ra = ancla.getBoundingClientRect();
    var p = document.createElement('div');
    p.className = 'pcm-pop con-galeria';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Mascota');
    var solo = opciones.length === 1 && opciones[0].principal;
    p.innerHTML =
      '<div class="pcm-pop-cab"><span class="pcm-pop-cara"><img src="' + actual().cara + '" alt=""></span><b>' + actual().nombre + '</b>' +
      '<button type="button" class="pcm-pop-x" aria-label="Cerrar">' + ICONO.x + '</button></div>' +
      '<div class="pcm-gal" role="listbox" aria-label="Elegir mascota">' +
      MASCOTAS.map(function(m){
        var on = m.id === actual().id;
        return '<button type="button" class="pcm-gal-it' + (on ? ' activa' : '') + '" role="option" aria-selected="' + on + '" aria-label="' + m.nombre + '" data-id="' + m.id + '"><img src="' + m.cara + '" alt="" draggable="false"></button>';
      }).join('') + '</div>' +
      '<div class="pcm-pop-grupo' + (solo ? ' solo' : '') + '">' +
      opciones.map(function(o){
        return '<button type="button" class="pcm-pop-op' + (o.peligro ? ' peligro' : '') + (o.principal ? ' principal' : '') + '" data-acc="' + o.acc + '">' +
          ICONO[o.icono] + '<span>' + o.texto + '</span></button>';
      }).join('') + '</div>';
    document.body.appendChild(p);
    pop = p;
    p._ancla = ancla;

    /* posición: debajo del ancla, alineada a su derecha; si no cabe, encima */
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = p.offsetWidth, h = p.offsetHeight;
    var left = Math.min(vw - w - 12, Math.max(12, ra.right + 10 - w));
    var top = ra.bottom + 10, abajo = true;
    if (top + h > vh - 12) { top = Math.max(12, ra.top - 10 - h); abajo = false; }
    p.style.left = Math.round(left) + 'px';
    p.style.top = Math.round(top) + 'px';
    var ox = Math.max(16, Math.min(w - 16, ra.left + ra.width / 2 - left));
    p.style.transformOrigin = ox + 'px ' + (abajo ? '0px' : h + 'px');

    animar(p, [
      { transform: 'scale(.35) translateY(' + (abajo ? -8 : 8) + 'px)', opacity: 0, filter: 'blur(8px)' },
      { transform: 'scale(1.025)', opacity: 1, filter: 'blur(0)', offset: .62 },
      { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' }
    ], { duration: 460, easing: 'cubic-bezier(.2,.9,.3,1)' });
    Array.prototype.forEach.call(p.querySelectorAll('.pcm-gal-it'), function(n, i){
      animar(n, [{ opacity: 0, transform: 'translateX(18px) scale(.6)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, delay: 120 + Math.min(i, 6) * 40, easing: 'cubic-bezier(.25,1.4,.5,1)', fill: 'backwards' });
    });
    var gal = p.querySelector('.pcm-gal'), act = gal.querySelector('.activa');
    if (act) gal.scrollLeft = Math.max(0, act.offsetLeft - gal.clientWidth / 2 + act.offsetWidth / 2);
    /* en la Mac, la rueda del mouse también desplaza la galería de lado */
    gal.addEventListener('wheel', function(e){
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { gal.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    Array.prototype.forEach.call(p.querySelectorAll('.pcm-gal-it'), function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); elegirMascota(b.getAttribute('data-id'), p); });
    });
    Array.prototype.forEach.call(p.querySelectorAll('.pcm-pop-cab,.pcm-pop-op'), function(n, i){
      animar(n, [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }],
        { duration: 300, delay: 90 + i * 55, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
    });

    p.querySelector('.pcm-pop-x').addEventListener('click', function(e){ e.stopPropagation(); cerrarPop(); });
    Array.prototype.forEach.call(p.querySelectorAll('.pcm-pop-op'), function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        if (p._listo) return; p._listo = true;
        var acc = b.getAttribute('data-acc');
        cerrarPop(b);
        setTimeout(function(){ alElegir(acc); }, reducido ? 0 : 200);
      });
    });
    p._fuera = function(e){ if (pop === p && !p.contains(e.target) && !ancla.contains(e.target)) cerrarPop(); };
    p._tecla = function(e){ if (e.key === 'Escape') cerrarPop(); };
    p._cerrar = function(){ cerrarPop(); };
    setTimeout(function(){
      if (pop !== p) return;
      document.addEventListener('pointerdown', p._fuera, true);
      document.addEventListener('keydown', p._tecla, true);
      window.addEventListener('resize', p._cerrar);
    }, 0);
  }

  /* ---------- elegir otra mascota ---------- */
  function refrescarCaras(p){
    var m = actual();
    if (boton) { var bi = boton.querySelector('img'); if (bi) bi.src = m.cara; }
    p = p || pop;
    if (!p) return;
    var ci = p.querySelector('.pcm-pop-cara img'), t = p.querySelector('.pcm-pop-cab b');
    if (ci) { ci.src = m.cara; animar(ci, [{ transform: 'scale(.5) rotate(-20deg)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' }); }
    if (t) t.textContent = m.nombre;
    Array.prototype.forEach.call(p.querySelectorAll('.pcm-gal-it'), function(b){
      var on = b.getAttribute('data-id') === m.id;
      b.classList.toggle('activa', on); b.setAttribute('aria-selected', String(on));
    });
  }
  function elegirMascota(id, p){
    var m = buscar(id);
    if (!m) return;
    if (MODO_TUTOR) {
      if (m.id !== actual().id) { guardarElegida(m.id); refrescarCaras(p); if (boton) onda(); }
      precargar(m);
      if (tutorOculto()) { guardar(''); mostrarTutor(true); }
      else try { window.dispatchEvent(new CustomEvent('pcmascota-cambio', { detail: { id: m.id } })); } catch (e) {}
      return;
    }
    if (m.id === actual().id && el) { if (el) { impulso(); chispas(6, (el.offsetHeight || 60) * .7); } return; }
    guardarElegida(m.id);
    refrescarCaras(p);
    if (boton) onda();
    var imgs = precargar(m), listo = false;
    function cuando(fn){
      var n = 0, hecho = false;
      function uno(){ if (++n >= imgs.length && !hecho) { hecho = true; fn(); } }
      imgs.forEach(function(i){ if (i.complete) uno(); else { i.onload = uno; i.onerror = uno; } });
      setTimeout(function(){ if (!hecho) { hecho = true; fn(); } }, 1500);
    }
    if (!el) {
      /* estaba quitada: elegir una la trae de vuelta */
      guardar('');
      cuando(function(){ volverVolando(); });
      return;
    }
    cambiarPoses(m, cuando);
  }
  function cambiarPoses(m, cuando){
    var nodo = el;
    if (!nodo) return;
    var estabaFestejando = festejo.activo;
    calmar();
    var sale = animar(nodo, [
      { transform: 'scale(1) rotate(0)', opacity: 1, filter: 'blur(0)' },
      { transform: 'scale(1.08,.9) rotate(0)', opacity: 1, filter: 'blur(0)', offset: .3 },
      { transform: 'scale(.15) rotate(-25deg)', opacity: 0, filter: 'blur(4px)' }
    ], { duration: 260, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    var listos = 0;
    function intercambiar(){
      if (++listos < 2 || el !== nodo) return;
      Array.prototype.forEach.call(nodo.querySelectorAll('.pcm-pose'), function(img, i){ img.src = m.poses[i]; });
      posar(0);
      var entra = animar(nodo, [
        { transform: 'scale(.15) rotate(25deg)', opacity: 0, filter: 'blur(4px)' },
        { transform: 'scale(1.14) rotate(-4deg)', opacity: 1, filter: 'blur(0)', offset: .55 },
        { transform: 'scale(.95) rotate(1deg)', opacity: 1, filter: 'blur(0)', offset: .8 },
        { transform: 'scale(1) rotate(0)', opacity: 1, filter: 'blur(0)' }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
      if (sale) try { sale.cancel(); } catch (e) {}
      chispas(9, (nodo.offsetHeight || 60) * .85);
      alTerminar(entra, function(){ if (estabaFestejando && el === nodo) festejar(); else impulso(); }, 520);
    }
    alTerminar(sale, intercambiar, 260);
    cuando(intercambiar);
  }

  function abrirMenuQuitar(ancla){
    if (!presente()) return;
    abrirPop(ancla || el, [
      { acc: 'sesion', icono: 'reloj', texto: 'Quitar por esta vez' },
      { acc: 'siempre', icono: 'basura', texto: 'Quitar para siempre', peligro: true }
    ], function(acc){ guardar(acc); if (MODO_TUTOR) ocultarTutor(true); else irseVolando(); });
  }
  function abrirMenuBoton(){
    if (!boton) return;
    if (presente()) { abrirMenuQuitar(boton); return; }
    abrirPop(boton, [
      { acc: 'agregar', icono: 'mas', texto: 'Agregar a la escena', principal: true }
    ], function(){ guardar(''); if (MODO_TUTOR) mostrarTutor(true); else volverVolando(); });
  }

  /* ---------- tutor de Aprende Ajedrez: se va al botón y vuelve de él ---------- */
  var tutorVolando = false;
  function ocultarTutor(animado){
    var c = tutorCara(), t = tutorCaja();
    if (!c || !t || tutorOculto()) return;
    tutorVolando = true;
    crearBoton();
    var rc = c.getBoundingClientRect(), rb = boton.getBoundingClientRect();
    var dx = rb.left + rb.width / 2 - (rc.left + rc.width / 2), dy = rb.top + rb.height / 2 - (rc.top + rc.height / 2);
    var fin = Math.max(.3, 30 / (rc.height || 60));
    var a = animado ? animar(c, [
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: 'translate(0,3px) scale(1.1,.86)', opacity: 1, offset: .14 },
      { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - 50) + 'px) scale(.85) rotate(-10deg)', opacity: 1, offset: .55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + fin + ') rotate(0)', opacity: 0 }
    ], { duration: 700, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' }) : null;
    if (animado) setTimeout(onda, a ? 620 : 0);
    alTerminar(a, function(){ t.classList.add('pcm-sin-cara'); tutorVolando = false; if (a) try { a.cancel(); } catch (e) {} }, 700);
  }
  function mostrarTutor(animado){
    var c = tutorCara(), t = tutorCaja();
    if (!c || !t) return;
    var rb = boton && boton.getBoundingClientRect();
    t.classList.remove('pcm-sin-cara');
    try { window.dispatchEvent(new CustomEvent('pcmascota-cambio', { detail: { sinAnimar: true } })); } catch (e) {}
    if (!animado || !rb) return;
    if (boton) animar(boton, [{ transform: 'scale(1)' }, { transform: 'scale(.86)', offset: .4 }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    var rc = c.getBoundingClientRect();
    var dx = rb.left + rb.width / 2 - (rc.left + rc.width / 2), dy = rb.top + rb.height / 2 - (rc.top + rc.height / 2);
    var ini = Math.max(.3, 30 / (rc.height || 60));
    animar(c, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + ini + ')', opacity: 0, offset: 0 },
      { transform: 'translate(' + (dx * .9) + 'px,' + (dy * .9 - 10) + 'px) scale(' + (ini * 1.2) + ') rotate(-6deg)', opacity: 1, offset: .14 },
      { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - 50) + 'px) scale(.85) rotate(8deg)', opacity: 1, offset: .55 },
      { transform: 'translate(0,0) scale(1.08,.92) rotate(0)', opacity: 1, offset: .85 },
      { transform: 'none', opacity: 1, offset: 1 }
    ], { duration: 720, easing: 'cubic-bezier(.4,0,.3,1)', delay: 100, fill: 'backwards' });
  }
  function activarDobleToqueTutor(){
    var c = tutorCara();
    if (!c || c._pcm) return;
    c._pcm = true;
    c.style.cursor = 'pointer';
    var ultimo = 0;
    c.addEventListener('pointerup', function(e){
      var ahora = Date.now();
      if (ahora - ultimo < DOBLE_MS) { ultimo = 0; e.preventDefault(); abrirMenuQuitar(c); return; }
      ultimo = ahora;
    });
    c.addEventListener('dblclick', function(e){ e.preventDefault(); });
  }

  /* ---------- vuelos entre el tablero y el botón ---------- */
  function centro(r){ return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function irseVolando(){
    if (!el) return;
    calmar();
    crearBoton();
    var m = el, rm = m.getBoundingClientRect(), rb = boton.getBoundingClientRect();
    var a0 = centro(rm), a1 = centro(rb);
    var dx = a1.x - a0.x, dy = a1.y - a0.y;
    var fin = Math.max(.3, 34 / rm.height);
    var alza = Math.min(90, 30 + Math.abs(dx) * .12);
    m.style.transformOrigin = '50% 50%';
    m.style.pointerEvents = 'none';
    el = null;
    var a = animar(m, [
      { transform: 'translate(0,0) scale(1,1) rotate(0)', opacity: 1, offset: 0 },
      { transform: 'translate(0,4px) scale(1.1,.86) rotate(0)', opacity: 1, offset: .14 },
      { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - alza) + 'px) scale(.8) rotate(-10deg)', opacity: 1, offset: .55 },
      { transform: 'translate(' + (dx * .92) + 'px,' + (dy * .92) + 'px) scale(' + (fin * 1.15) + ') rotate(4deg)', opacity: .9, offset: .88 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + fin + ') rotate(0)', opacity: 0, offset: 1 }
    ], { duration: 720, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    setTimeout(onda, a ? 640 : 0);
    alTerminar(a, function(){
      if (gesto) gesto.limpiar();
      if (m.parentElement) m.parentElement.removeChild(m);
    }, 720);
  }

  function volverVolando(){
    var rb = boton ? boton.getBoundingClientRect() : null;
    if (boton) animar(boton, [{ transform: 'scale(1)' }, { transform: 'scale(.86)', offset: .4 }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    crear();
    var m = el;
    if (!rb || !m.getBoundingClientRect().width) { m.classList.add('aterriza'); return; }
    var rm = m.getBoundingClientRect();
    var a0 = centro(rb), a1 = centro(rm);
    var dx = a0.x - a1.x, dy = a0.y - a1.y;
    var ini = Math.max(.3, 34 / rm.height);
    var alza = Math.min(90, 30 + Math.abs(dx) * .12);
    m.style.transformOrigin = '50% 50%';
    var a = animar(m, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + ini + ') rotate(0)', opacity: 0, offset: 0 },
      { transform: 'translate(' + (dx * .9) + 'px,' + (dy * .9 - 10) + 'px) scale(' + (ini * 1.2) + ') rotate(-6deg)', opacity: 1, offset: .14 },
      { transform: 'translate(' + (dx * .45) + 'px,' + (dy * .45 - alza) + 'px) scale(.85) rotate(8deg)', opacity: 1, offset: .55 },
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1, offset: 1 }
    ], { duration: 680, easing: 'cubic-bezier(.4,0,.3,1)', delay: 120, fill: 'backwards' });
    alTerminar(a, function(){
      if (el !== m) return;
      m.style.transformOrigin = '';
      m.classList.remove('aterriza'); void m.offsetWidth; m.classList.add('aterriza');
      chispas(7, rm.height * .75);
      setTimeout(function(){ m.classList.remove('aterriza'); }, 600);
    }, 800);
  }

  /* ---------- estado inicial y cambios desde la otra sección ---------- */
  function aplicarEstado(animado){
    var oculto = !!leer();
    if (MODO_TUTOR) {
      activarDobleToqueTutor();
      crearBoton();
      if (oculto && !tutorOculto()) { if (pop && pop._ancla === tutorCara()) cerrarPop(); if (animado) ocultarTutor(true); else { var t = tutorCaja(); if (t) t.classList.add('pcm-sin-cara'); } }
      else if (!oculto && tutorOculto()) mostrarTutor(animado);
      return;
    }
    if (oculto) {
      if (pop && el && pop._ancla === el) cerrarPop();
      if (el) {
        var m = el; el = null; calmar();
        var a = animado ? animar(m, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], { duration: 220, fill: 'forwards' }) : null;
        alTerminar(a, function(){ if (m.parentElement) m.parentElement.removeChild(m); }, 220);
      }
    } else {
      if (!el) { crear(); if (animado) { el.classList.add('aterriza'); } }
    }
    crearBoton();
  }
  window.addEventListener('storage', function(e){
    if (e.key === null || e.key === CLAVE) aplicarEstado(true);
    if (e.key === CLAVE_ELEGIDA && el) {
      var m = actual(), img = el.querySelector('.pcm-pose.p0');
      if (img && img.getAttribute('src') !== m.poses[0]) { refrescarCaras(); cambiarPoses(m, function(fn){ fn(); }); }
    }
    if (e.key === CLAVE_ELEGIDA) refrescarCaras();
  });

  function recolocar(){ colocar(); colocarBoton(); }
  window.addEventListener('resize', recolocar);
  window.addEventListener('orientationchange', function(){ setTimeout(recolocar, 250); });
  try { new MutationObserver(function(){ requestAnimationFrame(recolocar); })
    .observe(document.documentElement, { attributes: true }); } catch (e) {}
  setInterval(function(){
    if (document.hidden) return;
    /* por si la otra sección cambió el estado sin avisar */
    if (!pop && !tutorVolando && (!!leer() === presente() || !boton)) aplicarEstado(false);
    recolocar();
  }, 1200);

  /* Enganche con la app: onSolved() festeja, load() (cambio de ejercicio) calma */
  function enganchar(){
    if (typeof window.onSolved !== 'function' || typeof window.load !== 'function') return false;
    var solvedOriginal = window.onSolved, loadOriginal = window.load;
    window.onSolved = function(){
      var r = solvedOriginal.apply(this, arguments);
      try { festejar(); } catch (e) {}
      return r;
    };
    window.load = function(){
      try { calmar(); } catch (e) {}
      var r = loadOriginal.apply(this, arguments);
      setTimeout(recolocar, 60);
      return r;
    };
    return true;
  }
  function iniciar(){
    enganchar();
    aplicarEstado(false);
    setTimeout(recolocar, 300);
    setTimeout(recolocar, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();

  /* API: mostrar() festeja (lo usa el tutorial), quitar() la calma (al cambiar de sección) */
  window.pcMascota = {
    mostrar: function(){ if (el) festejar(); },
    quitar: calmar,
    festejar: festejar,
    calmar: calmar
  };
})();
