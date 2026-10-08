// Hueco oscuro arriba al centro del 360° (Matrix) con el modo experto abierto (Carlos, 8-oct-2026).
// Causa: el panel «Opciones de categoría» del dock (#telegramDock .expert-controls-pane) es un scroller nativo
// cuyo contenido desborda (≈271 px en 107 px); Chrome deja entonces de pintar el lienzo WebGL del panorama en un
// rectángulo del tamaño del panel, pegado arriba del diálogo, y se ve el fondo #081717 del escenario. No es un nodo
// del DOM ni una malla de la escena. Con overflow:hidden el hueco desaparece; el panel sigue desplazándose con la
// rueda, el arrastre táctil y el foco (scrollTop programático), y una sombra abajo indica que hay más.
export const DOCK_SCROLL_SELECTOR='#telegramDock .expert-controls-pane';
export const GUARD_CSS=DOCK_SCROLL_SELECTOR+'{overflow:hidden!important;overscroll-behavior:contain}'
 +DOCK_SCROLL_SELECTOR+'.xp-more-below{box-shadow:inset 0 -16px 12px -12px rgba(120,243,255,.38)!important}'
 +DOCK_SCROLL_SELECTOR+'.xp-more-above{box-shadow:inset 0 16px 12px -12px rgba(120,243,255,.38)!important}'
 +DOCK_SCROLL_SELECTOR+'.xp-more-above.xp-more-below{box-shadow:inset 0 16px 12px -12px rgba(120,243,255,.38),inset 0 -16px 12px -12px rgba(120,243,255,.38)!important}';
export function scrollPane(p,dy){if(!p)return false;const max=Math.max(0,p.scrollHeight-p.clientHeight),before=p.scrollTop;p.scrollTop=Math.max(0,Math.min(max,before+dy));markPane(p);return p.scrollTop!==before;}
export function markPane(p){if(!p?.classList)return;const max=p.scrollHeight-p.clientHeight;p.classList.toggle('xp-more-below',p.scrollTop<max-1);p.classList.toggle('xp-more-above',p.scrollTop>1);}
export function installDockScrollGuard(doc=globalThis.document){
 if(!doc?.head||doc.__xpDockScrollGuard)return null;doc.__xpDockScrollGuard=true;
 const st=doc.createElement('style');st.id='xpDockScrollGuard';st.textContent=GUARD_CSS;doc.head.append(st);
 const pane=e=>e?.target?.closest?.(DOCK_SCROLL_SELECTOR)||null;
 doc.addEventListener('wheel',e=>{const p=pane(e);if(!p||e.ctrlKey)return;if(e.target.closest('select'))return;
  const dy=(e.deltaMode===1?16:e.deltaMode===2?p.clientHeight:1)*(e.deltaY||0);if(dy&&scrollPane(p,dy))e.preventDefault();},{capture:true,passive:false});
 let drag=null;
 doc.addEventListener('pointerdown',e=>{const p=pane(e);if(!p||e.pointerType==='mouse')return;drag={p,y:e.clientY,id:e.pointerId};},true);
 doc.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dy=drag.y-e.clientY;drag.y=e.clientY;scrollPane(drag.p,dy);},true);
 const end=e=>{if(drag&&e.pointerId===drag.id)drag=null;};doc.addEventListener('pointerup',end,true);doc.addEventListener('pointercancel',end,true);
 doc.addEventListener('focusin',e=>{const p=pane(e);if(!p)return;const r=e.target.getBoundingClientRect(),q=p.getBoundingClientRect();if(r.bottom>q.bottom)scrollPane(p,r.bottom-q.bottom+6);else if(r.top<q.top)scrollPane(p,r.top-q.top-6);},true);
 // Marca «hay más» al aparecer el panel o cambiar su contenido.
 let due=0;const run=()=>{due=0;for(const p of doc.querySelectorAll(DOCK_SCROLL_SELECTOR))markPane(p);};
 const sweep=()=>{if(!due)due=setTimeout(run,400);}; // como mucho una lectura de tamaños cada 400 ms
 try{new doc.defaultView.ResizeObserver(sweep).observe(doc.body);}catch{}
 try{new doc.defaultView.MutationObserver(sweep).observe(doc.body,{childList:true,subtree:true});}catch{}
 run();return st;}
if(typeof document!=='undefined')installDockScrollGuard(document);
