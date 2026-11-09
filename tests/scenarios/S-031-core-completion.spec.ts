import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Complete a request while retaining its acceptance history',async({page,context})=>{
 await page.goto('/');await sendMRI(page);
 const r=(await (await context.request.get('/api/requests')).json()).requests.find((x:any)=>x.id==='HC-1043');
 const accepted=await (await context.request.post(`/api/requests/${r.recordId}/hospital-accept`,{data:{hospitalId:'maple'}})).json();
 await page.getByTestId('refresh-requests').click();await page.getByTestId('request-HC-1043').click();await page.getByTestId('complete-request').click();
 await expect(page.getByTestId('accepted-hospital')).toContainText('Maplewood Regional Hospital');await page.getByTestId('close-detail').click();await page.reload();
 await page.getByTestId('filter-completed').click();await expect(page.getByTestId('request-HC-1043')).toContainText('Completed');await expect(page.getByTestId('notification-HC-1043')).toContainText('Maplewood Regional Hospital');
 const result=await (await context.request.get('/api/notifications?emsBaseId=cedar')).json();expect(result.notifications[0].acceptedAt).toBe(accepted.request.delivery.acceptedAt);
});
