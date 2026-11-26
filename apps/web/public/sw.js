// Service worker de baja: reemplaza al de CodeDesk (vite-plugin-pwa, /sw.js).
// Los navegadores que tienen instalado el de CodeDesk detectan este archivo nuevo,
// lo activan, borran el caché offline, se desregistran y recargan las pestañas abiertas.
// El Panel Duwoh no registra ningún service worker; este archivo solo existe para limpiar.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) client.navigate(client.url);
    })(),
  );
});
