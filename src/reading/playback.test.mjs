import test from 'node:test';
import assert from 'node:assert/strict';
import {SongPlayback} from './playback.mjs';
const song=id=>({songId:id,artist:'原唱歌手',playbackArtist:'原唱歌手',publicAudioAvailable:true});
class Audio extends EventTarget{
 constructor(){super();this.paused=true;this.currentTime=0;this.duration=NaN;this.src='';this.playCalls=0;this.pending=[];}
 play(){this.playCalls++;this.paused=false;return new Promise((resolve,reject)=>this.pending.push({resolve,reject}));}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
 load(){this.currentTime=0;this.duration=NaN;}
 removeAttribute(name){if(name==='src')this.src='';}
}
test('Opening a book invokes play synchronously, without another UI gate',()=>{
 const a=new Audio(),states=[],p=new SongPlayback(a,s=>states.push(s));p.start(song(168091));assert.equal(a.playCalls,1);assert.equal(a.src,'/api/reading-audio/168091');assert.equal(p.status,'loading');a.dispatchEvent(new Event('playing'));assert.equal(p.status,'playing');p.destroy();
});
test('Switching tracks stops the old source; stale play rejection cannot interrupt the new song',async()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start(song(1));p.start(song(2));a.pending[0].reject(new Error('aborted old song'));await Promise.resolve();assert.equal(a.src,'/api/reading-audio/2');assert.equal(a.playCalls,2);assert.equal(p.status,'loading');a.dispatchEvent(new Event('playing'));assert.equal(p.status,'playing');p.stop();assert.equal(a.src,'');assert.equal(a.paused,true);assert.equal(p.status,'idle');p.destroy();
});
test('Failed playback is visible and never animates as playing',async()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start(song(1));a.pending[0].reject(Object.assign(new Error(),{name:'NotAllowedError'}));await Promise.resolve();assert.equal(p.status,'error');assert.match(p.message,/浏览器/);p.destroy();
});

test('A cover version cannot start even if it has a playable resource',()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start({...song(1),playbackArtist:'其他歌手'});assert.equal(a.playCalls,0);assert.equal(a.src,'');assert.equal(p.status,'unavailable');p.destroy();
});
test('Unavailable original remains silent and does not fall back',()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start({...song(1),publicAudioAvailable:false});p.toggle();assert.equal(a.playCalls,0);assert.equal(p.status,'unavailable');p.destroy();
});

test('Failed source switches to an approved original once; stale rejection cannot skip it',async()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start(song(1),[song(1),song(2),song(3)]);
 a.dispatchEvent(new Event('error'));assert.equal(a.src,'/api/reading-audio/2');assert.equal(a.playCalls,2);
 a.pending[0].reject(new Error('old source'));await Promise.resolve();assert.equal(a.src,'/api/reading-audio/2');
 a.dispatchEvent(new Event('playing'));assert.equal(p.status,'playing');p.destroy();
});
test('Fallback exhaustion is bounded and never permits a cover recording',()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start(song(1),[{...song(2),playbackArtist:'翻唱'},song(3),song(3)]);
 a.dispatchEvent(new Event('error'));assert.equal(a.src,'/api/reading-audio/3');a.dispatchEvent(new Event('error'));assert.equal(p.status,'error');assert.equal(a.playCalls,2);p.destroy();
});
test('Stopping cancels a loading timeout and prevents delayed fallback',()=>{
 let pending,cleared=false;const a=new Audio(),p=new SongPlayback(a,()=>{},{setTimer:fn=>{pending=fn;return 1},clearTimer:()=>{cleared=true}});
 p.start(song(1),[song(2)]);const oldTimeout=pending;p.stop();oldTimeout();assert.equal(cleared,true);assert.equal(a.playCalls,1);assert.equal(a.src,'');p.destroy();
});
test('Stalled loading advances, while blocked autoplay does not burn through alternatives',async()=>{
 let pending;const a=new Audio(),p=new SongPlayback(a,()=>{},{setTimer:fn=>{pending=fn;return 1},clearTimer:()=>{}});
 p.start(song(1),[song(2)]);pending();assert.equal(a.src,'/api/reading-audio/2');
 a.pending[1].reject(Object.assign(new Error(),{name:'NotAllowedError'}));await Promise.resolve();assert.equal(p.status,'error');assert.equal(a.playCalls,2);p.destroy();
});
test('A user pause while loading does not trigger a fallback from the aborted play promise',async()=>{
 const a=new Audio(),p=new SongPlayback(a);p.start(song(1),[song(2)]);p.toggle();a.pending[0].reject(Object.assign(new Error(),{name:'AbortError'}));await Promise.resolve();assert.equal(a.playCalls,1);assert.equal(p.status,'paused');p.destroy();
});
