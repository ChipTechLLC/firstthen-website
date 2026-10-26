import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handle } from '../worker/index.mjs';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.chiptechllc.firstthenboardandroid';

const inaccessible = new Proxy({}, { get() { throw new Error('Retired services must not be accessed'); } });

test('old invitation pages redirect to the public listing without forwarding tokens', async () => {
  for (const path of ['/android-beta', '/android-beta/', '/android-beta/index.html']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await handle(new Request(`https://example.com${path}?invite=private-token#invite=private-token`, { method }), inaccessible);
      assert.equal(response.status, 308);
      assert.equal(response.headers.get('Location'), `${PLAY_URL}#`);
      assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
      assert.equal(await response.text(), '');
    }
  }
});

test('old privacy links preserve access to the retained-record notice', async () => {
  for (const path of ['/android-beta/privacy', '/android-beta/privacy/', '/android-beta/privacy.html']) {
    const response = await handle(new Request(`https://example.com${path}?invite=private-token`), inaccessible);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('Location'), 'https://example.com/privacy.html#past-registrations');
  }
});

test('stale signup clients cannot enroll, persist data, or trigger email', async () => {
  for (const path of ['/api/beta', '/api/beta/config', '/api/beta/signup']) {
    for (const method of ['GET', 'POST', 'OPTIONS']) {
      const request = new Request(`https://example.com${path}`, { method, ...(method === 'POST' ? { body: 'not even valid JSON' } : {}) });
      const response = await handle(request, inaccessible);
      assert.equal(response.status, 410);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.deepEqual(await response.json(), {
        error: 'Registration has ended. Download First Then Board directly from Google Play.', playUrl: PLAY_URL,
      });
    }
  }
});

test('posting to a retired invitation page does not redirect user data to Google', async () => {
  const response = await handle(new Request('https://example.com/android-beta/', { method: 'POST', body: 'private-registration' }), inaccessible);
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Location'), null);
});

test('old form scripts and styles are unavailable', async () => {
  for (const path of ['/android-beta/beta.js', '/android-beta/beta.css', '/android-beta/missing.html']) {
    const response = await handle(new Request(`https://example.com${path}`), inaccessible);
    assert.equal(response.status, 410);
  }
});

test('delayed scheduled events have no enrollment or notification side effects', async () => {
  await worker.scheduled({}, inaccessible, inaccessible);
});

test('homepage and static pages still resolve through the assets binding', async () => {
  for (const [path, expected] of [['/', '/index.html'], ['/firstthenboard.html', '/firstthenboard.html'], ['/style.css', '/style.css']]) {
    let actual;
    const response = await handle(new Request('https://example.com' + path), {
      ASSETS: { fetch: async request => { actual = new URL(request.url).pathname; return new Response('static content'); } },
    });
    assert.equal(actual, expected);
    assert.equal(await response.text(), 'static content');
  }
});

test('existing privacy aliases remain usable', async () => {
  for (const path of ['/privacy', '/privacy/']) {
    const response = await handle(new Request('https://example.com' + path), inaccessible);
    assert.equal(response.headers.get('Location'), 'https://example.com/privacy.html');
  }
});

test('unrecognized API endpoints return not found', async () => {
  const response = await handle(new Request('https://example.com/api/missing'), inaccessible);
  assert.equal(response.status, 404);
});
