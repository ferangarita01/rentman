# Rentman Project (Monorepo)

Welcome to the Rentman project. This repository is organized as a monorepo containing the following applications:

## 📂 Project Structure

### `apps/` (Active Projects)

- **[mobile](apps/mobile)**: The Android functionality (Capacitor + Next.js).
  - *Command*: `cd apps/mobile && npm run android:run`
  
- **[dashboard](apps/dashboard)**: The Web Dashboard (Vite + React).
  - *Command*: `cd apps/dashboard && npm run dev`
  - *Deploy*: Vercel (Root Directory: `apps/dashboard`)

- **[cli](apps/cli)**: Backend CLI tool for M2M tasks.
  - *Command*: `cd apps/cli && npm link`

- **[backend](apps/backend)**: Internal API for Vertex AI and validation.
  - *Deploy*: Cloud Run

### `_archive/` (Legacy Code)

- **legacy_mobile_expo**: Old Expo-based mobile app (`rentman-app`).
- **legacy_mobile_v2**: Old React Native test app (`rentman-v2`).

## 🚀 Getting Started

To work on a specific app, navigate to its directory:

```bash
cd apps/mobile
npm install
npm run dev
```
