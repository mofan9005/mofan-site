import {useState} from 'react';
import {zh,formatDate} from '../i18n/zh';
import './brief-cards.css';
import TitleText from './TitleText';

const palette=['#d7c6aa','#80bdb5','#a5c9de','#d6b750','#818fac','#a8b9c3','#cf7969','#bd955b'];

function CardImage({image,index}){
 const [failed,setFailed]=useState(false);
 return <span className="editorial-image" aria-hidden="true">
  {image&&!failed?<img src={image} alt="" width="480" height="300" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<svg className={`editorial-abstract abstract-${index%3}`} viewBox="0 0 240 240" focusable="false"><circle className="abstract-disc" cx="152" cy="88" r="77"/><path className="abstract-plane" d="M-30 188 177 20 279 117 72 285Z"/><circle className="abstract-ring" cx="45" cy="182" r="78"/><path className="abstract-line" d="M0 40H240M0 55H240M0 70H240"/></svg>}
  <span className="editorial-number">{String(index+1).padStart(2,'0')}</span>
 </span>;
}
function CardFace({topic,title,image,index,meta}){
 return <><span className="editorial-copy"><span className="editorial-kicker">{topic}</span><span className="editorial-title">「<TitleText>{title}</TitleText>」</span><span className="editorial-meta">{meta}<span aria-hidden="true">↗</span></span></span><CardImage image={image} index={index}/></>;
}
export function BriefItems({items}){
 return <ol className="editorial-list">{items.map((item,i)=><li className="editorial-entry" key={i} style={{'--card-color':palette[i%palette.length]}}>
  <details className="editorial-detail"><summary className="editorial-card"><CardFace topic={item.topic||item.source.name} title={item.title||item.fact} image={item.image} index={i} meta={zh.readItem}/></summary>
   <div className="editorial-expanded"><p className="editorial-fact">{item.fact}</p><blockquote><span>{zh.judgment}</span><p>{item.take||item.judgment}</p></blockquote><a className="source-link" href={item.source.url} target="_blank" rel="noreferrer">{zh.source} · {item.source.name} ↗</a></div>
  </details>
 </li>)}</ol>;
}
export function BriefArchive({issues}){
 return <ol className="editorial-list editorial-archive">{issues.map((issue,i)=><li className="editorial-entry" key={issue.date} style={{'--card-color':palette[(i+4)%palette.length]}}><a className="editorial-card" href={`#brief/${issue.date}`}><CardFace topic={`${zh.issuePrefix} ${issue.issue} ${zh.issueLabel}`} title={issue.title} image={issue.image||issue.items[0]?.image} index={issue.issue-1} meta={<time dateTime={issue.date}>{formatDate(issue.date)}</time>}/></a></li>)}</ol>;
}
