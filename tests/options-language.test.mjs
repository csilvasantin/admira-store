import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {interfaceTranslator} from '../admira-xp/scripts/interface-language.mjs';
const {languageCommand}=createRequire(import.meta.url)('../assets/xpace-shell.js');
const html=readFileSync(new URL('../admira-xp/index.html',import.meta.url),'utf8');
function environment(){
 const values=new Map([['xtanco_render','real'],['cli_history','["/marca starbucks"]']]);
 const win={XPACE_LANG_OVERRIDE:'es',XPACE_LANG_LOCKED:true};
 let applied,href;
 const env={window:win,lang:'es',url:'https://www.admira.store/admira-xp/?lang=es&langlock=1&quality=best&project=alsea&loc=sbux&marca=starbucks#desk',storage:{setItem:(key,value)=>values.set(key,value)},history:{state:{panel:'open'},replaceState(state,_,url){assert.deepEqual(state,{panel:'open'});href=url;}},apply:next=>{applied=next;}};
 return {env,win,values,get applied(){return applied;},get href(){return href;}};
}
test('explicit ENG overrides a pinned entry locale without navigation or loss of scene identity',()=>{
 const h=environment(),result=languageCommand('/idioma ENG',h.env);
 assert.equal(result.language,'en');assert.equal(result.local,true);assert.equal(h.applied,'en');assert.equal(h.win.XPACE_LANG_OVERRIDE,'en');assert.equal(h.win.XPACE_LANG_LOCKED,false);
 const url=new URL(h.href);assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.searchParams.has('langlock'),false);for(const [key,value]of Object.entries({quality:'best',project:'alsea',loc:'sbux',marca:'starbucks'}))assert.equal(url.searchParams.get(key),value);assert.equal(url.hash,'#desk');
 assert.equal(h.values.get('xtanco_lang'),'en');assert.equal(h.values.get('cli_history'),'["/marca starbucks"]');assert.equal(h.values.get('xtanco_render'),'real');
});
test('ESP and case-insensitive English aliases return the chosen interface language',()=>{
 for(const [text,next]of [['/idioma ESP','es'],['/IDIOMA eng','en'],['/language EN','en'],['idioma Es','es'],['/idioma@AdmiraXPBot ENG','en']]){const h=environment();assert.equal(languageCommand(text,h.env).language,next);assert.equal(h.applied,next);}
});
test('invalid locale and extra commands are handled locally with no mutation',()=>{
 for(const text of ['/idioma fr','/idioma ENG extra','/idioma ENG\n/grok text']){const h=environment();const result=languageCommand(text,h.env);assert.equal(result.ok,false);assert.equal(result.local,true);assert.equal(h.applied,undefined);assert.equal(h.href,undefined);assert.equal(h.win.XPACE_LANG_LOCKED,true);assert.equal(h.values.has('xtanco_lang'),false);}
 for(const text of ['/marca starbucks','/avatarDigital','/music on','hello'])assert.equal(languageCommand(text),null);
});
test('blocked preference storage still switches the active UI and retained URL',()=>{
 const h=environment();h.env.storage={setItem(){throw Error('blocked');}};assert.equal(languageCommand('/idioma ENG',h.env).ok,true);assert.equal(h.applied,'en');assert.equal(new URL(h.href).searchParams.get('quality'),'best');
});
test('native Expert intercepts valid and invalid language commands before inventory, rendering or remote execution',async()=>{
 const source=html.slice(html.indexOf('  async function executeLocalVisualCommand('),html.indexOf('  async function executeTelegramText('));
 const h=environment();let visibilityCalls=0;
 const context=vm.createContext({window:{XpaceShell:{language:(text,apply)=>languageCommand(text,{...h.env,apply})}},setLanguage:next=>h.env.apply(next),executePeopleVisibilityCommand(){visibilityCalls++;throw Error('Unexpected dispatch');}});
 vm.runInContext(source,context);
 assert.equal((await context.executeLocalVisualCommand('/idioma ENG')).language,'en');assert.equal((await context.executeLocalVisualCommand('/idioma invalid')).local,true);assert.equal(visibilityCalls,0);assert.equal(h.applied,'en');
});
test('declared interface translation updates copy in place, retains editable data and releases observation',()=>{
 const observers=[];const previous=globalThis.MutationObserver;
 globalThis.MutationObserver=class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 const doc={documentElement:{lang:'es'}};
 const text={nodeType:3,nodeValue:'  Guardar plantilla  '};
 const input={nodeType:1,ownerDocument:doc,childNodes:[],value:'Guardar plantilla',attrs:{placeholder:'Guardar plantilla'},matches:s=>s.includes('input'),hasAttribute:k=>k in input.attrs,getAttribute:k=>input.attrs[k],setAttribute:(k,v)=>input.attrs[k]=v};
 // inputs translate only accessible attributes, retaining user values.
 input.matches=s=>s==='input,textarea';
 const root={nodeType:1,ownerDocument:doc,childNodes:[text,input],attrs:{},matches:()=>false,hasAttribute:()=>false};
 try{const copy=interfaceTranslator([['Guardar plantilla','Save template']]);const stop=copy.observe(root);doc.documentElement.lang='en';observers[0].fn();assert.equal(text.nodeValue,'  Save template  ');assert.equal(input.value,'Guardar plantilla');assert.equal(input.attrs.placeholder,'Save template');doc.documentElement.lang='es';observers[0].fn();assert.equal(text.nodeValue,'  Guardar plantilla  ');stop();assert.equal(observers[0].disconnected,true);}finally{globalThis.MutationObserver=previous;}
});
test('option labels translate independently of their shared SVG icons',()=>{
 const entries=[...html.matchAll(/\{sel:'\.quad-left \.option-label', idx:(\d), en:'([^']*)', es:'([^']*)'\}/g)];assert.equal(entries.length,6);
 assert.equal((html.match(/data-options-icon=/g)||[]).length,6);assert.equal(html.includes("sel:'.quad-left .qm-acc-head'"),false);
 const script=readFileSync(new URL('../admira-xp/scripts/expert-categories.js',import.meta.url),'utf8');assert.match(script,/icon\.innerHTML=iconMarkup\(key\)/);assert.match(script,/icon\.innerHTML=iconMarkup\(icon\.dataset\.optionsIcon\)/);
});
