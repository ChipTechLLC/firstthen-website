const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.chiptechllc.firstthenboardandroid';

const json = (body, status) => Response.json(body, { status, headers: {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}});

function redirect(location) {
  return new Response(null, { status: 308, headers: {
    Location: location,
    'Cache-Control': 'public, max-age=3600',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  }});
}

export async function handle(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/api/beta' || url.pathname.startsWith('/api/beta/')) {
    return json({ error: 'Registration has ended. Download First Then Board directly from Google Play.', playUrl: PLAY_URL }, 410);
  }
  if (url.pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);

  if (['/android-beta', '/android-beta/', '/android-beta/index.html'].includes(url.pathname)) {
    if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Registration has ended.', playUrl: PLAY_URL }, 410);
    // An explicit empty fragment prevents old invitation fragments from following the redirect.
    return redirect(`${PLAY_URL}#`);
  }
  if (['/android-beta/privacy', '/android-beta/privacy/', '/android-beta/privacy.html'].includes(url.pathname)) {
    return redirect(new URL('/privacy.html#past-registrations', url).href);
  }
  if (url.pathname.startsWith('/android-beta/')) return json({ error: 'This resource has been retired.' }, 410);

  if (url.pathname === '/privacy' || url.pathname === '/privacy/') {
    return redirect(new URL('/privacy.html', url).href);
  }
  if (url.pathname === '/') url.pathname = '/index.html';
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  fetch: handle,
  // Ignore any scheduled event still in flight while Cloudflare removes the old trigger.
  async scheduled() {},
};
