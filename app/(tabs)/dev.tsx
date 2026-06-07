import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../../src/context';
import { DEFAULT_STATE } from '../../src/store';
import { COLORS, RADIUS, SPACING } from '../../src/theme';
import { feedbackComplete, feedbackMedium } from '../../src/feedback';

export default function DevScreen() {
  const { state, dispatch } = useApp();

  const active = state.challenges.filter(c => !c.completed);

  const forceComplete = (challengeId: string) => {
    feedbackComplete();
    dispatch({ type: 'DEV_FORCE_COMPLETE_CHALLENGE', payload: challengeId });
  };

  const addDays = (challengeId: string, days: number) => {
    feedbackMedium();
    dispatch({ type: 'DEV_ADD_CHALLENGE_DAYS', payload: { challengeId, days } });
  };

  const resetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all habits, logs, and challenges and restart onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            dispatch({ type: 'LOADED', payload: DEFAULT_STATE });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Dev Tools 🔧</Text>
        <Text style={styles.sub}>Simulate scenarios without waiting for real days to pass.</Text>

        {/* Active challenges */}
        <Text style={styles.sectionTitle}>Active Challenges</Text>

        {active.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No active challenges. Create one in the Challenges tab.</Text>
          </View>
        )}

        {active.map(challenge => {
          const habit = state.habits.find(h => h.id === challenge.habitId);
          const pct = Math.min(1, challenge.completedDates.length / challenge.durationDays);
          return (
            <View key={challenge.id} style={styles.card}>
              <Text style={styles.cardTitle}>{challenge.title}</Text>
              {habit && (
                <Text style={styles.cardHabit}>{habit.emoji} {habit.title}</Text>
              )}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
              </View>
              <Text style={styles.cardSub}>
                {challenge.completedDates.length}/{challenge.durationDays} days completed
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => addDays(challenge.id, 1)}
                >
                  <Text style={styles.simBtnText}>+1 Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => addDays(challenge.id, 3)}
                >
                  <Text style={styles.simBtnText}>+3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.simBtn, styles.simBtnDanger]}
                  onPress={() => forceComplete(challenge.id)}
                >
                  <Text style={[styles.simBtnText, { color: '#fff' }]}>Force Complete 🏆</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Stats overview */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>State Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{state.habits.length}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{state.logs.length}</Text>
            <Text style={styles.statLabel}>Log entries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{state.challenges.length}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{state.challenges.filter(c => c.completed).length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 100 },

  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 20 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },

  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardHabit: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  cardSub: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.md },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  simBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: `${COLORS.primary}44`,
  },
  simBtnDanger: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  simBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNum: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  resetBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: SPACING.sm,
  },
  resetBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.danger },
});
