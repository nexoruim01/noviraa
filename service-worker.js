const CACHE='novira-v1';
const ASSETS=['/noviraa/','/noviraa/index.html'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=e.request.url;
  if(u.includes('supabase.co')||u.includes('giphy.com')||u.includes('googleapis.com')||u.includes('jsdelivr.net')||u.includes('unpkg.com'))return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    if(r.status===200&&e.request.url.startsWith(self.location.origin)){
      const cl=r.clone();
      caches.open(CACHE).then(cc=>cc.put(e.request,cl));
    }
    return r;
  }).catch(()=>caches.match('/noviraa/index.html'))));
});