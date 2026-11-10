import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Keep hospital counts and incoming request lists consistent',async({page,context,browser,baseURL})=>{
 await page.goto('/');await expect(page.getByTestId('send-request')).toBeVisible();const other=await browser.newContext({baseURL});await other.addCookies(await context.cookies());const receiver=await other.newPage();
 try{
  await receiver.goto('/?role=hospital&hospital=maple');await expect(receiver.getByTestId('count-pending')).toBeVisible();
  const before=await receiver.getByTestId('request-list').locator('[data-request]').count();
  await expect(receiver.getByTestId('count-pending').locator('strong')).toHaveText(String(before));
  await sendMRI(page);await receiver.bringToFront();await expect(receiver.getByTestId('request-HC-1043')).toBeVisible({timeout:15000});
  await expect(receiver.getByTestId('count-pending').locator('strong')).toHaveText(String(before+1));
  await receiver.getByTestId('request-HC-1043').click();await receiver.getByTestId('hospital-accept').click();await expect(receiver.getByTestId('accepted-hospital')).toContainText('Maplewood');await receiver.getByTestId('close-detail').click();
  await expect(receiver.getByTestId('filter-accepted')).toHaveAttribute('aria-pressed','true');await expect(receiver.getByTestId('request-HC-1043')).toBeVisible();
  await expect(receiver.getByTestId('count-pending').locator('strong')).toHaveText(String(before));
  const acceptedCount=await receiver.getByTestId('request-list').locator('[data-request]').count();await expect(receiver.getByTestId('count-accepted').locator('strong')).toHaveText(String(acceptedCount));
  await receiver.getByTestId('count-pending').click();await expect(receiver.getByTestId('request-HC-1043')).toHaveCount(0);await expect(receiver.getByTestId('request-list').locator('[data-request]')).toHaveCount(before);
  await receiver.goto('/requests.html?role=hospital&hospital=maple&view=incoming');await expect(receiver.locator('#ledger-count')).toContainText(`${before} incoming requests`);await expect(receiver.getByTestId('ledger-HC-1043')).toHaveCount(0);
 }finally{await other.close();}
});
