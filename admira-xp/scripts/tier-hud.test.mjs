import test from 'node:test';
import assert from 'node:assert/strict';
import {TIER_HUD,tierPlate,mountTierHud} from './tier-hud.mjs';

class El{constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.innerHTML='';this.textContent='';this.removed=false;}
  setAttribute(k,v){this.attrs[k]=v;}append(c){this.children.push(c);c.parent=this;}remove(){this.removed=true;}
  querySelector(sel){this.q??=new Map();if(!this.q.has(sel))this.q.set(sel,new El(sel));return this.q.get(sel);}}
globalThis.document={createElement:tag=>new El(tag)};

test('16 · 32 · 64 bits: Better, Best y Matrix comparten placa; Good no tiene HUD', () => {
  assert.equal(tierPlate('better'),'02 · BETTER · 16 BITS');
  assert.equal(tierPlate('best'),'03 · BEST · 32 BITS');
  assert.equal(tierPlate('matrix'),'04 · MATRIX · 64 BITS');
  assert.equal(tierPlate('good'),'');assert.equal(TIER_HUD.good,undefined);
  const dialog=new El('dialog');const hud=mountTierHud(dialog,{mode:'good'});
  assert.equal(dialog.dataset.tierHud,undefined);hud.dispose();
});

test('el HUD se monta en el escenario, publica estado y se libera al cerrar', () => {
  const dialog=new El('dialog'),stage=new El('stage');
  const hud=mountTierHud(dialog,{mode:'matrix',stage});
  assert.equal(dialog.dataset.tierHud,'matrix');
  const layer=stage.children[0];assert.equal(layer.className,'tier-hud');assert.equal(layer.attrs['aria-hidden'],'true');
  assert.match(layer.innerHTML,/MATRIX/);assert.match(layer.innerHTML,/64<small>BITS/);
  hud.setStatus('Gemelo conectado · 3 clientes');
  assert.equal(layer.querySelector('.tier-hud-status').textContent,'GEMELO CONECTADO · 3 CLIENTES');
  hud.dispose();assert.equal(layer.removed,true);assert.equal(dialog.dataset.tierHud,undefined);
});
