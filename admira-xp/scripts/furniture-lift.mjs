// Levantar muebles en Best · Hiperreal (Neo, 13-oct-2026). Una pieza se coge con el puntero, se eleva sobre la sala,
// se lleva a otro sitio y se posa; R o la rueda la giran un cuarto de vuelta. La huella en el suelo dice dónde va a
// quedar: verde si cabe, roja si no. Mientras está en el aire nada se guarda; al soltarla se valida sólo el destino
// (límites de la sala, otros muebles y celdas fijas) y se guarda por el mismo puente que usa Distribuir.
// Guía: admira-xp/docs/hiperreal-vivo.md
import {projectMatrixFloor,unprojectMatrixFloor} from './matrix-floor.mjs?v=hiperreal-vivo-1';
import {validateFurniturePlacement,furniturePose} from './distribuit.mjs?v=hiperreal-vivo-1';
import {furnitureBounds,hangsOnWall} from './furniture-geometry.mjs?v=hiperreal-vivo-1';

// Paso de la rejilla, radio en casillas para buscar hueco, altura del vuelo (fracción del alto de la escena) y
// píxeles que el puntero debe moverse para que un clic pase a ser un arrastre.
export const LIFT_STEP=.25,LIFT_REACH=1,LIFT_HEIGHT=.042,DRAG_SLOP=5;
const RAISE_MS=190,SETTLE_MS=300,HOP_MS=380,TURN_MS=170,TOAST_MS=2800,HISTORY=40;
const SVG='http://www.w3.org/2000/svg';
const turn=rot=>((Math.round(Number(rot)||0)%4)+4)%4;
const clamp=(n,min,max)=>Math.max(min,Math.min(Math.max(min,max),n));
const snap=(n,step)=>Math.round(n/step)*step;
const samePlace=(a,b)=>a.col===b.col&&a.row===b.row&&turn(a.rot)===turn(b.rot);
let sequence=0;

// Huella de una pieza alrededor de su propio origen para un giro dado: caja y centro, en casillas.
export function footprintAt(item,rot,footprints){
 const box=furnitureBounds({...item,col:0,row:0,rot:turn(rot)},footprints);
 return {minCol:box.minCol,maxCol:box.maxCol,minRow:box.minRow,maxRow:box.maxRow,col:(box.minCol+box.maxCol)/2,row:(box.minRow+box.maxRow)/2,cols:box.maxCol-box.minCol,rows:box.maxRow-box.minRow};
}
// Origen de la pieza cuya huella queda centrada en un punto del suelo, sin salirse de la sala.
export function poseAtCentre(item,centre,rot,scene){
 const box=footprintAt(item,rot,scene.footprints);
 const col=clamp(centre.col,box.cols/2,scene.cols-box.cols/2),row=clamp(centre.row,box.rows/2,scene.rows-box.rows/2);
 return {col:col-box.col,row:row-box.row,rot:turn(rot),centre:{col,row}};
}
// Dónde se posaría: la casilla más cercana a la deseada y, si está ocupada o fuera, el hueco libre más próximo.
export function findLanding(scene,id,pose,{from,step=LIFT_STEP,reach=LIFT_REACH}={}){
 const rot=turn(pose.rot),base={col:snap(pose.col,step),row:snap(pose.row,step),rot};
 const first=validateFurniturePlacement(scene,id,base,{from});
 if(first.ok||!['occupied','bounds'].includes(first.reason))return {...first,target:base,nudged:false};
 const span=Math.ceil(reach/step),options=[];
 for(let dc=-span;dc<=span;dc++)for(let dr=-span;dr<=span;dr++){
  if(!dc&&!dr)continue;
  const col=base.col+dc*step,row=base.row+dr*step,distance=Math.hypot(col-pose.col,row-pose.row);
  if(distance<=reach)options.push({col,row,rot,distance});
 }
 options.sort((a,b)=>a.distance-b.distance);
 for(const option of options){
  const target={col:option.col,row:option.row,rot},result=validateFurniturePlacement(scene,id,target,{from});
  if(result.ok)return {...result,target,nudged:true};
 }
 return {...first,target:base,nudged:false};
}
// Curvas del gesto: subir con un pequeño rebote, caer acelerando, asentarse.
const easeOutBack=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const easeOutCubic=t=>1-Math.pow(1-t,3);
const easeInQuad=t=>t*t;
// Estado visual de la pieza en la mano en un instante: altura (0–1), desplazamiento en píxeles, balanceo y aplastamiento.
export function liftFrame(motion,now){
 const age=Math.max(0,now-motion.started),frame={lift:0,x:0,y:0,tilt:0,sx:1,sy:1,front:true,state:'held',done:false};
 if(motion.phase==='held'){
  const raise=Math.min(1,age/RAISE_MS);
  frame.lift=motion.base+(1-motion.base)*easeOutBack(raise)+(raise>=1&&!motion.calm?Math.sin((age-RAISE_MS)/640)*.03:0);
  frame.tilt=motion.calm?0:motion.tilt||0;
 }else{
  // «settling» baja desde donde estaba; «hop» sube y baja en el mismo gesto (teclado, girar, deshacer).
  const total=motion.phase==='hop'?HOP_MS:SETTLE_MS,land=.74,t=Math.min(1,age/total),fall=Math.min(1,t/land);
  frame.state='settling';
  frame.lift=motion.phase==='hop'?Math.sin(Math.PI*fall)*.6:motion.base*(1-easeInQuad(fall));
  const travel=1-easeOutCubic(fall);
  frame.x=motion.from.x*travel;frame.y=motion.from.y*travel;frame.tilt=(motion.tilt||0)*travel;
  if(t>land){const squash=Math.sin(Math.PI*(t-land)/(1-land));frame.sx=1+.028*squash;frame.sy=1-.045*squash;frame.front=false;}
  frame.done=t>=1;
 }
 // Un giro en el aire no tiene vistas intermedias: se sugiere con un estrechamiento breve.
 const spin=motion.turned?Math.max(0,1-(now-motion.turned)/TURN_MS):0;
 if(spin>0)frame.sx*=1-.2*Math.sin(Math.PI*spin);
 const closer=1+.035*Math.max(0,frame.lift);frame.sx*=closer;frame.sy*=closer;
 return frame;
}
const COPY={
 placed:['colocada','placed'],moved:['movida','moved'],turned:['girada','turned'],undone:['Deshecho','Undone'],
 occupied:['Ahí no cabe: choca con','No room there: it hits'],occupiedHidden:['Ahí hay una pieza oculta del inventario:','An inventory piece hidden there:'],
 bounds:['Ahí se sale de la sala.','That is outside the room.'],blocked:['Ahí hay una zona fija de la sala.','That part of the room is fixed.'],fixed:['va fija en la pared o está bloqueada.','is fixed to the wall or locked.'],
 room:['La sala no está lista para mover muebles.','The room is not ready to move furniture.'],changed:['La pieza ha cambiado; vuelve a intentarlo.','The piece changed; try again.'],
 save:['No se ha podido guardar el cambio.','The change could not be saved.'],nothing:['No hay nada que deshacer.','Nothing to undo.'],
 hint:['Arrastra para levantarla · R gira · Esc cancela','Drag to lift · R turns · Esc cancels'],
 turn:['Girar','Turn'],undo:['Deshacer','Undo'],fixedTag:['fija','fixed']
};

export function mountFurnitureLift({container,furniture,bridge,win=globalThis,doc=win.document,lang=()=>doc.documentElement?.lang==='en'?'en':'es',onChange=()=>{}}={}){
 if(!container||!furniture||!bridge)throw Error('Falta la escena, el mobiliario o el puente de edición');
 const controls=new AbortController(),options={signal:controls.signal},clock=()=>win.performance.now();
 const t=key=>COPY[key][lang()==='en'?1:0],uid='furniture-lift-'+(++sequence);
 const el=(tag,name)=>{const node=doc.createElement(tag);node.className=name;return node;};
 const svg=(tag,attrs={})=>{const node=doc.createElementNS(SVG,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;};
 let disposed=false,hover=null,selected=null,selectedFixed=true,press=null,hold=null,motion=null,busy=false,blocking=null,refused=null,refusedUntil=0,suppressClick=false,toastTimer=0,wheelAt=0,ghostKey='',gridKey='',hinted=false;
 const history=[];

 // Suelo: rejilla tenue alrededor de la pieza, huella de salida y huella de destino. La copia «rayos X» de la huella
 // se pinta sobre toda la sala para que se vea también detrás de un mueble alto.
 const floor=svg('svg',{class:'furniture-lift-floor',viewBox:'0 0 1000 1000',preserveAspectRatio:'none','aria-hidden':'true'});
 const defs=svg('defs'),fade=svg('radialGradient',{id:uid+'-fade'}),mask=svg('mask',{id:uid+'-mask',maskUnits:'userSpaceOnUse',x:'0',y:'0',width:'1000',height:'1000'}),spot=svg('ellipse',{rx:'250',ry:'290',fill:`url(#${uid}-fade)`});
 for(const [offset,opacity] of [[0,1],[.5,.75],[1,0]])fade.append(svg('stop',{offset:String(offset),'stop-color':'#fff','stop-opacity':String(opacity)}));
 mask.append(spot);defs.append(fade,mask);
 const grid=svg('path',{class:'lift-grid',mask:`url(#${uid}-mask)`}),origin=svg('polygon',{class:'lift-origin'}),ghost=svg('polygon',{class:'lift-ghost'}),ripple=svg('polygon',{class:'lift-ripple'});
 floor.append(defs,grid,origin,ghost,ripple);
 const xray=svg('svg',{class:'furniture-lift-xray',viewBox:'0 0 1000 1000',preserveAspectRatio:'none','aria-hidden':'true'}),outline=svg('polygon',{class:'lift-ghost'});xray.append(outline);
 // Barra de la pieza elegida y aviso breve. data-i18n-live: llevan su propio idioma.
 const bar=el('div','furniture-lift-bar');bar.dataset.i18nLive='';bar.hidden=true;
 const name=el('span','lift-bar-name'),turnButton=el('button','lift-bar-button'),undoButton=el('button','lift-bar-button');
 turnButton.type=undoButton.type='button';bar.append(name,turnButton,undoButton);
 const toast=el('p','furniture-lift-toast');toast.dataset.i18nLive='';toast.setAttribute('role','status');
 container.append(floor,xray,bar,toast);

 // El puntero llega en píxeles de la ventana; lo que se mueve dentro de la escena se mide en los suyos propios.
 const stage=()=>container.getBoundingClientRect(),room=()=>({width:container.clientWidth||stage().width,height:container.clientHeight||stage().height});
 const point=event=>{const rect=stage();return {x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};};
 const corners=(box,scene)=>[[box.minCol,box.minRow],[box.maxCol,box.minRow],[box.maxCol,box.maxRow],[box.minCol,box.maxRow]].map(([col,row])=>projectMatrixFloor(col,row,scene.cols,scene.rows));
 const polygon=list=>list.map(p=>(p.x*1000).toFixed(1)+','+(p.y*1000).toFixed(1)).join(' ');
 const boxAt=(item,pose,scene)=>furnitureBounds({...item,col:pose.col,row:pose.row,rot:turn(pose.rot)},scene.footprints);
 const label=id=>{const piece=furniture.piece(id)?.placement;return piece?(piece.number?piece.number+' · ':'')+piece.label:'';};
 const emit=()=>{if(!disposed)try{onChange(api.state());}catch{}};
 function say(text,tone=''){
  win.clearTimeout(toastTimer);toast.textContent=text;toast.dataset.tone=tone;toast.classList.add('is-visible');
  toastTimer=win.setTimeout(()=>toast.classList.remove('is-visible'),TOAST_MS);
 }
 function refuse(id,text){refused=id;refusedUntil=clock()+360;say(text,'warn');furniture.update();win.setTimeout(()=>{if(!disposed)furniture.update();},380);}
 function read(){const scene=bridge.read();if(!scene?.active)throw Error('room');return scene;}
 const find=(scene,id)=>scene.layout.find(item=>String(item.id)===String(id))||null;
 // Por qué no se puede posar ahí, dicho con el nombre de lo que estorba.
 function why(landing,scene){
  if(landing?.reason==='bounds')return t('bounds');
  const other=landing?.obstacle&&!String(landing.obstacle).startsWith('hardness:')?find(scene,landing.obstacle):null;
  if(!other)return t('blocked');
  if(other.inventoryHidden)return t('occupiedHidden')+' '+(other.label||other.type)+'.';
  return t('occupied')+' '+(label(other.id)||other.label||other.type)+'.';
 }
 const fixedPiece=item=>!item||hangsOnWall(item)||item.locked===true;
 function choose(id){
  const next=id==null?null:String(id);if(next===selected)return;
  selected=next;selectedFixed=true;
  if(next)try{selectedFixed=fixedPiece(find(read(),next));}catch{}
  furniture.update();drawBar();emit();
 }

 function drawGrid(scene){
  const key=scene.cols+'x'+scene.rows;if(key===gridKey)return;gridKey=key;
  const at=(col,row)=>{const p=projectMatrixFloor(col,row,scene.cols,scene.rows);return (p.x*1000).toFixed(1)+' '+(p.y*1000).toFixed(1);};
  let path='';
  for(let col=0;col<=scene.cols;col++)path+='M'+at(col,0)+'L'+at(col,scene.rows);
  for(let row=0;row<=scene.rows;row++)path+='M'+at(0,row)+'L'+at(scene.cols,row);
  grid.setAttribute('d',path);
 }
 function drawFloor(){
  const active=!!hold&&!hold.dropped;
  floor.classList.toggle('is-active',active);xray.classList.toggle('is-active',active);
  if(!active){ghostKey='';return;}
  const {scene,item,landing,draft}=hold,target=landing?.target||draft,valid=!!landing?.ok;
  const key=[target.col,target.row,target.rot,valid].join();
  if(key!==ghostKey){
   ghostKey=key;drawGrid(scene);
   const shape=polygon(corners(boxAt(item,target,scene),scene));
   for(const node of [ghost,outline]){node.setAttribute('points',shape);node.dataset.valid=valid?'1':'0';}
   origin.setAttribute('points',polygon(corners(boxAt(item,hold.from,scene),scene)));
  }
  const centre=projectMatrixFloor(draft.centre.col,draft.centre.row,scene.cols,scene.rows);
  spot.setAttribute('cx',(centre.x*1000).toFixed(1));spot.setAttribute('cy',(centre.y*1000).toFixed(1));
 }
 function pulse(item,pose,scene){
  ripple.setAttribute('points',polygon(corners(boxAt(item,pose,scene),scene)));
  ripple.classList.remove('is-running');void ripple.getBoundingClientRect?.();ripple.classList.add('is-running');
 }
 // Píxeles en pantalla entre dos posiciones del origen de la pieza: lo que hay que animar para que no salte.
 function shift(scene,a,b){
  const rect=room(),p=projectMatrixFloor(a.col,a.row,scene.cols,scene.rows),q=projectMatrixFloor(b.col,b.row,scene.cols,scene.rows);
  return {x:(p.x-q.x)*rect.width,y:(p.y-q.y)*rect.height};
 }
 function drawBar(){
  const piece=selected&&!hold&&!motion?furniture.piece(selected):null;
  if(!piece?.rect){bar.hidden=true;if(selected&&!hold&&!motion&&!piece){selected=null;emit();}return;}
  const rect=piece.rect,area=stage(),fixed=selectedFixed;
  name.textContent=label(selected)+(fixed?' · '+t('fixedTag'):'');
  turnButton.hidden=fixed;turnButton.textContent='⟳ '+t('turn');turnButton.title=t('turn')+' (R)';
  undoButton.hidden=!history.length;undoButton.textContent='↶ '+t('undo');undoButton.title=t('undo')+' (Ctrl/⌘+Z)';
  bar.hidden=false;
  const width=bar.offsetWidth||0,height=bar.offsetHeight||0;
  const left=clamp((rect.left+rect.right)/2-area.left-width/2,8,area.width-width-8),top=clamp(rect.top-area.top-height-12,8,area.height-height-8);
  bar.style.transform=`translate(${Math.round(left)}px,${Math.round(top)}px)`;
 }
 function setCursor(){container.dataset.liftCursor=hold?'grabbing':hover&&!busy?'grab':'';}

 // ── Coger, llevar, girar y soltar ──────────────────────────────────────────────────────────────
 // `now` es dónde está ya el puntero; la pieza se coge por donde se pulsó, así que alcanza la mano al despegar.
 function begin(now){
  const start=press;press=null;
  let token=null,scene;
  try{token=bridge.begin();scene=read();}catch{if(token)bridge.end(token);refuse(start.id,t('room'));return;}
  const item=find(scene,start.id);
  if(fixedPiece(item)){bridge.end(token);if(item){choose(start.id);refuse(String(start.id),label(start.id)+' '+t('fixed'));}return;}
  const from=furniturePose(item),box=footprintAt(item,from.rot,scene.footprints),centre={col:from.col+box.col,row:from.row+box.row};
  const anchor=projectMatrixFloor(centre.col,centre.row,scene.cols,scene.rows);
  hold={id:String(start.id),pointerId:start.pointerId,token,scene,item,from,rot:turn(from.rot),grab:{x:start.x-anchor.x,y:start.y-anchor.y},pointer:{x:now.x,y:now.y},
   draft:{col:from.col,row:from.row,rot:turn(from.rot),centre},landing:null,landingKey:'',dropped:false};
  motion={id:hold.id,phase:'held',started:clock(),base:0,from:{x:0,y:0},tilt:0,turned:0,speed:0,seen:{x:now.x,at:clock()},calm:!!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches};
  selected=hold.id;selectedFixed=false;hover=null;blocking=null;suppressClick=true;
  try{container.setPointerCapture?.(start.pointerId);}catch{}
  if(!hinted){hinted=true;say(t('hint'));}
  setCursor();carry();furniture.update();emit();
 }
 // Una vez por fotograma mientras la pieza está en la mano: del puntero a la casilla y de la casilla al hueco.
 function carry(){
  if(!hold||hold.dropped)return;
  const {scene,item}=hold,floorPoint=unprojectMatrixFloor(hold.pointer.x-hold.grab.x,hold.pointer.y-hold.grab.y,scene.cols,scene.rows);
  hold.draft=poseAtCentre(item,floorPoint,hold.rot,scene);
  const key=[snap(hold.draft.col,LIFT_STEP),snap(hold.draft.row,LIFT_STEP),hold.rot].join();
  if(key!==hold.landingKey){
   hold.landingKey=key;hold.landing=findLanding(scene,hold.id,hold.draft,{from:hold.from});
   blocking=hold.landing.ok?null:String(hold.landing.obstacle||'').startsWith('hardness:')?null:hold.landing.obstacle||null;
  }
  // Inercia: la pieza se inclina contra el movimiento y vuelve a la vertical al parar.
  const now=clock(),elapsed=Math.max(1,now-motion.seen.at),rect=room();
  const velocity=(hold.pointer.x-motion.seen.x)*rect.width/elapsed;
  motion.speed+=(velocity-motion.speed)*.25;motion.seen={x:hold.pointer.x,at:now};
  motion.tilt+=(clamp(-motion.speed*5.5,-6,6)-motion.tilt)*.18;
 }
 function rotate(step=1){
  if(!hold||hold.dropped)return;
  hold.rot=turn(hold.rot+step);hold.landingKey='';motion.turned=clock();carry();furniture.update();
 }
 function release(){
  try{if(hold)container.releasePointerCapture?.(hold.pointerId);}catch{}
 }
 // Deja la pieza en `pose` animando desde donde se ve ahora, y termina la edición.
 function settle(pose,phase='settling'){
  const {scene,item,token}=hold,frame=liftFrame(motion,clock()),travel=shift(scene,hold.draft,pose);
  hold.dropped=true;hold.draft={...pose,centre:hold.draft.centre};
  motion={...motion,phase,started:clock(),base:Math.max(0,frame.lift),from:{x:travel.x+frame.x,y:travel.y+frame.y},tilt:frame.tilt,turned:0,
   end(){bridge.end(token);hold=null;blocking=null;setCursor();emit();},impact:()=>pulse(item,pose,scene)};
  blocking=null;release();drawFloor();setCursor();furniture.update();
 }
 async function drop(){
  if(!hold||hold.dropped||busy)return;
  carry();
  const landing=hold.landing,id=hold.id,from=hold.from,title=label(id);
  if(!landing?.ok){say(why(landing,hold.scene),'warn');settle(from);return;}
  const target=landing.position;
  if(samePlace(target,from)){settle(from);return;}
  busy=true;hold.dropped=true;drawFloor();
  try{
   await bridge.place({roomId:hold.scene.roomId,id,from,col:target.col,row:target.row,rot:target.rot,signal:controls.signal});
   if(disposed||!hold)return;
   history.push({id,from:{col:from.col,row:from.row,rot:turn(from.rot)},to:{col:target.col,row:target.row,rot:turn(target.rot)}});if(history.length>HISTORY)history.shift();
   hold.dropped=false;settle(target);
   say(title+' · '+t(turn(target.rot)!==turn(from.rot)&&target.col===from.col&&target.row===from.row?'turned':'placed')+' · ⌘Z '+t('undo').toLowerCase(),'ok');
  }catch(error){
   if(disposed)return;
   hold.dropped=false;say(['room','changed'].includes(error?.message)?t(error.message):t('save'),'warn');settle(from);
  }finally{busy=false;}
 }
 function cancel(){if(!hold||hold.dropped||busy)return;settle(hold.from);}
 // Mover o girar sin arrastrar (teclado, barra, deshacer): un salto corto hasta el destino.
 async function relocate(id,change,{reach=0,undo=false}={}){
  if(busy||hold||motion||disposed)return false;
  let token=null,scene;
  try{token=bridge.begin();scene=read();}catch{if(token)bridge.end(token);say(t('room'),'warn');return false;}
  const item=find(scene,id);
  if(fixedPiece(item)){bridge.end(token);if(item)refuse(String(id),label(id)+' '+t('fixed'));return false;}
  const from=furniturePose(item),pose=change(item,from,scene);
  if(!pose){bridge.end(token);return false;}
  const landing=reach>0?findLanding(scene,id,pose,{from,reach}):{...validateFurniturePlacement(scene,id,pose,{from}),target:pose};
  if(!landing.ok||samePlace(landing.position,from)){
   bridge.end(token);
   if(!landing.ok)refuse(String(id),why(landing,scene));
   return false;
  }
  busy=true;
  try{
   const target=landing.position;
   await bridge.place({roomId:scene.roomId,id,from,col:target.col,row:target.row,rot:target.rot,signal:controls.signal});
   if(disposed){bridge.end(token);return true;}
   if(!undo){history.push({id:String(id),from:{col:from.col,row:from.row,rot:turn(from.rot)},to:{col:target.col,row:target.row,rot:turn(target.rot)}});if(history.length>HISTORY)history.shift();}
   const travel=shift(scene,from,target),turned=turn(target.rot)!==turn(from.rot);
   motion={id:String(id),phase:'hop',started:clock(),base:0,from:travel,tilt:0,turned:turned?clock():0,end(){bridge.end(token);emit();},impact:()=>pulse(item,target,scene)};
   selected=String(id);selectedFixed=false;furniture.update();
   say(undo?t('undone')+' · '+label(id):label(id)+' · '+t(turned?'turned':'moved'),'ok');
   return true;
  }catch(error){bridge.end(token);if(!disposed)say(['room','changed'].includes(error?.message)?t(error.message):t('save'),'warn');return false;}
  finally{busy=false;}
 }
 const nudge=(id,dc,dr)=>relocate(id,(item,from)=>({col:snap(from.col,LIFT_STEP)+dc*LIFT_STEP,row:snap(from.row,LIFT_STEP)+dr*LIFT_STEP,rot:turn(from.rot)}));
 // Gira sobre el centro de su huella; si así no cabe, busca el hueco más cercano.
 const spin=(id,step=1)=>relocate(id,(item,from,scene)=>{
  const before=footprintAt(item,from.rot,scene.footprints),pose=poseAtCentre(item,{col:from.col+before.col,row:from.row+before.row},turn(from.rot)+step,scene);
  return {col:pose.col,row:pose.row,rot:pose.rot};
 },{reach:LIFT_REACH});
 async function undo(){
  if(busy||hold||motion)return false;
  const last=history.at(-1);if(!last){say(t('nothing'));return false;}
  // Sala no disponible (mudanza, otro Xpacio): el paso se conserva para cuando vuelva.
  let scene;try{scene=read();}catch{say(t('room'),'warn');return false;}
  const current=find(scene,last.id);
  // Si la pieza ya no está donde la dejó este gesto, ese paso no se puede deshacer con seguridad.
  if(!current||!samePlace(furniturePose(current),last.to)){history.pop();say(t('changed'),'warn');drawBar();return false;}
  const done=await relocate(last.id,()=>({...last.from}),{undo:true});
  if(done)history.pop();
  return done;
 }

 // ── Puntero y teclado ──────────────────────────────────────────────────────────────────────────
 container.addEventListener('pointerdown',event=>{
  if(disposed||busy||hold||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
  if(event.target.closest?.('.furniture-lift-bar'))return;
  suppressClick=false;
  const id=furniture.pick(event.clientX,event.clientY);
  if(!id){choose(null);press=null;return;}
  press={id,pointerId:event.pointerId,...point(event),clientX:event.clientX,clientY:event.clientY,slop:event.pointerType==='touch'?DRAG_SLOP*2:DRAG_SLOP};
 },options);
 container.addEventListener('pointermove',event=>{
  if(disposed)return;
  // Un ratón o un lápiz que se mueve sin estar pulsado ya soltó, aunque ese «soltar» no llegara (menú contextual,
  // botón liberado fuera de la escena o en otra ventana): ni se levanta nada ni se sigue llevando. Un dedo sólo
  // se mueve mientras toca.
  const released=event.pointerType!=='touch'&&!(event.buttons&1);
  if(hold){
   if(event.pointerId!==hold.pointerId||hold.dropped)return;
   if(released)cancel();else hold.pointer=point(event);
   return;
  }
  if(press&&event.pointerId===press.pointerId){
   if(released)press=null;
   else{if(Math.hypot(event.clientX-press.clientX,event.clientY-press.clientY)>=press.slop&&!motion&&!busy)begin(point(event));return;}
  }
  if(event.pointerType==='touch'||motion)return;
  const id=event.target.closest?.('.furniture-lift-bar')?null:furniture.pick(event.clientX,event.clientY);
  if(id!==hover){hover=id;setCursor();furniture.update();}
 },options);
 const finish=event=>{
  if(disposed)return;
  if(hold&&event.pointerId===hold.pointerId){if(event.type==='pointerup')void drop();else cancel();return;}
  if(press&&event.pointerId===press.pointerId){
   const id=press.id;press=null;
   if(event.type==='pointerup')choose(id);
  }
 };
 container.addEventListener('pointerup',finish,options);
 container.addEventListener('pointercancel',finish,options);
 container.addEventListener('lostpointercapture',event=>{if(hold&&event.pointerId===hold.pointerId&&!hold.dropped&&!busy)cancel();},options);
 container.addEventListener('pointerleave',()=>{if(hover&&!hold){hover=null;setCursor();furniture.update();}},options);
 // El clic que el navegador emite al soltar un arrastre no debe elegir otra pieza.
 container.addEventListener('click',event=>{
  if(suppressClick){suppressClick=false;event.stopPropagation();event.preventDefault();return;}
  // Clic de teclado (Intro o espacio sobre la pieza enfocada): la elige igual que el puntero.
  if(event.detail===0){const id=event.target.closest?.('.matrix-furniture-item[data-instance-id]')?.dataset.instanceId;if(id)choose(id);}
 },{capture:true,signal:controls.signal});
 container.addEventListener('dragstart',event=>event.preventDefault(),options);
 container.addEventListener('wheel',event=>{
  if(!hold||hold.dropped)return;
  event.preventDefault();
  if(clock()-wheelAt<240||!event.deltaY)return;wheelAt=clock();rotate(event.deltaY>0?1:-1);
 },{passive:false,signal:controls.signal});
 container.addEventListener('contextmenu',event=>{if(hold)event.preventDefault();else press=null;},options);
 // Teclado: en la ventana y en captura, porque no todos los navegadores dan el foco a la pieza al pulsarla y porque
 // con una pieza elegida las flechas son suyas, no del personaje. Nunca mientras se escribe en un campo.
 win.addEventListener('keydown',event=>{
  if(disposed||event.altKey||event.defaultPrevented)return;
  const target=event.target,key=event.key,meta=event.metaKey||event.ctrlKey;
  if(target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"]'))return;
  const own=()=>{event.preventDefault();event.stopImmediatePropagation();};
  const turnKey=key==='r'||key==='R';
  // Con una pieza en el aire, posándose o guardándose, Escape y R son suyos: nunca cierran la vista por debajo.
  if(hold||motion){
   if(key!=='Escape'&&!turnKey)return;
   own();
   if(!hold||hold.dropped||busy)return;
   if(key==='Escape')cancel();else if(!event.repeat)rotate(event.shiftKey?-1:1);
   return;
  }
  if(meta){if((key==='z'||key==='Z')&&!event.shiftKey&&history.length){own();void undo();}return;}
  if(!selected)return;
  const step={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[key];
  if(step){own();if(!selectedFixed)void nudge(selected,step[0],step[1]);}
  else if(turnKey){own();if(!selectedFixed&&!event.repeat)void spin(selected,event.shiftKey?-1:1);}
  else if(key==='Escape'){own();choose(null);}
 },{capture:true,signal:controls.signal});
 turnButton.addEventListener('click',event=>{event.stopPropagation();if(selected)void spin(selected,1);},options);
 undoButton.addEventListener('click',event=>{event.stopPropagation();void undo();},options);
 for(const type of ['pointerdown','pointerup','dblclick'])bar.addEventListener(type,event=>event.stopPropagation(),options);

 const api={
  // matrix-furniture.mjs pregunta en cada fotograma: dónde está la pieza en el aire y cómo se enseña cada una.
  decorate(scene){
   if(disposed)return scene;
   if(hold&&!hold.dropped)carry();
   if(motion&&!hold){
    // Salto sin arrastre: la pieza ya está guardada en su destino; sólo se anima.
    if(liftFrame(motion,clock()).done){const ended=motion;motion=null;ended.impact?.();ended.end?.();}
   }else if(motion&&hold?.dropped&&motion.phase!=='held'&&liftFrame(motion,clock()).done){const ended=motion;motion=null;ended.impact?.();ended.end?.();}
   drawFloor();drawBar();
   const draft=hold?.draft;if(!draft)return scene;
   const id=hold.id;
   return {...scene,layout:scene.layout.map(item=>String(item.id)===id?{...item,col:draft.col,row:draft.row,rot:draft.rot}:item)};
  },
  present(placement){
   const id=placement.id;
   if(motion&&id===motion.id){
    const frame=liftFrame(motion,clock()),height=room().height*LIFT_HEIGHT;
    return {state:frame.state,pose:{x:frame.x,y:frame.y-frame.lift*height,floorY:frame.y,tilt:frame.tilt,sx:frame.sx,sy:frame.sy,lift:Math.max(0,Math.min(1,frame.lift)),front:frame.front}};
   }
   if(id===blocking)return {state:'blocking'};
   if(id===refused&&clock()<refusedUntil)return {state:'refused'};
   if(id===selected)return {state:'selected'};
   if(id===hover)return {state:'hover'};
   return null;
  },
  live:()=>!disposed&&(!!hold||!!motion),
  state:()=>({selected,hover,holding:hold?hold.id:null,busy,canUndo:history.length>0,landing:hold?.landing?{ok:!!hold.landing.ok,reason:hold.landing.reason||'',nudged:!!hold.landing.nudged,...hold.landing.target}:null}),
  select:choose,
  nudge:(dc,dr,id=selected)=>id?nudge(id,dc,dr):Promise.resolve(false),
  turn:(step=1,id=selected)=>id?spin(id,step):Promise.resolve(false),
  // Para la consola y las pruebas: lleva una pieza a una casilla con el mismo gesto validado.
  move:(id,col,row,rot)=>relocate(id,(item,from)=>({col,row,rot:rot===undefined?turn(from.rot):turn(rot)})),
  undo,cancel,
  dispose(){
   if(disposed)return;disposed=true;win.clearTimeout(toastTimer);release();controls.abort();
   // Una edición abierta se cierra una sola vez: la del gesto que se estaba posando, o la de la pieza en la mano.
   const finish=motion?.end,token=hold?.token;motion=null;hold=null;press=null;
   try{if(finish)finish();else if(token)bridge.end(token);}catch{}
   delete container.dataset.liftCursor;
   floor.remove();xray.remove();bar.remove();toast.remove();
  }
 };
 return api;
}
