import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from '@phosphor-icons/react';
import gsap from 'gsap';
import './interactive-list.css';

// Only reuse media already attached to this item. Missing/private media stays absent.
export function listCover(item){
 return item.image||item.cover||item.items?.find(entry=>entry.image)?.image||item.body?.match(/!\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/)?.[1];
}

function ListRow({item,active,onActivate,onDeactivate}){
 const row=useRef(null),photo=useRef(null),follow=useRef(null),pointerType=useRef(''),touchStart=useRef(null),touchMoved=useRef(false);
 const cover=item.image;

 useEffect(()=>{
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference) and (any-hover: hover)',()=>{
   if(!photo.current)return;
   const tween=gsap.quickTo(photo.current,'x',{duration:.65,ease:'power3.out'});
   follow.current=tween;
   return()=>{tween.tween.kill();follow.current=null;};
  });
  return()=>media.revert();
 },[]);

 useEffect(()=>{if(!active)follow.current?.(0);},[active]);

 const move=event=>{
  if(event.pointerType!=='mouse'||!follow.current)return;
  const bounds=row.current.getBoundingClientRect();
  const travel=Math.min(80,bounds.width*.075);
  follow.current(Math.max(-travel,Math.min(travel,(event.clientX-bounds.left-bounds.width*.62)*.26)));
 };
 const click=event=>{
  // Native keyboard/assistive clicks and modified link actions still navigate immediately.
  if(event.detail===0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
  if(pointerType.current==='touch'||pointerType.current==='pen'){
   if(touchMoved.current){event.preventDefault();return;}
   if(!active){event.preventDefault();onActivate();}
  }
 };

 return <li ref={row} className={`interactive-list-item${active?' is-active':''}`} onPointerEnter={event=>{
  if(event.pointerType==='mouse'){onActivate();move(event);}
 }} onPointerMove={event=>{
  if(touchStart.current&&Math.hypot(event.clientX-touchStart.current.x,event.clientY-touchStart.current.y)>10)touchMoved.current=true;
  move(event);
 }} onPointerLeave={event=>{
  if(event.pointerType==='mouse'){
   follow.current?.(0);
   if(!row.current.querySelector(':focus-visible'))onDeactivate();
  }
 }}>
  <a className="interactive-list-link" href={item.href} aria-label={`${item.title} · ${item.action||'立即阅读'}`} onClick={click}
   onPointerDown={event=>{
    pointerType.current=event.pointerType;
    touchStart.current={x:event.clientX,y:event.clientY};touchMoved.current=false;
   }} onPointerUp={()=>{touchStart.current=null;}} onPointerCancel={()=>{touchStart.current=null;touchMoved.current=true;}}
   onFocus={event=>{if(event.target.matches(':focus-visible')){follow.current?.(0);onActivate();}}}
   onBlur={()=>{if(!row.current.matches(':hover')||pointerType.current==='touch'||pointerType.current==='pen')onDeactivate();}}
   onKeyDown={event=>{if(event.key==='Escape'){onDeactivate();event.currentTarget.blur();}}}>
   <span className="interactive-list-surface" aria-hidden="true"/>
   <div className="interactive-list-content">
    <h3 className="interactive-list-title">{item.title}</h3>
    <time className="interactive-list-date" dateTime={item.date}>{item.date.replaceAll('-','.')}</time>
    <span className="interactive-list-action">{item.action||'立即阅读'}<ArrowUpRight aria-hidden="true"/></span>
   </div>
   {cover&&<span ref={photo} className="interactive-list-photo" aria-hidden="true"><img src={cover} alt="" width="480" height="300" loading="lazy" decoding="async"/></span>}
  </a>
 </li>;
}

export default function InteractiveList({items,label}){
 const [active,setActive]=useState(null),list=useRef(null);
 useEffect(()=>{
  if(active===null)return;
  const dismiss=event=>{if(!list.current?.contains(event.target))setActive(null);};
  document.addEventListener('pointerdown',dismiss);
  return()=>document.removeEventListener('pointerdown',dismiss);
 },[active]);
 return <div className="interactive-list-panel" ref={list}>
  <ol className="interactive-list" aria-label={label}>{items.map(item=><ListRow key={item.href} item={item} active={active===item.href} onActivate={()=>setActive(item.href)} onDeactivate={()=>setActive(current=>current===item.href?null:current)}/>)}</ol>
 </div>;
}
