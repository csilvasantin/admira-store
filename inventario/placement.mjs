// Match the simulator's tile occupancy, while reserving actors/entrances.
const wallTypes=new Set(['led','tft','aroma']);
export function footprint(item,assets=[]){
 const base=item.fp||assets.find(a=>a.type===item.type)?.fp||[1,1];
 let w=Math.max(1,Math.ceil(base[0]*Math.max(.2,item.sx||1))),d=Math.max(1,Math.ceil(base[1]*Math.max(.2,item.sy||1)));
 if((Math.abs(item.rot||0)%2)===1)[w,d]=[d,w];
 return {col:Math.round(item.col),row:Math.round(item.row),w,d};
}
export function findPlacement(item,layout,{cols,rows,blocked=[]}={},assets=[],preferred=null){
 if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||cols>200||rows>200)return null;
 const wall=wallTypes.has(item.type),taken=new Set(wall?[]:blocked),fp=footprint(item,assets);
 if(wall)fp.w=item.type==='led'?6:item.type==='tft'?2:1;
 for(const other of layout){
  if(wall!==wallTypes.has(other.type))continue;
  const q=footprint(other,assets);if(wall)q.w=other.type==='led'?6:other.type==='tft'?2:1;
  for(let x=q.col;x<q.col+q.w;x++)for(let y=q.row;y<q.row+q.d;y++)taken.add(x+','+y);
 }
 const free=(col,row)=>Number.isInteger(col)&&Number.isInteger(row)&&col>=0&&row>=0&&col+fp.w<=cols&&row+fp.d<=rows&&(!wall||row===0)&&Array.from({length:fp.w},(_,x)=>Array.from({length:fp.d},(_,y)=>col+x+','+(row+y))).flat().every(k=>!taken.has(k));
 if(preferred&&free(Math.round(preferred.col),Math.round(preferred.row)))return {col:Math.round(preferred.col),row:Math.round(preferred.row)};
 const candidates=[];for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)if(free(col,row))candidates.push({col,row});
 candidates.sort((a,b)=>Math.hypot(a.col-cols/2,a.row-rows/2)-Math.hypot(b.col-cols/2,b.row-rows/2));return candidates[0]||null;
}
