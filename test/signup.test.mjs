import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handle, enroll } from '../worker/index.mjs';
import { hashToken, validateSignup } from '../worker/validation.mjs';
const invite='a'.repeat(40);
const good={invite,firstName:' Test ',email:' TEST@example.com ',deviceType:'tablet',adult:true,consent:true,turnstileToken:'test'};
async function setup(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_beta.sql',import.meta.url),'utf8'));
 db.prepare('INSERT INTO invitations VALUES (?,?,?,1)').run(await hashToken(invite),'test',Date.now()+60000);
 const env={BETA_DB:{prepare(sql){return {bind(...args){const s=db.prepare(sql);return {run:async()=>s.run(...args),first:async()=>s.get(...args),all:async()=>({results:s.all(...args)})}}}}},BETA_ACCEPTING:'true',BETA_OPEN:'false',TURNSTILE_SECRET:'test',TURNSTILE_SITE_KEY:'test',BETA_RATE_LIMIT:{limit:async()=>({success:true})},GOOGLE_SERVICE_ACCOUNT_JSON:'{}',GOOGLE_ADMIN_EMAIL:'admin@example.com',GOOGLE_GROUP_EMAIL:'beta@example.com'};
 const deps={fetch:async()=>Response.json({success:true,hostname:'example.com',action:'beta_signup'}),addMember:async()=>{}};
 const send=(data=good,path='signup',headers={})=>handle(new Request('https://example.com/api/beta/'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)}),env,deps);
 return {db,env,deps,send};
}
test('adult consent required and only expected fields retained',()=>{assert.throws(()=>validateSignup({...good,adult:false}));assert.throws(()=>validateSignup({...good,consent:false}));assert.equal(validateSignup(good).email,'test@example.com');assert.equal(validateSignup({...good,childName:'ignored'}).childName,undefined)});
test('duplicate signup persists once and does not overwrite details',async()=>{const{db,send}=await setup();assert.equal((await send()).status,200);assert.equal((await send({...good,firstName:'Changed'})).status,200);assert.equal(db.prepare('SELECT count(*) n FROM signups').get().n,1);assert.equal(db.prepare('SELECT first_name FROM signups').get().first_name,'Test')});
test('closed beta never exposes install link',async()=>{const{send}=await setup();assert.deepEqual(await(await send()).json(),{registered:true,ready:false,playUrl:null})});
test('open beta requires successful membership',async()=>{const{env,send}=await setup();env.BETA_OPEN='true';assert.equal((await(await send()).json()).ready,true)});
test('provider failure saves pending record and retry succeeds',async()=>{const{db,env,deps,send}=await setup();deps.addMember=async()=>{throw Error('credential detail never stored')};assert.equal((await send()).status,200);const row=db.prepare('SELECT * FROM signups').get();assert.equal(row.last_error,'enrollment_unavailable');assert.equal(row.member_status,'pending');assert.equal(await enroll(row,env,async()=>{}),'added')});
test('invalid and expired invitations reject without saving',async()=>{const{db,send}=await setup();assert.equal((await send({...good,invite:'invalid'})).status,403);db.exec('UPDATE invitations SET expires_at=0');assert.equal((await send()).status,403);assert.equal(db.prepare('SELECT count(*) n FROM signups').get().n,0)});
test('cross origin, oversized payload and rate limit rejected',async()=>{const{send,env}=await setup();assert.equal((await send(good,'signup',{Origin:'https://evil.example'})).status,403);assert.equal((await send({...good,extra:'a'.repeat(9000)})).status,413);env.BETA_RATE_LIMIT.limit=async()=>({success:false});assert.equal((await send()).status,429)});
test('Turnstile hostname and action must match',async()=>{const{send,deps}=await setup();for(const result of [{success:false},{success:true,hostname:'evil.example',action:'beta_signup'},{success:true,hostname:'example.com',action:'other'}]){deps.fetch=async()=>Response.json(result);assert.equal((await send()).status,400)}});
test('unconfigured signup fails closed',async()=>{const{send,env}=await setup();env.BETA_ACCEPTING='false';assert.equal((await send()).status,503)});
test('homepage and beta directory resolve explicit index assets',async()=>{for(const[path,expected]of [['/','/index.html'],['/android-beta/','/android-beta/index.html']]){let actual;await handle(new Request('https://example.com'+path),{ASSETS:{fetch:async r=>{actual=new URL(r.url).pathname;return new Response('ok')}}});assert.equal(actual,expected)}});
