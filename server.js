import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Piezas, createReportProblemRoute } from '@piezas/sdk';
import { hospitals, resources, seedRequests, distance } from './dist/seed.js';
import { createReadiness } from './lib/readiness.js';
import { noteHasSensitiveDetails } from './lib/coordination-note.js';
import {eligibleHospitals,canonicalResource} from './dist/request-utils.js';

const testing = process.argv.includes('--test');
const apiKey = testing ? process.env.PIEZAS_TEST_API_KEY : process.env.PIEZAS_API_KEY;
if (!apiKey) throw new Error('Piezas connection is missing. Configure the server before starting.');
const piezas = new Piezas({ apiKey, apiBaseUrl: process.env.PIEZAS_API_URL || 'https://api.piezas.ai' });
const reports = createReportProblemRoute({ piezas });
const entitySlug = testing ? 'hospital_connect_test_demo_request' : 'hospital_connect_shared_demo_request';
let storePromise;
function store() {
  if (!storePromise) storePromise = (async()=>{
    // Add optional routing metadata without rewriting existing request values.
    const prior=(await piezas.entities.listSchemas()).find(s=>s.slug===entitySlug);
    if(prior&&!prior.jsonSchema?.properties?.delivery){
      await piezas.entities.updateSchema(prior.id,{jsonSchema:{...prior.jsonSchema,properties:{...prior.jsonSchema.properties,delivery:{type:'string'}}}});
    }
    const definitions={fields:{
      displayId:{type:'text',required:true},hospitalId:{type:'text',required:true},
      resource:{type:'select',options:resources,required:true},urgency:{type:'select',options:['Routine','Urgent','Critical'],required:true},
      radiusKm:{type:'integer',required:true},note:{type:'longtext'},createdAt:{type:'number',required:true},
      responses:{type:'longtext',required:true},acceptedHospitalId:{type:'text'},delivery:{type:'longtext'},
    }};
    return (await piezas.defineEntities({[entitySlug]:definitions}))[entitySlug];
  })().catch(e=>{storePromise=undefined;throw e;});
  return storePromise;
}
const hospital = id => hospitals.find(h => h.id === id);
const matches = (r, id) => id !== r.hospitalId && hospital(id)?.resources.includes(r.resource) && distance(hospital(r.hospitalId), hospital(id)) <= r.radiusKm;
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
async function ensureSeed(tag) {
  const client = await store(), existing = await records(tag);
  for (const seed of seedRequests) {
    if (!existing.some(r => r.data.displayId === seed.id)) {
      await client.create({ ...encode(seed), tags:[tag] });
    }
  }
}
function fail(status, message) { throw Object.assign(new Error(message), { status, userFacing:true }); }
async function body(req, limit = 8192) {
  let size = 0, chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, 'Please shorten your request.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
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
  id:`acceptance-${r.recordId}`,requestId:r.id,recordId:r.recordId,hospitalId:r.acceptedHospitalId,hospitalName:hospital(r.acceptedHospitalId).name,acceptedAt:r.delivery.acceptedAt,readAt:r.delivery.notificationReadAt||null,status:r.status,
 })).sort((a,b)=>b.acceptedAt-a.acceptedAt);
}
async function recordRouting(tag,r,targetHospitalId){
 const ready=await readiness.get(tag),states=Object.fromEntries(ready.facilities.map(h=>[h.id,h.state]));
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
    if(url.pathname==='/workspace.html'){
      res.writeHead(302,{Location:'/', 'Cache-Control':'no-store'});res.end();return;
    }
    if(url.pathname==='/api/readiness'&&req.method==='GET')return json(res,200,await readiness.get(scope(req,res)));
    const facility=/^\/api\/readiness\/([a-z]+)$/.exec(url.pathname);
    if(facility&&req.method==='POST'){
      const tag=scope(req,res),input=await body(req);
      if(!hospital(facility[1])||!['Open','Limited','Closed'].includes(input?.state))fail(400,'Choose a sample hospital and supported availability.');
      return await serial(async()=>json(res,200,await readiness.set(tag,facility[1],input.state)));
    }
    if(url.pathname==='/api/notifications'&&req.method==='GET'){
      const base=url.searchParams.get('emsBaseId');if(!hospital(base))fail(400,'Choose an EMS base.');
      return json(res,200,{notifications:notifications((await records(scope(req,res))).map(decode),base)});
    }
    if (url.pathname === '/api/piezas/report' && ['GET','POST'].includes(req.method)) {
      const input = req.method==='POST' ? JSON.stringify(await body(req,600000)) : undefined;
      const request=new Request(`http://${req.headers.host}${url.pathname}`,{method:req.method,headers:req.headers,body:input});
      const response=await reports[req.method](request);
      res.writeHead(response.status,Object.fromEntries(response.headers));
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    if (url.pathname === '/api/requests' && req.method === 'GET') {
      const tag = scope(req,res);
      return await serial(async () => {
        await ensureSeed(tag);
        const rows=(await records(tag)).map(decode).sort((a,b)=>b.createdAt-a.createdAt),base=url.searchParams.get('emsBaseId');
        if(base&&!hospital(base))fail(400,'Choose an EMS base.');
        json(res,200,{requests:rows,notifications:base?notifications(rows,base):[]});
      });
    }
    if (url.pathname === '/api/requests' && req.method === 'POST') {
      const tag=scope(req,res), input=await body(req);
      const base=input?.emsBaseId||input?.hospitalId;
      if(input&&typeof input==='object')input.resource=canonicalResource(input.resource)||input.resource;
      if(!input||Object.keys(input).some(k=>!['emsBaseId','hospitalId','resource','urgency','radiusKm','note','targetHospitalId'].includes(k)))fail(400,'Use only resource coordination fields. Patient data is not accepted.');
      if(!hospital(base)||(input.emsBaseId&&input.hospitalId&&input.emsBaseId!==input.hospitalId)||!resources.includes(input.resource)||!['Urgent','Critical'].includes(input.urgency)||!Number.isInteger(input.radiusKm)||input.radiusKm<1||input.radiusKm>500||typeof input.note!=='string'||input.note.length>500||(input.targetHospitalId&&!hospital(input.targetHospitalId)))fail(400,'Check the EMS base, supported resource, Urgent or Critical priority, radius and recipient.');
      if(noteHasSensitiveDetails(input.note))fail(400,'Remove personal names, health identifiers, contact information and clinical details. Use resource or timing details only.');
      return await serial(async () => {
        await ensureSeed(tag);
        const rows=await records(tag);
        const number = Math.max(1042,...rows.map(r=>Number(r.data.displayId.slice(3))))+1;
        const r={id:`HC-${number}`,hospitalId:base,resource:input.resource,urgency:input.urgency,radiusKm:input.radiusKm,note:input.note.trim(),createdAt:Date.now(),status:'Awaiting responses',responses:[]};
        await recordRouting(tag,r,input.targetHospitalId);
        const saved=await (await store()).create({...encode(r),tags:[tag]});
        json(res,201,{request:decode(saved)});
      });
    }
    const action=/^\/api\/requests\/([a-f0-9-]{36})\/(hospital-accept|complete|notification-read)$/.exec(url.pathname);
    if(action&&req.method==='POST'){
      const tag=scope(req,res),input=await body(req);
      return await serial(async()=>{
        const client=await store(),row=await client.get(action[1]);
        if(row.entityTypeId!==client.getEntityTypeId()||!row.tags.includes(tag))fail(404,'Request not found.');
        const r=decode(row),at=Date.now();
        r.delivery??={source:'legacy',recipientIds:null,recordedAt:null,events:[]};
        if(action[2]==='hospital-accept'){
          if(!hospital(input?.hospitalId))fail(400,'Choose a receiving hospital.');
          if(r.status!=='Awaiting responses')fail(409,`This request is already ${r.status.toLowerCase()}${r.acceptedHospitalId?' by '+hospital(r.acceptedHospitalId).name:''}. Refresh to see the latest decision.`);
          const ready=await readiness.get(tag),states=Object.fromEntries(ready.facilities.map(h=>[h.id,h.state]));
          if(states[input.hospitalId]==='Closed')fail(409,'This hospital is closed. Update availability before accepting.');
          const recipients=Array.isArray(r.delivery.recipientIds)?r.delivery.recipientIds:eligibleHospitals(r,states).map(h=>h.id);
          if(!recipients.includes(input.hospitalId)||!eligibleHospitals(r,states).some(h=>h.id===input.hospitalId))fail(409,'This hospital is not an eligible recipient of this request.');
          r.acceptedHospitalId=input.hospitalId;r.status='Accepted';
          r.delivery.acceptanceMode='hospital-direct';r.delivery.acceptedAt=at;r.delivery.notificationReadAt=null;
          if(!r.responses.some(x=>x.hospitalId===input.hospitalId))r.responses.push({hospitalId:input.hospitalId,availabilityMinutes:0,acceptedAt:at});
          r.delivery.events.push({action:'hospital-accepted',actorType:'hospital',hospitalId:input.hospitalId,destinationId:input.hospitalId,at});
        }else{
          if(!hospital(input?.emsBaseId)||input.emsBaseId!==r.hospitalId)fail(403,'Only the requesting EMS desk can update this request.');
          if(action[2]==='notification-read'){
            if(r.delivery.acceptanceMode!=='hospital-direct'||!r.delivery.acceptedAt)fail(409,'There is no acceptance notification to mark read.');
            r.delivery.notificationReadAt??=at;
          }else{
            if(r.status!=='Accepted')fail(409,'Only an accepted request can be marked completed.');
            r.status='Completed';r.delivery.events.push({action:'completed',actorType:'ems',hospitalId:r.hospitalId,at});
          }
        }
        const saved=decode(await client.update(row.id,encode(r)));
        json(res,200,{request:saved,notification:notifications([saved],saved.hospitalId)[0]||null});
      });
    }
    if(url.pathname.startsWith('/api/'))fail(404,'That feature is not part of the current EMS workflow.');
    if (!['GET','HEAD'].includes(req.method)) fail(405,'That action is not supported.');
    const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/request-utils.js':'request-utils.js','/network.html':'network.html','/hospital.html':'hospital.html','/hospital-profile.js':'hospital-profile.js','/requests.html':'network.html','/overview.css':'overview.css','/map-bundle.js':'map-bundle.js','/map-bundle.css':'map-bundle.css','/map-attribution.txt':'map-attribution.txt','/seed.js':'seed.js','/core.css':'core.css','/workspace.css':'workspace.css','/report-widget.js':'report-widget.js'};
    const file=files[url.pathname];
    if (!file) fail(404,'Page not found.');
    const data=await readFile(path.join(root,file));
    res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8'})[path.extname(file)],'Cache-Control':'no-cache'});
    res.end(req.method==='HEAD' ? undefined : data);
  } catch (e) {
    const status=e.userFacing ? e.status : 503;
    // Do not send upstream error details or credentials to the browser.
    if (!res.headersSent) json(res,status,{error:e.userFacing ? e.message : 'Could not reach saved demo requests. Please retry in a moment.'});
    else res.end();
    if (!e.userFacing) console.error('Piezas request failed:', e.code || e.name);
  }
}).listen(port,'0.0.0.0',()=>console.log(`Hospital Connect listening on ${port}`));
