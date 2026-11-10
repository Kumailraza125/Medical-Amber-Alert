import {test,expect} from '@playwright/test';
test('See the original logo and clear workflow visuals across the app',async({page,context})=>{
 for(const path of ['/','/?role=hospital&hospital=maple','/network.html?tiles=off','/requests.html?role=hospital&hospital=maple&view=incoming','/hospital.html?id=maple','/about.html']){
  await page.goto(path);const logo=page.getByTestId('brand-logo');await expect(logo).toBeVisible();await expect(logo).toHaveAttribute('src','/logo.svg');await expect.poll(()=>logo.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
 }
 await expect(page.getByTestId('workflow-illustration')).toHaveAttribute('alt',/EMS sends.*hospital accepts.*EMS sees/);await expect.poll(()=>page.getByTestId('workflow-illustration').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 const logo=await context.request.get('/logo.svg');expect(logo.status()).toBe(200);expect(logo.headers()['content-type']).toContain('image/svg+xml');expect(await logo.text()).toContain('M12 5v14 M5 12h14');
 await page.getByTestId('about-return').click();for(const key of ['pending','accepted','completed'])await expect(page.getByTestId('summary-icon-'+key).locator('svg')).toBeVisible();await expect(page.getByTestId('send-request')).toBeEnabled();
});
