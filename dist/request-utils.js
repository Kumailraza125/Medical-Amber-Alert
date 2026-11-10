import {hospitals,resources,distance} from './seed.js';
export const hospitalById=id=>hospitals.find(h=>h.id===id);
export function eligibleHospitals(request,states={}){
 const origin=hospitalById(request.hospitalId);
 return hospitals.filter(h=>(request.delivery?.requester?.type==='ems'||h.id!==origin.id)&&states[h.id]!=='Closed'&&h.resources.includes(request.resource)&&distance(origin,h)<=request.radiusKm);
}
export function recipientIds(request,states={}){
 return Array.isArray(request.delivery?.recipientIds)?request.delivery.recipientIds:eligibleHospitals(request,states).map(h=>h.id);
}
export const isIncoming=(r,id,states={})=>(r.delivery?.requester?.type==='ems'||r.hospitalId!==id)&&(recipientIds(r,states).includes(id)||r.responses.some(x=>x.hospitalId===id)||r.acceptedHospitalId===id);
export const isRelevant=(r,id,states={})=>r.hospitalId===id||isIncoming(r,id,states);

// A single definition keeps desk badges, lists and request ledgers aligned.
export function deskRequests(rows,role,id,view='all',states={}){
 const own=rows.filter(r=>role==='ems'?r.hospitalId===id:isIncoming(r,id,states)||r.acceptedHospitalId===id);
 if(view==='pending'||view==='incoming'||(role==='hospital'&&view==='all'))return own.filter(r=>r.status==='Awaiting responses'&&(role==='ems'||isIncoming(r,id,states)));
 if(view==='accepted')return own.filter(r=>r.status==='Accepted'&&(role==='ems'||r.acceptedHospitalId===id));
 if(view==='completed')return own.filter(r=>r.status==='Completed'&&(role==='ems'||r.acceptedHospitalId===id));
 if(view==='active')return own.filter(r=>r.status!=='Completed'&&(role==='ems'||r.status==='Awaiting responses'||r.acceptedHospitalId===id));
 return own;
}
export const canonicalResource=value=>resources.find(r=>r.toLowerCase()===String(value).trim().toLowerCase());
