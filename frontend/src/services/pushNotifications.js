// ============================================================
// PUSH NOTIFICATION SERVICE
// File: frontend/src/services/pushNotifications.js
// ============================================================

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}

// ─── Register Service Worker ──────────────────────────────────
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// ─── Request Push Permission & Subscribe ─────────────────────
export const subscribeToPush = async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications');
    return null;
  }

  // Ask user for permission
  const permission = await Notification.requestPermission();

  if (permission === 'denied') {
    alert('Notifications blocked. Please enable them in your browser settings:\nClick the lock icon in the address bar → Notifications → Allow');
    return null;
  }

  if (permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    console.log('✅ Push subscription created');
    return subscription;
  } catch (error) {
    console.error('❌ Push subscription failed:', error);
    return null;
  }
};

// ─── Send Subscription to Backend ────────────────────────────
export const savePushSubscription = async (subscription) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.REACT_APP_API_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });
    const data = await res.json();
    console.log('✅ Subscription saved to server:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to save subscription:', error);
  }
};

// ─── Unsubscribe ─────────────────────────────────────────────
export const unsubscribeFromPush = async () => {
  try {
    const registration   = await navigator.serviceWorker.ready;
    const subscription   = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push');
    }
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error);
  }
};

// ─── Check if Notifications Enabled ──────────────────────────
export const getNotificationStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
};

// ─── Show Local Notification (when app is open) ──────────────
export const showLocalNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon:    '/logo192.png',
        badge:   '/logo192.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  }
};

// ─── Initialize Everything on App Start ──────────────────────
export const initNotifications = async () => {
  const sw = await registerServiceWorker();
  if (!sw) return { supported: false };

  const status = getNotificationStatus();

  return {
    supported: true,
    permission: status,
    subscribe: async () => {
      const sub = await subscribeToPush();
      if (sub) await savePushSubscription(sub);
      return sub;
    },
  };
};
