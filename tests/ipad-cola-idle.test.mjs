import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../admira-xp/scripts/ipad-cola.js',import.meta.url),'utf8'),ID='starbucks-ipad-01';
const empty=()=>({ok:true,recibido:[],preparando:[],listo:[]});
function runtime({search='?ipadQueueRoom=starbucks-qa',nodes=[]}={}){let state=empty(),fail=false,off=false,draws=0;const intervals=[],urls=[];
 const root={addEventListener(){},document:{querySelector:()=>true,querySelectorAll:()=>nodes,createElement:tag=>({tagName:tag.toUpperCase(),style:{},setAttribute(){},addEventListener(){}}),addEventListener(){},body:{classList:{contains:()=>false}},documentElement:{classList:{contains:()=>false}}},localStorage:{getItem:()=>null},XpaceStarbucks:{active:()=>true},XpaceScreenMedia:{get:()=>off?{kind:'off'}:{id:'demo-video',kind:'video'},draw:()=>{draws++;return true;}}};
 vm.runInNewContext(source,{window:root,location:{search},URLSearchParams,Map,Set,Date,AbortController,clearTimeout(){},setInterval:f=>intervals.push(f),setTimeout(){},fetch:async url=>{urls.push(url);if(fail)throw Error('offline');return {ok:true,json:async()=>state};}});
 return {api:root.XpaceIpadCola,media:root.XpaceScreenMedia,poll:intervals[0],matrix:intervals[2],set:s=>{state=s;fail=false;},fail:()=>{fail=true;},off:()=>{off=true;},draws:()=>draws,urls};
}
function canvas(){const texts=[];let saves=0;const ctx=new Proxy({save(){saves++;},restore(){saves--;},fillText:t=>texts.push(t),measureText:t=>({width:t.length*14})},{get:(o,k)=>k in o?o[k]:()=>{}});return {ctx,texts,saves:()=>saves};}
test('idle keeps the two-video schedule; every active queue phase overlays it then returns to it',async()=>{
 const r=runtime();for(const phase of ['recibido','preparando','listo']){
  r.set({...empty(),[phase]:[{numero:'A001',nombre:'QA'}]});await r.poll();assert.equal(r.api.hasOrders(),true,phase);assert.equal(r.media.get(ID).kind,'web-app');
  const c=canvas();assert.equal(r.media.draw(c.ctx,1024,768,ID),true);assert.ok(c.texts.includes('🧾 Recibido'));assert.equal(c.saves(),0);
  r.set(empty());await r.poll();assert.equal(r.api.hasOrders(),false);assert.equal(r.api.draw(canvas().ctx,1024,768),false);assert.equal(r.media.get(ID).id,'demo-video');
  const before=r.draws();r.media.draw(canvas().ctx,1024,768,ID);assert.equal(r.draws(),before+1);
 }assert.ok(r.urls.every(u=>u.includes('sala=starbucks-qa')&&u.includes('publico=1')));
});
test('failed or malformed reads retain active state; standby and other screens remain intact',async()=>{
 const r=runtime();r.set({...empty(),preparando:[{numero:'A001'}]});await r.poll();r.fail();await r.poll();assert.equal(r.api.hasOrders(),true);
 r.set({ok:true,recibido:[]});await r.poll();assert.equal(r.api.hasOrders(),true);
 assert.equal(r.media.get('other').kind,'video');assert.equal(new URL(r.api.url()).searchParams.get('voz'),'0');
 r.off();assert.equal(r.media.get(ID).kind,'off');const before=r.draws();r.media.draw(canvas().ctx,1024,768,ID);assert.equal(r.draws(),before+1);
});

function matrixNode(){const children=[],classes=new Set(['matrix-landscape-ipad']);return {children,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},style:{},querySelector(sel){return children.find(c=>c.className===sel.split('.').at(-1))||null;},prepend(c){children.unshift(c);c.remove=()=>children.splice(children.indexOf(c),1);},appendChild(c){children.push(c);c.remove=()=>children.splice(children.indexOf(c),1);}};}
test('Matrix overlays the playing video only while orders exist and keeps its iframe through transitions',async()=>{
 const node=matrixNode(),video={className:'matrix-player-media',tagName:'VIDEO',currentSrc:'https://example.com/demo.mp4'};node.children.push(video);const r=runtime({nodes:[node]});
 await r.poll();r.matrix();assert.equal(node.querySelector('.ipad-cola-frame'),null);assert.equal(node.children[0],video);
 r.set({...empty(),recibido:[{numero:'A001'}]});await r.poll();r.matrix();const frame=node.querySelector('.ipad-cola-frame');assert.ok(frame);assert.match(frame.src,/admira.tv\/gestorColas\/pantalla/);assert.match(frame.src,/sala=starbucks-qa/);assert.ok(node.children.includes(video));
 r.set(empty());await r.poll();r.matrix();assert.equal(frame.style.display,'none');assert.ok(node.children.includes(video));assert.equal(node.querySelector('.ipad-cola-hit'),null);
 r.set({...empty(),listo:[{numero:'A001'}]});await r.poll();r.matrix();assert.equal(node.querySelector('.ipad-cola-frame'),frame);assert.equal(frame.style.display,'');
 node.classList.add('device-off');r.matrix();assert.equal(frame.style.display,'none');
});
test('queue room override validates strict slugs and keeps the legacy option',async()=>{
 for(const [search,expected] of [['?ipadQueueRoom=INVALID%2Froom','starbucks-paseo-de-gracia'],['?cola=starbucks-qa','starbucks-qa'],['','starbucks-paseo-de-gracia']]){const r=runtime({search});await r.poll();assert.ok(r.urls[0].includes('sala='+expected));}
});
