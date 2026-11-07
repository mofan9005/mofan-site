import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import {startAnalytics} from './analytics.mjs';
import {briefs, topics, articles} from './content';
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
const stopAnalytics = startAnalytics({window, document, env: import.meta.env,
 routes: new Set(['home', 'courses', 'about', 'brief', 'gallery',
  ...briefs.map(issue => `brief/${issue.date}`), ...topics.map(topic => `courses/${topic.slug}`),
  ...articles.map(article => `courses/${article.topic}/${article.slug}`)])});
import.meta.hot?.dispose(stopAnalytics);
// Development-only QA measurement; no analytics or external transmission.
if(import.meta.env.DEV&&typeof PerformanceObserver!=='undefined'){
 let cls=0;document.documentElement.dataset.qaCls='0';const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)cls+=entry.value;document.documentElement.dataset.qaCls=String(cls);});
 observer.observe({type:'layout-shift',buffered:true});
 import.meta.hot?.dispose(()=>observer.disconnect());
}
