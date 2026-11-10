import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Keep map and ledger views current without losing filters',async({page,context,browser,baseURL})=>{
 await page.goto('/');await expect(page.getByTestId('send-request')).toBeVisible();const other=await browser.newContext({baseURL});await other.addCookies(await context.cookies());const ledger=await other.newPage(),map=await other.newPage();
 try{
  await ledger.goto('/requests.html?role=hospital&hospital=maple&view=incoming');await ledger.getByTestId('ledger-search').fill('HC-1043');
  await sendMRI(page);await ledger.bringToFront();await expect(ledger.getByTestId('ledger-HC-1043')).toBeVisible({timeout:15000});await expect(ledger.getByTestId('ledger-search')).toHaveValue('HC-1043');
  await map.goto('/network.html?role=ems&hospital=cedar&selected=maple&tiles=off');await map.getByTestId('map-resource').selectOption('MRI');await map.getByTestId('map-availability').selectOption('Open');
  await context.request.post('/api/readiness/maple',{data:{state:'Limited'}});await map.bringToFront();await expect(map.getByTestId('hospital-map-detail').locator('.tag').first()).toHaveText('Limited',{timeout:15000});await expect(map.getByTestId('map-resource')).toHaveValue('MRI');await expect(map.getByTestId('hospital-map-detail')).toContainText('Maplewood');await expect(map.getByTestId('map-availability')).toHaveValue('Open');await expect(map.getByTestId('selected-filter-note')).toContainText('Outside current filters');await expect(map.getByTestId('map-select-maple')).toHaveCount(0);await expect(map.getByTestId('map-pin-maple')).toBeVisible();
 }finally{await other.close();}
});
