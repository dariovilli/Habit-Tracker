import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { AppState, Habit, HabitLog, Challenge } from './types';
import {
  DEFAULT_STATE,
  loadState,
  saveState,
  incrementHabit,
  decrementHabit,
  updateChallenge,
} from './store';

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
      const challenges = state.challenges.map(c =>
        c.id === action.payload
          ? { ...c, completed: true, completedAt: new Date().toISOString(), celebrated: false }
          : c
      );
      return { ...state, challenges };
    }

    case 'DEV_ADD_CHALLENGE_DAYS': {
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
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [loaded, setLoaded] = React.useState(false);
  const [justCompletedChallenge, setJustCompletedChallenge] =
    React.useState<Challenge | null>(null);

  useEffect(() => {
    loadState().then(s => {
      dispatch({ type: 'LOADED', payload: s });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const uncelebrated = state.challenges.find(c => c.completed && !c.celebrated);
    if (uncelebrated) {
      setJustCompletedChallenge(uncelebrated);
    }
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
