import * as T from './premium-three.mjs';
export const SHELF_PARTS_URL=new URL('../../inventario/assets/catalog/02/best.parts.json?v=shelves-parts-20261002-3',import.meta.url).href;
let pending;
export function validateShelfParts(doc){
 if(doc?.schema_version!==1||doc.inventory_id!=='native:shelves'||doc.number!==2||doc.inventory_number!==2||doc.quality!=='best'||doc.revision!=='shelves-parts-20261002-3'||!Array.isArray(doc.parts))throw Error('Segmentación Best 2 no disponible');
 const ids=new Set(),numbers=new Set();for(const p of doc.parts){if(!p.id||ids.has(p.id)||!Number.isSafeInteger(p.numeric_id)||p.numeric_id<1||numbers.has(p.numeric_id))throw Error('Identidad de componente inválida');ids.add(p.id);numbers.add(p.numeric_id);}
 const products=doc.parts.filter(p=>p.kind==='product'),slots=new Set();if(products.length!==45)throw Error('La estantería requiere 45 productos');for(const p of products){const slot=p.shelf_index+':'+p.slot_index;if(!/^A02-0[1-6]$/.test(p.product_reference)||!Number.isInteger(p.shelf_index)||p.shelf_index<0||p.shelf_index>4||!Number.isInteger(p.slot_index)||p.slot_index<0||p.slot_index>8||slots.has(slot)||p.product_id!==p.id||!p.product_name||!['carton','pouch','bottle'].includes(p.package_kind))throw Error('Producto o posición inválida');slots.add(slot);}if(new Set(products.map(p=>p.product_reference)).size!==6)throw Error('Se requieren seis referencias');return doc;
}
export async function loadShelfParts(){
 return pending??=fetch(SHELF_PARTS_URL).then(r=>{if(!r.ok)throw Error('No se pudo cargar la segmentación');return r.json();}).then(validateShelfParts).catch(e=>{pending=null;throw e;});
}
export function numericPartForHit(hit){
 const attr=hit?.object?.geometry?.getAttribute('_xp_part');if(!attr||!hit.face)return null;
 const ids=[hit.face.a,hit.face.b,hit.face.c].map(i=>Math.round(attr.getX(i)));
 return ids[0]>0&&ids.every(id=>id===ids[0])?ids[0]:null;
}
export function partForHit(doc,hit){const id=numericPartForHit(hit);return doc.parts.find(p=>p.numeric_id===id)||null;}
export function partGeometry(geometry,numericId){
 const attr=geometry.getAttribute('_xp_part'),position=geometry.getAttribute('position');if(!attr||!position)return null;
 const index=geometry.index,vertices=[],count=index?.count??position.count;
 for(let i=0;i<count;i+=3){const triangle=[0,1,2].map(n=>index?index.getX(i+n):i+n);if(!triangle.every(v=>Math.round(attr.getX(v))===numericId))continue;for(const v of triangle)vertices.push(position.getX(v),position.getY(v),position.getZ(v));}
 if(!vertices.length)return null;return new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3));
}
export function createPartHighlight(root,parent){
 const group=new T.Group(),material=new T.MeshBasicMaterial({color:'#ffba38',transparent:true,opacity:.55,toneMapped:false,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),sources=[];parent.add(group);let selected=null;
 function clear(){for(const mesh of [...group.children]){mesh.geometry.dispose();group.remove(mesh);}sources.length=0;selected=null;}
 function update(){root.updateWorldMatrix(true,true);for(const [mesh,source]of sources){mesh.matrix.copy(source.matrixWorld);mesh.matrixWorldNeedsUpdate=true;}}
 return {select(numericId){clear();if(!numericId)return;selected=numericId;root.traverse(source=>{if(!source.isMesh)return;const geometry=partGeometry(source.geometry,numericId);if(!geometry)return;const mesh=new T.Mesh(geometry,material);mesh.matrixAutoUpdate=false;mesh.renderOrder=10;group.add(mesh);sources.push([mesh,source]);});update();},update,selected:()=>selected,dispose(){clear();material.dispose();group.removeFromParent();}};
}
