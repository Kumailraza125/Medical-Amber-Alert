import {hospitals} from './seed.js';
const params=new URLSearchParams(location.search),role=params.get('role')==='hospital'?'hospital':'ems';
const hospital=hospitals.some(h=>h.id===params.get('hospital'))?params.get('hospital'):(role==='hospital'?'maple':'cedar');
for(const [id,url] of Object.entries({'about-brand':`/?role=${role}&hospital=${hospital}`,'about-ems':`/?role=ems&hospital=${hospital}`,'about-hospital':`/?role=hospital&hospital=${hospital}`,'about-map':`/network.html?role=${role}&hospital=${hospital}`,'about-return':`/?role=${role}&hospital=${hospital}`}))document.querySelector(`[data-testid="${id}"]`).href=url;
