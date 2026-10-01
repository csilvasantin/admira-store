import {STARBUCKS_SCREEN_PLAYLIST} from './starbucks-screens.mjs?v=number-layout-1';
// Spatial slices are independent of playback: changing layout never seeks or reloads media.
export const SCREEN_DISPLAY_KEY='xpaceos.starbucks.wall-display.v1';
export const SCREEN_DISPLAY_MODES={individual:[[1],[2],[3],[4],[5],[6]],groups:[[1,2,3],[4],[5,6]],total:[[1,2,3,4,5,6]]};
const listeners=new Set();
let current;
export function getScreenDisplayMode(){
 if(current)return current;
 try{const saved=globalThis.localStorage?.getItem(SCREEN_DISPLAY_KEY);if(Object.hasOwn(SCREEN_DISPLAY_MODES,saved))return current=saved;}catch{}
 return current='individual';
}
export function setScreenDisplayMode(mode){
 if(!Object.hasOwn(SCREEN_DISPLAY_MODES,mode))throw new Error('Invalid screen display mode');
 current=mode;try{globalThis.localStorage?.setItem(SCREEN_DISPLAY_KEY,mode);}catch{}
 for(const fn of listeners)fn(mode);return mode;
}
export function subscribeScreenDisplay(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function screenSlice(id,mode){
 const number=screenNumber(id);
 const group=SCREEN_DISPLAY_MODES[mode]?.find(g=>g.includes(number));
 if(!group)return null;
 return {group:group.join('-'),width:group.length*100,left:-[...group].sort((a,b)=>b-a).indexOf(number)*100,fit:group.length===1?'contain':'cover'};
}
export function parseScreenDisplayCommand(text){
 const m=String(text||'').trim().match(/^\/(sincro|sync|sincrototal|synctotal)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
 if(!m)return null;
 const command=m[1].toLowerCase(),arg=(m[2]||'').trim().toLowerCase();
 if(['sincrototal','synctotal'].includes(command))return arg?{invalid:true}:{mode:'total'};
 if(['','on','grupos','groups'].includes(arg))return {mode:'groups'};
 if(['off','individual','individuales'].includes(arg))return {mode:'individual'};
 if(['total','all'].includes(arg))return {mode:'total'};
 return {invalid:true};
}

// IDs retain their original anchors. Display numbers start at the street entrance.
export function screenNumber(id){const numbers=STARBUCKS_SCREEN_PLAYLIST.display.screenNumbersById;return Object.hasOwn(numbers,id)?numbers[id]:null;}
export function screenGroup(number){return number>=1&&number<=3?1:number>=5&&number<=6?2:0;}
let numbersVisible=false;
const numberListeners=new Set();
export const getScreenNumbersVisible=()=>numbersVisible;
export function setScreenNumbersVisible(value){numbersVisible=value===null?!numbersVisible:!!value;for(const fn of numberListeners)fn(numbersVisible);return numbersVisible;}
export function subscribeScreenNumbers(fn){numberListeners.add(fn);return ()=>numberListeners.delete(fn);}
export function parseScreenLayoutCommand(text){
 const m=String(text||'').trim().match(/^\/(layout|layoiut)(?:@\w+)?(?:\s+([\s\S]*))?$/i);if(!m)return null;
 const arg=(m[2]||'').trim().toLowerCase();
 if(!arg)return {visible:null};
 if(arg==='on')return {visible:true};if(arg==='off')return {visible:false};
 // Preserve explicit furniture operations, never let a typo reset the furniture.
 if(m[1].toLowerCase()==='layout'&&/^(?:save|guardar|grabar|export|exportar|factory|wipe|reset-all|default|code|codigo|canonico|canónico|xpacio(?: (?:save|guardar|load|cargar))?|xml(?: (?:save|guardar|load|reload|recargar|download|descargar|dump|loc(?: (?:save|load))?))?)$/.test(arg))return {legacy:true};
 return {invalid:true};
}
