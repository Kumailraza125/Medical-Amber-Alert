import {test,expect} from '@playwright/test';
test('Review duplicate data without denying coordination',async({page})=>{
 await page.goto('/workspace.html');
 for(let i=0;i<2;i++){
  await page.getByTestId('profile-id').selectOption('demo-002');
  await page.getByTestId('synthetic-confirmed').check();
  await page.getByTestId('save-case').click();
  await expect(page.getByTestId('case-detail')).toContainText(`CASE-000${i+1}`);
 }
 await expect(page.getByTestId('duplicate-check')).toContainText('Needs human check');
 await expect(page.getByTestId('duplicate-check')).toContainText('not proof of fraud');
 await expect(page.getByTestId('refer-case')).toBeEnabled();
 await page.getByTestId('review-case').click();
 await expect(page.getByTestId('duplicate-check')).toContainText('Reviewed');
 await page.reload();await page.getByTestId('case-CASE-0002').click();
 await expect(page.getByTestId('duplicate-check')).toContainText('Reviewed');
 await page.getByTestId('refer-case').click();
 await expect(page.getByTestId('case-referral')).toBeVisible();
});
