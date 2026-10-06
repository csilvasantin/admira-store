import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../admira-xp/scripts/media-stock.js',import.meta.url),'utf8');
function runtime(fetchImpl,storage=new Map(),nodes={}){const root={crypto,AbortSignal,fetch:fetchImpl,URL,document:{documentElement:{lang:'es'},querySelectorAll:()=>Object.values(nodes).filter(n=>n.id?.endsWith('StockLink')),getElementById:id=>nodes[id]||null},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:fn=>setTimeout(fn,0),clearTimeout};vm.runInNewContext(source,{window:root,URL,Date,JSON,Error});return {api:root.XpaceMedia,storage,root};}
const stock={id:'fixture-stock',num:1,url:'https://api.admira.store/stock/asset/fixture-stock'};
test('one paid video POST, all further progress reads recover the same ID and return Stock',async()=>{const calls=[];const {api}=runtime(async(url,opts)=>{calls.push([url,opts]);return Response.json({ok:true,job:{status:calls.length===1?'pending':'done',stock}});});const result=await api.generate('video',{text:'Coffee',language:'en'});assert.equal(result.stock.id,stock.id);assert.equal(calls.filter(x=>x[1].method==='POST').length,1);assert.equal(calls[1][0],'/admira-xp/media-job?requestId='+JSON.parse(calls[0][1].body).requestId);assert.equal(api.pending('video'),null);});
test('network failure retains the operation and page reload recovers via GET without payment',async()=>{const storage=new Map(),payload={text:'Coffee',language:'en'};const first=runtime(async()=>{throw Error('network');},storage);await assert.rejects(first.api.generate('image',payload));const saved=first.api.pending('image');assert.ok(saved.requestId);const calls=[];const second=runtime(async(url,opts)=>{calls.push([url,opts]);return Response.json({ok:true,job:{status:'done',stock}});},storage);await second.api.generate('image',payload);assert.equal(calls.length,1);assert.equal(calls[0][1].method,undefined);assert.ok(calls[0][0].endsWith(saved.requestId));});
test('authentication failure clears unaccepted work and does not poll or generate again',async()=>{let calls=0;const {api}=runtime(async()=>{calls++;return Response.json({error:'login_required'},{status:401});});await assert.rejects(api.generate('video',{text:'Coffee',language:'en'}),e=>e.code==='auth');assert.equal(calls,1);assert.equal(api.pending('video'),null);});
test('provider failure and foreign Stock URLs never report a saved asset',async()=>{for(const job of [{status:'failed',error:'provider_failed'},{status:'done',stock:{id:'fixture',url:'https://other.example/stock/asset/fixture'}}]){const {api}=runtime(async()=>Response.json({ok:true,job}));await assert.rejects(api.generate('image',{text:'Coffee',language:'en'}));}});

test('long provider requests carry their own timeout instead of the existing 20-second page guard',async()=>{const {api}=runtime(async(url,options)=>{assert.ok(options.signal instanceof AbortSignal);return Response.json({ok:true,job:{status:'done',stock}});});await api.generate('image',{text:'Coffee',language:'en'});});

test('explicit voice or text replacement creates a separate operation and does not reuse the pending provider job',async()=>{const calls=[];let n=0;const {api}=runtime(async(url,opts)=>{if(opts.method!=='POST')return new Response('MP3',{headers:{'Content-Type':'audio/mpeg'}});calls.push(JSON.parse(opts.body));if(++n===1)throw Error('network');return Response.json({ok:true,job:{status:'done',stock}});});await assert.rejects(api.generate('audio',{text:'Coffee',voice:'male',language:'es'}));const first=api.pending('audio').requestId;await api.generate('audio',{text:'Fresh coffee',voice:'female',language:'en'});assert.equal(calls.length,2);assert.notEqual(calls[1].requestId,first);assert.equal(calls[0].voice,'male');assert.equal(calls[1].voice,'female');assert.equal(calls[1].language,'en');});


test('audio archive receipt confirms Megafonía and restores its exact Stock link after reload without generation',async()=>{
 const nodes=()=>({audioStockLink:{id:'audioStockLink',dataset:{},hidden:true},announcementArchiveStatus:{id:'announcementArchiveStatus',dataset:{},hidden:true}}),first=nodes(),storage=new Map();let calls=0;
 const h=runtime(async url=>{calls++;return url===stock.url?new Response('MP3'):Response.json({ok:true,job:{status:'done',stock}});},storage,first);
 const result=await h.api.generate('audio',{text:'Fresh coffee',voice:'female',language:'en'});h.api.link('audio',result.stock);
 assert.equal(first.audioStockLink.hidden,false);assert.match(first.audioStockLink.href,/highlight=fixture-stock$/);assert.match(first.announcementArchiveStatus.textContent,/guardada automáticamente en Stock · Megafonía/);assert.equal(first.announcementArchiveStatus.hidden,false);
 const reloaded=nodes();runtime(()=>{throw Error('Reload must not generate or fetch');},storage,reloaded);assert.equal(reloaded.audioStockLink.href,first.audioStockLink.href);assert.equal(reloaded.announcementArchiveStatus.hidden,false);assert.equal(calls,2);
 h.root.document.documentElement.lang='en';h.api.link('audio',result.stock);assert.match(first.announcementArchiveStatus.textContent,/saved automatically in Stock · Public announcements/);
});

test('an unconfirmed audio archive cannot show a Stock success receipt or play an unarchived response',async()=>{
 const nodes={audioStockLink:{id:'audioStockLink',dataset:{},hidden:true},announcementArchiveStatus:{id:'announcementArchiveStatus',dataset:{},hidden:true}};
 const h=runtime(async()=>new Response('MP3',{headers:{'Content-Type':'audio/mpeg'}}),new Map(),nodes);
 await assert.rejects(h.api.generate('audio',{text:'Fresh coffee',voice:'female',language:'en'}),e=>e.code==='invalid_stock');assert.equal(nodes.announcementArchiveStatus.hidden,true);assert.equal(nodes.audioStockLink.hidden,true);
});

test('generation feedback follows one operation through server phases and asset readiness without invented percentages',async()=>{
 const phases=[],callbacks=[];let n=0;const h=runtime(async url=>{if(url===stock.url)return new Response('MP3');return Response.json({ok:true,job:{status:['pending','archiving','done'][n++],stock}});});
 h.root.XpaceMediaExperience={progress:(kind,phase)=>phases.push([kind,phase])};
 await h.api.generate('audio',{text:'Aviso',voice:'female',language:'es'},{onProgress:phase=>callbacks.push(phase)});
 assert.deepEqual(phases.map(x=>x[1]),['preparing','pending','archiving','loading','done']);assert.deepEqual(callbacks,phases.map(x=>x[1]));
});
test('feedback reports failure and retains the same request for recovery instead of finishing the bar',async()=>{
 const h=runtime(async()=>{throw Error('network');}),phases=[];h.root.XpaceMediaExperience={progress:(kind,phase)=>phases.push(phase)};
 await assert.rejects(h.api.generate('video',{text:'Coffee'}));assert.deepEqual(phases,['preparing','error']);assert.ok(h.api.pending('video').requestId);
});
