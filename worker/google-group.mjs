const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/admin.directory.group.member';
let cached;
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
const encode = value => base64url(new TextEncoder().encode(JSON.stringify(value)));
export function groupConfigured(env) {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_JSON && env.GOOGLE_ADMIN_EMAIL && env.GOOGLE_GROUP_EMAIL);
}
async function accessToken(env, fetcher) {
  const account = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now()/1000);
  const identity = `${account.client_email}:${env.GOOGLE_ADMIN_EMAIL}`;
  if (cached?.identity === identity && cached.expires > now + 60) return cached.token;
  const signingInput = `${encode({ alg:'RS256', typ:'JWT' })}.${encode({
    iss:account.client_email, sub:env.GOOGLE_ADMIN_EMAIL, scope:SCOPE,
    aud:TOKEN_URL, iat:now, exp:now + 3600,
  })}`;
  const der = Uint8Array.from(atob(account.private_key.replace(/-----[^-]+-----/g,'').replace(/\s/g,'')), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name:'RSASSA-PKCS1-v1_5', hash:'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput));
  const response = await fetcher(TOKEN_URL, {
    method:'POST', signal:AbortSignal.timeout(10000),
    body:new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:`${signingInput}.${base64url(new Uint8Array(signature))}` }),
  });
  if (!response.ok) throw new Error(`google_auth_${response.status}`);
  const data = await response.json();
  if (!data.access_token) throw new Error('google_auth_missing_token');
  cached = { identity, token:data.access_token, expires:now + Math.min(data.expires_in || 3600, 3600) };
  return data.access_token;
}
export async function addGroupMember(email, env, fetcher = fetch) {
  const token = await accessToken(env, fetcher);
  const response = await fetcher(`https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(env.GOOGLE_GROUP_EMAIL)}/members`, {
    method:'POST', signal:AbortSignal.timeout(10000),
    headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ email, role:'MEMBER', delivery_settings:'NONE' }),
  });
  if (!response.ok && response.status !== 409) throw new Error(`google_membership_${response.status}`);
}
