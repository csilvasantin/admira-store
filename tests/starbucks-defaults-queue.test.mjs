import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../admira-xp/scripts/totem-kiosko.js',import.meta.url),'utf8');
function boot({search='?project=starbucks&voz_el=0',siteLang='es',legacy='off',eleven=false}={}){
 const listeners={},intervals=[],spoken=[],acks=[],audios=[],timers=new Map(),values=new Map([['xpace:totem-interactivo',legacy],['xpace:avatar-escena-nivel','best']]);let state={listo:[]},timer=0;
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const win={localStorage,addEventListener:(n,f)=>(listeners[n]??=[]).push(f),dispatchEvent:e=>(listeners[e.type]||[]).forEach(f=>f(e)),speechSynthesis:{getVoices:()=>[{lang:'es-ES'},{lang:'en-GB'}],cancel(){},speak:u=>spoken.push(u)},SpeechSynthesisUtterance:class{constructor(t){this.text=t;}}};
 if(eleven)search=search.replace('&voz_el=0','');
 const location={search,href:'https://www.admira.store/admira-xp/'+search};
 const context={window:win,localStorage,location,history:{replaceState(){}},lang:siteLang,document:{readyState:'loading',addEventListener(){}},URL,URLSearchParams,Intl,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},setInterval:f=>(intervals.push(f),intervals.length),setTimeout:f=>(timers.set(++timer,f),timer),clearTimeout:id=>timers.delete(id),Audio:class{constructor(url){this.src=url;audios.push(this);}pause(){}play(){return Promise.resolve();}},fetch:async()=>({json:async()=>state})};
 vm.runInNewContext(code,context);
 const poll=()=>intervals[0]();
 const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
 return {win,values,spoken,acks,audios,poll,settle,set:v=>{state=v;},finish:async()=>{spoken.at(-1).onend();await settle();},send:text=>(listeners.message||[]).forEach(f=>f({origin:'https://www.ainimation.studio',data:{source:'ainimation-xperiencia',type:'say',id:'ready',text,lang:'es-ES'},source:{postMessage:m=>acks.push(m)}}))};
}
test('all Starbucks entries start in kiosk even after a remembered avatar; explicit switches work without losing tier',()=>{
 for(const search of ['?project=starbucks','?loc=alsea-sbux-021','?circuit=alsea_starbucks']){
  const h=boot({search});assert.equal(h.win.XpaceTotem.on(),true);h.win.XpaceTotem.set(false);assert.equal(h.win.XpaceTotem.on(),false);h.win.XpaceTotem.set(true);assert.equal(h.win.XpaceTotem.on(),true);assert.equal(h.values.get('xpace:avatar-escena-nivel'),'best');
 }
 assert.equal(boot({search:'?project=xtanco',legacy:'off'}).win.XpaceTotem.on(),false);
});
test('new ready order speaks Spanish then English once, waiting for completion regardless of UI language',async()=>{
 for(const siteLang of ['es','en']){
  const h=boot({siteLang});h.set({listo:[{id:'old',numero:'A001',nombre:'Ana'}]});await h.poll();assert.equal(h.spoken.length,0);
  h.set({listo:[{id:'new',numero:'A002',nombre:'Carlos'},{id:'old',numero:'A001',nombre:'Ana'}]});await h.poll();assert.equal(h.spoken.length,1);assert.equal(h.spoken[0].lang,'es-ES');assert.equal(h.spoken[0].text,'Carlos, tu pedido Starbucks está preparado');
  await h.poll();assert.equal(h.spoken.length,1);await h.finish();assert.equal(h.spoken.length,2);assert.equal(h.spoken[1].lang,'en-GB');assert.equal(h.spoken[1].text,'Carlos, your Starbucks order is ready');await h.finish();await h.poll();assert.equal(h.spoken.length,2);
  assert.deepEqual(Array.from(h.win.__gemeloColaAvisos,x=>x.lang),['es-ES','en-GB']);
 }
});
test('embedded ready speech is acknowledged without a duplicate; missing customer name uses order number',async()=>{
 const h=boot();await h.poll();h.send('Pedido A003, tu pedido Starbucks está preparado');assert.equal(h.spoken.length,0);assert.equal(h.acks[0].via,'queue-owner');assert.equal(h.acks[0].spoken,true);
 h.set({listo:[{id:'three',numero:'A003'}]});await h.poll();assert.equal(h.spoken[0].text,'Pedido A003, tu pedido Starbucks está preparado');await h.finish();assert.equal(h.spoken[1].text,'Order A003, your Starbucks order is ready');await h.finish();h.send('Order A003, your Starbucks order is ready');assert.equal(h.spoken.length,2);
});
test('queue mute cancels the pending English phrase and does not replay a seen order',async()=>{
 const h=boot();await h.poll();h.set({listo:[{id:'x',numero:'A004',nombre:'Ana'}]});await h.poll();h.win.XpaceTotemKiosk.setAudio(false);await h.finish();assert.equal(h.spoken.length,1);h.win.XpaceTotemKiosk.setAudio(true);await h.poll();assert.equal(h.spoken.length,1);
});

test('ElevenLabs Spanish finishes before English, and audio failure falls back once before continuing',async()=>{
 for(const fail of [false,true]){const h=boot({eleven:true});await h.poll();h.set({listo:[{id:'el',numero:'A005',nombre:'Carlos'}]});await h.poll();assert.equal(h.audios.length,1);assert.equal(h.spoken.length,0);
  if(fail){h.audios[0].onerror();await h.settle();assert.equal(h.spoken[0].lang,'es-ES');await h.finish();}else{h.audios[0].onplaying();assert.equal(h.spoken.length,0);h.audios[0].onended();await h.settle();}
  assert.equal(h.spoken.at(-1).lang,'en-GB');await h.finish();await h.poll();assert.equal(h.audios.length,1);assert.equal(h.spoken.length,fail?2:1);
 }
});
