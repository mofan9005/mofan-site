// Manual, cookieless Umami integration. No ID (or disallowed environment): no work.
export const DOMAINS = 'example.invalid';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const TOKEN = /^[a-zA-Z0-9._~-]{1,100}$/;

export function routeToPath(hash, routes) {
  const route = String(hash || '').replace(/^#?\/?/, '').split(/[?#]/)[0].replace(/\/$/, '') || 'home';
  if (route === 'main' || route === 'explore') return null; // In-page anchors.
  const valid = /^(home|about|gallery|brief|courses)$/.test(route)
    || /^brief\/\d{4}-\d{2}-\d{2}$/.test(route)
    || /^courses\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(route);
  if (!valid || (routes && !routes.has(route))) return '/404';
  return route === 'home' ? '/' : `/${route}`;
}

export function trackedUrl(href, routes) {
  const url = new URL(href);
  const path = routeToPath(url.hash, routes);
  if (path === null) return null;
  const query = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key);
    if (value && TOKEN.test(value)) query.set(key, value);
  }
  return path + (query.size ? `?${query}` : '');
}

// Preserve source attribution, without passing search terms/private referrer paths.
export function sourceReferrer(referrer) {
  try { const url = new URL(referrer); return /^https?:$/.test(url.protocol) ? url.origin + '/' : ''; }
  catch { return ''; }
}

export function analyticsEnabled(env, location) {
  return env.VITE_ANALYTICS_ENABLED === 'true' && Boolean(env.VITE_UMAMI_WEBSITE_ID?.trim())
    && DOMAINS.split(',').includes(location.hostname)
    && location.protocol === 'https:'
    && ((env.PROD === true && env.MODE === 'production' && !location.port)
      || env.VITE_UMAMI_ALLOW_NON_PRODUCTION === 'true');
}

export function eventForLink(href, currentHref, routes) {
  let url;
  try { url = new URL(href, currentHref); } catch { return null; }
  const current = new URL(currentHref);
  if (url.origin === current.origin && url.pathname === current.pathname && url.hash) {
    const path = routeToPath(url.hash, routes);
    const parts = path?.split('/') || [];
    if (parts[1] === 'courses' && parts[2]) return {name: 'course_open', data: {course_slug: parts[2], ...(parts[3] ? {article_slug: parts[3]} : {})}};
    if (parts[1] === 'brief' && parts[2]) return {name: 'brief_open', data: {issue_id: parts[2]}};
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname === 'x.com' || url.hostname === 'twitter.com') return {name: 'outbound_x', data: {destination: 'x'}};
  return null;
}

const instances = new WeakMap();
export function startAnalytics({window: win, document: doc, env, routes}) {
  if (!analyticsEnabled(env, win.location)) return () => {};
  if (instances.has(win)) return instances.get(win);
  let src;
  try {
    src = new URL(env.VITE_UMAMI_SCRIPT_SRC);
    if (src.protocol !== 'https:' || src.username || src.password || src.search || src.hash) return () => {};
  } catch { return () => {}; }
  let disposed = false, ready = false, draining = false, lastPath, script;
  const queue = [];
  const referrer = sourceReferrer(doc.referrer);
  const snapshot = (href = win.location.href) => {
    const url = trackedUrl(href, routes);
    return url === null ? null : {url, title: url.split('?')[0], referrer};
  };
  async function drain() {
    if (!ready || draining || disposed) return;
    draining = true;
    try {
      while (queue.length && !disposed) {
        const payload = queue.shift();
        try {
          // Override defaults for BOTH PVs and events: never send the raw URL/title.
          await win.umami.track(props => ({...props, ...payload}));
        } catch { /* Blockers/network failures must never break navigation. No retries. */ }
      }
    } finally { draining = false; }
  }
  function enqueue(payload) {
    if (!payload || disposed) return;
    // Memory-only, bounded buffer while waiting for the nonblocking script.
    if (queue.length < 100) queue.push(payload);
    void drain();
  }
  function pageview(event) {
    // HashChangeEvent snapshots also preserve rapid changes queued in one task.
    const payload = snapshot(event?.newURL || win.location.href);
    if (!payload) return;
    const path = payload.url.split('?')[0];
    if (path === lastPath) return;
    lastPath = path;
    enqueue(payload);
  }
  function click(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const element = event.target?.closest?.('a[href]');
    if (!element) return;
    const custom = eventForLink(element.getAttribute('href'), win.location.href, routes);
    const page = snapshot();
    if (custom && page) enqueue({...page, ...custom});
  }
  function inject() {
    if (disposed) return;
    script = doc.createElement('script');
    script.src = src.href;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = 'no-referrer'; // Script fetch cannot leak the real query.
    script.setAttribute('data-website-id', env.VITE_UMAMI_WEBSITE_ID.trim());
    script.setAttribute('data-auto-track', 'false');
    script.setAttribute('data-domains', DOMAINS);
    script.onload = () => { ready = typeof win.umami?.track === 'function'; void drain(); };
    script.onerror = () => { queue.length = 0; };
    doc.head.appendChild(script);
  }
  // Wait for load and two animation frames: the external script starts after paint.
  const afterLoad = () => win.requestAnimationFrame(() => win.requestAnimationFrame(inject));
  win.addEventListener('hashchange', pageview);
  doc.addEventListener('click', click);
  doc.addEventListener('auxclick', click);
  pageview();
  if (doc.readyState === 'complete') afterLoad();
  else win.addEventListener('load', afterLoad, {once: true});
  const stop = () => {
    disposed = true;
    queue.length = 0;
    win.removeEventListener('load', afterLoad);
    win.removeEventListener('hashchange', pageview);
    doc.removeEventListener('click', click);
    doc.removeEventListener('auxclick', click);
    if (script) { script.onload = null; script.onerror = null; script.remove(); }
    instances.delete(win);
  };
  instances.set(win, stop);
  return stop;
}