import {createLifeSnapshot} from './life-snapshot.mjs?v=px-1';
/** Live Best surface: one snapshot, shared media and independently editable PBR models. */
export function mountInventoryBest(container,onReady=()=>{}){
 let disposed=false,failed=false,viewer,frame=0,last=-Infinity,ready=false,started;const snapshot=createLifeSnapshot();
 const canvas=document.createElement('canvas');canvas.className='inventory-best-canvas';canvas.setAttribute('aria-label','Xtanco Best 3D. Arrastra para girar; rueda para acercar. Teclas más, menos y cero para ajustar la cámara.');canvas.tabIndex=0;
 const label=document.createElement('p');label.className='inventory-best-label';label.textContent='Cargando Xtanco Best 3D…';label.setAttribute('role','status');
 const controls=document.createElement('div');controls.className='inventory-best-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Cámara de Best 3D');
 const actions=[['Vista general','Encajar toda la tienda',()=>viewer?.preset('mapped')],['Detalle','Acercar la cámara para ver personas y muebles',()=>viewer?.preset('detail')],['−','Alejar',()=>viewer?.zoomBy(1/1.25)],['+','Acercar',()=>viewer?.zoomBy(1.25)]];
 for(const [text,title,action]of actions){const button=document.createElement('button');button.type='button';button.textContent=text;button.title=title;button.setAttribute('aria-label',title);button.disabled=true;button.addEventListener('click',action);controls.append(button);}
 const detail=document.createElement('p');detail.className='inventory-best-selection';detail.hidden=true;
 container.append(canvas,label,controls,detail);container.classList.add('best-inventory-mode');
 const observer=new ResizeObserver(()=>{const r=container.getBoundingClientRect();viewer?.resize(r.width,r.height);});observer.observe(container);
 function fail(){if(disposed||failed)return;failed=true;cancelAnimationFrame(frame);viewer?.dispose();viewer=null;canvas.hidden=true;controls.hidden=true;detail.hidden=true;label.classList.add('is-error');label.setAttribute('role','alert');label.textContent='No se ha podido abrir Best 3D. Vuelve a Good o Better desde Avanzado, o pulsa Escape y vuelve a intentarlo.';onReady('No se ha podido abrir Best 3D.');}
 function status(next){
  const people=viewer?.bestPeopleStatus;
  let text='BEST · 3D EN VIVO · '+next.layout.length+' objetos'+(next.moving?' · mudanza':'');
  if(people?.total){text+=' · '+people.ready+'/'+people.total+' personas Best';if(people.loading)text+=' · cargando personas';if(people.fallback)text+=' · '+people.fallback+' con modelo provisional';}
  label.textContent=text;
 }
 function onSelect(data){const value=data?.actor?.label||data?.actor?.name||data?.item?.label||data?.label||(data?.actor?'Visitante del gemelo':data?.item?'Elemento del espacio':'');detail.textContent=value||'';detail.hidden=!value;}
 function onKey(event){if(event.key==='+'||event.key==='='){event.preventDefault();viewer?.zoomBy(1.25);}else if(event.key==='-'){event.preventDefault();viewer?.zoomBy(1/1.25);}else if(event.key==='0'){event.preventDefault();viewer?.preset('mapped');}}
 canvas.addEventListener('keydown',onKey);
 function onContextLost(event){event.preventDefault();fail();}canvas.addEventListener('webglcontextlost',onContextLost);
 async function start(){try{
  const {createLifeRenderer}=await import('./life-renderer.mjs?v=px-1');if(disposed)return;
  function tick(now){if(disposed||failed)return;try{if(!document.hidden){
   if(now-last>=100||!viewer){started??=now;const next=snapshot(window.__xtancoVisualState?.());
    if(!next){label.textContent='Esperando al Xtanco para abrir Best 3D…';if(now-started>30000)fail();else frame=requestAnimationFrame(tick);return;}
    if(!viewer){viewer=createLifeRenderer({canvas,snapshot:next,assetQuality:'best',getPlayer:()=>window.__xtoreWindowPlayer,onSelect});const r=container.getBoundingClientRect();viewer.resize(r.width,r.height);}else viewer.update(next);
    status(next);last=now;
   }
   viewer?.render(now);
   if(viewer&&!ready){ready=true;for(const button of controls.children)button.disabled=false;onReady();}
  }frame=requestAnimationFrame(tick);}catch{fail();}}
  frame=requestAnimationFrame(tick);
 }catch{fail();}}void start();
 return ()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('keydown',onKey);canvas.removeEventListener('webglcontextlost',onContextLost);viewer?.dispose();canvas.remove();label.remove();controls.remove();detail.remove();container.classList.remove('best-inventory-mode');};
}
