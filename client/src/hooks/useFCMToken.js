import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "../firebase";
import axiosInstance from "../api/axiosInstance";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * useFCMToken
 * -----------
 * Custom hook that handles the full FCM Web Push lifecycle:
 *
 *   1. Checks browser support for push notifications
 *   2. Requests Notification permission from the user
 *   3. Retrieves the FCM registration token using the VAPID key
 *   4. Saves the token to the backend (PATCH /api/auth/fcm-token)
 *   5. Sets up a foreground message listener for in-app toasts
 *
 * Returns:
 *   { token, permission, loading, error, requestPermission, foregroundMessage }
 */
const useFCMToken = () => {
  const [token,              setToken]              = useState(null);
  const [permission,         setPermission]         = useState(Notification?.permission || "default");
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState(null);
  const [foregroundMessage,  setForegroundMessage]  = useState(null);

  // ---------------------------------------------------------------------------
  // Save token to backend so server can target this device with FCM
  // ---------------------------------------------------------------------------
  const saveTokenToBackend = useCallback(async (fcmToken) => {
    try {
      await axiosInstance.patch("/auth/fcm-token", { fcmToken });
      console.log("✅ FCM token saved to backend.");
    } catch (err) {
      console.warn("⚠️  Failed to save FCM token to backend:", err.message);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Request notification permission + get FCM token
  // ---------------------------------------------------------------------------
  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Request browser permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Notification permission denied. You won't receive push alerts.");
        setLoading(false);
        return;
      }

      // 2. Get Firebase Messaging instance (null if unsupported)
      const messaging = await getMessagingInstance();
      if (!messaging) {
        setError("Push notifications are not supported in this browser.");
        setLoading(false);
        return;
      }

      // 3. Get FCM registration token
      //    The service worker (firebase-messaging-sw.js) must be registered
      //    at the root for this to work.
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.ready,
      });

      if (!fcmToken) {
        setError("Failed to get push token. Check your VAPID key.");
        setLoading(false);
        return;
      }

      setToken(fcmToken);
      console.log("🔔 FCM Token obtained:", fcmToken.substring(0, 20) + "...");

      // 4. Save token to backend
      await saveTokenToBackend(fcmToken);

      // 5. Listen for foreground messages (app is open)
      onMessage(messaging, (payload) => {
        console.log("📩 Foreground FCM message:", payload);
        setForegroundMessage({
          title: payload.notification?.title || "LifeDrop Alert",
          body:  payload.notification?.body  || "",
          data:  payload.data,
        });
      });

    } catch (err) {
      console.error("useFCMToken error:", err);
      setError(err.message || "Failed to set up push notifications.");
    } finally {
      setLoading(false);
    }
  }, [saveTokenToBackend]);

  // ---------------------------------------------------------------------------
  // Auto-request if permission was already granted in a previous session
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (Notification?.permission === "granted") {
      requestPermission();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    token,
    permission,
    loading,
    error,
    foregroundMessage,
    requestPermission,
    clearForegroundMessage: () => setForegroundMessage(null),
  };
};

export default useFCMToken;
