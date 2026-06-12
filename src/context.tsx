import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { AppState, Habit, HabitLog, Challenge } from './types';
import {
  DEFAULT_STATE,
  loadState,
  saveState,
  incrementHabit,
  decrementHabit,
  updateChallenge,
} from './store';
import { useAuth } from './auth-context';
import { supabase } from './supabase';
import { fetchUserState, pushAllState, deleteHabit, deleteLog, deleteChallenge } from './db';

type Action =
  | { type: 'LOADED'; payload: AppState }
  | { type: 'COMPLETE_ONBOARDING'; payload: { userName: string } }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'INCREMENT_HABIT'; payload: string }
  | { type: 'DECREMENT_HABIT'; payload: string }
  | { type: 'ADD_CHALLENGE'; payload: Challenge }
  | { type: 'DELETE_CHALLENGE'; payload: string }
  | { type: 'UPDATE_CHALLENGE'; payload: Challenge }
  | { type: 'MARK_CELEBRATED'; payload: string }
  | { type: 'TICK_CHALLENGES' }
  | { type: 'DEV_FORCE_COMPLETE_CHALLENGE'; payload: string }
  | { type: 'DEV_ADD_CHALLENGE_DAYS'; payload: { challengeId: string; days: number } };

type ContextValue = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loaded: boolean;
  justCompletedChallenge: Challenge | null;
  clearJustCompleted: () => void;
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOADED':
      return action.payload;

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingDone: true, userName: action.payload.userName };

    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };

    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter(h => h.id !== action.payload),
        logs: state.logs.filter(l => l.habitId !== action.payload),
        challenges: state.challenges.filter(c => c.habitId !== action.payload),
      };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h),
      };

    case 'INCREMENT_HABIT': {
      const newLogs = incrementHabit(state.logs, action.payload);
      const { challenges } = updateChallenge(state.challenges, newLogs, state.habits);
      return { ...state, logs: newLogs, challenges };
    }

    case 'DECREMENT_HABIT':
      return { ...state, logs: decrementHabit(state.logs, action.payload) };

    case 'ADD_CHALLENGE':
      return { ...state, challenges: [...state.challenges, action.payload] };

    case 'DELETE_CHALLENGE':
      return { ...state, challenges: state.challenges.filter(c => c.id !== action.payload) };

    case 'UPDATE_CHALLENGE':
      return {
        ...state,
        challenges: state.challenges.map(c => c.id === action.payload.id ? action.payload : c),
      };

    case 'MARK_CELEBRATED':
      return {
        ...state,
        challenges: state.challenges.map(c =>
          c.id === action.payload ? { ...c, celebrated: true } : c
        ),
      };

    case 'TICK_CHALLENGES': {
      const { challenges } = updateChallenge(state.challenges, state.logs, state.habits);
      return { ...state, challenges };
    }

    case 'DEV_FORCE_COMPLETE_CHALLENGE': {
      if (!__DEV__) return state;
      const challenges = state.challenges.map(c =>
        c.id === action.payload
          ? { ...c, completed: true, completedAt: new Date().toISOString(), celebrated: false }
          : c
      );
      return { ...state, challenges };
    }

    case 'DEV_ADD_CHALLENGE_DAYS': {
      if (!__DEV__) return state;
      const { challengeId, days } = action.payload;
      const challenge = state.challenges.find(c => c.id === challengeId);
      if (!challenge) return state;

      const habit = state.habits.find(h => h.id === challenge.habitId);
      const newLogs = [...state.logs];

      if (habit) {
        for (let i = 1; i <= days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const logId = `${habit.id}_${dateStr}`;
          if (!newLogs.find(l => l.id === logId)) {
            newLogs.push({
              id: logId,
              habitId: habit.id,
              date: dateStr,
              completedCount: habit.targetVolume,
              completedAt: new Date(d).toISOString(),
            });
          }
        }
      }

      const newDates = [...challenge.completedDates];
      for (let i = 1; i <= days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (!newDates.includes(dateStr)) newDates.push(dateStr);
      }
      const isComplete = newDates.length >= challenge.durationDays;

      const challenges = state.challenges.map(c =>
        c.id === challengeId
          ? {
              ...c,
              completedDates: newDates,
              completed: isComplete,
              completedAt: isComplete ? new Date().toISOString() : c.completedAt,
              celebrated: isComplete ? false : c.celebrated,
            }
          : c
      );

      return { ...state, logs: newLogs, challenges };
    }

    default:
      return state;
  }
}

const AppContext = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const [justCompletedChallenge, setJustCompletedChallenge] = useState<Challenge | null>(null);

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHabitIdsRef = useRef(new Set<string>());
  const prevLogIdsRef = useRef(new Set<string>());
  const prevChallengeIdsRef = useRef(new Set<string>());

  // Load local state first (instant), then sync from Supabase in background
  useEffect(() => {
    setLoaded(false);
    setSyncReady(false);
    prevHabitIdsRef.current = new Set();
    prevLogIdsRef.current = new Set();
    prevChallengeIdsRef.current = new Set();

    loadState().then(async (localState) => {
      dispatch({ type: 'LOADED', payload: localState });
      setLoaded(true);

      if (!userId) {
        prevHabitIdsRef.current = new Set(localState.habits.map(h => h.id));
        prevLogIdsRef.current = new Set(localState.logs.map(l => l.id));
        prevChallengeIdsRef.current = new Set(localState.challenges.map(c => c.id));
        setSyncReady(true);
        return;
      }

      try {
        const remote = await fetchUserState(userId);
        if (remote && remote.habits.length > 0) {
          // Remote has data — use it as the source of truth
          const { data: { user } } = await supabase.auth.getUser();
          const merged: AppState = {
            ...localState,
            habits: remote.habits,
            logs: remote.logs,
            challenges: remote.challenges,
            onboardingDone: localState.onboardingDone || (user?.user_metadata?.onboarding_done ?? false),
            userName: localState.userName || (user?.user_metadata?.user_name ?? ''),
          };
          dispatch({ type: 'LOADED', payload: merged });
          await saveState(merged);
          prevHabitIdsRef.current = new Set(remote.habits.map(h => h.id));
          prevLogIdsRef.current = new Set(remote.logs.map(l => l.id));
          prevChallengeIdsRef.current = new Set(remote.challenges.map(c => c.id));
        } else if (remote) {
          // First login — push any existing local data up to Supabase
          await pushAllState(localState, userId);
          if (localState.onboardingDone) {
            supabase.auth.updateUser({
              data: { onboarding_done: true, user_name: localState.userName },
            });
          }
          prevHabitIdsRef.current = new Set(localState.habits.map(h => h.id));
          prevLogIdsRef.current = new Set(localState.logs.map(l => l.id));
          prevChallengeIdsRef.current = new Set(localState.challenges.map(c => c.id));
        }
      } catch {
        // Network error — stay with local state
        prevHabitIdsRef.current = new Set(localState.habits.map(h => h.id));
        prevLogIdsRef.current = new Set(localState.logs.map(l => l.id));
        prevChallengeIdsRef.current = new Set(localState.challenges.map(c => c.id));
      }

      setSyncReady(true);
    });
  }, [userId]);

  // Persist to AsyncStorage on every state change
  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  // Sync onboarding completion to Supabase user metadata
  useEffect(() => {
    if (!userId || !loaded || !state.onboardingDone) return;
    supabase.auth.updateUser({ data: { onboarding_done: true, user_name: state.userName } });
  }, [state.onboardingDone, state.userName, userId, loaded]);

  // Debounced upsert sync — pushes all current data to Supabase after changes settle
  useEffect(() => {
    if (!userId || !syncReady) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      pushAllState(state, userId);
    }, 600);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [state.habits, state.logs, state.challenges, userId, syncReady]);

  // Delete sync — detect removed habit IDs and delete from Supabase
  useEffect(() => {
    if (!userId || !syncReady) {
      prevHabitIdsRef.current = new Set(state.habits.map(h => h.id));
      return;
    }
    const curr = new Set(state.habits.map(h => h.id));
    prevHabitIdsRef.current.forEach(id => {
      if (!curr.has(id)) deleteHabit(id, userId);
    });
    prevHabitIdsRef.current = curr;
  }, [state.habits, userId, syncReady]);

  // Delete sync — detect removed log IDs and delete from Supabase
  useEffect(() => {
    if (!userId || !syncReady) {
      prevLogIdsRef.current = new Set(state.logs.map(l => l.id));
      return;
    }
    const curr = new Set(state.logs.map(l => l.id));
    prevLogIdsRef.current.forEach(id => {
      if (!curr.has(id)) deleteLog(id, userId);
    });
    prevLogIdsRef.current = curr;
  }, [state.logs, userId, syncReady]);

  // Delete sync — detect removed challenge IDs and delete from Supabase
  useEffect(() => {
    if (!userId || !syncReady) {
      prevChallengeIdsRef.current = new Set(state.challenges.map(c => c.id));
      return;
    }
    const curr = new Set(state.challenges.map(c => c.id));
    prevChallengeIdsRef.current.forEach(id => {
      if (!curr.has(id)) deleteChallenge(id, userId);
    });
    prevChallengeIdsRef.current = curr;
  }, [state.challenges, userId, syncReady]);

  // Challenge completion detection
  useEffect(() => {
    const uncelebrated = state.challenges.find(c => c.completed && !c.celebrated);
    if (uncelebrated) setJustCompletedChallenge(uncelebrated);
  }, [state.challenges]);

  const clearJustCompleted = () => setJustCompletedChallenge(null);

  return (
    <AppContext.Provider value={{ state, dispatch, loaded, justCompletedChallenge, clearJustCompleted }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
