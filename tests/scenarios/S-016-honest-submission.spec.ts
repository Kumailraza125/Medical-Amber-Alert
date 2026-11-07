import {test,expect} from '@playwright/test';
test('Show the third-option case and honest submission evidence',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/workspace.html');
 await page.getByTestId('submission-nav').click();
 await expect(page.getByTestId('case-answers')).toContainText('Who has the problem?');
 await expect(page.getByTestId('case-answers')).toContainText('What is at stake?');
 await expect(page.getByTestId('interview-status')).toContainText('Interview outstanding');
 await expect(page.getByTestId('interview-status')).toContainText('has not spoken');
 await expect(page.getByTestId('pitch-script')).toContainText('2:35–3:00');
 await expect(page.getByTestId('assumptions')).toContainText('not a trained AI model');
 for(const path of ['problem-summary.pdf','pitch-script.pdf','pitch-slides.pptx','requirements.md']){
  const response=await context.request.get('/submission/'+path);expect(response.ok()).toBe(true);
  const bytes=await response.body();expect(bytes.length).toBeGreaterThan(500);
  if(path.endsWith('.pdf'))expect(bytes.subarray(0,4).toString()).toBe('%PDF');
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
