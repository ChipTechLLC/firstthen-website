export const PLAY_URL = 'https://play.google.com/apps/testing/com.chiptechllc.firstthenboardandroid';
export function notificationMessage(kind) {
  if (kind === 'launch') return {
    subject:'Your First Then Board Android beta is ready',
    text:`Thanks for joining the First Then Board Android beta. Your Google account has been added to our tester group.\n\nTo install:\n1. Open ${PLAY_URL}\n2. Sign in with the same Google account you used to register.\n3. Select Become a tester, then follow the Google Play link to install.\n\nIf access does not appear immediately, allow some time for Google group eligibility to update and try again.\n\nTry the app during your usual routines and tell us what works or needs improvement. Please plan to stay enrolled for at least 14 days. Participation is voluntary.\n\nSend feedback or request removal from beta emails by replying to this message. Please do not include a child's name or medical information.\n\nChipTech LLC\nhttps://chiptechllc.com/android-beta/privacy.html`,
  };
  return {
    subject:"You're on the First Then Board Android beta list",
    text:`Thanks for signing up to help test First Then Board on Android.\n\nWe have saved your registration. The closed beta is not available to install yet. We will email this address with the Google Play invitation when access is ready. There is nothing else you need to do now.\n\nWhen it opens, use the same Google account you registered with to accept the invitation and install the app.\n\nQuestions or want to leave the beta email list? Reply to this message. Please do not include a child's name or medical information.\n\nChipTech LLC\nhttps://chiptechllc.com/android-beta/privacy.html`,
  };
}
export function mailConfigured(env) {
  return env.BETA_EMAIL_ENABLED === 'true' && Boolean(env.BETA_EMAIL_FROM && env.EMAIL);
}
export async function sendNotification(row, env) {
  const content=notificationMessage(row.kind);
  return (await env.EMAIL.send({from:{email:env.BETA_EMAIL_FROM,name:'First Then Board'},to:row.email,replyTo:'support@chiptechllc.com',...content})).messageId;
}
// Only the scheduled worker sends mail. A unique row and atomic claim prevent
// concurrent cron runs or repeat signups from sending the same notification.
export async function processNotifications(env, send=sendNotification, now=Date.now()) {
  if(!mailConfigured(env)) return;
  const db=env.BETA_DB;
  const kind=env.BETA_OPEN==='true'?'launch':'welcome';
  await db.prepare(`INSERT OR IGNORE INTO beta_notifications(signup_id,kind,updated_at)
    SELECT id,?,? FROM signups WHERE (?='welcome' OR member_status='added')`).bind(kind,now,kind).run();
  // A crashed/ambiguous send requires inspection, rather than risking duplicate mail.
  await db.prepare("UPDATE beta_notifications SET status='unknown',last_error='send_interrupted',updated_at=? WHERE status='sending' AND updated_at<?").bind(now,now-10*60*1000).run();
  const rows=await db.prepare(`SELECT n.*,s.email FROM beta_notifications n JOIN signups s ON s.id=n.signup_id
    WHERE n.kind=? AND n.status='pending' AND n.next_attempt_at<=? AND n.attempts<8
    AND (?='welcome' OR s.member_status='added') ORDER BY s.created_at LIMIT 10`).bind(kind,now,kind).all();
  const day=new Date(now).toISOString().slice(0,10);
  await db.prepare('INSERT OR IGNORE INTO beta_email_budget(day,attempts) VALUES (?,0)').bind(day).run();
  for(const row of rows.results){
    // Limit this signup service to 90 send attempts per UTC day (2,790/month).
    const budget=await db.prepare('UPDATE beta_email_budget SET attempts=attempts+1 WHERE day=? AND attempts<90 RETURNING day').bind(day).first();
    if(!budget) break;
    const claimed=await db.prepare("UPDATE beta_notifications SET status='sending',attempts=attempts+1,updated_at=? WHERE signup_id=? AND kind=? AND status='pending' RETURNING signup_id").bind(now,row.signup_id,row.kind).first();
    if(!claimed) continue;
    try {
      const id=await send(row,env);
      if(!id) throw new Error('Missing provider receipt');
      await db.prepare("UPDATE beta_notifications SET status='sent',provider_id=?,last_error=NULL,updated_at=? WHERE signup_id=? AND kind=?").bind(id,now,row.signup_id,row.kind).run();
    } catch(error) {
      const code=/^(E_[A-Z_]+|HTTP_\d{3})$/.test(error.code||'')?error.code:'send_unconfirmed';
      const retry=['E_RATE_LIMIT_EXCEEDED','E_DAILY_LIMIT_EXCEEDED'].includes(code);
      const delay=code==='E_DAILY_LIMIT_EXCEEDED'?24*60*60*1000:15*60*1000;
      await db.prepare('UPDATE beta_notifications SET status=?,last_error=?,next_attempt_at=?,updated_at=? WHERE signup_id=? AND kind=?').bind(retry?'pending':'unknown',code,now+delay,now,row.signup_id,row.kind).run();
    }
  }
}
