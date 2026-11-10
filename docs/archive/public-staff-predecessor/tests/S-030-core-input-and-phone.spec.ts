import {test,expect} from '@playwright/test';
test('Protect shared notes and fit a phone screen',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByTestId('note').fill('Patient name: Jane Smith PHN 1234567890');await page.getByTestId('send-request').click();
 await expect(page.locator('#core-error')).toContainText('Remove personal names');await page.waitForTimeout(4500);await expect(page.locator('#core-error')).toBeVisible();
 await page.getByTestId('note').fill('<img src=x onerror="document.body.dataset.injected=1">');await page.getByTestId('send-request').click();
 await page.getByTestId('request-HC-1043').click();await expect(page.getByTestId('detail-note')).toHaveText('<img src=x onerror="document.body.dataset.injected=1">');await expect(page.getByTestId('detail-note').locator('img')).toHaveCount(0);
 await page.getByTestId('close-detail').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await context.request.post('/api/requests',{data:{emsBaseId:'cedar',resource:'MRI',urgency:'Urgent',radiusKm:0,note:''}})).status()).toBe(400);
});
