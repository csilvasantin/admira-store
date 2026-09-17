import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('./visual-tier-controls.mjs',import.meta.url),'utf8');
function harness(){
  const created=[];
  class Element{
    constructor(tag){this.tag=tag;this.attrs={};this.dataset={};this.children=[];this.listeners={};}
    setAttribute(name,value){this.attrs[name]=String(value);}
    set innerHTML(value){
      this.markup=value;
      this.children=[...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match=>{
        const button=new Element('button');button.parent=this;button.textContent=match[2].replace(/<[^>]+>/g,'');
        for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){
          button.attrs[attr[1]]=attr[2];if(attr[1]==='data-visual-mode')button.dataset.visualMode=attr[2];
        }
        return button;
      });
    }
    querySelectorAll(selector){assert.equal(selector,'[data-visual-mode]');return this.children;}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    remove(){this.removed=true;this.parent=null;}
    emit(type,props={}){
      const event={stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};
      for(let element=this;element;element=element.parent){element[`on${type}`]?.(event);for(const fn of element.listeners[type]||[])fn(event);if(event.stopped)break;}
      return event;
    }
  }
  const context=vm.createContext({document:{createElement(tag){created.push(tag);return new Element(tag);}}});
  vm.runInContext(source.replace(/export function /g,'function '),context);
  return {created,Element,create:options=>context.createTierControls(options),update:state=>context.updateTierControls(state)};
}

test('all control groups share explicit numbered labels and identify Best as a live preview',()=>{
  const h=harness(),group=h.create({context:'Modo avanzado'}).element;
  assert.equal(group.attrs.role,'group');assert.equal(group.attrs['aria-label'],'Modo avanzado');
  assert.deepEqual(group.children.map(button=>button.dataset.visualMode),['good','better','best','matrix']);
  for(const [index,name]of ['Good','Better','Best','Matrix'].entries())assert.match(group.children[index].textContent,new RegExp(`0${index+1}\\.- ${name}`));
  const best=group.children[2];assert.match(best.textContent,/32 bits.*3D en vivo/);assert.match(best.attrs.title,/tienda y personas en 3D en vivo/);
  assert.match(group.children[3].textContent,/Matrix.*Avenida Admira/);
  assert.match(group.children[3].attrs.title,/mobiliario editable y visitantes en vivo.*cámara fija/);
  assert.notEqual(best.attrs['aria-disabled'],'true');assert.equal(group.attrs['aria-busy'],'false');
  assert.deepEqual(group.children.map(button=>button.attrs['aria-pressed']),['true','false','false','false']);
  assert.deepEqual(h.created,['div']);
});

test('new groups inherit current state and every mounted group updates without executing commands',()=>{
  const h=harness(),choices=[],first=h.create({choose:tier=>choices.push(tier)});
  h.update({mode:'best',busy:true,availability:'preview'});const second=h.create({context:'Best'});
  for(const item of [first,second]){
    assert.equal(item.element.attrs['aria-busy'],'true');
    assert.deepEqual(item.element.children.map(button=>button.attrs['aria-pressed']),['false','false','true','false']);
  }
  assert.deepEqual(choices,[],'rendering control state must not activate a view');
  h.update({mode:'better',busy:false});
  for(const item of [first,second])assert.deepEqual(item.element.children.map(button=>button.attrs['aria-pressed']),['false','true','false','false']);
});

test('control input stays local and forwards only the exact selected tier to its callback',()=>{
  const h=harness(),choices=[],group=h.create({choose:tier=>choices.push(tier)}).element,parent=new h.Element('parent');group.parent=parent;
  let leaked=0;
  const events=['click','keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'];
  for(const type of events)parent.addEventListener(type,()=>leaked++);
  for(const button of group.children)assert.equal(button.emit('click').stopped,true);
  assert.deepEqual(choices,['good','better','best','matrix']);assert.equal(leaked,0);
  for(const type of events.filter(type=>type!=='click'))assert.equal(group.emit(type,{key:'q'}).stopped,true);
  assert.equal(leaked,0);assert.deepEqual(choices,['good','better','best','matrix']);
  assert.doesNotThrow(()=>h.create().element.children[2].emit('click'),'a missing optional callback is harmless');
});

test('disposing removes a control group from subsequent updates and is idempotent',()=>{
  const h=harness(),old=h.create(),current=h.create();old.dispose();old.dispose();h.update({mode:'best',busy:true});
  assert.equal(old.element.removed,true);assert.equal(old.element.attrs['aria-busy'],'false');
  assert.equal(current.element.attrs['aria-busy'],'true');assert.equal(current.element.children[2].attrs['aria-pressed'],'true');
});
