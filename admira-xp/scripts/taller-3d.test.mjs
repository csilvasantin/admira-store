import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Taller 3D: recetas válidas, texturas presentes, piezas con su receta y botellero compatible con Matrix · TPV.
// 3D workshop: valid recipes, textures present, pieces carry their recipe, water rack fits Matrix · POS.
const root=new URL('../../',import.meta.url),json=path=>JSON.parse(fs.readFileSync(new URL(path,root)));
const RECETAS=['cestas-pg103','botellero-pg103'].map(name=>({name,path:`admira-xp/tools/taller-3d/recetas/${name}.json`,receta:json(`admira-xp/tools/taller-3d/recetas/${name}.json`)}));
const glb=path=>{const b=fs.readFileSync(new URL(path,root));return JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));};
const texturesOf=pieza=>{
 const c=pieza.contenido||{},m=c.materiales||{},list=[...(pieza.carteles||[]).map(x=>x.textura),...(c.disenos||[]),...Object.values(c.caras||{})];
 for(const v of Object.values(m))list.push(Array.isArray(v)?v[1]:v);
 return list.filter(Boolean);
};

test('recipes follow the workshop schema and point at registered catalogue identities',()=>{
 const registry=json('inventario/registry.json');
 for(const {name,receta} of RECETAS){
  assert.equal(receta.schema,'xpaceos.taller-3d.receta/1',name);assert.ok(receta.encargo&&receta.local&&receta.fotos&&receta.piezas.length,name);
  assert.equal(typeof receta.fotos.publicables,'boolean');
  for(const pieza of receta.piezas){
   assert.equal(registry.numbers[pieza.id],pieza.numero,pieza.id);assert.ok(pieza.nombre&&pieza.nombre_en);
   assert.ok(['esquina','centro'].includes(pieza.origen));assert.equal(pieza.mueble.familia,'cesta_trenzada');
   assert.ok(pieza.mueble.borde[0]>pieza.mueble.fondo[0]&&pieza.mueble.borde[1]>=pieza.mueble.fondo[1]);
   assert.ok(['vasos','bolsas_almohada','bolsas_de_pie','botellas'].includes(pieza.contenido.familia));
  }
 }
});

test('every texture a piece uses exists, and crops are object-only outputs of the recipe',()=>{
 for(const {name,receta} of RECETAS){
  const dir=receta.texturas_dir.replace(/\/?$/,'/');
  for(const pieza of receta.piezas)for(const file of texturesOf(pieza))assert.ok(fs.existsSync(new URL(dir+file,root)),name+' '+file);
  const fuentes=new URL(`admira-xp/tools/taller-3d/fuentes/${receta.fuentes}/`,root),crops=receta.texturas.filter(op=>op.op==='recorte').map(op=>op.salida).sort();
  if(fs.existsSync(fuentes))assert.deepEqual(fs.readdirSync(fuentes).sort(),crops,name+': solo recortes de la receta / only recipe crops');
  for(const op of receta.texturas.filter(op=>op.fuente))assert.ok(crops.includes(op.fuente),name+' '+op.fuente);
 }
});

test('catalogue manifests name the recipe that rebuilds them',()=>{
 for(const {path,receta} of RECETAS)for(const pieza of receta.piezas)for(const tier of ['good','better','best',...(pieza.hiperreal?['hiperreal']:[])]){
  const manifest=json(`inventario/assets/catalog/${pieza.numero}/${tier}.manifest.json`);
  assert.equal(manifest.workshop_recipe,path);assert.equal(manifest.id,pieza.id);assert.equal(manifest.measured,false);
 }
});

test('the rebuilt water rack keeps what Matrix · POS needs: 19 named bottles and a basket top within its frame',()=>{
 const doc=glb('inventario/assets/catalog/50/good.glb');
 const bottles=doc.nodes.filter(node=>node.extras?.bottle_instance&&node.children?.length);
 assert.equal(bottles.length,19);assert.ok(bottles.length>=13);
 for(const node of bottles)assert.ok(Math.abs(node.translation[1]-.593)<.002,'bottle base height');
 const wall=doc.nodes.find(node=>node.name==='Basket woven cord wall'),max=doc.accessors[doc.meshes[wall.mesh].primitives[0].attributes.POSITION].max;
 assert.ok(max[1]>=.58&&max[1]<.8,'visible band of the Matrix pile');assert.ok(Math.max(max[0],max[2])<=.245,'inside the orthographic frame');
 assert.ok(doc.nodes.some(node=>node.name==='AIGUA MINERAL sign board'));
});
