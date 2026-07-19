// Kill-switch service worker: replaces the stale one, clears every cache,
// unregisters itself, and reloads clients onto the live network.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try{
      const keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }catch(err){}
    try{ await self.registration.unregister(); }catch(err){}
    try{
      const cs = await self.clients.matchAll({ type: 'window' });
      cs.forEach(function(c){ c.navigate(c.url); });
    }catch(err){}
  })());
});
