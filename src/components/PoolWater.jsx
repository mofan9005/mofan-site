import {useEffect, useId, useRef, useState} from 'react';
import {createWaterGrade, startWaterRipples} from './water-ripples';
import './pool-water.css';

export default function PoolWater({className = '', variant = 'gallery'}) {
 const host = useRef(null), canvas = useRef(null), filter = useRef(null);
 const gradeId = `water-grade-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
 const [portrait, setPortrait] = useState(() => matchMedia('(max-width:700px)').matches);
 const source = variant === 'courses'
  ? `/images/v2/course-pool-${portrait ? 'portrait' : 'landscape'}.svg`
  : '/images/v2/pool-water.svg';
 const responsiveSource=portrait?source.replace('.svg','-mobile.svg'):source;
 useEffect(() => {
  const media = matchMedia('(max-width:700px)'), change = () => setPortrait(media.matches);
  media.addEventListener('change', change);
  return () => media.removeEventListener('change', change);
 }, []);
 useEffect(() => {
  const grade = createWaterGrade(host.current);
  // Static fallback and WebGL share exactly the same sRGB lookup table.
  ['R', 'G', 'B'].forEach((channel, i) => {
   filter.current.querySelector(`feFunc${channel}`).setAttribute('tableValues', grade.tables[i]);
  });
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let stop = () => {};
  const setup = () => {
   stop();
   canvas.current.style.opacity = '0';
   canvas.current.dataset.renderState = 'static';
   host.current.parentElement.dataset.waterState = 'static';
   if (!media.matches) stop = startWaterRipples({canvas: canvas.current, source: responsiveSource, grade: grade.pixels, stretch: variant === 'courses' && portrait});
  };
  setup();
  media.addEventListener('change', setup);
  return () => {stop(); media.removeEventListener('change', setup);};
 }, [responsiveSource, variant, portrait]);
 return <div ref={host} className={`pool-water ${className}`} aria-hidden="true">
  <svg className="pool-water-filter" width="0" height="0" focusable="false">
   <defs><filter id={gradeId} ref={filter} colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0"/>
    <feComponentTransfer>
     <feFuncR type="table" tableValues="0 1"/>
     <feFuncG type="table" tableValues="0 1"/>
     <feFuncB type="table" tableValues="0 1"/>
    </feComponentTransfer>
   </filter></defs>
  </svg>
  <img src={responsiveSource} width={portrait?944:1536} height={portrait?1666:1024} fetchPriority="high" decoding="async" alt="" draggable="false" style={{filter: `url(#${gradeId})`}}/>
  <canvas ref={canvas}/>
 </div>;
}
