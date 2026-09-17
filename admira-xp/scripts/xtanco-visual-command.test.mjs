import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseVisualCommand,executeVisualCommand} from './xtanco-visual-command.mjs';
import {createVisualTiers} from './xtanco-visual-tiers.mjs';

test('modo/mode names and bit-style aliases resolve only to public tiers',()=>{
  for(const [tier,aliases]of Object.entries({good:['good','8','8bit','8-bit'],better:['better','life','16','16bit','16-bit'],best:['best','32','32bit','32-bit','hiperrealista','hyperrealistic'],matrix:['matrix']})){
    for(const command of ['modo','mode'])for(const alias of aliases){
      assert.deepEqual(parseVisualCommand(` /${command}  ${alias} `),{tier});
      assert.deepEqual(parseVisualCommand(`/${command.toUpperCase()}@AdmiraXPBot ${alias.toUpperCase()}`),{tier});
    }
  }
  assert.deepEqual(parseVisualCommand('mode better'),{tier:'better'});
  for(const tier of ['good','better','best','matrix'])assert.deepEqual(parseVisualCommand(tier),{tier});
  assert.deepEqual(parseVisualCommand('/mudanza'),{moving:true});
  assert.deepEqual(parseVisualCommand('/MUDANZA@AdmiraXPBot'),{moving:true});
});

test('typos and extra arguments stay local while unrelated legacy commands are left untouched',()=>{
  for(const input of ['/modo','/modo ayuda','/mode help','/modo ?'])assert.deepEqual(parseVisualCommand(input),{help:true});
  for(const input of ['/modo bettor','/mode shop123','/modo better now','/modo better\n/grok text','/modo matrix now','/modo matrix\n/grok text'])assert.deepEqual(parseVisualCommand(input),{help:true,invalid:true});
  for(const input of ['/render 8bit','/render 16bit','/render habbo','/render real','/hue modo evento','/model better','/modobetter','hello mode better',''])assert.equal(parseVisualCommand(input),null);
  assert.deepEqual(parseVisualCommand('/modo estado'),{status:true});assert.deepEqual(parseVisualCommand('/mode status'),{status:true});
});

function publicRouter(){
  const calls={open:0,close:0,best:0,matrix:0},listeners=new Set(),bestListeners=new Set(),matrixListeners=new Set();
  const emit=state=>{for(const listener of listeners)listener(state);};
  const router=createVisualTiers({
    openBetter(){calls.open++;emit({open:true,busy:true});emit({open:true,busy:false});},
    closeBetter(){calls.close++;emit({open:false,busy:false});},
    subscribeBetter(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    openBest({requestId}){calls.best++;for(const listener of bestListeners)listener({open:true,busy:false,requestId});},
    closeBest(){for(const listener of bestListeners)listener({open:false,busy:false});},
    subscribeBest(listener){bestListeners.add(listener);return ()=>bestListeners.delete(listener);},
    openMatrix({requestId}){calls.matrix++;for(const listener of matrixListeners)listener({open:true,busy:false,requestId});},
    closeMatrix(){for(const listener of matrixListeners)listener({open:false,busy:false});},
    subscribeMatrix(listener){matrixListeners.add(listener);return ()=>matrixListeners.delete(listener);}
  });
  return {router,calls};
}

test('commands use the actual public router; Better opens once and Best opens a live-people preview',async()=>{
  const f=publicRouter();
  let answer=await executeVisualCommand('/modo better',f);assert.equal(answer.ok,true);assert.equal(answer.mode,'better');assert.match(answer.message,/Better.*16-bit.*fusión.*HUD.*CLI/);
  await executeVisualCommand('/mode 16',f);assert.equal(f.calls.open,1,'the public router owns idempotence');
  answer=await executeVisualCommand('/modo good',f);assert.equal(answer.mode,'good');assert.match(answer.message,/Good.*8-bit/);
  answer=await executeVisualCommand('/modo best',f);assert.equal(answer.ok,true);assert.equal(answer.mode,'best');assert.equal(answer.requested,'best');
  assert.equal(answer.preview,true);assert.equal(answer.availability,'preview');
  assert.match(answer.message,/32-bit.*tienda y personas en 3D en vivo.*mismo Xtanco.*CLI experto/);assert.equal(f.calls.open,1);assert.equal(f.calls.best,1);
});

test('Matrix opens Avenida Admira through the public router and describes editable furniture with a fixed camera',async()=>{
  const f=publicRouter();
  let answer=await executeVisualCommand('matrix',f);
  assert.equal(answer.ok,true);assert.equal(answer.local,true);assert.equal(answer.mode,'matrix');assert.equal(answer.requested,'matrix');
  assert.equal(answer.preview,true);assert.equal(answer.availability,'preview');
  assert.match(answer.message,/Matrix.*Avenida Admira.*cámara fija, mobiliario editable y visitantes en vivo.*mismo Xtanco/);
  answer=await executeVisualCommand('/mode matrix',{...f,lang:'en'});
  assert.match(answer.message,/fixed camera, editable furniture and live visitors/);assert.equal(f.calls.matrix,1);
  assert.match(answer.message,/43 shared models/);
  for(const command of ['/inventario añadir 1','/inventario eliminar 1','/inventario deshacer'])assert.ok(answer.message.includes(command));
  await executeVisualCommand('best',f);assert.equal(f.router.mode,'best');assert.equal(f.calls.best,1);
});

test('/mudanza is a local reversible presentation toggle and never changes the tier router',async()=>{
  const f=publicRouter();let active=false;
  const moving={toggle(){active=!active;return active;}};
  let answer=await executeVisualCommand('/mudanza',{...f,moving});
  assert.equal(answer.ok,true);assert.equal(answer.moving,true);assert.match(answer.message,/ACTIVADA.*suelo y paredes.*otra vez/);
  assert.equal(f.router.mode,'good');assert.deepEqual(f.calls,{open:0,close:0,best:0,matrix:0});
  answer=await executeVisualCommand('/mudanza',{...f,moving});
  assert.equal(answer.moving,false);assert.match(answer.message,/DESACTIVADA.*posición anterior exacta/);
  answer=await executeVisualCommand('/mudanza',{...f,lang:'en'});assert.equal(answer.ok,false);assert.match(answer.message,/not ready/);
});

test('help, invalid mode and current-mode queries do not open or close any view',async()=>{
  const f=publicRouter();
  for(const input of ['/modo','/mode help','/modo invalid']){
    const answer=await executeVisualCommand(input,f);assert.equal(answer.local,true);assert.match(answer.message,/CLI experto.*__xtExec/);
  }
  assert.deepEqual(f.calls,{open:0,close:0,best:0,matrix:0});
  let answer=await executeVisualCommand('/modo estado',f);assert.equal(answer.mode,'good');assert.match(answer.message,/actual.*Good.*8-bit/);
  await executeVisualCommand('/modo better',f);answer=await executeVisualCommand('/mode status',{...f,lang:'en'});
  assert.equal(answer.mode,'better');assert.match(answer.message,/Current.*Better.*16-bit/);assert.equal(f.calls.open,1);
  await executeVisualCommand('/modo best',f);answer=await executeVisualCommand('/mode status',{...f,lang:'en'});
  assert.equal(answer.mode,'best');assert.equal(answer.preview,true);assert.equal(answer.availability,'preview');assert.match(answer.message,/live 3D store and people/);
  await executeVisualCommand('/modo matrix',f);answer=await executeVisualCommand('/modo estado',f);
  assert.equal(answer.mode,'matrix');assert.equal(answer.preview,true);assert.equal(answer.availability,'preview');assert.match(answer.message,/Avenida Admira.*cámara fija, mobiliario editable y visitantes en vivo/);
});

test('Matrix cannot report success when its preview is unavailable, failed or cancelled',async()=>{
  let answer=await executeVisualCommand('matrix',{router:{choose(){},mode:'matrix',availability:'interactive'}});
  assert.equal(answer.ok,false);assert.equal(answer.preview,undefined);assert.match(answer.message,/vista previa Matrix no está disponible/);
  answer=await executeVisualCommand('/modo matrix',{router:{choose(){return {ok:false};},mode:'matrix',availability:'preview',error:'image failed'}});
  assert.equal(answer.ok,false);assert.match(answer.message,/No se pudo abrir/);
  answer=await executeVisualCommand('/modo matrix',{router:{choose(){return {ok:false,cancelled:true};},mode:'best',availability:'preview'}});
  assert.equal(answer.ok,false);assert.equal(answer.cancelled,true);assert.equal(answer.requested,'matrix');assert.equal(answer.mode,'best');
  answer=await executeVisualCommand('/modo matrix',{router:{choose(){throw Error('image failed');}},lang:'en'});
  assert.equal(answer.ok,false);assert.equal(answer.local,true);assert.match(answer.message,/Could not change/);
});

test('missing or failed routing never reports a successful visual switch',async()=>{
  let answer=await executeVisualCommand('/modo better');assert.equal(answer.ok,false);assert.match(answer.message,/no está listo.*Avanzado \(▤\)/);
  answer=await executeVisualCommand('/mode better',{router:{choose(){throw Error('GPU failure');}},lang:'en'});
  assert.equal(answer.ok,false);assert.match(answer.message,/Could not change.*Advanced \(▤\)/);
  answer=await executeVisualCommand('/modo better',{router:{choose(){},mode:'good'}});
  assert.equal(answer.ok,false);assert.equal(answer.mode,'good');assert.match(answer.message,/No se pudo abrir.*Avanzado \(▤\)/);
  assert.equal(await executeVisualCommand('/render 16bit'),null);
});

test('Best without preview availability and failed or superseded openings never claim success',async()=>{
  let answer=await executeVisualCommand('/modo best',{router:{choose(){},mode:'best',availability:'interactive'}});
  assert.equal(answer.ok,false);assert.equal(answer.preview,undefined);assert.match(answer.message,/Best interactivo sigue en preparación/);
  answer=await executeVisualCommand('/modo best',{router:{choose(){return {ok:false};},mode:'best',availability:'preview',error:'image failed'}});
  assert.equal(answer.ok,false);assert.match(answer.message,/No se pudo abrir/);
  answer=await executeVisualCommand('/modo best',{router:{choose(){return {ok:false,cancelled:true};},mode:'better',availability:'interactive'}});
  assert.equal(answer.ok,false);assert.equal(answer.cancelled,true);assert.equal(answer.requested,'best');assert.equal(answer.mode,'better');
  assert.match(answer.message,/se canceló/);
});

test('a cancelled live command resolves even when the older opener never completes',{timeout:2000},async()=>{
  let options;
  const router=createVisualTiers({openBetter(value){options=value;return new Promise(()=>{});},closeBetter(){},openBest(){},closeBest(){}});
  const pending=executeVisualCommand('/modo better',{router});
  const preview=await executeVisualCommand('/modo best',{router}),cancelled=await pending;
  assert.equal(preview.ok,true);assert.equal(preview.preview,true);
  assert.equal(cancelled.ok,false);assert.equal(cancelled.cancelled,true);assert.equal(cancelled.mode,'best');
  assert.equal(options.signal.aborted,true);router.dispose();
});

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function section(start,end){const from=html.indexOf(start),to=html.indexOf(end,from);assert.ok(from>=0&&to>from,`${start} source boundaries`);return html.slice(from,to);}
const helperSource=section('  async function executeLocalVisualCommand(rawText){','  async function executeTelegramText(rawText){')
  .replace(/import\('\.\/scripts\/xtanco-visual-command\.mjs(?:\?[^']*)?'\)/,'loadVisualCommand()');
assert.ok(helperSource.includes('loadVisualCommand()'),'the test loader intercepts the shipped local visual module regardless of its cache version');
const dispatcherSource=section('  async function executeTelegramText(rawText){','  // === Stream Deck (Corsair Galleon 100 SD) bridge');
const composerSource=section('  async function sendComposerText(text){','  function bindDockButton(button,handler){');

function consoleHarness({failLoad=false,lang='es'}={}){
  const f=publicRouter(),sent=[],memory=[],logs=[],sessionCommands=[],responses=[],loads=[];
  let moving=false;
  const composer={value:'pending'},window={__xtancoVisualTiers:f.router,__xtancoMudanza:{toggle(){moving=!moving;return moving;}},xtAPI:{},AdmiraXP_SessionLog:{logCommand:input=>sessionCommands.push(input)}};
  let renders=0,helpClosed=0;
  const context=vm.createContext({window,lang,composer,renderMode:'8bit',
    async loadVisualCommand(){loads.push(true);if(failLoad)throw Error('offline');return {executeVisualCommand};},
    rememberMemory:(...args)=>memory.push(args),appendTelegramLog:(...args)=>logs.push(args),showLastResponse:(...args)=>responses.push(args),
    hideHelpPanel:()=>helpClosed++,renderQuickActionButtons:()=>renders++,
    async telegramSend(message){sent.push(message);return {ok:true};},
    fetch(){throw Error('visual commands must never issue a network request');},
    formatStatus:()=> 'legacy status',setRenderMode:mode=>{context.renderMode=mode;},commandHelp:()=> 'legacy help'
  });
  vm.runInContext(helperSource+dispatcherSource+composerSource,context);
  const exported=html.match(/window\.__xtExec=executeTelegramText;/)?.[0];assert.ok(exported);vm.runInContext(exported,context);
  return {...f,context,composer,sent,memory,logs,sessionCommands,responses,loads,
    get renders(){return renders;},get helpClosed(){return helpClosed;},get moving(){return moving;},send:input=>context.sendComposerText(input),exec:input=>window.__xtExec(input)};
}

test('the real composer handles every visual mode and typo before Telegram, AI/session logging or remote fallback',async()=>{
  for(const input of ['good','better','best','matrix','/modo matrix','/MODE@AdmiraXPBot MATRIX','/mudanza','/modo good','/modo better','/modo best','/MODE 16','/modo 32','/modo ayuda','/mode status','/modo bettor']){
    const h=consoleHarness();await h.send(input);
    assert.equal(h.responses.length,1,input);assert.equal(h.composer.value,'');assert.equal(h.renders,1);assert.equal(h.helpClosed,1);
    assert.deepEqual(h.sent,[],`${input} must remain local`);assert.deepEqual(h.memory,[]);assert.deepEqual(h.logs,[]);assert.deepEqual(h.sessionCommands,[]);
    assert.equal(h.loads.length,1);assert.equal(h.responses[0][1],/bettor/.test(input)?'err':'ok');
    assert.equal(h.responses[0][2],'local-visual');
  }
});

test('failure to load the local command remains a local error and cannot fall through to Telegram',async()=>{
  for(const input of ['/modo better','matrix','/modo matrix']){
    const h=consoleHarness({failLoad:true});await h.send(input);
    assert.deepEqual(h.sent,[]);assert.deepEqual(h.sessionCommands,[]);assert.equal(h.calls.open,0);assert.equal(h.calls.matrix,0);
    assert.equal(h.responses[0][1],'err');assert.match(h.responses[0][0],/comando visual local.*Reintenta/);
    assert.equal(h.responses[0][2],'local-visual');
  }
});

test('visual feedback is labelled local while all existing bot and error labels remain unchanged',()=>{
  const source=section('  function showLastResponse(','  async function sendComposerText(text){');
  for(const lang of ['es','en']){
    const children=[],element={dataset:{},classList:{remove(){},add(){}},appendChild:child=>children.push(child)};
    Object.defineProperty(element,'innerHTML',{set(){children.length=0;}});
    const context=vm.createContext({lang,window:{dispatchEvent(){}},Event:class{},quickActionsHidden:false,document:{getElementById:()=>element,createElement:()=>({})},clearTimeout(){},setTimeout(){return 1;}});
    vm.runInContext(source,context);
    for(const kind of ['ok','err']){
      context.showLastResponse('local result',kind,'local-visual');
      assert.equal(children[0].textContent,lang==='en'?'Local view →':'Vista local →');
    }
    context.showLastResponse('bot result','ok');assert.equal(children[0].textContent,'AdmiraXPBot →');
    context.showLastResponse('bot error','err');assert.equal(children[0].textContent,'ERROR');
    context.showLastResponse('INVENTARIO · 43 piezas','ok','local-inventory');assert.equal(element.dataset.inventory,'list');assert.equal(children[0].textContent,'Inventario →');
    context.showLastResponse('Añadido: 43','ok','local-inventory');assert.equal(element.dataset.inventory,'change');
  }
});

test('__xtExec runs the same visual command without remote output or command logging',async()=>{
  const h=consoleHarness();let answer=await h.exec('better');assert.match(answer,/Better.*16-bit/);assert.equal(h.router.mode,'better');
  answer=await h.exec('best');assert.match(answer,/tienda y personas en 3D en vivo.*mismo Xtanco/);assert.equal(h.router.mode,'best');
  answer=await h.exec('matrix');assert.match(answer,/Avenida Admira.*cámara fija, mobiliario editable y visitantes en vivo/);assert.equal(h.router.mode,'matrix');
  answer=await h.exec('/modo desconocido');assert.match(answer,/Estilos visuales locales/);
  answer=await h.exec('/mudanza');assert.match(answer,/ACTIVADA/);assert.equal(h.moving,true);
  answer=await h.exec('/mudanza');assert.match(answer,/DESACTIVADA/);assert.equal(h.moving,false);
  assert.deepEqual(h.sent,[]);assert.deepEqual(h.sessionCommands,[]);assert.deepEqual(h.responses,[]);assert.equal(h.calls.open,1);
});

test('legacy render commands and ordinary messages keep their existing dispatch and outbound behavior',async()=>{
  const h=consoleHarness();await h.send('/render 16bit');assert.equal(h.context.renderMode,'16bit');assert.match(h.sent[0],/Juego: \/render 16bit/);
  await h.send('/status');assert.match(h.sent[1],/legacy status/);
  await h.send('hello team');assert.equal(h.sent[2],'hello team');
  assert.deepEqual(h.loads,[]);assert.equal(h.calls.open,0);
  assert.deepEqual(h.sessionCommands,['/render 16bit','/status']);
});

test('embedded help lists local visual commands separately from all existing legacy render styles',()=>{
  const context=vm.createContext({});vm.runInContext(section('  function helpSections(){','  function showHelpPanel(){'),context);
  const sections=context.helpSections(),visual=sections.find(section=>section.items.includes('better'));
  assert.ok(visual);assert.match(visual.title,/CLI experto.*__xtExec/);assert.match(visual.title,/Best.*32-bit/);
  assert.deepEqual(Array.from(visual.items),['good','better','best','matrix','/mudanza','/modo estado']);
  const legacy=sections.find(section=>section.items.includes('/render 8bit'));
  assert.notEqual(visual,legacy);assert.deepEqual(Array.from(legacy.items),['/render 8bit','/render 16bit','/render habbo','/render real']);
});
