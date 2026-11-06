// Service Worker для офлайн-работы приложения "Шашки"
const CACHE_VERSION = 'checkers-v1.1';

self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  // Удаляем старые кэши
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Обрабатываем только GET-запросы
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Сначала пытаемся взять из кэша
      if (cached) return cached;
      
      // Если нет в кэше — идём в сеть
      return fetch(event.request).then(response => {
        // Не кэшируем неудачные ответы
        if (!response || response.status !== 200) return response;
        
        // Кэшируем успешный ответ
        const clone = response.clone();
        caches.open(CACHE_VERSION).then(cache => {
          cache.put(event.request, clone);
        });
        
        return response;
      }).catch(() => {
        // Если сеть недоступна и нет в кэше — возвращаем главную страницу
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
