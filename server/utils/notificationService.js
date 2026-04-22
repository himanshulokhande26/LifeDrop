const admin = require("firebase-admin");
const axios = require("axios");

/**
 * notifyEligibleDonors
 * ---------------------
 * Loops through matched donors and sends a notification to each one using
 * a two-tier fallback strategy:
 *
 *   TIER 1 (Primary): Firebase Cloud Messaging (FCM) Web Push
 *     → Requires the donor's browser to have granted push permission and
 *       provided an FCM token saved in their User document.
 *
 *   TIER 2 (Fallback): Fast2SMS SMS
 *     → If FCM fails (no token, expired token, network error), we catch
 *       the error and send an SMS to the donor's hidden phone number via
 *       the Fast2SMS REST API.
 *
 * @param {Array}  donorsArray    - Array of matched User documents from $geoNear
 * @param {Object} requestDetails - Summary of the EmergencyRequest for the message body
 */
const notifyEligibleDonors = async (donorsArray, requestDetails) => {
  const { requestId, patientName, requiredBloodGroup, hospitalName, urgencyLevel } = requestDetails;

  // Build a human-readable message used in both push and SMS
  const notificationTitle = `🩸 ${urgencyLevel} Blood Request — ${requiredBloodGroup}`;
  const notificationBody = `${hospitalName} urgently needs ${requiredBloodGroup} blood for ${patientName}. Can you help?`;

  // Iterate over every matched donor — notifications are fire-and-forget
  const notificationPromises = donorsArray.map(async (donor) => {
    const donorLabel = `${donor.name} (${donor._id})`;

    // -----------------------------------------------------------------------
    // TIER 1: Firebase Cloud Messaging (FCM) Web Push Notification
    // -----------------------------------------------------------------------
    try {
      if (!donor.fcmToken) {
        // No FCM token registered — jump straight to SMS fallback
        throw new Error(`No FCM token for donor ${donorLabel}`);
      }

      const fcmMessage = {
        token: donor.fcmToken,
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          // Attach metadata so the PWA can deep-link to the accept page
          requestId: requestId.toString(),
          requiredBloodGroup,
          hospitalName,
        },
        webpush: {
          fcmOptions: {
            link: `/requests/${requestId}`, // Deep-link in the browser notification
          },
        },
      };

      await admin.messaging().send(fcmMessage);
      console.log(`📲 FCM push sent to: ${donorLabel}`);
    } catch (fcmError) {
      // -----------------------------------------------------------------------
      // TIER 2: Fast2SMS SMS Fallback
      // -----------------------------------------------------------------------
      console.warn(`⚠️  FCM failed for ${donorLabel}: ${fcmError.message}. Falling back to SMS...`);

      try {
        if (!donor.hiddenPhoneNumber) {
          console.error(`❌ No phone number found for ${donorLabel}. Skipping.`);
          return; // Nothing we can do
        }

        const smsMessage =
          `LifeDrop Alert: ${urgencyLevel} blood request!\n` +
          `Blood Group: ${requiredBloodGroup}\n` +
          `Hospital: ${hospitalName}\n` +
          `Patient: ${patientName}\n` +
          `Open the app to accept: https://lifedrop.app/requests/${requestId}`;

        await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          {
            route: "q",           // Transactional / quick SMS route
            message: smsMessage,
            language: "english",
            flash: 0,
            numbers: donor.hiddenPhoneNumber, // 10-digit Indian mobile number
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`📱 SMS fallback sent to donor: ${donorLabel}`);
      } catch (smsError) {
        // Both channels failed — log but don't crash the process
        console.error(
          `❌ SMS fallback also failed for ${donorLabel}: ${smsError.response?.data || smsError.message}`
        );
      }
    }
  });

  // Wait for all notification attempts to settle
  await Promise.allSettled(notificationPromises);
};

module.exports = { notifyEligibleDonors };
