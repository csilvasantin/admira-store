// IoT Gallery (Carlos, 22-oct-2026): la puerta del fondo de Entrada abre la cámara exterior como el segmentador.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PerspectiveCamera,Raycaster,Vector2} from '../../admira-xp/scripts/premium-three.mjs';
import {HOTSPOTS,hotspotAt} from './hotspots.mjs';

const read=f=>readFileSync(new URL(f,import.meta.url),'utf8');
// Vista inicial de Entrada como la monta panorama.mjs (yaw 0, pitch 0, fov 85) en un lienzo de 1280×754.
function directionAt(x,y,{w=1280,h=754,yaw=0}={}){
  const camera=new PerspectiveCamera(85,w/h,.1,20);camera.lookAt(Math.cos(yaw),0,Math.sin(yaw));camera.updateMatrixWorld();
  const ray=new Raycaster();ray.setFromCamera(new Vector2(x/w*2-1,-y/h*2+1),camera);return ray.ray.direction;
}

test('en Entrada, el rótulo y la puerta de IoT Gallery son pulsables; paredes, techo y suelo no',()=>{
  assert.equal(hotspotAt('entrada',directionAt(665,439)),'iot-gallery','el logo IoT Gallery');
  assert.equal(hotspotAt('entrada',directionAt(662,220)),'iot-gallery','el rótulo WWW.IOT.GALLERY');
  assert.equal(hotspotAt('entrada',directionAt(560,560)),'iot-gallery','el cristal de la puerta');
  for(const [x,y,where] of [[200,354,'pared izquierda'],[1050,260,'zapatillas de la derecha'],[665,94,'aire acondicionado'],[665,720,'suelo de la tienda']])
    assert.equal(hotspotAt('entrada',directionAt(x,y)),null,where);
  // La zona va pegada a la foto, no a la pantalla: mirando a la izquierda, el centro ya no es la puerta y la puerta,
  // que ahora asoma por el borde derecho, sigue siendo pulsable ahí.
  assert.equal(hotspotAt('entrada',directionAt(640,377,{yaw:-1.2})),null);
  assert.equal(hotspotAt('entrada',directionAt(1225,377,{yaw:-1.2})),'iot-gallery');
  assert.equal(hotspotAt('centro',directionAt(665,439)),null);assert.equal(hotspotAt('fondo',directionAt(665,439)),null);
  assert.deepEqual(Object.keys(HOTSPOTS),['entrada']);
});

test('la 360 solo abre un punto con un clic, no al arrastrar para mirar, y el cursor lo anuncia',()=>{
  const panorama=read('./panorama.mjs');
  assert.match(panorama,/import \{hotspotAt\} from '\.\/hotspots\.mjs\?v=iot-gallery-1'/);
  assert.match(panorama,/pointerup\(e\)\{const d=drag;drag=null;if\(d\?\.id===e\.pointerId&&Math\.hypot\(e\.clientX-d\.x,e\.clientY-d\.y\)<6\)\{const id=spotAt\(e\);if\(id\)onHotspot\(id\);\}\}/);
  assert.match(panorama,/if\(!drag\)canvas\.style\.cursor=spotAt\(e\)\?'pointer':''/);
});

test('IoT Gallery abre IEU en la pestaña del segmentador sin recargarla y lleva a Compartir Puerta Cam',()=>{
  const store=read('./store.mjs'),ui=read('./segmentado-ui.mjs');
  assert.match(store,/onHotspot:id=>\{if\(id==='iot-gallery'\)void openOutdoorCamera\(\);\}/);
  // Mismo nombre de pestaña que admira.tv/videoanalytics/xtore/demo-setup.mjs: se reutiliza la abierta.
  assert.match(store,/DIGITAL_TWIN_URL='https:\/\/digitaltwin\.ieu\.ai\/',DIGITAL_TWIN_TAB='xtore-demo-digitaltwin'/);
  assert.match(store,/twin=window\.open\('',DIGITAL_TWIN_TAB\)/);
  assert.match(store,/if\(twin&&twin\.location\.href==='about:blank'\)twin\.location\.href=DIGITAL_TWIN_URL/,'solo navega una pestaña nueva y vacía');
  assert.match(store,/if\(segmented\?\.state\.source!=='share'\)\{/,'si Puerta Cam ya se comparte, no se toca IEU');
  assert.match(store,/return openSegmented\('puerta'\);/);assert.match(store,/SEGMENTED_MODES=\{puerta:'puerta',/);
  assert.match(ui,/else if\(mode==='puerta'&&state\.source!=='share'\)\{camStatus\(t\('Cámara exterior: en la pestaña de IEU abre Store → Entrada → Puerta Cam → Ver stream y pulsa «Compartir Puerta Cam»\.'/);
  assert.match(ui,/\$\('seg-share'\)\.focus\(\);\}/);
});
