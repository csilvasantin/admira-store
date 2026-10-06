import test from 'node:test';
import assert from 'node:assert/strict';
import {readableOptionsWidth,optionsWidth,OPTIONS_ICON_WIDTH} from './options-rail.mjs';

test('readable width follows the longest localized label rather than canvas letterboxing',()=>{
  const row=text=>({text,icon:24,gap:7,padding:14,border:2});
  assert.equal(readableOptionsWidth([row(73),row(61)],{padding:6,border:2}),136);
  assert.equal(readableOptionsWidth([row(156),row(96)],{padding:6,border:2}),219);
  assert.equal(readableOptionsWidth([row(156)],{padding:6,border:2,max:180}),180);
});
test('shrinking below readable width retains a reachable icon rail; larger manual choices remain intact',()=>{
  assert.equal(optionsWidth(135,136),OPTIONS_ICON_WIDTH);
  assert.equal(optionsWidth(-100,136),OPTIONS_ICON_WIDTH);
  assert.equal(optionsWidth(136,136),136);
  assert.equal(optionsWidth(283,136),283);
  assert.equal(optionsWidth(900,136,560),560);
});
