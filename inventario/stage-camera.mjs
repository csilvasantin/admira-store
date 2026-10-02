export function stageCamera(initialZoom=1){
 let state={angle:Math.PI/4,elevation:.38,zoom:initialZoom,wire:false},listeners=new Set();
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 return {get:()=>({...state}),update(patch){const next={...state,...patch};next.elevation=clamp(next.elevation,.05,1.35);next.zoom=clamp(next.zoom,.6,6);if(Object.keys(next).every(key=>next[key]===state[key]))return;state=next;for(const listener of listeners)listener({...state});},subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}};
}
