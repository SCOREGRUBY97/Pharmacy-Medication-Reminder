// ============================================================
// SERVICE WORKER — MediCare Push Notifications
// File: frontend/public/sw.js
// This runs in background even when website is closed!
// ============================================================

const CACHE_NAME = 'medicare-v1';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('MediCare Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('MediCare Service Worker activated');
  event.waitUntil(clients.claim());
});

// ─── Handle Push Notifications ───────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'MediCare Reminder', body: event.data ? event.data.text() : 'Time to take your medication!' };
  }

  const title   = data.title   || '💊 MediCare Reminder';
  const options = {
    body:    data.body    || 'Time to take your medication!',
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag:     data.tag     || 'medication-reminder',
    renotify: true,
    requireInteraction: true,   // stays on screen until user acts
    data: {
      url:          data.url          || '/',
      reminderId:   data.reminderId   || null,
      medicationName: data.medicationName || '',
    },
    actions: [
      { action: 'taken',  title: '✅ Mark Taken' },
      { action: 'snooze', title: '⏰ Snooze 10min' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Handle Notification Clicks ──────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action       = event.action;
  const data         = notification.data || {};

  notification.close();

  if (action === 'taken' && data.reminderId) {
    // Mark as taken via API
    event.waitUntil(
      fetch(`${self.registration.scope}api/reminders/${data.reminderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token || ''}`,
        },
        body: JSON.stringify({ status: 'taken' }),
      }).then(() => {
        return clients.openWindow(data.url || '/');
      })
    );
  } else if (action === 'snooze') {
    // Snooze — show again in 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification('⏰ Snoozed Reminder', {
            body: `Don't forget: ${data.medicationName}!`,
            icon: '/logo192.png',
            requireInteraction: true,
          });
          resolve();
        }, 10 * 60 * 1000);
      })
    );
  } else {
    // Open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(data.url || '/');
      })
    );
  }
});

// ─── Background Sync (offline support) ───────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-medications') {
    event.waitUntil(syncMedications());
  }
});

async function syncMedications() {
  console.log('Background sync: medications');
}
