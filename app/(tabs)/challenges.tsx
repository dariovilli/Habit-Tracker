import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../../src/context';
import { COLORS, RADIUS, SPACING } from '../../src/theme';
import { Challenge, Habit, HabitType } from '../../src/types';
import { feedbackLight, feedbackMedium } from '../../src/feedback';

const EMOJIS = [
  '💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴',
  '🎯', '🧠', '🎨', '🎸', '🏋️', '🚴', '🏊', '🌿',
  '☀️', '📵', '🫁', '💊', '🧹', '💼', '🌙', '❤️',
];

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { state, dispatch } = useApp();
  const habit = state.habits.find(h => h.id === challenge.habitId);
  const pct = Math.min(1, challenge.completedDates.length / challenge.durationDays);
  const daysLeft = challenge.durationDays - challenge.completedDates.length;

  const extend = () => {
    feedbackLight();
    dispatch({ type: 'UPDATE_CHALLENGE', payload: { ...challenge, durationDays: challenge.durationDays + 1 } });
  };

  return (
    <View style={[styles.card, challenge.completed && styles.cardCompleted]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{challenge.completed ? '🏆' : '🎯'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, challenge.completed && styles.textFaded]}>
            {challenge.title}
          </Text>
          {habit && (
            <Text style={styles.cardHabit}>{habit.emoji} {habit.title}</Text>
          )}
        </View>
        {!challenge.completed && (
          <TouchableOpacity style={styles.extendBtn} onPress={extend}>
            <Text style={styles.extendText}>+1 day</Text>
          </TouchableOpacity>
        )}
        {challenge.completed && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Done ✓</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }, challenge.completed && styles.progressFillDone]} />
      </View>

      <Text style={styles.cardSub}>
        {challenge.completedDates.length}/{challenge.durationDays} days
        {!challenge.completed && daysLeft > 0 ? ` · ${daysLeft} to go` : ''}
      </Text>
    </View>
  );
}

export default function ChallengesScreen() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formHabitId, setFormHabitId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDays, setFormDays] = useState(7);
  const [creatingNewHabit, setCreatingNewHabit] = useState(false);
  const [newEmoji, setNewEmoji] = useState('💪');
  const [newHabitTitle, setNewHabitTitle] = useState('');

  const active = state.challenges.filter(c => !c.completed);
  const completed = state.challenges.filter(c => c.completed);

  const openForm = () => {
    setFormHabitId(state.habits[0]?.id ?? null);
    setFormTitle('');
    setFormDays(7);
    setCreatingNewHabit(state.habits.length === 0);
    setNewEmoji('💪');
    setNewHabitTitle('');
    setShowForm(true);
  };

  const createChallenge = () => {
    let habitId = formHabitId;
    let habitName = state.habits.find(h => h.id === habitId)?.title ?? 'Habit';

    if (creatingNewHabit) {
      if (!newHabitTitle.trim()) {
        Alert.alert('Name required', 'Enter a name for the new habit.');
        return;
      }
      const newHabit: Habit = {
        id: `h_${Date.now()}`,
        title: newHabitTitle.trim(),
        emoji: newEmoji,
        type: 'daily' as HabitType,
        targetVolume: 1,
        color: COLORS.primary,
        createdAt: new Date().toISOString(),
        notifyEnabled: false,
        notifyTime: '09:00',
      };
      dispatch({ type: 'ADD_HABIT', payload: newHabit });
      habitId = newHabit.id;
      habitName = newHabit.title;
    }

    if (!habitId) {
      Alert.alert('No habit selected', 'Select a habit or create a new one.');
      return;
    }

    feedbackMedium();
    dispatch({
      type: 'ADD_CHALLENGE',
      payload: {
        id: `ch_${Date.now()}`,
        title: formTitle.trim() || `${habitName} Challenge`,
        habitId,
        durationDays: formDays,
        startDate: new Date().toISOString().split('T')[0],
        completedDates: [],
        completed: false,
        completedAt: null,
        celebrated: false,
      },
    });
    setShowForm(false);
    setCreatingNewHabit(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headRow}>
          <Text style={styles.heading}>Challenges</Text>
          <TouchableOpacity style={styles.newBtn} onPress={openForm}>
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Create form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Challenge</Text>

            <Text style={styles.label}>Habit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {state.habits.map(h => (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitChip, !creatingNewHabit && formHabitId === h.id && styles.habitChipActive]}
                  onPress={() => { setFormHabitId(h.id); setCreatingNewHabit(false); }}
                >
                  <Text style={[styles.habitChipText, !creatingNewHabit && formHabitId === h.id && { color: '#fff' }]}>
                    {h.emoji} {h.title}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.habitChip, creatingNewHabit && styles.habitChipActive]}
                onPress={() => { setCreatingNewHabit(true); setFormHabitId(null); }}
              >
                <Text style={[styles.habitChipText, creatingNewHabit && { color: '#fff' }]}>
                  ＋ New habit
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {creatingNewHabit && (
              <View style={styles.newHabitBox}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {EMOJIS.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                      onPress={() => setNewEmoji(e)}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Habit name (e.g. Leg day)"
                  placeholderTextColor={COLORS.textMuted}
                  value={newHabitTitle}
                  onChangeText={t => {
                    setNewHabitTitle(t);
                    if (!formTitle) setFormTitle('');
                  }}
                  maxLength={40}
                />
              </View>
            )}

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder={`e.g. ${state.habits.find(h => h.id === formHabitId)?.title ?? 'Habit'} Challenge`}
              placeholderTextColor={COLORS.textMuted}
              value={formTitle}
              onChangeText={setFormTitle}
              maxLength={50}
            />

            <Text style={styles.label}>Duration</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setFormDays(d => Math.max(1, d - 1))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{formDays} days</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setFormDays(d => Math.min(365, d + 1))}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={createChallenge}>
                <Text style={styles.createBtnText}>Create 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active challenges */}
        {active.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={styles.sectionLabel}>Active</Text>
            {active.map(c => <ChallengeCard key={c.id} challenge={c} />)}
          </View>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Completed</Text>
            {completed.map(c => <ChallengeCard key={c.id} challenge={c} />)}
          </View>
        )}

        {active.length === 0 && completed.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptySub}>Set a goal and commit to it.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openForm}>
              <Text style={styles.emptyBtnText}>Create your first challenge</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: 100 },

  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  newBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardCompleted: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: 10 },
  cardEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  textFaded: { color: COLORS.textSecondary },
  cardHabit: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  extendBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  extendText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  completedBadge: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  completedBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressFillDone: { backgroundColor: COLORS.success },
  cardSub: { fontSize: 12, color: COLORS.textMuted },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  formTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  noHabitsNote: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  newHabitBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  habitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  habitChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  stepperVal: { fontSize: 18, fontWeight: '700', color: COLORS.text, minWidth: 80, textAlign: 'center' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  createBtn: {
    flex: 2,
    padding: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING.xl },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
