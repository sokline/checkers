// Service Worker для офлайн-работы приложения "Шашки"
const CACHE_NAME = 'checkers-v1.1';

// Список файлов для кэширования
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Установка: кэшируем все файлы
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('[SW] Cache failed:', err);
      })
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов: Cache-First стратегия
self.addEventListener('fetch', event => {
  // Обрабатываем только GET-запросы
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Если есть в кэше — возвращаем из кэша
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Если нет в кэше — идём в сеть
        return fetch(event.request)
          .then(networkResponse => {
            // Не кэшируем неудачные ответы
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Кэшируем успешный ответ
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            // Если сеть недоступна и нет в кэше — возвращаем главную страницу
            if (event.request.mode === 'navigate') {
              return caches.match('./');
            }
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});
