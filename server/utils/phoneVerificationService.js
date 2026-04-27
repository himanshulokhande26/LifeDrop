const admin = require("firebase-admin");

const normalizePhoneNumber = (phoneNumber = "") => phoneNumber.replace(/\D/g, "").slice(-10);

const verifyFirebasePhoneToken = async (idToken, phoneNumber) => {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin SDK is not initialized.");
  }

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const verifiedPhoneNumber = normalizePhoneNumber(decodedToken.phone_number);

  return (
    decodedToken.firebase?.sign_in_provider === "phone" &&
    verifiedPhoneNumber === normalizedPhoneNumber
  );
};

module.exports = {
  normalizePhoneNumber,
  verifyFirebasePhoneToken,
};
