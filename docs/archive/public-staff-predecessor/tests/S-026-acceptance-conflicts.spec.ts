import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Reject competing and invalid hospital acceptances',async({page,context})=>{
 await page.goto('/');await sendMRI(page,'');
 const data=await (await context.request.get('/api/requests')).json(),r=data.requests.find((r:any)=>r.id==='HC-1043');
 const action=`/api/requests/${r.recordId}/hospital-accept`;
 expect((await context.request.post(action,{data:{hospitalId:'cedar'}})).status()).toBe(409);
 await context.request.post('/api/readiness/maple',{data:{state:'Closed'}});
 expect((await context.request.post(action,{data:{hospitalId:'maple'}})).status()).toBe(409);
 await context.request.post('/api/readiness/maple',{data:{state:'Open'}});
 const result=await Promise.all(['maple','riverside'].map(hospitalId=>context.request.post(action,{data:{hospitalId}})));
 expect(result.map(x=>x.status()).sort()).toEqual([200,409]);
 const accepted=(await (await context.request.get('/api/requests')).json()).requests.find((x:any)=>x.id==='HC-1043');
 expect(accepted.delivery.events.filter((e:any)=>e.action==='hospital-accepted')).toHaveLength(1);
 const winner=accepted.acceptedHospitalId==='maple'?'Maplewood Regional Hospital':'Riverside Medical Centre';
 await page.getByTestId('refresh-requests').click();await expect(page.getByTestId('request-HC-1043')).toContainText(winner);
 expect((await context.request.post(`/api/requests/${r.recordId}/complete`,{data:{emsBaseId:'north'}})).status()).toBe(403);
});
