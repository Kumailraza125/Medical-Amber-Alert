import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Keep older acceptance notifications accessible',async({page,context})=>{
 await page.goto('/');await sendMRI(page);
 const initial=(await (await context.request.get('/api/requests')).json()).requests.find((r:any)=>r.id==='HC-1043');
 await context.request.post(`/api/requests/${initial.recordId}/hospital-accept`,{data:{hospitalId:'maple'}});
 for(let i=0;i<8;i++){
  const r=(await (await context.request.post('/api/requests',{data:{emsBaseId:'cedar',resource:'MRI',urgency:'Urgent',radiusKm:100,note:'',targetHospitalId:'maple'}})).json()).request;
  expect((await context.request.post(`/api/requests/${r.recordId}/hospital-accept`,{data:{hospitalId:'maple'}})).ok()).toBe(true);
 }
 await page.getByTestId('refresh-requests').click();
 await expect(page.getByTestId('notification-count')).toContainText('9 unread');
 await expect(page.getByTestId('notification-HC-1043')).toContainText('Maplewood Regional Hospital');
 await page.getByTestId('read-HC-1043').click();await expect(page.getByTestId('notification-count')).toContainText('8 unread');
 await page.reload();await expect(page.getByTestId('notification-HC-1043')).toContainText('Read');
 await expect(page.getByTestId('notification-time-HC-1043')).toContainText('Accepted');
});
