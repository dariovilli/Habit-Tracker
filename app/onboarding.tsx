import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
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
import { useApp } from '../src/context';
import { Habit, HabitType } from '../src/types';
import { COLORS, RADIUS, SPACING } from '../src/theme';
import { feedbackMedium, feedbackSuccess } from '../src/feedback';
import { requestPermission, scheduleDaily } from '../src/notifications';

const EMOJIS = ['💪', '🏃', '🧘', '📚', '✍️', '💧', '🥗', '😴', '🎯', '🧠', '🎨', '🏋️', '📵', '☀️', '🌙', '❤️'];

type Step = 0 | 1 | 2;

export default function OnboardingScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState<Step>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState('');

  const [habitTitle, setHabitTitle] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('💪');
  const [habitType, setHabitType] = useState<HabitType>('daily');
  const [habitVolume, setHabitVolume] = useState(3);

  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDays, setChallengeDays] = useState(3);

  const goToStep = (next: Step) => {
    if (next === 2 && challengeTitle === '') {
      setChallengeTitle(`${habitTitle.trim() || 'Habit'} Challenge`);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const finish = async () => {
    feedbackSuccess();

    const habit: Habit = {
      id: Date.now().toString(),
      title: habitTitle.trim(),
      emoji: habitEmoji,
      type: habitType,
      targetVolume: habitType === 'daily' ? 1 : habitVolume,
      color: COLORS.primary,
      createdAt: new Date().toISOString(),
      notifyEnabled: true,
      notifyTime: '09:00',
    };

    dispatch({ type: 'ADD_HABIT', payload: habit });
    dispatch({ type: 'COMPLETE_ONBOARDING', payload: { userName: name.trim() } });
    dispatch({
      type: 'ADD_CHALLENGE',
      payload: {
        id: `ch_${Date.now()}`,
        title: challengeTitle.trim() || `${habit.title} Challenge`,
        habitId: habit.id,
        durationDays: challengeDays,
        startDate: new Date().toISOString().split('T')[0],
        completedDates: [],
        completed: false,
        completedAt: null,
        celebrated: false,
      },
    });

    const granted = await requestPermission();
    if (granted) {
      await scheduleDaily(habit.title, 9, 0);
    }

    router.replace('/(tabs)');
  };

  const canStep0 = name.trim().length > 0;
  const canStep1 = habitTitle.trim().length > 0;


  return (
    <LinearGradient colors={['#7C5CFF', '#4A2FCC']} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.dots}>
            {([0, 1, 2] as Step[]).map(s => (
              <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
            ))}
          </View>

          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {step === 0 && (
              <View style={styles.stepContainer}>
                <Text style={styles.stepEmoji}>✨</Text>
                <Text style={styles.heading}>Welcome to Antigravity</Text>
                <Text style={styles.sub}>Build habits that stick. What should we call you?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => canStep0 && goToStep(1)}
                />
                <TouchableOpacity
                  style={[styles.btn, !canStep0 && styles.btnDisabled]}
                  onPress={() => { feedbackMedium(); goToStep(1); }}
                  disabled={!canStep0}
                >
                  <Text style={styles.btnText}>Let's go →</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stepContainer}>
                  <Text style={styles.stepEmoji}>🎯</Text>
                  <Text style={styles.heading}>Your first habit</Text>
                  <Text style={styles.sub}>Pick one thing you want to do every day.</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {EMOJIS.map(e => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.emojiBtn, habitEmoji === e && styles.emojiBtnSelected]}
                        onPress={() => setHabitEmoji(e)}
                      >
                        <Text style={{ fontSize: 24 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Morning workout"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={habitTitle}
                    onChangeText={setHabitTitle}
                    maxLength={40}
                    returnKeyType="done"
                  />

                  <View style={styles.typeRow}>
                    {(['daily', 'volume'] as HabitType[]).map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, habitType === t && styles.typeBtnSelected]}
                        onPress={() => setHabitType(t)}
                      >
                        <Text style={[styles.typeBtnText, habitType === t && { color: COLORS.primary }]}>
                          {t === 'daily' ? '✓ Once a day' : '🔢 Volume'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {habitType === 'volume' && (
                    <View style={styles.volumeRow}>
                      <TouchableOpacity onPress={() => setHabitVolume(v => Math.max(2, v - 1))}>
                        <Text style={styles.volBtn}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.volValue}>{habitVolume}x / day</Text>
                      <TouchableOpacity onPress={() => setHabitVolume(v => Math.min(20, v + 1))}>
                        <Text style={styles.volBtn}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.btn, !canStep1 && styles.btnDisabled]}
                    onPress={() => { feedbackMedium(); goToStep(2); }}
                    disabled={!canStep1}
                  >
                    <Text style={styles.btnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {step === 2 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stepContainer}>
                  <Text style={styles.stepEmoji}>🏆</Text>
                  <Text style={styles.heading}>Set your challenge</Text>
                  <Text style={styles.sub}>
                    Name your challenge and decide how many days you'll commit to.
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 21-Day Social Media Detox"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={challengeTitle}
                    onChangeText={setChallengeTitle}
                    maxLength={50}
                    returnKeyType="done"
                  />

                  <Text style={[styles.sub, { marginBottom: 8, marginTop: 4 }]}>Duration</Text>
                  <View style={styles.presetRow}>
                    {[7, 20, 30].map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.presetBtn, challengeDays === d && styles.presetBtnActive]}
                        onPress={() => setChallengeDays(d)}
                      >
                        <Text style={[styles.presetBtnText, challengeDays === d && styles.presetBtnTextActive]}>
                          {d} days
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.volumeRow}>
                    <TouchableOpacity onPress={() => setChallengeDays(d => Math.max(1, d - 1))}>
                      <Text style={styles.volBtn}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.volValue}>{challengeDays} days</Text>
                    <TouchableOpacity onPress={() => setChallengeDays(d => Math.min(99, d + 1))}>
                      <Text style={styles.volBtn}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.btn} onPress={finish}>
                    <Text style={styles.btnText}>Start challenge 🚀</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.skipBtn} onPress={() => {
                    feedbackMedium();
                    const habit: Habit = {
                      id: Date.now().toString(),
                      title: habitTitle.trim(),
                      emoji: habitEmoji,
                      type: habitType,
                      targetVolume: habitType === 'daily' ? 1 : habitVolume,
                      color: COLORS.primary,
                      createdAt: new Date().toISOString(),
                      notifyEnabled: false,
                      notifyTime: '09:00',
                    };
                    dispatch({ type: 'ADD_HABIT', payload: habit });
                    dispatch({ type: 'COMPLETE_ONBOARDING', payload: { userName: name.trim() } });
                    router.replace('/(tabs)');
                  }}>
                    <Text style={styles.skipBtnText}>Skip challenge →</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff', width: 24 },

  content: { flex: 1, padding: SPACING.lg },
  stepContainer: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  stepEmoji: { fontSize: 52, marginBottom: SPACING.md },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10 },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 24, marginBottom: SPACING.lg },

  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: SPACING.md,
  },

  btn: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },

  emojiBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiBtnSelected: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.3)' },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  typeBtnSelected: { backgroundColor: '#fff' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  volBtn: { fontSize: 28, color: '#fff', fontWeight: '700', padding: 8 },
  volValue: { fontSize: 20, fontWeight: '800', color: '#fff', minWidth: 100, textAlign: 'center' },

  presetRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.sm },
  presetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  presetBtnActive: { backgroundColor: '#fff' },
  presetBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  presetBtnTextActive: { color: COLORS.primary },

  skipBtn: { alignItems: 'center', marginTop: SPACING.md, paddingVertical: 8 },
  skipBtnText: { fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
});
