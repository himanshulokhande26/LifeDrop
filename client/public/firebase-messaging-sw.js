/**
 * firebase-messaging-sw.js
 * ========================
 * Firebase Cloud Messaging Service Worker — handles BACKGROUND push notifications.
 * This file MUST be served from the root path (/firebase-messaging-sw.js).
 * In Vite, placing it in the `public/` folder achieves this automatically.
 *
 * This worker runs even when the browser tab is closed/hidden.
 *
 * IMPORTANT: Do NOT use ES module imports here (no `import`).
 *            Service Workers use importScripts() with the compat SDK.
 */

// Import Firebase compat SDK (required for service workers)
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ---------------------------------------------------------------------------
// Initialize Firebase inside the Service Worker
// NOTE: These values are duplicated here because service workers cannot
//       access Vite env variables. This is expected and safe — these are
//       public client-side keys.
// ---------------------------------------------------------------------------
firebase.initializeApp({
  apiKey:            "AIzaSyA6BiQA2iw6NGqcfDbofn7KTYjhp6TtTec",
  authDomain:        "lifedrop-d0bf5.firebaseapp.com",
  projectId:         "lifedrop-d0bf5",
  storageBucket:     "lifedrop-d0bf5.firebasestorage.app",
  messagingSenderId: "161526762793",
  appId:             "1:161526762793:web:15400141b559e1bed4bb38",
});

const messaging = firebase.messaging();

// ---------------------------------------------------------------------------
// Background message handler
// Fires when a push notification arrives and the app is NOT in the foreground.
// ---------------------------------------------------------------------------
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background FCM message received:", payload);

  const title = payload.notification?.title || "LifeDrop Alert 🩸";
  const body  = payload.notification?.body  || "A new blood request needs your help!";
  const icon  = "/lifedrop-icon.png"; // Place this in /public/
  const badge = "/lifedrop-badge.png";

  const notificationOptions = {
    body,
    icon,
    badge,
    tag:     "lifedrop-request",    // Replaces previous notification of same tag
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.requestId
        ? `/dashboard`
        : "/dashboard",
    },
  };

  self.registration.showNotification(title, notificationOptions);
});

// ---------------------------------------------------------------------------
// Notification click handler — opens/focuses the app when user taps the notif
// ---------------------------------------------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If app tab is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
