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
```

Node.js is via Homebrew. Prefix with `export PATH="/opt/homebrew/bin:$PATH"` if commands fail.

The Expo Go app version on the device must match SDK 54 in `package.json`.

## Stack

- **Expo SDK 54** · React Native 0.81.5 · React 19 · TypeScript strict
- **Expo Router v6** — file-based routing, entry point is `expo-router/entry` (not `App.tsx`)
- **react-native-reanimated v4** — used for animated habit row interactions
- **react-native-svg** — used for circular progress rings in challenge cards
- **expo-av** — WAV chime playback on native (`assets/sounds/chime.wav`)
- **Web Audio API** — chime synthesis on web (no file needed)
- All `expo-notifications` and `expo-haptics` calls are guarded with `Platform.OS !== 'web'`

## Architecture

### State management (`src/`)

All app state flows through a single React Context + useReducer in `src/context.tsx`:

- **`src/types.ts`** — canonical type definitions: `Habit`, `HabitLog`, `Challenge`, `AppState`
- **`src/store.ts`** — pure functions (no side effects): `incrementHabit`, `decrementHabit`, `updateChallenge`, `getStreak`, `isHabitDone`, `getMonthDays`. Also holds `loadState`/`saveState` which serialize the full `AppState` to AsyncStorage under key `@antigravity_v1`.
- **`src/context.tsx`** — `AppProvider` wraps the whole app. Exposes `state`, `dispatch`, `loaded`, `justCompletedChallenge`, `clearJustCompleted`. The `justCompletedChallenge` side-effect is detected in a `useEffect` watching `state.challenges` for `completed && !celebrated` — this triggers navigation to the celebration screen from `app/(tabs)/index.tsx`.
- **`src/theme.ts`** — single source of truth for `COLORS`, `SPACING`, `RADIUS`. Purple-only palette; `successMuted`/`dangerMuted` are the soft green/rose used in the monthly activity grid.
- **`src/sound.ts`** — `playChime()` on habit completion, `playCelebration()` on challenge finish. Platform-branched: Web Audio API on web, `expo-av` WAV on native.
- **`src/notifications.ts`** — `rescheduleAll(habits)` cancels all scheduled notifications then re-creates them for habits with `notifyEnabled`. Called whenever a habit's reminder settings change. Each habit gets two daily triggers: the user-set morning time + a fixed 8 PM reminder.
- **`src/feedback.ts`** — thin wrappers over `expo-haptics`.

### Routing (`app/`)

```
app/
  _layout.tsx              — root Stack + AppProvider + GestureHandlerRootView
  onboarding.tsx           — 3-step flow; skips to /(tabs) when onboardingDone
  add-habit.tsx            — modal slide-up for creating habits
  challenge-complete.tsx   — modal fade for celebration screen
  index.tsx                — redirects based on onboardingDone
  (tabs)/
    _layout.tsx            — BottomTabNavigator; 3 visible tabs (Today, Stats, Dev)
    index.tsx              — Today screen: habits + challenges + inline challenge form
    stats.tsx              — Monthly grid, streak bars, active challenge list
    dev.tsx                — Developer tools: simulate days, force-complete, reset data
    challenges.tsx         — Hidden tab (href: null); kept for reference
```

### Challenge completion flow

1. User increments a habit → `INCREMENT_HABIT` reducer calls `updateChallenge()` from `store.ts`
2. If `completedDates.length >= durationDays`, challenge is marked `completed: true, celebrated: false`
3. `AppProvider` `useEffect` detects this and sets `justCompletedChallenge`
4. `app/(tabs)/index.tsx` watches `justCompletedChallenge` and calls `router.push('/challenge-complete')`
5. Celebration screen dispatches `MARK_CELEBRATED` on close

### Key component patterns

- **`HabitRow`** (`components/HabitRow.tsx`) — self-contained card with reanimated scale, inline bell/reminder expander (30-min time stepper), long-press delete Alert
- **`Confetti`** (`components/Confetti.tsx`) — accepts `count` prop (default 24, use 60 for celebrations)
- Notification scheduling: always call `rescheduleAll(allHabits)` after any `UPDATE_HABIT` dispatch that touches reminder fields — it cancels all and rebuilds from scratch (expo-notifications has no per-notification cancel by ID in this usage)
