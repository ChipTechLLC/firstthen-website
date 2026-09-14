export const CONSENT_VERSION = '2026-09-14';
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function validateSignup(data) {
  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const deviceModel = typeof data.deviceModel === 'string' ? data.deviceModel.trim() : '';
  if (!firstName || firstName.length > 60 || /[\x00-\x1f]/.test(firstName)) throw new HttpError(400, 'Please enter your first name.');
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(email)) throw new HttpError(400, 'Please enter the email address you use in Google Play.');
  if (!['phone','tablet','both'].includes(data.deviceType)) throw new HttpError(400, 'Please choose your Android device type.');
  if (deviceModel.length > 100 || /[\x00-\x1f]/.test(deviceModel)) throw new HttpError(400, 'Please shorten the device model.');
  if (data.adult !== true || data.consent !== true) throw new HttpError(400, 'Please confirm both signup checkboxes.');
  if (data.website) throw new HttpError(400, 'Unable to accept this signup.');
  return { firstName, email, deviceType: data.deviceType, deviceModel };
}
export async function hashToken(token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) throw new HttpError(403, 'Please use the invitation link from the QR code.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export async function readJSON(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'Please submit the signup form.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Please submit the signup form.');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new HttpError(413, 'The signup is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new HttpError(400, 'Please check the form and try again.'); }
}
