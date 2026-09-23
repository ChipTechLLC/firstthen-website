import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {processPremiumCodes} from '../worker/premium-codes.mjs';
function setup(){
 const db=new DatabaseSync(':memory:');
 for(const f of ['0001_beta.sql','0002_notifications.sql','0003_premium_codes.sql']) db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 for(const id of ['a','b']) {db.prepare("INSERT INTO signups(id,email,first_name,device_type,campaign,consent_version,created_at,updated_at,member_status) VALUES(?,?,?,'phone','test','2026',1,1,'added')").run(id,id+'@example.com',id); db.prepare("INSERT INTO beta_premium_codes(signup_id,code,promotion_id,activates_at,expires_at,updated_at) VALUES(?,?, 'test',1000,9999999999999,1)").run(id,'CODE'+id);}
 const sent=[];
 const env={BETA_EMAIL_ENABLED:'true',BETA_EMAIL_FROM:'beta@notify.chiptechllc.com',EMAIL:{send:async m=>{sent.push(m);return{messageId:'receipt'+sent.length}}},BETA_DB:{prepare(sql){return{bind(...a){const q=db.prepare(sql);return{run:async()=>q.run(...a),first:async()=>q.get(...a),all:async()=>({results:q.all(...a)})}}}}}};
 return {db,env,sent};
}
test('individual code emails stay private and concurrent runs do not duplicate',async()=>{const {db,env,sent}=setup();await Promise.all([processPremiumCodes(env),processPremiumCodes(env)]);await processPremiumCodes(env);assert.equal(sent.length,2);for(const m of sent){const id=m.to[0];assert.match(m.text,new RegExp('CODE'+id));assert.doesNotMatch(m.text,new RegExp('CODE'+(id==='a'?'b':'a')));assert.equal(m.bcc,undefined);assert.match(m.text,/no payment required/);assert.match(m.text,/Become a tester/);}assert.equal(db.prepare("SELECT COUNT(*) n FROM beta_premium_codes WHERE status='sent' AND provider_id IS NOT NULL").get().n,2);});
test('uncertain delivery is not resent automatically',async()=>{const{db,env}=setup();let attempts=0;env.EMAIL.send=async()=>{attempts++;throw Error('private')};await processPremiumCodes(env);await processPremiumCodes(env);assert.equal(attempts,2);assert.equal(db.prepare("SELECT COUNT(*) n FROM beta_premium_codes WHERE status='unknown'").get().n,2);});
test('disabled mail and unadded members do not receive codes',async()=>{const{db,env,sent}=setup();env.BETA_EMAIL_ENABLED='false';await processPremiumCodes(env);assert.equal(sent.length,0);env.BETA_EMAIL_ENABLED='true';db.exec("UPDATE signups SET member_status='pending'");await processPremiumCodes(env);assert.equal(sent.length,0);});
