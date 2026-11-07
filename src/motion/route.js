import {useEffect,useState} from 'react';
import {flushSync} from 'react-dom';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './motion.css';

const currentRoute=()=>location.hash.slice(1).replace(/^\//,'')||'home';

// A lazy gallery may mount after the hash changes. Keep the outgoing image until
// its scene is ready, with a bounded wait so a failed request never traps navigation.
function waitForPage(route){
 if(route!=='gallery'||document.querySelector('.album-stage,.room-error'))return Promise.resolve();
 return new Promise(resolve=>{
  const finish=()=>{clearTimeout(timer);observer.disconnect();resolve();};
  const observer=new MutationObserver(()=>{if(document.querySelector('.album-stage,.room-error'))finish();});
  const timer=setTimeout(finish,700);
  observer.observe(document.getElementById('main'),{childList:true,subtree:true});
 });
}

export function useRoute(lenis){
 const [route,setRoute]=useState(currentRoute);
 useEffect(()=>{
  const root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)');
  const restoration=history.scrollRestoration;
  history.scrollRestoration='manual';
  window.scrollTo({top:0,left:0,behavior:'instant'});
  let displayed=currentRoute(),desired=displayed,running=false,disposed=false,native,tween,cover;
  const resetScroll=()=>{lenis.current?.resize();lenis.current?.scrollTo(0,{immediate:true,force:true});window.scrollTo({top:0,left:0,behavior:'instant'});};
  const commit=async next=>{
   if(disposed)return;
   flushSync(()=>setRoute(next));displayed=next;
   resetScroll();
   await waitForPage(next);
   if(disposed)return;
   resetScroll();ScrollTrigger.refresh();
   document.getElementById('main')?.focus({preventScroll:true});
  };
  const fade=(target,vars)=>new Promise(resolve=>{tween=gsap.to(target,{...vars,onComplete:resolve,onInterrupt:resolve});});
  async function transition(next){
   const reduce=media.matches;
   const scroll=lenis.current,wasRunning=scroll&&!scroll.isStopped;
   scroll?.stop();
   root.dataset.routeMotion=reduce?'reduce':'full';
   window.dispatchEvent(new CustomEvent('example:route-start',{detail:{from:displayed,to:next}}));
   try{
    if(typeof document.startViewTransition==='function'){
     root.dataset.routeEngine='native';
     native=document.startViewTransition(()=>commit(next));
     // A browser may skip snapshots (hidden tab, resize, unsupported capture).
     // Its update callback still commits; never navigate a second time on rejection.
     // Observe ready immediately: skipped captures reject it independently of finished.
     void native.ready.catch(()=>{});
     const finished=native.finished.catch(()=>{});
     await native.updateCallbackDone;
     await finished;
    }else{
     root.dataset.routeEngine='gsap';
     cover=document.createElement('div');cover.className='motion-route-cover';cover.setAttribute('aria-hidden','true');cover.inert=true;
     const source=document.getElementById('root'),snapshot=source.cloneNode(true);
     snapshot.removeAttribute('id');snapshot.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
     Object.assign(snapshot.style,{position:'absolute',top:`${-window.scrollY}px`,left:'0',width:'100%',margin:'0'});
     // cloneNode cannot copy canvas/video pixels. Preserve the current local frame
     // where possible; the normal image/poster remains if a canvas is tainted.
     const originals=source.querySelectorAll('canvas,video');
     snapshot.querySelectorAll('canvas,video').forEach((copy,index)=>{
      const original=originals[index],canvas=document.createElement('canvas');
      canvas.width=original.videoWidth||original.width;canvas.height=original.videoHeight||original.height;
      if(!canvas.width||!canvas.height)return;
      canvas.className=copy.className;canvas.style.cssText=copy.style.cssText;
      try{canvas.getContext('2d').drawImage(original,0,0,canvas.width,canvas.height);copy.replaceWith(canvas);}catch{/* Keep its image/poster fallback. */}
     });
     cover.appendChild(snapshot);cover.style.opacity='1';document.body.appendChild(cover);
     if(!disposed)await commit(next);
     // A real overlapping crossfade, including on reduced-motion browsers.
     await fade(cover,{opacity:0,duration:reduce?.18:.76,ease:reduce?'none':'power4.out'});
    }
   }finally{
    cover?.remove();cover=null;native=null;tween=null;
    delete root.dataset.routeMotion;
    if(wasRunning&&!disposed&&lenis.current===scroll)scroll.start();
    window.dispatchEvent(new CustomEvent('example:route-end',{detail:{route:displayed}}));
   }
  }
  async function drain(){
   if(running)return;running=true;
   try{while(!disposed&&desired!==displayed)await transition(desired);}
   catch(error){
    // Keep navigation usable if a rendering/capture error occurs.
    if(!disposed){await commit(desired);console.warn('Route transition skipped:',error);}
   }finally{running=false;}
  }
  const change=()=>{
   const next=currentRoute();
   if(next==='main'||next==='explore')return;
   desired=next;void drain();
  };
  const preference=()=>{if(media.matches){native?.skipTransition();tween?.progress(1);}};
  addEventListener('hashchange',change);media.addEventListener('change',preference);
  return()=>{
   disposed=true;removeEventListener('hashchange',change);media.removeEventListener('change',preference);
   native?.skipTransition();tween?.kill();cover?.remove();delete root.dataset.routeMotion;
   history.scrollRestoration=restoration;
  };
 },[lenis]);
 return route;
}
