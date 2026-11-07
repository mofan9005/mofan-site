import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('./Turntable.jsx',import.meta.url),'utf8');
const css=await readFile(new URL('../style.css',import.meta.url),'utf8');
const rule=selector=>[...css.matchAll(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}', 'g'))].map(match=>match[1]).join(';');

test('home passes the newest article to a natively focusable, visibly named link',async()=>{
 const app=await readFile(new URL('../App.jsx',import.meta.url),'utf8');
 const content=await readFile(new URL('../content.js',import.meta.url),'utf8');
 const locale=await readFile(new URL('../i18n/zh.js',import.meta.url),'utf8');
 assert.match(app,/<Turntable newest=\{articles.length\?articleUrl\(articles\[0\]\):'#courses'\}/);
 assert.match(content,/sort\(\(a,b\)=>b.date.localeCompare\(a.date\)\|\|b.order-a.order\)/);
 assert.match(source,/<a href=\{newest\} className="tonearm-hotspot" aria-label=\{zh.tonearm\}>/);
 assert.match(locale,/tonearm:'阅读最新课程文章'/);
 assert.match(source,/<span className="tonearm-label">\{zh.tonearm\}/);
 assert.doesNotMatch(source,/tabIndex|tabindex|onClick/);
 assert.match(source,/<a href="#about" className="example-hotspot" aria-label="Example"\//);
});

test('painted arm and hit geometry are one element, above the decorative disc',()=>{
 assert.match(source,/<svg className="arm-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">/);
 assert.match(source,/<polygon className="tonearm-shape" points="74,11 80,11 82,27 75,44 73,55 67,66 63,77 57,74 60,67 66,60 70,52 71,35"/);
 assert.doesNotMatch(source,/clipPath|<image/);
 assert.doesNotMatch(rule('.tonearm-hotspot'),/clip-path/);
 assert.match(rule('.tonearm-hotspot'),/pointer-events:none/);
 assert.match(rule('.tonearm-shape'),/pointer-events:all/);
 assert.match(rule('.tonearm-label'),/pointer-events:auto/);
 assert.match(rule('.arm-overlay'),/pointer-events:none/);
 assert.match(rule('.tonearm-pivot'),/pointer-events:none/);
 assert.match(rule('.record-label'),/pointer-events:none/);
 assert.ok(Number(rule('.disc-frame').match(/z-index:(\d+)/)[1])<Number(rule('.tonearm-hotspot').match(/z-index:(\d+)/)[1]));
 assert.match(rule('.tonearm-hotspot:focus-visible .tonearm-label'),/outline:3px solid/);
});
