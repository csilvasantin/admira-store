import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {venueUrl,validAccess} from './central-project-client.mjs';
import {projectContext} from './project-context.mjs';
import {marcaQueLimita,proyectosPermitidos} from './marca-proyectos.mjs';

const code=(await readFile(new URL('./project-selector.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
async function harness({account=false,catalogo=null,marca=null,ventana={}}={}){
 const elements=new Map(),ticks=[],events=new Map(),destinations=[];
 class Element{
  options=[];value='';replacements=0;listeners=new Map();
  replaceChildren(...options){this.options=options;this.replacements++;this.value='';}
  add(option){this.options.push(option);}
  addEventListener(name,handler){this.listeners.set(name,handler);}
  getAttribute(){return 'false';}
  focus(){}
 }
 const element=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const catalog={projects:[{id:'estancos',name:'Estancos',circuit:'estancos'},{id:'cafebreria',name:'Cafebrería',circuit:'cafebreria'}],venues:[{id:'demo-xtanco',project_id:'estancos',name:'Xtanco',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=xtanco'},{id:'demo-cafebreria',project_id:'cafebreria',name:'Cafebrería',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=cafeteria'}]};
 if(catalogo)Object.assign(catalog,catalogo);
 const client={access:account?{token:'a'.repeat(64),expires_at:Date.now()+600000}:null,expired:false,demos:async()=>catalog,context:async()=>catalog,clear(){this.access=null;}};
 const context={URL,Option:class{constructor(text,value){this.text=text;this.value=value;}},ProjectClient:class{constructor(){return client;}},CENTRAL:'https://www.admiranext.com',venueUrl,validAccess,projectContext,marcaQueLimita,proyectosPermitidos,conPuerta:async(venue,href)=>href,
  document:{documentElement:{lang:'en'},getElementById:element,querySelector:()=>null},window:Object.assign({addEventListener:(name,handler)=>events.set(name,handler)},ventana),location:{href:'https://www.admira.store/admira-xp/?autostart=xtanco&from=portada&project=estancos&circuit=estancos&quality=better',assign:url=>destinations.push(url)},sessionStorage:marca?{getItem:k=>marca[k]??null}:{},MutationObserver:class{observe(){}},setInterval:handler=>ticks.push(handler)};
 vm.runInNewContext(code,context);await new Promise(setImmediate);
 return {element,ticks,events,client,destinations};
}
test('unchanged session ticks keep the same options while a user chooses in the open native menu',async()=>{
 const h=await harness(),project=h.element('projectSelector'),venue=h.element('projectVenueSelector');
 const option=project.options[2],venueOption=venue.options[1],projectRenders=project.replacements,venueRenders=venue.replacements;
 // Model the pending native selection before its change event is committed.
 project.value='cafebreria';
 for(let second=0;second<8;second++)h.ticks[0]();
 assert.equal(project.options[2],option);assert.equal(venue.options[1],venueOption);
 assert.equal(project.replacements,projectRenders);assert.equal(venue.replacements,venueRenders);assert.equal(project.value,'cafebreria');
 project.listeners.get('change')();await new Promise(setImmediate);
 assert.equal(new URL(h.destinations[0]).pathname,'/xpacios/cafebreria/');
 assert.equal(new URL(h.destinations[0]).origin,'https://www.admira.store');
});
test('account expiry still clears authorized selections on the timer',async()=>{
 const h=await harness({account:true});assert.ok(h.element('projectSelector').options.length>1);
 h.client.access.expires_at=1;h.ticks[0]();
 assert.equal(h.client.access,null);assert.equal(h.element('projectSelector').options.length,1);
 assert.equal(h.element('projectSelector').disabled,true);assert.match(h.element('projectSelectionStatus').textContent,/expired/);
});

const cuatro={projects:[{id:'starbucks',name:'Starbucks',circuit:'alsea_starbucks'},{id:'altadis',name:'Altadis',circuit:'altadis_bcn'},{id:'estancos',name:'Estancos',circuit:'estancos'},{id:'cafebreria',name:'Cafebrería',circuit:'cafebreria'}],
 venues:[{id:'demo-starbucks',project_id:'starbucks',name:'Paseo de Gràcia 103',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=cafeteria&loc=alsea-sbux-021'},{id:'starbucks-diagonal-634',project_id:'starbucks',name:'Diagonal 634',demo:true,xpace_url:'https://www.admira.store/xpacios/starbucks-centros/?loc=starbucks-diagonal-634'},{id:'altadis-bcn-001',project_id:'altadis',name:'Estanco 1',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=xtanco&loc=altadis-bcn-001'},{id:'demo-xtanco',project_id:'estancos',name:'Xtanco',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=xtanco'},{id:'demo-cafebreria',project_id:'cafebreria',name:'Cafebrería',demo:true,xpace_url:'https://www.xpaceos.com/admira-xp/?autostart=cafeteria'}]};
const proyectos=h=>h.element('projectSelector').options.slice(1).map(o=>o.value);
test('entering with the Starbucks brand (?marca=starbucks) the selector offers only Starbucks',async()=>{
 const h=await harness({catalogo:cuatro,marca:{'mb:marca':'starbucks','mb:manual':'1'}});
 assert.deepEqual(proyectos(h),['starbucks']);
 assert.match(h.element('projectSelectionStatus').textContent,/Starbucks brand: only its projects · \/marca off/);
 assert.equal(h.element('projectSelector').value,'','the open Xtanco scene is not offered as the current project');
 const venue=h.element('projectVenueSelector');
 assert.deepEqual(venue.options.slice(1).map(o=>o.value),['demo-starbucks','starbucks-diagonal-634'],'the venues offered are those of the brand, not the Xtanco');
 venue.value='starbucks-diagonal-634';venue.listeners.get('change')();await new Promise(setImmediate);
 assert.equal(new URL(h.destinations[0]).pathname,'/xpacios/starbucks-centros/','choosing one goes there');
});
test('entering with the Altadis brand the selector offers only the tobacconist projects',async()=>{
 const h=await harness({catalogo:cuatro,marca:{'mb:marca':'altadis','mb:manual':'1'}});
 assert.deepEqual(proyectos(h),['altadis','estancos']);
 assert.equal(h.element('projectSelector').value,'estancos','the open Xtanco scene stays selected');
});
test('as Admira, by default, or with the brand a project applied on its own, every project is offered',async()=>{
 for(const marca of [null,{'mb:marca':'admira','mb:manual':'1'},{'mb:marca':'starbucks'},{'mb:marca':'starbucks','mb:manual':'off'}]){
  const h=await harness({catalogo:cuatro,marca});
  assert.deepEqual(proyectos(h),['starbucks','altadis','estancos','cafebreria'],JSON.stringify(marca));
  assert.doesNotMatch(h.element('projectSelectionStatus').textContent,/only its projects/);
 }
});

test('three combos: choosing the Starbucks Xpace applies its brand at once and opens the Venue combo',async()=>{
 const aplicadas=[];
 const h=await harness({catalogo:cuatro,ventana:{AdmiraMarca:{aplicarProyecto:id=>aplicadas.push(id)}}});
 const project=h.element('projectSelector'),venue=h.element('projectVenueSelector');
 let abierto=0;venue.showPicker=()=>{abierto++;};
 project.value='starbucks';project.listeners.get('change')();await new Promise(setImmediate);await new Promise(setImmediate);
 assert.deepEqual(aplicadas,['starbucks'],'the look and feel changes before a venue is chosen');
 assert.equal(h.destinations.length,0,'two venues: nothing opens until one is chosen');
 assert.equal(abierto,1,'the Venue combo opens by itself');
 assert.deepEqual(venue.options.slice(1).map(o=>o.value),['demo-starbucks','starbucks-diagonal-634']);
 venue.value='starbucks-diagonal-634';venue.listeners.get('change')();await new Promise(setImmediate);
 assert.equal(new URL(h.destinations[0]).pathname,'/xpacios/starbucks-centros/');
});
