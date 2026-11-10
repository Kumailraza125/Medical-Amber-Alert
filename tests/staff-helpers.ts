import {expect,type BrowserContext,type Page,type Browser} from '@playwright/test';
import {sampleStaff,samplePassword} from '../dist/sample-staff.js';
export async function login(c:BrowserContext,role='ems'){
 expect((await c.request.get('/api/auth/config')).status()).toBe(200);
 const s=sampleStaff.find(s=>s.role===role||s.facilityId===role)!;expect(s).toBeTruthy();
 const r=await c.request.post('/api/auth/login',{data:{email:s.email,password:samplePassword}});expect(r.status(),await r.text()).toBe(200);return (await r.json()).actor;
}
export async function otherStaff(browser:Browser,c:BrowserContext,baseURL:string|undefined,role:string){const other=await browser.newContext({baseURL});await other.addCookies(await c.cookies());await login(other,role);return other;}
export async function send(c:BrowserContext,extra:Record<string,unknown>={}){const r=await c.request.post('/api/requests',{data:{resource:'MRI',urgency:'Urgent',radiusKm:100,note:'Timing example only',...extra}});expect(r.status(),await r.text()).toBe(201);return (await r.json()).request;}
export async function action(c:BrowserContext,r:any,name:string,data:Record<string,unknown>={}){return c.request.post(`/api/requests/${r.recordId}/${name}`,{data});}
export async function publish(c:BrowserContext,id='maple',state='Open'){const r=await c.request.post('/api/readiness/'+id,{data:{state}});expect(r.status()).toBe(200);return (await r.json()).facilities.find((h:any)=>h.id===id);}
export async function reviewAccept(c:BrowserContext,r:any,id='maple',extra:Record<string,unknown>={}){expect((await action(c,r,'begin-review')).status()).toBe(200);const f=await publish(c,id);const a=await action(c,r,'hospital-accept',{capacityConfirmed:true,receivingDelayMinutes:0,availabilityVersion:f.updatedAt,...extra});expect(a.status(),await a.text()).toBe(200);return (await a.json()).request;}
export async function uiLogin(page:Page,role='ems'){await page.goto('/login.html');await page.getByTestId('show-sample-accounts').click();await page.getByTestId('sample-'+role).click();await expect(page.getByTestId('login-submit')).toBeEnabled({timeout:20000});await page.getByTestId('login-submit').click();await expect(page.getByTestId(role==='admin'?'staff-list':'staff-identity')).toBeVisible({timeout:15000});}
