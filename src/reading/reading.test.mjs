import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {wrapDistance,stepSpring,albumPose} from './motion.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const data=read('../../public/reading-records/collection.json');
const themes=read('./themes.json');
const songs=read('../../public/reading-records/songs.json').songs;
test('Example library has complete reflections, local covers and themes',()=>{
 assert.equal(data.books.length,3);assert.equal(data.entryCount,3);
 for(const b of data.books){assert.match(b.title,/Example/);assert.equal(b.format,'essay');assert.equal(b.entries.length,1);assert.equal(b.entries[0].kind,'reflection');assert.match(b.entries[0].text,/Example/);assert.ok(themes[b.id].ratio);assert.ok(existsSync(new URL('../../public'+b.cover,import.meta.url)));assert.equal(b.readerLink,undefined);}
});
test('Example audio contains no playable external resources',()=>{
 assert.equal(songs.length,data.books.length);for(const b of data.books){const s=songs.filter(s=>s.bookId===b.id);assert.equal(s.length,1);assert.equal(s[0].publicAudioAvailable,false);assert.equal(s[0].playbackSourceUrl,undefined);assert.deepEqual(s[0].fallbackSongIds,[]);}
});
test('Spring motion remains bounded, continuous and wraps',()=>{
 assert.equal(wrapDistance(2,0,3),-1);assert.equal(wrapDistance(0,2,3),1);
 let p=0,v=0;for(let i=0;i<300;i++){const n=stepSpring(p,v,1);assert.ok(n.position>=p&&n.position<=1);assert.ok(n.position-p<.3);p=n.position;v=n.velocity;}assert.equal(p,1);assert.equal(v,0);assert.ok(albumPose(1).z<albumPose(0).z);assert.ok(Math.abs(albumPose(.5).yaw)>70);
});
