import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Habit } from '../src/types';
import { COLORS, RADIUS, SPACING } from '../src/theme';

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function bumpTime(time: string, delta: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + delta * 30;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

type Props = {
  habit: Habit;
  progress: number;
  streak: number;
  weekProgress?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onReminderChange?: (enabled: boolean, time: string) => void;
};

export function HabitRow({ habit, progress, streak, weekProgress, onIncrement, onDecrement, onDelete, onEdit, onReminderChange }: Props) {
  const isWeekly = habit.type === 'weekly';
  const isVolume = habit.type === 'volume';

  // For weekly: done = enough days completed this week
  // For daily/volume: done = today's progress meets target
  const done = isWeekly
    ? (weekProgress ?? 0) >= habit.targetVolume
    : progress >= habit.targetVolume;

  // For weekly: is today already logged?
  const todayLoggedForWeekly = isWeekly && progress >= 1;

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(done ? 1 : 0);
  const rowOpacity = useSharedValue(1);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState(habit.notifyTime);

  useEffect(() => {
    checkScale.value = withSpring(done ? 1 : 0, { damping: 12, stiffness: 200 });
    rowOpacity.value = withTiming(done ? 0.75 : 1, { duration: 200 });
  }, [done]);

  useEffect(() => {
    setReminderTime(habit.notifyTime);
  }, [habit.notifyTime]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.06, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 14, stiffness: 300 })
    );
    if (isWeekly) {
      if (!todayLoggedForWeekly) onIncrement();
    } else if (done && (habit.type === 'daily' || habit.type === 'log')) {
      onDecrement();
    } else {
      onIncrement();
    }
  };

  const handleLongPress = () => {
    Alert.alert(habit.title, '', [
      { text: 'Edit Habit', onPress: onEdit },
      { text: 'Delete Habit', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleBell = () => setReminderOpen(v => !v);

  const handleSet = () => {
    const newEnabled = !habit.notifyEnabled;
    onReminderChange?.(newEnabled, reminderTime);
    setReminderOpen(false);
  };

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: rowOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const subText = streak > 0 ? `🔥 ${streak} day streak` : 'Start your streak today';

  return (
    <Animated.View style={[rowStyle, styles.card, done && styles.cardDone]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.mainTap}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={450}
          activeOpacity={0.85}
        >
          <Text style={styles.emoji}>{habit.emoji}</Text>
          <View style={styles.info}>
            <Text style={[styles.title, done && styles.titleDone]}>{habit.title}</Text>
            <Text style={styles.streak}>{subText}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBell}
          style={styles.bellBtn}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 4 }}
        >
          <Text style={[styles.bellIcon, !habit.notifyEnabled && styles.bellOff]}>🔔</Text>
        </TouchableOpacity>

        {isWeekly ? (
          <View style={styles.volumeRow}>
            <TouchableOpacity
              style={[styles.volumeBtn, !todayLoggedForWeekly && styles.volumeBtnDisabled]}
              onPress={onDecrement}
              disabled={!todayLoggedForWeekly}
            >
              <Text style={styles.volumeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.volumeCount, done && { color: COLORS.primary }]}>
              {weekProgress ?? 0}/{habit.targetVolume}
            </Text>
            <TouchableOpacity
              style={[styles.volumeBtn, todayLoggedForWeekly && styles.volumeBtnDisabled]}
              onPress={onIncrement}
              disabled={todayLoggedForWeekly}
            >
              <Text style={styles.volumeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : isVolume ? (
          <View style={styles.volumeRow}>
            <TouchableOpacity style={styles.volumeBtn} onPress={onDecrement}>
              <Text style={styles.volumeBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.volumeCount, done && { color: COLORS.primary }]}>
              {progress}/{habit.targetVolume}
            </Text>
            <TouchableOpacity style={styles.volumeBtn} onPress={onIncrement}>
              <Text style={styles.volumeBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={[styles.check, done && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
            <Animated.Text style={[styles.checkMark, checkStyle]}>✓</Animated.Text>
          </Animated.View>
        )}
      </View>

      {reminderOpen && (
        <View style={styles.reminderSection}>
          <TouchableOpacity onPress={() => setReminderTime(t => bumpTime(t, -1))} style={styles.remindBtn}>
            <Text style={styles.remindBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.remindTime}>{formatTime12(reminderTime)}</Text>
          <TouchableOpacity onPress={() => setReminderTime(t => bumpTime(t, 1))} style={styles.remindBtn}>
            <Text style={styles.remindBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.setBtn, habit.notifyEnabled && styles.setBtnActive]}
            onPress={handleSet}
          >
            <Text style={[styles.setBtnText, habit.notifyEnabled && styles.setBtnTextActive]}>
              {habit.notifyEnabled ? 'Set ✓' : 'Set'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardDone: { backgroundColor: COLORS.background },

  row: { flexDirection: 'row', alignItems: 'center', paddingRight: SPACING.md },
  mainTap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
  },
  emoji: { fontSize: 28, marginRight: 14 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  titleDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  streak: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  bellBtn: { padding: 4, marginRight: 10 },
  bellIcon: { fontSize: 18 },
  bellOff: { opacity: 0.28 },

  check: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volumeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  volumeBtnDisabled: { opacity: 0.3 },
  volumeBtnText: { fontSize: 18, color: COLORS.primary, fontWeight: '600', lineHeight: 22 },
  volumeCount: {
    fontSize: 14, fontWeight: '700', color: COLORS.textSecondary,
    minWidth: 36, textAlign: 'center',
  },

  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.primaryLight,
    gap: 12,
  },
  remindBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${COLORS.primary}33`,
  },
  remindBtnText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  remindTime: {
    fontSize: 16, fontWeight: '700', color: COLORS.primaryDark,
    minWidth: 90, textAlign: 'center',
  },
  setBtn: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  setBtnActive: { backgroundColor: COLORS.primary },
  setBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  setBtnTextActive: { color: '#fff' },
});
