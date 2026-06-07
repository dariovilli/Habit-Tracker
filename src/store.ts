import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Habit, HabitLog, Challenge } from './types';

const KEY = '@antigravity_v1';

export const DEFAULT_STATE: AppState = {
  onboardingDone: false,
  userName: '',
  habits: [],
  logs: [],
  challenges: [],
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getLog(logs: HabitLog[], habitId: string, date: string): HabitLog | undefined {
  return logs.find(l => l.habitId === habitId && l.date === date);
}

export function isHabitDone(logs: HabitLog[], habit: Habit, date = today()): boolean {
  const log = getLog(logs, habit.id, date);
  return !!log && log.completedCount >= habit.targetVolume;
}

export function getHabitProgress(logs: HabitLog[], habit: Habit): number {
  const log = getLog(logs, habit.id, today());
  if (!log) return 0;
  return Math.min(log.completedCount, habit.targetVolume);
}

export function getStreak(logs: HabitLog[], habit: Habit): number {
  let streak = 0;
  const d = new Date();
  const todayStr = today();
  const todayDone = isHabitDone(logs, habit, todayStr);
  if (!todayDone) d.setDate(d.getDate() - 1);

  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if (!isHabitDone(logs, habit, dateStr)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function incrementHabit(logs: HabitLog[], habitId: string): HabitLog[] {
  const date = today();
  const existing = getLog(logs, habitId, date);

  if (existing) {
    return logs.map(l =>
      l.id === existing.id
        ? { ...l, completedCount: l.completedCount + 1, completedAt: new Date().toISOString() }
        : l
    );
  }

  const newLog: HabitLog = {
    id: `${habitId}_${date}`,
    habitId,
    date,
    completedCount: 1,
    completedAt: new Date().toISOString(),
  };
  return [...logs, newLog];
}

export function decrementHabit(logs: HabitLog[], habitId: string): HabitLog[] {
  const date = today();
  const existing = getLog(logs, habitId, date);
  if (!existing) return logs;
  if (existing.completedCount <= 1) {
    return logs.filter(l => l.id !== existing.id);
  }
  return logs.map(l =>
    l.id === existing.id ? { ...l, completedCount: l.completedCount - 1 } : l
  );
}

export function updateChallenge(
  challenges: Challenge[],
  logs: HabitLog[],
  habits: Habit[]
): { challenges: Challenge[]; justCompleted: Challenge | null } {
  const date = today();
  let justCompleted: Challenge | null = null;

  const updated = challenges.map(ch => {
    if (ch.completed || ch.completedDates.includes(date)) return ch;

    const habit = habits.find(h => h.id === ch.habitId);
    if (!habit || !isHabitDone(logs, habit, date)) return ch;

    const newDates = [...ch.completedDates, date];
    const isNowComplete = newDates.length >= ch.durationDays;

    const updatedCh: Challenge = {
      ...ch,
      completedDates: newDates,
      completed: isNowComplete,
      completedAt: isNowComplete ? new Date().toISOString() : null,
    };

    if (isNowComplete && !ch.celebrated) {
      justCompleted = updatedCh;
    }

    return updatedCh;
  });

  return { challenges: updated, justCompleted };
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - i);
    days.push(copy.toISOString().split('T')[0]);
  }
  return days;
}

export function getMonthDays(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    days.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  return days;
}
