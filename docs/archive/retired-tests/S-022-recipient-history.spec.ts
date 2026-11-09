import {test,expect} from '@playwright/test';
test('Preserve recipients and explain who accepted a request',async({page,context})=>{
 await page.goto('/workspace.html?view=readiness');
 await page.getByTestId('facility-state-maple').selectOption('Closed');await page.getByTestId('save-facility-maple').click();
 await expect(page.locator('#workspace-status')).toContainText('saved');
 await page.goto('/');await page.getByTestId('new-request').click();await page.getByTestId('resource').selectOption('MRI');await page.getByTestId('send-request').click();
 await page.getByTestId('request-HC-1043').click();
 await expect(page.getByTestId('request-routing')).toContainText('Riverside Medical Centre');
 await expect(page.getByTestId('request-routing')).not.toContainText('Maplewood');
 await page.goto('/workspace.html?view=readiness');await page.getByTestId('facility-state-maple').selectOption('Open');await page.getByTestId('save-facility-maple').click();await expect(page.locator('#workspace-status')).toContainText('saved');
 await page.goto('/');await page.getByTestId('request-HC-1043').click();
 await expect(page.getByTestId('request-routing')).not.toContainText('Maplewood');
 const requests=await (await context.request.get('/api/requests')).json(),r=requests.requests.find((r:any)=>r.id==='HC-1043');
 const offer=await context.request.post(`/api/requests/${r.recordId}/offer`,{data:{hospitalId:'maple',availabilityMinutes:30}});expect(offer.status()).toBe(409);
});
