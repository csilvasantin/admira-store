// Read-only view of the running Xtanco. Neither renderer owns simulation state.
export function createSceneSnapshot(){
  const ids=new WeakMap();let sequence=0;
  const identity=(actor,kind)=>{if(!ids.has(actor))ids.set(actor,`${kind}-${++sequence}`);return ids.get(actor);};
  return function snapshot({venue=null,iso,projection,layout=[],hardness={},game,active=false,editor=false,footprints={},wallHelpers={}}={}){
    if(!active||!game||!iso)return null;
    const elevation=Math.asin(iso.tileH/iso.tileW);
    const pixelsPerHeightUnit=iso.tileW/Math.SQRT2*Math.cos(elevation);
    function dimensions(item){
      // Imported furniture stores its reference height in Canvas pixels.
      const heightPx=item.type==='custom'?Math.max(12,item.ph||46):item.ph;
      const result={ph:Number.isFinite(heightPx)?heightPx/pixelsPerHeightUnit:undefined};
      if(!wallHelpers.isWallMountedType?.(item.type))return result;
      // Reuse the actual legacy geometry, including its type-specific defaults,
      // rather than interpreting wallY (pixels down from the top) as world Y.
      const polygon=wallHelpers.getWallItemRenderPoly?.(item);
      if(!Array.isArray(polygon)||polygon.length!==4||!polygon.every(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)))return result;
      const centerX=polygon.reduce((sum,p)=>sum+p.x,0)/4,centerY=polygon.reduce((sum,p)=>sum+p.y,0)/4;
      const groundY=iso.oy+(centerX-iso.ox)*iso.tileH/iso.tileW;
      result.ph=(polygon[3].y-polygon[0].y)/pixelsPerHeightUnit;
      result.wallY=(groundY-centerY)/pixelsPerHeightUnit;
      return result;
    }
    const actor=(value,kind)=>{
      if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.y))return null;
      const dx=(value.x+7-iso.ox)/(iso.tileW/2);
      const dy=(value.y+20-iso.oy)/(iso.tileH/2);
      return {id:identity(value,kind),kind,col:(dx+dy)/2,row:(dy-dx)/2,
        color:value.look?.shirt||value.shirt||'#487e8b',heading:value.dir||0,
        walking:!!value.isWalking||['walk','enter','leave'].includes(value.st),label:value.name||''};
    };
    const actors=[...(game.staff||[]).filter(v=>v.hired&&!v.hidden).map(v=>actor(v,'staff')),
      ...(game.custs||[]).map(v=>actor(v,'customer')),
      ...(game.passersby||[]).map(v=>actor(v,'passerby'))];
    for(const kind of ['saca','thief','guardiaCivil','opinador','unitreeBot']){
      const value=game[kind];if(value&&value.phase!=='idle')actors.push(actor(value,kind));
    }
    const blocked=Array.isArray(hardness.blocked)?[...new Set(hardness.blocked.filter(value=>typeof value==='string'&&/^\d+,\d+$/.test(value)))]:[];
    return {venue,cols:iso.cols,rows:iso.rows,
      doorRow:Number.isFinite(hardness.doorRow)?hardness.doorRow:Number.isFinite(iso.doorRow)?iso.doorRow:3.35,
      doorHalfWidth:Number.isFinite(hardness.doorHalfWidth)?hardness.doorHalfWidth:undefined,
      outsideDepth:Number.isFinite(hardness.outsideDepth)?hardness.outsideDepth:undefined,elevation,editor,
      projection:projection?{...projection}:undefined,
      hardness:{cols:iso.cols,rows:iso.rows,blocked,fixed:Array.isArray(hardness.fixed)?structuredClone(hardness.fixed):[],colliders:Array.isArray(hardness.colliders)?structuredClone(hardness.colliders):[]},
      colliders:Array.isArray(hardness.colliders)?structuredClone(hardness.colliders):[],
      wallHeight:iso.wallH/pixelsPerHeightUnit,
      layout:layout.map(v=>({id:v.id,type:v.type,col:v.col,row:v.row,sx:v.sx||1,sy:v.sy||1,
        rot:v.rot||0,flipX:!!v.flipX,solid:v.solid,hidden:!!v.hidden,mount:v.mount,source:typeof v.source==='string'?v.source:'',sourceAssetId:typeof v.sourceAssetId==='string'?v.sourceAssetId:'',modelUrl:typeof v.modelUrl==='string'?v.modelUrl:null,locked:!!v.locked,img:typeof v.img==='string'?v.img:'',label:v.label||'',fp:[...(v.fp||footprints[v.type]||[1,1])],...dimensions(v)})),
      actors:actors.filter(Boolean),doorOpen:game.doorAnim??0,time:game.gameTime??12,
      inside:(game.custs||[]).length,entries:game.custIn||0};
  };
}
