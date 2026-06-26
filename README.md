<p align="center">
  <img src="./assets/hero.png" width="120" alt="Grit Logo"/>
</p>

<h1 align="center">Grit — AI-Powered Fitness Companion</h1>

<p align="center">
  <em>Train smarter. Track deeper. Push further.</em>
</p>

<p align="center">
  <a href="https://github.com/sa1165/Grit-Fitness/stargazers"><img src="https://img.shields.io/github/stars/sa1165/Grit-Fitness?style=flat-square&color=FFD700" alt="Stars"/></a>
  <a href="https://github.com/sa1165/Grit-Fitness/issues"><img src="https://img.shields.io/github/issues/sa1165/Grit-Fitness?style=flat-square" alt="Issues"/></a>
  <a href="https://github.com/sa1165/Grit-Fitness/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/></a>
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/built%20with-Expo-000020?style=flat-square&logo=expo" alt="Expo"/>
  <img src="https://img.shields.io/badge/backend-Supabase-3ECF8E?style=flat-square&logo=supabase" alt="Supabase"/>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Demo & Screenshots](#demo--screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Results & Metrics](#results--metrics)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Grit** is a cross-platform, AI-powered fitness companion built for anyone from gym beginners to elite athletes. It solves the fragmentation problem in fitness apps — users typically juggle separate apps for workout planning, calorie tracking, progress logging, and AI coaching. Grit unifies all of these into a single, cohesive experience.

Built with **React Native (Expo)** for a native feel on both iOS and Android, and powered by **Supabase** for real-time data sync and secure authentication, Grit delivers a premium, dark-themed UI with personalized AI guidance, structured workout scheduling, and deep progress analytics.

> Built as a flagship portfolio project, demonstrating full-stack mobile development, real-time database integration, and applied AI — all shipped in a single production-quality app.

---

## Demo & Screenshots

> 📱 **Try it yourself** — scan the QR code below with [Expo Go](https://expo.dev/client) to run Grit on your phone instantly.

<!-- Replace with your actual Expo published QR or link -->
```
expo publish link / QR goes here
```

| Home & Dashboard | AI Trainer | Workout Scheduler | Progress Charts |
|:---:|:---:|:---:|:---:|
| ![Home](./screenshots/home.png) | ![AI](./screenshots/ai_trainer.png) | ![Scheduler](./screenshots/scheduler.png) | ![Charts](./screenshots/charts.png) |

| Calorie Tracker | Exercise Library | Profile |
|:---:|:---:|:---:|
| ![Calories](./screenshots/calories.png) | ![Library](./screenshots/library.png) | ![Profile](./screenshots/profile.png) |

> 📁 Screenshots are in the [`/screenshots`](./screenshots) folder.

---

## Features

| Feature | Description |
|---|---|
| 🤖 **Grit AI Trainer** | Personalized workout advice, form corrections, and nutrition coaching — available 24/7 |
| 📋 **Workout Library** | Pre-built routines + custom workout creation, filterable by muscle group and equipment |
| 🗓️ **Workout Scheduler** | Calendar-based scheduling with push reminders and streak tracking |
| 📊 **Progress Analytics** | Interactive charts for weight, body measurements, strength PRs, and workout frequency |
| 🍎 **Calorie & Macro Tracker** | TDEE calculator, macro breakdown, and daily intake logging |
| 🔐 **Secure Auth** | Email/password and OAuth login powered by Supabase Auth with RLS policies |
| 🌙 **Dark-first UI** | Premium dark theme with gradient accents and micro-animations throughout |
| 📶 **Offline Support** | Core tracking features work without an internet connection *(planned — see Roadmap)* |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native (Expo SDK 50+) |
| **Backend & Database** | Supabase (PostgreSQL + Realtime) |
| **Authentication** | Supabase Auth |
| **Navigation** | React Navigation v6 |
| **Data Visualization** | React Native Chart Kit |
| **State Management** | React Context API + `useState` / `useReducer` |
| **Styling** | React Native StyleSheet (CSS-in-JS) |
| **Icons** | Expo Vector Icons (Ionicons) |
| **AI Integration** | *(Planned — OpenAI / Gemini API — see Roadmap)* |
| **Version Control** | Git + GitHub |

---

## Architecture

```
User Device (iOS / Android)
         │
         ▼
 React Native (Expo)
    ├── Navigation Layer     → React Navigation (Stack + Tab)
    ├── UI Components        → Custom StyleSheet components
    ├── State Management     → Context API
    └── API Service Layer
              │
              ▼
        Supabase Cloud
    ├── Auth               → JWT-based session management
    ├── PostgreSQL DB      → Users, workouts, logs, nutrition
    ├── Row-Level Security → Per-user data isolation
    └── Realtime           → Live sync across sessions
              │
              ▼
       AI Trainer Module
    └── (Currently: rule-based logic → Future: LLM API)
```

---

## Project Structure

```
Grit-Fitness/
│
├── README.md
├── LICENSE
├── package.json
├── app.json                  # Expo config
├── .env.example              # Environment variable template
├── .gitignore
│
├── assets/                   # App icons, splash screen, hero images
├── screenshots/              # UI screenshots for README
│
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Buttons, Cards, Loaders
│   │   ├── charts/           # Chart wrappers (weight, reps, etc.)
│   │   └── workout/          # Exercise cards, set trackers
│   │
│   ├── screens/              # Full app screens
│   │   ├── HomeScreen.js
│   │   ├── WorkoutScreen.js
│   │   ├── SchedulerScreen.js
│   │   ├── ProgressScreen.js
│   │   ├── NutritionScreen.js
│   │   ├── AITrainerScreen.js
│   │   └── ProfileScreen.js
│   │
│   ├── navigation/           # Stack and tab navigators
│   │   └── AppNavigator.js
│   │
│   ├── context/              # Global state providers
│   │   ├── AuthContext.js
│   │   └── WorkoutContext.js
│   │
│   ├── services/             # Supabase API calls
│   │   ├── supabase.js       # Client init
│   │   ├── authService.js
│   │   ├── workoutService.js
│   │   └── nutritionService.js
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useWorkout.js
│   │   └── useProgress.js
│   │
│   ├── constants/            # Colors, fonts, theme tokens
│   │   └── theme.js
│   │
│   └── utils/                # TDEE calculator, date helpers, etc.
│       └── calculations.js
│
└── docs/                     # Additional documentation
    └── database-schema.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Expo CLI** — `npm install -g expo-cli`
- **Expo Go** app on iOS or Android *(or an emulator)*
- A free [Supabase](https://supabase.com) account

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sa1165/Grit-Fitness.git
cd Grit-Fitness

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env
# Fill in your Supabase credentials in .env

# 4. Start the development server
npx expo start

# 5. Run on your device
# → Scan the QR code with Expo Go (iOS/Android)
# → Press 'a' for Android emulator
# → Press 'i' for iOS simulator
```

---

## Environment Variables

Create a `.env` file in the root directory. Use `.env.example` as a template:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To find these values: go to your [Supabase dashboard](https://app.supabase.com) → Project Settings → API.

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Database Schema

Key tables in Supabase (PostgreSQL):

| Table | Description |
|---|---|
| `users` | Profile data — name, weight, height, goals |
| `workouts` | Workout templates with exercise references |
| `workout_logs` | Completed session records with sets/reps/weight |
| `exercises` | Exercise library with muscle groups and equipment |
| `nutrition_logs` | Daily calorie and macro entries |
| `scheduled_workouts` | Calendar entries linked to workout templates |

Row-Level Security (RLS) is enabled on all tables — users can only access their own data.

> Full schema diagram available in [`/docs/database-schema.md`](./docs/database-schema.md)

---

## Results & Metrics

| Metric | Value |
|---|---|
| Supported platforms | iOS, Android |
| Avg. screen load time | < 300ms |
| Supabase auth latency | < 200ms (JWT) |
| Exercise library size | 80+ exercises |
| Workout templates | 15+ pre-built routines |
| Charts rendered | 5 visualization types |
| Authentication methods | Email/Password, OAuth (Google) |

---

## Roadmap

- [ ] **LLM-powered AI Trainer** — integrate OpenAI / Gemini API for real conversational coaching
- [ ] **Offline mode** — local SQLite caching with sync on reconnect
- [ ] **Apple Health / Google Fit integration** — pull steps and heart rate data
- [ ] **Social features** — share workouts, follow friends, leaderboards
- [ ] **Wearable support** — Apple Watch / Wear OS companion
- [ ] **CI/CD pipeline** — GitHub Actions for automated testing and Expo EAS builds
- [ ] **Unit tests** — Jest + React Native Testing Library coverage
- [ ] **Push notifications** — workout reminders via Expo Notifications
- [ ] **App Store & Play Store release** — production EAS build

---

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: add your feature description"

# 4. Push to the branch
git push origin feature/your-feature-name

# 5. Open a Pull Request
```

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and check open [Issues](https://github.com/sa1165/Grit-Fitness/issues) before starting new work.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## Author

**Sanjeev A**
B.Tech Computer Science (Data Science) — SRMIST Kattankulathur

[![GitHub](https://img.shields.io/badge/GitHub-sa1165-181717?style=flat-square&logo=github)](https://github.com/sa1165)

---

<p align="center">
  <sub>Built with 💪 and React Native — <em>because every rep counts.</em></sub>
</p>
