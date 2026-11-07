import {readdir,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {parseDocument} from '../src/content-parser.js';
const dates=new Set(),issues=new Set();
for(const filename of await readdir('content/brief')){
 if(!filename.endsWith('.md'))continue;
 const path=`content/brief/${filename}`, doc=parseDocument(await readFile(path,'utf8'),path);
 assert.equal(filename,`${doc.date}.md`);assert(!dates.has(doc.date),'Duplicate brief date');dates.add(doc.date);
 assert(doc.title&&Number.isInteger(doc.issue));assert(!issues.has(doc.issue),'Duplicate issue number: '+path);issues.add(doc.issue);assert(/^\d{4}-\d{2}-\d{2}$/.test(doc.date)&&Number.isFinite(Date.parse(doc.date)),'Invalid date: '+path);
 assert(doc.items.length>=1);assert(doc.format==='example' && doc.title.includes('Example'),'Brief must be labeled example content');

 for(const item of doc.items){assert(item.title&&item.topic);}assert(doc.body);
}
for(const topic of await readdir('content/courses')){
 const root=`content/courses/${topic}`, index=parseDocument(await readFile(`${root}/index.md`,'utf8'),root);
 assert(index.name&&index.description&&Number.isInteger(index.order));
 const orders=new Set();
 for(const filename of await readdir(root)){
  if(filename==='index.md'||!filename.endsWith('.md'))continue;
  const doc=parseDocument(await readFile(`${root}/${filename}`,'utf8'),filename);
  assert(doc.title&&doc.description&&doc.date&&doc.body&&Number.isInteger(doc.order));assert(!orders.has(doc.order));orders.add(doc.order);
 }
}
console.log('Example brief dates, topic metadata and article ordering passed.');
