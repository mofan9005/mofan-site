import ResponsiveImage from './ResponsiveImage';
import {useState} from 'react';
import {ArrowDown,ArrowUpRight} from '@phosphor-icons/react';
import {briefs} from '../content';
import {MotionNumber} from '../motion/NumberMotion';
import './brief-page.css';
import InteractiveList,{listCover} from './InteractiveList';

const headline=issue=>(issue.card_title||issue.title).replace(/^智驾与AI早报[｜|][^：]*：/,'');
const number=issue=>String(issue.issue).padStart(2,'0');

function IssueCard({issue,index}){
 return <li className={`brief-edition brief-edition-${index}`}>
  <a className="brief-edition-link" href={`#brief/${issue.date}`} aria-label={`第 ${issue.issue} 期 · ${issue.title}`}>
   <div className="brief-edition-copy">
    <div className="brief-edition-meta"><span>{index===0?'最新一期':'上一期'}</span><time dateTime={issue.date}>{issue.date.replaceAll('-','.')}</time></div>
    <h2>「{headline(issue)}」</h2>
    <div className="brief-edition-action"><span>翻开这一期</span><ArrowUpRight aria-hidden="true"/></div>
   </div>
   <div className="brief-edition-art" aria-hidden="true">
    {issue.image&&<img src={issue.image} alt="" loading="lazy" width="900" height="383" decoding="async"/>}
    <MotionNumber className="brief-edition-number">{number(issue)}</MotionNumber>
   </div>
  </a>
  <ul className="brief-edition-preview" aria-label={`第 ${issue.issue} 期内容预览`}>
   {issue.items.slice(0,3).map((item,i)=><li key={i}><span>{item.theme==='auto'?'智能驾驶':item.theme==='ai'?'AI':item.topic}</span><span>{item.title||item.fact}</span></li>)}
  </ul>
 </li>;
}

export default function Brief(){
 const [limit,setLimit]=useState(6),archive=briefs.slice(2);
 return <div className="brief-journal">
  <section className="brief-front page-width" aria-labelledby="brief-title">
   <header className="brief-masthead">
    <h1 id="brief-title" data-page-title><span>Example</span><strong>示例期刊</strong></h1>
    <ResponsiveImage className="brief-still-life" src="/images/v2/brief-newspaper.svg" alt="示例几何占位图" width="1672" height="941" fetchPriority="high" decoding="async"/>
   </header>
   <div className="brief-section-label"><h2>最近两期</h2><span>示例内容 / Example</span></div>
   <ol className="brief-editions">{briefs.slice(0,2).map((issue,index)=><IssueCard issue={issue} index={index} key={issue.date}/>)}</ol>
  </section>
  <section className="brief-history page-width" aria-labelledby="brief-history-title">
   <div className="brief-history-heading"><h2 id="brief-history-title">往期早报</h2><span><MotionNumber>{archive.length}</MotionNumber> 期收录</span></div>
   {archive.length?<>
    <InteractiveList label="往期早报" items={archive.slice(0,limit).map(issue=>({title:headline(issue),date:issue.date,href:`#brief/${issue.date}`,image:listCover(issue),action:'翻开这期'}))}/>
    {limit<archive.length&&<button className="brief-more" onClick={()=>setLimit(n=>n+6)}>再翻六期<ArrowDown aria-hidden="true"/></button>}
   </>:<p className="brief-history-empty">暂无更早期刊</p>}
  </section>
 </div>;
}
