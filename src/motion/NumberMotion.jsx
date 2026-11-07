import {useEffect,useRef} from 'react';
import gsap from 'gsap';
import './motion.css';

// Keep the final value in normal flow and expose it only once to assistive tech.
// The rolling glyphs are decorative; no changing live-region announcements.
export function MotionNumber({children,as:Tag='span',className='',...props}){
 const host=useRef(null),value=String(children);
 useEffect(()=>{
  const node=host.current,media=matchMedia('(prefers-reduced-motion: reduce)');
  const strips=[...node.querySelectorAll('.motion-digit-strip')];
  let tween,played=false,last=-Infinity;
  // Explicitly reset y: GSAP may parse the CSS percentage fallback as pixels.
  // Without this reset the CSS offset and animated percentage are added twice.
  const settle=()=>{tween?.kill();gsap.set(strips,{y:0,yPercent:-200/3,clearProps:'willChange'});};
  const play=()=>{
   if(media.matches||document.hidden||performance.now()-last<800)return;
   last=performance.now();played=true;tween?.kill();
   tween=gsap.fromTo(strips,{y:0,yPercent:0,willChange:'transform'},{y:0,yPercent:-200/3,duration:.95,ease:'elastic.out(1,0.55)',stagger:.055,overwrite:true,onComplete:()=>gsap.set(strips,{clearProps:'willChange'})});
  };
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!played)play();},{threshold:.2});
  observer.observe(node);
  const target=node.closest('a,button')||node;
  const hover=event=>{if(event.pointerType!=='touch')play();};
  const preference=()=>{if(media.matches)settle();};
  target.addEventListener('pointerenter',hover);target.addEventListener('focusin',play);media.addEventListener('change',preference);
  return()=>{observer.disconnect();tween?.kill();target.removeEventListener('pointerenter',hover);target.removeEventListener('focusin',play);media.removeEventListener('change',preference);};
 },[value]);
 return <Tag {...props} ref={host} className={`motion-number ${className}`} data-motion-number={value}><span className="motion-number-readable">{value}</span><span className="motion-number-visual" aria-hidden="true">{[...value].map((digit,index)=>/\d/.test(digit)?<span className="motion-digit" key={index}><span className="motion-digit-space">{digit}</span><span className="motion-digit-strip"><span>{(+digit+8)%10}</span><span>{(+digit+9)%10}</span><span>{digit}</span></span></span>:<span key={index}>{digit}</span>)}</span></Tag>;
}
