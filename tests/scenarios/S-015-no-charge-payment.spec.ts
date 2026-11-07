import {test,expect} from '@playwright/test';
test('Review a demo worker payment without charging anyone',async({page})=>{
 await page.goto('/workspace.html?view=payments');
 await page.getByTestId('payment-worker').selectOption('nurse-river');
 await page.getByTestId('payment-amount').fill('87.50');
 await page.getByTestId('payment-confirm').check();
 await page.getByTestId('create-payment').click();
 await expect(page.getByTestId('payment-PAY-0001')).toContainText('87.50 CAD');
 await page.getByTestId('approve-PAY-0001').click();
 await expect(page.getByTestId('payment-PAY-0001')).toContainText('Approved for demo handoff');
 await expect(page.getByTestId('payment-PAY-0001')).toContainText('No payment processed');
 await page.reload();
 await expect(page.getByTestId('payment-PAY-0001')).toContainText('External checkout not connected');
 await expect(page.getByTestId('approve-PAY-0001')).toHaveCount(0);
});
