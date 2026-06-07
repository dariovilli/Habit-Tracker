import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context';
import { isHabitDone, getHabitProgress, getStreak, today } from '../../src/store';
import { feedbackMedium, feedbackComplete, feedbackLight } from '../../src/feedback';
import { playChime } from '../../src/sound';
import { rescheduleAll } from '../../src/notifications';
import { COLORS, RADIUS, SPACING } from '../../src/theme';
import Svg, { Circle } from 'react-native-svg';
import { HabitRow } from '../../components/HabitRow';
import { Confetti } from '../../components/Confetti';
import { Challenge, Habit, HabitType } from '../../src/types';

function CircleProgress({ pct, done, total, size = 52 }: { pct: number; done: number; total: number; size?: number }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${COLORS.primary}28`} strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={COLORS.primary} strokeWidth={sw} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.primary, lineHeight: 13 }}>{done}</Text>
      <Text style={{ fontSize: 8, color: COLORS.textMuted, lineHeight: 10 }}>/{total}</Text>
    </View>
  );
}

const EMOJIS = [
  '💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴',
  '🎯', '🧠', '🎨', '🎸', '🏋️', '🚴', '🏊', '🌿',
  '☀️', '📵', '🫁', '💊', '🧹', '💼', '🌙', '❤️',
];

function greeting(name: string): string {
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${time}${name ? `, ${name}` : ''} 👋`;
}

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

function ChallengeForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp();
  const [habitId, setHabitId] = useState<string | null>(state.habits[0]?.id ?? null);
  const [formTitle, setFormTitle] = useState('');
  const [days, setDays] = useState(7);
  const [newMode, setNewMode] = useState(state.habits.length === 0);
  const [newEmoji, setNewEmoji] = useState('💪');
  const [newHabitTitle, setNewHabitTitle] = useState('');

  const create = () => {
    let finalHabitId = habitId;
    let habitName = state.habits.find(h => h.id === finalHabitId)?.title ?? 'Habit';

    if (newMode) {
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
      finalHabitId = newHabit.id;
      habitName = newHabit.title;
    }

    if (!finalHabitId) {
      Alert.alert('Select a habit first.');
      return;
    }

    feedbackMedium();
    dispatch({
      type: 'ADD_CHALLENGE',
      payload: {
        id: `ch_${Date.now()}`,
        title: formTitle.trim() || `${habitName} Challenge`,
        habitId: finalHabitId,
        durationDays: days,
        startDate: new Date().toISOString().split('T')[0],
        completedDates: [],
        completed: false,
        completedAt: null,
        celebrated: false,
      } as Challenge,
    });
    onClose();
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>New Challenge</Text>

      <Text style={styles.formLabel}>Habit</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {state.habits.map(h => (
          <TouchableOpacity
            key={h.id}
            style={[styles.chip, !newMode && habitId === h.id && styles.chipActive]}
            onPress={() => { setHabitId(h.id); setNewMode(false); }}
          >
            <Text style={[styles.chipText, !newMode && habitId === h.id && { color: '#fff' }]}>
              {h.emoji} {h.title}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, newMode && styles.chipActive]}
          onPress={() => { setNewMode(true); setHabitId(null); }}
        >
          <Text style={[styles.chipText, newMode && { color: '#fff' }]}>＋ New</Text>
        </TouchableOpacity>
      </ScrollView>

      {newMode && (
        <View style={styles.newHabitBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                onPress={() => setNewEmoji(e)}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={styles.formInput}
            placeholder="Habit name"
            placeholderTextColor={COLORS.textMuted}
            value={newHabitTitle}
            onChangeText={setNewHabitTitle}
            maxLength={40}
          />
        </View>
      )}

      <Text style={styles.formLabel}>Name</Text>
      <TextInput
        style={styles.formInput}
        placeholder={`e.g. ${(state.habits.find(h => h.id === habitId)?.title ?? newHabitTitle) || 'Habit'} Challenge`}
        placeholderTextColor={COLORS.textMuted}
        value={formTitle}
        onChangeText={setFormTitle}
        maxLength={50}
      />

      <Text style={styles.formLabel}>Duration</Text>
      <View style={styles.presetRow}>
        {[7, 20, 30].map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.presetBtn, days === d && styles.presetBtnActive]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.presetBtnText, days === d && { color: '#fff' }]}>{d}d</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => setDays(d => Math.max(1, d - 1))}>
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepVal}>{days} days</Text>
        <TouchableOpacity style={styles.stepBtn} onPress={() => setDays(d => Math.min(365, d + 1))}>
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn} onPress={create}>
          <Text style={styles.createBtnText}>Create 🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const { state, dispatch, justCompletedChallenge, clearJustCompleted } = useApp();
  const router = useRouter();
  const [confetti, setConfetti] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { habits, logs, challenges } = state;
  const activeChallenges = challenges.filter(c => !c.completed);

  const doneCount = habits.filter(h => isHabitDone(logs, h)).length;
  const progress = habits.length > 0 ? doneCount / habits.length : 0;
  const allDone = habits.length > 0 && doneCount === habits.length;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      damping: 18,
      stiffness: 120,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (allDone) {
      setConfetti(true);
      feedbackComplete();
      const t = setTimeout(() => setConfetti(false), 900);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  useEffect(() => {
    if (justCompletedChallenge) {
      router.push({
        pathname: '/challenge-complete',
        params: { challengeId: justCompletedChallenge.id },
      });
      clearJustCompleted();
    }
  }, [justCompletedChallenge]);

  const handleIncrement = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)!;
    const wasNotDone = !isHabitDone(logs, habit);
    dispatch({ type: 'INCREMENT_HABIT', payload: habitId });
    if (wasNotDone) {
      feedbackMedium();
      playChime();
    } else {
      feedbackLight();
    }
  };

  const handleDecrement = (habitId: string) => {
    feedbackLight();
    dispatch({ type: 'DECREMENT_HABIT', payload: habitId });
  };

  const handleDelete = (habitId: string) => {
    dispatch({ type: 'DELETE_HABIT', payload: habitId });
  };

  const handleReminderChange = (habitId: string, enabled: boolean, time: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const updated = { ...habit, notifyEnabled: enabled, notifyTime: time };
    dispatch({ type: 'UPDATE_HABIT', payload: updated });
    rescheduleAll(habits.map(h => h.id === habitId ? updated : h));
  };

  const handleDeleteChallenge = (id: string, title: string) => {
    Alert.alert(title, 'Delete this challenge?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_CHALLENGE', payload: id }) },
    ]);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting(state.userName)}</Text>
          <Text style={styles.date}>{TODAY_LABEL}</Text>
        </View>

        {/* Progress card — compact */}
        <LinearGradient
          colors={['#7C5CFF', '#5B3EE8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Today's progress</Text>
            <Text style={styles.progressCount}>{doneCount}/{habits.length}</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: progressWidth as any }]} />
          </View>
          <Text style={styles.progressSub}>
            {habits.length === 0
              ? 'Add your first habit below ↓'
              : allDone
              ? '🎉 All done! You crushed it!'
              : `${habits.length - doneCount} left`}
          </Text>
        </LinearGradient>

        {/* Habits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Habits</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-habit')}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/add-habit')}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>Create your first habit</Text>
            <Text style={styles.emptySub}>Tap to get started</Text>
          </TouchableOpacity>
        ) : (
          habits.map(habit => (
            <HabitRow
              key={habit.id}
              habit={habit}
              progress={getHabitProgress(logs, habit)}
              streak={getStreak(logs, habit)}
              onIncrement={() => handleIncrement(habit.id)}
              onDecrement={() => handleDecrement(habit.id)}
              onDelete={() => handleDelete(habit.id)}
              onReminderChange={(enabled, time) => handleReminderChange(habit.id, enabled, time)}
            />
          ))
        )}

        {/* Challenges */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.md }]}>
          <Text style={styles.sectionTitle}>Challenges</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowChallengeForm(v => !v)}
          >
            <Text style={styles.addBtnText}>{showChallengeForm ? '✕ Close' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {activeChallenges.length === 0 && !showChallengeForm && (
          <TouchableOpacity style={styles.emptyCard} onPress={() => setShowChallengeForm(true)}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No active challenges</Text>
            <Text style={styles.emptySub}>Tap to set a goal</Text>
          </TouchableOpacity>
        )}

        {activeChallenges.map(challenge => {
          const habit = habits.find(h => h.id === challenge.habitId);
          const daysLeft = challenge.durationDays - challenge.completedDates.length;
          const pct = challenge.completedDates.length / challenge.durationDays;
          return (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onLongPress={() => handleDeleteChallenge(challenge.id, challenge.title)}
              activeOpacity={0.85}
              delayLongPress={500}
            >
              <CircleProgress
                pct={pct}
                done={challenge.completedDates.length}
                total={challenge.durationDays}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeSub}>
                  {habit ? `${habit.emoji} ${habit.title}  ·  ` : ''}
                  {daysLeft > 0 ? `${daysLeft} days to go` : 'Complete!'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {showChallengeForm && (
          <ChallengeForm onClose={() => setShowChallengeForm(false)} />
        )}

      </ScrollView>

      <Confetti visible={confetti} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingTop: SPACING.lg, paddingBottom: 120 },

  header: { marginBottom: SPACING.md },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  // Compact progress card
  card: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginBottom: SPACING.md,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  progressCount: { color: '#fff', fontSize: 20, fontWeight: '800' },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  addBtn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  emptyEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}33`,
    gap: SPACING.sm,
  },
  challengeIcon: { fontSize: 22 },
  challengeTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  challengeSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  // Challenge form
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  newHabitBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  emojiBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  presetBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  stepVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 70, textAlign: 'center' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: SPACING.sm },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  createBtn: {
    flex: 2,
    padding: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

});
