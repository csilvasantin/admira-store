// Original image references only; source orientation is determined generically, never by Stock ID.
export const BAD_TIMES_ID='1790706121644-y5mqrq';
export const BAD_TIMES_COVER='https://img.youtube.com/vi/8PeU6AVPQVg/hqdefault.jpg';
export function musicArtwork(track){
 const id=track?.id||track?.stockId,title=track?.title||'Starbucks · hilo musical';
 if(id===BAD_TIMES_ID)return {title:'Bad Times · Deep House',url:BAD_TIMES_COVER,focusX:.85,focusY:.5,matte:20/360};
 return {title,url:track?.cover||'',focusX:id==='1790707278998-rc0d3i'?.82:.5,focusY:.5,matte:0};
}
export function musicVisualPolicy(track,dimensions={}){
 const width=Number(dimensions.width||track?.width)||0,height=Number(dimensions.height||track?.height)||0,known=width>0&&height>0;
 const orientation=known?(height>width?'portrait':'landscape'):'unknown';
 return {mode:track?.kind==='video'&&orientation==='portrait'?'portrait-video':'portrait-artwork',orientation,width,height,...musicArtwork(track)};
}
