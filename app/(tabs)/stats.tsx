import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useApp } from '../../src/context';
import { isHabitDone, getMonthDays, getStreak, today } from '../../src/store';
import { COLORS, RADIUS, SPACING } from '../../src/theme';

function MonthGrid() {
  const { state } = useApp();
  const days = getMonthDays();
  const todayStr = today();
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View>
      <Text style={styles.sectionTitle}>{monthName}</Text>
      <View style={styles.monthGrid}>
        {days.map(date => {
          const isFuture = date > todayStr;
          const hasHabits = state.habits.length > 0;
          const anyDone = hasHabits && state.habits.some(h => isHabitDone(state.logs, h, date));
          const allMissed = hasHabits && !isFuture && !anyDone;

          let bg = COLORS.border;
          if (anyDone) bg = COLORS.successMuted;
          else if (allMissed) bg = COLORS.dangerMuted;

          const dayNum = parseInt(date.split('-')[2], 10);
          const isToday = date === todayStr;

          return (
            <View
              key={date}
              style={[styles.monthDay, { backgroundColor: bg }, isToday && styles.monthDayToday]}
            >
              <Text style={[
                styles.monthDayText,
                (anyDone || allMissed) && !isFuture && { color: '#fff' },
                isToday && { fontWeight: '800' },
              ]}>
                {dayNum}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.successMuted }]} />
          <Text style={styles.legendText}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.dangerMuted }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { state } = useApp();

  const totalDone = state.logs.filter(l => {
    const habit = state.habits.find(h => h.id === l.habitId);
    return habit && l.completedCount >= habit.targetVolume;
  }).length;

  const bestStreak = state.habits.reduce((best, h) => Math.max(best, getStreak(state.logs, h)), 0);
  const activeChallenges = state.challenges.filter(c => !c.completed);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your Progress</Text>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.summaryNum}>{totalDone}</Text>
            <Text style={styles.summaryLabel}>Habits Done</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.primaryDark }]}>
            <Text style={styles.summaryNum}>{bestStreak}</Text>
            <Text style={styles.summaryLabel}>Best Streak 🔥</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#3D2DB3' }]}>
            <Text style={styles.summaryNum}>{state.habits.length}</Text>
            <Text style={styles.summaryLabel}>Habits</Text>
          </View>
        </View>

        {/* Monthly grid */}
        <MonthGrid />

        {/* Habit streaks */}
        {state.habits.length > 0 && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={styles.sectionTitle}>Streaks</Text>
            {state.habits.map(h => {
              const streak = getStreak(state.logs, h);
              return (
                <View key={h.id} style={styles.habitStatRow}>
                  <Text style={styles.habitStatEmoji}>{h.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitStatTitle}>{h.title}</Text>
                    <View style={styles.streakBar}>
                      <View style={[styles.streakFill, { width: `${Math.min(100, (streak / 30) * 100)}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.streakNum}>{streak > 0 ? `🔥 ${streak}d` : '—'}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Active challenges */}
        {activeChallenges.length > 0 && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            {activeChallenges.map(challenge => {
              const habit = state.habits.find(h => h.id === challenge.habitId);
              const pct = Math.min(1, challenge.completedDates.length / challenge.durationDays);
              const daysLeft = challenge.durationDays - challenge.completedDates.length;
              return (
                <View key={challenge.id} style={styles.challengeRow}>
                  <Text style={styles.habitStatEmoji}>{habit?.emoji ?? '🎯'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.habitStatTitle}>{challenge.title}</Text>
                    <View style={styles.streakBar}>
                      <View style={[styles.streakFill, { width: `${pct * 100}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.streakNum}>
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Done!'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {state.habits.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>Add habits to see your stats here</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 100 },

  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.lg },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg },
  summaryCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  summaryNum: { fontSize: 26, fontWeight: '900', color: '#fff' },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },

  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: SPACING.sm },
  monthDay: { width: 36, height: 36, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  monthDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  monthDayText: { fontSize: 11, fontWeight: '500', color: COLORS.textMuted },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 4, marginBottom: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, color: COLORS.textMuted },

  habitStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 8,
    gap: 12,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}22`,
  },
  habitStatEmoji: { fontSize: 22 },
  habitStatTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  streakBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  streakFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  streakNum: { fontSize: 13, fontWeight: '700', color: COLORS.primary, minWidth: 52, textAlign: 'right' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center' },
});
