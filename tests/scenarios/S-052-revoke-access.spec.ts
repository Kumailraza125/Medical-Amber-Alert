import {test,expect} from '@playwright/test';
import {login,otherStaff} from '../staff-helpers';
test('Revoke staff access immediately',async({page,context,browser,baseURL})=>{
 const member=await login(context,'maple');await page.goto('/');await expect(page.getByTestId('staff-identity')).toContainText('DEMO Maple');const admin=await otherStaff(browser,context,baseURL,'admin');try{expect((await admin.request.post('/api/staff/'+member.userId,{data:{status:'suspended',reason:'Sample access review required'}})).status()).toBe(200);expect((await context.request.get('/api/requests')).status()).toBe(403);expect((await context.request.post('/api/readiness/maple',{data:{state:'Open'}})).status()).toBe(403);await page.getByTestId('refresh-requests').click();await expect(page).toHaveURL(/login.html/);
 }finally{await admin.close();}
});
