import {parseDocument} from './content-parser';
const briefFiles=import.meta.glob('../content/brief/*.md',{query:'?raw',import:'default',eager:true});
const courseFiles=import.meta.glob('../content/courses/*/*.md',{query:'?raw',import:'default',eager:true});
export const briefs=Object.entries(briefFiles).map(([path,raw])=>parseDocument(raw,path)).sort((a,b)=>b.date.localeCompare(a.date));
export const topics=Object.entries(courseFiles).filter(([p])=>p.endsWith('/index.md')).map(([p,r])=>({...parseDocument(r,p),slug:p.split('/').at(-2)})).sort((a,b)=>a.order-b.order);
export const articles=Object.entries(courseFiles).filter(([p])=>!p.endsWith('/index.md')).map(([p,r])=>({...parseDocument(r,p),topic:p.split('/').at(-2),slug:p.split('/').at(-1).replace(/\.md$/,'')})).sort((a,b)=>b.date.localeCompare(a.date)||b.order-a.order);
export const articleUrl=article=>`#courses/${article.topic}/${article.slug}`;

// Ready for the future course directory, without populating its visual shell.
export const courseCatalog=topics.map(topic=>({...topic,articles:articles.filter(article=>article.topic===topic.slug).sort((a,b)=>a.order-b.order)}));
