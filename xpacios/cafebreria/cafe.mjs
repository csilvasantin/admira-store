import {groundCafe} from './grounding.mjs?v=cafe-grounding-1';
import {loadPixeriaFurniture} from '../../admira-xp/scripts/pixeria-furniture.mjs';
import {bindImportedObjects,createImportedBridge} from '../../admira-xp/scripts/imported-space.mjs?v=cafe-grounding-1';
import {mountDistribuit} from '../../admira-xp/scripts/distribuit-ui.mjs?v=20261003-panels-2';
import {mountCafeInventory} from './inventory-panel.mjs?v=20261003-panels-2';
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {GLTFLoader} from '../../admira-xp/scripts/vendor/GLTFLoader.mjs';
import {createLifeRenderer} from '../../admira-xp/scripts/life-renderer.mjs?v=cafe-editor-1';
import {createLifeScene} from '../../admira-xp/scripts/life-scene.mjs?v=cafebreria-street-1';
import {buildShelf,mountCapsulas} from '../../inventario/cafebreria/capsulas.mjs?v=20261003-panels-2';
import {attachFloatingPanel,mountFloatingPanelMenu} from '../../admira-xp/scripts/floating-panels.mjs?v=20261003-expert-1';
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
let viewer,capsules,raf=0,observer,root,menus,editor,inventory,bridge,bound;
const floats=[],on=(el,event,fn)=>el?.addEventListener(event,fn,{signal});
const release=node=>{const resources=new Set();node?.traverse(n=>{if(n.geometry)resources.add(n.geometry);for(const m of [n.material].flat().filter(Boolean)){resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);}});for(const r of resources)r.dispose();};
on(window,'pagehide',()=>{editor?.dispose();inventory?.dispose();bridge?.dispose();abort.abort();cancelAnimationFrame(raf);observer?.disconnect();menus?.dispose();floats.forEach(f=>f.dispose());viewer?.dispose();release(root);});
try{
 const [r,m]=await Promise.all([fetch('/inventario/cafebreria/scene.glb',{signal}),fetch('/inventario/cafebreria/scene.inventory.json',{signal})]);if(!r.ok||!m.ok)throw Error('Escena no disponible');const bytes=await r.arrayBuffer(),manifest=await m.json(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(!manifest.glbSha256.includes(hash))throw Error('La escena no coincide con su inventario');
 const gltf=await new GLTFLoader().parseAsync(bytes,location.origin+'/inventario/cafebreria/scene.glb');root=gltf.scene;
 const nodes=new Map();root.traverse(n=>{const i=gltf.parser.associations.get(n)?.nodes;if(i!==undefined)nodes.set(i,n);if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
 const grounding=groundCafe(root,nodes,manifest),{size}=grounding;
 const row=manifest.items.find(r=>r.runtime?.builder==='estanteria-libros'),mat=name=>{let found;root.traverse(n=>{for(const m of [n.material].flat())if(m?.name===name)found=m;});return found;},shelf=buildShelf(row,{nogal:mat('MAT_nogal'),laton:mat('MAT_laton')}),anchor=nodes.get(manifest.items.find(r=>r.id===row.runtime.junto).node),anchorBox=new T.Box3().setFromObject(anchor);shelf.position.set((anchorBox.min.x+anchorBox.max.x)/2,anchorBox.min.y+row.runtime.alturaSuelo,anchorBox.min.z+.012);root.attach(shelf);
 const entries=[{...row,object:shelf},...manifest.items.filter(r=>r.contenido).map(r=>({...r,object:nodes.get(r.node)}))];
 const allEntries=manifest.items.map(entry=>({...entry,object:entry.id===row.id?shelf:nodes.get(entry.node)}));
 bound=bindImportedObjects(root,allEntries);
 bridge=createImportedBridge({roomId:'cafebreria',cols:size.x,rows:size.z,layout:bound.layout,onImport:(item,model)=>bound.add(item,model),onSave:next=>{bound.apply(next.layout);inventory?.refresh();}});
 for(const item of bridge.read().layout.filter(i=>i.source==='PixerIA')){try{bound.add(item,await loadPixeriaFurniture(item));}catch{status.textContent=(en?'An imported object could not load: ':'No se pudo cargar un objeto importado: ')+item.label;}}
 bound.apply(bridge.read().layout);
 capsules=mountCapsulas({scene:root,entries,signal,isEditing:()=>!!editor});viewer=createLifeRenderer({canvas,snapshot:{...bridge.read(),wallHeight:size.y,actors:[],moving:true},stockCamera:true,sceneFactory:(snapshot,options)=>{const s=createLifeScene({...snapshot,...grounding.street,layout:[]},{...options,inventory:true,surroundings:true,exteriorY:.44});grounding.placeStreet(s.scene);s.world.add(root);const update=s.update;let current=snapshot;s.update=next=>{current=next;update({...next,...grounding.street,layout:[]});grounding.placeStreet(s.scene);if(root.parent!==s.world)s.world.add(root);bound.apply(next.layout);};Object.defineProperty(s,'snapshot',{get:()=>({...current,layout:bridge.read().layout}),configurable:true});return s;},onSelect:data=>{if(editor){editor.select(data);return;}if(data?.item){inventory.open(data.item.id);}}});viewer.preset('home');capsules.setViewer(viewer);capsules.attachUI({stage:host,canvas,on});
 function explore(){closeEditor();welcome.hidden=true;capsules.enterDetail();bookList.hidden=false;bookWindow.restore();}
 const welcomeWindow=attachFloatingPanel(welcome,{label:'Cafebrería',onClose:()=>welcome.hidden=true,onOpen:()=>welcome.hidden=false,bounds:host,key:'cafebreria-welcome',menu:true});floats.push(welcomeWindow);
 const bookWindow=attachFloatingPanel(bookList,{label:en?'Books · shelf contents':'Libros · contenido de la librería',onClose:()=>bookList.hidden=true,onOpen:explore,bounds:host,key:'cafebreria-books',menu:true});floats.push(bookWindow);
 observer=new ResizeObserver(()=>viewer.resize(host.clientWidth,host.clientHeight));observer.observe(host);viewer.resize(host.clientWidth,host.clientHeight);
 function tick(now){if(signal.aborted)return;viewer.render(now);raf=requestAnimationFrame(tick);}tick(performance.now());
 await capsules.ready;bookList.replaceChildren(bookWindow.handle);for(const b of capsules.state.books){const button=document.createElement('button');button.textContent=b.libro;const author=document.createElement('small');author.textContent=b.autor||b.consejero;button.append(author);on(button,'click',()=>capsules.openBook(b.id));bookList.append(button);}if(capsules.state.error)status.textContent=capsules.state.error;else status.hidden=true;
 function closeEditor(){editor?.dispose();editor=null;}
 function openEditor(id){const workspace=window.XpaceShell?.expertWorkspace;if(window.XpaceShell?.state?.().expert&&!['editor','pixerai'].includes(workspace?.selected))workspace?.select('editor');capsules.exitDetail({reset:false});bookList.hidden=true;welcome.hidden=true;if(!editor)editor=mountDistribuit({dialog:host,viewer,bridge,onClose:closeEditor});if(id){editor.select({item:{id}});viewer.selectItem(id);}return true;}
 inventory=mountCafeInventory({host,manifest,bridge,bindings:bound.bindings,signal,onSelect:id=>{viewer.selectItem(id);const object=bound.bindings.get(id)?.group;if(object)viewer.frameObject(object,{margin:2});},onEdit:openEditor});
 on(host,'keydown',event=>{if(editor?.keydown(event))return;if(event.target!==canvas)return;if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();viewer.rotate(event.key==='ArrowLeft'?1:-1);}if(['+','=','-'].includes(event.key)){event.preventDefault();viewer.zoomBy(event.key==='-'?.88:1.14);}if(event.key==='Home')viewer.preset('home');});
 const openInventory=id=>{const workspace=window.XpaceShell?.expertWorkspace;if(window.XpaceShell?.state?.().expert&&!['inventory','itil'].includes(workspace?.selected))workspace?.select('inventory');welcome.hidden=true;inventory.open(id);};
 const setup=()=>{on(document.querySelector('#cafe-explore'),'click',explore);on(document.querySelector('#cafe-library'),'click',explore);on(document.querySelector('#cafe-home'),'click',()=>{closeEditor();capsules.exitDetail();bookList.hidden=true;viewer.preset('home');});for(const [id,preset]of [['cafe-front','front'],['cafe-plan','floor']])on(document.getElementById(id),'click',()=>viewer.preset(preset));for(const [id,light]of [['cafe-day','day'],['cafe-evening','sunset'],['cafe-night','night']])on(document.getElementById(id),'click',()=>viewer.setLighting(light));for(const id of ['cafe-edit','cafe-edit-advanced'])on(document.getElementById(id),'click',()=>openEditor());for(const id of ['cafe-inventory','cafe-inventory-advanced'])on(document.getElementById(id),'click',()=>openInventory());on(document.getElementById('cafe-home-advanced'),'click',()=>{closeEditor();capsules.exitDetail();bookList.hidden=true;viewer.preset('home');});for(const [id,factor]of [['cafe-zoom-in',1.2],['cafe-zoom-out',1/1.2]])on(document.getElementById(id),'click',()=>viewer.zoomBy(factor));
 for(const verb of [{id:'distribuir',aliases:['distribute','distribuit'],es:'Distribuir los elementos de Cafebrería',en:'Distribute Cafebrería elements',run:args=>{if(/^(off|close|cerrar|salir)$/i.test(String(args||'').trim())){closeEditor();return en?'Editor closed':'Editor cerrado';}openEditor();return en?'Select and drag an element.':'Selecciona y arrastra un elemento.';}},{id:'inventario',aliases:['inventory','itil'],es:'Todos los elementos y sus fichas ITIL',en:'All elements and their ITIL records',run:args=>{openInventory(String(args||'').trim()||null);return en?'Cafebrería ITIL inventory':'Inventario ITIL de Cafebrería';}},{id:'layout',aliases:[],es:'Exportar o restaurar la distribución local',en:'Export or restore the local layout',run:args=>{if(String(args||'').trim()==='factory'){bridge.restore();return en?'Original layout restored':'Distribución original restaurada';}inventory.open();return JSON.stringify(bridge.read().layout);} }])window.XpaceShell.registerVerb(verb);
 menus=mountFloatingPanelMenu(document.querySelector('#xsAdvanced .xs-actions'));window.XpaceShell.registerVerb({id:'libreria',aliases:['bookcase'],es:'Explorar la librería interactiva',en:'Explore the interactive bookcase',run:()=>{explore();return en?'Bookcase · piece 51':'Librería · pieza 51';}});};if(window.XpaceShell?.registerVerb)setup();else on(document,'xpace:shell-ready',setup);
 const params=new URLSearchParams(location.search);if(params.has('inventory'))openInventory(params.get('asset'));if(params.get('edit')==='1')openEditor(params.get('asset'));if(params.get('asset')&&bound.bindings.has(params.get('asset')))inventory.open(params.get('asset'));
 if(new URLSearchParams(location.search).get('ver')==='estanteria-libros')explore();
 host.dataset.ready='true';
}catch(error){status.hidden=false;status.textContent=(en?'Unable to recover the café: ':'No se pudo recuperar la cafetería: ')+error.message;}
