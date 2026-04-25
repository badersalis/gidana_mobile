# Gidana Mobile

**Gidana** is a property discovery and rental platform built for Africa. It lets anyone search for studios, apartments, or houses within their budget, view photos, contact verified owners, book appointments, and manage contracts entirely in the cloud.

This repository contains the React Native (Expo) mobile application.

---

## Features

- **Property Search** — Filter by type (Studio, Apartment, House), price, neighborhood, number of rooms, and transaction type (rent or buy)
- **Property Listings** — Photo galleries, detailed descriptions, amenities, and verified owner contact info (WhatsApp / phone)
- **Favorites** — Save and revisit properties you're interested in
- **Rental Management** — Track active and past rental contracts
- **Wallet & Payments** — Link payment methods (Nita, MPesa, Visa, Mastercard, PayPal) and manage your balance
- **Transaction History** — Full log of all payments and income
- **Bill Payments** — Pay services like Starlink and Canal+ directly in-app
- **Reviews & Ratings** — Read and leave verified reviews on properties
- **Search Alerts** — Get notified when a property matching your criteria becomes available
- **Onboarding** — Smooth first-launch experience before login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo ~54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| State Management | Zustand |
| HTTP Client | Axios |
| UI Components | React Native Paper |
| Animations | React Native Reanimated |
| Secure Storage | Expo Secure Store |
| Font | Poppins (Regular, Medium, SemiBold, Bold) |

---

## Project Structure

```
src/
├── api/            # API client and per-resource modules
├── components/     # Shared UI components
├── navigation/     # App, Auth, and Main navigators
├── screens/        # All app screens organized by feature
│   ├── auth/
│   ├── home/
│   ├── explore/
│   ├── property/
│   ├── favorites/
│   ├── wallet/
│   ├── transactions/
│   ├── payment/
│   ├── profile/
│   └── onboarding/
├── store/          # Zustand stores (auth, app)
├── types/          # TypeScript interfaces and navigation types
└── utils/          # Theme, fonts, storage, currency helpers
```

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) on your iOS or Android device, **or** an emulator (Android Studio / Xcode)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/badersalis/gidana_mobile.git
cd gidana_mobile

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL to your backend address
```

### Running the App

```bash
# Start the Expo dev server
npx expo start

# Or target a specific platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

Scan the QR code with **Expo Go** to run on your physical device.

### Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Gidana backend API (e.g. `http://192.168.x.x:8080/api/v1`) |

> When testing on a physical device connected to the same Wi-Fi as your development machine, use your machine's local IP address instead of `localhost`.

---

## Screens

| Screen | Description |
|---|---|
| Onboarding | First-launch walkthrough |
| Login / Register | Email or phone authentication |
| Home | Featured and top-rated properties |
| Explore | Search and filter all listings |
| Property Detail | Full info, photo gallery, reviews, owner contact |
| Add Property | Create a new listing with photos and details |
| Favorites | Saved / bookmarked properties |
| Wallet | Linked payment methods and balance overview |
| Add Wallet | Connect Nita, MPesa, PayPal, or a card |
| Transactions | Full payment and income history |
| Pay Service | Pay Starlink, Canal+, and other services |
| Profile | Account info, settings, and logout |

---

## Building for Production

```bash
# Android APK / AAB
npx eas build --platform android

# iOS IPA
npx eas build --platform ios
```

Requires an [Expo EAS](https://expo.dev/eas) account and configured `eas.json`.

---

## Backend

The mobile app connects to a separate backend service. The API base URL is configured via the `EXPO_PUBLIC_API_URL` environment variable. See the [backend repository](#) for setup instructions.

---

## License

Private — All rights reserved © Gidana Platforms.
