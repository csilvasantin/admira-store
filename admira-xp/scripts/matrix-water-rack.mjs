import {WATER_INITIAL,WATER_MODEL,WATER_ITIL,occupiedWaterSlots,waterRemaining} from './pos-water.mjs?v=water-2';
import {POS_PRODUCTS} from './pos-basket.mjs?v=water-2';
// The live pile uses the existing ITIL meshes; the original 19-piece visual filling
// is left intact in the catalogue. Only this local POS composition starts at 13.
export function mountWaterRack(surface,{onReady=()=>{},onFocus=()=>{}}={}){
 const doc=surface.ownerDocument,win=doc.defaultView,root=doc.createElement('div'),label=doc.createElement('button'),pile=doc.createElement('div');root.className='matrix-water-rack';root.dataset.itil=WATER_ITIL;label.className='matrix-water-count';label.type='button';label.addEventListener('click',onFocus);pile.className='matrix-water-pile';root.append(pile,label);surface.append(root);
 let dead=false,renderer,scene,camera,groups=[],buttons=[],detach=[],basket={lines:[]},held=null,editing=false,ready=false;
 function sync(next=basket,picked=held,disabled=editing){basket=next;held=picked;editing=disabled;const used=occupiedWaterSlots(basket),en=doc.documentElement.lang==='en',remaining=waterRemaining(basket);label.textContent=remaining+(en?' bottles · Water':' botellas · Agua');root.dataset.remaining=remaining;for(let i=0;i<groups.length;i++){const visible=!used.includes(i)&&held!==i;groups[i].visible=visible;buttons[i].hidden=used.includes(i)||editing;buttons[i].disabled=editing;buttons[i].setAttribute('aria-label',(en?'Pick up water bottle ':'Coger botella de agua ')+(i+1)+(en?' and take it to the register':' y llevarla al TPV'));}if(renderer)renderer.render(scene,camera);}
 async function load(){try{
  const [T,{GLTFLoader}]=await Promise.all([import('./premium-three.mjs'),import('./vendor/GLTFLoader.mjs')]);if(dead)return;
  const model=(await new GLTFLoader().loadAsync(WATER_MODEL)).scene;if(dead)return;
  renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(440,350);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x000000,0);pile.prepend(renderer.domElement);
  scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x394457,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-1,2,2);scene.add(light);
  camera=new T.OrthographicCamera(-.245,.245,.195,-.195,.01,10);camera.position.set(.04,1.5,.9);camera.lookAt(0,.705,0);camera.updateMatrixWorld();
  model.traverse(o=>{if(!o.isMesh&&o.userData.bottle_instance)groups.push(o);});groups.sort((a,b)=>a.userData.bottle_instance.localeCompare(b.userData.bottle_instance));groups.slice(WATER_INITIAL).forEach(o=>o.removeFromParent());groups=groups.slice(0,WATER_INITIAL);
  if(groups.length!==WATER_INITIAL)throw Error('ITIL bottle composition');
  const positions=[[0,0],...Array.from({length:5},(_,i)=>[.075*Math.cos(i*Math.PI*2/5),.075*Math.sin(i*Math.PI*2/5)]),...Array.from({length:7},(_,i)=>[.148*Math.cos(i*Math.PI*2/7+.2),.148*Math.sin(i*Math.PI*2/7+.2)])];
  groups.forEach((o,i)=>{o.position.x=positions[i][0];o.position.z=positions[i][1];});
  // Keep the top wire basket from ITIL; the photographed stand remains below it.
  model.traverse(o=>{if(o.isMesh&&!o.userData.bottle_instance){const box=new T.Box3().setFromObject(o);o.visible=box.max.y>=.58&&box.max.y<.8;}});
  const base=new T.Mesh(new T.CylinderGeometry(.204,.181,.14,64),new T.MeshStandardMaterial({color:0x080c10,roughness:1}));base.position.y=.66;scene.add(base,model);scene.updateMatrixWorld(true);
  const preview=doc.createElement('img');preview.src=POS_PRODUCTS.water.image;preview.alt='';preview.draggable=false;
  groups.forEach((group,i)=>{const button=doc.createElement('button');button.type='button';button.className='matrix-water-bottle';button.dataset.posProduct='water';button.dataset.waterSlot=i;const position=group.getWorldPosition(new T.Vector3());position.y+=.11;position.project(camera);button.style.left=((position.x+1)*220-24)+'px';button.style.top=((1-position.y)*175-46)+'px';button.style.zIndex=String(20+Math.round(positions[i][1]*100));pile.append(button);buttons.push(button);detach.push(win.XpaceMediaOptions?.attachProduct(button,{...POS_PRODUCTS.water,slot:i,thumbnail:POS_PRODUCTS.water.image},preview));});
  ready=true;sync();onReady();
 }catch{if(!dead){label.textContent=doc.documentElement.lang==='en'?'Water model unavailable · reload':'Modelo de agua no disponible · recarga';root.dataset.error='model';}}}
 void load();
 return {root,sync,get ready(){return ready;},dispose(){dead=true;detach.forEach(fn=>fn?.());renderer?.dispose();scene?.traverse(o=>{o.geometry?.dispose();for(const m of [].concat(o.material||[])){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});root.remove();}};
}
