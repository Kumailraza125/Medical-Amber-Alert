import {test,expect} from '@playwright/test';
test('Create a synthetic case with an explained demo priority',async({page})=>{
 await page.goto('/workspace.html');
 await page.getByTestId('profile-id').selectOption('demo-002');
 await page.getByTestId('breathing-concern').check();
 await page.getByTestId('synthetic-confirmed').check();
 await page.getByTestId('save-case').click();
 await expect(page.getByTestId('case-detail')).toContainText('Critical demo priority');
 await expect(page.getByTestId('screening-explanation')).toContainText('Breathing-concern answer selected');
 await expect(page.getByTestId('recommendation-maple')).toBeVisible();
 await expect(page.getByTestId('case-detail')).toContainText('not trained AI');
 await page.reload();
 await page.getByTestId('case-CASE-0001').click();
 await expect(page.getByTestId('case-detail')).toContainText('Critical demo priority');
 await expect(page.getByTestId('screening-explanation')).toContainText('Breathing-concern answer selected');
});
