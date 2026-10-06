/* Sello flotante sobre el menú inferior del Experto (Carlos, 06-10-2026).
 * El chip común «v.… NUEVO» (www.admiranext.com/assets/sello-novedades.js) sólo se eleva sobre
 * el dock de la piel de la suite (.ax-experto.ax-dock). En el gemelo el menú inferior es
 * #telegramDock, así que el chip quedaba en bottom:12px encima de las categorías de la
 * columna CONTROL XTORE y tapaba «Crear contenidos» con el menú bajo. Aquí se mide el borde
 * superior del menú inferior visible y el chip se coloca 8 px por encima; con el Experto
 * cerrado (por defecto) vuelve a su sitio. No toca el cargador común ni su popover. */
(function(root){'use strict';
 const DOCKS='#telegramDock,#dockSplitHandle',GAP=8;
 // Pura (tests): cuánto hay que subir el chip para quedar por encima de los docks anclados abajo.
 function liftFor(viewportHeight,rects){let top=viewportHeight;for(const r of rects||[]){if(!r||r.height<2||r.top>=viewportHeight||r.bottom<viewportHeight-4)continue;top=Math.min(top,r.top);}const covered=Math.max(0,Math.ceil(viewportHeight-top));return covered?covered+GAP:0;}
 if(typeof module==='object'&&module.exports)module.exports={liftFor};
 const doc=root.document;if(!doc||!doc.documentElement||root.XpaceSelloChipDock)return;
 const html=doc.documentElement;
 function rects(){const out=[];for(const el of doc.querySelectorAll(DOCKS)){const cs=root.getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)continue;out.push(el.getBoundingClientRect());}return out;}
 let last='';
 function sync(){const lift=liftFor(root.innerHeight||html.clientHeight||0,rects()),value=lift?lift+'px':'';if(value===last)return;last=value;if(lift){html.style.setProperty('--xp-sello-lift',value);html.setAttribute('data-xp-sello-lift','');}else{html.style.removeProperty('--xp-sello-lift');html.removeAttribute('data-xp-sello-lift');}}
 let queued=false;const soon=()=>{if(queued)return;queued=true;(root.requestAnimationFrame||setTimeout)(()=>{queued=false;sync();});};
 function start(){
  const style=doc.createElement('style');style.id='xp-sello-chip-dock';
  // !important: el cargador común escribe bottom/top en línea en cada repintado (cada 2 s).
  style.textContent='html[data-xp-sello-lift] #admira-sello-chip{top:auto!important;bottom:var(--xp-sello-lift)!important}';
  doc.head.appendChild(style);
  root.addEventListener('resize',soon);
  if(root.MutationObserver)new root.MutationObserver(soon).observe(doc.body,{attributes:true,attributeFilter:['class','style']});
  if(root.ResizeObserver){const ro=new root.ResizeObserver(soon);for(const el of doc.querySelectorAll(DOCKS))ro.observe(el);}
  // El alto del dock también cambia por arrastre del asa y por la transición de apertura.
  doc.addEventListener('transitionend',soon,true);doc.addEventListener('pointerup',soon,true);
  setInterval(()=>{if(!doc.hidden)sync();},1000);
  sync();
 }
 root.XpaceSelloChipDock={sync,liftFor};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window!=='undefined'?window:globalThis);
