export type HabitType = 'daily' | 'volume' | 'weekly';

export type Habit = {
  id: string;
  title: string;
  emoji: string;
  type: HabitType;
  targetVolume: number;
  color: string;
  createdAt: string;
  notifyEnabled: boolean;
  notifyTime: string;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;
  completedCount: number;
  completedAt: string;
};

export type Challenge = {
  id: string;
  title: string;
  habitId: string;
  durationDays: number;
  startDate: string;
  completedDates: string[];
  completed: boolean;
  completedAt: string | null;
  celebrated: boolean;
};

export type AppState = {
  onboardingDone: boolean;
  userName: string;
  habits: Habit[];
  logs: HabitLog[];
  challenges: Challenge[];
};
