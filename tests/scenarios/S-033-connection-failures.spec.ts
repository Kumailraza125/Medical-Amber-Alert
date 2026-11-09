import {test,expect} from '@playwright/test';
test('Keep connection-failure errors visible and allow a safe retry',async({page,context})=>{
 await page.goto('/');await expect(page.getByTestId('resource')).toBeVisible();
 await context.setOffline(true);await page.getByTestId('send-request').click();
 await expect(page.locator('#core-error')).toContainText('Could not confirm this change');
 await page.waitForTimeout(4500);await expect(page.locator('#core-error')).toBeVisible();
 await expect(page.getByTestId('request-HC-1043')).toHaveCount(0);
 await context.setOffline(false);await page.getByTestId('send-request').click();await expect(page.getByTestId('request-HC-1043')).toBeVisible();
 await page.getByTestId('role-hospital').click();await expect(page.locator('#sync-status')).toContainText('Automatic updates on');await page.getByTestId('request-HC-1043').click();
 await context.setOffline(true);await page.getByTestId('hospital-accept').click();
 await expect(page.locator('#detail-error')).toContainText('Could not confirm this change');await page.waitForTimeout(4500);await expect(page.locator('#detail-error')).toBeVisible();
 await expect(page.getByTestId('accepted-hospital')).toHaveCount(0);
 await context.setOffline(false);await page.getByTestId('hospital-accept').click();await expect(page.getByTestId('accepted-hospital')).toContainText('Maplewood Regional Hospital');
 await page.getByTestId('close-detail').click();await page.getByTestId('role-ems').click();
 await expect(page.getByTestId('notification-HC-1043')).toContainText('Maplewood Regional Hospital');
});
