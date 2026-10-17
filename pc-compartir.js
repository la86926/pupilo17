/* Pupilo 17 · Enlace directo a una línea para compartir (copiado del Método PC1)
   - pcEnlaceEjercicio(metodo, n): enlace que abre la web en la línea n.
   - pcCopiarTexto(texto): copia al portapapeles (se llama dentro del toque del botón).
   - pcAviso(texto): aviso breve en pantalla.
   El enlace apunta a la web pupilo17. */
(function(){
  'use strict';
  var WEB = 'https://la86926.github.io/pupilo17/';

  /* En Pupilo 17 el enlace abre directamente la línea N (1–253). */
  window.pcEnlaceEjercicio = function(metodo, n){
    return WEB + '?linea=' + encodeURIComponent(n);
  };

  function copiaVieja(texto){
    try{
      var ta = document.createElement('textarea');
      ta.value = texto; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, texto.length);
      var ok = document.execCommand('copy'); ta.remove(); return ok;
    }catch(e){ return false; }
  }
  window.pcCopiarTexto = function(texto){
    try{
      if (navigator.clipboard && navigator.clipboard.writeText){
        return navigator.clipboard.writeText(texto).then(function(){ return true; }, function(){ return copiaVieja(texto); });
      }
    }catch(e){}
    return Promise.resolve(copiaVieja(texto));
  };

  var css = document.createElement('style');
  css.textContent =
    '.pc-aviso{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(14px);opacity:0;z-index:9999;max-width:calc(100% - 32px);padding:10px 16px;border-radius:14px;background:rgba(40,40,44,.94);color:#fff;font:600 13px/1.3 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.22);pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.32,.72,0,1);text-align:center}' +
    '.pc-aviso.ver{opacity:1;transform:translateX(-50%) translateY(0)}';
  (document.head || document.documentElement).appendChild(css);
  var nodo = null, reloj = null;
  /* Los avisos de acciones (importar, exportar, copiar, pegar, tarjeta, copias de seguridad)
     se veían en el recuadro de mensajes, que ahora está oculto: se muestran como aviso breve.
     Los mensajes del juego (correcto, incorrecto, pista…) siguen sin mostrarse. */
  var ACCIONES = /(export|import|copia|copiad|pegad|portapapeles|tarjeta|progreso|historial|\bpgn\b|\bfen\b|donde pegar)/i;
  function engancharAvisos(){
    if (typeof window.setStatus !== 'function' || window.setStatus.__pcAviso) return;
    var original = window.setStatus;
    var envuelto = function(tipo, texto){
      var r = original.apply(this, arguments);
      try{ if (texto && ACCIONES.test(String(texto))) window.pcAviso(String(texto)); }catch(e){}
      return r;
    };
    envuelto.__pcAviso = true;
    window.setStatus = envuelto;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', engancharAvisos, { once: true });
  else engancharAvisos();

  window.pcAviso = function(texto){
    if (!nodo){ nodo = document.createElement('div'); nodo.className = 'pc-aviso'; nodo.setAttribute('role', 'status'); document.body.appendChild(nodo); }
    nodo.textContent = texto;
    void nodo.offsetWidth; nodo.classList.add('ver');
    clearTimeout(reloj); reloj = setTimeout(function(){ nodo.classList.remove('ver'); }, 2600);
  };
})();
