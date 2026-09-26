(async()=>{
 const {projectMatrixFloor}=await import('/admira-xp/scripts/matrix-floor.mjs');
 const nav=await import('/admira-xp/scripts/customer-navigation.mjs');
 const snap=(await import('/admira-xp/scripts/life-snapshot.mjs')).createLifeSnapshot();
 const scene=snap(window.__xtancoVisualState());const cols=scene.cols,rows=scene.rows;
 const boxes=new Map(nav.buildCustomerNavigation(scene,{radius:0}).obstacles.map(o=>[o.id,o]));
 const items=new Map((scene.layout||[]).map(i=>[String(i.id),i]));
 const stage=document.querySelector('.matrix-dialog .best-live-scene').getBoundingClientRect();
 const inv=(fx,fy)=>{let c=cols/2,r=rows/2;for(let k=0;k<30;k++){const p=projectMatrixFloor(c,r,cols,rows),e=1e-3,pc=projectMatrixFloor(c+e,r,cols,rows),pr=projectMatrixFloor(c,r+e,cols,rows);
   const a=(pc.x-p.x)/e,b=(pr.x-p.x)/e,cc=(pc.y-p.y)/e,d=(pr.y-p.y)/e,det=a*d-b*cc,dx=fx-p.x,dy=fy-p.y;c+=(d*dx-b*dy)/det;r+=(-cc*dx+a*dy)/det;}return [c,r];};
 const out=[];
 for(const n of document.querySelectorAll('.matrix-dialog .matrix-furniture-item[data-instance-id]')){
  const id=n.dataset.instanceId,box=boxes.get(id),item=items.get(id);if(!box||!item)continue;
  let pts=[];
  const svg=n.querySelector('svg');
  if(svg){
   for(const poly of svg.querySelectorAll('clipPath polygon')){const m=poly.getScreenCTM();for(const pt of poly.points){const q=new DOMPoint(pt.x,pt.y).matrixTransform(m);pts.push([q.x,q.y]);}}
  }else{
   const img=n.querySelector('img');if(!img||!img.naturalWidth)continue;
   const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d');g.drawImage(img,0,0);
   const a=g.getImageData(0,0,c.width,c.height).data,r=img.getBoundingClientRect(),flip=n.style.transform.includes('scale(-');
   // for each column, the lowest opaque pixel = silhouette bottom
   for(let x=0;x<c.width;x+=2){for(let y=c.height-1;y>=0;y--){if(a[(y*c.width+x)*4+3]>80){const X=flip?r.right-(x+.5)/c.width*r.width:r.left+(x+.5)/c.width*r.width;pts.push([X,r.top+(y+.5)/c.height*r.height]);break;}}}
  }
  if(!pts.length)continue;
  const ys=pts.map(p=>p[1]),top=Math.min(...ys),bot=Math.max(...ys),band=bot-(bot-top)*.14;
  const base=pts.filter(p=>p[1]>=band).map(([x,y])=>inv((x-stage.left)/stage.width,(y-stage.top)/stage.height));
  if(!base.length)continue;
  const bc=base.map(p=>p[0]),br=base.map(p=>p[1]);
  const vis={minCol:Math.min(...bc),maxCol:Math.max(...bc),minRow:Math.min(...br),maxRow:Math.max(...br)};
  const over={minCol:+(box.minCol-vis.minCol).toFixed(2),maxCol:+(vis.maxCol-box.maxCol).toFixed(2),minRow:+(box.minRow-vis.minRow).toFixed(2),maxRow:+(vis.maxRow-box.maxRow).toFixed(2)};
  out.push({id,type:item.type,label:n.getAttribute('aria-label'),photo:!!svg,rot:item.rot||0,box:[box.minCol,box.minRow,box.maxCol,box.maxRow].map(v=>+v.toFixed(2)),visual:[vis.minCol,vis.minRow,vis.maxCol,vis.maxRow].map(v=>+v.toFixed(2)),overhang:over});
 }
 window.__measure=out;return out.length;
})()
