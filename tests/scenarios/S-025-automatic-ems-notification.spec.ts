import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Hospital accepts and EMS sees an automatic notification',async({page,context,browser,baseURL})=>{
 await page.goto('/');await sendMRI(page);
 const other=await browser.newContext({baseURL});await other.addCookies(await context.cookies());const hospital=await other.newPage();
 try{
  await hospital.goto('/?role=hospital&hospital=maple');await hospital.getByTestId('request-HC-1043').click();
  await hospital.getByTestId('hospital-accept').click();await expect(hospital.getByTestId('accepted-hospital')).toContainText('Maplewood Regional Hospital');
  await page.bringToFront();
  await expect(page.getByTestId('notification-HC-1043')).toContainText('Maplewood Regional Hospital accepted HC-1043',{timeout:15000});
  await expect(page.getByTestId('notification-time-HC-1043')).toContainText('Accepted');
  await expect(page.getByTestId('request-HC-1043')).toContainText('Accepted');
  await page.getByTestId('request-HC-1043').click();await expect(page.getByTestId('accepted-hospital')).toContainText('Maplewood Regional Hospital');
  await expect(page.getByTestId('hospital-accept')).toHaveCount(0);await expect(page.locator('[data-testid^="accept-"]')).toHaveCount(0);
 }finally{await other.close();}
});
