import {test,expect} from '@playwright/test';
test('Type supported resources and reject unsupported or Routine requests',async({page,context})=>{
 await page.goto('/');await page.getByTestId('resource').fill(' mri ');await expect(page.getByTestId('match-preview')).toContainText('eligible');
 await expect(page.getByTestId('urgency').locator('option')).toHaveText(['Urgent','Critical']);await page.getByTestId('target-hospital').selectOption('maple');await page.getByTestId('send-request').click();await expect(page.getByTestId('request-HC-1043')).toContainText('MRI');
 const input={emsBaseId:'cedar',resource:'MRI',urgency:'Urgent',radiusKm:100,note:''};
 expect((await context.request.post('/api/requests',{data:{...input,urgency:'Routine'}})).status()).toBe(400);
 await page.getByTestId('resource').fill('unsupported equipment');await expect(page.getByTestId('match-preview')).toContainText('not recognised');await page.getByTestId('send-request').click();await expect(page.locator('#core-error')).toContainText('supported resource');
 const rows=(await (await context.request.get('/api/requests')).json()).requests;expect(rows.filter((r:any)=>r.delivery?.requester?.type==='ems')).toHaveLength(1);expect(rows.find((r:any)=>r.id==='HC-1043').resource).toBe('MRI');
});
