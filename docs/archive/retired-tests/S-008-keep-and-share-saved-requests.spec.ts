import {test,expect} from '@playwright/test';
test('Keep a request after refresh and share it with another visitor', async ({page,context,browser,baseURL}) => {
  await page.goto('/');
  await page.getByTestId('new-request').click();
  await page.getByTestId('note').fill('Saved shared MRI coordination example');
  await page.getByTestId('send-request').click();
  await expect(page.getByTestId('request-HC-1043')).toBeVisible();
  await page.reload();
  await page.getByTestId('request-HC-1043').click();
  await expect(page.getByTestId('detail-note')).toHaveText('Saved shared MRI coordination example');
  await page.locator('#close-detail').click();
  // Both independent browsers use the same isolated test fixture namespace.
  // All records and responses still go to the real Piezas test app.
  const other=await browser.newContext({baseURL});
  await other.addCookies(await context.cookies());
  const visitor=await other.newPage();
  try {
    await visitor.goto('/');
    await visitor.getByTestId('hospital-switch').selectOption('maple');
    await visitor.getByTestId('incoming-tab').click();
    await visitor.getByTestId('request-HC-1043').click();
    await expect(visitor.getByTestId('detail-note')).toHaveText('Saved shared MRI coordination example');
    await visitor.getByTestId('availability').fill('55');
    await visitor.getByTestId('offer-availability').click();
    await expect(visitor.getByTestId('offer-confirmation')).toBeVisible();
    await page.reload();
    await page.getByTestId('request-HC-1043').click();
    await expect(page.locator('#detail-modal')).toContainText('Available in 55 minutes');
    await expect(page.getByTestId('demo-banner')).toContainText('saved for all visitors');
  } finally { await other.close(); }
});
