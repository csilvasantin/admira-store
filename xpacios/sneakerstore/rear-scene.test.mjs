import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '../../admira-xp/scripts/premium-three.mjs';
import {createStoreScene} from './scene.mjs';

test('rear video faces the entrance without mirroring, stretching or covering the door',()=>{
  const previousDocument=globalThis.document,previousImage=globalThis.Image;
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
  globalThis.Image=class {};
  let store;
  try{
    const video=Object.assign(new EventTarget(),{videoWidth:1280,videoHeight:720});
    const portraitVideo=Object.assign(new EventTarget(),{videoWidth:1080,videoHeight:1920});
    store=createStoreScene({t:es=>es,video,portraitVideo});
    store.root.updateMatrixWorld(true);
    const planes=store.objects.get('back-wall').children.filter(m=>m.userData.screenTarget);
    assert.equal(planes.length,3);
    const vertices=planes.flatMap(mesh=>{
      const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
      return Array.from({length:p.count},(_,i)=>({p:new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),u:uv.getX(i),v:uv.getY(i)}));
    });
    // Looking entrance -> rear, the viewer's left is world x=4.
    for(const {p,u,v} of vertices){
      assert.ok(Math.abs(u-(1-p.x/4))<1e-6,'source left must stay on viewer left');
      assert.ok(Math.abs(v-(p.y-.475)/2.25)<1e-6,'one 16:9 canvas keeps its height');
    }
    for(const mesh of planes){
      const p=mesh.geometry.attributes.position;
      const points=Array.from({length:p.count},(_,i)=>new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));
      const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
      const minY=Math.min(...points.map(p=>p.y));
      assert.ok(maxX<=1.5||minX>=2.5||minY>=2.15,'video must clear the physical door');
    }
    const counter=store.objects.get('counter');
    assert.equal(counter.position.x,.05);
    const top=counter.children.find(m=>m.geometry?.parameters.width===2);
    assert.ok(Math.abs(counter.position.x+top.position.x-1)<1e-8,'countertop touches the right wall at x=0');
    video.videoWidth=720;video.videoHeight=1280;video.dispatchEvent(new Event('loadedmetadata'));
    assert.ok(planes.every(m=>!m.visible),'portrait media cannot play on rear LED');
  }finally{
    store?.disposeMedia();store?.resources.forEach(r=>r.dispose());
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousImage===undefined)delete globalThis.Image;else globalThis.Image=previousImage;
  }
});
