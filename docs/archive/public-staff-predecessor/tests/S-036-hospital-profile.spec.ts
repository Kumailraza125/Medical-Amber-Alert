import {test,expect} from '@playwright/test';
test('Explore one hospital and return to the same desk context',async({page})=>{
 await page.goto('/network.html?role=ems&hospital=cedar&selected=maple&tiles=off');await expect(page.getByTestId('hospital-map-detail')).toContainText('Maplewood');await page.getByTestId('hospital-profile-link').click();
 await expect(page).toHaveURL(/hospital.html\?id=maple/);const profile=page.getByTestId('hospital-profile');await expect(profile.getByRole('heading',{level:1})).toHaveText('Maplewood Regional Hospital');await expect(profile).not.toContainText('Riverside');await expect(page.getByTestId('profile-availability')).toHaveText('Open');
 await expect(page.getByTestId('profile-open-desk')).toHaveAttribute('href','/?role=hospital&hospital=maple');await expect(page.getByTestId('profile-return-desk')).toHaveAttribute('href','/?role=ems&hospital=cedar');
 await page.getByTestId('profile-back-map').click();await expect(page.getByTestId('overview-hospital')).toHaveValue('cedar');await expect(page.getByTestId('hospital-map-detail')).toContainText('Maplewood');
 await page.getByTestId('hospital-profile-link').click();await page.getByTestId('profile-open-desk').click();await expect(page.getByTestId('desk-location')).toHaveValue('maple');await expect(page.getByTestId('role-hospital')).toHaveClass('active');
});
