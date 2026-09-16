import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';

// Read-only presentation adapter for the immersive view. The game continues to
// own navigation, appearance, media, time and counters. These defaults mirror P
// in index.html; the live palette supplied by __xtancoVisualState takes priority.
const DEFAULT_PALETTE=Object.freeze({
  skin:'#ffcc99',pants:'#3a4455',shoes:'#2a1a0a',
  hair:['#2a1500','#cc4422','#1a3399','#111111','#884400','#cc8800'],
  shirts:['#4466cc','#cc4444','#44aa55','#9944cc','#dd7722','#2288aa'],
  skins:['#ffe0bd','#ffcc99','#dba87a','#c68642','#8d5524','#5c3310'],
  pantsArr:['#3a4455','#2a2a3a','#4a3a2a','#2a4a3a','#5a3a3a','#3a3a5a'],
  shoesArr:['#2a1a0a','#1a1a2a','#4a2a1a','#3a3a3a']
});
const SPECIAL_NAMES={saca:'La Saca',thief:'Ladrón',guardiaCivil:'Guardia Civil',opinador:'Opinador',unitreeBot:'Unitree'};
const finite=Number.isFinite;
const list=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'?value:'';
function paletteColor(value,colors,fallback){
  if(typeof value==='string'&&value.trim())return value;
  if(!Number.isInteger(value)||!Array.isArray(colors)||!colors.length)return fallback;
  const color=colors[((value%colors.length)+colors.length)%colors.length];
  return typeof color==='string'?color:fallback;
}
function appearance(value,kind,palette,isPlayer){
  const look=value.look&&typeof value.look==='object'?value.look:{};
  const customer=kind==='customer'||kind==='passerby';
  const fallbackShirt=customer?1+(Math.abs(value.hair||0)%(palette.shirts.length-1)):0;
  let shirt=customer?(look.shirt??fallbackShirt):(value.shirt??look.shirt??0);
  let hair=customer?(look.hair??value.hair??0):(value.hair??look.hair??0);
  // These are the actual arguments used by drawIsoOpinador(), including its
  // explicit default appearance when the special visitor has no look record.
  const resolvedLook=kind==='opinador'&&!value.look
    ?{shirt:4,hair:2,skin:1,pants:1,shoes:0,accessory:1}:look;
  if(kind==='opinador'){shirt=resolvedLook.shirt||4;hair=resolvedLook.hair||2;}
  const isDJ=kind==='staff'&&!isPlayer&&value.role===4;
  const result={
    color:isDJ?'#ddaa22':paletteColor(shirt,palette.shirts,palette.shirts[0]),
    skin:paletteColor(resolvedLook.skin,palette.skins,palette.skin),
    hair:paletteColor(hair,palette.hair,palette.hair[0]),
    pants:paletteColor(resolvedLook.pants,palette.pantsArr,palette.pants),
    shoes:paletteColor(resolvedLook.shoes,palette.shoesArr,palette.shoes),
    accessory:Number.isInteger(resolvedLook.accessory)?resolvedLook.accessory:0,
    age:text(resolvedLook.age),gender:['m','f'].includes(resolvedLook.gender)?resolvedLook.gender:null,
    skirt:!!(resolvedLook.gender==='f'||resolvedLook.skirt),
    scale:customer&&resolvedLook.age==='nino'?.72:customer&&resolvedLook.age==='senior'?.9:1,
    isDJ,sponsor:!!value.sponsor,customSprite:!!(value.customSpriteReady&&value.customSpriteImg)
  };
  // Dedicated sprites have fixed uniforms rather than indexed customer looks.
  if(kind==='saca')Object.assign(result,{color:'#1e4a99',pants:'#1a3060',shoes:'#2a2a2a',skin:palette.skin,hat:'hardhat',hatColor:'#ffcc00'});
  if(kind==='thief')Object.assign(result,{color:'#2a2a2a',pants:'#1a1a2a',shoes:'#111111',skin:'#ffcc99',hat:'beanie',hatColor:'#2a2a3a'});
  if(kind==='guardiaCivil')Object.assign(result,{color:'#315f33',pants:'#213820',shoes:'#111111',skin:palette.skin,hat:'tricorn',hatColor:'#182414'});
  if(kind==='unitreeBot')Object.assign(result,{color:'#bcc8cf',skin:'#bcc8cf',hair:'#6f7e88',pants:'#596973',shoes:'#33434d',robot:true});
  if(value.sponsor)Object.assign(result,{color:'#aa2020',skin:'#ffe066',hat:'top-hat',hatColor:'#0a0a0a'});
  return result;
}

/** Same input contract as createSceneSnapshot, plus palette and realTrafficActive.
 * Actors face +Z at heading 0. Heading follows observed world displacement; the
 * legacy left/right sprite direction supplies the initial stationary pose.
 * No actor, appearance, timer, count, path or source image is changed here.
 */
export function createLifeSnapshot(){
  const geometrySnapshot=createSceneSnapshot(),identities=new WeakMap(),motion=new WeakMap();
  let sequence=0;
  return function snapshot(input={}){
    const {iso,game,active=false,editor=false}=input;
    if(!active||!game||!iso||![iso.ox,iso.oy,iso.tileW,iso.tileH,iso.wallH,iso.cols,iso.rows].every(finite)
      ||iso.tileW<=0||iso.tileH<=0||iso.tileH>=iso.tileW)return null;
    const scene=geometrySnapshot(input);
    if(!scene)return null;
    const palette={...DEFAULT_PALETTE,...input.palette};
    for(const name of ['hair','shirts','skins','pantsArr','shoesArr']){
      if(!Array.isArray(palette[name])||!palette[name].length)palette[name]=DEFAULT_PALETTE[name];
    }
    const realTrafficActive=typeof input.realTrafficActive==='boolean'?input.realTrafficActive
      :typeof window!=='undefined'&&!!window.__xtoreWindowPlayer;
    function actor(value,kind){
      if(!value||typeof value!=='object'||!finite(value.x)||!finite(value.y))return null;
      // The navigation target is toIso(col,row) minus (7,20), for both staff
      // and customers. The legacy +5 collision probe is not its world anchor.
      const dx=(value.x+7-iso.ox)/(iso.tileW/2),dy=(value.y+20-iso.oy)/(iso.tileH/2);
      const col=(dx+dy)/2,row=(dy-dx)/2;
      if(!identities.has(value))identities.set(value,`${kind}-${++sequence}`);
      const previous=motion.get(value),direction=value.dir===-1?-1:1;
      const dCol=previous?col-previous.col:0,dRow=previous?row-previous.row:0;
      const distance=Math.hypot(dCol,dRow),moved=!!previous&&distance>1e-5&&distance<4;
      const heading=moved?Math.atan2(dCol,dRow)
        :previous&&previous.direction===direction?previous.heading:direction<0?-Math.PI/4:3*Math.PI/4;
      const walking=previous?moved:!!value.isWalking||['walk','leave'].includes(value.st)
        ||kind==='passerby'||['incoming','entering','leaving','fleeing','sneaking'].includes(value.phase);
      motion.set(value,{col,row,heading,direction});
      const isPlayer=kind==='staff'&&value===list(game.staff)[0];
      return {
        id:identities.get(value),sourceId:typeof value.id==='string'||finite(value.id)?value.id:null,
        kind,col,row,heading,walking,...appearance(value,kind,palette,isPlayer),
        label:text(value.name)||SPECIAL_NAMES[kind]||'',role:finite(value.role)?value.role:null,isPlayer,
        number:Number.isSafeInteger(value.num)?value.num:null,
        bubble:value.bTimer>0?text(value.bMsg):'',emote:value.emoteTimer>0?text(value.emote):'',
        clubMember:!!value.fanCustomerId,birthday:!!value.fanIsBirthday,
        bag:!!(value.bought&&value.st==='leave'),outside:kind==='passerby'||!!value.outside,
        phase:text(value.phase)||text(value.st)
      };
    }
    const actors=[];
    if(!editor){
      for(const value of list(game.staff))if(value?.hired)actors.push(actor(value,'staff'));
      for(const value of list(game.custs))actors.push(actor(value,'customer'));
      if(!realTrafficActive)for(const value of list(game.passersby))actors.push(actor(value,'passerby'));
      for(const kind of Object.keys(SPECIAL_NAMES)){
        const value=game[kind];if(value&&value.phase!=='idle')actors.push(actor(value,kind));
      }
    }
    return {
      ...scene,actors:actors.filter(Boolean),realTrafficActive,
      // These are explicitly the existing simulation's counts, never measured
      // audience or invented camera traffic. Unknown input stays unknown.
      source:'xtanco-running-game',inside:list(game.custs).length,
      entries:finite(game.custIn)?game.custIn:null,
      time:finite(game.gameTime)?game.gameTime:null
    };
  };
}
