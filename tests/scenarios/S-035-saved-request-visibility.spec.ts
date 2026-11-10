import {test,expect} from '@playwright/test';
import {sendMRI} from '../core-helpers';
test('Reveal a newly saved request despite a previous filter',async({page})=>{
 await page.goto('/');await page.getByTestId('count-completed').click();await expect(page.getByTestId('filter-completed')).toHaveAttribute('aria-pressed','true');
 await sendMRI(page);await expect(page.getByTestId('filter-all')).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('request-HC-1043')).toContainText('Awaiting hospital acceptance');
 await page.getByTestId('request-HC-1043').click();await expect(page.getByTestId('request-routing')).toContainText('Maplewood');await expect(page.getByTestId('request-routing')).not.toContainText('Riverside');
});
