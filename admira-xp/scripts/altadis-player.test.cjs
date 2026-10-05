const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {test} = require('node:test');
const player = require('./altadis-player.js');
test('each screen uses its declared file and exact resolution, including LED', () => {
 const s={screen:'shop-1-p1',w:1080,h:1920,files:{adapted:{url:'/altadis/media/shop-1/p1.mp4',width:1080,height:1920}}};
 assert.equal(player.formatFor(s).src,s.files.adapted.url);
 assert.equal(player.formatFor({...s,w:1920}),null);
 const led={w:1536,h:192,files:{adapted:{url:'/led.mp4',width:1536,height:192}}};
 assert.ok(player.formatFor(led));
 assert.equal(player.sourceFor({w:1080,h:1920,files:{adapted:null}},'adapted').status,'pending');
 assert.equal(player.sourceFor({...s,files:{adapted:{url:'javascript:bad',width:1080,height:1920}}},'adapted').status,'invalid-file');
});
test('original keeps its own aspect while the native adapted file fills',()=>{
 assert.deepEqual(player.fitRect(1920,1080,160,90),{x:0,y:0,w:160,h:90});
 assert.ok(player.fitRect(1080,1920,160,90).x>54);
 const s={w:1920,h:1080,files:{original:{url:'/original.mp4',width:1080,height:1920},adapted:null}};
 assert.equal(player.sourceFor(s,'original').src,'/original.mp4');
 assert.equal(player.sourceFor(s,'adapted').src,null);
});
test('all nine locations have 18 distinct neutral assignments with exact adapted dimensions',()=>{
 const d=JSON.parse(readFileSync(new URL('../../altadis/demo.json','file://'+__filename)));
 assert.equal(d.locations.length,9);assert.equal(d.source.official_altadis_pending,true);assert.equal(d.source.no_brand,true);
 const ids=new Set();
 d.locations.forEach((l,i)=>{
  assert.equal(l.id,'altadis-bcn-'+String(i+1).padStart(3,'0'));assert.equal(l.tourOrder,i+1);assert.equal(l.surfaces.length,2);
  l.surfaces.forEach(s=>{assert.equal(player.sourceFor(s,'adapted').src,s.files.adapted.url);assert.equal(s.files.adapted.width,s.w);assert.equal(s.files.adapted.height,s.h);assert.equal(player.sourceFor(s,'original').width,360);assert.equal(player.sourceFor(s,'original').height,640);assert.ok(s.expectedFiles.adapted.includes(l.id));assert.ok(!ids.has(s.screen));ids.add(s.screen);});
 });
 assert.equal(ids.size,18);
 assert.doesNotMatch(JSON.stringify(d),/jti|tu sitio de siempre|1790932601282|1790932708532/i);
});

test('late configuration replaces a pending bootstrap assignment and wrong metadata stays hidden',()=>{
 const vm=require('node:vm');const listeners={};const videos=[];
 const doc={readyState:'complete',getElementById(){return null;},body:{appendChild(v){videos.push(v);}},createElement(){return {dataset:{},style:{},hidden:false,currentTime:0,duration:10,readyState:0,handlers:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return k==='src'?this.src||null:this.attrs[k]||null;},removeAttribute(k){if(k==='src')this.src=null;},load(){},play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},addEventListener(k,fn){this.handlers[k]=fn;}};}};
 const pending={screen:'bootstrap',surface:'pantalla',orient:'horizontal',w:1920,h:1080,files:{original:null,adapted:null}};
 const win={document:doc,location:{search:'?loc=ALTADIS-BCN-001&adaptado=1'},STORE_CFG:{surfaces:[pending]},addEventListener(k,fn){listeners[k]=fn;}};
 vm.runInNewContext(readFileSync(require.resolve('./altadis-player.js'),'utf8'),{window:win,document:doc,URLSearchParams,setInterval(){return 1;}});
 assert.equal(videos.length,1);assert.equal(videos[0].dataset.status,'pending');
 const real={...pending,screen:'altadis-bcn-001-p2-horizontal',files:{adapted:{url:'/official-p2.mp4',width:1920,height:1080},original:null}};
 win.STORE_CFG={surfaces:[real]};listeners.storecfg();
 assert.equal(videos[0].src,'/official-p2.mp4');assert.equal(videos[0].dataset.screen,real.screen);
 videos[0].videoWidth=1080;videos[0].videoHeight=1920;videos[0].handlers.loadedmetadata();
 assert.equal(videos[0].dataset.status,'dimension-mismatch');assert.equal(videos[0].style.display,'none');assert.equal(videos[0].paused,true);
});
