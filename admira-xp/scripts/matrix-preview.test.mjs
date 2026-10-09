import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMapping,previewURL,quadTransform,MATRIX_CAPTURE} from './matrix-mapping.mjs';
import {STARBUCKS_WALL_MAPPING} from './starbucks-screens.mjs';
import {STARBUCKS_TPV_MAPPING} from './starbucks-tpv.mjs';
import {STARBUCKS_IPAD_MAPPING} from './starbucks-ipad.mjs';
const player={id:'screen-1',name:'Bar',playerId:'',url:'',type:'frame',corners:[{yaw:0,pitch:10},{yaw:20,pitch:10},{yaw:20,pitch:0},{yaw:0,pitch:0}]};
const map=()=>({version:1,capture:MATRIX_CAPTURE.id,players:[structuredClone(player)]});
test('mapping round-trip keeps screen anchors and unlinked players without claiming a connection',()=>{
 const input=map();assert.deepEqual(validateMapping(JSON.parse(JSON.stringify(input))),input);
 assert.equal(validateMapping(input).players[0].playerId,'');assert.notEqual(validateMapping(input).players[0],input.players[0]);
});
test('mapping rejects wrong capture, invalid anchors, duplicate IDs and unsafe media URLs',()=>{
 for(const mutate of [m=>m.capture='other',m=>m.players[0].corners.pop(),m=>m.players[0].corners[0].pitch=100,m=>m.players.push(m.players[0]),m=>m.players[0].url='javascript:alert(1)',m=>m.players[0].type='script']){const m=map();mutate(m);assert.throws(()=>validateMapping(m));}
 for(const url of ['http://example.com','data:text/html,test','https://user:secret@example.com'])assert.equal(previewURL(url),null);
 assert.equal(previewURL('https://example.com/player?id=1'),'https://example.com/player?id=1');
});
test('screen homography places every player corner exactly on its captured quadrilateral',()=>{
 const points=[{x:45,y:38},{x:330,y:76},{x:290,y:270},{x:55,y:245}],m=quadTransform(points);
 for(const [i,[x,y]]of [[0,[0,0]],[1,[640,0]],[2,[640,360]],[3,[0,360]]]){const w=m[3]*x+m[7]*y+m[15];assert.ok(Math.abs((m[0]*x+m[4]*y+m[12])/w-points[i].x)<1e-8);assert.ok(Math.abs((m[1]*x+m[5]*y+m[13])/w-points[i].y)<1e-8);}
 assert.equal(quadTransform(Array(4).fill({x:1,y:1})),null);
});
test('historical wall, POS and iPad anchors stay valid, including the panorama seam',()=>{
 for(const mapping of [STARBUCKS_WALL_MAPPING,STARBUCKS_TPV_MAPPING,STARBUCKS_IPAD_MAPPING])assert.deepEqual(validateMapping(mapping),mapping);
 const seam=map();seam.players[0].corners=[{yaw:179,pitch:10},{yaw:-179,pitch:10},{yaw:-179,pitch:0},{yaw:179,pitch:0}];
 assert.deepEqual(validateMapping(seam),seam);
});
test('save and import reject collapsed, crossed or concave apertures',()=>{
 for(const corners of [Array(4).fill({yaw:0,pitch:10}),[player.corners[0],player.corners[2],player.corners[1],player.corners[3]],[{yaw:0,pitch:10},{yaw:20,pitch:10},{yaw:5,pitch:8},{yaw:0,pitch:0}]]){
  const m=map();m.players[0].corners=corners;assert.throws(()=>validateMapping(m),/aperture/);
 }
});
test('invalid source dimensions and nonfinite corners never become CSS transforms',()=>{
 const points=[{x:45,y:38},{x:330,y:76},{x:290,y:270},{x:55,y:245}];
 for(const [w,h]of [[0,360],[-1,360],[640,0],[640,Infinity],[NaN,360]])assert.equal(quadTransform(points,w,h),null);
 for(const p of [null,[],[null,...points.slice(1)],points.map(p=>({...p,x:Infinity}))])assert.equal(quadTransform(p),null);
});
