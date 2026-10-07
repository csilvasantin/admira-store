import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('assets/xpace-shell.js');
const base = 'https://www.admiranext.com/assets/avatar.js?v=';
const fresh = base + '20261007-native-demo-control-1';
const old = base + '20261007-pill-1';
const flush = async () => {for (let i=0;i<12;i++) await Promise.resolve();};

// Execute the entire shipped IIFE. A real topBar with no generated shell marker
// selects the early inline branch, which never reaches suiteExperto().
function page(url, {iframe=false, existing=false}={}) {
  const nodes=[], appended=[], requests=[], listeners={}, store=new Map();
  function node(tag) {
    const attrs={}, events=new Map();
    return {tagName:tag.toUpperCase(), attrs, dataset:{}, style:{}, isConnected:false,
      setAttribute(k,v){attrs[k]=String(v);}, getAttribute(k){return attrs[k]??null;},
      remove(){this.isConnected=false;},
      addEventListener(type,fn){if(!events.has(type)) events.set(type,new Set());events.get(type).add(fn);},
      dispatch(type){this['on'+type]?.();for(const fn of [...events.get(type)||[]]) fn();}};
  }
  const append = n => {n.isConnected=true; nodes.push(n); appended.push(n);};
  const currentScript={src:new URL('/assets/xpace-shell.js?v=20261007-native-demo-control-2',url).href,dataset:{shell:'inline'}};
  const document={readyState:'loading', currentScript, title:'Store',
    documentElement:{lang:'es',setAttribute(){},getAttribute(){return null;}},
    head:{append,appendChild:append},createElement:node,
    getElementById:id=>id==='topBar'?{id}:null,
    querySelector(selector){
      if(selector==='[data-xpace-shell]')return null;
      if(selector==='script[data-admira-avatar]')return nodes.find(n=>n.isConnected&&Object.hasOwn(n.attrs,'data-admira-avatar'))||null;
      if(selector==='link[data-expert-legibility]')return nodes.find(n=>n.isConnected&&Object.hasOwn(n.attrs,'data-expert-legibility'))||null;
      return null;
    },querySelectorAll(){return[];},addEventListener(type,fn){listeners[type]=fn;},dispatchEvent(){}};
  const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  const location=new URL(url),window={document,location,localStorage:storage,sessionStorage:storage,
    history:{replaceState(){}},addEventListener(){},dispatchEvent(){},setTimeout(){return 1;},clearTimeout(){},
    fetch(url){requests.push(url);throw Error('the inline bootstrap must not call a network API');}};
  window.window=window;window.self=window;window.top=iframe?{}:window;
  if(existing){const s=node('script');s.src=old;s.setAttribute('data-admira-avatar','');s.isConnected=true;nodes.push(s);}
  const context=vm.createContext({...window,window,document,URL,URLSearchParams,Promise,
    CustomEvent:class{},MutationObserver:class{observe(){}disconnect(){}}});
  const boot=()=>vm.runInContext(source,context,{filename:'assets/xpace-shell.js'});
  return {window,boot,nodes,appended,requests,avatars:()=>nodes.filter(n=>n.isConnected&&n.tagName==='SCRIPT'&&Object.hasOwn(n.attrs,'data-admira-avatar'))};
}

test('the actual inline branch loads the fresh marked avatar on all exact native Store hosts',()=>{
  for(const host of ['admira.store','www.admira.store','xpaceos.com','www.xpaceos.com']){
    const f=page(`https://${host}/admira-xp/?ax_demo=store`);f.boot();
    assert.equal(f.window.XpaceShell.inline,true,'the real early-return branch ran');
    assert.equal(f.avatars().length,1);assert.equal(f.avatars()[0].src,fresh);
    assert.equal(f.avatars()[0].attrs['data-admira-avatar'],'');assert.equal(f.avatars()[0].async,true);
    assert.equal(f.nodes.some(n=>n.src?.includes('/suite/experto.js')),false,'this inline branch does not reach the general suite loader');
    assert.deepEqual(f.requests,[]);
  }
});

test('normal, foreign, HTTP, mismatched and duplicate query visits retain the existing avatar pin',()=>{
  for(const url of ['https://www.admira.store/admira-xp/',
    'https://www.admira.store/admira-xp/?ax_demo=biz',
    'https://www.admira.store/admira-xp/?ax_demo=store-other',
    'http://www.admira.store/admira-xp/?ax_demo=store',
    'https://sub.admira.store/admira-xp/?ax_demo=store',
    'https://admira.store.evil.test/admira-xp/?ax_demo=store',
    'https://www.admira.app/admira-xp/?ax_demo=store',
    'https://localhost/admira-xp/?ax_demo=store',
    'https://www.admira.store/admira-xp/?ax_demo=store&ax_demo=store',
    'https://www.admira.store/admira-xp/?ax_demo=store&ax_demo=biz',
    'https://www.admira.store/admira-xp/?ax_demo=biz&ax_demo=store']){
    const f=page(url);f.boot();assert.equal(f.window.XpaceShell.inline,true);
    assert.equal(f.avatars().length,1);assert.equal(f.avatars()[0].src,old,url);assert.deepEqual(f.requests,[]);
  }
});

test('repeated inline boot awaits a preexisting in-flight loader without a second script',async()=>{
  for(const existing of [false,true]){
    const f=page('https://www.admira.store/admira-xp/?ax_demo=store',{existing});f.boot();f.boot();
    assert.equal(f.window.XpaceShell.inline,true);assert.equal(f.avatars().length,1);
    assert.equal(f.appended.filter(n=>n.tagName==='SCRIPT'&&Object.hasOwn(n.attrs,'data-admira-avatar')).length,existing?0:1);
    let settled=false,calls=0;
    const result=f.window.XpaceShell.avatar('/avatar on').then(value=>{settled=true;return value;});
    await flush();assert.equal(settled,false,'an in-flight script is awaited, not treated as loaded');
    f.window.AdmiraAvatar={decide:()=>true,handle:async()=>{calls++;return 'loaded locally';}};
    f.avatars()[0].dispatch('load');assert.equal(await result,'loaded locally');
    assert.equal(calls,1);assert.equal(f.avatars().length,1);assert.deepEqual(f.requests,[]);
  }
});

test('an embedded inline Store keeps its API and never loads the avatar',()=>{
  const f=page('https://www.admira.store/admira-xp/?ax_demo=store',{iframe:true});f.boot();f.boot();
  assert.equal(f.window.XpaceShell.inline,true);assert.equal(f.avatars().length,0);
  assert.equal(f.appended.filter(n=>n.tagName==='SCRIPT').length,0);assert.deepEqual(f.requests,[]);
});

test('the release signature matches the canonical seal and has release notes',()=>{
  const html=read('index.html'),seal=html.match(/name="admiranext-version" content="([^"]+)"/)[1];
  const signature=JSON.parse(read('release-signature.json')),news=JSON.parse(read('novedades.json'));
  assert.equal(signature.version,seal);assert.equal(signature.signature,signature.deployer+' · '+signature.machine);
  assert.ok(Array.isArray(news[seal])&&news[seal].length>0);
  assert.ok(news[seal].every(line=>typeof line==='string'&&line.trim()));
});
