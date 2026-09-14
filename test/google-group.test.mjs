import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { addGroupMember } from '../worker/google-group.mjs';
test('membership uses a signed service-account JWT without admin impersonation',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const env={GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({client_email:'test@example.iam.gserviceaccount.com',private_key:privateKey.export({type:'pkcs8',format:'pem'})}),GOOGLE_GROUP_RESOURCE:'groups/test-group',GOOGLE_GROUP_EMAIL:'beta@example.com'};
 let tokenCalls=0,memberCalls=0;
 const fetcher=async(url,options)=>{
 if(url==='https://oauth2.googleapis.com/token'){
 tokenCalls++;
 const jwt=options.body.get('assertion');const[h,p,s]=jwt.split('.');
 assert.equal(verify('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url')),true);
 const claims=JSON.parse(Buffer.from(p,'base64url'));
 assert.equal(claims.sub,undefined);assert.equal(claims.scope,'https://www.googleapis.com/auth/cloud-identity.groups');
 return Response.json({access_token:'test-only',expires_in:3600});
 }
 memberCalls++;assert.equal(url,'https://cloudidentity.googleapis.com/v1/groups/test-group/memberships');
 assert.deepEqual(JSON.parse(options.body),{preferredMemberKey:{id:'tester@example.com'},roles:[{name:'MEMBER'}]});
 return new Response(null,{status:409});
 };
 await addGroupMember('tester@example.com',env,fetcher);await addGroupMember('tester@example.com',env,fetcher);
 assert.equal(tokenCalls,1);assert.equal(memberCalls,2);
 await assert.rejects(addGroupMember('tester@example.com',env,async()=>Response.json({done:false})),/google_membership_pending/);
 await assert.rejects(addGroupMember('tester@example.com',env,async()=>Response.json({done:true,error:{code:7}})),/google_membership_pending/);
 await addGroupMember('tester@example.com',env,async()=>Response.json({done:true,response:{name:'groups/test-group/memberships/test'}}));
 await assert.rejects(addGroupMember('tester@example.com',env,async()=>new Response(null,{status:403})),/google_membership_403/);
});
