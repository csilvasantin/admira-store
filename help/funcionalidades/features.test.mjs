import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Run the shipped controller against a small DOM stub, following the app's UI
// tests. No browser, network, command entrypoint or MCP backend is invoked.
const controllerUrl=new URL('./features.mjs',import.meta.url);
const source=fs.readFileSync(controllerUrl,'utf8')
  .replace('import.meta.url',JSON.stringify(controllerUrl.href))
  .replace(/void loadCatalog\(\);\s*$/,'');
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const canonical=JSON.parse(fs.readFileSync(new URL('../../mcp/funcionalidades.json',import.meta.url),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
const fixture=()=>({schema_version:'1.0',updated_at:'2026-09-15',audit:{source_commit:'a'.repeat(40)},numbering:{policy:'Los ID son estables; los filtros no renumeran.'},features:[
  ['26','Cámara orbital','native'],['01','Cartelería Digital','partial'],['02','Música y megafonía','classic_only'],
  ['03','Panel LED','presentation_only'],['04','Administración externa','outside_view']
].map(([number,title,status])=>({id:`XP-F${number}`,number,title,summary:`Descripción de ${title}`,good:{status:'code_present'},better:{status},best:{status:'planned'},commands:[],mcp:{tools:[]},restore:[],evidence:[]}))});

function harness({catalog=fixture(),fetcher,mobile=false,hash=''}={}){
  let document;
  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.value='';this._text='';}
    set textContent(value){this._text=String(value);this.children=[];}
    get textContent(){return this._text+this.children.map(child=>typeof child==='string'?child:child.textContent).join('');}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this._text='';this.children=[...children];}
    setAttribute(name,value){this.attrs[name]=String(value);}
    getAttribute(name){return this.attrs[name]??null;}
    removeAttribute(name){delete this.attrs[name];}
    addEventListener(type,callback){(this.listeners[type]??=[]).push(callback);}
    async emit(type){await Promise.all((this.listeners[type]||[]).map(callback=>callback({type,target:this})));}
    focus(){document.activeElement=this;}
    scrollIntoView(options){this.scrolled=options;}
  }
  const elements=new Map([...html.matchAll(/<([\w-]+)\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(([markup,tag,id])=>{
    const element=new Element(tag);element.id=id;element.hidden=/\shidden\b/.test(markup);element.disabled=/\sdisabled\b/.test(markup);element.open=/\sopen\b/.test(markup);return [id,element];
  }));
  const radios=[...html.matchAll(/<input\b[^>]*name="coverage-filter"[^>]*value="([^"]+)"[^>]*>/g)].map(([markup,value])=>{
    const radio=new Element('input');radio.value=value;radio._checked=/\schecked\b/.test(markup);
    Object.defineProperty(radio,'checked',{get(){return this._checked;},set(checked){if(checked)for(const item of radios)item._checked=false;this._checked=checked;}});return radio;
  });
  const descendants=element=>[element,...element.children.filter(child=>typeof child!=='string').flatMap(descendants)];
  document={activeElement:null,createElement:tag=>new Element(tag),
    getElementById:id=>elements.get(id)||[...elements.values()].flatMap(descendants).find(element=>element.id===id)||null,
    querySelector:selector=>{
      if(selector==='input[name="coverage-filter"]:checked')return radios.find(radio=>radio.checked);
      const value=selector.match(/^input\[name="coverage-filter"\]\[value="(\w+)"\]$/)?.[1];
      assert.ok(value,`unsupported selector in DOM stub: ${selector}`);return radios.find(radio=>radio.value===value);
    }
  };
  const requests=[],timers=new Map(),window=new Element('window'),location={hash};let sequence=0;
  const context=vm.createContext({document,window,location,URL,AbortController,SyntaxError,
    matchMedia:()=>({matches:mobile}),requestAnimationFrame:callback=>{callback();return 1;},
    setTimeout:(callback,delay)=>{const id=++sequence;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id),
    fetch:async(url,options)=>{requests.push({url:String(url),options});return fetcher?fetcher(requests.length,options):{ok:true,json:async()=>clone(catalog)};}
  });
  vm.runInContext(source+'\nglobalThis.audit={loadCatalog,validateCatalog,sourceCommit};',context);
  return {document,window,location,requests,timers,radios,api:context.audit,
    get:id=>document.getElementById(id),load:()=>context.audit.loadCatalog(),
    visible:()=>elements.get('feature-list').children.filter(article=>!article.hidden).map(article=>article.id),
    visibleLinks:()=>elements.get('feature-nav').children.filter(link=>!link.hidden).map(link=>link.href),
    async search(value){elements.get('feature-search').value=value;await elements.get('feature-search').emit('input');},
    async filter(value){radios.find(radio=>radio.value===value).checked=true;await elements.get('feature-filters').emit('change');}
  };
}

test('loads the canonical JSON without copying its data or executing commands',async()=>{
  const h=harness({catalog:canonical});assert.equal(h.get('feature-search').disabled,true);await h.load();
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,new URL('../../mcp/funcionalidades.json',controllerUrl).href);
  assert.equal(h.requests[0].options.cache,'no-cache');assert.ok(h.requests[0].options.signal instanceof AbortSignal);
  assert.equal(h.get('feature-list').children.length,canonical.features.length);
  assert.equal(h.get('total-count').textContent,String(canonical.features.length));
  const gaps=canonical.features.filter(feature=>feature.better.status!=='native').length;
  assert.equal(h.get('gap-count').textContent,String(gaps));
  assert.match(h.get('coverage-note').textContent,new RegExp(`${gaps} funciones con huecos.*${gaps} funciones totalmente ausentes`));
  assert.equal(h.get('numbering-note').textContent,canonical.numbering.policy);
  assert.equal(h.get('feature-search').disabled,false);assert.equal(h.get('feature-filters').disabled,false);
  assert.equal(h.get('load-state').hidden,true);assert.equal(h.get('load-error').hidden,true);assert.equal(h.timers.size,0);
  for(const feature of canonical.features){assert.equal(h.get(`${feature.id}-title`).textContent,`${feature.number}.- ${feature.title}`);assert.ok(h.visibleLinks().includes(`#${feature.id}`));}
});

test('rejects invalid schema, empty data, duplicate or inconsistent stable IDs',()=>{
  const h=harness(),valid=fixture();assert.equal(h.api.validateCatalog(valid),valid);
  const cases=[null,{...valid,schema_version:'2.0'},{...valid,features:[]},
    {...valid,features:[valid.features[0],valid.features[0]]},
    ...[{id:'XP-Fx'},{id:'XP-F25'},{number:'1'},{number:26},{title:' '}].map(change=>({...valid,features:[{...valid.features[0],...change}]}))];
  for(const value of cases)assert.throws(()=>h.api.validateCatalog(value),/catálogo/);
  // Order and gaps in numbering are intentional: neither implies renumbering.
  assert.deepEqual(valid.features.map(feature=>feature.id),['XP-F26','XP-F01','XP-F02','XP-F03','XP-F04']);
});

test('a failed load is honest and the retry button loads the same canonical resource',async()=>{
  const h=harness({fetcher:async attempt=>attempt===1?{ok:false,status:503}:{ok:true,json:async()=>fixture()}});
  await h.load();assert.equal(h.get('load-error').hidden,false);assert.match(h.get('load-error-detail').textContent,/HTTP 503/);
  assert.equal(h.get('feature-list').children.length,0);assert.equal(h.get('feature-search').disabled,true);assert.equal(h.timers.size,0);
  await h.get('retry-load').emit('click');assert.equal(h.requests.length,2);assert.equal(h.requests[0].url,h.requests[1].url);
  assert.equal(h.get('load-error').hidden,true);assert.equal(h.get('feature-list').children.length,5);assert.equal(h.timers.size,0);
});

test('malformed JSON, invalid catalog data and timeout do not produce estimated states',async()=>{
  for(const [fetcher,expected]of [
    [async()=>({ok:true,json:async()=>{throw new SyntaxError('invalid JSON');}}),/JSON válido.*No se muestran estados estimados/],
    [async()=>({ok:true,json:async()=>({schema_version:'1.0',features:[]})}),/lista válida/],
    [async()=>{throw Object.assign(new Error('aborted'),{name:'AbortError'});},/no ha respondido a tiempo/]
  ]){
    const h=harness({fetcher});await h.load();assert.equal(h.get('load-error').hidden,false);assert.match(h.get('load-error-detail').textContent,expected);
    assert.equal(h.get('feature-list').children.length,0);assert.equal(h.get('feature-search').disabled,true);assert.equal(h.timers.size,0);
  }
});

test('search ignores accents and case; filters keep cards, index and counts in sync',async()=>{
  const h=harness();await h.load();await h.search('MUSICA megafonia');assert.deepEqual(h.visible(),['XP-F02']);assert.deepEqual(h.visibleLinks(),['#XP-F02']);
  await h.search('carteleria');assert.deepEqual(h.visible(),['XP-F01']);await h.search('');
  await h.filter('gaps');assert.deepEqual(h.visible(),['XP-F01','XP-F02','XP-F03','XP-F04']);assert.equal(h.get('result-count').textContent,'4 de 5 funciones');
  await h.filter('native');assert.deepEqual(h.visible(),['XP-F26']);assert.deepEqual(h.visibleLinks(),['#XP-F26']);
  await h.search('sin coincidencia');assert.equal(h.get('empty-state').hidden,false);assert.equal(h.get('result-count').textContent,'0 de 5 funciones');
  await h.get('clear-search').emit('click');assert.equal(h.get('empty-state').hidden,true);assert.equal(h.visible().length,5);assert.equal(h.document.activeElement,h.get('feature-search'));
});

test('deep links preserve explicit IDs and reveal filtered entries without renumbering',async()=>{
  const h=harness({hash:'#XP-F26',mobile:true});await h.load();assert.equal(h.get('feature-index').open,false);
  assert.equal(h.get('XP-F26-title').textContent,'26.- Cámara orbital');assert.ok(h.get('XP-F26').scrolled);
  await h.filter('native');h.location.hash='#XP-F02';await h.window.emit('hashchange');
  assert.equal(h.visible().length,5);assert.ok(h.get('XP-F02').scrolled);assert.equal(h.get('XP-F02-title').textContent,'02.- Música y megafonía');
  assert.equal(h.get('feature-nav').children.find(link=>link.href==='#XP-F02').getAttribute('aria-current'),'location');
  h.location.hash='#not-in-catalog';await h.window.emit('hashchange');assert.equal(h.visible().length,5);
});

test('commit references allow only 40 hexadecimal characters and use the fixed repository URL',async()=>{
  const catalog=fixture(),h=harness({catalog});await h.load();
  const link=h.get('catalog-source').children.find(child=>child.tagName==='A');
  assert.equal(link.href,`https://github.com/csilvasantin/xpaceos/tree/${catalog.audit.source_commit}`);
  assert.equal(link.title,catalog.audit.source_commit);assert.match(h.get('catalog-source').textContent,/no a HEAD/);
  assert.match(h.get('XP-F01').textContent,/líneas corresponden al commit auditado/);
  for(const value of ['a'.repeat(39),'a'.repeat(41),'g'.repeat(40),'https://example.org','javascript:alert(1)','a'.repeat(40)+'/../../other'])assert.equal(h.api.sourceCommit({audit:{source_commit:value}}),'');
  const unsafe=harness({catalog:{...catalog,audit:{source_commit:'https://example.org'}}});await unsafe.load();
  assert.equal(unsafe.get('catalog-source').children.length,0);assert.match(unsafe.get('catalog-source').textContent,/No se ha indicado un commit válido/);
});

test('navigation updates explain their scope without replacing the audit baseline',async()=>{
  const catalog=clone(canonical),h=harness({catalog});await h.load();
  assert.ok(h.get('catalog-source').textContent.includes(catalog.audit.baseline_note));
  assert.match(h.get('catalog-source').textContent,/revisión funcional original/);
  assert.ok(h.get('catalog-source').children.some(child=>child.tagName==='A'&&child.title===catalog.audit.source_commit));
  assert.match(h.get('XP-F26').textContent,/preview:true/);
  assert.equal(catalog.features.filter(feature=>feature.best.status==='planned').length,30);
});

test('concurrent retries share one pending request and clear the timeout on completion',async()=>{
  let finish;const h=harness({fetcher:()=>new Promise(resolve=>{finish=resolve;})});
  const loading=h.load();await h.get('retry-load').emit('click');assert.equal(h.requests.length,1);assert.equal(h.timers.size,1);
  finish({ok:true,json:async()=>fixture()});await loading;assert.equal(h.visible().length,5);assert.equal(h.timers.size,0);
});
