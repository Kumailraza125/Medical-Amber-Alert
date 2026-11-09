import {hospitals,distance} from './seed.js';
export const hospitalById=id=>hospitals.find(h=>h.id===id);
export function eligibleHospitals(request,states={}){
 const origin=hospitalById(request.hospitalId);
 return hospitals.filter(h=>h.id!==origin.id&&states[h.id]!=='Closed'&&h.resources.includes(request.resource)&&distance(origin,h)<=request.radiusKm);
}
export function recipientIds(request,states={}){
 return Array.isArray(request.delivery?.recipientIds)?request.delivery.recipientIds:eligibleHospitals(request,states).map(h=>h.id);
}
export const isIncoming=(r,id,states={})=>r.hospitalId!==id&&(recipientIds(r,states).includes(id)||r.responses.some(x=>x.hospitalId===id)||r.acceptedHospitalId===id);
export const isRelevant=(r,id,states={})=>r.hospitalId===id||isIncoming(r,id,states);
