// Baked walk sheets for Matrix visitors (24-sep-2026 · tools/walk-sprites).
// Each sheet: 9 columns (8 walk frames + 1 idle) x 2 rows
// (front-right, back-right), 192x288 px per frame, rendered from the
// Best GLB body of the same profile at a 30° elevation. The runtime mirrors
// them for left-hand directions. Frames keep a 6% transparent pad above and below.
export const WALK_SHEET=Object.freeze({frameW:192,frameH:288,walkFrames:8,cols:9,rows:2,pad:.06});
const IDS=new Set(["a1", "a2", "a3", "a4", "a5", "a6", "b1", "b2", "b3", "b4", "b5", "b6", "c1", "c2", "c3", "c4", "c5", "c6", "d1", "d2", "d3", "d4", "d5", "d6"]);
export function walkSheetURL(profileId){
  return IDS.has(profileId)?`assets/people/matrix-walk/${profileId}.webp?v=walk-1`:null;
}
export function walkFrame(phase,walking){
  if(!walking||!Number.isFinite(phase))return WALK_SHEET.walkFrames;
  return Math.floor((((phase%1)+1)%1)*WALK_SHEET.walkFrames)%WALK_SHEET.walkFrames;
}
export function walkBackgroundPosition(column,row){
  return `${(column/(WALK_SHEET.cols-1)*100).toFixed(4)}% ${(row/(WALK_SHEET.rows-1)*100).toFixed(4)}%`;
}
