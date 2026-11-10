import {test,expect} from '@playwright/test';
import {uiLogin} from '../staff-helpers';
test('Sign in as sample staff and reject role spoofing',async({page,context})=>{
 await page.goto('/');await expect(page).toHaveURL(/login.html/);expect((await context.request.get('/api/requests')).status()).toBe(401);
 await page.getByTestId('login-email').fill('ems@hospital-connect.example.test');await page.getByTestId('login-password').fill('not-the-correct-password');await expect(page.getByTestId('login-submit')).toBeEnabled();await page.getByTestId('login-submit').click();await expect(page.locator('#login-error')).toContainText('Sign-in failed');
 await uiLogin(page);await page.goto('/?role=hospital&hospital=north');await expect(page.getByTestId('staff-identity')).toContainText('DEMO EMS Coordinator');await expect(page.getByTestId('desk-location')).toHaveValue('cedar');await expect(page.getByTestId('desk-location')).toBeDisabled();await expect(page.getByTestId('role-hospital')).toBeHidden();
 await page.getByTestId('sign-out').click();await expect(page).toHaveURL(/login.html/);expect((await context.request.get('/api/requests')).status()).toBe(401);
});
