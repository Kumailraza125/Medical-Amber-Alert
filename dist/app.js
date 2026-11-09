import {hospitals,resources,distance} from './seed.js';
import {eligibleHospitals,recipientIds,isIncoming,hospitalById} from './request-utils.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),validId=id=>hospitals.some(h=>h.id===id);
let role=params.get('role')==='hospital'?'hospital':'ems';
let emsBase=role==='ems'&&validId(params.get('hospital'))?params.get('hospital'):'cedar';
let receiving=role==='hospital'&&validId(params.get('hospital'))?params.get('hospital'):'maple';
let requests=[],notices=[],facilities=[],states={},filter='all',busy=false,initialized=false,sequence=0,loading=false,selected=null,detailSignature='',lastStatus='';
const name=id=>hospitalById(id)?.name||'Unknown hospital';
const desk=id=>`${hospitalById(id).short} EMS desk`;
const statusLabel=r=>r.status==='Awaiting responses'?'Awaiting hospital acceptance':r.status;
const stamp=at=>at?new Date(at).toLocaleString():'Time not recorded';
const current=()=>role==='ems'?emsBase:receiving;
const mapUrl=id=>`/network.html?hospital=${current()}&role=${role}${id?'&selected='+id:''}`;
function badge(r){return `<span class="tag ${r.status==='Awaiting responses'?'warning':r.status==='Accepted'?'blue':''}">${statusLabel(r)}</span>`;}
async function api(path,input){
 let response;try{response=await fetch(path,{method:input?'POST':'GET',headers:input?{'Content-Type':'application/json'}:{},body:input?JSON.stringify(input):undefined});}catch{throw new Error(input?'Could not confirm this change. Check your connection and refresh saved requests before retrying.':'Could not load saved updates. Check your connection and use Refresh.');}
 const result=await response.json();if(!response.ok)throw new Error(result.error||'The change could not be saved. Please retry.');return result;
}
function syncUrl(){const u=new URL(location.href);u.searchParams.set('role',role);u.searchParams.set('hospital',current());u.searchParams.delete('request');history.replaceState(null,'',u.pathname+u.search);}
function render(){
 $('#app').innerHTML=`<main class="core-wrap"><header class="core-header"><a href="/" class="core-brand">Hospital Connect<small>EMS requests · hospital acceptance</small></a><nav class="core-nav" aria-label="Main navigation"><button class="${role==='ems'?'active':''}" id="ems-role" data-testid="role-ems">EMS desk</button><button class="${role==='hospital'?'active':''}" id="hospital-role" data-testid="role-hospital">Hospital desk</button><a data-testid="open-bc-map" href="${mapUrl()}">BC hospital map</a></nav></header><div class="core-banner" data-testid="demo-banner"><strong>Prototype disclaimer.</strong> Shared public access; desk selectors are not sign-in. Hospital locations and capacity are invented. Do not enter patient information. Confirm capacity directly before any real transfer. Notifications stay in this app; no emergency dispatch, email or SMS is sent.</div><div class="core-title"><div><div class="eyebrow">${role==='ems'?'RESOURCE COORDINATION':'HOSPITAL INBOX'}</div><h1>${role==='ems'?'EMS request desk':'Hospital acceptance desk'}</h1><p>${role==='ems'?'Request the resource you need and see which hospital accepts.':'Review incoming requests and accept directly on behalf of your hospital.'}</p></div><div class="core-context"><label class="field"><span>${role==='ems'?'EMS dispatch base':'Receiving hospital'}</span><select id="desk-location" data-testid="desk-location">${hospitals.map(h=>`<option value="${h.id}" ${h.id===current()?'selected':''}>${esc(role==='ems'?h.short+' EMS base':h.name)}</option>`).join('')}</select></label></div></div><div class="core-actions"><button class="secondary" id="refresh" data-testid="refresh-requests">Refresh</button><span id="sync-status" class="sync-state">Checking saved updates…</span></div><div id="core-error" class="core-error" role="alert"></div><div id="action-status" class="core-alert" role="status">${esc(lastStatus)}</div>${role==='ems'?emsScreen():hospitalScreen()}<footer class="core-footer">Hospital Connect · British Columbia</footer></main>`;
 $('#ems-role').onclick=()=>switchRole('ems');$('#hospital-role').onclick=()=>switchRole('hospital');
 $('#desk-location').onchange=e=>{if(role==='ems'){emsBase=e.target.value;notices=[];}else receiving=e.target.value;selected=null;filter='all';lastStatus='';syncUrl();render();loadData();};
 $('#refresh').onclick=()=>loadData();
 if(role==='ems')bindSend();else bindAvailability();
 updateViews();
}
function emsScreen(){return `<div id="counts" class="core-counts"></div><section id="notification-panel" class="core-notifications" aria-label="Acceptance notifications"></section><div class="core-grid"><section class="panel"><div class="section-kicker">NEW REQUEST</div><h2>Find the care resource you need</h2><form id="send-form"><label class="field"><span>Resource needed</span><select id="resource" data-testid="resource">${resources.map(r=>`<option>${r}</option>`).join('')}</select></label><div class="formrow"><label class="field"><span>Priority set by EMS</span><select id="urgency" data-testid="urgency"><option>Routine</option><option selected>Urgent</option><option>Critical</option></select></label><label class="field"><span>Search radius (km)</span><input id="radius" data-testid="radius" type="number" min="1" max="500" step="1" value="100" required></label></div><label class="field"><span>Send to</span><select id="target-hospital" data-testid="target-hospital"><option value="">All eligible nearby hospitals</option></select></label><div id="match-preview" class="target-preview" data-testid="match-preview"></div><label class="field"><span>Coordination note (optional)</span><textarea id="note" data-testid="note" rows="3" maxlength="500" placeholder="Resource or timing details only. No patient information."></textarea></label><p class="muted" style="font-size:11px">Shared with recipient hospitals. Resource and timing details only; never include patient information.</p><button class="primary" type="submit" data-testid="send-request">Send request</button></form></section><section class="panel"><div class="core-panel-head"><h2>Your EMS requests</h2><span class="tag" id="request-count"></span></div>${filterButtons()}<div id="request-list" class="request-stack" data-testid="request-list"></div></section></div>`;}
function hospitalScreen(){
 const h=facilities.find(h=>h.id===receiving);
 return `<section class="core-availability"><div><h2>Hospital availability</h2><p>Set your status before reviewing requests. Closed hospitals cannot accept new requests.</p></div><label class="field"><span>Current availability</span><select id="hospital-state" data-testid="hospital-state">${['Open','Limited','Closed'].map(s=>`<option ${h?.state===s?'selected':''}>${s}</option>`).join('')}</select></label><button class="secondary" id="save-availability" data-testid="save-availability">Save availability</button></section><section class="panel core-wide"><div class="core-panel-head"><h2>Requests for ${esc(hospitalById(receiving).short)}</h2><span class="tag" id="request-count"></span></div><p class="compact-meta">Accept a request to notify EMS automatically with your hospital’s name.</p>${filterButtons()}<div id="request-list" class="request-stack" data-testid="request-list"></div></section>`;
}
function filterButtons(){const options=role==='ems'?[['all','All requests'],['pending','Awaiting acceptance'],['accepted','Accepted'],['completed','Completed']]:[['all','Incoming requests'],['accepted','Accepted here'],['completed','Completed here']];return `<div class="core-tabs" role="group" aria-label="Request filter">${options.map(([key,label])=>`<button data-filter="${key}" data-testid="filter-${key}" class="${key===filter?'active':''}">${label}</button>`).join('')}</div>`;}
function ownRows(){return requests.filter(r=>role==='ems'?r.hospitalId===emsBase:isIncoming(r,receiving,states)||r.acceptedHospitalId===receiving);}
function visibleRows(){return ownRows().filter(r=>filter==='pending'?r.status==='Awaiting responses':filter==='accepted'?r.status==='Accepted'&&(role==='ems'||r.acceptedHospitalId===receiving):filter==='completed'?r.status==='Completed'&&(role==='ems'||r.acceptedHospitalId===receiving):role==='hospital'?r.status==='Awaiting responses':true);}
function updateViews(){
 if(!initialized)return;
 const rows=visibleRows(),root=$('#request-list');
 root.innerHTML=rows.length?rows.map(r=>`<button class="core-request" data-request="${r.id}" data-testid="request-${r.id}"><div class="core-request-top"><h3>${esc(r.id)} · ${esc(r.resource)}</h3>${badge(r)}</div><p>${esc(r.delivery?.requester?.name||desk(r.hospitalId))}${r.delivery?.requester?.type==='ems'?'':' · earlier coordination request'}</p>${r.acceptedHospitalId?`<p><strong>${esc(name(r.acceptedHospitalId))}</strong> ${r.delivery?.acceptanceMode==='hospital-direct'?'accepted this request':'is the recorded destination'}</p>`:`<p>${recipientIds(r,states).length} recipient hospital${recipientIds(r,states).length===1?'':'s'} · ${r.radiusKm} km radius</p>`}<small>${esc(r.urgency)} priority · ${esc(stamp(r.createdAt))} · Open details →</small></button>`).join(''):'<div class="core-empty" data-testid="empty-requests">No requests in this view.</div>';
 $('#request-count').textContent=String(rows.length);
 document.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>openDetail(b.dataset.request));
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.filter===filter);b.onclick=()=>{filter=b.dataset.filter;updateViews();};});
 if(role==='hospital'&&$('#hospital-state')&&document.activeElement!==$('#hospital-state'))$('#hospital-state').value=states[receiving]||'Open';
 if(role==='ems'){
  const own=ownRows();$('#counts').innerHTML=[['pending','Awaiting acceptance',own.filter(r=>r.status==='Awaiting responses').length],['accepted','Accepted',own.filter(r=>r.status==='Accepted').length],['completed','Completed',own.filter(r=>r.status==='Completed').length]].map(([key,label,count])=>`<button data-count="${key}" data-testid="count-${key}"><strong>${count}</strong><small>${label}</small></button>`).join('');
  document.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{filter=b.dataset.count;updateViews();});
  updateNotifications();refreshTargets();
 }
 if(selected&&$('#detail-modal').open){const r=requests.find(r=>r.id===selected);if(r&&JSON.stringify(r)!==detailSignature)renderDetail(r);}
}
function updateNotifications(){
 const unread=notices.filter(n=>!n.readAt).length;
 const html=`<div class="panel"><div class="core-panel-head"><h2>Acceptance updates</h2><span class="tag ${unread?'blue':''}" data-testid="notification-count">${unread} unread</span></div><div class="notification-list" tabindex="0" aria-label="Acceptance notification history" aria-live="polite" aria-relevant="additions text" data-testid="notifications">${notices.length?notices.map(n=>`<article class="notification ${n.readAt?'read':''}" data-testid="notification-${n.requestId}"><h3>${esc(n.hospitalName)} accepted ${esc(n.requestId)}</h3><span data-testid="notification-time-${n.requestId}">Accepted ${esc(stamp(n.acceptedAt))}</span><br><small>${n.readAt?'Read · '+esc(stamp(n.readAt)):'EMS notified automatically.'}</small><div class="buttonrow"><button class="secondary" data-notification-open="${n.requestId}">View request</button>${!n.readAt?`<button class="secondary" data-read="${n.recordId}" data-testid="read-${n.requestId}">Mark read</button>`:''}</div></article>`).join(''):'<p class="muted">No acceptances yet. Hospital names and times will appear here automatically.</p>'}</div></div>`;
 const root=$('#notification-panel');if(root.innerHTML!==html)root.innerHTML=html;
 document.querySelectorAll('[data-notification-open]').forEach(b=>b.onclick=()=>openDetail(b.dataset.notificationOpen));
 document.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>act(async()=>{await api(`/api/requests/${b.dataset.read}/notification-read`,{emsBaseId:emsBase});await loadData();showStatus('Acceptance notification marked read.');}));
}
function bindSend(){
 $('#resource').onchange=refreshTargets;$('#radius').oninput=refreshTargets;
 $('#send-form').onsubmit=e=>{e.preventDefault();const input={emsBaseId:emsBase,resource:$('#resource').value,urgency:$('#urgency').value,radiusKm:Number($('#radius').value),note:$('#note').value.trim(),targetHospitalId:$('#target-hospital').value||undefined};act(async()=>{const result=await api('/api/requests',input);$('#note').value='';await loadData();showStatus(`${result.request.id} sent to ${result.request.delivery.recipientIds.length} hospital${result.request.delivery.recipientIds.length===1?'':'s'}. Waiting for hospital acceptance.`);});};
 refreshTargets();
}
function refreshTargets(){
 if(!$('#target-hospital'))return;
 const radius=Number($('#radius').value),target=$('#target-hospital'),chosen=target.value;
 if(!Number.isInteger(radius)||radius<1||radius>500){$('#match-preview').textContent='Enter a whole-number radius from 1 to 500 km.';return;}
 const options=eligibleHospitals({hospitalId:emsBase,resource:$('#resource').value,radiusKm:radius,delivery:{requester:{type:'ems'}}},states);
 target.innerHTML='<option value="">All eligible nearby hospitals</option>'+options.map(h=>`<option value="${h.id}">${esc(h.name)} · ${Math.round(distance(hospitalById(emsBase),h))} km</option>`).join('');
 if(chosen&&!options.some(h=>h.id===chosen))target.insertAdjacentHTML('beforeend',`<option value="${esc(chosen)}" selected disabled>No longer eligible: ${esc(name(chosen))}</option>`);else target.value=chosen;
 $('#match-preview').textContent=options.length?`${options.length} eligible hospital${options.length===1?'':'s'}: ${options.map(h=>h.short).join(', ')}.`:'No matching hospitals are currently open in this radius. Change the resource or radius before sending.';
}
function bindAvailability(){
 $('#save-availability').onclick=()=>{const state=$('#hospital-state').value,hospitalId=receiving;act(async()=>{const result=await api('/api/readiness/'+hospitalId,{state});facilities=result.facilities;states=Object.fromEntries(facilities.map(h=>[h.id,h.state]));updateViews();showStatus('Hospital availability saved.');});};
}
function openDetail(id){const r=requests.find(r=>r.id===id);if(!r)return;selected=id;renderDetail(r);if(!$('#detail-modal').open)$('#detail-modal').showModal();}
function renderDetail(r){
 const ids=recipientIds(r,states),canAccept=role==='hospital'&&r.status==='Awaiting responses'&&ids.includes(receiving)&&states[receiving]!=='Closed';
 const events=r.delivery?.events||[],saved=Array.isArray(r.delivery?.recipientIds);detailSignature=JSON.stringify(r);
 const focusId=document.activeElement?.id;
 $('#detail-modal').innerHTML=`<div class="dialog-head"><span class="eyebrow">${esc(r.id)}</span><button id="close-detail" data-testid="close-detail">Close</button></div><h2 id="detail-title">${esc(r.resource)} request</h2>${badge(r)}<div class="core-facts"><div><small>Requesting EMS desk</small><strong>${esc(r.delivery?.requester?.name||desk(r.hospitalId))}</strong></div><div><small>Priority / radius</small><strong>${esc(r.urgency)} · ${r.radiusKm} km</strong></div></div>${r.acceptedHospitalId?`<div class="accepted-block" data-testid="accepted-hospital"><small>${r.delivery?.acceptanceMode==='hospital-direct'?'Hospital accepted directly':'Earlier recorded destination'}</small><strong>${esc(name(r.acceptedHospitalId))}</strong>${esc(hospitalById(r.acceptedHospitalId).contact)}<br><small>${r.delivery?.acceptedAt?'Accepted '+esc(stamp(r.delivery.acceptedAt)):'Acceptance time not recorded for this older request.'}</small></div>`:''}<h3>Coordination note</h3><p class="dialog-note" data-testid="detail-note">${esc(r.note||'No additional coordination note.')}</p><h3>${saved?'Recipient hospitals':'Current matches for an older request'}</h3><ul class="dialog-recipients" data-testid="request-routing">${ids.map(id=>`<li><a href="${mapUrl(id)}&radius=${r.radiusKm}">${esc(name(id))}</a></li>`).join('')||'<li>No matching recipients.</li>'}</ul>${!saved?'<p class="muted">Historical recipients were not recorded for this older request.</p>':''}<div id="detail-error" class="core-dialog-error" role="alert"></div><div class="buttonrow">${canAccept?'<button class="primary" id="hospital-accept" data-testid="hospital-accept">Accept request — notify EMS</button>':''}${role==='hospital'&&r.status==='Awaiting responses'&&states[receiving]==='Closed'?'<p class="notice warning">Your hospital is Closed. Update availability before accepting.</p>':''}${role==='ems'&&r.hospitalId===emsBase&&r.status==='Accepted'?'<button class="primary" id="complete-request" data-testid="complete-request">Mark handoff completed</button>':''}<a class="secondary" href="${mapUrl(r.acceptedHospitalId||ids[0])}&radius=${r.radiusKm}">View hospital map</a></div>${events.length?`<details><summary>Coordination history</summary><ol class="dialog-history">${events.map(e=>`<li>${esc(e.actorType==='ems'?desk(e.hospitalId):name(e.hospitalId))} · ${esc(e.action)}<br><small>${esc(stamp(e.at))}</small></li>`).join('')}</ol></details>`:''}`;
 $('#close-detail').onclick=()=>{$('#detail-modal').close();selected=null;};
 if($('#hospital-accept'))$('#hospital-accept').onclick=()=>{const id=receiving;act(async()=>{const result=await api(`/api/requests/${r.recordId}/hospital-accept`,{hospitalId:id});await loadData();renderDetail(result.request);showStatus(`${name(id)} accepted ${r.id}. The EMS desk has an in-app acceptance notification.`);});};
 if($('#complete-request'))$('#complete-request').onclick=()=>act(async()=>{const result=await api(`/api/requests/${r.recordId}/complete`,{emsBaseId:emsBase});await loadData();renderDetail(result.request);showStatus('Handoff marked completed. The accepting hospital and notification are retained.');});
 if(focusId&&$('#'+focusId))$('#'+focusId).focus();
}
function switchRole(next){if(busy)return;$('#detail-modal').close();selected=null;role=next;filter='all';lastStatus='';syncUrl();render();loadData();}
function showStatus(text){lastStatus=text;if($('#action-status'))$('#action-status').textContent=text;}
function showError(text){if($('#core-error'))$('#core-error').textContent=text;if($('#detail-modal').open&&$('#detail-error'))$('#detail-error').textContent=text;}
async function act(fn){if(busy)return;busy=true;$('#app').inert=true;if($('#core-error'))$('#core-error').textContent='';if($('#detail-error'))$('#detail-error').textContent='';try{await fn();}catch(e){showError(e.message);}finally{busy=false;$('#app').inert=false;}}
async function loadData(background=false){
 if(background&&(loading||busy||document.hidden))return;
 const seq=++sequence,base=emsBase;loading=true;
 try{
  const data=await api('/api/requests?emsBaseId='+base),ready=await api('/api/readiness');
  if(seq!==sequence||base!==emsBase)return;
  requests=data.requests;notices=data.notifications;facilities=ready.facilities;states=Object.fromEntries(facilities.map(h=>[h.id,h.state]));
  if(!initialized){initialized=true;render();}else updateViews();
  $('#sync-status').textContent='Automatic updates on · Last checked '+new Date().toLocaleTimeString();
  const requested=params.get('request');if(requested&&requests.some(r=>r.id===requested)){openDetail(requested);params.delete('request');}
 }catch(e){
  if(!initialized){$('#app').innerHTML='<main class="core-wrap"><h1>Hospital Connect</h1><p role="alert">Saved requests could not load.</p><button class="primary" id="retry">Retry</button></main>';$('#retry').onclick=()=>loadData();}
  else{$('#sync-status').textContent='Updates unavailable — use Refresh to retry.';if(!background)showError(e.message);}
 }finally{if(seq===sequence)loading=false;}
}
loadData();setInterval(()=>loadData(true),4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadData(true);});window.addEventListener('focus',()=>loadData(true));
