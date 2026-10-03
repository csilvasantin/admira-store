/* Three expert columns share available width. Only adjacent columns change. */
(()=>{
  if(typeof document==='undefined')return;
  const dock=document.getElementById('telegramDock')||document.getElementById('xsExpert');
  const workspace=dock?.querySelector('.expert-workspace');
  if(!workspace)return;
  const key='xpace_expert_columns_v1';
  let sizes=[32,38,30];
  try{const saved=JSON.parse(localStorage.getItem(key));if(Array.isArray(saved)&&saved.length===3&&saved.every(n=>Number.isFinite(n)&&n>=8))sizes=saved;}catch(_){}
  const dividers=[...workspace.querySelectorAll('[data-expert-divider]')];
  function render(){
    ['input','controls','output'].forEach((name,i)=>workspace.style.setProperty('--expert-'+name,sizes[i]+'fr'));
    dividers.forEach((el,i)=>{
      el.setAttribute('aria-label',i===0?'Comandos y controles / Commands and controls':'Controles y vistas / Controls and views');
      el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax','100');
      el.setAttribute('aria-valuenow',String(Math.round(100*sizes[i]/(sizes[i]+sizes[i+1]))));
      el.title='Arrastrar · Flechas ← → · Doble clic: restablecer / Drag · Arrow keys · Double-click: reset';
    });
  }
  function save(){try{localStorage.setItem(key,JSON.stringify(sizes));}catch(_){} }
  function adjust(i,delta,initial){
    const sum=initial[i]+initial[i+1];
    const minimum=Math.min(12,sum/3);
    sizes[i]=Math.max(minimum,Math.min(sum-minimum,initial[i]+delta));
    sizes[i+1]=sum-sizes[i];render();
  }
  dividers.forEach((handle,i)=>{
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;e.preventDefault();e.stopPropagation();
      const initial=[...sizes],start=e.clientX;

      const total=initial[0]+initial[1]+initial[2];
      const width=Math.max(1,workspace.clientWidth-24);
      handle.setPointerCapture(e.pointerId);handle.classList.add('is-dragging');
      const move=event=>{if(event.pointerId!==e.pointerId)return;event.preventDefault();adjust(i,(event.clientX-start)*total/width,initial);};
      const end=event=>{
        if(event.pointerId!==e.pointerId)return;
        handle.classList.remove('is-dragging');save();
        handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);handle.removeEventListener('lostpointercapture',end);
        if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
      };
      handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
    });
    handle.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      if(e.key==='Home'){sizes=[32,38,30];render();}else adjust(i,e.key==='ArrowLeft'?-2:2,[...sizes]);save();
    });
    handle.addEventListener('dblclick',()=>{sizes=[32,38,30];render();save();});
  });render();
})();
