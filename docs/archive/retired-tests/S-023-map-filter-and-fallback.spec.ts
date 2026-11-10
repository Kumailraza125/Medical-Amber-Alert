import {test,expect} from '@playwright/test';
test('Filter map availability and use the map without street tiles',async({page})=>{
 await page.goto('/workspace.html?view=readiness');await page.getByTestId('facility-state-maple').selectOption('Closed');await page.getByTestId('save-facility-maple').click();await expect(page.locator('#workspace-status')).toContainText('saved');
 await page.setViewportSize({width:390,height:844});await page.goto('/network.html?tiles=off');
 await page.getByTestId('map-resource').selectOption('MRI');await page.getByTestId('map-availability').selectOption('Closed');
 await expect(page.getByTestId('map-select-maple')).toBeVisible();await expect(page.getByTestId('map-select-riverside')).toHaveCount(0);
 await page.getByTestId('map-select-maple').click();await expect(page.getByTestId('hospital-map-detail')).toContainText('Closed');
 await expect(page.getByTestId('map-geography-status')).toContainText('Local BC outline');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
