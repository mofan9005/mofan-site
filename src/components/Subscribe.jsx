import {useId} from 'react';
import {BUTTONDOWN_USERNAME} from '../config';
import {zh} from '../i18n/zh';
export default function Subscribe(){
 const id=useId(), ready=BUTTONDOWN_USERNAME.trim()&&!BUTTONDOWN_USERNAME.startsWith('TODO');
 return <section className="subscribe" aria-labelledby={`${id}-heading`}><div><span className="tiny-dot"/><h2 id={`${id}-heading`}>{zh.subscribeHeading}</h2></div>
 <div className="subscribe-action"><form action={ready?`https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(BUTTONDOWN_USERNAME)}`:undefined} method="post" onSubmit={ready?undefined:e=>e.preventDefault()}>
 <label className="sr-only" htmlFor={`${id}-email`}>{zh.email}</label><input id={`${id}-email`} type="email" name="email" placeholder={zh.emailPlaceholder} autoComplete="email" required disabled={!ready}/><button type="submit" disabled={!ready}>{zh.subscribe}<span aria-hidden="true"> ↗</span></button></form>
 {!ready&&<p className="subscribe-status" role="status"><strong>{zh.subscribeSoon}</strong></p>}</div></section>;
}
