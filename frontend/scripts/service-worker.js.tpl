const CACHE='ruang-seduh-__VERSION__';
const CATALOG=CACHE+'-catalog';
const ASSETS=/*__PRECACHE__*/;
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ruang-seduh-')&&key!==CACHE&&key!==CATALOG).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
 if(url.pathname==='/api/menu'||url.pathname==='/api/categories'){
  event.respondWith((async()=>{const cache=await caches.open(CATALOG);try{const response=await fetch(request);if(response.ok){const headers=new Headers(response.headers);headers.set('X-Cached-At',String(Date.now()));await cache.put(request,new Response(await response.clone().blob(),{status:response.status,headers}));}return response;}catch{const cached=await cache.match(request);if(cached&&Date.now()-Number(cached.headers.get('X-Cached-At'))<60000)return cached;return new Response(JSON.stringify({success:false,message:'OFFLINE'}),{status:503,headers:{'Content-Type':'application/json'}});}})());return;
 }
 // Order, payment, auth, admin and every other API response are never cached.
 if(url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await caches.match('/offline.html')??new Response('Offline',{status:503})));return;}
 if(url.origin===self.location.origin&&ASSETS.includes(url.pathname))event.respondWith(caches.match(request).then(cached=>cached??fetch(request)));
});
