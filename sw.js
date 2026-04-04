const CACHE_NAME = 'fcpc-analyzer-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// インストール時に全アセットをキャッシュ（1つでも失敗したら中断）
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除してすぐに制御を取得
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache First: キャッシュ優先、なければネットワーク
self.addEventListener('fetch', (e) => {
  // GETリクエストのみ対象
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // キャッシュになければネットワーク取得してキャッシュにも保存
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
