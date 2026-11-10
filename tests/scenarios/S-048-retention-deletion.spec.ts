import {test,expect} from '@playwright/test';
import {login,send,otherStaff,action} from '../staff-helpers';
test('Apply the storage policy and delete only with administrator approval',async({page,context,browser,baseURL})=>{
 await login(context);const r=await send(context);expect((await action(context,r,'delete',{reference:r.id,reason:'Example complete'})).status()).toBe(403);const admin=await otherStaff(browser,context,baseURL,'admin'),ap=await admin.newPage();try{
 expect((await action(admin,r,'delete',{reference:'wrong',reason:'Example complete'})).status()).toBe(400);await ap.goto('/staff.html');const form=ap.locator(`form[data-record="${r.recordId}"]`);await form.locator('[name="reference"]').fill(r.id);await form.locator('[name="reason"]').fill('Example coordination no longer needed');await form.getByRole('button',{name:'Delete example request'}).click();await expect(ap.getByTestId('admin-audit')).toContainText('request-deleted');await expect(ap.locator(`form[data-record="${r.recordId}"]`)).toHaveCount(0);await ap.reload();await expect(ap.locator(`form[data-record="${r.recordId}"]`)).toHaveCount(0);
 await page.goto('/');await expect(page.getByTestId('request-'+r.id)).toHaveCount(0);await page.goto('/data-care.html');await expect(page.getByRole('heading',{level:1})).toContainText('storage and deletion');await expect(page.locator('body')).toContainText('project lifetime');await expect(page.locator('body')).toContainText('Real patient information remains blocked');
 }finally{await admin.close();}
});
