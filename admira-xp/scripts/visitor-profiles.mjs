// Fictional presentation profiles, shared by Matrix, Better and Best.
// This registry never changes a customer's simulation identity or demographics.
import {VISITOR_ATLAS_LAYOUT} from './visitor-atlas-layout.mjs?v=visitors-24';
const make=(id,label,gender,age,colors,hairstyle,outfit,accessory='none',height=1,width=1)=>Object.freeze({
  id,label,gender,age,
  sprite:Object.freeze({atlas:`assets/people/matrix-v2/atlas-${id[0]}.png`,column:(Number(id[1])-1)%3,row:Math.floor((Number(id[1])-1)/3),columns:3,rows:2,...VISITOR_ATLAS_LAYOUT[id]}),
  style:Object.freeze({gender,age,hairstyle,outfit,accessory,height,width,palette:Object.freeze(Object.fromEntries(['skin','hair','color','pants','shoes'].map((key,i)=>[key,colors[i]])))})
});
export const VISITOR_PROFILES=Object.freeze([
  make('a1','Marcos · azul marino','m','adult',['#edc29f','#30251e','#203b59','#b1b4b6','#30343a'],'short','shirt','glasses',1.04,1.02),
  make('a2','Nadia · coral','f','adult',['#b47a55','#30221b','#d76455','#27384f','#deddd5'],'curly','jacket','none',.98,1.05),
  make('a3','Samuel · crema','m','adult',['#70462f','#171719','#e1dbc7','#636c40','#55575b'],'curly','tshirt','none',1.06,1.10),
  make('a4','Elena · verde bosque','f','adult',['#e8bd9e','#b48b4b','#315443','#c6b697','#765b42'],'long','jacket','none',1.03,.93),
  make('a5','David · vaquero','m','adult',['#dcb18a','#5a3622','#436c93','#ae8859','#dadbd5'],'short','jacket','backpack',1.01,.98),
  make('a6','Maya · ciruela','f','adult',['#be8d65','#30201b','#79485f','#a6aaa8','#28282b'],'bob','knit','none',.96,1.10),
  make('b1','Omar · rojo','m','adult',['#b77a4f','#251c18','#a83833','#292b32','#33343b'],'curly','shirt','headphones',1.02,1.08),
  make('b2','Amina · turquesa','f','adult',['#754b35','#19191d','#358f94','#263b59','#e4e0d8'],'long','jacket','none',1.05,.95),
  make('b3','Bruno · carbón','m','adult',['#c58e66','#31251f','#42464d','#3f5873','#292b30'],'bald','jacket','glasses',.98,1.16),
  make('b4','Irene · arena','f','adult',['#e7c0a6','#a9aba6','#bbaa8d','#3e4248','#6e5140'],'short','jacket','none',1.00,.96),
  make('b5','Luis · azul','m','adult',['#e6b991','#65412b','#3973a0','#c5b48d','#e1e0da'],'short','tshirt','cap',1.00,1.00),
  make('b6','Sara · mostaza','f','adult',['#c59871','#30231e','#b28a36','#535d3d','#795139'],'long','knit','scarf',.97,1.03),
  make('c1','Joaquín · berenjena','m','senior',['#e1b895','#a4a39e','#66506a','#71767c','#49413b'],'short','knit','glasses',.96,1.08),
  make('c2','Carmen · abrigo arena','f','senior',['#bd916d','#a5a7a4','#bba587','#354d69','#63564a'],'bob','jacket','none',.94,1.10),
  make('c3','Gabriel · petróleo','m','senior',['#76503a','#868580','#276c77','#c4b292','#524b43'],'bald','shirt','none',1.02,.97),
  make('c4','Rosa · turquesa','f','senior',['#e5c0a7','#d5d4c9','#55a4a2','#72767c','#9b8c76'],'short','jacket','none',.95,1.04),
  make('c5','Leo · oliva','m','child',['#bc895d','#3b281c','#6c7945','#466482','#494e4b'],'short','knit','none',1.00,1.02),
  make('c6','Alba · amarillo','f','child',['#e7ba94','#3e2820','#d7b348','#425e7b','#e3e0ce'],'bob','knit','none',.98,.96),
  make('d1','Noah · naranja','m','child',['#795039','#26201b','#cf723f','#273e61','#dbd9cf'],'curly','knit','none',1.03,1.04),
  make('d2','Luna · malva','f','child',['#bc8d66','#30231c','#a27e9e','#c8b790','#68594b'],'long','jacket','none',1.01,1.00),
  make('d3','Álex · camiseta marina','m','adult',['#e1b18b','#b48f57','#263e59','#cbb795','#cccabe'],'short','tshirt','none',1.07,.92),
  make('d4','Zoe · ocre','f','adult',['#76503a','#24201c','#b48b3c','#626c73','#454742'],'curly','tshirt','none',1.02,1.12),
  make('d5','Andrés · polo verde','m','adult',['#be8c66','#38251b','#42674c','#292e33','#45403b'],'bald','tshirt','glasses',.97,1.14),
  make('d6','Clara · mostaza y denim','f','adult',['#e6b89e','#ad5332','#bd923d','#456887','#755846'],'bob','jacket','none',.99,.98)
]);
const BY_ID=new Map(VISITOR_PROFILES.map(profile=>[profile.id,profile]));
export const visitorProfileById=id=>BY_ID.get(id)||null;
export function visitorCategory(value={}){
  const look=value.look||value;
  const age=['nino','child'].includes(look.age)?'child':look.age==='senior'?'senior':'adult';
  const gender=['m','male'].includes(look.gender)?'m':['f','female'].includes(look.gender)?'f':null;
  return {age,gender};
}
const hash=value=>{let h=2166136261;for(const c of String(value)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;};

/** Keep an appearance for a person's lifetime. New arrivals prefer unused looks.
 * Weak keys avoid retaining departed simulation actors. No source object writes.
 */
export function createVisitorRoster(profiles=VISITOR_PROFILES){
  const assignments=new WeakMap(),identities=new WeakMap();let sequence=0;
  return {assign(values=[]){
    const actors=[...new Set(values.filter(value=>value&&typeof value==='object'))];
    const counts=new Map(),chosen=new Map();
    const compatible=(profile,{age,gender})=>profile.age===age&&(!gender||profile.gender===gender);
    for(const actor of actors){
      const previous=assignments.get(actor);
      if(previous&&compatible(previous,visitorCategory(actor))){chosen.set(actor,previous);counts.set(previous.id,(counts.get(previous.id)||0)+1);}
    }
    for(const actor of actors){
      if(chosen.has(actor))continue;
      if(!identities.has(actor))identities.set(actor,++sequence);
      const candidates=profiles.filter(profile=>compatible(profile,visitorCategory(actor)));
      if(!candidates.length)continue;
      const least=Math.min(...candidates.map(profile=>counts.get(profile.id)||0));
      const available=candidates.filter(profile=>(counts.get(profile.id)||0)===least);
      const index=hash(`${actor.id??'visitor'}:${identities.get(actor)}`)%available.length,profile=available[index];
      chosen.set(actor,profile);assignments.set(actor,profile);counts.set(profile.id,(counts.get(profile.id)||0)+1);
    }
    return chosen;
  }};
}

// All snapshot adapters of the same live game share these assignments. Changing
// Matrix / Better / Best cannot reroll a person, and another game has its own pool.
const GAME_ROSTERS=new WeakMap();
export function visitorProfilesForGame(game){
  if(!game||typeof game!=='object')return new Map();
  if(!GAME_ROSTERS.has(game))GAME_ROSTERS.set(game,createVisitorRoster());
  return GAME_ROSTERS.get(game).assign([...(Array.isArray(game.custs)?game.custs:[]),...(Array.isArray(game.passersby)?game.passersby:[])]);
}
