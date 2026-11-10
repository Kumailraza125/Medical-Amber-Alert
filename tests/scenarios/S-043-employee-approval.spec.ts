import {test,expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
import {login,otherStaff} from '../staff-helpers';
test('Approve employee-number access requests before granting a role',async({page,context,browser,baseURL})=>{
 await context.request.get('/api/auth/config');const key=randomUUID().slice(0,8),email=`worker-${key}@hospital-connect.example.test`,password='SampleNewEmployee!2026';
 await page.goto('/login.html');await page.getByTestId('show-registration').click();await page.getByTestId('register-email').fill(email);await page.getByTestId('employee-number').fill('123456');await page.getByTestId('register-password').fill(password);await page.getByTestId('register-submit').click();await expect(page.locator('#register-status')).toContainText('DEMO employee number');
 await page.getByTestId('employee-number').fill('DEMO-NEW-'+key.toUpperCase());await page.getByTestId('requested-facility').selectOption('maple');await page.getByTestId('register-submit').click();await expect(page.locator('#register-status')).toContainText('must review');
 expect((await context.request.post('/api/auth/login',{data:{email,password}})).status()).toBe(401);
 const admin=await otherStaff(browser,context,baseURL,'admin');try{const rows=(await (await admin.request.get('/api/staff')).json()).staff;const s=rows.find((s:any)=>s.email===email);expect(s.role).toBeNull();
 expect((await admin.request.post('/api/staff/'+s.userId,{data:{status:'approved',role:'hospital',facilityId:'maple',employeeVerified:false,reason:'Sample badge checked'}})).status()).toBe(400);
 expect((await admin.request.post('/api/staff/'+s.userId,{data:{status:'approved',role:'hospital',facilityId:'maple',employeeVerified:true,reason:'Sample badge checked'}})).status()).toBe(200);
 expect((await context.request.post('/api/auth/login',{data:{email,password}})).status()).toBe(200);await page.goto('/');await expect(page.getByTestId('staff-identity')).toContainText('DEMO New Reviewer');await expect(page.getByTestId('desk-location')).toHaveValue('maple');expect((await context.request.get('/api/staff')).status()).toBe(403);
 expect((await context.request.post('/api/auth/register',{data:{email:'other-'+key+'@hospital-connect.example.test',password,name:'DEMO Other',employeeNumber:'DEMO-OTHER-'+key.toUpperCase(),requestedRole:'admin',facilityId:'maple',role:'admin'}})).status()).toBe(400);
 }finally{await admin.close();}
});
