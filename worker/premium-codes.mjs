import { mailConfigured, PLAY_URL } from './notifications.mjs';
export function premiumMessage(row) {
 const fmt=t=>new Date(t).toLocaleString('en-US',{timeZone:'America/Denver',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'});
 return {subject:'Your free lifetime Premium code for First Then Board',text:`Hi ${row.first_name},\n\nThanks for helping test First Then Board! As a thank-you, here is your individual code for free lifetime Premium on Android. There is no renewing subscription and no payment required.\n\nYour code: ${row.code}\nRedeem: https://play.google.com/redeem?code=${encodeURIComponent(row.code)}\n\nYour code can be redeemed from ${fmt(row.activates_at)} through ${fmt(row.expires_at)}. If the start time has not arrived yet, please wait until then. The deadline applies only to redeeming the code. Your Premium access continues afterward.\n\n1. Join the beta and install the app: ${PLAY_URL}\nSign in with the same Google account you used to sign up, select Become a tester, and follow the Google Play download link.\n2. Open your redemption link while signed into that same account. You can also open Play Store > profile picture > Payments & subscriptions > Redeem code and enter your code. Confirm that Google shows First Then Board Premium (Lifetime) at no charge.\n3. Reopen First Then Board. If Premium does not appear, open Upgrade and select Restore Purchases.\n\nTry the timers, saved boards, profiles, and other Premium features during your normal routines. Please stay opted in for at least 14 days if you can. Participation is voluntary, and no positive review or rating is required.\n\nFor help or feedback, use Send feedback in the app menu or reply to this email. Please do not include children's names, photos, or medical information.\n\nEach code can be redeemed once for the Android lifetime product and has no cash value. Codes cannot be sold. Use the Google account you want to keep Premium on. This does not unlock the separate iOS purchase. International beta availability is expanding and may depend on Google Play review and rollout. Premium redemption also depends on Google Play availability in your country. Reply if you need help.\n\nThanks,\nAngelo\nChipTech LLC\n\nReply if you would like to stop receiving beta emails.\nhttps://chiptechllc.com/android-beta/privacy.html`};
}
// Only explicitly assigned codes are sent; no automatic grants to future signups.
export async function processPremiumCodes(env, now=Date.now()) {
 if(!mailConfigured(env)) return;
 const db=env.BETA_DB;
 await db.prepare("UPDATE beta_premium_codes SET status='unknown',last_error='send_interrupted' WHERE status='sending' AND updated_at<?").bind(now-600000).run();
 const rows=await db.prepare("SELECT p.*,s.email,s.first_name FROM beta_premium_codes p JOIN signups s ON s.id=p.signup_id WHERE p.status='pending' AND p.expires_at>? AND s.member_status='added' ORDER BY s.created_at LIMIT 20").bind(now).all();
 const day=new Date(now).toISOString().slice(0,10);
 await db.prepare('INSERT OR IGNORE INTO beta_email_budget(day,attempts) VALUES (?,0)').bind(day).run();
 for(const row of rows.results) {
  const claim=await db.prepare("UPDATE beta_premium_codes SET status='sending',updated_at=? WHERE signup_id=? AND status='pending' RETURNING signup_id").bind(now,row.signup_id).first();
  if(!claim) continue;
  const budget=await db.prepare('UPDATE beta_email_budget SET attempts=attempts+1 WHERE day=? AND attempts<90 RETURNING day').bind(day).first();
  if(!budget) {await db.prepare("UPDATE beta_premium_codes SET status='pending' WHERE signup_id=?").bind(row.signup_id).run();break;}
  try {
   const receipt=await env.EMAIL.send({from:{email:env.BETA_EMAIL_FROM,name:'First Then Board'},to:row.email,replyTo:'support@chiptechllc.com',...premiumMessage(row)});
   if(!receipt.messageId) throw Error('unconfirmed');
   await db.prepare("UPDATE beta_premium_codes SET status='sent',provider_id=?,updated_at=?,last_error=NULL WHERE signup_id=?").bind(receipt.messageId,now,row.signup_id).run();
  } catch {
   await db.prepare("UPDATE beta_premium_codes SET status='unknown',last_error='send_unconfirmed',updated_at=? WHERE signup_id=?").bind(now,row.signup_id).run();
  }
 }
}
