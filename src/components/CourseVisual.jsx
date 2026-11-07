import ResponsiveImage from './ResponsiveImage';
const descriptions={
 'strawberry-bear':'示例方形占位图',
 ring:'黄色与白色相间的泳圈',duck:'黄色橡皮小鸭',boat:'一侧浸湿的白色折纸船',
};
export default function CourseVisual({asset,className='',...props}){
 return <ResponsiveImage loading="eager" width="1200" height="1200" decoding="async" {...props} className={className} src={`/images/v2/course-${asset}.svg`} alt={descriptions[asset]||''}/>;
}
