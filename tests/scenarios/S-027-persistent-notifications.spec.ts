import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Persist acceptance notifications and their read state',async({page,context})=>{
 await page.goto('/');await sendMRI(page);
 const r=(await (await context.request.get('/api/requests')).json()).requests.find((x:any)=>x.id==='HC-1043');
 await context.request.post(`/api/requests/${r.recordId}/hospital-accept`,{data:{hospitalId:'maple'}});
 await page.reload();await expect(page.getByTestId('notification-HC-1043')).toContainText('Maplewood Regional Hospital');
 const time=await page.getByTestId('notification-time-HC-1043').innerText();
 await page.getByTestId('read-HC-1043').click();await expect(page.getByTestId('notification-count')).toContainText('0 unread');
 await page.reload();await expect(page.getByTestId('read-HC-1043')).toHaveCount(0);
 await expect(page.getByTestId('notification-time-HC-1043')).toHaveText(time);
 const notice=(await (await context.request.get('/api/notifications?emsBaseId=cedar')).json()).notifications[0];
 expect(notice.hospitalId).toBe('maple');expect(notice.readAt).toBeGreaterThanOrEqual(notice.acceptedAt);
});
