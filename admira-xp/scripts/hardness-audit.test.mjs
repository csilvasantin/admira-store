import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Measured 24-sep-2026 in Matrix (tools/walk-sprites/measure-hardness.js): the lowest 14 % of each
// piece's drawn silhouette, projected back onto the floor, against its logical
// box. Positive = the drawing reaches beyond the box. Navigation keeps visitors'
// feet 0.24 cells away from every box, so any overhang must stay below that.
const audit=JSON.parse(readFileSync(new URL('../assets/matrix-hardness-audit.json',import.meta.url),'utf8'));
const RADIUS=.24;
test('every measured furniture base stays inside its hardness box plus the walking clearance', () => {
  assert.ok(audit.pieces.length>=12);
  for(const p of audit.pieces){
    if(!p.overhang)continue;
    for(const [side,value] of Object.entries(p.overhang))if(Number.isFinite(value))assert.ok(value<RADIUS,`${p.label} ${side} ${value}`);
  }
});
