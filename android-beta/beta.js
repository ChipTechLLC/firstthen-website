const form = document.querySelector('#signup');
const status = document.querySelector('#status');
const submit = document.querySelector('#submit');
const error = document.querySelector('#form-error');
const invite = new URLSearchParams(location.hash.slice(1)).get('invite') || '';
let verificationToken = '';
let widgetId;
let submitting = false;
async function post(path, data) {
  const response = await fetch(path,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), cache:'no-store' });
  let body;
  try { body = await response.json(); } catch { throw new Error('Signup is temporarily unavailable. Please try again.'); }
  if (!response.ok) throw new Error(body.error || 'Unable to submit. Please try again.');
  return body;
}
async function initialize() {
  if (!invite) { status.textContent = 'Please scan the beta invitation QR code to open this signup form.'; return; }
  try {
    const config = await post('/api/beta/config',{invite});
    if (config.betaOpen) document.querySelector('#release-note').textContent = 'The beta is open in the United States. Sign up, then accept the Google Play invitation to install.';
    form.hidden = false;
    status.hidden = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => {
      widgetId = window.turnstile.render('#security-check',{
        sitekey:config.siteKey, action:'beta_signup', theme:'light', size:'flexible',
        callback: token => { verificationToken = token; submit.disabled = submitting; },
        'expired-callback': () => { verificationToken = ''; submit.disabled = true; },
        'error-callback': () => { verificationToken = ''; submit.disabled = true; error.hidden = false; error.textContent = 'The security check could not load. Please refresh and try again.'; },
      });
    };
    script.onerror = () => { status.hidden = false; status.textContent = 'The security check could not load. Please refresh and try again.'; };
    document.head.append(script);
  } catch (failure) { status.textContent = failure.message; }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity() || !verificationToken) return;
  submitting = true; submit.disabled = true; submit.textContent = 'Saving your signup…'; error.hidden = true;
  const fields = new FormData(form);
  try {
    const result = await post('/api/beta/signup',{
      invite, firstName:fields.get('firstName'), email:fields.get('email'),
      deviceType:fields.get('deviceType'), deviceModel:fields.get('deviceModel'),
      adult:fields.has('adult'), consent:fields.has('consent'), website:fields.get('website'), turnstileToken:verificationToken,
    });
    if (!result.registered) throw new Error('Please try again.');
    document.querySelector('#signup-content').hidden = true;
    document.querySelector('#success').hidden = false;
    document.querySelector('#email-confirmation').hidden = !result.emailNotifications;
    if (result.ready) document.querySelector('#email-confirmation').textContent = 'We’ll also email these installation instructions, usually within 15 minutes. Check your spam folder if you don’t see them.';
    if (result.ready && result.playUrl === 'https://play.google.com/apps/testing/com.chiptechllc.firstthenboardandroid') {
      document.querySelector('#waiting').hidden = true;
      document.querySelector('#ready').hidden = false;
      document.querySelector('#play-link').href = result.playUrl;
    }
    form.reset(); verificationToken = '';
    document.querySelector('#success').focus();
  } catch (failure) {
    error.textContent = failure.message; error.hidden = false;
    verificationToken = ''; window.turnstile?.reset(widgetId);
  } finally { submitting = false; submit.textContent = 'Join the beta list →'; submit.disabled = !verificationToken; }
});
initialize();
