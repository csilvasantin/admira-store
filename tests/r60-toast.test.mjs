import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {toastPlacement} from '../admira-xp/scripts/retail-voice.mjs';
const R=(left,top,w,h)=>({left,top,right:left+w,bottom:top+h,width:w,height:h});

test('voiceover toast centres on the 360° view above the dock and never overlaps the tour card',()=>{
 const base={vw:1280,vh:800,w:420,h:56};
 assert.deepEqual(toastPlacement({...base,stage:R(0,38,1280,675),dockTop:680}),{cx:640,bottom:134,mode:'centre'});
 // tarjeta abajo al centro: pasa al lado libre
 const card=R(340,560,600,200);const p=toastPlacement({...base,card,dockTop:null});
 assert.ok(['right','left','above'].includes(p.mode));
 const t={l:p.cx-210,r:p.cx+210,b:800-p.bottom,t:800-p.bottom-56};
 assert.ok(t.r<=card.left-8||t.l>=card.right+8||t.b<=card.top-8||t.t>=card.bottom+8,'no overlap '+JSON.stringify(p));
 // tarjeta ancha que no deja lado libre: por encima
 const wide=R(100,600,1080,180);const q=toastPlacement({...base,card:wide});assert.equal(q.mode,'above');assert.ok(800-q.bottom<=wide.top-8);
 // tarjeta arriba (posición por defecto): el aviso no se mueve
 assert.equal(toastPlacement({...base,card:R(340,16,600,200)}).mode,'centre');
});

test('card Stop acts on pointerdown and buttons are not repainted when unchanged',()=>{
 const src=readFileSync(new URL('../admira-xp/scripts/demo-tour.mjs',import.meta.url),'utf8');
 assert.match(src,/addEventListener\('pointerdown',e=>\{[^}]*button\[data-a="stop"\]/);
 assert.match(src,/b\.__xdtHtml!==h/);assert.match(src,/#xpaceDemoTourCard button \*\{pointer-events:none\}/);
});
