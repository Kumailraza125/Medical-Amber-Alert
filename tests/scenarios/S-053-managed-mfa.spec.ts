import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {otherStaff} from '../staff-helpers';
import {testUsers,authenticatorCode} from '../user-service-fixtures';
test('Complete managed second-factor sign-in and retry an incorrect code',async({page,context,browser,baseURL})=>{
 await context.request.get('/api/auth/config');const key=randomUUID().slice(0,8),email=`factor-${key}@hospital-connect.example.test`,password='ExampleFactorOnly!2026';expect((await context.request.post('/api/auth/register',{data:{email,password,name:'DEMO Factor Reviewer',employeeNumber:'DEMO-MFA-'+key.toUpperCase(),requestedRole:'hospital',facilityId:'maple'}})).status()).toBe(201);
 const admin=await otherStaff(browser,context,baseURL,'admin');try{const staff=(await (await admin.request.get('/api/staff')).json()).staff.find((s:any)=>s.email===email);expect((await admin.request.post('/api/staff/'+staff.userId,{data:{status:'approved',role:'hospital',facilityId:'maple',employeeVerified:true,reason:'Sample employee number checked'}})).status()).toBe(200);expect((await context.request.post('/api/auth/login',{data:{email,password}})).status()).toBe(200);
 const token=(await context.cookies()).find(c=>c.name==='hc_session')!.value,users=testUsers();const enrolled=await users.users.enrollTotp(token);await users.users.confirmTotp(token,authenticatorCode(enrolled.secret));await context.request.post('/api/auth/logout',{data:{}});
 await page.goto('/login.html');await page.getByTestId('login-email').fill(email);await page.getByTestId('login-password').fill(password);await expect(page.getByTestId('login-submit')).toBeEnabled();await page.getByTestId('login-submit').click();await expect(page.getByTestId('mfa-form')).toBeVisible();expect((await context.request.get('/api/requests')).status()).toBe(401);
 const valid=[-1,0,1].map(d=>authenticatorCode(enrolled.secret,d));let wrong='000000';while(valid.includes(wrong))wrong=String(Number(wrong)+1).padStart(6,'0');await page.getByTestId('mfa-code').fill(wrong);await page.getByTestId('mfa-submit').click();await expect(page.locator('#login-error')).not.toBeEmpty();await expect(page.getByTestId('mfa-form')).toBeVisible();expect((await context.request.get('/api/requests')).status()).toBe(401);
 await page.getByTestId('mfa-code').fill(authenticatorCode(enrolled.secret));await page.getByTestId('mfa-submit').click();await expect(page.getByTestId('staff-identity')).toContainText('DEMO Factor Reviewer');await expect(page.getByTestId('desk-location')).toHaveValue('maple');
 }finally{await admin.close();}
});
