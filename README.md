<div align="center">

<img src="https://img.shields.io/badge/LifeDrop-Emergency%20Blood%20Donor%20Network-dc2626?style=for-the-badge&logo=heart&logoColor=white" alt="LifeDrop Banner"/>

# 🩸 LifeDrop

### Hyper-Local · Privacy-First · Emergency Blood Donor Matching

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📖 About

**LifeDrop** is a full-stack MERN web application that connects patients in need of emergency blood with nearby willing donors — in real time, without ever exposing private contact information publicly.

Built as an engineering project, LifeDrop demonstrates:
- **Geospatial matching** using MongoDB `$geoNear` aggregation
- **Double-Blind Privacy** — phone numbers are only revealed after a donor accepts
- **Fallback notifications** — Firebase Cloud Messaging (Web Push) with Fast2SMS as a backup
- **Auto-expiry** — requests older than 24 hours are automatically closed via a cron job

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth System** | JWT-based register/login with bcrypt password hashing |
| 📱 **Phone Verification** | Firebase Phone Auth (OTP) required for donors and requesters to prevent spam |
| 📍 **Geospatial Matching** | Finds donors within a configurable radius (5/10/25 km) using MongoDB 2dsphere indexes |
| 🙈 **Double-Blind Privacy** | Patient's phone number is hidden until a donor explicitly accepts |
| 🔔 **Push Notifications** | Firebase Cloud Messaging (FCM) Web Push with Fast2SMS SMS fallback |
| ⏰ **Auto-Expiry** | `node-cron` job expires Pending requests after 24 hours |
| 🗺️ **Interactive Map** | Leaflet.js dark map with urgency-colored pins and radius overlay |
| 📋 **Donor Dashboard** | Live request feed with List/Map toggle and availability toggle |
| 📡 **Service Worker** | Background push notifications even when the browser tab is closed |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite) — UI framework
- **Tailwind CSS** — Utility-first styling with custom dark theme
- **React Router DOM** — Client-side routing
- **Axios** — HTTP client with JWT interceptors
- **Leaflet.js / React-Leaflet** — Interactive geospatial map
- **Firebase JS SDK** — Web Push notifications & Phone Auth (Recaptcha/OTP)

### Backend
- **Node.js + Express.js** — REST API server
- **MongoDB + Mongoose** — Database with geospatial indexing
- **Firebase Admin SDK** — Server-side FCM push notifications & Auth Token verification
- **Fast2SMS** — SMS fallback notifications
- **node-cron** — Scheduled auto-expiry jobs
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication

---

## 🏗️ Project Structure

```
LifeDrop/
├── client/                          # React (Vite) Frontend
│   ├── public/
│   │   └── firebase-messaging-sw.js # FCM Service Worker
│   └── src/
│       ├── api/axiosInstance.js     # Pre-configured Axios + auth interceptor
│       ├── components/
│       │   ├── CreateRequestForm.jsx # Emergency blood request form
│       │   ├── MapView.jsx           # Leaflet interactive map
│       │   ├── ProtectedRoute.jsx    # JWT route guard
│       │   └── RequestCard.jsx       # Feed card with urgency badge
│       ├── context/AuthContext.jsx   # Global auth state (React Context)
│       ├── hooks/useFCMToken.js      # FCM permission + token hook
│       ├── pages/
│       │   ├── AuthPage.jsx          # Login / Register
│       │   └── DonorDashboard.jsx    # Main donor view
│       ├── firebase.js               # Firebase client initialization
│       └── App.jsx                   # Router + AuthProvider
│
└── server/                           # Node.js + Express Backend
    ├── config/db.js                  # MongoDB connection
    ├── controllers/
    │   ├── authController.js         # register/login/getMe/fcmToken
    │   ├── donorController.js        # getNearbyRequests ($geoNear)
    │   └── requestController.js      # createRequest/acceptRequest
    ├── middleware/
    │   ├── authMiddleware.js         # JWT verification
    │   └── errorHandler.js           # Global error handler
    ├── models/
    │   ├── User.js                   # User schema (GeoJSON + 2dsphere)
    │   └── EmergencyRequest.js       # Request schema (lifecycle + privacy)
    ├── routes/
    │   ├── authRoutes.js             # /api/auth/*
    │   └── requestRoutes.js          # /api/requests/*
    ├── utils/
    │   ├── cronJobs.js               # Hourly 24h auto-expiry
    │   └── notificationService.js    # FCM → Fast2SMS fallback
    └── index.js                      # Server entry point
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Firebase project with Cloud Messaging enabled

### 1. Clone the repo
```bash
git clone https://github.com/himanshulokhande26/LifeDrop.git
cd LifeDrop
```

### 2. Setup the Backend
```bash
cd server
npm install
cp .env.example .env   # Fill in your values (see below)
npm run dev            # Starts on http://localhost:5000
```

### 3. Setup the Frontend
```bash
cd client
npm install
cp .env.example .env   # Fill in your values (see below)
npm run dev            # Starts on http://localhost:5173
```

---

## 🔑 Environment Variables

### `server/.env`
```env
MONGODB_URI=mongodb://...          # MongoDB Atlas connection string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
FAST2SMS_API_KEY=your_key
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

> ⚠️ **Never commit `.env` files or `serviceAccountKey.json` to version control.**

---

## 🔌 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register new donor |
| POST | `/login` | ❌ | Login, returns JWT |
| GET | `/me` | ✅ | Get current user profile |
| PATCH | `/availability` | ✅ | Toggle donor availability |
| PATCH | `/fcm-token` | ✅ | Save FCM push token |

### Request Routes — `/api/requests`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create` | ❌ | Create emergency blood request |
| GET | `/nearby` | ✅ | Get Pending requests near donor |
| PUT | `/accept/:id` | ✅ | Accept request (reveals patient phone) |

---

## 🔒 Privacy Architecture

```
Patient creates request
        │
        ▼
contactPhone stored with select:false  ← NEVER returned in normal queries
        │
        ▼
Donor sees: Blood group, Hospital, Urgency, Distance
        │
        ▼
Donor clicks "I Can Donate"
        │
        ▼
Status → "Accepted"  +  acceptedBy = donorId
        │
        ▼
contactPhone returned ONCE in this response only  ← Double-Blind Reveal
```

---

## 📬 Notification Flow

```
New request created
        │
  $geoNear finds donors within 10km with matching blood group
        │
        ▼
  For each donor:
        │
        ├── Try: FCM Web Push (firebase-admin)
        │         ↓ success → browser notification delivered
        │
        └── Catch: SMS via Fast2SMS API (fallback)
                  ↓ success → SMS delivered to hiddenPhoneNumber
```

---

## 🕐 Background Jobs

| Job | Schedule | Action |
|---|---|---|
| Auto-Expiry | Every hour (`0 * * * *`) | Sets status → `Expired` for Pending requests older than 24h |

---

## 🗺️ Map Features

- **Dark CartoDB tiles** — matches app's dark theme
- **Urgency-colored pins** — 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- **Pulsing donor dot** — shows your location with animated radar ring
- **Search radius circle** — dashed blue overlay for 5/10/25 km range
- **Rich popups** — blood group, hospital, distance, and Accept button on map

---

## 🚀 Deployment

| Service | Platform |
|---|---|
| Backend API | [Render](https://render.com) |
| Frontend | [Vercel](https://vercel.com) |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |
| Notifications | [Firebase Cloud Messaging](https://firebase.google.com) |

---

## 📸 Screenshots

> _Coming soon after deployment_

---

## 👨‍💻 Author

**Himanshu Lokhande**
- GitHub: [@himanshulokhande26](https://github.com/himanshulokhande26)

---

## 📄 License

This project is built for educational and engineering purposes.

---

<div align="center">
  <sub>Built with ❤️ and 🩸 — because every second counts.</sub>
</div>
