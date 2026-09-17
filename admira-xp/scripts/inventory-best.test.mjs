import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./inventory-best.mjs',import.meta.url),'utf8');
function harness({importError=false,renderError=false,initialState={layout:[{id:'counter'}],moving:false}}={}){
 let current=initialState,nextFrame=1,connected=true,options;
 const frames=new Map(),events=[],calls=[];
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.attrs={};this.hidden=false;this.classes=new Set();this.classList={add:v=>this.classes.add(v),remove:v=>this.classes.delete(v)};}
  setAttribute(k,v){this.attrs[k]=v;}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
  getBoundingClientRect(){return {width:1000,height:625};}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  removeEventListener(k,fn){this.listeners[k]=(this.listeners[k]||[]).filter(f=>f!==fn);}
  emit(k,extra={}){const e={key:k,prevented:false,preventDefault(){this.prevented=true;},...extra};for(const fn of this.listeners[k]||[])fn(e);return e;}
 }
 const container=new Element('figure'),document={hidden:false,createElement:tag=>new Element(tag)};
 const viewer={bestPeopleStatus:{ready:0,loading:2,fallback:0,total:2},resize(...args){calls.push(['resize',...args]);},render(now){if(renderError)throw Error('WebGL draw failed');calls.push(['render',now]);},update(next){calls.push(['update',next]);},preset(v){calls.push(['preset',v]);},zoomBy(v){calls.push(['zoom',v]);},dispose(){calls.push(['dispose']);}};
 let finishImport;
 const importPromise=new Promise((resolve,reject)=>{finishImport=()=>importError?reject(Error('import failed')):resolve({createLifeRenderer:o=>{options=o;calls.push(['create']);return viewer;}});});
 const context=vm.createContext({document,window:{__xtancoVisualState:()=>current,__xtoreWindowPlayer:{shared:true}},createLifeSnapshot:()=>value=>value,loadRenderer:()=>importPromise,ResizeObserver:class{observe(){}disconnect(){connected=false;}},requestAnimationFrame:fn=>{const id=nextFrame++;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
 vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ').replace(/import\('\.\/life-renderer\.mjs[^']*'\)/,'loadRenderer()')+';globalThis.mount=mountInventoryBest;',context);
 const dispose=context.mount(container,error=>events.push(error||''));
 return {container,document,viewer,calls,events,dispose,get connected(){return connected;},get options(){return options;},get frames(){return frames.size;},get canvas(){return container.children[0];},get label(){return container.children[1];},get controls(){return container.children[2];},setState(value){current=value;},async load(){finishImport();await Promise.resolve();await Promise.resolve();},tick(now=0){const entry=frames.entries().next().value;assert.ok(entry,'animation frame is scheduled');frames.delete(entry[0]);entry[1](now);}};
}

test('Best readiness follows a rendered frame, updates shared actors and reports loaded vs provisional people',async()=>{
 const h=harness();assert.match(h.label.textContent,/Cargando/);assert.deepEqual(h.events,[]);assert.ok(h.controls.children.every(b=>b.disabled));
 await h.load();h.tick();assert.equal(h.options.assetQuality,'best');assert.equal(h.options.getPlayer().shared,true);assert.deepEqual(h.events,['']);assert.match(h.label.textContent,/0\/2 personas Best.*cargando personas/);assert.ok(h.controls.children.every(b=>!b.disabled));
 h.viewer.bestPeopleStatus={ready:1,loading:0,fallback:1,total:2};h.setState({layout:[],moving:true});h.tick(120);assert.match(h.label.textContent,/0 objetos.*mudanza.*1\/2 personas Best.*1 con modelo provisional/);assert.equal(h.calls.filter(c=>c[0]==='create').length,1);assert.equal(h.calls.filter(c=>c[0]==='update').length,1);
 h.dispose();assert.equal(h.connected,false);assert.equal(h.container.children.length,0);assert.equal(h.frames,0);assert.equal(h.calls.filter(c=>c[0]==='dispose').length,1);
});

test('scene camera controls and selection work without issuing game commands',async()=>{
 const h=harness();await h.load();h.tick();for(const b of h.controls.children)b.emit('click');assert.deepEqual(h.calls.filter(c=>['preset','zoom'].includes(c[0])),[['preset','mapped'],['preset','detail'],['zoom',.8],['zoom',1.25]]);
 assert.equal(h.canvas.emit('keydown',{key:'+'}).prevented,true);assert.equal(h.canvas.emit('keydown',{key:'0'}).prevented,true);assert.equal(h.canvas.emit('keydown',{key:'q'}).prevented,false);
 h.options.onSelect({actor:{name:'Visitante uno'}});assert.equal(h.container.children[3].textContent,'Visitante uno');assert.equal(h.container.children[3].hidden,false);h.options.onSelect(null);assert.equal(h.container.children[3].hidden,true);h.dispose();
});

test('closed views do not allocate a renderer when their module download finishes',async()=>{
 const h=harness();h.dispose();await h.load();assert.deepEqual(h.calls,[]);assert.deepEqual(h.events,[]);assert.equal(h.frames,0);
});

test('module and rendering failures show an explicit fallback and never report success',async()=>{
 for(const setting of [{importError:true},{renderError:true}]){const h=harness(setting);await h.load();if(!setting.importError)h.tick();assert.deepEqual(h.events,['No se ha podido abrir Best 3D.']);assert.equal(h.label.attrs.role,'alert');assert.match(h.label.textContent,/Good o Better.*Escape/);assert.equal(h.canvas.hidden,true);assert.equal(h.controls.hidden,true);assert.equal(h.frames,0);h.dispose();}
});

test('Best waits for the real game snapshot and times out without inventing a scene',async()=>{
 const h=harness({initialState:null});await h.load();h.tick(0);assert.deepEqual(h.calls,[]);assert.deepEqual(h.events,[]);assert.match(h.label.textContent,/Esperando al Xtanco/);h.setState({layout:[],moving:false});h.tick(120);assert.equal(h.events[0],'');h.dispose();
 const timeout=harness({initialState:null});await timeout.load();timeout.tick(0);timeout.tick(30001);assert.deepEqual(timeout.events,['No se ha podido abrir Best 3D.']);assert.equal(timeout.frames,0);timeout.dispose();
});

test('context loss terminates the frame loop and reports the failure after earlier readiness',async()=>{
 const h=harness();await h.load();h.tick();assert.equal(h.canvas.emit('webglcontextlost').prevented,true);assert.deepEqual(h.events,['','No se ha podido abrir Best 3D.']);assert.equal(h.frames,0);assert.equal(h.calls.filter(c=>c[0]==='dispose').length,1);h.dispose();assert.equal(h.calls.filter(c=>c[0]==='dispose').length,1);
});
