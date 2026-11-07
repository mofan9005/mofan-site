export const zh = {
 brand:'Example',siteTitle:'Example',home:'首页',about:'Example',courses:'课程',brief:'日报',gallery:'书房',notFound:'页面未找到',
 turntableAlt:'示例几何占位图',tonearm:'阅读最新课程文章',
 entrances:[{name:'课程',route:'courses',number:'01'},{name:'日报',route:'brief',number:'02'},{name:'书房',route:'gallery',number:'03'}],
 subscribe:'订阅',subscribeHeading:'邮件订阅',email:'邮箱地址',emailPlaceholder:'你的邮箱地址',subscribeSoon:'订阅即将开放',
 aboutWork:[{title:'AI × 智能驾驶',href:'#brief'},{title:'阅读',href:'#gallery'},{title:'课程',href:'#courses'}],
 aboutLinks:[{label:'日报',href:'#brief'},{label:'课程',href:'#courses'},{label:'书房',href:'#gallery'}],
 issueLabel:'期',issuePrefix:'第',judgment:'我的判断',source:'来源',readItem:'展开条目',
 galleryMusicUnavailable:'音乐未接通；可查看歌曲信息。',
};
export const formatDate = value => new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`));
