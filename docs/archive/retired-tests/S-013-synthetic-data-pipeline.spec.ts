import {test,expect} from '@playwright/test';
test('Export synthetic data and validate an import',async({page,context})=>{
 await page.goto('/workspace.html?view=data');
 for(const format of ['csv','json','xlsx']){
  const downloadPromise=page.waitForEvent('download');
  await page.getByTestId('export-'+format).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('synthetic-patients.'+format);
 }
 const dataset=await (await context.request.get('/api/hackathon/export?format=json')).json();
 expect(dataset).toHaveLength(5);
 for(const field of ['fullName','personalHealthNumber','contactInfo','injuryOrIllness','medicalBackground'])expect(dataset[0]).toHaveProperty(field);
 const xlsx=await (await context.request.get('/api/hackathon/export?format=xlsx')).body();
 expect(xlsx.subarray(0,2).toString()).toBe('PK');
 expect(xlsx.toString()).toContain('xl/worksheets/sheet1.xml');
 expect(xlsx.toString()).toContain('DEMO Avery Morgan');
 await page.getByTestId('import-content').fill(JSON.stringify(dataset));
 await page.getByTestId('import-confirm').check();
 await page.getByTestId('import-data').click();
 await expect(page.getByTestId('import-result')).toContainText('5 synthetic cases saved; 0 already imported');
 await page.getByTestId('import-content').fill(JSON.stringify(dataset));
 await page.getByTestId('import-confirm').check();
 await page.getByTestId('import-data').click();
 await expect(page.getByTestId('import-result')).toContainText('0 synthetic cases saved; 5 already imported');
 const invalid=structuredClone(dataset);invalid[0].personalHealthNumber='1234567890';
 const rejected=await context.request.post('/api/hackathon/import',{data:{format:'json',content:JSON.stringify(invalid),syntheticConfirmed:true}});
 expect(rejected.status()).toBe(400);
 await page.getByTestId('cases-nav').click();
 await expect(page.getByTestId('case-CASE-0005')).toBeVisible();
});
