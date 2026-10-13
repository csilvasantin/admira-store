import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../../../assets/xpace-shell.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('  function suiteAction('),source.indexOf('  function connectSuiteCommands('));
function adapter(path){let registered;const calls=[];const sandbox={root:{location:{pathname:path},XpaceShell:{}},log:()=>{},lang:()=> 'es'};vm.runInNewContext(fn+';this.register=suiteAction',sandbox);sandbox.register({registerAdapter:a=>registered=a},{id:'demo',run:args=>calls.push(args)});return {demos:registered.demos,calls};}
test('shared suite dispatches every NEXT STEP alias and its action to the local twin',()=>{
 const a=adapter('/xpacios/sneakerstore/');
 for(const name of ['sneakers','sneaker','next-step','nextstep'])for(const action of ['iniciar','pausa','reanudar','parar','start','pause','resume','stop']){a.demos.find(d=>d.name===name).run([action]);assert.equal(a.calls.at(-1),name+' '+action);}
});
test('other routes retain their own demos without registering Sneakers handlers',()=>{
 const names=adapter('/otro/').demos.map(d=>d.name);assert.deepEqual(Array.from(names),['taza','kiosko','quiosco','creador','creator']);assert(!names.includes('global'));
});
