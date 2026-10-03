import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {venueUrl,validAccess} from './central-project-client.mjs';
import {projectContext} from './project-context.mjs';

const code=(await readFile(new URL('./project-selector.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
async function harness({account=false}={}){
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
 const client={access:account?{token:'a'.repeat(64),expires_at:Date.now()+600000}:null,expired:false,demos:async()=>catalog,context:async()=>catalog,clear(){this.access=null;}};
 const context={URL,Option:class{constructor(text,value){this.text=text;this.value=value;}},ProjectClient:class{constructor(){return client;}},CENTRAL:'https://www.admiranext.com',venueUrl,validAccess,projectContext,
  document:{documentElement:{lang:'en'},getElementById:element,querySelector:()=>null},window:{addEventListener:(name,handler)=>events.set(name,handler)},location:{href:'https://www.admira.store/admira-xp/?autostart=xtanco&from=portada&project=estancos&circuit=estancos&quality=better',assign:url=>destinations.push(url)},sessionStorage:{},MutationObserver:class{observe(){}},setInterval:handler=>ticks.push(handler)};
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
 project.listeners.get('change')();
 assert.equal(new URL(h.destinations[0]).pathname,'/xpacios/cafebreria/');
 assert.equal(new URL(h.destinations[0]).origin,'https://www.admira.store');
});
test('account expiry still clears authorized selections on the timer',async()=>{
 const h=await harness({account:true});assert.ok(h.element('projectSelector').options.length>1);
 h.client.access.expires_at=1;h.ticks[0]();
 assert.equal(h.client.access,null);assert.equal(h.element('projectSelector').options.length,1);
 assert.equal(h.element('projectSelector').disabled,true);assert.match(h.element('projectSelectionStatus').textContent,/expired/);
});
