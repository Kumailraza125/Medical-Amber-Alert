import {createStaffAccess} from './lib/staff-access.js';
import {applyAction,canRead,safeReason,resourceName} from './lib/request-workflow.js';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Piezas, createReportProblemRoute } from '@piezas/sdk';
import { hospitals, resources } from './dist/seed.js';
import { createReadiness } from './lib/readiness.js';
import { noteHasSensitiveDetails } from './lib/coordination-note.js';
import {eligibleHospitals,canonicalResource,routingStates} from './dist/request-utils.js';

const testing = process.argv.includes('--test');
const apiKey = testing ? process.env.PIEZAS_TEST_API_KEY : process.env.PIEZAS_API_KEY;
if (!apiKey) throw new Error('Piezas connection is missing. Configure the server before starting.');
const piezas = new Piezas({ apiKey, apiBaseUrl: process.env.PIEZAS_API_URL || 'https://api.piezas.ai' });
const reports = createReportProblemRoute({ piezas });
const access=createStaffAccess({piezas,testing});
const entitySlug = testing ? 'hospital_connect_test_demo_request' : 'hospital_connect_shared_demo_request';
let storePromise;
function store() {
  if (!storePromise) storePromise = (async()=>{
    // Add optional routing metadata without rewriting existing request values.
    const prior=(await piezas.entities.listSchemas()).find(s=>s.slug===entitySlug);
    if(prior){
      const properties=prior.jsonSchema?.properties||{};
      if(!properties.delivery||properties.resource?.enum||properties.resource?.maxLength!==80)await piezas.entities.updateSchema(prior.id,{jsonSchema:{...prior.jsonSchema,properties:{...properties,delivery:{type:'string'},resource:{type:'string',minLength:2,maxLength:80}}}});
    }
    const definitions={fields:{
      displayId:{type:'text',required:true},hospitalId:{type:'text',required:true},
      resource:{type:'text',required:true},urgency:{type:'select',options:['Routine','Urgent','Critical'],required:true},
      radiusKm:{type:'integer',required:true},note:{type:'longtext'},createdAt:{type:'number',required:true},
      responses:{type:'longtext',required:true},acceptedHospitalId:{type:'text'},delivery:{type:'longtext'},
    }};
    return (await piezas.defineEntities({[entitySlug]:definitions}))[entitySlug];
  })().catch(e=>{storePromise=undefined;throw e;});
  return storePromise;
}
const hospital = id => hospitals.find(h => h.id === id);
const sharedTag = 'hospital-connect-shared-demo-v1';
const testPrefix = 'hospital-connect-test-';
function scope(req, res) {
  if (!testing) return sharedTag;
  const value = /(?:^|;\s*)hc_test=([a-f0-9-]{36})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
  const id = value || randomUUID();
  if (!value) res.setHeader('Set-Cookie', `hc_test=${id}; Path=/; HttpOnly; SameSite=Strict`);
  return testPrefix + id;
}
const decode = r => ({ ...r.data, id:r.data.displayId, status:r.status, responses:JSON.parse(r.data.responses || '[]'), delivery:r.data.delivery?JSON.parse(r.data.delivery):null, recordId:r.id });
function encode(r) {
  const { id, recordId, status, delivery, ...data } = r;
  return { title:id, status, data:{ ...data, displayId:id, responses:JSON.stringify(r.responses),...(r.delivery?{delivery:JSON.stringify(r.delivery)}:{}) } };
}
async function records(tag) {
  const client = await store(), all = [];
  for (let offset = 0;; offset += 100) {
    const page = await client.list({ tag, limit:100, offset, sort:'created_at', order:'desc' });
    all.push(...page.data);
    if (page.data.length < 100) break;
  }
  return all;
}
// Shared hosting runs one app process. Serialize mutations and seed discovery,
// re-reading Piezas inside the lock; business records are never cached locally.
let tail = Promise.resolve();
function serial(fn) {
  const next = tail.then(fn);
  tail = next.catch(() => {});
  return next;
}
function fail(status, message) { throw Object.assign(new Error(message), { status, userFacing:true }); }
async function body(req, limit = 8192) {
  let size = 0, chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, 'Please shorten your request.');
    chunks.push(chunk);
  }
  try { const value=JSON.parse(Buffer.concat(chunks).toString());if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'Please send valid form fields.');return value; }
  catch { fail(400, 'Please send a valid request.'); }
}
function json(res, status, value) {
  res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(value));
}
const readiness=createReadiness({piezas,testing});
const emsDesk=id=>({type:'ems',agentId:`ems-${id}`,baseHospitalId:id,name:`${hospital(id).short} EMS desk`});
function notifications(rows,base){
 return rows.filter(r=>r.hospitalId===base&&r.acceptedHospitalId&&r.delivery?.acceptanceMode==='hospital-direct'&&Number.isFinite(r.delivery.acceptedAt)).map(r=>({
  id:`acceptance-${r.recordId}`,requestId:r.id,recordId:r.recordId,hospitalId:r.acceptedHospitalId,hospitalName:hospital(r.acceptedHospitalId).name,acceptedAt:r.delivery.acceptedAt,readAt:r.delivery.notificationReadAt||null,status:r.status,receivingAt:r.delivery.receivingAt||null,
 })).sort((a,b)=>b.acceptedAt-a.acceptedAt);
}
async function recordRouting(tag,r,targetHospitalId){
 const ready=await readiness.get(tag),states=routingStates(ready.facilities);
 const at=Date.now();
 r.delivery={requester:emsDesk(r.hospitalId)};
 const ids=eligibleHospitals(r,states).map(h=>h.id);
 if(!ids.length)fail(409,'No open hospitals match this resource and radius. Change the search before sending.');
 if(targetHospitalId&&!ids.includes(targetHospitalId))fail(409,'That hospital is not currently available for this resource and radius. Refresh and choose another.');
 r.delivery={requester:emsDesk(r.hospitalId),source:'saved-at-send',recordedAt:at,recipientIds:targetHospitalId?[targetHospitalId]:ids,events:[{action:'sent',actorType:'ems',hospitalId:r.hospitalId,at}]};
 return r;
}
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, existsSync(path.join(here,'public')) ? 'public' : 'dist');
const args=process.argv.slice(2), index=args.indexOf('--port');
const port=Number(index>=0 ? args[index+1] : process.env.PORT || 3100);
let rateStart = Date.now(), writes = 0;
http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  try {
    const url=new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') return json(res,200,{ok:true});
    if (req.method === 'POST') {
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail(403,'Open this demo directly to make a change.');
      if (Date.now()-rateStart>60000) { rateStart=Date.now(); writes=0; }
      if (++writes>120) fail(429,'The shared demo is busy. Please try again in a minute.');
    }
    if(['/', '/index.html','/network.html','/requests.html','/hospital.html','/staff.html'].includes(url.pathname)&&!/(?:^|;\s*)hc_session=[^;]+/.test(req.headers.cookie||'')){res.writeHead(302,{Location:'/login.html','Cache-Control':'no-store'});return res.end();}
    const tag=scope(req,res);
    if(url.pathname==='/api/auth/config'&&req.method==='GET'){await serial(()=>access.bootstrap(tag));return json(res,200,{sampleOnly:true});}
    if(url.pathname==='/api/auth/login'&&req.method==='POST'){const input=await body(req);try{return json(res,200,await serial(()=>access.login(req,res,tag,input)));}catch(e){if(['invalid_credentials','account_pending','invalid_mfa_code','invalid_challenge'].includes(e.code))fail(401,'Sign-in failed. Check the sample credentials, approval status or verification code.');throw e;}}
    if(url.pathname==='/api/auth/register'&&req.method==='POST'){const input=await body(req);if(Object.keys(input).some(k=>!['email','password','name','employeeNumber','requestedRole','facilityId'].includes(k))||!hospital(input.facilityId))fail(400,'Use only the sample staff registration fields.');try{return json(res,201,await serial(()=>access.register(tag,input)));}catch(e){if(e.code==='email_exists'||e.code==='user_exists')fail(409,'This sample email is already registered.');throw e;}}
    if(url.pathname==='/api/auth/logout'&&req.method==='POST'){await access.logout(req,res);return json(res,200,{ok:true});}
    if(url.pathname==='/api/piezas/report'&&['GET','POST'].includes(req.method)){const input=req.method==='POST'?JSON.stringify(await body(req,600000)):undefined;const response=await reports[req.method](new Request(`http://${req.headers.host}${url.pathname}`,{method:req.method,headers:req.headers,body:input}));res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));}
    if(url.pathname==='/workspace.html'){res.writeHead(302,{Location:'/'});return res.end();}
    let actor;
    if(url.pathname.startsWith('/api/'))actor=await access.actor(req,res,tag);
    if(url.pathname==='/api/auth/me'&&req.method==='GET')return json(res,200,{actor,sampleOnly:true});
    if(url.pathname==='/api/policy'&&req.method==='GET')return json(res,200,await access.policy(tag));
    if(url.pathname==='/api/staff'&&req.method==='GET'){if(actor.role!=='admin')fail(403,'Administrator access required.');return json(res,200,{staff:(await access.list(tag,'staff')).map(r=>r.value),audit:(await access.list(tag,'audit')).map(r=>r.value)});}
    if(url.pathname==='/api/policy'&&req.method==='POST'){if(actor.role!=='admin')fail(403,'Administrator access required.');const input=await body(req);if(!Number.isInteger(input.responseMinutes)||input.responseMinutes<1||input.responseMinutes>1440||typeof input.backupContact!=='string'||!input.backupContact.startsWith('DEMO')||input.backupContact.length>200)fail(400,'Use a 1–1440 minute sample target and a DEMO backup contact.');safeReason(input.backupContact);const policy={...await access.policy(tag),responseMinutes:input.responseMinutes,backupContact:input.backupContact};await serial(async()=>{await access.put(tag,'policy','coordination',policy);await access.audit(tag,actor,'policy-updated','coordination');});return json(res,200,policy);}
    const staffAction=/^\/api\/staff\/([a-f0-9-]{36})$/.exec(url.pathname);
    if(staffAction&&req.method==='POST'){const input=await body(req);if(input.status==='approved'&&!hospital(input.facilityId))fail(400,'Choose an assigned sample facility.');input.reason=safeReason(input.reason);return json(res,200,await serial(()=>access.approve(tag,actor,staffAction[1],input)));}
    if(url.pathname==='/api/readiness'&&req.method==='GET')return json(res,200,await readiness.get(tag));
    const facility=/^\/api\/readiness\/([a-z]+)$/.exec(url.pathname);
    if(facility&&req.method==='POST'){if(actor.role!=='hospital'||actor.facilityId!==facility[1])fail(403,'Only staff assigned to this hospital can update availability.');const input=await body(req);if(input.acceptingRequests!==undefined&&typeof input.acceptingRequests!=='boolean')fail(400,'Choose whether to receive EMS requests.');if(input.state!==undefined&&!['Open','Limited','Closed'].includes(input.state)||input.state===undefined&&input.acceptingRequests===undefined)fail(400,'Choose availability or whether to receive EMS requests.');return await serial(async()=>{const saved=await readiness.set(tag,facility[1],input.state,actor,input.acceptingRequests);await access.audit(tag,actor,input.acceptingRequests===undefined?'availability-updated':input.acceptingRequests?'ems-receiving-activated':'ems-receiving-paused',facility[1]);return json(res,200,saved);});}
    if((url.pathname==='/api/requests'||url.pathname==='/api/notifications')&&req.method==='GET'){const ready=await readiness.get(tag),states=routingStates(ready.facilities);const rows=(await records(tag)).map(decode).filter(r=>canRead(r,actor,states)).sort((a,b)=>b.createdAt-a.createdAt);const base=url.searchParams.get('emsBaseId');if(base&&actor.role==='ems'&&base!==actor.facilityId)fail(403,'Use your assigned EMS base.');const notices=actor.role==='ems'?notifications(rows,actor.facilityId):[];return json(res,200,url.pathname==='/api/notifications'?{notifications:notices}:{requests:rows,notifications:notices});}
    if(url.pathname==='/api/requests'&&req.method==='POST'){if(actor.role!=='ems')fail(403,'Only EMS staff can submit requests.');const input=await body(req);if(Object.keys(input).some(k=>!['emsBaseId','hospitalId','resource','urgency','radiusKm','note','targetHospitalId','adminHelpRequested'].includes(k)))fail(400,'Use only resource coordination fields. Real patient data is not accepted.');if((input.emsBaseId||input.hospitalId)&&((input.emsBaseId||input.hospitalId)!==actor.facilityId))fail(403,'Use your assigned EMS base.');input.resource=resourceName(input.resource);if(!input.resource||!['Urgent','Critical'].includes(input.urgency)||!Number.isInteger(input.radiusKm)||input.radiusKm<1||input.radiusKm>500)fail(400,'Check the supported resource, priority and radius.');if(input.adminHelpRequested!==undefined&&typeof input.adminHelpRequested!=='boolean')fail(400,'Choose whether to request administrator help.');input.note=safeReason(input.note,false);
     return await serial(async()=>{const rows=await records(tag),number=Math.max(1042,...rows.map(r=>Number(r.data.displayId.slice(3))||0))+1,policy=await access.policy(tag);const r={id:`HC-${number}`,hospitalId:actor.facilityId,resource:input.resource,urgency:input.urgency,radiusKm:input.radiusKm,note:input.note,createdAt:Date.now(),status:'Submitted',responses:[]};if(!resources.includes(input.resource)||input.adminHelpRequested===true){if(input.targetHospitalId)fail(400,'Administrator-help requests cannot be sent directly to a hospital.');r.status='Needs admin';r.delivery={source:'admin-help',recordedAt:r.createdAt,recipientIds:[],events:[{action:'admin-help-requested',actorType:'ems',hospitalId:actor.facilityId,at:r.createdAt}],adminHelp:{status:'new',requestedAt:r.createdAt}};}else await recordRouting(tag,r,input.targetHospitalId);r.delivery.requester={type:'ems',userId:actor.userId,name:actor.name,baseHospitalId:actor.facilityId};r.delivery.events[0]={...r.delivery.events[0],userId:actor.userId,name:actor.name};r.delivery.responseTargetAt=r.createdAt+policy.responseMinutes*60000;const saved=decode(await (await store()).create({...encode(r),tags:[tag]}));await access.audit(tag,actor,'submitted',saved.id);return json(res,201,{request:saved});});}
    const action=/^\/api\/requests\/([a-f0-9-]{36})\/([a-z-]+)$/.exec(url.pathname);
    if(action&&req.method==='POST'){const input=await body(req);return await serial(async()=>{const client=await store(),row=await client.get(action[1]);if(row.entityTypeId!==client.getEntityTypeId()||!row.tags.includes(tag))fail(404,'Request not found.');const r=decode(row),ready=await readiness.get(tag),states=routingStates(ready.facilities);if(!canRead(r,actor,states))fail(404,'Request not found.');if(action[2]==='delete'){if(actor.role!=='admin')fail(403,'Only the sample administrator can delete example requests.');if(input.reference!==r.id)fail(400,'Enter the exact request reference to confirm deletion.');const reason=safeReason(input.reason);await access.audit(tag,actor,'deletion-requested',r.id,reason);await client.delete(row.id);await access.audit(tag,actor,'request-deleted',r.id,reason);return json(res,200,{deleted:r.id});}await applyAction({r,action:action[2],input,a:actor,ready,policy:await access.policy(tag)});if(['direct-accept','direct-reconfirm'].includes(action[2])&&!ready.facilities.find(f=>f.id===actor.facilityId)?.updatedAt){const published=await readiness.set(tag,actor.facilityId,ready.facilities.find(f=>f.id===actor.facilityId).state,actor);r.delivery.availabilityVersion=published.facilities.find(f=>f.id===actor.facilityId).updatedAt;await access.audit(tag,actor,'availability-published-with-acceptance',actor.facilityId);}const saved=decode(await client.update(row.id,encode(r)));if(action[2]!=='notification-read')await access.audit(tag,actor,action[2],r.id);return json(res,200,{request:saved});});}
    if(url.pathname.startsWith('/api/'))fail(404,'That feature is not part of the current EMS workflow.');
    if (!['GET','HEAD'].includes(req.method)) fail(405,'That action is not supported.');
    const files={'/login.html':'login.html','/login.js':'login.js','/staff.html':'staff.html','/staff.js':'staff.js','/sample-staff.js':'sample-staff.js','/access.css':'access.css','/data-care.html':'data-care.html','/logo.svg':'logo.svg','/coordination-flow.svg':'coordination-flow.svg','/brand.css':'brand.css','/ui-visuals.js':'ui-visuals.js','/':'index.html','/index.html':'index.html','/about.html':'about.html','/about.js':'about.js','/about.css':'about.css','/app.js':'app.js','/request-utils.js':'request-utils.js','/network.html':'network.html','/hospital.html':'hospital.html','/hospital-profile.js':'hospital-profile.js','/requests.html':'network.html','/overview.css':'overview.css','/map-bundle.js':'map-bundle.js','/map-bundle.css':'map-bundle.css','/map-attribution.txt':'map-attribution.txt','/seed.js':'seed.js','/core.css':'core.css','/workspace.css':'workspace.css','/report-widget.js':'report-widget.js'};
    const file=files[url.pathname];
    if (!file) fail(404,'Page not found.');
    const data=await readFile(path.join(root,file));
    res.writeHead(200,{'Content-Type':({'.svg':'image/svg+xml','.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'})[path.extname(file)],'Cache-Control':'no-cache'});
    res.end(req.method==='HEAD' ? undefined : data);
  } catch (e) {
    const status=e.userFacing ? e.status : 503;
    // Do not send upstream error details or credentials to the browser.
    if (!res.headersSent) json(res,status,{error:e.userFacing ? e.message : 'Saved coordination data is unavailable. Retry; if this is urgent, use your team’s established offline backup process.'});
    else res.end();
    if (!e.userFacing) console.error('Piezas request failed:', e.code || e.name);
  }
}).listen(port,'0.0.0.0',()=>console.log(`Hospital Connect listening on ${port}`));
