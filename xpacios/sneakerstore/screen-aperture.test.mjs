import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../../admira-xp/scripts/premium-three.mjs';
import {createStoreScene} from './scene.mjs';
import {fitScreenAperture} from './screen-format.mjs';
import {mapCampaignSurface} from './next-step/twin.mjs';
import {INSTALLATIONS} from './next-step/render.mjs';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('contain fit rejects unsafe dimensions and bounds very different source ratios',()=>{
  for(const dimensions of [[NaN,1],[Infinity,1],[0,1],[-1,1],[1,undefined]])assert.equal(fitScreenAperture({w:1,h:2},...dimensions),null);
  for(const aperture of [null,{w:0,h:1},{w:Infinity,h:1},{w:1,h:-1}])assert.equal(fitScreenAperture(aperture,1920,1080),null);
  for(const [w,h] of [[1,1],[1920,1080],[1080,1920],[3840,600],[320,1920],[100000,1],[1,100000]]){
    const fit=fitScreenAperture({w:1.2,h:.42},w,h);
    assert.ok(fit.w<=1.2&&fit.h<=.42);
    near(fit.w/fit.h,w/h);
  }
});

test('all seven campaign profiles fit physical apertures and restore exact prior plane state',()=>{
  const previousDocument=globalThis.document,previousImage=globalThis.Image;
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
  globalThis.Image=class {};
  let store;
  const texture=new T.Texture();
  try{
    const video=Object.assign(new EventTarget(),{videoWidth:1280,videoHeight:720});
    const portraitVideo=Object.assign(new EventTarget(),{videoWidth:1080,videoHeight:1920});
    store=createStoreScene({t:es=>es,video,portraitVideo});
    const planes=id=>store.objects.get(id).children.filter(mesh=>mesh.material?.map&&mesh.userData.aperture);
    const destinations=[['screen','landscape'],['entry-display','portrait'],['tablet','tablet'],['narrow-led','column'],['upper-displays','strip'],['left-video-bank','jordan'],['back-wall','rear']];
    const covered=new Set();
    for(const [objectId,profile] of destinations){
      const installation=INSTALLATIONS.find(item=>item.id===profile);
      const meshes=planes(objectId);assert.ok(meshes.length,objectId);
      for(const [n,mesh] of meshes.entries()){
        const geometry=mesh.geometry,positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),state={map:mesh.material.map,visible:mesh.visible,scale:mesh.scale.toArray(),position:mesh.position.toArray()};
        let rect;
        if(profile==='jordan')rect=installation.screens[n];
        if(profile==='rear'){
          const {x,y,w,h}=mesh.userData.rearRect,master=store.objects.get('back-wall').userData.aperture;
          rect={x:(1-(x+w)/master.w)*installation.width,y:(1-(y+h)/master.h)*installation.height,w:w/master.w*installation.width,h:h/master.h*installation.height};
        }
        const restore=mapCampaignSurface(mesh,installation,texture,rect);
        assert.equal(mesh.visible,true,objectId);
        assert.equal(mesh.geometry,geometry);assert.equal(mesh.geometry.getAttribute('position'),positions,'support plane vertices remain unchanged');
        const width=geometry.parameters.width*mesh.scale.x,height=geometry.parameters.height*mesh.scale.y;
        assert.ok(width<=mesh.userData.aperture.w+1e-9&&height<=mesh.userData.aperture.h+1e-9,objectId+' active-area containment');
        near(width/height,(rect?.w||installation.width)/(rect?.h||installation.height));
        if(profile==='rear'){
          near(mesh.position.x,mesh.userData.apertureCenter.x);near(mesh.position.y,mesh.userData.apertureCenter.y);
          const r=mesh.userData.rearRect;assert.ok(r.x+r.w<=1.5||r.x>=2.5||r.y>=2.15,'rear content never crosses the doorway');
        }
        restore();restore();
        assert.equal(mesh.material.map,state.map);assert.equal(mesh.visible,state.visible);
        assert.deepEqual(mesh.scale.toArray(),state.scale);assert.deepEqual(mesh.position.toArray(),state.position);
        assert.equal(mesh.geometry.getAttribute('uv'),uv,'restore retains the exact prior UV attribute');
      }
      covered.add(profile);
    }
    assert.equal(covered.size,7);
    const column=planes('narrow-led')[0],strip=planes('upper-displays')[0];
    assert.deepEqual(column.userData.aperture,{w:.3,h:2.05});assert.deepEqual(strip.userData.aperture,{w:1.2,h:.42});
  }finally{
    texture.dispose();store?.disposeMedia();store?.resources.forEach(resource=>resource.dispose());
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;
  }
});

test('invalid active areas and out-of-master crops hide a mapped plane and restore its state',()=>{
  const texture=new T.Texture(),mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture}));
  const profile=INSTALLATIONS[0],replacement=new T.Texture();
  try{
    for(const [aperture,rect] of [[{w:Infinity,h:1},null],[{w:1,h:1},{x:-1,y:0,w:10,h:10}],[{w:1,h:1},{x:1910,y:0,w:20,h:10}],[{w:1,h:1},{x:0,y:0,w:NaN,h:10}]]){
      mesh.userData.aperture=aperture;mesh.visible=true;
      const restore=mapCampaignSurface(mesh,profile,replacement,rect);
      assert.equal(mesh.visible,false);assert.equal(mesh.material.map,texture);
      restore();assert.equal(mesh.visible,true);
    }
  }finally{mesh.geometry.dispose();mesh.material.dispose();texture.dispose();replacement.dispose();}
});
