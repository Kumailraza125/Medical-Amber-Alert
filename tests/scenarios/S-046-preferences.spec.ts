import {test,expect} from '@playwright/test';
import {login,send,otherStaff,action,publish} from '../staff-helpers';
test('Review a preference or another option without losing acceptance',async({page,context,browser,baseURL})=>{
 await login(context);const r=await send(context,{targetHospitalId:'maple',preferredHospitalId:'riverside'});const h=await otherStaff(browser,context,baseURL,'maple');try{await action(h,r,'begin-review');const f=await publish(h);
 expect((await action(h,r,'hospital-accept',{capacityConfirmed:true,availabilityVersion:f.updatedAt})).status()).toBe(400);
 expect((await action(h,r,'hospital-accept',{capacityConfirmed:true,availabilityVersion:f.updatedAt,preferenceReviewed:true,reason:'Preferred slot unavailable; matching resource confirmed here'})).status()).toBe(200);
 expect((await action(context,r,'alternative-request',{reason:'Another timing option is preferred'})).status()).toBe(200);expect((await action(context,r,'confirm-transfer',{arrangementsConfirmed:true,availabilityVersion:f.updatedAt})).status()).toBe(409);
 await page.goto('/');await page.getByTestId('request-'+r.id).click();await expect(page.getByTestId('request-preference')).toContainText('Riverside');await expect(page.getByTestId('alternative-status')).toContainText('needs staff review');await expect(page.getByTestId('accepted-hospital')).toContainText('Maplewood');
 expect((await action(h,r,'alternative-review',{reason:'Reviewed with EMS; current resource remains the agreed option'})).status()).toBe(200);await page.getByTestId('close-detail').click();await page.getByTestId('refresh-requests').click();await page.getByTestId('request-'+r.id).click();await expect(page.getByTestId('alternative-status')).toContainText('Alternative reviewed');await expect(page.getByTestId('alternative-status')).toContainText('Reviewed with EMS');
 }finally{await h.close();}
});
