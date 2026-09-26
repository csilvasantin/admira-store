import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorDepth} from './best-live-people.mjs';
import {placementOccluder} from './matrix-furniture.mjs';

// A 2×1 DJ booth at col 7–9, row 6–7, painted with the old "front corner" depth.
const booth={id:'dj',box:{minCol:7,maxCol:9,minRow:6,maxRow:7},z:700,rect:{x0:.4,x1:.6,y0:.45,y1:.72}};
const at=(col,row,y)=>visitorDepth({col,row},{x:.5,y},1,[booth]);

test('beside the booth on its right, near its back row, the visitor is painted in front (was drawn behind)', () => {
  // col 10 ≥ maxCol 9 → in front along col even though the feet are higher on screen than the booth's front corner
  assert.ok(at(10.03,5.87,.60)>booth.z);
});
test('behind the booth the visitor is painted behind it, even when the feet are lower on screen', () => {
  assert.ok(at(8,5.4,.71)<booth.z);
});
test('in front along row the visitor covers the booth', () => {
  assert.ok(at(8,7.5,.66)>booth.z);
});
test('on a diagonal corner the larger separation decides', () => {
  assert.ok(at(9.6,5.9,.6)>booth.z);   // .6 past maxCol vs .1 before minRow → front
  assert.ok(at(9.1,5.2,.6)<booth.z);   // .1 past maxCol vs .8 before minRow → behind
});
test('pieces that do not overlap on screen, or a visitor inside a box, keep feet-y order', () => {
  const far={...booth,rect:{x0:.9,x1:.95,y0:.1,y1:.2}};
  assert.equal(visitorDepth({col:8,row:5},{x:.5,y:.5},1,[far]),510);
  assert.equal(visitorDepth({col:8,row:6.5},{x:.5,y:.5},1,[booth]),510);
});
test('between two pieces the visitor stays strictly between their depths', () => {
  const back={id:'b',box:{minCol:2,maxCol:3,minRow:0,maxRow:2},z:300,rect:{x0:.4,x1:.6,y0:.3,y1:.6}};
  const z=visitorDepth({col:8,row:5.5},{x:.5,y:.5},1,[back,booth]);
  assert.ok(z>300&&z<700,String(z));
});
test('placementOccluder uses the scaled drawn rectangle and the floor-box paint depth', () => {
  const o=placementOccluder({id:'x',footprint:{minCol:1,maxCol:2,minRow:6,maxRow:8},left:.1,top:.4,width:.2,height:.3,origin:[.5,1],sx:2,sy:1,depthY:.5,anchor:{y:.45}});
  assert.equal(o.z,510);assert.deepEqual(o.box,{minCol:1,maxCol:2,minRow:6,maxRow:8});
  assert.ok(Math.abs(o.rect.x0-0)<1e-9&&Math.abs(o.rect.x1-.4)<1e-9&&Math.abs(o.rect.y0-.4)<1e-9&&Math.abs(o.rect.y1-.7)<1e-9);
});
