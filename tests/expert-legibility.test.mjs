import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const css=readFileSync(new URL('../assets/expert-legibility.css',import.meta.url),'utf8');
const {contrast}=createRequire(import.meta.url)('../assets/marca-blanca.js');
test('Expert pilot stays scoped to Expert and carries its own opaque readable colour pairs',()=>{
 const rules=css.match(/[^{}]+\{[^{}]*\}/g).filter(rule=>!rule.startsWith('@layer'));
 assert.ok(rules.length>=8);
 for(const rule of rules){assert.match(rule.trim(),/^:is\(#telegramDock,\.xs-expert\)/);assert.doesNotMatch(rule,/var\(--mb/);}
 for(const foreground of ['#f4f8fa','#ccd9df'])for(const background of ['#101b24','#1d2d39','#24483f'])assert.ok(contrast(foreground,background)>=4.5);
 assert.match(css,/@layer expertLegibility/);assert.match(css,/background:#101b24!important/);
});
