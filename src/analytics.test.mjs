import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {analyticsEnabled,startAnalytics,routeToPath,trackedUrl,sourceReferrer,eventForLink} from './analytics.mjs';
const env={PROD:true,MODE:'production',VITE_UMAMI_WEBSITE_ID:'example-only'};
const location=new URL('https://example.invalid/#home');
test('Analytics defaults OFF even with an identifier',()=>{
 assert.equal(analyticsEnabled(env,location),false);
 assert.equal(analyticsEnabled({...env,VITE_ANALYTICS_ENABLED:'false'},location),false);
 assert.equal(analyticsEnabled({...env,VITE_ANALYTICS_ENABLED:'true',VITE_UMAMI_WEBSITE_ID:''},location),false);
 const win={location};const {document}=parseHTML('<html><head></head><body></body></html>');
 startAnalytics({window:win,document,env});assert.equal(document.querySelector('script'),null);
});
test('Explicit analytics opt-in still requires correct host, protocol and mode',()=>{
 const enabled={...env,VITE_ANALYTICS_ENABLED:'true'};assert(analyticsEnabled(enabled,location));
 for(const url of ['https://other.invalid/','http://example.invalid/','https://example.invalid:1234/'])assert.equal(analyticsEnabled(enabled,new URL(url)),false);
 assert.equal(analyticsEnabled({...enabled,MODE:'test'},location),false);
});
test('Tracking paths and referrers exclude private query values',()=>{
 assert.equal(routeToPath('#/courses/use-ai/example-1'),'/courses/use-ai/example-1');assert.equal(routeToPath('#main'),null);assert.equal(routeToPath('#unknown'),'/404');
 assert.equal(trackedUrl('https://example.invalid/?private=hidden&utm_source=example#brief/2026-01-01'),'/brief/2026-01-01?utm_source=example');
 assert.equal(sourceReferrer('https://source.invalid/private?value=hidden'),'https://source.invalid/');
 assert.equal(eventForLink('#courses/use-ai',location.href).name,'course_open');
});
