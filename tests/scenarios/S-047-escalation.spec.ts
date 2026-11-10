import {test,expect} from '@playwright/test';
import {login,send,otherStaff,action} from '../staff-helpers';
test('Escalate unanswered requests using the configured backup process',async({page,context,browser,baseURL})=>{
 await login(context);const admin=await otherStaff(browser,context,baseURL,'admin');try{expect((await admin.request.post('/api/policy',{data:{responseMinutes:4,backupContact:'DEMO coordinator backup line'}})).status()).toBe(200);const r=await send(context);expect(r.delivery.responseTargetAt-r.createdAt).toBe(4*60000);
 await page.goto('/');await page.getByTestId('request-'+r.id).click();await page.getByTestId('more-actions').click();await page.getByTestId('escalation-reason').fill('No response; backup review requested');await page.getByTestId('escalate').click();await expect(page.getByTestId('escalation-status')).toContainText('DEMO EMS Coordinator');await expect(page.locator('#action-status')).toContainText('no external alert was sent');await expect(page.locator('.workflow-backup')).toContainText('DEMO coordinator backup line');await page.getByTestId('close-detail').click();
 await context.setOffline(true);await page.getByTestId('send-request').click();await expect(page.locator('#core-error')).toContainText('Could not confirm');await context.setOffline(false);await page.getByTestId('refresh-requests').click();await expect(page.getByTestId('request-'+r.id)).toBeVisible();
 }finally{await context.setOffline(false);await admin.close();}
});
