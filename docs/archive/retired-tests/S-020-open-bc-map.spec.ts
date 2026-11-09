import {test,expect} from '@playwright/test';
test('Open the BC map and inspect a hospital',async({page})=>{
 await page.goto('/');
 await page.getByTestId('open-bc-map').click();
 await expect(page).toHaveURL(/network\.html/);
 await expect(page.getByTestId('bc-map')).toBeVisible();
 await page.getByTestId('map-pin-maple').click();
 await expect(page.getByTestId('hospital-map-detail')).toContainText('Maplewood Regional Hospital');
 await expect(page.getByTestId('hospital-map-detail')).toContainText('MRI');
 await expect(page.getByTestId('hospital-map-detail')).toContainText('Open');
 await expect(page.getByTestId('map-data-notice')).toContainText('Fictional hospital locations');
 await page.getByTestId('fit-bc').click();
 await expect(page.getByTestId('map-geography-status')).toContainText('British Columbia');
});
