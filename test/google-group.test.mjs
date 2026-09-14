import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { addGroupMember } from '../worker/google-group.mjs';
test('membership uses signed delegated JWT with only group member scope, and disables mail delivery',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const env={GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:'test@example.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})}),GOOGLE_ADMIN_EMAIL:'admin@example.com',GOOGLE_GROUP_EMAIL:'beta@example.com'};
 let tokenCalls=0,memberCalls=0;
 const fetcher=async(url,options)=>{
 if(url==='https://oauth2.googleapis.com/token'){
 tokenCalls++;
 const jwt=options.body.get('assertion');const[h,p,s]=jwt.split('.');
 assert.equal(verify('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url')),true);
 const claims=JSON.parse(Buffer.from(p,'base64url'));
 assert.equal(claims.sub,env.GOOGLE_ADMIN_EMAIL);assert.equal(claims.scope,'https://www.googleapis.com/auth/admin.directory.group.member');
 return Response.json({access_token:'test-only',expires_in:3600});
 }
 memberCalls++;assert.equal(url,'https://admin.googleapis.com/admin/directory/v1/groups/beta%40example.com/members');
 assert.deepEqual(JSON.parse(options.body),{email:'tester@example.com',role:'MEMBER',delivery_settings:'NONE'});
 return new Response(null,{status:409});
 };
 await addGroupMember('tester@example.com',env,fetcher);await addGroupMember('tester@example.com',env,fetcher);
 assert.equal(tokenCalls,1);assert.equal(memberCalls,2);
 await assert.rejects(addGroupMember('tester@example.com',env,async()=>new Response(null,{status:403})),/google_membership_403/);
});
