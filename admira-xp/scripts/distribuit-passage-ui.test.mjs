import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createDistribuitController} from './distribuit-controller.mjs';
import {furniturePose,SCALE_LIMITS} from './distribuit.mjs';
import {isWallFurniture} from './furniture-geometry.mjs';
import {diagnosePassage} from './passage-diagnostic.mjs';
import {inventoryName} from '../../inventario/labels.mjs';

const source=fs.readFileSync(new URL('./distribuit-ui.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function mountDistribuit','function mountDistribuit');
const target={id:'target',label:'Mesa destino',type:'custom',fp:[1,1],col:4,row:3};
const barrier={id:'barrier',label:'Bloqueo entrada',type:'custom',fp:[2,5],col:11.8,row:1};
const base=()=>({active:true,roomId:'test',cols:14,rows:8,layout:[structuredClone(target)],hardness:{fixed:[]},doorOpen:0,doorRow:3.35,doorHalfWidth:1});

function harness({lang='es',scene=base()}={}){
  let document,current=structuredClone(scene),commits=0,mutations=0,ends=0,diagnoses=0;
  class Element{
    constructor(name){this.name=name;this.tagName=name.toUpperCase();this.dataset={};this.attributes={};this.children=[];this.queries=new Map();this.value=name==='[data-passage-actor]'?'human':'';this.checked=name==='[type="checkbox"]';this.hidden=false;const names=new Set();this.classList={add:v=>names.add(v),remove:v=>names.delete(v),contains:v=>names.has(v)};}
    querySelector(key){if(!this.queries.has(key))this.queries.set(key,new Element(key));return this.queries.get(key);}
    querySelectorAll(key){return key.split(',').filter(k=>/^\[data-(action|step|turn|scale)/.test(k)).map(k=>this.querySelector(k));}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    removeAttribute(name){delete this.attributes[name];}
    replaceChildren(...children){this.children=[...children];}
    append(...children){this.children.push(...children);for(const c of children)c.parent=this;}
    remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
    matches(){return false;}
    focus(){document.activeElement=this;}
  }
  const created=[],dialog=new Element('dialog'),canvas=dialog.querySelector('canvas');canvas.setAttribute('aria-label','Original canvas');
  document={documentElement:{lang},activeElement:null,createElement:name=>{const e=new Element(name);created.push(e);return e;}};
  const bridge={begin:()=>({}),end:()=>ends++,read:()=>structuredClone(current),async commit(r){commits++;current.layout=current.layout.map(i=>i.id===r.id?{...i,col:r.col,row:r.row,rot:r.rot,sx:r.sx,sy:r.sy}:i);},async mutate(r){
    mutations++;
    if(r.action==='undo'){current.layout=current.layout.filter(i=>i.id!==r.change.id);if(r.change.before)current.layout.push(structuredClone(r.change.before));return;}
    const before=structuredClone(current.layout.find(i=>i.id===r.id));
    if(r.action==='remove')current.layout=current.layout.filter(i=>i.id!==r.id);
    if(r.action==='lock')current.layout=current.layout.map(i=>i.id===r.id?{...i,locked:r.locked}:i);
    return {kind:'object',id:r.id,before,after:structuredClone(current.layout.find(i=>i.id===r.id)||null)};
  },async catalog(){return [{assetId:'example',label:'Objeto',format:'3D',fp:[1,1]}];},async importItem(){const after={id:'added',label:'Añadido',type:'custom',fp:[1,1],col:3,row:6};current.layout.push(after);return {kind:'object',id:after.id,before:null,after:structuredClone(after)};}};
  const viewer={snapshot:{...scene,actors:[]},overlays:[],selected:[],setEditor(value){this.editor=value;},setEditorOverlay(value){this.overlays.push(value);},selectItem(id){this.selected.push(id);},update(value){this.snapshot=value;}};
  const floating={restore(){},dispose(){this.disposed=true;}};
  const context=vm.createContext({document,Option:class{constructor(text,value){this.text=text;this.value=value;}},createDistribuitController,furniturePose,SCALE_LIMITS,isWallFurniture,inventoryName,diagnosePassage:(...args)=>{diagnoses++;return diagnosePassage(...args);},attachFloatingPanel:()=>floating});
  vm.runInContext(source,context);
  const editor=context.mountDistribuit({dialog,viewer,bridge}),host=created.find(e=>e.name==='aside');
  const element=key=>host.querySelector(key),select=id=>{element('select').value=id;element('select').onchange();},check=()=>element('[data-action="checkPassage"]').onclick();
  return {editor,viewer,host,bridge,dialog,canvas,floating,element,select,check,get scene(){return current;},set scene(value){current=structuredClone(value);},get result(){return viewer.overlays.at(-1)?.passage;},get commits(){return commits;},get mutations(){return mutations;},get ends(){return ends;},get diagnoses(){return diagnoses;}};
}

test('the existing Distribute panel exposes accessible ES/EN passage controls and performs a read-only check',()=>{
  for(const lang of ['es','en']){
    const h=harness({lang}),before=JSON.stringify(h.scene);
    assert.ok(h.host.innerHTML.includes(lang==='es'?'Comprobar paso':'Check passage'));
    assert.ok(h.host.innerHTML.includes('aria-live="polite" aria-atomic="true"'));
    assert.ok(h.host.innerHTML.includes(lang==='es'?'puerta abierta virtualmente':'door virtually open'));
    h.select('target');h.check();assert.equal(h.result.status,'clear');assert.equal(h.result.targetId,'target');assert.equal(h.result.actor,'human');assert.equal(h.result.radius,.72);assert.equal(h.result.actualDoorOpen,0);assert.equal(h.result.doorMode,'open');
    assert.ok(h.element('[data-passage-result]').textContent.includes(lang==='es'?'Paso libre.':'Passage clear.'));
    assert.equal(JSON.stringify(h.scene),before);assert.equal(h.commits,0);assert.equal(h.mutations,0);assert.equal(h.viewer.snapshot.actors.length,0);
    h.editor.dispose();assert.equal(h.ends,1);
  }
});

test('selecting blockers and switching body retain the original destination; remove, undo and lock recompute',async()=>{
  const scene=base();scene.layout.push(structuredClone(barrier));const h=harness({scene});h.select('target');h.check();
  assert.equal(h.result.status,'blocked');assert.equal(h.result.route,null);assert.ok(h.result.blockers.some(b=>b.itemId==='barrier'));
  const button=h.element('[data-passage-blockers]').children.flatMap(row=>row.children).find(b=>b.textContent.includes('Bloqueo entrada'));assert.ok(button);button.onclick();
  assert.equal(h.viewer.selected.at(-1),'barrier');assert.equal(h.result.targetId,'target');
  const actor=h.element('[data-passage-actor]');actor.value='unitree';actor.onchange();assert.equal(h.result.actor,'unitree');assert.equal(h.result.radius,.52);assert.equal(h.result.targetId,'target');
  const count=h.diagnoses;await h.element('[data-action="lock"]').onclick();assert.ok(h.diagnoses>count);assert.equal(h.result.targetId,'target');
  await h.element('[data-action="remove"]').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.result.status,'clear');assert.equal(h.result.targetId,'target');
  await h.element('[data-action="undo"]').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.result.status,'blocked');assert.equal(h.result.targetId,'target');
  h.editor.dispose();
});

test('valid previews, commits, undo and external changes recalculate while invalid drafts never masquerade as saved geometry',async()=>{
  const h=harness();h.select('target');h.check();const original=h.result.navigationKey,count=h.diagnoses;
  const valid=h.viewer.editor.onPreview({col:4,row:4});assert.equal(valid.ok,true);assert.notEqual(h.result.navigationKey,original);assert.equal(h.commits,0);assert.equal(h.scene.layout[0].row,3);
  const previewKey=h.result.navigationKey;const invalid=h.viewer.editor.onPreview({col:-5,row:4});assert.equal(invalid.ok,false);assert.equal(h.result.navigationKey,previewKey);
  h.viewer.editor.onCancel();assert.equal(h.result.navigationKey,original);assert.ok(h.diagnoses>count);
  h.element('[data-axis="col"]').value='4';h.element('[data-axis="row"]').value='4';h.element('[data-action="move"]').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.commits,1);assert.equal(h.scene.layout[0].row,4);assert.notEqual(h.result.navigationKey,original);
  h.element('[data-action="undo"]').onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.result.navigationKey,original);
  h.scene.layout.push(structuredClone(barrier));h.editor.decorateSnapshot(h.viewer.snapshot);assert.equal(h.result.status,'blocked');
  h.scene.layout=h.scene.layout.filter(i=>i.id!=='target');h.editor.decorateSnapshot(h.viewer.snapshot);assert.equal(h.result.status,'unavailable');assert.equal(h.result.reason,'target_missing');assert.equal(h.result.route,null);assert.equal(h.element('[data-passage-blockers]').hidden,true);
  h.editor.dispose();
});

test('map visibility preserves the diagnostic; unavailable entrances and changing rooms clear stale routes; close disposes everything',()=>{
  const h=harness();h.check();const key=h.result.navigationKey,checks=h.diagnoses;
  const map=h.element('[type="checkbox"]');map.checked=false;map.onchange();assert.equal(h.result.navigationKey,key);assert.equal(h.diagnoses,checks);assert.equal(h.viewer.overlays.at(-1).showMap,false);
  h.scene={...h.scene,roomId:'cafebreria',imported:true};h.editor.decorateSnapshot(h.viewer.snapshot);assert.equal(h.result.status,'unavailable');assert.equal(h.result.route,null);assert.equal(h.element('[data-action="checkPassage"]').disabled,true);
  const check=h.element('[data-action="checkPassage"]').onclick;h.editor.dispose();h.editor.dispose();check();assert.equal(h.ends,1);assert.equal(h.host.removed,true);assert.equal(h.floating.disposed,true);assert.equal(h.viewer.editor,null);assert.equal(h.viewer.overlays.at(-1),null);assert.equal(h.canvas.getAttribute('aria-label'),'Original canvas');assert.equal(h.dialog.classList.contains('distribuit-open'),false);
  const cafe=harness({scene:{...base(),roomId:'cafebreria',imported:true}});cafe.check();assert.equal(cafe.result.reason,'entrance_unconfigured');assert.match(cafe.element('[data-passage-result]').textContent,/entrada operativa definida/);cafe.editor.dispose();
});

test('adding furniture and valid scale/rotation previews update the active check without changing its destination',async()=>{
  const h=harness();h.select('target');h.check();const count=h.diagnoses,original=h.result.navigationKey;
  const rotated=h.viewer.editor.onPreview({rot:1});assert.equal(rotated.ok,true);const scaled=h.viewer.editor.onPreview({sx:1.25,sy:1.25});assert.equal(scaled.ok,true);assert.ok(h.diagnoses>count);assert.notEqual(h.result.navigationKey,original);assert.equal(h.result.targetId,'target');h.viewer.editor.onCancel();
  await h.element('[data-action="catalog"]').onclick();await h.element('[data-action="add"]').onclick();assert.ok(h.scene.layout.some(i=>i.id==='added'));assert.equal(h.result.targetId,'target');assert.equal(h.viewer.selected.at(-1),'added');assert.notEqual(h.result.navigationKey,original);
  h.check();assert.equal(h.result.targetId,'added');h.editor.dispose();
});

test('English destination, blocker and furniture labels use the canonical inventory translator and preserve custom names',()=>{
  const scene=base();scene.layout[0].label='Mesa redonda';scene.layout.push({...barrier,label:'Vitrina · Bollería y bebidas'});
  const h=harness({scene,lang:'en'});h.select('target');h.check();assert.match(h.element('[data-passage-result]').textContent,/destination: Round table/);
  const labels=h.element('[data-passage-blockers]').children.flatMap(row=>row.children).map(button=>button.textContent);assert.ok(labels.some(label=>label==='Select · Display case · Pastries and drinks'));
  assert.ok(h.element('select').children.some(option=>option.text.includes('Round table · target')));assert.equal(h.scene.layout[0].label,'Mesa redonda');
  h.scene.layout[0].label='Mesa de Carlos';h.editor.decorateSnapshot(h.viewer.snapshot);assert.match(h.element('[data-passage-result]').textContent,/destination: Mesa de Carlos/);h.editor.dispose();
});

test('exterior depth and imported-space changes invalidate an active diagnostic before another check',()=>{
  const scene=base();scene.outsideDepth=3.5;const h=harness({scene});h.check();assert.equal(h.result.status,'clear');assert.equal(h.result.origin.col,17.4);
  const originalKey=h.result.navigationKey,checks=h.diagnoses;
  h.scene.outsideDepth=.6;h.editor.decorateSnapshot(h.viewer.snapshot);assert.ok(h.diagnoses>checks);assert.notEqual(h.result.navigationKey,originalKey);assert.ok(h.result.origin.col>=h.scene.cols&&h.result.origin.col<=h.scene.cols+h.scene.outsideDepth);assert.equal(h.result.status,'blocked');assert.equal(h.result.reason,'boundary_blocked');assert.equal(h.result.route,null);assert.deepEqual(h.result,diagnosePassage(h.scene,{actor:'human'}),'the displayed result must match a fresh physical check of the changed exterior');
  h.scene.outsideDepth=3.5;h.editor.decorateSnapshot(h.viewer.snapshot);assert.equal(h.result.status,'clear');const depthChecks=h.diagnoses;
  h.scene.imported=true;h.editor.decorateSnapshot(h.viewer.snapshot);assert.ok(h.diagnoses>depthChecks);assert.equal(h.result.status,'unavailable');assert.equal(h.result.reason,'entrance_unconfigured');assert.equal(h.result.origin,null);assert.equal(h.result.route,null);assert.deepEqual(Array.from(h.result.blockers),[]);
  h.editor.dispose();
});
