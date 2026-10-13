import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {studioCampaignURL} from './preview-routing.mjs';
const source=readFileSync(new URL('../store.mjs',import.meta.url),'utf8');
const campaign=source.slice(source.indexOf('async function campaign('),source.indexOf("$('campaign-toggle').textContent='▶ '+campaignName;$('campaign-toggle').onclick"));
function harness(en){
 const nodes=new Map(),calls=[];
 const context={en,t:(es,english)=>en?english:es,fullInvalid:false,campaignStarting:null,campaignDemo:null,campaignName:'NEXT STEP',creatorCampaign:null,viewMode:'photo',modelView:'overview',channels:{},panorama:{setCampaign:value=>calls.push(['panorama',!!value])},setCampaignMode:value=>calls.push(['mode',value]),loadPlaylist:async()=>calls.push(['playlist-read']),status:text=>{context.$('store-status').textContent=text;},$:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);},objects:new Map(),mountNextStep:async()=>{calls.push(['mount']);return {paused:false,pause(){this.paused=true;},play(){this.paused=false;},restart(){this.paused=false;calls.push(['restart']);},stop(){calls.push(['restore']);}};}};
 vm.createContext(context);vm.runInContext(campaign,context);return {run:action=>context.campaign(action),calls,get demo(){return context.campaignDemo;}};
}
for(const en of [false,true])test(`${en?'EN':'ES'} twin lifecycle rejects unknown actions, preserves pause and restores on stop`,async()=>{
 const h=harness(en);await h.run(en?'pause':'pausa');assert.equal(h.demo,null);assert.equal(h.calls.length,0);
 await h.run(en?'start':'iniciar');assert.equal(h.demo.paused,false);
 await h.run(en?'pause':'pausa');assert.equal(h.demo.paused,true);
 const calls=h.calls.length;await h.run('inventado');await h.run(en?'status':'estado');assert.equal(h.demo.paused,true);assert.equal(h.calls.length,calls);
 await h.run(en?'restart':'reiniciar');assert.equal(h.demo.paused,false);
 await h.run(en?'pause':'pausa');await h.run(en?'resume':'reanudar');assert.equal(h.demo.paused,false);
 await h.run(en?'stop':'detener');assert.equal(h.demo,null);assert(h.calls.some(c=>c[0]==='restore'));assert(h.calls.some(c=>c[0]==='panorama'&&c[1]===false));
 await h.run(en?'start':'iniciar');assert.equal(h.calls.filter(c=>c[0]==='mount').length,2);
});
test('twin navigation pairs local and Pages previews while retaining live routes',()=>{
 assert.equal(studioCampaignURL(true,'127.0.0.1'),'http://127.0.0.1:8481/campanas/next-step/?lang=en');
 assert.equal(new URL(studioCampaignURL(false,'5834-next-step-preview.admira-store.pages.dev')).hostname,'5834-next-step-preview.pixeria.pages.dev');
 assert.equal(new URL(studioCampaignURL(false,'www.admira.store')).hostname,'admira.studio');
 assert.equal(new URL(studioCampaignURL(false,'admira-store.pages.dev.evil.example')).hostname,'admira.studio');
});

test('real twin renderer restart resumes a paused clock and stop disposes session textures once',async()=>{
 const {mountNextStep}=await import('./twin.mjs');
 const saved=Object.fromEntries(['document','Image','FontFace'].map(k=>[k,globalThis[k]]));
 const noop=()=>{},ctx=new Proxy({createRadialGradient:()=>({addColorStop:noop}),measureText:s=>({width:s.length*10})},{get:(target,key)=>target[key]??noop});
 globalThis.document={fonts:{add:noop},createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 globalThis.Image=class {width=800;height=600;decode(){return Promise.resolve();}};
 globalThis.FontFace=class {load(){return Promise.resolve();}};
 try{
  const twin=await mountNextStep({objects:new Map()});let disposed=0;
  for(const id of ['landscape','portrait','jordan','rear','strip','column','tablet'])twin.texture(id).addEventListener('dispose',()=>disposed++);
  twin.pause();assert.equal(twin.paused,true);twin.update(100);assert.equal(twin.update(200),false,'paused frames do not redraw');
  twin.restart();assert.equal(twin.paused,false,'restart must resume, including from pause');
  twin.stop();twin.stop();assert.equal(disposed,7);assert.equal(twin.update(300),false);
 }finally{for(const [k,value] of Object.entries(saved)){if(value===undefined)delete globalThis[k];else globalThis[k]=value;}}
});
