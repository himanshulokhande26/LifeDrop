import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import app from "../firebase";

const getAuthInstance = () => {
  const auth = getAuth(app);
  auth.languageCode = "en";
  return auth;
};

const toIndianE164 = (phoneNumber = "") => `+91${phoneNumber.replace(/\D/g, "").slice(-10)}`;

const getRecaptchaVerifier = (containerId) => {
  const auth = getAuthInstance();
  const key = `lifeDropRecaptcha_${containerId}`;

  if (!window[key]) {
    window[key] = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }

  return window[key];
};

export const sendFirebasePhoneOtp = async (phoneNumber, containerId) => {
  const auth = getAuthInstance();
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, toIndianE164(phoneNumber), verifier);
};

export const verifyFirebasePhoneOtp = async (confirmationResult, otp) => {
  const auth = getAuthInstance();
  const result = await confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();
  await signOut(auth);
  return idToken;
};
