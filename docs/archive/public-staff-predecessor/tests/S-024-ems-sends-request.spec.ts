import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('EMS sends a request to a selected hospital',async({page,context})=>{
 await page.goto('/');await sendMRI(page);
 await page.getByTestId('request-HC-1043').click();
 await expect(page.getByTestId('request-routing')).toContainText('Maplewood Regional Hospital');
 await expect(page.getByTestId('request-routing')).not.toContainText('Riverside');
 const data=await (await context.request.get('/api/requests?emsBaseId=cedar')).json(),r=data.requests.find((r:any)=>r.id==='HC-1043');
 expect(r.delivery.requester.type).toBe('ems');expect(r.delivery.recipientIds).toEqual(['maple']);
 await page.getByTestId('close-detail').click();await page.getByTestId('role-hospital').click();
 await expect(page.getByTestId('desk-location')).toHaveValue('maple');
 await page.getByTestId('request-HC-1043').click();await expect(page.getByTestId('hospital-accept')).toBeVisible();
});
