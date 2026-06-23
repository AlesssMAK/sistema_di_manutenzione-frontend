// MMS push service worker. Receives Web Push events and shows OS
// notifications even when no tab is focused; clicking one focuses an
// existing tab on the target URL or opens a new one.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'MMS', body: event.data.text() };
  }

  const { title = 'MMS', body = '', url = '/', tag } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an already-open tab on the target if there is one.
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise focus any open tab and navigate it, or open fresh.
        if (clientList.length > 0 && 'navigate' in clientList[0]) {
          return clientList[0].focus().then((c) => c.navigate(targetUrl));
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
