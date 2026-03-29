# Always Near

**Peace of mind for seniors and their families.**

> Built by Theory Solutions LLC — MVP Prototype v1.0.0

---

## What It Does

Always Near is a mobile app for senior citizen monitoring that:
- Lets seniors log daily check-ins and track medications
- Gives family members a real-time dashboard showing their loved one's status
- Provides color-coded alerts (green/yellow/red) based on activity and medication adherence
- Keeps all data on-device — no cloud, no data sharing

---

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (installed automatically via npx)
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)

### Install

```bash
cd always-near
npm install
```

### Run

```bash
npx expo start
```

This opens the Expo dev tools. Scan the QR code with:
- **iOS:** Use the Camera app
- **Android:** Use the Expo Go app

---

## Testing with Expo Go

1. Install **Expo Go** from the App Store or Google Play
2. Run `npx expo start` in the project directory
3. Scan the QR code shown in your terminal or browser
4. The app loads directly on your phone — no build required!

---

## Project Structure

```
always-near/
├── App.js                          # Entry point + navigation
├── src/
│   ├── constants/
│   │   ├── colors.js               # Color palette
│   │   └── mockData.js             # Mock data (Margaret, medications, etc.)
│   ├── context/
│   │   └── AppContext.js           # Global state management
│   ├── screens/
│   │   ├── OnboardingScreen.js     # Role selection (Senior / Family)
│   │   ├── SeniorHomeScreen.js     # Clock, check-in, medication status
│   │   ├── MedicationScreen.js     # Add/scan/manage medications
│   │   ├── FamilyDashScreen.js     # Family monitoring dashboard
│   │   └── SettingsScreen.js       # Alerts, notifications, pairing code
│   └── components/
│       ├── StatusCard.js           # Card with colored status border
│       └── MedItem.js              # Single medication row with checkbox
└── README.md
```

---

## Screens

| Screen | Role | Description |
|--------|------|-------------|
| **Onboarding** | Both | Choose "I'm a Senior" or "I'm a Family Member" |
| **Senior Home** | Senior | Large clock, I'm OK button, today's meds |
| **Medications** | Senior | Scan prescription, add/delete medications |
| **Family Dashboard** | Family | Status card, med adherence, activity, steps |
| **Settings** | Both | Alert thresholds, notifications, pairing code |

---

## Design

- **Primary:** `#2E86AB` (blue)
- **Accent:** `#A8DADC` (teal)
- **Background:** `#F8F9FA` (near white)
- **Alert:** `#E63946` (red)
- **Warning:** `#F4A261` (amber)
- Minimum 18pt body font
- Large touch targets throughout
- High-contrast text

---

## Demo Flow

1. Launch → Onboarding screen
2. Tap **"I'm a Senior"** → Senior tabs (Home, Medications, Settings)
   - Big clock and date
   - Tap **"I'm OK ✓"** to log a check-in
   - Tap medication checkboxes to mark as taken
   - Go to Medications → tap **"Scan Bottle"** to demo OCR simulation
3. Go back to Onboarding (Settings → Clear All Data) → Tap **"I'm a Family Member"**
   - Dashboard shows Margaret's status card
   - Green/yellow/red based on activity + med adherence
   - Toggle notification settings

---

## Notes for Investors/Partners

- All data is local (AsyncStorage) — privacy-first architecture
- OCR simulation demonstrates the prescription scan UX flow
- Activity/steps data is mocked for prototype; production would integrate HealthKit/Google Fit
- Pairing code system designed for simple family linking without requiring accounts
- Ready to extend with push notifications, backend sync, and wearable integrations

---

*© 2026 Theory Solutions LLC*
