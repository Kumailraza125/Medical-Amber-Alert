import {test,expect} from '@playwright/test';
test('Reject common patient details in shared request notes',async({page,context})=>{
 await page.goto('/');await page.getByTestId('new-request').click();
 await page.getByTestId('note').fill('Jane Smith needs an MRI');
 await page.getByTestId('send-request').click();
 await expect(page.getByTestId('save-error')).toContainText('Remove personal names');
 await expect(page.getByTestId('send-request')).toBeVisible();
 for(const note of ['PHN: 1234567890','Call 604-555-1234','Please email jane@hospital.example','Patient has a diagnosis of diabetes']){
  const response=await context.request.post('/api/requests',{data:{hospitalId:'cedar',resource:'MRI',urgency:'Urgent',radiusKm:100,note}});
  expect(response.status()).toBe(400);
 }
 const response=await context.request.get('/api/requests');
 expect((await response.json()).requests).toHaveLength(6);
 await expect(page.getByTestId('request-HC-1043')).toHaveCount(0);
});
