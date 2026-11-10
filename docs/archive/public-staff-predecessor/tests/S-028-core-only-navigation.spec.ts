import {test,expect} from '@playwright/test';
test('Keep only core navigation and disable retired features',async({page,context})=>{
 await page.goto('/');await page.getByTestId('role-hospital').click();await page.getByTestId('role-ems').click();
 const nav=page.getByRole('navigation',{name:'Main navigation'});
 await expect(nav).toContainText('EMS desk');await expect(nav).toContainText('Hospital desk');await expect(nav).toContainText('BC hospital map');
 await expect(nav).not.toContainText('payment');await expect(nav).not.toContainText('submission');await expect(nav).not.toContainText('screening');
 await page.goto('/workspace.html?view=payments');await expect(page).toHaveURL(/\/$/);await expect(page.getByTestId('role-ems')).toBeVisible();
 for(const path of ['/api/hackathon/payments','/api/hackathon/cases','/api/hackathon/export?format=json','/workspace.js','/submission/problem-summary.pdf','/submission/pitch-slides.pptx','/submission-data.js'])expect((await context.request.get(path)).status(),path).toBe(404);
 expect((await context.request.post('/api/hackathon/payments',{data:{amountCents:1000}})).status()).toBe(404);
});
