# Gidana Frontend (React Native) — Setup Guide

## Requirements
- Node.js 18+ → https://nodejs.org
- Expo CLI → `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio emulator, OR Expo Go app on your phone

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your backend URL
# Edit src/api/client.ts and update BASE_URL to your backend IP

# 3. Start Expo
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) to run on your phone.

## Backend URL (important!)
If running backend on your laptop and testing on a phone, use your local IP:
```ts
// src/api/client.ts
const BASE_URL = 'http://192.168.x.x:8080/api/v1';
```

## Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Auth with email or phone |
| Home | Featured properties (top-rated) |
| Explore | Search/filter properties |
| PropertyDetail | Full property info, gallery, reviews |
| AddProperty | Create listing with 3+ photos |
| Favorites | Saved properties |
| Wallet | Manage payment methods |
| AddWallet | Add Nita/MPesa/PayPal/Card |
| Transactions | Payment history |
| PayService | Pay Starlink/Canal+ |
| Profile | User info, settings, logout |

## Build for Production

```bash
# Android APK
npx expo build:android

# iOS IPA
npx expo build:ios
```
