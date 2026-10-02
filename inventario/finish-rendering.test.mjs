import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {pixelLayout,pixelFinish,preciseTextureSampling,drawPixels} from './finish-rendering.mjs';
import {stageCamera} from './stage-camera.mjs';

test('comparison broadcasts the same bounded camera to every finish and detaches disposed views',()=>{
 const camera=stageCamera(),views=[[],[],[]],remove=views.map(view=>camera.subscribe(state=>view.push(state)));
 camera.update({angle:1.5,elevation:.8,zoom:2.4,wire:true});assert.deepEqual(views.map(view=>view[0]),Array(3).fill(camera.get()));views[0][0].zoom=99;assert.equal(camera.get().zoom,2.4);
 remove[1]();camera.update({zoom:99,elevation:-1});assert.equal(camera.get().zoom,6);assert.equal(camera.get().elevation,.05);assert.equal(views[1].length,1);assert.equal(views[2].length,2);camera.update({zoom:0});assert.equal(camera.get().zoom,.6);
});
test('pixel output uses integer scaling without stretching blocks at fractional viewport widths',()=>{
 for(const [width,height]of [[374,460],[748,920],[891,560],[220,330]]){const p=pixelLayout(width,height);assert.equal(p.scale,Math.trunc(p.scale));assert.ok(Math.max(p.width,p.height)<=112);assert.ok(p.width*p.scale<=width);assert.ok(p.height*p.scale<=height);assert.ok(width-p.width*p.scale< p.scale);assert.ok(height-p.height*p.scale<p.scale);}
});
test('small Good thumbnails contain the complete model without cropping or smoothing',()=>{
 const source={width:112,height:112},calls=[],context={clearRect(){},drawImage(...args){calls.push(args);}};
 for(const [width,height]of [[90,90],[65,80],[360,280]]){drawPixels(context,source,width,height);const [,x,y,w,h]=calls.at(-1);assert.ok(x>=0&&y>=0);assert.ok(x+w<=width&&y+h<=height);assert.equal(w,h);assert.equal(context.imageSmoothingEnabled,false);}
});
test('pixel materials isolate shared GLTF materials and textures while retaining colour, opacity and surface identity',()=>{
 const map=new T.Texture(),material=new T.MeshStandardMaterial({color:'#275c59',map,opacity:.7,transparent:true});material.name='shelf_labels';const geometry=new T.BoxGeometry(),base=new T.Group();base.add(new T.Mesh(geometry,material));const copy=base.clone(true),dispose=pixelFinish(copy),finish=copy.children[0].material;
 assert.equal(base.children[0].material,material);assert.equal(map.magFilter,T.LinearFilter);assert.ok(finish.isMeshToonMaterial);assert.equal(finish.name,material.name);assert.equal(finish.color.getHex(),material.color.getHex());assert.equal(finish.opacity,.7);assert.notEqual(finish.map,map);assert.equal(finish.map.magFilter,T.NearestFilter);assert.equal(finish.map.generateMipmaps,false);assert.equal(finish.gradientMap.image.width,3);assert.equal(finish.toneMapped,false);assert.equal(copy.children[0].geometry,geometry);dispose();
});
test('Best anisotropy is bounded by GPU support and leaves the cached asset untouched',()=>{
 const map=new T.Texture(),material=new T.MeshStandardMaterial({map}),base=new T.Group();base.add(new T.Mesh(new T.BoxGeometry(),material));const copy=base.clone(true),dispose=preciseTextureSampling(copy,8);assert.equal(copy.children[0].material.map.anisotropy,8);assert.equal(map.anisotropy,1);assert.notEqual(copy.children[0].material,material);assert.notEqual(copy.children[0].material.map,map);dispose();
});
