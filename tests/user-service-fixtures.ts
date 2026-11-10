// Test-only authenticator. The app uses Piezas MFA; this acts as the employee's
// authenticator during a real users-service browser test, never an auth provider.
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {Piezas} from '@piezas/sdk';
export function testUsers(){const env=Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^['"]|['"]$/g,'')];}));return new Piezas({apiKey:process.env.PIEZAS_TEST_API_KEY||env.PIEZAS_TEST_API_KEY,apiBaseUrl:process.env.PIEZAS_API_URL||env.PIEZAS_API_URL});}
export function authenticatorCode(secret:string,delta=0){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,'').toUpperCase())bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)+delta));const h=createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');}
