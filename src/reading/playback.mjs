import {isOriginalPerformer} from './song-policy.mjs';
export class SongPlayback {
 constructor(audio,onChange=()=>{},{loadTimeoutMs=15000,setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}){
  Object.assign(this,{audio,onChange,loadTimeoutMs,setTimer,clearTimer,ticket:0,song:null,status:'idle',disposed:false,candidates:[],candidateIndex:-1,watchdog:null});
  this.listeners={
   playing:()=>{if(this.song){this.clearWatch();this.status='playing';this.notify();}},
   pause:()=>{if(this.song&&this.status!=='loading'){this.clearWatch();this.status='paused';this.notify();}},
   waiting:()=>{if(this.song&&!this.audio.paused){this.status='loading';this.armWatch();this.notify();}},
   timeupdate:()=>this.notify(),durationchange:()=>this.notify(),
   error:()=>{if(this.song)this.advance();}
  };
  Object.entries(this.listeners).forEach(([event,fn])=>audio.addEventListener(event,fn));
 }
 notify(){if(this.disposed)return;this.onChange({status:this.status,time:this.audio.currentTime||0,duration:Number.isFinite(this.audio.duration)?this.audio.duration:0,error:this.message||'',song:this.song});}
 clearWatch(){if(this.watchdog!==null){this.clearTimer(this.watchdog);this.watchdog=null;}}
 armWatch(){this.clearWatch();const ticket=this.ticket;this.watchdog=this.setTimer(()=>{this.watchdog=null;if(!this.disposed&&this.song&&ticket===this.ticket&&this.status==='loading')this.advance();},this.loadTimeoutMs);this.watchdog?.unref?.();}
 start(song,alternatives=[]){
  this.stop();if(this.disposed||!song)return;
  const unique=new Map();for(const candidate of [song,...alternatives]){if(candidate&&isOriginalPerformer(candidate)&&candidate.publicAudioAvailable!==false&&!unique.has(String(candidate.songId)))unique.set(String(candidate.songId),candidate);}
  this.candidates=[...unique.values()].slice(0,3);
  if(!this.candidates.length){this.song=song;this.status='unavailable';this.message='配乐暂时无法载入，请稍后重试。';this.notify();return;}
  this.candidateIndex=0;this.playCandidate();
 }
 playCandidate(){
  this.clearWatch();const ticket=++this.ticket;this.song=null;this.audio.pause();this.song=this.candidates[this.candidateIndex];this.message='';this.status='loading';
  this.audio.src='/api/reading-audio/'+this.song.songId;this.audio.loop=true;this.audio.load();this.notify();this.armWatch();
  // First candidate is invoked synchronously inside the book-click gesture.
  this.begin(ticket);
 }
 advance(){
  this.clearWatch();if(this.disposed||!this.song)return;
  if(this.candidateIndex+1<this.candidates.length){this.candidateIndex++;this.playCandidate();}
  else {this.ticket++;this.status='error';this.message='配乐暂时无法载入，请点击重试。';this.notify();}
 }
 begin(ticket=this.ticket){
  let result;try{result=this.audio.play();}catch(e){this.fail(e,ticket);return;}
  Promise.resolve(result).catch(e=>this.fail(e,ticket));
 }
 fail(error,ticket){
  if(this.disposed||ticket!==this.ticket||!this.song)return;
  if(error?.name==='NotAllowedError'){this.clearWatch();this.status='error';this.message='浏览器暂停了自动播放，请点击播放重试。';this.notify();return;}
  this.advance();
 }
 toggle(){
  if(!this.song||this.status==='unavailable')return;
  if(this.audio.paused){this.message='';this.status='loading';this.notify();this.armWatch();this.begin();}
  else {this.ticket++;this.clearWatch();this.status='paused';this.audio.pause();this.notify();}
 }
 seek(value){if(Number.isFinite(this.audio.duration))this.audio.currentTime=Math.max(0,Math.min(value,this.audio.duration));this.notify();}
 volume(value){this.audio.volume=Math.max(0,Math.min(1,value));}
 stop(){this.ticket++;this.clearWatch();this.song=null;this.candidates=[];this.candidateIndex=-1;this.status='idle';this.message='';this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.notify();}
 destroy(){this.stop();this.disposed=true;Object.entries(this.listeners).forEach(([event,fn])=>this.audio.removeEventListener(event,fn));}
}
