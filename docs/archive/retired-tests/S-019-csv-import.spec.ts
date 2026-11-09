import {test,expect} from '@playwright/test';
test('Import the generated CSV and reject altered details',async({page,context})=>{
 await page.goto('/workspace.html?view=data');
 await page.getByTestId('import-format').selectOption('csv');
 const response=await context.request.get('/api/hackathon/export?format=csv'),csv=await response.text();
 await page.getByTestId('import-content').fill(csv);
 await page.getByTestId('import-confirm').check();
 await page.getByTestId('import-data').click();
 await expect(page.getByTestId('import-result')).toContainText('5 synthetic cases saved');
 await page.getByTestId('import-format').selectOption('csv');
 await page.getByTestId('import-content').fill(csv.replace('DEMO-PHN-0001','1234567890'));
 await page.getByTestId('import-confirm').check();
 await page.getByTestId('import-data').click();
 await expect(page.locator('#workspace-error')).toContainText('Only the exact generated fictional dataset');
 const saved=await context.request.get('/api/hackathon/cases');
 expect((await saved.json()).cases).toHaveLength(5);
});
