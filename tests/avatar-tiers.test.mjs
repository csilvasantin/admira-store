// Experto → Avatar3D: Good (Admirito) · Better (Luna) · Best (Neo), uno a la vez en el tótem (7-oct-2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const src=readFileSync(new URL('../admira-xp/scripts/avatar-tiers.js',import.meta.url),'utf8');
function storage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};}
function boot({matrix=false,totem=false}={}){
  const listeners={};let totemOn=totem;const wall={mode:totem?'kiosk':'avatar',level:'good',off:false};
  const DS_PIN=Object.create(null);
  const win={localStorage:storage(),sessionStorage:storage(),
    addEventListener:(n,f)=>{(listeners[n]||=[]).push(f);},dispatchEvent:e=>{(listeners[e.type]||[]).forEach(f=>f(e));return true;},
    XpaceTotem:{on:()=>totemOn,set:on=>{totemOn=!!on;wall.mode=on?'kiosk':'avatar';win.dispatchEvent(new win.CustomEvent('xpace:totem-mode',{detail:{on:totemOn}}));}},
    CustomEvent:class{constructor(type,o){this.type=type;this.detail=o?.detail;}},
  };
  if(matrix){win.XpaceStarbucksDemo={};win.XpaceMatrixOptions={isActive:()=>true,avatarState:()=>({mode:wall.mode,level:win.sessionStorage.getItem('admira-avatar:nivel-elegido')||'good',off:win.localStorage.getItem('xpace:avatar-escena')==='off'})};}
  const ctx={window:win,document:{documentElement:{lang:'es'},addEventListener(){}},lang:'es',DS_PIN,setInterval:()=>0,clearInterval(){},CustomEvent:win.CustomEvent,
    setAvatar3dTotem(on){if(on){const c=win.XpaceAvatarTiers.chosen();DS_PIN.metahuman={kind:'web',src:{good:'https://digitalavatar.ai/nube.html?kiosk=1',better:'https://digitalavatar.ai/best.html?kiosk=1',best:'https://digitalavatar.ai/metahuman.html?dock=1'}[c]};}else delete DS_PIN.metahuman;return true;}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  return {A:win.XpaceAvatarTiers,win,DS_PIN,wall,totem:()=>totemOn};
}

test('CLI: on/off explícito y a secas alterna; alias avatar|human|metahuman',()=>{
  const {A,DS_PIN}=boot();
  assert.ok(A.match('/avatar good on')&&A.match('/avatar best')&&A.match('/avatar human off')&&!A.match('/avatar digital on')&&!A.match('/avatar3d on'));
  assert.equal(A.command('/avatar good').ok,true);assert.equal(A.active(),'good');assert.match(DS_PIN.metahuman.src,/nube\.html/);
  A.command('/avatar good');assert.equal(A.active(),'');assert.equal(DS_PIN.metahuman,undefined);
  A.command('/avatar best on');assert.equal(A.active(),'best');assert.match(DS_PIN.metahuman.src,/metahuman\.html/);
  A.command('/avatar better on');assert.equal(A.active(),'better','solo uno a la vez');
  assert.match(A.command('/avatar best off').message,/ya estaba apagado/);assert.equal(A.active(),'better');
  A.command('/avatar human off');assert.equal(A.active(),'');
});

test('Matrix: encender un nivel quita el quiosco del tótem; apagarlo deja la pared sin avatar; /totem off lo devuelve',()=>{
  const {A,win,totem}=boot({matrix:true,totem:true});
  assert.equal(A.active(),'','con el quiosco ON ningún avatar está ON');
  A.set('better',true);assert.equal(totem(),false);assert.equal(A.active(),'better');
  assert.equal(win.sessionStorage.getItem('admira-avatar:nivel-elegido'),'better');
  A.set('better',false);assert.equal(A.active(),'');assert.equal(win.localStorage.getItem('xpace:avatar-escena'),'off');
  win.XpaceTotem.set(true);win.XpaceTotem.set(false);assert.equal(A.off(),false);assert.equal(A.active(),'better');
});

test('Experto: tres interruptores en Avatar3D en lugar de «Opciones del avatar»; /help los lista',()=>{
  const detail=readFileSync(new URL('../admira-xp/scripts/expert-category-detail.js',import.meta.url),'utf8');
  assert.doesNotMatch(detail,/'Avatar options'/);
  assert.match(detail,/\['good','Good · Admirito'.*\['better','Better · Luna'.*\['best','Best · Neo'/s);
  assert.match(detail,/XpaceAvatarTiers\?\.active\?\.\(\)===id/);
  const html=readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8');
  assert.match(html,/<script src="scripts\/avatar-tiers\.js\?v=avatar-tiers-1"><\/script>/);
  for(const c of ['/avatar good on','/avatar better off','/avatar best','/totem on'])assert.ok(html.includes("'"+c+"'"),c);
  const wall=readFileSync(new URL('../admira-xp/scripts/matrix-wall-avatar.mjs',import.meta.url),'utf8');
  assert.match(wall,/AVATAR_SCENE_OFF_KEY='xpace:avatar-escena'/);assert.match(wall,/get off\(\)\{return mode==='avatar'&&sceneOff;\}/);
});
