import {hospitals} from './seed.js';
import {sampleStaff,samplePassword} from './sample-staff.js';
const $=s=>document.querySelector(s);let challenge=null;
$('#requested-facility').innerHTML=hospitals.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');
$('#sample-password').textContent='Sample password: '+samplePassword;
$('#sample-accounts').innerHTML=sampleStaff.map((s,i)=>`<p><button class="secondary" data-example="${i}" data-testid="sample-${s.role==='hospital'?s.facilityId:s.role}">Use ${s.name}</button><small> ${s.email}</small></p>`).join('');
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('#email').value=sampleStaff[Number(b.dataset.example)].email;$('#password').value=samplePassword;});
async function post(path,input){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not complete this step.');return data;}
async function signIn(input){$('#login-error').textContent='';try{const r=await post('/api/auth/login',input);if(r.mfa){challenge=r.mfa.challengeToken;$('#login-form').hidden=true;$('#mfa-form').hidden=false;return;}location.assign(r.actor.role==='admin'?'/staff.html':'/');}catch(e){$('#login-error').textContent=e.message;}}
$('#login-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await signIn({email:$('#email').value,password:$('#password').value});}finally{b.disabled=false;}};
$('#mfa-form').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{await signIn({challengeToken:challenge,code:$('#mfa-code').value});}finally{e.submitter.disabled=false;}};
$('#register-form').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{const r=await post('/api/auth/register',{name:$('#register-name').value,email:$('#register-email').value,password:$('#register-password').value,employeeNumber:$('#employee-number').value,requestedRole:$('#requested-role').value,facilityId:$('#requested-facility').value});$('#register-status').textContent=r.message;$('#register-password').value='';}catch(e){$('#register-status').textContent=e.message;}finally{e.submitter.disabled=false;}};
document.querySelectorAll('#login-form button,#register-form button').forEach(b=>b.disabled=true);
fetch('/api/auth/config').then(r=>{if(!r.ok)throw Error();document.querySelectorAll('#login-form button,#register-form button').forEach(b=>b.disabled=false);}).catch(()=>{$('#login-error').textContent='Sample staff setup is temporarily unavailable. Retry later; use your established offline backup process for urgent coordination.';});
