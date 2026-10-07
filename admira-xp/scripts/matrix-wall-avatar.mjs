import {quadTransform} from './matrix-mapping.mjs?v=wall-1';

// Alsea brick wall beside the exit. TL/TR/BR/BL, calibrated in the original capture.
export const STARBUCKS_AVATAR_WALL=Object.freeze({id:'starbucks-avatar-wall',width:400,height:900,
 corners:[{yaw:-120.336046,pitch:5.338008},{yaw:-127.419517,pitch:5.876790},{yaw:-127.351265,pitch:-11.862630},{yaw:-120.619692,pitch:-11.143135}]});
// Existing live renderers used by the shared AdmiraNeXT loader, not copied models.
// good = Admirito, the animated cloud (nube.html, 06-10-2026); the bald 3D head stays on digitalavatar.ai/better.html.
export const AVATAR_WALL_RENDERERS=Object.freeze({good:'https://digitalavatar.ai/nube.html?dock=1',better:'https://digitalavatar.ai/best.html?dock=1&kiosk=0',best:'https://digitalavatar.ai/metahuman.html?dock=1'});
// Client context for the avatar brain (06-10-2026): the wall belongs to Starbucks Alsea,
// so the avatar talks as a coffee shop at every level (persona/chips per tier on digitalavatar.ai).
export const STARBUCKS_KIOSK_URL=new URL('../kiosk/starbucks/index.html?v=1',import.meta.url).href;
export const AVATAR_WALL_ORIGIN='https://digitalavatar.ai';
// Interruptor Tótem (7-oct-2026): ON = este player (la pared junto a la salida) enseña el interactivo
// de la escena — el quiosco de pedido de ainimation.studio para Starbucks Paseo de Gracia — y recibe toques.
export const WALL_KIOSK_SIZE=Object.freeze({w:400,h:900});
export const WALL_KIOSK_BASE='https://www.ainimation.studio/xperiencias/kiosko-pedido/?store=starbucks-paseo-de-gracia&marca=starbucks';
export function wallKioskUrl({lang='es',url=''}={}){
 const u=new URL(url||WALL_KIOSK_BASE);if(!url){u.searchParams.set('lang',lang==='en'?'en':'es');u.searchParams.set('host','gemelo');}
 u.searchParams.set('formato','vertical');u.searchParams.set('w',String(WALL_KIOSK_SIZE.w));u.searchParams.set('h',String(WALL_KIOSK_SIZE.h));return u.href;
}
export const AVATAR_WALL_CONTEXT=Object.freeze({loc:'alsea-sbux-021',sector:'cafeteria',site:'Starbucks Paseo de Gracia 103',city:'Barcelona'});
const CONTEXT_KEYS=['loc','lang','sector','brand','site','city'];
export function wallAvatarUrl(level,context={}){
 const tier=AVATAR_WALL_RENDERERS[level]?level:'good',url=new URL(AVATAR_WALL_RENDERERS[tier]);
 for(const key of CONTEXT_KEYS){const value=String(context?.[key]??'').trim().slice(0,120);if(value)url.searchParams.set(key,value);}
 url.searchParams.set('tier',tier);return url.href;
}
function defaultContext(win){
 let brand='';try{brand=String(win.sessionStorage.getItem('mb:marca')||'').replace(/[^a-z0-9_-]/gi,'').slice(0,60);}catch{}
 const lang=String(win.document?.documentElement?.lang||'es').toLowerCase().startsWith('en')?'en':'es';
 return {...AVATAR_WALL_CONTEXT,lang,...(brand?{brand}:{})};
}

// Assistant model is independent of the Xpace visual quality. Explicit tab choice > Good.
// The legacy language key is retained for compatibility but never overrides the site.
export const AVATAR_WALL_LANGUAGE_KEY='admira-avatar:language:alsea-sbux-021';
export const AVATAR_WALL_CHOICE_KEY='admira-avatar:nivel-elegido';
export function wallAvatarLevel({chosen=''}={}){return AVATAR_WALL_RENDERERS[chosen]?chosen:'good';}

export function mountWallAvatar(surface,{t=(es)=>es,onChange=()=>{},context=null,live=null}={}){
 const doc=surface.ownerDocument,win=doc.defaultView;
 const wall=doc.createElement('dialog');wall.id=STARBUCKS_AVATAR_WALL.id;wall.className='matrix-wall-avatar';wall.setAttribute('aria-label',t('Avatar digital · pared Starbucks','Digital avatar · Starbucks wall'));
 const frame=doc.createElement('iframe');frame.title=t('Avatar digital','Digital avatar');frame.referrerPolicy='no-referrer-when-downgrade';frame.inert=true;
 const expand=doc.createElement('button');expand.type='button';expand.className='matrix-avatar-expand';expand.setAttribute('aria-label',t('Hablar con el avatar','Talk to the avatar'));expand.title=t('Avatar digital · Admirito','Digital avatar · Admirito');expand.textContent=t('Hablar con el avatar','Talk to the avatar');
 const close=doc.createElement('button');close.type='button';close.className='matrix-avatar-close';close.textContent=t('✕ Cerrar','✕ Close');
 const toolbar=doc.createElement('div');toolbar.className='matrix-avatar-toolbar';
 const model=doc.createElement('select');model.className='matrix-avatar-model';model.setAttribute('aria-label',t('Modelo del avatar','Avatar model'));for(const [value,label]of [['good','Avatar · Admirito'],['better','Human · Luna'],['best','Metahuman · Neo']]){const option=doc.createElement('option');option.value=value;option.textContent=label;model.append(option);}
 toolbar.append(close,model);wall.append(toolbar,frame,expand);surface.append(wall);wall.show();
 let disposed=false,expanded=false,source='',releaseMusic=null,mode='avatar',avatarLanguage='',siteLanguage=defaultContext(win).lang,localChoice='';
 function resetConversation(){avatarLanguage='';render();frame.src=source;}
 wall.dataset.mode='avatar';
 function currentContext(){let extra={};try{extra=(typeof context==='function'?context():context)||{};}catch{}return {...defaultContext(win),...extra,lang:avatarLanguage||defaultContext(win).lang};}
 let sentLive='';
 function postLive(force){if(mode!=='avatar')return;let value='';try{value=String((typeof live==='function'?live():'')||'').slice(0,600);}catch{}if(!force&&value===sentLive)return;sentLive=value;try{frame.contentWindow?.postMessage({type:'da-context',live:value},AVATAR_WALL_ORIGIN);}catch{}}
 frame.addEventListener('load',()=>postLive(true));
 function render(){const language=defaultContext(win).lang;if(language!==siteLanguage){siteLanguage=language;avatarLanguage='';}let chosen=localChoice;try{chosen=win.sessionStorage.getItem(AVATAR_WALL_CHOICE_KEY)||localChoice;}catch{}const level=wallAvatarLevel({chosen});model.value=level;const next=wallAvatarUrl(level,currentContext());if(next!==source){const previous=source?new URL(source):null;source=next;if(mode==='avatar'){if(previous&&previous.searchParams.get('tier')===level){try{frame.contentWindow?.postMessage({type:'da-context',...currentContext()},AVATAR_WALL_ORIGIN);}catch{}}else frame.src=source;}}else postLive(false);}
 render();
 model.addEventListener('change',()=>{if(!AVATAR_WALL_RENDERERS[model.value])return;localChoice=model.value;try{win.sessionStorage.setItem(AVATAR_WALL_CHOICE_KEY,localChoice);win.localStorage.setItem('admira-avatar:nivel',localChoice);}catch{}render();});
 function collapse(){if(disposed||!expanded)return;if(mode==='kiosk'){expanded=false;frame.inert=true;wall.close();wall.show();releaseMusic?.();releaseMusic=null;onChange();expand.focus({preventScroll:true});return;}expanded=false;frame.inert=true;frame.removeAttribute('allow');frame.src='about:blank';resetConversation();wall.close();wall.show();releaseMusic?.();releaseMusic=null;onChange();expand.focus({preventScroll:true});}
 function enlarge(){if(disposed||expanded)return;if(mode==='kiosk'){win.XpaceMediaExperience?.close();win.XpaceAnnouncements?.stopStock?.();expanded=true;frame.inert=false;wall.hidden=false;wall.close();wall.showModal();releaseMusic=win.XpaceMatrixOptions?.suppressMusic?.();close.focus();return;}frame.allow='microphone; autoplay';resetConversation();win.XpaceMediaExperience?.close();doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.media-ready video,.options-playlist-preview audio,.options-playlist-preview video').forEach(n=>n.pause());win.XpaceAnnouncements?.stopStock?.();expanded=true;frame.inert=false;wall.hidden=false;wall.close();wall.showModal();releaseMusic=win.XpaceMatrixOptions?.suppressMusic?.();close.focus();}
 function totemOn(){try{return !!win.XpaceTotem?.on?.();}catch{return false;}}
 function totemUrl(){let custom='';try{custom=win.localStorage.getItem('xpace:totem-url')||'';}catch{}return wallKioskUrl({lang:defaultContext(win).lang,url:custom});}
 function setMode(next){next=next==='kiosk'?'kiosk':'avatar';if(next===mode&&!(next==='kiosk'&&frame.src!==totemUrl()))return;const was=expanded;if(was)collapse();mode=next;wall.dataset.mode=mode;
  if(mode==='kiosk'){frame.removeAttribute('allow');frame.inert=true;frame.src=totemUrl();expand.textContent=t('👆 Tocar el tótem','👆 Touch the totem');expand.setAttribute('aria-label',t('Abrir el quiosco a tamaño real','Open the kiosk full size'));wall.setAttribute('aria-label',t('Tótem · quiosco de pedido','Totem · ordering kiosk'));}
  else{frame.inert=true;expand.textContent=t('Hablar con el avatar','Talk to the avatar');expand.setAttribute('aria-label',t('Hablar con el avatar','Talk to the avatar'));wall.setAttribute('aria-label',t('Avatar digital · pared Starbucks','Digital avatar · Starbucks wall'));source='';render();}
  onChange();}
 const onTotemMode=e=>setMode(e?.detail?.on?'kiosk':'avatar');win.addEventListener('xpace:totem-mode',onTotemMode);
 if(totemOn())setMode('kiosk');
 expand.addEventListener('click',enlarge);close.addEventListener('click',collapse);
 wall.addEventListener('cancel',e=>{e.preventDefault();collapse();});wall.addEventListener('close',()=>{if(!wall.open)collapse();});
 wall.addEventListener('click',e=>{if(expanded&&e.target===wall)collapse();});
 for(const name of ['pointerdown','wheel','keydown'])wall.addEventListener(name,e=>e.stopPropagation());
 // A same-tab model command updates localStorage without a storage event; the same poll
 // follows language/brand changes and pushes the now-playing track (best tier uses it).
 function onAvatarMessage(e){if(mode==='avatar'&&expanded&&e.source===frame.contentWindow&&e.origin===AVATAR_WALL_ORIGIN&&e.data?.type==='da-language-selected'&&['es','en'].includes(e.data.lang)){avatarLanguage=e.data.lang;source=wallAvatarUrl((source.match(/[?&]tier=(\w+)/)||[])[1],currentContext());return;}}
 win.addEventListener('message',onAvatarMessage);
 const levelPoll=win.setInterval(render,1000);
 // focus(): the camera already looks at the wall; point keyboard focus at the talk button.
 function focus(){if(disposed)return;expand.classList.add('is-called');expand.focus({preventScroll:true});win.setTimeout(()=>expand.classList.remove('is-called'),2400);}
 return {focus,enlarge,setMode,get mode(){return mode;},get expanded(){return expanded;},get level(){return (source.match(/[?&]tier=(\w+)/)||[])[1]||'';},draw(project,marking){if(expanded||disposed)return;const points=STARBUCKS_AVATAR_WALL.corners.map(project);const matrix=points.every(Boolean)&&quadTransform(points,400,900);wall.hidden=!!marking||!matrix;if(matrix)wall.style.transform='matrix3d('+matrix.join(',')+')';},
 dispose(){if(disposed)return;disposed=true;win.removeEventListener('xpace:totem-mode',onTotemMode);win.clearInterval(levelPoll);win.removeEventListener('message',onAvatarMessage);releaseMusic?.();frame.removeAttribute('src');if(wall.open)wall.close();wall.remove();}};
}
