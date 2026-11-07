import {useLayoutEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger,SplitText);
const revealSelector='[data-page-title], [data-motion-reveal], .hero-bottom, .brief-masthead > *, .brief-section-label, .brief-edition, .magazine > .back-link, .article-header, .topic-articles > .section-line, .gallery-heading, .album-caption';

export function usePageMotion(route){
 useLayoutEffect(()=>{
  const page=document.querySelector('main[data-route]');if(!page)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let context,observer,disposed=false;const seen=new WeakSet(),splits=[];
  const ready=()=>page.setAttribute('data-motion-ready','true');
  const reveal=()=>{
   const candidates=[...page.querySelectorAll(revealSelector)];
   const targets=candidates.filter(el=>!seen.has(el)&&!candidates.some(other=>other!==el&&other.contains(el)));
   targets.forEach(el=>seen.add(el));
   const visible=targets.filter(el=>{const box=el.getBoundingClientRect();return box.bottom>0&&box.top<innerHeight&&box.height>0;});
   if(visible.length)gsap.from(visible,{y:'+=18',opacity:0,duration:.72,ease:'power4.out',stagger:.055,clearProps:'transform,opacity'});
  };
  const setup=()=>{
   context?.revert();splits.splice(0).forEach(split=>split.revert());observer?.disconnect();
   if(media.matches){ready();return;}
   context=gsap.context(()=>{
    reveal();
    gsap.delayedCall(.9,ready);
    page.querySelectorAll('[data-parallax]').forEach(el=>gsap.to(el,{y:()=>innerHeight*Number(el.dataset.parallax),ease:'none',scrollTrigger:{trigger:el.closest('section'),start:'top top',end:'bottom top',scrub:true}}));
   },page);
   // Gallery's lazy scene is mounted separately. Only reveal its labels, leaving
   // its 3D album transforms and its own interaction springs untouched.
   observer=new MutationObserver(()=>context?.add(reveal));
   observer.observe(page,{childList:true,subtree:true});
   document.fonts.ready.then(()=>{
    if(disposed||media.matches)return;
    context.add(()=>page.querySelectorAll('[data-reveal]').forEach(el=>{
     splits.push(SplitText.create(el,{type:'lines',mask:'lines',autoSplit:true,onSplit(self){return gsap.from(self.lines,{yPercent:100,duration:.76,ease:'power4.out',stagger:.055,scrollTrigger:{trigger:el,start:'top 94%',once:true}});}}));
    }));ScrollTrigger.refresh();
   });
  };
  setup();media.addEventListener('change',setup);
  return()=>{disposed=true;media.removeEventListener('change',setup);observer?.disconnect();context?.revert();splits.forEach(split=>split.revert());};
 },[route]);
}
