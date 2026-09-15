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

export function avatarAudienceMarkup(avatars,en=false){
  const data=summarizeAvatarAudience(avatars),format=value=>value.toLocaleString(en?'en':'es');
  const genders=en?{man:'Men',woman:'Women',unknown:'Unknown'}:{man:'Hombres',woman:'Mujeres',unknown:'Sin dato'};
  const ages=en?{under18:'Children · <18','18to60':'Adults · 18–60',over60:'Seniors · >60',unknown:'Unknown'}
    :{under18:'Niños · <18','18to60':'Adultos · 18–60',over60:'Séniores · >60',unknown:'Sin dato'};
  const cells=(kind,labels)=>Object.entries(labels).map(([key,label])=>
    '<div class="avatar-audience-cell"><span>'+label.replaceAll('<','&lt;').replaceAll('>','&gt;')+'</span><strong data-avatar-'+kind+'="'+key+'">'+format(data[kind][key])+'</strong></div>').join('');
  return '<section id="instore-avatar-audience" data-audience-source="avatar-simulation" aria-label="'+(en?'Present avatar attributes · simulation':'Atributos de avatares presentes · simulación')+'">'+
    '<div class="avatar-audience-heading"><b>'+(en?'AVATAR ATTRIBUTES':'ATRIBUTOS DE AVATARES')+'</b><span>'+(en?'SIMULATION':'SIMULACIÓN')+'</span></div>'+
    '<p class="avatar-audience-scope">'+(en?'Present now':'Presentes ahora')+' · <b data-avatar-total>'+format(data.total)+'</b></p>'+
    '<div class="avatar-audience-label">'+(en?'Avatar gender':'Género del avatar')+'</div><div class="avatar-audience-grid avatar-audience-genders">'+cells('gender',genders)+'</div>'+
    '<div class="avatar-audience-label">'+(en?'Assigned age band':'Franja de edad asignada')+'</div><div class="avatar-audience-grid avatar-audience-ages">'+cells('age',ages)+'</div></section>';
}

if(typeof window!=='undefined')window.__xtancoAvatarAudience={summarize:summarizeAvatarAudience,render:avatarAudienceMarkup};
