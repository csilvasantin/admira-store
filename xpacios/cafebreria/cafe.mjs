import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {GLTFLoader} from '../../admira-xp/scripts/vendor/GLTFLoader.mjs';
import {createLifeRenderer} from '../../admira-xp/scripts/life-renderer.mjs?v=cafebreria-1';
import {createLifeScene} from '../../admira-xp/scripts/life-scene.mjs?v=cafebreria-street-1';
import {buildShelf,mountCapsulas} from '../../inventario/cafebreria/capsulas.mjs?v=cafebreria-1';
import {attachFloatingPanel,mountFloatingPanelMenu} from '../../admira-xp/scripts/floating-panels.mjs?v=floating-panels-1';
const en=new URLSearchParams(location.search).get('lang')==='en';document.documentElement.lang=en?'en':'es';
const abort=new AbortController(),{signal}=abort,host=document.querySelector('#cafe-stage'),canvas=host.querySelector('canvas'),status=document.querySelector('#cafe-status'),welcome=document.querySelector('#cafe-welcome'),bookList=document.querySelector('#cafe-books');
if(en){
 document.title='Cafebrería · Coffee, books and music · XpaceOS';
 canvas.setAttribute('aria-label','3D Cafebrería: drag to orbit, scroll to zoom');
 status.textContent='Entering Cafebrería…';
 welcome.querySelector('.eyebrow').textContent='COFFEE · BOOKS · MUSIC';
 welcome.querySelector('h1').textContent='A pause with stories.';
 welcome.querySelector('h1 + p').textContent='Walnut, coffee and a bookcase to explore.';
 welcome.querySelector('button').textContent='Explore bookcase';
 const link=welcome.querySelector('a');link.textContent='View ITIL piece 51 ↗';link.href='/inventario/?asset=51&quality=best&lang=en#mostrador';
 bookList.setAttribute('aria-label','Books on the bookcase');
}
let viewer,capsules,raf=0,observer,root,menus;
const floats=[],on=(el,event,fn)=>el?.addEventListener(event,fn,{signal});
const release=node=>{const resources=new Set();node?.traverse(n=>{if(n.geometry)resources.add(n.geometry);for(const m of [n.material].flat().filter(Boolean)){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});for(const r of resources)r.dispose();};
on(window,'pagehide',()=>{abort.abort();cancelAnimationFrame(raf);observer?.disconnect();menus?.dispose();floats.forEach(f=>f.dispose());viewer?.dispose();release(root);});
try{
 const [r,m]=await Promise.all([fetch('/inventario/cafebreria/scene.glb',{signal}),fetch('/inventario/cafebreria/scene.inventory.json',{signal})]);if(!r.ok||!m.ok)throw Error('Escena no disponible');const bytes=await r.arrayBuffer(),manifest=await m.json(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(!manifest.glbSha256.includes(hash))throw Error('La escena no coincide con su inventario');
 const gltf=await new GLTFLoader().parseAsync(bytes,location.origin+'/inventario/cafebreria/scene.glb');root=gltf.scene;root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());root.position.sub(box.min);root.updateMatrixWorld(true);
 const nodes=new Map();root.traverse(n=>{const i=gltf.parser.associations.get(n)?.nodes;if(i!==undefined)nodes.set(i,n);if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
 const row=manifest.items.find(r=>r.runtime?.builder==='estanteria-libros'),mat=name=>{let found;root.traverse(n=>{for(const m of [n.material].flat())if(m?.name===name)found=m;});return found;},shelf=buildShelf(row,{nogal:mat('MAT_nogal'),laton:mat('MAT_laton')}),anchor=nodes.get(manifest.items.find(r=>r.id===row.runtime.junto).node),anchorBox=new T.Box3().setFromObject(anchor);shelf.position.set((anchorBox.min.x+anchorBox.max.x)/2,anchorBox.min.y+row.runtime.alturaSuelo,anchorBox.min.z+.012);root.attach(shelf);shelf.userData.item={id:row.id,type:'cafebreriaLibrary'};
 const entries=[{...row,object:shelf},...manifest.items.filter(r=>r.contenido).map(r=>({...r,object:nodes.get(r.node)}))];
 capsules=mountCapsulas({scene:root,entries,signal});viewer=createLifeRenderer({canvas,snapshot:{cols:size.x,rows:size.z,wallHeight:size.y,layout:[],actors:[],moving:true},stockCamera:true,sceneFactory:(snapshot,options)=>{const s=createLifeScene(snapshot,{...options,inventory:true,surroundings:true,exteriorY:.44});s.world.add(root);return s;},onSelect:data=>{if(data?.item?.id===row.id)explore();}});viewer.preset('home');capsules.setViewer(viewer);capsules.attachUI({stage:host,canvas,on});
 function explore(){welcome.hidden=true;capsules.enterDetail();bookList.hidden=false;bookWindow.restore();}
 const welcomeWindow=attachFloatingPanel(welcome,{label:'Cafebrería',onClose:()=>welcome.hidden=true,onOpen:()=>welcome.hidden=false,bounds:host,key:'cafebreria-welcome',menu:true});floats.push(welcomeWindow);
 const bookWindow=attachFloatingPanel(bookList,{label:en?'Books · shelf contents':'Libros · contenido de la librería',onClose:()=>bookList.hidden=true,onOpen:explore,bounds:host,key:'cafebreria-books',menu:true});floats.push(bookWindow);
 observer=new ResizeObserver(()=>viewer.resize(host.clientWidth,host.clientHeight));observer.observe(host);viewer.resize(host.clientWidth,host.clientHeight);
 function tick(now){if(signal.aborted)return;viewer.render(now);raf=requestAnimationFrame(tick);}tick(performance.now());
 await capsules.ready;bookList.replaceChildren(bookWindow.handle);for(const b of capsules.state.books){const button=document.createElement('button');button.textContent=b.libro;const author=document.createElement('small');author.textContent=b.autor||b.consejero;button.append(author);on(button,'click',()=>capsules.openBook(b.id));bookList.append(button);}if(capsules.state.error)status.textContent=capsules.state.error;else status.hidden=true;
 const setup=()=>{on(document.querySelector('#cafe-explore'),'click',explore);on(document.querySelector('#cafe-library'),'click',explore);on(document.querySelector('#cafe-home'),'click',()=>{capsules.exitDetail();bookList.hidden=true;viewer.preset('home');});for(const [id,preset]of [['cafe-front','front'],['cafe-plan','floor']])on(document.getElementById(id),'click',()=>viewer.preset(preset));for(const [id,light]of [['cafe-day','day'],['cafe-evening','sunset'],['cafe-night','night']])on(document.getElementById(id),'click',()=>viewer.setLighting(light));menus=mountFloatingPanelMenu(document.querySelector('#xsAdvanced .xs-actions'));window.XpaceShell.registerVerb({id:'libreria',aliases:['bookcase'],es:'Explorar la librería interactiva',en:'Explore the interactive bookcase',run:()=>{explore();return en?'Bookcase · piece 51':'Librería · pieza 51';}});};if(window.XpaceShell?.registerVerb)setup();else on(document,'xpace:shell-ready',setup);
 if(new URLSearchParams(location.search).get('ver')==='estanteria-libros')explore();
 host.dataset.ready='true';
}catch(error){status.hidden=false;status.textContent=(en?'Unable to recover the café: ':'No se pudo recuperar la cafetería: ')+error.message;}
