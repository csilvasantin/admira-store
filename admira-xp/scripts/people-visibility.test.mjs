import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Contrato 8-oct-2026 · People ON por defecto / People ON by default.
// Runs the shipped visibility, save and load functions of admira-xp/index.html in a sandbox.
// Never opens a network connection, camera or device; storage is an in-memory Map.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function section(start,end){const from=html.indexOf(start),to=html.indexOf(end,from);assert.ok(from>=0&&to>from,`${start} source boundaries`);return html.slice(from,to);}
const visibilitySource=section('function peopleGroupVisible(group){','const MAX_RESET_AUDIENCE=');
const saveLoadSource=section('function saveGame(){','// ── LEADERBOARD');
const initSource=section('function initGame(){','function quickStartLoteriasGame(){');
const GROUPS=['staff','customers','passersby','specials'];
const ALL_ON={staff:true,customers:true,passersby:true,specials:true};
const ALL_OFF={staff:false,customers:false,passersby:false,specials:false};

function harness({save}={}){
  const store=new Map(save===undefined?[]:[['xtanco_save',JSON.stringify(save)]]);
  const context=vm.createContext({
    lang:'es',G:{},state:'game',activeClient:0,activeModel:0,clientSel:0,modelSel:0,BTNS:{staffClick0:{},custClick0:{},furniture:{}},
    localStorage:{getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value))},
    loadNPCCustoms(){},interiorCollisionActors:()=>[],invalidateActorRoute(){},prepareActorCollisionFrame(){},scheduleNextPasserby(){}
  });
  vm.runInContext(visibilitySource+saveLoadSource,context);
  return {context,store,
    // Same expression initGame() uses for the new G (source-checked in the first test).
    newGame(){context.G={peopleVisibility:context.defaultPeopleVisibility(),staff:[],custs:[],passersby:[],passerbySpawnCooldown:1};},
    run:command=>context.executePeopleVisibilityCommand(command),
    reload(){context.G=null;assert.equal(context.loadGame(),true);return {...context.G.peopleVisibility};},
    visible:()=>Object.fromEntries(GROUPS.map(group=>[group,context.peopleGroupVisible(group)])),
    saved:()=>JSON.parse(store.get('xtanco_save')).G.peopleVisibility
  };
}
const oldSave=peopleVisibility=>({G:{peopleVisibility,staff:[],custs:[],passersby:[],passerbySpawnCooldown:1},lang:'es',state:'game',activeClient:0,activeModel:0});

test('a new game shows staff, customers, passersby and special characters',()=>{
  assert.match(initSource,/\n\s*peopleVisibility:defaultPeopleVisibility\(\),\n/,'initGame builds every Xpace with the default');
  const h=harness();
  for(const group of GROUPS)assert.equal(h.context.peopleGroupVisible(group),true,'before the first game: '+group);
  h.newGame();
  assert.deepEqual({...h.context.G.peopleVisibility},ALL_ON);
  assert.equal('elegido' in h.context.G.peopleVisibility,false,'the default is not an explicit choice');
  assert.deepEqual(h.visible(),ALL_ON);
});

test('an old save with all four groups false and no marker reopens with everyone visible',()=>{
  for(const peopleVisibility of [ALL_OFF,{staff:false,customers:false},{staff:true,customers:false},undefined,null,'off']){
    const h=harness({save:oldSave(peopleVisibility)});
    assert.deepEqual(h.reload(),ALL_ON,JSON.stringify(peopleVisibility));
    assert.deepEqual(h.visible(),ALL_ON);
  }
});

test('an explicit /gente off is marked and stays OFF across save and load',()=>{
  for(const command of ['/gente off','/PEOPLE OFF','/gente@AdmiraXPBot Off']){
    const h=harness();h.newGame();
    const answer=h.run(command);
    assert.equal(answer.ok,true);assert.deepEqual({...answer.data},ALL_OFF,'public data keeps its four-group shape');
    assert.deepEqual(h.saved(),{...ALL_OFF,elegido:true},'the command saves the marked choice');
    assert.deepEqual(Object.keys(h.context.BTNS),['furniture']);
    assert.deepEqual(h.reload(),{...ALL_OFF,elegido:true});assert.deepEqual(h.visible(),ALL_OFF);
    assert.deepEqual(h.reload(),{...ALL_OFF,elegido:true},'loading twice keeps the choice');
  }
  // A marked save written by another session is also kept verbatim.
  const h=harness({save:oldSave({...ALL_OFF,elegido:true})});
  assert.deepEqual(h.reload(),{...ALL_OFF,elegido:true});assert.deepEqual(h.visible(),ALL_OFF);
});

test('/personal on after /gente off shows only staff and persists across load',()=>{
  const h=harness();h.newGame();
  h.run('/gente off');
  const answer=h.run('/personal on');
  assert.match(answer.message,/^Personal ON/);
  const staffOnly={staff:true,customers:false,passersby:false,specials:false};
  assert.deepEqual(h.visible(),staffOnly);
  assert.deepEqual(h.reload(),{...staffOnly,elegido:true});
  assert.deepEqual(h.visible(),staffOnly);
  // The English alias continues from the restored choice.
  h.run('/customers on');
  assert.deepEqual(h.reload(),{staff:true,customers:true,passersby:false,specials:false,elegido:true});
});

test('no flow other than initGame, loadGame and the people commands writes the visibility state',()=>{
  const writes=[...html.matchAll(/peopleVisibility\s*(?::|=(?!=))\s*([^;,\n]+)/g)].map(match=>match[1].trim());
  assert.deepEqual(writes,['next','defaultPeopleVisibility()','defaultPeopleVisibility(G.peopleVisibility)']);
});
