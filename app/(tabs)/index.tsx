import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context';
import { useAuth } from '../../src/auth-context';
import { useRequireAuth } from '../../src/useRequireAuth';
import { isHabitDone, getHabitProgress, getStreak, getWeekProgress, today } from '../../src/store';
import { feedbackMedium, feedbackComplete, feedbackLight } from '../../src/feedback';
import { playChime } from '../../src/sound';
import { rescheduleAll } from '../../src/notifications';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/theme';
import { HabitRow } from '../../components/HabitRow';
import { Confetti } from '../../components/Confetti';
import { Challenge, Habit, HabitType } from '../../src/types';


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

const PRESET_EMOJIS = ['💪', '🏃', '🧘', '📚', '📵'];

function ChallengeForm({ onClose }: { onClose: () => void }) {
  const { dispatch } = useApp();
  const [selectedPreset, setSelectedPreset] = useState('💪');
  const [customEmoji, setCustomEmoji] = useState('');
  const [customFocused, setCustomFocused] = useState(false);
  const emoji = customEmoji || selectedPreset;

  const [habitTitle, setHabitTitle] = useState('');
  const [daysText, setDaysText] = useState('30');
  const [isWeekly, setIsWeekly] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [startDate, setStartDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const days = Math.max(1, parseInt(daysText) || 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const create = () => {
    if (!habitTitle.trim()) {
      Alert.alert('Name required', 'Enter a name for the habit.');
      return;
    }
    feedbackMedium();

    const habitType: HabitType = isWeekly ? 'weekly' : 'daily';
    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      title: habitTitle.trim(),
      emoji,
      type: habitType,
      targetVolume: isWeekly ? daysPerWeek : 1,
      color: COLORS.primary,
      createdAt: new Date().toISOString(),
      notifyEnabled: false,
      notifyTime: '09:00',
    };
    dispatch({ type: 'ADD_HABIT', payload: newHabit });

    // Pre-fill completed dates from start date up to (not including) today
    const completedDates: string[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    while (cursor < today) {
      completedDates.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    dispatch({
      type: 'ADD_CHALLENGE',
      payload: {
        id: `ch_${Date.now()}`,
        title: `${habitTitle.trim()} Challenge`,
        habitId: newHabit.id,
        durationDays: days,
        startDate: startDate.toISOString().split('T')[0],
        completedDates,
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

      {/* Emoji */}
      <Text style={styles.formLabel}>Icon</Text>
      <View style={styles.emojiRow}>
        {PRESET_EMOJIS.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiPresetBtn, !customEmoji && selectedPreset === e && styles.emojiBtnActive]}
            onPress={() => { setSelectedPreset(e); setCustomEmoji(''); }}
          >
            <Text style={styles.emojiPresetText}>{e}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={[styles.emojiCustomBtn, (!!customEmoji || customFocused) && styles.emojiCustomBtnActive]}
          value={customEmoji}
          onChangeText={v => { setCustomEmoji(v.trim()); }}
          placeholder=""
          maxLength={6}
          onFocus={() => setCustomFocused(true)}
          onBlur={() => setCustomFocused(false)}
        />
      </View>

      {/* Name */}
      <Text style={styles.formLabel}>Habit name</Text>
      <TextInput
        style={styles.formInput}
        placeholder="e.g. Morning run"
        placeholderTextColor={COLORS.textMuted}
        value={habitTitle}
        onChangeText={setHabitTitle}
        maxLength={40}
      />

      {/* Frequency toggle */}
      <Text style={styles.formLabel}>Frequency</Text>
      <View style={styles.freqRow}>
        <TouchableOpacity
          style={[styles.freqBtn, !isWeekly && styles.freqBtnActive]}
          onPress={() => setIsWeekly(false)}
        >
          <Text style={[styles.freqBtnText, !isWeekly && styles.freqBtnTextActive]}>Every day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.freqBtn, isWeekly && styles.freqBtnActive]}
          onPress={() => setIsWeekly(true)}
        >
          <Text style={[styles.freqBtnText, isWeekly && styles.freqBtnTextActive]}>X / week</Text>
        </TouchableOpacity>
      </View>
      {isWeekly && (
        <View style={styles.weeklyRow}>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setDaysPerWeek(d => Math.max(1, d - 1))}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepVal}>{daysPerWeek} days / week</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={() => setDaysPerWeek(d => Math.min(6, d + 1))}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Duration */}
      <Text style={styles.formLabel}>Duration (days)</Text>
      <TextInput
        style={styles.formInput}
        value={daysText}
        onChangeText={v => setDaysText(v.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="30"
        placeholderTextColor={COLORS.textMuted}
      />

      {/* Start date */}
      <Text style={styles.formLabel}>Start date</Text>
      {Platform.OS === 'web' ? (
        <TextInput
          style={styles.formInput}
          value={startDate.toISOString().split('T')[0]}
          onChangeText={v => { const d = new Date(v); if (!isNaN(d.getTime())) setStartDate(d); }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(v => !v)}>
            <Text style={styles.dateBtnText}>📅  {formatDate(startDate)}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(_, date) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (date) setStartDate(date);
              }}
              style={{ marginTop: 8 }}
            />
          )}
        </>
      )}

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

const AVATAR_KEY = '@habittracker_avatar';

export default function TodayScreen() {
  useRequireAuth();
  const { state, dispatch, justCompletedChallenge, clearJustCompleted } = useApp();
  const { session, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then(v => { if (v) setAvatarUri(v); });
  }, []);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
    }
  };
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

  const handleChallengeMenu = (id: string, title: string) => {
    Alert.alert(title, '', [
      { text: 'Edit Challenge', onPress: () => router.push({ pathname: '/edit-challenge', params: { challengeId: id } }) },
      { text: 'Delete Challenge', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_CHALLENGE', payload: id }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting(state.userName)}</Text>
            <Text style={styles.date}>{TODAY_LABEL}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => setProfileOpen(true)}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {(state.userName || session?.user?.email || '?')[0].toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Progress card — compact */}
        <LinearGradient
          colors={['#7a4add', '#6b38c9']}
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
              weekProgress={getWeekProgress(logs, habit)}
              onIncrement={() => handleIncrement(habit.id)}
              onDecrement={() => handleDecrement(habit.id)}
              onDelete={() => handleDelete(habit.id)}
              onEdit={() => router.push({ pathname: '/edit-habit', params: { habitId: habit.id } })}
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
          const done = challenge.completedDates.length;
          const total = challenge.durationDays;
          const daysLeft = total - done;
          const pct = Math.min(1, done / total);
          return (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onPress={() => handleChallengeMenu(challenge.id, challenge.title)}
              activeOpacity={0.85}
            >
              <Text style={styles.challengeEmoji}>{habit?.emoji ?? '🎯'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeTitle} numberOfLines={1}>{challenge.title}</Text>
                <View style={styles.challengeBar}>
                  <View style={[styles.challengeBarFill, { width: `${pct * 100}%` as any }]} />
                </View>
              </View>
              <Text style={styles.challengeDaysLeft}>
                {daysLeft > 0 ? `${daysLeft}d left` : '🎉'}
              </Text>
            </TouchableOpacity>
          );
        })}

        {showChallengeForm && (
          <ChallengeForm onClose={() => setShowChallengeForm(false)} />
        )}

      </ScrollView>

      <Confetti visible={confetti} />

      <Modal transparent animationType="slide" visible={profileOpen} onRequestClose={() => setProfileOpen(false)}>
        <TouchableOpacity style={styles.profileOverlay} activeOpacity={1} onPress={() => setProfileOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.profileSheet, { paddingBottom: Math.max(insets.bottom + 8, SPACING.lg) }]}>
            {/* Avatar + name/email row */}
            <View style={styles.profileRow}>
              <TouchableOpacity style={styles.profileAvatarWrap} onPress={pickAvatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.profileAvatarImg} />
                ) : (
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {(state.userName || session?.user?.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Text style={styles.cameraIconText}>📷</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                {!!state.userName && <Text style={styles.profileName}>{state.userName}</Text>}
                <Text style={styles.profileEmail}>{session?.user?.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => {
                setProfileOpen(false);
                Alert.alert('Sign out', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: signOut },
                ]);
              }}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingTop: SPACING.xl, paddingBottom: 80 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  date: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: SPACING.sm, overflow: 'hidden',
  },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  profileOverlay: {
    flex: 1, backgroundColor: 'rgba(45,23,94,0.45)', justifyContent: 'flex-end',
  },
  profileSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  profileRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg,
  },
  profileAvatarWrap: { position: 'relative' },
  profileAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarImg: { width: 56, height: 56, borderRadius: 28 },
  profileAvatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cameraIconText: { fontSize: 11 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  profileEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  signOutBtn: {
    width: '100%', padding: 14, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
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
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}22`,
  },
  challengeEmoji: { fontSize: 22 },
  challengeTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  challengeBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  challengeBarFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  challengeDaysLeft: { fontSize: 13, fontWeight: '700', color: COLORS.primary, minWidth: 52, textAlign: 'right' },

  // Challenge form
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm, fontFamily: FONTS.serif },
  formLabel: {
    fontSize: 11, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 6, marginTop: 12,
  },
  emojiRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  emojiPresetBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  emojiBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  emojiPresetText: { fontSize: 20 },
  emojiCustomBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 2,
    borderColor: COLORS.border, textAlign: 'center' as const,
    fontSize: 20, includeFontPadding: false,
  } as any,
  emojiCustomBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  formInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    padding: SPACING.md, fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
  },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  freqBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  freqBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  freqBtnTextActive: { color: '#fff' },
  weeklyRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginTop: SPACING.sm, justifyContent: 'center',
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  stepVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, minWidth: 80, textAlign: 'center' },
  dateBtn: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  dateBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  formActions: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: RADIUS.full,
    backgroundColor: COLORS.background, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  createBtn: {
    flex: 2, padding: 12, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  createBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
