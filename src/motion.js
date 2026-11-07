import {useEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import Lenis from 'lenis';
gsap.registerPlugin(ScrollTrigger,SplitText);
export const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function useSmoothScroll(){
 const ref=useRef(null);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');let frame;
  const setup=()=>{ref.current?.destroy();ref.current=null;cancelAnimationFrame(frame);if(media.matches)return;
   const lenis=new Lenis({lerp:.1,smoothWheel:true,prevent:node=>node.closest?.('[data-lenis-prevent],.album-stage,.essay-room,.room-library,.menu-overlay')});ref.current=lenis;
   lenis.on('scroll',ScrollTrigger.update);const tick=time=>{lenis.raf(time);frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
  };setup();media.addEventListener('change',setup);return()=>{media.removeEventListener('change',setup);cancelAnimationFrame(frame);ref.current?.destroy();};
 },[]);return ref;
}
export {useRoute} from './motion/route';
export {usePageMotion} from './motion/page';
export {MotionNumber} from './motion/NumberMotion';
