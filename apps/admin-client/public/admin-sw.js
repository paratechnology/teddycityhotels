const CACHE_NAME = 'teddy-admin-v1';
const CORE_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCwShBighealpfWc-pw1btYRU7YVmZhl-g",
  authDomain: "teddycityhotels1.firebaseapp.com",
  projectId: "teddycityhotels1",
  storageBucket: "teddycityhotels1.firebasestorage.app",
  messagingSenderId: "207712314730",
  appId: "1:207712314730:web:8acc41a666daf9d7183113",
  measurementId: "G-RS8VYMEETB"
};

const isConfigured = Object.values(firebaseConfig).every(
  (value) => value && !String(value).startsWith('__')
);

if (isConfigured) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Teddy City Admin';
    const body = payload.notification?.body || 'You have a new notification.';
    const link = payload.data?.link || '/notifications';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.webp',
      data: { link },
      badge: '/icons/icon-96.webp',
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.link || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('navigate' in client) {
          client.navigate(target);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(target);
      }

      return undefined;
    })
  );
});
