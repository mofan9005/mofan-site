// Keep Chinese words intact while CSS balances the heading across lines.
const words=new Intl.Segmenter('zh-CN',{granularity:'word'});
export default function TitleText({children}){
 return [...words.segment(children)].map(({segment,isWordLike},i)=>isWordLike?<span className="title-word" key={i}>{segment}</span>:segment);
}
