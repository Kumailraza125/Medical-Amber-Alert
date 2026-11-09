import {profiles,crews,screen} from '../dist/hackathon-data.js';
import {hospitals,resources,distance} from '../dist/seed.js';
import {workbook} from './xlsx.js';

export function hackathonRoutes(ctx){
 const {piezas,testing,scope,serial,body,json,fail}=ctx;
 const slug=testing?'hospital_connect_test_hackathon_item_v1':'hospital_connect_shared_hackathon_item_v1';
 let promise;
 const store=()=>promise??=piezas.defineEntities({[slug]:{fields:{itemType:{type:'text',required:true},key:{type:'text',required:true},payload:{type:'longtext',required:true}}}}).then(x=>x[slug]).catch(e=>{promise=undefined;throw e;});
 const unpack=r=>({...JSON.parse(r.data.payload),recordId:r.id});
 async function list(tag,type){
  const client=await store(),rows=[];
  for(let offset=0;;offset+=100){const p=await client.list({tag,filter:{itemType:type},limit:100,offset});rows.push(...p.data);if(p.data.length<100)break;}
  return rows.map(unpack);
 }
 const create=async(tag,type,key,value)=>unpack(await (await store()).create({title:key,tags:[tag],status:'active',data:{itemType:type,key,payload:JSON.stringify(value)}}));
 async function get(tag,id,type){
  if(!/^[a-f0-9-]{36}$/.test(id))fail(404,'Demo record not found.');
  const r=await (await store()).get(id);
  if(!r.tags.includes(tag)||r.data.itemType!==type)fail(404,'Demo record not found.');
  return unpack(r);
 }
 async function update(tag,type,item){
  const {recordId,...value}=item;
  return unpack(await (await store()).update(recordId,{data:{itemType:type,key:item.id,payload:JSON.stringify(value)}}));
 }
 const history=(item,action)=>[...(item.history||[]),{action,at:new Date().toISOString(),actor:'Shared demo visitor'}].slice(-30);
 async function readiness(tag){
  const saved=await list(tag,'facility'),staff=await list(tag,'crew');
  return {facilities:hospitals.map(h=>({...h,state:'Open',updatedAt:null,...saved.find(s=>s.id===h.id)})),crews:crews.map(c=>({...c,...staff.find(s=>s.id===c.id)})).map(c=>({...c,fatigueWarning:c.hoursWorked>=12}))};
 }
 async function recommendations(tag,c){
  const r=await readiness(tag),from=hospitals.find(h=>h.id===c.hospitalId);
  return r.facilities.filter(h=>h.id!==c.hospitalId&&h.state!=='Closed'&&h.resources.includes(c.resource)&&distance(from,h)<=c.radiusKm).map(h=>({id:h.id,name:h.name,state:h.state,distanceKm:Math.round(distance(from,h)),notice:h.state==='Limited'?'Limited capacity: call to confirm':'Sample status only: confirm capacity'})).sort((a,b)=>a.distanceKm-b.distanceKm);
 }
 async function newCase(tag,input,imported=false){
  if(!input||Object.keys(input).some(k=>!['profileId','hospitalId','resource','radiusKm','answers','syntheticConfirmed'].includes(k)))fail(400,'Only generated fictional profiles are accepted. Do not send real identity or health data.');
  const profile=profiles.find(p=>p.id===input.profileId),answers=input.answers;
  if(!profile||input.syntheticConfirmed!==true||!hospitals.some(h=>h.id===input.hospitalId)||!resources.includes(input.resource)||!Number.isInteger(input.radiusKm)||input.radiusKm<1||input.radiusKm>500||!answers||Object.keys(answers).some(k=>!['pain','breathingConcern','unresponsive','majorBleeding'].includes(k))||typeof answers.breathingConcern!=='boolean'||typeof answers.unresponsive!=='boolean'||typeof answers.majorBleeding!=='boolean'||!Number.isInteger(answers.pain)||answers.pain<0||answers.pain>10)fail(400,'Use a generated profile, confirm fictional data and complete all demo questions.');
  const existing=await list(tag,'case'),assessment=screen(answers),number=Math.max(0,...existing.map(x=>Number(x.id.slice(5))))+1;
  const duplicate=existing.some(x=>x.profileId===profile.id);
  const item={id:`CASE-${String(number).padStart(4,'0')}`,profileId:profile.id,hospitalId:input.hospitalId,resource:input.resource,radiusKm:input.radiusKm,answers,assessment,createdAt:Date.now(),reviewBy:Date.now()+assessment.minutes*60000,stage:'Assessed',reviewState:duplicate?'Needs human check':'No duplicate found',reviewReason:duplicate?'Same synthetic profile already appears in another case. This is a data-quality signal, not proof of fraud.':'No duplicate among the current fictional cases.',imported,history:[{action:'Synthetic intake and demo screening saved',at:new Date().toISOString(),actor:'Shared demo visitor'}]};
  return create(tag,'case',item.id,item);
 }
 async function caseView(tag,item){if(item.linkedRequestRecordId){const status=await ctx.caseRequestStatus(tag,item.linkedRequestRecordId);item={...item,stage:status==='Awaiting responses'?'Resource requested':status};}return {...item,profile:profiles.find(p=>p.id===item.profileId),recommendations:await recommendations(tag,item)};}
 const dataset=()=>profiles.map(p=>({profileId:p.id,fullName:p.fullName,personalHealthNumber:p.personalHealthNumber,contactInfo:p.contactInfo,injuryOrIllness:p.injuryOrIllness,medicalBackground:p.medicalBackground}));
 const csvCell=v=>'"'+String(v).replaceAll('"','""')+'"';
 function parseCSV(text){
  const rows=[];let row=[],value='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}
  if(quoted)fail(400,'CSV has an unclosed quoted field.');
  if(value||row.length){row.push(value.replace(/\r$/,''));rows.push(row);}
  const keys=rows.shift();if(!keys||new Set(keys).size!==keys.length||keys.length!==6)fail(400,'Use the six-column synthetic dataset exported here.');
  return rows.map(r=>{if(r.length!==keys.length)fail(400,'CSV columns do not match.');return Object.fromEntries(keys.map((k,i)=>[k,r[i]]));});
 }
 async function handle(req,res,url){
  if(!url.pathname.startsWith('/api/hackathon/'))return false;
  const tag=scope(req,res),path=url.pathname.slice('/api/hackathon'.length);
  if(path==='/export'&&req.method==='GET'){
   const format=url.searchParams.get('format'),rows=dataset(),keys=Object.keys(rows[0]);
   if(!['csv','json','xlsx'].includes(format))fail(400,'Choose CSV, JSON or XLSX.');
   const content=format==='xlsx'?workbook(rows):format==='json'?JSON.stringify(rows,null,2):[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(csvCell).join(',')).join('\r\n');
   res.writeHead(200,{'Content-Type':format==='xlsx'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':format==='json'?'application/json':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="synthetic-patients.${format}"`,'Cache-Control':'no-store'});res.end(content);return true;
  }
  if(path==='/readiness'&&req.method==='GET'){json(res,200,await readiness(tag));return true;}
  if(path==='/cases'&&req.method==='GET'){
   const cases=await list(tag,'case');const summaries=await Promise.all(cases.sort((a,b)=>b.createdAt-a.createdAt).map(async c=>{const status=c.linkedRequestRecordId?await ctx.caseRequestStatus(tag,c.linkedRequestRecordId):c.stage;return {...c,stage:status==='Awaiting responses'?'Resource requested':status,profileAlias:`Synthetic profile ${c.profileId.slice(-3)}`};}));json(res,200,{cases:summaries,profiles});return true;
  }
  if(path==='/payments'&&req.method==='GET'){json(res,200,{payments:await list(tag,'payment'),workers:crews});return true;}
  if(path==='/payments'&&req.method==='POST'){
   const input=await body(req),worker=crews.find(w=>w.id===input?.workerId);
   if(!worker||!Number.isInteger(input.amountCents)||input.amountCents<100||input.amountCents>100000||input.syntheticConfirmed!==true)fail(400,'Choose a fictional worker, a demo amount from $1 to $1000, and confirm no money will move.');
   await serial(async()=>{
    const prior=await list(tag,'payment'),id=`PAY-${String(prior.length+1).padStart(4,'0')}`;
    const payment=await create(tag,'payment',id,{id,workerId:worker.id,workerName:worker.name,amountCents:input.amountCents,currency:'CAD',state:'Draft',gateway:'Not connected — no charges',history:[{action:'Demo payment draft created; no charge',at:new Date().toISOString(),actor:'Shared demo visitor'}]});
    json(res,201,{payment});
   });return true;
  }
  const paymentPath=/^\/payments\/([a-f0-9-]{36})\/approve$/.exec(path);
  if(paymentPath&&req.method==='POST'){
   const input=await body(req);if(input.confirmNoCharge!==true)fail(400,'Confirm this is a no-charge payment demonstration.');
   await serial(async()=>{
    const p=await get(tag,paymentPath[1],'payment');
    if(p.state!=='Draft')fail(409,'This demo payment was already reviewed.');
    p.state='Approved for demo handoff';p.history=history(p,'Demo approval saved. External checkout not connected. No payment processed.');
    json(res,200,{payment:await update(tag,'payment',p)});
   });return true;
  }
  const casePath=/^\/cases\/([a-f0-9-]{36})(?:\/(refer|review))?$/.exec(path);
  if(casePath&&req.method==='GET'&&!casePath[2]){json(res,200,{case:await caseView(tag,await get(tag,casePath[1],'case'))});return true;}
  if(path==='/cases'&&req.method==='POST'){const input=await body(req);await serial(async()=>json(res,201,{case:await caseView(tag,await newCase(tag,input))}));return true;}
  if(casePath&&req.method==='POST'){
   const input=await body(req);
   await serial(async()=>{
    const c=await get(tag,casePath[1],'case');
    if(casePath[2]==='review'){
     if(input.reason!=='Reviewed synthetic duplicate')fail(400,'Choose the synthetic duplicate review reason.');
     c.reviewState='Reviewed';c.history=history(c,'Human reviewed synthetic duplicate; coordination remains available');
    }else if(casePath[2]==='refer'){
     if(!c.linkedRequestId){
      const r=await ctx.createCaseRequest(tag,c);c.linkedRequestId=r.id;c.linkedRequestRecordId=r.recordId;
      c.stage='Resource requested';c.history=history(c,`Resource request ${r.id} sent without patient identity`);
     }
    }else fail(405,'Choose a supported case action.');
    const saved=await update(tag,'case',c);json(res,200,{case:await caseView(tag,saved)});
   });return true;
  }
  const readyPath=/^\/readiness\/(facility|crew)\/([a-z-]+)$/.exec(path);
  if(readyPath&&req.method==='POST'){
   const input=await body(req),type=readyPath[1],id=readyPath[2];
   if(type==='facility'&&(!hospitals.some(h=>h.id===id)||!['Open','Limited','Closed'].includes(input.state)))fail(400,'Choose a sample facility and supported availability.');
   if(type==='crew'&&(!crews.some(c=>c.id===id)||!['Available','On call','Off shift'].includes(input.status)||!Number.isInteger(input.hoursWorked)||input.hoursWorked<0||input.hoursWorked>24))fail(400,'Choose a sample crew, availability and hours from 0 to 24.');
   await serial(async()=>{
    const existing=(await list(tag,type)).find(x=>x.id===id),value={id,...(type==='facility'?{state:input.state}:{status:input.status,hoursWorked:input.hoursWorked}),updatedAt:Date.now(),history:history(existing||{},'Demo readiness updated')};
    existing?await update(tag,type,{...value,recordId:existing.recordId}):await create(tag,type,id,value);
    json(res,200,await readiness(tag));
   });return true;
  }
  if(path==='/import'&&req.method==='POST'){
   const input=await body(req,50000);
   if(!input?.syntheticConfirmed||!['json','csv'].includes(input.format)||typeof input.content!=='string'||input.content.length>40000)fail(400,'Import the synthetic CSV or JSON dataset and confirm it contains fictional data.');
   let rows;try{rows=input.format==='json'?JSON.parse(input.content):parseCSV(input.content);}catch(e){if(e.userFacing)throw e;fail(400,'The file is not valid CSV or JSON.');}
   if(!Array.isArray(rows)||!rows.length||rows.length>10)fail(400,'Import between 1 and 10 generated profiles.');
   const allowed=dataset();
   for(const r of rows){const known=allowed.find(x=>x.profileId===r?.profileId);if(!known||Object.keys(r).length!==6||Object.keys(known).some(k=>r[k]!==known[k]))fail(400,'Only the exact generated fictional dataset is accepted. Real identity and health data are not accepted.');}
   await serial(async()=>{
    let created=0,skipped=0;const existing=await list(tag,'case'),seen=new Set(existing.filter(c=>c.imported).map(c=>c.profileId));
    for(const r of rows){if(seen.has(r.profileId)){skipped++;continue;}const p=profiles.find(p=>p.id===r.profileId);await newCase(tag,{profileId:p.id,hospitalId:'cedar',resource:p.resource,radiusKm:100,answers:{breathingConcern:false,unresponsive:false,majorBleeding:false,pain:0},syntheticConfirmed:true},true);seen.add(r.profileId);created++;}
    json(res,200,{created,skipped,message:`${created} synthetic cases saved; ${skipped} already imported.`});
   });return true;
  }
  fail(404,'Demo workspace action not found.');
 }
 return {handle,readiness};
}
