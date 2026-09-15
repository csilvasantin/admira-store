import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const helper=html.slice(html.indexOf('function drawShopOperation('),html.indexOf('// ── DRAW SHOP (ISOMETRIC',html.indexOf('function drawShopOperation(')));
function context(name){
 const state={name,fillStyle:'#172b3d',strokeStyle:'#ff77aa',globalAlpha:.6,lineWidth:3,imageSmoothingEnabled:false,transform:{a:2,b:0,c:0,d:-1,e:47,f:62},dash:[2,5]};
 const stack=[],calls=[];
 return {...state,calls,
  save(){stack.push(Object.fromEntries(Object.keys(state).map(key=>[key,key==='dash'?[...this.dash]:this[key]])));calls.push('save');},
  restore(){const old=stack.pop();Object.assign(this,old);calls.push('restore');},
  getTransform(){return {...this.transform};},setTransform(...args){this.transform=args.length===1?{...args[0]}:{a:args[0],b:args[1],c:args[2],d:args[3],e:args[4],f:args[5]};calls.push(['transform',this.transform]);},
  setLineDash(value){this.dash=[...value];},getLineDash(){return [...this.dash];},
  beginPath(){calls.push('path');},moveTo(...args){calls.push(['move',...args]);},lineTo(...args){calls.push(['line',...args]);},closePath(){calls.push('close');},rect(...args){calls.push(['rect',...args]);},clip(){calls.push('clip');},
  get depth(){return stack.length;}
 };
}
function fixture(target){
 const original=context('Good');
 const sandbox=vm.createContext({cx:original,window:{__xtancoPremiumView:{operationContext:()=>target}},SHOP:{x:0,y:28,w:800,h:466},H:600,editorSceneActive:false,isXpaceCreator:()=>false,ISO:{cols:14,rows:8},toIso:(col,row)=>({x:400+(col-row)*16,y:180+(col+row)*8})});
 vm.runInContext(helper,sandbox);
 return {sandbox,original,run:fn=>sandbox.drawShopOperation(fn)};
}

test('operational pass executes once with the original transform, styles and game coordinates',()=>{
 const target=context('operations');target.fillStyle='#fff';target.globalAlpha=1;
 const f=fixture(target);let called=0;
 f.run(()=>{
   called++;assert.equal(f.sandbox.cx,target);assert.equal(target.fillStyle,f.original.fillStyle);assert.equal(target.globalAlpha,.6);
   assert.deepEqual(target.getTransform(),f.original.getTransform());assert.deepEqual(target.getLineDash(),[2,5]);
   f.sandbox.drawShopOperation(()=>{called++;assert.equal(f.sandbox.cx,target);});
 });
 assert.equal(called,2,'outer and nested callbacks execute only once each');
 assert.equal(f.sandbox.cx,f.original);assert.equal(target.depth,0);assert.equal(target.fillStyle,'#fff');
 assert.deepEqual(target.calls.filter(v=>v==='save'),['save'],'nested operations share the same layer');
 assert.deepEqual(target.calls.find(v=>Array.isArray(v)&&v[0]==='rect'),['rect',0,28,800,572]);
 assert.equal(target.calls.indexOf('clip')<target.calls.findIndex(v=>Array.isArray(v)&&v[0]==='transform'&&v[1].e===47),true,'scene clipping precedes the furniture transform');
});

test('operation failure restores the main context before later HUD and editor callbacks',()=>{
 const target=context('operations'),f=fixture(target);
 assert.throws(()=>f.run(()=>{target.fillStyle='red';throw new Error('device draw failed');}),/device draw failed/);
 assert.equal(f.sandbox.cx,f.original);assert.equal(target.depth,0);assert.equal(target.fillStyle,'#172b3d');
});

test('Good mode keeps its original immediate drawing and mutations',()=>{
 const f=fixture(null);let ticks=0;
 f.run(()=>{ticks++;f.sandbox.cx.fillStyle='green';});
 assert.equal(ticks,1);assert.equal(f.original.fillStyle,'green');assert.equal(f.original.calls.length,0);
});

test('world composition precedes game, pause and editor overlays without a second premium frame loop',()=>{
 const shop=html.slice(html.indexOf('function drawShop(){'),html.indexOf('\nfunction drawXtancoLogo('));
 assert.match(shop,/premiumView\?\.begin\?\.\(cx,cv\)/);
 assert.match(shop,/premiumView\.paint\(cx,performance\.now\(\),\(\)=>punchDsScreenHoles\(\)\)/);
 assert.ok(shop.indexOf('premiumView.paint')>shop.indexOf('drawDoorForegroundPeople()'));
 assert.ok(shop.indexOf('premiumView.paint')<shop.indexOf('// ── DAY / NIGHT AMBIENT OVERLAY'));
 assert.ok(shop.indexOf('premiumView.paint')<shop.indexOf('drawRealLighting()'));
 const final=html.slice(html.indexOf('function finalizeFrame(){'),html.indexOf('\nfunction trimHudLabel('));
 assert.doesNotMatch(final,/__xtancoPremiumView|\.frame\(/);
 const editor=html.slice(html.indexOf('function drawEditor(){'),html.indexOf('// ── STAFF MODE overlays'));
 assert.ok(editor.indexOf('drawShop();')<editor.indexOf('// Grid overlay'));
 assert.match(html,/editor:state===S\.EDITOR,active:!!G&&\(state===S\.GAME\|\|state===S\.PAUSE\|\|state===S\.EDITOR\)/);
});

test('live devices and actors are routed through one shared operational pass',()=>{
 const shop=html.slice(html.indexOf('function drawShop(){'),html.indexOf('\nfunction drawXtancoLogo('));
 for(const callback of ['drawWallClock','drawLED','drawAirConditioning','drawTurnManager','drawCornerSecurityCamera','drawAltadisTFT','drawEscaparate','drawAromatizer']){
  assert.match(shop,new RegExp('drawShopOperation\\(\\(\\)=>'+callback+'\\('));
 }
 for(const kind of ['staff','cust','passerby','saca','thief','guardiaCivil','opinador','unitreeBot']){
  assert.match(shop,new RegExp("case '"+kind+"': drawShopOperation\\(\\(\\)=>[^;]+,'actor'\\); break;"));
 }
 assert.match(shop,/positionTotemAvatar\(\)/);assert.match(shop,/positionWallAvatar\(\)/);
});

test('MUPI capture combines the current world and actor layer instead of exporting a transparent actor',()=>{
 const helper=html.slice(html.indexOf('let shopCaptureFrame=null;'),html.indexOf('\nfunction mupiCamSnap('));
 const draws=[],world={width:800,height:600},operations={width:800,height:600};
 const combined={width:0,height:0,getContext:()=>({clearRect:(...args)=>draws.push(['clear',...args]),drawImage:(image)=>draws.push(['draw',image])})};
 const context=vm.createContext({cv:world,cx:{canvas:operations},document:{createElement:()=>combined}});
 vm.runInContext(helper,context);
 assert.equal(context.getShopCaptureFrame(),combined);
 assert.equal(combined.width,800);assert.equal(combined.height,600);
 assert.deepEqual(draws,[['clear',0,0,800,600],['draw',world],['draw',operations]]);
 context.cx={canvas:world};assert.equal(context.getShopCaptureFrame(),world,'Good retains the existing direct capture');
});


test('floor effects retain the diamond clip and editor layers retain the editor viewport',()=>{
 const target=context('operations'),f=fixture(target);
 f.sandbox.drawShopOperation(()=>{},'floor-effect');
 assert.equal(target.calls.filter(v=>v==='clip').length,2,'viewport and floor polygon are both applied');
 assert.deepEqual(target.calls.find(v=>Array.isArray(v)&&v[0]==='move'),['move',400,180]);
 assert.deepEqual(target.calls.filter(v=>Array.isArray(v)&&v[0]==='line'),[['line',624,292],['line',496,356],['line',272,244]]);
 target.calls.length=0;f.sandbox.editorSceneActive=true;
 f.sandbox.drawShopOperation(()=>{},'selection');
 assert.deepEqual(target.calls.find(v=>Array.isArray(v)&&v[0]==='rect'),['rect',0,28,800,466]);
});

test('selection and rain remain visible in the operational layer',()=>{
 const shop=html.slice(html.indexOf('function drawShop(){'),html.indexOf('\nfunction drawXtancoLogo('));
 assert.match(shop,/if\(isSelectedEditorFurniture\)drawShopOperation\(/);
 assert.match(shop,/if\(!editorSceneActive&&weatherFloor==='rain'\)drawShopOperation\(/);
});
