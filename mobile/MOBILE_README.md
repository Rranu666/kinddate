# KindDate Mobile App

A full React Native + Expo mobile application for iOS and Android, built on the KindDate platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) SDK 52 + [Expo Router](https://expo.github.io/router) v4 |
| Language | TypeScript (strict mode) |
| Navigation | File-based routing via Expo Router |
| State | [Zustand](https://github.com/pmndrs/zustand) v5 |
| Server State | [TanStack Query](https://tanstack.com/query) v5 |
| Database | [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime) |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) v3 |
| Gestures | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) v2 |
| Fonts | Playfair Display + Inter via `@expo-google-fonts` |
| Gradients | `expo-linear-gradient` |
| Images | `expo-image` (lazy loading, blurhash) |

---

## Project Structure

```
mobile/
├── app/                          # Expo Router file-based navigation
│   ├── _layout.tsx               # Root layout (fonts, auth init, providers)
│   ├── index.tsx                 # Entry point — auth redirect logic
│   ├── (auth)/                   # Unauthenticated screens
│   │   ├── login.tsx             # Email/password sign-in
│   │   ├── signup.tsx            # Account creation
│   │   └── onboarding/           # 4-step onboarding flow
│   │       ├── phone.tsx         # Phone verification (Twilio)
│   │       ├── discovery.tsx     # Aria AI conversation (DISCOVERY mode)
│   │       ├── photos.tsx        # Profile photo + bio
│   │       └── preferences.tsx   # Gender, intent, interests
│   ├── (tabs)/                   # Main app — bottom tab navigation
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── discover.tsx          # ✨ Swipeable match cards
│   │   ├── matches.tsx           # 💞 Accepted matches list
│   │   ├── messages.tsx          # 💬 Conversation inbox
│   │   ├── aria.tsx              # 🔮 Aria AI coach (full chat)
│   │   └── profile.tsx           # 👤 User profile & settings
│   ├── match/[id].tsx            # Match detail (compatibility breakdown)
│   ├── chat/[id].tsx             # Real-time messaging screen
│   └── profile/edit.tsx          # Edit profile modal
│
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client + helper functions
│   │   └── constants.ts          # Colors, fonts, spacing, app constants
│   ├── store/
│   │   └── authStore.ts          # Zustand auth store (user, session)
│   ├── types/
│   │   └── index.ts              # TypeScript types (Profile, Match, Message…)
│   ├── hooks/
│   │   ├── useMatches.ts         # TanStack Query hooks for matches
│   │   └── useMessages.ts        # Real-time messages with Supabase subscription
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx         # Primary/secondary/outline/ghost variants
│       │   ├── Input.tsx          # Labeled text input with error states
│       │   ├── Avatar.tsx         # User avatar with verification badge
│       │   └── Badge.tsx          # Pill badge (rose/sage/gold/muted variants)
│       ├── MatchCard.tsx          # Swipeable card with gesture + animation
│       ├── MessageBubble.tsx      # Chat message bubble
│       └── CompatibilityBar.tsx   # Animated compatibility score bar
│
├── assets/                        # App icons and splash screens
├── app.json                       # Expo app configuration
├── eas.json                       # EAS Build + Submit config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── babel.config.js                # Babel config (Reanimated plugin)
```

---

## Features

### Screens
- **Login / Signup** — Email auth with clean branded UI
- **Onboarding** — 4-step flow: phone verify → Aria discovery chat → photos → preferences
- **Discover** — Swipeable match cards with gesture support (like/nope), score badge, gradient overlay
- **Matches** — List of accepted matches with unread count & compatibility score
- **Messages** — Conversation inbox with real-time updates via Supabase Realtime
- **Aria AI** — Full chat with 8 mode selector (Discovery, Healing, Date Prep, etc.)
- **Profile** — Hero banner, AI insights, trust score, settings
- **Match Detail** — Full profile view with AI explanation + compatibility breakdown bars
- **Chat** — Real-time messaging, infinite scroll pagination, typing support
- **Edit Profile** — Photo upload, bio, interests, location

### Core Capabilities
- **Real-time messaging** via Supabase Realtime subscriptions
- **Swipe gestures** with spring physics via Reanimated + Gesture Handler
- **Aria AI** integration via Netlify functions (same as web app)
- **Auth persistence** via AsyncStorage + Supabase session management
- **Photo uploads** to Supabase Storage via `expo-image-picker`
- **Font loading** with proper splash screen gating

---

## Setup

### 1. Prerequisites

```bash
# Install Node.js 20+
# Install Expo CLI
npm install -g expo-cli eas-cli
```

### 2. Install dependencies

```bash
cd mobile
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your Supabase URL, anon key, and API base URL
```

### 4. Run locally

```bash
# Start dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### 5. Build for production

```bash
# Login to EAS
eas login

# Build for both platforms
npm run build:all

# Submit to stores
npm run submit:ios
npm run submit:android
```

---

## Environment Variables

Create a `.env` file in `mobile/`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=https://kinddate.netlify.app
EXPO_PUBLIC_AGORA_APP_ID=your-agora-id (for video dates)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... (for subscriptions)
```

---

## Design System

The app uses the same visual language as the KindDate web app:

| Token | Value |
|-------|-------|
| Primary Rose | `#C8716A` |
| Sage Green | `#7B9E87` |
| Gold | `#C9A96E` |
| Background | `#FAF6F0` (cream) |
| Night (Aria) | `#0E0B15` |
| Serif Font | Playfair Display |
| Sans Font | Inter |

---

## Platform Notes

- **iOS**: Requires Xcode 15+ for build. Supports Face ID, push notifications, camera.
- **Android**: minSdkVersion 24 (Android 7.0+). Supports biometrics, camera, notifications.
- **New Architecture**: Enabled (`newArchEnabled: true`) for better performance.

---

## Deployment Targets

- **iOS App Store**: Bundle ID `com.kcf.kinddate`
- **Google Play Store**: Package `com.kcf.kinddate`
