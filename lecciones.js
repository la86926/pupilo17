/* Pupilo 17 · convierte los capítulos en «líneas» para el entrenador.
   Cada ramificación del maestro es una línea independiente que empieza
   en la posición inicial y llega hasta el final de la variante. */
(function(){
  'use strict';
  var INICIO = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var caps = window.P17_CAPS || [];
  var lineas = [], n = 0;

  function titulo(c){
    var t = String(c.titulo || '').replace(/\s+/g, ' ').trim();
    /* el capítulo de teoría viene en mayúsculas: «LA VARIANTE KARPOV con 4...Cd7» */
    if (/^LA VARIANTE KARPOV/.test(t)) t = 'La variante Karpov' + t.slice('LA VARIANTE KARPOV'.length);
    return t;
  }

  caps.forEach(function(c){
    c.nombre = titulo(c);
    c.esTeoria = !c.blancas || c.blancas === '?';
    c.primera = n + 1;
    c.lineas.forEach(function(L, i){
      n++;
      var pl = L.ids.map(function(id){ return c.plies[id]; });
      lineas.push({
        n: n,                       // número global de la línea (1–253)
        lv: String(c.n),            // sección (33–42)
        li: i + 1,                  // número de la línea dentro de su sección
        tot: c.lineas.length,
        nm: L.nm || 'Línea principal',
        br: L.br,                   // jugada (ply) donde la variante se separa
        pd: L.pd,
        cap: c,
        fen: INICIO,
        o: 'b',                     // la Caro-Kann se estudia desde las negras
        ln: pl.map(function(p){ return p.en; }),
        u: pl.map(function(p){ return p.u; }),
        pl: pl,
        ids: L.ids,
        w: c.blancas, b: c.negras, ev: c.evento,
        tg: [c.eco, c.apertura].filter(Boolean),
        v: 1,
        full: c.intro
      });
    });
    c.ultima = n;
  });

  window.P17_LINEAS = lineas;
})();
