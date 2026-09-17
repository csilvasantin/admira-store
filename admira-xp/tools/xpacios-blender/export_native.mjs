// Serialize the existing native geometry for editable Blender authoring.
import fs from 'node:fs';
import * as T from '../../scripts/premium-three.mjs';
import {createLifeScene} from '../../scripts/life-scene.mjs';
const catalog=JSON.parse(fs.readFileSync('inventario/catalog.json'));
const canvasFactory=()=>{const canvas={width:0,height:0,text:[],base:null};const ctx=new Proxy({fillRect(){canvas.base ||= this.fillStyle;},fillText(text,x,y){canvas.text.push({text,x,y,color:this.fillStyle});}}, {get:(o,k)=>k in o?o[k]:()=>{}});canvas.getContext=()=>ctx;return canvas;};
const result=[];
for(const asset of catalog.native.filter(a=>a.type!=='counter')){
 const model=createLifeScene({cols:8,rows:8,wallHeight:3,layout:[{id:asset.id,type:asset.type,fp:asset.fp,col:0,row:0,wallY:0,ph:asset.type==='led'?.22:asset.type==='aroma'?.75:1.1,sx:1,sy:1}],actors:[]},{inventory:true,canvasFactory});
 const root=model.world.children.find(o=>o.name.startsWith('furniture:'));root.position.set(0,0,0);root.updateMatrixWorld(true);
 const geometries={},materials={},parts=[];
 function save(o,matrix){
  const g=o.geometry,m=o.material;if(!geometries[g.uuid])geometries[g.uuid]={positions:Array.from(g.attributes.position.array),indices:g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i)};
  if(!materials[m.uuid]){let color=m.color.clone();const img=m.map?.image;if(img?.base)color.multiply(new T.Color(img.base));materials[m.uuid]={color:color.toArray(),roughness:m.roughness??.8,metalness:m.metalness??0,opacity:m.opacity,text:img?.text||[],emissive:m.emissive?.toArray()};}
  let door=null;for(let p=o.parent;p&&p!==root;p=p.parent)if(p.name.startsWith('door:'))door=p;
  parts.push({geometry:g.uuid,material:m.uuid,matrix:matrix.toArray(),media:!!o.userData.liveMedia,door:!!door});
 }
 root.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){const a=new T.Matrix4();o.getMatrixAt(i,a);save(o,o.matrixWorld.clone().multiply(a));}}else save(o,o.matrixWorld);});
 result.push({...asset,geometries,materials,parts});model.dispose();
}
fs.writeFileSync('/tmp/xpaceos-native.json',JSON.stringify(result));console.log('17 native models exported');
