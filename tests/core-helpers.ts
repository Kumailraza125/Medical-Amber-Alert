import {expect,type Page} from '@playwright/test';
export async function sendMRI(page:Page,target='maple'){
 await page.getByTestId('resource').selectOption('MRI');
 await page.getByTestId('target-hospital').selectOption(target);
 await page.getByTestId('send-request').click();
 await expect(page.getByTestId('request-HC-1043')).toBeVisible();
}
