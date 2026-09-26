// Statistics of fictional avatar attributes only. Never read a camera, face
// model, sprite appearance, imported audience description or person identity.
const LEGACY_AGE_BANDS=Object.freeze({nino:'under18',joven:'18to60',adulto:'18to60',senior:'over60'});

export function avatarAgeBand(value){
  if(typeof value==='number')return Number.isFinite(value)&&value>=0
    ?value<18?'under18':value<=60?'18to60':'over60':'unknown';
  return typeof value==='string'&&Object.hasOwn(LEGACY_AGE_BANDS,value)?LEGACY_AGE_BANDS[value]:'unknown';
}

export function summarizeAvatarAudience(avatars){
  const result={source:'avatar-simulation',scope:'present',total:0,
    gender:{man:0,woman:0,unknown:0},age:{under18:0,'18to60':0,over60:0,unknown:0}};
  if(!Array.isArray(avatars))return result;
  for(const avatar of avatars){
    // Invalid/missing metadata remains in the same present-avatar denominator.
    const look=avatar?.look;
    result.total++;
    result.gender[look?.gender==='m'?'man':look?.gender==='f'?'woman':'unknown']++;
    result.age[avatarAgeBand(look?.age)]++;
  }
  return result;
}


export function avatarProfile(avatar){
  const look=avatar?.look||{};
  return {gender:look.gender==='m'?'m':look.gender==='f'?'f':'unknown',age:({under18:'nino','18to60':'adulto',over60:'senior',unknown:'unknown'})[avatarAgeBand(look.age)]};
}
export function validAvatarProfile(p){return !!p&&['m','f','unknown'].includes(p.gender)&&['nino','adulto','senior','unknown'].includes(p.age);}
export function categoryProfile(kind,key){
  if(kind==='gender'&&['man','woman','unknown'].includes(key))return {gender:({man:'m',woman:'f',unknown:'unknown'})[key],age:'unknown'};
  if(kind==='age'&&['under18','18to60','over60','unknown'].includes(key))return {gender:'unknown',age:({under18:'nino','18to60':'adulto',over60:'senior',unknown:'unknown'})[key]};
  return null;
}
export function matchesAvatarCategory(avatar,kind,key){
  const p=avatarProfile(avatar);
  return kind==='gender'?({m:'man',f:'woman',unknown:'unknown'})[p.gender]===key:kind==='age'&&avatarAgeBand(p.age)===key;
}
export function missingAvatarProfile(avatars,profiles){
  if(!Array.isArray(profiles)||profiles.length>100||!profiles.every(validAvatarProfile))return null;
  const remaining=profiles.map(p=>({...p}));
  for(const avatar of avatars){const p=avatarProfile(avatar),i=remaining.findIndex(q=>q.age===p.age&&q.gender===p.gender);if(i>=0)remaining.splice(i,1);}
  return remaining[0]||null;
}

export function avatarAudienceMarkup(avatars,en=false,interactive=false){
  const data=summarizeAvatarAudience(avatars),format=value=>value.toLocaleString(en?'en':'es');
  const genders=en?{man:'Men',woman:'Women',unknown:'Unknown'}:{man:'Hombres',woman:'Mujeres',unknown:'Sin dato'};
  const ages=en?{under18:'Children · <18','18to60':'Adults · 18–60',over60:'Seniors · >60',unknown:'Unknown'}
    :{under18:'Niños · <18','18to60':'Adultos · 18–60',over60:'Séniores · >60',unknown:'Sin dato'};
  const cells=(kind,labels)=>Object.entries(labels).map(([key,label])=>{
    const safe=label.replaceAll('<','&lt;').replaceAll('>','&gt;');
    const control=delta=>'<button type="button" data-avatar-adjust="'+delta+'" data-avatar-kind="'+kind+'" data-avatar-key="'+key+'" aria-label="'+(delta<0?(en?'Remove one: ':'Quitar uno: '):(en?'Add one: ':'Añadir uno: '))+(kind==='gender'?(en?'Gender · ':'Género · '):(en?'Age · ':'Edad · '))+safe+'" '+((delta<0?data[kind][key]===0:data.total>=100)?'disabled':'')+'>'+(delta<0?'−':'+')+'</button>';
    return '<div class="avatar-audience-cell">'+(interactive?control(-1):'')+'<div><span>'+safe+'</span><strong data-avatar-'+kind+'="'+key+'">'+format(data[kind][key])+'</strong></div>'+(interactive?control(1):'')+'</div>';
  }).join('');
  return '<section id="instore-avatar-audience" data-audience-source="avatar-simulation" aria-label="'+(en?'Present avatar attributes · simulation':'Atributos de avatares presentes · simulación')+'">'+
    '<div class="avatar-audience-heading"><b>'+(en?'AVATAR ATTRIBUTES':'ATRIBUTOS DE AVATARES')+'</b><span>'+(en?'SIMULATION':'SIMULACIÓN')+'</span></div>'+
    '<p class="avatar-audience-scope">'+(en?'Present now':'Presentes ahora')+' · <b data-avatar-total>'+format(data.total)+'</b></p>'+
    (interactive?'<p class="avatar-audience-scope">'+(en?'− remove · + add one avatar · manual control · max 100':'− quitar · + añadir un avatar · control manual · máx. 100')+'</p>':'')+
    '<div class="avatar-audience-label">'+(en?'Avatar gender':'Género del avatar')+'</div><div class="avatar-audience-grid avatar-audience-genders">'+cells('gender',genders)+'</div>'+
    '<div class="avatar-audience-label">'+(en?'Assigned age band':'Franja de edad asignada')+'</div><div class="avatar-audience-grid avatar-audience-ages">'+cells('age',ages)+'</div>'+(interactive?'<p class="avatar-audience-scope">'+(en?'The other attribute starts as Unknown. Both distributions describe the same visitors.':'El otro atributo empieza Sin dato. Ambas distribuciones describen a los mismos visitantes.')+'</p><button type="button" data-avatar-auto>'+ (en?'Return to automatic audience':'Volver a audiencia automática')+'</button>':'')+'</section>';
}

if(typeof window!=='undefined')window.__xtancoAvatarAudience={summarize:summarizeAvatarAudience,render:avatarAudienceMarkup,profile:avatarProfile,validProfile:validAvatarProfile,categoryProfile,matches:matchesAvatarCategory,missing:missingAvatarProfile};
