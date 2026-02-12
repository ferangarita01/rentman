# Rentman Mobile App

**Rentman** is an AI-powered property and rental management assistant, designed with a cyberpunk aesthetic and built for the future of decentralized work.

![Rentman Banner](playstore-screenshots/TODAY.png)

## 🚀 Features

- **Global Market**: Browse, filter, and accept rental tasks (cleaning, maintenance, verification) worldwide.
- **Smart Dashboard**: Real-time financial overview, active task tracking, and holographic stats.
- **Wallet & Payments**: 
  - Integrated Stripe Connect for bank withdrawals (Express Payouts).
  - Crypto wallet support (Solana readiness).
  - Transaction history and credit management.
- **AI Assistant**: 
  - "Sarah" Holographic Projection interface.
  - Context-aware assistance for tasks and navigation.
- **Gamification**: 
  - Leveling system based on task completion and reputation.
  - "Rentman DAO" integration for governance rewards.
- **Secure Auth**: Supabase Authentication with role-based access control.

## 🛠️ Technical Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- **Mobile Runtime**: [Capacitor 6](https://capacitorjs.com/) (Android)
- **Styling**: TailwindCSS + Custom "Neon Cyberpunk" Design System
- **Backend / Database**: 
  - **Supabase**: Auth, PostgreSQL, Storage, Realtime Subscriptions.
  - **Google Cloud Run**: Node.js backend for complex logic (Stripe, AI).
- **State Management**: React Context (`AuthContext`) + SWR/Supabase Hooks.

## 📂 Project Structure

Verified and reorganized as of **Feb 2026**:

```
apps/mobile/
├── src/
│   ├── app/           # App Router pages (Home, Market, Inbox, Wallet, Profile)
│   ├── components/    # Core UI components (BottomNav, HolographicProjection, etc.)
│   ├── contexts/      # React contexts (Auth)
│   ├── lib/           # Supabase & API clients
│   └── plugins/       # Custom Capacitor plugins
├── scripts/           # Utility scripts
│   ├── build/         # Build & Deploy automation
│   ├── db/            # Database migrations & seeds
│   └── verify/        # Integrity checks
├── docs/              # Documentation
│   ├── guides/        # Developer guides
│   ├── architecture/  # System design docs
│   └── archive/       # Legacy documentation
├── migrations/        # SQL Migration files
├── playstore-screenshots/ # Official store assets
├── public/            # Static assets (Manifest, Icons)
└── android/           # Native Android project
```

## ⚡ Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Development**:
   ```bash
   npm run dev
   ```
   Access at `http://localhost:3000`.

3. **Sync with Android**:
   ```bash
   npx cap sync
   ```

4. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

## 📦 Build & Deploy

To build the project for production and generate the Android APK/Bundle:

```bash
# 1. Build Next.js app
npm run build

# 2. Sync assets to Android platform
npx cap sync

# 3. Build APK (Debug)
cd android && ./gradlew assembleDebug
```

## 📸 Screenshots

Official Play Store screenshots are located in `apps/mobile/playstore-screenshots/`.

---
*Rentman Mobile - Built for the New Economy.*
