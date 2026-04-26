# LifeDrop — Project Documentation

This document serves as the central source of truth for the LifeDrop application, detailing its requirements, architecture, technical choices, and current development status.

---

## 1. Product Requirements Document (PRD)

### **Product Overview**
LifeDrop is a hyper-local, privacy-first emergency blood donor matching platform. It connects patients in critical need of blood with willing donors in their immediate vicinity in real-time.

### **Problem Statement**
When emergency blood is needed, broadcasting requests on social media is often inefficient and exposes the patient's or family's contact information to the public, leading to spam. Furthermore, it's difficult to target only the people who are geographically close enough to help immediately.

### **Solution**
LifeDrop uses geospatial matching and push notifications to alert nearby donors of the correct blood group. It employs a "Double-Blind" privacy architecture where the patient's contact number is kept completely hidden until a donor explicitly accepts the request.

### **Key Features**
*   **Geospatial Matching:** Uses GPS coordinates to match donors within a specific radius (5km, 10km, 25km).
*   **Double-Blind Privacy:** Patient contact info is locked. It is only revealed to a donor after they commit to donating.
*   **Instant Push Alerts:** Real-time browser push notifications (via FCM) alert donors immediately.
*   **SMS Fallback:** If push notifications fail or are unavailable, the system falls back to SMS alerts.
*   **Auto-Expiry:** Unfulfilled requests automatically expire after 24 hours to keep the feed relevant.
*   **Interactive Map:** Donors can view nearby requests on a map or as a list.
*   **Donor Availability Toggle:** Donors can temporarily mark themselves as unavailable to stop receiving alerts.

---

## 2. Application Flow

The core loop of the application involves two primary actors: the **Requester** and the **Donor**.

### **A. Registration Flow (Donor)**
1.  User lands on the application (`/`).
2.  Navigates to the Auth page (`/auth`) and selects "Register".
3.  User inputs Name, Blood Group, Phone Number (used as ID), and Password.
4.  User grants Geolocation permission. The browser captures their coordinates.
5.  Backend creates a new User document with a GeoJSON `Point` for location.
6.  User is redirected to the Dashboard (`/dashboard`).
7.  Dashboard prompts the user to enable Push Notifications. Upon acceptance, the FCM token is saved to their profile.

### **B. Emergency Request Flow**
1.  A requester fills out the Emergency Request Form (Patient Name, Blood Group needed, Hospital Name, Urgency, Contact Number, and Location).
2.  Backend saves the `EmergencyRequest`. The `contactPhone` field is stored securely and excluded from normal queries (`select: false`).
3.  Backend executes a MongoDB `$geoNear` aggregation to find `Users` where:
    *   `bloodGroup` matches the requirement (or is a universal match).
    *   `isAvailable` is true.
    *   Distance is within 10km (default alert radius).
4.  Backend triggers the Notification Service:
    *   Attempts to send FCM Push Notifications to the matched donors' devices.
    *   (Optional/Fallback) Sends an SMS via Fast2SMS.

### **C. Donor Acceptance Flow (Double-Blind)**
1.  Donor receives a push notification and taps it, or opens their Dashboard.
2.  Dashboard fetches `/api/requests/nearby`, returning pending requests without contact numbers.
3.  Donor views the request on the List or Map and clicks "I Can Donate" (Accept).
4.  Backend verifies the request, updates status to `Accepted`, and sets `acceptedBy` to the donor's ID.
5.  Backend returns the *single* response containing the patient's `contactPhone`.
6.  Frontend displays a "Contact Reveal Modal" showing the phone number to the donor.

---

## 3. Tech Stack

LifeDrop utilizes a modern MERN stack tailored for real-time capabilities and geospatial queries.

### **Frontend (Client)**
*   **Framework:** React 18 (via Vite for fast bundling)
*   **Styling:** Tailwind CSS (Custom Dark Theme, minimal industry-standard UI)
*   **Routing:** React Router DOM v6
*   **HTTP Client:** Axios (configured with JWT interceptors)
*   **Maps:** Leaflet.js & React-Leaflet (CartoDB Dark Matter tiles)
*   **Push Notifications:** Firebase Client SDK (Web Push) + Custom Service Worker

### **Backend (Server)**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB Atlas (Cloud Database)
*   **ODM:** Mongoose (using `2dsphere` indexes)
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs
*   **Push Notifications:** Firebase Admin SDK
*   **SMS Service:** Fast2SMS API
*   **Background Jobs:** `node-cron` (Hourly auto-expiry)

---

## 4. Backend Schema Architecture

The database relies heavily on MongoDB's GeoJSON support.

### **User Collection (`users`)**
Represents registered blood donors.
*   `name`: String, required
*   `bloodGroup`: String, required (Enum: A+, A-, B+, etc.)
*   `phoneNumber`: String, required, unique
*   `password`: String (bcrypt hashed)
*   `location`: **GeoJSON Point**
    *   `type`: "Point"
    *   `coordinates`: [longitude, latitude] *(Indexed with `2dsphere`)*
*   `isAvailable`: Boolean, default: true
*   `fcmToken`: String (for push notifications)

### **Emergency Request Collection (`emergencyrequests`)**
Represents a specific need for blood.
*   `patientName`: String, required
*   `requiredBloodGroup`: String, required
*   `hospitalName`: String, required
*   `location`: **GeoJSON Point**
    *   `type`: "Point"
    *   `coordinates`: [longitude, latitude] *(Indexed with `2dsphere`)*
*   `contactPhone`: String, required, **`select: false`** (Crucial for Double-Blind privacy)
*   `urgencyLevel`: String (Enum: Critical, High, Medium, Low)
*   `status`: String (Enum: Pending, Accepted, Expired), default: Pending
*   `acceptedBy`: ObjectId (ref: 'User')
*   `expiresAt`: Date (Set to 24 hours from creation)

---

## 5. Current Project Status

**Overall Status: Phase 8 Completed (90% Ready)**

The application is fully functional in a development environment. The core logic, user interfaces, database connectivity, and third-party integrations (Firebase) are successfully implemented and tested.

### **Completed Phases:**
*   ✅ **Phase 0-4:** Scaffolding, Schemas, Geospatial Controllers, Cron Jobs, SMS Fallback.
*   ✅ **Phase 5:** JWT Authentication System.
*   ✅ **Phase 6:** Donor Dashboard, Nearby Feed (`$geoNear`), Double-Blind Reveal Modal.
*   ✅ **Phase 7:** FCM Web Push Integration (Service Worker, Token management).
*   ✅ **Phase 8:** Interactive Leaflet Map Integration & UI Overhaul (Minimalist Dark Theme, Landing Page).

### **Pending / Next Steps (Phase 9 - Deployment):**
The final phase involves taking the application live.
1.  **Backend Deployment:** Deploy the Express server to a hosting provider (e.g., Render).
2.  **Frontend Deployment:** Deploy the React app to a static host (e.g., Vercel).
3.  **Environment Configuration:** Setup production environment variables (`MONGODB_URI`, Firebase keys, etc.) on the deployment platforms.
4.  **CORS Update:** Update backend CORS settings to accept requests from the deployed frontend URL.
