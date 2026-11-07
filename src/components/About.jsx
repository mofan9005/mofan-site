import ResponsiveImage from './ResponsiveImage';
import {ArrowUpRight} from '@phosphor-icons/react';
import {zh} from '../i18n/zh';
import './about.css';
export default function About(){return <>
<section className="about-hero"><h1 className="latin" data-page-title>Example</h1><figure className="about-rocker"><ResponsiveImage src="/images/example-about.svg" alt="示例几何占位图" width="1672" height="941" fetchPriority="high"/></figure></section>
<section className="about-work dark-section"><div className="page-width"><div className="section-line"><h2>示例内容 / Example</h2></div><p>这是用于展示页面布局和交互的公开示例。内容不描述任何真实人物。</p><div className="work-grid">{zh.aboutWork.map((item,i)=><a href={item.href} key={item.title}><span className="tabular">0{i+1}</span><h3>{item.title}</h3><ArrowUpRight aria-hidden="true"/></a>)}</div></div></section>
<section className="about-find page-width"><h2>关于此示例</h2><p>所有正文和媒体均为示例占位内容。</p></section></>;}
