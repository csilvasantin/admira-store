import {quadTransform} from './matrix-mapping.mjs?v=wall-1';

// Alsea brick wall beside the exit. TL/TR/BR/BL, calibrated in the original capture.
export const STARBUCKS_AVATAR_WALL=Object.freeze({id:'starbucks-avatar-wall',width:400,height:900,
 corners:[{yaw:-120.336046,pitch:5.338008},{yaw:-127.419517,pitch:5.876790},{yaw:-127.351265,pitch:-11.862630},{yaw:-120.619692,pitch:-11.143135}]});
// Existing live renderers used by the shared AdmiraNeXT loader, not copied models.
export const AVATAR_WALL_RENDERERS=Object.freeze({good:'https://digitalavatar.ai/better.html?dock=1',better:'https://digitalavatar.ai/best.html?dock=1&kiosk=0',best:'https://digitalavatar.ai/metahuman.html?dock=1'});
// Client context for the avatar brain (06-10-2026): the wall belongs to Starbucks Alsea,
// so the avatar talks as a coffee shop at every level (persona/chips per tier on digitalavatar.ai).
export const STARBUCKS_KIOSK_URL=new URL('../kiosk/starbucks/index.html?v=1',import.meta.url).href;
export const AVATAR_WALL_ORIGIN='https://digitalavatar.ai';
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

// Level on the wall (06-10-2026): the user's /avatar <level> in this tab (sessionStorage,
// written by the shared loader) > the level the page asks for (Matrix 64 bits = best) >
// the last stored level > good.
export const AVATAR_WALL_CHOICE_KEY='admira-avatar:nivel-elegido';
export function wallAvatarLevel({chosen='',tier='',stored=''}={}){
 for(const value of [chosen,tier,stored])if(AVATAR_WALL_RENDERERS[value])return value;
 return 'good';
}
export function mountWallAvatar(surface,{t=(es)=>es,onChange=()=>{},context=null,live=null,tier='best'}={}){
 const doc=surface.ownerDocument,win=doc.defaultView;
 const wall=doc.createElement('dialog');wall.id=STARBUCKS_AVATAR_WALL.id;wall.className='matrix-wall-avatar';wall.setAttribute('aria-label',t('Avatar digital · pared Starbucks','Digital avatar · Starbucks wall'));
 const frame=doc.createElement('iframe');frame.title=t('Avatar digital','Digital avatar');frame.referrerPolicy='no-referrer-when-downgrade';frame.inert=true;
 const expand=doc.createElement('button');expand.type='button';expand.className='matrix-avatar-expand';expand.setAttribute('aria-label',t('Ampliar kiosko Starbucks','Enlarge Starbucks kiosk'));expand.title=t('Explorar Starbucks at Home','Explore Starbucks at Home');expand.textContent=t('Starbucks at Home ↗','Starbucks at Home ↗');
 const close=doc.createElement('button');close.type='button';close.className='matrix-avatar-close';close.textContent=t('✕ Cerrar','✕ Close');
 const toolbar=doc.createElement('div');toolbar.className='matrix-avatar-toolbar';
 const kiosk=doc.createElement('button');kiosk.type='button';kiosk.textContent=t('Web Starbucks · Demo','Starbucks website · Demo');
 const talk=doc.createElement('button');talk.type='button';talk.textContent=t('Hablar con el avatar','Talk to the avatar');
 toolbar.append(kiosk,talk,close);wall.append(toolbar,frame,expand);surface.append(wall);wall.show();
 let disposed=false,expanded=false,source='',releaseMusic=null,mode='kiosk';
 function showMode(next){mode=next;wall.dataset.mode=mode;frame.title=mode==='kiosk'?t('Starbucks at Home · Demo kiosko','Starbucks at Home · Kiosk demo'):t('Avatar digital','Digital avatar');if(mode==='avatar')frame.allow='microphone; autoplay';else frame.removeAttribute('allow');frame.src=mode==='kiosk'?STARBUCKS_KIOSK_URL:source;kiosk.setAttribute('aria-pressed',String(mode==='kiosk'));talk.setAttribute('aria-pressed',String(mode==='avatar'));}
 showMode('kiosk');
 function currentContext(){let extra={};try{extra=(typeof context==='function'?context():context)||{};}catch{}return {...defaultContext(win),...extra};}
 let sentLive='';
 function postLive(force){if(mode!=='avatar')return;let value='';try{value=String((typeof live==='function'?live():'')||'').slice(0,600);}catch{}if(!force&&value===sentLive)return;sentLive=value;try{frame.contentWindow?.postMessage({type:'da-context',live:value},AVATAR_WALL_ORIGIN);}catch{}}
 frame.addEventListener('load',()=>postLive(true));
 function render(){let chosen='',stored='';try{chosen=win.sessionStorage.getItem(AVATAR_WALL_CHOICE_KEY)||'';}catch{}try{stored=win.localStorage.getItem('admira-avatar:nivel')||'';}catch{}let wanted=tier;try{wanted=typeof tier==='function'?tier():tier;}catch{}const level=wallAvatarLevel({chosen,tier:wanted,stored});const next=wallAvatarUrl(level,currentContext());if(next!==source){source=next;if(mode==='avatar')frame.src=source;}else postLive(false);}
 render();
 function collapse(){if(disposed||!expanded)return;expanded=false;frame.inert=true;wall.close();wall.show();showMode('kiosk');releaseMusic?.();releaseMusic=null;onChange();expand.focus({preventScroll:true});}
 function enlarge(next='avatar'){if(disposed)return;if(expanded){showMode(next);return;}showMode(next);win.XpaceMediaExperience?.close();doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.media-ready video,.options-playlist-preview audio,.options-playlist-preview video').forEach(n=>n.pause());win.XpaceAnnouncements?.stopStock?.();expanded=true;frame.inert=false;wall.hidden=false;wall.close();wall.showModal();releaseMusic=win.XpaceMatrixOptions?.suppressMusic?.();close.focus();}
 expand.addEventListener('click',()=>enlarge('kiosk'));kiosk.addEventListener('click',()=>showMode('kiosk'));talk.addEventListener('click',()=>showMode('avatar'));close.addEventListener('click',collapse);
 wall.addEventListener('cancel',e=>{e.preventDefault();collapse();});wall.addEventListener('close',()=>{if(!wall.open)collapse();});
 wall.addEventListener('click',e=>{if(expanded&&e.target===wall)collapse();});
 for(const name of ['pointerdown','wheel','keydown'])wall.addEventListener(name,e=>e.stopPropagation());
 // A same-tab model command updates localStorage without a storage event; the same poll
 // follows language/brand changes and pushes the now-playing track (best tier uses it).
 function onKioskMessage(e){if(mode==='kiosk'&&expanded&&e.source===frame.contentWindow&&e.origin===win.location.origin&&e.data?.type==='starbucks-kiosk:close')collapse();}
 win.addEventListener('message',onKioskMessage);
 const levelPoll=win.setInterval(render,1000);
 // focus(): the camera already looks at the wall; point keyboard focus at the talk button.
 function focus(){if(disposed)return;expand.classList.add('is-called');expand.focus({preventScroll:true});win.setTimeout(()=>expand.classList.remove('is-called'),2400);}
 return {focus,enlarge,get expanded(){return expanded;},get level(){return (source.match(/[?&]tier=(\w+)/)||[])[1]||'';},draw(project,marking){if(expanded||disposed)return;const points=STARBUCKS_AVATAR_WALL.corners.map(project);const matrix=points.every(Boolean)&&quadTransform(points,400,900);wall.hidden=!!marking||!matrix;if(matrix)wall.style.transform='matrix3d('+matrix.join(',')+')';},
 dispose(){if(disposed)return;disposed=true;win.clearInterval(levelPoll);win.removeEventListener('message',onKioskMessage);releaseMusic?.();frame.removeAttribute('src');if(wall.open)wall.close();wall.remove();}};
}
