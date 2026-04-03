# In-dependent Living

**Live independently. Stay connected.**

A mobile app for senior citizens and caregivers with medication tracking, health monitoring, calendar management, family connectivity, and fitness tracking integration.

> Built by Theory Solutions LLC — © 2026

---

## Features

- 💊 **Medication Tracking** — Scan prescriptions, set reminders, track doses
- 👥 **Family Connectivity** — Link with family members via secure pairing codes or shareable URLs
- 📅 **Smart Calendar** — Track appointments, activities, and reminders
- 🆘 **One-Tap Emergency** — SOS button calls 911 or family instantly
- 📊 **Activity Monitoring** — Steps, stand hours, flights climbed (Apple Watch / Fitbit)
- 🔒 **Privacy-First** — HIPAA-exempt design with device-only and encrypted cloud storage options

---

## Tech Stack

- **Framework:** React Native (Expo)
- **Backend:** Firebase (Firestore, Auth)
- **Build:** EAS Build (iOS + Android)
- **Target:** iOS 13+ / Android 8+

---

## Setup

```bash
# Install dependencies
npm install

# Run locally
npx expo start
```

---

## Project Structure

```
in-dependent-living/
├── App.js                    # Navigation + root
├── app.json                  # Expo config
├── src/
│   ├── screens/              # All app screens
│   ├── context/              # AppContext (state)
│   ├── services/             # Firebase services
│   ├── constants/            # Colors, mock data
│   └── utils/                # Helpers
└── web/                      # Landing pages
```

---

## Pairing Flow

1. Independent generates a pairing code in Settings
2. Share via code OR shareable URL: `https://in-dependentliving.com/connect/XXXXXX`
3. Family enters code or taps link → accounts linked
4. Family sees real-time dashboard of Independent's status

---

## Subscription

- 7-day free trial
- $24.99/month or $199/year
- Cancel anytime via App Store / Play Store

---

*© 2026 Theory Solutions LLC*
