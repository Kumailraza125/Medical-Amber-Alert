import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Piezas, createReportProblemRoute } from '@piezas/sdk';
import { hospitals, resources, seedRequests, distance } from './dist/seed.js';
import { hackathonRoutes } from './lib/hackathon.js';
import { noteHasSensitiveDetails } from './lib/coordination-note.js';

const testing = process.argv.includes('--test');
const apiKey = testing ? process.env.PIEZAS_TEST_API_KEY : process.env.PIEZAS_API_KEY;
if (!apiKey) throw new Error('Piezas connection is missing. Configure the server before starting.');
const piezas = new Piezas({ apiKey, apiBaseUrl: process.env.PIEZAS_API_URL || 'https://api.piezas.ai' });
const reports = createReportProblemRoute({ piezas });
const entitySlug = testing ? 'hospital_connect_test_demo_request' : 'hospital_connect_shared_demo_request';
let storePromise;
function store() {
  if (!storePromise) storePromise = piezas.defineEntities({ [entitySlug]: { fields: {
    displayId: {type:'text',required:true}, hospitalId:{type:'text',required:true},
    resource:{type:'select',options:resources,required:true}, urgency:{type:'select',options:['Routine','Urgent','Critical'],required:true},
    radiusKm:{type:'integer',required:true}, note:{type:'longtext'}, createdAt:{type:'number',required:true},
    responses:{type:'longtext',required:true}, acceptedHospitalId:{type:'text'},
  } } }).then(x => x[entitySlug]).catch(e => { storePromise = undefined; throw e; });
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
const decode = r => ({ ...r.data, id:r.data.displayId, status:r.status, responses:JSON.parse(r.data.responses || '[]'), recordId:r.id });
function encode(r) {
  const { id, recordId, status, ...data } = r;
  return { title:id, status, data:{ ...data, displayId:id, responses:JSON.stringify(r.responses) } };
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
const hackathon=hackathonRoutes({piezas,testing,scope,serial,body,json,fail,
 async caseRequestStatus(tag,id){const r=await (await store()).get(id);if(!r.tags.includes(tag))fail(404,'Request not found.');return r.status;},
 async createCaseRequest(tag,c){
  const client=await store(),rows=await records(tag),caseTag=`case-${c.recordId}`;
  const prior=rows.find(r=>r.tags.includes(caseTag));if(prior)return decode(prior);
  const number=Math.max(1042,...rows.map(r=>Number(r.data.displayId.slice(3))))+1;
  const r={id:`HC-${number}`,hospitalId:c.hospitalId,resource:c.resource,urgency:c.assessment.priority,radiusKm:c.radiusKm,note:`Synthetic case ${c.id}. Resource coordination only; no patient identity shared.`,createdAt:Date.now(),status:'Awaiting responses',responses:[]};
  return decode(await client.create({...encode(r),tags:[tag,caseTag]}));
 }
});
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
    if (await hackathon.handle(req,res,url)) return;
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
        json(res,200,{requests:(await records(tag)).map(decode).sort((a,b)=>b.createdAt-a.createdAt)});
      });
    }
    if (url.pathname === '/api/requests' && req.method === 'POST') {
      const tag=scope(req,res), input=await body(req);
      if (!hospital(input.hospitalId) || !resources.includes(input.resource) || !['Routine','Urgent','Critical'].includes(input.urgency) || !Number.isInteger(input.radiusKm) || input.radiusKm<1 || input.radiusKm>500 || typeof input.note!=='string' || input.note.length>500) fail(400,'Check the hospital, resource, urgency, radius and note.');
      if (noteHasSensitiveDetails(input.note)) fail(400,'Remove personal names, health identifiers, contact information and clinical details. Use resource or timing information only.');
      return await serial(async () => {
        await ensureSeed(tag);
        const rows=await records(tag);
        const number = Math.max(1042,...rows.map(r=>Number(r.data.displayId.slice(3))))+1;
        const r={id:`HC-${number}`,hospitalId:input.hospitalId,resource:input.resource,urgency:input.urgency,radiusKm:input.radiusKm,note:input.note.trim(),createdAt:Date.now(),status:'Awaiting responses',responses:[]};
        const saved=await (await store()).create({...encode(r),tags:[tag]});
        json(res,201,{request:decode(saved)});
      });
    }
    const action=/^\/api\/requests\/([a-f0-9-]{36})\/(offer|accept|complete)$/.exec(url.pathname);
    if (action && req.method==='POST') {
      const tag=scope(req,res), input=await body(req);
      if (!hospital(input.hospitalId)) fail(400,'Choose a sample hospital.');
      return await serial(async () => {
        const client=await store(), row=await client.get(action[1]);
        if (!row.tags.includes(tag)) fail(404,'Request not found in this demo.');
        const r=decode(row);
        if (action[2]==='offer') {
          const ready=await hackathon.readiness(tag);
          if(ready.facilities.find(h=>h.id===input.hospitalId)?.state==='Closed')fail(409,'This sample facility is closed. Update readiness before offering capacity.');
          if (r.status!=='Awaiting responses' || !matches(r,input.hospitalId) || r.responses.some(x=>x.hospitalId===input.hospitalId)) fail(409,'This hospital cannot offer again, or the request has changed. Refresh and try another request.');
          if (!Number.isInteger(input.availabilityMinutes) || input.availabilityMinutes<1 || input.availabilityMinutes>10080) fail(400,'Enter an availability time between 1 and 10080 minutes.');
          r.responses.push({hospitalId:input.hospitalId,availabilityMinutes:input.availabilityMinutes});
        } else {
          if (r.hospitalId!==input.hospitalId) fail(403,'Switch to the requesting sample hospital first.');
          if (action[2]==='accept') {
            if (r.status!=='Awaiting responses' || !r.responses.some(x=>x.hospitalId===input.acceptedHospitalId)) fail(409,'This response cannot be accepted. Refresh the request.');
            r.acceptedHospitalId=input.acceptedHospitalId; r.status='Accepted';
          } else {
            if (r.status!=='Accepted') fail(409,'Accept a response before completing this request.');
            r.status='Completed';
          }
        }
        json(res,200,{request:decode(await client.update(row.id,encode(r)))});
      });
    }
    if (!['GET','HEAD'].includes(req.method)) fail(405,'That action is not supported.');
    const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/seed.js':'seed.js','/styles.css':'styles.css','/report-widget.js':'report-widget.js','/workspace.html':'workspace.html','/workspace.js':'workspace.js','/workspace.css':'workspace.css','/hackathon-data.js':'hackathon-data.js','/submission-data.js':'submission-data.js','/submission/problem-summary.pdf':'submission/problem-summary.pdf','/submission/pitch-script.pdf':'submission/pitch-script.pdf','/submission/pitch-slides.pptx':'submission/pitch-slides.pptx','/submission/requirements.md':'submission/requirements.md'};
    const file=files[url.pathname];
    if (!file) fail(404,'Page not found.');
    const data=await readFile(path.join(root,file));
    res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.md':'text/plain; charset=utf-8'})[path.extname(file)],'Cache-Control':'no-cache'});
    res.end(req.method==='HEAD' ? undefined : data);
  } catch (e) {
    const status=e.userFacing ? e.status : 503;
    // Do not send upstream error details or credentials to the browser.
    if (!res.headersSent) json(res,status,{error:e.userFacing ? e.message : 'Could not reach saved demo requests. Please retry in a moment.'});
    else res.end();
    if (!e.userFacing) console.error('Piezas request failed:', e.code || e.name);
  }
}).listen(port,'0.0.0.0',()=>console.log(`Hospital Connect listening on ${port}`));
