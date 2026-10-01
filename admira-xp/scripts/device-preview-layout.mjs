import {screenNumber} from './screen-display.mjs?v=number-layout-1';
// Wall order follows the physical wall (6 → 1). POS is the last surface.
export function previewSlice(id,ids,aspectFor=()=>1){
 const ordered=[...new Set(ids)].sort((a,b)=>(screenNumber(b)||0)-(screenNumber(a)||0));
 if(!ordered.includes(id))return null;
 const aspects=ordered.map(key=>{const value=aspectFor(key);return Number.isFinite(value)&&value>0?value:1;});
 const index=ordered.indexOf(id),total=aspects.reduce((sum,n)=>sum+n,0),before=aspects.slice(0,index).reduce((sum,n)=>sum+n,0);
 return {width:total/aspects[index]*100,left:-before/aspects[index]*100,fit:ordered.length===1?'contain':'cover',group:'preview-'+ordered.join(',')};
}
