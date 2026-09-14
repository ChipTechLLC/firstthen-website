import { CONSENT_VERSION, HttpError, validateSignup, hashToken, readJSON } from './validation.mjs';
import { addGroupMember, groupConfigured } from './google-group.mjs';
const PLAY_URL = 'https://play.google.com/apps/testing/com.chiptechllc.firstthenboardandroid';
const json = (body, status = 200) => Response.json(body, { status, headers:{
  'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
}});
export async function enroll(row, env, addMember = addGroupMember) {
  if (row.member_status === 'added' || !groupConfigured(env) || row.attempts >= 5) return row.member_status;
  try {
    await addMember(row.email, env);
    await env.BETA_DB.prepare("UPDATE signups SET member_status='added', attempts=attempts+1, last_error=NULL, updated_at=? WHERE id=?")
      .bind(Date.now(), row.id).run();
    return 'added';
  } catch (error) {
    // Store only a short diagnostic code, never provider responses or credentials.
    const code = /^google_[a-z_]+_\d{3}$/.test(error.message) ? error.message : 'enrollment_unavailable';
    await env.BETA_DB.prepare('UPDATE signups SET attempts=attempts+1, last_error=?, updated_at=? WHERE id=?')
      .bind(code, Date.now(), row.id).run();
    return 'pending';
  }
}
export async function handle(request, env, dependencies = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) {
    if (url.pathname === '/') url.pathname = '/index.html';
    if (url.pathname === '/android-beta' || url.pathname === '/android-beta/') url.pathname = '/android-beta/index.html';
    return env.ASSETS.fetch(new Request(url, request));
  }
  if (!['/api/beta/config','/api/beta/signup'].includes(url.pathname)) return json({ error:'Not found.' },404);
  if (request.method !== 'POST') return json({ error:'Method not allowed.' },405);
  try {
    if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) throw new HttpError(403,'Please use the signup page on this website.');
    if (!env.BETA_DB || env.BETA_ACCEPTING !== 'true' || !env.TURNSTILE_SECRET || !env.TURNSTILE_SITE_KEY || !env.BETA_RATE_LIMIT) {
      throw new HttpError(503,'Signup is being prepared. Please check back soon.');
    }
    const limit = await env.BETA_RATE_LIMIT.limit({ key:request.headers.get('CF-Connecting-IP') || 'unknown' });
    if (!limit.success) throw new HttpError(429,'Too many attempts. Please wait a minute and try again.');
    const data = await readJSON(request);
    const invitation = await env.BETA_DB.prepare('SELECT campaign FROM invitations WHERE token_hash=? AND enabled=1 AND expires_at>?')
      .bind(await hashToken(data.invite), Date.now()).first();
    if (!invitation) throw new HttpError(403,'This invitation has expired. Please ask for a new QR code.');
    if (url.pathname === '/api/beta/config') return json({ siteKey:env.TURNSTILE_SITE_KEY, betaOpen:env.BETA_OPEN === 'true' });
    const signup = validateSignup(data);
    if (typeof data.turnstileToken !== 'string' || data.turnstileToken.length > 2048) throw new HttpError(400,'Please complete the security check.');
    const fetcher = dependencies.fetch || fetch;
    const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST', signal:AbortSignal.timeout(10000),
      body:new URLSearchParams({ secret:env.TURNSTILE_SECRET, response:data.turnstileToken }),
    });
    if (!verification.ok) throw new HttpError(503,'The security check is unavailable. Please try again.');
    const verified = await verification.json();
    if (!verified.success || verified.hostname !== url.hostname || verified.action !== 'beta_signup') throw new HttpError(400,'The security check expired. Please try again.');
    const now = Date.now();
    await env.BETA_DB.prepare('INSERT INTO signups (id,email,first_name,device_type,device_model,campaign,consent_version,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING')
      .bind(crypto.randomUUID(),signup.email,signup.firstName,signup.deviceType,signup.deviceModel,invitation.campaign,CONSENT_VERSION,now,now).run();
    const row = await env.BETA_DB.prepare('SELECT id,email,member_status,attempts FROM signups WHERE email=?').bind(signup.email).first();
    const status = await enroll(row,env,dependencies.addMember);
    const ready = status === 'added' && env.BETA_OPEN === 'true';
    return json({ registered:true, ready, playUrl:ready ? PLAY_URL : null });
  } catch (error) {
    if (error instanceof HttpError) return json({ error:error.message },error.status);
    return json({ error:'We could not finish the signup. Please try again. Your details may already have been saved; retrying will not create a duplicate.' },503);
  }
}
export default {
  fetch:handle,
  async scheduled(_event, env) {
    if (!env.BETA_DB || !groupConfigured(env)) return;
    const rows = await env.BETA_DB.prepare("SELECT id,email,member_status,attempts FROM signups WHERE member_status='pending' AND attempts<5 ORDER BY created_at LIMIT 20").all();
    for (const row of rows.results) await enroll(row,env);
  },
};
