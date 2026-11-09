import {test,expect} from '@playwright/test';
test('Exclude closed facilities and show tired crews',async({page})=>{
 await page.goto('/workspace.html');
 await page.getByTestId('readiness-nav').click();
 await expect(page.getByTestId('fatigue-crew-maple')).toContainText('Fatigue review: 12+ hours');
 await page.getByTestId('facility-state-maple').selectOption('Closed');
 await page.getByTestId('save-facility-maple').click();
 await expect(page.locator('#workspace-status')).toContainText('saved');
 await page.reload();
 await expect(page.getByTestId('facility-state-maple')).toHaveValue('Closed');
 await page.getByTestId('cases-nav').click();
 await page.getByTestId('profile-id').selectOption('demo-002');
 await page.getByTestId('synthetic-confirmed').check();
 await page.getByTestId('save-case').click();
 await expect(page.getByTestId('case-detail')).toBeVisible();
 await expect(page.getByTestId('recommendation-maple')).toHaveCount(0);
 await expect(page.getByTestId('recommendation-riverside')).toBeVisible();
});
