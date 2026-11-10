import {test,expect} from '@playwright/test';
import {login,send,otherStaff,action} from '../staff-helpers';
test('Restrict operational records by assigned role and hospital',async({page,context,browser,baseURL})=>{
 await login(context);const r=await send(context,{targetHospitalId:'maple'});expect((await action(context,r,'begin-review')).status()).toBe(403);expect((await context.request.get('/api/staff')).status()).toBe(403);expect((await context.request.post('/api/readiness/maple',{data:{state:'Open'}})).status()).toBe(403);
 const river=await otherStaff(browser,context,baseURL,'riverside');try{const rows=(await (await river.request.get('/api/requests')).json()).requests;expect(rows).toHaveLength(0);expect((await action(river,r,'begin-review')).status()).toBe(404);await page.goto('/');await page.getByTestId('request-'+r.id).click();await expect(page.getByTestId('request-routing')).toContainText('Maplewood');await expect(page.getByTestId('request-routing')).not.toContainText('Riverside');}finally{await river.close();}
 expect((await context.request.post('/api/requests',{data:{emsBaseId:'north',resource:'MRI',urgency:'Urgent',radiusKm:100,note:''}})).status()).toBe(403);
});
