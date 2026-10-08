import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {parseTourArg,findDemo,demoHelp,tourTotal,runTour,handleDemoTour,loadDemoRegistry,nextDemo,stopTour,tourState} from './demo-tour.mjs?v=demos-2';
import {parseVisualCommand,executeVisualCommand,DEMO_SOLUTIONS} from './xtanco-visual-command.mjs';
const reg=JSON.parse(readFileSync(new URL('../demos.json',import.meta.url),'utf8'));
const fast=r=>({...r,tour:{...r.tour,title_card_s:0},demos:r.demos.map(d=>({...d,steps:(d.steps||[]).map(s=>s.wait!=null?{wait:1}:s.waitPos?{waitPos:5}:s)}))});

test('registry: unique ids/aliases, numbered 1..N, required fields, suite 1–5 keep the engine numbers',()=>{
 const seen=new Set();reg.demos.forEach((d,i)=>{assert.equal(d.n,i+1);for(const k of ['id','name','shows','command','duration_s','side_effects','owner','link','steps'])assert.ok(d[k]!=null&&d[k]!=='',d.id+' '+k);
  for(const l of ['es','en']){assert.ok(d.name[l]);assert.ok(d.shows[l]);assert.ok(d.side_effects[l]);}
  for(const a of [d.id,...d.aliases]){assert.ok(!seen.has(a),'duplicate '+a);seen.add(a);}
  if(!d.tour)assert.ok(d.tour_skip_reason?.es&&d.tour_skip_reason?.en,d.id);
  const waits=d.steps.reduce((a,s)=>a+(s.wait||0)+(s.waitPos||0)+(s.ms||0),0)/1000;if(!d.steps.some(s=>s.incident))assert.ok(Math.abs(waits-d.duration_s)<=d.duration_s*.5+15,d.id+' duration');});
 assert.deepEqual(reg.demos.slice(0,5).map(d=>[d.kind,d.steps[0].suite]),[1,2,3,4,5].map(n=>['suite','/demo '+n]));
 const solutions=DEMO_SOLUTIONS.flatMap(s=>[s.id,...s.alias]);for(const a of seen)assert.ok(!solutions.includes(a),'collides with /demo '+a);
 assert.equal(reg.tour.count,reg.demos.filter(d=>d.tour).length);assert.equal(reg.tour.total_s,tourTotal(reg));
 const inc=findDemo(reg,'incidencia');assert.ok(inc.tour);assert.match(inc.side_effects.es,/--enviar/);
});

test('/demo help lists every demo numbered with how to run it; parse keeps tpv native and suite names in the engine',()=>{
 const h=demoHelp(reg);for(const d of reg.demos){assert.match(h,new RegExp('^\\s*'+d.n+'\\. ','m'));assert.ok(h.includes('/demo '+d.n));}
 assert.match(h,/\/demo all/);assert.match(demoHelp(reg,{en:true}),/Twin demos/);
 assert.deepEqual(parseTourArg('ayuda'),{action:'help'});assert.deepEqual(parseTourArg('TODAS --enviar'),{action:'all',send:true});assert.equal(parseTourArg('musica'),null);
 assert.deepEqual(parseVisualCommand('/demo tpv'),{guided:'tpv'});assert.deepEqual(parseVisualCommand('/demo 3'),{guided:'suite',text:'/demo 3'});
 assert.equal(findDemo(reg,'7').id,'sincro');assert.equal(findDemo(reg,'colas').id,'ipad');assert.equal(findDemo(reg,'nada'),null);
});

test('/demo all runs the tour in order, skips with next, restores the twin and previews the incident report (never closes other tickets)',async()=>{
 const r=fast(reg),cmds=[],suite=[],inc=[];let mode='matrix';
 const router={get mode(){return mode;},async choose(m){mode=m;return {ok:true};}};
 const incident=async(text,o)=>{inc.push([text,o.send]);return /crear/.test(text)?{ok:true,id:'INC-TEST01',message:'🛠 INC-TEST01'}:{ok:true,message:'✓ cerrada\n📄 vista previa'};};
 const exec=async c=>{cmds.push(c);if(['good','better','best','matrix'].includes(c))mode=c;return 'ok';};
 const p=runTour({reg:r,router,exec,incident,suite:async(t)=>{suite.push(t);return {message:'ok'};},doc:null,show:null});
 const out=await p;assert.equal(out.stopped,false);assert.equal(out.shown.length,r.demos.filter(d=>d.tour).length);
 assert.deepEqual(suite.filter(t=>t!=='/demo stop'),['/demo 1','/demo 2','/demo 3','/demo 4','/demo 5']);
 assert.deepEqual(inc,[['/crear incidencia',undefined],['/cerrar incidencia INC-TEST01',false]]);
 assert.ok(!cmds.some(c=>/INC-CFHI7Z/i.test(c)));assert.ok(cmds.includes('/navidad off')&&cmds.includes('/ifthendothat off'));
 assert.equal(mode,'matrix');assert.equal(tourState().active,false);
});

test('/demo stop mid-tour stops, closes the created incident and restores; --enviar sends; /demo next skips',async()=>{
 const r=fast(reg);let mode='matrix';const router={get mode(){return mode;},async choose(m){mode=m;}};const inc=[];
 const incident=async(text,o)=>{inc.push([text,o.send]);return /crear/.test(text)?{ok:true,id:'INC-TEST02',message:'x'}:{ok:true,message:'y'};};
 const only=r.demos.filter(d=>['incidencia','calidades'].includes(d.id)).map(d=>d.id);
 const p=runTour({reg:{...r,demos:r.demos.map(d=>d.id==='incidencia'?{...d,steps:[{incident:true},{wait:5000}]}:d)},ids:only,send:true,router,exec:async c=>{if(c==='best')stopTour();if(['good','better','best','matrix'].includes(c))mode=c;},incident,doc:null,show:null});
 const out=await p;assert.equal(out.stopped,true);assert.deepEqual(inc,[['/crear incidencia',undefined],['/cerrar incidencia INC-TEST02',true]]);assert.equal(mode,'matrix');
 const q=runTour({reg:{...r,demos:r.demos.map(d=>({...d,steps:[{wait:10000}]}))},ids:['avatar','panorama'],router,exec:async()=>{},doc:null,show:null});
 await new Promise(s=>setTimeout(s,20));assert.equal(nextDemo(),true);await new Promise(s=>setTimeout(s,20));assert.equal(nextDemo(),true);
 const o2=await q;assert.deepEqual(o2.shown.map(x=>x.skipped),[true,true]);
});

test('executeVisualCommand: /demo help answers from the registry, /demo 6 runs the twin demo, numbers 1–5 stay in the suite engine',async()=>{
 const help=await executeVisualCommand('/demo help');assert.match(help.message,/Demos del gemelo · 23/);
 const en=await executeVisualCommand('/demo ayuda',{lang:'en'});assert.match(en.message,/Twin demos/);
 const r=fast(reg);assert.match((await handleDemoTour({action:'run',id:'12'},{reg:r,router:null,exec:async()=>''})).message,/▶ Demo 12 · Panorama 360/);
 while(globalThis.XpaceDemoTour.active())await new Promise(s=>setTimeout(s,10));
 assert.equal(await handleDemoTour({action:'next'},{}),null);
});

test('demo 15 always closes its own ticket (retries a failed close) and restore hides the iPad shortcut it caused',async()=>{
 const r=fast(reg);let mode='matrix',closes=0,untouched=0,touched=false;const router={get mode(){return mode;},async choose(m){mode=m;}};
 const incident=async(text)=>{if(/crear/.test(text))return {ok:true,id:'INC-TEST03',message:'x'};closes++;if(closes===1)throw Error('red caída');return {ok:true,message:'✓ cerrada'};};
 globalThis.XpaceIpadCola={on:()=>true,touched:()=>touched,untouch(){untouched++;touched=false;},open(){touched=true;},close(){},command(){},url:()=>'about:blank'};
 try{const out=await runTour({reg:r,ids:['incidencia','ipad'],router,exec:async()=>{},incident,doc:null,show:null});
  assert.equal(closes,2);assert.match(out.message,/cerrada/);assert.equal(untouched,1);assert.equal(touched,false);
  const ipad=reg.demos.find(d=>d.id==='ipad');assert.deepEqual(ipad.preload,[{ipad:'preload'}]);
 }finally{delete globalThis.XpaceIpadCola;}
});

import {splitFlags,pauseTour,clampPos,applyPageLang,setTourLanguage} from './demo-tour.mjs?v=demos-2';
import {DEMO_ICONS,demoIconSvg} from './demo-icons.mjs?v=demos-2';
test('language: /demo all es|en|ESP|ENG|--idioma, /demo <id> en, and every demo has a Lucide-style icon',()=>{
 assert.deepEqual(parseVisualCommand('/demo all en'),{guided:'tour',action:'all',send:false,lang:'en'});
 assert.deepEqual(parseVisualCommand('/demo todas ESP --enviar'),{guided:'tour',action:'all',send:true,lang:'es'});
 assert.deepEqual(parseVisualCommand('/demo all --idioma en'),{guided:'tour',action:'all',send:false,lang:'en'});
 assert.deepEqual(parseVisualCommand('/demo ayuda eng'),{guided:'tour',action:'help',lang:'en'});
 assert.deepEqual(splitFlags('ipad es'),{rest:'ipad',send:false,lang:'es'});assert.equal(findDemo(reg,'ipad en').id,'ipad');
 assert.deepEqual(parseVisualCommand('/demo es'),{guided:'suite',text:'/demo es'});
 for(const d of reg.demos){assert.ok(DEMO_ICONS[d.icon],d.id+' icon');assert.match(demoIconSvg(d.icon),/^<svg [^>]*viewBox="0 0 24 24"/);}
 assert.equal(new Set(reg.demos.map(d=>d.icon)).size,reg.demos.length,'one icon per demo');
});
test('tour language switches the page via /idioma ESP|ENG and restores it; the ES/EN pill switches mid-tour; pause freezes the clock',async()=>{
 const calls=[];const doc={documentElement:{lang:'en'},body:null,defaultView:null};
 globalThis.XpaceShell={language(cmd){calls.push(cmd);doc.documentElement.lang=/ENG/.test(cmd)?'en':'es';}};
 try{const r={...fast(reg),demos:reg.demos.map(d=>({...d,steps:[{wait:400}],cleanup:[]}))};
  const p=runTour({reg:r,ids:['avatar','panorama'],lang:'es',router:null,exec:async()=>'',doc,show:null});
  await new Promise(s=>setTimeout(s,50));assert.equal(doc.documentElement.lang,'es');assert.equal(setTourLanguage('en'),true);assert.equal(tourState().lang,'en');
  assert.equal(pauseTour(true),true);await new Promise(s=>setTimeout(s,700));assert.equal(tourState().active,true);assert.equal(tourState().index,1);
  pauseTour(false);const out=await p;assert.equal(out.lang,'en');
  assert.deepEqual(calls,['/idioma ESP','/idioma ENG']);assert.equal(doc.documentElement.lang,'en');
 }finally{delete globalThis.XpaceShell;}
 assert.deepEqual(clampPos({x:-50,y:9999},{w:600,h:200,vw:1440,vh:900}),{x:8,y:692});
 assert.equal(applyPageLang(null,'en'),false);
});
