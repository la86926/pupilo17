/* ==================================================================
   Pupilo 17 · capa de lecciones sobre el entrenador del Método PC1
   - Cada «ejercicio» es una línea: la principal o una variante del maestro,
     siempre desde la posición inicial.
   - ◂ ▸ recorren la línea jugada a jugada (también ← →); ↑ ↓ cambian de línea.
   - Moviendo en el tablero también se avanza si la jugada es la de la línea.
   - Bajo el tablero, el comentario del maestro de la jugada actual, tal cual;
     sobre el tablero, sus flechas y casillas.
   Se carga después del código del Método PC1 y reemplaza solo lo necesario.
   ================================================================== */
(function(){
  'use strict';
  var CAPS = window.P17_CAPS || [];
  var TODAS = PUZZLES;
  var COLORES = { G: '#2E9E5B', R: '#D2504B', B: '#3F72D6', Y: '#E0B12A' };

  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function leerJSON(k, def){ try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } }
  function guardar(k, v){ try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} }
  function capDe(lv){ for (var i = 0; i < CAPS.length; i++) if (String(CAPS[i].n) === String(lv)) return CAPS[i]; return CAPS[0]; }
  function lineaPorNumero(n){ for (var i = 0; i < TODAS.length; i++) if (TODAS[i].n === n) return TODAS[i]; return null; }
  function fecha(f){
    var m = /^(\d{4})\.(\d{2}|\?\?)\.(\d{2}|\?\?)$/.exec(String(f || ''));
    if (!m) return '';
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    if (m[2] === '??') return m[1];
    var mes = meses[Number(m[2]) - 1];
    return m[3] === '??' ? mes + ' de ' + m[1] : Number(m[3]) + ' de ' + mes + ' de ' + m[1];
  }
  function resultado(r){ return r === '1-0' ? 'Ganan blancas' : r === '0-1' ? 'Ganan negras' : r === '1/2-1/2' ? 'Tablas' : ''; }
  /* jugada en español con figura: «7...» + ♞b6! */
  function jugadaHTML(pl){ return '<span class="jg">' + esc(pl.m) + figurina(esc(pl.en)) + '</span>'; }

  /* ---------- ¿en qué jugada de la línea estamos? ---------- */
  function mismoMovimiento(m, u){ return m && (m.from + m.to) === u.slice(0, 4); }
  function enLinea(){
    var p = curr();
    if (state.freemode && state.anaMoves){
      var ptr = state.anaPtr;
      for (var k = 0; k < ptr; k++) if (!mismoMovimiento(state.anaMoves[k], p.u[k] || '')) return { fuera: true, k: ptr - 1 };
      return { fuera: false, k: ptr - 1 };
    }
    return { fuera: false, k: state.step - 1 };
  }
  /* Si el análisis libre sigue exactamente la línea, se completa con el resto
     de la línea para que ◂ ▸ y la lista sigan recorriéndola entera. */
  function completarAnalisis(){
    var p = curr();
    if (!state.freemode || !state.anaMoves || state.anaMoves.length >= p.u.length) return;
    for (var k = 0; k < state.anaMoves.length; k++) if (!mismoMovimiento(state.anaMoves[k], p.u[k])) return;
    var g = new Chess(p.fen), todo = [];
    for (var i = 0; i < p.u.length; i++){
      var u = p.u[i], m = g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
      if (!m) return;
      todo.push(m);
    }
    state.anaMoves = todo;
  }

  /* Otras jugadas que el maestro analiza en esta misma posición (las variantes
     que se separan justo en la jugada k). Cada una es otra línea de la sección. */
  function alternativas(p, k){
    var r = [];
    if (k < 0) return r;
    TODAS.forEach(function(x){
      if (x.lv !== p.lv || x === p || x.br !== k || x.ids.length <= k) return;
      for (var i = 0; i < k; i++) if (x.ids[i] !== p.ids[i]) return;
      if (x.ids[k] === p.ids[k]) return;
      r.push(x);
    });
    /* y, si estamos en una variante, la jugada de la línea de la que salió */
    if (p.br === k && p.pd != null){
      var madre = null;
      TODAS.forEach(function(x){ if (x.lv === p.lv && x.li - 1 === p.pd) madre = x; });
      if (madre && r.indexOf(madre) < 0) r.unshift(madre);
    }
    return r;
  }

  /* ---------- comentario del maestro ---------- */
  function pintarComentario(){
    var p = curr(); if (!p) return;
    var c = p.cap, pos = enLinea(), k = pos.k;
    var elMov = $('p17-c-mov'), elEv = $('p17-c-ev'), elRama = $('p17-c-rama'), elTxt = $('p17-c-txt');
    var rama = '', ev = '', html = '', vacio = false;
    if (pos.fuera){
      elMov.textContent = 'Análisis libre';
      html = 'Te saliste de la línea del maestro. Con ◂ vuelves a ella, o con Reiniciar empiezas de nuevo.';
      vacio = true;
    } else if (k < 0){
      elMov.textContent = 'Posición inicial';
      if (p.br > 0){
        var pr = p.pl[p.br];
        rama = 'Esta variante se separa en ' + pr.m + pr.s + ' (jugada ' + (p.br + 1) + ' de la línea).';
      }
      if (p.li === 1 && c.intro) html = esc(c.intro);
      else { html = 'Avanza con ▸ para recorrer la línea desde la primera jugada.'; vacio = true; }
    } else {
      var pl = p.pl[k];
      elMov.innerHTML = jugadaHTML(pl);
      ev = pl.e || '';
      if (p.br > 0 && k === p.br) rama = '↳ Aquí empieza la variante';
      var partes = [];
      if (pl.p) partes.push('<span class="p17-c-pre">' + esc(pl.p) + '</span>');
      if (pl.c) partes.push(esc(pl.c));
      if (partes.length) html = partes.join('');
      else { html = 'Sin comentario en esta jugada.'; vacio = true; }
      if (k === p.u.length - 1){
        var fin = p.li === 1 ? 'Fin de la partida' + (resultado(c.resultado) ? ' · ' + resultado(c.resultado) : '') : 'Fin de la variante';
        if (p.li === 1 && c.esTeoria) fin = 'Fin de la línea principal';
        html += '<span class="p17-c-fin">' + esc(fin) + '</span>';
      }
    }
    elEv.textContent = ev;
    elRama.hidden = !rama; elRama.textContent = rama;
    elTxt.className = 'p17-c-txt' + (vacio ? ' vacio' : '');
    elTxt.innerHTML = html;
    var alt = pos.fuera ? [] : alternativas(p, k), elAlt = $('p17-c-alt');
    elAlt.hidden = !alt.length;
    elAlt.innerHTML = alt.length ? '<span class="et">También aquí:</span>' + alt.map(function(x){
      var pl = x.pl[k];
      return '<button type="button" class="p17-alt" data-n="' + x.n + '" data-k="' + (k + 1) + '">' + jugadaHTML(pl) + '<small>línea ' + x.li + '</small></button>';
    }).join('') : '';
    var t = state.game.turn() === 'w' ? 'Blancas' : 'Negras';
    $('toplay').innerHTML = 'Turno: <b>' + t + '</b>';
    /* ◂ ▸ apagados en los extremos */
    var ini, finL;
    if (state.freemode && state.anaMoves){ ini = state.anaPtr <= 0; finL = state.anaPtr >= state.anaMoves.length; }
    else { ini = state.step <= 0; finL = state.step >= p.u.length; }
    $('b-ana-prev').setAttribute('aria-disabled', ini ? 'true' : 'false');
    $('b-ana-next').setAttribute('aria-disabled', finL ? 'true' : 'false');
  }

  /* ---------- flechas y casillas del maestro ---------- */
  function pintarMarcas(){
    var p = curr(); if (!p) return;
    var vieja = boardEl.querySelector('.p17-capa'); if (vieja) vieja.remove();
    var pos = enLinea(); if (pos.fuera) return;
    var fl, cs;
    if (pos.k < 0){ fl = p.cap.introA || []; cs = p.cap.introQ || []; }
    else { var pl = p.pl[pos.k]; fl = (pl.a || []).concat(pl.pa || []); cs = (pl.q || []).concat(pl.pq || []); }
    if (!fl.length && !cs.length) return;
    var trozos = '';
    cs.forEach(function(x){
      var col = COLORES[x[0]] || COLORES.G, sq = x.slice(1, 3), a = anotCoord(sq);
      trozos += '<rect x="' + (a.x - 0.5) + '" y="' + (a.y - 0.5) + '" width="1" height="1" fill="' + col + '" opacity=".42"/>';
    });
    fl.forEach(function(x){
      var col = COLORES[x[0]] || COLORES.G, d = x.slice(1, 3), h = x.slice(3, 5);
      if (d === h) return;
      trozos += anotSVG(d, h, false).replace(/var\(--flecha-anot\)/g, col);
    });
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 8 8');
    svg.setAttribute('class', 'p17-capa');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6';
    svg.innerHTML = trozos;
    boardEl.appendChild(svg);
  }

  /* ---------- lista de jugadas: la línea completa ---------- */
  window.renderMoves = function(){
    var ml = $('movelist'), p = curr(); if (!p) return;
    completarAnalisis();
    var pos = enLinea();
    if (pos.fuera){
      var h = '', num = 1;
      for (var j = 0; j < state.anaMoves.length; j++){
        var m = state.anaMoves[j];
        if (m.color === 'w'){ h += '<span class="num">' + num + '.</span>'; num++; }
        h += '<span class="ply u' + (j === state.anaPtr - 1 ? ' now' : '') + '" data-k="' + j + '">' + figurina(m.san) + '</span> ';
      }
      ml.innerHTML = h;
    } else {
      var cur = pos.k + 1, html = '';
      for (var k = 0; k < p.u.length; k++){
        var pl = p.pl[k];
        if (p.br > 0 && k === p.br) html += '<span class="p17-rama">variante</span>';
        if (k % 2 === 0) html += '<span class="num">' + (k / 2 + 1) + '.</span>';
        else if (p.br > 0 && k === p.br) html += '<span class="num">' + ((k + 1) / 2) + '...</span>';
        var cls = 'ply ' + (k % 2 === 0 ? 'u' : 'o') + (k === cur - 1 ? ' now' : '') + (k >= cur ? ' fut' : '') + ((pl.c || pl.p) ? ' cm' : '');
        html += '<span class="' + cls + '" data-k="' + k + '">' + figurina(esc(p.ln[k])) + (pl.e ? '<span class="p17-ev">' + esc(pl.e) + '</span>' : '') + '</span> ';
      }
      ml.innerHTML = html;
    }
    pintarComentario();
    var now = ml.querySelector('.ply.now');
    if (now && ml.scrollHeight > ml.clientHeight) now.scrollIntoView({ block: 'nearest' });
  };

  var renderBoardPC1 = window.renderBoard;
  window.renderBoard = function(){ renderBoardPC1(); pintarMarcas(); };

  /* ---------- encabezado y tarjeta «La lección» ---------- */
  window.renderHead = function(p){
    $('exno').textContent = p.lv;
    var chip = $('chip'); chip.textContent = 'Línea ' + p.li + ' de ' + p.tot; chip.className = 'chip';
  };
  window.renderRef = function(p){
    var c = p.cap;
    $('ref-vs').textContent = c.esTeoria ? c.nombre : (c.blancas + ' vs ' + c.negras);
    var ev = c.esTeoria ? ['Teoría', 'Lección ' + c.n] : [c.evento, fecha(c.fecha), resultado(c.resultado)];
    $('ref-ev').textContent = ev.filter(Boolean).join(' · ');
    var tags = [];
    if (c.eco) tags.push('<span class="p17-tag">' + esc(c.eco) + '</span>');
    if (c.apertura) tags.push('<span class="p17-tag">' + esc(c.apertura.replace(/^Caro-Kann Defense: /, '')) + '</span>');
    if (c.url) tags.push('<a class="p17-tag" href="' + esc(c.url) + '" target="_blank" rel="noopener">Ver en Lichess</a>');
    $('ref-tags').innerHTML = tags.join('');
    $('ref-note').textContent = p.li === 1 ? 'Línea principal' : 'Variante ' + p.nm;
    $('ref-note').style.display = 'block';
    $('ref-full').textContent = c.intro || '(Esta lección no tiene introducción escrita.)';
    $('expl').open = p.li === 1 && !!c.intro;
  };

  /* ---------- secciones y líneas ---------- */
  function pintarSecciones(){
    document.querySelectorAll('.fbtn[data-f]').forEach(function(b){ b.classList.toggle('active', b.dataset.f === state.filter); });
  }
  function pintarLineas(){
    var cont = $('p17-lineas'), p = curr(); if (!cont || !p) return;
    var c = p.cap, h = '';
    TODAS.forEach(function(x){
      if (x.lv !== p.lv) return;
      var nombre;
      if (x.li === 1) nombre = 'Línea principal';
      else {
        var partes = x.nm.split(' › ');
        nombre = (partes.length > 1 ? '<i>' + esc(partes.slice(0, -1).join(' › ')) + ' › </i>' : '') + esc(partes[partes.length - 1]);
      }
      h += '<button class="p17-li' + (x.li === 1 ? ' principal' : '') + (x.n === p.n ? ' on' : '') + '" type="button" data-n="' + x.n + '" title="' + esc(x.li === 1 ? 'Línea principal' : x.nm) + '">' +
           '<span class="n">' + x.li + '</span><span class="t">' + nombre + '</span><span class="ok">' + (solved.has(x.n) ? '✓' : '') + '</span></button>';
    });
    cont.innerHTML = h;
    $('p17-lineas-titulo').textContent = 'Líneas de la lección ' + c.n;
    var on = cont.querySelector('.p17-li.on');
    if (on){
      var top = on.offsetTop - cont.offsetTop;
      if (top < cont.scrollTop || top + on.offsetHeight > cont.scrollTop + cont.clientHeight) cont.scrollTop = Math.max(0, top - cont.clientHeight / 3);
    }
    var rs = $('p17-r-sec'); if (rs) rs.textContent = 'De la lección ' + c.n;
  }
  /* tocar una alternativa: abre esa línea ya en la jugada donde se separa (◂ vuelve al inicio) */
  $('p17-c-alt').addEventListener('click', function(e){
    var b = e.target.closest('.p17-alt'); if (!b) return;
    jumpToNumber(Number(b.dataset.n));
    irAPaso(Number(b.dataset.k), false);
  });
  $('p17-lineas').addEventListener('click', function(e){
    var b = e.target.closest('.p17-li'); if (!b) return;
    jumpToNumber(Number(b.dataset.n));
  });

  function avisarPadre(p){
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ tipo: 'p17-linea', lv: p.lv, n: p.n }, '*'); } catch (e) {}
  }

  var loadPC1 = window.load;
  window.load = function(p){
    loadPC1(p);
    var mapa = leerJSON('p17_ultimo_por_seccion', {});
    mapa[p.lv] = p.n; guardar('p17_ultimo_por_seccion', mapa);
    pintarSecciones(); pintarLineas(); avisarPadre(p);
  };

  window.buildList = function(){
    if (!state.filter || state.filter === 'all') state.filter = TODAS[0].lv;
    state.list = TODAS.filter(function(p){ return p.lv === state.filter; });
  };
  window.setFilter = function(f){
    detenerSolucion(); detenerMotor();
    state.filter = String(f); buildList(); pintarSecciones();
    var mapa = leerJSON('p17_ultimo_por_seccion', {}), n = mapa[state.filter];
    var idx = state.list.findIndex(function(p){ return p.n === n; });
    state.i = idx >= 0 ? idx : 0;
    load(curr());
  };
  window.jumpToNumber = function(n){
    n = parseInt(n, 10);
    var p = lineaPorNumero(n); if (!p) return;
    detenerSolucion(); detenerMotor();
    if (state.filter !== p.lv){ state.filter = p.lv; buildList(); }
    state.i = state.list.indexOf(p);
    load(p);
  };
  /* Ant/Sig y ↑ ↓: líneas en orden; al final de una lección pasa a la siguiente */
  window.go = function(delta){
    var p = curr(), i = TODAS.indexOf(p);
    var q = TODAS[(i + delta + TODAS.length) % TODAS.length];
    jumpToNumber(q.n);
  };
  window.p17IrSeccion = function(lv){
    setFilter(String(lv));
    var tab = document.querySelector('.tab[data-v="train"]'); if (tab && !tab.classList.contains('active')) tab.click();
    try { window.scrollTo(0, 0); } catch (e) {}
  };
  window.p17Estado = function(){ var p = curr(); return p ? { lv: p.lv, n: p.n } : null; };

  /* ---------- recorrer la línea ---------- */
  window.myTurn = function(){ return !state.busy && !state.viewBack; };

  function irAPaso(k, sonar){
    var p = curr();
    k = Math.max(0, Math.min(k, p.u.length));
    var antes = state.step;
    state.game = new Chess(p.fen);
    var ultima = null;
    for (var i = 0; i < k; i++){
      var u = p.u[i];
      ultima = state.game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
    }
    state.step = k; state.sel = null; state.premove = null;
    state.lastMove = ultima ? { from: ultima.from, to: ultima.to } : null;
    clearMarks();
    renderBoard(); renderMoves(); marcarReyMate();
    if (sonar && k === antes + 1 && ultima){ if (ultima.captured) sndCapture(); else sndMove(); }
    if (k >= p.u.length && k > antes) onSolved();
  }
  window.verJugadaLive = function(ptr){ if (!state.busy) irAPaso(ptr, false); };

  function paso(d){
    if (state.busy) return;
    if (state.freemode){ if (state.anaMoves) irAJugada(state.anaPtr + d); return; }
    irAPaso(state.step + d, d > 0);
  }
  $('b-ana-prev').onclick = function(){ paso(-1); };
  $('b-ana-next').onclick = function(){ paso(1); };
  /* tocar una jugada de la lista: también las que faltan */
  $('movelist').addEventListener('click', function(e){
    var pl = e.target.closest('.ply[data-k]'); if (!pl) return;
    e.stopImmediatePropagation();
    var ptr = Number(pl.dataset.k) + 1;
    if (state.freemode && state.anaMoves) irAJugada(ptr); else irAPaso(ptr, false);
  }, true);

  window.addEventListener('keydown', function(e){
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (!$('v-train').classList.contains('active')) return;
    if (document.querySelector('.workspace-bg.open,.confirm-bg.open,.modal-bg.open')) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowLeft'){ e.preventDefault(); e.stopImmediatePropagation(); paso(k === 'ArrowRight' ? 1 : -1); }
    else if (k === 'ArrowDown' || k === 'ArrowUp'){ e.preventDefault(); e.stopImmediatePropagation(); go(k === 'ArrowDown' ? 1 : -1); }
  }, true);

  /* Mover en el tablero: si es la jugada de la línea, avanza (de cualquier color) */
  var tryMovePC1 = window.tryMove;
  window.tryMove = function(from, to){
    if (state.freemode) return tryMovePC1(from, to);
    clearMarks();
    var p = curr(), exp = state.uci[state.step];
    if (!exp) return;
    if (from === exp.slice(0, 2) && to === exp.slice(2, 4)){
      var mv = state.game.move({ from: from, to: to, promotion: exp[4] || 'q' });
      if (mv && mv.captured) sndCapture(); else sndMove();
      flash(to, 'good');
      state.step++;
      state.lastMove = mv ? { from: mv.from, to: mv.to } : null;
      renderBoard(); renderMoves();
      if (state.step >= p.u.length) onSolved();
    } else {
      state.attemptHadError = true;
      registrarIncidenciaEntrenamiento('error');
      sndError();
      flash(to, 'bad'); var cf = cellOf(from); if (cf) cf.classList.add('bad');
      setTimeout(function(){ if (cf) cf.classList.remove('bad'); }, 420);
      setStatus('no', 'Esa no es la jugada de la línea.');
      paintLast();
    }
  };

  /* Solución: reproduce lo que falta de la línea, con la pausa justa para leer */
  window.playSolution = function(){
    if (state.busy) return;
    var p = curr();
    if (state.freemode){ state.freemode = false; state.anaMoves = null; state.anaPtr = 0; mostrarBarraAnalisis(false); irAPaso(0, false); }
    if (state.step >= p.u.length) irAPaso(0, false);
    state.busy = true; reproduciendoSolucion = true; actualizarBotonSolucion(true); clearMarks();
    (function sig(){
      if (!reproduciendoSolucion) return;
      if (state.step >= p.u.length){ detenerSolucion(); onSolved(); return; }
      var u = p.u[state.step];
      var m = state.game.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || 'q' });
      if (m && m.captured) sndCapture(); else sndMove();
      state.lastMove = m ? { from: m.from, to: m.to } : null;
      state.step++;
      renderBoard(); renderMoves();
      var pl = p.pl[state.step - 1], largo = (pl.c || '').length + (pl.p || '').length;
      temporizadorSolucion = setTimeout(sig, largo ? Math.min(6000, 1400 + largo * 18) : 900);
    })();
  };

  /* Al terminar: queda guardada como estudiada y se pasa a análisis libre (◂ ▸ siguen) */
  var onSolvedPC1 = window.onSolved;
  window.onSolved = function(){
    onSolvedPC1();
    completarAnalisis();
    renderMoves(); pintarLineas();
  };

  var renderProgressPC1 = window.renderProgress;
  window.renderProgress = function(){ renderProgressPC1(); pintarLineas(); };

  /* Línea aleatoria */
  $('random-modal').addEventListener('click', function(e){
    var b = e.target.closest('[data-p17r]'); if (!b) return;
    e.stopPropagation();
    $('random-modal').classList.remove('open');
    var grupo = b.dataset.p17r === 'sec' ? state.list : TODAS;
    var p = grupo[Math.floor(Math.random() * grupo.length)];
    jumpToNumber(p.n);
  }, true);

  /* ---------- la línea completa con sus comentarios (botón del libro) ---------- */
  window.exRender = function(){
    var p = curr(); if (!p) return;
    var c = p.cap, pos = enLinea();
    $('explain-kicker').textContent = 'LECCIÓN ' + c.n + ' · LÍNEA ' + p.li + ' DE ' + p.tot;
    $('explain-title').textContent = p.li === 1 ? c.nombre : 'Variante ' + p.nm;
    $('explain-subtitle').textContent = p.li === 1 ? (c.esTeoria ? 'Teoría · línea principal' : 'Línea principal') : c.nombre;
    var orb = document.querySelector('.move-orb span');
    if (p.br > 0){ orb.textContent = 'Se separa en'; $('explain-move').textContent = p.pl[p.br].m + p.pl[p.br].s; }
    else { orb.textContent = 'Lección'; $('explain-move').textContent = c.n; }
    var chips = [c.eco, p.u.length + ' jugadas', c.esTeoria ? '' : resultado(c.resultado)].filter(Boolean);
    $('explain-chips').innerHTML = chips.map(function(x){ return '<span class="explain-chip">' + esc(x) + '</span>'; }).join('');
    $('explain-objective').textContent = 'Comentarios del maestro';
    $('explain-summary').textContent = p.li === 1 ? (c.intro || 'Recorre la línea principal desde la primera jugada.')
      : 'La línea empieza en la jugada 1 y se separa de su línea madre en ' + p.pl[p.br].m + p.pl[p.br].s + '.';
    $('explain-grid').innerHTML = '';
    var h = '<div class="p17-ex">', sueltas = [];
    function volcar(){ if (sueltas.length){ h += '<div class="p17-ex-paso sin"><div class="p17-ex-inline">' + sueltas.join(' ') + '</div></div>'; sueltas = []; } }
    for (var k = 0; k < p.u.length; k++){
      var pl = p.pl[k], mov = esc(pl.m + pl.s) + (pl.e ? ' ' + esc(pl.e) : '');
      if (p.br > 0 && k === p.br){ volcar(); h += '<div class="p17-ex-sep">↳ Aquí empieza la variante</div>'; }
      if (pl.c || pl.p || k === pos.k){
        volcar();
        h += '<div class="p17-ex-paso' + (k === pos.k ? ' on' : '') + '"><div class="p17-ex-mov">' + mov + (k === pos.k ? '<small>← estás aquí</small>' : '') + '</div>';
        if (pl.p) h += '<div class="p17-ex-com">' + esc(pl.p) + '</div>';
        if (pl.c) h += '<div class="p17-ex-com">' + esc(pl.c) + '</div>';
        h += '</div>';
      } else sueltas.push('<span>' + mov + '</span>');
    }
    volcar();
    $('explain-line').innerHTML = h + '</div>';
    $('explain-source').textContent = 'Estudio «Caro Kann al estilo Pupilochess» · ' + c.nombre + (c.url ? ' · ' + c.url : '');
    exRenderBoard({ fen: state.game.fen(), o: state.orient, n: p.n });
    var turno = state.game.turn() === 'w' ? 'blancas' : 'negras';
    $('explain-board').setAttribute('aria-label', 'Posición actual de la línea ' + p.n + ', juegan ' + turno);
    $('explain-board-meta').innerHTML = '<span>Juegan ' + turno + '</span><span>Jugada ' + Math.max(0, pos.k + 1) + ' de ' + p.u.length + '</span><span>Línea ' + p.n + '</span>';
  };

  /* fila Reiniciar · Stockfish · Flechas · ◂ · ▸: cinco partes iguales que caben en el móvil */
  var fila = $('b-reset').parentElement;
  if (fila){ fila.style.gap = '.3rem'; fila.style.alignItems = 'center'; fila.style.justifyContent = 'center'; }

  /* ---------- arranque: última línea abierta, o la primera ---------- */
  $('c-all').textContent = TODAS.length;
  var sub = $('p17-subtitulo'); if (sub) sub.textContent = 'Lecciones 33–42 · ' + TODAS.length + ' líneas';
  var desdeEnlace = null;
  try { var q = new URLSearchParams(location.search); desdeEnlace = parseInt(q.get('linea'), 10) || null; } catch (e) {}
  var ultimo = desdeEnlace;
  if (!ultimo){ try { ultimo = parseInt(sessionStorage.getItem('p17_tab_ultimo'), 10) || parseInt(localStorage.getItem('p17_ultimo'), 10) || null; } catch (e) {} }
  var inicial = lineaPorNumero(ultimo) || TODAS[0];
  state.filter = inicial.lv; buildList();
  state.i = state.list.indexOf(inicial);
  load(inicial);
  renderProgress();

  /* Abierta sola (sin el menú): también pide confirmación al recargar */
  if (window.top === window){
    window.addEventListener('beforeunload', function(e){ e.preventDefault(); e.returnValue = ''; return ''; });
  }
})();
