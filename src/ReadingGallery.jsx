import ResponsiveImage from './components/ResponsiveImage';
import {useEffect,useRef,useState} from 'react';
import songsData from '../public/reading-records/songs.json';
import {wrapDistance,albumPose,stepSpring} from './reading/motion.mjs';
import {SongPlayback} from './reading/playback.mjs';
import themes from './reading/themes.json';
import './reading-gallery.css';
import PoolWater from './components/PoolWater';
const Icon=({name})=><ResponsiveImage className="record-icon" src={`/reading-records/icons/${name}.svg`} alt="" aria-hidden="true"/>;
const titleOf=s=>s.replace(/（[^）]*）/g,'').replace(/：.*/, '');

const clock=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;

export function ReadingGallery(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[index,setIndex]=useState(0),[opened,setOpened]=useState(false),[playback,setPlayback]=useState({status:'idle',time:0,duration:0,error:''}),[volume,setVolume]=useState(.3),[library,setLibrary]=useState(false),[query,setQuery]=useState(''),[info,setInfo]=useState(false);
 const books=data?.books||[],book=books[index],body=useRef(null),audio=useRef(null),music=useRef(null),closeButton=useRef(null),objects=useRef(new Map()),drag=useRef(null),wheel=useRef({sum:0,last:0}),skipClick=useRef(false);
 const motion=useRef({position:0,velocity:0,target:0,frame:0}),reduce=useRef(false);
 useEffect(()=>{const controller=new AbortController();fetch('/reading-records/collection.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setData).catch(e=>{if(e.name!=='AbortError')setError('唱片暂时没有载入，请刷新再试。');});const prior=document.title;document.title='书房 · Example';const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{reduce.current=media.matches;if(media.matches){cancelAnimationFrame(motion.current.frame);motion.current.position=motion.current.target;motion.current.velocity=0;paint();}};reduce.current=media.matches;media.addEventListener('change',update);return()=>{controller.abort();media.removeEventListener('change',update);document.title=prior;};},[]);
 function paint(){const m=motion.current;objects.current.forEach((node,i)=>{if(!node)return;const d=wrapDistance(i,m.position,books.length),p=albumPose(d);node.style.setProperty('--pose-x',`${p.x}px`);node.style.setProperty('--pose-z',`${p.z}px`);node.style.setProperty('--pose-yaw',`${p.yaw}deg`);node.style.setProperty('--pose-pitch',`${p.pitch}deg`);node.style.setProperty('--depth-order',String(100-Math.round(Math.abs(d)*8)));node.style.visibility=p.visibility?'visible':'hidden';node.style.pointerEvents=Math.abs(d)<4?'auto':'none';});}
 function animate(){const m=motion.current;cancelAnimationFrame(m.frame);let lastTime;const run=time=>{const dt=lastTime?Math.min(2,(time-lastTime)/(1000/60)):1;lastTime=time;const step=reduce.current?{position:m.target,velocity:0}:stepSpring(m.position,m.velocity,m.target,dt);Object.assign(m,step);paint();if(m.velocity||m.position!==m.target)m.frame=requestAnimationFrame(run);};m.frame=requestAnimationFrame(run);}
 useEffect(()=>{if(books.length)paint();return()=>cancelAnimationFrame(motion.current.frame);},[books]);
 useEffect(()=>{if(opened||library)closeButton.current?.focus();},[opened,library]);
 useEffect(()=>{const controller=new SongPlayback(audio.current,setPlayback);controller.volume(.3);music.current=controller;return()=>{controller.destroy();if(music.current===controller)music.current=null;};},[]);
 function startMusic(b){const selected=songsData.songs.find(s=>s.bookId===b.id);music.current?.start(selected,(selected?.fallbackSongIds||[]).map(id=>songsData.songs.find(s=>s.songId===id)).filter(Boolean));}
 function close(){music.current?.stop();setOpened(false);setLibrary(false);setInfo(false);requestAnimationFrame(()=>objects.current.get(index)?.querySelector('button')?.focus());}
 function choose(i){const next=(i+books.length)%books.length,d=wrapDistance(next,motion.current.target,books.length);music.current?.stop();motion.current.target+=d;animate();setIndex(next);setInfo(false);setError('');body.current?.scrollTo({top:0});return books[next];}
 function open(i=index){if(skipClick.current||opened)return;const selected=i!==index?choose(i):books[i];setLibrary(false);setOpened(true);startMusic(selected);}
 function move(step){const selected=choose(index+step);if(opened)startMusic(selected);}
 function onPointerDown(e){if(opened||e.button!==0)return;drag.current={x:e.clientX,position:motion.current.position,start:e.clientX};skipClick.current=false;}
 function onPointerMove(e){if(!drag.current||opened)return;const dx=e.clientX-drag.current.x;if(Math.abs(dx)>6){skipClick.current=true;cancelAnimationFrame(motion.current.frame);motion.current.position=drag.current.position-dx/210;motion.current.velocity=0;paint();}}
 function onPointerUp(e){if(!drag.current)return;const delta=e.clientX-drag.current.start;drag.current=null;const destination=Math.round(motion.current.position);if(Math.abs(delta)>6){const next=(destination%books.length+books.length)%books.length;music.current?.stop();motion.current.target=destination;setIndex(next);animate();setTimeout(()=>{skipClick.current=false;},120);}}
 function onWheel(e){if(opened||library)return;const now=performance.now();if(now-wheel.current.last>180)wheel.current.sum=0;wheel.current.sum+=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(wheel.current.sum)>65&&now-wheel.current.last>250){move(wheel.current.sum>0?1:-1);wheel.current={sum:0,last:now};}}
 function keydown(e){if(document.querySelector('.menu-toggle[aria-expanded="true"]'))return;if(!books.length||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(e.key==='Escape'){if(info)setInfo(false);else close();}if(!library&&e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(!library&&e.key==='ArrowRight'){e.preventDefault();move(1);}}
 useEffect(()=>{window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown);});
 const visible=books.filter(b=>`${b.title} ${b.author} ${b.entries[0].text}`.includes(query.trim()));
 const song=book?songsData.songs.find(s=>s.bookId===book.id):null;
 const theme=themes[book?.id]||{left:'#8D9B9E',right:'#E7ECE9',ink:'#263735'};
 const audioProblem=['unavailable','error'].includes(playback.status);
 return <section aria-label="书房" className={`record-world ${opened?'is-open':''} ${library?'has-library':''}`} style={{'--panel-left':theme.left,'--panel-right':theme.right,'--ink':theme.ink}}>
  <PoolWater className="gallery-water"/><div className="gallery-heading"><h2>书房</h2></div>
  <audio ref={audio} preload="none" className="room-audio-element"/>
  <div className="spread-paper" aria-hidden="true"><div/><div/></div>
  <nav className="record-navigation" aria-label="作品集导航">
   {opened||library?<button className="icon-button" ref={closeButton} onClick={close} aria-label="返回唱片架" title="返回唱片架"><Icon name="back"/></button>:<a className="icon-button" href="#home" aria-label="回到家里" title="回到家里"><Icon name="home"/></a>}
   {!opened&&!library&&<button className="icon-button" onClick={()=>setLibrary(true)} aria-label="全部读后感" title="全部读后感"><Icon name="library"/></button>}
  </nav>
  {!data?<p className="room-loading" role="status">{error||'正在打开唱片室…'}</p>:<>
   <section className="album-stage" aria-label="横向浏览立体唱片" aria-hidden={library||undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={()=>{drag.current=null;animate();}} onPointerLeave={e=>{if(drag.current)onPointerUp(e);}} onWheel={onWheel}>
    <div className="scene-camera"><div className="album-deck">{books.map((b,i)=><div className={`album-position ${i===index?'selected':''}`} key={b.id} ref={node=>node?objects.current.set(i,node):objects.current.delete(i)} style={{'--tone':themes[b.id].left,'--ratio':themes[b.id].ratio}}>
     <div className="album-assembly">
      <div className="album-disc" aria-hidden="true"><div className={`disc-surface ${playback.status==='playing'&&i===index?'spinning':''}`}><ResponsiveImage loading="lazy" decoding="async" width="1024" height="1024" className="vinyl-image" src="/reading-records/vinyl-v1.svg" alt="" draggable="false"/><ResponsiveImage loading="lazy" decoding="async" width={Math.round(600*themes[b.id].ratio)} height="600" className="disc-label" src={b.cover} alt="" draggable="false"/></div></div>
      <button className="album-case" onClick={()=>{if(skipClick.current||opened)return;i===index?open(i):choose(i);}} tabIndex={opened||library?-1:Math.abs(wrapDistance(i,index,books.length))<2?0:-1} aria-label={`${i===index?'打开':'选中'}《${titleOf(b.title)}》`} aria-current={i===index?'true':undefined}>
       <span className="case-face case-front"><ResponsiveImage loading="lazy" decoding="async" width={Math.round(600*themes[b.id].ratio)} height="600" src={b.cover} alt={b.title+'封面'} draggable="false"/><span className="case-light"/></span>
       <span className="case-face case-back"><ResponsiveImage loading="lazy" decoding="async" width={Math.round(600*themes[b.id].ratio)} height="600" src={b.cover} alt="" draggable="false"/></span>
       <span className="case-face case-spine"/><span className="case-face case-edge"/><span className="case-face case-top"/><span className="case-face case-bottom"/>
      </button>
     </div>
    </div>)}</div></div>
   </section>
   {!opened&&<section className="album-caption" aria-live="polite"><h1 key={book.id}>{titleOf(book.title)}</h1><button onClick={()=>open()} className="icon-button" aria-label="打开当前读后感" title="打开当前读后感"><Icon name="play"/></button></section>}
   {!library&&<div className="room-bottom"><div className="record-switcher"><button className="icon-button" onClick={()=>move(-1)} aria-label="上一张唱片" title="上一篇"><Icon name="back"/></button><button className="icon-button" onClick={()=>move(1)} aria-label="下一张唱片" title="下一篇"><Icon name="next"/></button></div></div>}
   {opened&&song&&<section className="room-song" aria-label="这本书的伴读歌曲">
    <div className="native-song-controls">
     <button className={`icon-button ${playback.status==='loading'?'is-loading':''}`} onClick={()=>audioProblem?setInfo(!info):music.current?.toggle()} aria-label={audioProblem?'查看音乐不可用原因':playback.status==='playing'?'暂停伴读音乐':'播放伴读音乐'} title={audioProblem?playback.error:playback.status==='playing'?'暂停':'播放'}><Icon name={audioProblem?'warning':playback.status==='playing'?'pause':'play'}/></button>
     <input aria-label="音乐进度" aria-valuetext={`${clock(playback.time)} / ${clock(playback.duration)}`} type="range" min="0" max={playback.duration||1} step=".1" value={Math.min(playback.time,playback.duration||1)} disabled={!playback.duration} onChange={e=>music.current?.seek(+e.target.value)}/>
     <button className="icon-button" onClick={()=>setInfo(!info)} aria-expanded={info} aria-controls="song-details" aria-label="音量设置" title="音量设置"><Icon name={volume===0?'mute':'volume'}/></button>
    </div>
    {audioProblem&&<span role="status" className="sr-only">{playback.error}</span>}
    {info&&<aside id="song-details" className="song-details" aria-label="播放设置"><button className="icon-button info-close" onClick={()=>setInfo(false)} aria-label="关闭播放设置"><Icon name="close"/></button>{playback.error&&<p role="alert">{playback.error}</p>}<label><span className="sr-only">音量</span><input aria-label="音乐音量" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>{setVolume(+e.target.value);music.current?.volume(+e.target.value);}}/></label>{playback.status==='error'&&<button className="retry-music" onClick={()=>startMusic(book)}>重试播放</button>}</aside>}
   </section>}
   {opened&&<section className="essay-room" role="region" aria-labelledby="essay-title" ref={body}><div className="essay-inner" key={book.id}><h1 id="essay-title">{titleOf(book.title)}</h1><div className="essay-content">{book.entries[0].text.split(/\n/).map((p,i)=><p key={i}>{p||'\u00a0'}</p>)}</div><div className="essay-end">{book.readerLink&&<a className="icon-button" href={book.readerLink} target="_blank" rel="noreferrer" aria-label="在示例书房打开原文" title="在示例书房打开原文"><Icon name="external"/></a>}</div></div></section>}
   {library&&<section className="room-library" aria-label="全部完整读后感"><div className="room-library-title"><h1>完整读后感</h1><label><span className="sr-only">查找作品</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索书名或原文" aria-label="搜索书名或原文"/></label></div><div className="room-library-list">{visible.map(b=><button key={b.id} onClick={()=>open(books.indexOf(b))} aria-label={`阅读《${titleOf(b.title)}》`}><ResponsiveImage loading="lazy" decoding="async" width={Math.round(600*themes[b.id].ratio)} height="600" src={b.cover} alt=""/><strong>{titleOf(b.title)}</strong><Icon name="next"/></button>)}</div>{!visible.length&&<p role="status">没有找到，换个词试试。</p>}</section>}
   {error&&<p className="room-error" role="status">{error}</p>}
  </>}
 </section>;
}
