import ResponsiveImage from './ResponsiveImage';
import {zh} from '../i18n/zh';
export default function Turntable({newest}){
 return <div className="turntable-stage"><div className="turntable-photo">
  <ResponsiveImage className="turntable-base" src="/images/home-turntable-codex-v3.svg" alt={zh.turntableAlt} width="1672" height="941" fetchPriority="high"/>
  <div className="disc-frame"><div className="disc-rotor"><ResponsiveImage loading="eager" className="disc-texture" src="/images/v2/home-disc.svg" alt="" width="1600" height="1600"/><span className="record-label"/><a href="#about" className="example-hotspot" aria-label="Example"/></div></div>
  <a href={newest} className="tonearm-hotspot" aria-label={zh.tonearm}>
   {/* The painted polygon is also the pointer target: no separate invisible mask. */}
   <svg className="arm-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <polygon className="tonearm-shape" points="74,11 80,11 82,27 75,44 73,55 67,66 63,77 57,74 60,67 66,60 70,52 71,35" vectorEffect="non-scaling-stroke"/>
    <circle className="tonearm-pivot" cx="77" cy="17" r="2"/>
   </svg>
   <span className="tonearm-label">{zh.tonearm}<span aria-hidden="true"> ↗</span></span>
  </a>
 </div></div>;
}
