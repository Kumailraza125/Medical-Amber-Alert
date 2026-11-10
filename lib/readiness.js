import {hospitals} from '../dist/seed.js';

// Reuse the existing facility records. Retired case/payment records are untouched.
export function createReadiness({piezas,testing}){
 const slug=testing?'hospital_connect_test_hackathon_item_v1':'hospital_connect_shared_hackathon_item_v1';
 let pending;
 const store=()=>pending??=piezas.defineEntities({[slug]:{fields:{itemType:{type:'text',required:true},key:{type:'text',required:true},payload:{type:'longtext',required:true}}}}).then(x=>x[slug]).catch(e=>{pending=undefined;throw e;});
 async function list(tag){
  const rows=[],client=await store();
  for(let offset=0;;offset+=100){const page=await client.list({tag,filter:{itemType:'facility'},limit:100,offset});rows.push(...page.data);if(page.data.length<100)break;}
  return rows;
 }
 async function get(tag){
  const records=await list(tag);
  return {facilities:hospitals.map(h=>{const row=records.find(r=>r.data.key===h.id);const saved=row?JSON.parse(row.data.payload):{};return {...h,state:'Open',updatedAt:null,...saved};})};
 }
 async function set(tag,id,state,actor){
  const client=await store(),rows=await list(tag),row=rows.find(r=>r.data.key===id);
  const prior=row?JSON.parse(row.data.payload):{};
  const payload={id,state,updatedAt:Date.now(),updatedBy:actor?.name||'Earlier hospital desk',updatedById:actor?.userId||null,history:[...(prior.history||[]),{action:'Hospital availability updated',at:new Date().toISOString(),actor:actor?.name||'Hospital desk'}].slice(-30)};
  const value={itemType:'facility',key:id,payload:JSON.stringify(payload)};
  if(row)await client.update(row.id,{data:value});else await client.create({title:id,tags:[tag],status:'active',data:value});
  return get(tag);
 }
 return {get,set};
}
