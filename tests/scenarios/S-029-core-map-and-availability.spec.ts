import {test,expect} from '@playwright/test';
test('Use hospital availability and the BC map in the core workflow',async({page})=>{
 await page.goto('/?role=hospital&hospital=maple');await page.getByTestId('hospital-state').selectOption('Closed');await page.getByTestId('save-availability').click();
 await expect(page.locator('#action-status')).toContainText('saved');await page.getByTestId('role-ems').click();
 await page.getByTestId('resource').selectOption('MRI');await expect(page.getByTestId('target-hospital').locator('option[value="maple"]')).toHaveCount(0);
 await page.getByTestId('open-bc-map').click();await page.getByTestId('map-resource').selectOption('MRI');await page.getByTestId('map-availability').selectOption('Closed');
 await expect(page.getByTestId('map-select-maple')).toBeVisible();await page.getByTestId('map-select-maple').click();
 await expect(page.getByTestId('hospital-map-detail')).toContainText('Closed');
 await expect(page.getByTestId('map-data-notice')).toContainText('Fictional hospital locations');
});
