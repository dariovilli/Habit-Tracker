# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server — scan QR code in Expo Go on Android (same WiFi required)
npm start

# Open in Chrome for web testing
npm run chrome          # runs on port 8082

# Type-check only (no build output)
npx tsc --noEmit

# Add a package — always use this, not npm install (picks SDK-compatible version)
npx expo install <package-name>

# If expo install fails due to peer-dep conflicts, fall back to:
npm install <package-name> --legacy-peer-deps
```

Node.js is via Homebrew. Prefix with `export PATH="/opt/homebrew/bin:$PATH"` if commands fail.

The Expo Go app version on the device must match SDK 54 in `package.json`.

## Stack

- **Expo SDK 54** · React Native 0.81.5 · React 19 · TypeScript strict
- **Expo Router v6** — file-based routing, entry point is `expo-router/entry` (not `App.tsx`)
- **Supabase** — backend database + email/password auth; client in `src/supabase.ts`
- **react-native-reanimated v4** — used for animated habit row interactions
- **expo-av** — WAV chime playback on native (`assets/sounds/chime.wav`)
- **Web Audio API** — chime synthesis on web (no file needed)
- All `expo-notifications` and `expo-haptics` calls are guarded with `Platform.OS !== 'web'`

## Architecture

### Auth (`src/auth-context.tsx`, `src/supabase.ts`)

`AuthProvider` wraps `AppProvider` in `app/_layout.tsx`. It exposes `{ session, authLoaded, signIn, signUp, signOut }` via `useAuth()`.

- `signUp` returns `{ error: string | null; needsConfirmation: boolean }`
- `signIn` returns `string | null` (error message)
- Supabase client uses `expo-secure-store` on native and `localStorage` on web for session persistence
- Email confirmation is disabled in Supabase dashboard — new users are active immediately

### State management (`src/`)

All app state flows through a single React Context + useReducer in `src/context.tsx`:

- **`src/types.ts`** — canonical type definitions: `Habit`, `HabitLog`, `Challenge`, `AppState`. `HabitType = 'daily' | 'volume' | 'weekly'`
- **`src/store.ts`** — pure functions: `incrementHabit`, `decrementHabit`, `updateChallenge`, `getStreak`, `isHabitDone`, `getWeekProgress`, `getMonthDays`. `loadState`/`saveState` serialize `AppState` to AsyncStorage under key `@antigravity_v1`.
- **`src/context.tsx`** — local-first + Supabase sync. On `userId` change: loads AsyncStorage instantly (snappy UI), then fetches Supabase in background. Remote wins if it has data; pushes local up if remote is empty (first login). Debounced upsert (600ms) on state changes. Delete tracking via `prevHabitIdsRef` / `prevLogIdsRef` / `prevChallengeIdsRef`.
- **`src/db.ts`** — Supabase CRUD with camelCase↔snake_case mapping: `fetchUserState`, `upsertHabit/Log/Challenge`, `deleteHabit/Log/Challenge`, `pushAllState`
- **`src/theme.ts`** — single source of truth for `COLORS`, `SPACING`, `RADIUS`. Purple-only palette; `successMuted`/`dangerMuted` are the soft green/rose used in the monthly grid.
- **`src/sound.ts`** — `playChime()` on habit completion, `playCelebration()` on challenge finish.
- **`src/notifications.ts`** — `rescheduleAll(habits)` cancels all and rebuilds. Always call after any `UPDATE_HABIT` touching reminder fields.
- **`src/feedback.ts`** — thin wrappers over `expo-haptics`.

### Routing (`app/`)

```
app/
  _layout.tsx              — root Stack + AuthProvider + AppProvider + GestureHandlerRootView
  index.tsx                — auth-aware redirect: spinner → /login → /onboarding → /(tabs)
  login.tsx                — email/password sign in / sign up screen
  onboarding.tsx           — 3-step flow; skips to /(tabs) when onboardingDone
  add-habit.tsx            — modal slide-up for creating habits
  edit-habit.tsx           — modal slide-up for editing existing habit (emoji + name)
  edit-challenge.tsx       — modal slide-up for editing existing challenge
  challenge-complete.tsx   — modal fade for celebration screen
  (tabs)/
    _layout.tsx            — BottomTabNavigator; 2 visible tabs (Today, Stats); Dev tab is href:null
    index.tsx              — Today screen: habit rows + challenge bar cards + inline challenge form
    stats.tsx              — Monthly grid + streak bars per habit
    dev.tsx                — hidden developer tools (simulate days, reset data)
    challenges.tsx         — hidden, kept for reference
```

### Auth routing flow

`app/index.tsx` checks `authLoaded && loaded` before routing:
- No session → `/login`
- Session + no onboarding → `/onboarding`
- Session + onboarding done → `/(tabs)`

### Challenge completion flow

1. User increments a habit → `INCREMENT_HABIT` reducer calls `updateChallenge()` from `store.ts`
2. If `completedDates.length >= durationDays`, challenge is marked `completed: true, celebrated: false`
3. `AppProvider` `useEffect` detects this and sets `justCompletedChallenge`
4. `app/(tabs)/index.tsx` watches `justCompletedChallenge` and calls `router.push('/challenge-complete')`
5. Celebration screen dispatches `MARK_CELEBRATED` on close

### Key component patterns

- **`HabitRow`** (`components/HabitRow.tsx`) — self-contained card with reanimated scale, inline bell/reminder expander, long-press → Alert with Edit / Delete. Single "Set" toggle button for reminders (outlined = off, filled purple = on). Weekly habits show "X/Y days this week" subtext. Props include `weekProgress?` and `onEdit?`.
- **`Confetti`** (`components/Confetti.tsx`) — accepts `count` prop (default 24, use 60 for celebrations)
- Challenge cards in Today use a bar design: emoji + title + progress bar + days-left label. No SVG rings.
- Notification scheduling: always call `rescheduleAll(allHabits)` after any `UPDATE_HABIT` that touches reminder fields.
