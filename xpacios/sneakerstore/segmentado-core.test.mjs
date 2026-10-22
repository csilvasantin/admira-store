import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeKind,laneOf,dominant,LaneTracker,parseBus,ruleKind,matchRule,resolveContent,defaultKindRules,mergeKindRules,metahumanPhrase,metahumanTarget,shouldSpeak,audienceSample,demoScript,demoStep,orientationOf,kindRules} from './segmentado-core.mjs';

test('clase → carril con los alias de canal.html r64',()=>{
  assert.equal(normalizeKind('Coche'),'car');assert.equal(normalizeKind('motorbike'),'motorcycle');assert.equal(normalizeKind('Bici'),'bicycle');assert.equal(normalizeKind('x'),null);
  assert.equal(laneOf('person'),'Persona');assert.equal(laneOf('car'),'Coche');assert.equal(laneOf('motorcycle'),'Moto');assert.equal(laneOf('bicycle'),'Bici');assert.equal(laneOf(null),'neutral');
});

test('la persona manda sobre los vehículos; entre vehículos gana la confianza; bajo umbral no cuenta',()=>{
  assert.deepEqual(dominant([{class:'car',score:.9},{class:'person',score:.5}]),{kind:'person',score:.5,count:1,counts:{car:1,person:1}});
  assert.equal(dominant([{class:'car',score:.6},{class:'motorcycle',score:.8}]).kind,'motorcycle');
  assert.equal(dominant([{class:'person',score:.2}]),null);assert.equal(dominant(null),null);
  assert.equal(dominant([{class:'person',score:.7},{class:'person',score:.9}]).count,2);
});

test('LaneTracker: fresco gana al instante, la gracia de 1,5 s evita parpadeos y el neutro se sostiene 6 s',()=>{
  const t=new LaneTracker();
  let s=t.observe({kind:'person',score:.8},1000);assert.equal(s.lane,'Persona');assert.equal(s.since,1000);
  s=t.observe(null,2000);assert.equal(s.kind,'person');       // dentro de la gracia
  s=t.observe({kind:'car',score:.7},2100);assert.equal(s.lane,'Coche');assert.equal(s.changes,2);
  s=t.state(3700);assert.equal(s.lane,'neutral');assert.equal(s.holding,true);
  assert.equal(t.state(9800).holding,false);
  s=t.observe({kind:'bicycle',score:.6},9900);assert.equal(s.lane,'Bici');
});

test('parseBus reproduce audienceRemoteLane: fresh+kind → carril; !fresh → neutral; persona sin sexo solo si el bus da carril',()=>{
  const neutral=parseBus({ok:true,fresh:false,label:null,decision:{lane:'neutral'}});
  assert.equal(neutral.present,false);assert.equal(neutral.lane,'neutral');assert.equal(neutral.kind,null);
  const moto=parseBus({ok:true,fresh:true,label:{kind:'motorcycle'},decision:{lane:'Moto'}});
  assert.equal(moto.kind,'motorcycle');assert.equal(moto.lane,'Moto');
  const unknown=parseBus({ok:true,fresh:true,label:{kind:'person',sex:'u'},decision:{lane:'neutral'}});
  assert.equal(unknown.present,false);
  const woman=parseBus({ok:true,fresh:true,label:{sex:'f'},decision:{lane:'TopGun',age_seg:'adulto'}});
  assert.equal(woman.kind,'person');assert.equal(woman.lane,'TopGun');assert.equal(woman.age,'adulto');
});

test('ruleKind lee campo kind, tag kind:<k> y el id; matchRule nunca casa sexo con vehículos',()=>{
  assert.equal(ruleKind({kind:'car'}),'car');assert.equal(ruleKind({tag:'kind:moto,musica'}),'motorcycle');assert.equal(ruleKind({id:'r-bici'}),'bicycle');assert.equal(ruleKind({id:'hombre',gender:'m'}),'');
  assert.equal(matchRule({id:'r-coche',gender:'m'},'car'),false);
  assert.equal(matchRule({id:'r-coche'},'car'),true);assert.equal(matchRule({id:'r-coche',enabled:false},'car'),false);
  assert.equal(matchRule({id:'lluvia',kind:'car',conds:[{fact:'rain',value:true}]},'car'),false);
});

const stock=[
  {id:'auto-9a75882d2e3a36bce8e6',num:990,type:'video',title:'Aparca. Entra. Estrena. · Xtore · coche',tags:['xtore','vertical','9:16'],url:'https://stock/coche.mp4'},
  {id:'s1',num:1451,type:'image',title:'FREE SHIFT',tags:['demo','sneakers','creator'],url:'https://stock/s1.png',ancho:1920,alto:1080},
  {id:'m1',type:'video',title:'Terminator moto',tags:['motocicleta','cine'],url:'https://stock/m1.mp4',orientacion:'horizontal'},
  {id:'x',type:'furni',title:'La moto Ducati',tags:['moto'],url:'https://stock/x.glb'},
];
const playlist={tracks:[{id:'p1',title:'Huey Lewis',url:'https://stock/p1.mp4'}]};

test('resolveContent: assets explícitos → tag → playlist, respetando el formato de la pantalla',()=>{
  const matrix=mergeKindRules({rules:[{id:'hombre',gender:'m',tag:'tecnologia'}]}).matrix;
  const coche=resolveContent({matrix,kind:'car',stock,playlist,orientation:'vertical'});
  assert.equal(coche.source,'assets');assert.deepEqual(coche.items.map(i=>i.id),['auto-9a75882d2e3a36bce8e6']);
  const cocheH=resolveContent({matrix,kind:'car',stock,playlist,orientation:'horizontal'});
  assert.equal(cocheH.source,'playlist');   // la pieza del coche es vertical: la LCD no la emite
  const persona=resolveContent({matrix,kind:'person',stock,playlist,orientation:'horizontal'});
  assert.equal(persona.source,'tag');assert.deepEqual(persona.items.map(i=>i.id),['s1']);
  const moto=resolveContent({matrix,kind:'motorcycle',stock,playlist,orientation:'horizontal'});
  assert.equal(moto.source,'tag');assert.deepEqual(moto.items.map(i=>i.id),['m1']);   // el mueble GLB no es media
  const bici=resolveContent({matrix,kind:'bicycle',stock,playlist});
  assert.equal(bici.source,'playlist');assert.equal(bici.rule.id,'r-bici');
  assert.equal(resolveContent({matrix:null,kind:null,stock,playlist}).source,'playlist');
});

test('mergeKindRules añade solo lo que falta y conserva intactas las reglas existentes',()=>{
  const existing={rules:[{id:'hombre',gender:'m',tag:'tecnologia'},{id:'r-coche',kind:'car',tag:'',assets:['custom']}],default:{category:'any',tag:'',medio:'any'},target:'t'};
  const {matrix,added}=mergeKindRules(existing);
  assert.deepEqual(added,['r-persona','r-moto','r-bici']);
  assert.equal(matrix.rules[0].tag,'tecnologia');assert.deepEqual(matrix.rules[1].assets,['custom']);assert.equal(matrix.rules.length,5);assert.equal(matrix.target,'t');
  assert.deepEqual(mergeKindRules(matrix).added,[]);
  assert.equal(kindRules({rules:defaultKindRules()}).length,4);
});

test('frases del MetaHuman por carril e idioma; nada en neutro',()=>{
  assert.match(metahumanPhrase('person','es'),/NEXT STEP/);assert.match(metahumanPhrase('car','en'),/Park/);assert.equal(metahumanPhrase(null,'es'),'');
  assert.notEqual(metahumanPhrase('person','es',0),metahumanPhrase('person','es',1));
});

test('caída al avatar web cuando el host de Pixel Streaming no vive; locución solo al cambiar de carril y con hueco',()=>{
  assert.equal(metahumanTarget({hostAlive:true}).mode,'metahuman');assert.match(metahumanTarget({hostAlive:true}).src,/uiless\.html\?AutoConnect=true/);
  assert.equal(metahumanTarget({hostAlive:false}).mode,'web');assert.equal(metahumanTarget({hostAlive:null}).voice,'browser');
  assert.equal(shouldSpeak({kind:'car',previousKind:null,lastSpokenAt:0,now:20000}),true);
  assert.equal(shouldSpeak({kind:'car',previousKind:'car',lastSpokenAt:0,now:20000}),false);
  assert.equal(shouldSpeak({kind:'car',previousKind:'person',lastSpokenAt:15000,now:20000}),false);
  assert.equal(shouldSpeak({kind:null,previousKind:'person',lastSpokenAt:0,now:20000}),false);
});

test('muestra de audiencia: personas cuentan como caras, vehículos como kind con faces 0',()=>{
  assert.deepEqual(audienceSample({kind:'person',count:2,score:.8}),{loc:'sneakers-store-santa-rosa-19',screen:'sneakers-store-santa-rosa-19-screen',faces:2,gender:'',genderScore:0,ageBucket:'',emotion:'',kind:'person',lane:'Persona',score:.8});
  assert.equal(audienceSample({kind:'car'}).faces,0);assert.equal(audienceSample({kind:'car'}).lane,'Coche');assert.equal(audienceSample(null).kind,'none');
});

test('guion de demo cíclico y orientación de piezas',()=>{
  const s=demoScript();assert.equal(demoStep(s,0).kind,'person');assert.equal(demoStep(s,9500).kind,null);assert.equal(demoStep(s,12500).kind,'car');assert.equal(demoStep(s,40000+9500).kind,null);
  assert.equal(orientationOf({tags:['9:16']}),'vertical');assert.equal(orientationOf({orientacion:'horizontal'}),'horizontal');assert.equal(orientationOf({ancho:1080,alto:1920}),'vertical');assert.equal(orientationOf({}),null);
});
