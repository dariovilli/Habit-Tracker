import { supabase } from './supabase';
import { Habit, HabitLog, Challenge, AppState } from './types';

// ---------------------------------------------------------------------------
// Input validation — defense-in-depth before any write hits Supabase.
// These complement database-level CHECK constraints and guard against
// crafted API calls that bypass the app UI.
// ---------------------------------------------------------------------------

function assertValidHabit(habit: Habit) {
  const title = habit.title?.trim() ?? '';
  if (title.length === 0 || title.length > 40)
    throw new Error('Invalid habit: title must be 1–40 characters');
  if (!['daily', 'volume', 'weekly'].includes(habit.type))
    throw new Error('Invalid habit: unknown type');
  if (!Number.isInteger(habit.targetVolume) || habit.targetVolume < 1 || habit.targetVolume > 100)
    throw new Error('Invalid habit: targetVolume must be 1–100');
}

function assertValidLog(log: HabitLog) {
  if (!log.habitId || typeof log.habitId !== 'string')
    throw new Error('Invalid log: missing habitId');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(log.date))
    throw new Error('Invalid log: date must be YYYY-MM-DD');
  if (!Number.isInteger(log.completedCount) || log.completedCount < 0 || log.completedCount > 1000)
    throw new Error('Invalid log: completedCount must be 0–1000');
}

function assertValidChallenge(challenge: Challenge) {
  const title = challenge.title?.trim() ?? '';
  if (title.length === 0 || title.length > 50)
    throw new Error('Invalid challenge: title must be 1–50 characters');
  if (!Number.isInteger(challenge.durationDays) || challenge.durationDays < 1 || challenge.durationDays > 365)
    throw new Error('Invalid challenge: durationDays must be 1–365');
  if (!Array.isArray(challenge.completedDates))
    throw new Error('Invalid challenge: completedDates must be an array');
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToHabit(row: Record<string, any>): Habit {
  return {
    id: row.id,
    title: row.title,
    emoji: row.emoji,
    type: row.type,
    targetVolume: row.target_volume,
    color: row.color,
    createdAt: row.created_at,
    notifyEnabled: row.notify_enabled,
    notifyTime: row.notify_time,
  };
}

function habitToRow(habit: Habit, userId: string) {
  return {
    id: habit.id,
    user_id: userId,
    title: habit.title,
    emoji: habit.emoji,
    type: habit.type,
    target_volume: habit.targetVolume,
    color: habit.color,
    created_at: habit.createdAt,
    notify_enabled: habit.notifyEnabled,
    notify_time: habit.notifyTime,
  };
}

function rowToLog(row: Record<string, any>): HabitLog {
  return {
    id: row.id,
    habitId: row.habit_id,
    date: row.date,
    completedCount: row.completed_count,
    completedAt: row.completed_at,
  };
}

function logToRow(log: HabitLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    habit_id: log.habitId,
    date: log.date,
    completed_count: log.completedCount,
    completed_at: log.completedAt,
  };
}

function rowToChallenge(row: Record<string, any>): Challenge {
  return {
    id: row.id,
    title: row.title,
    habitId: row.habit_id,
    durationDays: row.duration_days,
    startDate: row.start_date,
    completedDates: row.completed_dates ?? [],
    completed: row.completed,
    completedAt: row.completed_at,
    celebrated: row.celebrated,
  };
}

function challengeToRow(challenge: Challenge, userId: string) {
  return {
    id: challenge.id,
    user_id: userId,
    habit_id: challenge.habitId,
    title: challenge.title,
    duration_days: challenge.durationDays,
    start_date: challenge.startDate,
    completed_dates: challenge.completedDates,
    completed: challenge.completed,
    completed_at: challenge.completedAt,
    celebrated: challenge.celebrated,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchUserState(userId: string): Promise<{
  habits: Habit[];
  logs: HabitLog[];
  challenges: Challenge[];
} | null> {
  try {
    const [habitsRes, logsRes, challengesRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
      supabase.from('challenges').select('*').eq('user_id', userId),
    ]);
    if (habitsRes.error || logsRes.error || challengesRes.error) return null;
    return {
      habits: habitsRes.data.map(rowToHabit),
      logs: logsRes.data.map(rowToLog),
      challenges: challengesRes.data.map(rowToChallenge),
    };
  } catch {
    return null;
  }
}

export async function upsertHabit(habit: Habit, userId: string) {
  assertValidHabit(habit);
  await supabase.from('habits').upsert(habitToRow(habit, userId));
}

// userId is required — delete is scoped to the owner to defend against
// RLS misconfiguration. Both filters must match for the row to be deleted.
export async function deleteHabit(habitId: string, userId: string) {
  await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
}

export async function upsertLog(log: HabitLog, userId: string) {
  assertValidLog(log);
  await supabase.from('habit_logs').upsert(logToRow(log, userId));
}

export async function deleteLog(logId: string, userId: string) {
  await supabase.from('habit_logs').delete().eq('id', logId).eq('user_id', userId);
}

export async function upsertChallenge(challenge: Challenge, userId: string) {
  assertValidChallenge(challenge);
  await supabase.from('challenges').upsert(challengeToRow(challenge, userId));
}

export async function deleteChallenge(challengeId: string, userId: string) {
  await supabase.from('challenges').delete().eq('id', challengeId).eq('user_id', userId);
}

export async function pushAllState(state: AppState, userId: string) {
  // Promise.allSettled so a validation failure on one item never blocks the rest
  // and never produces an unhandled rejection in the debounced sync caller.
  await Promise.allSettled([
    ...state.habits.map(h => upsertHabit(h, userId)),
    ...state.logs.map(l => upsertLog(l, userId)),
    ...state.challenges.map(c => upsertChallenge(c, userId)),
  ]);
}
