import {quadTransform} from './matrix-mapping.mjs?v=wall-1';

// Alsea brick wall beside the exit. TL/TR/BR/BL, calibrated in the original capture.
export const STARBUCKS_AVATAR_WALL=Object.freeze({id:'starbucks-avatar-wall',width:400,height:900,
 corners:[{yaw:-120.336046,pitch:5.338008},{yaw:-127.419517,pitch:5.876790},{yaw:-127.351265,pitch:-11.862630},{yaw:-120.619692,pitch:-11.143135}]});
// Existing live renderers used by the shared AdmiraNeXT loader, not copied models.
export const AVATAR_WALL_RENDERERS=Object.freeze({good:'https://digitalavatar.ai/better.html?dock=1',better:'https://digitalavatar.ai/best.html?dock=1&kiosk=0',best:'https://digitalavatar.ai/metahuman.html?dock=1'});

export function mountWallAvatar(surface,{t=(es)=>es,onChange=()=>{}}={}){
 const doc=surface.ownerDocument,win=doc.defaultView;
 const wall=doc.createElement('dialog');wall.id=STARBUCKS_AVATAR_WALL.id;wall.className='matrix-wall-avatar';wall.setAttribute('aria-label',t('Avatar digital · pared Starbucks','Digital avatar · Starbucks wall'));
 const frame=doc.createElement('iframe');frame.title=t('Avatar digital','Digital avatar');frame.allow='microphone; autoplay';frame.referrerPolicy='no-referrer-when-downgrade';frame.inert=true;
 const expand=doc.createElement('button');expand.type='button';expand.className='matrix-avatar-expand';expand.setAttribute('aria-label',t('Ampliar avatar digital','Enlarge digital avatar'));expand.title=t('Pulsa para hablar con el avatar','Click to talk to the avatar');expand.textContent=t('Avatar digital ↗','Digital avatar ↗');
 const close=doc.createElement('button');close.type='button';close.className='matrix-avatar-close';close.textContent=t('✕ Cerrar','✕ Close');
 wall.append(close,frame,expand);surface.append(wall);wall.show();
 let disposed=false,expanded=false,source='',releaseMusic=null;
 function render(){let level='good';try{level=win.localStorage.getItem('admira-avatar:nivel')||'good';}catch{}const next=AVATAR_WALL_RENDERERS[level]||AVATAR_WALL_RENDERERS.good;if(next!==source){source=next;frame.src=source;}}
 render();
 function collapse(){if(disposed||!expanded)return;expanded=false;frame.inert=true;wall.close();wall.show();frame.src=source;releaseMusic?.();releaseMusic=null;onChange();expand.focus({preventScroll:true});}
 function enlarge(){if(disposed||expanded)return;win.XpaceMediaExperience?.close();doc.querySelectorAll('#expertCreatedPreviews audio,#expertCreatedPreviews video,.media-ready audio,.media-ready video,.options-playlist-preview audio,.options-playlist-preview video').forEach(n=>n.pause());win.XpaceAnnouncements?.stopStock?.();expanded=true;frame.inert=false;wall.hidden=false;wall.close();wall.showModal();releaseMusic=win.XpaceMatrixOptions?.suppressMusic?.();close.focus();}
 expand.addEventListener('click',enlarge);close.addEventListener('click',collapse);
 wall.addEventListener('cancel',e=>{e.preventDefault();collapse();});wall.addEventListener('close',()=>{if(!wall.open)collapse();});
 wall.addEventListener('click',e=>{if(expanded&&e.target===wall)collapse();});
 for(const name of ['pointerdown','wheel','keydown'])wall.addEventListener(name,e=>e.stopPropagation());
 // A same-tab model command updates localStorage without a storage event.
 const levelPoll=win.setInterval(render,1000);
 return {draw(project,marking){if(expanded||disposed)return;const points=STARBUCKS_AVATAR_WALL.corners.map(project);const matrix=points.every(Boolean)&&quadTransform(points,400,900);wall.hidden=!!marking||!matrix;if(matrix)wall.style.transform='matrix3d('+matrix.join(',')+')';},
 dispose(){if(disposed)return;disposed=true;win.clearInterval(levelPoll);releaseMusic?.();frame.removeAttribute('src');if(wall.open)wall.close();wall.remove();}};
}
