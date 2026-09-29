import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifeExterior} from './life-exterior.mjs';
import {MATRIX_ROOM_SILHOUETTE,readMatrixWeather} from './matrix-exterior.mjs';

const noCanvas=()=>null;

test('16 y 32 bits: el exterior trae césped, calle, ciudad y lluvia, y Best tiene más detalle', () => {
  const better=createLifeExterior({cols:14,rows:8,quality:'better',canvasFactory:noCanvas});
  const best=createLifeExterior({cols:14,rows:8,quality:'best',canvasFactory:noCanvas});
  const names=root=>root.children.map(o=>o.name);
  for(const ex of [better,best]){
    assert.ok(names(ex.root).includes('life:exterior:grass'));
    assert.ok(names(ex.root).includes('life:exterior:rain'));
    assert.ok(names(ex.root).filter(n=>n==='life:exterior:building').length>=10);
  }
  assert.ok(best.root.children.length>better.root.children.length);
  better.dispose();best.dispose();
});

test('la lluvia sigue al clima del juego y nunca cae dentro de la tienda', () => {
  const cols=14,rows=8,ex=createLifeExterior({cols,rows,quality:'best',canvasFactory:noCanvas});
  const rain=ex.root.getObjectByName('life:exterior:rain');
  assert.equal(rain.visible,false);
  ex.setWeather('rain');assert.equal(rain.visible,true);assert.equal(ex.weather,'rain');
  for(let t=0;t<3000;t+=50)ex.animate(t);
  const p=rain.geometry.attributes.position.array;
  for(let i=0;i<p.length;i+=3){
    const inside=p[i]>-.3&&p[i]<cols+.3&&p[i+2]>-.3&&p[i+2]<rows+.3;
    assert.equal(inside,false,`gota dentro de la tienda en ${p[i]},${p[i+2]}`);
  }
  ex.setWeather('clear');assert.equal(rain.visible,false);
  ex.dispose();assert.equal(ex.root.children.length,0);
});

test('64 bits: Matrix lee el clima del juego y recorta la lluvia fuera de la sala', () => {
  assert.equal(readMatrixWeather({game:{weather:{type:'rain'}}}),'rain');
  assert.equal(readMatrixWeather({game:{weather:{type:'sun'}}}),'clear');
  assert.equal(readMatrixWeather(null),'clear');
  assert.ok(MATRIX_ROOM_SILHOUETTE.length>=6&&Object.isFrozen(MATRIX_ROOM_SILHOUETTE));
});
