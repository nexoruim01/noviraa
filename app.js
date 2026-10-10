/* ============================================================
   Novira — app.js (v3 — كامل مع ميزة القراء)
   ============================================================ */

var SB='https://bwgetktksxbhrvobjvdb.supabase.co';
var KEY='sb_publishable_ZQbDTvvCDvc-Eny1Gj1n_w_A9EtdSQy';
var IS_APK=false;
var PUBLIC_URL='https://nexoruim01.github.io/noviraa/';

(function(){
try{
if(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()){IS_APK=true;}
else if(location.protocol==='file:'){IS_APK=true;}
else if(/Android/i.test(navigator.userAgent) && /\bwv\b/i.test(navigator.userAgent)){IS_APK=true;}
}catch(e){}
})();

function isSecureCtx(){
if(location.protocol==='https:')return true;
if(location.protocol==='file:')return true;
if(location.protocol==='capacitor:')return true;
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return true;
if(IS_APK)return true;
return false;
}

/* ============ Global State ============ */
var currentUser=null,accessToken=null,refreshToken=null,currentProfile=null,currentChat=null,chats=[],currentChatMode='direct',myGroupRole=null,currentGroupMembers=[],favorites=[],myDeletedMessages={},reactionsCache={},lastMessageTime=null,currentAudioPlayer=null,currentAudioBtn=null,selectedFile=null,selectedFileType=null,currentMediaUrl=null,currentMediaType=null,selectedMessage=null,replyToMessage=null,longPressTimer=null,isBlockedByMe=false,currentEmojiCat='وجوه',currentPCUser=null,qrScanner=null,renderedMsgIds={};
var chatsPollTimer=null,messagesPollTimer=null,readStatusPollTimer=null,typingPollTimer=null,onlineStatusInterval=null,tokenRefreshInterval=null,isRefreshing=false,refreshPromise=null,mentionQuery='',mentionMatches=[],mentionStartIdx=-1,searchTab='all';
var groupInfoPollTimer=null;
var currentCall=null,peerConnection=null,localStream=null,remoteStream=null,callStartTime=null,isMuted=false,isSpeakerOn=false,isCameraOff=false,currentFacingMode='user',callMessageOpen=false,invitedInThisCall={},callWatchdogId=null,incomingCallPollTimer=null,incomingScreenPollTimer=null,callStatusPollTimer=null,callWatchdogTimer=null,callTimerInterval=null,audioCtx=null,ringbackInterval=null,ringtoneInterval=null,activeOscillators=[],ringbackActive=false,ringtoneActive=false;
var isRecording=false,pttTimer=null,pttLocked=false,pttActive=false,pttCancelled=false,lockedRecordingActive=false,lockedPaused=false,voiceStream=null,voiceRec=null,voiceMime='audio/webm',voiceStartTime=0,voiceElapsed=0,voiceChunks=[],lockedTimerInt=null,typingHeartbeat=null,typingActive=false,newGroupSelected=[],newGroupAvatarFile=null,newGroupAvatarUrl=null,addMembersSelected=[],memberActionsTarget=null,GIPHY='dc6zaTOxFJmzC',gifCache={};
var regAvatarFile=null,editAvatarFile=null;
var lastTypingSent=0,lastOnlineSent=0;

var ICE={iceServers:[
{urls:'stun:stun.l.google.com:19302'},
{urls:'stun:stun1.l.google.com:19302'},
{urls:'stun:stun.cloudflare.com:3478'},
{urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
{urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
{urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
]};

var pushToken=null,pushReady=false;

async function setupPushNotifications(){
if(!window.Capacitor||!window.Capacitor.Plugins)return;
var Push=window.Capacitor.Plugins.PushNotifications;
if(!Push)return;
try{
var perm=await Push.checkPermissions();
if(perm.receive!=='granted')perm=await Push.requestPermissions();
if(perm.receive!=='granted')return;
await Push.register();
pushReady=true;
Push.addListener('registration',function(tk){
pushToken=tk.value;
if(currentUser){dbU('profiles',{id:currentUser.id,fcm_token:tk.value},'id').catch(function(){});}
});
Push.addListener('registrationError',function(){});
Push.addListener('pushNotificationReceived',function(n){toast((n.title||'')+' '+(n.body||''));});
Push.addListener('pushNotificationActionPerformed',function(a){
var d=a.notification.data||{};
if(d.chat_id){loadChats().then(function(){openChat(d.chat_id);});}
});
}catch(e){}
}
function initPushIfReady(){
if(!currentUser)return;
if(pushReady){if(pushToken){dbU('profiles',{id:currentUser.id,fcm_token:pushToken},'id').catch(function(){});}return;}
setupPushNotifications();
}
setTimeout(initPushIfReady,3000);
setInterval(initPushIfReady,30000);

/* ============ Helpers ============ */
function $(id){return document.getElementById(id);}
function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
function escAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escJs(s){return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/</g,'\\x3c').replace(/>/g,'\\x3e');}
function nP(p){return(p||'').replace(/[^0-9]/g,'');}
function iP(p){return/^[0-9]{6}$/.test(p||'');}
function pE(p){return p.replace(/[^0-9]/g,'')+'@novira.app';}

function fT(ts){
if(!ts)return'';
var d=new Date(ts);
if(isNaN(d.getTime()))return'';
var s=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
var n=new Date();
if(d.toDateString()===n.toDateString())return s;
var y=new Date(n);y.setDate(n.getDate()-1);
if(d.toDateString()===y.toDateString())return'أمس '+s;
if(d.getFullYear()===n.getFullYear())return d.toLocaleDateString([],{day:'2-digit',month:'2-digit'})+' '+s;
return d.toLocaleDateString([],{day:'2-digit',month:'2-digit',year:'numeric'})+' '+s;
}
function fD(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');}

var tT;
function toast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('show');},2400);}

var AV=['linear-gradient(135deg,#FF6B9D,#A855F7)','linear-gradient(135deg,#A855F7,#06B6D4)','linear-gradient(135deg,#06B6D4,#22C55E)','linear-gradient(135deg,#FBBF24,#FF6B9D)','linear-gradient(135deg,#22C55E,#06B6D4)','linear-gradient(135deg,#8B5CF6,#EC4899)','linear-gradient(135deg,#F43F5E,#A855F7)','linear-gradient(135deg,#3B82F6,#A855F7)'];
var PSVG='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8.5" r="4"/><path d="M12 14.5c-4.42 0-8 2.24-8 5v1.5h16v-1.5c0-2.76-3.58-5-8-5z"/></svg>';
var GSVG='<svg viewBox="0 0 32 24" fill="currentColor"><circle cx="16" cy="7" r="3.2"/><circle cx="8" cy="8" r="2.6"/><circle cx="24" cy="8" r="2.6"/><path d="M16 11.5c-3.1 0-5.6 1.7-5.6 3.8V19h11.2v-3.7c0-2.1-2.5-3.8-5.6-3.8z"/></svg>';

function hs(s){var h=0;s=String(s||'n');for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}return Math.abs(h);}
function gB(p){return AV[hs((p&&(p.id||p.phone||p.name))||'n')%AV.length];}
function avH(p,sz){sz=sz||54;if(p&&p.avatar_url)return'<div class="av" style="width:'+sz+'px;height:'+sz+'px;background-image:url('+escAttr(p.avatar_url)+');background-size:cover;background-position:center"></div>';return'<div class="av avp" style="width:'+sz+'px;height:'+sz+'px;background:'+gB(p)+'">'+PSVG+'</div>';}
function grpAvH(g,sz){sz=sz||54;if(g&&g.group_avatar_url)return'<div class="av" style="width:'+sz+'px;height:'+sz+'px;background-image:url('+escAttr(g.group_avatar_url)+');background-size:cover;background-position:center"></div>';var iconSize=Math.round(sz*0.58);return'<div class="av" style="width:'+sz+'px;height:'+sz+'px;background:linear-gradient(135deg,#22C55E,#06B6D4);display:flex;align-items:center;justify-content:center;color:#fff">'+GSVG.replace('<svg','<svg style="width:'+iconSize+'px;height:'+iconSize+'px"')+'</div>';}
function sAv(el,p){if(!el)return;el.classList.remove('avp');if(p&&p.avatar_url){el.style.background='';el.style.backgroundImage='url('+p.avatar_url+')';el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.innerHTML='';}else{el.style.background=gB(p);el.style.backgroundImage='none';el.innerHTML=PSVG;el.classList.add('avp');}}
function stAv(p){if(p&&p.avatar_url)return'<div style="width:100%;height:100%;border-radius:20px;background-image:url('+escAttr(p.avatar_url)+');background-size:cover;border:2px solid #0A0E1A"></div>';return'<div style="width:100%;height:100%;border-radius:20px;background:'+gB(p)+';display:flex;align-items:center;justify-content:center;color:#fff;border:2px solid #0A0E1A">'+PSVG+'</div>';}

/* ============ Navigation ============ */
function go(n){
document.querySelectorAll('.sc').forEach(function(s){s.classList.remove('act');});
var e=$('sc-'+n);if(e)e.classList.add('act');
if(n==='chats'){loadChats();greet();startChatsPoll();}else stopChatsPoll();
if(n==='settings')renderProfile();
if(n!=='chat'){stopMsgPoll();stopReadPoll();stopTypingPoll();stopGroupInfoPoll();stopTypingSession();closeEmoji();}
}

function greet(){
var h=new Date().getHours();
var g=h<12?'صباح الخير':h<18?'مساء الخير':'مساء النور';
var e1=$('hero-greet');if(e1)e1.textContent=g+' 👋';
var e2=$('hero-name');if(e2)e2.textContent=(currentProfile&&currentProfile.name)?currentProfile.name:'Novira';
sAv($('hero-avatar'),currentProfile);
}

function openSheet(id){var s=$('sh-'+id.replace(/^sh-/,''));if(!s)s=$(id);if(s)s.classList.add('act');var bg=$('sheet-bg');if(bg)bg.classList.add('act');}
function closeSheet(e){if(e&&e.target&&e.target.classList&&!e.target.classList.contains('sheet'))return;document.querySelectorAll('.sheet').forEach(function(s){s.classList.remove('act');});var bg=$('sheet-bg');if(bg)bg.classList.remove('act');}

/* ============ Text Format ============ */
function fmtTxt(t){
if(!t)return'';
var e=esc(t);
var ph=[];
e=e.replace(/(https?:\/\/[^\s]+)/g,function(u){var i=ph.length;ph.push('<a class="link" href="'+escAttr(u)+'" target="_blank" rel="noopener noreferrer">'+u+'</a>');return'\u0000U'+i+'\u0000';});
e=e.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,function(em){var i=ph.length;ph.push('<span class="email-link" onclick="copyT(\''+escJs(em)+'\')">'+em+'</span>');return'\u0000E'+i+'\u0000';});
e=e.replace(/(^|[\s\n])@([a-zA-Z0-9_]+)/g,function(m,p1,un){var i=ph.length;ph.push(p1+'<span class="mention" onclick="event.stopPropagation();mClick(\''+escJs(un)+'\')">@'+un+'</span>');return'\u0000M'+i+'\u0000';});
e=e.replace(/\b[0-9]+\b/g,function(n){return'<span class="num-link" onclick="copyT(\''+escJs(n)+'\')">'+n+'</span>';});
e=e.replace(/\u0000U(\d+)\u0000/g,function(m,i){return ph[+i];});
e=e.replace(/\u0000E(\d+)\u0000/g,function(m,i){return ph[+i];});
e=e.replace(/\u0000M(\d+)\u0000/g,function(m,i){return ph[+i];});
return e;
}

function copyT(t){if(navigator.clipboard && isSecureCtx()){navigator.clipboard.writeText(t).then(function(){toast('تم النسخ ✓');}).catch(function(){fbC(t);});}else{fbC(t);}}
function fbC(t){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('تم');}catch(e){}document.body.removeChild(ta);}
function copyMyUsername(){if(!currentProfile)return;if(currentProfile.username){copyT('@'+currentProfile.username);}else if(currentProfile.phone){copyT(currentProfile.phone);}}
function copyQRUsername(){var el=$('my-qr-user');if(!el)return;var txt=el.textContent||'';if(!txt)return;copyT(txt);}
function copyPCUsername(){if(!currentPCUser)return;if(currentPCUser.username){copyT('@'+currentPCUser.username);}else if(currentPCUser.phone){copyT(currentPCUser.phone);}}

/* ============ Supabase ============ */
function refTok(){
if(isRefreshing&&refreshPromise)return refreshPromise;
if(!refreshToken)return Promise.reject(new Error('no'));
isRefreshing=true;
refreshPromise=fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'apikey':KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:refreshToken})}).then(function(r){return r.text().then(function(t){var d=null;try{d=JSON.parse(t);}catch(e){}if(!r.ok)throw new Error('فشل تحديث الجلسة');accessToken=d.access_token;refreshToken=d.refresh_token;currentUser=d.user;try{localStorage.setItem('novira_session',JSON.stringify({access_token:accessToken,refresh_token:refreshToken,user:currentUser}));}catch(e){}return d;});}).catch(function(e){clrSess();toast('انتهت الجلسة');setTimeout(function(){go('login');},1500);throw e;}).finally(function(){isRefreshing=false;refreshPromise=null;});
return refreshPromise;
}
function api(p,o,retry){
o=o||{};
var h={'apikey':KEY,'Content-Type':'application/json'};
if(accessToken)h['Authorization']='Bearer '+accessToken;
if(o.headers)for(var k in o.headers)h[k]=o.headers[k];
var fo={method:o.method||'GET',headers:h};
if(o.body)fo.body=o.body;
return fetch(SB+p,fo).then(function(r){return r.text().then(function(txt){var d=null;try{d=txt?JSON.parse(txt):null;}catch(e){d=txt;}if(!r.ok){var em=(d&&(d.msg||d.message||d.error_description||d.error))||txt||('خطأ '+r.status);var isExp=r.status===401||/jwt.*expired/i.test(em);if(isExp&&!retry&&refreshToken&&p.indexOf('/auth/v1/token')===-1&&p.indexOf('/auth/v1/logout')===-1){return refTok().then(function(){return api(p,o,true);});}throw new Error(em);}return d;});});
}
function signUp(e,p,m){return api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email:e,password:p,data:m})});}
function signIn(e,p){return api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:e,password:p})});}
function getUser(){return api('/auth/v1/user');}
function signOut(){return api('/auth/v1/logout',{method:'POST'});}
function saveSess(s){if(!s)return;accessToken=s.access_token;refreshToken=s.refresh_token;currentUser=s.user;try{localStorage.setItem('novira_session',JSON.stringify({access_token:accessToken,refresh_token:refreshToken,user:currentUser}));}catch(e){}}
function loadSess(){try{var s=localStorage.getItem('novira_session');if(!s)return false;var d=JSON.parse(s);accessToken=d.access_token;refreshToken=d.refresh_token;currentUser=d.user;return!!(accessToken&&currentUser);}catch(e){return false;}}
function clrSess(){accessToken=null;refreshToken=null;currentUser=null;currentProfile=null;currentChat=null;chats=[];myDeletedMessages={};favorites=[];currentGroupMembers=[];renderedMsgIds={};try{localStorage.removeItem('novira_session');}catch(e){}}

function dbS(t,q){return api('/rest/v1/'+t+(q?'?'+q:''));}
function dbI(t,d){return api('/rest/v1/'+t,{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});}
function dbU(t,d,oc){var q=oc?'?on_conflict='+oc:'';return api('/rest/v1/'+t+q,{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(d)});}
function dbP(t,q,d){return api('/rest/v1/'+t+'?'+q,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});}
function dbD(t,q){return api('/rest/v1/'+t+'?'+q,{method:'DELETE'});}

/* ============ Storage ============ */
function stUp(b,p,blob,retry){
var url=SB+'/storage/v1/object/'+b+'/'+p;
return fetch(url,{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+accessToken,'Content-Type':blob.type||'application/octet-stream','x-upsert':'true'},body:blob}).then(function(r){return r.text().then(function(t){if(!r.ok){var isExp=r.status===401||/jwt.*expired/i.test(t||'');if(isExp&&!retry&&refreshToken)return refTok().then(function(){return stUp(b,p,blob,true);});throw new Error(t||'Upload failed');}try{return JSON.parse(t);}catch(e){return t;}});});
}
function stPub(b,p){return SB+'/storage/v1/object/public/'+b+'/'+p;}
function upPr(b,p,f,onp){
return new Promise(function(res,rej){
var x=new XMLHttpRequest();
x.upload.addEventListener('progress',function(e){if(e.lengthComputable&&onp)onp(Math.round((e.loaded/e.total)*100));});
x.addEventListener('load',function(){if(x.status>=200&&x.status<300){res(x.responseText);return;}rej(new Error(x.responseText||'فشل'));});
x.addEventListener('error',function(){rej(new Error('شبكة'));});
x.open('POST',SB+'/storage/v1/object/'+b+'/'+p);
x.setRequestHeader('apikey',KEY);
x.setRequestHeader('Authorization','Bearer '+accessToken);
x.setRequestHeader('Content-Type',f.type||'application/octet-stream');
x.setRequestHeader('x-upsert','true');
x.send(f);
});
}

/* ============ Profile ============ */
function loadProf(){
if(!currentUser)return Promise.resolve();
return dbS('profiles','id=eq.'+currentUser.id+'&select=*').then(function(a){
if(a&&a.length){currentProfile=a[0];}
else{var m=currentUser.user_metadata||{};currentProfile={id:currentUser.id,name:m.name||'مستخدم',phone:m.phone||'',username:m.username||''};}
renderProfile();
return currentProfile;
}).catch(function(){
var m=currentUser.user_metadata||{};
currentProfile={id:currentUser.id,name:m.name||'مستخدم',phone:m.phone||'',username:m.username||''};
renderProfile();
return currentProfile;
});
}
function renderProfile(){
if(!currentProfile)return;
var pn=$('profile-n');if(pn)pn.textContent=currentProfile.name||'مستخدم';
var pp=$('profile-p');
if(pp){
if(currentProfile.username){pp.innerHTML=esc('@'+currentProfile.username)+' <span class="copy-ic">📋</span>';pp.style.display='inline-flex';}
else if(currentProfile.phone){pp.innerHTML=esc(currentProfile.phone)+' <span class="copy-ic">📋</span>';pp.style.display='inline-flex';}
else{pp.textContent='—';pp.style.display='inline-flex';}
}
sAv($('profile-av'),currentProfile);
greet();
}

/* ============ Edit Profile ============ */
function editProf(){
if(!currentProfile)return;
editAvatarFile=null;
sAv($('edit-av'),currentProfile);
$('edit-name').value=currentProfile.name||'';
$('edit-username').value=currentProfile.username||'';
$('edit-bio').value=currentProfile.bio||'';
openSheet('profile');
}
function pickAv(){$('file-avatar').click();}
function handleAvSel(f){
if(!f)return;
if(f.size>5*1024*1024){toast('كبيرة (5MB)');return;}
if(f.type.indexOf('image/')!==0){toast('ليس صورة');return;}
editAvatarFile=f;
var url=URL.createObjectURL(f);
var av=$('edit-av');
if(av){av.style.background='';av.style.backgroundImage='url('+url+')';av.style.backgroundSize='cover';av.style.backgroundPosition='center';av.innerHTML='';av.classList.remove('avp');}
}
function updProf(){
if(!currentProfile)return;
var name=($('edit-name').value||'').trim();
var un=($('edit-username').value||'').toLowerCase().trim();
var bio=($('edit-bio').value||'').trim();
if(!name){toast('أدخل اسماً');return;}
if(name.length<2){toast('الاسم قصير');return;}
if(un&&!/^[a-z0-9_]{3,20}$/.test(un)){toast('اسم المستخدم غير صالح');return;}
var needCheck=un&&un!==(currentProfile.username||'');
var checkP=needCheck?dbS('profiles','username=eq.'+encodeURIComponent(un)+'&id=neq.'+currentUser.id+'&select=id').then(function(a){if(a&&a.length)throw new Error('@'+un+' محجوز');}):Promise.resolve();
checkP.then(function(){
var upd={name:name,bio:bio||null};
if(un)upd.username=un;
return dbP('profiles','id=eq.'+currentUser.id,upd);
}).then(function(){
if(editAvatarFile){
var ext=editAvatarFile.name.split('.').pop()||'jpg';
var fn='avatars/'+currentUser.id+'_'+Date.now()+'.'+ext;
return stUp('media',fn,editAvatarFile).then(function(){
var pu=stPub('media',fn)+'?t='+Date.now();
return dbP('profiles','id=eq.'+currentUser.id,{avatar_url:pu});
});
}
}).then(function(){return loadProf();}).then(function(){
closeSheet();
toast('✓ تم الحفظ');
editAvatarFile=null;
}).catch(function(e){toast(e.message||'فشل');});
}

/* ============ Delete Account ============ */
function cDelAcc(){
var inp=$('del-acc-confirm');if(inp)inp.value='';
var btn=$('del-acc-btn');if(btn)btn.disabled=true;
openSheet('del-account');
}
function onDelAccInput(v){
var btn=$('del-acc-btn');if(btn)btn.disabled=(v.trim()!=='حذف');
}
function doDelAcc(){
if(!currentUser)return;
if(!confirm('حذف نهائي؟ لا يمكن التراجع!'))return;
toast('جاري الحذف...');
dbD('profiles','id=eq.'+currentUser.id).then(function(){
return signOut().catch(function(){});
}).then(function(){
clrSess();
go('login');
toast('تم حذف الحساب');
}).catch(function(){toast('فشل الحذف');});
}

/* ============ Registration ============ */
function handleRegAvatar(f){
if(!f)return;
if(f.size>5*1024*1024){toast('كبيرة (5MB)');return;}
if(f.type.indexOf('image/')!==0){toast('ليس صورة');return;}
regAvatarFile=f;
var url=URL.createObjectURL(f);
var el=$('reg-logo-preview');
if(el){el.style.backgroundImage='url('+url+')';el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.textContent='';}
}
function regGoStep2(){
var name=$('reg-name').value.trim();
var un=$('reg-username').value.toLowerCase().trim();
var er=$('reg-error');if(er)er.classList.remove('show');
if(!name){if(er){er.textContent='⚠️ أدخل الاسم';er.classList.add('show');}return;}
if(name.length<2){if(er){er.textContent='⚠️ الاسم قصير';er.classList.add('show');}return;}
if(!/^[a-z0-9_]{3,20}$/.test(un)){if(er){er.textContent='⚠️ اسم المستخدم غير صالح (3-20 حرف)';er.classList.add('show');}return;}
dbS('profiles','username=eq.'+encodeURIComponent(un)+'&select=id').then(function(a){
if(a&&a.length){if(er){er.textContent='❌ @'+un+' محجوز';er.classList.add('show');}return;}
$('register-step1').style.display='none';
$('register-step2').style.display='flex';
}).catch(function(){
$('register-step1').style.display='none';
$('register-step2').style.display='flex';
});
}
function regBackStep1(){
$('register-step2').style.display='none';
$('register-step1').style.display='flex';
}
function doReg(){
var name=$('reg-name').value.trim();
var un=$('reg-username').value.toLowerCase().trim();
var ph=nP($('reg-phone').value);
var pin=$('reg-pass').value;
var er=$('reg-error2'),btn=$('reg-btn');
if(er)er.classList.remove('show');
if(!ph||!pin){if(er){er.textContent='⚠️ جميع الحقول مطلوبة';er.classList.add('show');}return;}
if(ph.length<8){if(er){er.textContent='⚠️ رقم الهاتف قصير';er.classList.add('show');}return;}
if(!iP(pin)){if(er){er.textContent='⚠️ الرمز 6 أرقام';er.classList.add('show');}return;}
if(btn){btn.disabled=true;btn.textContent='جاري...';}
Promise.all([
dbS('profiles','phone=eq.'+encodeURIComponent(ph)+'&select=id').catch(function(){return[];}),
dbS('profiles','pin=eq.'+encodeURIComponent(pin)+'&select=id').catch(function(){return[];})
]).then(function(r){
if((r[0]||[]).length)throw new Error('❌ رقم الهاتف مسجَّل مسبقاً');
if((r[1]||[]).length)throw new Error('❌ رمز الدخول مستخدم');
var em=pE(ph);
return signUp(em,pin,{name:name,phone:ph,username:un}).then(function(res){
if(res&&res.access_token){saveSess(res);return finalizeReg(name,ph,un,pin);}
else if(res&&res.user){return signIn(em,pin).then(function(s){saveSess(s);return finalizeReg(name,ph,un,pin);});}
throw new Error('❌ فشل إنشاء الحساب');
});
}).catch(function(e){
var msg=e.message||'❌ خطأ';
if(/already registered/i.test(msg))msg='❌ مسجَّل مسبقاً';
if(er){er.textContent=msg;er.classList.add('show');}
}).then(function(){if(btn){btn.disabled=false;btn.textContent='إنشاء الحساب';}});
}
function finalizeReg(name,ph,un,pin){
var profileData={id:currentUser.id,name:name,phone:ph,username:un,pin:pin,last_seen:new Date().toISOString()};
return dbU('profiles',profileData,'id').then(function(){
if(regAvatarFile){
var ext=regAvatarFile.name.split('.').pop()||'jpg';
var fn='avatars/'+currentUser.id+'.'+ext;
return stUp('media',fn,regAvatarFile).then(function(){
var pu=stPub('media',fn)+'?t='+Date.now();
return dbP('profiles','id=eq.'+currentUser.id,{avatar_url:pu});
}).catch(function(){});
}
}).then(function(){return loadProf();}).then(function(){
toast('مرحباً '+name+' 🎉');
go('chats');
startIncomingCallPoll();
markOnline();
if(onlineStatusInterval)clearInterval(onlineStatusInterval);
onlineStatusInterval=setInterval(markOnline,60000);
if(tokenRefreshInterval)clearInterval(tokenRefreshInterval);
tokenRefreshInterval=setInterval(function(){if(currentUser&&refreshToken)refTok().catch(function(){});},50*60*1000);
setTimeout(initPushIfReady,2000);
regAvatarFile=null;
});
}
function doLog(){
var ph=nP($('login-phone').value),pin=$('login-pass').value,er=$('login-error'),btn=$('login-btn');
if(er)er.classList.remove('show');
if(!ph||!pin){if(er){er.textContent='الحقول مطلوبة';er.classList.add('show');}return;}
if(!iP(pin)){if(er){er.textContent='الرمز 6 أرقام';er.classList.add('show');}return;}
if(btn){btn.disabled=true;btn.textContent='جاري...';}
signIn(pE(ph),pin).then(function(s){saveSess(s);return loadProf();}).then(function(){
go('chats');
startIncomingCallPoll();
markOnline();
if(onlineStatusInterval)clearInterval(onlineStatusInterval);
onlineStatusInterval=setInterval(markOnline,60000);
if(tokenRefreshInterval)clearInterval(tokenRefreshInterval);
tokenRefreshInterval=setInterval(function(){if(currentUser&&refreshToken)refTok().catch(function(){});},50*60*1000);
toast('مرحباً 👋');
setTimeout(initPushIfReady,2000);
}).catch(function(){if(er){er.textContent='رقم أو رمز خاطئ';er.classList.add('show');}}).then(function(){if(btn){btn.disabled=false;btn.textContent='دخول';}});
}
function confirmLogout(){
closeSheet();
stopAllTones();stopTypingSession();
stopIncomingCallPoll();stopIncScreenPoll();stopCallStatusPoll();stopCallWatchdog();
stopChatsPoll();stopMsgPoll();stopReadPoll();stopTypingPoll();stopGroupInfoPoll();
if(tokenRefreshInterval)clearInterval(tokenRefreshInterval);
if(onlineStatusInterval)clearInterval(onlineStatusInterval);
signOut().catch(function(){}).then(function(){
clrSess();
var lp=$('login-phone');if(lp)lp.value='';
var lpp=$('login-pass');if(lpp)lpp.value='';
go('login');
toast('تم الخروج');
});
}
function markOnline(){
if(!currentUser)return;
var now=Date.now();
if(now-lastOnlineSent<55000)return;
lastOnlineSent=now;
dbP('profiles','id=eq.'+currentUser.id,{last_seen:new Date().toISOString()}).catch(function(){});
}

/* ============ Setup Pins ============ */
function setupPins(){
document.querySelectorAll('input.pin').forEach(function(i){
i.addEventListener('input',function(){
var c=this.value.replace(/[^0-9]/g,'');
if(c.length>6)c=c.slice(0,6);
if(this.value!==c)this.value=c;
});
});
}
function chkUser(un){
var st=$('reg-username-status'),hint=$('reg-username-hint');
dbS('profiles','username=eq.'+encodeURIComponent(un)+'&select=id').then(function(a){
if(a&&a.length){st.textContent='❌';hint.textContent='@'+un+' محجوز';hint.style.color='#FCA5A5';$('reg-username')._available=false;}
else{st.textContent='✅';hint.textContent='@'+un+' متاح';hint.style.color='#86EFAC';$('reg-username')._available=true;}
}).catch(function(){});
}
function setupUserInp(){
var ui=$('reg-username');
if(ui&&!ui._b){
ui._b=true;
ui.addEventListener('input',function(){
var v=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'');
if(this.value!==v)this.value=v;
clearTimeout(this._t);
var st=$('reg-username-status');if(st)st.textContent='';
if(!v)return;
if(v.length<3){if(st)st.textContent='⚠️';return;}
if(st)st.textContent='⏳';
this._t=setTimeout(function(){chkUser(v);},500);
});
}
}

/* ============ Chat Menu ============ */
function openChatMenu(e){
if(e)e.stopPropagation();
updFavLbl();
var isGroup=currentChat&&currentChat.is_group;
var cdd=$('chat-dropdown');
if(!cdd)return;
var items=cdd.querySelectorAll('.cdd-i');
if(items[4])items[4].style.display=isGroup?'block':'none';
if(items[5])items[5].style.display=isGroup?'none':'block';
if(items[0])items[0].style.display=isGroup?'none':'block';
if(items[1])items[1].style.display=isGroup?'none':'block';
cdd.classList.toggle('act');
}
function closeChatMenu(){var c=$('chat-dropdown');if(c)c.classList.remove('act');}
function menuProf(){
closeChatMenu();
if(!currentChat)return;
if(currentChat.is_group){openGroupInfo();return;}
if(!currentChat._other)return;
showProfCard(currentChat._other.id);
}
function menuBlock(){
closeChatMenu();
if(!currentChat||!currentChat._other)return;
$('user-act-name').textContent=currentChat._other.name||'مستخدم';
dbS('blocks','blocker_id=eq.'+currentUser.id+'&blocked_id=eq.'+currentChat._other.id+'&select=*').then(function(a){
isBlockedByMe=a&&a.length>0;
var b=$('block-btn');
b.innerHTML=isBlockedByMe?'✅ إلغاء الحظر':'🚫 حظر المستخدم';
b.className='sheet-b'+(isBlockedByMe?' suc':' dng');
openSheet('user');
});
}
function menuCallV(){closeChatMenu();startVoiceCall();}
function menuCallVi(){closeChatMenu();startVideoCall();}
function toggleBlk(){
if(!currentChat||!currentChat._other)return;
var oid=currentChat._other.id;
if(isBlockedByMe){
dbD('blocks','blocker_id=eq.'+currentUser.id+'&blocked_id=eq.'+oid).then(function(){isBlockedByMe=false;closeSheet();toast('✓ تم إلغاء الحظر');});
}else{
if(!confirm('حظر هذا المستخدم؟'))return;
dbI('blocks',{blocker_id:currentUser.id,blocked_id:oid}).then(function(){isBlockedByMe=true;closeSheet();toast('تم الحظر');});
}
}
function checkBlock(){
if(!currentChat||!currentChat._other)return Promise.resolve();
return dbS('blocks','blocker_id=eq.'+currentUser.id+'&blocked_id=eq.'+currentChat._other.id+'&select=*').then(function(a){isBlockedByMe=a&&a.length>0;});
}
function openBlocked(){
var c=$('blocked-list');
if(!c)return;
c.innerHTML='<div style="text-align:center;padding:20px;color:var(--t3)">جاري...</div>';
openSheet('blocked');
dbS('blocks','blocker_id=eq.'+currentUser.id+'&select=blocked_id').then(function(a){
if(!a||!a.length){c.innerHTML='<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">لا محظورين</div>';return;}
var ids=a.map(function(b){return'id.eq.'+b.blocked_id;}).join(',');
dbS('profiles','or=('+ids+')&select=id,name,phone,avatar_url,username').then(function(ps){
var h='';
(ps||[]).forEach(function(p){
h+='<div class="ci" style="padding:10px 14px;margin-bottom:6px">'+avH(p,46)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(p.name)+'</span></div></div><button class="sheet-b sec" style="width:auto;padding:8px 14px;font-size:12px;margin:0" onclick="unblk(\''+escJs(p.id)+'\')">إلغاء</button></div>';
});
c.innerHTML=h;
});
});
}
function unblk(uid){
dbD('blocks','blocker_id=eq.'+currentUser.id+'&blocked_id=eq.'+uid).then(function(){toast('✓');openBlocked();});
}

/* ============ Messages ============ */
function onSendBtn(){
var i=$('msg-input');
if(i&&i.value.trim()){handleSend();}
}
function handleSend(){
if(isRecording||lockedRecordingActive)return;
if(!currentChat){toast('افتح محادثة');return;}
if(!canISend()){toast('لا تملك صلاحية');return;}
if(isBlockedByMe){toast('لا يمكن — أنت حظرت هذا المستخدم');return;}
var i=$('msg-input'),t=i.value.trim();
if(t){
i.value='';
i.style.height='auto';
updSendIcon('');
var cb=$('clear-btn');if(cb)cb.style.display='none';
stopTypingSession();
sendTxt(t).catch(function(e){if(e.message!=='محظور'){toast('فشل الإرسال');i.value=t;}});
}
}
function sendTxt(t){
if(isBlockedByMe){toast('لا يمكن — أنت حظرت هذا المستخدم');return Promise.reject(new Error('محظور'));}
var ln=new Date().toISOString(),p={chat_id:currentChat.id,sender_id:currentUser.id,text:t,type:'text',created_at:ln};
if(replyToMessage)p.reply_to=JSON.stringify({text:replyToMessage.text||'رسالة',id:replyToMessage.id||null});
return dbI('messages',p).then(function(r){
var m=Array.isArray(r)?r[0]:r;
if(!m.created_at)m.created_at=ln;
lastMessageTime=m.created_at;
var pv=t;
if(currentChat.is_group){var mn=(currentProfile&&currentProfile.name)?currentProfile.name.split(' ')[0]:'';pv=mn+': '+t;}
return dbP('chats','id=eq.'+currentChat.id,{last_message:pv,last_message_at:m.created_at}).then(function(){
if(renderedMsgIds[m.id]){cancelReply();return;}
renderedMsgIds[m.id]=true;
var body=$('chat-body'),e=body.querySelector('.cempty');
if(e)e.remove();
body.insertAdjacentHTML('beforeend',renderMsg(m));
body.scrollTop=body.scrollHeight;
cancelReply();
});
});
}
function autoRz(el){if(!el)return;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}
function updSendIcon(v){
var s=$('send-icon');if(!s)return;
if(v&&v.length>0)s.innerHTML='<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>';
else s.innerHTML='<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>';
}
function clrMsgInp(){
var i=$('msg-input');if(!i)return;i.value='';i.style.height='auto';i.focus();
var cb=$('clear-btn');if(cb)cb.style.display='none';
updSendIcon('');
}
function cancelReply(){replyToMessage=null;var rb=$('reply-bar');if(rb)rb.classList.remove('act');}

/* ============ Long Press ============ */
function setupLongPress(){
var b=$('chat-body');
if(!b||b._lp)return;
b._lp=true;
b.addEventListener('touchstart',function(e){
if(e.target.closest('.voice-progress-track'))return;
var t=e.target.closest('.msg');
if(!t)return;
longPressTimer=setTimeout(function(){var id=t.getAttribute('data-mid');if(id){selectedMessage={id:id,element:t};showMsgMenu(t);}},500);
},{passive:true});
b.addEventListener('touchend',function(){if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}},{passive:true});
b.addEventListener('touchmove',function(){if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}},{passive:true});
b.addEventListener('contextmenu',function(e){
var t=e.target.closest('.msg');if(!t)return;
e.preventDefault();
var id=t.getAttribute('data-mid');
if(id){selectedMessage={id:id,element:t};showMsgMenu(t);}
});
}
function showMsgMenu(el){
var m=$('msg-menu');if(!m)return;
var r=el.getBoundingClientRect(),w=230,h=Math.min(m.offsetHeight||320,window.innerHeight-20),left=r.left+r.width/2-w/2,top=r.top-h-10;
if(top<10)top=r.bottom+10;
if(top+h>window.innerHeight-10)top=window.innerHeight-h-10;
if(left<10)left=10;
if(left+w>innerWidth-10)left=innerWidth-w-10;
m.style.left=left+'px';m.style.top=top+'px';
var isMe=el.classList.contains('me'),isVoice=el.classList.contains('voice'),isMedia=el.classList.contains('media'),isSticker=el.classList.contains('sticker-msg'),isCall=el.classList.contains('call-log');
var copyBtn=m.querySelector('.mmi[onclick="menuCopy()"]');
if(copyBtn)copyBtn.style.display=(isVoice||isMedia||isSticker||isCall)?'none':'block';
var editBtn=$('menu-edit-btn');
if(editBtn)editBtn.style.display=(isMe&&!isVoice&&!isMedia&&!isSticker&&!isCall)?'block':'none';
m.classList.add('act');
el.classList.add('sel');
}
function closeMsgMenu(){
var m=$('msg-menu');if(m)m.classList.remove('act');
if(selectedMessage&&selectedMessage.element)selectedMessage.element.classList.remove('sel');
}
function menuReply(){
closeMsgMenu();
if(!selectedMessage)return;
var t=selectedMessage.element.textContent.replace(/\s+/g,' ').trim().substring(0,100);
replyToMessage={id:selectedMessage.id,text:t};
$('reply-bar').classList.add('act');
$('reply-name').textContent='رد';
$('reply-text').textContent=t;
$('msg-input').focus();
}
function menuCopy(){
closeMsgMenu();
if(!selectedMessage)return;
var clone=selectedMessage.element.cloneNode(true);
clone.querySelectorAll('.meta,.reactions,.reply-quote').forEach(function(n){n.remove();});
copyT(clone.textContent.replace(/\s+/g,' ').trim());
}
function menuEdit(){
closeMsgMenu();
if(!selectedMessage)return;
var el=selectedMessage.element;
if(!el||!el.classList.contains('me')){toast('لا يمكن تعديل هذه الرسالة');selectedMessage=null;return;}
var clone=el.cloneNode(true);
clone.querySelectorAll('.meta,.reactions,.reply-quote,.msg-sender,.edited-mark').forEach(function(n){n.remove();});
var originalText=clone.textContent.trim();
var newText=prompt('تعديل الرسالة:',originalText);
if(newText===null||newText.trim()===''||newText.trim()===originalText){selectedMessage=null;return;}
var mid=selectedMessage.id;
dbP('messages','id=eq.'+mid,{text:newText.trim(),edited_at:new Date().toISOString()}).then(function(){
var node=document.querySelector('[data-mid="'+mid+'"]');
if(node){
var metaEl=node.querySelector('.meta'),metaHTML=metaEl?metaEl.outerHTML:'';
var senderEl=node.querySelector('.msg-sender'),senderHTML=senderEl?senderEl.outerHTML:'';
var replyEl=node.querySelector('.reply-quote'),replyHTML=replyEl?replyEl.outerHTML:'';
var reactEl=node.querySelector('.reactions'),reactHTML=reactEl?reactEl.outerHTML:'';
node.innerHTML=senderHTML+replyHTML+fmtTxt(newText.trim())+'<span class="edited-mark"> (مُعدّلة)</span>'+metaHTML+reactHTML;
}
toast('✓ تم التعديل');
selectedMessage=null;
}).catch(function(){toast('فشل');selectedMessage=null;});
}
function menuForward(){
closeMsgMenu();
if(!selectedMessage)return;
var clone=selectedMessage.element.cloneNode(true);
clone.querySelectorAll('.meta,.reactions').forEach(function(n){n.remove();});
var text=clone.textContent.replace(/\s+/g,' ').trim();
showFwdList(text);
}
function showFwdList(text){
var c=$('forward-list');if(!c)return;
if(!chats.length){c.innerHTML='<div style="text-align:center;padding:20px;color:var(--t3)">لا محادثات</div>';}
else{
var h='';
chats.forEach(function(ch){
var isG=ch.is_group,n=isG?(ch.group_name||'مجموعة'):((ch._other&&ch._other.name)||'مستخدم'),av=isG?grpAvH(ch,46):avH(ch._other,46);
h+='<div class="ci" onclick="doFwd(\''+escJs(ch.id)+'\',\''+escJs(text)+'\')" style="padding:10px">'+av+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(n)+'</span></div></div></div>';
});
c.innerHTML=h;
}
openSheet('forward');
}
function doFwd(cid,text){
dbI('messages',{chat_id:cid,sender_id:currentUser.id,text:text,type:'forward',created_at:new Date().toISOString()}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
dbP('chats','id=eq.'+cid,{last_message:'↗️ مُعاد',last_message_at:m.created_at}).catch(function(){});
closeSheet();
toast('✓ تم التوجيه');
});
}

/* ═══════════════════════════════════════════════════════════════
   ⚡ معلومات الرسالة — مع قائمة القراء والأوقات
═══════════════════════════════════════════════════════════════ */
function menuInfo(){
closeMsgMenu();
if(!selectedMessage)return;
var mid=selectedMessage.id;

dbS('messages','id=eq.'+mid+'&select=*').then(function(a){
if(!a||!a.length)return;
var m=a[0];

// تاريخ الإرسال
var s=new Date(m.created_at);
var sentDate=s.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});
var sentTime=s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
var sentFull=sentDate+' — '+sentTime;

// نوع الرسالة
var tm={text:'نص',image:'صورة',video:'فيديو',audio:'رسالة صوتية',call:'مكالمة',sticker:'ملصق',forward:'مُعاد توجيهها'};
var typeLabel=tm[m.type]||m.type;

// قائمة القراء
var readers=[];
if(m.read_by){
if(typeof m.read_by==='string'){try{readers=JSON.parse(m.read_by);}catch(e){readers=[];}}
else if(Array.isArray(m.read_by)){readers=m.read_by;}
}
readers=readers.filter(function(r){return r&&r.user_id;});
var readerCount=readers.length;
var readerIds=readers.map(function(r){return r.user_id;});

// بناء HTML
var h='';
h+='<div class="info-row"><span>📤 أُرسلت</span><span>'+esc(sentFull)+'</span></div>';
h+='<div class="info-row"><span>📝 النوع</span><span>'+esc(typeLabel)+'</span></div>';

if(m.type==='audio'&&m.duration){
h+='<div class="info-row"><span>⏱️ المدة</span><span>'+fD(m.duration)+'</span></div>';
}
if(m.text&&m.type!=='sticker'&&m.type!=='call'){
h+='<div class="info-row" style="flex-direction:column;align-items:flex-start;gap:6px"><span>📄 النص</span><span style="font-family:Cairo;direction:rtl;text-align:right;font-size:13px;word-break:break-word;width:100%">'+esc(m.text.substring(0,300))+'</span></div>';
}

// قسم من قرأ
h+='<div class="info-section-title">📖 قرأها <span class="readers-count-badge">'+readerCount+'</span></div>';

if(readerCount===0){
h+='<div class="reader-empty">لا أحد قرأ هذه الرسالة بعد</div>';
}else{
h+='<div class="readers-scroll" id="readers-scroll">';
h+='<div class="reader-loading">⏳ جاري التحميل...</div>';
h+='</div>';
}

$('msg-info-content').innerHTML=h;
openSheet('msg-info');

// جلب أسماء القراء
if(readerCount>0&&readerIds.length){
var ids=readerIds.map(function(id){return'id.eq.'+id;}).join(',');
dbS('profiles','or=('+ids+')&select=id,name,avatar_url,username').then(function(ps){
var pm={};
(ps||[]).forEach(function(p){pm[p.id]=p;});

var sorted=readers.slice().sort(function(a,b){
return new Date(b.read_at||0)-new Date(a.read_at||0);
});

var listHTML='';
sorted.forEach(function(r){
var p=pm[r.user_id]||{id:r.user_id,name:'مستخدم'};
var rt=r.read_at?new Date(r.read_at):null;

// تنسيق الوقت
var timeDisplay='';
if(rt){
var now=new Date();
var isToday=rt.toDateString()===now.toDateString();
var yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
var isYesterday=rt.toDateString()===yesterday.toDateString();
var timeStr=rt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});

if(isToday){timeDisplay='اليوم '+timeStr;}
else if(isYesterday){timeDisplay='أمس '+timeStr;}
else{
var dateStr=rt.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit'});
timeDisplay=dateStr+' · '+timeStr;
}
}else{timeDisplay='غير معروف';}

var avHTML=p.avatar_url
?'<div class="reader-av" style="background-image:url('+escAttr(p.avatar_url)+')"></div>'
:'<div class="reader-av reader-av-fallback" style="background:'+gB(p)+'">'+PSVG+'</div>';

listHTML+=
'<div class="reader-item">'+
avHTML+
'<div class="reader-info">'+
'<div class="reader-name">'+esc(p.name||'مستخدم')+'</div>'+
'<div class="reader-time">'+
'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="reader-check">'+
'<polyline points="20 6 9 17 4 12"/>'+
'</svg>'+
'<span>قُرئت '+esc(timeDisplay)+'</span>'+
'</div>'+
'</div>'+
'</div>';
});

var scroll=$('readers-scroll');
if(scroll)scroll.innerHTML=listHTML;

}).catch(function(){
var scroll=$('readers-scroll');
if(scroll)scroll.innerHTML='<div class="reader-empty">تعذر تحميل الأسماء</div>';
});
}
});
}

function menuDelete(){
closeMsgMenu();
if(!selectedMessage)return;
var el=selectedMessage.element;
if(el&&el.classList.contains('me'))openSheet('del');
else{
if(!canIAdminDel()){toast('لا تملك صلاحية');selectedMessage=null;return;}
if(!confirm('حذف هذه الرسالة؟')){selectedMessage=null;return;}
delMe();
}
}
function canIAdminDel(){return amIAdmin()&&currentChat&&currentChat.is_group;}
function delMe(){
closeSheet();
if(!selectedMessage)return;
var id=selectedMessage.id,el=selectedMessage.element;
selectedMessage=null;
var prev=myDeletedMessages[id];
myDeletedMessages[id]=true;
if(el&&el.parentNode)el.remove();
dbU('message_deletions',{message_id:id,user_id:currentUser.id},'message_id,user_id').then(function(){toast('✓');}).catch(function(){
if(!prev)delete myDeletedMessages[id];
toast('فشل الحذف — أعد المحاولة');
if(currentChat)loadMsgs();
});
}
function delAll(){
closeSheet();
if(!selectedMessage)return;
var id=selectedMessage.id;
selectedMessage=null;
var el=document.querySelector('[data-mid="'+id+'"]');
if(el){
var cls=el.classList.contains('me')?'me':'other';
el.outerHTML='<div class="msg '+cls+' deleted-msg" data-mid="'+id+'"><span style="opacity:.75">تم الحذف</span><div class="meta">—</div></div>';
}
dbP('messages','id=eq.'+id,{deleted_at:new Date().toISOString()}).then(function(){toast('✓');}).catch(function(){toast('فشل');});
}

/* ============ Typing ============ */
function startTypingPoll(cid){
stopTypingPoll();
typingPollTimer=setInterval(function(){
if(!currentChat||currentChat.id!==cid)return;
var a=document.querySelector('.sc.act');
if(!a||a.id!=='sc-chat')return;
var oid=currentChat._other?currentChat._other.id:null;
if(!oid)return;
dbS('typing_status','chat_id=eq.'+cid+'&user_id=eq.'+oid+'&select=updated_at').then(function(a){
var s=$('chat-s');if(!s)return;
if(a&&a.length){
var u=new Date(a[0].updated_at).getTime();
if(Date.now()-u<6000){s.innerHTML='يكتب <span class="typing-dots"><span></span><span></span><span></span></span>';s.classList.add('typing');return;}
}
if(s.classList.contains('typing')){
s.classList.remove('typing');
var o=currentChat._other,st='';
if(o&&o.last_seen){
var d=Date.now()-new Date(o.last_seen).getTime();
if(d<60000)st='متصل الآن';
else st='آخر ظهور '+fT(o.last_seen);
}else if(o&&o.username)st='@'+o.username;
s.textContent=st;
}
});
},1500);
}
function stopTypingPoll(){if(typingPollTimer){clearInterval(typingPollTimer);typingPollTimer=null;}}
function sendTypingNow(){
if(!currentChat||!currentUser)return;
var now=Date.now();
if(now-lastTypingSent<1500)return;
lastTypingSent=now;
var ts=new Date().toISOString();
dbU('typing_status',{chat_id:currentChat.id,user_id:currentUser.id,updated_at:ts},'chat_id,user_id').catch(function(){
dbI('typing_status',{chat_id:currentChat.id,user_id:currentUser.id,updated_at:ts}).catch(function(){});
});
}
function startTypingSession(){
if(typingActive)return;
typingActive=true;
sendTypingNow();
if(typingHeartbeat)clearInterval(typingHeartbeat);
typingHeartbeat=setInterval(sendTypingNow,2000);
}
function stopTypingSession(){
if(!typingActive)return;
typingActive=false;
if(typingHeartbeat){clearInterval(typingHeartbeat);typingHeartbeat=null;}
if(currentChat&&currentUser){dbD('typing_status','chat_id=eq.'+currentChat.id+'&user_id=eq.'+currentUser.id).catch(function(){});}
}

/* ============ Load Messages ============ */
function loadMsgs(){
if(!currentChat)return Promise.resolve();
var cid=currentChat.id;
return dbS('messages','chat_id=eq.'+cid+'&order=created_at.asc&select=*').then(function(data){
if(!currentChat||currentChat.id!==cid)return;
var body=$('chat-body');
renderedMsgIds={};
var v=(data||[]).filter(function(m){return!myDeletedMessages[m.id];});
if(!v.length){
body.innerHTML='<div class="cempty"><div class="cempty-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:44px;height:44px;color:#fff"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div><div class="cempty-t">لا رسائل</div><div class="cempty-d">أرسل رسالة للبدء</div></div>';
markRead();
loadReacts(cid);
return;
}
var h='';
v.forEach(function(m){
if(renderedMsgIds[m.id])return;
renderedMsgIds[m.id]=true;
h+=renderMsg(m);
});
body.innerHTML=h;
if(data.length)lastMessageTime=data[data.length-1].created_at;
requestAnimationFrame(function(){body.scrollTop=body.scrollHeight;});
markRead();
loadReacts(cid);
});
}
function parseRep(m){
if(!m.reply_to)return'';
var rt='';
if(typeof m.reply_to==='object')rt=m.reply_to.text||'';
else{try{var rd=JSON.parse(m.reply_to);rt=rd.text||'';}catch(e){rt=String(m.reply_to);}}
return rt;
}

/* ═══════════════════════════════════════════════════════════════
   ⚡ renderMsg — مع عرض ✓✓ + عدد من قرأ
═══════════════════════════════════════════════════════════════ */
function renderMsg(m){
var isMe=m.sender_id===currentUser.id,cls=isMe?'me':'other',time=fT(m.created_at),vu='';

// ⚡ عرض ✓✓ مع عدد من قرأ
if(isMe){
var rc=0;
if(m.read_by){
var rb=m.read_by;
if(typeof rb==='string'){try{rb=JSON.parse(rb);}catch(e){rb=[];}}
if(Array.isArray(rb))rc=rb.filter(function(r){return r&&r.user_id;}).length;
}
vu=rc>0?'<span class="vu" title="قرأها '+rc+'">✓✓ '+rc+'</span>':'<span class="vu">✓</span>';
}

var sL='';
if(currentChat&&currentChat.is_group&&!isMe){
var sm=null;
for(var si=0;si<currentGroupMembers.length;si++){if(currentGroupMembers[si].user_id===m.sender_id){sm=currentGroupMembers[si];break;}}
if(sm&&sm.profile)sL='<div class="msg-sender">'+esc(sm.profile.name||'')+'</div>';
}

if(m.deleted_at)return'<div class="msg '+cls+' deleted-msg" data-mid="'+escAttr(m.id)+'"><span style="opacity:.75">تم الحذف</span><div class="meta">'+time+' '+vu+'</div></div>';

var rt=parseRep(m),rh=rt?'<div class="reply-quote"><div class="rtext">'+esc(rt.substring(0,80))+'</div></div>':'';

if(m.type==='forward')return'<div class="msg '+cls+'" data-mid="'+escAttr(m.id)+'">'+sL+'<div style="font-size:11px;color:rgba(255,255,255,.6);font-weight:800;margin-bottom:4px">↗️ مُعاد توجيهها</div>'+fmtTxt(m.text||'')+'</div>';

if(m.type==='sticker'){
var bg='#A855F7';
try{var mt=typeof m.meta==='string'?JSON.parse(m.meta):m.meta;if(mt&&mt.bg)bg=mt.bg;}catch(e){}
return'<div class="msg '+cls+' sticker-msg" data-mid="'+escAttr(m.id)+'" style="background:transparent!important;border:none!important;padding:0!important;max-width:180px">'+sL+rh+'<div style="width:160px;height:160px;border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:84px;background:'+escAttr(bg)+'">'+(m.text||'🎨')+'</div></div>';
}

if(m.type==='call'){
var meta={};
try{meta=typeof m.meta==='string'?JSON.parse(m.meta):(m.meta||{});}catch(e){}
var ct=meta.call_type||'voice',cs=meta.status||'ended',d=meta.duration||0,missed=cs==='missed'||cs==='rejected'||cs==='no_answer',isV=ct==='video',ti=(isV?'مكالمة فيديو':'مكالمة صوتية')+(isMe?'':' واردة'),sb='';
if(cs==='ended'&&d>0)sb='مدة '+fD(d);
else if(cs==='ended_by_caller')sb=isMe?'✋ أنهيت المكالمة':'✋ أنهى المتصل';
else if(cs==='missed')sb='لم يتم الرد';
else if(cs==='rejected')sb='تم الرفض';
else sb='انتهت';
return'<div class="msg call-log '+cls+'" data-mid="'+escAttr(m.id)+'">'+sL+'<div class="call-icon '+(missed?'missed':(isV?'video':'voice'))+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6"/></svg></div><div class="call-info"><div class="call-title">'+ti+'</div><div class="call-sub'+(missed?' missed':'')+'">'+sb+'</div></div><div class="call-time'+(missed?' missed':'')+'">'+time+'</div></div>';
}

if(m.type==='image'||m.type==='video'){
var mu=m.media_url||'',cp=m.text||'',mh=m.type==='image'?'<img class="media-image" src="'+escAttr(mu)+'" loading="lazy">':'<video class="media-video" src="'+escAttr(mu)+'" playsinline></video>',cph=cp?'<div class="media-caption">'+fmtTxt(cp)+'</div>':'';
return'<div class="msg media '+cls+'" data-mid="'+escAttr(m.id)+'">'+sL+rh+'<div class="media-content"><button class="media-menu-btn" onclick="event.stopPropagation();openMM(\''+escJs(mu)+'\',\''+escJs(m.type)+'\',\''+escJs(m.id)+'\')"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></button><div onclick="openVw(\''+escJs(mu)+'\',\''+escJs(m.type)+'\')">'+mh+'</div>'+cph+'<div class="media-meta"><span>'+time+'</span> '+vu+'</div></div></div>';
}

if(m.type==='audio'){
var du=m.duration||0,bars='';
for(var i=0;i<22;i++){var h=4+Math.round((hs(m.id+i)%15));bars+='<span style="height:'+h+'px"></span>';}
return'<div class="msg voice '+cls+'" data-mid="'+escAttr(m.id)+'" data-duration="'+du+'" data-audio-url="'+escAttr(m.audio_url||'')+'">'+sL+rh+'<div class="voice-row"><button class="voice-play-btn" onclick="event.stopPropagation();playV(this,\''+escJs(m.audio_url||'')+'\')"><svg viewBox="0 0 24 24" fill="currentColor" class="icon-play"><path d="M8 5v14l11-7z"/></svg><svg viewBox="0 0 24 24" fill="currentColor" class="icon-pause" style="display:none"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg></button><div class="voice-waveform">'+bars+'</div><span class="voice-duration">'+fD(du)+'</span></div><div class="voice-progress-track"><div class="voice-progress-fill"></div><div class="voice-progress-thumb"></div></div><div class="voice-times"><span class="vt-current">0:00</span><span class="vt-total">'+fD(du)+'</span></div><div class="meta" style="float:none;display:flex;justify-content:flex-end;margin-top:4px">'+time+' '+vu+'</div></div>';
}

var em=m.edited_at?'<span class="edited-mark"> (مُعدّلة)</span>':'';
return'<div class="msg '+cls+'" data-mid="'+escAttr(m.id)+'">'+sL+rh+fmtTxt(m.text||'')+em+'<div class="meta">'+time+' '+vu+'</div></div>';
}

/* ═══════════════════════════════════════════════════════════════
   ⚡ markRead — تسجيل كل قارئ بالوقت في read_by
═══════════════════════════════════════════════════════════════ */
function markRead(){
if(!currentChat||!currentUser)return;
var now=new Date().toISOString();
var myId=currentUser.id;

dbS('messages','chat_id=eq.'+currentChat.id+'&sender_id=neq.'+myId+'&select=id,read_by').then(function(msgs){
if(!msgs||!msgs.length)return;
msgs.forEach(function(m){
var list=[];
if(m.read_by){
if(typeof m.read_by==='string'){try{list=JSON.parse(m.read_by);}catch(e){list=[];}}
else if(Array.isArray(m.read_by)){list=m.read_by;}
}
// تجاهل إن كان مسجلاً مسبقاً
if(list.some(function(r){return r&&r.user_id===myId;}))return;
list.push({user_id:myId,read_at:now});
dbP('messages','id=eq.'+m.id,{read_by:list,read_at:now}).catch(function(){});
});
});

if(currentChat.unread_count){
currentChat.unread_count=0;
dbP('chats','id=eq.'+currentChat.id,{unread_count:0}).catch(function(){});
}
}

function startMsgPoll(cid){
stopMsgPoll();
messagesPollTimer=setInterval(function(){
if(!currentChat||currentChat.id!==cid)return;
var a=document.querySelector('.sc.act');
if(!a||a.id!=='sc-chat')return;
if(!lastMessageTime)return;
var q='chat_id=eq.'+cid+'&created_at=gt.'+encodeURIComponent(lastMessageTime)+'&order=created_at.asc&select=*';
dbS('messages',q).then(function(nm){
if(!nm||!nm.length)return;
var body=$('chat-body'),e=body.querySelector('.cempty');
if(e)e.remove();
var appended=false;
nm.forEach(function(m){
if(renderedMsgIds[m.id]){lastMessageTime=m.created_at;return;}
if(myDeletedMessages[m.id]){lastMessageTime=m.created_at;return;}
renderedMsgIds[m.id]=true;
body.insertAdjacentHTML('beforeend',renderMsg(m));
lastMessageTime=m.created_at;
appended=true;
});
if(appended){body.scrollTop=body.scrollHeight;markRead();}
});
},2000);
}
function stopMsgPoll(){if(messagesPollTimer){clearInterval(messagesPollTimer);messagesPollTimer=null;}}

function startReadPoll(cid){
stopReadPoll();
readStatusPollTimer=setInterval(function(){
if(!currentChat||currentChat.id!==cid)return;
dbS('messages','chat_id=eq.'+cid+'&sender_id=eq.'+currentUser.id+'&select=id,read_at,deleted_at,read_by').then(function(ms){
if(!ms)return;
var body=$('chat-body');
ms.forEach(function(m){
var el=body.querySelector('[data-mid="'+m.id+'"]');
if(!el)return;
if(m.deleted_at&&!el.classList.contains('deleted-msg')){
var cls=el.classList.contains('me')?'me':'other';
el.outerHTML='<div class="msg '+cls+' deleted-msg" data-mid="'+m.id+'"><span style="opacity:.75">تم الحذف</span><div class="meta">—</div></div>';
return;
}
// ⚡ تحديث عدد القراء
var vu=el.querySelector('.vu');
if(vu&&m.read_by){
var rb=m.read_by;
if(typeof rb==='string'){try{rb=JSON.parse(rb);}catch(e){rb=[];}}
if(Array.isArray(rb)){
var cnt=rb.filter(function(r){return r&&r.user_id;}).length;
var newText=cnt>0?'✓✓ '+cnt:'✓';
if(vu.textContent!==newText){vu.textContent=newText;vu.title='قرأها '+cnt;}
}
}
});
});
},4000);
}
function stopReadPoll(){if(readStatusPollTimer){clearInterval(readStatusPollTimer);readStatusPollTimer=null;}}

/* ============ Reactions ============ */
function loadReacts(cid){
if(!cid)return;
dbS('messages','chat_id=eq.'+cid+'&order=created_at.desc&limit=200&select=id').then(function(ms){
if(!ms||!ms.length){reactionsCache={};refReact();return;}
var ids=ms.map(function(m){return m.id;}).join(',');
return dbS('reactions','message_id=in.('+ids+')&select=*').then(function(l){
reactionsCache={};
(l||[]).forEach(function(r){
if(!reactionsCache[r.message_id])reactionsCache[r.message_id]=[];
reactionsCache[r.message_id].push(r);
});
refReact();
});
});
}
function refReact(){
document.querySelectorAll('.msg').forEach(function(el){
var mid=el.getAttribute('data-mid');
if(!mid)return;
if(el.classList.contains('deleted-msg'))return;
var old=el.querySelector('.reactions');
if(old)old.remove();
var l=reactionsCache[mid];
if(!l||!l.length)return;
var u={};
l.forEach(function(r){u[r.emoji]=(u[r.emoji]||0)+1;});
var h='';
Object.keys(u).forEach(function(e){h+='<span>'+e+'</span>';});
el.insertAdjacentHTML('beforeend','<div class="reactions">'+h+'</div>');
});
}
function setReact(emoji){
if(!selectedMessage)return;
var id=selectedMessage.id;
closeMsgMenu();
dbS('reactions','message_id=eq.'+id+'&user_id=eq.'+currentUser.id+'&select=*').then(function(a){
if(a&&a.length){
var r=a[0];
if(r.emoji===emoji)return dbD('reactions','id=eq.'+r.id).then(function(){if(currentChat)loadReacts(currentChat.id);});
return dbP('reactions','id=eq.'+r.id,{emoji:emoji}).then(function(){if(currentChat)loadReacts(currentChat.id);});
}
return dbI('reactions',{message_id:id,user_id:currentUser.id,emoji:emoji}).then(function(){toast(emoji);if(currentChat)loadReacts(currentChat.id);});
});
}

/* ============ Load Chats ============ */
function loadChats(){
if(!currentUser)return Promise.resolve();
var uid=currentUser.id;
return Promise.all([
dbS('chats','or=(user1_id.eq.'+uid+',user2_id.eq.'+uid+')&order=last_message_at.desc.nullslast').catch(function(){return[];}),
dbS('chat_members','user_id=eq.'+uid+'&select=chat_id').catch(function(){return[];}),
loadFavs()
]).then(function(r){
var dir=r[0]||[],mem=r[1]||[],gids=mem.map(function(m){return m.chat_id;}),seen={};
dir.forEach(function(c){seen[c.id]=1;});
var toF=gids.filter(function(id){return!seen[id];});
var gp=toF.length?dbS('chats','id=in.('+toF.join(',')+')&select=*').catch(function(){return[];}):Promise.resolve([]);
return gp.then(function(gc){
var all=dir.concat(gc||[]),pids=[];
all.forEach(function(c){
if(!c.is_group){var oid=c.user1_id===uid?c.user2_id:c.user1_id;if(pids.indexOf(oid)===-1)pids.push(oid);}
});
var pp=pids.length?dbS('profiles','or=('+pids.map(function(id){return'id.eq.'+id;}).join(',')+')&select=id,name,phone,avatar_url,last_seen,username').catch(function(){return[];}):Promise.resolve([]);
return pp.then(function(ps){
var pm={};
(ps||[]).forEach(function(p){pm[p.id]=p;});
chats=all.map(function(c){
if(c.is_group)return Object.assign({},c,{_other:null,_type:'group',_name:c.group_name||'مجموعة'});
var oid=c.user1_id===uid?c.user2_id:c.user1_id;
return Object.assign({},c,{_other:pm[oid]||null,_type:'direct'});
});
chats.sort(function(a,b){var at=a.last_message_at?new Date(a.last_message_at).getTime():0,bt=b.last_message_at?new Date(b.last_message_at).getTime():0;return bt-at;});
renderChats();
renderFavs();
});
});
}).catch(function(e){});
}

function renderChats(){
var l=$('chats-list'),e=$('chats-empty'),c=$('chats-count');
if(c)c.textContent=chats.length;
if(!chats.length){if(l)l.innerHTML='';if(e)e.style.display='flex';return;}
if(e)e.style.display='none';
var h='';
chats.forEach(function(ch){
var isG=ch.is_group,n=isG?(ch.group_name||'مجموعة'):((ch._other&&ch._other.name)?ch._other.name:'مستخدم'),pr=(ch.last_message||'ابدأ المحادثة'),t=ch.last_message_at?fT(ch.last_message_at):'',av=isG?grpAvH(ch,54):avH(ch._other,54),u=ch.unread_count&&ch.unread_count>0,f1=isFav('chat',ch.id),bd=isG?'<span style="font-size:10px;color:#86EFAC;background:rgba(34,197,94,.15);padding:2px 6px;border-radius:6px;font-weight:800;margin-inline-start:6px">مجموعة</span>':'';
h+='<div class="ci'+(u?' unread':'')+'" onclick="openChat(\''+escJs(ch.id)+'\')" style="'+(f1?'border-color:rgba(251,191,36,.35);':'')+'">'+av+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(n)+(f1?' ★':'')+bd+'</span><span class="ci-t">'+t+'</span></div><div style="display:flex;align-items:center;gap:8px"><span class="ci-m">'+esc(pr)+'</span>'+(u?'<span class="bdg">'+ch.unread_count+'</span>':'')+'</div></div></div>';
});
if(l)l.innerHTML=h;
}
function startChatsPoll(){stopChatsPoll();chatsPollTimer=setInterval(function(){var a=document.querySelector('.sc.act');if(a&&a.id==='sc-chats')loadChats();},3500);}
function stopChatsPoll(){if(chatsPollTimer){clearInterval(chatsPollTimer);chatsPollTimer=null;}}

/* ============ Open Chat ============ */
function openChat(cid){
var ch=chats.find(function(c){return c.id===cid;});
if(!ch){toast('غير موجود');return;}
currentChat=ch;
currentChatMode=ch.is_group?'group':'direct';
try{localStorage.setItem('novira_last_chat',currentChatMode+':'+cid);}catch(e){}
stopTypingSession();
if(ch.is_group){
$('chat-n').textContent=ch.group_name||'مجموعة';
var av=$('chat-av');av.classList.remove('avp');
if(ch.group_avatar_url){av.style.background='';av.style.backgroundImage='url('+ch.group_avatar_url+')';av.style.backgroundSize='cover';av.innerHTML='';}
else{av.style.background='linear-gradient(135deg,#22C55E,#06B6D4)';av.style.backgroundImage='none';av.innerHTML=GSVG.replace('<svg','<svg style="width:24px;height:24px"');}
$('chat-s').textContent='جاري...';
loadGrpMembers(cid).then(function(){$('chat-s').textContent=currentGroupMembers.length+' عضو';updComposerPerm();});
var hd=$('chat-header-info');
if(hd){hd.style.cursor='pointer';hd.onclick=function(){openGroupInfo();};}
}else{
var o=ch._other;
$('chat-n').textContent=(o&&o.name)||'مستخدم';
sAv($('chat-av'),o);
var st='';
if(o&&o.last_seen){
var d=Date.now()-new Date(o.last_seen).getTime();
if(d<60000)st='متصل الآن';
else if(d<3600000)st='آخر ظهور قبل '+Math.floor(d/60000)+'د';
else st='آخر ظهور '+fT(o.last_seen);
}else if(o&&o.username)st='@'+o.username;
else if(o&&o.phone)st=o.phone;
$('chat-s').textContent=st;
var hd2=$('chat-header-info');
if(hd2){hd2.style.cursor='';hd2.onclick=function(){if(currentChat&&currentChat._other)showProfCard(currentChat._other.id);};}
updComposerPerm();
}
go('chat');
lastMessageTime=null;
renderedMsgIds={};
cancelReply();
updFavLbl();
loadMyDel(cid).then(function(){
return loadMsgs();
}).then(function(){
startMsgPoll(cid);
startReadPoll(cid);
if(!ch.is_group){startTypingPoll(cid);stopGroupInfoPoll();}
else{stopTypingPoll();startGroupInfoPoll(cid);}
setTimeout(function(){loadReacts(cid);},500);
});
checkBlock();
markOnline();
}
function loadMyDel(cid){
if(!currentUser||!cid)return Promise.resolve();
myDeletedMessages={};
return dbS('message_deletions','user_id=eq.'+currentUser.id+'&select=message_id').then(function(l){(l||[]).forEach(function(d){myDeletedMessages[d.message_id]=true;});}).catch(function(){});
}

/* ============ New Chat ============ */
function openNewChat(){
if($('new-phone'))$('new-phone').value='';
if($('new-username'))$('new-username').value='';
openSheet('new');
setTimeout(function(){if($('new-phone'))$('new-phone').focus();},250);
}
function createChat(){
var phRaw=($('new-phone')?$('new-phone').value:'').trim();
var unRaw=($('new-username')?$('new-username').value:'').trim();
var ph=nP(phRaw);
var un=unRaw.replace(/^@/,'').toLowerCase().trim();
if(!ph && !un){toast('أدخل رقماً أو @username');return;}
if(ph && un){toast('اختر واحداً فقط');return;}
if(un){
if(!/^[a-z0-9_]{3,20}$/.test(un)){toast('اسم المستخدم غير صالح');return;}
dbS('profiles','username=eq.'+encodeURIComponent(un)+'&select=*').then(function(a){
if(!a||!a.length){toast('لا مستخدم بهذا الاسم');return;}
_startChatWith(a[0]);
}).catch(function(){toast('خطأ');});
return;
}
if(ph){
dbS('profiles','phone=eq.'+encodeURIComponent(ph)+'&select=*').then(function(a){
if(!a||!a.length){toast('لا مستخدم بهذا الرقم');return;}
_startChatWith(a[0]);
}).catch(function(){toast('خطأ');});
}
}
function _startChatWith(o){
if(o.id===currentUser.id){toast('هذا أنت!');return;}
var q='or=(and(user1_id.eq.'+currentUser.id+',user2_id.eq.'+o.id+'),and(user1_id.eq.'+o.id+',user2_id.eq.'+currentUser.id+'))';
dbS('chats',q+'&select=*').then(function(ex){
if(ex&&ex.length){closeSheet();loadChats().then(function(){setTimeout(function(){openChat(ex[0].id);},200);});return;}
dbI('chats',{user1_id:currentUser.id,user2_id:o.id}).then(function(r){
var nc=Array.isArray(r)?r[0]:r;
closeSheet();
loadChats().then(function(){setTimeout(function(){openChat(nc.id);},200);});
});
}).catch(function(){toast('خطأ');});
}
function openByUN(un){
if(!un)return;
dbS('profiles','username=eq.'+encodeURIComponent(un)+'&select=*').then(function(a){
if(!a||!a.length){toast('لا يوجد');return;}
var u=a[0];
if(u.id===currentUser.id){go('settings');return;}
var f=chats.find(function(c){return!c.is_group&&c._other&&c._other.id===u.id;});
if(f){openChat(f.id);return;}
var q='or=(and(user1_id.eq.'+currentUser.id+',user2_id.eq.'+u.id+'),and(user1_id.eq.'+u.id+',user2_id.eq.'+currentUser.id+'))';
dbS('chats',q+'&select=*').then(function(ex){
if(ex&&ex.length){loadChats().then(function(){openChat(ex[0].id);});return;}
dbI('chats',{user1_id:currentUser.id,user2_id:u.id}).then(function(r){var nc=Array.isArray(r)?r[0]:r;loadChats().then(function(){openChat(nc.id);});});
});
});
}
function deepLink(){
try{
var p=new URLSearchParams(location.search);
var u=p.get('u');
if(!u)return;
try{history.replaceState(null,'',location.pathname);}catch(e){}
setTimeout(function(){openByUN(u);},800);
}catch(e){}
}

/* ============ Profile Card ============ */
function showProfCard(uid){
dbS('profiles','id=eq.'+uid+'&select=*').then(function(a){
if(!a||!a.length)return;
var u=a[0];
currentPCUser=u;
sAv($('pc-av'),u);
$('pc-name').textContent=u.name||'';
$('pc-user').textContent=u.username?'@'+u.username:(u.phone||'');
var pb=$('pc-bio');if(pb)pb.textContent=u.bio||'';
openSheet('profile-card');
});
}
function msgFromCard(){
if(!currentPCUser)return;
var uid=currentPCUser.id;
closeSheet();
var f=chats.find(function(c){return!c.is_group&&c._other&&c._other.id===uid;});
if(f){openChat(f.id);return;}
dbI('chats',{user1_id:currentUser.id,user2_id:uid}).then(function(r){var nc=Array.isArray(r)?r[0]:r;loadChats().then(function(){openChat(nc.id);});});
}
function qrFromCard(){
if(!currentPCUser||!currentPCUser.username){toast('لا يوجد username');return;}
var u=currentPCUser;
closeSheet();
setTimeout(function(){
openSheet('my-qr');
setTimeout(function(){
var un=u.username,url=getURL(un),i=$('my-qr-info');
if(i)i.innerHTML='<div class="av '+(u.avatar_url?'':'avp')+'" style="'+(u.avatar_url?'background-image:url('+escAttr(u.avatar_url)+');background-size:cover':'background:'+gB(u))+'">'+(u.avatar_url?'':PSVG)+'</div><div class="name">'+esc(u.name||'')+'</div><div class="username">@'+esc(un)+'</div>';
var w=$('my-qr-code');if(w)w.innerHTML='';
try{new QRCode(w,{text:url,width:150,height:150,colorDark:'#0A0E1A',colorLight:'#FFF',correctLevel:QRCode.CorrectLevel.H});}catch(e){}
var qu=$('my-qr-user');if(qu)qu.textContent='@'+un;
var qurl=$('my-qr-url');if(qurl)qurl.textContent=url;
},250);
},250);
}

/* ============ QR ============ */
function getURL(un){
var b;
if(IS_APK&&PUBLIC_URL){b=PUBLIC_URL;}
else{b=location.origin+location.pathname.replace(/[^/]*$/,'');}
if(b.charAt(b.length-1)!=='/')b+='/';
return b+'?u='+encodeURIComponent(un);
}
function openQR(){
if(!currentProfile||!currentProfile.username){toast('لا يوجد username');return;}
openSheet('my-qr');
setTimeout(function(){
var un=currentProfile.username,url=getURL(un),i=$('my-qr-info');
if(i)i.innerHTML='<div class="av '+(currentProfile.avatar_url?'':'avp')+'" style="'+(currentProfile.avatar_url?'background-image:url('+escAttr(currentProfile.avatar_url)+');background-size:cover':'background:'+gB(currentProfile))+'">'+(currentProfile.avatar_url?'':PSVG)+'</div><div class="name">'+esc(currentProfile.name||'')+'</div><div class="username">@'+esc(un)+'</div>';
var w=$('my-qr-code');if(w)w.innerHTML='';
try{new QRCode(w,{text:url,width:150,height:150,colorDark:'#0A0E1A',colorLight:'#FFF',correctLevel:QRCode.CorrectLevel.H});}catch(e){}
var qu=$('my-qr-user');if(qu)qu.textContent='@'+un;
var qurl=$('my-qr-url');if(qurl)qurl.textContent=url;
},250);
}
function cpyQR(){if(!currentProfile||!currentProfile.username)return;copyT(getURL(currentProfile.username));}
function shareQR(){
if(!currentProfile||!currentProfile.username){toast('لا يوجد username');return;}
var un=currentProfile.username,url=getURL(un),name=currentProfile.name||un;
var text='📱 أضفني على Novira\n@'+un+'\n'+url;
if(navigator.share){navigator.share({title:'Novira — '+name,text:'📱 أضفني على Novira',url:url}).catch(function(){});}
else{copyT(text);toast('تم نسخ الرابط');}
}
function openQRScan(){
openSheet('qr-scanner');
setTimeout(function(){
var rd=$('qr-reader');if(!rd)return;
rd.innerHTML='';
if(typeof Html5Qrcode==='undefined'){toast('الماسح غير متاح');return;}
try{
qrScanner=new Html5Qrcode('qr-reader');
qrScanner.start({facingMode:'environment'},{fps:10,qrbox:250},function(text){
try{if(navigator.vibrate)navigator.vibrate(50);}catch(e){}
closeQRScan();
var m=text.match(/[?&]u=([^&]+)/);
var un=m?decodeURIComponent(m[1]):text.trim();
if(un.indexOf('@')===0)un=un.substring(1);
setTimeout(function(){openByUN(un);},300);
},function(){});
}catch(e){toast('فشل تشغيل الكاميرا');}
},300);
}
function closeQRScan(){
if(qrScanner){try{qrScanner.stop().then(function(){qrScanner.clear();qrScanner=null;}).catch(function(){qrScanner=null;});}catch(e){qrScanner=null;}}
closeSheet();
}
function pickQRI(){$('file-qr-scan').click();}
function handleQRI(f){
if(!f)return;
if(typeof Html5Qrcode==='undefined'){toast('غير متاح');return;}
var scanner=new Html5Qrcode('qr-reader-temp',false);
scanner.scanFile(f,true).then(function(text){
closeQRScan();
var m=text.match(/[?&]u=([^&]+)/);
var un=m?decodeURIComponent(m[1]):text.trim();
if(un.indexOf('@')===0)un=un.substring(1);
setTimeout(function(){openByUN(un);},300);
}).catch(function(){toast('لم يتم التعرف على QR');});
}

/* ============ Search ============ */
function openSearch(){
var si=$('search-input');if(si)si.value='';
searchTab='all';
document.querySelectorAll('#search-tabs .search-tab').forEach(function(b){b.classList.toggle('act',b.id==='search-tab-all');});
doSearch();
openSheet('search');
// ⚡ لا نفتح لوحة المفاتيح تلقائياً
}
function switchTab(t){
searchTab=t;
document.querySelectorAll('#search-tabs .search-tab').forEach(function(b){b.classList.toggle('act',b.id==='search-tab-'+t);});
doSearch();
}
function doSearch(){
var si=$('search-input'),r=$('search-results');if(!si||!r)return;
var q=si.value.trim().toLowerCase();
var pool=chats.filter(function(c){
if(searchTab==='mine')return c.is_group&&c.group_creator_id===currentUser.id;
if(searchTab==='member')return c.is_group&&c.group_creator_id!==currentUser.id;
return true;
});
if(!q){
var mg=pool.filter(function(c){return c.is_group&&c.group_creator_id===currentUser.id;}),jg=pool.filter(function(c){return c.is_group&&c.group_creator_id!==currentUser.id;}),dc=pool.filter(function(c){return!c.is_group;}),h='';
if(searchTab==='all'&&dc.length){h+='<div class="search-sec-title">المحادثات</div>';dc.forEach(function(c){h+=renderSrch(c);});}
if((searchTab==='all'||searchTab==='mine')&&mg.length){h+='<div class="search-sec-title">مجموعاتي</div>';mg.forEach(function(c){h+=renderSrch(c);});}
if((searchTab==='all'||searchTab==='member')&&jg.length){h+='<div class="search-sec-title">ضموني</div>';jg.forEach(function(c){h+=renderSrch(c);});}
r.innerHTML=h||'<div style="text-align:center;color:var(--t3);padding:24px;font-size:13px">لا شيء</div>';
return;
}
var f=pool.filter(function(c){
var n=c.is_group?(c.group_name||'').toLowerCase():((c._other&&c._other.name)?c._other.name.toLowerCase():''),p=(!c.is_group&&c._other&&c._other.phone)?c._other.phone:'',u=(!c.is_group&&c._other&&c._other.username)?c._other.username.toLowerCase():'';
return n.indexOf(q)!==-1||p.indexOf(q)!==-1||u.indexOf(q)!==-1;
});
if(!f.length){r.innerHTML='<div style="text-align:center;color:var(--t3);padding:24px;font-size:13px">لا نتائج</div>';return;}
var d2=f.filter(function(c){return!c.is_group;}),m2=f.filter(function(c){return c.is_group&&c.group_creator_id===currentUser.id;}),j2=f.filter(function(c){return c.is_group&&c.group_creator_id!==currentUser.id;}),hh='';
if(d2.length){hh+='<div class="search-sec-title">المحادثات</div>';d2.forEach(function(c){hh+=renderSrch(c);});}
if(m2.length){hh+='<div class="search-sec-title">مجموعاتي</div>';m2.forEach(function(c){hh+=renderSrch(c);});}
if(j2.length){hh+='<div class="search-sec-title">ضموني</div>';j2.forEach(function(c){hh+=renderSrch(c);});}
r.innerHTML=hh;
}
function renderSrch(c){
if(c.is_group){
var r=c.group_creator_id===currentUser.id?'أنشأتها':'عضو';
return'<div class="ci" onclick="closeSheet();openChat(\''+escJs(c.id)+'\')">'+grpAvH(c,54)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(c.group_name||'مجموعة')+'</span></div><div class="ci-m">'+r+'</div></div></div>';
}
var o=c._other||{};
return'<div class="ci" onclick="closeSheet();openChat(\''+escJs(c.id)+'\')">'+avH(o,54)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(o.name||'')+'</span></div><div class="ci-m">'+esc(o.username?'@'+o.username:(o.phone||''))+'</div></div></div>';
}

/* ============ Favorites ============ */
function loadFavs(){
if(!currentUser)return Promise.resolve();
return dbS('favorites','user_id=eq.'+currentUser.id+'&target_type=eq.chat&select=target_type,target_id').then(function(l){
favorites=(l||[]).filter(function(f){return f&&f.target_type==='chat'&&f.target_id;});
}).catch(function(){favorites=[];});
}
function isFav(t,i){
for(var k=0;k<favorites.length;k++)if(favorites[k].target_type===t&&favorites[k].target_id===i)return true;
return false;
}
function renderFavs(){
var s=$('fav-section'),sc=$('fav-scroll');
if(!s||!sc)return;
var cl=$('fav-count-label'),tc=$('fav-tile-count');
// ⚡ إخفاء قسري أولاً
if(cl)cl.textContent='';
if(tc){tc.textContent='';tc.classList.remove('show');tc.removeAttribute('data-count');tc.style.display='none';}
// ⚡ تحقق صارم
if(!Array.isArray(favorites)||favorites.length===0){s.style.display='none';sc.innerHTML='';return;}
// ⚡ فلترة صارمة — فقط المفضلات الحقيقية
var validFavs=favorites.filter(function(f){
if(!f||f.target_type!=='chat'||!f.target_id)return false;
if(!Array.isArray(chats))return false;
return chats.some(function(c){return c&&c.id===f.target_id;});
});
var count=validFavs.length;
if(count===0){s.style.display='none';sc.innerHTML='';return;}
if(cl)cl.textContent=count+' محادثة';
if(tc){tc.textContent=String(count);tc.setAttribute('data-count',String(count));tc.style.display='block';}
s.style.display='block';
var h='';
validFavs.forEach(function(f){
var c=chats.find(function(x){return x.id===f.target_id;});
if(!c)return;
var isG=c.is_group,name=isG?(c.group_name||'مجموعة'):((c._other&&c._other.name)||'مستخدم'),av=isG?grpAvH(c,60):stAv(c._other);
h+='<div class="fav-chip" onclick="openChat(\''+escJs(f.target_id)+'\')"><div class="fav-chip-av">'+av+'<div class="fav-chip-star">★</div></div><div class="fav-chip-n">'+esc(name)+'</div></div>';
});
sc.innerHTML=h;
}
function toggleFav(){
closeChatMenu();
if(!currentChat)return;
var cid=currentChat.id,ex=isFav('chat',cid);
if(ex){
dbD('favorites','user_id=eq.'+currentUser.id+'&target_type=eq.chat&target_id=eq.'+cid).then(function(){
favorites=favorites.filter(function(f){return!(f.target_type==='chat'&&f.target_id===cid);});
renderChats();renderFavs();updFavLbl();toast('أُزيلت');
});
}else{
dbI('favorites',{user_id:currentUser.id,target_type:'chat',target_id:cid}).then(function(){
favorites.push({target_type:'chat',target_id:cid});
renderChats();renderFavs();updFavLbl();toast('★ أُضيفت');
});
}
}
function updFavLbl(){
var i=$('fav-toggle-item');
if(!i||!currentChat)return;
var sp=i.querySelector('span');
if(isFav('chat',currentChat.id)){if(sp)sp.textContent='إزالة من المفضلة';i.classList.add('fav-active');}
else{if(sp)sp.textContent='إضافة للمفضلة';i.classList.remove('fav-active');}
}
function openFavMgr(){renderFavMgr();openSheet('favorites');}
function renderFavMgr(){
var c=$('favorites-manager-list');if(!c)return;
var validFavs=favorites.filter(function(f){
if(f.target_type!=='chat')return false;
return chats.some(function(ch){return ch.id===f.target_id;});
});
if(validFavs.length===0){c.innerHTML='<div style="text-align:center;padding:30px;color:var(--t3);font-size:13px">لا مفضلات</div>';return;}
var h='';
validFavs.forEach(function(f){
var cv=chats.find(function(x){return x.id===f.target_id;});
if(!cv)return;
var isG=cv.is_group,name=isG?(cv.group_name||'مجموعة'):((cv._other&&cv._other.name)||'مستخدم'),av=isG?grpAvH(cv,46):avH(cv._other,46);
h+='<div class="ci" style="padding:10px 12px;margin-bottom:6px">'+av+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">★ '+esc(name)+'</span></div></div><button onclick="rmFav(\''+escJs(cv.id)+'\')" style="background:rgba(239,68,68,.15);color:#FCA5A5;border:1px solid rgba(239,68,68,.3);padding:6px 12px;border-radius:10px;font-size:11px;font-weight:800;margin:0">إزالة</button></div>';
});
c.innerHTML=h;
}
function rmFav(cid){
dbD('favorites','user_id=eq.'+currentUser.id+'&target_type=eq.chat&target_id=eq.'+cid).then(function(){
favorites=favorites.filter(function(f){return!(f.target_type==='chat'&&f.target_id===cid);});
renderChats();renderFavs();renderFavMgr();toast('✓');
});
}

/* ============ Media ============ */
function handleFileSel(f){
if(!f)return;
var isI=f.type.indexOf('image/')===0,isV=f.type.indexOf('video/')===0;
if(!isI&&!isV){toast('غير مدعوم');return;}
var MX=isI?20*1024*1024:100*1024*1024;
if(f.size>MX){toast('حجم كبير جداً');return;}
selectedFile=f;
selectedFileType=isI?'image':'video';
var c=$('pc'),url=URL.createObjectURL(f);
if(c)c.innerHTML=isI?'<img src="'+url+'">':'<video src="'+url+'" controls playsinline></video>';
if($('media-caption'))$('media-caption').value='';
if($('media-send-text'))$('media-send-text').textContent='إرسال';
if($('media-progress'))$('media-progress').classList.remove('act');
if($('media-progress-bar'))$('media-progress-bar').style.width='0%';
var mp=$('mp');if(mp)mp.classList.add('act');
}
function closePrev(){
var v=document.querySelector('#pc video');
if(v)try{v.pause();}catch(e){}
var mp=$('mp');if(mp)mp.classList.remove('act');
var pc=$('pc');if(pc)pc.innerHTML='';
selectedFile=null;selectedFileType=null;
}
function pickCam(){closeSheet();setTimeout(function(){$('file-camera').click();},200);}
function pickImg(){closeSheet();setTimeout(function(){$('file-image').click();},200);}
function pickVid(){closeSheet();setTimeout(function(){$('file-video').click();},200);}
function sendMedia(){
if(!selectedFile||!currentChat){toast('لا ملف');return;}
if(!canISend()){toast('لا تملك صلاحية');return;}
if(isBlockedByMe){toast('لا يمكن — أنت حظرت هذا المستخدم');return;}
var cap=$('media-caption')?$('media-caption').value.trim():'',btn=$('media-send-btn');
if(btn)btn.disabled=true;
if($('media-send-text'))$('media-send-text').innerHTML='جاري الرفع...';
if($('media-progress'))$('media-progress').classList.add('act');
var ext=selectedFile.name.split('.').pop()||(selectedFileType==='image'?'jpg':'mp4');
var fn=currentUser.id+'/'+Date.now()+'.'+ext;
upPr('media',fn,selectedFile,function(p){if($('media-progress-bar'))$('media-progress-bar').style.width=p+'%';}).then(function(){
var pu=stPub('media',fn);
var p={chat_id:currentChat.id,sender_id:currentUser.id,type:selectedFileType,media_url:pu,media_type:selectedFile.type,text:cap||'',created_at:new Date().toISOString()};
return dbI('messages',p);
}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
lastMessageTime=m.created_at;
var pv=selectedFileType==='image'?'📷 صورة':'🎥 فيديو';
return dbP('chats','id=eq.'+currentChat.id,{last_message:pv,last_message_at:m.created_at}).then(function(){
if(renderedMsgIds[m.id]){closePrev();return;}
renderedMsgIds[m.id]=true;
var body=$('chat-body'),e=body.querySelector('.cempty');
if(e)e.remove();
body.insertAdjacentHTML('beforeend',renderMsg(m));
body.scrollTop=body.scrollHeight;
closePrev();
toast('✓ تم الإرسال');
});
}).catch(function(){toast('فشل الرفع');}).then(function(){if(btn)btn.disabled=false;if($('media-send-text'))$('media-send-text').textContent='إرسال';});
}
function openVw(url,type){
currentMediaUrl=url;currentMediaType=type;
var c=$('viewer-content');
if(!c)return;
if(type==='image')c.innerHTML='<img src="'+escAttr(url)+'">';
else c.innerHTML='<video src="'+escAttr(url)+'" controls autoplay playsinline></video>';
$('mv').classList.add('act');
}
function closeVw(){
var v=document.querySelector('#viewer-content video');
if(v)try{v.pause();}catch(e){}
$('mv').classList.remove('act');
var c=$('viewer-content');if(c)c.innerHTML='';
currentMediaUrl=null;currentMediaType=null;
}
function openMM(url,type,mid){
currentMediaUrl=url;currentMediaType=type;
selectedMessage={id:mid};
openSheet('media-menu');
}
function saveMedia(){
if(!currentMediaUrl){toast('لا وسائط');return;}
closeSheet();
var url=currentMediaUrl,type=currentMediaType||'image';
var ext=(type==='video')?'mp4':'jpg';
try{var m=url.match(/\.([a-zA-Z0-9]+)(\?|$)/);if(m&&m[1])ext=m[1];}catch(e){}
var fname='novira_'+Date.now()+'.'+ext;
toast('جاري التحميل...');
fetch(url).then(function(r){if(!r.ok)throw new Error('فشل');return r.blob();}).then(function(blob){
var a=document.createElement('a'),u=URL.createObjectURL(blob);
a.href=u;a.download=fname;a.style.display='none';
document.body.appendChild(a);a.click();
setTimeout(function(){try{document.body.removeChild(a);}catch(e){}try{URL.revokeObjectURL(u);}catch(e){}},1500);
toast('✓ تم الحفظ');
}).catch(function(){window.open(url,'_blank');toast('جاري الفتح...');});
}
function shareMedia(){
if(!currentMediaUrl){toast('لا وسائط');return;}
var url=currentMediaUrl;
if(navigator.share){navigator.share({title:'Novira',url:url}).catch(function(){});}
else{copyT(url);toast('تم نسخ الرابط');}
}

/* ============ Audio Player ============ */
function playV(btn,url){
if(!url)return;
if(currentAudioPlayer&&currentAudioBtn===btn){
if(currentAudioPlayer.paused){currentAudioPlayer.play();btn.querySelector('.icon-play').style.display='none';btn.querySelector('.icon-pause').style.display='block';}
else{currentAudioPlayer.pause();btn.querySelector('.icon-play').style.display='block';btn.querySelector('.icon-pause').style.display='none';}
return;
}
if(currentAudioPlayer){try{currentAudioPlayer.pause();}catch(e){}if(currentAudioBtn){currentAudioBtn.querySelector('.icon-play').style.display='block';currentAudioBtn.querySelector('.icon-pause').style.display='none';}}
var a=new Audio(url);a.preload='auto';
currentAudioPlayer=a;currentAudioBtn=btn;
btn.querySelector('.icon-play').style.display='none';
btn.querySelector('.icon-pause').style.display='block';
var me=btn.closest('.msg');
if(!me){a.play().catch(function(){toast('تعذر التشغيل');});return;}
var fill=me.querySelector('.voice-progress-fill');
var thumb=me.querySelector('.voice-progress-thumb');
var curTimeEl=me.querySelector('.vt-current');
var totalEl=me.querySelector('.vt-total');
var waveformBars=me.querySelectorAll('.voice-waveform span');
function updateUI(){
var dur=a.duration&&isFinite(a.duration)?a.duration:(parseFloat(me.getAttribute('data-duration'))||1);
var pct=Math.max(0,Math.min(100,(a.currentTime/dur)*100));
if(fill)fill.style.width=pct+'%';
if(thumb)thumb.style.left=pct+'%';
if(curTimeEl)curTimeEl.textContent=fD(a.currentTime);
if(waveformBars){var playedCount=Math.floor((pct/100)*waveformBars.length);for(var i=0;i<waveformBars.length;i++){if(i<playedCount)waveformBars[i].classList.add('played');else waveformBars[i].classList.remove('played');}}
}
a.addEventListener('timeupdate',updateUI);
a.addEventListener('loadedmetadata',function(){
var dur=a.duration&&isFinite(a.duration)?a.duration:(parseFloat(me.getAttribute('data-duration'))||0);
if(totalEl)totalEl.textContent=fD(dur);
var durEl=me.querySelector('.voice-duration');
if(durEl)durEl.textContent=fD(dur);
me.setAttribute('data-duration',dur);
updateUI();
});
a.addEventListener('ended',function(){
btn.querySelector('.icon-play').style.display='block';
btn.querySelector('.icon-pause').style.display='none';
if(fill)fill.style.width='0%';
if(thumb)thumb.style.left='0%';
if(curTimeEl)curTimeEl.textContent='0:00';
if(waveformBars){for(var i=0;i<waveformBars.length;i++)waveformBars[i].classList.remove('played');}
currentAudioPlayer=null;currentAudioBtn=null;
});
a.play().catch(function(){toast('تعذر التشغيل');});
}

/* ============ Mentions ============ */
function setupMentions(){
var i=$('msg-input');
if(!i||i._mb)return;
i._mb=true;
i.addEventListener('input',function(){
var v=this.value,c=this.selectionStart,b=v.substring(0,c),m=b.match(/(^|[\s\n])@([a-zA-Z0-9_]*)$/);
if(m){
mentionStartIdx=c-m[2].length-1;
mentionQuery=m[2].toLowerCase();
var l=[],s={};
if(currentChat&&currentChat.is_group){
currentGroupMembers.forEach(function(mb){
var u=mb.profile;
if(!u||!u.username||s[u.id])return;
if(u.id===currentUser.id)return;
s[u.id]=1;
var n=(u.name||'').toLowerCase(),un=u.username.toLowerCase();
if(!mentionQuery||un.indexOf(mentionQuery)!==-1||n.indexOf(mentionQuery)!==-1)l.push(u);
});
}else{
chats.forEach(function(c){
if(c.is_group)return;
if(c._other&&c._other.username&&!s[c._other.id]){
s[c._other.id]=1;
var n=(c._other.name||'').toLowerCase(),u2=c._other.username.toLowerCase();
if(!mentionQuery||u2.indexOf(mentionQuery)!==-1||n.indexOf(mentionQuery)!==-1)l.push(c._other);
}
});
}
mentionMatches=l;
renderMentions(l);
}else hideMentions();
});
i.addEventListener('blur',function(){setTimeout(hideMentions,200);});
}
function renderMentions(l){
var m=$('mention-menu');if(!m)return;
if(!l.length){hideMentions();return;}
var h='';
l.slice(0,8).forEach(function(u){
h+='<div class="mention-item" onmousedown="event.preventDefault();insMent(\''+escJs(u.id)+'\')">'+avH(u,40)+'<div class="mention-item-info"><div class="mention-item-name">'+esc(u.name||'')+'</div><div class="mention-item-user">@'+esc(u.username||'')+'</div></div></div>';
});
m.innerHTML=h;
m.classList.add('act');
}
function hideMentions(){var m=$('mention-menu');if(m)m.classList.remove('act');mentionStartIdx=-1;mentionQuery='';}
function insMent(uid){
var u=null;
for(var i=0;i<mentionMatches.length;i++)if(mentionMatches[i].id===uid){u=mentionMatches[i];break;}
if(!u||!u.username)return;
var inp=$('msg-input'),v=inp.value,b=v.substring(0,mentionStartIdx),a=v.substring(inp.selectionStart),nv=b+'@'+u.username+' '+a;
inp.value=nv;
var nc=(b+'@'+u.username+' ').length;
inp.focus();
try{inp.setSelectionRange(nc,nc);}catch(e){}
autoRz(inp);updSendIcon(nv);
var cb=$('clear-btn');if(cb)cb.style.display='flex';
hideMentions();
}
function mClick(un,ev){
if(ev)ev.stopPropagation();
if(!un)return;
for(var i=0;i<chats.length;i++){
var c=chats[i];
if(c._other&&c._other.username===un){showProfCard(c._other.id);return;}
}
dbS('profiles','username=eq.'+encodeURIComponent(un)+'&select=id').then(function(a){if(a&&a.length)showProfCard(a[0].id);});
}

/* ============ Emoji / GIF / Sticker ============ */
var EMO={'وجوه':['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥺','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩','🤡'],'إيماءات':['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','👂','👃','🧠','👀','👁','👅','👄','💋'],'قلوب':['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌'],'حيوانات':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐺','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🐙','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐘','🐫','🦒','🐎','🐕','🐈','🦜','🕊','🐇','🦔'],'طعام':['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🥭','🍍','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🧄','🧅','🥔','🍞','🥐','🥖','🧀','🥚','🍳','🥞','🥓','🍔','🍟','🍕','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🍤','🍙','🍚','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','☕','🍵','🥤','🍺','🍻','🍷','🍸','🍹'],'أنشطة':['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🏏','⛳','🏹','🎣','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🎿','🏂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎗','🎫','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🎯','🎳','🎮','🎰','🧩'],'سفر':['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛴','🚲','🛵','🏍','🛺','🚨','🚡','🚃','🚄','🚅','🚂','🚆','🚇','🚊','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','⛴','🚢','⚓','🗺','🗿','🗽','🗼','🏰','🏯','🏟','🎡','🎢','🎠','⛲','🏖','🏝','🌋','🏔','🗻','🏕','⛺','🏠','🏡','🏘','🏢','🏬','🏥','🏦','🏨','🏪','🏫','💒','🏛','⛪','🕌','🕍','🛕','🕋','⛩','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁'],'رموز':['💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','🚻','🚮','📶','🆖','🆗','🆙','🆒','🆕','🆓','▶️','⏸','⏯','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛']};
function buildEmoji(){
var b=$('emoji-tabs');if(!b)return;
b.innerHTML='';
var keys=Object.keys(EMO);
var ic={'وجوه':'😀','إيماءات':'👋','قلوب':'❤️','حيوانات':'🐶','طعام':'🍎','أنشطة':'⚽','سفر':'✈️','رموز':'⭐'};
keys.forEach(function(k,i){
var btn=document.createElement('button');
btn.className='ep-bt-btn'+(i===0?' act':'');
btn.innerHTML='<span style="font-size:20px">'+(ic[k]||'📁')+'</span>';
btn.onclick=function(){
document.querySelectorAll('.ep-bt-btn').forEach(function(t){t.classList.remove('act');});
btn.classList.add('act');
currentEmojiCat=k;
showEmoji(k);
};
b.appendChild(btn);
});
currentEmojiCat=keys[0];
showEmoji(keys[0]);
}
function showEmoji(k){
var g=$('emoji-grid');if(!g)return;
g.style.display='grid';
g.style.gridTemplateColumns='repeat(8,1fr)';
g.style.padding='0 12px 12px';
g.innerHTML='';
var ec=$('emoji-cat');if(ec)ec.textContent=k;
(EMO[k]||[]).forEach(function(e){
var b=document.createElement('button');
b.className='ep-i';b.textContent=e;
b.onclick=function(){insEmoji(e);};
g.appendChild(b);
});
g.scrollTop=0;
}
function switchEmojiTab(t){
var pe=$('pill-emoji'),pg=$('pill-gif'),ps=$('pill-sticker');
if(pe)pe.classList.toggle('act',t==='emoji');
if(pg)pg.classList.toggle('act',t==='gif');
if(ps)ps.classList.toggle('act',t==='sticker');
var g=$('emoji-grid'),l=$('emoji-cat'),b=$('emoji-tabs');
if(t==='gif'){
if(b)b.style.display='none';
if(l)l.style.display='none';
if(g){g.style.display='block';g.style.gridTemplateColumns='';g.style.padding='0';g.innerHTML='<div class="gif-search-bar"><input type="text" id="gif-si" placeholder="ابحث GIF..."></div><div class="gif-grid" id="gif-gc"><div class="gif-loading">جاري...</div></div>';}
loadGIF('');
}else if(t==='sticker'){
if(b)b.style.display='none';
if(l)l.style.display='none';
if(g){g.style.display='grid';g.style.gridTemplateColumns='repeat(3,1fr)';g.style.padding='0';g.innerHTML='<div style="grid-column:1/-1;padding:8px 12px;font-size:12px;font-weight:800;color:var(--t3)">😂 وجوه</div>'+[['😂','#FF6B9D,#A855F7'],['😍','#F43F5E,#EC4899'],['😎','#0EA5E9,#06B6D4'],['🥳','#F59E0B,#F43F5E'],['😭','#3B82F6,#8B5CF6'],['🤔','#8B5CF6,#6D28D9'],['😡','#DC2626,#F59E0B'],['❤️','#EC4899,#F43F5E'],['👍','#22C55E,#16A34A'],['🙏','#FBBF24,#F59E0B']].map(function(s){return'<div class="sticker-item" style="background:linear-gradient(135deg,'+escAttr(s[1])+')" onclick="sendStk(\''+escJs(s[0])+'\',\'linear-gradient(135deg,'+escJs(s[1])+')\')">'+s[0]+'</div>';}).join('');}
}else{
if(b)b.style.display='flex';
if(l)l.style.display='';
showEmoji(currentEmojiCat);
}
}
function bspEmoji(){
var i=$('msg-input');if(!i)return;
if(i.value.length>0){
i.value=i.value.slice(0,-1);
autoRz(i);updSendIcon(i.value);
var cb=$('clear-btn');if(cb)cb.style.display=i.value.length>0?'flex':'none';
}
i.focus();
}
function insEmoji(e){
var i=$('msg-input');if(!i)return;
i.value+=e;i.focus();
autoRz(i);updSendIcon(i.value);
var cb=$('clear-btn');if(cb)cb.style.display='flex';
}
function toggleEmoji(){var ep=$('emoji-picker');if(ep)ep.classList.toggle('act');}
function closeEmoji(){var ep=$('emoji-picker');if(ep)ep.classList.remove('act');}
function loadGIF(q){
var c=$('gif-gc');if(!c)return;
var k=q||'trending';
if(gifCache[k]){rGIF(gifCache[k]);return;}
var url=q?'https://api.giphy.com/v1/gifs/search?api_key='+GIPHY+'&q='+encodeURIComponent(q)+'&limit=24':'https://api.giphy.com/v1/gifs/trending?api_key='+GIPHY+'&limit=24';
fetch(url).then(function(r){return r.json();}).then(function(d){
if(!d||!d.data)throw 0;
gifCache[k]=d.data;rGIF(d.data);
}).catch(function(){c.innerHTML='<div class="gif-loading">⚠️ تعذر التحميل</div>';});
var inp=$('gif-si');
if(inp&&!inp._b){
inp._b=true;
var deb;
inp.addEventListener('input',function(){
clearTimeout(deb);
var v=this.value.trim();
deb=setTimeout(function(){loadGIF(v);},450);
});
}
}
function rGIF(gs){
var c=$('gif-gc');if(!c)return;
if(!gs.length){c.innerHTML='<div class="gif-loading">لا نتائج</div>';return;}
c.innerHTML=gs.map(function(g){
var u=(g.images&&g.images.fixed_height&&g.images.fixed_height.url)||(g.images&&g.images.original&&g.images.original.url);
return u?'<div class="gif-item" onclick="sendGIF(\''+escJs(u)+'\')"><img src="'+escAttr(u)+'" loading="lazy"></div>':'';
}).join('');
}
function sendGIF(url){
if(!currentChat)return;
if(isBlockedByMe){toast('لا يمكن');return;}
if(!canISend()){toast('لا تملك صلاحية');return;}
dbI('messages',{chat_id:currentChat.id,sender_id:currentUser.id,type:'image',media_url:url,media_type:'image/gif',text:'',created_at:new Date().toISOString()}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
lastMessageTime=m.created_at;
dbP('chats','id=eq.'+currentChat.id,{last_message:'🎬 GIF',last_message_at:m.created_at});
var body=$('chat-body'),e=body.querySelector('.cempty');if(e)e.remove();
if(!renderedMsgIds[m.id]){renderedMsgIds[m.id]=true;body.insertAdjacentHTML('beforeend',renderMsg(m));body.scrollTop=body.scrollHeight;}
closeEmoji();
});
}
function sendStk(e,bg){
if(!currentChat)return;
if(isBlockedByMe){toast('لا يمكن');return;}
if(!canISend()){toast('لا تملك صلاحية');return;}
dbI('messages',{chat_id:currentChat.id,sender_id:currentUser.id,type:'sticker',text:e,meta:{bg:bg},created_at:new Date().toISOString()}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
lastMessageTime=m.created_at;
dbP('chats','id=eq.'+currentChat.id,{last_message:'🎨 ملصق',last_message_at:m.created_at});
var body=$('chat-body'),e2=body.querySelector('.cempty');if(e2)e2.remove();
if(!renderedMsgIds[m.id]){renderedMsgIds[m.id]=true;body.insertAdjacentHTML('beforeend',renderMsg(m));body.scrollTop=body.scrollHeight;}
closeEmoji();
});
}

/* ============ Voice PTT ============ */
function pickVoiceMime(){
if(typeof MediaRecorder==='undefined')return'';
var c=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
for(var i=0;i<c.length;i++){
try{if(MediaRecorder.isTypeSupported(c[i]))return c[i];}catch(e){}
}
return'';
}
function resetVoice(){
isRecording=false;pttActive=false;pttLocked=false;pttCancelled=false;lockedRecordingActive=false;lockedPaused=false;voiceElapsed=0;
try{$('send-btn').classList.remove('rec');}catch(e){}
try{$('send-icon').innerHTML='<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>';}catch(e){}
try{$('rec-ov').classList.remove('act','locked');}catch(e){}
try{$('lk-bar').classList.remove('act');$('main-composer').style.display='';}catch(e){}
stopPTT();stopLockedT();
if(voiceStream){try{voiceStream.getTracks().forEach(function(t){t.stop();});}catch(e){}voiceStream=null;}
voiceRec=null;voiceChunks=[];
}
function beginVoice(){
return new Promise(function(res,rej){
if(!currentChat){rej(new Error('افتح محادثة'));return;}
if(!canISend()){rej(new Error('لا تملك صلاحية'));return;}
if(isBlockedByMe){rej(new Error('محظور'));return;}
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){rej(new Error('لا يدعم'));return;}
if(!isSecureCtx()){rej(new Error('HTTPS مطلوب'));return;}
if(isRecording){rej(new Error('قيد التسجيل'));return;}
navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}}).then(function(st){
voiceStream=st;
voiceMime=pickVoiceMime();
var o=voiceMime?{mimeType:voiceMime}:{};
try{voiceRec=new MediaRecorder(st,o);}catch(e){try{voiceRec=new MediaRecorder(st);}catch(e2){st.getTracks().forEach(function(t){t.stop();});rej(new Error('فشل'));return;}}
voiceChunks=[];
voiceRec.ondataavailable=function(e){if(e.data.size>0)voiceChunks.push(e.data);};
voiceRec.onstop=function(){var c=pttCancelled===true;finishVoice(c);};
voiceRec.onerror=function(){toast('خطأ');resetVoice();};
try{voiceRec.start(100);}catch(e){st.getTracks().forEach(function(t){t.stop();});rej(new Error('فشل'));return;}
isRecording=true;voiceStartTime=Date.now();voiceElapsed=0;
$('send-btn').classList.add('rec');
$('send-icon').innerHTML='<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>';
res();
}).catch(function(e){rej(e);});
});
}
function finishVoice(cancel){
var st=voiceStream;voiceStream=null;isRecording=false;
try{$('send-btn').classList.remove('rec');}catch(e){}
try{$('send-icon').innerHTML='<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>';}catch(e){}
if(st){try{st.getTracks().forEach(function(t){t.stop();});}catch(e){}}
if(cancel){voiceChunks=[];pttCancelled=false;voiceRec=null;return;}
if(!voiceChunks.length){voiceRec=null;return;}
var bt=(voiceMime||'audio/webm').split(';')[0];
var blob=new Blob(voiceChunks,{type:bt});
voiceChunks=[];voiceRec=null;
var dur=Math.max(1,Math.round(voiceElapsed||((Date.now()-voiceStartTime)/1000)));
var ext='webm';
if(bt.indexOf('mp4')!==-1)ext='m4a';
else if(bt.indexOf('ogg')!==-1)ext='ogg';
var fn=currentUser.id+'/'+Date.now()+'.'+ext;
toast('جاري الرفع...');
stUp('voice-messages',fn,blob).then(function(){
return dbI('messages',{chat_id:currentChat.id,sender_id:currentUser.id,type:'audio',audio_url:stPub('voice-messages',fn),duration:dur,created_at:new Date().toISOString()});
}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
lastMessageTime=m.created_at;
return dbP('chats','id=eq.'+currentChat.id,{last_message:'🎤 رسالة صوتية',last_message_at:m.created_at}).then(function(){
var body=$('chat-body'),e=body.querySelector('.cempty');if(e)e.remove();
if(!renderedMsgIds[m.id]){renderedMsgIds[m.id]=true;body.insertAdjacentHTML('beforeend',renderMsg(m));body.scrollTop=body.scrollHeight;}
toast('✓');
});
}).catch(function(){toast('فشل الرفع');});
}
function setupPTT(){
var btn=$('send-btn');if(!btn)return;
var sY=0,holding=false,pid=null,wd=null;
function getY(e){
if(e.touches&&e.touches[0])return e.touches[0].clientY;
if(e.changedTouches&&e.changedTouches[0])return e.changedTouches[0].clientY;
return e.clientY||0;
}
function begin(e){
if(holding||lockedRecordingActive||isRecording)return;
var inp=$('msg-input');
if(inp&&inp.value.trim())return;
if(!currentChat)return;
if(!canISend()){toast('لا تملك صلاحية');return;}
if(e.cancelable)e.preventDefault();
holding=true;pttActive=true;pttLocked=false;pttCancelled=false;
pid=(e.pointerId!==undefined)?e.pointerId:null;
sY=getY(e);
if(pid!==null&&btn.setPointerCapture){try{btn.setPointerCapture(pid);}catch(err){}}
$('rec-ov').classList.add('act');
$('rec-ov').classList.remove('locked');
$('rec-h').textContent='اسحب للأعلى للقفل';
$('rec-t').textContent='0:00';
if(navigator.vibrate)try{navigator.vibrate(15);}catch(err){}
if(wd)clearTimeout(wd);
wd=setTimeout(function(){if(holding)end({cancelable:false,preventDefault:function(){}});},5*60*1000);
beginVoice().then(function(){
if(!holding||pttCancelled){if(voiceRec&&isRecording){try{voiceRec.stop();}catch(err){}}return;}
if(pttTimer)clearInterval(pttTimer);
pttTimer=setInterval(function(){
if(!isRecording||!voiceStartTime)return;
var s=Math.floor((Date.now()-voiceStartTime)/1000);
voiceElapsed=s;
var el=$('rec-t');
if(el)el.textContent=Math.floor(s/60)+':'+(s%60).toString().padStart(2,'0');
},200);
}).catch(function(){
holding=false;pttActive=false;pid=null;
if(wd){clearTimeout(wd);wd=null;}
$('rec-ov').classList.remove('act');
toast('لا يمكن التسجيل — تحقق من الميكروفون');
});
}
function move(e){
if(!holding||pttLocked)return;
if(pid!==null&&e.pointerId!==undefined&&e.pointerId!==pid)return;
if(e.cancelable)e.preventDefault();
var dy=sY-getY(e);
if(dy>80){pttLocked=true;$('rec-ov').classList.add('locked');$('rec-h').textContent='افلت للقفل';if(navigator.vibrate)try{navigator.vibrate(30);}catch(err){}}
else if(dy<-30){pttCancelled=true;$('rec-h').textContent='افلت للإلغاء';}
else{pttCancelled=false;$('rec-h').textContent='اسحب للأعلى للقفل';}
}
function end(e){
if(!holding)return;
if(pid!==null&&e.pointerId!==undefined&&e.pointerId!==pid)return;
if(e&&e.cancelable)e.preventDefault();
var el=voiceStartTime?(Date.now()-voiceStartTime):0;
var wasLock=pttLocked,wasCancel=pttCancelled,hasRec=isRecording&&voiceRec;
holding=false;pttActive=false;pid=null;
if(wd){clearTimeout(wd);wd=null;}
if(pttTimer){clearInterval(pttTimer);pttTimer=null;}
if(btn.releasePointerCapture&&e.pointerId!==undefined){try{btn.releasePointerCapture(e.pointerId);}catch(err){}}
if(wasLock){$('rec-ov').classList.remove('act','locked');pttLocked=false;showLockedBar();return;}
$('rec-ov').classList.remove('act');
$('rec-h').textContent='اسحب للأعلى للقفل';
if(wasCancel){pttCancelled=true;if(hasRec){try{voiceRec.stop();}catch(err){resetVoice();}}else resetVoice();toast('تم الإلغاء');return;}
if(!hasRec){resetVoice();toast('جاري التهيئة...');return;}
if(el<800){pttCancelled=true;try{voiceRec.stop();}catch(err){resetVoice();}toast('اضغط مطولاً أكثر');return;}
try{voiceRec.stop();}catch(err){resetVoice();toast('فشل');}
}
if(window.PointerEvent){
btn.addEventListener('pointerdown',begin,{passive:false});
btn.addEventListener('pointermove',move,{passive:false});
btn.addEventListener('pointerup',end,{passive:false});
btn.addEventListener('pointercancel',end,{passive:false});
}else if('ontouchstart'in window){
btn.addEventListener('touchstart',begin,{passive:false});
document.addEventListener('touchmove',move,{passive:false});
document.addEventListener('touchend',end,{passive:false});
}else{
btn.addEventListener('mousedown',begin);
document.addEventListener('mousemove',move);
document.addEventListener('mouseup',end);
}
btn.addEventListener('contextmenu',function(e){e.preventDefault();return false;});
}
function stopPTT(){if(pttTimer){clearInterval(pttTimer);pttTimer=null;}var el=$('rec-t');if(el)el.textContent='0:00';}
function showLockedBar(){
lockedRecordingActive=true;lockedPaused=false;
$('lk-bar').classList.add('act');
$('main-composer').style.display='none';
startLockedT();
try{$('lk-pause-icon').innerHTML='<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';$('lk-pause-btn').classList.remove('act');}catch(e){}
}
function hideLockedBar(){
lockedRecordingActive=false;lockedPaused=false;
try{$('lk-bar').classList.remove('act');$('main-composer').style.display='';}catch(e){}
stopLockedT();
}
function startLockedT(){
stopLockedT();
lockedTimerInt=setInterval(function(){
if(!lockedRecordingActive||lockedPaused)return;
var el=Math.floor((Date.now()-voiceStartTime)/1000);voiceElapsed=el;
var e=$('lk-t');if(e)e.textContent=Math.floor(el/60)+':'+(el%60).toString().padStart(2,'0');
},200);
}
function stopLockedT(){if(lockedTimerInt){clearInterval(lockedTimerInt);lockedTimerInt=null;}var e=$('lk-t');if(e)e.textContent='0:00';}
function cancelLocked(){
if(!lockedRecordingActive)return;
pttCancelled=true;hideLockedBar();
if(voiceRec&&isRecording){try{voiceRec.stop();}catch(e){}}else{pttCancelled=false;resetVoice();}
toast('تم الإلغاء');
}
function toggleLockedPause(){
if(!voiceRec||!lockedRecordingActive)return;
if(lockedPaused){
try{voiceRec.resume();}catch(e){}
lockedPaused=false;voiceStartTime=Date.now()-(voiceElapsed*1000);
try{$('lk-pause-icon').innerHTML='<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';$('lk-pause-btn').classList.remove('act');}catch(e){}
toast('استئناف');
}else{
try{voiceRec.pause();}catch(e){}
voiceElapsed=Math.floor((Date.now()-voiceStartTime)/1000);lockedPaused=true;
try{$('lk-pause-icon').innerHTML='<path d="M8 5v14l11-7z"/>';$('lk-pause-btn').classList.add('act');}catch(e){}
toast('إيقاف مؤقت');
}
}
function sendLocked(){
if(!lockedRecordingActive)return;
if(lockedPaused){try{voiceRec.resume();}catch(e){}lockedPaused=false;}
voiceElapsed=Math.floor((Date.now()-voiceStartTime)/1000);
hideLockedBar();
if(voiceRec&&isRecording){try{voiceRec.stop();}catch(e){}}else resetVoice();
}

/* ============ Groups ============ */
function loadGrpMembers(cid){
return dbS('chat_members','chat_id=eq.'+cid+'&select=user_id,role,joined_at,can_send,can_edit_group').then(function(mem){
if(!mem||!mem.length){currentGroupMembers=[];myGroupRole=null;return[];}
var ids=mem.map(function(m){return'id.eq.'+m.user_id;}).join(',');
return dbS('profiles','or=('+ids+')&select=id,name,phone,avatar_url,username').then(function(ps){
var pm={};(ps||[]).forEach(function(p){pm[p.id]=p;});
currentGroupMembers=mem.map(function(m){return Object.assign({},m,{profile:pm[m.user_id]});});
var me=mem.find(function(m){return m.user_id===currentUser.id;});
myGroupRole=me?me.role:null;
return currentGroupMembers;
});
}).catch(function(){currentGroupMembers=[];myGroupRole=null;return[];});
}
function amIOwner(){return myGroupRole==='owner';}
function amIAdmin(){return myGroupRole==='admin'||myGroupRole==='owner';}
function isMe(uid){return uid===currentUser.id;}
function getMember(uid){for(var i=0;i<currentGroupMembers.length;i++)if(currentGroupMembers[i].user_id===uid)return currentGroupMembers[i];return null;}
function canIKick(t){if(!t||isMe(t.user_id))return false;if(myGroupRole==='owner')return t.role!=='owner';if(myGroupRole==='admin')return t.role==='member';return false;}
function canIPromote(t){if(!amIOwner()||!t||isMe(t.user_id))return false;return t.role==='member';}
function canIDemote(t){if(!amIOwner()||!t||isMe(t.user_id))return false;return t.role==='admin';}
function canIPencil(t){if(!amIAdmin()||!t||isMe(t.user_id))return false;return t.role==='member';}
function canIEditGrp(){if(!currentChat||!currentChat.is_group)return false;if(amIOwner())return true;if(myGroupRole==='admin'){var m=getMember(currentUser.id);return m&&m.can_edit_group===true;}return false;}
function canIAddMem(){return amIAdmin();}
function canISend(){
if(!currentChat||!currentChat.is_group)return true;
if(amIAdmin())return true;
if(currentChat.only_admins_can_send)return false;
var me=getMember(currentUser.id);
return me?(me.can_send!==false):true;
}
function openGroupInfo(){
if(!currentChat||!currentChat.is_group)return;
openSheet('group-info');
var g=currentChat;
var av=$('gi-avatar');av.classList.remove('avp');
if(g.group_avatar_url){av.style.background='';av.style.backgroundImage='url('+g.group_avatar_url+')';av.style.backgroundSize='cover';av.innerHTML='';}
else{av.style.background='linear-gradient(135deg,#22C55E,#06B6D4)';av.style.backgroundImage='none';av.innerHTML=GSVG.replace('<svg','<svg style="width:52px;height:52px"');}
$('gi-name-input').value=g.group_name||'';
loadGrpMembers(g.id).then(function(){$('gi-count').textContent=currentGroupMembers.length+' عضو';renderGrpMembers();});
}
function renderGrpMembers(){
var c=$('gi-members-list');if(!c)return;
var lock=!!currentChat.only_admins_can_send;
var sorted=currentGroupMembers.slice().sort(function(a,b){var o={owner:0,admin:1,member:2};return(o[a.role]||9)-(o[b.role]||9);});
var h='';
sorted.forEach(function(m){
var p=m.profile||{},isM=isMe(m.user_id),rB='';
if(m.role==='owner')rB='<span class="role-badge owner">👑 المالك</span>';
else if(m.role==='admin')rB='<span class="role-badge admin">⭐ مشرف</span>';
else{var st=lock?'off':(m.can_send!==false?'on':'off');rB='<span class="role-badge '+(st==='on'?'admin':'member')+'" style="font-size:9.5px">'+(st==='on'?'✏️ كاتب':'🔒 قارئ')+'</span>';}
var pBtn='';
if(m.role!=='admin'&&m.role!=='owner'){
var vc=lock?'off':(m.can_send!==false?'on':'off');
var cl=amIAdmin()?'onclick="tglMemSend(\''+escJs(m.user_id)+'\')"':'style="pointer-events:none"';
var ic=(m.can_send!==false)?'<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>':'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
pBtn='<button class="pencil-btn '+vc+'" '+cl+'><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">'+ic+'</svg></button>';
}
h+='<div class="ci member-tap" onclick="openMemActions(\''+escJs(m.user_id)+'\')" style="padding:10px 12px;margin-bottom:6px">'+avH(p,46)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(p.name||'')+(isM?' (أنت)':'')+rB+'</span></div><div class="ci-m">'+esc(p.username?'@'+p.username:'')+'</div></div>'+pBtn+'</div>';
});
c.innerHTML=h;
var cnt=$('gi-members-count');if(cnt)cnt.textContent=currentGroupMembers.length;
var rAd=$('row-only-admins'),t=$('only-admins-toggle');
if(amIAdmin()&&rAd){rAd.style.display='flex';if(t)t.classList.toggle('on',lock);}
else if(rAd){rAd.style.display='none';}
var ab=$('gi-add-btn');if(ab)ab.style.display=canIAddMem()?'block':'none';
var db=$('gi-delete-btn');if(db)db.style.display=amIOwner()?'block':'none';
var tb=$('gi-transfer-btn');if(tb){var ho=currentGroupMembers.some(function(m){return m.user_id!==currentUser.id;});tb.style.display=(amIOwner()&&ho)?'block':'none';}
var lb=$('gi-leave-btn');if(lb)lb.style.display=amIOwner()?'none':'block';
var ni=$('gi-name-input'),sb=$('gi-save-btn');
var ed=canIEditGrp();
if(ni){ni.readOnly=!ed;ni.style.opacity=ed?'1':'.6';}
if(sb)sb.style.display=ed?'block':'none';
}
function toggleOnlyAdmins(){
if(!amIAdmin()||!currentChat||!currentChat.is_group){toast('مشرف فقط');return;}
var nv=!currentChat.only_admins_can_send;
dbP('chats','id=eq.'+currentChat.id,{only_admins_can_send:nv}).then(function(){
currentChat.only_admins_can_send=nv;
renderGrpMembers();updComposerPerm();
toast(nv?'🔒 المشرفون فقط':'✅ الكتابة متاحة للجميع');
}).catch(function(e){toast(e.message);});
}
function tglMemSend(uid){
if(!amIAdmin()||!currentChat)return;
var m=getMember(uid);if(!m||m.role!=='member')return;
var nv=!(m.can_send!==false);
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+uid,{can_send:nv}).then(function(){
m.can_send=nv;renderGrpMembers();
var nm=(m.profile&&m.profile.name)||'العضو';
toast(nv?'✏️ '+nm+' يكتب':'🚫 '+nm+' لا يكتب');
});
}
function updComposerPerm(){
if(!currentChat||!currentChat.is_group){var b1=$('read-only-banner');if(b1)b1.classList.remove('act');var c1=$('main-composer');if(c1)c1.style.display='';return;}
var cs=canISend();
var bn=$('read-only-banner'),cm=$('main-composer');
if(cs){if(bn)bn.classList.remove('act');if(cm)cm.style.display='';}
else{if(bn){var tx=$('read-only-text');if(currentChat.only_admins_can_send)tx.textContent='🔒 المشرفون فقط يمكنهم الكتابة';else tx.textContent='🚫 لا يمكنك الكتابة في هذه المجموعة';bn.classList.add('act');}if(cm)cm.style.display='none';}
}
function openNewGroup(){
newGroupSelected=[];newGroupAvatarFile=null;newGroupAvatarUrl=null;
var s=$('grp-step1-search');if(s)s.value='';
renderGrpStep1List('');updGrpStep1Count();
openSheet('grp-step1');
setTimeout(function(){if(s)s.focus();},300);
}
function renderGrpStep1List(q){
var c=$('grp-step1-list');if(!c)return;
q=(q||'').toLowerCase();
var h='',seen={};
chats.forEach(function(ch){
if(ch.is_group)return;
var o=ch._other;
if(!o||seen[o.id])return;
seen[o.id]=1;
var name=(o.name||'').toLowerCase(),uname=(o.username||'').toLowerCase();
if(q&&name.indexOf(q)===-1&&uname.indexOf(q)===-1)return;
var isSelected=newGroupSelected.indexOf(o.id)!==-1;
h+='<label class="ci" style="cursor:pointer;'+(isSelected?'background:rgba(168,85,247,.15);':'')+'">'+avH(o,46)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(o.name||'')+'</span></div><div class="ci-m">'+esc(o.username?'@'+o.username:(o.phone||''))+'</div></div><input type="checkbox" '+(isSelected?'checked':'')+' onchange="tglGrpStep1(\''+escJs(o.id)+'\',this.checked)" style="width:24px;height:24px;accent-color:#A855F7"></label>';
});
c.innerHTML=h||'<div style="text-align:center;padding:30px;color:var(--t3);font-size:13px">لا نتائج</div>';
}
function tglGrpStep1(uid,ck){
var i=newGroupSelected.indexOf(uid);
if(ck&&i===-1)newGroupSelected.push(uid);
else if(!ck&&i!==-1)newGroupSelected.splice(i,1);
renderGrpStep1List($('grp-step1-search').value);
updGrpStep1Count();
}
function updGrpStep1Count(){
var n=newGroupSelected.length;
var btn=$('grp-step1-next');var cnt=$('grp-step1-count');
if(cnt)cnt.textContent=n>0?'('+n+')':'';
if(btn)btn.disabled=n===0;
if(btn)btn.style.opacity=n===0?'.5':'1';
}
function goToGrpStep2(){
if(newGroupSelected.length<1){toast('اختر عضواً واحداً على الأقل');return;}
closeSheet();
var nameInp=$('grp-step2-name');if(nameInp)nameInp.value='';
var cnt=$('grp-step2-count');if(cnt)cnt.textContent=newGroupSelected.length;
var av=$('grp-step2-avatar');
if(av){av.style.background='linear-gradient(135deg,#22C55E,#06B6D4)';av.style.backgroundImage='';av.innerHTML='📷';}
setTimeout(function(){openSheet('grp-step2');if(nameInp)nameInp.focus();},200);
}
function backToGrpStep1(){
closeSheet();
setTimeout(function(){renderGrpStep1List($('grp-step1-search').value);openSheet('grp-step1');},200);
}
function handleGrpStep2Avatar(f){
if(!f)return;
if(f.size>5*1024*1024){toast('كبيرة (5MB)');return;}
if(f.type.indexOf('image/')!==0){toast('ليس صورة');return;}
newGroupAvatarFile=f;
newGroupAvatarUrl=URL.createObjectURL(f);
var av=$('grp-step2-avatar');
if(av){av.style.background='';av.style.backgroundImage='url('+newGroupAvatarUrl+')';av.style.backgroundSize='cover';av.style.backgroundPosition='center';av.innerHTML='';}
toast('✓');
}
function createGroupFinal(){
var name=($('grp-step2-name').value||'').trim();
if(!name){toast('أدخل اسم المجموعة');return;}
if(name.length<2){toast('الاسم قصير');return;}
if(newGroupSelected.length<1){toast('اختر عضواً');return;}
toast('جاري الإنشاء...');
var payload={is_group:true,group_name:name,group_creator_id:currentUser.id,user1_id:currentUser.id,user2_id:currentUser.id,last_message:'أُنشئت المجموعة',last_message_at:new Date().toISOString()};
dbI('chats',payload).then(function(r){
var g=Array.isArray(r)?r[0]:r;
if(!g||!g.id)throw new Error('فشل');
var members=[{chat_id:g.id,user_id:currentUser.id,role:'owner'}];
newGroupSelected.forEach(function(uid){members.push({chat_id:g.id,user_id:uid,role:'member'});});
return dbI('chat_members',members).then(function(){
if(newGroupAvatarFile){
var ext=(newGroupAvatarFile.name.split('.').pop()||'jpg').toLowerCase();
var fn='groups/'+g.id+'.'+ext;
return stUp('media',fn,newGroupAvatarFile).then(function(){
var pu=stPub('media',fn)+'?t='+Date.now();
return dbP('chats','id=eq.'+g.id,{group_avatar_url:pu}).then(function(){return g;});
}).catch(function(){return g;});
}
return g;
});
}).then(function(g){
closeSheet();
toast('✓ تم إنشاء المجموعة');
newGroupSelected=[];newGroupAvatarFile=null;newGroupAvatarUrl=null;
loadChats().then(function(){setTimeout(function(){openChat(g.id);},400);});
}).catch(function(){toast('فشل');});
}
function openMemActions(uid){
var m=getMember(uid);if(!m)return;
memberActionsTarget=m;
var p=m.profile||{};
$('ma-name').textContent=p.name||'';
var rt=m.role==='owner'?'👑 صاحب المجموعة':(m.role==='admin'?'⭐ مشرف':'عضو عادي');
$('ma-role-info').textContent=rt;
var self=isMe(uid);
var pb=$('ma-pencil-btn');
if(!self&&canIPencil(m)){pb.style.display='block';$('ma-pencil-label').textContent=(m.can_send!==false)?'سحب القلم':'منح القلم';}else pb.style.display='none';
var eb=$('ma-edit-group-btn');
if(!self&&amIOwner()&&m.role==='admin'){eb.style.display='block';$('ma-edit-group-label').textContent=m.can_edit_group?'سحب صلاحية التعديل':'منح صلاحية التعديل';}else eb.style.display='none';
var pr=$('ma-promote-btn');if(!self&&canIPromote(m))pr.style.display='block';else pr.style.display='none';
var de=$('ma-demote-btn');if(!self&&canIDemote(m))de.style.display='block';else de.style.display='none';
var tb=$('ma-transfer-btn');if(!self&&amIOwner())tb.style.display='block';else tb.style.display='none';
var kb=$('ma-kick-btn');if(!self&&canIKick(m))kb.style.display='block';else kb.style.display='none';
openSheet('member-actions');
}
function maActionPencil(){
if(!memberActionsTarget)return;
var m=memberActionsTarget;
if(!canIPencil(m)){toast('لا');return;}
var nv=!(m.can_send!==false);
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+m.user_id,{can_send:nv}).then(function(){m.can_send=nv;closeSheet();renderGrpMembers();toast(nv?'✏️':'🚫');});
}
function maActionEditGroupPermission(){
if(!memberActionsTarget||!amIOwner())return;
var m=memberActionsTarget,nv=!m.can_edit_group;
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+m.user_id,{can_edit_group:nv}).then(function(){m.can_edit_group=nv;closeSheet();renderGrpMembers();toast(nv?'📝':'🚫');});
}
function maActionPromote(){
if(!memberActionsTarget||!canIPromote(memberActionsTarget))return;
var m=memberActionsTarget;
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+m.user_id,{role:'admin'}).then(function(){m.role='admin';closeSheet();renderGrpMembers();toast('⭐ تمت الترقية');});
}
function maActionDemote(){
if(!memberActionsTarget||!canIDemote(memberActionsTarget))return;
var m=memberActionsTarget;
if(!confirm('تنزيل إلى عضو عادي؟'))return;
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+m.user_id,{role:'member',can_edit_group:false}).then(function(){m.role='member';m.can_edit_group=false;closeSheet();renderGrpMembers();toast('⬇️ تم');});
}
function maActionTransfer(){
if(!memberActionsTarget)return;
var uid=memberActionsTarget.user_id;
closeSheet();
setTimeout(function(){confirmTransfer(uid);},300);
}
function maActionKick(){
if(!memberActionsTarget||!canIKick(memberActionsTarget))return;
var m=memberActionsTarget,nm=(m.profile&&m.profile.name)||'العضو';
if(!confirm('طرد '+nm+'؟'))return;
dbD('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+m.user_id).then(function(){closeSheet();openGroupInfo();toast('🚫 تم الطرد');});
}
function openAddMembers(){
if(!canIAddMem()){toast('مشرف فقط');return;}
addMembersSelected=[];
$('add-members-search').value='';
renderAddMemList('');
openSheet('add-members');
}
function renderAddMemList(q){
var c=$('add-members-list');if(!c)return;
q=(q||'').toLowerCase();
var ex={};currentGroupMembers.forEach(function(m){ex[m.user_id]=1;});
var h='',seen={};
chats.forEach(function(ch){
if(ch.is_group)return;
var o=ch._other;
if(!o||seen[o.id]||ex[o.id])return;
seen[o.id]=1;
if(q&&(o.name||'').toLowerCase().indexOf(q)===-1&&(o.username||'').toLowerCase().indexOf(q)===-1)return;
var ck=addMembersSelected.indexOf(o.id)!==-1?'checked':'';
h+='<label class="ci" style="cursor:pointer">'+avH(o,46)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(o.name||'')+'</span></div><div class="ci-m">'+esc(o.username?'@'+o.username:(o.phone||''))+'</div></div><input type="checkbox" '+ck+' onchange="tglAddMem(\''+escJs(o.id)+'\',this.checked)" style="width:22px;height:22px;accent-color:#A855F7"></label>';
});
c.innerHTML=h||'<div style="text-align:center;padding:20px;color:var(--t3);font-size:13px">لا يوجد</div>';
}
function filterAddMembers(){renderAddMemList($('add-members-search').value);}
function tglAddMem(uid,ck){
var i=addMembersSelected.indexOf(uid);
if(ck&&i===-1)addMembersSelected.push(uid);
else if(!ck&&i!==-1)addMembersSelected.splice(i,1);
}
function confirmAddMembers(){
if(!currentChat||!addMembersSelected.length){toast('اختر عضواً');return;}
var rows=addMembersSelected.map(function(uid){return{chat_id:currentChat.id,user_id:uid,role:'member'};});
dbI('chat_members',rows).then(function(){closeSheet();toast('✓ تمت الإضافة');openGroupInfo();}).catch(function(e){toast(e.message);});
}
function leaveGroup(){
if(!currentChat||!currentChat.is_group)return;
if(amIOwner()){toast('لا يمكنك المغادرة — انقل الملكية');return;}
if(!confirm('مغادرة المجموعة؟'))return;
dbD('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+currentUser.id).then(function(){closeSheet();toast('تمت المغادرة');stopGroupInfoPoll();go('chats');});
}
function deleteGroup(){
if(!currentChat||!currentChat.is_group)return;
if(!amIOwner()){toast('صاحب المجموعة فقط');return;}
if(!confirm('حذف المجموعة نهائياً؟'))return;
dbD('chats','id=eq.'+currentChat.id).then(function(){closeSheet();toast('تم الحذف');stopGroupInfoPoll();go('chats');}).catch(function(e){toast(e.message);});
}
function menuGroupInfo(){closeChatMenu();openGroupInfo();}
function pickGrpAv(){$('file-group-avatar').click();}
function handleGrpAvSel(f){
if(!f||!currentChat||!currentChat.is_group)return;
if(!canIEditGrp()){toast('لا تملك صلاحية');return;}
if(f.size>5*1024*1024){toast('كبيرة');return;}
toast('جاري الرفع...');
var ext=f.name.split('.').pop()||'jpg',fn='groups/'+currentChat.id+'.'+ext;
stUp('media',fn,f).then(function(){
var pu=stPub('media',fn)+'?t='+Date.now();
return dbP('chats','id=eq.'+currentChat.id,{group_avatar_url:pu}).then(function(){
currentChat.group_avatar_url=pu;openGroupInfo();loadChats();toast('✓');
});
});
}
function saveGroupProfile(){
if(!currentChat||!currentChat.is_group)return;
if(!canIEditGrp()){toast('لا تملك صلاحية');return;}
var nn=($('gi-name-input').value||'').trim();
if(!nn){toast('أدخل اسماً');return;}
if(nn.length>40){toast('طويل جداً');return;}
dbP('chats','id=eq.'+currentChat.id,{group_name:nn}).then(function(){currentChat.group_name=nn;loadChats();toast('✓');});
}
function openTransferOwnership(){
if(!currentChat||!currentChat.is_group)return;
if(!amIOwner()){toast('صاحب المجموعة فقط');return;}
var cand=currentGroupMembers.filter(function(m){return m.user_id!==currentUser.id;});
if(!cand.length){toast('لا يوجد أعضاء آخرون');return;}
$('transfer-search').value='';
renderTransferList('');
openSheet('transfer-owner');
setTimeout(function(){$('transfer-search').focus();},250);
}
function renderTransferList(q){
var c=$('transfer-members-list');if(!c)return;
q=(q||'').toLowerCase();
var h='';
var sorted=currentGroupMembers.slice().sort(function(a,b){var o={owner:0,admin:1,member:2};return(o[a.role]||9)-(o[b.role]||9);});
sorted.forEach(function(m){
if(m.user_id===currentUser.id)return;
var p=m.profile||{};
var nl=(p.name||'').toLowerCase(),ul=(p.username||'').toLowerCase();
if(q&&nl.indexOf(q)===-1&&ul.indexOf(q)===-1)return;
var rl=m.role==='admin'?'<span class="role-badge admin">⭐ مشرف</span>':'<span class="role-badge member">عضو</span>';
var note=(m.role==='admin')?'سيصبح صاحب المجموعة':'سيُرفع لصاحب المجموعة';
h+='<div class="ci member-tap" onclick="confirmTransfer(\''+escJs(m.user_id)+'\')" style="padding:12px;margin-bottom:6px">'+avH(p,46)+'<div class="ci-i"><div class="ci-tp"><span class="ci-n">'+esc(p.name||'')+rl+'</span></div><div class="ci-m">'+note+'</div></div></div>';
});
c.innerHTML=h||'<div style="text-align:center;padding:24px;color:var(--t3);font-size:13px">لا نتائج</div>';
}
function filterTransferList(){renderTransferList($('transfer-search').value);}
function confirmTransfer(newOwnerId){
if(!amIOwner()){toast('صاحب المجموعة فقط');return;}
if(!newOwnerId||newOwnerId===currentUser.id){toast('لا');return;}
var t=getMember(newOwnerId);if(!t){toast('غير موجود');return;}
var nm=(t.profile&&t.profile.name)||'هذا العضو';
if(!confirm('نقل الملكية إلى '+nm+'؟'))return;
if(!confirm('تأكيد أخير؟'))return;
toast('جاري النقل...');
Promise.all([
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+currentUser.id,{role:'admin'}),
dbP('chat_members','chat_id=eq.'+currentChat.id+'&user_id=eq.'+newOwnerId,{role:'owner',can_edit_group:true})
]).then(function(){return dbP('chats','id=eq.'+currentChat.id,{group_creator_id:newOwnerId});}).then(function(){
currentChat.group_creator_id=newOwnerId;
for(var i=0;i<currentGroupMembers.length;i++){
var m=currentGroupMembers[i];
if(m.user_id===currentUser.id)m.role='admin';
else if(m.user_id===newOwnerId){m.role='owner';m.can_edit_group=true;}
}
myGroupRole='admin';
closeSheet();
loadGrpMembers(currentChat.id).then(function(){renderGrpMembers();toast('👑 تم نقل الملكية');loadChats();});
}).catch(function(){toast('فشل');});
}
function startGroupInfoPoll(cid){
stopGroupInfoPoll();
groupInfoPollTimer=setInterval(function(){
if(!currentChat||currentChat.id!==cid)return;
if(!currentChat.is_group)return;
var sheet=$('sh-group-info')||$('group-info');
if(!sheet||!sheet.classList.contains('act'))return;
loadGrpMembers(cid).then(function(){
renderGrpMembers();
var s=$('chat-s');
if(s)s.textContent=currentGroupMembers.length+' عضو';
});
},5000);
}
function stopGroupInfoPoll(){if(groupInfoPollTimer){clearInterval(groupInfoPollTimer);groupInfoPollTimer=null;}}

/* ============ Mic Test ============ */
function checkMic(){
if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){var m=$('mic-msg');if(m)m.innerHTML='❌ المتصفح لا يدعم الميكروفون';openSheet('mic');return;}
navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){s.getTracks().forEach(function(t){t.stop();});var m=$('mic-msg');if(m)m.innerHTML='✅ الميكروفون يعمل بشكل صحيح';openSheet('mic');}).catch(function(e){var m=$('mic-msg');if(m)m.innerHTML='❌ فشل الوصول: '+esc(e.message||'خطأ');openSheet('mic');});
}

/* ============ Global Listeners ============ */
document.addEventListener('click',function(e){
if(!e.target.closest('#msg-menu')&&!e.target.closest('.msg'))closeMsgMenu();
if(!e.target.closest('#emoji-picker')&&!e.target.closest('.cbtn'))closeEmoji();
if(!e.target.closest('#chat-dropdown')&&!e.target.closest('.bk'))closeChatMenu();
});
window.addEventListener('beforeunload',function(){
if(currentAudioPlayer){try{currentAudioPlayer.pause();}catch(e){}}
stopTypingSession();
});

/* ============ Audio Tones ============ */
function getAC(){
if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
if(audioCtx.state==='suspended')audioCtx.resume().catch(function(){});
return audioCtx;
}
function playTone(f,d,del,v,ty){
var c=getAC();if(!c)return;
var t=c.currentTime+(del||0),o=c.createOscillator(),g=c.createGain();
o.type=ty||'sine';o.frequency.setValueAtTime(f,t);
var vl=v||.12;
g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vl,t+.02);
g.gain.setValueAtTime(vl,t+d-.03);g.gain.linearRampToValueAtTime(0,t+d);
o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.05);
activeOscillators.push(o);
o.onended=function(){var i=activeOscillators.indexOf(o);if(i>-1)activeOscillators.splice(i,1);};
}
function stopAllTones(){
ringbackActive=false;ringtoneActive=false;
if(ringbackInterval){clearInterval(ringbackInterval);ringbackInterval=null;}
if(ringtoneInterval){clearInterval(ringtoneInterval);ringtoneInterval=null;}
activeOscillators.forEach(function(o){try{o.stop();}catch(e){}});
activeOscillators=[];
}
function startRingback(){stopAllTones();ringbackActive=true;function c(){if(!ringbackActive)return;playTone(400,.4,0,.14);playTone(400,.4,.6,.14);}c();ringbackInterval=setInterval(c,3000);}
function startRingtone(){stopAllTones();ringtoneActive=true;function c(){if(!ringtoneActive)return;playTone(392,.14,0,.13,'triangle');playTone(494,.14,.16,.13,'triangle');playTone(587,.14,.32,.13,'triangle');playTone(784,.35,.48,.15,'triangle');}c();ringtoneInterval=setInterval(c,2600);}
function playConn(){playTone(523.25,.12,0,.11);playTone(659.25,.12,.14,.11);playTone(783.99,.3,.28,.13);}
function playEnd(){playTone(392,.16,0,.13);playTone(329.63,.16,.2,.13);playTone(261.63,.4,.4,.14);}
function playRej(){playTone(329.63,.14,0,.15,'square');playTone(261.63,.3,.18,.15,'square');}

/* ============ WebRTC ============ */
function getUMSafe(wv){
var ac={echoCancellation:true,noiseSuppression:true,autoGainControl:true};
var tries=wv?[{audio:ac,video:{facingMode:'user'}},{audio:ac,video:true},{audio:ac,video:false}]:[{audio:ac,video:false}];
function next(i){if(i>=tries.length)return Promise.reject(new Error('تعذر'));return navigator.mediaDevices.getUserMedia(tries[i]).catch(function(){return next(i+1);});}
return next(0);
}
function waitIce(pc,to){
return new Promise(function(res){
if(!pc)return res(pc);
if(pc.iceGatheringState==='complete')return res(pc);
var done=false;
var t=setTimeout(function(){if(!done){done=true;res(pc);}},to||3000);
function c(){if(pc.iceGatheringState==='complete'&&!done){done=true;clearTimeout(t);pc.removeEventListener('icegatheringstatechange',c);res(pc);}}
pc.addEventListener('icegatheringstatechange',c);
});
}
function tunePC(pc){
if(!pc)return;
try{pc.getSenders().forEach(function(s){if(!s.track)return;try{var p=s.getParameters();if(!p.encodings||!p.encodings.length)p.encodings=[{}];if(s.track.kind==='audio')p.encodings[0].maxBitrate=96000;else p.encodings[0].maxBitrate=1000000;s.setParameters(p).catch(function(){});}catch(e){}});}catch(e){}
}
function logCallMsg(cid,ct,st,dur,ci){
if(!cid||!currentUser)return;
var p={chat_id:cid,sender_id:currentUser.id,type:'call',text:'',meta:{call_id:ci,call_type:ct,status:st,duration:dur||0},created_at:new Date().toISOString()};
dbI('messages',p).then(function(r){
var m=Array.isArray(r)?r[0]:r;
lastMessageTime=m.created_at;
var pv=ct==='video'?'📹 مكالمة فيديو':'📞 مكالمة صوتية';
if(st==='missed')pv='📞 مكالمة فائتة';
dbP('chats','id=eq.'+cid,{last_message:pv,last_message_at:m.created_at}).catch(function(){});
if(currentChat&&currentChat.id===cid){
var b=$('chat-body');if(b){var e=b.querySelector('.cempty');if(e)e.remove();if(!renderedMsgIds[m.id]){renderedMsgIds[m.id]=true;b.insertAdjacentHTML('beforeend',renderMsg(m));b.scrollTop=b.scrollHeight;}}
}
}).catch(function(){});
}
function startVoiceCall(){
if(currentChatMode!=='direct'||!currentChat)return;
if(isBlockedByMe){toast('لا يمكنك الاتصال بمستخدم محظور');return;}
var oid=currentChat._other?currentChat._other.id:null;if(!oid)return;
toast('📞 جاري الاتصال...');
dbI('calls',{caller_id:currentUser.id,receiver_id:oid,type:'voice',status:'ringing'}).then(function(r){
var c=Array.isArray(r)?r[0]:r;
currentCall=c;invitedInThisCall={};
var o=currentChat._other;
$('call-name').textContent=o.name||'—';
var av=$('call-avatar');av.className='call-avatar ringing';sAv(av,o);
$('call-status').textContent='جاري الرنين...';
go('call');startRingback();callerFlow(c);
}).catch(function(){toast('خطأ');});
}
function startVideoCall(){
if(currentChatMode!=='direct'||!currentChat)return;
if(isBlockedByMe){toast('لا يمكنك الاتصال بمستخدم محظور');return;}
var oid=currentChat._other?currentChat._other.id:null;if(!oid)return;
toast('📹 جاري الاتصال...');
dbI('calls',{caller_id:currentUser.id,receiver_id:oid,type:'video',status:'ringing'}).then(function(r){
var c=Array.isArray(r)?r[0]:r;
currentCall=c;invitedInThisCall={};
var o=currentChat._other;
$('video-name').textContent=o.name||'—';
$('video-status').textContent='جاري الرنين...';
var vc=document.querySelector('.video-container');if(vc)vc.classList.add('no-remote');
go('video');startRingback();callerFlow(c);
}).catch(function(){toast('خطأ');});
}
function callerFlow(call){
var wv=call.type==='video',pc=null;
getUMSafe(wv).then(function(st){
localStream=st;
var hv=st.getVideoTracks().length>0;
if(wv&&!hv){
call.type='voice';
dbP('calls','id=eq.'+call.id,{type:'voice'}).catch(function(){});
go('call');
$('call-name').textContent=(currentChat._other&&currentChat._other.name)||'—';
sAv($('call-avatar'),currentChat._other);
var v0=document.querySelector('.video-container');if(v0)v0.classList.remove('no-remote');
startRingback();
}else if(call.type==='video'){$('video-local').srcObject=st;}
pc=new RTCPeerConnection(ICE);peerConnection=pc;
st.getTracks().forEach(function(t){pc.addTrack(t,st);});
pc.ontrack=function(e){
remoteStream=e.streams[0];
if(call.type==='video'){$('video-remote').srcObject=remoteStream;var vc=document.querySelector('.video-container');if(vc)vc.classList.remove('no-remote');}
else{var a=$('remote-audio');a.srcObject=remoteStream;a.play().catch(function(){});}
};
pc.onicecandidate=function(e){if(e.candidate)addIce(call.id,'caller_ice',e.candidate);};
tunePC(pc);
return pc.createOffer().then(function(o){return pc.setLocalDescription(o);}).then(function(){return waitIce(pc,3000);}).then(function(){if(!pc.localDescription)throw new Error('no sdp');return pc.localDescription;});
}).then(function(sdp){
if(!sdp||!sdp.type)throw new Error('bad sdp');
return dbP('calls','id=eq.'+call.id,{offer:sdp});
}).then(function(){
if(peerConnection&&currentCall&&currentCall.id===call.id)pollAnswer(call.id);
}).catch(function(e){
toast('فشل: '+(e.message||'خطأ'));
setTimeout(function(){
if(currentCall&&currentCall.id===call.id){dbP('calls','id=eq.'+call.id,{status:'ended',ended_at:new Date().toISOString()}).catch(function(){});}
cleanupCall();go('chats');
},2000);
});
}
function pollAnswer(cid){
stopCallStatusPoll();
var st=Date.now(),TO=45000;
callStatusPollTimer=setInterval(function(){
if(!currentCall||currentCall.id!==cid)return;
if(ringbackActive&&Date.now()-st>TO){
stopAllTones();
dbP('calls','id=eq.'+cid,{status:'ended',ended_at:new Date().toISOString()}).catch(function(){});
if(currentChat)logCallMsg(currentChat.id,currentCall?currentCall.type:'voice','missed',0,cid);
stopCallStatusPoll();
setTimeout(function(){cleanupCall();go('chats');},1800);
return;
}
dbS('calls','id=eq.'+cid+'&select=*').then(function(a){
if(!a||!a.length)return;
var c=a[0];
if(c.status==='rejected'){
stopAllTones();playRej();
if(currentChat)logCallMsg(currentChat.id,c.type||'voice','rejected',0,cid);
stopCallStatusPoll();
setTimeout(function(){cleanupCall();go('chats');},1500);
return;
}
if(c.status==='ended'||c.status==='ended_by_caller'){
stopAllTones();playEnd();
var d=callStartTime?Math.floor((Date.now()-callStartTime)/1000):0;
if(currentChat)logCallMsg(currentChat.id,c.type||'voice',c.status||'ended',d,cid);
stopCallStatusPoll();
setTimeout(function(){cleanupCall();go('chats');},1500);
return;
}
if(c.answer&&peerConnection&&peerConnection.signalingState==='have-local-offer'){
stopCallStatusPoll();stopAllTones();playConn();
peerConnection.setRemoteDescription(new RTCSessionDescription(c.answer)).then(function(){
$('call-status').textContent='00:00';$('video-status').textContent='00:00';
callStartTime=Date.now();startCallTimer();
startIcePoll(cid,'receiver_ice');startCallWatchdog(cid);
}).catch(function(){});
}
}).catch(function(){});
},1500);
}
function addIce(cid,col,cand){
dbS('calls','id=eq.'+cid+'&select='+col).then(function(a){
if(!a||!a.length)return;
var l=a[0][col]||[];
if(l.some(function(c){return JSON.stringify(c)===JSON.stringify(cand);}))return;
l.push(cand);
var u={};u[col]=l;
dbP('calls','id=eq.'+cid,u).catch(function(){});
});
}
function startIcePoll(cid,col){
var seen=0;
var iv=setInterval(function(){
if(!peerConnection||!currentCall){clearInterval(iv);return;}
dbS('calls','id=eq.'+cid+'&select='+col).then(function(a){
if(!a||!a.length)return;
var l=a[0][col]||[];
if(l.length>seen){
for(var i=seen;i<l.length;i++){
try{peerConnection.addIceCandidate(new RTCIceCandidate(l[i])).catch(function(){});}catch(e){}
}
seen=l.length;
}
}).catch(function(){});
},1500);
}
function startCallTimer(){
clearInterval(callTimerInterval);
callTimerInterval=setInterval(function(){
if(!callStartTime)return;
var s=Math.floor((Date.now()-callStartTime)/1000),t=fD(s);
var cs=$('call-status');if(cs)cs.textContent=t;
var vs=$('video-status');if(vs)vs.textContent=t;
},1000);
}
function stopCallStatusPoll(){if(callStatusPollTimer){clearInterval(callStatusPollTimer);callStatusPollTimer=null;}}
function stopCallWatchdog(){if(callWatchdogTimer){clearInterval(callWatchdogTimer);callWatchdogTimer=null;}callWatchdogId=null;}
function startCallWatchdog(cid){
stopCallWatchdog();if(!cid)return;
callWatchdogId=cid;
callWatchdogTimer=setInterval(function(){
var id=callWatchdogId;if(!id)return;
dbS('calls','id=eq.'+id+'&select=status').then(function(a){
if(!a||!a.length){stopCallWatchdog();remoteEnded(id,'ended');return;}
var s=a[0].status;
if(s==='ended'||s==='rejected'||s==='ended_by_caller'){stopCallWatchdog();remoteEnded(id,s);}
}).catch(function(){});
},1000);
}
function remoteEnded(cid,st){
stopAllTones();
if(callStartTime)playEnd();
var d=callStartTime?Math.floor((Date.now()-callStartTime)/1000):0;
var ct=currentCall?currentCall.type:'voice',ch=currentChat?currentChat.id:null;
cleanupCall();
if(ch&&d>0)logCallMsg(ch,ct,st==='rejected'?'rejected':st,d,cid);
setTimeout(function(){go('chats');},800);
}
function startIncomingScreenPoll(cid){
stopIncScreenPoll();if(!cid)return;
incomingScreenPollTimer=setInterval(function(){
dbS('calls','id=eq.'+cid+'&select=status').then(function(a){
if(!a||!a.length){stopIncScreenPoll();stopAllTones();currentCall=null;setTimeout(function(){go('chats');},500);return;}
var s=a[0].status;
if(s!=='ringing'){stopIncScreenPoll();stopAllTones();currentCall=null;setTimeout(function(){go('chats');},500);}
}).catch(function(){});
},800);
}
function stopIncScreenPoll(){if(incomingScreenPollTimer){clearInterval(incomingScreenPollTimer);incomingScreenPollTimer=null;}}
function startIncomingCallPoll(){
stopIncomingCallPoll();
incomingCallPollTimer=setInterval(function(){
if(!currentUser)return;
var a=document.querySelector('.sc.act');if(!a)return;
if(a.id==='sc-call'||a.id==='sc-video'||a.id==='sc-incoming')return;
dbS('calls','receiver_id=eq.'+currentUser.id+'&status=eq.ringing&order=created_at.desc&limit=1').then(function(arr){
if(!arr||!arr.length)return;
var call=arr[0];
var cr=new Date(call.created_at).getTime();
if(Date.now()-cr>60000)return;
dbS('blocks','blocker_id=eq.'+currentUser.id+'&blocked_id=eq.'+call.caller_id+'&select=*').then(function(bl){
if(bl&&bl.length){
dbP('calls','id=eq.'+call.id,{status:'rejected',ended_at:new Date().toISOString()}).catch(function(){});
return;
}
currentCall=call;
startRingtone();
if(navigator.vibrate)try{navigator.vibrate([300,200,300]);}catch(e){}
dbS('profiles','id=eq.'+call.caller_id+'&select=name,avatar_url').then(function(ps){
var p=ps&&ps[0],n=p&&p.name?p.name:'مستخدم';
$('incoming-name').textContent=n;
var ia=$('incoming-avatar');ia.className='call-avatar ringing';sAv(ia,p);
$('incoming-type').textContent=call.type==='video'?'📹 مكالمة فيديو واردة':'📞 مكالمة صوتية واردة';
go('incoming');
startIncomingScreenPoll(call.id);
});
}).catch(function(){});
}).catch(function(){});
},3000);
}
function stopIncomingCallPoll(){if(incomingCallPollTimer){clearInterval(incomingCallPollTimer);incomingCallPollTimer=null;}}
function acceptIncoming(){
if(!currentCall)return;
stopIncScreenPoll();
var call=currentCall;
stopAllTones();playConn();
var wv=call.type==='video';
if(wv){var vp=document.querySelector('.video-container');if(vp)vp.classList.add('no-remote');}
go(wv?'video':'call');
var pc=null;
getUMSafe(wv).then(function(st){
localStream=st;
var hv=st.getVideoTracks().length>0;
if(wv&&!hv){
call.type='voice';
dbP('calls','id=eq.'+call.id,{type:'voice'}).catch(function(){});
go('call');
$('call-name').textContent=$('incoming-name').textContent;
var ca=$('call-avatar'),ia=$('incoming-avatar');
ca.style.backgroundImage=ia.style.backgroundImage;ca.innerHTML=ia.innerHTML;
var v0=document.querySelector('.video-container');if(v0)v0.classList.remove('no-remote');
}else if(wv){
$('video-local').srcObject=st;
$('video-name').textContent=$('incoming-name').textContent;
}else{
$('call-name').textContent=$('incoming-name').textContent;
var ca2=$('call-avatar'),ia2=$('incoming-avatar');
ca2.style.backgroundImage=ia2.style.backgroundImage;ca2.innerHTML=ia2.innerHTML;
}
pc=new RTCPeerConnection(ICE);peerConnection=pc;
st.getTracks().forEach(function(t){pc.addTrack(t,st);});
pc.ontrack=function(e){
remoteStream=e.streams[0];
if(call.type==='video'){$('video-remote').srcObject=remoteStream;var vc=document.querySelector('.video-container');if(vc)vc.classList.remove('no-remote');}
else{var a=$('remote-audio');a.srcObject=remoteStream;a.play().catch(function(){});}
};
pc.onicecandidate=function(e){if(e.candidate)addIce(call.id,'receiver_ice',e.candidate);};
tunePC(pc);
return new Promise(function(resolve,reject){
var tries=0,maxTries=30;
function tryGet(){
tries++;
dbS('calls','id=eq.'+call.id+'&select=offer').then(function(a){
if(a&&a.length&&a[0].offer){resolve(a[0].offer);}
else if(tries<maxTries){setTimeout(tryGet,400);}
else{reject(new Error('لا يوجد offer'));}
}).catch(function(e){if(tries<maxTries)setTimeout(tryGet,400);else reject(e);});
}
tryGet();
}).then(function(offerSdp){
if(!offerSdp)throw new Error('offer فارغ');
return pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
});
}).then(function(){
if(!pc)throw new Error('pc');
return pc.createAnswer();
}).then(function(a){return pc.setLocalDescription(a);}).then(function(){return waitIce(pc,3000);}).then(function(){
if(!pc.localDescription)throw new Error('sdp');
return dbP('calls','id=eq.'+call.id,{status:'accepted',answer:pc.localDescription});
}).then(function(){
$('call-status').textContent='00:00';$('video-status').textContent='00:00';
callStartTime=Date.now();startCallTimer();
startIcePoll(call.id,'caller_ice');startCallWatchdog(call.id);
}).catch(function(){
toast('فشل الاتصال');
setTimeout(function(){
if(currentCall&&currentCall.id===call.id){dbP('calls','id=eq.'+call.id,{status:'ended',ended_at:new Date().toISOString()}).catch(function(){});}
cleanupCall();go('chats');
},2000);
});
}
function rejectIncoming(){
stopIncScreenPoll();stopAllTones();playRej();
var cid=currentCall?currentCall.id:callWatchdogId;
if(!cid){setTimeout(function(){go('chats');},600);return;}
var ct=currentCall?currentCall.type:'voice',ch=currentChat?currentChat.id:null;
currentCall=null;stopCallWatchdog();
dbP('calls','id=eq.'+cid,{status:'rejected',ended_at:new Date().toISOString()}).then(function(){
if(ch)logCallMsg(ch,ct,'rejected',0,cid);
setTimeout(function(){go('chats');},600);
}).catch(function(){setTimeout(function(){go('chats');},600);});
toast('تم الرفض');
}
function endCurrentCall(){
stopAllTones();
if(callStartTime)playEnd();
var ci=currentCall?currentCall.id:callWatchdogId,ct=currentCall?currentCall.type:'voice';
var dur=callStartTime?Math.floor((Date.now()-callStartTime)/1000):0;
var wasRinging=(!callStartTime)&&currentCall&&currentCall.status==='ringing';
var ch=currentChat?currentChat.id:null;
stopCallWatchdog();cleanupCall();
if(ci){
dbP('calls','id=eq.'+ci,{status:wasRinging?'ended_by_caller':'ended',ended_at:new Date().toISOString()}).then(function(){
if(ch)logCallMsg(ch,ct,wasRinging?'ended_by_caller':'ended',dur,ci);
setTimeout(function(){go('chats');},400);
}).catch(function(){setTimeout(function(){go('chats');},400);});
}else setTimeout(function(){go('chats');},400);
}
function cleanupCall(){
stopAllTones();stopCallWatchdog();clearInterval(callTimerInterval);stopCallStatusPoll();
if(peerConnection){try{peerConnection.close();}catch(e){}peerConnection=null;}
if(localStream){localStream.getTracks().forEach(function(t){t.stop();});localStream=null;}
remoteStream=null;callStartTime=null;currentCall=null;
isMuted=false;isSpeakerOn=false;isCameraOff=false;invitedInThisCall={};callMessageOpen=false;
var p=$('call-message-panel');if(p)p.classList.remove('act');
var pv=$('call-message-panel-v');if(pv)pv.classList.remove('act');
var ci=$('call-msg-in');if(ci)ci.value='';
var cv=$('call-msg-in-v');if(cv)cv.value='';
currentFacingMode='user';
var vc=document.querySelector('.video-container');if(vc)vc.classList.remove('no-remote');
resetVoice();
}
function toggleMute(){
if(!localStream)return;
isMuted=!isMuted;
localStream.getAudioTracks().forEach(function(t){t.enabled=!isMuted;});
toast(isMuted?'🔇 مكتوم':'🎤 مفعّل');
}
function toggleSpeaker(){
isSpeakerOn=!isSpeakerOn;
toast(isSpeakerOn?'🔊 مكبر الصوت':'🔈 عادي');
}
function toggleCamera(){
if(!localStream)return;
var v=localStream.getVideoTracks();if(!v.length)return;
isCameraOff=!isCameraOff;
v.forEach(function(t){t.enabled=!isCameraOff;});
toast(isCameraOff?'📷 مغلقة':'📷 مفعّلة');
}
function switchCamera(){
if(!localStream)return;
var vt=localStream.getVideoTracks()[0];if(!vt)return;
var nm=currentFacingMode==='user'?'environment':'user';
try{vt.stop();}catch(e){}
navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:nm}}}).then(function(ns){
var nt=ns.getVideoTracks()[0];if(!nt)throw new Error();
try{localStream.removeTrack(vt);}catch(e){}
localStream.addTrack(nt);
if(peerConnection){
var s=peerConnection.getSenders();
for(var i=0;i<s.length;i++){
if(s[i].track&&s[i].track.kind==='video'){s[i].replaceTrack(nt).catch(function(){});break;}
}
}
var vl=$('video-local');if(vl){vl.srcObject=localStream;vl.style.transform=nm==='user'?'scaleX(-1)':'scaleX(1)';}
currentFacingMode=nm;
toast(nm==='user'?'📷 أمامية':'📷 خلفية');
}).catch(function(){toast('فشل');});
}
function toggleCallMsgPanel(){
var p=$('call-message-panel'),pv=$('call-message-panel-v');
var a=document.querySelector('.sc.act');
var t=(a&&a.id==='sc-video')?pv:p;
if(!t)return;
callMessageOpen=!callMessageOpen;
if(callMessageOpen){
t.classList.add('act');
setTimeout(function(){var id=(a&&a.id==='sc-video')?'call-msg-in-v':'call-msg-in';var i=$(id);if(i)i.focus();},250);
}else{p.classList.remove('act');pv.classList.remove('act');}
}
function sendCallMsg(){
var a=document.querySelector('.sc.act');
var iid=(a&&a.id==='sc-video')?'call-msg-in-v':'call-msg-in';
var input=$(iid);if(!input)return;
var text=input.value.trim();if(!text)return;
var oid=currentCall&&currentCall.caller_id===currentUser.id?currentCall.receiver_id:(currentCall?currentCall.caller_id:null);
if(!oid)return;
var tgt=null;
for(var i=0;i<chats.length;i++){
var ch=chats[i];
if(!ch.is_group&&(ch.user1_id===oid||ch.user2_id===oid)){tgt=ch;break;}
}
if(!tgt)return;
input.value='';
dbI('messages',{chat_id:tgt.id,sender_id:currentUser.id,text:text,type:'text',created_at:new Date().toISOString()}).then(function(r){
var m=Array.isArray(r)?r[0]:r;
dbP('chats','id=eq.'+tgt.id,{last_message:text,last_message_at:m.created_at});
toast('✓');
});
}
function inviteToCall(){toast('قريباً');}

/* ============ startApp ============ */
function startApp(){
setupPins();
setupUserInp();
setupMentions();
buildEmoji();
setupPTT();
var mi=$('msg-input');
if(mi){
mi.addEventListener('focus',function(){startTypingSession();});
mi.addEventListener('input',function(){
var h=this.value.length>0;
updSendIcon(this.value);
autoRz(this);
var cb=$('clear-btn');if(cb)cb.style.display=h?'flex':'none';
startTypingSession();
});
mi.addEventListener('blur',function(){stopTypingSession();});
mi.addEventListener('keydown',function(e){
if(e.key==='Enter'&&e.shiftKey){e.preventDefault();handleSend();}
});
}
var ld=$('lk-del');if(ld)ld.onclick=cancelLocked;
var lp=$('lk-pause-btn');if(lp)lp.onclick=toggleLockedPause;
var ls=$('lk-send-btn');if(ls)ls.onclick=sendLocked;
var cin=$('call-msg-in');
if(cin)cin.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCallMsg();}});
var civ=$('call-msg-in-v');
if(civ)civ.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendCallMsg();}});
setTimeout(function(){setupLongPress();},500);
setTimeout(function(){
try{
if(loadSess()){
getUser().then(function(u){currentUser=u;return loadProf();}).then(function(){
setTimeout(function(){
var s=$('sc-splash');if(s)s.classList.remove('act');
go('chats');
},800);
markOnline();
startIncomingCallPoll();
if(onlineStatusInterval)clearInterval(onlineStatusInterval);
onlineStatusInterval=setInterval(markOnline,60000);
if(tokenRefreshInterval)clearInterval(tokenRefreshInterval);
tokenRefreshInterval=setInterval(function(){if(currentUser&&refreshToken)refTok().catch(function(){});},50*60*1000);
setTimeout(deepLink,1200);
setTimeout(initPushIfReady,2000);
}).catch(function(){clrSess();setTimeout(function(){var s=$('sc-splash');if(s)s.classList.remove('act');go('login');},800);});
}else{setTimeout(function(){var s=$('sc-splash');if(s)s.classList.remove('act');go('login');},800);}
}catch(e){setTimeout(function(){var s=$('sc-splash');if(s)s.classList.remove('act');go('login');},800);}
},1800);
document.addEventListener('visibilitychange',function(){if(!document.hidden&&currentUser)markOnline();});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startApp);
else startApp();