export function wrapDistance(index,position,count){let d=(index-position)%count;if(d>count/2)d-=count;if(d<-count/2)d+=count;return d;}
export function albumPose(distance){
 const a=Math.abs(distance),sign=Math.sign(distance);
 // A rigid sleeve passes through an edge-on pose as it changes places.
 // Source aspect ratio stays fixed: the narrow silhouette is true perspective.
 const yaw=a<1?-12*(1-a)-sign*(48*a+50*Math.sin(Math.PI*a)):-sign*Math.min(62,48+(a-1)*7);
 return {x:sign*(a<=1?a*240:240+(a-1)*180),z:85-a*120,yaw,pitch:-2,visibility:a>4.8?0:1};
}
export function stepSpring(position,velocity,target,frameDelta=1){const delta=target-position;const v=delta*(1-Math.pow(.84,frameDelta));return Math.abs(delta)<.0002?{position:target,velocity:0}:{position:position+v,velocity:v};}
