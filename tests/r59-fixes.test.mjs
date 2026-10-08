import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runTour,stopTour} from '../admira-xp/scripts/demo-tour.mjs?v=demos-3';
import {GUARD_CSS,DOCK_SCROLL_SELECTOR,scrollPane,markPane} from '../admira-xp/scripts/dock-scroll-guard.mjs';
import {createVoiceIndicator,VOICE_TOAST_MIN_MS} from '../admira-xp/scripts/retail-voice.mjs';
const reg=JSON.parse(readFileSync(new URL('../admira-xp/demos.json',import.meta.url),'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

test('stopping an EN tour writes the closing line in the restored language (ES)',async()=>{
 const doc={documentElement:{lang:'es'},body:null,defaultView:null},shown=[];
 globalThis.XpaceShell={language(cmd){doc.documentElement.lang=/ENG/.test(cmd)?'en':'es';}};
 try{const r={...reg,tour:{...reg.tour,title_card_s:0},demos:reg.demos.map(d=>({...d,steps:[{wait:400}],cleanup:[]}))};
  const p=runTour({reg:r,ids:['avatar','panorama'],lang:'en',router:null,exec:async()=>'',doc,show:m=>shown.push(m)});
  await sleep(60);assert.equal(doc.documentElement.lang,'en');stopTour();const out=await p;
  assert.equal(doc.documentElement.lang,'es');assert.match(out.message,/^■ Recorrido detenido · \d+\/2 · gemelo restaurado/);assert.match(shown.at(-1),/Recorrido detenido/);
 }finally{delete globalThis.XpaceShell;}
});

test('expert dock pane is not a native scroller (no hole in the 360° WebGL view) but still scrolls',()=>{
 assert.match(GUARD_CSS,/#telegramDock \.expert-controls-pane\{overflow:hidden!important/);assert.equal(DOCK_SCROLL_SELECTOR,'#telegramDock .expert-controls-pane');
 const cls=new Set(),p={scrollTop:0,scrollHeight:271,clientHeight:107,classList:{toggle:(c,on)=>on?cls.add(c):cls.delete(c)}};
 markPane(p);assert.ok(cls.has('xp-more-below'));assert.equal(scrollPane(p,100),true);assert.equal(p.scrollTop,100);assert.ok(cls.has('xp-more-above'));
 assert.equal(scrollPane(p,500),true);assert.equal(p.scrollTop,164);assert.ok(!cls.has('xp-more-below'));assert.equal(scrollPane(p,10),false);
});

test('voiceover toast stays at least the minimum time and until the /demo advances',async()=>{
 assert.ok(VOICE_TOAST_MIN_MS>=4000);
 const cls=new Set(),el={classList:{add:c=>cls.add(c),remove:c=>cls.delete(c)},querySelector:()=>({textContent:''}),setAttribute(){},set innerHTML(v){}};
 let st={active:true,index:14};
 const doc={body:{append(){}},head:{append(){}},getElementById:id=>id==='xpaceVoiceToast'?el:id==='xpaceVoiceCSS'?{}:null,createElement:()=>el,querySelectorAll:()=>[]};
 const win={document:doc,XpaceDemoTour:{state:()=>st}};
 const ind=createVoiceIndicator(win,{minMs:300,maxTourMs:5000});ind.show({language:'es',text:'Gracias por comprar agua de proximidad'});assert.ok(cls.has('on'));
 ind.hide();await sleep(1300);assert.ok(cls.has('on'),'kept while the same demo is running');
 st={active:true,index:15};await sleep(400);assert.ok(!cls.has('on'),'hidden once the tour advances');
});
