# Habit Tracker

A mobile habit tracking app built with Expo + React Native. Track daily habits, build streaks, and take on multi-day challenges — with reminders, sound feedback, and a monthly activity grid.

## Features

- **Daily habit tracking** — tap to increment, long-press to delete
- **Streak counters** — consecutive days tracked and displayed per habit
- **Challenges** — set a duration goal for any habit and get a celebration screen on completion
- **Reminders** — per-habit notification scheduling with a custom morning time + fixed 8 PM reminder
- **Monthly activity grid** — visual calendar view of completion history
- **Sound & haptics** — chime on habit completion, celebration fanfare on challenge finish
- **Onboarding** — 3-step intro flow on first launch
- **Web support** — runs in browser via Expo web (audio falls back to Web Audio API)

## Stack

- **Expo SDK 54** · React Native 0.81.5 · React 19 · TypeScript strict
- **Expo Router v6** — file-based routing
- **react-native-reanimated v4** — animated habit row interactions
- **react-native-svg** — circular progress rings in challenge cards
- **expo-av** — WAV chime playback on native
- **expo-notifications** / **expo-haptics** — reminders and haptic feedback (native only)

## Getting Started

### Prerequisites

- Node.js (via Homebrew recommended)
- [Expo Go](https://expo.dev/go) installed on your Android/iOS device (must match SDK 54)
- Device and Mac on the same WiFi network

### Install

```bash
npm install
```

### Run

```bash
# Start dev server — scan QR code in Expo Go
npm start

# Run in Chrome (web)
npm run chrome
```

### Type-check

```bash
npx tsc --noEmit
```

> **Note:** Prefix commands with `export PATH="/opt/homebrew/bin:$PATH"` if Node.js isn't found.

## Project Structure

```
app/                    # Expo Router screens
  (tabs)/
    index.tsx           # Today screen — habits + challenges
    stats.tsx           # Monthly grid, streaks, challenge list
    dev.tsx             # Developer tools (simulate days, reset data)
  onboarding.tsx
  add-habit.tsx
  challenge-complete.tsx
components/
  HabitRow.tsx          # Animated habit card with inline reminder expander
  Confetti.tsx          # Particle confetti component
src/
  types.ts              # Habit, HabitLog, Challenge, AppState
  store.ts              # Pure state functions + AsyncStorage persistence
  context.tsx           # AppProvider — single React Context + useReducer
  theme.ts              # COLORS, SPACING, RADIUS
  sound.ts              # playChime() / playCelebration()
  notifications.ts      # rescheduleAll() for habit reminders
  feedback.ts           # Haptics wrappers
assets/
  sounds/chime.wav
```

## License

MIT
