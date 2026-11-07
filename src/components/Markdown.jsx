import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dimensions from '../media-dimensions.json';
export default function Markdown({children}){return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
 p:({node,children})=>node.children.length===1&&node.children[0].tagName==='img'?<>{children}</>:<p className={node.children[0]?.value?.startsWith('图注：')?'image-credit':undefined}>{children}</p>,
 img:({alt,title,src})=>{const size=dimensions[src]||{};return <figure className="content-figure"><img src={src} width={size.width} height={size.height} alt={alt||''} loading="lazy" decoding="async"/>{(alt||title)&&<figcaption>{[alt,title].filter(Boolean).join(' · ')}</figcaption>}</figure>;},
 a:({children,href})=><a href={href} {...(/^https?:/.test(href||'')?{target:'_blank',rel:'noreferrer'}:{})}>{children}</a>
}}>{children}</ReactMarkdown>;}
