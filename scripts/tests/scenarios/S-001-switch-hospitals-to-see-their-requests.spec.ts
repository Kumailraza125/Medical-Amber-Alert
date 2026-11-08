// piezas-scenario: S-001 v=9487838bd413
import {test,expect} from '@playwright/test';
test('Switch hospitals to see their requests', async ({ page }) => {await page.goto('/');await page.getByTestId('hospital-switch').selectOption('maple');await page.getByTestId('incoming-tab').click();await expect(page.getByTestId('request-HC-1040')).toBeVisible();await page.getByTestId('request-HC-1040').click();await expect(page.getByTestId('offer-availability')).toBeVisible();});
