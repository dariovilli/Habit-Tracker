import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit } from './types';

const CHANNEL_ID = 'habit-reminders';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#7a4add',
    sound: 'default',
  });
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleForHabit(habitTitle: string, hour: number, minute: number) {
  const greetings = [
    `Time to build momentum — ${habitTitle} is waiting for you 💪`,
    `Don't break the streak! Check off ${habitTitle} today.`,
    `Your future self thanks you. Do ${habitTitle} now.`,
  ];
  const evening = [
    `Quick check-in: did you do ${habitTitle} today?`,
    `Day's not over yet — ${habitTitle} is still on the list!`,
    `End the day strong. ${habitTitle} takes just a moment.`,
  ];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Tracker',
      body: greetings[Math.floor(Math.random() * greetings.length)],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habit Tracker',
      body: evening[Math.floor(Math.random() * evening.length)],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function scheduleDaily(habitTitle: string, hour: number, minute: number) {
  if (Platform.OS === 'web') return;
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await scheduleForHabit(habitTitle, hour, minute);
}

export async function rescheduleAll(habits: Habit[]) {
  if (Platform.OS === 'web') return;
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const habit of habits) {
    if (habit.notifyEnabled) {
      const parts = habit.notifyTime.split(':').map(Number);
      const hour = parts[0] ?? 9;
      const minute = parts[1] ?? 0;
      await scheduleForHabit(habit.title, hour, minute);
    }
  }
}

export async function cancelAll() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
