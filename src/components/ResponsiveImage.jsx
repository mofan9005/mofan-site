import media from '../optimized-media.json';
export default function ResponsiveImage({src,width,height,loading='lazy',fetchPriority,...props}){
 const candidate=src?.replace(/\.(png|jpe?g)$/i,'.webp');if(media[candidate])src=candidate;
 const item=media[src],mobile=src?.replace(/\.webp$/,'-mobile.webp');
 return <img {...props} src={src} srcSet={item&&item.mobileWidth<item.width?`${mobile} ${item.mobileWidth}w, ${src} ${item.width}w`:undefined} sizes="(max-width: 700px) 480px, 1440px" width={width||item?.width} height={height||item?.height} loading={fetchPriority==='high'?'eager':loading} fetchPriority={fetchPriority} decoding="async"/>;
}
