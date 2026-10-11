/* ═══════════════ الإعدادات ═══════════════ */
const SB='https://bwgetktksxbhrvobjvdb.supabase.co';
const KEY='sb_publishable_ZQbDTvvCDvc-Eny1Gj1n_w_A9EtdSQy';
const GIPHY='dc6zaTOxFJmzC';
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const escJs=s=>String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/</g,'\\x3c').replace(/>/g,'\\x3e');

/* ═══════════════ الحالة ═══════════════ */
let S=null,me=null,chats=[],P={},U={},cur=null,msgs=[],ids=new Set(),sig='',rep=null,edt=null,T={};
let selectedMsg=null,reactionsCache={},favorites=[];
let isRecording=false,voiceRec=null,voiceChunks=[],voiceStream=null,voiceMime='',voiceStart=0,voiceElapsed=0,pttTimer=null,lockedRec=false,lockedTimer=null,pttCancelled=false,pttLocked=false;
let currentAudio=null,currentAudioBtn=null;
let gifCache={},gifTab='emoji';

try{S=JSON.parse(localStorage.nv_s)}catch{}
try{document.documentElement.dataset.th=localStorage.nv_th||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark')}catch{}

/* ═══════════════ أدوات مساعدة ═══════════════ */
const save=s=>{S=s;try{s?localStorage.nv_s=JSON.stringify(s):localStorage.removeItem('nv_s')}catch{}};
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(T.t);T.t=setTimeout(()=>t.classList.remove('on'),2600)}
const fe=e=>e instanceof TypeError||/failed to fetch|networkerror|load failed/i.test(e.message)?'تعذّر الاتصال بالخادم':/could not find the function|schema cache/i.test(e.message)?'قاعدة البيانات غير محدّثة':/permission denied|row-level security/i.test(e.message)?'صلاحية مرفوضة':e.message;
const hs=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
const fT=t=>new Date(t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
function fD(s){s=Math.max(0,Math.floor(s));return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0')}
function dl(t){const d=new Date(t),n=new Date(),k=x=>x.toDateString();return k(d)==k(n)?'اليوم':k(d)==k(new Date(n-864e5))?'أمس':d.toLocaleDateString('en-GB')}
const lk=t=>esc(t).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const ex=f=>(f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'jpg';
const av=(p,c='')=>p?.avatar_url&&/^https:/.test(p.avatar_url)?`<img class="av ${c}" src="${esc(p.avatar_url)}" alt="">`:`<div class="av ${c}" style="background:hsl(${hs(p?.id)%360} 62% 52%)">${esc((p?.name||'؟').trim()[0]||'؟')}</div>`;
const st=p=>p?.last_seen?(Date.now()-new Date(p.last_seen)<9e4?'متصل الآن':'آخر ظهور '+fT(p.last_seen)):'';
const parseRB=v=>{if(!v)return[];if(typeof v==='string'){try{v=JSON.parse(v)}catch{return[]}}return Array.isArray(v)?v.filter(r=>r&&r.user_id):[]};

/* ═══════════════ الشبكة ═══════════════ */
async function api(p,o={},r){
 const h={apikey:KEY,'Content-Type':'application/json',...o.h};
 if(S&&!p.includes('/auth/v1/token'))h.Authorization='Bearer '+S.access_token;
 const x=await fetch(SB+p,{method:o.m||'GET',headers:h,body:o.b===undefined?undefined:JSON.stringify(o.b)});
 const t=await x.text();let d=null;try{d=t?JSON.parse(t):null}catch{d=t}
 if(!x.ok){
  if(!r&&S?.refresh_token&&!p.includes('/auth/v1/token')&&(x.status===401||/jwt/i.test(t))){await refresh();return api(p,o,1)}
  throw new Error(d?.msg||d?.message||d?.error_description||'خطأ '+x.status)
 }
 return d
}
async function refresh(){
 try{save(await api('/auth/v1/token?grant_type=refresh_token',{m:'POST',b:{refresh_token:S.refresh_token}}))}
 catch(e){if(!(e instanceof TypeError))out(1);throw e}
}
const db=(t,q)=>api('/rest/v1/'+t+(q?'?'+q:'')),
 rpc=(n,b)=>api('/rest/v1/rpc/'+n,{m:'POST',b:b||{}}),
 ins=(t,b)=>api('/rest/v1/'+t,{m:'POST',b,h:{Prefer:'return=representation'}}),
 pat=(t,q,b)=>api('/rest/v1/'+t+'?'+q,{m:'PATCH',b,h:{Prefer:'return=minimal'}}),
 del=(t,q)=>api('/rest/v1/'+t+'?'+q,{m:'DELETE'});
async function up(b,path,f){
 const x=await fetch(`${SB}/storage/v1/object/${b}/${path}`,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+S.access_token,'Content-Type':f.type||'application/octet-stream','x-upsert':'true'},body:f});
 if(!x.ok)throw new Error('فشل الرفع');
 return `${SB}/storage/v1/object/public/${b}/${path}`
}

/* ═══════════════ التنقل ═══════════════ */
const show=id=>$$('.scr').forEach(s=>s.classList.toggle('on',s.id==id));
function go(id){
 show(id);$('#nav').hidden=!(id=='home'||id=='set');
 $$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==id));
 clearInterval(T.h);clearInterval(T.m);
 if(id=='home'){loadChats();T.h=setInterval(loadChats,4000)}
 if(id=='set')fillSet()
}
function sheet(h){$('#sh').innerHTML=`<div class="sc"><i class="hd2"></i>${h}</div>`;$('#sh').classList.add('on')}
const shut=()=>$('#sh').classList.remove('on');
$('#sh').onclick=e=>{if(e.target.id=='sh')shut()};

/* ═══════════════ Auth ═══════════════ */
async function login(){
 const p=$('#lp').value.replace(/\D/g,''),k=$('#lk').value;
 if(p.length<8||!/^\d{6}$/.test(k))return toast('تأكد من الرقم والرمز (6 أرقام)');
 try{save(await api('/auth/v1/token?grant_type=password',{m:'POST',b:{email:p+'@novira.app',password:k}}));boot()}
 catch(e){toast(e instanceof TypeError?fe(e):'الرقم أو الرمز غير صحيح')}
}
async function reg(){
 const n=$('#rn').value.trim(),u=$('#ru').value.trim().toLowerCase(),p=$('#rp').value.replace(/\D/g,''),k=$('#rk').value;
 if(n.length<2)return toast('الاسم قصير');
 if(!/^[a-z0-9_]{3,20}$/.test(u))return toast('اسم المستخدم: 3-20 حرف إنجليزي أو رقم أو _');
 if(p.length<8||!/^\d{6}$/.test(k))return toast('تأكد من الرقم والرمز (6 أرقام)');
 try{
  if(!await rpc('username_available',{p_username:u}))return toast('اسم المستخدم محجوز');
  const em=p+'@novira.app';
  let r=await api('/auth/v1/signup',{m:'POST',b:{email:em,password:k,data:{name:n,phone:p,username:u}}});
  if(!r.access_token)r=await api('/auth/v1/token?grant_type=password',{m:'POST',b:{email:em,password:k}});
  save(r);boot()
 }catch(e){toast(/already|registered/i.test(e.message)?'الرقم مسجّل مسبقاً':/database/i.test(e.message)?'اسم المستخدم محجوز':fe(e))}
}
async function boot(){
 me=S.user;
 try{P[me.id]=(await db('profiles','select=id,name,username,avatar_url,bio,last_seen&id=eq.'+me.id))[0]}
 catch(e){if(!(e instanceof TypeError)){out(1);return}}
 P[me.id]=P[me.id]||{id:me.id,name:me.user_metadata?.name||'أنا',username:me.user_metadata?.username||''};
 go('home');online();clearInterval(T.o);T.o=setInterval(online,6e4)
}
function out(q){
 const t=S?.access_token;save(null);me=null;cur=null;chats=[];P={};U={};favorites=[];
 Object.values(T).forEach(clearInterval);
 if(!q&&t)fetch(SB+'/auth/v1/logout',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+t}}).catch(()=>{});
 $('#nav').hidden=true;show('auth')
}
const online=()=>me&&pat('profiles','id=eq.'+me.id,{last_seen:new Date().toISOString()}).catch(()=>{});

/* ═══════════════ قائمة المحادثات ═══════════════ */
const oth=c=>c.user1_id==me.id?c.user2_id:c.user1_id,
 nm=c=>c.is_group?c.group_name:(P[oth(c)]?.name||'مستخدم');
async function prof(a){
 const n=[...new Set(a)].filter(i=>i&&!P[i]);
 if(n.length)(await db('profiles','select=id,name,username,avatar_url,last_seen&id=in.('+n.join(',')+')')).forEach(p=>P[p.id]=p)
}
async function loadChats(){
 try{
  const cs=await db('chats','select=*&order=last_message_at.desc.nullslast');
  await prof(cs.filter(c=>!c.is_group).map(oth));
  U={};try{(await rpc('my_unread_counts')).forEach(r=>U[r.chat_id]=r.unread)}catch{}
  chats=cs;list();loadFavs()
 }catch{}
}
function list(){
 const q=$('#q').value.trim().toLowerCase(),a=chats.filter(c=>nm(c).toLowerCase().includes(q));
 $('#list').innerHTML=a.map(c=>{const u=U[c.id];return `<div class="ci" data-a="open" data-id="${c.id}">${c.is_group?'<div class="av">👥</div>':av(P[oth(c)])}<div class="ci-i"><div class="r"><b>${esc(nm(c))}</b><small>${c.last_message_at?fT(c.last_message_at):''}</small></div><div class="r"><span class="pv">${esc(c.last_message||'ابدأ المحادثة')}</span>${u?`<i class="bd">${u>99?'99+':u}</i>`:''}</div></div></div>`}).join('')||'<p class="em">ما في محادثات بعد.<br>اضغط ✎ لتبدأ محادثة أو مجموعة.</p>'
}

/* ═══════════════ المحادثة ═══════════════ */
async function openChat(id){
 const c=chats.find(x=>x.id==id);if(!c)return;
 cur=c;msgs=[];ids=new Set();sig='';rep=edt=null;rb();$('#in').value='';
 $('#cn').textContent=nm(c);$('#cs').textContent=c.is_group?'مجموعة':st(P[oth(c)]);
 $('#ca').innerHTML=c.is_group?'<div class="av">👥</div>':av(P[oth(c)]);
 const gb=$('#grp-info-btn');if(gb)gb.style.display=c.is_group?'block':'none';
 $('#msgs').innerHTML='';go('chat');
 await poll(1);T.m=setInterval(poll,2500)
}
async function poll(f){
 const c=cur;if(!c)return;
 try{
  const d=(await db('messages',`chat_id=eq.${c.id}&select=*&order=created_at.desc&limit=60`)).reverse();
  if(cur!==c)return;
  const s=d.map(m=>m.id+(m.read_by||[]).length+(m.edited_at||'')+(m.deleted_at||'')).join();
  if(s==sig&&!f)return;sig=s;
  const nw=d.some(m=>!ids.has(m.id)&&m.sender_id!=me.id);
  d.forEach(m=>ids.add(m.id));msgs=d;
  await prof(d.map(m=>m.sender_id));
  draw(f);
  if(nw||f==1)rpc('mark_chat_read',{p_chat:c.id}).catch(()=>{});
  loadReacts()
 }catch{}
}
function draw(f){
 const b=$('#msgs'),near=b.scrollHeight-b.scrollTop-b.clientHeight<140;let h='',ld='';
 msgs.forEach(m=>{
  const d=dl(m.created_at);if(d!=ld){h+=`<div class="day">${d}</div>`;ld=d}
  const mine=m.sender_id==me.id,rc=parseRB(m.read_by).length;
  let q='';if(m.reply_to){try{q=`<div class="rq">${esc(JSON.parse(m.reply_to).text)}</div>`}catch{}}
  let bd;
  if(m.deleted_at)bd='<em>🚫 تم حذف الرسالة</em>';
  else if(m.type==='image')bd=`<img class="im" data-a="img" src="${esc(m.media_url)}" loading="lazy" alt="">${m.text?lk(m.text):''}`;
  else if(m.type==='audio')bd=renderVoice(m);
  else if(m.type==='call'){const mt=typeof m.meta==='string'?(JSON.parse(m.meta)||{}):(m.meta||{});bd=`<div class="call-log"><div class="call-icon ${mt.status==='missed'?'missed':(mt.call_type==='video'?'video':'')}">📞</div><div class="call-info"><div class="call-title">${mt.call_type==='video'?'مكالمة فيديو':'مكالمة صوتية'}</div><div class="call-sub ${mt.status==='missed'?'missed':''}">${mt.status==='missed'?'لم يتم الرد':'انتهت'}</div></div></div>`;}
  else if(m.type==='sticker'){let bg='#A855F7';try{const mt=typeof m.meta==='string'?JSON.parse(m.meta):m.meta;if(mt?.bg)bg=mt.bg}catch{};bd=`<div style="width:120px;height:120px;border-radius:24px;display:grid;place-items:center;font-size:64px;background:${esc(bg)}">${esc(m.text||'🎨')}</div>`;}
  else bd=lk(m.text);
  const sn=cur.is_group&&!mine?`<b class="sn">${esc(P[m.sender_id]?.name||'')}</b>`:'';
  const tk=mine&&!m.deleted_at?`<span class="tk${rc?' rd':''}">${rc?'✓✓ '+rc:'✓'}</span>`:'';
  h+=`<div class="m ${mine?'me':'ot'}${m.type==='audio'?' voice-msg':''}" data-a="mm" data-id="${m.id}">${sn}${q}${bd}<i class="mt">${m.edited_at?'معدّلة · ':''}${fT(m.created_at)} ${tk}</i></div>`
 });
 b.innerHTML=h;refReact();if(f||near)b.scrollTop=b.scrollHeight;
 const sb=$('#read-only-banner');if(sb)sb.hidden=true;
}
function rb(){
 const b=$('#rb'),on=rep||edt;b.hidden=!on;
 b.innerHTML=on?`<span>${edt?'✏️ تعديل الرسالة':'↩️ '+esc(rep.text)}</span><button data-a="rx" type="button" aria-label="إلغاء">✕</button>`:''
}
const gm=id=>msgs.find(x=>x.id==id);

/* ═══════════════ Voice Rendering ═══════════════ */
function renderVoice(m){
 const dur=m.duration||0;
 let bars='';
 for(let i=0;i<22;i++)bars+=`<span style="height:${4+(hs(m.id+i)%15)}px"></span>`;
 return `<div class="voice-row"><button class="voice-play" data-a="play" data-id="${m.id}" type="button">▶</button><div class="voice-wave">${bars}</div><span class="voice-dur">${fD(dur)}</span></div><div class="voice-track" data-a="seek" data-id="${m.id}"><div class="voice-fill"></div><div class="voice-thumb"></div></div><div class="voice-times"><span class="vt-c">0:00</span><span class="vt-t">${fD(dur)}</span></div>`
}

/* ═══════════════ Reactions ═══════════════ */
function loadReacts(){
 if(!cur)return;
 db('messages','chat_id=eq.'+cur.id+'&order=created_at.desc&limit=100&select=id').then(ms=>{
  if(!ms?.length){reactionsCache={};refReact();return}
  const ids=ms.map(m=>m.id).join(',');
  return db('reactions','message_id=in.('+ids+')&select=*').then(l=>{
   reactionsCache={};(l||[]).forEach(r=>{if(!reactionsCache[r.message_id])reactionsCache[r.message_id]=[];reactionsCache[r.message_id].push(r)});
   refReact()
  })
 }).catch(()=>{})
}
function refReact(){
 $$('.m').forEach(el=>{
  const mid=el.dataset.id;if(!mid)return;
  const old=el.querySelector('.reactions');if(old)old.remove();
  const l=reactionsCache[mid];if(!l?.length)return;
  const u={};l.forEach(r=>u[r.emoji]=(u[r.emoji]||0)+1);
  el.insertAdjacentHTML('beforeend','<div class="reactions">'+Object.keys(u).map(e=>`<span>${e}</span>`).join('')+'</div>')
 })
}
async function setReact(emoji){
 if(!selectedMsg)return;
 closeMM();
 const mid=selectedMsg.id;
 try{
  const a=await db('reactions','message_id=eq.'+mid+'&user_id=eq.'+me.id+'&select=*');
  if(a?.length){
   if(a[0].emoji===emoji)await del('reactions','id=eq.'+a[0].id);
   else await pat('reactions','id=eq.'+a[0].id,{emoji})
  }else await ins('reactions',{message_id:mid,user_id:me.id,emoji});
  toast(emoji);loadReacts()
 }catch(e){toast(fe(e))}
}

/* ═══════════════ Long Press + Message Menu ═══════════════ */
let pressTimer=null;
function setupLongPress(){
 const b=$('#msgs');if(!b||b._lp)return;b._lp=true;
 b.addEventListener('touchstart',e=>{
  if(e.target.closest('.voice-track'))return;
  const t=e.target.closest('.m');if(!t)return;
  pressTimer=setTimeout(()=>{openMM(t)},500)
 },{passive:true});
 b.addEventListener('touchend',()=>{clearTimeout(pressTimer)});
 b.addEventListener('touchmove',()=>{clearTimeout(pressTimer)});
 b.addEventListener('contextmenu',e=>{const t=e.target.closest('.m');if(!t)return;e.preventDefault();openMM(t)});
}
function openMM(el){
 const id=el.dataset.id,m=gm(id);if(!m||m.deleted_at)return;
 selectedMsg={id,el};
 const menu=$('#mm');
 const r=el.getBoundingClientRect();
 const w=210,h=Math.min(menu.offsetHeight||320,innerHeight-20);
 let left=r.left+r.width/2-w/2,top=r.top-h-10;
 if(top<10)top=r.bottom+10;
 if(top+h>innerHeight-10)top=innerHeight-h-10;
 if(left<10)left=10;
 if(left+w>innerWidth-10)left=innerWidth-w-10;
 menu.style.left=left+'px';menu.style.top=top+'px';
 const mine=m.sender_id===me.id;
 const editBtn=$('#menu-edit-btn');
 if(editBtn)editBtn.style.display=(mine&&m.type==='text')?'block':'none';
 menu.classList.add('on');
}
function closeMM(){const m=$('#mm');if(m)m.classList.remove('on');selectedMsg=null}
document.addEventListener('click',e=>{
 if(!e.target.closest('#mm')&&!e.target.closest('.m'))closeMM();
 if(!e.target.closest('#emoji-picker')&&!e.target.closest('[data-a="emoji"]'))$('#emoji-picker')?.setAttribute('hidden','')
});

/* ═══════════════ Info Readers ═══════════════ */
async function menuInfo(){
 if(!selectedMsg)return;
 const mid=selectedMsg.id;closeMM();
 try{
  const a=await db('messages','id=eq.'+mid+'&select=*');
  if(!a?.length)return;
  const m=a[0];
  const s=new Date(m.created_at);
  const sentFull=s.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'})+' — '+s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const tm={text:'نص',image:'صورة',video:'فيديو',audio:'رسالة صوتية',call:'مكالمة',sticker:'ملصق',forward:'مُعاد توجيهها'};
  const readers=parseRB(m.read_by);
  const readerCount=readers.length;
  let h='<div class="info-header"><button class="ib" data-a="close-info" type="button">→</button><b style="font-size:16px;flex:1">📄 معلومات الرسالة</b></div>';
  h+=`<div class="info-row"><span>📤 أُرسلت</span><span>${esc(sentFull)}</span></div>`;
  h+=`<div class="info-row"><span>📝 النوع</span><span>${esc(tm[m.type]||m.type)}</span></div>`;
  if(m.type==='audio'&&m.duration)h+=`<div class="info-row"><span>⏱️ المدة</span><span>${fD(m.duration)}</span></div>`;
  if(m.text&&m.type!=='sticker'&&m.type!=='call')h+=`<div class="info-row" style="flex-direction:column;align-items:flex-start"><span>📄 النص</span><span style="font-family:Cairo;direction:rtl;text-align:right;width:100%">${esc(m.text.substring(0,200))}</span></div>`;
  h+=`<div class="info-section-title">📖 قرأها <span class="readers-count">${readerCount}</span></div>`;
  if(readerCount===0)h+='<div class="reader-empty">لا أحد قرأ هذه الرسالة بعد</div>';
  else h+='<div class="readers-scroll" id="readers-scroll"><div class="reader-loading">⏳ جاري التحميل...</div></div>';
  sheet(h);
  if(readerCount>0){
   const ids=[...new Set(readers.map(r=>r.user_id))];
   const ps=await db('profiles','select=id,name,avatar_url&id=in.('+ids.join(',')+')');
   const pm={};(ps||[]).forEach(p=>pm[p.id]=p);
   const sorted=readers.slice().sort((a,b)=>new Date(b.read_at||0)-new Date(a.read_at||0));
   let listHTML='';
   sorted.forEach(r=>{
    const p=pm[r.user_id]||{id:r.user_id,name:'مستخدم'};
    const rt=r.read_at?new Date(r.read_at):null;
    let timeDisplay='غير معروف';
    if(rt){
     const now=new Date();
     const isToday=rt.toDateString()===now.toDateString();
     const yd=new Date(now);yd.setDate(now.getDate()-1);
     const isYd=rt.toDateString()===yd.toDateString();
     const timeStr=rt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
     if(isToday)timeDisplay='اليوم '+timeStr;
     else if(isYd)timeDisplay='أمس '+timeStr;
     else timeDisplay=rt.toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit'})+' · '+timeStr;
    }
    const avHTML=p.avatar_url?`<div class="reader-av" style="background-image:url(${esc(p.avatar_url)})"></div>`:`<div class="reader-av" style="background:hsl(${hs(p.id)%360} 62% 52%)">${esc((p.name||'؟')[0])}</div>`;
    listHTML+=`<div class="reader-item">${avHTML}<div class="reader-info"><div class="reader-name">${esc(p.name)}</div><div class="reader-time">✓ قُرئت ${esc(timeDisplay)}</div></div></div>`
   });
   const scroll=$('#readers-scroll');if(scroll)scroll.innerHTML=listHTML;
  }
 }catch(e){toast(fe(e))}
}

/* ═══════════════ Search ═══════════════ */
function doSearch(q){
 q=(q||'').trim().toLowerCase();
 const mine=[],joined=[],direct=[];
 chats.forEach(c=>{
  if(c.is_group){
   if(c.group_creator_id===me.id)mine.push(c);else joined.push(c);
  }else direct.push(c);
 });
 const filt=arr=>arr.filter(c=>!q||nm(c).toLowerCase().includes(q)||(P[oth(c)]?.username||'').toLowerCase().includes(q)||(P[oth(c)]?.phone||'').includes(q));
 const all=[...filt(direct),...filt(mine),...filt(joined)];
 if(!all.length)return '<p class="em">لا نتائج</p>';
 let h='';
 const fD2=filt(direct),fM=filt(mine),fJ=filt(joined);
 if(fD2.length){h+='<div class="search-sec-title">💬 المحادثات</div>';fD2.forEach(c=>h+=renderSearchItem(c))}
 if(fM.length){h+='<div class="search-sec-title">👑 مجموعاتي</div>';fM.forEach(c=>h+=renderSearchItem(c))}
 if(fJ.length){h+='<div class="search-sec-title">👥 ضموني</div>';fJ.forEach(c=>h+=renderSearchItem(c))}
 return h;
}
function renderSearchItem(c){
 return `<div class="ci" data-a="open" data-id="${c.id}">${c.is_group?'<div class="av">👥</div>':av(P[oth(c)])}<div class="ci-i"><div class="r"><b>${esc(nm(c))}</b></div><div class="pv">${c.is_group?(c.group_creator_id===me.id?'👑 أنشأتها':'👥 عضو'):esc(P[oth(c)]?.username?'@'+P[oth(c)].username:(P[oth(c)]?.phone||''))}</div></div></div>`
}
/* ═══════════════ Favorites ═══════════════ */
async function loadFavs(){
 try{
  const l=await db('favorites','user_id=eq.'+me.id+'&target_type=eq.chat&select=target_type,target_id');
  favorites=(l||[]).filter(f=>f&&f.target_type==='chat'&&f.target_id)
 }catch{favorites=[]}
 renderFavs()
}
const isFav=id=>favorites.some(f=>f.target_type==='chat'&&f.target_id===id);
function renderFavs(){
 const sec=$('#fav-sec'),list=$('#fav-list'),cnt=$('#fav-count'),tile=$('#fav-tile');
 if(!sec||!list)return;
 const valid=favorites.filter(f=>chats.some(c=>c.id===f.target_id));
 const n=valid.length;
 if(cnt)cnt.textContent=n?n+' محادثة':'';
 if(tile){if(n){tile.textContent=n;tile.hidden=false}else{tile.hidden=true}}
 if(!n){sec.hidden=true;list.innerHTML='';return}
 sec.hidden=false;
 list.innerHTML=valid.map(f=>{
  const c=chats.find(x=>x.id===f.target_id);
  const name=nm(c);
  return `<div class="fav-chip" data-a="open" data-id="${c.id}">${c.is_group?'<div class="av">👥</div>':av(P[oth(c)])}<div class="fav-chip-n">${esc(name)}</div></div>`
 }).join('')
}
async function toggleFav(){
 if(!cur)return;
 const cid=cur.id,ex=isFav(cid);
 try{
  if(ex){
   await del('favorites','user_id=eq.'+me.id+'&target_type=eq.chat&target_id=eq.'+cid);
   favorites=favorites.filter(f=>!(f.target_type==='chat'&&f.target_id===cid));toast('أُزيلت')
  }else{
   await ins('favorites',{user_id:me.id,target_type:'chat',target_id:cid});
   favorites.push({target_type:'chat',target_id:cid});toast('★ أُضيفت')
  }
  renderFavs();updFavLbl()
 }catch(e){toast(fe(e))}
}
function updFavLbl(){
 const i=$('#fav-toggle-item');if(!i||!cur)return;
 const sp=i.querySelector('span');
 if(sp)sp.textContent=isFav(cur.id)?'إزالة من المفضلة':'إضافة للمفضلة'
}

/* ═══════════════ Media + Save ═══════════════ */
$('#fi').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';if(!f||!cur)return;
 if(!f.type.startsWith('image/')||f.size>15e6)return toast('اختر صورة حتى 15MB');
 try{
  toast('جاري الرفع…');
  const u=await up('media',`${me.id}/${Date.now()}.${ex(f)}`,f);
  await ins('messages',{chat_id:cur.id,sender_id:me.id,type:'image',media_url:u,media_type:f.type,text:$('#in').value.trim()});
  $('#in').value='';poll(2)
 }catch(x){toast(fe(x))}
};
async function saveMedia(url,name){
 if(!url)return;
 toast('جاري التحميل…');
 try{
  const r=await fetch(url);if(!r.ok)throw 0;
  const b=await r.blob();
  const a=document.createElement('a'),u=URL.createObjectURL(b);
  a.href=u;a.download=name||('novira_'+(url.match(/\.([a-z0-9]+)(\?|$)/i)?.[1]||'jpg'));
  a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(u)},800);
  toast('✓ تم الحفظ بنجاح')
 }catch{window.open(url,'_blank');toast('فتح الرابط')}
}

/* ═══════════════ QR ═══════════════ */
function myQR(){
 const p=P[me.id]||{};
 if(!p.username)return toast('لا يوجد username');
 const url=location.origin+location.pathname+'?u='+encodeURIComponent(p.username);
 sheet(`<b style="text-align:center">رمزي الشخصي</b>
  <div class="qr-info"><div class="av xl" style="background:hsl(${hs(p.id)%360} 62% 52%)">${esc((p.name||'؟')[0])}</div><div class="name">${esc(p.name||'')}</div><div class="username">@${esc(p.username)}</div></div>
  <div class="qr-wrap"><div id="qr-code"></div><div class="qr-user" data-a="copy-qr">@${esc(p.username)} 📋</div><div class="qr-url">${esc(url)}</div></div>
  <button class="btn" data-a="share-qr" type="button">📤 مشاركة</button>
  <button class="btn sec" data-a="scan-qr" type="button">📷 مسح رمز QR</button>
  <button class="btn sec" data-a="close" type="button">إغلاق</button>`);
 setTimeout(()=>{
  const w=$('#qr-code');if(!w)return;
  try{new QRCode(w,{text:url,width:160,height:160,colorDark:'#0A0E1A',colorLight:'#FFF',correctLevel:QRCode.CorrectLevel.H})}catch{}
 },200)
}
function scanQR(){
 sheet(`<b style="text-align:center">مسح QR</b>
  <div class="qr-scan-box" id="qr-reader"></div>
  <div class="qr-gallery" data-a="scan-file"><div style="font-size:32px">📷</div><div class="qr-gallery-title">أو اختر صورة</div></div>
  <button class="btn sec" data-a="close" type="button">إغلاق</button>`);
 setTimeout(()=>{
  const rd=$('#qr-reader');if(!rd)return;
  if(typeof Html5Qrcode==='undefined')return toast('الماسح غير متاح');
  try{
   const sc=new Html5Qrcode('qr-reader');
   window._qr=sc;
   sc.start({facingMode:'environment'},{fps:10,qrbox:250},text=>{
    try{navigator.vibrate?.(50)}catch{}
    sc.stop().then(()=>{try{sc.clear()}catch{}}).catch(()=>{});
    shut();handleQR(text)
   },()=>{})
  }catch(e){toast('فشل تشغيل الكاميرا')}
 },250)
}
function handleQR(text){
 const m=text.match(/[?&]u=([^&]+)/);
 const un=m?decodeURIComponent(m[1]):text.trim();
 const u=un.replace(/^@/,'');
 if(!u)return;
 setTimeout(async()=>{
  try{
   const a=await db('profiles','select=*&username=eq.'+encodeURIComponent(u));
   if(!a?.length)return toast('لا يوجد مستخدم');
   const x=a[0];if(x.id===me.id)return go('set');
   P[x.id]=x;
   let c=chats.find(c=>!c.is_group&&oth(c)===x.id);
   if(!c){c=(await ins('chats',{user1_id:me.id,user2_id:x.id}))[0];chats.unshift(c)}
   shut();openChat(c.id)
  }catch(e){toast(fe(e))}
 },200)
}

/* ═══════════════ Emoji + GIF + Sticker ═══════════════ */
const EMO={
 'وجوه':['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥺','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩','🤡'],
 'إيماءات':['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','👂','👃','🧠','👀','👁','👅','👄','💋'],
 'قلوب':['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌'],
 'حيوانات':['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐺','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🐙','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐘','🐫','🦒','🐎','🐕','🐈','🦜','🕊','🐇','🦔'],
 'طعام':['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🥭','🍍','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶','🌽','🥕','🧄','🧅','🥔','🍞','🥐','🥖','🧀','🥚','🍳','🥞','🥓','🍔','🍟','🍕','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🍤','🍙','🍚','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','☕','🍵','🥤','🍺','🍻','🍷','🍸','🍹'],
 'أنشطة':['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🏏','⛳','🏹','🎣','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🎿','🏂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎗','🎫','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🎯','🎳','🎮','🎰','🧩'],
 'سفر':['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🛴','🚲','🛵','🏍','🛺','🚨','🚡','🚃','🚄','🚅','🚂','🚆','🚇','🚊','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','⛴','🚢','⚓','🗺','🗿','🗽','🗼','🏰','🏯','🏟','🎡','🎢','🎠','⛲','🏖','🏝','🌋','🏔','🗻','🏕','⛺','🏠','🏡','🏘','🏢','🏬','🏥','🏦','🏨','🏪','🏫','💒','🏛','⛪','🕌','🕍','🛕','🕋','⛩','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁'],
 'رموز':['💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','🚻','🚮','📶','🆖','🆗','🆙','🆒','🆕','🆓','▶️','⏸','⏯','⏹','⏺','⏭','⏮','⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️','⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️','↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂','🔄','🔃','➕','➖','➗','✖️','♾','💲','💱','™️','©️','®️','✔️','☑️','🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','🔈','🔇','🔉','🔊','🔔','🔕','📣','📢','💬','💭','🗯','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚','🕛']
};
const EMO_IC={'وجوه':'😀','إيماءات':'👋','قلوب':'❤️','حيوانات':'🐶','طعام':'🍎','أنشطة':'⚽','سفر':'✈️','رموز':'⭐'};
function buildEmoji(){
 const tabs=$('#emoji-tabs');if(!tabs)return;
 const keys=Object.keys(EMO);
 tabs.innerHTML=keys.map((k,i)=>`<button class="${i===0?'on':''}" data-a="ecat" data-cat="${escJs(k)}" type="button">${EMO_IC[k]||'📁'}</button>`).join('');
 showEmoji(keys[0])
}
function showEmoji(cat){
 const g=$('#emoji-grid'),c=$('#ep-cat');if(!g)return;
 c.textContent=cat;
 g.innerHTML=(EMO[cat]||[]).map(e=>`<button class="ep-i" data-a="ie" data-e="${escJs(e)}" type="button">${e}</button>`).join('');
}
function insEmoji(e){const i=$('#in');if(!i)return;i.value+=e;i.focus();autoRz(i)}
function autoRz(el){if(!el)return;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px'}
function toggleEmoji(){
 const ep=$('#emoji-picker');if(!ep)return;
 const isHidden=ep.hasAttribute('hidden');
 if(isHidden){ep.removeAttribute('hidden')}else{ep.setAttribute('hidden','')}
}
function switchEP(t){
 $$('.pill-btn').forEach(b=>b.classList.toggle('on',b.dataset.ep===t));
 gifTab=t;
 if(t==='emoji'){buildEmoji();showEmoji(Object.keys(EMO)[0])}
 else if(t==='gif')loadGIF('')
 else if(t==='sticker'){
  $('#emoji-grid').innerHTML='<div style="grid-column:1/-1;padding:8px 12px;font-weight:800;font-size:12px;color:var(--t2)">😂 وجوه</div>'+[['😂','#FF6B9D,#A855F7'],['😍','#F43F5E,#EC4899'],['😎','#0EA5E9,#06B6D4'],['🥳','#F59E0B,#F43F5E'],['😭','#3B82F6,#8B5CF6'],['🤔','#8B5CF6,#6D28D9'],['😡','#DC2626,#F59E0B'],['❤️','#EC4899,#F43F5E'],['👍','#22C55E,#16A34A'],['🙏','#FBBF24,#F59E0B']].map(s=>`<div class="sticker-item" style="background:linear-gradient(135deg,${esc(s[1])})" data-a="sticker" data-e="${escJs(s[0])}" data-bg="${escJs(s[1])}">${s[0]}</div>`).join('');
 }
}
function loadGIF(q){
 const g=$('#emoji-grid');if(!g)return;
 g.innerHTML='<div class="gif-search"><input id="gif-q" placeholder="ابحث GIF…" value="'+esc(q||'')+'"></div><div class="gif-grid" id="gif-gc" style="grid-column:1/-1"><div class="gif-loading">جاري…</div></div>';
 const inp=$('#gif-q');
 if(inp){inp.oninput=()=>{clearTimeout(T.g);T.g=setTimeout(()=>loadGIF(inp.value),450)}}
 const k=q||'trending';
 if(gifCache[k]){rGIF(gifCache[k]);return}
 const url=q?`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY}&q=${encodeURIComponent(q)}&limit=24`:`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY}&limit=24`;
 fetch(url).then(r=>r.json()).then(d=>{if(!d?.data)throw 0;gifCache[k]=d.data;rGIF(d.data)}).catch(()=>{const c=$('#gif-gc');if(c)c.innerHTML='<div class="gif-loading">⚠️ تعذر التحميل</div>'})
}
function rGIF(gs){
 const c=$('#gif-gc');if(!c)return;
 if(!gs.length){c.innerHTML='<div class="gif-loading">لا نتائج</div>';return}
 c.innerHTML=gs.map(g=>{const u=g.images?.fixed_height?.url||g.images?.original?.url;return u?`<div class="gif-item" data-a="send-gif" data-u="${escJs(u)}"><img src="${esc(u)}" loading="lazy" alt=""></div>`:''}).join('')
}
async function sendGIF(url){
 if(!cur)return;
 try{
  await ins('messages',{chat_id:cur.id,sender_id:me.id,type:'image',media_url:url,media_type:'image/gif',text:''});
  $('#emoji-picker')?.setAttribute('hidden','');poll(2)
 }catch(e){toast(fe(e))}
}
async function sendSticker(e,bg){
 if(!cur)return;
 try{
  await ins('messages',{chat_id:cur.id,sender_id:me.id,type:'sticker',text:e,meta:{bg}});
  $('#emoji-picker')?.setAttribute('hidden','');poll(2)
 }catch(x){toast(fe(x))}
}

/* ═══════════════ Voice Recording (PTT) ═══════════════ */
function pickMime(){
 if(typeof MediaRecorder==='undefined')return '';
 for(const m of ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus']){
  try{if(MediaRecorder.isTypeSupported(m))return m}catch{}
 }
 return ''
}
function setupPTT(){
 const btn=$('.snd');if(!btn||btn._ptt)return;btn._ptt=true;
 let sY=0,holding=false,pid=null,wd=null;
 const getY=e=>e.touches?.[0]?.clientY??e.changedTouches?.[0]?.clientY??e.clientY??0;
 const begin=async e=>{
  if(holding||lockedRec||isRecording)return;
  if($('#in').value.trim())return;
  if(!cur)return;
  if(e.cancelable)e.preventDefault();
  holding=true;pttLocked=false;pttCancelled=false;
  pid=e.pointerId??null;sY=getY(e);
  if(pid!==null&&btn.setPointerCapture){try{btn.setPointerCapture(pid)}catch{}}
  $('#recov').hidden=false;
  $('#rect').textContent='0:00';
  try{navigator.vibrate?.(15)}catch{}
  try{
   voiceStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
   voiceMime=pickMime();
   voiceRec=new MediaRecorder(voiceStream,voiceMime?{mimeType:voiceMime}:{});
   voiceChunks=[];
   voiceRec.ondataavailable=e=>{if(e.data.size>0)voiceChunks.push(e.data)};
   voiceRec.onstop=()=>finishVoice(pttCancelled);
   voiceRec.start(100);
   isRecording=true;voiceStart=Date.now();voiceElapsed=0;
   btn.classList.add('rec');
   clearInterval(pttTimer);
   pttTimer=setInterval(()=>{
    voiceElapsed=Math.floor((Date.now()-voiceStart)/1000);
    $('#rect').textContent=fD(voiceElapsed)
   },200)
  }catch{
   holding=false;$('#recov').hidden=true;
   toast('لا يمكن التسجيل — تحقق من الميكروفون')
  }
 };
 const move=e=>{
  if(!holding||pttLocked)return;
  if(pid!==null&&e.pointerId!==undefined&&e.pointerId!==pid)return;
  if(e.cancelable)e.preventDefault();
  const dy=sY-getY(e);
  if(dy>80){pttLocked=true;try{navigator.vibrate?.(30)}catch{}}
  else if(dy<-30){pttCancelled=true}
  else{pttCancelled=false}
 };
 const end=e=>{
  if(!holding)return;
  if(pid!==null&&e.pointerId!==undefined&&e.pointerId!==pid)return;
  if(e.cancelable)e.preventDefault();
  const elapsed=voiceStart?Date.now()-voiceStart:0;
  const wasLock=pttLocked,wasCancel=pttCancelled,hasRec=isRecording&&voiceRec;
  holding=false;pid=null;
  clearInterval(pttTimer);
  if(pid!==null&&btn.releasePointerCapture&&e.pointerId!==undefined){try{btn.releasePointerCapture(e.pointerId)}catch{}}
  if(wasLock){
   lockedRec=true;$('#recov').hidden=true;$('#lkbar').hidden=false;
   clearInterval(lockedTimer);
   lockedTimer=setInterval(()=>{
    voiceElapsed=Math.floor((Date.now()-voiceStart)/1000);
    $('#lkt').textContent=fD(voiceElapsed)
   },200);
   return
  }
  $('#recov').hidden=true;
  if(wasCancel){
   pttCancelled=true;
   if(hasRec){try{voiceRec.stop()}catch{}}
   else{resetVoice()}
   toast('تم الإلغاء');return
  }
  if(!hasRec){resetVoice();return}
  if(elapsed<800){pttCancelled=true;try{voiceRec.stop()}catch{resetVoice()}toast('اضغط مطولاً أكثر');return}
  try{voiceRec.stop()}catch{resetVoice()}
 };
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
 btn.addEventListener('contextmenu',e=>{e.preventDefault();return false});
}
function resetVoice(){
 isRecording=false;lockedRec=false;pttLocked=false;pttCancelled=false;
 clearInterval(pttTimer);clearInterval(lockedTimer);
 voiceElapsed=0;
 try{$('.snd').classList.remove('rec')}catch{}
 try{$('#recov').hidden=true}catch{}
 try{$('#lkbar').hidden=true}catch{}
 if(voiceStream){voiceStream.getTracks().forEach(t=>t.stop());voiceStream=null}
 voiceRec=null;voiceChunks=[]
}
async function finishVoice(cancel){
 const st=voiceStream;voiceStream=null;isRecording=false;
 lockedRec=false;
 clearInterval(pttTimer);clearInterval(lockedTimer);
 try{$('.snd').classList.remove('rec')}catch{}
 try{$('#recov').hidden=true}catch{}
 try{$('#lkbar').hidden=true}catch{}
 if(st)st.getTracks().forEach(t=>t.stop());
 if(cancel){voiceChunks=[];voiceRec=null;pttCancelled=false;return}
 if(!voiceChunks.length){voiceRec=null;return}
 const bt=(voiceMime||'audio/webm').split(';')[0];
 const blob=new Blob(voiceChunks,{type:bt});
 voiceChunks=[];voiceRec=null;
 const dur=Math.max(1,Math.round(voiceElapsed||((Date.now()-voiceStart)/1000)));
 const ext=bt.includes('mp4')?'m4a':bt.includes('ogg')?'ogg':'webm';
 const path=`${me.id}/${Date.now()}.${ext}`;
 try{
  toast('جاري الرفع…');
  const url=await up('voice-messages',path,blob);
  await ins('messages',{chat_id:cur.id,sender_id:me.id,type:'audio',audio_url:url,duration:dur});
  poll(2);toast('✓')
 }catch(e){toast(fe(e))}
}

/* ═══════════════ Audio Play + Seek ═══════════════ */
function playVoice(btn,id){
 const m=gm(id);if(!m?.audio_url)return;
 if(currentAudio&&currentAudioBtn===btn){
  if(currentAudio.paused){currentAudio.play();btn.textContent='⏸'}
  else{currentAudio.pause();btn.textContent='▶'}
  return
 }
 if(currentAudio){try{currentAudio.pause()}catch{};if(currentAudioBtn)currentAudioBtn.textContent='▶'}
 const a=new Audio(m.audio_url);a.preload='auto';
 currentAudio=a;currentAudioBtn=btn;
 btn.textContent='⏸';
 const me_=btn.closest('.m');
 const fill=me_.querySelector('.voice-fill');
 const thumb=me_.querySelector('.voice-thumb');
 const cur=me_.querySelector('.vt-c');
 const total=me_.querySelector('.vt-t');
 const wave=me_.querySelectorAll('.voice-wave span');
 const upd=()=>{
  const dur=a.duration&&isFinite(a.duration)?a.duration:(m.duration||1);
  const pct=Math.max(0,Math.min(100,(a.currentTime/dur)*100));
  if(fill)fill.style.width=pct+'%';
  if(thumb)thumb.style.left=pct+'%';
  if(cur)cur.textContent=fD(a.currentTime);
  if(wave){const c=Math.floor(pct/100*wave.length);wave.forEach((w,i)=>w.classList.toggle('played',i<c))}
 };
 a.addEventListener('timeupdate',upd);
 a.addEventListener('loadedmetadata',()=>{if(total)total.textContent=fD(a.duration||m.duration||0);upd()});
 a.addEventListener('ended',()=>{
  btn.textContent='▶';if(fill)fill.style.width='0%';if(thumb)thumb.style.left='0%';if(cur)cur.textContent='0:00';
  wave.forEach(w=>w.classList.remove('played'));
  currentAudio=null;currentAudioBtn=null
 });
 a.play().catch(()=>toast('تعذر التشغيل'))
}
let seekDrag=null;
function setupVoiceSeek(){
 const b=$('#msgs');if(!b||b._vs)return;b._vs=true;
 const onMove=e=>{
  if(!seekDrag)return;
  e.preventDefault();
  const cx=e.touches?.[0]?.clientX??e.clientX??0;
  applySeek(cx)
 };
 const onEnd=()=>{
  if(!seekDrag)return;
  seekDrag.track.classList.remove('dragging');
  const d=seekDrag;seekDrag=null;
  if(d.wasPlaying&&d.audio)d.audio.play().catch(()=>{});
  document.removeEventListener('pointermove',onMove);
  document.removeEventListener('pointerup',onEnd);
  document.removeEventListener('pointercancel',onEnd);
  document.removeEventListener('touchmove',onMove);
  document.removeEventListener('touchend',onEnd);
  document.removeEventListener('mousemove',onMove);
  document.removeEventListener('mouseup',onEnd)
 };
 b.addEventListener('pointerdown',e=>{
  const t=e.target.closest('.voice-track');if(!t)return;
  e.preventDefault();e.stopPropagation();
  const mid=t.dataset.id,m=gm(mid);if(!m?.audio_url)return;
  const row=t.closest('.m');
  const playBtn=row.querySelector('.voice-play');
  if(!(currentAudioBtn===playBtn&&currentAudio)){
   playVoice(playBtn,mid)
  }
  if(!currentAudio)return;
  const a=currentAudio;
  const fill=row.querySelector('.voice-fill');
  const thumb=row.querySelector('.voice-thumb');
  const curT=row.querySelector('.vt-c');
  const wave=row.querySelectorAll('.voice-wave span');
  const rect=t.getBoundingClientRect();
  const wasPlaying=!a.paused;
  if(wasPlaying)try{a.pause()}catch{}
  t.classList.add('dragging');
  seekDrag={track:t,row,audio:a,fill,thumb,curT,wave,rect,wasPlaying};
  const cx=e.clientX??(e.touches?.[0]?.clientX??0);
  applySeek(cx);
  document.addEventListener('pointermove',onMove,{passive:false});
  document.addEventListener('pointerup',onEnd);
  document.addEventListener('pointercancel',onEnd);
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchend',onEnd);
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onEnd)
 },{passive:false});
}
function applySeek(cx){
 if(!seekDrag)return;
 const d=seekDrag;
 const x=cx-d.rect.left;
 const pct=Math.max(0,Math.min(1,x/d.rect.width));
 const dur=d.audio.duration&&isFinite(d.audio.duration)?d.audio.duration:parseFloat(d.row.dataset.duration||0);
 if(d.fill)d.fill.style.width=(pct*100)+'%';
 if(d.thumb)d.thumb.style.left=(pct*100)+'%';
 if(d.curT)d.curT.textContent=fD(pct*dur);
 if(d.wave){const c=Math.floor(pct*d.wave.length);d.wave.forEach((w,i)=>w.classList.toggle('played',i<c))}
 try{d.audio.currentTime=pct*dur}catch{}
}

/* ═══════════════ Group Info ═══════════════ */
async function groupInfo(){
 if(!cur?.is_group)return;
 try{
  const mem=await db('chat_members','chat_id=eq.'+cur.id+'&select=user_id,role');
  const ids=[...new Set(mem.map(m=>m.user_id))];
  const ps=await db('profiles','select=id,name,avatar_url&id=in.('+ids.join(',')+')');
  const pm={};(ps||[]).forEach(p=>pm[p.id]=p);
  const meMem=mem.find(m=>m.user_id===me.id);
  const myRole=meMem?.role||'member';
  const sorted=mem.slice().sort((a,b)=>{const o={owner:0,admin:1,member:2};return(o[a.role]||9)-(o[b.role]||9)});
  let h=`<b style="text-align:center">${esc(cur.group_name)}</b>
  <div style="text-align:center;color:var(--t2);font-size:12.5px;margin-bottom:8px">${mem.length} عضو</div>`;
  h+='<div style="max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:6px">';
  sorted.forEach(m=>{
   const p=pm[m.user_id]||{name:'مستخدم'};
   const self=m.user_id===me.id;
   const role=m.role==='owner'?'👑':m.role==='admin'?'⭐':'';
   h+=`<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--s2);border-radius:12px">
     ${p.avatar_url?`<div class="av" style="width:38px;height:38px;font-size:15px;background-image:url(${esc(p.avatar_url)});background-size:cover"></div>`:`<div class="av" style="width:38px;height:38px;font-size:15px;background:hsl(${hs(p.id)%360} 62% 52%)">${esc((p.name||'؟')[0])}</div>`}
     <div style="flex:1"><b style="font-size:13px">${esc(p.name)}${self?' (أنت)':''}</b> <span style="color:var(--t2);font-size:11px">${role}</span></div>
    </div>`
  });
  h+='</div>';
  const isOwner=myRole==='owner';
  h+=`<button class="btn" data-a="add-members" type="button">➕ إضافة أعضاء</button>`;
  if(!isOwner)h+=`<button class="btn dg" data-a="leave-group" type="button">🚪 مغادرة المجموعة</button>`;
  else h+=`<button class="btn dg" data-a="delete-group" type="button">🗑️ حذف المجموعة</button>`;
  h+=`<button class="btn sec" data-a="close" type="button">إغلاق</button>`;
  sheet(h)
 }catch(e){toast(fe(e))}
}
async function addMembers(){
 try{
  const mem=await db('chat_members','chat_id=eq.'+cur.id+'&select=user_id');
  const ex={};mem.forEach(m=>ex[m.user_id]=1);
  const cs=chats.filter(c=>!c.is_group&&!ex[oth(c)]);
  if(!cs.length)return toast('لا يوجد مستخدمون متاحون');
  const h='<b>إضافة أعضاء</b><div style="max-height:50vh;overflow:auto;display:flex;flex-direction:column;gap:6px">'+cs.map(c=>`<label style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--s2);border-radius:12px"><input type="checkbox" value="${oth(c)}" style="width:20px;height:20px;accent-color:#a855f7"><div style="flex:1">${esc(nm(c))}</div></label>`).join('')+'</div><button class="btn" data-a="confirm-add" type="button">إضافة</button><button class="btn sec" data-a="close" type="button">إلغاء</button>';
  sheet(h)
 }catch(e){toast(fe(e))}
}

/* ═══════════════ Chat Menu ═══════════════ */
function openChatMenu(){
 const cdd=$('#cdd');if(!cdd)return;
 cdd.classList.toggle('on');
 updFavLbl()
}
function closeChatMenu(){const c=$('#cdd');if(c)c.classList.remove('on')}
document.addEventListener('click',e=>{
 if(!e.target.closest('#cdd')&&!e.target.closest('[data-a="cmenu"]'))closeChatMenu()
});

/* ═══════════════ الأحداث (A) ═══════════════ */
const A={
 au:e=>{const l=e.dataset.t=='l';$('#fl').hidden=!l;$('#fr').hidden=l;$$('.tabs button').forEach(b=>b.classList.toggle('on',b==e))},
 li:login,rg:reg,
 tab:e=>go(e.dataset.t),
 open:e=>{closeChatMenu();openChat(e.dataset.id)},
 back:()=>{cur=null;closeChatMenu();go('home')},
 new:()=>sheet(`<b>محادثة جديدة</b><input id="nq" class="inp" dir="ltr" placeholder="@username أو رقم الهاتف"><button class="btn" data-a="mk" type="button">ابدأ المحادثة</button><button class="btn sec" data-a="grp" type="button">إنشاء مجموعة</button><button class="btn sec" data-a="close" type="button">إلغاء</button>`),
 mk:async()=>{
  const v=$('#nq').value.trim().replace(/^@/,'').toLowerCase();if(!v)return;
  try{
   const u=/^\+?[\d\s-]{6,}$/.test(v)?(await rpc('find_user_by_phone',{p_phone:v}))[0]:(await db('profiles','select=id,name,username,avatar_url,last_seen&username=eq.'+encodeURIComponent(v)))[0];
   if(!u)return toast('ما لقيت مستخدم بهالمعلومة');
   if(u.id==me.id)return toast('هذا حسابك 😄');
   P[u.id]=u;
   let c=chats.find(x=>!x.is_group&&oth(x)==u.id);
   if(!c){try{c=(await ins('chats',{user1_id:me.id,user2_id:u.id}))[0];chats.unshift(c)}catch{await loadChats();c=chats.find(x=>!x.is_group&&oth(x)==u.id)}}
   shut();openChat(c.id)
  }catch(x){toast(fe(x))}
 },
 grp:()=>{
  const cs=chats.filter(c=>!c.is_group);
  sheet(`<b>مجموعة جديدة</b><input id="gn" class="inp" placeholder="اسم المجموعة" maxlength="40"><div style="max-height:50vh;overflow:auto">${cs.map(c=>`<label class="ci" style="background:var(--s2);border-radius:12px;margin-bottom:6px">${av(P[oth(c)])}<b class="ci-i">${esc(nm(c))}</b><input type="checkbox" value="${oth(c)}" style="width:22px;height:22px;accent-color:#a855f7"></label>`).join('')||'<p class="em">ابدأ محادثات فردية أولاً.</p>'}</div><button class="btn" data-a="mg" type="button">إنشاء</button><button class="btn sec" data-a="close" type="button">إلغاء</button>`)
 },
 mg:async()=>{
  const n=$('#gn').value.trim(),m=[...$$('.sc input[type=checkbox]:checked')].map(i=>i.value);
  if(n.length<2||!m.length)return toast('اكتب اسماً واختر عضواً');
  try{const id=await rpc('create_group',{p_name:n,p_members:m});shut();await loadChats();openChat(id)}catch(x){toast(fe(x))}
 },
 send:async()=>{
  const i=$('#in'),t=i.value.trim();if(!t||!cur)return;
  try{
   if(edt)await pat('messages','id=eq.'+edt,{text:t});
   else{const b={chat_id:cur.id,sender_id:me.id,text:t,type:'text'};if(rep)b.reply_to=JSON.stringify(rep);await ins('messages',b)}
   i.value='';i.style.height='auto';rep=edt=null;rb();poll(2)
  }catch(e){toast(fe(e))}
 },
 mm:e=>{const id=e.dataset.id;openMM(e)},
 'm-reply':()=>{
  if(!selectedMsg)return;
  const m=gm(selectedMsg.id);
  rep={id:m.id,text:(m.text||'📷 صورة').slice(0,80)};
  edt=null;closeMM();rb();$('#in').focus()
 },
 'm-copy':()=>{
  if(!selectedMsg)return;
  const m=gm(selectedMsg.id);
  if(m?.text){navigator.clipboard?.writeText(m.text).then(()=>toast('تم النسخ ✓')).catch(()=>{})}
  closeMM()
 },
 'm-forward':()=>{
  if(!selectedMsg)return;
  const m=gm(selectedMsg.id);
  const text=m?.text||'';
  closeMM();
  if(!text||!chats.length)return;
  sheet('<b>توجيه إلى…</b>'+chats.filter(c=>c.id!==cur.id).map(c=>`<div class="ci" data-a="fwd" data-id="${c.id}" data-txt="${escJs(text)}" style="background:var(--s2);border-radius:12px;margin-bottom:6px">${c.is_group?'<div class="av">👥</div>':av(P[oth(c)])}<b class="ci-i">${esc(nm(c))}</b></div>`).join('')+'<button class="btn sec" data-a="close" type="button">إلغاء</button>')
 },
 fwd:async e=>{
  const cid=e.dataset.id,txt=e.dataset.txt;
  try{await ins('messages',{chat_id:cid,sender_id:me.id,text:txt,type:'forward'});shut();toast('✓ تم التوجيه')}catch(x){toast(fe(x))}
 },
 'm-edit':()=>{
  if(!selectedMsg)return;
  const m=gm(selectedMsg.id);
  edt=m.id;rep=null;closeMM();rb();
  $('#in').value=m.text||'';$('#in').focus();autoRz($('#in'))
 },
 'm-info':()=>menuInfo(),
 'm-delete':async()=>{
  if(!selectedMsg)return;
  const m=gm(selectedMsg.id);
  closeMM();
  if(m.sender_id===me.id){
   if(!confirm('حذف للجميع؟'))return;
   try{await rpc('delete_message_for_all',{p_message:m.id});poll(2)}catch(e){toast(fe(e))}
  }else{
   if(!confirm('حذف عندي فقط؟'))return;
   try{await ins('message_deletions',{message_id:m.id,user_id:me.id});msgs=msgs.filter(x=>x.id!==m.id);draw(2)}catch(e){toast(fe(e))}
  }
 },
 react:e=>setReact(e.dataset.r),
 rx:()=>{rep=edt=null;$('#in').value='';rb()},
 img:e=>{$('#vw').innerHTML=`<img src="${esc(e.src)}" alt="">`;$('#vw').classList.add('on')},
 play:e=>{e.stopPropagation();playVoice(e,e.dataset.id)},
 seek:()=>{},
 emoji:()=>toggleEmoji(),
 bsp:()=>{const i=$('#in');if(i.value.length){i.value=i.value.slice(0,-1);autoRz(i);i.focus()}},
 ie:e=>insEmoji(e.dataset.e),
 ecat:e=>{$$('#emoji-tabs button').forEach(b=>b.classList.toggle('on',b==e));showEmoji(e.dataset.cat)},
 sticker:e=>sendSticker(e.dataset.e,e.dataset.bg),
 'send-gif':e=>sendGIF(e.dataset.u),
 'close-info':()=>shut(),
 'cancel-rec':()=>{pttCancelled=true;try{voiceRec?.stop()}catch{resetVoice()}toast('تم الإلغاء')},
 'send-rec':()=>{pttCancelled=false;try{voiceRec?.stop()}catch{resetVoice()}},
 cmenu:()=>openChatMenu(),
 'call-v':()=>{closeChatMenu();toast('قريباً')},
 'call-vi':()=>{closeChatMenu();toast('قريباً')},
 'fav-chat':()=>{closeChatMenu();toggleFav()},
 info:()=>{closeChatMenu();if(cur._other||!cur.is_group){const oid=oth(cur);if(P[oid])sheet(`<div class="profile-card"><div class="av xl" style="background:hsl(${hs(oid)%360} 62% 52%)">${esc((P[oid].name||'؟')[0])}</div><div style="font-size:20px;font-weight:900;margin:8px 0 2px">${esc(P[oid].name)}</div><div style="font-size:13px;color:var(--t2);direction:ltr">@${esc(P[oid].username||'')}</div><button class="btn" data-a="close" type="button" style="margin-top:12px">إغلاق</button></div>`)}},
 ginfo:()=>{closeChatMenu();groupInfo()},
 'add-members':()=>addMembers(),
 'confirm-add':async()=>{
  const ids=[...$$('.sc input[type=checkbox]:checked')].map(i=>i.value);
  if(!ids.length)return toast('اختر عضواً');
  try{
   const rows=ids.map(uid=>({chat_id:cur.id,user_id:uid,role:'member'}));
   await ins('chat_members',rows);shut();toast('✓ تمت الإضافة')
  }catch(e){toast(fe(e))}
 },
 'leave-group':async()=>{
  if(!confirm('مغادرة المجموعة؟'))return;
  try{await del('chat_members','chat_id=eq.'+cur.id+'&user_id=eq.'+me.id);shut();go('home')}catch(e){toast(fe(e))}
 },
 'delete-group':async()=>{
  if(!confirm('حذف المجموعة نهائياً؟'))return;
  try{await rpc('delete_group',{p_chat:cur.id});shut();go('home')}catch(e){toast(fe(e))}
 },
 block:async()=>{
  closeChatMenu();
  if(!cur||cur.is_group)return;
  const oid=oth(cur);
  if(!confirm('حظر هذا المستخدم؟'))return;
  try{await ins('blocks',{blocker_id:me.id,blocked_id:oid});toast('تم الحظر')}catch(e){toast(fe(e))}
 },
 blk:async()=>{
  try{
   const a=await db('blocks','blocker_id=eq.'+me.id+'&select=blocked_id');
   if(!a?.length)return sheet('<b>المحظورون</b><p class="em">لا محظورين</p><button class="btn sec" data-a="close" type="button">إغلاق</button>');
   const ids=a.map(b=>b.blocked_id);
   const ps=await db('profiles','select=id,name,avatar_url&id=in.('+ids.join(',')+')');
   sheet('<b>المحظورون</b>'+(ps||[]).map(p=>`<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--s2);border-radius:12px;margin-bottom:6px">${av(p)}<b style="flex:1">${esc(p.name)}</b><button class="btn dg" data-a="unblk" data-id="${p.id}" type="button" style="width:auto;padding:8px 14px;font-size:12px">إلغاء</button></div>`).join('')+'<button class="btn sec" data-a="close" type="button">إغلاق</button>')
  }catch(e){toast(fe(e))}
 },
 unblk:async e=>{
  try{await del('blocks','blocker_id=eq.'+me.id+'&blocked_id=eq.'+e.dataset.id);A.blk()}catch(x){toast(fe(x))}
 },
 qr:()=>myQR(),
 'scan-qr':()=>scanQR(),
 'scan-file':()=>$('#file-qr-scan').click(),
 'copy-qr':()=>{const p=P[me.id];if(p?.username){navigator.clipboard?.writeText('@'+p.username).then(()=>toast('تم النسخ ✓'))}},
 'share-qr':()=>{
  const p=P[me.id];if(!p?.username)return;
  const url=location.origin+location.pathname+'?u='+encodeURIComponent(p.username);
  if(navigator.share)navigator.share({title:'Novira',url}).catch(()=>{});
  else{navigator.clipboard?.writeText(url).then(()=>toast('تم نسخ الرابط'))}
 },
 fav:async()=>{
  if(!favorites.length)return sheet('<b>⭐ المفضلة</b><p class="em">لا مفضلات</p><button class="btn sec" data-a="close" type="button">إغلاق</button>');
  sheet('<b>⭐ المفضلة</b>'+favorites.map(f=>{
   const c=chats.find(x=>x.id===f.target_id);if(!c)return '';
   return `<div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--s2);border-radius:12px;margin-bottom:6px">${c.is_group?'<div class="av">👥</div>':av(P[oth(c)])}<b style="flex:1">${esc(nm(c))}</b><button class="btn dg" data-a="rmfav" data-id="${c.id}" type="button" style="width:auto;padding:8px 12px;font-size:12px">إزالة</button></div>`
  }).join('')+'<button class="btn sec" data-a="close" type="button">إغلاق</button>')
 },
 rmfav:async e=>{
  try{await del('favorites','user_id=eq.'+me.id+'&target_type=eq.chat&target_id=eq.'+e.dataset.id);loadFavs()}catch(x){toast(fe(x))}
 },
 mic:async()=>{
  try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());sheet('<b>🎤 الميكروفون</b><p class="em" style="color:#86efac">✅ الميكروفون يعمل</p><button class="btn sec" data-a="close" type="button">حسناً</button>')}
  catch{sheet('<b>🎤 الميكروفون</b><p class="em" style="color:#fca5a5">❌ فشل الوصول</p><button class="btn sec" data-a="close" type="button">حسناً</button>')}
 },
 edit:()=>{
  const p=P[me.id]||{};
  sheet(`<b>تعديل الملف</b><input id="en" class="inp" placeholder="الاسم" value="${esc(p.name||'')}" maxlength="30"><input id="eu" class="inp" dir="ltr" placeholder="username" value="${esc(p.username||'')}" maxlength="20"><textarea id="eb" class="inp" rows="2" placeholder="نبذة" maxlength="150">${esc(p.bio||'')}</textarea><button class="btn" data-a="save-prof" type="button">حفظ</button><button class="btn sec" data-a="close" type="button">إلغاء</button>`)
 },
 'save-prof':async()=>{
  const n=$('#en').value.trim(),u=$('#eu').value.trim().toLowerCase(),b=$('#eb').value.trim();
  if(n.length<2||!/^[a-z0-9_]{3,20}$/.test(u))return toast('الاسم أو username غير صالح');
  try{await pat('profiles','id=eq.'+me.id,{name:n,username:u,bio:b});Object.assign(P[me.id],{name:n,username:u,bio:b});fillSet();shut();toast('✓ تم الحفظ')}catch(e){toast(/duplicate|unique/i.test(e.message)?'اسم المستخدم محجوز':fe(e))}
 },
 th:()=>{const d=document.documentElement,l=d.dataset.th=='light'?'dark':'light';d.dataset.th=l;try{localStorage.nv_th=l}catch{};const m=document.querySelector('meta[name=theme-color]');if(m)m.content=l=='light'?'#f3f5fb':'#0b0f1a'},
 lo:()=>confirm('تسجيل الخروج؟')&&out(),
 del:async()=>{
  if(prompt('اكتب «حذف» للتأكيد')!=='حذف')return;
  try{await rpc('delete_my_account');out(1);toast('تم حذف الحساب')}catch(e){toast(fe(e))}
 },
 close:()=>shut(),
 sv:async()=>{
  const n=$('#sn').value.trim(),u=$('#su').value.trim().toLowerCase(),b=$('#sb').value.trim();
  if(n.length<2||!/^[a-z0-9_]{3,20}$/.test(u))return toast('الاسم أو username غير صالح');
  try{await pat('profiles','id=eq.'+me.id,{name:n,username:u,bio:b});Object.assign(P[me.id],{name:n,username:u,bio:b});fillSet();toast('✓ تم الحفظ')}catch(e){toast(fe(e))}
 }
};
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-a]');
 if(!a||e.target.closest('a'))return;
 const act=a.dataset.a;
 if(A[act]){A[act](a)}
});

/* ═══════════════ Event Listeners ═══════════════ */
$('#q').oninput=()=>{const h=doSearch($('#q').value);$('#list').innerHTML=h};
$('#in').oninput=function(){autoRz(this)};
$('#in').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&matchMedia('(pointer:fine)').matches){e.preventDefault();A.send()}};
$('#auth').onkeydown=e=>{if(e.key==='Enter')($('#fl').hidden?reg:login)()};
$$('.pill-btn').forEach(b=>b.onclick=()=>switchEP(b.dataset.ep));
$('#fa').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';
 if(!f||!f.type.startsWith('image/')||f.size>5e6)return toast('صورة حتى 5MB');
 try{const u=await up('media',`avatars/${me.id}_${Date.now()}.${ex(f)}`,f);await pat('profiles','id=eq.'+me.id,{avatar_url:u});P[me.id].avatar_url=u;fillSet();toast('✓ تم تحديث الصورة')}catch(x){toast(fe(x))}
};
$('#file-qr-scan').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 if(typeof Html5Qrcode==='undefined')return toast('غير متاح');
 try{
  const sc=new Html5Qrcode('qr-reader-temp',false);
  const text=await sc.scanFile(f,true);
  handleQR(text)
 }catch{toast('لم يتم التعرف')}
};

/* ═══════════════ Settings Fill ═══════════════ */
function fillSet(){
 const p=P[me.id]||{};
 $('#sa').innerHTML=av(p,'xl');
 $('#sph').textContent=p.username?'@'+p.username+' · اضغط الصورة لتغييرها':'اضغط الصورة لتغييرها'
}

/* ═══════════════ Init ═══════════════ */
function ping(){fetch(SB+'/auth/v1/health',{headers:{apikey:KEY}}).then(()=>$('#nc').hidden=true).catch(()=>{$('#nc').textContent='لا يوجد اتصال بالخادم';$('#nc').hidden=false})}
ping();addEventListener('online',ping);
visualViewport?.addEventListener('resize',()=>{if(cur){const b=$('#msgs');b.scrollTop=b.scrollHeight}});

/* ═══════════════ Context Menu Prevention ═══════════════ */
document.addEventListener('contextmenu',e=>{
 if(e.target.closest('input,textarea,a'))return;
 e.preventDefault()
});
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('selectstart',e=>{
 if(e.target.closest('input,textarea'))return;
 e.preventDefault()
});

/* ═══════════════ Long Press Setup ═══════════════ */
setupLongPress();
setupVoiceSeek();
setupPTT();

/* ═══════════════ Start ═══════════════ */
S?boot():show('auth');