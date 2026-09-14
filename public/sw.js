// CareerPilot AI — Background Service Worker
// Handles Offline Web Push Notifications & Deep Links

const CACHE_NAME = 'careerpilot-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification receiver
self.addEventListener('push', (event) => {
  let data = {
    title: 'CareerPilot AI — Daily Intelligence',
    body: 'New market realities, upcoming hackathons, and roadmap milestones are ready.',
    url: '/market',
    tag: 'careerpilot-daily-intel',
    badge: '/favicon.ico',
    icon: '/favicon.ico',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: {
      url: data.url || '/market',
    },
    tag: data.tag || 'careerpilot-intel',
    renotify: true,
    requireInteraction: false,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event: opens or focuses the specific page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/market';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's already an open tab on the same origin, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
