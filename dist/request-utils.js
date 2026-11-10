import {hospitals,resources,distance} from './seed.js';
export const hospitalById=id=>hospitals.find(h=>h.id===id);
export function eligibleHospitals(request,states={}){
 const origin=hospitalById(request.hospitalId);
 return hospitals.filter(h=>(request.delivery?.requester?.type==='ems'||h.id!==origin.id)&&!['Closed','Paused'].includes(states[h.id])&&h.resources.includes(request.resource)&&distance(origin,h)<=request.radiusKm);
}
// Historical requests without a saved recipient list use the original sample network.
// Current availability/receiving changes must not erase their inbox visibility.
const legacyCapabilities={cedar:['X-ray','Ultrasound','Emergency beds'],maple:['MRI','CT scan','ICU beds','X-ray'],riverside:['MRI','CT scan','Ultrasound','Emergency beds'],north:['ICU beds','Ventilator','X-ray'],pine:['MRI','Ventilator','ICU beds'],coast:['MRI','CT scan','Ventilator']};
export function recipientIds(request,states={}){
 if(Array.isArray(request.delivery?.recipientIds))return request.delivery.recipientIds;
 const origin=hospitalById(request.hospitalId);if(!origin)return [];
 return hospitals.filter(h=>(request.delivery?.requester?.type==='ems'||h.id!==origin.id)&&legacyCapabilities[h.id]?.includes(request.resource)&&distance(origin,h)<=request.radiusKm).map(h=>h.id);
}

export const isIncoming=(r,id,states={})=>(r.delivery?.requester?.type==='ems'||r.hospitalId!==id)&&(recipientIds(r,states).includes(id)||r.responses.some(x=>x.hospitalId===id)||r.acceptedHospitalId===id);
export const isRelevant=(r,id,states={})=>r.hospitalId===id||isIncoming(r,id,states);

// A single definition keeps desk badges, lists and request ledgers aligned.
export const isPending=r=>['Submitted','Under review','Awaiting response','Awaiting responses'].includes(r.status);
export function deskRequests(rows,role,id,view='all',states={}){
 const own=rows.filter(r=>role==='ems'?r.hospitalId===id:isIncoming(r,id,states)||r.acceptedHospitalId===id);
 if(view==='pending'||view==='incoming'||(role==='hospital'&&view==='all'))return own.filter(r=>isPending(r)&&(role==='ems'||isIncoming(r,id,states)));
 if(view==='accepted')return own.filter(r=>r.status==='Accepted'&&(role==='ems'||r.acceptedHospitalId===id));
 if(view==='completed')return own.filter(r=>r.status==='Completed'&&(role==='ems'||r.acceptedHospitalId===id));
 if(view==='active')return own.filter(r=>r.status!=='Completed'&&(role==='ems'||isPending(r)||r.acceptedHospitalId===id));
 return own;
}
export const canonicalResource=value=>resources.find(r=>r.toLowerCase()===String(value).trim().toLowerCase());

export const routingStates=facilities=>Object.fromEntries(facilities.map(h=>[h.id,h.acceptingRequests===false?'Paused':h.state]));
